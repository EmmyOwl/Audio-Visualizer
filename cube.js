let cubeScene,
  cubeCamera,
  cubeRenderer,
  cubeGeometry,
  cubeMaterial,
  light,
  microphone,
  clock,
  cubeSpeed,
  cubeOrbitControls;

const cubeSpeedInput = document.getElementById("cubeSpeedInput");

cubeSpeedInput.addEventListener("input", (e) => {
  // Update the speed of the cube visualizer
  cubeSpeed = parseFloat(e.target.value);
});

function initCubeVisualizer(mic) {
  microphone = mic;

  cubeScene = new THREE.Scene();
  cubeCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  cubeCamera.position.z = 5;

  cubeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  cubeRenderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(cubeRenderer.domElement);

  cubeOrbitControls = new THREE.OrbitControls(
    cubeCamera,
    cubeRenderer.domElement
  );

  cubeGeometry = new THREE.BoxGeometry();
  cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  for (let i = 0; i < 100; i++) {
    const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    mesh.position.set(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    );
    mesh.scale.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    cubeScene.add(mesh);
  }

  light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  cubeScene.add(light);

  window.addEventListener("resize", cubeOnWindowResize, false);

  clock = new THREE.Clock();
  animateCubeVisualizer();

  return {
    stop: function () {
      console.log("Stopping cube visualizer"); // Replace [VisualizerName] with the corresponding visualizer name

      window.cancelAnimationFrame(cubeAnimationId);
      document.body.removeChild(cubeRenderer.domElement);
      cubeOrbitControls.dispose();

      // Remove event listeners
      window.removeEventListener("resize", cubeOnWindowResize);
      cubeSpeedInput.removeEventListener("input", (e) => {
        // Update the speed of the cube visualizer
        cubeSpeed = parseFloat(e.target.value);
      });
    },
  };
}

let cubeAnimationId;

function animateCubeVisualizer() {
  cubeAnimationId = requestAnimationFrame(animateCubeVisualizer);
  console.log(cubeAnimationId);

  const elapsedTime = clock.getElapsedTime();

  if (microphone.initialized) {
    cubeOrbitControls.update();

    const bands = microphone.getFrequencyBands();
    const lowFrequency = bands.low / 255;
    const midFrequency = bands.mid / 255;
    const highFrequency = bands.high / 255;

    cubeScene.traverse(function (object) {
      if (object.isMesh) {
        object.rotation.x = elapsedTime * lowFrequency;
        object.rotation.y = elapsedTime * midFrequency;
        object.rotation.z = elapsedTime * highFrequency;
      }
    });
  }

  cubeRenderer.render(cubeScene, cubeCamera);
  //   console.log(cubeCamera.parent);
}

function cubeOnWindowResize() {
  cubeCamera.aspect = window.innerWidth / window.innerHeight;
  cubeCamera.updateProjectionMatrix();
  cubeRenderer.setSize(window.innerWidth, window.innerHeight);
}
