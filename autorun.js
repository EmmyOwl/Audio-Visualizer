console.log('check in autorun');
let currentIndex = 0;
let isAutoRunning = false;
let timeoutId;

const visualizers = ["2D", "Sphere", "Cubes", "Orbs", "Raymarching", "Jelly"];

async function autoRunVisualizers(mic, changeVisualizer, currentVisualizer) {
  if (!isAutoRunning) {
    return;
  }

  if (currentVisualizer) {
    await currentVisualizer.stop();
  }

  currentVisualizer = await changeVisualizer(visualizers[currentIndex], mic);

  currentIndex = (currentIndex + 1) % visualizers.length;
  timeoutId = setTimeout(() => autoRunVisualizers(mic, changeVisualizer, currentVisualizer), 15000);
}

function startAutoRun(mic, changeVisualizer, currentVisualizer) {
  isAutoRunning = true;
  autoRunVisualizers(mic, changeVisualizer, currentVisualizer);
}

function stopAutoRun() {
  isAutoRunning = false;
  clearTimeout(timeoutId);
}

export { startAutoRun, stopAutoRun };
