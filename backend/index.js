require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const http = require('http').Server(app);
const svgOptions = { setHeaders: (res, filePath) => { if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml'); } };
app.use(express.static(path.join(__dirname, '..', 'web-client'), svgOptions));

function getLocalIP() {
    const nets = os.networkInterfaces();
    const VIRTUAL = /virtualbox|vmware|vethernet|vbox|hyper.v|loopback|pseudo|bluetooth|vpn|tap|tun/i;
    const candidates = [];
    for (const [name, addrs] of Object.entries(nets)) {
        if (VIRTUAL.test(name)) continue;
        for (const net of addrs) {
            if (net.family === 'IPv4' && !net.internal) {
                candidates.push({ name, address: net.address });
            }
        }
    }
    // Prefer WiFi or Ethernet
    const preferred = candidates.find(c => /wi.fi|wlan|wireless|ethernet|wi-fi/i.test(c.name));
    return (preferred || candidates[0])?.address || 'localhost';
}
app.get('/api/info', (req, res) => {
    res.json({
        publicURL: process.env.PUBLIC_URL || `http://${getLocalIP()}:3000`,
        port: 3000
    });
});
const io = require('socket.io')(http, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const uniqid = require('uniqid');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const GameService = require('./services/game.service');
const BotService = require('./services/bot.service');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/yams_casino';
let usersCol;

function hashPwd(pwd) {
    return crypto.createHash('sha256').update(pwd + 'yams_salt_2026').digest('hex');
}

async function broadcastRanking() {
    const list = await usersCol.find({}, { projection: { password: 0, _id: 0 } }).sort({ score: -1 }).toArray();
    io.emit('ranking.list', list);
}

let games = [];
let queue = [];
let privateRooms = {};
let rankings = {};        // socketId -> { score, wins, losses }
let socketToUser = {};    // socketId -> { username, avatar }
let pendingReconnects = {}; // username -> { gameIndex, playerKey, opponentSocket, timeout, countdownInterval, mode }
let pendingRematches  = {}; // requesterSocketId -> { requesterSocket, opponentSocket, mode, botDifficulty }
let opponentMap       = {}; // socketId -> opponentSocket (kept after game ends for gameover interactions)

function getRanking(socketId) {
    if (!rankings[socketId]) rankings[socketId] = { score: 0, wins: 0, losses: 0 };
    return rankings[socketId];
}

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// ---- Emitters ----
const updateClientsViewTimers = (game) => {
    game.player1Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:1', game.gameState));
    game.player2Socket.emit('game.timer', GameService.send.forPlayer.gameTimer('player:2', game.gameState));
};
const updateClientsViewDecks = (game) => {
    setTimeout(() => {
        game.player1Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:1', game.gameState));
        game.player2Socket.emit('game.deck.view-state', GameService.send.forPlayer.deckViewState('player:2', game.gameState));
    }, 200);
};
const updateClientsViewChoices = (game) => {
    setTimeout(() => {
        game.player1Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:1', game.gameState));
        game.player2Socket.emit('game.choices.view-state', GameService.send.forPlayer.choicesViewState('player:2', game.gameState));
    }, 200);
};
const updateClientsViewGrid = (game) => {
    setTimeout(() => {
        game.player1Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:1', game.gameState));
        game.player2Socket.emit('game.grid.view-state', GameService.send.forPlayer.gridViewState('player:2', game.gameState));
    }, 200);
};

// ---- Score deltas based on win type and rank ----
function getScoreDeltas(winType, loserScore) {
    if (winType === 'line5') return { winGain: 1000, lossAmount: 500 };
    const lossAmount = loserScore < 4000 ? 200 : loserScore < 25000 ? 350 : 450; // Iron/Bronze/Silver = -200, Gold/Plat = -350, Diamond+ = -450
    return { winGain: 550, lossAmount };
}

// ---- End game ----
const endGame = async (gameIndex, winnerKey, winType = 'score') => {
    const game = games[gameIndex];
    if (!game || game.ended) return;
    game.ended = true;
    if (game.interval) clearInterval(game.interval);

    const p1IsWinner = winnerKey === 'player:1';
    const winnerSocket = p1IsWinner ? game.player1Socket : game.player2Socket;
    const loserSocket  = p1IsWinner ? game.player2Socket : game.player1Socket;

    // Ranking only applies to: online games OR hard bot games
    const rankingEnabled = !game.isBot || game.botDifficulty === 'hard';

    const loserCurrentScore = getRanking(loserSocket.id).score;
    const { winGain, lossAmount } = getScoreDeltas(winType, loserCurrentScore);

    if (rankingEnabled && (!game.isBot || winnerSocket.id !== game.botSocketId)) {
        getRanking(winnerSocket.id).score += winGain;
        getRanking(winnerSocket.id).wins++;
    }
    if (rankingEnabled && (!game.isBot || loserSocket.id !== game.botSocketId)) {
        getRanking(loserSocket.id).score = Math.max(0, getRanking(loserSocket.id).score - lossAmount);
        getRanking(loserSocket.id).losses++;
    }

    // Persist to MongoDB
    const winUser  = socketToUser[winnerSocket.id]?.username;
    const loseUser = socketToUser[loserSocket.id]?.username;
    if (winUser)  await usersCol.updateOne({ username: winUser },  { $set: { score: getRanking(winnerSocket.id).score, wins: getRanking(winnerSocket.id).wins } });
    if (loseUser) await usersCol.updateOne({ username: loseUser }, { $set: { score: getRanking(loserSocket.id).score, losses: getRanking(loserSocket.id).losses } });

    await broadcastRanking();

    if (!game.isBot || game.player1Socket.id !== game.botSocketId)
        game.player1Socket.emit('ranking.update', getRanking(game.player1Socket.id));
    if (!game.isBot || game.player2Socket.id !== game.botSocketId)
        game.player2Socket.emit('ranking.update', getRanking(game.player2Socket.id));

    // For surrender/disconnect endings, grid has no natural winner — emit it manually
    if (winType === 'surrender') {
        const scores = GameService.grid.computeScores(game.gameState.grid);
        const sendGridResult = (socket, pKey) => {
            const oppKey = pKey === 'player:1' ? 'player:2' : 'player:1';
            socket.emit('game.grid.view-state', {
                displayGrid: true,
                canSelectCells: false,
                grid: game.gameState.grid,
                playerScore:   scores[pKey].score,
                opponentScore: scores[oppKey].score,
                winner: winnerKey
            });
        };
        if (!game.isBot || game.player1Socket.id !== game.botSocketId) sendGridResult(game.player1Socket, 'player:1');
        if (!game.isBot || game.player2Socket.id !== game.botSocketId) sendGridResult(game.player2Socket, 'player:2');
    }
};

// ---- Check winner ----
const checkWinner = async (gameIndex) => {
    const game = games[gameIndex];
    const scores = GameService.grid.computeScores(game.gameState.grid);
    const winner = scores['player:1'].winner ? 'player:1' : (scores['player:2'].winner ? 'player:2' : null);
    if (winner) { await endGame(gameIndex, winner, 'line5'); return; }
    let placed = 0;
    game.gameState.grid.forEach(row => row.forEach(cell => { if (cell.owner) placed++; }));
    if (placed >= 24) {
        const w = scores['player:1'].score >= scores['player:2'].score ? 'player:1' : 'player:2';
        await endGame(gameIndex, w, 'score');
    }
};

// ---- Bot turn ----
const executeBotTurn = (gameIndex) => {
    const game = games[gameIndex];
    if (!game || game.ended) return;
    const difficulty = game.botDifficulty;
    const botKey  = game.botKey;
    const humanKey = botKey === 'player:1' ? 'player:2' : 'player:1';
    const thinkDelay     = difficulty === 'hard' ? 1500 : difficulty === 'medium' ? 2000 : 2500;
    const afterRollDelay = difficulty === 'hard' ? 4000 : difficulty === 'medium' ? 4500 : 5000;
    const maxRolls = game.gameState.deck.rollsMaximum;

    const doRoll = () => {
        if (game.ended) return;
        const deck = game.gameState.deck;
        if (deck.rollsCounter > maxRolls) { setTimeout(doChoose, thinkDelay); return; }
        game.gameState.deck.dices = GameService.dices.roll(deck.dices);
        game.gameState.deck.rollsCounter++;
        const dices = game.gameState.deck.dices;
        const isSec = game.gameState.deck.rollsCounter === 2;
        game.gameState.choices.availableChoices = GameService.choices.findCombinations(dices, false, isSec);
        const isLast = game.gameState.deck.rollsCounter > maxRolls;
        const toKeep = BotService.decideLock(dices, difficulty);
        game.gameState.deck.dices = dices.map(d => ({ ...d, locked: toKeep.includes(d.id) }));
        updateClientsViewDecks(game);
        updateClientsViewChoices(game);
        setTimeout(isLast ? doChoose : doRoll, afterRollDelay);
    };

    const doEndTurn = () => {
        if (game.ended) return;
        game.gameState.timer = GameService.timer.getEndTurnDuration();
        game.gameState.deck = GameService.init.deck();
        game.gameState.deck.rollsCounter = game.gameState.deck.rollsMaximum + 1;
        game.gameState.choices = GameService.init.choices();
        updateClientsViewTimers(game);
        updateClientsViewDecks(game);
        updateClientsViewChoices(game);
    };

    const doChoose = () => {
        if (game.ended) return;
        const { availableChoices } = game.gameState.choices;
        const choiceId = BotService.decideChoice(availableChoices, game.gameState.grid, botKey, humanKey, difficulty);
        if (!choiceId) { doEndTurn(); return; }
        game.gameState.choices.idSelectedChoice = choiceId;
        game.gameState.deck.dices = GameService.choices.lockDicesForChoice(game.gameState.deck.dices, choiceId);
        game.gameState.grid = GameService.grid.resetcanBeCheckedCells(game.gameState.grid);
        game.gameState.grid = GameService.grid.updateGridAfterSelectingChoice(choiceId, game.gameState.grid);
        updateClientsViewChoices(game);
        updateClientsViewDecks(game);
        updateClientsViewGrid(game);
        setTimeout(doPlace, thinkDelay);
    };

    const doPlace = async () => {
        if (game.ended) return;
        const cell = BotService.decideCell(game.gameState.grid, game.gameState.choices.idSelectedChoice, botKey, humanKey, difficulty);
        if (!cell) { doEndTurn(); return; }
        game.gameState.grid = GameService.grid.resetcanBeCheckedCells(game.gameState.grid);
        game.gameState.grid = GameService.grid.selectCell(cell.id, cell.row, cell.col, botKey, game.gameState.grid);
        game.gameState.timer = GameService.timer.getEndTurnDuration();
        game.gameState.deck = GameService.init.deck();
        game.gameState.deck.rollsCounter = game.gameState.deck.rollsMaximum + 1;
        game.gameState.choices = GameService.init.choices();
        updateClientsViewTimers(game);
        updateClientsViewDecks(game);
        updateClientsViewChoices(game);
        updateClientsViewGrid(game);
        await checkWinner(gameIndex);
    };

    setTimeout(doRoll, thinkDelay);
};

// ---- Create game ----
const createGame = (player1Socket, player2Socket, isBot = false, botKey = null, botDifficulty = 'medium', mode = null) => {
    const newGame = GameService.init.gameState();
    newGame.idGame = uniqid();
    newGame.player1Socket = player1Socket;
    newGame.player2Socket = player2Socket;
    newGame.isBot = isBot;
    newGame.botKey = botKey;
    newGame.botDifficulty = botDifficulty;
    newGame.botSocketId = isBot ? (botKey === 'player:1' ? player1Socket.id : player2Socket.id) : null;
    newGame.ended = false;
    newGame.isPrivate = false;
    newGame.mode = mode || (isBot ? 'bot' : 'online');

    games.push(newGame);
    const gameIndex = GameService.utils.findGameIndexById(games, newGame.idGame);

    const botInfo = { username: 'DiceKing', avatar: '/logo/ai.png' };
    const p1info = socketToUser[player1Socket.id] || (isBot && botKey === 'player:1' ? botInfo : { username: 'Joueur 1', avatar: '🎲' });
    const p2info = socketToUser[player2Socket.id] || (isBot && botKey === 'player:2' ? botInfo : { username: 'Joueur 2', avatar: '🎲' });

    const gameExtra = { mode: newGame.mode, botDifficulty: newGame.botDifficulty || null, idGame: newGame.idGame };
    // Keep socket ID mapping for post-game interactions (store IDs, not objects)
    if (!newGame.isBot) {
        opponentMap[player1Socket.id] = player2Socket.id;
        opponentMap[player2Socket.id] = player1Socket.id;
    }
    player1Socket.emit('game.start', {
        ...GameService.send.forPlayer.viewGameState('player:1', games[gameIndex]),
        playerName: p1info.username, playerAvatar: p1info.avatar,
        opponentName: p2info.username, opponentAvatar: p2info.avatar,
        ...gameExtra
    });
    player2Socket.emit('game.start', {
        ...GameService.send.forPlayer.viewGameState('player:2', games[gameIndex]),
        playerName: p2info.username, playerAvatar: p2info.avatar,
        opponentName: p1info.username, opponentAvatar: p1info.avatar,
        ...gameExtra
    });

    updateClientsViewTimers(games[gameIndex]);
    updateClientsViewDecks(games[gameIndex]);
    updateClientsViewGrid(games[gameIndex]);

    const interval = setInterval(() => {
        if (games[gameIndex].ended) { clearInterval(interval); return; }
        games[gameIndex].gameState.timer--;
        updateClientsViewTimers(games[gameIndex]);

        if (games[gameIndex].gameState.timer === 0) {
            games[gameIndex].gameState.currentTurn = games[gameIndex].gameState.currentTurn === 'player:1' ? 'player:2' : 'player:1';
            games[gameIndex].gameState.timer = GameService.timer.getTurnDuration();
            games[gameIndex].gameState.deck = GameService.init.deck();
            games[gameIndex].gameState.choices = GameService.init.choices();
            games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
            updateClientsViewTimers(games[gameIndex]);
            updateClientsViewDecks(games[gameIndex]);
            updateClientsViewChoices(games[gameIndex]);
            updateClientsViewGrid(games[gameIndex]);
            if (isBot && games[gameIndex].gameState.currentTurn === botKey) executeBotTurn(gameIndex);
        }
    }, 1000);

    games[gameIndex].interval = interval;
    if (isBot && newGame.gameState.currentTurn === botKey) setTimeout(() => executeBotTurn(gameIndex), 1200);
    return games[gameIndex];
};

// ---- Queue ----
const newPlayerInQueue = (socket) => {
    queue.push(socket);
    if (queue.length >= 2) {
        const p1 = queue.shift(), p2 = queue.shift();
        createGame(p1, p2);
    } else {
        socket.emit('queue.added', GameService.send.forPlayer.viewQueueState());
    }
};

// ---- Sockets ----
io.on('connection', socket => {
    console.log(`[${socket.id}] connected`);

    socket.on('user.register', async ({ username, password, avatar, firstname, lastname, email, dob }) => {
        const name = (username || '').trim();
        if (!name || name.length < 2) { socket.emit('user.error', { message: 'Pseudo trop court (2 min)' }); return; }
        if (!password || password.length < 8) { socket.emit('user.error', { message: 'Mot de passe trop court (8 min)' }); return; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { socket.emit('user.error', { message: 'Email invalide' }); return; }
        const existingUser  = await usersCol.findOne({ username: name });
        if (existingUser) { socket.emit('user.error', { message: 'Pseudo déjà utilisé' }); return; }
        const existingEmail = await usersCol.findOne({ email: email.toLowerCase() });
        if (existingEmail) { socket.emit('user.error', { message: 'Email déjà utilisé' }); return; }
        const av = avatar || '🎲';
        const user = {
            username: name,
            password: hashPwd(password),
            firstname: (firstname || '').trim(),
            lastname:  (lastname  || '').trim(),
            email:     email.toLowerCase(),
            dob:       dob || null,
            score: 0, wins: 0, losses: 0, avatar: av
        };
        await usersCol.insertOne(user);
        socketToUser[socket.id] = { username: name, avatar: av };
        rankings[socket.id] = { score: 0, wins: 0, losses: 0 };
        socket.emit('user.logged', { username: name, score: 0, wins: 0, losses: 0, avatar: av });
        await broadcastRanking();
    });

    socket.on('user.login', async ({ username, password }) => {
        const name = username.trim();
        const user = await usersCol.findOne({ username: name });
        if (!user) { socket.emit('user.error', { message: 'Utilisateur introuvable' }); return; }
        if (user.password !== hashPwd(password)) { socket.emit('user.error', { message: 'Mot de passe incorrect' }); return; }
        const av = user.avatar || '🎲';
        socketToUser[socket.id] = { username: name, avatar: av };
        rankings[socket.id] = { score: user.score, wins: user.wins, losses: user.losses };
        const hasPending = !!pendingReconnects[name];
        socket.emit('user.logged', { username: name, score: user.score, wins: user.wins, losses: user.losses, avatar: av, pendingReconnect: hasPending, pendingMode: hasPending ? pendingReconnects[name].mode : null });
        await broadcastRanking();
    });

    socket.on('user.ranking.get', async () => {
        const list = await usersCol.find({}, { projection: { password: 0, _id: 0 } }).sort({ score: -1 }).toArray();
        socket.emit('ranking.list', list);
    });

    socket.on('queue.join', () => newPlayerInQueue(socket));

    socket.on('queue.leave', () => {
        const i = queue.indexOf(socket);
        if (i !== -1) queue.splice(i, 1);
        socket.emit('queue.left');
    });

    socket.on('queue.join.bot', ({ difficulty }) => {
        const botSocket = { id: 'bot_' + uniqid(), emit: () => {}, on: () => {} };
        const botGoesFirst = Math.random() < 0.5;
        const [p1, p2, botKey] = botGoesFirst
            ? [botSocket, socket, 'player:1']
            : [socket, botSocket, 'player:2'];
        createGame(p1, p2, true, botKey, difficulty || 'medium');
    });

    socket.on('room.create', () => {
        let code = generateCode();
        while (privateRooms[code]) code = generateCode();
        privateRooms[code] = { socket };
        socket.emit('room.created', { code });
    });

    socket.on('room.join', ({ code }) => {
        const room = privateRooms[code.toUpperCase()];
        if (!room) { socket.emit('room.error', { message: 'Code invalide' }); return; }
        if (room.socket.id === socket.id) { socket.emit('room.error', { message: 'Vous êtes l\'hôte' }); return; }
        const host = room.socket;
        delete privateRooms[code.toUpperCase()];
        socket.emit('room.joined', {});
        createGame(host, socket, false, null, 'medium', 'friend');
    });

    socket.on('game.dices.roll', () => {
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        const deck = games[gameIndex].gameState.deck;
        games[gameIndex].gameState.deck.dices = GameService.dices.roll(deck.dices);
        games[gameIndex].gameState.deck.rollsCounter++;
        const dices = games[gameIndex].gameState.deck.dices;
        const isSec   = games[gameIndex].gameState.deck.rollsCounter === 2;
        const isDefi  = games[gameIndex].gameState.choices.isDefi;
        games[gameIndex].gameState.choices.availableChoices = GameService.choices.findCombinations(dices, isDefi, isSec);
        if (games[gameIndex].gameState.deck.rollsCounter > games[gameIndex].gameState.deck.rollsMaximum) {
            games[gameIndex].gameState.deck.dices = GameService.dices.lockEveryDice(dices);
            if (games[gameIndex].gameState.choices.availableChoices.length === 0) {
                games[gameIndex].gameState.timer = GameService.timer.getEndTurnDuration();
                updateClientsViewTimers(games[gameIndex]);
            }
        }
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
    });

    socket.on('game.defi.declare', () => {
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        const game = games[gameIndex];
        const playerKey = game.player1Socket.id === socket.id ? 'player:1' : 'player:2';
        if (game.gameState.currentTurn !== playerKey) return;
        if (game.gameState.deck.rollsCounter !== 2) return;
        if (game.gameState.choices.isDefi) return;
        game.gameState.choices.isDefi = true;
        updateClientsViewChoices(game);
    });

    socket.on('game.dices.lock', (idDice) => {
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        const idx = GameService.utils.findDiceIndexByDiceId(games[gameIndex].gameState.deck.dices, idDice);
        games[gameIndex].gameState.deck.dices[idx].locked = !games[gameIndex].gameState.deck.dices[idx].locked;
        updateClientsViewDecks(games[gameIndex]);
    });

    socket.on('game.choices.selected', (data) => {
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        games[gameIndex].gameState.choices.idSelectedChoice = data.choiceId;
        games[gameIndex].gameState.deck.dices = GameService.choices.lockDicesForChoice(games[gameIndex].gameState.deck.dices, data.choiceId);
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        games[gameIndex].gameState.grid = GameService.grid.updateGridAfterSelectingChoice(data.choiceId, games[gameIndex].gameState.grid);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);
    });

    socket.on('game.grid.selected', async (data) => {
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        games[gameIndex].gameState.grid = GameService.grid.resetcanBeCheckedCells(games[gameIndex].gameState.grid);
        games[gameIndex].gameState.grid = GameService.grid.selectCell(data.cellId, data.rowIndex, data.cellIndex, games[gameIndex].gameState.currentTurn, games[gameIndex].gameState.grid);
        games[gameIndex].gameState.timer = GameService.timer.getEndTurnDuration();
        games[gameIndex].gameState.deck = GameService.init.deck();
        games[gameIndex].gameState.deck.rollsCounter = games[gameIndex].gameState.deck.rollsMaximum + 1;
        games[gameIndex].gameState.choices = GameService.init.choices();
        updateClientsViewTimers(games[gameIndex]);
        updateClientsViewDecks(games[gameIndex]);
        updateClientsViewChoices(games[gameIndex]);
        updateClientsViewGrid(games[gameIndex]);
        await checkWinner(gameIndex);
    });

    socket.on('game.rematch.request', ({ mode, botDifficulty, gameId }) => {
        if (mode === 'bot') {
            const botSocket = { id: 'bot_' + uniqid(), emit: () => {}, on: () => {} };
            const botGoesFirst = Math.random() < 0.5;
            const [p1, p2, botKey] = botGoesFirst
                ? [botSocket, socket, 'player:1']
                : [socket, botSocket, 'player:2'];
            createGame(p1, p2, true, botKey, botDifficulty || 'medium');
            return;
        }

        if (mode === 'online') {
            newPlayerInQueue(socket);
            return;
        }

        // Friend rematch: look up by gameId (works even if game.ended)
        const gameIndex = gameId
            ? GameService.utils.findGameIndexById(games, gameId)
            : GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        const game = games[gameIndex];
        const opponentSocket = game.player1Socket.id === socket.id ? game.player2Socket : game.player1Socket;

        // Check if opponent already requested
        const existingKey = Object.keys(pendingRematches).find(k => {
            const r = pendingRematches[k];
            return r.opponentSocket.id === socket.id || r.requesterSocket.id === socket.id;
        });

        if (existingKey) {
            // Both requested — start the game
            const { requesterSocket } = pendingRematches[existingKey];
            delete pendingRematches[existingKey];
            socket.emit('game.rematch.accepted');
            requesterSocket.emit('game.rematch.accepted');
            setTimeout(() => createGame(requesterSocket, socket, false, null, 'medium', 'friend'), 300);
        } else {
            // First to request — store and notify opponent
            pendingRematches[socket.id] = { requesterSocket: socket, opponentSocket, mode, botDifficulty };
            opponentSocket.emit('game.rematch.requested');
            // Auto-cancel after 30s if opponent doesn't respond
            setTimeout(() => {
                if (pendingRematches[socket.id]) {
                    delete pendingRematches[socket.id];
                    socket.emit('game.rematch.cancelled');
                }
            }, 30000);
        }
    });

    socket.on('game.gameover.leave', () => {
        const opponentId = opponentMap[socket.id];
        const opponentSocket = opponentId ? io.sockets.sockets.get(opponentId) : null;
        console.log(`[gameover.leave] ${socket.id} -> opponent ${opponentId} -> found: ${!!opponentSocket}`);
        if (opponentSocket) {
            opponentSocket.emit('game.opponent.left.gameover');
            delete opponentMap[socket.id];
            delete opponentMap[opponentId];
        }
        // Cancel any pending rematch
        const key = Object.keys(pendingRematches).find(k =>
            pendingRematches[k].requesterSocket.id === socket.id || pendingRematches[k].opponentSocket.id === socket.id
        );
        if (key) delete pendingRematches[key];
    });

    socket.on('game.rematch.decline', () => {
        // Find and cancel any pending rematch where this socket is the opponent
        const key = Object.keys(pendingRematches).find(k => pendingRematches[k].opponentSocket.id === socket.id);
        if (key) {
            pendingRematches[key].requesterSocket.emit('game.rematch.cancelled');
            delete pendingRematches[key];
        }
    });

    socket.on('game.surrender', async () => {
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        if (gameIndex === -1) return;
        const game = games[gameIndex];
        if (game.ended) return;
        const surrenderKey = game.player1Socket.id === socket.id ? 'player:1' : 'player:2';
        const winnerKey    = surrenderKey === 'player:1' ? 'player:2' : 'player:1';
        const winnerSocket = winnerKey === 'player:1' ? game.player1Socket : game.player2Socket;
        const loserSocket  = surrenderKey === 'player:1' ? game.player1Socket : game.player2Socket;
        // Notify both players
        loserSocket.emit('game.surrendered', { by: 'you' });
        if (!game.isBot) winnerSocket.emit('game.surrendered', { by: 'opponent' });
        await endGame(gameIndex, winnerKey, 'surrender');
    });

    socket.on('game.reconnect', async () => {
        const username = socketToUser[socket.id]?.username;
        if (!username || !pendingReconnects[username]) return;
        const rec = pendingReconnects[username];
        clearTimeout(rec.timeout);
        clearInterval(rec.countdownInterval);
        delete pendingReconnects[username];

        const game = games[rec.gameIndex];
        if (!game || game.ended) { socket.emit('game.reconnect.too_late'); return; }

        // Swap socket reference
        if (rec.playerKey === 'player:1') game.player1Socket = socket;
        else game.player2Socket = socket;

        // Notify opponent reconnect happened
        rec.opponentSocket.emit('game.opponent.reconnected');

        // Re-send full game state to reconnected player
        const botInfo = { username: 'DiceKing', avatar: '/logo/ai.png' };
        const p1info  = socketToUser[game.player1Socket.id] || (game.isBot && game.botKey === 'player:1' ? botInfo : { username: 'Joueur 1', avatar: '🎲' });
        const p2info  = socketToUser[game.player2Socket.id] || (game.isBot && game.botKey === 'player:2' ? botInfo : { username: 'Joueur 2', avatar: '🎲' });
        const myInfo  = rec.playerKey === 'player:1' ? p1info : p2info;
        const oppInfo = rec.playerKey === 'player:1' ? p2info : p1info;

        socket.emit('game.reconnected', {
            ...GameService.send.forPlayer.viewGameState(rec.playerKey, game),
            playerName:   myInfo.username,  playerAvatar: myInfo.avatar,
            opponentName: oppInfo.username, opponentAvatar: oppInfo.avatar,
            mode: rec.mode
        });
        updateClientsViewTimers(game);
        updateClientsViewDecks(game);
        updateClientsViewChoices(game);
        updateClientsViewGrid(game);
    });

    socket.on('disconnect', async () => {
        console.log(`[${socket.id}] disconnected`);
        const gameIndex = GameService.utils.findGameIndexBySocketId(games, socket.id);
        const username  = socketToUser[socket.id]?.username;

        if (gameIndex !== -1) {
            const game = games[gameIndex];
            if (!game.ended) {
                const disconnectedKey  = game.player1Socket.id === socket.id ? 'player:1' : 'player:2';
                const opponentKey      = disconnectedKey === 'player:1' ? 'player:2' : 'player:1';
                const opponentSocket   = opponentKey === 'player:1' ? game.player1Socket : game.player2Socket;

                if (game.isBot) {
                    // Bot game: just end immediately, bot doesn't wait
                    const winnerKey = disconnectedKey === 'player:1' ? 'player:2' : 'player:1';
                    await endGame(gameIndex, winnerKey, 'surrender');
                } else if (username) {
                    // Online/friend game: give 60s to reconnect
                    let secondsLeft = 60;
                    opponentSocket.emit('game.opponent.disconnected', { secondsLeft });

                    const countdownInterval = setInterval(() => {
                        secondsLeft--;
                        opponentSocket.emit('game.opponent.disconnected', { secondsLeft });
                        if (secondsLeft <= 0) clearInterval(countdownInterval);
                    }, 1000);

                    const mode = game.isPrivate ? 'friend' : 'online';
                    const timeout = setTimeout(async () => {
                        clearInterval(countdownInterval);
                        delete pendingReconnects[username];
                        if (!game.ended) {
                            opponentSocket.emit('game.opponent.timeout');
                            await endGame(gameIndex, opponentKey, 'surrender');
                        }
                    }, 60000);

                    game.isPrivate = game.isPrivate || false;
                    pendingReconnects[username] = { gameIndex, playerKey: disconnectedKey, opponentSocket, timeout, countdownInterval, mode };
                } else {
                    // Anonymous disconnect
                    await endGame(gameIndex, opponentKey, 'surrender');
                }
            }
        }
        delete socketToUser[socket.id];
    });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'web-client', 'index.html')));

// ---- Start ----
MongoClient.connect(MONGO_URL)
    .then(client => {
        usersCol = client.db('yams_casino').collection('users');
        usersCol.createIndex({ username: 1 }, { unique: true });
        console.log('[DB] MongoDB connecté');
        http.listen(3000, async () => {
            console.log('[Server] En écoute sur *:3000');
            console.log('[Server] Web: http://localhost:3000');
            try {
                const localtunnel = require('localtunnel');
                const tunnel = await localtunnel({ port: 3000, subdomain: 'yamscasino' });
                process.env.PUBLIC_URL = tunnel.url;
                console.log(`[Server] 📱 Mobile public: ${tunnel.url}`);
                tunnel.on('error', () => {});
                tunnel.on('close', () => console.log('[Tunnel] Fermé'));
            } catch(e) {
                console.log('[Tunnel] Indisponible, utilise IP locale');
                process.env.PUBLIC_URL = `http://${getLocalIP()}:3000`;
            }
        });
    })
    .catch(err => {
        console.error('[DB] Erreur MongoDB:', err.message);
        process.exit(1);
    });
