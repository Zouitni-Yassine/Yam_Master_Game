const ChipSystem = (() => {
    const CHIP_COUNT = 12;
    // player:1 always RED, player:2 always BLACK — same for both clients
    const P1_POS   = { x: 5.8, z:  3.0 };
    const P2_POS   = { x: 5.8, z: -3.0 };
    const P1_COLOR = 0xcc1111;
    const P2_COLOR = 0x111111;

    let scene;
    let p1Chips = [], p2Chips = [];
    let placedChips = [];
    let swapped = false;

    function init(sceneRef) {
        scene = sceneRef;
        buildStack(P1_POS, P1_COLOR, p1Chips);
        buildStack(P2_POS, P2_COLOR, p2Chips);
    }

    function buildStack(pos, color, arr) {
        for (let i = 0; i < CHIP_COUNT; i++) {
            const chip = ChipModel.make(color);
            chip.position.set(
                pos.x + (Math.random()-0.5) * 0.04,
                ChipModel.H / 2 + i * ChipModel.H,
                pos.z + (Math.random()-0.5) * 0.04
            );
            chip.rotation.y = Math.random() * Math.PI * 2;
            scene.add(chip); arr.push(chip);
        }
    }

    // Called once at game start — if player 2, swap stack positions so own chips are in front
    function setPlayerSide(isPlayer1) {
        if (isPlayer1) return; // player 1 already has correct layout
        swapped = true;
        // Move p1 chips to P2_POS (far) and p2 chips to P1_POS (near)
        p1Chips.forEach(chip => { chip.position.x = P2_POS.x; chip.position.z = P2_POS.z; });
        p2Chips.forEach(chip => { chip.position.x = P1_POS.x; chip.position.z = P1_POS.z; });
    }

    // ownerId = 'player:1' | 'player:2' — determines chip color consistently for both clients
    function flyChipToCell(row, col, ownerId) {
        const arr = ownerId === 'player:1' ? p1Chips : p2Chips;
        if (arr.length === 0) return;
        const chip        = arr.pop();
        const target      = CasinoTable.getGridCellPosition(row, col);
        const stackHeight = placedChips.filter(c => c.row === row && c.col === col).length;
        placedChips.push({ chip, row, col, ownerId });

        gsap.to(chip.position, { y: 3.5, duration: 0.28, ease: 'power2.out' });
        gsap.to(chip.position, { x: target.x, z: target.z, duration: 0.52, delay: 0.05, ease: 'power2.inOut' });
        gsap.to(chip.position, { y: target.y + stackHeight * ChipModel.H, duration: 0.38, delay: 0.28, ease: 'bounce.out' });
        gsap.to(chip.rotation, { y: `+=${Math.PI * 6}`, duration: 0.82, ease: 'power2.out' });
    }

    function removeChipFromCell(row, col) {
        const idx = placedChips.findIndex(c => c.row === row && c.col === col);
        if (idx === -1) return;
        const { chip, ownerId } = placedChips.splice(idx, 1)[0];
        const stackArr = ownerId === 'player:1' ? p1Chips : p2Chips;

        // Animate chip flying up and fading out, then return to stack
        gsap.to(chip.position, { y: 4, duration: 0.3, ease: 'power2.out' });
        gsap.to(chip.scale, { x: 0, y: 0, z: 0, duration: 0.3, delay: 0.2, ease: 'power2.in', onComplete: () => {
            // Reset scale and return chip to its stack
            chip.scale.set(1, 1, 1);
            const isP1 = ownerId === 'player:1';
            const stackPos = swapped ? (isP1 ? P2_POS : P1_POS) : (isP1 ? P1_POS : P2_POS);
            chip.position.set(
                stackPos.x + (Math.random() - 0.5) * 0.04,
                ChipModel.H / 2 + stackArr.length * ChipModel.H,
                stackPos.z + (Math.random() - 0.5) * 0.04
            );
            stackArr.push(chip);
        }});
    }

    return { init, flyChipToCell, removeChipFromCell, setPlayerSide };
})();
