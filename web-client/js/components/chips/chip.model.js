const ChipModel = (() => {
    const R = 0.22, H = 0.055, STRIPES = 8;

    function make(color) {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 36), new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.22 })));

        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.45 });
        for (let i = 0; i < STRIPES; i++) {
            const a = (i / STRIPES) * Math.PI * 2;
            const s = new THREE.Mesh(new THREE.BoxGeometry(0.032, H + 0.002, 0.075), stripeMat);
            s.position.set(Math.cos(a) * (R - 0.01), 0, Math.sin(a) * (R - 0.01));
            s.rotation.y = -a; group.add(s);
        }

        const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.55, R * 0.62, 36), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = H / 2 + 0.001; group.add(ring);

        const center = new THREE.Mesh(new THREE.CircleGeometry(R * 0.28, 20), new THREE.MeshStandardMaterial({ color: 0xd4a44c, roughness: 0.25, metalness: 0.75 }));
        center.rotation.x = -Math.PI / 2; center.position.y = H / 2 + 0.002; group.add(center);

        group.castShadow = true;
        return group;
    }

    return { make, H };
})();
