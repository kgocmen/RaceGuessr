// uiControls.js
import { resetMarkers, markers } from './mapSetup.js';
import { totalScore } from './state.js';
import { populationNames } from './gameService.js';

export function setupUIEvents() {
  document.getElementById("regionSelect").addEventListener("change", toggleCustomOptions);
}

export function toggleCustomOptions() {
  const selected = document.getElementById("regionSelect").value;
  document.getElementById("customRegions").style.display = selected === "6" ? "block" : "none";
}

export function resetUIForNewRound() {
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("submitBtn").style.display = "block";
  document.getElementById("submitBtn").disabled = false;
  document.getElementById("guessInput").disabled = false;
  document.getElementById("guessBox").style.display = "block";
  document.getElementById("guessInput").value = "";
  resetMarkers();
}

export function displayMixInfo(data, regionColors) {
  const descBox = document.getElementById("mixDescription");
  const mixLines = Object.entries(data.mix_description).map(([k, v]) => `${k}: ${Math.round(v * 100)}%`);

  if (data.regions && Array.isArray(data.regions)) {
    const coloredRegions = data.regions.map(region => {
      const color = regionColors[region] || regionColors.default;
      return `<span style="color:${color}; font-weight:500; font-size:0.8em;">${region}</span>`;
    });
    mixLines.unshift(`<em>${coloredRegions.join(' ')}</em>`);
  }

  descBox.innerHTML = mixLines.join("<br>");
}

export function updateResultsUI(result) {
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("submitBtn").disabled = true;
  document.getElementById("guessInput").disabled = true;

  document.getElementById("score").innerText = totalScore;
  const table = document.querySelector("#resultTable tbody");
  table.innerHTML = "";

  result.top10.forEach((entry, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i + 1}. ${entry.name}</td><td>${entry.distance.toFixed(4)}</td>`;
    table.appendChild(row);
    if (i < 3 && markers[entry.name]) {
      const radius = [9, 7, 5][i]; // size for 1st, 2nd, 3rd
      markers[entry.name].setStyle({
        fillColor: "lime",
        radius: radius
      });
      markers[entry.name].getElement()?.classList.add("blink");
    }


  });

  document.getElementById("resultMessage").innerHTML =
    `<div style="font-size: 0.8em;"><em>Your Guess:</em> ${result.rank}. ${result.guess} (${result.score} points!) ${result.distance?.toFixed(4) ?? '?'}</div>`;
  document.getElementById("resultBox").style.display = "block";
}

export function setupAutocomplete() {
  const datalist = document.getElementById("popSuggestions");
  datalist.innerHTML = ""; // clear existing options

  populationNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);
  });
}
