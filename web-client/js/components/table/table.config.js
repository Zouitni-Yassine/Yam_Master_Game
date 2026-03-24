const TableConfig = {
    WIDTH: 15, DEPTH: 10, HEIGHT: 0.55,
    FELT: 0x0a3a1a, WOOD: 0x2a0e05, GOLD: 0xd4a44c,
    GRID_COLS: 5, GRID_ROWS: 5, CELL_W: 2.1, CELL_H: 1.3,
    get START_X() { return -(this.GRID_COLS * this.CELL_W) / 2 + this.CELL_W / 2; },
    get START_Z() { return -(this.GRID_ROWS * this.CELL_H) / 2 + this.CELL_H / 2; },
    LAYOUT: [
        ['1',  '3',     'Défi',  '4',    '6'    ],
        ['2',  'Carré', 'Sec',   'Full', '5'    ],
        ['≤8', 'Full',  'Yam',   'Défi', 'Suite'],
        ['6',  'Sec',   'Suite', '≤8',   '1'    ],
        ['3',  '2',     'Carré', '5',    '4'    ]
    ]
};
