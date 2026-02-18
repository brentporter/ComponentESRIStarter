
// DOM elements
const mapEl = document.querySelector('arcgis-map');

// Store loaded layers
const loadedLayers = new Map();

// Initialize app
async function init() {
    await mapEl.arcgisViewReadyChange;
    loader.style.display = 'none';
}

/*
init().then(r => {});*/
init()
    .then(() => {
        console.log('Map initialized successfully');
        // Do any post-initialization tasks
    })
    .catch(error => {
        console.error('Initialization failed:', error);
        //showNotification('Failed to load map', 'error');
    });
