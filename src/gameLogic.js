// gameLogic.js (frontend only)
import { displayMixInfo, resetUIForNewRound, updateResultsUI } from './uiControls.js';
import { markers } from './mapSetup.js';
import { resetStateForNewRound, totalScore, setHasGuessed, setMapClickable } from './state.js';
import { fetchNewRound, calculateGuess } from './gameService.js';

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

export async function startNewRound() {
  const regionType = document.getElementById("regionSelect").value;
  let customRegions = [];
  if (regionType === "6") {
    customRegions = Array.from(document.querySelectorAll("#customRegions input:checked")).map(cb => cb.value);
    if (customRegions.length === 0) {
      alert("Please select at least one region.");
      return;
    }
  }

  try {
    const data = await fetchNewRound(regionType, customRegions);
    displayMixInfo(data, regionColors);
    resetUIForNewRound();
    resetStateForNewRound();
    setMapClickable(true);

    Object.entries(data.mix_description).forEach(([pop]) => {
      if (markers[pop]) {
        markers[pop].setStyle({ fillColor: "gold", radius: 9 });
      }
    });
  } catch (err) {
    console.error("startNewRound failed:", err);
    alert("Failed to generate new round.");
  }
}

export function submitGuess(name) {
  try {
    const result = calculateGuess(name);
    setHasGuessed(true);
    setMapClickable(false);
    updateResultsUI(result, markers);
  } catch (err) {
    console.error("submitGuess failed:", err);
    alert("Error scoring your guess.");
  }
}
