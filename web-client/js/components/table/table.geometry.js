const TableGeometry = {
    createBase(group) {
        const mat  = new THREE.MeshStandardMaterial({ color: TableConfig.WOOD, roughness: 0.65, metalness: 0.15 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(TableConfig.WIDTH + 1.2, TableConfig.HEIGHT, TableConfig.DEPTH + 1.2), mat);
        base.position.y = -TableConfig.HEIGHT / 2; base.castShadow = true; base.receiveShadow = true;
        group.add(base);
    },

    createFelt(group) {
        const mat  = new THREE.MeshStandardMaterial({ color: TableConfig.FELT, roughness: 0.96, metalness: 0 });
        const felt = new THREE.Mesh(new THREE.PlaneGeometry(TableConfig.WIDTH, TableConfig.DEPTH), mat);
        felt.rotation.x = -Math.PI / 2; felt.position.y = 0.01; felt.receiveShadow = true;
        group.add(felt);
    },

    createBorder(group) {
        const bH   = 0.28, bW = 0.5;
        const mat  = new THREE.MeshStandardMaterial({ color: 0x3d1508, roughness: 0.55, metalness: 0.2 });
        const gold = new THREE.MeshStandardMaterial({ color: TableConfig.GOLD, roughness: 0.2, metalness: 0.9 });
        const W = TableConfig.WIDTH, D = TableConfig.DEPTH;
        [
            { w: W + bW, d: bW,     x: 0,    z: -D / 2 },
            { w: W + bW, d: bW,     x: 0,    z:  D / 2 },
            { w: bW,     d: D + bW, x: -W/2, z:  0     },
            { w: bW,     d: D + bW, x:  W/2, z:  0     }
        ].forEach(b => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, bH, b.d), mat);
            mesh.position.set(b.x, bH / 2, b.z); mesh.castShadow = true; group.add(mesh);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.02, 0.04, b.d + 0.02), gold);
            trim.position.set(b.x, bH + 0.02, b.z); group.add(trim);
        });
    },

    createGoldLines(group) {
        const mat = new THREE.MeshStandardMaterial({ color: TableConfig.GOLD, roughness: 0.18, metalness: 0.95 });
        const inset = 0.35, t = 0.025;
        const W = TableConfig.WIDTH, D = TableConfig.DEPTH;
        [
            { w: W - inset*2, d: t,           x: 0,         z: -D/2 + inset },
            { w: W - inset*2, d: t,           x: 0,         z:  D/2 - inset },
            { w: t,           d: D - inset*2, x: -W/2+inset, z: 0 },
            { w: t,           d: D - inset*2, x:  W/2-inset, z: 0 }
        ].forEach(l => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(l.w, 0.016, l.d), mat);
            m.position.set(l.x, 0.022, l.z); group.add(m);
        });
        const dGeo = new THREE.CircleGeometry(0.1, 4);
        [[-W/2+inset,-D/2+inset],[W/2-inset,-D/2+inset],[-W/2+inset,D/2-inset],[W/2-inset,D/2-inset]].forEach(([x, z]) => {
            const m = new THREE.Mesh(dGeo, mat);
            m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI / 4; m.position.set(x, 0.024, z);
            group.add(m);
        });
    },

    createGrid(group) {
        const cells   = [];
        const goldMat = new THREE.MeshStandardMaterial({ color: TableConfig.GOLD, roughness: 0.18, metalness: 0.95 });
        const { GRID_ROWS: R, GRID_COLS: C, CELL_W, CELL_H, START_X, START_Z, LAYOUT } = TableConfig;

        for (let row = 0; row < R; row++) {
            cells[row] = [];
            for (let col = 0; col < C; col++) {
                const x = START_X + col * CELL_W;
                const z = START_Z + row * CELL_H;

                const cellMat = new THREE.MeshStandardMaterial({ color: TableConfig.FELT, roughness: 0.9, transparent: true, opacity: 0, depthWrite: false });
                const cell = new THREE.Mesh(new THREE.PlaneGeometry(CELL_W - 0.06, CELL_H - 0.06), cellMat);
                cell.rotation.x = -Math.PI / 2; cell.position.set(x, 0.026, z);
                cell.userData = { row, col, id: LAYOUT[row][col] };
                group.add(cell); cells[row][col] = cell;

                const addLine = (lw, ld, lx, lz) => {
                    const m = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.014, ld), goldMat);
                    m.position.set(lx, 0.022, lz); group.add(m);
                };
                addLine(CELL_W + 0.02, 0.028, x, z - CELL_H / 2);
                addLine(0.028, CELL_H + 0.02, x + CELL_W / 2, z);
                if (col === 0)   addLine(0.028, CELL_H + 0.02, x - CELL_W / 2, z);
                if (row === R-1) addLine(CELL_W + 0.02, 0.028, x, z + CELL_H / 2);

                group.add(TableGeometry.createLabel(LAYOUT[row][col], CELL_W * 0.85, CELL_H * 0.85, x, z));
            }
        }
        return cells;
    },

    createLabel(text, w, h, x, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 160);
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 52px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 5;
        ctx.fillText(text, 128, 80);
        const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 8;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, depthWrite: false }));
        mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.032, z);
        return mesh;
    },

    createCorners(group) {
        const gold = new THREE.MeshStandardMaterial({ color: TableConfig.GOLD, roughness: 0.2, metalness: 0.9 });
        const W = TableConfig.WIDTH, D = TableConfig.DEPTH;
        [[-W/2+1, D/2-1], [W/2-1, D/2-1], [-W/2+1, -D/2+1], [W/2-1, -D/2+1]].forEach(([x, z]) => {
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.32, 36), gold);
            ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.024, z); group.add(ring);
            const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), gold);
            dot.rotation.x = -Math.PI / 2; dot.position.set(x, 0.025, z); group.add(dot);
        });
    }
};
