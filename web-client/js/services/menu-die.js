const MenuDie = (() => {
    let renderer, scene, camera, dieMesh, animId;

    function init() {
        const canvas = document.getElementById('menu-canvas');
        if (!canvas) return;
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(180, 180);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 3.5);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(2, 3, 2);
        scene.add(dir);

        dieMesh = DiceGeometry.createMesh(0);
        scene.add(dieMesh);
        _animate();
    }

    function _animate() {
        animId = requestAnimationFrame(_animate);
        if (dieMesh) { dieMesh.rotation.x += 0.007; dieMesh.rotation.y += 0.011; }
        renderer.render(scene, camera);
    }

    function destroy() {
        if (animId) cancelAnimationFrame(animId);
    }

    return { init, destroy };
})();
