/* ============================================
   POKER CHIPS - RED for player, BLACK for opponent
   Both players see each other's chip placements
   ============================================ */

const ChipSystem = (() => {
    const CHIP_R  = 0.22;
    const CHIP_H  = 0.055;
    const STRIPES = 8;
    const CHIP_COUNT = 12;

    const PLAYER_POS   = { x: 6.2, z:  3.2 };
    const OPPONENT_POS = { x: 6.2, z: -3.2 };

    // All RED for player
    const PLAYER_COLOR = 0xcc1111;
    // All BLACK for opponent
    const OPPONENT_COLOR = 0x111111;

    let scene;
    let playerChips   = [];
    let opponentChips = [];
    let placedChips   = [];

    function init(sceneRef) {
        scene = sceneRef;
        buildStack(PLAYER_POS,   PLAYER_COLOR,   playerChips);
        buildStack(OPPONENT_POS, OPPONENT_COLOR, opponentChips);
    }

    function buildStack(pos, color, arr) {
        for (let i = 0; i < CHIP_COUNT; i++) {
            const chip = makeChip(color);
            chip.position.set(
                pos.x + (Math.random() - 0.5) * 0.04,
                CHIP_H / 2 + i * CHIP_H,
                pos.z + (Math.random() - 0.5) * 0.04
            );
            chip.rotation.y = Math.random() * Math.PI * 2;
            scene.add(chip);
            arr.push(chip);
        }
    }

    function makeChip(color) {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color, roughness: 0.3, metalness: 0.25
        });
        group.add(new THREE.Mesh(
            new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_H, 32), bodyMat
        ));

        // Edge stripes
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        for (let i = 0; i < STRIPES; i++) {
            const angle = (i / STRIPES) * Math.PI * 2;
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, CHIP_H + 0.001, 0.07), stripeMat
            );
            stripe.position.x = Math.cos(angle) * (CHIP_R - 0.012);
            stripe.position.z = Math.sin(angle) * (CHIP_R - 0.012);
            stripe.rotation.y = -angle;
            group.add(stripe);
        }

        // Top ring
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(CHIP_R * 0.45, CHIP_R * 0.52, 32), ringMat
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = CHIP_H / 2 + 0.001;
        group.add(ring);

        // Center gold emblem
        const centerMat = new THREE.MeshStandardMaterial({
            color: 0xd4a44c, roughness: 0.3, metalness: 0.7
        });
        const center = new THREE.Mesh(
            new THREE.CircleGeometry(CHIP_R * 0.2, 16), centerMat
        );
        center.rotation.x = -Math.PI / 2;
        center.position.y = CHIP_H / 2 + 0.002;
        group.add(center);

        group.castShadow = true;
        return group;
    }

    function flyChipToCell(row, col, isPlayer) {
        const arr = isPlayer ? playerChips : opponentChips;
        if (arr.length === 0) return;

        const chip = arr.pop();
        const target = CasinoTable.getGridCellPosition(row, col);
        const stackHeight = placedChips.filter(c => c.row === row && c.col === col).length;

        placedChips.push({ chip, row, col, isPlayer });

        gsap.to(chip.position, { y: 3.5, duration: 0.3, ease: 'power2.out' });
        gsap.to(chip.position, { x: target.x, z: target.z, duration: 0.55, ease: 'power2.inOut' });
        gsap.to(chip.position, {
            y: target.y + stackHeight * CHIP_H,
            duration: 0.35, delay: 0.3, ease: 'bounce.out'
        });
        gsap.to(chip.rotation, { y: `+=${Math.PI * 6}`, duration: 0.85, ease: 'power2.out' });
    }

    function getPlayerChipCount()   { return playerChips.length; }
    function getOpponentChipCount() { return opponentChips.length; }

    return { init, flyChipToCell, getPlayerChipCount, getOpponentChipCount };
})();
