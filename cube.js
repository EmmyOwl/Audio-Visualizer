let cubeScene,
  cubeCamera,
  cubeRenderer,
  cubeGeometry,
  cubeMaterial,
  light,
  light1,
  light2,
  microphone,
  clock,
  cubeSpeed,
  cubeOrbitControls,
  cubeGUI;

const settings = {
  cubeSpeed: 0.05,
  bassHitThreshold: 0.15,
  cameraAngle: 0,
};

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
  //document.body.appendChild(cubeRenderer.domElement);
  document.getElementById('visualizerContainer').appendChild(cubeRenderer.domElement);


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

  light1 = new THREE.DirectionalLight(0xff0000, 1);
  light1.position.set(1, 1, 1);
  cubeScene.add(light1);

  light2 = new THREE.DirectionalLight(0x0000ff, 1);
  light2.position.set(-1, -1, -1);
  cubeScene.add(light2);

  light1.visible = true;
  light2.visible = false;

  window.addEventListener("resize", cubeOnWindowResize, false);

  clock = new THREE.Clock();
  animateCubeVisualizer();
  settings_Cube();


  return {
    stop: function () {
      console.log("Stopping cube visualizer");

      window.cancelAnimationFrame(cubeAnimationId);
      //document.body.removeChild(cubeRenderer.domElement);
      document.getElementById('visualizerContainer').removeChild(cubeRenderer.domElement);
      cubeOrbitControls.dispose();
      cubeGUI.destroy();
      if (cubeGUI && cubeGUI.domElement.parentNode) {
        cubeGUI.domElement.parentNode.removeChild(cubeGUI.domElement);
    }
      window.removeEventListener("resize", cubeOnWindowResize);;
    },
  };
}

function applyThreshold(value, threshold) {
  return value > threshold ? value : 0;
};

let cubeAnimationId;
let prevBassFrequency = 0;
let bassHitThreshold = 0.05;

function animateCubeVisualizer() {
  cubeAnimationId = requestAnimationFrame(animateCubeVisualizer);
  const elapsedTime = clock.getElapsedTime();

  settings.cameraAngle += settings.cubeSpeed / 100;
  const radius = 10;
  cubeCamera.position.x = radius * Math.cos(settings.cameraAngle);
  cubeCamera.position.z = radius * Math.sin(settings.cameraAngle);
  cubeCamera.lookAt(cubeScene.position);

  if (microphone.initialized) {
    cubeOrbitControls.update();

    let thresholdLow = 0.1;
    let thresholdMid = 0.5;
    let thresholdHigh = 0.1;

    const bands = microphone.getFrequencyBands();
    const lowFrequency = applyThreshold(bands.low / 255, thresholdLow);
    const midFrequency = applyThreshold(bands.mid / 255, thresholdMid);
    const highFrequency = applyThreshold(bands.high / 255, thresholdHigh);

    cubeScene.traverse(function (object) {
      if (object.isMesh) {
        object.rotation.x = elapsedTime * lowFrequency * settings.cubeSpeed;
        object.rotation.z = elapsedTime * highFrequency * settings.cubeSpeed / 2;
      }
    });

    const bassFrequency = bands.bass / 255;

    // Detect a bass hit
    if (bassFrequency - prevBassFrequency > settings.bassHitThreshold) {
      console.log('Bass hit detected!');

      // Switch between the lights
      light1.visible = !light1.visible;
      light2.visible = !light2.visible;
      //console.log(`light1.visible: ${light1.visible}, light2.visible: ${light2.visible}`);
    }

    prevBassFrequency = bassFrequency;
  }
  cubeRenderer.render(cubeScene, cubeCamera);
}

function settings_Cube() {
  cubeGUI = new dat.GUI({ autoPlace: false });
  document.getElementById('guiContainer').appendChild(cubeGUI.domElement);
  cubeGUI.add(settings, "cubeSpeed", 0, 0.1, 0.001);
  cubeGUI.add(settings, "bassHitThreshold", 0, 0.1, 0.01);

}

function cubeOnWindowResize() {
  cubeCamera.aspect = window.innerWidth / window.innerHeight;
  cubeCamera.updateProjectionMatrix();
  cubeRenderer.setSize(window.innerWidth, window.innerHeight);
}
