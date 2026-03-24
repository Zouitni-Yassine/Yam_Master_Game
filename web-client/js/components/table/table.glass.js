const TableGlass = {
    addGlasses(group) {
        const g1 = TableGlass.build();
        g1.position.set(TableConfig.WIDTH / 2 - 1.4, 0, TableConfig.DEPTH / 2 - 1.2);
        group.add(g1);

        const g2 = TableGlass.build();
        g2.position.set(-TableConfig.WIDTH / 2 + 1.4, 0, -TableConfig.DEPTH / 2 + 1.2);
        group.add(g2);
    },

    build() {
        const g = new THREE.Group();

        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.72, 32, 1, true),
            new THREE.MeshPhysicalMaterial({ color: 0xd0e8ff, transparent: true, opacity: 0.22, roughness: 0, metalness: 0.05, side: THREE.DoubleSide, clearcoat: 1.0, clearcoatRoughness: 0, reflectivity: 0.95 })));

        const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 32),
            new THREE.MeshPhysicalMaterial({ color: 0xc8e0ff, transparent: true, opacity: 0.55, roughness: 0, clearcoat: 1.0, reflectivity: 0.9 }));
        bot.position.y = -0.29; g.add(bot);

        const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.27, 0.32, 32),
            new THREE.MeshStandardMaterial({ color: 0xb86010, transparent: true, opacity: 0.88, roughness: 0.01 }));
        liq.position.y = -0.08; g.add(liq);

        const surf = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32),
            new THREE.MeshStandardMaterial({ color: 0xd07818, transparent: true, opacity: 0.75, roughness: 0, metalness: 0.15 }));
        surf.rotation.x = -Math.PI / 2; surf.position.y = 0.08; g.add(surf);

        const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.5, roughness: 0.02, clearcoat: 1.0, reflectivity: 0.95 });
        for (let i = 0; i < 3; i++) {
            const sz  = 0.08 + Math.random() * 0.05;
            const ice = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.7, sz), iceMat);
            const a   = (i / 3) * Math.PI * 2 + Math.random() * 0.6;
            ice.position.set(Math.cos(a) * 0.13, 0.04 + i * 0.025, Math.sin(a) * 0.13);
            ice.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
            g.add(ice);
        }

        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.012, 8, 32),
            new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, roughness: 0 }));
        rim.rotation.x = Math.PI / 2; rim.position.y = 0.36; g.add(rim);

        g.castShadow = true;
        return g;
    }
};
