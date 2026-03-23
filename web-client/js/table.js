/* ============================================
   CASINO TABLE - Realistic felt, gold grid,
   whiskey glasses
   ============================================ */

const CasinoTable = (() => {
    const TABLE_WIDTH  = 15;
    const TABLE_DEPTH  = 10;
    const TABLE_HEIGHT = 0.55;
    const FELT_COLOR   = 0x0a3a1a;
    const WOOD_COLOR   = 0x2a0e05;
    const GOLD_COLOR   = 0xd4a44c;

    const GRID_COLS   = 5;
    const GRID_ROWS   = 5;
    const GRID_CELL_W = 2.1;
    const GRID_CELL_H = 1.3;
    const GRID_START_X = -(GRID_COLS * GRID_CELL_W) / 2 + GRID_CELL_W / 2;
    const GRID_START_Z = -(GRID_ROWS * GRID_CELL_H) / 2 + GRID_CELL_H / 2;

    const GRID_LAYOUT = [
        ['1',  '3',     'Défi',  '4',    '6'    ],
        ['2',  'Carré', 'Sec',   'Full', '5'    ],
        ['≤8', 'Full',  'Yam',   'Défi', 'Suite'],
        ['6',  'Sec',   'Suite', '≤8',   '1'    ],
        ['3',  '2',     'Carré', '5',    '4'    ]
    ];

    let tableGroup;
    let gridCellMeshes = [];

    function create(scene) {
        tableGroup = new THREE.Group();
        createTableBase();
        createFeltSurface();
        createWoodBorder();
        createGoldLines();
        createGridOnFelt();
        createWhiskeyGlasses();
        createCornerDecorations();
        scene.add(tableGroup);
        return tableGroup;
    }

    function createTableBase() {
        const mat = new THREE.MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.65, metalness: 0.15 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(TABLE_WIDTH + 1.2, TABLE_HEIGHT, TABLE_DEPTH + 1.2), mat);
        base.position.y = -TABLE_HEIGHT / 2;
        base.castShadow = true; base.receiveShadow = true;
        tableGroup.add(base);
    }

    function createFeltSurface() {
        const mat = new THREE.MeshStandardMaterial({ color: FELT_COLOR, roughness: 0.96, metalness: 0.0 });
        const felt = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_WIDTH, TABLE_DEPTH), mat);
        felt.rotation.x = -Math.PI / 2;
        felt.position.y = 0.01;
        felt.receiveShadow = true;
        tableGroup.add(felt);
    }

    function createWoodBorder() {
        const bH = 0.28, bW = 0.5;
        const mat  = new THREE.MeshStandardMaterial({ color: 0x3d1508, roughness: 0.55, metalness: 0.2 });
        const gold = new THREE.MeshStandardMaterial({ color: GOLD_COLOR, roughness: 0.2, metalness: 0.9 });

        const borders = [
            { w: TABLE_WIDTH + bW, d: bW, x: 0,              z: -TABLE_DEPTH/2 },
            { w: TABLE_WIDTH + bW, d: bW, x: 0,              z:  TABLE_DEPTH/2 },
            { w: bW, d: TABLE_DEPTH + bW, x: -TABLE_WIDTH/2, z: 0 },
            { w: bW, d: TABLE_DEPTH + bW, x:  TABLE_WIDTH/2, z: 0 }
        ];
        borders.forEach(b => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, bH, b.d), mat);
            mesh.position.set(b.x, bH/2, b.z);
            mesh.castShadow = true; mesh.receiveShadow = true;
            tableGroup.add(mesh);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(b.w+0.02, 0.04, b.d+0.02), gold);
            trim.position.set(b.x, bH+0.02, b.z);
            tableGroup.add(trim);
        });
    }

    function createGoldLines() {
        const goldMat = new THREE.MeshStandardMaterial({ color: GOLD_COLOR, roughness: 0.18, metalness: 0.95 });
        const lH = 0.016, t = 0.025, inset = 0.35;
        [
            { w: TABLE_WIDTH-inset*2, d: t, x: 0,                z: -TABLE_DEPTH/2+inset },
            { w: TABLE_WIDTH-inset*2, d: t, x: 0,                z:  TABLE_DEPTH/2-inset },
            { w: t, d: TABLE_DEPTH-inset*2, x: -TABLE_WIDTH/2+inset, z: 0 },
            { w: t, d: TABLE_DEPTH-inset*2, x:  TABLE_WIDTH/2-inset, z: 0 }
        ].forEach(l => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(l.w, lH, l.d), goldMat);
            m.position.set(l.x, 0.022, l.z);
            tableGroup.add(m);
        });

        const dGeo = new THREE.CircleGeometry(0.1, 4);
        [
            [-TABLE_WIDTH/2+inset, -TABLE_DEPTH/2+inset],
            [ TABLE_WIDTH/2-inset, -TABLE_DEPTH/2+inset],
            [-TABLE_WIDTH/2+inset,  TABLE_DEPTH/2-inset],
            [ TABLE_WIDTH/2-inset,  TABLE_DEPTH/2-inset]
        ].forEach(([x,z]) => {
            const m = new THREE.Mesh(dGeo, goldMat);
            m.rotation.x = -Math.PI/2; m.rotation.z = Math.PI/4;
            m.position.set(x, 0.024, z);
            tableGroup.add(m);
        });
    }

    function createGridOnFelt() {
        gridCellMeshes = [];
        const goldMat = new THREE.MeshStandardMaterial({ color: GOLD_COLOR, roughness: 0.18, metalness: 0.95 });

        for (let row = 0; row < GRID_ROWS; row++) {
            gridCellMeshes[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                const x = GRID_START_X + col * GRID_CELL_W;
                const z = GRID_START_Z + row * GRID_CELL_H;

                const cellMat = new THREE.MeshStandardMaterial({
                    color: 0x0a3a1a, roughness: 0.9,
                    transparent: true, opacity: 0.0, depthWrite: false
                });
                const cell = new THREE.Mesh(
                    new THREE.PlaneGeometry(GRID_CELL_W - 0.06, GRID_CELL_H - 0.06),
                    cellMat
                );
                cell.rotation.x = -Math.PI/2;
                cell.position.set(x, 0.026, z);
                cell.userData = { row, col, id: GRID_LAYOUT[row][col] };
                tableGroup.add(cell);
                gridCellMeshes[row][col] = cell;

                // Gold border lines for this cell
                const addLine = (lw, ld, lx, lz) => {
                    const m = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.014, ld), goldMat);
                    m.position.set(lx, 0.022, lz);
                    tableGroup.add(m);
                };
                addLine(GRID_CELL_W+0.02, 0.028, x, z-GRID_CELL_H/2);  // top
                addLine(0.028, GRID_CELL_H+0.02, x+GRID_CELL_W/2, z);  // right
                if (col === 0) addLine(0.028, GRID_CELL_H+0.02, x-GRID_CELL_W/2, z);
                if (row === GRID_ROWS-1) addLine(GRID_CELL_W+0.02, 0.028, x, z+GRID_CELL_H/2);

                tableGroup.add(createTextLabel(GRID_LAYOUT[row][col], GRID_CELL_W*0.85, GRID_CELL_H*0.85, x, z));
            }
        }
    }

    function createTextLabel(text, w, h, x, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 160);
        ctx.fillStyle = '#c9a84c';
        ctx.font = 'bold 52px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 5;
        ctx.fillText(text, 128, 80);
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 8;
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, depthWrite: false })
        );
        mesh.rotation.x = -Math.PI/2;
        mesh.position.set(x, 0.032, z);
        return mesh;
    }

    function createWhiskeyGlasses() {
        // Player side glass (bottom-left of table)
        const g1 = buildWhiskeyGlass();
        g1.position.set(-TABLE_WIDTH/2 + 1.2, 0.3, TABLE_DEPTH/2 - 0.6);
        g1.scale.set(1.4, 1.4, 1.4);
        tableGroup.add(g1);

        // Opponent side glass (top-right of table)
        const g2 = buildWhiskeyGlass();
        g2.position.set(TABLE_WIDTH/2 - 1.2, 0.3, -TABLE_DEPTH/2 + 0.6);
        g2.scale.set(1.4, 1.4, 1.4);
        tableGroup.add(g2);
    }

    function buildWhiskeyGlass() {
        const g = new THREE.Group();

        // Thick glass body (tumbler style)
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xccddff, transparent: true, opacity: 0.18,
            roughness: 0.0, metalness: 0.05, side: THREE.DoubleSide,
            clearcoat: 1.0, clearcoatRoughness: 0.0,
            reflectivity: 0.9
        });
        // Outer shell
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 24, 1, true), glassMat));

        // Thick bottom
        const botMat = new THREE.MeshPhysicalMaterial({
            color: 0xccddff, transparent: true, opacity: 0.35,
            roughness: 0.0, clearcoat: 1.0, reflectivity: 0.9
        });
        const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24), botMat);
        bot.position.y = -0.17;
        g.add(bot);

        // Whiskey liquid
        const liqMat = new THREE.MeshStandardMaterial({
            color: 0xc07010, transparent: true, opacity: 0.82, roughness: 0.02, metalness: 0.0
        });
        const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.145, 0.18, 24), liqMat);
        liq.position.y = -0.06;
        g.add(liq);

        // Liquid surface (shiny top)
        const surfMat = new THREE.MeshStandardMaterial({
            color: 0xd08020, transparent: true, opacity: 0.7, roughness: 0.0, metalness: 0.2
        });
        const surf = new THREE.Mesh(new THREE.CircleGeometry(0.155, 24), surfMat);
        surf.rotation.x = -Math.PI / 2;
        surf.position.y = 0.03;
        g.add(surf);

        // Ice cubes
        const iceMat = new THREE.MeshPhysicalMaterial({
            color: 0xddeeff, transparent: true, opacity: 0.55,
            roughness: 0.0, metalness: 0.02, clearcoat: 1.0
        });
        for (let i = 0; i < 3; i++) {
            const size = 0.05 + Math.random() * 0.03;
            const ice = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), iceMat);
            const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
            ice.position.set(Math.cos(angle) * 0.06, 0.02 + i * 0.02, Math.sin(angle) * 0.06);
            ice.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
            g.add(ice);
        }

        g.castShadow = true;
        return g;
    }

    function createCornerDecorations() {
        const goldMat = new THREE.MeshStandardMaterial({ color: GOLD_COLOR, roughness: 0.2, metalness: 0.9 });
        [
            [-TABLE_WIDTH/2+1,  TABLE_DEPTH/2-1],
            [ TABLE_WIDTH/2-1,  TABLE_DEPTH/2-1],
            [-TABLE_WIDTH/2+1, -TABLE_DEPTH/2+1],
            [ TABLE_WIDTH/2-1, -TABLE_DEPTH/2+1]
        ].forEach(([x,z]) => {
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.32, 36), goldMat);
            ring.rotation.x = -Math.PI/2; ring.position.set(x, 0.024, z);
            tableGroup.add(ring);
            const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), goldMat);
            dot.rotation.x = -Math.PI/2; dot.position.set(x, 0.025, z);
            tableGroup.add(dot);
        });
    }

    // ---- Public API ----
    function highlightCell(row, col, canSelect) {
        const cell = gridCellMeshes[row]?.[col];
        if (!cell) return;
        if (canSelect) {
            cell.material.color.setHex(0x3a8a3a);
            cell.material.opacity = 0.45;
            cell.material.emissive = new THREE.Color(0x1a4a1a);
            cell.material.emissiveIntensity = 0.4;
        } else {
            cell.material.opacity = 0.0;
            cell.material.emissiveIntensity = 0;
        }
    }

    function setCellOwner(row, col, owner) {
        const cell = gridCellMeshes[row]?.[col];
        if (!cell) return;
        if (owner === 'player:1') { cell.material.color.setHex(0x2a6a2a); cell.material.opacity = 0.5; }
        else if (owner === 'player:2') { cell.material.color.setHex(0x6a2020); cell.material.opacity = 0.5; }
    }

    function resetCellHighlights() {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const cell = gridCellMeshes[r]?.[c];
                if (cell && !cell.userData.owner) {
                    cell.material.opacity = 0.0;
                    cell.material.emissiveIntensity = 0;
                }
            }
        }
    }

    function getGridCellPosition(row, col) {
        return {
            x: GRID_START_X + col * GRID_CELL_W,
            y: 0.12,
            z: GRID_START_Z + row * GRID_CELL_H
        };
    }

    function getGridCellMeshes() { return gridCellMeshes; }
    function getGridLayout()      { return GRID_LAYOUT; }
    function getTableGroup()      { return tableGroup; }

    return {
        create, highlightCell, setCellOwner, resetCellHighlights,
        getGridCellPosition, getGridCellMeshes, getGridLayout, getTableGroup,
        GRID_ROWS, GRID_COLS, GRID_CELL_W, GRID_CELL_H, GRID_START_X, GRID_START_Z
    };
})();
