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
            'btn-ranking':      'CLASSEMENT',
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
            'rules-btn':        'RÈGLES DU JEU',
            'settings-btn':     'PARAMÈTRES',
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
            'roll-prefix':      'LANCE',
            'defi-label':       'DÉFI',
            'gameover-win':     'VICTOIRE !',
            'gameover-lose':    'DÉFAITE',
            'gameover-congrats':'FÉLICITATIONS',
            'gameover-better':  'MEILLEURE CHANCE LA PROCHAINE FOIS',
            'gameover-replay':  'REJOUER',
            'player-you':       'VOUS',
            'player-opp':       'ADVERSAIRE',
            'rules-tab-jeu':    '🎲 Jeu',
            'rules-tab-combos': '🃏 Combos',
            'rules-tab-gains':  '💰 Gains',
            'rules-tab-rank':   '🏆 Classement',
            'btn-replays':      'MES PARTIES',
            'replay-back':      '← RETOUR',
            'replay-title-list':'MES PARTIES',
            'replay-loading':   'Chargement...',
            'replay-empty':     'Aucune partie enregistrée.',
            'replay-mode-bot':  'vs Bot',
            'replay-mode-friend':'Privée',
            'replay-mode-online':'En ligne',
            'replay-roll':      'Lancé de dés',
            'replay-choice':    'Choix de combinaison',
            'replay-place':     'Placement',
            'replay-locked':    'Verrouillé',
            'replay-no-data':   'Aucune donnée',
            'replay-step':      'Étape',
            'replay-roll-of':   'Lancé',
            'magic-effect-remove-own':  'Un de vos jetons a été retiré de la grille !',
            'magic-effect-remove-opp':  "Un jeton adverse a été supprimé !",
            'magic-effect-score-minus': '-1 point...',
            'magic-effect-empty':       'Carte vide. Rien ne se passe.',
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
            'btn-ranking':      'LEADERBOARD',
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
            'rules-btn':        'GAME RULES',
            'settings-btn':     'SETTINGS',
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
            'roll-prefix':      'ROLL',
            'defi-label':       'CHALLENGE',
            'gameover-win':     'VICTORY!',
            'gameover-lose':    'DEFEAT',
            'gameover-congrats':'CONGRATULATIONS',
            'gameover-better':  'BETTER LUCK NEXT TIME',
            'gameover-replay':  'PLAY AGAIN',
            'player-you':       'YOU',
            'player-opp':       'OPPONENT',
            'rules-tab-jeu':    '🎲 Game',
            'rules-tab-combos': '🃏 Combos',
            'rules-tab-gains':  '💰 Rewards',
            'rules-tab-rank':   '🏆 Ranking',
            'btn-replays':      'MY GAMES',
            'replay-back':      '← BACK',
            'replay-title-list':'MY GAMES',
            'replay-loading':   'Loading...',
            'replay-empty':     'No games recorded.',
            'replay-mode-bot':  'vs Bot',
            'replay-mode-friend':'Private',
            'replay-mode-online':'Online',
            'replay-roll':      'Dice roll',
            'replay-choice':    'Choose combo',
            'replay-place':     'Placement',
            'replay-locked':    'Locked',
            'replay-no-data':   'No data',
            'replay-step':      'Step',
            'replay-roll-of':   'Roll',
            'magic-effect-remove-own':  'One of your tokens was removed from the grid!',
            'magic-effect-remove-opp':  "An opponent's token was removed!",
            'magic-effect-score-minus': '-1 point...',
            'magic-effect-empty':       'Empty card. Nothing happens.',
        },
    };

    function t(key) {
        return (T[state.lang] || T.fr)[key] || key;
    }

    function applyLang(lang) {
        state.lang = lang;
        localStorage.setItem('yams_lang', lang);

        const set   = (sel, key) => { const el = document.querySelector(sel); if (el && T[lang][key] !== undefined) el.textContent = T[lang][key]; };
        const setPH = (sel, key) => { const el = document.querySelector(sel); if (el && T[lang][key] !== undefined) el.placeholder = T[lang][key]; };

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

        // Shared corner buttons — update .btn-label span or text node, keep SVG icon
        const setIconBtn = (sel, key) => {
            document.querySelectorAll(sel).forEach(btn => {
                const span = btn.querySelector('.btn-label');
                if (span) { span.textContent = ' ' + T[lang][key]; return; }
                const lastNode = [...btn.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
                if (lastNode) lastNode.textContent = ' ' + T[lang][key];
            });
        };
        setIconBtn('.rules-login-btn',   'rules-btn');
        setIconBtn('.settings-open-btn', 'settings-btn');
        setIconBtn('#btn-ranking',        'btn-ranking');

        // Settings panel
        set('#settings-panel-title', 'settings-title');
        set('#settings-lang-label',  'lang-label');
        set('#settings-music-label', 'music-lbl');
        set('#settings-sfx-label',   'sfx-lbl');

        // Défi card
        const defiLbl = document.querySelector('.defi-card-label');
        if (defiLbl) defiLbl.textContent = T[lang]['defi-label'];

        // Game over replay button
        const replayBtn = document.getElementById('game-over-replay');
        if (replayBtn) replayBtn.textContent = T[lang]['gameover-replay'];

        // Replay viewer static elements
        set('#btn-replays .mbtn-text', 'btn-replays');
        const replayBackBtn = document.querySelector('#replay-detail-view .replay-back-btn');
        if (replayBackBtn) replayBackBtn.textContent = T[lang]['replay-back'];
        const replayListTitle = document.querySelector('#replay-list-view .replay-title');
        if (replayListTitle) replayListTitle.textContent = T[lang]['replay-title-list'];

        // Rules tab labels
        const tabMap = { gameplay: 'rules-tab-jeu', combos: 'rules-tab-combos', gains: 'rules-tab-gains', ranking: 'rules-tab-rank' };
        document.querySelectorAll('.rules-tab').forEach(btn => {
            const key = tabMap[btn.dataset.rulesTab];
            if (key && T[lang][key]) btn.textContent = T[lang][key];
        });

        // Rules content (full HTML per language)
        const RULES = {
            fr: {
                gameplay: `<section class="rules-section"><h3>🎯 But du jeu</h3><p>Marquer plus de points que l'adversaire en réalisant des combinaisons avec les dés, ou réussir un <strong>alignement de 5 pions</strong> pour gagner instantanément.</p></section><section class="rules-section"><h3>🎲 Déroulement d'un tour</h3><p>À son tour, le joueur lance les <strong>5 dés jusqu'à 3 fois</strong>. Après chaque lancer, il peut écarter des dés et relancer les autres. Il choisit ensuite une combinaison et place un pion sur la case correspondante du plateau.</p></section><section class="rules-section"><h3>🃏 La Carte Mystère</h3><p>Au début de chaque tour, une carte apparaît à <strong>gauche</strong>. Max <strong>2 utilisations</strong> par partie. Prendre la carte termine votre tour. Effet aléatoire :</p><div class="rules-combos" style="margin-top:8px"><div class="rules-combo"><span class="combo-name">🗑️ Retrait (vous)</span><span class="combo-desc">Un de vos jetons retiré</span></div><div class="rules-combo"><span class="combo-name">💥 Retrait (adversaire)</span><span class="combo-desc">Un jeton adverse retiré</span></div><div class="rules-combo"><span class="combo-name">📉 −1 point</span><span class="combo-desc">Vous ou l'adversaire (aléatoire)</span></div><div class="rules-combo"><span class="combo-name">🃏 Carte vide</span><span class="combo-desc">Rien ne se passe</span></div></div></section><section class="rules-section"><h3>📊 Alignements sur le plateau</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Alignement de 3</span><span class="combo-desc">1 point</span></div><div class="rules-combo"><span class="combo-name">Alignement de 4</span><span class="combo-desc">2 points</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Alignement de 5</span><span class="combo-desc">Victoire instantanée !</span></div></div><p class="rules-note">Les alignements peuvent être horizontaux, verticaux ou diagonaux.</p></section>`,
                combos: `<section class="rules-section"><h3>🃏 Combinaisons disponibles</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Brelan 1 à 6</span><span class="combo-desc">3 dés identiques (ex: 3×4)</span></div><div class="rules-combo"><span class="combo-name">Full</span><span class="combo-desc">Un brelan + une paire</span></div><div class="rules-combo"><span class="combo-name">Carré</span><span class="combo-desc">4 dés identiques</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Yam</span><span class="combo-desc">5 dés identiques — le plus puissant !</span></div><div class="rules-combo"><span class="combo-name">Suite</span><span class="combo-desc">1-2-3-4-5 ou 2-3-4-5-6</span></div><div class="rules-combo"><span class="combo-name">≤ 8</span><span class="combo-desc">Somme des 5 dés inférieure ou égale à 8</span></div><div class="rules-combo"><span class="combo-name">Sec</span><span class="combo-desc">Combo non-brelan réalisée dès le 1er lancer</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Défi</span><span class="combo-desc">Déclaré avant le 2e lancer — réussir une combo non-brelan pour booster les gains</span></div></div></section><section class="rules-section"><h3>🎴 Le Défi</h3><p>Avant votre 2e lancer, cliquez sur la <strong>carte Défi</strong> à droite. Si vous réussissez une combinaison non-brelan, vous marquez des points bonus. Risqué mais récompensé !</p></section>`,
                gains: `<section class="rules-section"><h3>💰 Gains par victoire</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Victoire normale</span><span class="combo-desc">+550 $</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Victoire ligne de 5</span><span class="combo-desc">+1 000 $</span></div></div></section><section class="rules-section"><h3>📉 Pertes par défaite</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Iron / Bronze / Silver</span><span class="combo-desc">−200 $ (défaite normale) · −500 $ (ligne de 5)</span></div><div class="rules-combo"><span class="combo-name">Gold / Platinum</span><span class="combo-desc">−350 $ (défaite normale) · −500 $ (ligne de 5)</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Diamond / Ascendant / Immortal</span><span class="combo-desc">−450 $ (défaite normale) · −500 $ (ligne de 5)</span></div></div><p class="rules-note">Les rangs bas (Iron→Silver) bénéficient d'une protection pour faciliter la progression.</p></section>`,
                ranking: `<section class="rules-section"><h3>🏆 Modes affectant le classement</h3><div class="rules-combos"><div class="rules-combo rules-combo-gold"><span class="combo-name">En ligne (PvP)</span><span class="combo-desc">✅ Affecte le classement</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Bot — Difficile</span><span class="combo-desc">✅ Affecte le classement</span></div><div class="rules-combo"><span class="combo-name">Bot — Facile</span><span class="combo-desc">❌ Pas d'impact sur le classement</span></div><div class="rules-combo"><span class="combo-name">Bot — Intermédiaire</span><span class="combo-desc">❌ Pas d'impact sur le classement</span></div><div class="rules-combo"><span class="combo-name">Amis (room privée)</span><span class="combo-desc">❌ Pas d'impact sur le classement</span></div></div></section><section class="rules-section"><h3>🎖️ Paliers de rangs</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name" style="color:#9eaab5">Iron</span><span class="combo-desc">0 $</span></div><div class="rules-combo"><span class="combo-name" style="color:#cd7f32">Bronze</span><span class="combo-desc">500 $</span></div><div class="rules-combo"><span class="combo-name" style="color:#b0b8c1">Silver</span><span class="combo-desc">1 500 $</span></div><div class="rules-combo"><span class="combo-name" style="color:#ffd700">Gold</span><span class="combo-desc">4 000 $</span></div><div class="rules-combo"><span class="combo-name" style="color:#70c8c8">Platinum</span><span class="combo-desc">10 000 $</span></div><div class="rules-combo"><span class="combo-name" style="color:#a29bfe">Diamond</span><span class="combo-desc">25 000 $</span></div><div class="rules-combo"><span class="combo-name" style="color:#00e676">Ascendant</span><span class="combo-desc">50 000 $</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name" style="color:#ff4757">Immortal</span><span class="combo-desc">100 000 $</span></div></div></section>`,
            },
            en: {
                gameplay: `<section class="rules-section"><h3>🎯 Goal</h3><p>Score more points than your opponent by making dice combinations, or complete a <strong>5-chip alignment</strong> to win instantly.</p></section><section class="rules-section"><h3>🎲 Turn flow</h3><p>On your turn, roll <strong>5 dice up to 3 times</strong>. After each roll, you may hold some dice and reroll the rest. Then choose a combination and place a chip on the matching cell of the board.</p></section><section class="rules-section"><h3>🃏 Mystery Card</h3><p>At the start of each turn, a card appears on the <strong>left</strong>. Max <strong>2 uses</strong> per game. Taking the card ends your turn. Random effect:</p><div class="rules-combos" style="margin-top:8px"><div class="rules-combo"><span class="combo-name">🗑️ Remove (you)</span><span class="combo-desc">One of your tokens removed</span></div><div class="rules-combo"><span class="combo-name">💥 Remove (opponent)</span><span class="combo-desc">One opponent token removed</span></div><div class="rules-combo"><span class="combo-name">📉 −1 point</span><span class="combo-desc">You or opponent (random)</span></div><div class="rules-combo"><span class="combo-name">🃏 Empty card</span><span class="combo-desc">Nothing happens</span></div></div></section><section class="rules-section"><h3>📊 Board alignments</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">3-chip line</span><span class="combo-desc">1 point</span></div><div class="rules-combo"><span class="combo-name">4-chip line</span><span class="combo-desc">2 points</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">5-chip line</span><span class="combo-desc">Instant victory!</span></div></div><p class="rules-note">Alignments can be horizontal, vertical or diagonal.</p></section>`,
                combos: `<section class="rules-section"><h3>🃏 Available combinations</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Three of a kind (1–6)</span><span class="combo-desc">3 identical dice (e.g. 3×4)</span></div><div class="rules-combo"><span class="combo-name">Full House</span><span class="combo-desc">Three of a kind + a pair</span></div><div class="rules-combo"><span class="combo-name">Four of a kind</span><span class="combo-desc">4 identical dice</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Yam</span><span class="combo-desc">5 identical dice — the most powerful!</span></div><div class="rules-combo"><span class="combo-name">Straight</span><span class="combo-desc">1-2-3-4-5 or 2-3-4-5-6</span></div><div class="rules-combo"><span class="combo-name">≤ 8</span><span class="combo-desc">Sum of all 5 dice is 8 or less</span></div><div class="rules-combo"><span class="combo-name">First-roll</span><span class="combo-desc">Non-three-of-a-kind combo on the 1st roll</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Challenge</span><span class="combo-desc">Declared before 2nd roll — land a non-three combo for bonus points</span></div></div></section><section class="rules-section"><h3>🎴 The Challenge</h3><p>Before your 2nd roll, click the <strong>Challenge card</strong> on the right. If you land a non-three-of-a-kind combo, you earn bonus points. Risky but rewarding!</p></section>`,
                gains: `<section class="rules-section"><h3>💰 Win rewards</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Normal win</span><span class="combo-desc">+$550</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">5-in-a-row win</span><span class="combo-desc">+$1,000</span></div></div></section><section class="rules-section"><h3>📉 Loss penalties</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name">Iron / Bronze / Silver</span><span class="combo-desc">−$200 (normal loss) · −$500 (5-in-a-row)</span></div><div class="rules-combo"><span class="combo-name">Gold / Platinum</span><span class="combo-desc">−$350 (normal loss) · −$500 (5-in-a-row)</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Diamond / Ascendant / Immortal</span><span class="combo-desc">−$450 (normal loss) · −$500 (5-in-a-row)</span></div></div><p class="rules-note">Lower ranks (Iron→Silver) benefit from reduced penalties to help progression.</p></section>`,
                ranking: `<section class="rules-section"><h3>🏆 Modes affecting ranking</h3><div class="rules-combos"><div class="rules-combo rules-combo-gold"><span class="combo-name">Online (PvP)</span><span class="combo-desc">✅ Affects ranking</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name">Bot — Hard</span><span class="combo-desc">✅ Affects ranking</span></div><div class="rules-combo"><span class="combo-name">Bot — Easy</span><span class="combo-desc">❌ No ranking impact</span></div><div class="rules-combo"><span class="combo-name">Bot — Medium</span><span class="combo-desc">❌ No ranking impact</span></div><div class="rules-combo"><span class="combo-name">Private room</span><span class="combo-desc">❌ No ranking impact</span></div></div></section><section class="rules-section"><h3>🎖️ Rank thresholds</h3><div class="rules-combos"><div class="rules-combo"><span class="combo-name" style="color:#9eaab5">Iron</span><span class="combo-desc">$0</span></div><div class="rules-combo"><span class="combo-name" style="color:#cd7f32">Bronze</span><span class="combo-desc">$500</span></div><div class="rules-combo"><span class="combo-name" style="color:#b0b8c1">Silver</span><span class="combo-desc">$1,500</span></div><div class="rules-combo"><span class="combo-name" style="color:#ffd700">Gold</span><span class="combo-desc">$4,000</span></div><div class="rules-combo"><span class="combo-name" style="color:#70c8c8">Platinum</span><span class="combo-desc">$10,000</span></div><div class="rules-combo"><span class="combo-name" style="color:#a29bfe">Diamond</span><span class="combo-desc">$25,000</span></div><div class="rules-combo"><span class="combo-name" style="color:#00e676">Ascendant</span><span class="combo-desc">$50,000</span></div><div class="rules-combo rules-combo-gold"><span class="combo-name" style="color:#ff4757">Immortal</span><span class="combo-desc">$100,000</span></div></div></section>`,
            },
        };
        document.querySelectorAll('.rules-tab-content').forEach(div => {
            const tab = div.dataset.rulesContent;
            if (RULES[lang] && RULES[lang][tab]) div.innerHTML = RULES[lang][tab];
        });

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
