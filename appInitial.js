
// DOM elements
const mapEl = document.querySelector('arcgis-map');

// Store loaded layers
const loadedLayers = new Map();

// Initialize app
async function init() {
    await mapEl.arcgisViewReadyChange;
    loader.style.display = 'none';
}

init().then(r => {});