const GameUIHandlers = {
    setup(state) {
        // ---- Login tabs ----
        const loginTabs = document.querySelectorAll('.login-tab');
        loginTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                loginTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const which = tab.dataset.tab;
                document.getElementById('login-form').classList.toggle('hidden', which !== 'login');
                document.getElementById('register-form').classList.toggle('hidden', which !== 'register');
                document.getElementById('login-error').classList.add('hidden');
            });
        });

        // ---- Login submit ----
        document.getElementById('btn-login').addEventListener('click', () => {
            const u = document.getElementById('login-username').value.trim();
            const p = document.getElementById('login-password').value;
            if (!u || u.length < 2) { _loginError('Nom trop court'); return; }
            if (!p || p.length < 4) { _loginError('Mot de passe trop court'); return; }
            SocketClient.userLogin(u, p);
        });

        // Avatar selection
        let selectedAvatar = '🎲';
        document.querySelectorAll('.avatar-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAvatar = btn.dataset.avatar;
            });
        });

        document.getElementById('btn-register').addEventListener('click', () => {
            const u = document.getElementById('reg-username').value.trim();
            const p = document.getElementById('reg-password').value;
            if (!u || u.length < 2) { _loginError('Nom trop court (2 min)'); return; }
            if (!p || p.length < 4) { _loginError('Mot de passe trop court (4 min)'); return; }
            SocketClient.userRegister(u, p, selectedAvatar);
        });

        function _loginError(msg) {
            const el = document.getElementById('login-error');
            el.textContent = msg;
            el.classList.remove('hidden');
            gsap.from(el, { x: -8, duration: 0.3, ease: 'power2.out' });
        }

        // Enter key on login/register inputs
        ['login-username','login-password'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-login').click(); });
        });
        ['reg-username','reg-password'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-register').click(); });
        });

        document.getElementById('btn-ranking').addEventListener('click', () => {
            document.getElementById('ranking-overlay').classList.remove('hidden');
            SocketClient.getRankingList();
        });

        document.getElementById('btn-close-ranking').addEventListener('click', () => {
            document.getElementById('ranking-overlay').classList.add('hidden');
        });

        // ---- Menu navigation ----
        const showSection = (id) => {
            ['menu-main','menu-friend','menu-bot','menu-waiting'].forEach(s => {
                const el = document.getElementById(s);
                if (el) el.classList.toggle('hidden', s !== id);
            });
        };

        document.getElementById('btn-play-friend').addEventListener('click', () => showSection('menu-friend'));
        document.getElementById('btn-play-bot').addEventListener('click', () => showSection('menu-bot'));
        document.getElementById('btn-back-friend').addEventListener('click', () => showSection('menu-main'));
        document.getElementById('btn-back-bot').addEventListener('click', () => showSection('menu-main'));

        // Play online
        document.getElementById('btn-join-queue').addEventListener('click', () => {
            SocketClient.joinQueue();
            showSection('menu-waiting');
            state.inQueue = true;
        });

        // Leave queue
        document.getElementById('btn-leave-queue').addEventListener('click', () => {
            SocketClient.leaveQueue();
            showSection('menu-main');
            state.inQueue = false;
        });

        // Bot difficulty
        document.querySelectorAll('.menu-btn.difficulty').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.diff;
                SocketClient.joinBot(diff);
                showSection('menu-waiting');
            });
        });

        // Create room
        document.getElementById('btn-create-room').addEventListener('click', () => {
            SocketClient.createRoom();
            document.getElementById('room-code-display').classList.remove('hidden');
            document.getElementById('btn-create-room').classList.add('hidden');
        });

        // Join room
        document.getElementById('btn-join-room').addEventListener('click', () => {
            const code = document.getElementById('room-code-input').value.trim().toUpperCase();
            if (code.length < 4) return;
            document.getElementById('room-error').classList.add('hidden');
            SocketClient.joinRoom(code);
        });

        document.getElementById('room-code-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('btn-join-room').click();
        });

        document.getElementById('btn-roll').addEventListener('click', () => {
            if (!state.isMyTurn || state.isRolling) return;
            state.isRolling = true; state.hasRolledThisTurn = true; state.pendingServerDices = null; state.scatterCallback = null;
            UIManager.setRollButtonState(false, state.rollsCounter);
            SocketClient.rollDice(); SoundManager.play('roll');

            const dices  = DiceSystem.getDiceMeshes();
            const states = DiceSystem.getDiceStates();
            const gen    = state.animGeneration;

            const doScatter = (serverDices) => {
                if (state.animGeneration !== gen) return;
                Animations.rollDice(dices, states, serverDices.map(sd => sd.value), () => {
                    if (state.animGeneration !== gen) return;
                    state.isRolling = false;
                    DiceSystem.updateDiceFromServer(serverDices, true);
                });
            };

            DiceCup.animateRoll(true, dices, states, () => {
                if (state.animGeneration !== gen) return;
                if (state.pendingServerDices) { doScatter(state.pendingServerDices); state.pendingServerDices = null; }
                else                          { state.scatterCallback = doScatter; }
            });
        });

        document.getElementById('btn-validate').addEventListener('click', () => {
            if (!state.selectedGridCell || !state.selectedChoice) return;
            state.animGeneration++;
            state.isRolling = false; state.scatterCallback = null; state.pendingServerDices = null;
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
