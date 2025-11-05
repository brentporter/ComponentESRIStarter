// Import ArcGIS modules
import Graphic from 'https://js.arcgis.com/4.30/@arcgis/core/Graphic.js';
import GraphicsLayer from 'https://js.arcgis.com/4.30/@arcgis/core/layers/GraphicsLayer.js';
import SimpleRenderer from 'https://js.arcgis.com/4.30/@arcgis/core/renderers/SimpleRenderer.js';
import Extent from 'https://js.arcgis.com/4.30/@arcgis/core/geometry/Extent.js';
import Legend from 'https://js.arcgis.com/4.30/@arcgis/core/widgets/Legend.js';
import Expand from 'https://js.arcgis.com/4.30/@arcgis/core/widgets/Expand.js';

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

// Variable for programmatic Legend Widget
let legendWidget = null;
// Store loaded layers
const loadedLayers = new Map();


// Programmatically create Legend Component
async function createLegend() {
    await mapEl.arcgisViewReadyChange;
    const view = mapEl.view;
    await view.when();

    // Create the legend widget
    legendWidget = new Legend({
        view: view,
        container: document.createElement("div"),
        respectLayerVisibility: true
    });

    // Wrap it in an Expand widget for a cleaner UI
    const legendExpand = new Expand({
        view: view,
        content: legendWidget,
        expanded: true,
        expandIconClass: "esri-icon-layer-list"
    });

    // Add to the view
    view.ui.add(legendExpand, "bottom-left");

    console.log('Legend created programmatically');
}

// Initialize app
async function init() {
    await mapEl.arcgisViewReadyChange;
    loader.style.display = 'none';
    setupEventListeners();
    // Give the view a moment to fully initialize
    // This is commented out for the moment
    /*setTimeout(async () => {
        await createLegend()
    }, 750);*/
}

// Setup all event listeners
function setupEventListeners() {
    removeMarkerBtn.addEventListener('click', handleRemoveAllMarkers);
    basemapSelect.addEventListener('change', handleBasemapChange);
    locationSelect.addEventListener('change', handleLocationChange);
    addMarkerBtn.addEventListener('click', handleAddMarker);
    geojsonInput.addEventListener('change', handleGeoJSONUpload);
}

// basemap changes
function handleBasemapChange(e) {
    mapEl.basemap = e.target.value;
}

// location navigation
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

// adding marker at center
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

// GeoJSON file upload
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

    // Separate graphics by geometry type
    const graphicsByType = {
        point: [],
        line: [],
        polygon: []
    };

    let allCoordinates = [];

    // Process GeoJSON features and categorize by geometry type
    if (geojsonData.type === 'FeatureCollection') {
        geojsonData.features.forEach((feature, index) => {
            const graphic = createGraphicFromGeoJSON(feature);
            if (graphic) {
                const coords = extractCoordinates(feature.geometry);
                allCoordinates.push(...coords);

                // Categorize by geometry type
                const geomType = feature.geometry.type.toLowerCase();
                if (geomType.includes('point')) {
                    graphicsByType.point.push(graphic);
                } else if (geomType.includes('line')) {
                    graphicsByType.line.push(graphic);
                } else if (geomType.includes('polygon')) {
                    graphicsByType.polygon.push(graphic);
                }
            }
        });
    } else if (geojsonData.type === 'Feature') {
        const graphic = createGraphicFromGeoJSON(geojsonData);
        if (graphic) {
            allCoordinates.push(...extractCoordinates(geojsonData.geometry));

            const geomType = geojsonData.geometry.type.toLowerCase();
            if (geomType.includes('point')) {
                graphicsByType.point.push(graphic);
            } else if (geomType.includes('line')) {
                graphicsByType.line.push(graphic);
            } else if (geomType.includes('polygon')) {
                graphicsByType.polygon.push(graphic);
            }
        }
    }

    // Create layers for each geometry type that has features
    console.log("Jut before Graphics Layer Conditionals")
    const createdLayers = [];
    const layerIds = [];
    const baseFileName = fileName.replace(/\.(geojson|json)$/i, '');

    if (graphicsByType.point.length > 0) {
        const pointLayer = new GraphicsLayer({
            title: `${baseFileName} - Points`,
            listMode: 'show',
            renderer: pointRenderer,
            legendEnabled: true
        });
        pointLayer.addMany(graphicsByType.point);
        view.map.add(pointLayer);
        createdLayers.push(pointLayer);
        console.log(pointLayer)

        const layerId = `layer-${Date.now()}-points`;
        layerIds.push(layerId);
        loadedLayers.set(layerId, {
            layer: pointLayer,
            fileName: `${baseFileName} - Points`,
            parentGroup: baseFileName
        });
    }

    if (graphicsByType.line.length > 0) {
        const lineLayer = new GraphicsLayer({
            title: `${baseFileName} - Lines`,
            listMode: 'show',
            renderer: lineRenderer,
            legendEnabled: true
        });
        lineLayer.addMany(graphicsByType.line);
        view.map.add(lineLayer);
        createdLayers.push(lineLayer);

        const layerId = `layer-${Date.now()}-lines`;
        layerIds.push(layerId);
        loadedLayers.set(layerId, {
            layer: lineLayer,
            fileName: `${baseFileName} - Lines`,
            parentGroup: baseFileName
        });
    }

    if (graphicsByType.polygon.length > 0) {
        const polygonLayer = new GraphicsLayer({
            title: `${baseFileName} - Polygons`,
            listMode: 'show',
            renderer: polygonRenderer,
            legendEnabled: true
        });
        polygonLayer.addMany(graphicsByType.polygon);
        console.log(polygonLayer.renderer);
        view.map.add(polygonLayer);
        createdLayers.push(polygonLayer);

        const layerId = `layer-${Date.now()}-polygons`;
        layerIds.push(layerId);
        loadedLayers.set(layerId, {
            layer: polygonLayer,
            fileName: `${baseFileName} - Polygons`,
            parentGroup: baseFileName
        });
    }


    updateLayerList();
