const GameUIHandlers = {
    setup(state) {
        document.getElementById('btn-join-queue').addEventListener('click', () => SocketClient.joinQueue());
        document.getElementById('btn-leave-queue').addEventListener('click', () => {
            SocketClient.leaveQueue(); UIManager.setQueueButtons('connected'); state.inQueue = false;
        });

        document.getElementById('btn-roll').addEventListener('click', () => {
            if (!state.isMyTurn || state.isRolling) return;
            state.isRolling = true; state.hasRolledThisTurn = true; state.pendingServerDices = null; state.scatterCallback = null;
            UIManager.setRollButtonState(false, state.rollsCounter);
            SocketClient.rollDice(); SoundManager.play('roll');

            const dices  = DiceSystem.getDiceMeshes();
            const states = DiceSystem.getDiceStates();

            const doScatter = (serverDices) => {
                Animations.rollDice(dices, states, serverDices.map(sd => sd.value), () => {
                    state.isRolling = false;
                    DiceSystem.updateDiceFromServer(serverDices);
                });
            };

            DiceCup.animateRoll(true, dices, states, () => {
                if (state.pendingServerDices) { doScatter(state.pendingServerDices); state.pendingServerDices = null; }
                else                          { state.scatterCallback = doScatter; }
            });
        });

        document.getElementById('btn-validate').addEventListener('click', () => {
            if (!state.selectedGridCell || !state.selectedChoice) return;
            const { cellId, rowIndex, cellIndex } = state.selectedGridCell;
            SocketClient.selectGridCell(cellId, rowIndex, cellIndex);
            UIManager.showValidateButton(false);
            state.selectedChoice = null; state.selectedGridCell = null;
        });

        UIManager.onChoiceSelected(id => {
            state.selectedChoice = id; SocketClient.selectChoice(id); SoundManager.play('click');
        });

        GameUIHandlers._gridInteraction(state);
    },

    _gridInteraction(state) {
        const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();

        document.addEventListener('click', (e) => {
            if (!state.isMyTurn || !state.canSelectCells || !state.selectedChoice) return;
            mouse.set((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1);
            raycaster.setFromCamera(mouse, CasinoScene.getCamera());

            const flat = [];
            const cells = CasinoTable.getGridCellMeshes();
            for (let r = 0; r < CasinoTable.GRID_ROWS; r++)
                for (let c = 0; c < CasinoTable.GRID_COLS; c++)
                    if (cells[r]?.[c]) flat.push(cells[r][c]);

            const hit = raycaster.intersectObjects(flat, false)[0];
            if (!hit) return;
            const { row, col } = hit.object.userData;
            const gridCell = state.currentGrid?.grid?.[row]?.[col];
            if (!gridCell?.canBeChecked || gridCell.owner) return;

            state.selectedGridCell = { cellId: gridCell.id, rowIndex: row, cellIndex: col };
            UIManager.showValidateButton(true);
            CasinoTable.resetCellHighlights();
            state.currentGrid.grid.forEach((r, ri) => r.forEach((gc, ci) => {
                if (gc.canBeChecked && !gc.owner) CasinoTable.highlightCell(ri, ci, true);
            }));
            SoundManager.play('click');
        });
    }
};
