const DiceCup = (() => {
    let scene, playerCup, opponentCup;
    const PLAYER_REST   = { x: -5.8, y: 0.55, z:  3.8 };
    const OPPONENT_REST = { x:  5.8, y: 0.55, z: -3.8 };

    function init(sceneRef) {
        scene = sceneRef;
        playerCup   = CupModel.build(); playerCup.position.set(PLAYER_REST.x, PLAYER_REST.y, PLAYER_REST.z);
        opponentCup = CupModel.build(); opponentCup.position.set(OPPONENT_REST.x, OPPONENT_REST.y, OPPONENT_REST.z);
        scene.add(playerCup); scene.add(opponentCup);
    }

    function animateRoll(isPlayer, diceMeshes, diceStates, onDiceFly) {
        const cup     = isPlayer ? playerCup : opponentCup;
        const rest    = isPlayer ? PLAYER_REST : OPPONENT_REST;
        const gatherX = 0;
        const gatherZ = isPlayer ? 3.8 : -2.8;
        const gatherY = 0.55;
        const tl = gsap.timeline();

        tl.to(cup.position, { x: gatherX, y: gatherY, z: gatherZ, duration: 0.4, ease: 'power3.in' });

        diceMeshes.forEach((die, i) => {
            if (!diceStates[i].locked || diceStates[i].value === '') {
                die.visible = true;
                tl.to(die.scale, { x: 0, y: 0, z: 0, duration: 0.15, ease: 'power2.in' }, '-=0.1');
            }
        });

        tl.to(cup.rotation, { z:  0.35, duration: 0.08, ease: 'none' })
          .to(cup.rotation, { z: -0.35, duration: 0.08, ease: 'none' })
          .to(cup.rotation, { z:  0.30, duration: 0.07, ease: 'none' })
          .to(cup.rotation, { z: -0.30, duration: 0.07, ease: 'none' })
          .to(cup.rotation, { z:  0.20, duration: 0.06, ease: 'none' })
          .to(cup.rotation, { z:  0.00, duration: 0.06, ease: 'none' });

        tl.to(cup.position, { y: gatherY + 0.2, duration: 0.1, yoyo: true, repeat: 3, ease: 'none' }, '<');

        tl.to(cup.rotation, { x: -1.2, duration: 0.22, ease: 'power2.in' })
          .to(cup.position, { y: gatherY + 0.3, duration: 0.15, ease: 'power2.out' }, '<');

        tl.call(() => {
            diceMeshes.forEach((die, i) => {
                if (!diceStates[i].locked || diceStates[i].value === '') {
                    die.scale.set(1, 1, 1); die.visible = true;
                    die.position.set(gatherX + (Math.random()-0.5)*0.4, gatherY, gatherZ + (Math.random()-0.5)*0.4);
                }
            });
            if (onDiceFly) onDiceFly();
        });

        tl.to(cup.rotation, { x: 0, z: 0, duration: 0.35, ease: 'back.out(1.5)' }, '+=0.1');
        tl.to(cup.position, { x: rest.x, y: rest.y, z: rest.z, duration: 0.45, ease: 'power2.out' }, '<');

        return tl;
    }

    return {
        init, animateRoll,
        getPlayerCup:   () => playerCup,
        getOpponentCup: () => opponentCup
    };
})();
