// gameEngine.js
import { fetchNewRound, submitGuess } from './gameService.js';
import { TEXTS } from './config.js';
import { resetStateForNewRound } from './state.js';

export async function playGame(numPlayers = 2, numRounds = 3, regionPlan = []) {
  const playerNames = await getPlayerNames(numPlayers);
  const scores = Array(numPlayers).fill(0);

  for (let round = 1; round <= numRounds; round++) {
    const type = regionPlan[round - 1] ?? 5; // fallback to random
    const roundData = await fetchNewRound(type);
    displayMix(roundData);

    resetStateForNewRound();
    const roundScores = [];

    for (let i = 0; i < numPlayers; i++) {
      const guess = await promptGuess(playerNames[i]);
      const result = submitGuess(guess);
      roundScores.push(result.score);
      scores[i] += result.score;

      console.log(`${playerNames[i]} guessed ${guess}: ${result.message} (${result.distance?.toFixed(4)})`);
    }

    for (let i = 0; i < 10; i++) {
      const row = result.top10?.[i];
    }
  }

  console.log(`\n🎉 Final Scores:`);
  playerNames.forEach((name, i) => {
    console.log(`${name}: ${scores[i]} points`);
  });
}

async function getPlayerNames(n) {
  const names = [];
  for (let i = 0; i < n; i++) {
    let name = prompt(`Player ${i + 1}, enter your name:`)?.trim();
    while (!name) {
      alert(TEXTS.inv_name);
      name = prompt(`Player ${i + 1}, enter your name:`)?.trim();
    }
    names.push(name);
  }
  return names;
}

async function promptGuess(playerName) {
  let guess = prompt(`${playerName}, what's your guess?`)?.trim();
  while (!guess) {
    alert(TEXTS.inv_guess);
    guess = prompt(`${playerName}, what's your guess?`)?.trim();
  }
  return guess;
}

function displayMix(data) {
  console.log(TEXTS.guess);
  Object.entries(data.mix_description).forEach(([pop, w]) => {
    console.log(` - ${Math.round(w * 100)}% ${pop}`);
  });
}
