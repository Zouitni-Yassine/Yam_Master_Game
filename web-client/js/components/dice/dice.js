const DiceSystem = (() => {
    let diceGroup, scene;
    let diceMeshes = [], diceStates = [];
    let isPlayerTurn = false, onDiceClickCallback = null;

    const ROTATIONS = {
        1: { x: 0,           z: 0           },
        6: { x: Math.PI,     z: 0           },
        2: { x: Math.PI/2,   z: 0           },
        5: { x: -Math.PI/2,  z: 0           },
        3: { x: 0,           z: -Math.PI/2  },
        4: { x: 0,           z:  Math.PI/2  }
    };

    function init(sceneRef) {
        scene = sceneRef;
        diceGroup = new THREE.Group(); scene.add(diceGroup);
        for (let i = 0; i < DiceConfig.COUNT; i++) {
            const die = DiceGeometry.createMesh(i);
            die.position.set(DiceConfig.REST[i].x, DiceConfig.REST[i].y, DiceConfig.REST[i].z);
            die.visible = false; diceGroup.add(die);
            diceMeshes.push(die); diceStates.push({ value: '', locked: true, id: i+1 });
        }
        setupInteraction();
    }

    function getRotationForValue(value) { return ROTATIONS[value] || { x: 0, z: 0 }; }

    function setDieValue(index, value) {
        const die = diceMeshes[index];
        if (!die || value < 1 || value > 6) return;
        const rot = getRotationForValue(value);
        die.rotation.set(rot.x, (Math.random()-0.5)*0.6, rot.z);
        die.userData.currentValue = value; diceStates[index].value = value;
    }

    function setDiceLocked(index, locked) {
        diceStates[index].locked = locked;
        if (Array.isArray(diceMeshes[index].material)) {
            diceMeshes[index].material.forEach(m => {
                m.emissive = new THREE.Color(locked ? 0x003300 : 0x000000);
                m.emissiveIntensity = locked ? 0.5 : 0;
            });
        }
    }

    function setupInteraction() {
        const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();

        document.addEventListener('click', (e) => {
            if (!isPlayerTurn) return;
            mouse.set((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1);
            raycaster.setFromCamera(mouse, CasinoScene.getCamera());
            const hits = raycaster.intersectObjects(diceMeshes, false);
            if (hits.length > 0) {
                const idx = hits[0].object.userData.index;
                if (diceStates[idx].value !== '' && onDiceClickCallback) onDiceClickCallback(idx, diceStates[idx]);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isPlayerTurn) return;
            mouse.set((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1);
            raycaster.setFromCamera(mouse, CasinoScene.getCamera());
            document.body.style.cursor = raycaster.intersectObjects(diceMeshes, false).length > 0 ? 'pointer' : 'default';
        });
    }

    function updateDiceFromServer(serverDices) {
        serverDices.forEach((sd, i) => {
            if (i >= DiceConfig.COUNT) return;
            const prev = diceStates[i].value;
            diceStates[i] = { ...diceStates[i], value: sd.value, locked: sd.locked, id: sd.id };
            if (sd.value !== '' && parseInt(sd.value) !== parseInt(prev)) setDieValue(i, parseInt(sd.value));
            if (sd.value !== '') diceMeshes[i].visible = true;
            if (Array.isArray(diceMeshes[i].material)) {
                const on = sd.locked && sd.value !== '';
                diceMeshes[i].material.forEach(m => { m.emissive = new THREE.Color(on ? 0x003300 : 0x000000); m.emissiveIntensity = on ? 0.5 : 0; });
            }
        });
    }

    function resetDice() {
        diceMeshes.forEach((die, i) => {
            diceStates[i] = { value: '', locked: true, id: i+1 };
            die.rotation.set(0, 0, 0); die.userData.currentValue = null;
            if (Array.isArray(die.material)) die.material.forEach(m => { m.emissive = new THREE.Color(0); m.emissiveIntensity = 0; });
            die.position.set(DiceConfig.REST[i].x, 0.35, DiceConfig.REST[i].z);
            die.visible = false;
        });
    }

    function showDice(show)      { diceMeshes.forEach(d => { d.visible = show; }); }
    function setPlayerTurn(turn) { isPlayerTurn = turn; }
    function onDiceClick(cb)     { onDiceClickCallback = cb; }
    function getDiceMeshes()     { return diceMeshes; }
    function getDiceStates()     { return diceStates; }
    function getRestPositions()  { return DiceConfig.REST; }
    function getRollPositions()  { return DiceConfig.ROLL; }

    return {
        init, showDice, setDieValue, setDiceLocked, setPlayerTurn,
        onDiceClick, getDiceMeshes, getDiceStates,
        getRestPositions, getRollPositions,
        getRotationForValue, updateDiceFromServer, resetDice
    };
})();
