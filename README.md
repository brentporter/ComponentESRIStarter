# Interactive Map Viewer

A modern web mapping application built with the ArcGIS Maps SDK for JavaScript using the component-based approach. This application provides an intuitive interface for visualizing geographic data, uploading custom GeoJSON files, and interacting with multiple basemap styles.

## Features

### Interactive Mapping
- Responsive, full-screen map interface
- Smooth pan and zoom controls
- Multiple basemap styles (Topographic, Streets, Satellite, Hybrid, Dark Gray, Light Gray, Streets Night Vector, and Oceans)
- Built-in search functionality to find locations worldwide
- Interactive legend showing layer symbology

### GeoJSON Support
- Upload and visualize custom GeoJSON files
- Automatic geometry type detection and styling
- Dynamic field schema detection - works with any GeoJSON structure
- Support for all GeoJSON geometry types:
    - Point & MultiPoint
    - LineString & MultiLineString
    - Polygon & MultiPolygon
- Interactive popups displaying all feature properties
- Auto-zoom to fit uploaded data on the map
- Layers organized by geometry type (Points, Lines, Polygons displayed separately)

### Layer Management
- Track all loaded GeoJSON layers
- Remove individual layers or entire layer groups
- Visual layer list with hierarchical organization
- Legend component displays symbology for all active layers

### Quick Navigation
- Pre-configured locations for major cities:
    - Austin
    - Houston
    - Los Angeles
    - New York City
    - London
    - Paris
    - Tokyo
    - Sydney
- Add custom markers at the map center with coordinate display
- Remove all markers with a single click

### Modern UI/UX
- Clean, gradient-based design
- Responsive controls panel
- Real-time notifications for user actions
- Loading indicators for async operations
- Organized layer groups for multi-geometry GeoJSON files

## Technology Stack

- **ArcGIS Maps SDK for JavaScript 4.30** - Core mapping functionality
- **ArcGIS Map Components** - Web component-based architecture for map and widgets
- **ES6 Modules** - Modern JavaScript with import/export
- **FeatureLayer** - Client-side feature layers for GeoJSON data (not GraphicsLayers)
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with animations and gradients

## Project Structure

```
project/
├── esriTemplateJSON.html # Main HTML structure and UI with GeoJSON file functionality
├── esriStarter.html      # All-in-one version with no GeoJSON file support
├── app.js                # Application logic and event handlers
└── README.md             # Project documentation
```

### File Breakdown

#### esriTemplateJSON.html
Contains:
- Page structure and layout
- Control panel UI elements
- Map component declaration with widgets (zoom, search, legend)
- Import map configuration for ArcGIS modules
- File upload interface for GeoJSON files
- CSS styling for all components

#### esriStarter.html
Contains:
- Page structure and layout
- Control panel UI elements
- Map component declaration with widgets
- Import map configuration for ArcGIS modules
- CSS styling for all components

#### app.js
Modular JavaScript file containing:
- **Initialization**: Map setup and event listener registration
- **Event Handlers**: Basemap changes, location navigation, marker placement
- **GeoJSON Processing**: File upload, parsing, and conversion to ArcGIS features
- **Layer Management**: Creating FeatureLayers, tracking, and removing layers
- **Field Schema Detection**: Automatic field type detection from GeoJSON properties
- **Geometry Conversion**: Transform GeoJSON geometries to ArcGIS format with proper spatial reference
- **Symbolization**: Automatic styling based on geometry type using SimpleRenderer
- **UI Updates**: Notifications, layer list management with grouping

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for ES6 modules)

### Installation

1. Clone or download the project files to your local machine

2. Start a local web server in the project directory using Python:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Or using Node.js:

```bash
npx http-server -p 8000
```

Or using VS Code Live Server extension:
- Right-click on `esriTemplateJSON.html`
- Select "Open with Live Server"

3. Open your browser and navigate to `http://localhost:8000/esriTemplateJSON.html`

### No Installation Required

Alternatively, you can deploy the files to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Azure Static Web Apps

## Usage Guide

### Changing Basemaps

1. Locate the **Basemap Style** dropdown in the control panel
2. Select from 8 different basemap styles
3. The map updates instantly

### Navigating to Locations

**Option 1: Quick Locations**
1. Use the **Quick Locations** dropdown
2. Select a city from the list
3. The map automatically pans and zooms to that location with smooth animation

**Option 2: Search**
1. Click the search widget (top-right of map)
2. Enter an address, place name, or coordinates
3. Select from the search results

**Option 3: Manual Navigation**
- Click and drag to pan
- Scroll or use zoom controls to zoom in/out

### Uploading GeoJSON Files

