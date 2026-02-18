
// DOM elements
const mapEl = document.querySelector('arcgis-map');

// Store loaded layers
const loadedLayers = new Map();

// Initialize app
async function init() {
    await mapEl.arcgisViewReadyChange;
    loader.style.display = 'none';
    initWelcomeModal();
}

// Welcome Modal Management with localStorage

// Get modal elements
const modal = document.getElementById('welcome-modal');
const closeButton = document.getElementById('close-modal');
const dontShowCheckbox = document.getElementById('dont-show-again');

// localStorage key for tracking if user has seen the modal
const STORAGE_KEY = 'hasSeenWelcome';

/**
 * Check if user has previously seen the welcome modal
 * @returns {boolean} true if user has seen it before
 */
function hasSeenWelcome() {
    // localStorage.getItem returns null if key doesn't exist
    // We use === 'true' to convert string to boolean
    return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Save user's preference to localStorage
 * @param {boolean} dontShow - whether to hide modal in future
 */
function saveWelcomePreference(dontShow) {
    if (dontShow) {
        localStorage.setItem(STORAGE_KEY, 'true');
        console.log('Welcome preference saved: will not show again');
    }
}

/**
 * Show the welcome modal
 */
function showWelcomeModal() {
    modal.classList.remove('hidden');
    console.log('Welcome modal displayed');
}

/**
 * Hide the welcome modal
 */
function hideWelcomeModal() {
    modal.classList.add('hidden');

    // Check if user wants to suppress future displays
    if (dontShowCheckbox.checked) {
        saveWelcomePreference(true);
    }
}

/**
 * Initialize welcome modal - called after map initialization
 */
function initWelcomeModal() {
    // Check if user has seen the welcome before
    if (!hasSeenWelcome()) {
        // First time visitor - show the modal
        showWelcomeModal();
    } else {
        console.log('User has seen welcome before - skipping modal');
    }

    // Set up close button event listener
    closeButton.addEventListener('click', hideWelcomeModal);

    // Optional: Close modal if user clicks outside the content box
    modal.addEventListener('click', (event) => {
        // Only close if clicking the overlay, not the content
        if (event.target === modal) {
            hideWelcomeModal();
        }
    });
}

function resetWelcome() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Welcome preference reset - will show on next page load');
}

// BONUS: Function to manually show welcome (useful for "Help" button)
function showHelp() {
    showWelcomeModal();
}


/*
init().then(r => {});*/
init()
    .then(() => {
        console.log('Map initialized successfully');
        // Do any post-initialization tasks
        // Show welcome modal for first-time visitors
        if (!hasSeenWelcome()) {
            showWelcomeModal();
        }

        // Set up modal event listeners
        closeButton.addEventListener('click', hideWelcomeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                hideWelcomeModal();
            }
        });
    })
    .catch(error => {
        console.error('Initialization failed:', error);
        //showNotification('Failed to load map', 'error');
    });
