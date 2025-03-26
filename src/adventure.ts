import { GameState } from "./types";

export async function openAdventureRunUpgradesPicker(gameState: GameState) {
  let options = 3;
  const catchRate =
    (gameState.score - gameState.levelStartScore) /
    (gameState.levelSpawnedCoins || 1);

  if (gameState.levelWallBounces == 0) {
    options++;
  }
  if (gameState.levelTime < 30 * 1000) {
    options++;
  }
  if (catchRate === 1) {
    options++;
  }
  if (gameState.levelMisses === 0) {
    options++;
  }

  const choices = [];
  for (let difficulty = 0; difficulty < options; difficulty++) {
    choices.push({});
  }
}
