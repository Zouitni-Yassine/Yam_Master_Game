/* ============================================
   UI MANAGER
   Score panels, choices, timers, buttons
   ============================================ */

const UIManager = (() => {
    const TURN_DURATION = 30;

    let onChoiceSelectedCallback = null;
    let onGridCellSelectedCallback = null;
    let currentSelectedChoice = null;

    function init() {}

    // ---- Timer ----
    function updateTimer(playerTime, opponentTime) {
        updateTimerRing('player', playerTime);
        updateTimerRing('opponent', opponentTime);
    }

    function updateTimerRing(who, time) {
        const circle = document.getElementById(`${who}-timer-circle`);
        const text = document.getElementById(`${who}-timer-text`);

        if (time > 0) {
            text.textContent = time;
            const circumference = 2 * Math.PI * 18;
            const offset = circumference * (1 - time / TURN_DURATION);
            circle.style.strokeDashoffset = offset;
            circle.classList.toggle('urgent', time <= 5);
        } else {
            text.textContent = '--';
            circle.style.strokeDashoffset = 0;
            circle.classList.remove('urgent');
        }
    }

    // ---- Roll Counter ----
    function updateRollCounter(current, max) {
        document.getElementById('roll-counter').textContent = `LANCE ${current}/${max}`;
    }

    // ---- Turn Indicator ----
    function setTurnIndicator(isYourTurn) {
        Animations.flashTurnIndicator(isYourTurn ? 'VOTRE TOUR' : 'EN ATTENTE');
        const glow = document.getElementById('turn-glow');
        if (glow) {
            glow.classList.toggle('my-turn', isYourTurn === true);
            glow.classList.toggle('opponent-turn', isYourTurn === false);
        }
    }

    // ---- Defi Button ----
    function hideDefiButton() {
        const card = document.getElementById('defi-card');
        if (card) { card.classList.add('hidden'); card.classList.remove('declared'); }
    }

    // ---- Roll Button ----
    function setRollButtonState(enabled, rollsCounter) {
        const btn = document.getElementById('btn-roll');
        btn.disabled = !enabled;
        btn.querySelector('.btn-text').textContent = rollsCounter === 0 ? 'LANCER' : 'RELANCER';

        if (enabled) {
            Animations.pulseButton(btn);
        } else {
            Animations.stopPulse(btn);
        }
    }

    // ---- Validate Button ----
    function showValidateButton(show) {
        const btn = document.getElementById('btn-validate');
        btn.classList.toggle('hidden', !show);
        btn.disabled = !show;
    }

    // ---- Choices ----
    function updateChoices(availableChoices, canMakeChoice, selectedChoiceId) {
        const container = document.getElementById('choices-container');
        container.innerHTML = '';
        currentSelectedChoice = selectedChoiceId;

        if (!availableChoices || availableChoices.length === 0) {
            Animations.hideChoicesBar();
            return;
        }

        availableChoices.forEach(choice => {
            const card = document.createElement('div');
            card.className = 'choice-card';
            if (!canMakeChoice) card.classList.add('disabled');
            if (choice.id === selectedChoiceId) card.classList.add('selected');

            card.innerHTML = `<div class="choice-name">${choice.value}</div>`;

            card.addEventListener('click', () => {
                if (canMakeChoice && onChoiceSelectedCallback) {
                    onChoiceSelectedCallback(choice.id);
                }
            });

            container.appendChild(card);
        });

        Animations.showChoicesBar();
    }

    // ---- Grid ----
    function updateGrid(grid, canSelectCells, idPlayer) {
        if (!grid) return;
        CasinoTable.resetCellHighlights();

        grid.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                if (cell.owner) {
                    const isPlayer = cell.owner === idPlayer;
                    CasinoTable.setCellOwner(rowIdx, colIdx, isPlayer ? 'player:1' : 'player:2');
                }
                if (cell.canBeChecked && canSelectCells) {
                    CasinoTable.highlightCell(rowIdx, colIdx, true);
                }
            });
        });
    }

    function onChoiceSelected(callback) { onChoiceSelectedCallback = callback; }
    function onGridCellSelected(callback) { onGridCellSelectedCallback = callback; }
    function getOnGridCellSelectedCallback() { return onGridCellSelectedCallback; }

    // ---- Queue Overlay ----
    function showQueueOverlay(show) {
        document.getElementById('queue-overlay').classList.toggle('hidden', !show);
        const gameBg = document.getElementById('game-bg');
        if (gameBg) gameBg.style.display = show ? 'none' : 'block';
    }

    function setConnectionStatus(text) {
        document.getElementById('connection-status').textContent = text;
    }

    function setQueueButtons(state) {
        const joinBtn = document.getElementById('btn-join-queue');
        const leaveBtn = document.getElementById('btn-leave-queue');
        const status = document.getElementById('queue-status');

        switch (state) {
            case 'connected':
                joinBtn.disabled = false;
                joinBtn.classList.remove('hidden');
                leaveBtn.classList.add('hidden');
                status.classList.add('hidden');
                break;
            case 'queued':
                joinBtn.classList.add('hidden');
                leaveBtn.classList.remove('hidden');
                status.classList.remove('hidden');
                break;
            case 'disconnected':
                joinBtn.disabled = true;
                joinBtn.classList.remove('hidden');
                leaveBtn.classList.add('hidden');
                status.classList.add('hidden');
                break;
        }
    }

    // ---- Loading ----
    function updateLoading(progress, text) {
        const fill = document.querySelector('.loader-fill');
        const label = document.querySelector('.loader-text');
        if (fill) fill.style.width = `${progress}%`;
        if (label && text) label.textContent = text;
    }

    function hideLoading() {
        const screen = document.getElementById('loading-screen');
        gsap.to(screen, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => screen.style.display = 'none'
        });
    }

    return {
        init, updateTimer, updateRollCounter, setTurnIndicator,
        setRollButtonState, showValidateButton, hideDefiButton,
        updateChoices, updateGrid,
        onChoiceSelected, onGridCellSelected, getOnGridCellSelectedCallback,
        showQueueOverlay, setConnectionStatus, setQueueButtons,
        updateLoading, hideLoading
    };
})();
