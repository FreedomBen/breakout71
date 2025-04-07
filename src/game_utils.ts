import {
  Ball,
  GameState,
  Level,
  PerkId,
  PerksMap,
  RunHistoryItem,
  Upgrade,
} from "./types";
import { icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { clamp } from "./pure_functions";
import { rawUpgrades } from "./upgrades";
import { hashCode } from "./getLevelBackground";

export function describeLevel(level: Level) {
  let bricks = 0,
    colors = new Set(),
    bombs = 0;
  level.bricks.forEach((color) => {
    if (!color) return;
    if (color === "black") {
      bombs++;
      return;
    } else {
      colors.add(color);
      bricks++;
    }
  });
  return t("unlocks.level_description", {
    size: level.size,
    bricks,
    colors: colors.size,
    bombs,
  });
}

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
  if (gameState.creative) return 1;
  return 7 + gameState.perks.extra_levels;
}

export function pickedUpgradesHTMl(gameState: GameState) {
  const upgradesList = getPossibleUpgrades(gameState)
    .filter((u) => gameState.perks[u.id])
    .map((u) => {
      const newMax = Math.max(0, u.max + gameState.perks.limitless);

      let bars = [];
      for (let i = 0; i < Math.max(u.max, newMax, gameState.perks[u.id]); i++) {
        if (i < gameState.perks[u.id]) {
          bars.push('<span class="used"></span>');
        } else if (i < newMax) {
          bars.push('<span class="free"></span>');
        } else {
          bars.push('<span class="banned"></span>');
        }
      }

      const state = (gameState.perks[u.id] && 1) || (!newMax && 2) || 3;
      return {
        state,
        html: `
        <div class="upgrade ${["??", "used", "banned", "free"][state]}">
            ${u.icon}
            <p>
            <strong>${u.name}</strong>
          ${u.help(Math.max(1, gameState.perks[u.id]))}
          </p> 
            ${bars.reverse().join("")}
        </div>
        `,
      };
    })
    .sort((a, b) => a.state - b.state)
    .map((a) => a.html);

  return ` <p>${t("score_panel.upgrades_picked")}</p>` + upgradesList.join("");
}

export function levelsListHTMl(gameState: GameState, level: number) {
  if (!gameState.perks.clairvoyant) return "";
  if (gameState.creative) return "";
  let list = "";
  for (let i = 0; i < max_levels(gameState); i++) {
    list += `<span style="opacity: ${i >= level ? 1 : 0.2}" title="${gameState.runLevels[i].name}">${icons[gameState.runLevels[i].name]}</span>`;
  }
  return `<p>${t("score_panel.upcoming_levels")}</p><p>${list}</p>`;
}

export function currentLevelInfo(gameState: GameState) {
  return gameState.level;
}

export function isPickyEatingPossible(gameState: GameState) {
  return gameState.bricks.indexOf(gameState.ballsColor) !== -1;
}

export function reachRedRowIndex(gameState: GameState) {
  if (!gameState.perks.reach) return -1;
  const { size } = gameState.level;
  let minY = -1,
    maxY = -1,
    maxYCount = -1;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (gameState.bricks[x + y * size]) {
        if (minY == -1) minY = y;
        if (maxY < y) {
          maxY = y;
          maxYCount = 0;
        }
        if (maxY == y) maxYCount++;
      }

  if (maxY < 1) return -1;
  if (maxY == minY) return -1;
  if (maxYCount === size) return -1;
  return maxY;
}

export function telekinesisEffectRate(gameState: GameState, ball: Ball) {
  return (
    (gameState.perks.telekinesis &&
      ball.vy < 0 &&
      clamp((ball.y / gameState.gameZoneHeight) * 1.1 + 0.1, 0, 1)) ||
    0
  );
}

export function yoyoEffectRate(gameState: GameState, ball: Ball) {
  return (
    (gameState.perks.yoyo &&
      ball.vy > 0 &&
      clamp(1 - (ball.y / gameState.gameZoneHeight) * 1.1 + 0.1, 0, 1)) ||
    0
  );
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
      wallBeep: { vol: 0, x: 0 },
      comboIncreaseMaybe: { vol: 0, x: 0 },
      comboDecrease: { vol: 0, x: 0 },
      coinBounce: { vol: 0, x: 0 },
      explode: { vol: 0, x: 0 },
      lifeLost: { vol: 0, x: 0 },
      coinCatch: { vol: 0, x: 0 },
      colorChange: { vol: 0, x: 0 },
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

export function isMovingWhilePassiveIncome(gameState: GameState) {
  return !!(
    gameState.lastPuckMove &&
    gameState.perks.passive_income &&
    gameState.lastPuckMove >
      gameState.levelTime - 250 * gameState.perks.passive_income
  );
}

export function getHighScore() {
  try {
    return parseInt(localStorage.getItem("breakout-3-hs-short") || "0");
  } catch (e) {}
  return 0;
}

export function highScoreText() {
  if (getHighScore()) {
    return t("main_menu.high_score", { score: getHighScore() });
  }
  return "";
}

type UpgradeLike = { id: PerkId; name: string; requires: string };

export function getLevelUnlockCondition(levelIndex: number) {
  // Returns "" if level is unlocked, otherwise a string explaining how to unlock it
  let required: UpgradeLike[] = [],
    forbidden: UpgradeLike[] = [],
    minScore = Math.max(-1000 + 100 * levelIndex,0);

  if (levelIndex > 20) {
    const excluded: Set<PerkId> = new Set([
      "extra_levels",
      "extra_life",
      "one_more_choice",
      "instant_upgrade",
      "shunt",
      "slow_down",
    ]);
    // Avoid excluding a perk that's needed for the required one
    rawUpgrades.forEach((u) => {
      if (u.requires) excluded.add(u.requires);
    });

    const possibletargets = rawUpgrades
      .slice(0, Math.floor(levelIndex / 2))
      .map((u) => u)
      .filter((u) => !excluded.has(u.id))
      .sort(
        (a, b) => hashCode(levelIndex + a.id) - hashCode(levelIndex + b.id),
      );

    const length = Math.ceil(levelIndex / 30);
    required = possibletargets.slice(0, length);
    forbidden = possibletargets.slice(length, length + length);
  }
  return {
    required,
    forbidden,
    minScore,
  };
}

export function getBestScoreMatching(
  history: RunHistoryItem[],
  required: UpgradeLike[] = [],
  forbidden: UpgradeLike[] = [],
) {
  return Math.max(
    0,
    ...history
      .filter(
        (r) =>
          !required.find((u) => !r?.perks?.[u.id]) &&
          !forbidden.find((u) => r?.perks?.[u.id]),
      )
      .map((r) => r.score),
  );
}

export function reasonLevelIsLocked(
  levelIndex: number,
  history: RunHistoryItem[],
  mentionBestScore: boolean,
): null | { reached: number; minScore: number; text: string } {
  const { required, forbidden, minScore } = getLevelUnlockCondition(levelIndex);

  const reached = getBestScoreMatching(history, required, forbidden);
  let reachedText =
    reached && mentionBestScore ? t("unlocks.reached", { reached }) : "";
  if (reached >= minScore) {
    return null;
  } else if (!required.length && !forbidden.length) {
    return {
      reached,
      minScore,
      text: t("unlocks.minScore", { minScore }) + reachedText,
    };
  } else {
    return {
      reached,
      minScore,
      text:
        t("unlocks.minScoreWithPerks", {
          minScore,
          required: required.map((u) => u.name).join(", "),
          forbidden: forbidden.map((u) => u.name).join(", "),
        }) + reachedText,
    };
  }
}
