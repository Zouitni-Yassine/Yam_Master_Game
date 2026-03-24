const LoginScene = (() => {
    // ---- 2D background on #login-canvas ----
    let bgCanvas, bgCtx, bgAnimId;
    let bgW, bgH;
    const nodes = [];
    const NODE_COUNT = 75;
    const CONNECT_DIST = 130;

    // ---- 3D die on #login-die-canvas ----
    let dieRenderer, dieScene, dieCamera, dieMesh, dieAnimId;

    function init() {
        _initBackground();
        _initDie();
    }

    // ---------- background ----------

    function _initBackground() {
        bgCanvas = document.getElementById('login-canvas');
        if (!bgCanvas) return;
        bgCtx = bgCanvas.getContext('2d');
        _resizeBg();

        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * bgW,
                y: Math.random() * bgH,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                r: 1.2 + Math.random() * 1.8,
                alpha: 0.25 + Math.random() * 0.5
            });
        }

        window.addEventListener('resize', _resizeBg);
        _animateBg();
    }

    function _resizeBg() {
        if (!bgCanvas) return;
        bgW = bgCanvas.width = window.innerWidth;
        bgH = bgCanvas.height = window.innerHeight;
    }

    function _animateBg() {
        bgAnimId = requestAnimationFrame(_animateBg);
        bgCtx.clearRect(0, 0, bgW, bgH);

        // Draw connecting lines
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CONNECT_DIST) {
                    const a = (1 - d / CONNECT_DIST) * 0.18;
                    bgCtx.beginPath();
                    bgCtx.strokeStyle = `rgba(212,164,76,${a})`;
                    bgCtx.lineWidth = 1;
                    bgCtx.moveTo(nodes[i].x, nodes[i].y);
                    bgCtx.lineTo(nodes[j].x, nodes[j].y);
                    bgCtx.stroke();
                }
            }
        }

        // Draw and move particles
        nodes.forEach(p => {
            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            bgCtx.fillStyle = `rgba(212,164,76,${p.alpha})`;
            bgCtx.fill();

            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0)   p.x = bgW;
            if (p.x > bgW) p.x = 0;
            if (p.y < 0)   p.y = bgH;
            if (p.y > bgH) p.y = 0;
        });
    }

    // ---------- mini 3D die ----------

    function _initDie() {
        const canvas = document.getElementById('login-die-canvas');
        if (!canvas || typeof THREE === 'undefined' || typeof DiceGeometry === 'undefined') return;

        const SIZE = 120;
        dieRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        dieRenderer.setSize(SIZE, SIZE);
        dieRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        dieScene = new THREE.Scene();
        dieCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        dieCamera.position.set(0, 0, 5);

        dieScene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const pt = new THREE.PointLight(0xd4a44c, 2.5, 40);
        pt.position.set(3, 5, 5);
        dieScene.add(pt);

        dieMesh = DiceGeometry.createMesh(0);
        dieMesh.scale.setScalar(1.3);
        dieScene.add(dieMesh);

        _animateDie();
    }

    function _animateDie() {
        dieAnimId = requestAnimationFrame(_animateDie);
        if (dieMesh) {
            dieMesh.rotation.x += 0.010;
            dieMesh.rotation.y += 0.016;
        }
        if (dieRenderer) dieRenderer.render(dieScene, dieCamera);
    }

    // ---------- cleanup ----------

    function destroy() {
        if (bgAnimId)  cancelAnimationFrame(bgAnimId);
        if (dieAnimId) cancelAnimationFrame(dieAnimId);
        window.removeEventListener('resize', _resizeBg);
    }

    return { init, destroy };
})();
