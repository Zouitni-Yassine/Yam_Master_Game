const GameSocketHandlers = {
    setup(state) {
        SocketClient.onConnect(id => {
            UIManager.setConnectionStatus(`Connecté (${id.substring(0, 8)}...)`);
            UIManager.setQueueButtons('connected');
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
                document.getElementById('player-score').textContent = data.playerScore;
                document.getElementById('opponent-score').textContent = data.opponentScore;
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
    }
};
