/* ============================================
   DEV MODE — Ctrl+Shift+D to toggle
   ============================================ */
const DevMode = (() => {
    let devPlayerScore   = 0;
    let devOpponentScore = 0;
    let devChipRow = 0;
    let devChipCol = 0;

    // Toggle panel
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            const panel = document.getElementById('dev-panel');
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'block' : 'none';

            // Show the game scene if hidden
            if (isHidden) {
                const gameBg = document.getElementById('game-bg');
                if (gameBg) gameBg.style.display = 'block';
                DiceSystem.showDice(true);
                ChipSystem.setPlayerSide(true);
            }
        }
    });

    function myTurn() {
        const glow = document.getElementById('turn-glow');
        if (glow) { glow.classList.add('my-turn'); glow.classList.remove('opponent-turn'); }
        Animations.flashTurnIndicator('VOTRE TOUR');
        UIManager.setRollButtonState(true, 0);
        document.getElementById('roll-counter').textContent = 'LANCE 0/3';
    }

    function opponentTurn() {
        const glow = document.getElementById('turn-glow');
        if (glow) { glow.classList.add('opponent-turn'); glow.classList.remove('my-turn'); }
        Animations.flashTurnIndicator('EN ATTENTE');
        UIManager.setRollButtonState(false, 0);
    }

    function addScore(amount) {
        devPlayerScore = Math.max(0, devPlayerScore + amount);
        document.getElementById('player-score').textContent = '$' + devPlayerScore;
        if (amount > 0) showDollarGain('+$' + amount);
    }

    function placeChip() {
        // Cycle through cells
        ChipSystem.flyChipToCell(devChipRow, devChipCol, 'player:1');
        CasinoTable.setCellOwner(devChipRow, devChipCol, 'player:1');
        devChipCol++;
        if (devChipCol >= TableConfig.GRID_COLS) { devChipCol = 0; devChipRow = (devChipRow + 1) % TableConfig.GRID_ROWS; }
        devPlayerScore += 100;
        document.getElementById('player-score').textContent = '$' + devPlayerScore;
        showDollarGain('+$100');
    }

    function _showModal(isWinner) {
        const glow = document.getElementById('turn-glow');
        if (glow) glow.classList.remove('my-turn', 'opponent-turn');

        const pName = document.getElementById('player-badge-name')?.textContent   || 'VOUS';
        const oName = document.getElementById('opponent-badge-name')?.textContent || 'ADVERSAIRE';

        document.getElementById('game-over-title').textContent    = isWinner ? 'VICTOIRE !' : 'DÉFAITE';
        document.getElementById('game-over-title').className      = 'game-over-title ' + (isWinner ? 'victory' : 'defeat');
        document.getElementById('game-over-subtitle').textContent = isWinner ? 'FÉLICITATIONS' : 'MEILLEURE CHANCE LA PROCHAINE FOIS';
        document.getElementById('game-over-player-name').textContent   = pName;
        document.getElementById('game-over-opponent-name').textContent = oName;
        document.getElementById('game-over-player-score').textContent   = '$' + devPlayerScore;
        document.getElementById('game-over-opponent-score').textContent = '$' + devOpponentScore;
        document.getElementById('game-over-player').classList.toggle('winner', isWinner);
        document.getElementById('game-over-opponent').classList.toggle('winner', !isWinner);

        const modal = document.getElementById('game-over-modal');
        modal.classList.add('show');
        gsap.from('.game-over-card', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(1.4)' });

        document.getElementById('game-over-replay').onclick = () => {
            modal.classList.remove('show');
            devPlayerScore = 0; devOpponentScore = 0;
            devChipRow = 0; devChipCol = 0;
        };
    }

    function victory() { devOpponentScore = Math.max(0, devPlayerScore - 300); _showModal(true);  }
    function defeat()  { devOpponentScore = devPlayerScore + 300;               _showModal(false); }

    return { myTurn, opponentTurn, addScore, placeChip, victory, defeat };
})();
