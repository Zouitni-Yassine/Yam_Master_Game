/* ============================================
   GSAP ANIMATIONS
   Dice rolling, chip placement, UI transitions
   ============================================ */

const Animations = (() => {

    function rollDice(diceMeshes, diceStates, newValues, onComplete) {
        const rollPositions = DiceSystem.getRollPositions();

        // Animate each unlocked die independently (no shared timeline = all start at once)
        diceMeshes.forEach((die, i) => {
            // Animate if unlocked OR first roll (empty value)
            const shouldAnimate = !diceStates[i].locked || diceStates[i].value === '';
            if (!shouldAnimate) return;
            die.visible = true;

            const targetX = rollPositions[i].x + (Math.random() - 0.5) * 0.6;
            const targetZ = rollPositions[i].z + (Math.random() - 0.5) * 0.6;
            const delay = i * 0.04;

            // Rise up
            gsap.to(die.position, {
                y: 2.2,
                duration: 0.22,
                delay,
                ease: 'power2.out'
            });

            // Move to final X/Z while in the air
            gsap.to(die.position, {
                x: targetX,
                z: targetZ,
                duration: 0.55,
                delay,
                ease: 'power1.inOut'
            });

            // Drop with bounce
            gsap.to(die.position, {
                y: 0.35,
                duration: 0.45,
                delay: delay + 0.22,
                ease: 'bounce.out'
            });

            // Full spin during flight
            const dirX = Math.random() > 0.5 ? 1 : -1;
            const dirZ = Math.random() > 0.5 ? 1 : -1;
            gsap.to(die.rotation, {
                x: `+=${Math.PI * (6 + Math.random() * 4) * dirX}`,
                y: `+=${Math.PI * (4 + Math.random() * 4)}`,
                z: `+=${Math.PI * (3 + Math.random() * 3) * dirZ}`,
                duration: 0.7,
                delay,
                ease: 'power2.out'
            });
        });

        // After all dice settle, apply final values
        const totalDuration = 0.22 + 0.45 + (diceMeshes.length - 1) * 0.04 + 0.1;
        gsap.delayedCall(totalDuration, () => {
            newValues.forEach((val, i) => {
                const shouldAnimate = !diceStates[i].locked || diceStates[i].value === '';
                if (shouldAnimate && val !== '') {
                    DiceSystem.setDieValue(i, val);
                }
            });
            if (onComplete) onComplete();
        });
    }

    function showDiceEntry(diceMeshes) {
        diceMeshes.forEach((die, i) => {
            die.visible = true;
            die.position.y = -1;
            die.scale.set(0, 0, 0);

            gsap.to(die.position, {
                y: 0.35,
                duration: 0.5,
                delay: i * 0.08,
                ease: 'back.out(2)'
            });

            gsap.to(die.scale, {
                x: 1, y: 1, z: 1,
                duration: 0.4,
                delay: i * 0.08,
                ease: 'back.out(2)'
            });
        });
    }

    function hideDice(diceMeshes) {
        diceMeshes.forEach((die, i) => {
            gsap.to(die.scale, {
                x: 0, y: 0, z: 0,
                duration: 0.3,
                delay: i * 0.05,
                ease: 'power2.in',
                onComplete: () => { die.visible = false; }
            });
        });
    }

    function pulseButton(element) {
        gsap.fromTo(element, {
            boxShadow: '0 0 10px rgba(212, 164, 76, 0.3)'
        }, {
            boxShadow: '0 0 30px rgba(212, 164, 76, 0.7)',
            duration: 0.8,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    function stopPulse(element) {
        gsap.killTweensOf(element);
        gsap.to(element, {
            boxShadow: 'none',
            duration: 0.3
        });
    }

    function showChoicesBar() {
        const bar = document.getElementById('choices-bar');
        bar.classList.remove('hidden');
        gsap.fromTo(bar, {
            y: -30,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'back.out(2)'
        });
    }

    function hideChoicesBar() {
        const bar = document.getElementById('choices-bar');
        gsap.to(bar, {
            y: -20,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => bar.classList.add('hidden')
        });
    }

    function flashTurnIndicator(text) {
        const el = document.getElementById('turn-indicator');
        el.textContent = text;
        gsap.fromTo(el, {
            scale: 1.3,
            opacity: 0
        }, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(2)'
        });
    }

    function shakeElement(element) {
        gsap.to(element, {
            x: -5,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            ease: 'power2.inOut',
            onComplete: () => gsap.set(element, { x: 0 })
        });
    }

    return {
        rollDice, showDiceEntry, hideDice,
        pulseButton, stopPulse,
        showChoicesBar, hideChoicesBar,
        flashTurnIndicator, shakeElement
    };
})();
