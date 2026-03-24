/* ============================================
   MAIN ENTRY POINT
   Initialize everything and run game loop
   ============================================ */

/* ---- Simple Sound Manager ---- */
const SoundManager = (() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let enabled = true;

    function play(type) {
        if (!enabled) return;

        // Ensure AudioContext is resumed (browser policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        switch (type) {
            case 'roll':
                playNoise(0.15, 0.4);
                setTimeout(() => playNoise(0.1, 0.3), 100);
                setTimeout(() => playNoise(0.08, 0.2), 200);
                setTimeout(() => playTone(200, 0.05, 0.1), 350);
                break;
            case 'chip':
                playTone(800, 0.08, 0.15);
                setTimeout(() => playTone(1200, 0.05, 0.1), 80);
                break;
            case 'click':
                playTone(600, 0.03, 0.08);
                break;
        }
    }

    function playTone(freq, duration, volume) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function playNoise(duration, volume) {
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gain = audioCtx.createGain();
        source.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        // Bandpass for more realistic dice sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.5;
        source.disconnect();
        source.connect(filter);
        filter.connect(gain);

        source.start();
    }

    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    return { play, toggle };
})();

/* ---- App Initialization ---- */
(function main() {
    const canvas = document.getElementById('game-canvas');

    // Progress tracking
    let loadProgress = 0;
    function setProgress(val, text) {
        loadProgress = val;
        UIManager.updateLoading(val, text);
    }

    // Step 1: Init Three.js scene
    setProgress(10, 'Initialisation de la scène...');
    CasinoScene.init(canvas);
    const scene = CasinoScene.getScene();

    // Step 2: Create casino table
    setProgress(30, 'Construction de la table...');
    CasinoTable.create(scene);

    // Step 3: Init dice
    setProgress(50, 'Préparation des dés...');
    DiceSystem.init(scene);

    // Step 4: Init chips
    setProgress(65, 'Placement des jetons...');
    ChipSystem.init(scene);

    // Step 4b: Init dice cups
    DiceCup.init(scene);

    // Step 5: Init UI
    setProgress(80, 'Configuration de l\'interface...');
    UIManager.init();

    // Init menu die
    MenuDie.init();

    // Init login 3D scene
    LoginScene.init();

    // Animate menu elements on load (after loading screen hides)
    setTimeout(() => {
        gsap.from('.menu-title', { y: -40, opacity: 0, duration: 1, ease: 'back.out(2)' });
        gsap.from('#menu-canvas', { scale: 0, opacity: 0, duration: 0.8, delay: 0.2, ease: 'back.out(3)' });
        gsap.from('#menu-main .menu-btn', { y: 30, opacity: 0, duration: 0.5, stagger: 0.12, delay: 0.4, ease: 'back.out(2)' });
        gsap.from('#player-info-bar', { opacity: 0, duration: 0.6, delay: 0.8 });
    }, 1000);

    // Step 6: Connect socket
    setProgress(90, 'Connexion au serveur...');
    SocketClient.connect();

    // Step 7: Init game state manager
    GameState.init();

    // Step 8: Ready
    setProgress(100, 'Prêt !');

    setTimeout(() => {
        UIManager.hideLoading();
    }, 800);

    // Animate login card after loading
    setTimeout(() => {
        const card = document.querySelector('.login-card');
        if (card) {
            gsap.from('.login-brand', { y: -20, opacity: 0, duration: 0.7, ease: 'back.out(2)' });
            gsap.from('.login-tabs', { y: 10, opacity: 0, duration: 0.5, delay: 0.2, ease: 'power2.out' });
            gsap.from('.login-field-wrap', { y: 15, opacity: 0, duration: 0.4, stagger: 0.1, delay: 0.35, ease: 'power2.out' });
            gsap.from('.login-btn', { y: 10, opacity: 0, duration: 0.4, delay: 0.6, ease: 'back.out(2)' });
        }
    }, 1000);

    // ---- Game Loop ----
    function animate() {
        requestAnimationFrame(animate);
        CasinoScene.update();
        CasinoScene.render();
    }

    animate();

    console.log('%c♠ YAM\'S CASINO ♠', 'color: #d4a44c; font-size: 24px; font-weight: bold;');
    console.log('%cTable prête. En attente de joueurs...', 'color: #8a7a5a;');
})();
