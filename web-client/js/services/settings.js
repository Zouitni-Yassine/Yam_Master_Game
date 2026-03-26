/* ============================================
   SETTINGS SERVICE
   Language (FR/EN) + Music + SFX volume
   ============================================ */

const Settings = (() => {

    // ---- Persistent state ----
    const state = {
        lang:         localStorage.getItem('yams_lang')   || 'fr',
        musicMenuVol: parseFloat(localStorage.getItem('yams_mmvol')  ?? 0.35),
        musicGameVol: parseFloat(localStorage.getItem('yams_mgvol')  ?? 0.30),
        sfxVol:       parseFloat(localStorage.getItem('yams_sfxvol') ?? 0.60),
        musicMenuOn:  localStorage.getItem('yams_mmon')  !== 'false',
        musicGameOn:  localStorage.getItem('yams_mgon')  !== 'false',
        sfxOn:        localStorage.getItem('yams_sfxon') !== 'false',
    };

    // ---- Music (HTML Audio) ----
    let menuMusic = null, gameMusic = null;

    function _initAudio() {
        if (menuMusic) return;
        try { menuMusic = new Audio('/sounds/music-menu.mp3'); menuMusic.loop = true; } catch(e) {}
        try { gameMusic = new Audio('/sounds/music-game.mp3'); gameMusic.loop = true; } catch(e) {}
    }

    function _applyVolumes() {
        if (menuMusic) menuMusic.volume = state.musicMenuOn ? Math.min(1, Math.max(0, state.musicMenuVol)) : 0;
        if (gameMusic) gameMusic.volume = state.musicGameOn ? Math.min(1, Math.max(0, state.musicGameVol)) : 0;
    }

    function playMenuMusic() {
        _initAudio();
        if (gameMusic) gameMusic.pause();
        if (!menuMusic) return;
        _applyVolumes();
        menuMusic.play().catch(() => {});
    }

    function stopMenuMusic() {
        if (menuMusic) { menuMusic.pause(); menuMusic.currentTime = 0; }
    }

    function playGameMusic() {
        _initAudio();
        if (menuMusic) menuMusic.pause();
        if (!gameMusic) return;
        _applyVolumes();
        gameMusic.play().catch(() => {});
    }

    function stopGameMusic() {
        if (gameMusic) { gameMusic.pause(); gameMusic.currentTime = 0; }
    }

    // ---- Translations ----
    const T = {
        fr: {
            'brand-sub':        'TABLE PRIVÉE · ACCÈS MEMBRES',
            'tab-login':        'CONNEXION',
            'tab-register':     'INSCRIPTION',
            'ph-username':      "Nom d'utilisateur",
            'ph-password':      'Mot de passe',
            'ph-firstname':     'Prénom',
            'ph-lastname':      'Nom',
            'ph-pseudo':        'Pseudo (affiché en jeu)',
            'ph-email':         'Email',
            'ph-pwd':           'Mot de passe (min. 8)',
            'ph-pwd-confirm':   'Confirmer',
            'avatar-label':     'CHOISIR UN AVATAR',
            'btn-upload':       '📁 Importer une photo',
            'avatar-or':        '— ou choisir —',
            'btn-login-text':   'ENTRER AU CASINO',
            'btn-reg-text':     'CRÉER MON COMPTE',
            'btn-online':       'JOUER EN LIGNE',
            'btn-friend':       'JOUER AVEC UN AMI',
            'btn-bot':          'JOUER CONTRE LE DICE KING',
            'submenu-friend':   'JOUER AVEC UN AMI',
            'btn-create-room':  'CRÉER UNE PARTIE',
            'code-label':       'CODE DE LA PARTIE',
            'btn-join-room':    'REJOINDRE',
            'btn-back-friend':  '← RETOUR',
            'btn-back-bot':     '← RETOUR',
            'submenu-bot':      'CHOISIR LA DIFFICULTÉ DU DICE KING',
            'diff-easy':        'FACILE',
            'diff-easy-desc':   "Pour s'échauffer",
            'diff-medium':      'MOYEN',
            'diff-medium-desc': 'Un vrai défi',
            'diff-hard':        'DIFFICILE',
            'diff-hard-desc':   'Bonne chance...',
            'submenu-waiting':  'EN ATTENTE',
            'waiting-search':   "Recherche d'un adversaire",
            'btn-cancel':       'ANNULER',
            'btn-roll-text':    'LANCER',
            'btn-validate-text':'VALIDER',
            'rules-btn':        '📖 RÈGLES DU JEU',
            'settings-btn':     '⚙ PARAMÈTRES',
            'settings-title':   'PARAMÈTRES',
            'lang-label':       '🌐 LANGUE',
            'music-menu-lbl':   '🎵 Musique menu',
            'music-game-lbl':   '🎮 Musique jeu',
            'sfx-lbl':          '🎲 Effets sonores',
        },
        en: {
            'brand-sub':        'PRIVATE TABLE · MEMBERS ONLY',
            'tab-login':        'LOGIN',
            'tab-register':     'REGISTER',
            'ph-username':      'Username',
            'ph-password':      'Password',
            'ph-firstname':     'First name',
            'ph-lastname':      'Last name',
            'ph-pseudo':        'Nickname (shown in game)',
            'ph-email':         'Email',
            'ph-pwd':           'Password (min. 8)',
            'ph-pwd-confirm':   'Confirm',
            'avatar-label':     'CHOOSE AN AVATAR',
            'btn-upload':       '📁 Upload a photo',
            'avatar-or':        '— or choose —',
            'btn-login-text':   'ENTER CASINO',
            'btn-reg-text':     'CREATE ACCOUNT',
            'btn-online':       'PLAY ONLINE',
            'btn-friend':       'PLAY WITH A FRIEND',
            'btn-bot':          'PLAY VS DICE KING',
            'submenu-friend':   'PLAY WITH A FRIEND',
            'btn-create-room':  'CREATE A GAME',
            'code-label':       'GAME CODE',
            'btn-join-room':    'JOIN',
            'btn-back-friend':  '← BACK',
            'btn-back-bot':     '← BACK',
            'submenu-bot':      'CHOOSE DICE KING DIFFICULTY',
            'diff-easy':        'EASY',
            'diff-easy-desc':   'Warm up',
            'diff-medium':      'MEDIUM',
            'diff-medium-desc': 'A real challenge',
            'diff-hard':        'HARD',
            'diff-hard-desc':   'Good luck...',
            'submenu-waiting':  'WAITING',
            'waiting-search':   'Searching for an opponent',
            'btn-cancel':       'CANCEL',
            'btn-roll-text':    'ROLL',
            'btn-validate-text':'VALIDATE',
            'rules-btn':        '📖 GAME RULES',
            'settings-btn':     '⚙ SETTINGS',
            'settings-title':   'SETTINGS',
            'lang-label':       '🌐 LANGUAGE',
            'music-menu-lbl':   '🎵 Menu music',
            'music-game-lbl':   '🎮 Game music',
            'sfx-lbl':          '🎲 Sound effects',
        }
    };

    function applyLang(lang) {
        state.lang = lang;
        localStorage.setItem('yams_lang', lang);
        const t = T[lang];

        const set    = (sel, key) => { const el = document.querySelector(sel); if (el && t[key] !== undefined) el.textContent = t[key]; };
        const setAll = (sel, key) => document.querySelectorAll(sel).forEach(el => { if (t[key] !== undefined) el.textContent = t[key]; });
        const setPH  = (sel, key) => { const el = document.querySelector(sel); if (el && t[key] !== undefined) el.placeholder = t[key]; };

        // Login
        set('.login-brand-sub',               'brand-sub');
        set('.login-tab[data-tab="login"]',    'tab-login');
        set('.login-tab[data-tab="register"]', 'tab-register');
        setPH('#login-username',               'ph-username');
        setPH('#login-password',               'ph-password');
        setPH('#reg-firstname',                'ph-firstname');
        setPH('#reg-lastname',                 'ph-lastname');
        setPH('#reg-username',                 'ph-pseudo');
        setPH('#reg-email',                    'ph-email');
        setPH('#reg-password',                 'ph-pwd');
        setPH('#reg-password-confirm',         'ph-pwd-confirm');
        set('.avatar-picker-label',            'avatar-label');
        set('#btn-upload-avatar',              'btn-upload');
        set('.avatar-divider',                 'avatar-or');
        const bl = document.querySelector('#btn-login span:first-child');
        if (bl) bl.textContent = t['btn-login-text'];
        const br = document.querySelector('#btn-register span:first-child');
        if (br) br.textContent = t['btn-reg-text'];

        // Menu
        set('#btn-join-queue .mbtn-text',   'btn-online');
        set('#btn-play-friend .mbtn-text',  'btn-friend');
        set('#btn-play-bot .mbtn-text',     'btn-bot');
        set('#menu-friend .submenu-title',  'submenu-friend');
        set('#btn-create-room',             'btn-create-room');
        set('.code-label',                  'code-label');
        set('#btn-join-room',               'btn-join-room');
        set('#btn-back-friend',             'btn-back-friend');
        set('#btn-back-bot',                'btn-back-bot');
        set('#menu-bot .submenu-title',     'submenu-bot');
        set('#menu-waiting .submenu-title', 'submenu-waiting');
        set('#btn-leave-queue',             'btn-cancel');

        ['easy','medium','hard'].forEach(d => {
            const n = document.querySelector(`.menu-btn.difficulty[data-diff="${d}"] .diff-name`);
            const x = document.querySelector(`.menu-btn.difficulty[data-diff="${d}"] .diff-desc`);
            if (n) n.textContent = t[`diff-${d}`];
            if (x) x.textContent = t[`diff-${d}-desc`];
        });

        // Game buttons
        const rollText = document.querySelector('#btn-roll .btn-text');
        if (rollText) rollText.textContent = t['btn-roll-text'];
        const valText = document.querySelector('#btn-validate .btn-text');
        if (valText) valText.textContent = t['btn-validate-text'];

        // Shared corner buttons
        setAll('.rules-login-btn',   'rules-btn');
        setAll('.settings-open-btn', 'settings-btn');

        // Settings panel labels
        set('#settings-panel-title', 'settings-title');
        set('#settings-lang-label',  'lang-label');
        set('#settings-mm-label',    'music-menu-lbl');
        set('#settings-mg-label',    'music-game-lbl');
        set('#settings-sfx-label',   'sfx-lbl');

        // Lang toggle active state
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    }

    function _save() {
        localStorage.setItem('yams_mmvol',  state.musicMenuVol);
        localStorage.setItem('yams_mgvol',  state.musicGameVol);
        localStorage.setItem('yams_sfxvol', state.sfxVol);
        localStorage.setItem('yams_mmon',   state.musicMenuOn);
        localStorage.setItem('yams_mgon',   state.musicGameOn);
        localStorage.setItem('yams_sfxon',  state.sfxOn);
    }

    function init() {
        // Volume sliders
        const volMM = document.getElementById('vol-music-menu');
        if (volMM) {
            volMM.value = state.musicMenuVol;
            volMM.addEventListener('input', () => { state.musicMenuVol = parseFloat(volMM.value); _applyVolumes(); _save(); });
        }
        const volMG = document.getElementById('vol-music-game');
        if (volMG) {
            volMG.value = state.musicGameVol;
            volMG.addEventListener('input', () => { state.musicGameVol = parseFloat(volMG.value); _applyVolumes(); _save(); });
        }
        const volSFX = document.getElementById('vol-sfx');
        if (volSFX) {
            volSFX.value = state.sfxVol;
            volSFX.addEventListener('input', () => {
                state.sfxVol = parseFloat(volSFX.value);
                if (typeof SoundManager !== 'undefined') SoundManager.setVolume(state.sfxVol);
                _save();
            });
        }

        // Toggle checkboxes
        const togMM = document.getElementById('toggle-music-menu');
        if (togMM) {
            togMM.checked = state.musicMenuOn;
            togMM.addEventListener('change', () => { state.musicMenuOn = togMM.checked; _applyVolumes(); _save(); });
        }
        const togMG = document.getElementById('toggle-music-game');
        if (togMG) {
            togMG.checked = state.musicGameOn;
            togMG.addEventListener('change', () => { state.musicGameOn = togMG.checked; _applyVolumes(); _save(); });
        }
        const togSFX = document.getElementById('toggle-sfx');
        if (togSFX) {
            togSFX.checked = state.sfxOn;
            togSFX.addEventListener('change', () => {
                state.sfxOn = togSFX.checked;
                if (typeof SoundManager !== 'undefined') SoundManager.setEnabled(state.sfxOn);
                _save();
            });
        }

        // Language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => applyLang(btn.dataset.lang)));

        // Open settings buttons (both screens)
        document.querySelectorAll('.settings-open-btn').forEach(btn => btn.addEventListener('click', () => {
            document.getElementById('settings-overlay').classList.remove('hidden');
        }));

        // Close settings
        document.getElementById('btn-close-settings')?.addEventListener('click', () => {
            document.getElementById('settings-overlay').classList.add('hidden');
        });
        document.getElementById('settings-overlay')?.addEventListener('click', e => {
            if (e.target.id === 'settings-overlay') document.getElementById('settings-overlay').classList.add('hidden');
        });

        // Apply saved state
        applyLang(state.lang);
        if (typeof SoundManager !== 'undefined') {
            SoundManager.setVolume(state.sfxVol);
            SoundManager.setEnabled(state.sfxOn);
        }

        // Play menu music on first user interaction (browser policy)
        const startMenuMusic = () => { playMenuMusic(); document.removeEventListener('click', startMenuMusic); };
        document.addEventListener('click', startMenuMusic);
    }

    return { state, init, applyLang, playMenuMusic, stopMenuMusic, playGameMusic, stopGameMusic };
})();
