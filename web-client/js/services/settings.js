/* ============================================
   SETTINGS SERVICE
   Language (FR/EN) + Music + SFX
   ============================================ */

const Settings = (() => {

    // ---- Persistent state ----
    const state = {
        lang:      localStorage.getItem('yams_lang')   || 'fr',
        musicVol:  parseFloat(localStorage.getItem('yams_mvol')  ?? 0.4),
        sfxVol:    parseFloat(localStorage.getItem('yams_sfxvol') ?? 0.6),
        musicOn:   localStorage.getItem('yams_mon')  !== 'false',
        sfxOn:     localStorage.getItem('yams_sfxon') !== 'false',
    };

    // ---- Music : 05 Let Your Spirit Free (plays everywhere) ----
    let _audio = null;

    function _getAudio() {
        if (!_audio) {
            _audio = new Audio('/sound/05 Let Your Spirit Free.mp3');
            _audio.loop = true;
        }
        return _audio;
    }

    function playMusic() {
        if (!state.musicOn) return;
        const audio = _getAudio();
        audio.volume = state.musicVol;
        if (audio.paused) audio.currentTime = 10;
        audio.play().catch(() => {});
    }

    function stopMusic() {
        if (_audio) { _audio.pause(); _audio.currentTime = 0; }
    }

    function _syncMusicVolume() {
        if (_audio) {
            _audio.volume = state.musicOn ? state.musicVol : 0;
            if (!state.musicOn) _audio.pause();
            else if (_audio.paused) _audio.play().catch(() => {});
        }
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
            'btn-ranking':      '🏆 CLASSEMENT',
            'submenu-friend':   'JOUER AVEC UN AMI',
            'btn-create-room':  'CRÉER UNE PARTIE',
            'code-label':       'CODE DE LA PARTIE',
            'waiting-opponent': "En attente de l'adversaire",
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
            'btn-reroll-text':  'RELANCER',
            'btn-validate-text':'VALIDER',
            'turn-yours':       'VOTRE TOUR',
            'turn-wait':        'EN ATTENTE',
            'connected':        'Connecté',
            'disconnected':     'Déconnecté. Reconnexion...',
            'rules-btn':        '📖 RÈGLES DU JEU',
            'settings-btn':     '⚙ PARAMÈTRES',
            'settings-title':   'PARAMÈTRES',
            'lang-label':       '🌐 LANGUE',
            'music-lbl':        '🎵 Musique',
            'sfx-lbl':          '🎲 Effets sonores',
            'rank-info-title':  'SYSTÈME DE RANGS',
            'rank-info-sub':    '+$550 par victoire · Perte selon le rang',
            'rank-tous':        'TOUS',
            'rank-header-rank': 'RANG',
            'rank-header-player':'JOUEUR',
            'rank-header-score':'SOLDE',
            'rank-header-record':'V · D',
            'rank-empty':       'Aucun joueur dans ce rang',
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
            'btn-ranking':      '🏆 LEADERBOARD',
            'submenu-friend':   'PLAY WITH A FRIEND',
            'btn-create-room':  'CREATE A GAME',
            'code-label':       'GAME CODE',
            'waiting-opponent': 'Waiting for opponent',
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
            'btn-reroll-text':  'REROLL',
            'btn-validate-text':'VALIDATE',
            'turn-yours':       'YOUR TURN',
            'turn-wait':        'WAITING',
            'connected':        'Connected',
            'disconnected':     'Disconnected. Reconnecting...',
            'rules-btn':        '📖 GAME RULES',
            'settings-btn':     '⚙ SETTINGS',
            'settings-title':   'SETTINGS',
            'lang-label':       '🌐 LANGUAGE',
            'music-lbl':        '🎵 Music',
            'sfx-lbl':          '🎲 Sound effects',
            'rank-info-title':  'RANK SYSTEM',
            'rank-info-sub':    '+$550 per win · Loss depends on rank',
            'rank-tous':        'ALL',
            'rank-header-rank': 'RANK',
            'rank-header-player':'PLAYER',
            'rank-header-score':'BALANCE',
            'rank-header-record':'W · L',
            'rank-empty':       'No players in this rank',
        },
    };

    function t(key) {
        return (T[state.lang] || T.fr)[key] || key;
    }

    function applyLang(lang) {
        state.lang = lang;
        localStorage.setItem('yams_lang', lang);

        const set    = (sel, key) => { const el = document.querySelector(sel); if (el && T[lang][key] !== undefined) el.textContent = T[lang][key]; };
        const setAll = (sel, key) => document.querySelectorAll(sel).forEach(el => { if (T[lang][key] !== undefined) el.textContent = T[lang][key]; });
        const setPH  = (sel, key) => { const el = document.querySelector(sel); if (el && T[lang][key] !== undefined) el.placeholder = T[lang][key]; };

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
        if (bl) bl.textContent = T[lang]['btn-login-text'];
        const br = document.querySelector('#btn-register span:first-child');
        if (br) br.textContent = T[lang]['btn-reg-text'];

        // Menu
        set('#btn-join-queue .mbtn-text',   'btn-online');
        set('#btn-play-friend .mbtn-text',  'btn-friend');
        set('#btn-play-bot .mbtn-text',     'btn-bot');
        set('#btn-ranking',                 'btn-ranking');
        set('#menu-friend .submenu-title',  'submenu-friend');
        set('#btn-create-room',             'btn-create-room');
        set('.code-label',                  'code-label');
        set('#room-waiting-dots',           'waiting-opponent');
        set('#btn-join-room',               'btn-join-room');
        set('#btn-back-friend',             'btn-back-friend');
        set('#btn-back-bot',                'btn-back-bot');
        set('#menu-bot .submenu-title',     'submenu-bot');
        set('#menu-waiting .submenu-title', 'submenu-waiting');
        set('#btn-leave-queue',             'btn-cancel');

        ['easy','medium','hard'].forEach(d => {
            const n = document.querySelector(`.menu-btn.difficulty[data-diff="${d}"] .diff-name`);
            const x = document.querySelector(`.menu-btn.difficulty[data-diff="${d}"] .diff-desc`);
            if (n) n.textContent = T[lang][`diff-${d}`];
            if (x) x.textContent = T[lang][`diff-${d}-desc`];
        });

        // Leaderboard filter "TOUS / ALL"
        const tousBtn = document.querySelector('.rank-filter-btn[data-rank="all"]');
        if (tousBtn) tousBtn.textContent = T[lang]['rank-tous'];

        // Rank info popup
        set('#rank-info-title', 'rank-info-title');
        set('.rank-info-sub',   'rank-info-sub');

        // Game buttons
        const rollBtn = document.querySelector('#btn-roll .btn-text');
        if (rollBtn) rollBtn.textContent = T[lang]['btn-roll-text'];
        const valBtn = document.querySelector('#btn-validate .btn-text');
        if (valBtn) valBtn.textContent = T[lang]['btn-validate-text'];

        // Shared corner buttons
        setAll('.rules-login-btn',   'rules-btn');
        setAll('.settings-open-btn', 'settings-btn');

        // Settings panel
        set('#settings-panel-title', 'settings-title');
        set('#settings-lang-label',  'lang-label');
        set('#settings-music-label', 'music-lbl');
        set('#settings-sfx-label',   'sfx-lbl');

        // Lang button active state
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    }

    function _save() {
        localStorage.setItem('yams_mvol',   state.musicVol);
        localStorage.setItem('yams_sfxvol', state.sfxVol);
        localStorage.setItem('yams_mon',    state.musicOn);
        localStorage.setItem('yams_sfxon',  state.sfxOn);
    }

    function init() {
        // Music volume slider
        const volM = document.getElementById('vol-music');
        if (volM) { volM.value = state.musicVol; volM.addEventListener('input', () => { state.musicVol = parseFloat(volM.value); _syncMusicVolume(); _save(); }); }

        // SFX volume slider
        const volSFX = document.getElementById('vol-sfx');
        if (volSFX) { volSFX.value = state.sfxVol; volSFX.addEventListener('input', () => { state.sfxVol = parseFloat(volSFX.value); if (typeof SoundManager !== 'undefined') { SoundManager.setVolume(state.sfxVol); } _save(); }); }

        // Music toggle
        const togM = document.getElementById('toggle-music');
        if (togM) { togM.checked = state.musicOn; togM.addEventListener('change', () => { state.musicOn = togM.checked; _syncMusicVolume(); _save(); }); }

        // SFX toggle
        const togSFX = document.getElementById('toggle-sfx');
        if (togSFX) { togSFX.checked = state.sfxOn; togSFX.addEventListener('change', () => { state.sfxOn = togSFX.checked; if (typeof SoundManager !== 'undefined') { SoundManager.setEnabled(state.sfxOn); } _save(); }); }

        // Language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => applyLang(btn.dataset.lang)));

        // Open / close settings panel
        document.querySelectorAll('.settings-open-btn').forEach(btn => btn.addEventListener('click', () => document.getElementById('settings-overlay').classList.remove('hidden')));
        document.getElementById('btn-close-settings')?.addEventListener('click', () => document.getElementById('settings-overlay').classList.add('hidden'));
        document.getElementById('settings-overlay')?.addEventListener('click', e => { if (e.target.id === 'settings-overlay') document.getElementById('settings-overlay').classList.add('hidden'); });

        // Apply saved language
        applyLang(state.lang);
        if (typeof SoundManager !== 'undefined') {
            SoundManager.setVolume(state.sfxVol);
            SoundManager.setEnabled(state.sfxOn);
        }

        // Start music on first user interaction
        const startMusic = () => { playMusic(); document.removeEventListener('click', startMusic); };
        document.addEventListener('click', startMusic);
    }

    return { state, t, init, applyLang, playMusic, stopMusic };
})();
