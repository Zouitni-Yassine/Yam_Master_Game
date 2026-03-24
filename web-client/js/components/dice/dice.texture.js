const DiceTexture = (() => {
    const PATTERNS = {
        1: [[0.5,  0.5 ]],
        2: [[0.27, 0.27], [0.73, 0.73]],
        3: [[0.27, 0.27], [0.5,  0.5 ], [0.73, 0.73]],
        4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
        5: [[0.27, 0.27], [0.73, 0.27], [0.5,  0.5 ], [0.27, 0.73], [0.73, 0.73]],
        6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5 ], [0.73, 0.5 ], [0.27, 0.78], [0.73, 0.78]]
    };

    function make(value) {
        const size   = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx    = canvas.getContext('2d');

        ctx.fillStyle = '#c8201e';
        ctx.fillRect(0, 0, size, size);

        const r = size * 0.088;
        (PATTERNS[value] || []).forEach(([cx, cy]) => {
            const x = cx * size, y = cy * size;
            ctx.beginPath(); ctx.arc(x+1.5, y+2, r+1.5, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();

            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fillStyle = '#ffffff'; ctx.fill();
        });

        const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 8;
        return tex;
    }

    return { make };
})();
