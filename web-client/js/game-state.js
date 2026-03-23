/* ============================================
   GAME STATE MANAGER
   Bridges socket events to 3D scene and UI
   ============================================ */

const GameState = (() => {
    let state = {
        inQueue: false,
        inGame: false,
        idPlayer: null,
        idOpponent: null,
        isMyTurn: false,
        currentDeck: null,
        currentChoices: null,
        currentGrid: null,
        selectedChoice: null,
        selectedGridCell: null,
        canSelectCells: false,
        rollsCounter: 0,
        rollsMaximum: 3,
        isRolling: false,
        pendingServerDices: null   // server dice data received during animation
    };

    function init() {
        setupSocketListeners();
        setupUIListeners();
        setupDiceListeners();
    }

    function setupSocketListeners() {
        SocketClient.onConnect((socketId) => {
            UIManager.setConnectionStatus(`Connecté (${socketId.substring(0, 8)}...)`);
            UIManager.setQueueButtons('connected');
        });

        SocketClient.onDisconnect(() => {
            UIManager.setConnectionStatus('Déconnecté. Reconnexion...');
            UIManager.setQueueButtons('disconnected');
            state.inGame = false;
            state.inQueue = false;
        });

        SocketClient.onQueueAdded((data) => {
            state.inQueue = data.inQueue;
            state.inGame = data.inGame;
            UIManager.setQueueButtons('queued');
        });

        SocketClient.onGameStart((data) => {
            state.inQueue = false;
            state.inGame = true;
            state.idPlayer = data.idPlayer;
            state.idOpponent = data.idOpponent;

            UIManager.showQueueOverlay(false);
            DiceSystem.showDice(true);
            Animations.showDiceEntry(DiceSystem.getDiceMeshes());
        });

        SocketClient.onTimer((data) => {
            UIManager.updateTimer(data.playerTimer, data.opponentTimer);

            const wasMyTurn = state.isMyTurn;
            state.isMyTurn = data.playerTimer > 0;

            if (state.isMyTurn !== wasMyTurn) {
                UIManager.setTurnIndicator(state.isMyTurn);
                DiceSystem.setPlayerTurn(state.isMyTurn);

                if (state.isMyTurn) {
                    // New turn starting for us
                    DiceSystem.resetDice();
                    Animations.showDiceEntry(DiceSystem.getDiceMeshes());
                    UIManager.setRollButtonState(true, 0);
                    UIManager.showValidateButton(false);
                    state.rollsCounter = 0;
                    state.selectedChoice = null;
                } else {
                    UIManager.setRollButtonState(false, 0);
                    UIManager.showValidateButton(false);
                    Animations.hideChoicesBar();
                }
            }
        });

        SocketClient.onDeckViewState((data) => {
            state.currentDeck = data;
            state.rollsCounter = data.rollsCounter;
            state.rollsMaximum = data.rollsMaximum;

            UIManager.updateRollCounter(data.rollsCounter, data.rollsMaximum);

            if (data.displayPlayerDeck) {
                DiceSystem.showDice(true);

                if (state.isRolling) {
                    // Animation in progress — store real values, apply when animation ends
                    state.pendingServerDices = data.dices;
                } else {
                    DiceSystem.updateDiceFromServer(data.dices);
                }

                const canRoll = data.displayRollButton && data.rollsCounter <= data.rollsMaximum;
                UIManager.setRollButtonState(canRoll, data.rollsCounter);
            }

            if (data.displayOpponentDeck) {
                // Show opponent's dice (read-only)
                DiceSystem.showDice(true);
                DiceSystem.updateDiceFromServer(data.dices);
                DiceSystem.setPlayerTurn(false);
            }
        });

        SocketClient.onChoicesViewState((data) => {
            state.currentChoices = data;
            state.selectedChoice = data.idSelectedChoice;

            UIManager.updateChoices(
                data.availableChoices,
                data.canMakeChoice,
                data.idSelectedChoice
            );

            // Show validate button if choice is selected and we need to pick a cell
            if (data.idSelectedChoice && state.isMyTurn) {
                // Validate will be shown when grid cell is selected
            }
        });

        SocketClient.onGridViewState((data) => {
            state.currentGrid = data;
            state.canSelectCells = data.canSelectCells;

            UIManager.updateGrid(data.grid, data.canSelectCells, state.idPlayer);
        });
    }

    function setupUIListeners() {
        // Join queue button
        document.getElementById('btn-join-queue').addEventListener('click', () => {
            SocketClient.joinQueue();
        });

        // Leave queue button
        document.getElementById('btn-leave-queue').addEventListener('click', () => {
            SocketClient.leaveQueue();
            UIManager.setQueueButtons('connected');
            state.inQueue = false;
        });

        // Roll button
        document.getElementById('btn-roll').addEventListener('click', () => {
            if (state.isMyTurn && !state.isRolling) {
                state.isRolling = true;
                state.pendingServerDices = null;
                UIManager.setRollButtonState(false, state.rollsCounter);

                SocketClient.rollDice();

                // Temp random values just to drive the animation visually
                const diceStates = DiceSystem.getDiceStates();
                const tempValues = diceStates.map(ds =>
                    (!ds.locked || ds.value === '') ? Math.ceil(Math.random() * 6) : ds.value
                );

                Animations.rollDice(
                    DiceSystem.getDiceMeshes(),
                    diceStates,
                    tempValues,
                    () => {
                        state.isRolling = false;
                        // Apply real server values received during animation
                        if (state.pendingServerDices) {
                            DiceSystem.updateDiceFromServer(state.pendingServerDices);
                            state.pendingServerDices = null;
                        }
                    }
                );

                SoundManager.play('roll');
            }
        });

        // Validate button
        document.getElementById('btn-validate').addEventListener('click', () => {
            if (state.selectedGridCell && state.selectedChoice) {
                const { cellId, rowIndex, cellIndex } = state.selectedGridCell;
                SocketClient.selectGridCell(cellId, rowIndex, cellIndex);
                UIManager.showValidateButton(false);

                // Animate chip
                const isPlayer = true;
                ChipSystem.flyChipToCell(rowIndex, cellIndex, isPlayer);
                SoundManager.play('chip');

                state.selectedChoice = null;
                state.selectedGridCell = null;
            }
        });

        // Choice selected
        UIManager.onChoiceSelected((choiceId) => {
            state.selectedChoice = choiceId;
            SocketClient.selectChoice(choiceId);
            SoundManager.play('click');
        });

        // Grid cell interaction (via raycaster on table)
        setupGridInteraction();
    }

    function setupGridInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        document.addEventListener('click', (e) => {
            if (!state.isMyTurn || !state.canSelectCells || !state.selectedChoice) return;

            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, CasinoScene.getCamera());

            // Check intersection with grid cells
            const cellMeshes = CasinoTable.getGridCellMeshes();
            const flatCells = [];
            for (let r = 0; r < CasinoTable.GRID_ROWS; r++) {
                for (let c = 0; c < CasinoTable.GRID_COLS; c++) {
                    if (cellMeshes[r] && cellMeshes[r][c]) {
                        flatCells.push(cellMeshes[r][c]);
                    }
                }
            }

            const intersects = raycaster.intersectObjects(flatCells, false);
            if (intersects.length > 0) {
                const cell = intersects[0].object;
                const { row, col } = cell.userData;

                // Check if this cell can be selected from current grid state
                if (state.currentGrid && state.currentGrid.grid &&
                    state.currentGrid.grid[row] && state.currentGrid.grid[row][col]) {

                    const gridCell = state.currentGrid.grid[row][col];

                    if (gridCell.canBeChecked && !gridCell.owner) {
                        state.selectedGridCell = {
                            cellId: gridCell.id,
                            rowIndex: row,
                            cellIndex: col
                        };

                        // Show validate button
                        UIManager.showValidateButton(true);

                        // Highlight selected cell
                        CasinoTable.resetCellHighlights();
                        // Re-highlight all checkable
                        state.currentGrid.grid.forEach((gridRow, ri) => {
                            gridRow.forEach((gc, ci) => {
                                if (gc.canBeChecked && !gc.owner) {
                                    CasinoTable.highlightCell(ri, ci, true);
                                }
                            });
                        });

                        SoundManager.play('click');
                    }
                }
            }
        });
    }

    function setupDiceListeners() {
        DiceSystem.onDiceClick((index, diceState) => {
            if (!state.isMyTurn || state.rollsCounter === 0) return;

            // Toggle lock
            const newLocked = !diceState.locked;
            DiceSystem.setDiceLocked(index, newLocked);

            // Notify server
            SocketClient.lockDice(diceState.id);
            SoundManager.play('click');
        });
    }

    function getState() { return state; }

    return { init, getState };
})();
