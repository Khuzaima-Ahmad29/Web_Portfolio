// ==========================================
// CREATE MAP
// ==========================================

var map = L.map('map').setView([30.3753, 69.3451], 5);

L.control.scale().addTo(map);


// ==========================================
// BASE MAPS
// ==========================================

// OpenStreetMap
var osm = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
);

// Satellite Imagery
var satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles &copy; Esri'
    }
);

// OpenStreetMap as default
osm.addTo(map);


// ==========================================
// HELPER: LOAD A GEOJSON FILE INTO A LAYER
// ==========================================

function loadData(url, layer, addToMap) {

    fetch(url)

        .then(function(response) {

            if (!response.ok) {
                throw new Error(url + " could not be loaded. Status: " + response.status);
            }

            return response.json();

        })

        .then(function(data) {

            layer.addData(data);

            if (addToMap) {
                layer.addTo(map);
            }

            console.log(url + " loaded successfully!");

        })

        .catch(function(error) {

            console.error("DATA ERROR:", error);

        });

}


// ==========================================
// HELPER: POPUP TITLE
// ==========================================

function title(text) {
    return '<div class="popup-title">' + text + '</div>';
}


// ==========================================
// TEMPERATURE LAYER
// ==========================================

var temperatureLayer = L.geoJSON(null, {

    pointToLayer: function(feature, latlng) {

        var temp = Number(feature.properties.temp);
        var radius;

        // Lower temperature = smaller
        if (temp < 20) { radius = 6; }

        // Medium temperature = medium
        else if (temp < 30) { radius = 10; }

        // Higher temperature = larger
        else { radius = 15; }

        return L.circleMarker(latlng, {
            radius: radius,
            color: "black",
            fillColor: "purple",
            weight: 2,
            fillOpacity: 0.8
        });

    },

    onEachFeature: function(feature, layer) {

        layer.bindPopup(
            title("Weather Station: " + feature.properties.station) +
            "<b>Station Name:</b> " + feature.properties.station +
            "<br><b>Temperature:</b> " + feature.properties.temp + " °C" +
            "<br><b>Rainfall:</b> " + feature.properties.rainfall + " mm"
        );

    }

});


// ==========================================
// RAINFALL LAYER
// ==========================================

var rainfallLayer = L.geoJSON(null, {

    pointToLayer: function(feature, latlng) {

        var rainfall = Number(feature.properties.rainfall);
        var radius;

        // Lower rainfall = smaller
        if (rainfall < 10) { radius = 6; }

        // Medium rainfall = medium
        else if (rainfall < 20) { radius = 10; }

        // Higher rainfall = larger
        else { radius = 15; }

        return L.circleMarker(latlng, {
            radius: radius,
            color: "black",
            fillColor: "blue",
            weight: 2,
            fillOpacity: 0.8
        });

    },

    onEachFeature: function(feature, layer) {

        layer.bindPopup(
            title("Weather Station: " + feature.properties.station) +
            "<b>Station Name:</b> " + feature.properties.station +
            "<br><b>Rainfall:</b> " + feature.properties.rainfall + " mm" +
            "<br><b>Temperature:</b> " + feature.properties.temp + " °C"
        );

    }

});


// ==========================================
// LOAD WEATHER DATA
// ==========================================

// Same weather data goes to both layers.
// Temperature is shown by default, Rainfall is off.
loadData('data/weather_station.geojson', temperatureLayer, true);
loadData('data/weather_station.geojson', rainfallLayer, false);


// ==========================================
// MAJOR CITIES (custom marker symbols)
// ==========================================

var citiesLayer = L.geoJSON(null, {

    pointToLayer: function(feature, latlng) {

        var isCapital = feature.properties.type === "Capital City";

        // Capital = red star, other cities = green dot with a dot symbol
        var icon = L.divIcon({
            className: "",
            html: '<div class="city-marker' + (isCapital ? ' capital' : '') + '">' +
                  (isCapital ? '&#9733;' : '&#9679;') + '</div>',
            iconSize: isCapital ? [28, 28] : [22, 22],
            iconAnchor: isCapital ? [14, 14] : [11, 11],
            popupAnchor: [0, -12]
        });

        return L.marker(latlng, { icon: icon });

    },

    onEachFeature: function(feature, layer) {

        layer.bindPopup(
            title("City: " + feature.properties.name) +
            "<b>Name:</b> " + feature.properties.name +
            "<br><b>Province:</b> " + feature.properties.province +
            "<br><b>Type:</b> " + feature.properties.type
        );

    }

});

loadData('data/cities.geojson', citiesLayer, true);


// ==========================================
// LAYER CONTROL (turn layers on/off)
// ==========================================

var baseMaps = {
    "OpenStreetMap": osm,
    "Satellite Imagery": satellite
};

var overlayMaps = {
    "Major Cities": citiesLayer,
    "Temperature": temperatureLayer,
    "Rainfall": rainfallLayer
};

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);


// ==========================================
// MAP LEGEND (shows only the active layers)
// ==========================================

var legend = L.control({ position: "bottomleft" });

legend.onAdd = function(map) {

    this._div = L.DomUtil.create("div", "info legend");
    this.update();
    return this._div;

};

legend.update = function() {

    var html = "<h4>Map Legend</h4>";
    var any = false;

    // Cities
    if (map.hasLayer(citiesLayer)) {
        html += "<b>Cities</b><br>";
        html += '<i style="background:#c62828;"></i> Capital City<br>';
        html += '<i style="background:#0b6b35;"></i> Other Cities<br>';
        any = true;
    }

    // Temperature
    if (map.hasLayer(temperatureLayer)) {
        html += (any ? "<hr>" : "") + "<b>Temperature</b><br>";
        html += '<i style="background:purple; width:10px; height:10px;"></i> &lt; 20°C (Small)<br>';
        html += '<i style="background:purple; width:16px; height:16px;"></i> 20–29°C (Medium)<br>';
        html += '<i style="background:purple; width:22px; height:22px;"></i> ≥ 30°C (Large)<br>';
        any = true;
    }

    // Rainfall
    if (map.hasLayer(rainfallLayer)) {
        html += (any ? "<hr>" : "") + "<b>Rainfall</b><br>";
        html += '<i style="background:blue; width:10px; height:10px;"></i> &lt; 10 mm (Small)<br>';
        html += '<i style="background:blue; width:16px; height:16px;"></i> 10–19 mm (Medium)<br>';
        html += '<i style="background:blue; width:22px; height:22px;"></i> ≥ 20 mm (Large)<br>';
        any = true;
    }

    if (!any) {
        html += "No layers selected";
    }

    this._div.innerHTML = html;

};

legend.addTo(map);

// Update the legend whenever a layer is turned on or off
map.on("overlayadd overlayremove", function() {
    legend.update();
});
