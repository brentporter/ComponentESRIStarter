// Import ArcGIS modules
import Graphic from 'https://js.arcgis.com/4.30/@arcgis/core/Graphic.js';
import GraphicsLayer from 'https://js.arcgis.com/4.30/@arcgis/core/layers/GraphicsLayer.js';
import Extent from 'https://js.arcgis.com/4.30/@arcgis/core/geometry/Extent.js';
// DOM elements
const mapEl = document.querySelector('arcgis-map');
const basemapSelect = document.getElementById('basemap-select');
const locationSelect = document.getElementById('location-select');
const addMarkerBtn = document.getElementById('add-marker');
const loader = document.getElementById('loader');
const geojsonInput = document.getElementById('geojson-input');
const fileNameDisplay = document.getElementById('file-name');
const layerListEl = document.getElementById('layer-list');
const notification = document.getElementById('notification');
const removeMarkerBtn = document.getElementById('remove-marker');

// Store loaded layers
const loadedLayers = new Map();

// Initialize app
async function init() {
    await mapEl.arcgisViewReadyChange;
    loader.style.display = 'none';

}

// Setup all event listeners
function setupEventListeners() {
    removeMarkerBtn.addEventListener('click', handleRemoveAllMarkers);
    basemapSelect.addEventListener('change', handleBasemapChange);
    locationSelect.addEventListener('change', handleLocationChange);
    addMarkerBtn.addEventListener('click', handleAddMarker);
    geojsonInput.addEventListener('change', handleGeoJSONUpload);
}

// Handle basemap change
function handleBasemapChange(e) {
    mapEl.basemap = e.target.value;
}

// Handle location navigation
async function handleLocationChange(e) {
    if (e.target.value && e.target.value !== 'def') {
        const [lon, lat, zoom] = e.target.value.split(',');
        const view = mapEl.view;

        try {
            // Use goTo for smooth animation and forced zoom level
            await view.goTo({
                center: [parseFloat(lon), parseFloat(lat)],
                zoom: parseInt(zoom),
                duration: 1000  // Animation duration in milliseconds
            });

        } catch (error) {
            console.error('Error navigating to location:', error);
            showNotification('Failed to navigate to location', 'error');
        }
    }

    // Reset dropdown to default after navigation
    setTimeout(() => {
        locationSelect.value = 'def';
    }, 100);
}

// Handle adding marker at center
async function handleAddMarker() {
    const view = mapEl.view;
    const center = view.center;

    const point = {
        type: 'point',
        longitude: center.longitude,
        latitude: center.latitude
    };

    const markerSymbol = {
        type: 'simple-marker',
        color: [226, 119, 40],
        outline: {
            color: [255, 255, 255],
            width: 2
        },
        size: 12
    };

    const pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
            name: 'Custom Marker',
            description: `Lat: ${center.latitude.toFixed(4)}, Lon: ${center.longitude.toFixed(4)}`
        },
        popupTemplate: {
            title: '{name}',
            content: '{description}'
        }
    });

    view.graphics.add(pointGraphic);
    showNotification('Marker added successfully!', 'success');
}

// Remove ALL markers at once
async function handleRemoveAllMarkers() {
    const view = mapEl.view;
    const graphics = view.graphics;

    if (graphics.length === 0) {
        showNotification('No markers to remove', 'error');
        return;
    }

    const count = graphics.length;
    graphics.removeAll();

    showNotification(`Removed ${count} marker(s)`, 'success');
}

// Handle GeoJSON file upload
async function handleGeoJSONUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.textContent = `Selected: ${file.name}`;

    try {
        const geojsonText = await file.text();
        const geojsonData = JSON.parse(geojsonText);

        await loadGeoJSON(geojsonData, file.name);
        showNotification(`Successfully loaded ${file.name}`, 'success');
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        showNotification(`Error loading file: ${error.message}`, 'error');
        fileNameDisplay.textContent = '';
    }
}

