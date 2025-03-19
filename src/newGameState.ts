import { GameState, RunParams } from "./types";
import { getTotalScore } from "./settings";
import { allLevels, upgrades } from "./loadGameData";
import {
  defaultSounds,
  getPossibleUpgrades,
  makeEmptyPerksMap,
  sumOfKeys,
} from "./game_utils";
import { dontOfferTooSoon, resetBalls } from "./gameStateMutators";
import { isOptionOn } from "./options";

export function newGameState(params: RunParams): GameState {
  const totalScoreAtRunStart = getTotalScore();
  const firstLevel = params?.level
    ? allLevels.filter((l) => l.name === params?.level)
    : [];

  const restInRandomOrder = allLevels
    .filter((l) => totalScoreAtRunStart >= l.threshold)
    .filter((l) => l.name !== params?.level)
    .filter((l) => l.name !== params?.levelToAvoid)
    .sort(() => Math.random() - 0.5);

  const runLevels = firstLevel.concat(
    restInRandomOrder.slice(0, 7 + 3).sort((a, b) => a.sortKey - b.sortKey),
  );

  const perks = { ...makeEmptyPerksMap(upgrades), ...(params?.perks || {}) };

  const gameState: GameState = {
    runLevels,
    currentLevel: 0,
    perks,
    puckWidth: 200,
    baseSpeed: 12,
    combo: 1,
    gridSize: 12,
    running: false,
    ballStickToPuck: true,
    puckPosition: 400,
    pauseTimeout: null,
    canvasWidth: 0,
    canvasHeight: 0,
    offsetX: 0,
    offsetXRoundedDown: 0,
    gameZoneWidth: 0,
    gameZoneWidthRoundedUp: 0,
    gameZoneHeight: 0,
    brickWidth: 0,
    score: 0,
    lastScoreIncrease: -1000,
    lastExplosion: -1000,
    highScore: parseFloat(localStorage.getItem("breakout-3-hs") || "0"),
    balls: [],
    ballsColor: "white",
    bricks: [],
    lights: { indexMin: 0, total: 0, list: [] },
    particles: { indexMin: 0, total: 0, list: [] },
    texts: { indexMin: 0, total: 0, list: [] },
    coins: { indexMin: 0, total: 0, list: [] },
    levelStartScore: 0,
    levelMisses: 0,
    levelSpawnedCoins: 0,
    lastPlayedCoinGrab: 0,
    MAX_COINS: 400,
    MAX_PARTICLES: 600,
    puckColor: "#FFF",
    ballSize: 20,
    coinSize: 14,
    puckHeight: 20,
    totalScoreAtRunStart,
    isCreativeModeRun: sumOfKeys(perks) > 1,
    pauseUsesDuringRun: 0,
    keyboardPuckSpeed: 0,
    lastTick: performance.now(),
    lastTickDown: 0,
    runStatistics: {
      started: Date.now(),
      levelsPlayed: 0,
      runTime: 0,
      coins_spawned: 0,
      score: 0,
      bricks_broken: 0,
      misses: 0,
      balls_lost: 0,
      puck_bounces: 0,
      wall_bounces: 0,
      upgrades_picked: 1,
      max_combo: 1,
      max_level: 0,
    },
    lastOffered: {},
    levelTime: 0,
    noBricksSince: 0,
    levelWallBounces: 0,
    needsRender: true,
    autoCleanUses: 0,
    ...defaultSounds(),
  };
  resetBalls(gameState);

  if (!sumOfKeys(gameState.perks)) {
    const giftable = getPossibleUpgrades(gameState).filter((u) => u.giftable);
    const randomGift =
      (isOptionOn("easy") && "slow_down") ||
      giftable[Math.floor(Math.random() * giftable.length)].id;
    perks[randomGift] = 1;
    dontOfferTooSoon(gameState, randomGift);
  }
  for (let perk of upgrades) {
    if (gameState.perks[perk.id]) {
      dontOfferTooSoon(gameState, perk.id);
    }
  }
  return gameState;
}
