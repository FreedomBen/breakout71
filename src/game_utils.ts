import {Ball, GameState, PerkId, PerksMap} from "./types";
import {icons, upgrades} from "./loadGameData";

export function getMajorityValue(arr: string[]): string {
  const count: { [k: string]: number } = {};
  arr.forEach((v) => (count[v] = (count[v] || 0) + 1));
  // Object.values inline polyfill
  const max = Math.max(...Object.keys(count).map((k) => count[k]));
  return sample(Object.keys(count).filter((k) => count[k] == max));
}

export function sample<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())];
}

export function sumOfKeys(obj: { [key: string]: number } | undefined | null) {
  if (!obj) return 0;
  return Object.values(obj)?.reduce((a, b) => a + b, 0) || 0;
}

export const makeEmptyPerksMap = (upgrades: { id: PerkId }[]) => {
  const p = {} as any;
  upgrades.forEach((u) => (p[u.id] = 0));
  return p as PerksMap;
};

export function brickCenterX(gameState: GameState, index: number) {
  return (
    gameState.offsetX +
    ((index % gameState.gridSize) + 0.5) * gameState.brickWidth
  );
}

export function brickCenterY(gameState: GameState, index: number) {
  return (Math.floor(index / gameState.gridSize) + 0.5) * gameState.brickWidth;
}

export function getRowColIndex(gameState: GameState, row: number, col: number) {
  if (
    row < 0 ||
    col < 0 ||
    row >= gameState.gridSize ||
    col >= gameState.gridSize
  )
    return -1;
  return row * gameState.gridSize + col;
}

export function getPossibleUpgrades(gameState: GameState) {
  return upgrades
    .filter((u) => gameState.totalScoreAtRunStart >= u.threshold)
    .filter((u) => !u?.requires || gameState.perks[u?.requires]);
}

export function max_levels(gameState: GameState) {
  return 7 + gameState.perks.extra_levels;
}

export function pickedUpgradesHTMl(gameState: GameState) {
  let list = "";
  for (let u of upgrades) {
    for (let i = 0; i < gameState.perks[u.id]; i++)
      list += icons["icon:" + u.id] + " ";
  }
  return list;
}

export function currentLevelInfo(gameState: GameState) {
  return gameState.runLevels[
    gameState.currentLevel % gameState.runLevels.length
  ];
}

export function isTelekinesisActive(gameState: GameState, ball: Ball) {
  return gameState.perks.telekinesis && !ball.hitSinceBounce && ball.vy < 0;
}

export function findLast<T>(
  arr: T[],
  predicate: (item: T, index: number, array: T[]) => boolean,
) {
  let i = arr.length;
  while (--i)
    if (predicate(arr[i], i, arr)) {
      return arr[i];
    }
}

export function distance2(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

export function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.sqrt(distance2(a, b));
}

export function defaultSounds() {
    return {
        aboutToPlaySound: {
            wallBeep: {vol: 0, x: 0},
            comboIncreaseMaybe: {vol: 0, x: 0},
            comboDecrease: {vol: 0, x: 0},
            coinBounce: {vol: 0, x: 0},
            explode: {vol: 0, x: 0},
            lifeLost: {vol: 0, x: 0},
            coinCatch: {vol: 0, x: 0},
            colorChange: {vol: 0, x: 0},
        }
    }
}