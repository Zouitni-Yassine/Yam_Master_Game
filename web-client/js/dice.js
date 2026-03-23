/* ============================================
   3D DICE SYSTEM
   Red dice with canvas-texture faces (6 sides)
   ============================================ */

const DiceSystem = (() => {
    const DICE_SIZE = 0.55;
    const DICE_COLOR = 0xcc2020;
    const HELD_COLOR = 0x44ff66;
    const DICE_COUNT = 5;

    let diceGroup;
    let diceMeshes = [];
    let diceStates = [];
    let scene;
    let isPlayerTurn = false;
    let onDiceClickCallback = null;

    // Starting positions (aligned at bottom of table, in front of player)
    const REST_POSITIONS = [
        { x: -2.6, y: 0.35, z: 3.0 },
        { x: -1.3, y: 0.35, z: 3.0 },
        { x:  0.0, y: 0.35, z: 3.0 },
        { x:  1.3, y: 0.35, z: 3.0 },
        { x:  2.6, y: 0.35, z: 3.0 }
    ];

    // Scattered positions after roll (center of table)
    const ROLL_POSITIONS = [
        { x: -2.0, y: 0.35, z:  0.5 },
        { x: -0.7, y: 0.35, z: -0.4 },
        { x:  0.4, y: 0.35, z:  0.3 },
        { x:  1.6, y: 0.35, z: -0.5 },
        { x:  2.3, y: 0.35, z:  0.8 }
    ];

    /* ---- Canvas texture for a single die face ---- */
    function makeFaceTexture(value) {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Background: red with rounded rect feel
        ctx.fillStyle = '#cc2020';
        ctx.fillRect(0, 0, size, size);

        // Slight inner bevel (lighter top-left)
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, 'rgba(255,255,255,0.12)');
        grad.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        // Dot positions for values 1-6
        const patterns = {
            1: [[0.5, 0.5]],
            2: [[0.25, 0.25], [0.75, 0.75]],
            3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
            4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
            5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
            6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]]
        };

        const dots = patterns[value] || [];
        const r = size * 0.09;

        dots.forEach(([cx, cy]) => {
            // Shadow
            ctx.beginPath();
            ctx.arc(cx * size + 1, cy * size + 1, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fill();
            // White dot
            ctx.beginPath();
            ctx.arc(cx * size, cy * size, r, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        return tex;
    }

    /* ---- Build one die mesh with 6 textured faces ---- */
    function createDieMesh(index) {
        // Create 6 materials (one per face): +x, -x, +y, -y, +z, -z
        // Standard die layout: 1 opposite 6, 2 opposite 5, 3 opposite 4
        // Face order for BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
        const faceValues = [3, 4, 1, 6, 2, 5]; // BoxGeometry face order
        const materials = faceValues.map(v => new THREE.MeshStandardMaterial({
            map: makeFaceTexture(v),
            roughness: 0.3,
            metalness: 0.1
        }));

        const geo = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);
        const die = new THREE.Mesh(geo, materials);
        die.castShadow = true;
        die.receiveShadow = true;
        die.userData = { index, isDie: true };
        // Store which value is currently on top (starts undefined)
        die.userData.currentValue = null;
        return die;
    }

    function init(sceneRef) {
        scene = sceneRef;
        diceGroup = new THREE.Group();
        scene.add(diceGroup);

        for (let i = 0; i < DICE_COUNT; i++) {
            const die = createDieMesh(i);
            die.position.set(REST_POSITIONS[i].x, REST_POSITIONS[i].y, REST_POSITIONS[i].z);
            die.visible = false;
            diceGroup.add(die);
            diceMeshes.push(die);
            diceStates.push({ value: '', locked: true, id: i + 1 });
        }

        setupInteraction();
    }

    /* ---- Rotate die so face with `value` faces UP (+Y) ---- */
    function setDieValue(index, value) {
        const die = diceMeshes[index];
        if (!die || value < 1 || value > 6) return;

        // BoxGeometry face order: +X=3, -X=4, +Y=1, -Y=6, +Z=2, -Z=5
        // Rotate so the desired value points UP (+Y)
        const rotations = {
            1: { x: 0,            z: 0 },           // +Y face (value=1) already up
            6: { x: Math.PI,      z: 0 },           // -Y face (value=6) → flip
            2: { x: Math.PI / 2,  z: 0 },           // +Z face (value=2) → tilt back
            5: { x: -Math.PI / 2, z: 0 },           // -Z face (value=5) → tilt forward
            3: { x: 0,            z: -Math.PI / 2 },// +X face (value=3) → tilt right
            4: { x: 0,            z: Math.PI / 2 }  // -X face (value=4) → tilt left
        };

        const rot = rotations[value];
        die.rotation.x = rot.x;
        die.rotation.z = rot.z;
        die.rotation.y = (Math.random() - 0.5) * 0.6; // slight random spin
        die.userData.currentValue = value;
        diceStates[index].value = value;
    }

    function setDiceLocked(index, locked) {
        diceStates[index].locked = locked;
        const die = diceMeshes[index];
        if (locked) {
            gsap.to(die.position, { y: 0.65, duration: 0.3, ease: 'back.out(2)' });
            // Tint materials green
            die.material.forEach(m => {
                m.emissive = new THREE.Color(0x003300);
                m.emissiveIntensity = 0.5;
            });
        } else {
            gsap.to(die.position, { y: 0.35, duration: 0.3, ease: 'power2.out' });
            die.material.forEach(m => {
                m.emissive = new THREE.Color(0x000000);
                m.emissiveIntensity = 0;
            });
        }
    }

    function setupInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        document.addEventListener('click', (e) => {
            if (!isPlayerTurn) return;
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, CasinoScene.getCamera());
            const hits = raycaster.intersectObjects(diceMeshes, false);
            if (hits.length > 0) {
                const idx = hits[0].object.userData.index;
                if (diceStates[idx].value !== '' && onDiceClickCallback) {
                    onDiceClickCallback(idx, diceStates[idx]);
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isPlayerTurn) return;
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, CasinoScene.getCamera());
            const hits = raycaster.intersectObjects(diceMeshes, false);
            document.body.style.cursor = hits.length > 0 ? 'pointer' : 'default';
        });
    }

    function showDice(show) {
        diceMeshes.forEach(die => { die.visible = show; });
    }

    function setPlayerTurn(isTurn) { isPlayerTurn = isTurn; }
    function onDiceClick(cb) { onDiceClickCallback = cb; }
    function getDiceMeshes() { return diceMeshes; }
    function getDiceStates() { return diceStates; }
    function getRestPositions() { return REST_POSITIONS; }
    function getRollPositions() { return ROLL_POSITIONS; }

    function updateDiceFromServer(serverDices) {
        serverDices.forEach((sd, i) => {
            if (i >= DICE_COUNT) return;
            diceStates[i].value = sd.value;
            diceStates[i].locked = sd.locked;
            diceStates[i].id = sd.id;

            if (sd.value !== '') {
                setDieValue(i, parseInt(sd.value));
                diceMeshes[i].visible = true;
            }

            // Sync lock glow (without GSAP height animation — just color)
            const die = diceMeshes[i];
            die.material.forEach(m => {
                if (sd.locked && sd.value !== '') {
                    m.emissive = new THREE.Color(0x003300);
                    m.emissiveIntensity = 0.5;
                } else {
                    m.emissive = new THREE.Color(0x000000);
                    m.emissiveIntensity = 0;
                }
            });
        });
    }

    function resetDice() {
        diceMeshes.forEach((die, i) => {
            diceStates[i] = { value: '', locked: true, id: i + 1 };
            die.rotation.set(0, 0, 0);
            die.userData.currentValue = null;
            die.material.forEach(m => {
                m.emissive = new THREE.Color(0x000000);
                m.emissiveIntensity = 0;
            });
            die.position.set(REST_POSITIONS[i].x, 0.35, REST_POSITIONS[i].z);
            die.visible = false;
        });
    }

    return {
        init, showDice, setDieValue, setDiceLocked, setPlayerTurn,
        onDiceClick, getDiceMeshes, getDiceStates,
        getRestPositions, getRollPositions,
        updateDiceFromServer, resetDice
    };
})();
