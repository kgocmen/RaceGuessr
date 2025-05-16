// state.js
export let totalScore = 0;
let hasGuessed = false;
let mapClickable = false;

export function resetStateForNewRound() {
  hasGuessed = false;
  mapClickable = true;
}

export function setHasGuessed(val) {
  hasGuessed = val;
}

export function getHasGuessed() {
  return hasGuessed;
}

export function setMapClickable(val) {
  mapClickable = val;
}

export function getMapClickable() {
  return mapClickable;
}

export function addScore(score) {
  totalScore += score;
}

export function resetTotalScore() {
  totalScore = 0;
}