// Load GeoJSON data onto the map
async function loadGeoJSON(geojsonData, fileName) {
    const view = mapEl.view;

    // Create a new graphics layer for this GeoJSON
    const layer = new GraphicsLayer({
        title: fileName
    });

    const graphics = [];
    let allCoordinates = [];

    // Process GeoJSON features
    if (geojsonData.type === 'FeatureCollection') {
        geojsonData.features.forEach((feature, index) => {
            const graphic = createGraphicFromGeoJSON(feature);
            if (graphic) {
                graphics.push(graphic);
                const coords = extractCoordinates(feature.geometry);
                allCoordinates.push(...coords);
            } else {
                console.warn(`Failed to create graphic for feature ${index}`);
            }
        });
    } else if (geojsonData.type === 'Feature') {
        const graphic = createGraphicFromGeoJSON(geojsonData);
        if (graphic) {
            graphics.push(graphic);
            allCoordinates.push(...extractCoordinates(geojsonData.geometry));
        }
    } else {
        console.error('Unknown GeoJSON type:', geojsonData.type);
    }



    layer.addMany(graphics);
    view.map.add(layer);

    // Store the layer
    const layerId = `layer-${Date.now()}`;
    loadedLayers.set(layerId, { layer, fileName });
    updateLayerList();

    // Calculate bounds and zoom to the data
    if (allCoordinates.length > 0) {
        if (allCoordinates.length === 1) {
            // Single point
            const [lon, lat] = allCoordinates[0];
            await view.goTo({
                center: [lon, lat],
                zoom: 15,
                duration: 2000
            });
        } else {
            // Multiple points - use Extent class
            const extentData = calculateExtent(allCoordinates);
            const extent = new Extent({
                xmin: extentData.xmin,
                ymin: extentData.ymin,
                xmax: extentData.xmax,
                ymax: extentData.ymax,
                spatialReference: { wkid: 4326 }
            });

            await view.goTo(extent, { duration: 1000 });
        }
    }
    locationSelect.value = 'def';
    return layer;
}

// This function extracts coordinates
function extractCoordinates(geometry) {
    console.log('Extracting coordinates from geometry type:', geometry.type);
    const coords = [];

    switch (geometry.type) {
        case 'Point':
            coords.push(geometry.coordinates);
            break;

        case 'MultiPoint':
            coords.push(...geometry.coordinates);
            break;

        case 'LineString':
            coords.push(...geometry.coordinates);
            break;

        case 'MultiLineString':
            geometry.coordinates.forEach(line => {
                coords.push(...line);
            });
            break;

        case 'Polygon':
            geometry.coordinates.forEach(ring => {
                coords.push(...ring);
            });
            break;

        case 'MultiPolygon':
            geometry.coordinates.forEach(polygon => {
                polygon.forEach(ring => {
                    coords.push(...ring);
                });
            });
            break;

        default:
            console.warn('Unknown geometry type:', geometry.type);
    }

    console.log('Extracted coordinates:', coords);
    return coords;
}

// This function calculates extent
function calculateExtent(coordinates) {
    const lons = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    console.log('Bounds:', { minLon, maxLon, minLat, maxLat });

    // Add 10% padding around the extent (or use fixed padding for single points)
    const lonPadding = Math.max((maxLon - minLon) * 0.1, 0.01);
    const latPadding = Math.max((maxLat - minLat) * 0.1, 0.01);

    return {
        xmin: minLon - lonPadding,
        ymin: minLat - latPadding,
        xmax: maxLon + lonPadding,
        ymax: maxLat + latPadding,
        spatialReference: { wkid: 4326 }
    };
}

// Create ArcGIS Graphic from GeoJSON feature
function createGraphicFromGeoJSON(feature) {
    const geometry = convertGeoJSONGeometry(feature.geometry);
    if (!geometry) return null;

    const symbol = getSymbolForGeometry(feature.geometry.type);

    return new Graphic({
        geometry: geometry,
        symbol: symbol,
        attributes: feature.properties || {},
        popupTemplate: createPopupTemplate(feature.properties)
    });
}

// Convert GeoJSON geometry to ArcGIS geometry
function convertGeoJSONGeometry(geojsonGeom) {
    switch (geojsonGeom.type) {
        case 'Point':
            return {
                type: 'point',
                longitude: geojsonGeom.coordinates[0],
                latitude: geojsonGeom.coordinates[1]
            };

        case 'LineString':
            return {
                type: 'polyline',
                paths: [geojsonGeom.coordinates]
            };

        case 'Polygon':
            return {
                type: 'polygon',
                rings: geojsonGeom.coordinates
            };

        case 'MultiPoint':
            return {
                type: 'multipoint',
                points: geojsonGeom.coordinates
            };

        case 'MultiLineString':
            return {
                type: 'polyline',
                paths: geojsonGeom.coordinates
            };

        case 'MultiPolygon':
            return {
                type: 'polygon',
                rings: geojsonGeom.coordinates.flat()
            };

        default:
            console.warn(`Unsupported geometry type: ${geojsonGeom.type}`);
            return null;
    }
}

