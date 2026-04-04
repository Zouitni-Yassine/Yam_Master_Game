const RANKS = [
    { name: 'Iron',      min: 0,      img: '/rank/valorant-iron-3-icon_svgstack_com_71171774423564.svg',      color: '#9eaab5' },
    { name: 'Bronze',    min: 500,    img: '/rank/valorant-bronze-3-icon_svgstack_com_71051774423583.svg',    color: '#cd7f32' },
    { name: 'Silver',    min: 1500,   img: '/rank/valorant-silver-3-icon_svgstack_com_71241774423610.svg',    color: '#b0b8c1' },
    { name: 'Gold',      min: 4000,   img: '/rank/valorant-gold-3-icon_svgstack_com_71111774423628.svg',      color: '#ffd700' },
    { name: 'Platinum',  min: 10000,  img: '/rank/valorant-platinum-3-icon_svgstack_com_71201774423640.svg',  color: '#70c8c8' },
    { name: 'Diamond',   min: 25000,  img: '/rank/valorant-diamond-3-icon_svgstack_com_71081774423651.svg',   color: '#a29bfe' },
    { name: 'Ascendant', min: 50000,  img: '/rank/valorant-ascendant-3-icon_svgstack_com_71021774423660.svg', color: '#00e676' },
    { name: 'Immortal',  min: 100000, img: '/rank/valorant-immortal-3-icon_svgstack_com_71141774424245.svg',  color: '#ff4757' },
];

function getRank(score) {
    let rank = RANKS[0];
    for (const r of RANKS) { if (score >= r.min) rank = r; else break; }
    return rank;
}

function rankHtml(rank, size = 22) {
    return `<img src="${rank.img}" class="rank-img" style="width:${size}px;height:${size}px" title="${rank.name}">`;
}

function fmtScore(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
    return '$' + n.toLocaleString();
}

// ---- Leaderboard state ----
let _rankingData  = [];
let _rankFilter   = 'all';

