/* ============================================
   POKER CHIPS
   Stacked chips on the right, fly to grid cells
   ============================================ */

const ChipSystem = (() => {
    let scene;
    let chipStack = [];
    const STACK_POSITION = { x: 5.5, y: 0.1, z: 2.5 };
    const CHIP_RADIUS = 0.25;
    const CHIP_HEIGHT = 0.06;
    const STACK_COUNT = 20;

    const PLAYER_CHIP_COLOR = 0x2a8a2a;
    const OPPONENT_CHIP_COLOR = 0x8a2a2a;
    const NEUTRAL_CHIP_COLOR = 0xd4a44c;

    function init(sceneRef) {
        scene = sceneRef;
        createChipStack();
    }

    function createChipStack() {
        for (let i = 0; i < STACK_COUNT; i++) {
            const chip = createChip(NEUTRAL_CHIP_COLOR);
            chip.position.set(
                STACK_POSITION.x + (Math.random() - 0.5) * 0.05,
                STACK_POSITION.y + i * CHIP_HEIGHT,
                STACK_POSITION.z + (Math.random() - 0.5) * 0.05
            );
            chip.rotation.y = Math.random() * Math.PI * 2;
            scene.add(chip);
            chipStack.push(chip);
        }

        // Second stack
        for (let i = 0; i < 12; i++) {
            const chip = createChip(NEUTRAL_CHIP_COLOR);
            chip.position.set(
                STACK_POSITION.x + 0.7 + (Math.random() - 0.5) * 0.05,
                STACK_POSITION.y + i * CHIP_HEIGHT,
                STACK_POSITION.z - 0.3 + (Math.random() - 0.5) * 0.05
            );
            chip.rotation.y = Math.random() * Math.PI * 2;
            scene.add(chip);
            chipStack.push(chip);
        }

        // Small scattered chips
        for (let i = 0; i < 5; i++) {
            const chip = createChip(i < 3 ? PLAYER_CHIP_COLOR : OPPONENT_CHIP_COLOR);
            chip.position.set(
                STACK_POSITION.x + (Math.random() - 0.5) * 2,
                STACK_POSITION.y,
                STACK_POSITION.z + 1.5 + (Math.random() - 0.5) * 1
            );
            chip.rotation.x = Math.random() * 0.3;
            chip.rotation.y = Math.random() * Math.PI * 2;
            scene.add(chip);
        }
    }

    function createChip(color) {
        const group = new THREE.Group();

        // Main body
        const bodyGeo = new THREE.CylinderGeometry(CHIP_RADIUS, CHIP_RADIUS, CHIP_HEIGHT, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Edge stripes
        const stripeCount = 8;
        for (let i = 0; i < stripeCount; i++) {
            const angle = (i / stripeCount) * Math.PI * 2;
            const stripeGeo = new THREE.BoxGeometry(0.03, CHIP_HEIGHT + 0.001, 0.08);
            const stripeMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.5,
                metalness: 0.2
            });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.x = Math.cos(angle) * (CHIP_RADIUS - 0.015);
            stripe.position.z = Math.sin(angle) * (CHIP_RADIUS - 0.015);
            stripe.rotation.y = -angle;
            group.add(stripe);
        }

        // Top ring decoration
        const ringGeo = new THREE.RingGeometry(CHIP_RADIUS * 0.5, CHIP_RADIUS * 0.55, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = CHIP_HEIGHT / 2 + 0.001;
        group.add(ring);

        return group;
    }

    function flyChipToCell(row, col, isPlayer) {
        const color = isPlayer ? PLAYER_CHIP_COLOR : OPPONENT_CHIP_COLOR;
        const chip = createChip(color);

        // Start from stack
        chip.position.set(STACK_POSITION.x, STACK_POSITION.y + STACK_COUNT * CHIP_HEIGHT, STACK_POSITION.z);
        chip.scale.set(0.5, 0.5, 0.5);
        scene.add(chip);

        const target = CasinoTable.getGridCellPosition(row, col);

        // Animate chip flying to cell
        const tl = gsap.timeline();

        // Rise up
        tl.to(chip.position, {
            y: 3,
            duration: 0.3,
            ease: 'power2.out'
        });

        // Fly to target
        tl.to(chip.position, {
            x: target.x,
            z: target.z,
            duration: 0.5,
            ease: 'power2.inOut'
        }, '-=0.1');

        // Scale up
        tl.to(chip.scale, {
            x: 0.8, y: 0.8, z: 0.8,
            duration: 0.4,
            ease: 'power2.out'
        }, '-=0.5');

        // Drop down with bounce
        tl.to(chip.position, {
            y: target.y,
            duration: 0.4,
            ease: 'bounce.out'
        });

        // Spin during flight
        gsap.to(chip.rotation, {
            y: Math.PI * 4,
            duration: 1.2,
            ease: 'power2.out'
        });

        return chip;
    }

    return { init, createChip, flyChipToCell };
})();
