/* ============================================
   3D DICE SYSTEM
   Realistic ROUNDED red dice with indented dots
   ============================================ */

const DiceSystem = (() => {
    const DICE_SIZE = 0.55;
    const DICE_COUNT = 5;

    let diceGroup;
    let diceMeshes = [];
    let diceStates = [];
    let scene;
    let isPlayerTurn = false;
    let onDiceClickCallback = null;

    const REST_POSITIONS = [
        { x: -2.6, y: 0.35, z: 3.0 },
        { x: -1.3, y: 0.35, z: 3.0 },
        { x:  0.0, y: 0.35, z: 3.0 },
        { x:  1.3, y: 0.35, z: 3.0 },
        { x:  2.6, y: 0.35, z: 3.0 }
    ];

    const ROLL_POSITIONS = [
        { x: -2.0, y: 0.35, z:  0.5 },
        { x: -0.7, y: 0.35, z: -0.4 },
        { x:  0.4, y: 0.35, z:  0.3 },
        { x:  1.6, y: 0.35, z: -0.5 },
        { x:  2.3, y: 0.35, z:  0.8 }
    ];

    /* ---- Canvas texture for a single die face (realistic) ---- */
    function makeFaceTexture(value) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Deep red with radial gradient for depth
        const grad = ctx.createRadialGradient(size * 0.4, size * 0.35, 0, size / 2, size / 2, size * 0.72);
        grad.addColorStop(0, '#e02828');
        grad.addColorStop(0.5, '#c41a1a');
        grad.addColorStop(1, '#7a0e0e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        // Subtle specular highlight (top-left)
        const specGrad = ctx.createRadialGradient(size * 0.3, size * 0.25, 0, size * 0.3, size * 0.25, size * 0.5);
        specGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
        specGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = specGrad;
        ctx.fillRect(0, 0, size, size);

        // Dot positions for values 1-6
        const patterns = {
            1: [[0.5, 0.5]],
            2: [[0.27, 0.27], [0.73, 0.73]],
            3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
            4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
            5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
            6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]]
        };

        const dots = patterns[value] || [];
        const r = size * 0.088;

        dots.forEach(([cx, cy]) => {
            const x = cx * size;
            const y = cy * size;

            // Indented shadow (carved-in look)
            ctx.beginPath();
            ctx.arc(x + 1.5, y + 2, r + 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fill();

            // Main white dot with gradient
            const dotGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
            dotGrad.addColorStop(0, '#ffffff');
            dotGrad.addColorStop(0.6, '#f5f5f5');
            dotGrad.addColorStop(1, '#d0d0d0');
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = dotGrad;
            ctx.fill();

            // Tiny specular highlight
            ctx.beginPath();
            ctx.arc(x - r * 0.22, y - r * 0.22, r * 0.28, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fill();
        });

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 8;
        return tex;
    }

    /* ---- Build one realistic die mesh with rounded edges ---- */
    function createDieMesh(index) {
        // Standard die: 1 opposite 6, 2 opposite 5, 3 opposite 4
        // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
        const faceValues = [3, 4, 1, 6, 2, 5];
        const materials = faceValues.map(v => {
            const mat = new THREE.MeshPhysicalMaterial({
                map: makeFaceTexture(v),
                roughness: 0.12,
                metalness: 0.0,
                reflectivity: 0.7
            });
            // clearcoat available in r128+
            if (mat.clearcoat !== undefined) {
                mat.clearcoat = 0.9;
                mat.clearcoatRoughness = 0.08;
            }
            return mat;
        });

        // Create rounded box via subdivision
        const geo = createSmoothDieGeometry(DICE_SIZE, 0.065);
        const die = new THREE.Mesh(geo, materials);

        die.castShadow = true;
        die.receiveShadow = true;
        die.userData = { index, isDie: true, currentValue: null };
        return die;
    }

    /* ---- Smooth die geometry: box with beveled/rounded edges ---- */
    function createSmoothDieGeometry(size, bevel) {
        // We create a standard box, then modify vertices to round edges
        const s = size / 2;
        const b = bevel;

        // Use a standard BoxGeometry but with enough segments for rounding
        const geo = new THREE.BoxGeometry(size, size, size, 4, 4, 4);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            let z = pos.getZ(i);

            // Clamp to inner box
            const ix = Math.max(-s + b, Math.min(s - b, x));
            const iy = Math.max(-s + b, Math.min(s - b, y));
            const iz = Math.max(-s + b, Math.min(s - b, z));

            // Vector from inner box to vertex
            let dx = x - ix;
            let dy = y - iy;
            let dz = z - iz;

            // Length of that vector
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (len > 0.0001) {
                // Scale to bevel radius
                const scale = b / len;
                x = ix + dx * scale;
                y = iy + dy * scale;
                z = iz + dz * scale;
            }

            pos.setXYZ(i, x, y, z);
        }

        geo.computeVertexNormals();
        return geo;
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

    /* ---- Return rotation needed for a value to face UP ---- */
    function getRotationForValue(value) {
        const rotations = {
            1: { x: 0,            z: 0 },
            6: { x: Math.PI,      z: 0 },
            2: { x: Math.PI / 2,  z: 0 },
            5: { x: -Math.PI / 2, z: 0 },
            3: { x: 0,            z: -Math.PI / 2 },
            4: { x: 0,            z: Math.PI / 2 }
        };
        return rotations[value] || { x: 0, z: 0 };
    }

    /* ---- Rotate die so desired value faces UP ---- */
    function setDieValue(index, value) {
        const die = diceMeshes[index];
        if (!die || value < 1 || value > 6) return;

        const rot = getRotationForValue(value);
        die.rotation.x = rot.x;
        die.rotation.z = rot.z;
        die.rotation.y = (Math.random() - 0.5) * 0.6;
        die.userData.currentValue = value;
        diceStates[index].value = value;
    }

    function setDiceLocked(index, locked) {
        diceStates[index].locked = locked;
        const die = diceMeshes[index];
        if (Array.isArray(die.material)) {
            die.material.forEach(m => {
                m.emissive = new THREE.Color(locked ? 0x003300 : 0x000000);
                m.emissiveIntensity = locked ? 0.5 : 0;
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

    function showDice(show) { diceMeshes.forEach(die => { die.visible = show; }); }
    function setPlayerTurn(isTurn) { isPlayerTurn = isTurn; }
    function onDiceClick(cb) { onDiceClickCallback = cb; }
    function getDiceMeshes() { return diceMeshes; }
    function getDiceStates() { return diceStates; }
    function getRestPositions() { return REST_POSITIONS; }
    function getRollPositions() { return ROLL_POSITIONS; }

    function updateDiceFromServer(serverDices) {
        serverDices.forEach((sd, i) => {
            if (i >= DICE_COUNT) return;
            const prevValue = diceStates[i].value;
            diceStates[i].value = sd.value;
            diceStates[i].locked = sd.locked;
            diceStates[i].id = sd.id;

            if (sd.value !== '') {
                // Only snap rotation if value changed (avoid jitter on lock-only updates)
                if (sd.value !== prevValue) {
                    setDieValue(i, parseInt(sd.value));
                }
                diceMeshes[i].visible = true;
            }

            const die = diceMeshes[i];
            if (Array.isArray(die.material)) {
                die.material.forEach(m => {
                    m.emissive = new THREE.Color(sd.locked && sd.value !== '' ? 0x003300 : 0x000000);
                    m.emissiveIntensity = sd.locked && sd.value !== '' ? 0.5 : 0;
                });
            }
        });
    }

    function resetDice() {
        diceMeshes.forEach((die, i) => {
            diceStates[i] = { value: '', locked: true, id: i + 1 };
            die.rotation.set(0, 0, 0);
            die.userData.currentValue = null;
            if (Array.isArray(die.material)) {
                die.material.forEach(m => {
                    m.emissive = new THREE.Color(0x000000);
                    m.emissiveIntensity = 0;
                });
            }
            die.position.set(REST_POSITIONS[i].x, 0.35, REST_POSITIONS[i].z);
            die.visible = false;
        });
    }

    return {
        init, showDice, setDieValue, setDiceLocked, setPlayerTurn,
        onDiceClick, getDiceMeshes, getDiceStates,
        getRestPositions, getRollPositions,
        getRotationForValue, updateDiceFromServer, resetDice
    };
})();
