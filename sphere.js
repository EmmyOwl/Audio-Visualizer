let threeJSScene, threeJSCamera, threeJSRenderer, geometry, threeJSMaterial, simplex, originalPositions, threeJSOrbitControls;

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}


function init3DVisualizer(mic) {
    microphone = mic;
    threeJSScene = new THREE.Scene();
    threeJSCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeJSCamera.position.z = 5;


    threeJSRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    threeJSRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeJSRenderer.domElement);

    threeJSOrbitControls = new THREE.OrbitControls(threeJSCamera, threeJSRenderer.domElement);

    geometry = new THREE.SphereGeometry(1, 32, 32);
    originalPositions = geometry.attributes.position.clone();

    const ambientLight = new THREE.AmbientLight(0x404040);
    threeJSScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(1, 1, 1);
    threeJSScene.add(directionalLight);

    threeJSMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: true });

    //threeJSMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const mesh = new THREE.Mesh(geometry, threeJSMaterial);
    threeJSScene.add(mesh);

    window.addEventListener('resize', threeJSOnWindowResize, false);

    simplex = new SimplexNoise();

    animateThreeJS();

    return {
        updateSphereSegments: function (segments) {
            const newGeometry = new THREE.SphereGeometry(1, segments, segments);
            originalPositions = newGeometry.attributes.position.clone();
            geometry.copy(newGeometry);
        },

        stop: function () {
            window.cancelAnimationFrame(threeJSAnimationId);
            document.body.removeChild(threeJSRenderer.domElement);
            threeJSOrbitControls.dispose();

            /*
            // Remove event listeners
            window.removeEventListener('resize', threeJSOnWindowResize);
            sphereColorInput.removeEventListener("input", (e) => {
                threeJSMaterial.color.set(e.target.value);
            });
            wireframeInput.removeEventListener("change", (e) => {
                threeJSMaterial.wireframe = e.target.checked;
            });*/
        },

    };
}

let athreeJSAnimationId;

function animateThreeJS() {
    threeJSAnimationId = requestAnimationFrame(animateThreeJS);

    if (microphone.initialized) {

        threeJSOrbitControls.update();

        const bands = microphone.getFrequencyBands();
        const lowFrequency = bands.low / 255;
        const midFrequency = bands.mid / 255;
        const highFrequency = bands.high / 255;

        const vertices = geometry.attributes.position;
        //const originalPositions = geometry.attributes.position.clone();
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

            const offset = simplex.noise3D(
                vertex.x * lowFrequency * 5,
                vertex.y * midFrequency * 5,
                vertex.z * highFrequency * 5
            );

            if (!isNaN(offset)) {
                const direction = vertex.clone().normalize().multiplyScalar(offset * 0.03);
                vertex.add(direction);
            }

            vertex.lerp(originalPosition, 0.1);
            vertices.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeBoundingSphere();
    }

    threeJSRenderer.render(threeJSScene, threeJSCamera);
}

function mapFFTSizeToSegments(fftSize) {
    // You can adjust the mapping based on your preference
    if (fftSize <= 256) return 16;
    if (fftSize <= 512) return 32;
    if (fftSize <= 1024) return 64;
    if (fftSize <= 2048) return 128;
    return 256;
}

const segments = mapFFTSizeToSegments(microphone.getFFTSize());
geometry = new THREE.SphereGeometry(1, segments, segments);


function threeJSOnWindowResize() {
    threeJSCamera.aspect = window.innerWidth / window.innerHeight;
    threeJSCamera.updateProjectionMatrix();
    threeJSRenderer.setSize(window.innerWidth, window.innerHeight);
}

