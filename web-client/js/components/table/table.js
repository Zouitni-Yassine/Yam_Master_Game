const CasinoTable = (() => {
    let tableGroup;
    let gridCellMeshes = [];

    function create(scene) {
        tableGroup = new THREE.Group();
        TableGeometry.createBase(tableGroup);
        TableGeometry.createFelt(tableGroup);
        TableGeometry.createBorder(tableGroup);
        TableGeometry.createGoldLines(tableGroup);
        gridCellMeshes = TableGeometry.createGrid(tableGroup);
        TableGlass.addGlasses(tableGroup);
        TableGeometry.createCorners(tableGroup);
        scene.add(tableGroup);
        return tableGroup;
    }

    function highlightCell(row, col, canSelect) {
        const cell = gridCellMeshes[row]?.[col];
        if (!cell) return;
        if (canSelect) {
            cell.material.color.setHex(0x3a8a3a); cell.material.opacity = 0.45;
            cell.material.emissive = new THREE.Color(0x1a4a1a); cell.material.emissiveIntensity = 0.4;
        } else {
            cell.material.opacity = 0; cell.material.emissiveIntensity = 0;
        }
    }

    function setCellOwner(row, col, owner) {
        const cell = gridCellMeshes[row]?.[col];
        if (!cell) return;
        if      (owner === 'player:1') { cell.material.color.setHex(0x2a6a2a); cell.material.opacity = 0.5; }
        else if (owner === 'player:2') { cell.material.color.setHex(0x6a2020); cell.material.opacity = 0.5; }
    }

    function resetCellHighlights() {
        for (let r = 0; r < TableConfig.GRID_ROWS; r++)
            for (let c = 0; c < TableConfig.GRID_COLS; c++) {
                const cell = gridCellMeshes[r]?.[c];
                if (cell && !cell.userData.owner) { cell.material.opacity = 0; cell.material.emissiveIntensity = 0; }
            }
    }

    function getGridCellPosition(row, col) {
        return { x: TableConfig.START_X + col * TableConfig.CELL_W, y: 0.12, z: TableConfig.START_Z + row * TableConfig.CELL_H };
    }

    return {
        create, highlightCell, setCellOwner, resetCellHighlights, getGridCellPosition,
        getGridCellMeshes: () => gridCellMeshes,
        getGridLayout:     () => TableConfig.LAYOUT,
        getTableGroup:     () => tableGroup,
        get GRID_ROWS()   { return TableConfig.GRID_ROWS; },
        get GRID_COLS()   { return TableConfig.GRID_COLS; },
        get GRID_CELL_W() { return TableConfig.CELL_W; },
        get GRID_CELL_H() { return TableConfig.CELL_H; },
        get GRID_START_X(){ return TableConfig.START_X; },
        get GRID_START_Z(){ return TableConfig.START_Z; }
    };
})();
