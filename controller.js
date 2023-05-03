let currentVisualizer = null;

const visualizerSelector = document.getElementById("visualizerSelector");

visualizerSelector.addEventListener("change", () => {
    if (currentVisualizer) {
        currentVisualizer.stop();
    }

    const selectedVisualizer = visualizerSelector.value;
    const mic = new Microphone(512);
    currentVisualizer = changeVisualizer(selectedVisualizer, mic);
    updateVisualizerUI(selectedVisualizer);
});

function changeVisualizer(selectedVisualizer, mic) {
    switch (selectedVisualizer) {
        case "2D":
            const canvas = document.getElementById('myCanvas');
            canvas.style.display = 'block';
            return init2DVisualizer(mic);
        case "3D":
            return init3DVisualizer(mic);
        case "Cubes":
            return initCubeVisualizer(mic);
        // Add more cases for other visualizers
        default:
            return null;
    }
}

function updateVisualizerUI(selectedVisualizer) {

    const fftSizeContainer = document.getElementById('fftSizeContainer');
    const colorRangeContainer = document.getElementById('colorRangeContainer');
    const rotationSpeedContainer = document.getElementById('rotationSpeedContainer');
    const sensitivityContainer = document.getElementById('sensitivityContainer');

    fftSizeContainer.style.display = 'none';
    colorRangeContainer.style.display = 'none';
    rotationSpeedContainer.style.display = 'none';
    sensitivityContainer.style.display = 'none';

    updateControlsVisibility();

    const visualizerSpecificControls = document.querySelectorAll(`.visualizer-specific`);
    visualizerSpecificControls.forEach(control => control.style.display = 'none');
    const selectedVisualizerControls = document.querySelectorAll(`.v${selectedVisualizer}-visualizer-specific`);
    selectedVisualizerControls.forEach(control => control.style.display = 'block');

    // general parameters for all UIs
    if (selectedVisualizer !== 'none') {
        fftSizeContainer.style.display = 'block';
        sensitivityContainer.style.display = 'block';
    }

    // visualizer specific parameters
    switch (selectedVisualizer) {
        case '2D':
            colorRangeContainer.style.display = 'block';
            rotationSpeedContainer.style.display = 'block';
            break;
        case '3D':
            break;
        case 'Cubes':
            //rotationSpeedContainer.style.display = 'block';
            break;
    }
}

function startVisualizerFromSuggested(visualizerType) {
    hideWelcomeContainer();
    visualizerSelector.value = visualizerType;
    if (currentVisualizer) {
        currentVisualizer.stop();
    }
    const mic = new Microphone(512);
    currentVisualizer = changeVisualizer(visualizerType, mic);
    updateVisualizerUI(visualizerType);
}

function hideWelcomeContainer() {
    const welcomeContainer = document.getElementById('welcomeContainer');
    welcomeContainer.style.display = 'none';
}

function updateControlsVisibility() {
    const controls = document.getElementById("controls");
    if (visualizerSelector.value === "none") {
        controls.classList.remove("active");
    } else {
        controls.classList.add("active");
    }
}

const suggested2D = document.getElementById("suggested2D");
const suggested3D = document.getElementById("suggested3D");
const suggestedCubes = document.getElementById("suggestedCube");

suggested2D.addEventListener("click", () => startVisualizerFromSuggested("2D"));
suggested3D.addEventListener("click", () => startVisualizerFromSuggested("3D"));
suggestedCubes.addEventListener("click", () => startVisualizerFromSuggested("Cubes"));

function initController() {
    const microphone = new Microphone(512);
    const selectedVisualizer = visualizerSelector.value;
    currentVisualizer = changeVisualizer(selectedVisualizer, microphone);
    updateVisualizerUI(selectedVisualizer);

    const fftSizeSlider = document.getElementById('fftSizeInput');
    const colorRangeSlider = document.getElementById('colorRangeInput');
    const rotationSpeedSlider = document.getElementById('rotationSpeedInput');
    const sensitivitySlider = document.getElementById('sensitivityInput');
    const sphereColorInput = document.getElementById("sphereColorInput");
    const wireframeInput = document.getElementById("wireframeInput");


    fftSizeSlider.addEventListener('input', event => {
        const fftSize = parseInt(event.target.value);
        microphone.setFFTSize(fftSize);
        if (currentVisualizer && currentVisualizer.updateSphereSegments) {
            currentVisualizer.updateSphereSegments(mapFFTSizeToSegments(fftSize));
        }
    });

    colorRangeSlider.addEventListener('input', event => {
        const colorRange = parseFloat(event.target.value);
        if (currentVisualizer && currentVisualizer.setColorRange) {
            currentVisualizer.setColorRange(colorRange);
        }
    });

    rotationSpeedSlider.addEventListener('input', event => {
        const rotationSpeed = parseFloat(event.target.value);
        if (currentVisualizer && currentVisualizer.setRotationSpeed) {
            currentVisualizer.setRotationSpeed(rotationSpeed);
        }
    });

    sensitivitySlider.addEventListener('input', event => {
        const sensitivity = parseFloat(event.target.value);
        if (currentVisualizer && currentVisualizer.setSensitivity) {
            currentVisualizer.setSensitivity(sensitivity);
        }
    });
    sphereColorInput.addEventListener("input", event => {
        const sphereColor = parseFloat(event.target.value);
        if (currentVisualizer && currentVisualizer.setSphereColor) {
            currentVisualizer.setSphereColorInput(sphereColor);
        }
    });

    wireframeInput.addEventListener("change", event => {
        const wireframe = parseFloat(event.target.checked);
        if (currentVisualizer && currentVisualizer.setWireframe) {
            currentVisualizer.setWireframe(wireframe);
        }
    });
}

initController();
