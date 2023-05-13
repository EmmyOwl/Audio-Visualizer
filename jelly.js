import { createSculptureWithGeometry } from 'https://unpkg.com/shader-park-core/dist/shader-park-core.esm.js';
import { spCode } from '/sp-code.js';

let jellyScene, jellyCamera, jellyRenderer, jellyOrbitControls, state, thresholdLow, thresholdHigh, thresholdMid, LFAttenuation, MFAttenuation, HFAttenuation, fftSize, jellyMesh, jellyGeometry, treble, jellyGUI;

var settings = {
    rotationSpeed: 0.5,
    thresholdLow: 0.1,
    thresholdMid: 0.1,
    thresholdHigh: 0.1,
    LFAttenuation: 0.3,
    MFAttenuation: 1,
    HFAttenuation: 1,
    treble: 1,
};

function initJellyVisualizer(mic) {
    microphone = mic;
    LFAttenuation = settings.LFAttenuation;
    MFAttenuation = settings.MFAttenuation;
    HFAttenuation = settings.HFAttenuation;
    treble = settings.treble;
    fftSize = 256;

    jellyScene = new THREE.Scene();

    jellyCamera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    jellyCamera.position.z = 1.5;

    jellyRenderer = new THREE.WebGLRenderer({ antialias: true, transparent: true });
    jellyRenderer.setSize(window.innerWidth, window.innerHeight);
    jellyRenderer.setPixelRatio(window.devicePixelRatio);
    jellyRenderer.setClearColor(new THREE.Color(1, 1, 1), 0);
    document.body.appendChild(jellyRenderer.domElement);

    clock = new THREE.Clock();

    state = {
        mouse: new THREE.Vector3(),
        currMouse: new THREE.Vector3(),
        pointerDown: 0.0,
        currPointerDown: 0.0,
        audio: 0.0,
        currAudio: 0.0,
        time: 0.0,
    }

    jellyGeometry = new THREE.SphereGeometry(2, 45, 45);

    jellyMesh = createSculptureWithGeometry(jellyGeometry, spCode(), () => ({
        time: state.time,
        audioLow: microphone.lowFrequency,
        audioMid: microphone.midFrequency,
        audioHigh: microphone.highFrequency,
        mouse: state.mouse,
        LFAttenuation: LFAttenuation,
        MFAttenuation: MFAttenuation,
        HFAttenuation: HFAttenuation,
        _scale: .5,
        treble: treble,
    }));

    jellyScene.add(jellyMesh);

    // Add Controlls
    jellyOrbitControls = new THREE.OrbitControls(jellyCamera, jellyRenderer.domElement, {
        enableDamping: true,
        dampingFactor: 0.5,
        zoomSpeed: 0.6,
        rotateSpeed: 0.5,
    });

    jellyOrbitControls.minDistance = 1;
    jellyOrbitControls.maxDistance = 10;

    window.addEventListener("resize", jellyOnWindowResize, false);

    animateJellyVisualizer();
    settings_Jelly();


    return {
        stop: function () {
            console.log("Stopping jelly visualizer");

            window.cancelAnimationFrame(jellyAnimationId);
            document.body.removeChild(jellyRenderer.domElement);
            jellyOrbitControls.dispose();
            jellyGUI.destroy();
            // Remove event listeners
            window.removeEventListener("resize", jellyOnWindowResize);
        },
    };
};

let jellyAnimationId;

function applyThreshold(value, threshold) {
    return value > threshold ? value : 0;
};

thresholdLow = settings.thresholdLow;
thresholdMid = settings.thresholdMid;
thresholdHigh = settings.thresholdHigh;

function animateJellyVisualizer() {
    jellyAnimationId = requestAnimationFrame(animateJellyVisualizer);
    state.time += clock.getDelta();

    if (microphone.initialized) {
        jellyOrbitControls.update();

        const bands = microphone.getFrequencyBands();
        const lowFrequency = applyThreshold(bands.low / fftSize, thresholdLow);
        const midFrequency = applyThreshold(bands.mid / fftSize, thresholdMid);
        const highFrequency = applyThreshold(bands.high / fftSize, thresholdHigh);

        microphone.lowFrequency = lowFrequency
        microphone.midFrequency = midFrequency;
        microphone.highFrequency = highFrequency;

        //state.mouse.lerp(state.currMouse, 0.05);
        //updateSpherePosition(state.time);
        jellyRenderer.render(jellyScene, jellyCamera);
    }
}

function settings_Jelly() {
  jellyGUI = new dat.GUI();
  /*
  jellyGUI.add(settings, "thresholdLow", 0, 1, 0.01).onChange(function(value) {
    thresholdLow = value;
  });
  jellyGUI.add(settings, "thresholdMid", 0, 1, 0.01).onChange(function(value) {
    thresholdMid = value;
  });
  jellyGUI.add(settings, "thresholdHigh", 0, 1, 0.01).onChange(function(value) {
    thresholdHigh = value;
  });*/
  jellyGUI.add(settings, "LFAttenuation", 0, 5, 0.01).onChange(function(value) {
    LFAttenuation = value;
  });
  jellyGUI.add(settings, "MFAttenuation", 0, 10, 0.01).onChange(function(value) {
    MFAttenuation = value;
  });
  jellyGUI.add(settings, "HFAttenuation", 0, 10, 0.01).onChange(function(value) {
    HFAttenuation = value;
  });
  jellyGUI.add(settings, "treble", 0, 2, 0.01).onChange(function(value) {
    jellyMesh.material.uniforms.treble.value = value;
  });
}
/*
function updateSpherePosition(time) {
    const x = Math.sin(time);
    const y = Math.sin(time * 2) * 0.5;
    const z = Math.cos(time) * 0;
    jellyMesh.position.set(x, y, z);
  }*/
  


function jellyOnWindowResize() {
    jellyCamera.aspect = window.innerWidth / window.innerHeight;
    jellyCamera.updateProjectionMatrix();
    jellyRenderer.setSize(window.innerWidth, window.innerHeight);
}

export { initJellyVisualizer };
