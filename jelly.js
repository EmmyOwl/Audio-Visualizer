import { createSculptureWithGeometry } from 'https://unpkg.com/shader-park-core/dist/shader-park-core.esm.js';
import { spCode } from '/sp-code.js';

let jellyScene,
    jellyCamera,
    jellyRenderer,
    jellyOrbitControls,
    state,
    LFAttenuation,
    MFAttenuation,
    HFAttenuation,
    jellyMesh,
    jellyGeometry,
    distortion,
    jellyGUI;

// initial GUI settings    
var settings = {
    rotationSpeed: 0.5,
    LFAttenuation: 1,
    MFAttenuation: 1,
    HFAttenuation: 1,
    distortion: 1,
};

function initJellyVisualizer(mic) {
    microphone = mic;
    LFAttenuation = settings.LFAttenuation;
    MFAttenuation = settings.MFAttenuation;
    HFAttenuation = settings.HFAttenuation;
    distortion = settings.distortion;

    jellyScene = new THREE.Scene();

    jellyCamera = new THREE.PerspectiveCamera(75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    jellyCamera.position.z = 1.5;

    jellyRenderer = new THREE.WebGLRenderer({ antialias: true, transparent: true });
    jellyRenderer.setSize(window.innerWidth, window.innerHeight);
    jellyRenderer.setPixelRatio(window.devicePixelRatio);
    jellyRenderer.setClearColor(new THREE.Color(1, 1, 1), 0);
    //document.body.appendChild(jellyRenderer.domElement);
    document.getElementById('visualizerContainer').appendChild(jellyRenderer.domElement);

    clock = new THREE.Clock();

    state = {
        time: 0.0,
    }

    // create sphere
    jellyGeometry = new THREE.SphereGeometry(2, 45, 45);

    // pass sphere and paramters into shader park
    jellyMesh = createSculptureWithGeometry(jellyGeometry, spCode(), () => ({
        audioLow: microphone.lowFrequency,
        audioMid: microphone.midFrequency,
        audioHigh: microphone.highFrequency,
        bassFrequency: microphone.bassFrequency,
        LFAttenuation: LFAttenuation,
        MFAttenuation: MFAttenuation,
        HFAttenuation: HFAttenuation,
        _scale: .5,
        distortion: settings.distortion,
    }));

    jellyScene.add(jellyMesh);

    // add controlls
    jellyOrbitControls = new THREE.OrbitControls(jellyCamera, jellyRenderer.domElement, {
        enableDamping: true,
        dampingFactor: 0.5,
        zoomSpeed: 0.6,
    });

    jellyOrbitControls.minDistance = 1;
    jellyOrbitControls.maxDistance = 10;

    window.addEventListener("resize", jellyOnWindowResize, false);

    animateJellyVisualizer();
    settings_Jelly();

    // stop visualizer and GUI
    return {
        stop: function () {
            console.log("Stopping jelly visualizer");
            window.cancelAnimationFrame(jellyAnimationId);
            //document.getElementById('visualizerContainer').removeChild(jellyRenderer.domElement);
            let visualizerContainer = document.getElementById('visualizerContainer');
            if (visualizerContainer && jellyRenderer && jellyRenderer.domElement && visualizerContainer.contains(jellyRenderer.domElement)) {
                visualizerContainer.removeChild(jellyRenderer.domElement);
            }
            jellyOrbitControls.dispose();
            jellyGUI.destroy();
            if (jellyGUI && jellyGUI.domElement.parentNode) {
                jellyGUI.domElement.parentNode.removeChild(jellyGUI.domElement);
            }
            window.removeEventListener("resize", jellyOnWindowResize);
        },
    };
};

let jellyAnimationId;


// update frames
function animateJellyVisualizer() {
    jellyAnimationId = requestAnimationFrame(animateJellyVisualizer);
    state.time += clock.getDelta(); // create constant motion
    if (microphone.initialized) {
        jellyOrbitControls.update();

        // get frequency bands and normalize
        const bands = microphone.getFrequencyBands();
        const lowFrequency = bands.low / 255;
        const midFrequency = bands.mid / 255;
        const highFrequency = bands.high / 255;

        microphone.lowFrequency = lowFrequency
        microphone.midFrequency = midFrequency;
        microphone.highFrequency = highFrequency;

        // camera rotation
        const rotationSpeed = 0.5;
        jellyCamera.position.x = Math.sin(state.time * rotationSpeed) * 2;
        jellyCamera.position.z = Math.cos(state.time * rotationSpeed) * 2;
        jellyCamera.lookAt(jellyScene.position);

        jellyRenderer.render(jellyScene, jellyCamera);
    }
}


// set up UI parameters for jelly visualizer
function settings_Jelly() {
    jellyGUI = new dat.GUI({ autoPlace: false });
    document.getElementById('guiContainer').appendChild(jellyGUI.domElement);
    jellyGUI.add(settings, "LFAttenuation", 0, 5, 0.01).onChange(function (value) {
        LFAttenuation = value;
    });
    jellyGUI.add(settings, "MFAttenuation", 0, 10, 0.01).onChange(function (value) {
        MFAttenuation = value;
    });
    jellyGUI.add(settings, "HFAttenuation", 0, 10, 0.01).onChange(function (value) {
        HFAttenuation = value;
    });
    jellyGUI.add(settings, "distortion", 0, 5, 0.1).onChange(function (value) {
        jellyMesh.material.uniforms.distortion.value = value;
    });
}

// handle window resize  
function jellyOnWindowResize() {
    jellyCamera.aspect = window.innerWidth / window.innerHeight;
    jellyCamera.updateProjectionMatrix();
    jellyRenderer.setSize(window.innerWidth, window.innerHeight);
}

export { initJellyVisualizer };
