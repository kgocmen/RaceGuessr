import { initializeMap } from './mapSetup.js';
import { setupUIEvents, setupAutocomplete, setupModeButtons } from './uiControls.js';
import { startNewRound, submitGuess } from './gameLogic.js';
import { getHasGuessed, getMapClickable } from './state.js';
import { loadGeoJSON, populationNames } from './gameService.js';
import './style.css';

window.addEventListener("DOMContentLoaded", async () => {
  await loadGeoJSON();           // Load population data first
  setupAutocomplete();           // Fill <datalist> with names

  initializeMap(); 
  setupUIEvents();
  setupModeButtons();

  // Welcome pop-up
  const popup = document.getElementById("howToPlayPopup");
  const introSeen = localStorage.getItem("seenIntro");

  if (!introSeen && popup) {
    popup.style.display = "flex";
    setTimeout(() => popup.classList.add("visible"), 10); // trigger fade-in
    // only store after it’s dismissed
    document.getElementById("popupCloseBtn")?.addEventListener("click", () => {
      popup.style.display = "none";
      localStorage.setItem("seenIntro", "true");
    });
  }





  // Helper to handle guessing logic
  function handleSubmit() {
    const normalizeInput = str => str.toLowerCase().replace(/\s+/g, '');
    const populationLookup = {};
    populationNames.forEach(name => {
      const key = name.toLowerCase().replace(/[-_]/g, ''); // remove - and _
      populationLookup[key] = name;
    });

    // Get user input
    const rawInput = document.getElementById("guessInput").value.trim();
    const cleanedInput = normalizeInput(rawInput);

    // Try to find a matching population name
    const matchedName = populationLookup[cleanedInput];

    if (!matchedName) {
      alert("That population does not exist. Please try again.");
      return;
    }

    submitGuess(matchedName); // Use the actual dataset version

  }

  // Bind input enter key
  const guessInput = document.getElementById("guessInput");
  guessInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
  });
  // Tab
  guessInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      const options = document.querySelectorAll("#popSuggestions option");
      for (const option of options) {
        if (option.value.toLowerCase().startsWith(guessInput.value.toLowerCase())) {
          e.preventDefault();
          guessInput.value = option.value;
          break;
        }
      }
    }
  });


  // Bind submit button
  document.getElementById("submitBtn")?.addEventListener("click", handleSubmit);

  // Show custom region checkboxes if 'Custom' selected
  document.getElementById("regionSelect")?.addEventListener("change", () => {
    const selected = document.getElementById("regionSelect").value;
    document.getElementById("customRegions").style.display = selected === "6" ? "block" : "none";
  });

  // Prevent label double click propagation
  document.querySelectorAll("#customRegions input")?.forEach(cb => {
    cb.addEventListener("click", e => e.stopPropagation());
  });

  // Start new round
  document.getElementById("newRoundBtn")?.addEventListener("click", () => {
    startNewRound();
    setTimeout(() => {
      document.getElementById("guessInput")?.focus();
    }, 50); // small delay ensures input is visible before focusing
  });
});

// Make marker clicks globally available
window.submitGuess = (name) => {
  if (!getMapClickable()) return;
  if (getHasGuessed()) {
    alert("You already guessed this round!");
    return;
  }
  submitGuess(name);
};

window.showPopupPage = function(n) {
  for (let i = 1; i <= 3; i++) {
    const page = document.getElementById(`popupPage${i}`);
    if (page) {
      page.style.display = i === n ? "block" : "none";
      if (i === n) page.classList.add("slide-in");
    }
  }
};

function showHowToPlayPopup() {
  const popup = document.getElementById("howToPlayPopup");
  popup.style.display = "flex";
  setTimeout(() => popup.classList.add("visible"), 10);
}

// Always show during development
showHowToPlayPopup();

// Close on ✕ or Got it!
document.getElementById("popupCloseBtn")?.addEventListener("click", () => {
  document.getElementById("howToPlayPopup").style.display = "none";
});

