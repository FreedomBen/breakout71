import { Ball, GameState, PerkId, PerksMap } from "./types";
import { icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { debuffs } from "./debuffs";

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

export function sampleN<T>(arr: T[],n:number): T[] {

  return [...arr].sort(()=>Math.random()-0.5)
      .slice(0,n)
}

export function sumOfValues(obj: { [key: string]: number } | undefined | null) {
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
  return gameState.levelsPerLoop + gameState.perks.extra_levels;
}

export function pickedUpgradesHTMl(gameState: GameState) {
  let list = "";
  for (let u of upgrades) {
    for (let i = 0; i < gameState.perks[u.id]; i++)
      list += `<span  title="${u.name} : ${u.help(gameState.perks[u.id])}">${icons["icon:" + u.id]}</span>`;
  }

  if (!list) return "";
  return ` <p>${t("score_panel.upgrades_picked")}</p> <p>${list}</p>`;
}

export function debuffsHTMl(gameState: GameState): string {
  const banned = upgrades
    .filter((u) => gameState.bannedPerks[u.id])
    .map((u) => u.name)
    .join(", ");
  let list = debuffs
    .filter((d) => gameState.debuffs[d.id])
    .map((d) => d.name(gameState.debuffs[d.id], banned))
    .join(" ");

  if (!list) return "";
  return `<p>${t("score_panel.bebuffs_list")} ${list}</p>`;
}

export function levelsListHTMl(gameState: GameState) {
  if (!gameState.perks.clairvoyant) return "";
  let list = "";
  for (let i = 0; i < max_levels(gameState); i++) {
    list += `<span style="opacity: ${i >= gameState.currentLevel ? 1 : 0.2}" title="${gameState.runLevels[i].name}">${icons[gameState.runLevels[i].name]}</span>`;
  }
  return `<p>${t("score_panel.upcoming_levels")}</p><p>${list}</p>`;
}

export function currentLevelInfo(gameState: GameState) {
  return gameState.level;
}

export function isTelekinesisActive(gameState: GameState, ball: Ball) {
  return gameState.perks.telekinesis && ball.vy < 0;
}
export function isYoyoActive(gameState: GameState, ball: Ball) {
  return gameState.perks.yoyo && ball.vy > 0;
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

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
export function defaultSounds() {
  return {
    aboutToPlaySound: {
      wallBeep: { vol: 0, x: 0 },
      comboIncreaseMaybe: { vol: 0, x: 0 },
      comboDecrease: { vol: 0, x: 0 },
      coinBounce: { vol: 0, x: 0 },
      explode: { vol: 0, x: 0 },
      lifeLost: { vol: 0, x: 0 },
      coinCatch: { vol: 0, x: 0 },
      colorChange: { vol: 0, x: 0 },
      void: { vol: 0, x: 0 },
      freeze: { vol: 0, x: 0 },
    },
  };
}

export function shouldPierceByColor(
  gameState: GameState,
  vhit: number | undefined,
  hhit: number | undefined,
  chit: number | undefined,
) {
  if (!gameState.perks.pierce_color) return false;
  if (
    typeof vhit !== "undefined" &&
    gameState.bricks[vhit] !== gameState.ballsColor
  ) {
    return false;
  }
  if (
    typeof hhit !== "undefined" &&
    gameState.bricks[hhit] !== gameState.ballsColor
  ) {
    return false;
  }
  if (
    typeof chit !== "undefined" &&
    gameState.bricks[chit] !== gameState.ballsColor
  ) {
    return false;
  }
  return true;
}

export function countBricksAbove(gameState: GameState, index: number) {
  const col = index % gameState.gridSize;
  const row = Math.floor(index / gameState.gridSize);
  let count = 0;
  for (let y = 0; y < row; y++) {
    if (gameState.bricks[col + y * gameState.gridSize]) {
      count++;
    }
  }
  return count;
}
export function countBricksBelow(gameState: GameState, index: number) {
  const col = index % gameState.gridSize;
  const row = Math.floor(index / gameState.gridSize);
  let count = 0;
  for (let y = row + 1; y < gameState.gridSize; y++) {
    if (gameState.bricks[col + y * gameState.gridSize]) {
      count++;
    }
  }
  return count;
}