1. Click the **Choose GeoJSON file** button
2. Select a `.geojson` or `.json` file from your computer
3. The application automatically:
    - Detects all property fields and their types
    - Separates features by geometry type
    - Creates separate layers for Points, Lines, and Polygons
    - Displays the data on the map with appropriate symbols
    - Zooms to fit all features
    - Updates the legend with layer symbology
4. Click any feature to see its properties in a popup

**Supported GeoJSON Structure:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-118.244, 34.052]
      },
      "properties": {
        "name": "Example Point",
        "city": "Los Angeles",
        "population": 4000000
      }
    }
  ]
}
```

**Important Notes:**
- The application works with any GeoJSON property schema - it automatically detects field names and types
- Properties can be strings, numbers (integers or decimals), or booleans
- If a GeoJSON file contains mixed geometry types, they are automatically separated into distinct layers
- Each geometry type (Points, Lines, Polygons) gets its own layer in the layer list and legend

### Managing Layers

- View all loaded layers in the **Loaded Layers** section
- Layers from the same file are grouped together
- Click **Remove** next to any individual layer to delete it
- Click **Remove All** to delete all layers from a file group
- The legend component (bottom-left) automatically updates to show active layers

### Adding Custom Markers

1. Pan the map to your desired location
2. Click the **Add Marker at Center** button
3. A marker appears at the current map center
4. Click the marker to see its coordinates in the popup
5. Use **Remove Markers** to clear all custom markers at once

## Architecture Details

### Component-Based Approach

This application uses ArcGIS Map Components, which provide:
- **Declarative syntax**: Custom elements like `<arcgis-map>` and `<arcgis-legend>`
- **Encapsulation**: Self-contained widgets and functionality
- **Easy integration**: No complex widget initialization code required
- **Reactive updates**: Properties automatically sync with the map

Example component usage:

```html
<arcgis-map basemap="streets-night-vector" center="-97.71,30.34" zoom="10">
  <arcgis-zoom position="top-left"></arcgis-zoom>
  <arcgis-search position="top-right"></arcgis-search>
  <arcgis-legend position="bottom-left"></arcgis-legend>
</arcgis-map>
```

### Module Import Strategy

The application uses an import map to resolve ArcGIS core modules:

```html
<script type="importmap">
  {
    "imports": {
      "@arcgis/core/": "https://js.arcgis.com/4.30/@arcgis/core/"
    }
  }
</script>
```

This allows importing modules using standard ES6 syntax:

```javascript
import Graphic from 'https://js.arcgis.com/4.30/@arcgis/core/Graphic.js';
import FeatureLayer from 'https://js.arcgis.com/4.30/@arcgis/core/layers/FeatureLayer.js';
```

### FeatureLayer Architecture

Unlike traditional approaches using GraphicsLayer, this application uses FeatureLayer with client-side sources for several advantages:

- **Legend Support**: FeatureLayers work seamlessly with the legend component
- **Better Performance**: Optimized rendering for large datasets
- **Query Capabilities**: Built-in support for attribute and spatial queries
- **Popup Templates**: Rich popup functionality with attribute access

Key FeatureLayer Configuration:

```javascript
const layer = new FeatureLayer({
  source: graphics,              // Array of Graphics
  objectIdField: "ObjectID",     // Required unique ID field
  geometryType: "point",         // Explicit geometry type
  fields: fields,                // Field schema definition
  outFields: ['*'],              // Critical: return all fields in queries/popups
  renderer: pointRenderer,       // Symbology
  popupTemplate: { ... }         // Popup configuration
});
```

**Important**: The `outFields: ['*']` property is essential. Without it, only the ObjectID field will be available in popups, even though other fields are defined in the schema.

### GeoJSON Conversion Process

1. **File Upload**: User selects a GeoJSON file
2. **Parsing**: File is read and parsed as JSON
3. **Property Collection**: All unique property fields are collected from features
4. **Field Schema Creation**: Field definitions are created with automatic type detection:
    - Numbers → integer or double
    - Strings → string
    - Booleans → string
5. **Feature Extraction**: Features are separated by geometry type
6. **Geometry Conversion**: GeoJSON coordinates are converted to ArcGIS format with WGS84 spatial reference
7. **Graphics Creation**: ArcGIS Graphics are created with attributes and symbols
8. **FeatureLayer Creation**: Separate FeatureLayers are created for each geometry type
9. **Map Update**: Layers are added to the map and view zooms to the combined extent
10. **Legend Update**: Legend component automatically displays new layers

### Dynamic Field Detection

The application automatically detects field types from GeoJSON properties:

```javascript
// Sample GeoJSON properties
{
  "city": "Austin",        // Detected as: string
  "population": 950000,    // Detected as: integer
  "area": 326.5,          // Detected as: double
  "capital": true         // Detected as: string (booleans stored as strings)
}
```

This means the application works with any GeoJSON file structure without modification.

### Styling Logic

**Points/MultiPoints:**
- Blue circular markers (10px)
- White outline (1px)
- 70% opacity

**Lines/MultiLineStrings:**
- Blue solid lines (3px width)
- 80% opacity

**Polygons/MultiPolygons:**
- Blue fill (40% opacity)
- Cyan outline (2px, 80% opacity)

All styling is defined using SimpleRenderer for consistency and legend support.

## Customization

### Adding New Basemaps

Edit the basemap dropdown in `esriTemplateJSON.html`:

```html
<option value="your-basemap-id">Your Basemap Name</option>
```

Available basemap IDs: https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html#basemap

### Changing Symbol Styles

Modify the renderer definitions in `app.js`:

```javascript
const pointRenderer = new SimpleRenderer({
    symbol: {
        type: 'simple-marker',
        color: [255, 0, 0, 0.7],  // Red color
        size: 12,                  // Larger markers
        outline: {
            color: [255, 255, 255],
            width: 2
        }
    }
});
```

### Adding More Map Components

Add components directly in `esriTemplateJSON.html`:

```html
<arcgis-map>
  <arcgis-zoom position="top-left"></arcgis-zoom>
  <arcgis-compass position="top-left"></arcgis-compass>
  <arcgis-scale-bar position="bottom-right"></arcgis-scale-bar>
  <arcgis-legend position="bottom-left"></arcgis-legend>
