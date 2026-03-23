/* ============================================
   CASINO TABLE
   Green felt with gold lines and wood border
   ============================================ */

const CasinoTable = (() => {
    let tableGroup;
    const TABLE_WIDTH = 14;
    const TABLE_DEPTH = 9;
    const TABLE_HEIGHT = 0.5;
    const FELT_COLOR = 0x1a5c2a;
    const WOOD_COLOR = 0x3a1a0a;
    const GOLD_COLOR = 0xd4a44c;

    // Grid dimensions on the felt
    const GRID_COLS = 5;
    const GRID_ROWS = 5;
    const GRID_CELL_W = 1.3;
    const GRID_CELL_H = 0.8;
    const GRID_START_X = -3.2;
    const GRID_START_Z = -2.0;

    // Grid labels matching the backend
    const GRID_LAYOUT = [
        ['1', '3', 'Défi', '4', '6'],
        ['2', 'Carré', 'Sec', 'Full', '5'],
        ['≤8', 'Full', 'Yam', 'Défi', 'Suite'],
        ['6', 'Sec', 'Suite', '≤8', '1'],
        ['3', '2', 'Carré', '5', '4']
    ];

    let gridCellMeshes = []; // 2D array of meshes for cells
    let gridCellMarkers = []; // 2D array of chip markers

    function create(scene) {
        tableGroup = new THREE.Group();

        createTableBase();
        createFeltSurface();
        createWoodBorder();
        createGoldLines();
        createGridOnFelt();
        createCornerDecorations();

        scene.add(tableGroup);
        return tableGroup;
    }

    function createTableBase() {
        // Main wood body
        const baseGeo = new THREE.BoxGeometry(TABLE_WIDTH + 1, TABLE_HEIGHT, TABLE_DEPTH + 1);
        const baseMat = new THREE.MeshStandardMaterial({
            color: WOOD_COLOR,
            roughness: 0.7,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = -TABLE_HEIGHT / 2;
        base.receiveShadow = true;
        base.castShadow = true;
        tableGroup.add(base);

        // Table legs (subtle, barely visible)
        const legGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2a0f05, roughness: 0.8 });
        const legPositions = [
            [-TABLE_WIDTH/2 + 0.5, -0.7, -TABLE_DEPTH/2 + 0.5],
            [TABLE_WIDTH/2 - 0.5, -0.7, -TABLE_DEPTH/2 + 0.5],
            [-TABLE_WIDTH/2 + 0.5, -0.7, TABLE_DEPTH/2 - 0.5],
            [TABLE_WIDTH/2 - 0.5, -0.7, TABLE_DEPTH/2 - 0.5]
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(...pos);
            leg.castShadow = true;
            tableGroup.add(leg);
        });
    }

    function createFeltSurface() {
        const feltGeo = new THREE.PlaneGeometry(TABLE_WIDTH, TABLE_DEPTH);
        const feltMat = new THREE.MeshStandardMaterial({
            color: FELT_COLOR,
            roughness: 0.92,
            metalness: 0.0,
            bumpScale: 0.01
        });
        const felt = new THREE.Mesh(feltGeo, feltMat);
        felt.rotation.x = -Math.PI / 2;
        felt.position.y = 0.01;
        felt.receiveShadow = true;
        tableGroup.add(felt);
    }

    function createWoodBorder() {
        const borderHeight = 0.25;
        const borderWidth = 0.4;
        const mat = new THREE.MeshStandardMaterial({
            color: 0x4a2010,
            roughness: 0.6,
            metalness: 0.15
        });

        // Create rounded border segments
        const borders = [
            { w: TABLE_WIDTH + borderWidth, h: borderHeight, d: borderWidth,
              x: 0, y: borderHeight/2, z: -TABLE_DEPTH/2 },
            { w: TABLE_WIDTH + borderWidth, h: borderHeight, d: borderWidth,
              x: 0, y: borderHeight/2, z: TABLE_DEPTH/2 },
            { w: borderWidth, h: borderHeight, d: TABLE_DEPTH + borderWidth,
              x: -TABLE_WIDTH/2, y: borderHeight/2, z: 0 },
            { w: borderWidth, h: borderHeight, d: TABLE_DEPTH + borderWidth,
              x: TABLE_WIDTH/2, y: borderHeight/2, z: 0 }
        ];

        borders.forEach(b => {
            const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(b.x, b.y, b.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            tableGroup.add(mesh);
        });

        // Gold trim on top of wood border
        const trimMat = new THREE.MeshStandardMaterial({
            color: GOLD_COLOR,
            roughness: 0.3,
            metalness: 0.8
        });
        borders.forEach(b => {
            const geo = new THREE.BoxGeometry(b.w + 0.02, 0.03, b.d + 0.02);
            const mesh = new THREE.Mesh(geo, trimMat);
            mesh.position.set(b.x, b.y + borderHeight/2 + 0.015, b.z);
            tableGroup.add(mesh);
        });
    }

    function createGoldLines() {
        const lineMat = new THREE.MeshStandardMaterial({
            color: GOLD_COLOR,
            roughness: 0.3,
            metalness: 0.8
        });

        // Inner border line on felt
        const lineThickness = 0.02;
        const lineHeight = 0.015;
        const inset = 0.3;
        const innerLines = [
            { w: TABLE_WIDTH - inset*2, d: lineThickness,
              x: 0, z: -TABLE_DEPTH/2 + inset },
            { w: TABLE_WIDTH - inset*2, d: lineThickness,
              x: 0, z: TABLE_DEPTH/2 - inset },
            { w: lineThickness, d: TABLE_DEPTH - inset*2,
              x: -TABLE_WIDTH/2 + inset, z: 0 },
            { w: lineThickness, d: TABLE_DEPTH - inset*2,
              x: TABLE_WIDTH/2 - inset, z: 0 }
        ];

        innerLines.forEach(l => {
            const geo = new THREE.BoxGeometry(l.w, lineHeight, l.d);
            const mesh = new THREE.Mesh(geo, lineMat);
            mesh.position.set(l.x, 0.02, l.z);
            tableGroup.add(mesh);
        });

        // Diamond decorations at corners of inner border
        const diamondGeo = new THREE.CircleGeometry(0.08, 4);
        const cornerPositions = [
            [-TABLE_WIDTH/2 + inset, TABLE_DEPTH/2 - inset],
            [TABLE_WIDTH/2 - inset, TABLE_DEPTH/2 - inset],
            [-TABLE_WIDTH/2 + inset, -TABLE_DEPTH/2 + inset],
            [TABLE_WIDTH/2 - inset, -TABLE_DEPTH/2 + inset]
        ];

        cornerPositions.forEach(([x, z]) => {
            const mesh = new THREE.Mesh(diamondGeo, lineMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.rotation.z = Math.PI / 4;
            mesh.position.set(x, 0.025, z);
            tableGroup.add(mesh);
        });
    }

    function createGridOnFelt() {
        gridCellMeshes = [];
        gridCellMarkers = [];

        const cellMat = new THREE.MeshStandardMaterial({
            color: 0x1a5c2a,
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.0
        });

        const borderMat = new THREE.MeshStandardMaterial({
            color: GOLD_COLOR,
            roughness: 0.3,
            metalness: 0.8
        });

        for (let row = 0; row < GRID_ROWS; row++) {
            gridCellMeshes[row] = [];
            gridCellMarkers[row] = [];

            for (let col = 0; col < GRID_COLS; col++) {
                const x = GRID_START_X + col * GRID_CELL_W;
                const z = GRID_START_Z + row * GRID_CELL_H;

                // Cell background (invisible by default)
                const cellGeo = new THREE.PlaneGeometry(GRID_CELL_W - 0.06, GRID_CELL_H - 0.06);
                const cell = new THREE.Mesh(cellGeo, cellMat.clone());
                cell.rotation.x = -Math.PI / 2;
                cell.position.set(x, 0.025, z);
                cell.userData = { row, col, id: GRID_LAYOUT[row][col] };
                tableGroup.add(cell);
                gridCellMeshes[row][col] = cell;

                // Gold cell border lines
                const lineH = 0.012;
                // Top
                const topLine = new THREE.Mesh(
                    new THREE.BoxGeometry(GRID_CELL_W, lineH, 0.015),
                    borderMat
                );
                topLine.position.set(x, 0.02, z - GRID_CELL_H/2);
                tableGroup.add(topLine);

                // Left
                if (col === 0) {
                    const leftLine = new THREE.Mesh(
                        new THREE.BoxGeometry(0.015, lineH, GRID_CELL_H),
                        borderMat
                    );
                    leftLine.position.set(x - GRID_CELL_W/2, 0.02, z);
                    tableGroup.add(leftLine);
                }

                // Right
                const rightLine = new THREE.Mesh(
                    new THREE.BoxGeometry(0.015, lineH, GRID_CELL_H),
                    borderMat
                );
                rightLine.position.set(x + GRID_CELL_W/2, 0.02, z);
                tableGroup.add(rightLine);

                // Bottom (only last row)
                if (row === GRID_ROWS - 1) {
                    const bottomLine = new THREE.Mesh(
                        new THREE.BoxGeometry(GRID_CELL_W, lineH, 0.015),
                        borderMat
                    );
                    bottomLine.position.set(x, 0.02, z + GRID_CELL_H/2);
                    tableGroup.add(bottomLine);
                }

                // Text label on felt (using a small plane with canvas texture)
                const label = createTextLabel(GRID_LAYOUT[row][col], GRID_CELL_W - 0.1, GRID_CELL_H - 0.1);
                label.position.set(x, 0.03, z);
                tableGroup.add(label);

                // Marker placeholder (null until filled)
                gridCellMarkers[row][col] = null;
            }
        }
    }

    function createTextLabel(text, width, height) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 80;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#c49a3c';
        ctx.font = 'bold 24px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width/2, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;

        const mat = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            roughness: 0.9,
            metalness: 0.0,
            depthWrite: false
        });

        const geo = new THREE.PlaneGeometry(width, height);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        return mesh;
    }

    function createCornerDecorations() {
        // Decorative circles in table corners (like a real casino table)
        const decorMat = new THREE.MeshStandardMaterial({
            color: GOLD_COLOR,
            roughness: 0.3,
            metalness: 0.8
        });

        const positions = [
            [-TABLE_WIDTH/2 + 1, TABLE_DEPTH/2 - 1],
            [TABLE_WIDTH/2 - 1, TABLE_DEPTH/2 - 1],
            [-TABLE_WIDTH/2 + 1, -TABLE_DEPTH/2 + 1],
            [TABLE_WIDTH/2 - 1, -TABLE_DEPTH/2 + 1]
        ];

        positions.forEach(([x, z]) => {
            // Outer ring
            const ringGeo = new THREE.RingGeometry(0.25, 0.28, 32);
            const ring = new THREE.Mesh(ringGeo, decorMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(x, 0.025, z);
            tableGroup.add(ring);

            // Inner dot
            const dotGeo = new THREE.CircleGeometry(0.06, 16);
            const dot = new THREE.Mesh(dotGeo, decorMat);
            dot.rotation.x = -Math.PI / 2;
            dot.position.set(x, 0.025, z);
            tableGroup.add(dot);
        });
    }

    function highlightCell(row, col, canSelect) {
        if (!gridCellMeshes[row] || !gridCellMeshes[row][col]) return;
        const cell = gridCellMeshes[row][col];
        if (canSelect) {
            cell.material.color.setHex(0x3a7a3a);
            cell.material.opacity = 0.4;
            cell.material.emissive = new THREE.Color(0x2a5a2a);
            cell.material.emissiveIntensity = 0.3;
        } else {
            cell.material.opacity = 0.0;
            cell.material.emissiveIntensity = 0;
        }
    }

    function setCellOwner(row, col, owner) {
        if (!gridCellMeshes[row] || !gridCellMeshes[row][col]) return;
        const cell = gridCellMeshes[row][col];

        if (owner === 'player:1') {
            cell.material.color.setHex(0x2a6a2a);
            cell.material.opacity = 0.5;
        } else if (owner === 'player:2') {
            cell.material.color.setHex(0x6a2a2a);
            cell.material.opacity = 0.5;
        }
    }

    function resetCellHighlights() {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (gridCellMeshes[r] && gridCellMeshes[r][c]) {
                    const cell = gridCellMeshes[r][c];
                    if (!cell.userData.owner) {
                        cell.material.opacity = 0.0;
                        cell.material.emissiveIntensity = 0;
                    }
                }
            }
        }
    }

    function getGridCellMeshes() { return gridCellMeshes; }
    function getGridLayout() { return GRID_LAYOUT; }
    function getTableGroup() { return tableGroup; }

    function getGridCellPosition(row, col) {
        return {
            x: GRID_START_X + col * GRID_CELL_W,
            y: 0.1,
            z: GRID_START_Z + row * GRID_CELL_H
        };
    }

    return {
        create, highlightCell, setCellOwner, resetCellHighlights,
        getGridCellMeshes, getGridLayout, getTableGroup,
        getGridCellPosition,
        GRID_ROWS, GRID_COLS
    };
})();
