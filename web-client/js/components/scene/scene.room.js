const SceneRoom = {
    setup(scene) {
        const wallMat  = new THREE.MeshStandardMaterial({ color: 0x1a0e06, roughness: 0.82, metalness: 0.05 });
        const wainMat  = new THREE.MeshStandardMaterial({ color: 0x2e1409, roughness: 0.55, metalness: 0.18 });
        const goldTrim = new THREE.MeshStandardMaterial({ color: 0xc49a3c, roughness: 0.2,  metalness: 0.9  });

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x100a05, roughness: 0.78, metalness: 0.03 }));
        floor.rotation.x = -Math.PI / 2; floor.position.y = -0.65; floor.receiveShadow = true;
        scene.add(floor);

        // Ceiling
        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0c0805, roughness: 0.95 }));
        ceil.rotation.x = Math.PI / 2; ceil.position.y = 18; scene.add(ceil);

        // Walls
        const bw = new THREE.Mesh(new THREE.PlaneGeometry(80, 22), wallMat);
        bw.position.set(0, 10, -22); scene.add(bw);
        [[-22, Math.PI / 2], [22, -Math.PI / 2]].forEach(([x, ry]) => {
            const w = new THREE.Mesh(new THREE.PlaneGeometry(50, 22), wallMat);
            w.rotation.y = ry; w.position.set(x, 10, -2); scene.add(w);
        });

        // Wainscoting + trim
        const wain = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), wainMat);
        wain.position.set(0, 1.8, -21.9); scene.add(wain);
        const trim = new THREE.Mesh(new THREE.BoxGeometry(60, 0.06, 0.04), goldTrim);
        trim.position.set(0, 4.3, -21.85); scene.add(trim);

        // Wall sconces
        [-15, -8, -1, 6, 13].forEach(x => {
            const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.3, metalness: 0.8 }));
            bracket.position.set(x, 5.5, -21.7); scene.add(bracket);
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffddaa }));
            bulb.position.set(x, 5.8, -21.5); scene.add(bulb);
            const sl = new THREE.PointLight(0xffaa44, 0.25, 8);
            sl.position.set(x, 5.8, -21); scene.add(sl);
        });

        // Pillars
        [[-18, -16], [18, -16], [-18, -5], [18, -5]].forEach(([x, z]) => {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 18, 12), wainMat);
            pillar.position.set(x, 8, z); scene.add(pillar);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 16), goldTrim);
            ring.rotation.x = Math.PI / 2; ring.position.set(x, -0.5, z); scene.add(ring);
            const topRing = ring.clone(); topRing.position.y = 17; scene.add(topRing);
        });
    }
};
