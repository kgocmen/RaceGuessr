// mapSetup.js
export let populationLayer;
export let markers = {};

const regionColors = {
  "European": "blue",
  "SSA": "darkgreen",
  "EASEA": "orange",
  "Siberian": "cyan",
  "American": "purple",
  "SAO": "magenta",
  "MENA": "brown",
  "WACA": "red",
  "default": "gray"
};

export function initializeMap() {
  const map = L.map('map').setView([30, 20], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  fetch('ne_110m_land.geojson')
    .then(res => res.json())
    .then(data => {
      L.geoJSON(data, {
        style: { color: '#999', weight: 1, fillColor: '#ddd', fillOpacity: 0.6 }
      }).addTo(map);
    });

  fetch('illu_modern_points.geojson')
    .then(res => res.json())
    .then(data => {
      populationLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          const region = feature.properties.Region || "default";
          const marker = L.circleMarker(latlng, {
            radius: 5,
            fillColor: regionColors[region] || regionColors.default,
            color: '#000', weight: 1, opacity: 1, fillOpacity: 0.9
          });
          markers[feature.properties.Population] = marker;
          return marker;
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.Population;
          const region = feature.properties.Region;
          layer.bindTooltip(`<strong>${name}</strong><br>Region: ${region}`);
          layer.on('click', () => {
            if (typeof window.submitGuess === "function") {
              window.submitGuess(name);
          }});
        }
      }).addTo(map);
    });
}

export function resetMarkers() {
  Object.keys(markers).forEach(k => {
    markers[k].setStyle({
      radius: 5,
      fillColor: regionColors[markers[k].feature?.properties.Region] || regionColors.default
    });
    const el = markers[k].getElement();
    if (el) el.classList.remove("blink");
  });
}