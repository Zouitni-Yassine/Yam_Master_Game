/* ============================================
   CHARACTERS SYSTEM
   Two 3D characters sitting at the table (1v1)
   - Bot mode: Sitting Talking (Dice King)
   - Online player:1 sees: Sitting Idle (1)
   - Online player:2 sees: Sitting Idle
   ============================================ */

const Characters = (() => {
    let _mixerA = null, _mixerB = null, _mixerBot = null;
    let _charA = null, _charB = null, _charBot = null;
    let _isBot = false, _playerKey = 'player:1';
    const _clock = new THREE.Clock();

    function init(scene) {
        if (typeof THREE.FBXLoader === 'undefined') {
            console.warn('FBXLoader not available');
            return;
        }
        const loader = new THREE.FBXLoader();

        function loadChar(url, onLoaded) {
            loader.load(
                url,
                (fbx) => {
                    fbx.scale.setScalar(0.072);
                    fbx.position.set(0, -5.6, -8.5);
                    fbx.rotation.y = 0;
                    fbx.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    fbx.visible = false;
                    scene.add(fbx);
                    const mixer = fbx.animations.length ? new THREE.AnimationMixer(fbx) : null;
                    if (mixer) mixer.clipAction(fbx.animations[0]).play();
                    onLoaded(fbx, mixer);
                },
                undefined,
                (err) => console.error('FBX load error:', url, err)
            );
        }

        // Model A — shown to player:1 in online mode
        loadChar('/models/Sitting%20Idle%20(1).fbx', (fbx, mixer) => {
            _charA = fbx; _mixerA = mixer;
        });

        // Model B — shown to player:2 in online mode
        loadChar('/models/Sitting%20Idle.fbx', (fbx, mixer) => {
            _charB = fbx; _mixerB = mixer;
        });

        // Bot — shown in Dice King mode
        loadChar('/models/Sitting%20Talking.fbx', (fbx, mixer) => {
            _charBot = fbx; _mixerBot = mixer;
        });
    }

    function show(visible) {
        if (_charA)   _charA.visible   = false;
        if (_charB)   _charB.visible   = false;
        if (_charBot) _charBot.visible = false;

        if (!visible) return;

        if (_isBot) {
            if (_charBot) _charBot.visible = true;
        } else if (_playerKey === 'player:1') {
            if (_charA) _charA.visible = true;
        } else {
            if (_charB) _charB.visible = true;
        }
    }

    function setBot(isBot) { _isBot = isBot; }
    function setPlayerKey(key) { _playerKey = key; }

    function update() {
        const delta = _clock.getDelta();
        if (_mixerA)   _mixerA.update(delta);
        if (_mixerB)   _mixerB.update(delta);
        if (_mixerBot) _mixerBot.update(delta);
    }

    return { init, show, setBot, setPlayerKey, update };
})();
