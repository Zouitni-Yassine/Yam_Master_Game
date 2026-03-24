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
        SocketClient.onConnect(id => {
            UIManager.setConnectionStatus(`Connecté`);
            document.getElementById('btn-join-queue').disabled = false;
            document.getElementById('btn-play-friend').disabled = false;
            document.getElementById('btn-play-bot').disabled = false;
        });

        SocketClient.onDisconnect(() => {
            UIManager.setConnectionStatus('Déconnecté. Reconnexion...');
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
            const isPlayer1 = data.playerKey === 'player:1';
            ChipSystem.setPlayerSide(isPlayer1);

            // Update in-game badges with real names/avatars
            if (data.playerName) {
                const el = document.getElementById('player-badge-name');
                if (el) el.textContent = data.playerName;
            }
            if (data.playerAvatar) {
                const el = document.getElementById('player-badge-avatar');
                if (el) el.textContent = data.playerAvatar;
            }
            if (data.opponentName) {
                const el = document.getElementById('opponent-badge-name');
                if (el) el.textContent = data.opponentName;
            }
            if (data.opponentAvatar) {
                const el = document.getElementById('opponent-badge-avatar');
                if (el) el.textContent = data.opponentAvatar;
            }

            UIManager.showQueueOverlay(false);
            DiceSystem.showDice(true);
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
            UIManager.updateRollCounter(Math.min(data.rollsCounter, data.rollsMaximum), data.rollsMaximum);

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
            }

            if (data.displayOpponentDeck) {
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
                UIManager.setTurnIndicator(false);
                document.getElementById('turn-indicator').textContent = isWinner ? '🏆 VICTOIRE !' : '💀 DÉFAITE';
            }
            if (data.grid && state.currentGrid?.grid) {
                data.grid.forEach((row, ri) => {
                    row.forEach((cell, ci) => {
                        const prev = state.currentGrid.grid[ri]?.[ci];
                        if (cell.owner && (!prev || !prev.owner)) {
                            // Use cell.owner directly: player:1=red, player:2=black on BOTH clients
                            ChipSystem.flyChipToCell(ri, ci, cell.owner);
                            SoundManager.play('chip');
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
            const scoreEl = document.getElementById('menu-player-score');
            if (scoreEl && data.score !== undefined) scoreEl.textContent = `$${data.score.toLocaleString()}`;
        });

        SocketClient.onUserLogged(data => {
            LoginScene.destroy();
            gsap.to('#login-overlay', { opacity: 0, duration: 0.5, onComplete: () => {
                document.getElementById('login-overlay').style.display = 'none';
            }});
            document.getElementById('queue-overlay').classList.remove('hidden');
            gsap.from('#queue-overlay', { opacity: 0, duration: 0.4 });

            // Player username
            document.getElementById('player-username-display').textContent = data.username;

            // Avatar in menu chip
            const av = data.avatar || '🎲';
            const menuAv = document.getElementById('menu-avatar-display');
            if (menuAv) menuAv.textContent = av;

            // Score in menu chip
            const scoreEl = document.getElementById('menu-player-score');
            if (scoreEl) scoreEl.textContent = `$${(data.score || 0).toLocaleString()}`;

            // Init menu background
            if (typeof MenuBg !== 'undefined') MenuBg.init();

            // Store avatar for in-game badge
            state.playerAvatar = av;
            state.playerName = data.username;
        });

        SocketClient.onUserError(data => {
            const el = document.getElementById('login-error');
            el.textContent = data.message;
            el.classList.remove('hidden');
        });

        SocketClient.onRankingList(data => {
            const list = document.getElementById('ranking-list');
            if (!list) return;
            list.innerHTML = data.map((p, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
                const cls = i < 3 ? 'ranking-row top' : 'ranking-row';
                const av = p.avatar || '🎲';
                return `<div class="${cls}"><span class="ranking-pos">${medal}</span><span class="ranking-avatar">${av}</span><span class="ranking-name">${p.username}</span><span class="ranking-score">$${(p.score||0).toLocaleString()}</span><span class="ranking-record">${p.wins}V · ${p.losses}D</span></div>`;
            }).join('');
        });
    }
};
