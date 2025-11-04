# Interactive Map Viewer

A modern web mapping application built with the ArcGIS Maps SDK for JavaScript using the component-based approach. This application provides an intuitive interface for visualizing geographic data, uploading custom GeoJSON files, and interacting with multiple basemap styles.

## Features

### 🗺️ **Interactive Mapping**
- Responsive, full-screen map interface
- Smooth pan and zoom controls
- Multiple basemap styles (Topographic, Streets, Satellite, Hybrid, and more)
- Built-in search functionality to find locations worldwide

### 📁 **GeoJSON Support**
- Upload and visualize custom GeoJSON files
- Automatic geometry type detection and styling
- Support for all GeoJSON geometry types:
    - Point & MultiPoint
    - LineString & MultiLineString
    - Polygon & MultiPolygon
- Interactive popups displaying feature properties
- Auto-zoom to fit uploaded data on the map

### 🎛️ **Layer Management**
- Track all loaded GeoJSON layers
- Toggle layer visibility
- Remove individual layers
- Visual layer list with controls

### 📍 **Quick Navigation**
- Pre-configured locations for major cities/areas:
  - Austin
  - Houston
  - Colorado
  - Los Angeles
  - New York City
  - London
  - Paris
  - Tokyo
  - Sydney
- Add custom markers at the map center with coordinate display

### 🎨 **Modern UI/UX**
- Clean, gradient-based design
- Responsive controls panel
- Real-time notifications for user actions
- Loading indicators for async operations

## Technology Stack

- **ArcGIS Maps SDK for JavaScript 4.30** - Core mapping functionality
- **ArcGIS Map Components** - Web component-based architecture
- **ES6 Modules** - Modern JavaScript with import/export
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with animations and gradients

## Project Structure

```
project/
├── esriTemplateJSON.html # Main HTML structure and UI with GeoJSON file functionality
├── esriStarter.html # All in one version with no GeoJSON file support
├── app.js              # Application logic and event handlers
└── README.md           # Project documentation
```

### File Breakdown

#### `esriTemplateJSON.html`
Contains:
- Page structure and layout
- Control panel UI elements
- Map component declaration with widgets
- Import map configuration for ArcGIS modules
- File Upload for GeoJSON files
- CSS styling for all components

#### `esriStarter.html`
Contains:
- Page structure and layout
- Control panel UI elements
- Map component declaration with widgets
- Import map configuration for ArcGIS modules
- CSS styling for all components

#### `app.js`
Modular JavaScript file containing:
- **Initialization**: Map setup and event listener registration
- **Event Handlers**: Basemap changes, location navigation, marker placement
- **GeoJSON Processing**: File upload, parsing, and conversion to ArcGIS graphics
- **Layer Management**: Adding, tracking, and removing layers
- **Geometry Conversion**: Transform GeoJSON geometries to ArcGIS format
- **Symbolization**: Automatic styling based on geometry type
- **UI Updates**: Notifications, layer list management

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for ES6 modules)

### Installation

1. **Clone or download** the project files to your local machine

2. **Start a local web server** in the project directory:

   Using Python:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   Using Node.js:
   ```bash
   npx http-server -p 8000
   ```

   Using VS Code Live Server extension:
    - Right-click on `index.html`
    - Select "Open with Live Server"

3. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

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
2. Select a major city
3. The map automatically pans and zooms to that location

**Option 2: Search**
1. Click the search widget (top-right of map)
2. Enter an address, place name, or coordinates
3. Select from the search results

**Option 3: Manual Navigation**
- Click and drag to pan
- Scroll or use zoom controls to zoom in/out

### Uploading GeoJSON Files

