/* ============================================
   UI MANAGER
   Score panels, choices, timers, buttons
   ============================================ */

const UIManager = (() => {
    const TURN_DURATION = 30;

    // Grid labels for score panels
    const SCORE_LABELS = [
        { id: 'brelan1', label: 'As' },
        { id: 'brelan2', label: 'Deux' },
        { id: 'brelan3', label: 'Trois' },
        { id: 'brelan4', label: 'Quatre' },
        { id: 'brelan5', label: 'Cinq' },
        { id: 'brelan6', label: 'Six' },
        { id: 'full', label: 'Full' },
        { id: 'carre', label: 'Carré' },
        { id: 'yam', label: 'Yam' },
        { id: 'suite', label: 'Suite' },
        { id: 'moinshuit', label: '≤8' },
        { id: 'sec', label: 'Sec' },
        { id: 'defi', label: 'Défi' }
    ];

    let onChoiceSelectedCallback = null;
    let onGridCellSelectedCallback = null;
    let currentSelectedChoice = null;

    function init() {
        buildScorePanels();
    }

    function buildScorePanels() {
        const playerGrid = document.getElementById('player-grid');
        const opponentGrid = document.getElementById('opponent-grid');

        SCORE_LABELS.forEach(item => {
            playerGrid.appendChild(createScoreRow(item, 'player'));
            opponentGrid.appendChild(createScoreRow(item, 'opponent'));
        });
    }

    function createScoreRow(item, side) {
        const row = document.createElement('div');
        row.className = 'score-row';
        row.id = `${side}-${item.id}`;
        row.innerHTML = `
            <span class="label">${item.label}</span>
            <span class="value">—</span>
        `;
        return row;
    }

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
            const circumference = 2 * Math.PI * 18; // r=18
            const offset = circumference * (1 - time / TURN_DURATION);
            circle.style.strokeDashoffset = offset;

            if (time <= 5) {
                circle.classList.add('urgent');
            } else {
                circle.classList.remove('urgent');
            }
        } else {
            text.textContent = '--';
            circle.style.strokeDashoffset = 0;
            circle.classList.remove('urgent');
        }
    }

    // ---- Roll Counter ----
    function updateRollCounter(current, max) {
        const el = document.getElementById('roll-counter');
        el.textContent = `LANCE ${current}/${max}`;
    }

    // ---- Turn Indicator ----
    function setTurnIndicator(isYourTurn) {
        Animations.flashTurnIndicator(isYourTurn ? 'VOTRE TOUR' : 'TOUR ADVERSAIRE');
    }

    // ---- Roll Button ----
    function setRollButtonState(enabled, rollsCounter) {
        const btn = document.getElementById('btn-roll');
        btn.disabled = !enabled;

        if (rollsCounter === 0) {
            btn.querySelector('.btn-text').textContent = 'LANCER';
        } else {
            btn.querySelector('.btn-text').textContent = 'RELANCER';
        }

        if (enabled) {
            Animations.pulseButton(btn);
        } else {
            Animations.stopPulse(btn);
        }
    }

    // ---- Validate Button ----
    function showValidateButton(show) {
        const btn = document.getElementById('btn-validate');
        if (show) {
            btn.classList.remove('hidden');
            btn.disabled = false;
        } else {
            btn.classList.add('hidden');
            btn.disabled = true;
        }
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

            card.innerHTML = `
                <div class="choice-name">${choice.value}</div>
                <div class="choice-points">${getChoicePoints(choice.id)}</div>
            `;

            card.addEventListener('click', () => {
                if (canMakeChoice && onChoiceSelectedCallback) {
                    onChoiceSelectedCallback(choice.id);
                }
            });

            container.appendChild(card);
        });

        Animations.showChoicesBar();
    }

    function getChoicePoints(choiceId) {
        const pointsMap = {
            'brelan1': '3 pts', 'brelan2': '6 pts', 'brelan3': '9 pts',
            'brelan4': '12 pts', 'brelan5': '15 pts', 'brelan6': '18 pts',
            'full': '25 pts', 'carre': '30 pts', 'yam': '50 pts',
            'suite': '40 pts', 'moinshuit': '≤8 pts', 'sec': 'Sec',
            'defi': 'Défi'
        };
        return pointsMap[choiceId] || '';
    }

    // ---- Grid ----
    function updateGrid(grid, canSelectCells, idPlayer) {
        if (!grid) return;

        CasinoTable.resetCellHighlights();

        grid.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                // Update table 3D cells
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

    function onChoiceSelected(callback) {
        onChoiceSelectedCallback = callback;
    }

    function onGridCellSelected(callback) {
        onGridCellSelectedCallback = callback;
    }

    function getOnGridCellSelectedCallback() {
        return onGridCellSelectedCallback;
    }

    // ---- Scores ----
    function updateScores(playerScore, opponentScore) {
        document.getElementById('player-score').textContent = playerScore || 0;
        document.getElementById('opponent-score').textContent = opponentScore || 0;
    }

    // ---- Queue Overlay ----
    function showQueueOverlay(show) {
        const overlay = document.getElementById('queue-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
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
        setRollButtonState, showValidateButton,
        updateChoices, updateGrid,
        onChoiceSelected, onGridCellSelected, getOnGridCellSelectedCallback,
        updateScores, showQueueOverlay, setConnectionStatus, setQueueButtons,
        updateLoading, hideLoading
    };
})();
