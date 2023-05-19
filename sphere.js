let threeJSScene,
    threeJSCamera,
    threeJSRenderer,
    geometry,
    threeJSMaterial,
    simplex,
    originalPositions,
    threeJSOrbitControls,
    sensitivity,
    visualizer,
    gui,
    mesh;

const sphereSettings = {
    sensitivity: 1,
    color: 0xffffff,
}

function init3DVisualizer(mic) {
    microphone = mic;
    sensitivity = sphereSettings.sensitivity;

    threeJSScene = new THREE.Scene();
    threeJSCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeJSCamera.position.z = 5;


    threeJSRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    threeJSRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeJSRenderer.domElement);

    threeJSOrbitControls = new THREE.OrbitControls(threeJSCamera, threeJSRenderer.domElement);

    const segments = 50;
    geometry = new THREE.SphereGeometry(1, segments, segments);
    originalPositions = geometry.attributes.position.clone();

    const ambientLight = new THREE.AmbientLight(0x404040);
    threeJSScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(1, 1, 1);
    threeJSScene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight2.position.set(-1, -1, -1);
    threeJSScene.add(directionalLight2);



    threeJSMaterial = new THREE.MeshPhongMaterial({ color: sphereSettings.color, wireframe: true }); // Set color here

    mesh = new THREE.Mesh(geometry, threeJSMaterial);
    threeJSScene.add(mesh);

    window.addEventListener('resize', threeJSOnWindowResize, false);

    simplex = new SimplexNoise();

    animateThreeJS();
    settingsSphere();

    return {
        stop: function () {
            console.log("Stopping sphere visualizer");

            window.cancelAnimationFrame(threeJSAnimationId);
            document.body.removeChild(threeJSRenderer.domElement);
            threeJSOrbitControls.dispose();
            gui.destroy();
        },
    };
}

let threeJSAnimationId;

function animateThreeJS() {
    threeJSAnimationId = requestAnimationFrame(animateThreeJS);
    if (microphone.initialized) {
        //console.log('check');

        threeJSOrbitControls.update();

        const bands = microphone.getFrequencyBands();
        const lowFrequency = bands.low / 255;
        const midFrequency = bands.mid / 255;
        const highFrequency = bands.high / 255;
        //console.log('High/255):', highFrequency);

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
            /*
            console.log('Low Frequency:', lowFrequency);
            console.log('Mid Frequency:', midFrequency);
            console.log('High Frequency:', highFrequency);
            console.log('Vertex X:', vertex.x);
            console.log('Vertex Y:', vertex.y);
            console.log('Vertex Z:', vertex.z);
            console.log('Offset:', offset);*/

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
        /*
        for (let i = 0; i < vertices.count; i++) {
            if (isNaN(vertices.getX(i)) || isNaN(vertices.getY(i)) || isNaN(vertices.getZ(i))) {
                console.error('NaN value detected in vertices:', i);
                break;
            }
        }
        */
        geometry.attributes.position.needsUpdate = true;
        //geometry.computeBoundingSphere();
    }

    threeJSRenderer.render(threeJSScene, threeJSCamera);
}

function settingsSphere() {
    gui = new dat.GUI();
    gui.add(sphereSettings, 'sensitivity', 0, 10, 0.01).onChange((value) => {
        sensitivity = value;
    });
    gui.addColor(sphereSettings, 'color').onChange((value) => {
        threeJSMaterial.color.set(value);
    });
}

function updateSphereSegments(segments) {
    // Remove the old mesh from the scene
    threeJSScene.remove(mesh);

    const newGeometry = new THREE.SphereGeometry(1, segments, segments);
    originalPositions = newGeometry.attributes.position.clone();
    geometry = newGeometry;

    // Add the new mesh to the scene
    mesh = new THREE.Mesh(geometry, threeJSMaterial);
    threeJSScene.add(mesh);
}


function threeJSOnWindowResize() {
    threeJSCamera.aspect = window.innerWidth / window.innerHeight;
    threeJSCamera.updateProjectionMatrix();
    threeJSRenderer.setSize(window.innerWidth, window.innerHeight);
}

export { init3DVisualizer };
