import { initRayMarchingVisualizer } from "./raymarching.js";
import { initJellyVisualizer } from "./jelly.js"
import { initSphereVisualizer } from "./sphere.js";
import { startAutoRun, stopAutoRun } from "./autorun.js";


let currentVisualizer = null;
let visualizerController;
let mic;

let visualizerSettings = {
  visualizer: "none",
  autoRun: false,
};

visualizerController = new dat.GUI({ autoPlace: false });
document.body.appendChild(visualizerController.domElement);
visualizerController.domElement.style.display = 'none';

visualizerController.domElement.style.position = 'absolute';
visualizerController.domElement.style.left = '0px';
visualizerController.domElement.style.top = '0px';
visualizerController.domElement.style.zIndex = '2000';

visualizerController.add(visualizerSettings, 'autoRun').name('Auto Run Visualizers').onChange(value => {
  if (value) {
    startAutoRun(mic, changeVisualizer, currentVisualizer);
  } else {
    stopAutoRun();
  }
});

let visualizerControllerItem = visualizerController.add(visualizerSettings, "visualizer", [
  "none",
  "2D",
  "Sphere",
  "Cubes",
  "Orbs",
  "Raymarching",
  "Jelly",
  "Galaxy",
]).onChange(async (selectedVisualizer) => {

  if (currentVisualizer) {
    currentVisualizer.stop();
  }
  if (selectedVisualizer === "none") {
    visualizerController.domElement.style.display = 'none';
  } else {
    visualizerController.domElement.style.display = 'block';
  }
  if (!visualizerSettings.autoRun) {
    currentVisualizer = await changeVisualizer(selectedVisualizer, mic);
} else {
    if (currentVisualizer && currentVisualizer.gui) {
        currentVisualizer.gui.domElement.style.display = 'none';
    }
}
});



async function changeVisualizer(selectedVisualizer, mic) {
  console.log('Changing visualizer to:', selectedVisualizer);
  //console.log('Current visualizer before change:', currentVisualizer);
  //console.log(mic.initialized);

  let newVisualizer;

  switch (selectedVisualizer) {
    case "2D":
      const canvas = document.getElementById("myCanvas");
      canvas.style.display = "block";
      newVisualizer = init2DVisualizer(mic);
      break;
    case "Sphere":
      newVisualizer = initSphereVisualizer(mic);
      break;
    case "Cubes":
      newVisualizer = initCubeVisualizer(mic);
      break;
    case "Orbs":
      newVisualizer = initOrbsVisualizer(mic);
      break;
    case "Raymarching":
      newVisualizer = initRayMarchingVisualizer(mic);
      break;
    case "Jelly":
      newVisualizer = initJellyVisualizer(mic);
      break;
    case "Galaxy":
      newVisualizer = initGalaxyVisualizer(mic);
      break;

    default:
      newVisualizer = null;
  }
  return newVisualizer;
}


async function startVisualizerFromSuggested(visualizerType) {
  hideWelcomeContainer();
  visualizerSettings.visualizer = visualizerType;
  visualizerControllerItem.updateDisplay();
  visualizerController.domElement.style.display = 'block';
  console.log("current Visualizer in startfromSuggested:", currentVisualizer);
  if (currentVisualizer) {
    await currentVisualizer.stop();
  }
  currentVisualizer = await changeVisualizer(visualizerType, mic);
}


function hideWelcomeContainer() {
  const welcomeContainer = document.getElementById("welcomeContainer");
  welcomeContainer.style.display = "none";
  welcomeContainer.style.zIndex = 0;
}

const suggested2D = document.getElementById("suggested2D");
const suggestedSphere = document.getElementById("suggestedSphere");
const suggestedCubes = document.getElementById("suggestedCube");
const suggestedOrbs = document.getElementById("suggestedOrbs");
const suggestedRaymarching = document.getElementById("suggestedRaymarching");
const suggestedJelly = document.getElementById("suggestedJelly");
const suggestedGalaxy = document.getElementById("suggestedGalaxy");

suggested2D.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("2D")
);
suggestedSphere.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Sphere")
);
suggestedCubes.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Cubes")
);
suggestedOrbs.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Orbs")
);
suggestedRaymarching.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Raymarching")
);
suggestedJelly.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Jelly")
);
suggestedGalaxy.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Galaxy")
);

async function initController() {
  mic = new Microphone(512);
  const selectedVisualizer = visualizerSettings.visualizer;
  currentVisualizer = await changeVisualizer(selectedVisualizer, mic);
}


initController().catch((error) =>
  console.error("Error in initController:", error)
);
