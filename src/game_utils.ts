import { Ball, GameState, Level, PerkId, PerksMap } from "./types";
import { icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";

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
  if (gameState.mode === "creative") return 3;
  return Math.max(7 + gameState.perks.extra_levels - gameState.loop, 1);
}

export function pickedUpgradesHTMl(gameState: GameState) {
  const upgradesList = getPossibleUpgrades(gameState)
    .map((u) => {
      const newMax = Math.max(0, u.max - gameState.bannedPerks[u.id]);

      let bars =[];
      for (let i = 0; i < Math.max(u.max, newMax, gameState.perks[u.id]); i++) {
        if (i < gameState.perks[u.id]) {
          bars .push('<span class="used"></span>');
        } else if (i < newMax) {
          bars .push('<span class="free"></span>');
        } else {
          bars .push('<span class="banned"></span>');
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
            ${bars.reverse().join('')}
        </div>
        `,
      };
    })
    .sort((a, b) => a.state - b.state)
    .map((a) => a.html);

  return ` <p>${t("score_panel.upgrades_picked")}</p>` + upgradesList.join("");
}

export function levelsListHTMl(gameState: GameState) {
  if (!gameState.perks.clairvoyant) return "";
  if (gameState.mode === "creative") return "";
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
export function highScoreForMode(mode: GameState["mode"]) {
  try {
    const score = parseInt(
      localStorage.getItem("breakout-3-hs-" + mode) || "0",
    );
    if (score) {
      return t("main_menu.high_score", { score });
    }
  } catch (e) {}

  return "";
}

try {
  const old = localStorage.getItem("breakout-3-hs");
  if (old) {
    localStorage.setItem("breakout-3-hs-short", old);
    localStorage.removeItem("breakout-3-hs");
  }
} catch (e) {}
