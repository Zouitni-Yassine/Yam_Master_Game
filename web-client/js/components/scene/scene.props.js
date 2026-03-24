const SceneProps = {
    setup(scene) {
        SceneProps._tables(scene);
        SceneProps._roulette(scene);
        SceneProps._slots(scene);
    },

    _tables(scene) {
        [
            { x: -10, z: -10, ry:  0.4,  type: 'half'  },
            { x:  11, z: -12, ry: -0.3,  type: 'round' },
            { x:  -6, z: -16, ry:  0.15, type: 'round' },
            { x:   7, z: -17, ry: -0.1,  type: 'half'  },
            { x:   0, z: -19, ry:  0,    type: 'round' }
        ].forEach(p => {
            const t = p.type === 'half' ? SceneProps._blackjack() : SceneProps._poker();
            t.position.set(p.x, -0.65, p.z); t.rotation.y = p.ry; t.scale.setScalar(0.55);
            scene.add(t);
        });
    },

    _poker() {
        const g = new THREE.Group();
        const felt = new THREE.MeshStandardMaterial({ color: 0x0a3820, roughness: 0.92 });
        const wood = new THREE.MeshStandardMaterial({ color: 0x3a1a08, roughness: 0.55, metalness: 0.18 });
        const top  = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.25, 28), felt);
        top.position.y = 0.65; g.add(top);
        const edge = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.16, 8, 28), wood);
        edge.rotation.x = Math.PI / 2; edge.position.y = 0.78; g.add(edge);
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 0.65, 10), wood));
        const colors = [0xcc2222, 0x111111, 0x2244cc, 0xd4a44c, 0x22aa44];
        for (let i = 0; i < 10; i++) {
            const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8), new THREE.MeshStandardMaterial({ color: colors[i % 5], roughness: 0.35 }));
            const a = Math.random() * Math.PI * 2;
            chip.position.set(Math.cos(a) * Math.random() * 2, 0.8 + Math.random() * 0.1, Math.sin(a) * Math.random() * 2);
            g.add(chip);
        }
        return g;
    },

    _blackjack() {
        const g = new THREE.Group();
        const felt = new THREE.MeshStandardMaterial({ color: 0x0a3820, roughness: 0.92 });
        const wood = new THREE.MeshStandardMaterial({ color: 0x3a1a08, roughness: 0.55, metalness: 0.18 });
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 3, 0, Math.PI, false); shape.lineTo(-3, 0);
        const top = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false }), felt);
        top.rotation.x = -Math.PI / 2; top.position.y = 0.65; g.add(top);
        const edgeTop = new THREE.Mesh(new THREE.TorusGeometry(3, 0.15, 8, 20, Math.PI), wood);
        edgeTop.rotation.x = Math.PI / 2; edgeTop.position.y = 0.78; g.add(edgeTop);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.3), wood);
        bar.position.set(0, 0.65, 0); g.add(bar);
        [[-2, -1.5], [2, -1.5], [0, 1.5]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.65, 8), wood);
            leg.position.set(x, 0.3, z); g.add(leg);
        });
        return g;
    },

    _roulette(scene) {
        const g = new THREE.Group();
        const wood  = new THREE.MeshStandardMaterial({ color: 0x3a1808, roughness: 0.5,  metalness: 0.2 });
        const felt  = new THREE.MeshStandardMaterial({ color: 0x0a3a1a, roughness: 0.9 });
        const gold  = new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.2,  metalness: 0.9 });
        const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4,  metalness: 0.3 });
        const body  = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 2.5), felt); body.position.y = 0.65; g.add(body);
        const border = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.35, 2.8), wood); border.position.y = 0.6; g.add(border);
        const wheel  = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32), black); wheel.position.set(-1.5, 0.88, 0); g.add(wheel);
        const rim    = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.04, 8, 32), gold); rim.rotation.x = Math.PI / 2; rim.position.set(-1.5, 0.96, 0); g.add(rim);
        const inner  = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 24), gold); inner.position.set(-1.5, 0.9, 0); g.add(inner);
        const cone   = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 12), gold); cone.position.set(-1.5, 1.1, 0); g.add(cone);
        [[-2.2, -1], [2.2, -1], [-2.2, 1], [2.2, 1]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8), wood); leg.position.set(x, 0.3, z); g.add(leg);
        });
        g.position.set(-12, -0.65, -5); g.rotation.y = 0.6; g.scale.setScalar(0.7);
        scene.add(g);
    },

    _slots(scene) {
        [{ x: -19, z: -14, ry: 0.5 }, { x: -17, z: -14, ry: 0.45 }, { x: -15, z: -14, ry: 0.4 },
         { x:  17, z: -14, ry: -0.45 }, { x: 19, z: -14, ry: -0.5 }]
            .forEach(p => { const m = SceneProps._slotMachine(); m.position.set(p.x, -0.65, p.z); m.rotation.y = p.ry; scene.add(m); });
    },

    _slotMachine() {
        const g = new THREE.Group();
        const body   = new THREE.MeshStandardMaterial({ color: 0x3a1530, roughness: 0.5, metalness: 0.3 });
        const chrome = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.1, metalness: 0.9 });
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.8, 0.9), body).translateY(1.4));
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ color: [0xff3333, 0x33ff33, 0xffaa00, 0x3366ff][Math.floor(Math.random() * 4)], transparent: true, opacity: 0.5 }));
        scr.position.set(0, 2.1, 0.46); g.add(scr);
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1), chrome).translateY(2.85));
        const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), chrome);
        lever.position.set(0.62, 1.8, 0); lever.rotation.z = 0.25; g.add(lever);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 }));
        knob.position.set(0.72, 2.2, 0); g.add(knob);
        return g;
    }
};
