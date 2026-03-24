const SceneLighting = {
    setup(scene) {
        scene.add(new THREE.AmbientLight(0x1a0c04, 0.6));

        const main = new THREE.SpotLight(0xffecc8, 2.8, 30, Math.PI / 3.5, 0.4, 1.5);
        main.position.set(0, 14, 0);
        main.castShadow = true;
        main.shadow.mapSize.set(2048, 2048);
        main.shadow.camera.near = 4; main.shadow.camera.far = 22;
        main.shadow.bias = -0.0004; main.shadow.radius = 5;
        scene.add(main); scene.add(main.target);

        [[-6, 12, -2], [6, 12, -2]].forEach(([x, y, z]) => {
            const sp = new THREE.SpotLight(0xffe0a0, 1.2, 20, Math.PI / 5, 0.55, 2);
            sp.position.set(x, y, z); sp.target.position.set(x * 0.4, 0, z);
            scene.add(sp); scene.add(sp.target);
        });

        const frontFill = new THREE.PointLight(0xff9930, 0.35, 16);
        frontFill.position.set(0, 3, 10); scene.add(frontFill);

        const backRim = new THREE.PointLight(0x1a2555, 1.0, 22);
        backRim.position.set(0, 5, -14); scene.add(backRim);

        [[-14,6,-10,0xff6622,0.7],[14,6,-12,0xffaa33,0.5],[0,8,-18,0xff8844,0.6],[-20,5,-6,0xff4411,0.4],[20,5,-8,0xddaa44,0.4]]
            .forEach(([x, y, z, c, i]) => { const l = new THREE.PointLight(c, i, 18); l.position.set(x, y, z); scene.add(l); });

        SceneLighting.buildPendantLamp(scene,  0,  10.5,  0, 1.0);
        SceneLighting.buildPendantLamp(scene, -6,   9.5, -2, 0.6);
        SceneLighting.buildPendantLamp(scene,  6,   9.5, -2, 0.6);
    },

    buildPendantLamp(scene, x, y, z, scale) {
        const g = new THREE.Group();
        g.position.set(x, y, z); g.scale.setScalar(scale);

        const shadeMat = new THREE.MeshStandardMaterial({ color: 0x2a1508, roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide });
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.3, 0.55, 20, 1, true), shadeMat));

        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.2, metalness: 0.9 });
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.035, 8, 24), goldMat);
        rim.rotation.x = Math.PI / 2; rim.position.y = -0.275; g.add(rim);

        const glow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 20), new THREE.MeshBasicMaterial({ color: 0xffeecc, transparent: true, opacity: 0.45 }));
        glow.rotation.x = Math.PI / 2; glow.position.y = -0.26; g.add(glow);

        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 6, 4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        cord.position.y = 3.3; g.add(cord);

        scene.add(g);
    }
};
