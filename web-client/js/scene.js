/* ============================================
   THREE.JS SCENE - Luxury Casino Environment
   FIXED camera, rich warm atmosphere, background
   tables, roulette, people, slot machines
   ============================================ */

const CasinoScene = (() => {
    let scene, camera, renderer;

    function init(canvas) {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080503);
        scene.fog = new THREE.FogExp2(0x080503, 0.045);

        // FIXED cinematic camera - centered on table
        camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 10, 8);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.outputEncoding = THREE.sRGBEncoding;

        setupLighting();
        setupCasinoRoom();
        setupBackgroundTables();
        setupRouletteTable();
        setupSlotMachines();

        window.addEventListener('resize', onResize);
        return { scene, camera, renderer };
    }

    /* =============================================
       LIGHTING - Warm, cinematic, casino pendant
       ============================================= */
    function setupLighting() {
        // Deep warm ambient
        scene.add(new THREE.AmbientLight(0x1a0c04, 0.6));

        // Main overhead pendant — strong center pool
        const main = new THREE.SpotLight(0xffecc8, 2.8, 30, Math.PI / 3.5, 0.4, 1.5);
        main.position.set(0, 14, 0);
        main.castShadow = true;
        main.shadow.mapSize.set(2048, 2048);
        main.shadow.camera.near = 4;
        main.shadow.camera.far = 22;
        main.shadow.bias = -0.0004;
        main.shadow.radius = 5;
        scene.add(main);
        scene.add(main.target);

        // Two side pendants (softer)
        [[-6, 12, -2], [6, 12, -2]].forEach(([x, y, z]) => {
            const sp = new THREE.SpotLight(0xffe0a0, 1.2, 20, Math.PI / 5, 0.55, 2);
            sp.position.set(x, y, z);
            sp.target.position.set(x * 0.4, 0, z);
            scene.add(sp);
            scene.add(sp.target);
        });

        // Warm fill from player side
        const frontFill = new THREE.PointLight(0xff9930, 0.35, 16);
        frontFill.position.set(0, 3, 10);
        scene.add(frontFill);

        // Cool-blue rim from behind for depth separation
        const backRim = new THREE.PointLight(0x1a2555, 1.0, 22);
        backRim.position.set(0, 5, -14);
        scene.add(backRim);

        // Background warm scatter lights (casino glow)
        const bgPositions = [
            [-14, 6, -10, 0xff6622, 0.7],
            [14, 6, -12, 0xffaa33, 0.5],
            [0, 8, -18, 0xff8844, 0.6],
            [-20, 5, -6, 0xff4411, 0.4],
            [20, 5, -8, 0xddaa44, 0.4],
        ];
        bgPositions.forEach(([x, y, z, color, intensity]) => {
            const l = new THREE.PointLight(color, intensity, 18);
            l.position.set(x, y, z);
            scene.add(l);
        });

        // ---- Pendant lamp visual ----
        buildPendantLamp(0, 10.5, 0, 1.0);
        buildPendantLamp(-6, 9.5, -2, 0.6);
        buildPendantLamp(6, 9.5, -2, 0.6);
    }

    function buildPendantLamp(x, y, z, scale) {
        const g = new THREE.Group();
        g.position.set(x, y, z);
        g.scale.setScalar(scale);

        // Shade
        const shadeMat = new THREE.MeshStandardMaterial({
            color: 0x2a1508, roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide
        });
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 0.55, 20, 1, true), shadeMat));

        // Gold trim ring
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.2, metalness: 0.9 });
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.035, 8, 24), goldMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = -0.275;
        g.add(rim);

        // Inner glow disc
        const glow = new THREE.Mesh(
            new THREE.CircleGeometry(1.1, 20),
            new THREE.MeshBasicMaterial({ color: 0xffeecc, transparent: true, opacity: 0.45 })
        );
        glow.rotation.x = Math.PI / 2;
        glow.position.y = -0.26;
        g.add(glow);

        // Cord
        const cord = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        cord.position.y = 3.3;
        g.add(cord);

        scene.add(g);
    }

    /* =============================================
       CASINO ROOM - Walls, floor, ceiling, details
       ============================================= */
    function setupCasinoRoom() {
        // Rich carpet floor
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x100a05, roughness: 0.78, metalness: 0.03 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.65;
        floor.receiveShadow = true;
        scene.add(floor);

        // Walls — warm dark wood panels
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a0e06, roughness: 0.82, metalness: 0.05 });
        const wainMat = new THREE.MeshStandardMaterial({ color: 0x2e1409, roughness: 0.55, metalness: 0.18 });
        const goldTrim = new THREE.MeshStandardMaterial({ color: 0xc49a3c, roughness: 0.2, metalness: 0.9 });

        // Back wall
        const bw = new THREE.Mesh(new THREE.PlaneGeometry(80, 22), wallMat);
        bw.position.set(0, 10, -22);
        scene.add(bw);

        // Side walls
        [[-22, Math.PI / 2], [22, -Math.PI / 2]].forEach(([x, ry]) => {
            const w = new THREE.Mesh(new THREE.PlaneGeometry(50, 22), wallMat);
            w.rotation.y = ry;
            w.position.set(x, 10, -2);
            scene.add(w);
        });

        // Ceiling
        const ceil = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({ color: 0x0c0805, roughness: 0.95 })
        );
        ceil.rotation.x = Math.PI / 2;
        ceil.position.y = 18;
        scene.add(ceil);

        // Wainscoting (lower wood panels) on back wall
        const wain = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), wainMat);
        wain.position.set(0, 1.8, -21.9);
        scene.add(wain);

        // Gold trim line
        const trimLine = new THREE.Mesh(new THREE.BoxGeometry(60, 0.06, 0.04), goldTrim);
        trimLine.position.set(0, 4.3, -21.85);
        scene.add(trimLine);

        // Wall sconce lights along back wall
        [-15, -8, -1, 6, 13].forEach(x => {
            // Bracket
            const bracket = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.3, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.3, metalness: 0.8 })
            );
            bracket.position.set(x, 5.5, -21.7);
            scene.add(bracket);

            // Glow bulb
            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffddaa })
            );
            bulb.position.set(x, 5.8, -21.5);
            scene.add(bulb);

            // Actual light
            const sl = new THREE.PointLight(0xffaa44, 0.25, 8);
            sl.position.set(x, 5.8, -21);
            scene.add(sl);
        });

        // Columns (decorative pillars)
        [[-18, -16], [18, -16], [-18, -5], [18, -5]].forEach(([x, z]) => {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 18, 12),
                wainMat
            );
            pillar.position.set(x, 8, z);
            scene.add(pillar);

            // Gold base ring
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 16), goldTrim);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(x, -0.5, z);
            scene.add(ring);

            // Gold top ring
            const topRing = ring.clone();
            topRing.position.y = 17;
            scene.add(topRing);
        });
    }

    /* =============================================
       BACKGROUND TABLES (poker, blackjack style)
       ============================================= */
    function setupBackgroundTables() {
        const positions = [
            { x: -10, z: -10, ry: 0.4, type: 'half' },
            { x: 11, z: -12, ry: -0.3, type: 'round' },
            { x: -6, z: -16, ry: 0.15, type: 'round' },
            { x: 7, z: -17, ry: -0.1, type: 'half' },
            { x: 0, z: -19, ry: 0, type: 'round' },
        ];

        positions.forEach(p => {
            const t = p.type === 'half' ? buildBlackjackTable() : buildPokerTable();
            t.position.set(p.x, -0.65, p.z);
            t.rotation.y = p.ry;
            t.scale.setScalar(0.55);
            scene.add(t);
        });
    }

    function buildPokerTable() {
        const g = new THREE.Group();
        const feltMat = new THREE.MeshStandardMaterial({ color: 0x0a3820, roughness: 0.92 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a1a08, roughness: 0.55, metalness: 0.18 });

        const top = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.25, 28), feltMat);
        top.position.y = 0.65;
        g.add(top);

        const edge = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.16, 8, 28), woodMat);
        edge.rotation.x = Math.PI / 2;
        edge.position.y = 0.78;
        g.add(edge);

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 0.65, 10), woodMat);
        g.add(pedestal);

        // Scattered chips
        for (let i = 0; i < 10; i++) {
            const colors = [0xcc2222, 0x111111, 0x2244cc, 0xd4a44c, 0x22aa44];
            const chip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8),
                new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.35 })
            );
            const a = Math.random() * Math.PI * 2;
            chip.position.set(Math.cos(a) * (Math.random() * 2), 0.8 + Math.random() * 0.1, Math.sin(a) * (Math.random() * 2));
            g.add(chip);
        }
        return g;
    }

    function buildBlackjackTable() {
        const g = new THREE.Group();
        const feltMat = new THREE.MeshStandardMaterial({ color: 0x0a3820, roughness: 0.92 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a1a08, roughness: 0.55, metalness: 0.18 });

        // Half-circle table (blackjack style)
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 3, 0, Math.PI, false);
        shape.lineTo(-3, 0);
        const extrudeSettings = { depth: 0.25, bevelEnabled: false };
        const topGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const top = new THREE.Mesh(topGeo, feltMat);
        top.rotation.x = -Math.PI / 2;
        top.position.y = 0.65;
        g.add(top);

        // Wood edge
        const edgeTop = new THREE.Mesh(
            new THREE.TorusGeometry(3, 0.15, 8, 20, Math.PI),
            woodMat
        );
        edgeTop.rotation.x = Math.PI / 2;
        edgeTop.position.y = 0.78;
        g.add(edgeTop);

        // Straight edge
        const bar = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.3), woodMat);
        bar.position.set(0, 0.65, 0);
        g.add(bar);

        // Legs
        [[-2, -1.5], [2, -1.5], [0, 1.5]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.65, 8), woodMat);
            leg.position.set(x, 0.3, z);
            g.add(leg);
        });

        return g;
    }

    /* =============================================
       ROULETTE TABLE (iconic casino piece)
       ============================================= */
    function setupRouletteTable() {
        const g = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a1808, roughness: 0.5, metalness: 0.2 });
        const feltMat = new THREE.MeshStandardMaterial({ color: 0x0a3a1a, roughness: 0.9 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.2, metalness: 0.9 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.3 });

        // Table body
        const body = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 2.5), feltMat);
        body.position.y = 0.65;
        g.add(body);

        // Wood border
        const border = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.35, 2.8), woodMat);
        border.position.y = 0.6;
        g.add(border);

        // Roulette wheel (cylinder)
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32), blackMat);
        wheel.position.set(-1.5, 0.88, 0);
        g.add(wheel);

        // Wheel rim
        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.04, 8, 32), goldMat);
        wheelRim.rotation.x = Math.PI / 2;
        wheelRim.position.set(-1.5, 0.96, 0);
        g.add(wheelRim);

        // Inner wheel detail
        const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 24), goldMat);
        inner.position.set(-1.5, 0.9, 0);
        g.add(inner);

        // Cone center
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 12), goldMat);
        cone.position.set(-1.5, 1.1, 0);
        g.add(cone);

        // Legs
        [[-2.2, -1], [2.2, -1], [-2.2, 1], [2.2, 1]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8), woodMat);
            leg.position.set(x, 0.3, z);
            g.add(leg);
        });

        g.position.set(-12, -0.65, -5);
        g.rotation.y = 0.6;
        g.scale.setScalar(0.7);
        scene.add(g);
    }

    /* =============================================
       SLOT MACHINES (along walls, glowing screens)
       ============================================= */
    function setupSlotMachines() {
        const positions = [
            { x: -19, z: -14, ry: 0.5 },
            { x: -17, z: -14, ry: 0.45 },
            { x: -15, z: -14, ry: 0.4 },
            { x: 17, z: -14, ry: -0.45 },
            { x: 19, z: -14, ry: -0.5 },
        ];

        positions.forEach(p => {
            const m = buildSlotMachine();
            m.position.set(p.x, -0.65, p.z);
            m.rotation.y = p.ry;
            scene.add(m);
        });
    }

    function buildSlotMachine() {
        const g = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a1530, roughness: 0.5, metalness: 0.3 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.1, metalness: 0.9 });

        g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.8, 0.9), bodyMat).translateY(1.4));

        // Screen glow
        const colors = [0xff3333, 0x33ff33, 0xffaa00, 0x3366ff];
        const scr = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 0.5),
            new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * 4)], transparent: true, opacity: 0.5 })
        );
        scr.position.set(0, 2.1, 0.46);
        g.add(scr);

        // Chrome top
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1), chromeMat).translateY(2.85));

        // Lever
        const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), chromeMat);
        lever.position.set(0.62, 1.8, 0);
        lever.rotation.z = 0.25;
        g.add(lever);

        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 }));
        knob.position.set(0.72, 2.2, 0);
        g.add(knob);

        return g;
    }

    /* =============================================
       RESIZE & RENDER (no camera movement)
       ============================================= */
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // FIXED camera — no update needed
    function update() {}
    function render() { renderer.render(scene, camera); }
    function getScene() { return scene; }
    function getCamera() { return camera; }
    function getRenderer() { return renderer; }

    return { init, update, render, getScene, getCamera, getRenderer };
})();
