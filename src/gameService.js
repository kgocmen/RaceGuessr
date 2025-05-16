// gameService.js
import { WEIGHTS, TOTAL, SCORES, MATRIX, REGIONS, euclideanDistance} from './config.js';
import { addScore } from './state.js';

let allPopulations = [];
let pcColumns = Array.from({ length: 25 }, (_, i) => `PC${i + 1}`);

export let populationNames = [];
let currentState = {
  vector: null,
  results: null,
  mix: null,
  regions: null
};

export async function loadGeoJSON() {
  const url = `${import.meta.env.BASE_URL}illu_modern_points.geojson`;
  const res = await fetch('url');
  const data = await res.json();
  allPopulations = data.features.map(f => ({
    name: f.properties.Population,
    region: f.properties.Region,
    coords: f.geometry.coordinates,
    vector: pcColumns.map(key => f.properties[key])
  }));
  populationNames = allPopulations.map(p => p.name);
}

export async function fetchNewRound(regionType, customRegions = []) {
  if (!allPopulations.length) await loadGeoJSON();

  const regions = getRegionList(regionType, customRegions);
  const filtered = allPopulations.filter(p => regions.includes(p.region));

  const n = Math.floor(Math.random() * 3) + 2; // 2 to 4 pops
  const mixPops = randomSample(filtered, n);
  let weights;
  do {
    weights = randomSample(WEIGHTS, n, true);
  } while (weights.reduce((a, b) => a + b, 0) !== TOTAL);

  const proportions = weights.map(w => w / TOTAL);
  const synthetic = averageVectors(mixPops.map(p => p.vector), proportions);

  const results = allPopulations.map(p => ({
    name: p.name,
    distance: 100 * euclideanDistance(p.vector, synthetic)
  })).sort((a, b) => a.distance - b.distance);

  currentState = {
    vector: synthetic,
    results,
    mix: Object.fromEntries(mixPops.map((p, i) => [p.name, proportions[i]])),
    regions
  };

  return {
    mix_description: currentState.mix,
    regions,
    populations: mixPops.map(p => p.name)
  };
}

export function calculateGuess(guess) {
  const { results, vector, mix, regions } = currentState;
  if (!results) throw new Error("Round not initialized");

  const top10 = results.slice(0, 10);
  const top10Names = top10.map(r => r.name);

  const entry = results.find(r => r.name === guess);
  const rank = results.findIndex(r => r.name === guess) + 1;
  const distance = entry?.distance ?? null;

  let score;
  if (top10Names.includes(guess)) {
    score = SCORES[top10Names.indexOf(guess)];
  } else {
    score = computeFallbackScore(guess, vector, results);
  }

  addScore(score);

  return {
    score,
    rank,
    distance,
    guess,
    top10,
    true_mix: mix,
    regions
  };
}

export function getRegionList(type, custom = []) {
  // Handle custom type
  if (type === "6") return custom;

  // Handle random type (5)
  if (type === "5") {
    const randType = (Math.floor(Math.random() * 4) + 1).toString(); // "1" to "4"
    return getRegionList(randType);
  }

  // 1–4: Get a random value from REGIONS[type - 1] → this is the number of regions to return
  const regionOptions = REGIONS[parseInt(type) - 1];
  const regionCount = regionOptions[Math.floor(Math.random() * regionOptions.length)];

  // Seed with one random region from MATRIX["default"]
  const defaultOptions = MATRIX["default"];
  const seedRegion = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];

  const regSet = new Set([seedRegion]);

  while (regSet.size < regionCount) {
    const candidates = new Set();

    for (const region of regSet) {
      const neighbors = MATRIX[region] || [];
      for (const n of neighbors) {
        if (!regSet.has(n)) candidates.add(n);
      }
    }

    const candidateArray = Array.from(candidates);
    if (candidateArray.length === 0) break;

    const chosen = candidateArray[Math.floor(Math.random() * candidateArray.length)];
    regSet.add(chosen);
  }

  return Array.from(regSet);
}


function computeFallbackScore(guess, results) {
  const entry = results.find(r => r.name === guess);
  if (!entry) return 0;

  const rank = results.findIndex(r => r.name === guess);
  const dist = entry.distance;

  if (rank >= 10 && rank < 20) {
    const max = results[19].distance;
    const min = results[10].distance;
    return Math.round(10 + (max - dist) / (max - min + 1e-8) * 10);
  } else if (rank >= 20 && rank < 50) {
    const max = results[49].distance;
    const min = results[20].distance;
    return Math.round((max - dist) / (max - min + 1e-8) * 10);
  }
  return 0;
}

function averageVectors(vectors, weights) {
  const length = vectors[0].length;
  const result = Array(length).fill(0);
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < vectors.length; j++) {
      result[i] += vectors[j][i] * weights[j];
    }
  }
  return result;
}

function randomSample(arr, n, replace = false) {
  if (replace) {
    return Array.from({ length: n }, () => arr[Math.floor(Math.random() * arr.length)]);
  } else {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }
}
