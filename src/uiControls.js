// uiControls.js
import { resetMarkers, markers } from './mapSetup.js';
import { populationNames } from './gameService.js';
import { startNewRound} from './gameLogic.js';
import { getHasGuessed, setHasGuessed, resetStateForNewRound, totalScore, resetTotalScore } from './state.js';

let mode = null; // 'practice' or 'compete'
let competeRound = 0;
let competeScore = 0;


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
    const color = getColorByDistance(entry.distance);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${i + 1}. ${entry.name}</td>
      <td style="color:${color}">${entry.distance.toFixed(4)}</td>
    `;
    table.appendChild(row);

    if (i < 5 && markers[entry.name]) {
      const radius = [10, 9, 8, 7, 6][i];
      markers[entry.name].setStyle({
        fillColor: "lime",
        radius: radius
      });
      markers[entry.name].getElement()?.classList.add("blink");
    }
  });


  const guessColor = getColorByDistance(result.distance);
  const guessRow = document.createElement("tr");
  guessRow.innerHTML = `
    <td><strong>${result.rank}. ${result.guess}</strong>  (${result.score} points!)</td>
    <td style="color:${guessColor}"><strong>${result.distance?.toFixed(4) ?? '?'}</strong></td>
  `;
  table.appendChild(guessRow);


  document.getElementById("resultBox").style.display = "block";

  if (mode === 'compete') {
    competeScore += result.score;
    document.getElementById("score").textContent = competeScore;

    if (competeRound === 10) {
      // Immediately end game and show final popup
      showFinalPopup(competeScore);
      mode = null;
      competeRound = 0;
      competeScore = 0;
      unfreezeRoundSettings();
      document.getElementById("modeButtons").style.display = "block";
      document.getElementById("competeControls").style.display = "none";
    } else {
      document.getElementById("nextRoundBtn").disabled = false;
    }
  }


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

function freezeRoundSettings() {
  document.getElementById("regionSelect").disabled = true;
  document.querySelectorAll("#customRegions input[type=checkbox]").forEach(cb => {
    cb.disabled = true;
  });
}

function unfreezeRoundSettings() {
  document.getElementById("regionSelect").disabled = false;
  document.querySelectorAll("#customRegions input[type=checkbox]").forEach(cb => {
    cb.disabled = false;
  });
}

export function setupModeButtons() {
  const practiceBtn = document.getElementById("practiceBtn");
  const competeBtn = document.getElementById("competeBtn");
  const nextRoundBtn = document.getElementById("nextRoundBtn");
  const quitBtn = document.getElementById("quitBtn");

  practiceBtn?.addEventListener("click", () => {
    mode = "practice";
    unfreezeRoundSettings();
    document.getElementById("modeButtons").style.display = "block";
    document.getElementById("competeControls").style.display = "none";
    resetStateForNewRound();
    resetUIForNewRound();
    document.getElementById("score").textContent = totalScore;
    startNewRound();
  });

  competeBtn?.addEventListener("click", () => {
    mode = "compete";
    competeRound = 1;
    competeScore = 0;
    setHasGuessed(false);
    freezeRoundSettings();
    document.getElementById("modeButtons").style.display = "none";
    document.getElementById("competeControls").style.display = "block";
    document.getElementById("roundCounter").textContent = `Round: ${competeRound} / 10`;
    resetStateForNewRound();
    resetUIForNewRound();
    document.getElementById("score").textContent = "0";
    document.getElementById("nextRoundBtn").disabled = true;
    startNewRound();
  });

  nextRoundBtn?.addEventListener("click", () => {
    if (!getHasGuessed()) return;

    competeRound++;
    if (competeRound > 10) {
      showFinalPopup(competeScore); // ← Add this line
      mode = null;
      competeRound = 0;
      competeScore = 0;
      resetTotalScore();
      document.getElementById("score").textContent = "0";
      document.getElementById("modeButtons").style.display = "block";
      document.getElementById("competeControls").style.display = "none";
      unfreezeRoundSettings();
    } else {
      setHasGuessed(false);
      resetStateForNewRound();
      resetUIForNewRound();
      document.getElementById("roundCounter").textContent = `Round: ${competeRound} / 10`;
      document.getElementById("nextRoundBtn").disabled = true;
      startNewRound();
    }
  });

  quitBtn?.addEventListener("click", () => {
    mode = null;
    competeRound = 0;
    competeScore = 0;
    resetTotalScore();
    document.getElementById("score").textContent = "0";
    document.getElementById("modeButtons").style.display = "block";
    document.getElementById("competeControls").style.display = "none";
    unfreezeRoundSettings();
  });
}

function getModeNameByValue(val) {
  const modes = {
    "1": "Single",
    "2": "Multiple",
    "3": "Majority",
    "4": "Global",
    "5": "Random",
    "6": "Custom"
  };
  return modes[val] || "Unknown";
}

function getSelectedCustomRegions() {
  return Array.from(document.querySelectorAll("#customRegions input[type=checkbox]:checked"))
    .map(cb => ({
      name: cb.value,
      color: cb.style.color || "black"
    }));
}

function showFinalPopup(score) {
  const modeValue = document.getElementById("regionSelect").value;
  const modeName = getModeNameByValue(modeValue);
  const popup = document.getElementById("finalResultPopup");
  const text = document.getElementById("finalResultText");
  const subtext = document.getElementById("finalResultSubtext");

  text.innerText = `You scored ${score} points!`;

  if (modeValue === "6") {
    const selected = getSelectedCustomRegions();
    if (selected.length === 0) {
      subtext.innerText = "(No custom regions selected)";
    } else {
      subtext.innerHTML = selected.map(r =>
        `<span style="color:${r.color}; font-weight:bold;">${r.name}</span>`
      ).join(" ");
    }
  } else {
    subtext.innerText = `${modeName} Mode`;
  }

  popup.style.display = "block";
}

function getColorByDistance(d) {
  if (d < 1) return "lime";
  if (d < 3) return "green";
  if (d < 5) return "orange";
  if (d < 6) return "red";
  return "darkblue";
}