function _renderLeaderboard() {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    const filtered = _rankFilter === 'all'
        ? _rankingData
        : _rankingData.filter(p => getRank(p.score || 0).name === _rankFilter);

    const _t = typeof Settings !== 'undefined' ? k => Settings.t(k) : k => k;
    const colHeader = `<div class="ranking-cols-header">
        <span class="rcol-num-h">#</span>
        <span class="rcol-rank-h">${_t('rank-header-rank')}</span>
        <span class="rcol-player-h">${_t('rank-header-player')}</span>
        <span class="rcol-score-h">${_t('rank-header-score')}</span>
        <span class="rcol-record-h">${_t('rank-header-record')}</span>
    </div>`;

    if (!filtered.length) {
        list.innerHTML = colHeader + `<div class="ranking-empty">${_t('rank-empty')}</div>`;
        return;
    }

    const rows = filtered.map(p => {
        const globalPos = _rankingData.indexOf(p) + 1;
        const score = p.score || 0;
        const rank  = getRank(score);
        const av    = p.avatar || '🎲';
        const avHtml = (av.startsWith('data:') || av.startsWith('/')) ? `<img src="${av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : av;
        const rowCls = globalPos === 1 ? 'ranking-row top-1' : globalPos <= 3 ? 'ranking-row top-3' : 'ranking-row';
        const numCls = globalPos === 1 ? 'rcol-num pos-1' : globalPos === 2 ? 'rcol-num pos-2' : globalPos === 3 ? 'rcol-num pos-3' : 'rcol-num';
        return `<div class="${rowCls}">
            <span class="${numCls}">${globalPos}</span>
            <span class="rcol-rank"><img src="${rank.img}" title="${rank.name}"></span>
            <div class="rcol-player">
                <div class="row-avatar">${avHtml}</div>
                <span class="row-username">${p.username}</span>
            </div>
            <span class="rcol-score">$${score.toLocaleString()}</span>
            <span class="rcol-record">${p.wins}V · ${p.losses}D</span>
        </div>`;
    }).join('');

    list.innerHTML = colHeader + rows;
}

function renderAvatar(el, av) {
    if (!el) return;
    if (av && (av.startsWith('data:') || av.startsWith('/'))) {
        el.innerHTML = `<img src="${av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        el.textContent = av || '🎲';
    }
}

function showDollarGain(text) {
    const el = document.createElement('div');
    el.className = 'dollar-gain';
    el.textContent = text;
    document.getElementById('ui-overlay').appendChild(el);
    const badge = document.querySelector('.player-badge');
    if (badge) {
        const rect = badge.getBoundingClientRect();
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
    }
    gsap.fromTo(el,
        { opacity: 1, y: 0, scale: 1 },
        { opacity: 0, y: -60, scale: 1.4, duration: 1.5, ease: 'power2.out',
          onComplete: () => el.remove() }
    );
}

const GameSocketHandlers = {
    setup(state) {
        SocketClient.onConnect(() => {
            UIManager.setConnectionStatus(typeof Settings !== 'undefined' ? Settings.t('connected') : 'Connecté');
            document.getElementById('btn-join-queue').disabled = false;
            document.getElementById('btn-play-friend').disabled = false;
            document.getElementById('btn-play-bot').disabled = false;
        });

        SocketClient.onDisconnect(() => {
            UIManager.setConnectionStatus(typeof Settings !== 'undefined' ? Settings.t('disconnected') : 'Déconnecté. Reconnexion...');
            UIManager.setQueueButtons('disconnected');
            state.inGame = false; state.inQueue = false;
        });

        SocketClient.onQueueAdded(data => {
            state.inQueue = data.inQueue; state.inGame = data.inGame;
            UIManager.setQueueButtons('queued');
        });

        SocketClient.onGameStart(data => {
            state.inQueue = false; state.inGame = true;
            state.idPlayer = data.idPlayer; state.idOpponent = data.idOpponent;
            state.opponentRollsCounter = 0;
            state.opponentInitialized  = false;
            state.gameMode = data.mode || 'online';
            state.botDifficulty = data.botDifficulty || null;
            state.gameId = data.idGame || null;
            const isPlayer1 = data.playerKey === 'player:1';
            ChipSystem.setPlayerSide(isPlayer1);

            // Update in-game badges with real names/avatars
            if (data.playerName)   { const el = document.getElementById('player-badge-name');   if (el) el.textContent = data.playerName; }
            if (data.opponentName) { const el = document.getElementById('opponent-badge-name'); if (el) el.textContent = data.opponentName; }
            renderAvatar(document.getElementById('player-badge-avatar'),   data.playerAvatar);
            const oppAv = data.opponentName === 'DiceKing' ? '/icons/icon-dice-king.svg' : data.opponentAvatar;
            renderAvatar(document.getElementById('opponent-badge-avatar'), oppAv);

            UIManager.showQueueOverlay(false);
            document.getElementById('game-bg').style.display = 'block';
            DiceSystem.showDice(true);
            Characters.setBot(data.opponentName === 'DiceKing');
            Characters.setPlayerKey(data.playerKey);
            Characters.show(true);
            Animations.showDiceEntry(DiceSystem.getDiceMeshes());
        });

        SocketClient.onTimer(data => {
            UIManager.updateTimer(data.playerTimer, data.opponentTimer);
            const wasMyTurn = state.isMyTurn;
            state.isMyTurn = data.playerTimer > 0;
            if (state.isMyTurn !== wasMyTurn) {
                state.animGeneration++;
                const cup = DiceCup.getOpponentCup();
                gsap.killTweensOf(cup.position); gsap.killTweensOf(cup.rotation);
                UIManager.setTurnIndicator(state.isMyTurn);
                DiceSystem.setPlayerTurn(state.isMyTurn);
                state.isRolling = false; state.scatterCallback = null; state.pendingServerDices = null;
                UIManager.hideDefiButton();
                if (state.isMyTurn) {
                    DiceSystem.resetDice();
                    Animations.showDiceEntry(DiceSystem.getDiceMeshes());
                    UIManager.setRollButtonState(true, 0);
                    UIManager.showValidateButton(false);
                    state.rollsCounter = 0; state.hasRolledThisTurn = false; state.selectedChoice = null;
                    state.opponentRollsCounter = 0; state.opponentInitialized = false;
                } else {
                    state.opponentRollsCounter = 0; state.opponentInitialized = false;
                    UIManager.setRollButtonState(false, 0);
                    UIManager.showValidateButton(false);
                    Animations.hideChoicesBar();
                }
            }
        });

        SocketClient.onDeckViewState(data => {
            state.currentDeck = data; state.rollsCounter = data.rollsCounter;
            UIManager.updateRollCounter(Math.min(data.rollsCounter - 1, data.rollsMaximum), data.rollsMaximum);

            if (data.displayPlayerDeck) {
                DiceSystem.showDice(true);
                if (state.isRolling) {
                    if (state.scatterCallback) {
                        const cb = state.scatterCallback; state.scatterCallback = null; cb(data.dices);
                    } else {
                        state.pendingServerDices = data.dices;
                    }
                } else {
                    DiceSystem.updateDiceFromServer(data.dices);
                }
                UIManager.setRollButtonState(data.displayRollButton && data.rollsCounter <= data.rollsMaximum, state.hasRolledThisTurn ? 1 : 0);
                const magicCard = document.getElementById('magic-card');
                if (magicCard) {
                    const uses = data.magicUsesLeft ?? 2;
                    magicCard.classList.toggle('hidden', data.rollsCounter !== 1 || uses <= 0);
                    const usesEl = document.getElementById('magic-card-uses');
                    if (usesEl) usesEl.textContent = uses;
                }
            }

            if (data.displayOpponentDeck) {
                document.getElementById('magic-card')?.classList.add('hidden');
                DiceSystem.showDice(true);
                DiceSystem.setPlayerTurn(false);

                if (!state.opponentInitialized) {
                    // First sync after game/turn start — just show state, no animation
                    state.opponentInitialized  = true;
                    state.opponentRollsCounter = data.rollsCounter;
                    DiceSystem.updateDiceFromServer(data.dices);
                } else {
                    const prevRolls = state.opponentRollsCounter;
                    state.opponentRollsCounter = data.rollsCounter;

                    const isReset = data.dices.every(d => !d.value || d.value === '');
                    if (!isReset && data.rollsCounter > prevRolls && data.rollsCounter > 0) {
                        // Opponent just rolled — animate cup + dice scatter
                        const values     = data.dices.map(d => d.value);
                        const diceMeshes = DiceSystem.getDiceMeshes();
                        const diceStates = DiceSystem.getDiceStates();
                        const gen        = state.animGeneration;
                        DiceCup.animateRoll(false, diceMeshes, diceStates, () => {
                            if (state.animGeneration !== gen) return;
                            Animations.rollDice(diceMeshes, diceStates, values, () => {
                                if (state.animGeneration !== gen) return;
                                DiceSystem.updateDiceFromServer(data.dices, true);
                            });
                        });
                    } else {
                        // Lock/unlock or turn reset — instant update
                        DiceSystem.updateDiceFromServer(data.dices);
                    }
                }
            }
        });

        SocketClient.onChoicesViewState(data => {
            state.currentChoices = data; state.selectedChoice = data.idSelectedChoice;
            UIManager.updateChoices(data.availableChoices, data.canMakeChoice, data.idSelectedChoice);
            const defiCard = document.getElementById('defi-card');
            if (defiCard) {
                defiCard.classList.toggle('hidden', !data.canDeclareDefi && !data.isDefi);
                defiCard.classList.toggle('declared', !!data.isDefi);
            }
        });

        SocketClient.onGridViewState(data => {
            if (data.playerScore !== undefined) {
                document.getElementById('player-score').textContent = `$${data.playerScore * 100}`;
                document.getElementById('opponent-score').textContent = `$${data.opponentScore * 100}`;
                if (state.previousPlayerScore !== undefined && data.playerScore > state.previousPlayerScore) {
                    const gained = (data.playerScore - state.previousPlayerScore) * 100;
                    showDollarGain(`+$${gained}`);
                }
                state.previousPlayerScore = data.playerScore;
            }
            if (data.winner) {
                const isWinner = data.winner === state.idPlayer;
                const glow = document.getElementById('turn-glow');
                if (glow) { glow.classList.remove('my-turn', 'opponent-turn'); }

                const playerScore   = (data.playerScore   || 0) * 100;
                const opponentScore = (data.opponentScore || 0) * 100;
                const _t = typeof Settings !== 'undefined' ? k => Settings.t(k) : k => k;
                const playerName   = document.getElementById('player-badge-name')?.textContent   || _t('player-you');
                const opponentName = document.getElementById('opponent-badge-name')?.textContent || _t('player-opp');

                document.getElementById('game-over-title').textContent    = isWinner ? _t('gameover-win') : _t('gameover-lose');
                document.getElementById('game-over-title').className      = 'game-over-title ' + (isWinner ? 'victory' : 'defeat');
                document.getElementById('game-over-subtitle').textContent = isWinner ? _t('gameover-congrats') : _t('gameover-better');
                document.getElementById('game-over-player-name').textContent   = playerName;
                document.getElementById('game-over-opponent-name').textContent = opponentName;
                document.getElementById('game-over-player-score').textContent   = '$' + playerScore;
                document.getElementById('game-over-opponent-score').textContent = '$' + opponentScore;

                document.getElementById('game-over-player').classList.toggle('winner', isWinner);
                document.getElementById('game-over-opponent').classList.toggle('winner', !isWinner);

                const modal = document.getElementById('game-over-modal');
                modal.classList.add('show');
                gsap.from('.game-over-card', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(1.4)' });

                const goToMenu = () => {
                    modal.classList.remove('show');
                    DiceSystem.showDice(false);
                    Characters.show(false);
                    document.getElementById('game-bg').style.display = 'none';
                    // Reset to main menu section
                    ['menu-main','menu-friend','menu-bot','menu-waiting'].forEach(s => {
                        const el = document.getElementById(s);
                        if (el) el.classList.toggle('hidden', s !== 'menu-main');
                    });
                    UIManager.showQueueOverlay(true);
                    UIManager.setQueueButtons('connected');
                    const status = document.getElementById('game-over-rematch-status');
                    if (status) { status.textContent = ''; status.classList.add('hidden'); }
                    const replayBtn = document.getElementById('game-over-replay');
                    if (replayBtn) { replayBtn.textContent = 'REJOUER'; replayBtn.disabled = false; }
                    SocketClient.gameoverLeave(state.gameId);
                    state.inGame = false;
                };

                const doReplay = () => {
                    const statusEl = document.getElementById('game-over-rematch-status');
                    if (state.gameMode === 'bot') {
                        modal.classList.remove('show');
                        DiceSystem.showDice(false);
                        Characters.show(false);
                        document.getElementById('game-bg').style.display = 'none';
                        SocketClient.rematchRequest('bot', state.botDifficulty);
                    } else if (state.gameMode === 'online') {
                        modal.classList.remove('show');
                        DiceSystem.showDice(false);
                        Characters.show(false);
                        document.getElementById('game-bg').style.display = 'none';
                        UIManager.showQueueOverlay(true);
                        SocketClient.rematchRequest('online', null);
                    } else {
                        // friend — request rematch, wait for opponent
                        if (statusEl) { statusEl.textContent = 'En attente de votre adversaire...'; statusEl.classList.remove('hidden'); }
                        document.getElementById('game-over-replay').disabled = true;
                        SocketClient.rematchRequest('friend', null, state.gameId);
                    }
                };

                document.getElementById('game-over-replay').onclick = doReplay;
                document.getElementById('game-over-menu').onclick   = goToMenu;
            }
            if (data.grid && state.currentGrid?.grid) {
                data.grid.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        const prev = state.currentGrid.grid[ri]?.[ci];
                        if (cell.owner && (!prev || !prev.owner)) {
                            // New chip placed
                            ChipSystem.flyChipToCell(ri, ci, cell.owner);
                        } else if (!cell.owner && prev && prev.owner) {
                            // Chip removed (magic card effect)
                            ChipSystem.removeChipFromCell(ri, ci);
                        }
                    });
                });
            }
            state.currentGrid = data; state.canSelectCells = data.canSelectCells;
            UIManager.updateGrid(data.grid, data.canSelectCells, state.idPlayer);
        });

        SocketClient.onRoomCreated(data => {
            document.getElementById('room-code-text').textContent = data.code;
        });

        SocketClient.onRoomJoined(() => {
            // Game will start via onGameStart
        });

        SocketClient.onRoomError(data => {
            const errEl = document.getElementById('room-error');
            errEl.textContent = data.message;
            errEl.classList.remove('hidden');
        });

        SocketClient.onRankingUpdate(data => {
            const score  = data.score || 0;
            const rank   = getRank(score);
            const scoreEl = document.getElementById('menu-player-score');
            if (scoreEl) scoreEl.innerHTML = `${rankHtml(rank, 20)} <span style="color:${rank.color}">${rank.name}</span> · ${fmtScore(score)}`;
        });

        SocketClient.onUserLogged(data => {
            LoginScene.destroy();
            gsap.to('#login-overlay', { opacity: 0, duration: 0.5, onComplete: () => {
                document.getElementById('login-overlay').style.display = 'none';
            }});
            document.getElementById('queue-overlay').classList.remove('hidden');
            gsap.from('#queue-overlay', { opacity: 0, duration: 0.4 });
            if (typeof Settings !== 'undefined') Settings.playMusic();

            // Player username
            document.getElementById('player-username-display').textContent = data.username;

            // Avatar in menu chip
            const av = data.avatar || '🎲';
            renderAvatar(document.getElementById('menu-avatar-display'), av);

            // Score + rank in menu chip
            const score = data.score || 0;
            const rank  = getRank(score);
            const scoreEl = document.getElementById('menu-player-score');
            if (scoreEl) scoreEl.innerHTML = `${rankHtml(rank, 20)} <span style="color:${rank.color}">${rank.name}</span> · ${fmtScore(score)}`;

            // Init menu background
            if (typeof MenuBg !== 'undefined') MenuBg.init();

            // Store avatar for in-game badge
            state.playerAvatar = av;
            state.playerName = data.username;

            // Show reconnect banner if a game is pending
            if (data.pendingReconnect) {
                setTimeout(() => {
                    if (typeof PendingReconnect !== 'undefined') PendingReconnect.show(data.pendingMode || 'online');
                }, 600);
            }
        });

        SocketClient.onUserError(data => {
            showLoginError(data.message);
        });

        SocketClient.onRankingList(data => {
            _rankingData = data;
            _renderLeaderboard();
        });

        SocketClient.onSurrendered(data => {
            // Hide surrender modal if still open
            if (typeof SurrenderModal !== 'undefined') SurrenderModal.hide();
            // game.grid.view-state with winner will trigger game-over modal automatically
            // but for the surrenderer (by:'you') we can show immediate feedback
            if (data.by === 'you') {
                state.inGame = false;
            }
        });

        SocketClient.onOpponentDisconnected(data => {
            const overlay = document.getElementById('opponent-disconnect-overlay');
            const countdown = document.getElementById('disconnect-countdown');
            if (overlay) overlay.classList.remove('hidden');
            if (countdown) countdown.textContent = data.secondsLeft;
        });

        SocketClient.onOpponentReconnected(() => {
            const overlay = document.getElementById('opponent-disconnect-overlay');
            if (overlay) overlay.classList.add('hidden');
        });

        SocketClient.onOpponentTimeout(() => {
            const overlay = document.getElementById('opponent-disconnect-overlay');
            if (overlay) overlay.classList.add('hidden');
            // Winner result comes via game.grid.view-state
        });

        SocketClient.onOpponentLeftGameover(() => {
            const statusEl = document.getElementById('game-over-rematch-status');
            if (statusEl) { statusEl.textContent = 'L\'adversaire a quitté la partie.'; statusEl.classList.remove('hidden'); }
            const replayBtn = document.getElementById('game-over-replay');
            if (replayBtn) { replayBtn.textContent = 'REJOUER'; replayBtn.disabled = true; }
        });

        SocketClient.onRematchRequested(() => {
            // Opponent wants a rematch — show prompt in game-over modal
            const statusEl = document.getElementById('game-over-rematch-status');
            if (statusEl) { statusEl.textContent = 'Votre adversaire veut une revanche !'; statusEl.classList.remove('hidden'); }
            const replayBtn = document.getElementById('game-over-replay');
            if (replayBtn) replayBtn.textContent = 'ACCEPTER LA REVANCHE';
        });

        SocketClient.onRematchAccepted(() => {
            // Both accepted — game.start will come right after, just reset UI
            const modal = document.getElementById('game-over-modal');
            if (modal) modal.classList.remove('show');
            const replayBtn = document.getElementById('game-over-replay');
            if (replayBtn) { replayBtn.textContent = 'REJOUER'; replayBtn.disabled = false; }
            const statusEl = document.getElementById('game-over-rematch-status');
            if (statusEl) { statusEl.textContent = ''; statusEl.classList.add('hidden'); }
        });

        SocketClient.onRematchCancelled(() => {
            const statusEl = document.getElementById('game-over-rematch-status');
            if (statusEl) { statusEl.textContent = 'L\'adversaire a refusé la revanche.'; statusEl.classList.remove('hidden'); }
            const replayBtn = document.getElementById('game-over-replay');
            if (replayBtn) { replayBtn.textContent = 'REJOUER'; replayBtn.disabled = false; }
        });

        SocketClient.onMagicResult(data => {
            const _t = typeof Settings !== 'undefined' ? k => Settings.t(k) : k => k;
            const messages = {
                remove_own:      _t('magic-effect-remove-own'),
                remove_opponent: _t('magic-effect-remove-opp'),
                score_minus:     _t('magic-effect-score-minus'),
                empty:           _t('magic-effect-empty'),
            };
            const overlay  = document.getElementById('magic-result-overlay');
            const effectEl = document.getElementById('magic-result-effect');
            if (overlay && effectEl) {
                effectEl.textContent = messages[data.effect] || data.effect;
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.add('hidden'), 2500);
            }
            document.getElementById('magic-card')?.classList.add('hidden');
        });

        document.getElementById('magic-card')?.addEventListener('click', () => SocketClient.useMagicCard());

        SocketClient.onReconnected(data => {
            state.inQueue = false; state.inGame = true;
            state.idPlayer = data.idPlayer; state.idOpponent = data.idOpponent;
            state.opponentRollsCounter = 0;
            state.opponentInitialized  = false;
            const isPlayer1 = data.playerKey === 'player:1';
            ChipSystem.setPlayerSide(isPlayer1);

            if (data.playerName)   { const el = document.getElementById('player-badge-name');   if (el) el.textContent = data.playerName; }
            if (data.opponentName) { const el = document.getElementById('opponent-badge-name'); if (el) el.textContent = data.opponentName; }
            renderAvatar(document.getElementById('player-badge-avatar'),   data.playerAvatar);
            const oppAv = data.opponentName === 'DiceKing' ? '/icons/icon-dice-king.svg' : data.opponentAvatar;
            renderAvatar(document.getElementById('opponent-badge-avatar'), oppAv);

            UIManager.showQueueOverlay(false);
            document.getElementById('game-bg').style.display = 'block';
            DiceSystem.showDice(true);
            Characters.setBot(data.opponentName === 'DiceKing');
            Characters.setPlayerKey(data.playerKey);
            Characters.show(true);
        });

    }
};
