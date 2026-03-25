function showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    gsap.killTweensOf(el);
    gsap.fromTo(el,
        { opacity: 0, y: -16, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.4)',
          onComplete: () => {
              gsap.to(el, { opacity: 0, y: -10, duration: 0.5, delay: 3.5,
                  onComplete: () => el.classList.add('hidden') });
          }
        }
    );
}

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
        let selectedAvatar = '/logo/de.svg';

        function _setAvatarPreview(av) {
            const preview = document.getElementById('avatar-preview');
            if (!preview) return;
            if (av && (av.startsWith('data:') || av.startsWith('/'))) {
                preview.innerHTML = `<img src="${av}" style="width:100%;height:100%;object-fit:contain;border-radius:50%;mix-blend-mode:screen;">`;
            } else {
                preview.innerHTML = av || '🎲';
            }
        }

        // Init preview with default avatar
        _setAvatarPreview(selectedAvatar);

        document.querySelectorAll('.avatar-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAvatar = btn.dataset.avatar;
                _setAvatarPreview(selectedAvatar);
            });
        });

        // Image upload
        const fileInput = document.getElementById('avatar-file-input');
        document.getElementById('btn-upload-avatar')?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = 64; c.height = 64;
                    c.getContext('2d').drawImage(img, 0, 0, 64, 64);
                    selectedAvatar = c.toDataURL('image/jpeg', 0.82);
                    _setAvatarPreview(selectedAvatar);
                    // Deselect emoji buttons
                    document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            // Reset so same file can be re-selected
            e.target.value = '';
        });

        // Password strength meter
        document.getElementById('reg-password')?.addEventListener('input', e => {
            const bar   = document.getElementById('pwd-strength-bar');
            const label = document.getElementById('pwd-strength-label');
            const val   = e.target.value;
            let score = 0;
            if (val.length >= 8)  score++;
            if (val.length >= 12) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;
            const levels = [
                { pct: '0%',   color: '#666',    text: '' },
                { pct: '25%',  color: '#e74c3c', text: 'FAIBLE' },
                { pct: '50%',  color: '#e67e22', text: 'MOYEN' },
                { pct: '75%',  color: '#f1c40f', text: 'BON' },
                { pct: '90%',  color: '#2ecc71', text: 'FORT' },
                { pct: '100%', color: '#00e676', text: 'EXCELLENT' },
            ];
            const lv = levels[score] || levels[0];
            bar.style.setProperty('--strength', lv.pct);
            bar.style.setProperty('--strength-color', lv.color);
            label.style.setProperty('--strength-color', lv.color);
            label.textContent = lv.text;
        });

        document.getElementById('btn-register').addEventListener('click', () => {
            const firstname = document.getElementById('reg-firstname').value.trim();
            const lastname  = document.getElementById('reg-lastname').value.trim();
            const u         = document.getElementById('reg-username').value.trim();
            const email     = document.getElementById('reg-email').value.trim();
            const dob       = document.getElementById('reg-dob').value;
            const p         = document.getElementById('reg-password').value;
            const p2        = document.getElementById('reg-password-confirm').value;

            if (!firstname || firstname.length < 1) { _loginError('Prénom requis'); return; }
            if (!lastname  || lastname.length  < 1) { _loginError('Nom requis'); return; }
            if (!u || u.length < 2) { _loginError('Pseudo trop court (2 min)'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _loginError('Email invalide'); return; }
            if (!dob) { _loginError('Date de naissance requise'); return; }
            const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
            if (age < 13) { _loginError('Tu dois avoir au moins 13 ans'); return; }
            if (!p || p.length < 8) { _loginError('Mot de passe trop court (8 min)'); return; }
            if (p !== p2) { _loginError('Les mots de passe ne correspondent pas'); return; }

            SocketClient.userRegister(u, p, selectedAvatar, firstname, lastname, email, dob);
        });

        function _loginError(msg) { showLoginError(msg); }

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

        // Rank filter buttons
        document.querySelectorAll('.rank-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rank-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _rankFilter = btn.dataset.rank;
                _renderLeaderboard();
            });
        });

        document.getElementById('btn-close-ranking').addEventListener('click', () => {
            document.getElementById('ranking-overlay').classList.add('hidden');
        });

        document.getElementById('btn-rank-info').addEventListener('click', () => {
            document.getElementById('rank-info-overlay').classList.remove('hidden');
        });

        document.getElementById('btn-close-rank-info').addEventListener('click', () => {
            document.getElementById('rank-info-overlay').classList.add('hidden');
        });

        document.getElementById('rank-info-overlay').addEventListener('click', e => {
            if (e.target === document.getElementById('rank-info-overlay'))
                document.getElementById('rank-info-overlay').classList.add('hidden');
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
            UIManager.setQueueButtons('connected');
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