</arcgis-map>
```

Available components: https://developers.arcgis.com/javascript/latest/components/

### Customizing Popup Content

Modify the `createPopupContent()` function in `app.js` to change how feature attributes are displayed:

```javascript
function createPopupContent(feature) {
    const attributes = feature.graphic.attributes;
    // Custom formatting logic here
    return `<div class="custom-popup">...</div>`;
}
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

ES6 module support is required.

## Troubleshooting

### Map doesn't load
- Ensure you're running from a web server (not `file://`)
- Check browser console for errors
- Verify internet connection (CDN resources required)
- Confirm import map is defined before the app.js script

### GeoJSON won't upload
- Verify file is valid GeoJSON format using a validator
- Check that coordinates are in [longitude, latitude] order (not lat, lon)
- Ensure file size is reasonable (< 10MB recommended)
- Verify the GeoJSON has a `type: "FeatureCollection"` or `type: "Feature"`

### Popup shows "No properties available"
- This usually indicates missing `outFields: ['*']` in FeatureLayer configuration
- Verify that the GeoJSON features have a `properties` object
- Check browser console for attribute-related errors

### Legend doesn't show layers
- Ensure you're using FeatureLayer (not GraphicsLayer)
- Verify layers have a `renderer` defined
- Check that `legendEnabled: true` is set (default behavior)
- Confirm the legend component is properly declared in HTML

### Modules fail to load
- Clear browser cache
- Check that import map is defined before map components script
- Verify CDN URLs are accessible
- Ensure `<script type="module">` is used for app.js

## Known Limitations

- **Browser Storage**: localStorage and sessionStorage are not supported in Claude.ai artifacts but work in standard deployments
- **File Size**: Very large GeoJSON files (>50MB) may cause performance issues
- **Geometry Complexity**: Extremely complex polygons with thousands of vertices may render slowly
- **Mixed Collections**: While mixed geometry types are supported, they are separated into individual layers

## Resources

- [ArcGIS Maps SDK for JavaScript Documentation](https://developers.arcgis.com/javascript/latest/)
- [ArcGIS Map Components Guide](https://developers.arcgis.com/javascript/latest/components/)
- [FeatureLayer API Reference](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-FeatureLayer.html)
- [GeoJSON Specification](https://geojson.org/)
- [ArcGIS Developer Portal](https://developers.arcgis.com/)

## License

This project uses the ArcGIS Maps SDK for JavaScript which requires appropriate licensing for production use. See [Esri's licensing terms](https://developers.arcgis.com/terms/) for details.

## Future Enhancements

Potential improvements for this application:
- Add drawing tools for creating new features
- Implement feature editing capabilities
- Support for additional data formats (KML, Shapefile, CSV)
- Data export functionality
- Layer styling controls in the UI
- Authentication for accessing secure services
- Measurement tools (distance, area)
- Print/export map functionality
- Bookmarks for saving favorite views

## Support

For issues related to:
- **ArcGIS SDK**: Visit [Esri Community Forums](https://community.esri.com/)
- **GeoJSON Format**: See [GeoJSON specification](https://geojson.org/)
- **This Application**: Open an issue in the project repository

---

Built with ArcGIS Maps SDK for JavaScript 4.30