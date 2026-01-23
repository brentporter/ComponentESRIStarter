import Graphic from 'https://js.arcgis.com/4.30/@arcgis/core/Graphic.js';
import FeatureLayer from 'https://js.arcgis.com/4.30/@arcgis/core/layers/FeatureLayer.js';
import SimpleRenderer from 'https://js.arcgis.com/4.30/@arcgis/core/renderers/SimpleRenderer.js';
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
    setupEventListeners();
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
            await view.goTo({
                center: [parseFloat(lon), parseFloat(lat)],
                zoom: parseInt(zoom),
                duration: 1000
            });
        } catch (error) {
            console.error('Error navigating to location:', error);
            showNotification('Failed to navigate to location', 'error');
        }
    }

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

// Load GeoJSON data onto the map using FeatureLayer
async function loadGeoJSON(geojsonData, fileName) {
    const view = mapEl.view;

    const featuresByType = {
        point: [],
        line: [],
        polygon: []
    };

    let allCoordinates = [];
    let allProperties = [];
    let objectIdCounter = 1;

    // Process GeoJSON features and categorize by geometry type
    if (geojsonData.type === 'FeatureCollection') {
        geojsonData.features.forEach((feature) => {
            if (feature.properties && Object.keys(feature.properties).length > 0) {
                allProperties.push(feature.properties);
            }

            const graphic = createGraphicFromGeoJSON(feature, objectIdCounter++);
            if (graphic) {
                const coords = extractCoordinates(feature.geometry);
                allCoordinates.push(...coords);

                const geomType = feature.geometry.type.toLowerCase();
                if (geomType.includes('point')) {
                    featuresByType.point.push(graphic);
                } else if (geomType.includes('line')) {
                    featuresByType.line.push(graphic);
                } else if (geomType.includes('polygon')) {
                    featuresByType.polygon.push(graphic);
                }
            }
        });
    } else if (geojsonData.type === 'Feature') {
        if (geojsonData.properties && Object.keys(geojsonData.properties).length > 0) {
            allProperties.push(geojsonData.properties);
        }

        const graphic = createGraphicFromGeoJSON(geojsonData, objectIdCounter++);
        if (graphic) {
            allCoordinates.push(...extractCoordinates(geojsonData.geometry));

            const geomType = geojsonData.geometry.type.toLowerCase();
            if (geomType.includes('point')) {
                featuresByType.point.push(graphic);
            } else if (geomType.includes('line')) {
                featuresByType.line.push(graphic);
            } else if (geomType.includes('polygon')) {
                featuresByType.polygon.push(graphic);
            }
        }
    }

    const fields = createFieldsFromProperties(allProperties);

    const createdLayers = [];
    const layerIds = [];
    const baseFileName = fileName.replace(/\.(geojson|json)$/i, '');

    // Create FeatureLayers for each geometry type that has features
    if (featuresByType.point.length > 0) {
        const pointLayer = new FeatureLayer({
            source: featuresByType.point,
            title: `${baseFileName} - Points`,
            renderer: pointRenderer,
            objectIdField: "ObjectID",
            geometryType: "point",
            fields: fields,
            outFields: ['*'],
            popupTemplate: {
                title: baseFileName,
                content: createPopupContent
            }
        });

        view.map.add(pointLayer);
        createdLayers.push(pointLayer);

        const layerId = `layer-${Date.now()}-points`;
        layerIds.push(layerId);
        loadedLayers.set(layerId, {
            layer: pointLayer,
            fileName: `${baseFileName} - Points`,
            parentGroup: baseFileName
        });
    }

    if (featuresByType.line.length > 0) {
        const lineLayer = new FeatureLayer({
            source: featuresByType.line,
            title: `${baseFileName} - Lines`,
            renderer: lineRenderer,
            objectIdField: "ObjectID",
            geometryType: "polyline",
            fields: fields,
            outFields: ['*'],
            popupTemplate: {
                title: baseFileName,
                content: createPopupContent
            }
        });

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

    if (featuresByType.polygon.length > 0) {
        const polygonLayer = new FeatureLayer({
            source: featuresByType.polygon,
            title: `${baseFileName} - Polygons`,
            renderer: polygonRenderer,
            objectIdField: "ObjectID",
            geometryType: "polygon",
            fields: fields,
            outFields: ['*'],
            popupTemplate: {
                title: baseFileName,
                content: createPopupContent
            }
        });

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

    // Zoom to the extent of all loaded data
    if (allCoordinates.length > 0) {
        if (allCoordinates.length === 1) {
            const [lon, lat] = allCoordinates[0];
            await view.goTo({
                center: [lon, lat],
                zoom: 15,
                duration: 1000
            });
        } else {
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

function updateLayerList() {
    if (loadedLayers.size === 0) {
        layerListEl.innerHTML = '<p style="font-size: 0.8rem; color: #999;">No layers loaded</p>';
        return;
    }

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
            const layer = layers[0];
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <span>${layer.fileName}</span>
                <button onclick="window.removeLayer('${layer.layerId}')">Remove</button>
            `;
            layerListEl.appendChild(layerItem);
        } else {
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
}

window.removeLayer = function(layerId) {
    const data = loadedLayers.get(layerId);
    if (data) {
        mapEl.view.map.remove(data.layer);
        loadedLayers.delete(layerId);
        updateLayerList();
        showNotification(`Removed ${data.fileName}`, 'success');
    }
};

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
    showNotification(`Removed all layers from ${groupName}`, 'success');
};

function extractCoordinates(geometry) {
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

    return coords;
}

function calculateExtent(coordinates) {
    const lons = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

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

function createGraphicFromGeoJSON(feature, objectId) {
    const geometry = convertGeoJSONGeometry(feature.geometry);
    if (!geometry) return null;

    const symbol = getSymbolForGeometry(feature.geometry.type);

    const attributes = {
        ObjectID: objectId,
        ...feature.properties
    };

    return new Graphic({
        geometry: geometry,
        symbol: symbol,
        attributes: attributes
    });
}

function convertGeoJSONGeometry(geojsonGeom) {
    switch (geojsonGeom.type) {
        case 'Point':
            return {
                type: 'point',
                longitude: geojsonGeom.coordinates[0],
                latitude: geojsonGeom.coordinates[1],
                spatialReference: { wkid: 4326 }
            };
        case 'LineString':
            return {
                type: 'polyline',
                paths: [geojsonGeom.coordinates],
                spatialReference: { wkid: 4326 }
            };
        case 'Polygon':
            return {
                type: 'polygon',
                rings: geojsonGeom.coordinates,
                spatialReference: { wkid: 4326 }
            };
        case 'MultiPoint':
            return {
                type: 'multipoint',
                points: geojsonGeom.coordinates,
                spatialReference: { wkid: 4326 }
            };
        case 'MultiLineString':
            return {
                type: 'polyline',
                paths: geojsonGeom.coordinates,
                spatialReference: { wkid: 4326 }
            };
        case 'MultiPolygon':
            return {
                type: 'polygon',
                rings: geojsonGeom.coordinates.flat(),
                spatialReference: { wkid: 4326 }
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
        size: 10,
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
        width: 3
    }
});

const polygonRenderer = new SimpleRenderer({
    symbol: {
        type: 'simple-fill',
        color: [51, 51, 204, 0.4],
        outline: {
            color: [0, 255, 255, 0.8],
            width: 2
        }
    }
});

function getSymbolForGeometry(geomType) {
    switch (geomType) {
        case 'Point':
        case 'MultiPoint':
            return {
                type: 'simple-marker',
                color: [51, 51, 204, 0.7],
                size: 10,
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
                width: 3
            };
        case 'Polygon':
        case 'MultiPolygon':
            return {
                type: 'simple-fill',
                color: [51, 51, 204, 0.4],
                outline: {
                    color: [0, 255, 255, 0.8],
                    width: 2
                }
            };
        default:
            return null;
    }
}

function createPopupContent(feature) {
    const attributes = feature.graphic.attributes;

    if (!attributes) {
        return 'No attributes object found';
    }

    const keys = Object.keys(attributes).filter(key => key !== 'ObjectID');

    if (keys.length === 0) {
        return 'No properties available';
    }

    const content = keys
        .map(key => `<b>${key}:</b> ${attributes[key]}`)
        .join('<br>');

    return content;
}

function createFieldsFromProperties(propertiesArray) {
    const fields = [{
        name: "ObjectID",
        alias: "ObjectID",
        type: "oid"
    }];

    if (propertiesArray.length > 0) {
        const allKeys = new Set();

        propertiesArray.forEach(props => {
            Object.keys(props).forEach(key => allKeys.add(key));
        });

        allKeys.forEach(key => {
            let fieldType = 'string';

            for (const props of propertiesArray) {
                if (props.hasOwnProperty(key) && props[key] != null) {
                    const value = props[key];
                    if (typeof value === 'number') {
                        fieldType = Number.isInteger(value) ? 'integer' : 'double';
                        break;
                    } else if (typeof value === 'boolean') {
                        fieldType = 'string';
                        break;
                    }
                    break;
                }
            }

            fields.push({
                name: key,
                alias: key,
                type: fieldType
            });
        });
    }

    return fields;
}

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

init().then(r => {});