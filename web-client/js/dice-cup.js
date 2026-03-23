/* ============================================
   DICE CUP (Gobelet à dés)
   Gold shaker cup - gathers dice, shakes, launches
   ============================================ */

const DiceCup = (() => {
    let scene;
    let playerCup   = null;
    let opponentCup = null;

    // Rest positions — player cup on LEFT, opponent cup on RIGHT
    const PLAYER_REST   = { x: -5.8, y: 0.55, z:  3.8 };
    const OPPONENT_REST = { x:  5.8, y: 0.55, z: -3.8 };

    function init(sceneRef) {
        scene = sceneRef;
        playerCup   = buildCup();
        opponentCup = buildCup();

        playerCup.position.set(PLAYER_REST.x, PLAYER_REST.y, PLAYER_REST.z);
        opponentCup.position.set(OPPONENT_REST.x, OPPONENT_REST.y, OPPONENT_REST.z);

        scene.add(playerCup);
        scene.add(opponentCup);
    }

    function buildCup() {
        const group = new THREE.Group();

        // Gold material
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xb8860b, roughness: 0.25, metalness: 0.9
        });
        const darkGoldMat = new THREE.MeshStandardMaterial({
            color: 0x8a6010, roughness: 0.3, metalness: 0.85
        });

        // Outer cup shell (open top)
        const outerGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.68, 24, 1, true);
        group.add(new THREE.Mesh(outerGeo, goldMat));

        // Bottom disc
        const botMesh = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), goldMat);
        botMesh.rotation.x = Math.PI / 2;
        botMesh.position.y = -0.34;
        group.add(botMesh);

        // Top rim ring
        const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 10, 32), goldMat);
        topRim.rotation.x = Math.PI / 2;
        topRim.position.y = 0.34;
        group.add(topRim);

        // Bottom rim ring
        const botRim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 10, 32), darkGoldMat);
        botRim.rotation.x = Math.PI / 2;
        botRim.position.y = -0.34;
        group.add(botRim);

        // Vertical grooves (decorative lines)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const groove = new THREE.Mesh(
                new THREE.BoxGeometry(0.012, 0.62, 0.012),
                darkGoldMat
            );
            groove.position.x = Math.cos(angle) * 0.31;
            groove.position.z = Math.sin(angle) * 0.31;
            groove.rotation.y = -angle;
            group.add(groove);
        }

        // Inside dark walls (visible from top)
        const insideMat = new THREE.MeshStandardMaterial({
            color: 0x0a0503, roughness: 0.95, side: THREE.BackSide
        });
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.24, 0.66, 24, 1, true), insideMat));

        // Inner bottom — closes the cup so it looks solid from above
        const innerFloor = new THREE.Mesh(
            new THREE.CircleGeometry(0.24, 24),
            new THREE.MeshStandardMaterial({ color: 0x050201, roughness: 0.98 })
        );
        innerFloor.rotation.x = -Math.PI / 2;
        innerFloor.position.y = -0.32;
        group.add(innerFloor);

        group.castShadow = true;
        return group;
    }

    /* ---- Cup roll animation ----
       1. Slide cup to cover dice
       2. Dice vanish under cup
       3. Cup shakes vigorously
       4. Cup tips over — dice fly out
       5. Cup slides back to rest
    */
    function animateRoll(isPlayer, diceMeshes, diceStates, onDiceFly) {
        const cup = isPlayer ? playerCup : opponentCup;
        const rest = isPlayer ? PLAYER_REST : OPPONENT_REST;
        // Center of dice rest area
        const gatherX = 0;
        const gatherZ = isPlayer ? 2.8 : -2.8;
        const gatherY = 0.55;

        const tl = gsap.timeline();

        // 1. Cup slides quickly over the dice
        tl.to(cup.position, {
            x: gatherX, y: gatherY, z: gatherZ,
            duration: 0.4, ease: 'power3.in'
        });

        // 2. Hide unlocked dice under cup (scale down)
        diceMeshes.forEach((die, i) => {
            const shouldHide = !diceStates[i].locked || diceStates[i].value === '';
            if (!shouldHide) return;
            die.visible = true;
            tl.to(die.scale, { x: 0, y: 0, z: 0, duration: 0.15, ease: 'power2.in' }, '-=0.1');
        });

        // 3. Vigorous shake — rattle left-right and tilt
        tl.to(cup.rotation, { z:  0.35, duration: 0.08, ease: 'none' })
          .to(cup.rotation, { z: -0.35, duration: 0.08, ease: 'none' })
          .to(cup.rotation, { z:  0.30, duration: 0.07, ease: 'none' })
          .to(cup.rotation, { z: -0.30, duration: 0.07, ease: 'none' })
          .to(cup.rotation, { z:  0.20, duration: 0.06, ease: 'none' })
          .to(cup.rotation, { z:  0.00, duration: 0.06, ease: 'none' });

        // Also bounce up/down during shake
        tl.to(cup.position, { y: gatherY + 0.2, duration: 0.1, yoyo: true, repeat: 3, ease: 'none' }, '<');

        // 4. Cup quickly tips over (rotates ~90°) and flings dice
        tl.to(cup.rotation, { x: -1.2, duration: 0.22, ease: 'power2.in' })
          .to(cup.position, { y: gatherY + 0.3, duration: 0.15, ease: 'power2.out' }, '<');

        // Release dice (restore scale, trigger fly animation)
        tl.call(() => {
            diceMeshes.forEach((die, i) => {
                const shouldFly = !diceStates[i].locked || diceStates[i].value === '';
                if (shouldFly) {
                    die.scale.set(1, 1, 1);
                    die.visible = true;
                    die.position.set(gatherX + (Math.random()-0.5)*0.4, gatherY, gatherZ + (Math.random()-0.5)*0.4);
                }
            });
            if (onDiceFly) onDiceFly();
        });

        // 5. Cup returns upright and slides back to rest
        tl.to(cup.rotation, { x: 0, z: 0, duration: 0.35, ease: 'back.out(1.5)' }, '+=0.1');
        tl.to(cup.position, {
            x: rest.x, y: rest.y, z: rest.z,
            duration: 0.45, ease: 'power2.out'
        }, '<');

        return tl;
    }

    function getPlayerCup()   { return playerCup; }
    function getOpponentCup() { return opponentCup; }

    return { init, animateRoll, getPlayerCup, getOpponentCup };
})();
