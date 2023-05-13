let leilaScene, leilaCamera, leilaRenderer, group, plane, plane2, ball, leilaAmbientLight, leilaSpotLight, leilaOrbitControls;

var noise = new SimplexNoise();

function initLeilaVisualizer(mic) {
    microphone = mic;
    leilaScene = new THREE.Scene();
    group = new THREE.Group();

    leilaCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    leilaCamera.position.set(0, 0, 100);
    leilaCamera.lookAt(leilaScene.position);
    leilaScene.add(leilaCamera);

    leilaRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    leilaRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(leilaRenderer.domElement);

    leilaOrbitControls = new THREE.OrbitControls(leilaCamera, leilaRenderer.domElement);
    leilaOrbitControls.target.set(0, 0, 0);
    leilaOrbitControls.enablePan = false;

    const geometries = createGeometry();
    createLights();

    leilaScene.add(group);

    window.addEventListener('resize', leilaOnWindowResize, false);
    animateLeilaVisualizer(geometries);

    return {
        stop: function () {
            console.log("Stopping Leila visualizer");

            window.cancelAnimationFrame(leilaAnimationId);
            document.body.removeChild(leilaRenderer.domElement);
            leilaOrbitControls.dispose();

            // Remove event listeners
            window.removeEventListener('resize', leilaOnWindowResize);
        },
    };
}

function createGeometry() {
    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true
    });

    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    group.add(plane);

    plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    group.add(plane2);

    var icosahedronGeometry = new THREE.IcosahedronGeometry(20, 4);
    var lambertMaterial = new THREE.MeshLambertMaterial({
        color: 0xff00ee,
        wireframe: true
    });

    ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);


    // Define a new torus geometry
    var torusGeometry = new THREE.TorusGeometry(5, 1, 16, 100);

    // Define a new material for the torus
    var torusMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        wireframe: true
    });

    // Create a mesh using the new torus geometry and material
    var torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(0, 0, 0);

    // Add the torus mesh to the group
    group.add(torus);

    var clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        // Rotate the torus around the Y-axis
        torus.rotation.y += 0.01;

        // Update the clock and get the elapsed time
        var elapsedTime = clock.getElapsedTime();

        // Rotate the torus around the X-axis using the elapsed time
        torus.rotation.x = elapsedTime * 0.5;

        // Rotate the torus around the Z-axis using the elapsed time
        torus.rotation.z = elapsedTime * 0.3;
    }

    animate();



    return { ball, plane, plane2, torus };
}

function createLights() {
    leilaAmbientLight = new THREE.AmbientLight(0xaaaaaa);
    leilaScene.add(leilaAmbientLight);

    leilaSpotLight = new THREE.SpotLight(0xffffff);
    leilaSpotLight.intensity = 0.9;
    leilaSpotLight.position.set(-10, 40, 20);
    leilaSpotLight.lookAt(ball);
    leilaSpotLight.castShadow = true;
    leilaScene.add(leilaSpotLight);

    leilaAmbientLight = new THREE.AmbientLight(0xaaaaaa);
    leilaScene.add(leilaAmbientLight);

    leilaSpotLight = new THREE.SpotLight(0xffffff);
    leilaSpotLight.intensity = 0.9;
    leilaSpotLight.position.set(-10, 40, 20);
    leilaSpotLight.lookAt(ball);
    leilaSpotLight.castShadow = true;
    leilaScene.add(leilaSpotLight);

    // Add a directional light
    leilaDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    leilaDirectionalLight.position.set(1, 1, 1);
    leilaScene.add(leilaDirectionalLight);
}


let leilaAnimationId;

function animateLeilaVisualizer(geometries) {
    leilaAnimationId = requestAnimationFrame(() => animateLeilaVisualizer(geometries));

    if (microphone.initialized) {
        updateGeometry(geometries.ball, geometries.plane, geometries.plane2);

        group.rotation.y += 0.005;
        leilaRenderer.render(leilaScene, leilaCamera);
        leilaOrbitControls.update();
    }
}

function updateGeometry(ball, plane, plane2) {
    const samples = microphone.getSamples();
    const volume = microphone.getVolume();
    upperAvgFr = 0.6 + volume * 5;
    lowerMaxFr = -0.6 + volume * 5;

    makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
    makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
    makeRoughBall(ball, lowerMaxFr, upperAvgFr);
}

function makeRoughBall(mesh, bassFr, treFr) {

    const positionAttribute = mesh.geometry.getAttribute('position');
    const count = positionAttribute.count;
    const offset = mesh.geometry.parameters.radius;
    const amp = 7;
    const time = window.performance.now();
    const rf = 0.00001;

    for (let i = 0; i < count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        const vertex = new THREE.Vector3(x, y, z).normalize();
        const distance = (offset + bassFr * 5) + noise.noise3D(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * treFr * 0.5;
        vertex.multiplyScalar(distance);
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);

        if (distance > 10) mesh.material.color.setHex(0xff000f);
        else if (distance > 9) mesh.material.color.setHex(0xf0f00f);
        else if (distance > 8) mesh.material.color.setHex(0xf0000f);
        else if (distance > 7) mesh.material.color.setHex(0xf00f0f);
        else if (distance > 6) mesh.material.color.setHex(0xf0100f);
        else if (distance > 5) mesh.material.color.setHex(0xf000af);
    }

    positionAttribute.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

function makeRoughGround(mesh, distortionFr) {

    function makeRoughGround(mesh, distortionFr) {
        const positionAttribute = mesh.geometry.getAttribute('position');
        const count = positionAttribute.count;

        for (let i = 0; i < count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            let z = positionAttribute.getZ(i);

            const amp = 3;
            const time = Date.now();
            const distance = (noise.noise2D(x + time * 0.0003, y + time * 0.0001) + 0) * distortionFr * amp;
            z = distance;

            positionAttribute.setXYZ(i, x, y, z);
        }
        positionAttribute.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    }

}

function fractionate(val, minVal, maxVal) {
    return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr) {
    var total = arr.reduce(function (sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr) {
    return arr.reduce(function (a, b) { return Math.max(a, b); })
}

function leilaOnWindowResize() {
    leilaCamera.aspect = window.innerWidth / window.innerHeight;
    leilaCamera.updateProjectionMatrix();
    leilaRenderer.setSize(window.innerWidth, window.innerHeight);
}

//window.initLeilaVisualizer = initLeilaVisualizer(mic);