1. Click the **📁 Choose GeoJSON file** button
2. Select a `.geojson` or `.json` file from your computer
3. The data automatically loads and displays on the map
4. The map zooms to fit all features
5. Click any feature to see its properties in a popup

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
        "description": "Sample data"
      }
    }
  ]
}
```

### Managing Layers

- View all loaded layers in the **Loaded Layers** section
- Click **Remove** next to any layer to delete it from the map
- The legend widget (bottom-left) shows layer symbology

### Adding Custom Markers

1. Pan the map to your desired location
2. Click the **Add Marker at Center** button
3. A marker appears at the current map center
4. Click the marker to see its coordinates

## Architecture Details

### Component-Based Approach

This application uses ArcGIS Map Components, which provide:
- **Declarative syntax**: `<arcgis-map>` custom elements
- **Encapsulation**: Self-contained widgets and functionality
- **Easy integration**: No complex module loading
- **Reactive updates**: Properties automatically sync with the map

### Module Import Strategy

The application uses an **import map** to resolve ArcGIS core modules:

```html
<script type="importmap">
  {
    "imports": {
      "@arcgis/core/": "https://js.arcgis.com/4.30/@arcgis/core/"
    }
  }
</script>
```

This allows importing modules like:
```javascript
import Graphic from 'https://js.arcgis.com/4.30/@arcgis/core/Graphic.js';
```

### GeoJSON Conversion Process

1. **File Upload**: User selects a GeoJSON file
2. **Parsing**: File is read and parsed as JSON
3. **Feature Extraction**: Features are extracted from the FeatureCollection
4. **Geometry Conversion**: GeoJSON geometries are converted to ArcGIS format
5. **Symbolization**: Appropriate symbols are assigned based on geometry type
6. **Graphics Creation**: ArcGIS Graphics are created with popups
7. **Layer Addition**: Graphics are added to a GraphicsLayer
8. **Map Update**: Layer is added to the map and view zooms to extent

### Styling Logic

**Points/MultiPoints:**
- Blue circular markers (8px)
- White outline (1px)
- 70% opacity

**Lines/MultiLineStrings:**
- Blue solid lines (2px width)
- 80% opacity

**Polygons/MultiPolygons:**
- Blue fill (30% opacity)
- Blue outline (2px, 80% opacity)

## Customization

### Adding New Basemaps

Edit the basemap dropdown in `index.html`:
```html
<option value="your-basemap-id">Your Basemap Name</option>
```

Available basemap IDs: https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html#basemap

### Changing Symbol Styles

Modify the `getSymbolForGeometry()` function in `app.js`:
```javascript
return {
  type: 'simple-marker',
  color: [255, 0, 0, 0.7],  // Red color
  size: 12,                  // Larger markers
  // ... other properties
};
```

### Adding More Widgets

Add widgets directly in `index.html`:
```html
<arcgis-map>
  <arcgis-zoom position="top-left"></arcgis-zoom>
  <arcgis-compass position="top-left"></arcgis-compass>
  <arcgis-scale-bar position="bottom-right"></arcgis-scale-bar>
</arcgis-map>
```

Available widgets: https://developers.arcgis.com/javascript/latest/components/

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: ES6 module support is required

## Troubleshooting

### Map doesn't load
- Ensure you're running from a web server (not `file://`)
- Check browser console for errors
- Verify internet connection (CDN resources required)

### GeoJSON won't upload
- Verify file is valid GeoJSON format
- Check that coordinates are in longitude, latitude order
- Ensure file size is reasonable (< 5MB recommended)

### Modules fail to load
- Clear browser cache
- Check that import map is defined before component script
- Verify CDN URLs are accessible

## Resources

- [ArcGIS Maps SDK for JavaScript Documentation](https://developers.arcgis.com/javascript/latest/)
- [ArcGIS Map Components](https://developers.arcgis.com/javascript/latest/components/)
- [GeoJSON Specification](https://geojson.org/)
- [ArcGIS Developer Portal](https://developers.arcgis.com/)

## License

This project uses the ArcGIS Maps SDK for JavaScript which requires appropriate licensing for production use. See [Esri's licensing terms](https://developers.arcgis.com/terms/) for details.

## Contributing

Feel free to fork this project and customize it for your needs. Suggestions for improvements:
- Add drawing tools for creating features
- Implement feature editing capabilities
- Add support for other data formats (KML, Shapefile)
- Include data export functionality
- Add layer styling controls
- Implement authentication for secure services

## Support

For issues related to:
- **ArcGIS SDK**: Visit [Esri Community Forums](https://community.esri.com/)
- **GeoJSON**: See [GeoJSON specification](https://geojson.org/)
- **This Application**: Open an issue in the project repository

---
