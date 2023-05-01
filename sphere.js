let threeJSScene, threeJSCamera, threeJSRenderer, geometry, threeJSMaterial, simplex, originalPositions, threeJSOrbitControls;

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}


function init3DVisualizer(mic) {
    microphone = mic;
    threeJSScene = new THREE.Scene();
    threeJSCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeJSCamera.position.z = 5;


    threeJSRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    threeJSRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeJSRenderer.domElement);

    threeJSOrbitControls = new THREE.OrbitControls(threeJSCamera, threeJSRenderer.domElement);

    geometry = new THREE.SphereGeometry(1, 32, 32);
    originalPositions = geometry.attributes.position.clone();

    threeJSMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const mesh = new THREE.Mesh(geometry, threeJSMaterial);
    threeJSScene.add(mesh);

    window.addEventListener('resize', threeJSOnWindowResize, false);

    simplex = new SimplexNoise();

    animateThreeJS();

    return {
        stop: function () {
            window.cancelAnimationFrame(threeJSAnimationId);
            document.body.removeChild(threeJSRenderer.domElement);
            threeJSOrbitControls.dispose();

            // Remove event listeners
            window.removeEventListener('resize', threeJSOnWindowResize);
            sphereColorInput.removeEventListener("input", (e) => {
                threeJSMaterial.color.set(e.target.value);
            });
            wireframeInput.removeEventListener("change", (e) => {
                threeJSMaterial.wireframe = e.target.checked;
            });
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

const sphereColorInput = document.getElementById("sphereColorInput");
const wireframeInput = document.getElementById("wireframeInput");

sphereColorInput.addEventListener("input", (e) => {
    threeJSMaterial.color.set(e.target.value);
});

wireframeInput.addEventListener("change", (e) => {
    threeJSMaterial.wireframe = e.target.checked;
});



function threeJSOnWindowResize() {
    threeJSCamera.aspect = window.innerWidth / window.innerHeight;
    threeJSCamera.updateProjectionMatrix();
    threeJSRenderer.setSize(window.innerWidth, window.innerHeight);
}

