import { initRayMarchingVisualizer } from "./raymarching.js";
import { initJellyVisualizer } from "./jelly.js"
import { init3DVisualizer } from "./sphere.js";


let currentVisualizer = null;
let visualizerController;

let visualizerSettings = {
  visualizer: "none",
};

visualizerController = new dat.GUI({ autoPlace: false });
document.body.appendChild(visualizerController.domElement);
visualizerController.domElement.style.display = 'none';

visualizerController.domElement.style.position = 'absolute';
visualizerController.domElement.style.left = '0px';
visualizerController.domElement.style.top = '0px';


let visualizerControllerItem = visualizerController.add(visualizerSettings, "visualizer", [
  "none",
  "2D",
  "Sphere",
  "Cubes",
  "Leila",
  "Raymarching",
  "Jelly",
]).onChange(async (selectedVisualizer) => {

  if (currentVisualizer) {
    currentVisualizer.stop();
  }
  if (selectedVisualizer === "none") {
    visualizerController.domElement.style.display = 'none'; // Hide the dropdown GUI
  } else {
    visualizerController.domElement.style.display = 'block'; // Show the dropdown GUI
  }
  const mic = new Microphone(512);
  currentVisualizer = await changeVisualizer(selectedVisualizer, mic);
});



async function changeVisualizer(selectedVisualizer, mic) {
  console.log('Changing visualizer to:', selectedVisualizer);
  console.log('Current visualizer before change:', currentVisualizer);
  //console.log(mic);
  await mic.ready;
  //console.log(mic.initialized);

  let newVisualizer;

  // Wait for the mic to be initialized
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (mic.initialized) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });

  switch (selectedVisualizer) {
    case "2D":
      const canvas = document.getElementById("myCanvas");
      canvas.style.display = "block";
      newVisualizer = init2DVisualizer(mic);
      break;
    case "Sphere":
      newVisualizer = init3DVisualizer(mic);
      break;
    case "Cubes":
      newVisualizer = initCubeVisualizer(mic);
      break;
    case "Leila":
      newVisualizer = initLeilaVisualizer(mic);
      break;
    case "Raymarching":
      newVisualizer = initRayMarchingVisualizer(mic);
      break;
    case "Jelly":
      newVisualizer = initJellyVisualizer(mic);
      break;
    // Add more cases for other visualizers
    default:
      newVisualizer = null;
  }

  //console.log('New visualizer:', newVisualizer);
  //return Promise.resolve(newVisualizer);
  return newVisualizer;
}


async function startVisualizerFromSuggested(visualizerType) {
  hideWelcomeContainer();
  visualizerSettings.visualizer = visualizerType;
  visualizerControllerItem.updateDisplay();
  visualizerController.domElement.style.display = 'block';
  console.log("current Visualizer in startfromSuggested:", currentVisualizer);
  if (currentVisualizer) {
    currentVisualizer.stop();
  }
  const mic = new Microphone(512);
  currentVisualizer = await changeVisualizer(visualizerType, mic);
}


function hideWelcomeContainer() {
  const welcomeContainer = document.getElementById("welcomeContainer");
  welcomeContainer.style.display = "none";
}


function updateControlsVisibility(selectedVisualizer) {
  if (selectedVisualizer === "none") {
    gui.domElement.style.display = 'none';
  } else {
    gui.domElement.style.display = 'block';
  }
}



const suggested2D = document.getElementById("suggested2D");
const suggestedSphere = document.getElementById("suggestedSphere");
const suggestedCubes = document.getElementById("suggestedCube");
const suggestedLeila = document.getElementById("suggestedLeila");
const suggestedRaymarching = document.getElementById("suggestedRaymarching");
const suggestedJelly = document.getElementById("suggestedJelly");

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
suggestedLeila.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Leila")
);
suggestedRaymarching.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Raymarching")
);
suggestedJelly.addEventListener(
  "click",
  async () => await startVisualizerFromSuggested("Jelly")
);

async function initController() {
  const microphone = new Microphone(512);
  const selectedVisualizer = visualizerSettings.visualizer;
  currentVisualizer = await changeVisualizer(selectedVisualizer, microphone);
}


initController().catch((error) =>
  console.error("Error in initController:", error)
);