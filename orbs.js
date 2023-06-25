let orbsScene, orbsCamera, orbsRenderer, group, plane, plane2, ball, orbsAmbientLight, orbsSpotLight, orbsOrbitControls;

var noise = new SimplexNoise();

function initOrbsVisualizer(mic) {
    microphone = mic;
    orbsScene = new THREE.Scene();
    group = new THREE.Group();

    orbsCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    orbsCamera.position.set(0, 0, 100);
    orbsCamera.lookAt(orbsScene.position);
    orbsScene.add(orbsCamera);

    orbsRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    orbsRenderer.setSize(window.innerWidth, window.innerHeight);
    //document.body.appendChild(orbsRenderer.domElement);
    document.getElementById('visualizerContainer').appendChild(orbsRenderer.domElement);


    orbsOrbitControls = new THREE.OrbitControls(orbsCamera, orbsRenderer.domElement);
    orbsOrbitControls.target.set(0, 0, 0);
    orbsOrbitControls.enablePan = false;

    const geometries = createGeometry();
    createLights();

    orbsScene.add(group);

    window.addEventListener('resize', orbsOnWindowResize, false);
    animateOrbsVisualizer(geometries);

    return {
        stop: function () {
            console.log("Stopping Orbs visualizer");

            window.cancelAnimationFrame(orbsAnimationId);
            //document.body.removeChild(orbsRenderer.domElement);
            document.getElementById('visualizerContainer').removeChild(orbsRenderer.domElement);
            orbsOrbitControls.dispose();
            window.removeEventListener('resize', orbsOnWindowResize);
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
    var torusGeometry = new THREE.TorusGeometry(4, 1, 16, 100);

    // Define a new material for the torus
    var torusMaterial = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        shininess: 100,
        specular: 0xc0c0ff,
        transparent: true,
        opacity: 0.9
    });

    // 创建曲面几何体
    var sphereGeometry = new THREE.SphereGeometry(13, 32, 32);
    var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x7F00FF, wireframe: true });
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 0, 0);
    group.add(sphere);

    var coneGeometry = new THREE.ConeGeometry(10, 20, 32);
    var coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF, wireframe: true });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(50, 0, 0);
    group.add(cone);

    // ...
    var boxGeometry = new THREE.BoxGeometry(20, 20, 20);
    var boxMaterial = new THREE.MeshPhongMaterial({ color: 0xFF00FF, emissive: 0xFF00FF, emissiveIntensity: 1, transparent: true, opacity: 0.7 });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(-50, 0, 0);
    group.add(box);

    var clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        // 旋转立方体和圆柱体
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.02;
        cone.rotation.z += 0.01;
        box.rotation.x += 0.02;


        // 更新时钟并获取经过的时间
        var elapsedTime = clock.getElapsedTime();

    }

    animate();

    return { ball, plane, plane2, cone, sphere, box };
}

function createLights() {
    orbsAmbientLight = new THREE.AmbientLight(0xaaaaaa);
    orbsScene.add(orbsAmbientLight);

    orbsSpotLight = new THREE.SpotLight(0xffffff);
    orbsSpotLight.intensity = 0.9;
    orbsSpotLight.position.set(-10, 40, 20);
    orbsSpotLight.lookAt(ball);
    orbsSpotLight.castShadow = true;
    orbsScene.add(orbsSpotLight);

    orbsAmbientLight = new THREE.AmbientLight(0xaaaaaa);
    orbsScene.add(orbsAmbientLight);

    orbsSpotLight = new THREE.SpotLight(0xffffff);
    orbsSpotLight.intensity = 0.9;
    orbsSpotLight.position.set(-10, 40, 20);
    orbsSpotLight.lookAt(ball);
    orbsSpotLight.castShadow = true;
    orbsScene.add(orbsSpotLight);

    // Add a directional light
    orbsDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    orbsDirectionalLight.position.set(1, 1, 1);
    orbsScene.add(orbsDirectionalLight);
}

let orbsAnimationId;

function animateOrbsVisualizer(geometries) {
    orbsAnimationId = requestAnimationFrame(() => animateOrbsVisualizer(geometries));

    if (microphone.initialized) {
        updateGeometry(geometries.ball, geometries.plane, geometries.plane2);

        group.rotation.y += 0.005;
        orbsRenderer.render(orbsScene, orbsCamera);
        orbsOrbitControls.update();
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

function orbsOnWindowResize() {
    orbsCamera.aspect = window.innerWidth / window.innerHeight;
    orbsCamera.updateProjectionMatrix();
    orbsRenderer.setSize(window.innerWidth, window.innerHeight);
}