// Get appropriate symbol for geometry type
function getSymbolForGeometry(geomType) {
    switch (geomType) {
        case 'Point':
        case 'MultiPoint':
            return {
                type: 'simple-marker',
                color: [51, 51, 204, 0.7],
                size: 8,
                outline: {
                    color: [255, 255, 255],
                    width: 1
                }
            };

        case 'LineString':
        case 'MultiLineString':
            return {
                type: 'simple-line',
                color: [51, 51, 204, 0.8],
                width: 2
            };

        case 'Polygon':
        case 'MultiPolygon':
            return {
                type: 'simple-fill',
                color: [51, 51, 204, 0.3],
                outline: {
                    color: [51, 51, 204, 0.8],
                    width: 2
                }
            };

        default:
            return null;
    }
}

// Create popup template from properties
function createPopupTemplate(properties) {
    if (!properties || Object.keys(properties).length === 0) {
        return {
            title: 'Feature',
            content: 'No properties available'
        };
    }

    const content = Object.entries(properties)
        .map(([key, value]) => `<b>${key}:</b> ${value}`)
        .join('<br>');

    return {
        title: properties.name || properties.title || 'Feature',
        content: content
    };
}

// Update bounds to include geometry
function updateBounds(bounds, geometry) {
    if (!geometry) return bounds;

    let minX, minY, maxX, maxY;

    if (geometry.type === 'point') {
        minX = maxX = geometry.longitude;
        minY = maxY = geometry.latitude;
    } else if (geometry.type === 'polyline') {
        const coords = geometry.paths.flat();
        minX = Math.min(...coords.map(c => c[0]));
        maxX = Math.max(...coords.map(c => c[0]));
        minY = Math.min(...coords.map(c => c[1]));
        maxY = Math.max(...coords.map(c => c[1]));
    } else if (geometry.type === 'polygon') {
        const coords = geometry.rings.flat();
        minX = Math.min(...coords.map(c => c[0]));
        maxX = Math.max(...coords.map(c => c[0]));
        minY = Math.min(...coords.map(c => c[1]));
        maxY = Math.max(...coords.map(c => c[1]));
    }

    if (!bounds) {
        return {
            xmin: minX,
            ymin: minY,
            xmax: maxX,
            ymax: maxY,
            spatialReference: { wkid: 4326 },
            expand: function(factor) {
                const width = this.xmax - this.xmin;
                const height = this.ymax - this.ymin;
                const expandWidth = width * (factor - 1) / 2;
                const expandHeight = height * (factor - 1) / 2;
                return {
                    xmin: this.xmin - expandWidth,
                    ymin: this.ymin - expandHeight,
                    xmax: this.xmax + expandWidth,
                    ymax: this.ymax + expandHeight,
                    spatialReference: this.spatialReference
                };
            }
        };
    }

    return {
        xmin: Math.min(bounds.xmin, minX),
        ymin: Math.min(bounds.ymin, minY),
        xmax: Math.max(bounds.xmax, maxX),
        ymax: Math.max(bounds.ymax, maxY),
        spatialReference: bounds.spatialReference,
        expand: bounds.expand
    };
}

// Update the layer list UI
function updateLayerList() {
    if (loadedLayers.size === 0) {
        layerListEl.innerHTML = '<p style="font-size: 0.8rem; color: #999;">No layers loaded</p>';
        return;
    }

    layerListEl.innerHTML = '';
    loadedLayers.forEach((data, layerId) => {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.innerHTML = `
      <span>${data.fileName}</span>
      <button onclick="window.removeLayer('${layerId}')">Remove</button>
    `;
        layerListEl.appendChild(layerItem);
    });
}

// Remove a layer from the map
window.removeLayer = function(layerId) {
    const data = loadedLayers.get(layerId);
    if (data) {
        mapEl.view.map.remove(data.layer);
        loadedLayers.delete(layerId);
        updateLayerList();
        showNotification(`Removed ${data.fileName}`, 'success');
    }
};

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Start the app
init().then(r => {
    setupEventListeners();
});