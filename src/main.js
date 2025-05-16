import { initializeMap } from './mapSetup.js';
import { setupUIEvents, setupAutocomplete } from './uiControls.js';
import { startNewRound, submitGuess } from './gameLogic.js';
import { getHasGuessed, getMapClickable } from './state.js';
import { loadGeoJSON } from './gameService.js';
import './style.css';

window.addEventListener("DOMContentLoaded", async () => {
  await loadGeoJSON();           // ✅ Load population data first
  setupAutocomplete();           // ✅ Fill <datalist> with names

  initializeMap();
  setupUIEvents();


  // Helper to handle guessing logic
  function handleSubmit() {
    if (getHasGuessed()) {
      alert("You already guessed this round!");
      return;
    }
    const input = document.getElementById("guessInput").value.trim();
    if (input !== "") submitGuess(input);
  }

  // Bind input enter key
  const guessInput = document.getElementById("guessInput");
  guessInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSubmit();
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
