// websocket-server/services/game.service.js

// Durée d'un tour en secondes
const TURN_DURATION = 30;
// Durée après le dernier lancer avant changement de tour
const END_TURN_DURATION = 5;

const DECK_INIT = {
    dices: [
        { id: 1, value: '', locked: true },
        { id: 2, value: '', locked: true },
        { id: 3, value: '', locked: true },
        { id: 4, value: '', locked: true },
        { id: 5, value: '', locked: true },
    ],
    rollsCounter: 1,
    rollsMaximum: 3
};

const GAME_INIT = {
    gameState: {
        currentTurn: 'player:1',
        timer: null,
        player1Score: 0,
        player2Score: 0,
        grid: [],
        choices: {},
        deck: {}
    }
};

const GameService = {

    init: {
        gameState: () => {
            const game = { ...GAME_INIT, gameState: { ...GAME_INIT.gameState } };
            game.gameState.timer = TURN_DURATION;
            game.gameState.deck = { ...DECK_INIT, dices: DECK_INIT.dices.map(d => ({ ...d })) };
            return game;
        },

        deck: () => {
            return { ...DECK_INIT, dices: DECK_INIT.dices.map(d => ({ ...d })) };
        },
    },

    send: {
        forPlayer: {
            viewGameState: (playerKey, game) => {
                return {
                    inQueue: false,
                    inGame: true,
                    idPlayer:
                        (playerKey === 'player:1')
                            ? game.player1Socket.id
                            : game.player2Socket.id,
                    idOpponent:
                        (playerKey === 'player:1')
                            ? game.player2Socket.id
                            : game.player1Socket.id
                };
            },

            viewQueueState: () => {
                return {
                    inQueue: true,
                    inGame: false,
                };
            },

            gameTimer: (playerKey, gameState) => {
                const playerTimer = gameState.currentTurn === playerKey ? gameState.timer : 0;
                const opponentTimer = gameState.currentTurn === playerKey ? 0 : gameState.timer;
                return { playerTimer, opponentTimer };
            },

            deckViewState: (playerKey, gameState) => {
                return {
                    displayPlayerDeck: gameState.currentTurn === playerKey,
                    displayOpponentDeck: gameState.currentTurn !== playerKey,
                    displayRollButton: gameState.deck.rollsCounter <= gameState.deck.rollsMaximum,
                    rollsCounter: gameState.deck.rollsCounter,
                    rollsMaximum: gameState.deck.rollsMaximum,
                    dices: gameState.deck.dices
                };
            },
        }
    },

    timer: {
        getTurnDuration: () => {
            return TURN_DURATION;
        },
        getEndTurnDuration: () => {
            return END_TURN_DURATION;
        }
    },

    dices: {
        roll: (dicesToRoll) => {
            return dicesToRoll.map(dice => {
                if (dice.value === '') {
                    return { id: dice.id, value: String(Math.floor(Math.random() * 6) + 1), locked: false };
                } else if (!dice.locked) {
                    return { ...dice, value: String(Math.floor(Math.random() * 6) + 1) };
                } else {
                    return dice;
                }
            });
        },

        lockEveryDice: (dicesToLock) => {
            return dicesToLock.map(dice => ({ ...dice, locked: true }));
        }
    },

    utils: {
        findGameIndexById: (games, idGame) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].idGame === idGame) return i;
            }
            return -1;
        },

        findGameIndexBySocketId: (games, socketId) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].player1Socket.id === socketId || games[i].player2Socket.id === socketId) return i;
            }
            return -1;
        },

        findDiceIndexByDiceId: (dices, idDice) => {
            for (let i = 0; i < dices.length; i++) {
                if (dices[i].id === idDice) return i;
            }
            return -1;
        }
    }
};

module.exports = GameService;
