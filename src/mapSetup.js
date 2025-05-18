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
  const map = L.map('map', {
    center: [20, 0],
    zoom: 2.40,
    minZoom: 2.40,
    zoomSnap: 0.2,
    zoomDelta: 0.2,
    worldCopyJump: false,
    maxBoundsViscosity: 1.0,
    maxBounds: [
      [-90, -180],
      [90, 180]
    ]
  });




  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);


  fetch(`${import.meta.env.BASE_URL}illu_modern_points.geojson`)
    .then(res => res.json())
    .then(data => {
      populationLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          const region = feature.properties.Region || "default";
          const marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: regionColors[region] || regionColors.default,
            color: '#000', weight: 1, opacity: 1, fillOpacity: 0.9
          });
          markers[feature.properties.Population] = marker;
          return marker;
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.Population;
          const region = feature.properties.Region;
          layer.bindTooltip(
            `<strong>${name}</strong><br>Region: ${region}`,
            {
              direction: 'top',
              sticky: true,
              className: 'custom-tooltip'
            }
          );
          const triggerGuess = () => {
            if (typeof window.submitGuess === "function") {
              window.submitGuess(name);
            }
          };

          layer.on('click', triggerGuess);
          layer.on('touchend', (e) => {
            // Prevent duplicate firing on mobile devices
            e.originalEvent.preventDefault();
            triggerGuess();
          });
        }
      }).addTo(map);
    });
}

export function resetMarkers() {
  Object.keys(markers).forEach(k => {
    markers[k].setStyle({
      radius: 6,
      fillColor: regionColors[markers[k].feature?.properties.Region] || regionColors.default
    });
    const el = markers[k].getElement();
    if (el) el.classList.remove("blink");
  });
}