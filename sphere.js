let sphereScene,
    sphereCamera,
    sphereRenderer,
    geometry,
    sphereMaterial,
    simplex,
    originalPositions,
    sphereOrbitControls,
    sensitivity,
    gui,
    mesh;

const sphereSettings = {
    sensitivity: 1,
    color: 0xffffff,
}

function initSphereVisualizer(mic) {
    microphone = mic;
    sensitivity = sphereSettings.sensitivity;

    sphereScene = new THREE.Scene();
    sphereCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    sphereCamera.position.z = 5;


    sphereRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    sphereRenderer.setSize(window.innerWidth, window.innerHeight);
    //document.body.appendChild(sphereRenderer.domElement);
    document.getElementById('visualizerContainer').appendChild(sphereRenderer.domElement);


    sphereOrbitControls = new THREE.OrbitControls(sphereCamera, sphereRenderer.domElement);

    const segments = 50;
    geometry = new THREE.SphereGeometry(1, segments, segments);
    originalPositions = geometry.attributes.position.clone();

    const ambientLight = new THREE.AmbientLight(0x404040);
    sphereScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(1, 1, 1);
    sphereScene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight2.position.set(-1, -1, -1);
    sphereScene.add(directionalLight2);



    sphereMaterial = new THREE.MeshPhongMaterial({ color: sphereSettings.color, wireframe: true });

    mesh = new THREE.Mesh(geometry, sphereMaterial);
    sphereScene.add(mesh);

    window.addEventListener('resize', sphereOnWindowResize, false);

    simplex = new SimplexNoise();

    animateSphere();
    settingsSphere();

    return {
        stop: function () {
            console.log("Stopping sphere visualizer");

            window.cancelAnimationFrame(sphereAnimationId);
            //document.body.removeChild(sphereRenderer.domElement);
            //document.getElementById('visualizerContainer').removeChild(sphereRenderer.domElement);
            let visualizerContainer = document.getElementById('visualizerContainer');
            if (visualizerContainer && sphereRenderer && sphereRenderer.domElement && visualizerContainer.contains(sphereRenderer.domElement)) {
                visualizerContainer.removeChild(sphereRenderer.domElement);
            }

            sphereOrbitControls.dispose();
            gui.destroy();
            if (gui && gui.domElement.parentNode) {
                gui.domElement.parentNode.removeChild(gui.domElement);
            }
        },
    };
}

let sphereAnimationId;

function animateSphere() {
    sphereAnimationId = requestAnimationFrame(animateSphere);
    if (microphone.initialized) {

        sphereOrbitControls.update();

        const bands = microphone.getFrequencyBands();
        const lowFrequency = bands.low / 255;
        const midFrequency = bands.mid / 255;
        const highFrequency = bands.high / 255;

        const vertices = geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const vertex = new THREE.Vector3(
                vertices.getX(i),
                vertices.getY(i),
                vertices.getZ(i)
            );

            const originalPosition = new THREE.Vector3(
                originalPositions.getX(i),
                originalPositions.getY(i),
                originalPositions.getZ(i)
            );

            const clampedLowFrequency = Math.min(Math.max(lowFrequency, -1), 1);
            const clampedMidFrequency = Math.min(Math.max(midFrequency, -1), 1);
            const clampedHighFrequency = Math.min(Math.max(highFrequency, -1), 1);

            const offset = simplex.noise3D(
                vertex.x * clampedLowFrequency * 10,
                vertex.y * clampedMidFrequency,
                vertex.z * clampedHighFrequency * 8
            );

            if (!isNaN(offset)) {
                const direction = vertex.clone().normalize().multiplyScalar(offset * 0.03 * sensitivity);
                vertex.add(direction);
                vertex.lerp(originalPosition, 0.0001);
                vertices.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            else {
                continue;
            }

            vertex.lerp(originalPosition, 0.1);
            vertices.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geometry.attributes.position.needsUpdate = true;
    }

    sphereRenderer.render(sphereScene, sphereCamera);
}

function settingsSphere() {
    gui = new dat.GUI({ autoPlace: false });
    document.getElementById('guiContainer').appendChild(gui.domElement);
    gui.add(sphereSettings, 'sensitivity', 0, 10, 0.01).onChange((value) => {
        sensitivity = value;
    });
    gui.addColor(sphereSettings, 'color').onChange((value) => {
        sphereMaterial.color.set(value);
    });
}

function updateSphereSegments(segments) {
    sphereScene.remove(mesh);

    const newGeometry = new THREE.SphereGeometry(1, segments, segments);
    originalPositions = newGeometry.attributes.position.clone();
    geometry = newGeometry;

    mesh = new THREE.Mesh(geometry, sphereMaterial);
    sphereScene.add(mesh);
}


function sphereOnWindowResize() {
    sphereCamera.aspect = window.innerWidth / window.innerHeight;
    sphereCamera.updateProjectionMatrix();
    sphereRenderer.setSize(window.innerWidth, window.innerHeight);
}

export { initSphereVisualizer };
