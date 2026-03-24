const CupModel = (() => {
    function build() {
        const group    = new THREE.Group();
        const goldMat  = new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.25, metalness: 0.9 });
        const darkGold = new THREE.MeshStandardMaterial({ color: 0x8a6010, roughness: 0.3,  metalness: 0.85 });

        group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.68, 24, 1, true), goldMat));

        const bot = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), goldMat);
        bot.rotation.x = Math.PI / 2; bot.position.y = -0.34; group.add(bot);

        const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 10, 32), goldMat);
        topRim.rotation.x = Math.PI / 2; topRim.position.y = 0.34; group.add(topRim);

        const botRim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 10, 32), darkGold);
        botRim.rotation.x = Math.PI / 2; botRim.position.y = -0.34; group.add(botRim);

        for (let i = 0; i < 8; i++) {
            const a      = (i / 8) * Math.PI * 2;
            const groove = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.62, 0.012), darkGold);
            groove.position.set(Math.cos(a) * 0.31, 0, Math.sin(a) * 0.31); groove.rotation.y = -a;
            group.add(groove);
        }

        group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.24, 0.66, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x0a0503, roughness: 0.95, side: THREE.BackSide })));

        const floor = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshStandardMaterial({ color: 0x050201, roughness: 0.98 }));
        floor.rotation.x = -Math.PI / 2; floor.position.y = -0.32; group.add(floor);

        group.castShadow = true;
        return group;
    }

    return { build };
})();
