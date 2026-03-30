/* ============================================
   CHARACTERS SYSTEM
   Two 3D characters sitting at the table (1v1)
   ============================================ */

const Characters = (() => {
    let _mixer1 = null, _mixer2 = null;
    let _char1 = null, _char2 = null;
    const _clock = new THREE.Clock();

    function init(scene) {
        if (typeof THREE.FBXLoader === 'undefined') {
            console.warn('FBXLoader not available');
            return;
        }
        const loader = new THREE.FBXLoader();

        function loadChar(url, posZ, rotY, onLoaded) {
            loader.load(
                url,
                (fbx) => {
                    fbx.scale.setScalar(0.072);
                    fbx.position.set(0, -3.2, posZ);
                    fbx.rotation.y = rotY;
                    fbx.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    fbx.visible = false;
                    scene.add(fbx);
                    if (fbx.animations.length) {
                        const mixer = new THREE.AnimationMixer(fbx);
                        mixer.clipAction(fbx.animations[0]).play();
                        onLoaded(fbx, mixer);
                    } else {
                        onLoaded(fbx, null);
                    }
                },
                undefined,
                (err) => console.error('FBX load error:', url, err)
            );
        }

        // Player character — near side (front of table)
        loadChar('/models/Sitting%20Idle.fbx', 7.5, Math.PI, (fbx, mixer) => {
            _char1 = fbx; _mixer1 = mixer;
        });

        // Opponent character — far side (back of table)
        loadChar('/models/Sitting%20Idle%20(1).fbx', -8.5, 0, (fbx, mixer) => {
            _char2 = fbx; _mixer2 = mixer;
        });
    }

    function show(visible) {
        // char1 (player) always hidden — first-person view
        if (_char1) _char1.visible = false;
        if (_char2) _char2.visible = visible;
    }

    function update() {
        const delta = _clock.getDelta();
        if (_mixer1) _mixer1.update(delta);
        if (_mixer2) _mixer2.update(delta);
    }

    return { init, show, update };
})();