/*    updateLegend();*/

    // Zoom to the extent of all loaded data
    if (allCoordinates.length > 0) {
        if (allCoordinates.length === 1) {
            // Single point
            const [lon, lat] = allCoordinates[0];
            await view.goTo({
                center: [lon, lat],
                zoom: 15,
                duration: 1000
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

    return { layers: createdLayers, layerIds };
}

// Update the updateLayerList function to handle grouped layers

function updateLayerList() {
    if (loadedLayers.size === 0) {
        layerListEl.innerHTML = '<p style="font-size: 0.8rem; color: #999;">No layers loaded</p>';
        return;
    }

    // Group layers by parent group
    const groupedLayers = new Map();
    loadedLayers.forEach((data, layerId) => {
        const group = data.parentGroup || data.fileName;
        if (!groupedLayers.has(group)) {
            groupedLayers.set(group, []);
        }
        groupedLayers.get(group).push({ layerId, ...data });
    });

    layerListEl.innerHTML = '';

    groupedLayers.forEach((layers, groupName) => {
        if (layers.length === 1 && !layers[0].parentGroup) {
            // Single layer, not part of a group
            const layer = layers[0];
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
        <span>${layer.fileName}</span>
        <button onclick="window.removeLayer('${layer.layerId}')">Remove</button>
      `;
            layerListEl.appendChild(layerItem);
        } else {
            // Multiple layers in a group
            const groupHeader = document.createElement('div');
            groupHeader.style.cssText = 'font-weight: 600; margin-top: 0.5rem; padding: 0.5rem; background: #f0f0f0; border-radius: 0.25rem; display: flex; justify-content: space-between; align-items: center;';
            groupHeader.innerHTML = `
        <span>${groupName}</span>
        <button style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; margin: 0;" onclick="window.removeLayerGroup('${groupName}')">Remove All</button>
      `;
            layerListEl.appendChild(groupHeader);

            layers.forEach(layer => {
                const layerItem = document.createElement('div');
                layerItem.className = 'layer-item';
                layerItem.style.marginLeft = '1rem';
                layerItem.innerHTML = `
          <span style="font-size: 0.8rem;">${layer.fileName}</span>
          <button onclick="window.removeLayer('${layer.layerId}')">Remove</button>
        `;
                layerListEl.appendChild(layerItem);
            });
        }
    });
    console.log('=== Current Map Layers ===');
    mapEl.view.map.layers.forEach(l => console.log(l.title, l.type));
}

// Update removeLayer to handle parent groups
window.removeLayer = function(layerId) {
    const data = loadedLayers.get(layerId);
    if (data) {
        mapEl.view.map.remove(data.layer);
        loadedLayers.delete(layerId);
        updateLayerList();
        /*updateLegend();*/
        showNotification(`Removed ${data.fileName}`, 'success');
    }
};

// Add new function to remove all layers in a group
window.removeLayerGroup = function(groupName) {
    const layersToRemove = [];
    loadedLayers.forEach((data, layerId) => {
        if (data.parentGroup === groupName) {
            layersToRemove.push(layerId);
        }
    });

    layersToRemove.forEach(layerId => {
        const data = loadedLayers.get(layerId);
        if (data) {
            mapEl.view.map.remove(data.layer);
            loadedLayers.delete(layerId);
        }
    });

    updateLayerList();
    /*updateLegend();*/
    showNotification(`Removed all layers from ${groupName}`, 'success');

};
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

const pointRenderer = new SimpleRenderer({
    symbol: {
        type: 'simple-marker',
        color: [51, 51, 204, 0.7],
        size: 8,
        outline: {
            color: [255, 255, 255],
            width: 1
        }
    }
});

const lineRenderer = new SimpleRenderer({
    symbol: {
        type: 'simple-line',
        color: [51, 51, 204, 0.8],
        width: 2
    }
});

const polygonRenderer = new SimpleRenderer({
    symbol: {
        type: 'simple-fill',
        color: [51, 51, 204, 1.0],
        outline: {
            color: [0, 255, 255, 0.8],
            width: 2
        }
    }
});

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
            return {
                type: 'simple-fill',
                color: [255, 0, 0, 0.3],
                outline: {
                    color: [51, 51, 204, 0.8],
                    width: 2
                }
            };
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

//Not implemented - graphic layer not working...
function updateLegend() {
    if (!legendWidget) return;

    const view = mapEl.view;

    // Get all GraphicsLayers
    const layerInfos = [];

    view.map.layers.forEach(layer => {
        if (layer.type === 'graphics' && layer.title && layer.visible) {
            layerInfos.push({
                layer: layer,
                title: layer.title
            });
        }
    });

    console.log(layerInfos);
    // Update legend with layer infos
    if (layerInfos.length > 0) {
        legendWidget.layerInfos = layerInfos;
        console.log('Legend updated with', layerInfos.length, 'graphics layers');
    } else {
        // Reset to auto if no graphics layers
        legendWidget.layerInfos = null;
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
/*function updateBounds(bounds, geometry) {
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
}*/

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Start the app
init().then( r => {
});