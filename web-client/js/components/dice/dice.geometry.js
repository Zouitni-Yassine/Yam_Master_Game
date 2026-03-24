const DiceGeometry = (() => {
    const FACE_VALUES = [3, 4, 1, 6, 2, 5];

    function createSmooth(size, bevel) {
        const s = size / 2, b = bevel;
        const geo = new THREE.BoxGeometry(size, size, size, 4, 4, 4);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            const ix = Math.max(-s+b, Math.min(s-b, x));
            const iy = Math.max(-s+b, Math.min(s-b, y));
            const iz = Math.max(-s+b, Math.min(s-b, z));
            const dx = x-ix, dy = y-iy, dz = z-iz;
            const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (len > 0.0001) {
                const sc = b / len;
                pos.setXYZ(i, ix+dx*sc, iy+dy*sc, iz+dz*sc);
            }
        }
        geo.computeVertexNormals();
        return geo;
    }

    function createMesh(index) {
        const materials = FACE_VALUES.map(v => {
            const mat = new THREE.MeshPhysicalMaterial({ map: DiceTexture.make(v), roughness: 0.6, metalness: 0.0, reflectivity: 0.1 });
            if (mat.clearcoat !== undefined) { mat.clearcoat = 0.05; mat.clearcoatRoughness = 0.6; }
            return mat;
        });
        const mesh = new THREE.Mesh(createSmooth(DiceConfig.SIZE, 0.065), materials);
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData = { index, isDie: true, currentValue: null };
        return mesh;
    }

    return { createMesh };
})();
