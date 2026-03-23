/* ============================================
   THREE.JS SCENE SETUP
   Casino environment with cinematic lighting
   ============================================ */

const CasinoScene = (() => {
    let scene, camera, renderer;
    let ambientLight, mainLight, rimLight, fillLight;
    let mouseX = 0, mouseY = 0;
    const CAMERA_DRIFT = 0; // table fixe, pas de parallaxe

    function init(canvas) {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);

        // Camera - angled top-down casino view
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 12, 8);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.outputEncoding = THREE.sRGBEncoding;

        setupLighting();
        setupBackground();

        // Mouse parallax
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // Resize
        window.addEventListener('resize', onResize);

        return { scene, camera, renderer };
    }

    function setupLighting() {
        // Warm ambient
        ambientLight = new THREE.AmbientLight(0x2a1a0a, 0.4);
        scene.add(ambientLight);

        // Main overhead light (casino pendant light feel)
        mainLight = new THREE.SpotLight(0xffe4b5, 1.8, 30, Math.PI / 4, 0.5, 1);
        mainLight.position.set(0, 15, 0);
        mainLight.target.position.set(0, 0, 0);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 5;
        mainLight.shadow.camera.far = 25;
        mainLight.shadow.bias = -0.001;
        mainLight.shadow.radius = 4;
        scene.add(mainLight);
        scene.add(mainLight.target);

        // Warm fill from front-left
        fillLight = new THREE.PointLight(0xffa040, 0.5, 20);
        fillLight.position.set(-5, 6, 5);
        scene.add(fillLight);

        // Cool rim light from behind
        rimLight = new THREE.PointLight(0x4060ff, 0.3, 20);
        rimLight.position.set(3, 8, -6);
        scene.add(rimLight);

        // Subtle bottom bounce
        const bounceLight = new THREE.PointLight(0x1a3a1a, 0.2, 10);
        bounceLight.position.set(0, -1, 0);
        scene.add(bounceLight);
    }

    function setupBackground() {
        // Dark environment "room"
        const roomGeo = new THREE.BoxGeometry(40, 20, 40);
        const roomMat = new THREE.MeshStandardMaterial({
            color: 0x0a0808,
            side: THREE.BackSide,
            roughness: 0.95,
            metalness: 0.0
        });
        const room = new THREE.Mesh(roomGeo, roomMat);
        room.position.y = 8;
        scene.add(room);

        // Floor beneath table
        const floorGeo = new THREE.PlaneGeometry(40, 40);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a0a05,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.6;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function update() {
        // Subtle camera parallax
        const targetX = mouseX * CAMERA_DRIFT;
        const targetZ = 8 + mouseY * CAMERA_DRIFT;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.z += (targetZ - camera.position.z) * 0.02;
        camera.lookAt(0, 0, 0);
    }

    function render() {
        renderer.render(scene, camera);
    }

    function getScene() { return scene; }
    function getCamera() { return camera; }
    function getRenderer() { return renderer; }

    return { init, update, render, getScene, getCamera, getRenderer };
})();
