import {gameState} from "./game";
import {sumOfValues} from "./game_utils";
import {liveCount} from "./gameStateMutators";
import {getCurrentMaxCoins, getCurrentMaxParticles} from "./settings";
import {clamp} from "./pure_functions";

export let total: Record<string, number> = {};
let lastTick = performance.now();
let doing = "idle";
export let lastMeasuredFPS = 60;
// Worst FPS we saw
export let worstFPS = 60,
  worstInstantFPS = 60;
// Coins at which fps dipped below 55
export let coinsForLag = Infinity;

let lastFrame = Date.now();
export function frameStarted() {
  FPSCounter++;
  const instantFPS = 1000 / (Date.now() - lastFrame);
  lastFrame = Date.now();
  if (isNaN(instantFPS)) return;
  if (instantFPS < 50) {
    coinsForLag = Math.min(coinsForLag, liveCount(gameState.coins));
  }
  worstInstantFPS = Math.min(worstInstantFPS, instantFPS);
  worstFPS = Math.min(worstFPS, lastMeasuredFPS);
}

export function getWorstFPSAndReset() {
  const result = { worstFPS, coinsForLag, worstInstantFPS };
  worstFPS = 60;
  worstInstantFPS = 60;
  coinsForLag = Infinity;
  return result;
}

export function startWork(what) {
  if (!gameState.startParams.stress) return;
  const newNow = performance.now();
  if (doing) {
    total[doing] = (total[doing] || 0) + (newNow - lastTick);
  }
  lastTick = newNow;
  doing = what;
}

export let FPSCounter = 0;
export const stats = document.getElementById("stats") as HTMLDivElement;

setInterval(() => {
  lastMeasuredFPS = FPSCounter;
  FPSCounter = 0;

  if (!gameState.startParams.stress) {
    stats.style.display = "none";
    return;
  }

  stats.style.display = "block";
  const totalTime = sumOfValues(total);
  stats.innerHTML =
    `
    <div> 
    ${lastMeasuredFPS} FPS -
    ${liveCount(gameState.coins)} / ${getCurrentMaxCoins()} Coins - 
     ${liveCount(gameState.particles) + liveCount(gameState.lights) + liveCount(gameState.texts)} / ${getCurrentMaxParticles() * 3} particles 
    </div>  
    
     
   
    
    ` +
    Object.entries(total)
      // .sort((a, b) => b[1] - a[1])
      .map(
        (t) =>
          `  <div> 
           <div style="transform: scale(${clamp(t[1] / totalTime, 0, 1)},1)"></div> 
  <strong>${t[0]} : ${Math.floor(t[1])} ms</strong> 
  </div>
        `,
      )
      .join("\n");

  total = {};
}, 1000);
