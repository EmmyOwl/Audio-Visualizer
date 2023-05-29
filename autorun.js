
console.log('check in autorun');
let currentIndex = 0;
let isAutoRunning = false;

const visualizers = ["2D", "Sphere", "Cubes", "Orbs", "Raymarching", "Jelly"];

async function autoRunVisualizers(mic, changeVisualizer, currentVisualizer) {
  if (!isAutoRunning) {
    return;
  }

  if (currentVisualizer) {
    currentVisualizer.stop();
  }

  currentVisualizer = await changeVisualizer(visualizers[currentIndex], mic);

  currentIndex = (currentIndex + 1) % visualizers.length;
  setTimeout(() => autoRunVisualizers(mic, changeVisualizer, currentVisualizer), 15000);
}

function startAutoRun(mic, changeVisualizer, currentVisualizer) {
  isAutoRunning = true;
  autoRunVisualizers(mic, changeVisualizer, currentVisualizer);
}

function stopAutoRun() {
  isAutoRunning = false;
}

export { startAutoRun, stopAutoRun };
