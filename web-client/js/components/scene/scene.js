const CasinoScene = (() => {
    let scene, camera, renderer;

    function init(canvas) {
        scene = new THREE.Scene();
        scene.background = null;

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 7.5, 10.0);
        camera.lookAt(0, 1.5, -6);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.outputEncoding = THREE.sRGBEncoding;

        SceneLighting.setup(scene);
        SceneRoom.setup(scene);
        SceneProps.setup(scene);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        return { scene, camera, renderer };
    }

    function update()      {}
    function render()      { renderer.render(scene, camera); }
    function getScene()    { return scene; }
    function getCamera()   { return camera; }
    function getRenderer() { return renderer; }

    return { init, update, render, getScene, getCamera, getRenderer };
})();
