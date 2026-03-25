const MenuBg = (() => {
    let renderer, scene, camera, animId;
    const objects = [];

    // Drag state
    let dragObj = null;
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    const dragPlane = new THREE.Plane();

    // ---- Playing card canvas texture ----
    function _makeCardTexture(suit) {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 180;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#f0e8d4';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, 128, 180, 10); ctx.fill(); }
        else { ctx.fillRect(0, 0, 128, 180); }
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(3, 3, 122, 174, 8); ctx.stroke(); }
        const isRed = suit === '♥' || suit === '♦';
        ctx.fillStyle = isRed ? '#c8201e' : '#0a0604';
        ctx.font = 'bold 72px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(suit, 64, 96);
        ctx.font = 'bold 20px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(suit, 8, 8);
        return new THREE.CanvasTexture(c);
    }

    function _makeCard(suit) {
        const geo = new THREE.BoxGeometry(2.8, 3.8, 0.07);
        const front = new THREE.MeshStandardMaterial({ map: _makeCardTexture(suit), roughness: 0.35 });
        const back  = new THREE.MeshStandardMaterial({ color: 0x0d0804, roughness: 0.3 });
        const side  = new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.5 });
        return new THREE.Mesh(geo, [side, side, side, side, front, back]);
    }

    // Place object away from center (menu is in center ~400px wide)
    function _scatter(obj) {
        let x, y;
        do {
            x = (Math.random() - 0.5) * 90;
            y = (Math.random() - 0.5) * 55;
        } while (Math.abs(x) < 20 && Math.abs(y) < 28);

        // Push objects further back so they don't occlude the menu
        const z = -12 - Math.random() * 18;
        obj.position.set(x, y, z);
        obj.userData.initY  = y;
        obj.userData.phase  = Math.random() * Math.PI * 2;
        obj.userData.floatA = 0.8 + Math.random() * 1.0;
        obj.userData.dragging = false;
    }

    function _updateMouse(e) {
        mouse.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
    }

    function _setupDrag(canvas) {
        canvas.addEventListener('mousedown', e => {
            _updateMouse(e);
            raycaster.setFromCamera(mouse, camera);

            const meshes = [];
            objects.forEach(o => {
                if (o.isMesh) meshes.push(o);
                else o.traverse(c => { if (c.isMesh) meshes.push(c); });
            });

            const hits = raycaster.intersectObjects(meshes);
            if (!hits.length) return;

            // Find root object
            let hit = hits[0].object;
            while (hit.parent && !objects.includes(hit)) hit = hit.parent;
            dragObj = hit;
            dragPlane.set(new THREE.Vector3(0, 0, 1), -dragObj.position.z);
            dragObj.userData.dragging = true;
            canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('mousemove', e => {
            if (!dragObj) return;
            _updateMouse(e);
            raycaster.setFromCamera(mouse, camera);
            const target = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, target);
            dragObj.position.x = target.x;
            dragObj.position.y = target.y;
        });

        const _release = () => {
            if (dragObj) {
                dragObj.userData.initY = dragObj.position.y;
                dragObj.userData.dragging = false;
                dragObj = null;
                canvas.style.cursor = 'default';
            }
        };
        canvas.addEventListener('mouseup', _release);
        canvas.addEventListener('mouseleave', _release);
    }

    function init() {
        const canvas = document.getElementById('menu-bg-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(1);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        camera.position.set(0, 0, 35);

        scene.add(new THREE.AmbientLight(0xffeedd, 0.55));
        const pt1 = new THREE.PointLight(0xd4a44c, 2.5, 100); pt1.position.set(15, 20, 25); scene.add(pt1);
        const pt2 = new THREE.PointLight(0xc8201e, 1.2, 70);  pt2.position.set(-20, -10, 20); scene.add(pt2);
        const pt3 = new THREE.PointLight(0xffffff, 0.9, 60);  pt3.position.set(0, 5, 30); scene.add(pt3);

        // ---- Dice (8) ----
        if (typeof DiceGeometry !== 'undefined') {
            for (let i = 0; i < 8; i++) {
                const die = DiceGeometry.createMesh(0);
                die.scale.setScalar(1.4 + Math.random() * 2.4);
                _scatter(die);
                die.rotation.x = Math.random() * Math.PI;
                die.rotation.y = Math.random() * Math.PI;
                die.userData.rx = (Math.random() - 0.5) * 0.007;
                die.userData.ry = (Math.random() - 0.5) * 0.009;
                scene.add(die); objects.push(die);
            }
        }

        // ---- Chips (10) ----
        if (typeof ChipModel !== 'undefined') {
            const colors = [0xc8201e, 0x111827, 0x1565c0, 0x2e7d32, 0xd4a44c, 0x6a0dad, 0xc8201e, 0x111827, 0x1565c0, 0x2e7d32];
            for (let i = 0; i < 10; i++) {
                const chip = ChipModel.make(colors[i]);
                chip.scale.setScalar(9 + Math.random() * 12);
                _scatter(chip);
                chip.rotation.x = (Math.random() - 0.5) * 1.4;
                chip.rotation.z = (Math.random() - 0.5) * 0.7;
                chip.userData.ry = (Math.random() - 0.5) * 0.007;
                scene.add(chip); objects.push(chip);
            }
        }

        // ---- Cards (7) ----
        const suits = ['♠', '♥', '♦', '♣', '♠', '♥', '♦'];
        for (let i = 0; i < 7; i++) {
            const card = _makeCard(suits[i]);
            _scatter(card);
            card.rotation.z = (Math.random() - 0.5) * 1.0;
            card.rotation.x = (Math.random() - 0.5) * 0.5;
            card.rotation.y = (Math.random() - 0.5) * 0.3;
            card.userData.ry = (Math.random() - 0.5) * 0.005;
            card.userData.rz = (Math.random() - 0.5) * 0.003;
            scene.add(card); objects.push(card);
        }

        _setupDrag(canvas);
        window.addEventListener('resize', _onResize);
        _animate();
    }

    let t = 0;
    function _animate() {
        animId = requestAnimationFrame(_animate);
        t += 0.005;
        objects.forEach(m => {
            if (m.userData.dragging) return;
            if (m.userData.rx) m.rotation.x += m.userData.rx;
            if (m.userData.ry) m.rotation.y += m.userData.ry;
            if (m.userData.rz) m.rotation.z += m.userData.rz;
            if (m.userData.initY !== undefined)
                m.position.y = m.userData.initY + Math.sin(t + m.userData.phase) * m.userData.floatA;
        });
        if (renderer) renderer.render(scene, camera);
    }

    function _onResize() {
        if (!renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function destroy() {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', _onResize);
    }

    return { init, destroy };
})();
