/* ============================================
   SETTINGS SERVICE
   Language (FR/EN) + Procedural Music + SFX
   ============================================ */

const Settings = (() => {

    // ---- Persistent state ----
    const state = {
        lang:         localStorage.getItem('yams_lang')   || 'fr',
        musicMenuVol: parseFloat(localStorage.getItem('yams_mmvol')  ?? 0.4),
        musicGameVol: parseFloat(localStorage.getItem('yams_mgvol')  ?? 0.35),
        sfxVol:       parseFloat(localStorage.getItem('yams_sfxvol') ?? 0.6),
        musicMenuOn:  localStorage.getItem('yams_mmon')  !== 'false',
        musicGameOn:  localStorage.getItem('yams_mgon')  !== 'false',
        sfxOn:        localStorage.getItem('yams_sfxon') !== 'false',
    };

    // ---- Procedural Music Engine ----
    let _ctx = null;
    let _currentPlayer = null;
    let _currentType = null;

    const MUSIC_CFG = {
        menu: {
            // Cmaj7 chord spread across octaves
            chord: [65.4, 98.0, 164.8, 246.9],
            // C major pentatonic (C D E G A)
            scale: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
            chordGain: 0.016,
            noteGain: 0.04,
            noteDur: () => 0.5 + Math.random() * 0.8,
            noteGap: () => 700 + Math.random() * 1400,
        },
        game: {
            // Am7 chord — more tense
            chord: [55.0, 110.0, 164.8, 196.0],
            // A minor pentatonic (A C D E G)
            scale: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3],
            chordGain: 0.018,
            noteGain: 0.05,
            noteDur: () => 0.3 + Math.random() * 0.5,
            noteGap: () => 380 + Math.random() * 700,
        },
    };

    function _getCtx() {
        if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    }

    function _createPlayer(type, vol) {
        const ctx = _getCtx();
        const cfg = MUSIC_CFG[type];

        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2.5);
        master.connect(ctx.destination);

        // Sustained chord pad
        const padOscs = cfg.chord.map(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.value = cfg.chordGain;
            osc.connect(g);
            g.connect(master);
            osc.start();
            return osc;
        });

        // Melody scheduler
        let alive = true;
        let timer = null;

        const scheduleNote = () => {
            if (!alive) return;
            const freq = cfg.scale[Math.floor(Math.random() * cfg.scale.length)];
            const octave = Math.random() > 0.25 ? 1 : 2;
            const dur = cfg.noteDur();

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq * octave;

            const env = ctx.createGain();
            env.gain.setValueAtTime(0, ctx.currentTime);
            env.gain.linearRampToValueAtTime(cfg.noteGain, ctx.currentTime + 0.04);
            env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

            osc.connect(env);
            env.connect(master);
            osc.start();
            osc.stop(ctx.currentTime + dur);

            timer = setTimeout(scheduleNote, cfg.noteGap());
        };

        scheduleNote();

        return {
            type,
            fadeOut(cb) {
                alive = false;
                clearTimeout(timer);
                const cur = master.gain.value;
                master.gain.cancelScheduledValues(ctx.currentTime);
                master.gain.setValueAtTime(cur, ctx.currentTime);
                master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
                setTimeout(() => {
                    padOscs.forEach(o => { try { o.stop(); } catch(e) {} });
                    master.disconnect();
                    if (cb) cb();
                }, 1600);
            },
            setVolume(vol) {
                master.gain.cancelScheduledValues(ctx.currentTime);
                master.gain.setValueAtTime(vol, ctx.currentTime);
            },
        };
    }

    function _playMusic(type) {
        const on  = type === 'menu' ? state.musicMenuOn  : state.musicGameOn;
        const vol = type === 'menu' ? state.musicMenuVol : state.musicGameVol;

        if (_currentType === type) {
            // Already playing — just update volume
            if (_currentPlayer) _currentPlayer.setVolume(on ? vol : 0);
            return;
        }

        const startNew = () => {
            if (on && vol > 0) {
                _currentPlayer = _createPlayer(type, vol);
                _currentType = type;
            }
        };

        if (_currentPlayer) {
            _currentPlayer.fadeOut(startNew);
            _currentPlayer = null;
            _currentType = null;
        } else {
            startNew();
        }
    }

    function playMenuMusic() { _playMusic('menu'); }
    function stopMenuMusic()  {
        if (_currentType === 'menu' && _currentPlayer) {
            _currentPlayer.fadeOut();
            _currentPlayer = null;
            _currentType = null;
        }
    }
    function playGameMusic() { _playMusic('game'); }
    function stopGameMusic()  {
        if (_currentType === 'game' && _currentPlayer) {
            _currentPlayer.fadeOut();
            _currentPlayer = null;
            _currentType = null;
        }
    }

    function _syncMusicVolume() {
        if (!_currentPlayer) return;
        const type = _currentType;
        const on  = type === 'menu' ? state.musicMenuOn  : state.musicGameOn;
        const vol = type === 'menu' ? state.musicMenuVol : state.musicGameVol;
        _currentPlayer.setVolume(on ? vol : 0);
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
            'music-menu-lbl':   '🎵 Musique menu',
            'music-game-lbl':   '🎮 Musique jeu',
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
            'music-menu-lbl':   '🎵 Menu music',
            'music-game-lbl':   '🎮 Game music',
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
        set('#settings-mm-label',    'music-menu-lbl');
        set('#settings-mg-label',    'music-game-lbl');
        set('#settings-sfx-label',   'sfx-lbl');

        // Lang button active state
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
        if (volMM) { volMM.value = state.musicMenuVol; volMM.addEventListener('input', () => { state.musicMenuVol = parseFloat(volMM.value); _syncMusicVolume(); _save(); }); }

        const volMG = document.getElementById('vol-music-game');
        if (volMG) { volMG.value = state.musicGameVol; volMG.addEventListener('input', () => { state.musicGameVol = parseFloat(volMG.value); _syncMusicVolume(); _save(); }); }

        const volSFX = document.getElementById('vol-sfx');
        if (volSFX) { volSFX.value = state.sfxVol; volSFX.addEventListener('input', () => { state.sfxVol = parseFloat(volSFX.value); if (typeof SoundManager !== 'undefined') SoundManager.setVolume(state.sfxVol); _save(); }); }

        // Toggles
        const togMM = document.getElementById('toggle-music-menu');
        if (togMM) { togMM.checked = state.musicMenuOn; togMM.addEventListener('change', () => { state.musicMenuOn = togMM.checked; _syncMusicVolume(); _save(); }); }

        const togMG = document.getElementById('toggle-music-game');
        if (togMG) { togMG.checked = state.musicGameOn; togMG.addEventListener('change', () => { state.musicGameOn = togMG.checked; _syncMusicVolume(); _save(); }); }

        const togSFX = document.getElementById('toggle-sfx');
        if (togSFX) { togSFX.checked = state.sfxOn; togSFX.addEventListener('change', () => { state.sfxOn = togSFX.checked; if (typeof SoundManager !== 'undefined') SoundManager.setEnabled(state.sfxOn); _save(); }); }

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

        // Start menu music on first user interaction
        const startMenu = () => { playMenuMusic(); document.removeEventListener('click', startMenu); };
        document.addEventListener('click', startMenu);
    }

    return { state, t, init, applyLang, playMenuMusic, stopMenuMusic, playGameMusic, stopGameMusic };
})();
