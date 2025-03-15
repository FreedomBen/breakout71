import { GameState } from "./types";
import { sounds } from "./sounds";

export function baseCombo(gameState: GameState) {
  return 1 + gameState.perks.base_combo * 3 + gameState.perks.smaller_puck * 5;
}

export function resetCombo(
  gameState: GameState,
  x: number | undefined,
  y: number | undefined,
) {
  const prev = gameState.combo;
  gameState.combo = baseCombo(gameState);
  if (!gameState.levelTime) {
    gameState.combo += gameState.perks.hot_start * 15;
  }
  if (prev > gameState.combo && gameState.perks.soft_reset) {
    gameState.combo += Math.floor(
      (prev - gameState.combo) / (1 + gameState.perks.soft_reset),
    );
  }
  const lost = Math.max(0, prev - gameState.combo);
  if (lost) {
    for (let i = 0; i < lost && i < 8; i++) {
      setTimeout(() => sounds.comboDecrease(), i * 100);
    }
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      gameState.flashes.push({
        type: "text",
        text: "-" + lost,
        time: gameState.levelTime,
        color: "red",
        x: x,
        y: y,
        duration: 150,
        size: gameState.puckHeight,
      });
    }
  }
  return lost;
}

export function decreaseCombo(
  gameState: GameState,
  by: number,
  x: number,
  y: number,
) {
  const prev = gameState.combo;
  gameState.combo = Math.max(baseCombo(gameState), gameState.combo - by);
  const lost = Math.max(0, prev - gameState.combo);

  if (lost) {
    sounds.comboDecrease();
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      gameState.flashes.push({
        type: "text",
        text: "-" + lost,
        time: gameState.levelTime,
        color: "red",
        x: x,
        y: y,
        duration: 300,
        size: gameState.puckHeight,
      });
    }
  }
}
