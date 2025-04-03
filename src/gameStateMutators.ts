import {
  Ball,
  BallLike,
  Coin,
  colorString,
  GameState,
  LightFlash,
  ParticleFlash,
  PerkId,
  ReusableArray,
  TextFlash,
} from "./types";

import {
  brickCenterX,
  brickCenterY,
  // countBricksAbove,
  // countBricksBelow,
  currentLevelInfo,
  distance2,
  distanceBetween,
  getMajorityValue,
  getPossibleUpgrades,
  getRowColIndex,
  isMovingWhilePassiveIncome,
  isPickyEatingPossible,
  isTelekinesisActive,
  isYoyoActive,
  makeEmptyPerksMap,
  max_levels,
  reachRedRowIndex,
  shouldPierceByColor,
} from "./game_utils";
import { t } from "./i18n/i18n";
import { icons, upgrades } from "./loadGameData";

import {
  addToTotalScore,
  getCurrentMaxCoins,
  getCurrentMaxParticles,
} from "./settings";
import { background } from "./render";
import { gameOver } from "./gameOver";
import {
  brickIndex,
  fitSize,
  gameState,
  hasBrick,
  hitsSomething,
  openUpgradesPicker,
  pause,
} from "./game";
import { stopRecording } from "./recording";
import { isOptionOn } from "./options";
import { getRunLevels } from "./newGameState";
import { requiredAsyncAlert } from "./asyncAlert";
import { clamp, comboKeepingRate } from "./pure_functions";
import { openCreativeModePerksPicker } from "./creative";

export function setMousePos(gameState: GameState, x: number) {
  gameState.puckPosition = x;
  // Sets the puck position, and updates the ball position if they are supposed to follow it
  gameState.needsRender = true;
}

function getBallDefaultVx(gameState: GameState) {
  return (
    (gameState.perks.concave_puck ? 0 : 1) *
    (Math.random() > 0.5 ? gameState.baseSpeed : -gameState.baseSpeed)
  );
}

export function resetBalls(gameState: GameState) {
  // Always compute speed first
  normalizeGameState(gameState);
  const count = 1 + (gameState.perks?.multiball || 0);
  const perBall = gameState.puckWidth / (count + 1);
  gameState.balls = [];
  gameState.ballsColor = "#FFF";
  if (gameState.perks.picky_eater || gameState.perks.pierce_color) {
    gameState.ballsColor =
      getMajorityValue(gameState.bricks.filter((i) => i)) || "#FFF";
  }
  for (let i = 0; i < count; i++) {
    const x =
      gameState.puckPosition - gameState.puckWidth / 2 + perBall * (i + 1);
    const vx = getBallDefaultVx(gameState);

    gameState.balls.push({
      x,
      previousX: x,
      y: gameState.gameZoneHeight - 1.5 * gameState.ballSize,
      previousY: gameState.gameZoneHeight - 1.5 * gameState.ballSize,
      vx,
      previousVX: vx,
      vy: -gameState.baseSpeed,
      previousVY: -gameState.baseSpeed,
      piercePoints: gameState.perks.pierce * 3,
      hitSinceBounce: 0,
      brokenSinceBounce: 0,
      sapperUses: 0,
    });
  }
  gameState.ballStickToPuck = true;
}

export function putBallsAtPuck(gameState: GameState) {
  // This reset could be abused to cheat quite easily
  const count = gameState.balls.length;
  const perBall = gameState.puckWidth / (count + 1);
  // const vx = getBallDefaultVx(gameState);
  gameState.balls.forEach((ball, i) => {
    const x =
      gameState.puckPosition - gameState.puckWidth / 2 + perBall * (i + 1);

    ball.x = x;
    ball.previousX = x;
    ball.y = gameState.gameZoneHeight - 1.5 * gameState.ballSize;
    ball.previousY = ball.y;
    ball.hitSinceBounce = 0;
    ball.brokenSinceBounce = 0;
    ball.piercePoints = gameState.perks.pierce * 3;
  });
}

export function normalizeGameState(gameState: GameState) {
  // This function resets most parameters on the state to correct values, and should be used even when the game is paused

  gameState.baseSpeed = Math.max(
    3,
    gameState.gameZoneWidth / 12 / 10 +
      gameState.currentLevel / 3 +
      gameState.levelTime / (30 * 1000) -
      gameState.perks.slow_down * 2 +
      gameState.loop,
  );

  gameState.puckWidth = Math.max(
    gameState.ballSize,
    (gameState.gameZoneWidth / 12) *
      Math.min(
        12,
        3 - gameState.perks.smaller_puck + gameState.perks.bigger_puck,
      ),
  );

  const corner = gameState.levelTime ? gameState.perks.corner_shot : 0;

  let minX =
    gameState.offsetXRoundedDown +
    gameState.puckWidth / 2 -
    gameState.puckWidth * corner;

  let maxX =
    gameState.offsetXRoundedDown +
    gameState.gameZoneWidthRoundedUp -
    gameState.puckWidth / 2 +
    gameState.puckWidth * corner;

  gameState.puckPosition = clamp(gameState.puckPosition, minX, maxX);

  if (gameState.ballStickToPuck) {
    putBallsAtPuck(gameState);
  }

  if (
    Math.abs(gameState.lastPuckPosition - gameState.puckPosition) > 1 &&
    gameState.running
  ) {
    gameState.lastPuckMove = gameState.levelTime;
  }
  gameState.lastPuckPosition = gameState.puckPosition;
}

export function baseCombo(gameState: GameState) {
  return (
    gameState.baseCombo +
    gameState.perks.base_combo * 3 +
    gameState.perks.smaller_puck * 5
  );
}

export function resetCombo(
  gameState: GameState,
  x: number | undefined,
  y: number | undefined,
) {
  const prev = gameState.combo;
  gameState.combo = baseCombo(gameState);

  if (prev > gameState.combo && gameState.perks.soft_reset) {
    gameState.combo += Math.floor(
      (prev - gameState.combo) * comboKeepingRate(gameState.perks.soft_reset),
    );
  }
  const lost = Math.max(0, prev - gameState.combo);
  if (lost) {
    for (let i = 0; i < lost && i < 8; i++) {
      setTimeout(
        () => schedulGameSound(gameState, "comboDecrease", x, 1),
        i * 100,
      );
    }
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      makeText(
        gameState,
        x,
        y,
        "red",
        "-" + lost,
        20,
        500 + clamp(lost, 0, 500),
      );
    }
  }
  return lost;
}

export function increaseCombo(
  gameState: GameState,
  by: number,
  x: number,
  y: number,
) {
  if (by <= 0) {
    return;
  }
  gameState.combo += by;
  if (
    isOptionOn("comboIncreaseTexts") &&
    typeof x !== "undefined" &&
    typeof y !== "undefined"
  ) {
    makeText(gameState, x, y, "gold", "+" + by, 25, 400 + by);
  }
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
    schedulGameSound(gameState, "comboDecrease", x, 1);
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      makeText(gameState, x, y, "red", "-" + lost, 20, 400 + lost);
    }
  }
}

export function spawnExplosion(
  gameState: GameState,
  count: number,
  x: number,
  y: number,
  color: string,
) {
  if (!!isOptionOn("basic")) return;

  if (liveCount(gameState.particles) > getCurrentMaxParticles()) {
    // Avoid freezing when lots of explosion happen at once
    count = 1;
  }
  for (let i = 0; i < count; i++) {
    makeParticle(
      gameState,

      x + ((Math.random() - 0.5) * gameState.brickWidth) / 2,
      y + ((Math.random() - 0.5) * gameState.brickWidth) / 2,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      color,
      false,
    );
  }
}

export function spawnImplosion(
  gameState: GameState,
  count: number,
  x: number,
  y: number,
  color: string,
) {
  if (!!isOptionOn("basic")) return;

  if (liveCount(gameState.particles) > getCurrentMaxParticles()) {
    // Avoid freezing when lots of explosion happen at once
    count = 1;
  }
  for (let i = 0; i < count; i++) {
    const dx = ((Math.random() - 0.5) * gameState.brickWidth) / 2;
    const dy = ((Math.random() - 0.5) * gameState.brickWidth) / 2;
    makeParticle(gameState, x - dx * 10, y - dy * 10, dx, dy, color, false);
  }
}

export function explosionAt(
  gameState: GameState,
  index: number,
  x: number,
  y: number,
  ball: Ball,
  extraSize: number = 0,
) {
  const size =
    1 +
    gameState.perks.bigger_explosions +
    Math.max(0, gameState.perks.implosions - 1) +
    extraSize;
  schedulGameSound(gameState, "explode", ball.x, 1);
  if (index !== -1) {
    const col = index % gameState.gridSize;
    const row = Math.floor(index / gameState.gridSize);
    // Break bricks around
    for (let dx = -size; dx <= size; dx++) {
      for (let dy = -size; dy <= size; dy++) {
        const i = getRowColIndex(gameState, row + dy, col + dx);
        if (gameState.bricks[i] && i !== -1) {
          // Study bricks resist explosions too
          gameState.brickHP[i]--;
          if (gameState.brickHP[i] <= 0) {
            explodeBrick(gameState, i, ball, true);
          }
        }
      }
    }
  }

  const factor = gameState.perks.implosions ? -1 : 1;
  // Blow nearby coins
  forEachLiveOne(gameState.coins, (c) => {
    const dx = c.x - x;
    const dy = c.y - y;
    const d2 = Math.max(gameState.brickWidth, Math.abs(dx) + Math.abs(dy));
    c.vx += (((dx / d2) * 10 * size) / c.weight) * factor;
    c.vy += (((dy / d2) * 10 * size) / c.weight) * factor;
  });
  gameState.lastExplosion = Date.now();

  // makeLight(gameState, x, y, "white", gameState.brickWidth * 2, 150);
  if (gameState.perks.implosions) {
    spawnImplosion(gameState, 7 * size, x, y, "white");
  } else {
    spawnExplosion(gameState, 7 * size, x, y, "white");
  }

  gameState.runStatistics.bricks_broken++;

  if (gameState.perks.zen) {
    resetCombo(gameState, x, y);
  }
}

export function explodeBrick(
  gameState: GameState,
  index: number,
  ball: Ball,
  isExplosion: boolean,
) {
  const color = gameState.bricks[index];
  if (!color) return;

  const wasPickyEaterPossible =
    gameState.perks.picky_eater && isPickyEatingPossible(gameState);
  const redRowReach = reachRedRowIndex(gameState);

  gameState.lastBrickBroken = gameState.levelTime;

  if (color === "black") {
    const x = brickCenterX(gameState, index),
      y = brickCenterY(gameState, index);

    // if (color === "transparent") {
    //     schedulGameSound(gameState, "void", x, 1);
    //     resetCombo(gameState, x, y);
    // }
    setBrick(gameState, index, "");
    explosionAt(gameState, index, x, y, ball, 0);
  } else if (color) {
    // Even if it bounces we don't want to count that as a miss

    // Flashing is take care of by the tick loop
    const x = brickCenterX(gameState, index),
      y = brickCenterY(gameState, index);

    setBrick(gameState, index, "");

    let coinsToSpawn = gameState.combo;
    if (gameState.perks.sturdy_bricks) {
      // +10% per level
      coinsToSpawn += Math.ceil(
        ((2 + gameState.perks.sturdy_bricks) / 2) * coinsToSpawn,
      );
    }

    gameState.levelSpawnedCoins += coinsToSpawn;
    gameState.runStatistics.coins_spawned += coinsToSpawn;
    gameState.runStatistics.bricks_broken++;
    const maxCoins = getCurrentMaxCoins() * (isOptionOn("basic") ? 0.5 : 1);
    const spawnableCoins =
      liveCount(gameState.coins) > getCurrentMaxCoins()
        ? 1
        : Math.floor(maxCoins - liveCount(gameState.coins)) / 3;

    const pointsPerCoin = Math.max(1, Math.ceil(coinsToSpawn / spawnableCoins));

    while (coinsToSpawn > 0) {
      const points = Math.min(pointsPerCoin, coinsToSpawn);
      if (points < 0 || isNaN(points)) {
        console.error({ points });
        debugger;
      }

      coinsToSpawn -= points;

      const cx =
          x +
          (Math.random() - 0.5) * (gameState.brickWidth - gameState.coinSize),
        cy =
          y +
          (Math.random() - 0.5) * (gameState.brickWidth - gameState.coinSize);
      makeCoin(
        gameState,
        cx,
        cy,
        ball.previousVX * (0.5 + Math.random()),
        ball.previousVY * (0.5 + Math.random()),
        gameState.perks.metamorphosis || isOptionOn("colorful_coins")
          ? color
          : "gold",
        points,
      );
    }

    increaseCombo(
      gameState,
      gameState.perks.streak_shots +
        gameState.perks.compound_interest +
        gameState.perks.left_is_lava +
        gameState.perks.right_is_lava +
        gameState.perks.top_is_lava +
        gameState.perks.picky_eater +
        gameState.perks.asceticism * 3 +
        gameState.perks.zen +
        gameState.perks.passive_income +
        gameState.perks.addiction +
        gameState.perks.unbounded,
      ball.x,
      ball.y,
    );

    if (gameState.perks.side_kick) {
      if (Math.abs(ball.vx) > Math.abs(ball.vy)) {
        increaseCombo(gameState, gameState.perks.side_kick, ball.x, ball.y);
      } else {
        decreaseCombo(gameState, gameState.perks.side_kick, ball.x, ball.y);
      }
    }

    if (redRowReach !== -1) {
      if (Math.floor(index / gameState.level.size) === redRowReach) {
        resetCombo(gameState, x, y);
      } else {
        for (let x = 0; x < gameState.level.size; x++) {
          if (gameState.bricks[redRowReach * gameState.level.size + x])
            gameState.combo++;
        }
      }
    }

    if (isMovingWhilePassiveIncome(gameState)) {
      resetCombo(gameState, x, y);
    }

    if (!isExplosion) {
      // color change
      if (
        (gameState.perks.picky_eater || gameState.perks.pierce_color) &&
        color !== gameState.ballsColor &&
        color
      ) {
        if (wasPickyEaterPossible) {
          resetCombo(gameState, ball.x, ball.y);
        }
        schedulGameSound(gameState, "colorChange", ball.x, 0.8);
        gameState.lastExplosion = gameState.levelTime;
        gameState.ballsColor = color;
        if (!isOptionOn("basic")) {
          gameState.balls.forEach((ball) => {
            spawnExplosion(gameState, 7, ball.previousX, ball.previousY, color);
          });
        }
      } else {
        schedulGameSound(gameState, "comboIncreaseMaybe", ball.x, 1);
      }
    }
    // makeLight(gameState, x, y, color, gameState.brickWidth, 40);

    spawnExplosion(gameState, 5 + Math.min(gameState.combo, 30), x, y, color);
  }

  if (
    gameState.perks.respawn &&
    color !== "black" &&
    !gameState.bricks[index]
  ) {
    if (Math.random() < comboKeepingRate(gameState.perks.respawn)) {
      append(gameState.respawns, (b) => {
        b.color = color;
        b.index = index;
        b.time = gameState.levelTime + (3 * 1000) / gameState.perks.respawn;
      });
    }
  }
}

export function dontOfferTooSoon(gameState: GameState, id: PerkId) {
  gameState.lastOffered[id] = Math.round(Date.now() / 1000);
}

export function pickRandomUpgrades(gameState: GameState, count: number) {
  let list = getPossibleUpgrades(gameState)
    .map((u) => ({
      ...u,
      score: Math.random() + (gameState.lastOffered[u.id] || 0),
    }))
    .sort((a, b) => a.score - b.score)
    .filter((u) => gameState.perks[u.id] < u.max - gameState.bannedPerks[u.id])
    .slice(0, count)
    .sort((a, b) => (a.id > b.id ? 1 : -1));

  list.forEach((u) => {
    dontOfferTooSoon(gameState, u.id);
  });

  return list.map((u) => ({
    text:
      u.name +
      (gameState.perks[u.id]
        ? t("level_up.upgrade_perk_to_level", {
            level: gameState.perks[u.id] + 1,
          })
        : ""),
    icon: icons["icon:" + u.id],
    value: u.id as PerkId,
    help: u.help(gameState.perks[u.id] + 1),
  }));
}

export function schedulGameSound(
  gameState: GameState,
  sound: keyof GameState["aboutToPlaySound"],
  x: number | void,
  vol: number,
) {
  if (!vol) return;
  x ??= gameState.offsetX + gameState.gameZoneWidth / 2;
  const ex = gameState.aboutToPlaySound[sound] as { vol: number; x: number };

  ex.x = (x * vol + ex.x * ex.vol) / (vol + ex.vol);
  ex.vol += vol;
}

export function addToScore(gameState: GameState, coin: Coin) {
  gameState.score += coin.points;
  gameState.lastScoreIncrease = gameState.levelTime;
  addToTotalScore(gameState, coin.points);
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem(
      "breakout-3-hs-" + gameState.mode,
      gameState.score.toString(),
    );
  }
  if (!isOptionOn("basic")) {
    makeParticle(
      gameState,
      coin.previousX,
      coin.previousY,
      (gameState.canvasWidth - coin.x) / 100,
      -coin.y / 100,
      coin.color,
      true,
      gameState.coinSize / 2,
      100 + Math.random() * 50,
    );
  }

  schedulGameSound(gameState, "coinCatch", coin.x, 1);
  gameState.runStatistics.score += coin.points;
  if (gameState.perks.asceticism) {
    resetCombo(gameState, coin.x, coin.y);
  }
}

export async function gotoNextLoop(gameState: GameState) {
  pause(false);
  gameState.loop++;
  gameState.runStatistics.loops++;
  gameState.runLevels = getRunLevels(gameState.totalScoreAtRunStart, {});
  gameState.upgradesOfferedFor = -1;

  let comboText = "";
  if (gameState.rerolls) {
    comboText = t("loop.converted_rerolls", { n: gameState.rerolls });
    gameState.baseCombo += gameState.rerolls;
    gameState.rerolls = 0;
  } else {
    comboText = t("loop.no_rerolls");
  }

  const userPerks = upgrades.filter((u) => gameState.perks[u.id]);

  const keep = await requiredAsyncAlert<PerkId>({
    title: t("loop.title", { loop: gameState.loop }),
    content: [
      t("loop.instructions"),
      comboText,
      ...userPerks
        .filter((u) => u.id !== "instant_upgrade")
        .map((u) => {
          return {
            text:
              u.name +
              t("level_up.upgrade_perk_to_level", {
                level: gameState.perks[u.id] + 1,
              }),
            icon: u.icon,
            value: u.id,
            help: u.help(gameState.perks[u.id] + 1),
          };
        }),
    ],
  });
  // Decrease max level of all perks
  userPerks.forEach((u) => {
    if (u.id !== keep) {
      gameState.bannedPerks[u.id] += gameState.perks[u.id];
    }
  });

  // Increase max level of kept perk by 2
  gameState.bannedPerks[keep] -= 2;

  // Increase current level of kept perk by 1
  Object.assign(gameState.perks, makeEmptyPerksMap(upgrades), {
    [keep]: gameState.perks[keep] + 1,
  });

  await setLevel(gameState, 0);
}
function recordBestWorstLevelScore(gameState: GameState) {
  const levelScore = gameState.score - gameState.levelStartScore;
  const { runStatistics } = gameState;
  if (
    runStatistics.best_level_score === -1 ||
    runStatistics.best_level_score < levelScore
  ) {
    runStatistics.best_level_score = levelScore;
  }
  if (
    runStatistics.worst_level_score === -1 ||
    runStatistics.worst_level_score > levelScore
  ) {
    runStatistics.worst_level_score = levelScore;
  }
}

export async function setLevel(gameState: GameState, l: number) {
  // Here to alleviate double upgrades issues
  if (gameState.upgradesOfferedFor >= l) {
    debugger;
    return console.warn("Extra upgrade request ignored ");
  }
  gameState.upgradesOfferedFor = l;
  pause(false);
  stopRecording();
  recordBestWorstLevelScore(gameState);

  if (gameState.mode === "creative") {
    await openCreativeModePerksPicker(gameState, l);
  } else if (l > 0) {
    await openUpgradesPicker(gameState);
  }
  gameState.currentLevel = l;

  gameState.level = gameState.runLevels[l];

  gameState.levelTime = 0;
  gameState.winAt = 0;
  gameState.levelWallBounces = 0;
  gameState.lastPuckMove = 0;
  gameState.autoCleanUses = 0;
  gameState.lastTickDown = gameState.levelTime;
  gameState.levelStartScore = gameState.score;
  gameState.levelSpawnedCoins = 0;
  gameState.levelLostCoins = 0;
  gameState.levelMisses = 0;
  gameState.lastBrickBroken = 0;
  gameState.runStatistics.levelsPlayed++;

  // Reset combo silently
  const finalCombo = gameState.combo;
  gameState.combo = baseCombo(gameState);
  if (gameState.perks.shunt) {
    gameState.combo += Math.round(
      Math.max(
        0,
        (finalCombo - gameState.combo) *
          comboKeepingRate(gameState.perks.shunt),
      ),
    );
  }

  gameState.combo += gameState.perks.hot_start * 30;

  const lvl = currentLevelInfo(gameState);
  if (lvl.size !== gameState.gridSize) {
    gameState.gridSize = lvl.size;
    fitSize();
  }
  gameState.levelLostCoins += empty(gameState.coins);
  empty(gameState.particles);
  empty(gameState.lights);
  empty(gameState.texts);
  empty(gameState.respawns);
  gameState.bricks = [];
  for (let i = 0; i < lvl.size * lvl.size; i++) {
    setBrick(gameState, i, lvl.bricks[i]);
  }

  // Balls color will depend on most common brick color sometimes
  resetBalls(gameState);
  gameState.needsRender = true;
  // This caused problems with accented characters like the ô of côte d'ivoire for odd reasons
  // background.src = 'data:image/svg+xml;base64,' + btoa(lvl.svg)
  background.src = "data:image/svg+xml;UTF8," + lvl.svg;

  document.body.style.setProperty("--level-background", lvl.color || "#000");
  gameState.readyToRender = true;
}

function setBrick(gameState: GameState, index: number, color: string) {
  gameState.bricks[index] = color || "";
  gameState.brickHP[index] =
    (color === "black" && 1) ||
    (color && 1 + gameState.perks.sturdy_bricks) ||
    0;
}

export function rainbowColor(): colorString {
  return `hsl(${(Math.round(gameState.levelTime / 4) * 2) % 360},100%,70%)`;
}

export function repulse(
  gameState: GameState,
  a: Ball,
  b: BallLike,
  power: number,
  impactsBToo: boolean,
) {
  const distance = distanceBetween(a, b);
  // Ensure we don't get soft locked
  const max = gameState.gameZoneWidth / 4;
  if (distance > max) return;
  // Unit vector
  const dx = (a.x - b.x) / distance;
  const dy = (a.y - b.y) / distance;
  const fact =
    (((-power * (max - distance)) / (max * 1.2) / 3) *
      Math.min(500, gameState.levelTime)) /
    500;
  if (
    impactsBToo &&
    typeof b.vx !== "undefined" &&
    typeof b.vy !== "undefined"
  ) {
    b.vx += dx * fact;
    b.vy += dy * fact;
  }
  a.vx -= dx * fact;
  a.vy -= dy * fact;

  const speed = 10;
  const rand = 2;
  makeParticle(
    gameState,
    a.x,
    a.y,
    -dx * speed + a.vx + (Math.random() - 0.5) * rand,
    -dy * speed + a.vy + (Math.random() - 0.5) * rand,
    rainbowColor(),
    true,
    gameState.coinSize / 2,
    100,
  );
  if (
    impactsBToo &&
    typeof b.vx !== "undefined" &&
    typeof b.vy !== "undefined"
  ) {
    makeParticle(
      gameState,
      b.x,
      b.y,
      dx * speed + b.vx + (Math.random() - 0.5) * rand,
      dy * speed + b.vy + (Math.random() - 0.5) * rand,
      rainbowColor(),
      true,
      gameState.coinSize / 2,
      100,
    );
  }
}

export function attract(gameState: GameState, a: Ball, b: Ball, power: number) {
  const distance = distanceBetween(a, b);
  // Ensure we don't get soft locked
  const min = (gameState.gameZoneWidth * 3) / 4;
  if (distance < min) return;
  // Unit vector
  const dx = (a.x - b.x) / distance;
  const dy = (a.y - b.y) / distance;

  const fact =
    (((power * (distance - min)) / min) * Math.min(500, gameState.levelTime)) /
    500;
  b.vx += dx * fact;
  b.vy += dy * fact;
  a.vx -= dx * fact;
  a.vy -= dy * fact;

  const speed = 10;
  const rand = 2;

  makeParticle(
    gameState,
    a.x,
    a.y,
    dx * speed + a.vx + (Math.random() - 0.5) * rand,
    dy * speed + a.vy + (Math.random() - 0.5) * rand,
    rainbowColor(),
    true,
    gameState.coinSize / 2,
    100,
  );
  makeParticle(
    gameState,
    b.x,
    b.y,
    -dx * speed + b.vx + (Math.random() - 0.5) * rand,
    -dy * speed + b.vy + (Math.random() - 0.5) * rand,
    rainbowColor(),
    true,
    gameState.coinSize / 2,
    100,
  );
}

export function coinBrickHitCheck(gameState: GameState, coin: Coin) {
  // Make ball/coin bonce, and return bricks that were hit
  const radius = coin.size / 2;
  const { x, y, previousX, previousY } = coin;

  const vhit = hitsSomething(previousX, y, radius);
  const hhit = hitsSomething(x, previousY, radius);
  const chit =
    (typeof vhit == "undefined" &&
      typeof hhit == "undefined" &&
      hitsSomething(x, y, radius)) ||
    undefined;

  if (gameState.perks.ghost_coins) {
    //     slow down
    if (typeof (vhit ?? hhit ?? chit) !== "undefined") {
      coin.vy *= 1 - 0.2 / gameState.perks.ghost_coins;
      coin.vx *= 1 - 0.2 / gameState.perks.ghost_coins;
    }
  } else {
    if (typeof vhit !== "undefined" || typeof chit !== "undefined") {
      coin.y = coin.previousY;
      coin.vy *= -1;

      //   Roll on corners
      const leftHit = gameState.bricks[brickIndex(x - radius, y + radius)];
      const rightHit = gameState.bricks[brickIndex(x + radius, y + radius)];

      if (leftHit && !rightHit) {
        coin.vx += 1;
        coin.sa -= 1;
      }
      if (!leftHit && rightHit) {
        coin.vx -= 1;
        coin.sa += 1;
      }
    }
    if (typeof hhit !== "undefined" || typeof chit !== "undefined") {
      coin.x = coin.previousX;
      coin.vx *= -1;
    }
  }
  return vhit ?? hhit ?? chit;
}

export function bordersHitCheck(
  gameState: GameState,
  coin: Coin | Ball,
  radius: number,
  delta: number,
) {
  if (coin.destroyed) return;
  coin.previousX = coin.x;
  coin.previousY = coin.y;
  coin.x += coin.vx * delta;
  coin.y += coin.vy * delta;

  if (gameState.perks.wind) {
    coin.vx +=
      ((gameState.puckPosition -
        (gameState.offsetX + gameState.gameZoneWidth / 2)) /
        gameState.gameZoneWidth) *
      gameState.perks.wind *
      0.5;
  }

  let vhit = 0,
    hhit = 0;

  if (
    coin.x < gameState.offsetXRoundedDown + radius &&
    !gameState.perks.unbounded
  ) {
    coin.x =
      gameState.offsetXRoundedDown +
      radius +
      (gameState.offsetXRoundedDown + radius - coin.x);
    coin.vx *= -1;
    hhit = 1;
  }
  if (coin.y < radius && gameState.perks.unbounded < 2) {
    coin.y = radius + (radius - coin.y);
    coin.vy *= -1;
    vhit = 1;
  }
  if (
    coin.x > gameState.canvasWidth - gameState.offsetXRoundedDown - radius &&
    !gameState.perks.unbounded
  ) {
    coin.x =
      gameState.canvasWidth -
      gameState.offsetXRoundedDown -
      radius -
      (coin.x -
        (gameState.canvasWidth - gameState.offsetXRoundedDown - radius));
    coin.vx *= -1;
    hhit = 1;
  }

  return hhit + vhit * 2;
}

export function gameStateTick(
  gameState: GameState,
  // How many frames to compute at once, can go above 1 to compensate lag
  frames = 1,
) {
  gameState.runStatistics.max_combo = Math.max(
    gameState.runStatistics.max_combo,
    gameState.combo,
  );

  if (
    gameState.perks.addiction &&
    gameState.lastBrickBroken &&
    gameState.lastBrickBroken <
      gameState.levelTime - 5000 / gameState.perks.addiction
  ) {
    resetCombo(
      gameState,
      gameState.puckPosition,
      gameState.gameZoneHeight - gameState.puckHeight * 2,
    );
  }

  gameState.balls = gameState.balls.filter((ball) => !ball.destroyed);

  const remainingBricks = gameState.bricks.filter(
    (b) => b && b !== "black",
  ).length;

  if (!remainingBricks && gameState.lastBrickBroken) {
    // Avoid a combo reset just because we're waiting for coins
    gameState.lastBrickBroken = 0;
  }

  if (
    gameState.levelTime > gameState.lastTickDown + 1000 &&
    gameState.perks.hot_start
  ) {
    gameState.lastTickDown = gameState.levelTime;
    decreaseCombo(
      gameState,
      gameState.perks.hot_start,
      gameState.puckPosition,
      gameState.gameZoneHeight - 2 * gameState.puckHeight,
    );
  }

  if (
    remainingBricks <= gameState.perks.skip_last &&
    !gameState.autoCleanUses
  ) {
    gameState.bricks.forEach((type, index) => {
      if (type) {
        explodeBrick(gameState, index, gameState.balls[0], true);
      }
    });
    gameState.autoCleanUses++;
  }

  const hasPendingBricks = liveCount(gameState.respawns);

  if (gameState.running && !remainingBricks && !hasPendingBricks) {
    if (!gameState.winAt) {
      gameState.winAt = gameState.levelTime + 5000;
    }
  } else {
    gameState.winAt = 0;
  }

  if (
    (gameState.running &&
      // Delayed win when coins are still flying
      gameState.winAt &&
      gameState.levelTime > gameState.winAt) ||
    //   instant win condition
    (gameState.levelTime && !remainingBricks && !liveCount(gameState.coins))
  ) {
    if (gameState.currentLevel + 1 < max_levels(gameState)) {
      setLevel(gameState, gameState.currentLevel + 1);
    } else if (gameState.loop < (gameState.mode === "long" ? 7 : 0)) {
      gotoNextLoop(gameState);
    } else {
      gameOver(
        t("gameOver.7_loop.title", { loop: gameState.loop }),
        t("gameOver.7_loop.summary", { score: gameState.score }),
      );
    }
  } else if (gameState.running || gameState.levelTime) {
    const coinRadius = Math.round(gameState.coinSize / 2);

    forEachLiveOne(gameState.coins, (coin, coinIndex) => {
      if (gameState.perks.coin_magnet) {
        const strength =
          (100 /
            (100 +
              Math.pow(coin.y - gameState.gameZoneHeight, 2) +
              Math.pow(coin.x - gameState.puckPosition, 2))) *
          gameState.perks.coin_magnet;

        const attractionX =
          frames * (gameState.puckPosition - coin.x) * strength;

        coin.vx += attractionX;
        coin.vy +=
          (frames * (gameState.gameZoneHeight - coin.y) * strength) / 2;
        coin.sa -= attractionX / 10;
      }

      if (gameState.perks.ball_attracts_coins) {
        gameState.balls.forEach((ball) => {
          const d2 = distance2(ball, coin);
          coin.vx +=
            ((ball.x - coin.x) / d2) * 50 * gameState.perks.ball_attracts_coins;
          coin.vy +=
            ((ball.y - coin.y) / d2) * 50 * gameState.perks.ball_attracts_coins;
        });
      }

      const ratio =
        1 -
        ((gameState.perks.viscosity * 0.03 + 0.005) * frames) /
          (1 + gameState.perks.etherealcoins);

      coin.vy *= ratio;
      coin.vx *= ratio;
      if (coin.vx > 7 * gameState.baseSpeed) coin.vx = 7 * gameState.baseSpeed;
      if (coin.vx < -7 * gameState.baseSpeed)
        coin.vx = -7 * gameState.baseSpeed;
      if (coin.vy > 7 * gameState.baseSpeed) coin.vy = 7 * gameState.baseSpeed;
      if (coin.vy < -7 * gameState.baseSpeed)
        coin.vy = -7 * gameState.baseSpeed;
      coin.a += coin.sa;

      // Gravity
      if (!gameState.perks.etherealcoins) {
        const flip =
          gameState.perks.helium > 0 &&
          Math.abs(coin.x - gameState.puckPosition) * 2 >
            gameState.puckWidth + coin.size;
        coin.vy +=
          frames * coin.weight * 0.8 * (flip ? -gameState.perks.helium : 1);
        if (flip && !isOptionOn("basic") && Math.random() < 0.1) {
          makeParticle(
            gameState,
            coin.x,
            coin.y,
            0,
            gameState.baseSpeed,
            coin.color,
            true,
            5,
            250,
          );
        }
      }

      const speed = (Math.abs(coin.vx) + Math.abs(coin.vy)) * 10;
      const hitBorder = bordersHitCheck(gameState, coin, coin.size / 2, frames);

      if (
        coin.y > gameState.gameZoneHeight - coinRadius - gameState.puckHeight &&
        coin.y < gameState.gameZoneHeight + gameState.puckHeight + coin.vy &&
        Math.abs(coin.x - gameState.puckPosition) <
          coinRadius +
            gameState.puckWidth / 2 +
            // a bit of margin to be nice , negative in case it's a negative coin
            gameState.puckHeight * (coin.points ? 1 : -1)
      ) {
        addToScore(gameState, coin);

        destroy(gameState.coins, coinIndex);
      } else if (coin.y > gameState.canvasHeight + coinRadius) {
        gameState.levelLostCoins += coin.points;
        destroy(gameState.coins, coinIndex);
        if (gameState.perks.compound_interest) {
          resetCombo(gameState, coin.x, gameState.gameZoneHeight - 20);
        }
      } else if (
        gameState.perks.unbounded &&
        (coin.x < -gameState.gameZoneWidth / 2 ||
          coin.x > gameState.canvasWidth + gameState.gameZoneWidth / 2 ||
          coin.y < -gameState.gameZoneWidth)
      ) {
        // Out of bound on sides
        gameState.levelLostCoins += coin.points;
        destroy(gameState.coins, coinIndex);
      }

      const hitBrick = coinBrickHitCheck(gameState, coin);
      if (gameState.perks.metamorphosis && typeof hitBrick !== "undefined") {
        if (
          gameState.bricks[hitBrick] &&
          coin.color !== gameState.bricks[hitBrick] &&
          gameState.bricks[hitBrick] !== "black" &&
          coin.metamorphosisPoints
        ) {
          // Not using setbrick because we don't want to reset HP
          gameState.bricks[hitBrick] = coin.color;
          coin.metamorphosisPoints--;

          schedulGameSound(gameState, "colorChange", coin.x, 0.3);
        }
      }

      if (
        (!gameState.perks.ghost_coins && typeof hitBrick !== "undefined") ||
        hitBorder
      ) {
        coin.vx *= 0.8;
        coin.vy *= 0.8;
        coin.sa *= 0.9;
        if (speed > 20 && !coin.collidedLastFrame) {
          schedulGameSound(gameState, "coinBounce", coin.x, 0.2);
        }
        coin.collidedLastFrame = true;

        if (Math.abs(coin.vy) < 3) {
          coin.vy = 0;
        }
      } else {
        coin.collidedLastFrame = false;
      }
    });

    gameState.balls.forEach((ball) => ballTick(gameState, ball, frames));

    if (gameState.perks.shocks) {
      gameState.balls.forEach((a, ai) =>
        gameState.balls.forEach((b, bi) => {
          if (
            ai < bi &&
            !a.destroyed &&
            !b.destroyed &&
            distance2(a, b) < gameState.ballSize * gameState.ballSize
          ) {
            let tempVx = a.vx;
            let tempVy = a.vy;
            a.vx = b.vx;
            a.vy = b.vy;
            b.vx = tempVx;
            b.vy = tempVy;

            let x = (a.x + b.x) / 2;
            let y = (a.y + b.y) / 2;
            const limit = gameState.baseSpeed;
            a.vx +=
              clamp(a.x - x, -limit, limit) +
              ((Math.random() - 0.5) * limit) / 3;
            a.vy +=
              clamp(a.y - y, -limit, limit) +
              ((Math.random() - 0.5) * limit) / 3;
            b.vx +=
              clamp(b.x - x, -limit, limit) +
              ((Math.random() - 0.5) * limit) / 3;
            b.vy +=
              clamp(b.y - y, -limit, limit) +
              ((Math.random() - 0.5) * limit) / 3;

            let index = brickIndex(x, y);
            explosionAt(
              gameState,
              index,
              x,
              y,
              a,
              Math.max(0, gameState.perks.shocks - 1),
            );
          }
        }),
      );
    }

    if (gameState.perks.wind) {
      const windD =
        ((gameState.puckPosition -
          (gameState.offsetX + gameState.gameZoneWidth / 2)) /
          gameState.gameZoneWidth) *
        2 *
        gameState.perks.wind;
      for (let i = 0; i < gameState.perks.wind; i++) {
        if (Math.random() * Math.abs(windD) > 0.5) {
          makeParticle(
            gameState,
            gameState.offsetXRoundedDown +
              Math.random() * gameState.gameZoneWidthRoundedUp,
            Math.random() * gameState.gameZoneHeight,
            windD * 8,
            0,
            rainbowColor(),
            true,
            gameState.coinSize / 2,
            150,
          );
        }
      }
    }
    forEachLiveOne(gameState.particles, (flash, index) => {
      flash.x += flash.vx * frames;
      flash.y += flash.vy * frames;
      if (!flash.ethereal) {
        flash.vy += 0.5;
        if (hasBrick(brickIndex(flash.x, flash.y))) {
          destroy(gameState.particles, index);
        }
      }
    });
  }

  if (
    gameState.combo > baseCombo(gameState) &&
    !isOptionOn("basic") &&
    (gameState.combo - baseCombo(gameState)) * Math.random() > 5
  ) {
    // The red should still be visible on a white bg

    if (gameState.perks.top_is_lava) {
      makeParticle(
        gameState,
        gameState.offsetXRoundedDown +
          Math.random() * gameState.gameZoneWidthRoundedUp,
        0,
        (Math.random() - 0.5) * 10,
        5,
        "red",
        true,
        gameState.coinSize / 2,
        100 * (Math.random() + 1),
      );
    }

    if (gameState.perks.left_is_lava) {
      makeParticle(
        gameState,
        gameState.offsetXRoundedDown,
        Math.random() * gameState.gameZoneHeight,
        5,
        (Math.random() - 0.5) * 10,
        "red",
        true,
        gameState.coinSize / 2,
        100 * (Math.random() + 1),
      );
    }

    if (gameState.perks.right_is_lava) {
      makeParticle(
        gameState,
        gameState.offsetXRoundedDown + gameState.gameZoneWidthRoundedUp,
        Math.random() * gameState.gameZoneHeight,
        -5,
        (Math.random() - 0.5) * 10,
        "red",
        true,
        gameState.coinSize / 2,
        100 * (Math.random() + 1),
      );
    }

    if (gameState.perks.compound_interest) {
      let x = gameState.puckPosition,
        attemps = 0;
      do {
        x =
          gameState.offsetXRoundedDown +
          gameState.gameZoneWidthRoundedUp * Math.random();
        attemps++;
      } while (
        Math.abs(x - gameState.puckPosition) < gameState.puckWidth / 2 &&
        attemps < 10
      );

      makeParticle(
        gameState,
        x,
        gameState.gameZoneHeight,
        (Math.random() - 0.5) * 10,
        -5,
        "red",
        true,
        gameState.coinSize / 2,
        100 * (Math.random() + 1),
      );
    }
    if (gameState.perks.streak_shots) {
      const pos = 0.5 - Math.random();
      makeParticle(
        gameState,
        gameState.puckPosition + gameState.puckWidth * pos,
        gameState.gameZoneHeight - gameState.puckHeight,
        pos * 10,
        -5,
        "red",
        true,
        gameState.coinSize / 2,
        100 * (Math.random() + 1),
      );
    }
  }

  // Respawn what's needed, show particles
  forEachLiveOne(gameState.respawns, (r, ri) => {
    if (gameState.bricks[r.index]) {
      destroy(gameState.respawns, ri);
    } else if (gameState.levelTime > r.time) {
      setBrick(gameState, r.index, r.color);
      destroy(gameState.respawns, ri);
    } else {
      const { index, color } = r;
      const vertical = Math.random() > 0.5;
      const dx = Math.random() > 0.5 ? 1 : -1;
      const dy = Math.random() > 0.5 ? 1 : -1;

      makeParticle(
        gameState,
        brickCenterX(gameState, index) + (dx * gameState.brickWidth) / 2,
        brickCenterY(gameState, index) + (dy * gameState.brickWidth) / 2,
        vertical ? 0 : -dx * gameState.baseSpeed,
        vertical ? -dy * gameState.baseSpeed : 0,
        color,
        true,
        gameState.coinSize / 2,
        250,
      );
    }
  });

  forEachLiveOne(gameState.particles, (p, pi) => {
    if (gameState.levelTime > p.time + p.duration) {
      destroy(gameState.particles, pi);
    }
  });
  forEachLiveOne(gameState.texts, (p, pi) => {
    if (gameState.levelTime > p.time + p.duration) {
      destroy(gameState.texts, pi);
    }
  });
  forEachLiveOne(gameState.lights, (p, pi) => {
    if (gameState.levelTime > p.time + p.duration) {
      destroy(gameState.lights, pi);
    }
  });
}

export function ballTick(gameState: GameState, ball: Ball, delta: number) {
  ball.previousVX = ball.vx;
  ball.previousVY = ball.vy;

  let speedLimitDampener =
    1 +
    gameState.perks.telekinesis +
    gameState.perks.ball_repulse_ball +
    gameState.perks.puck_repulse_ball +
    gameState.perks.ball_attract_ball;

  if (isTelekinesisActive(gameState, ball)) {
    speedLimitDampener += 3;
    ball.vx +=
      ((gameState.puckPosition - ball.x) / 1000) *
      delta *
      gameState.perks.telekinesis;
  }
  if (isYoyoActive(gameState, ball)) {
    speedLimitDampener += 3;
    ball.vx +=
      ((gameState.puckPosition - ball.x) / 1000) * delta * gameState.perks.yoyo;
  }
  if (
    ball.vx * ball.vx + ball.vy * ball.vy <
    gameState.baseSpeed * gameState.baseSpeed * 2
  ) {
    ball.vx *= 1 + 0.02 / speedLimitDampener;
    ball.vy *= 1 + 0.02 / speedLimitDampener;
  } else {
    ball.vx *= 1 - 0.02 / speedLimitDampener;
    ball.vy *= 1 - 0.02 / speedLimitDampener;
  }
  // Ball could get stuck horizontally because of ball-ball interactions in repulse/attract
  if (Math.abs(ball.vy) < 0.2 * gameState.baseSpeed) {
    ball.vy += ((ball.vy > 0 ? 1 : -1) * 0.02) / speedLimitDampener;
  }

  if (gameState.perks.ball_repulse_ball) {
    for (let b2 of gameState.balls) {
      // avoid computing this twice, and repulsing itself
      if (b2.x >= ball.x) continue;
      repulse(gameState, ball, b2, gameState.perks.ball_repulse_ball, true);
    }
  }
  if (gameState.perks.ball_attract_ball) {
    for (let b2 of gameState.balls) {
      // avoid computing this twice, and repulsing itself
      if (b2.x >= ball.x) continue;
      attract(gameState, ball, b2, gameState.perks.ball_attract_ball);
    }
  }
  if (
    gameState.perks.puck_repulse_ball &&
    Math.abs(ball.x - gameState.puckPosition) <
      gameState.puckWidth / 2 +
        (gameState.ballSize * (9 + gameState.perks.puck_repulse_ball)) / 10
  ) {
    repulse(
      gameState,
      ball,
      {
        x: gameState.puckPosition,
        y: gameState.gameZoneHeight,
      },
      gameState.perks.puck_repulse_ball + 1,
      false,
    );
  }

  const borderHitCode = bordersHitCheck(
    gameState,
    ball,
    gameState.ballSize / 2,
    delta,
  );
  if (borderHitCode) {
    if (
      gameState.perks.left_is_lava &&
      borderHitCode % 2 &&
      ball.x < gameState.offsetX + gameState.gameZoneWidth / 2
    ) {
      resetCombo(gameState, ball.x, ball.y);
    }

    if (
      gameState.perks.right_is_lava &&
      borderHitCode % 2 &&
      ball.x > gameState.offsetX + gameState.gameZoneWidth / 2
    ) {
      resetCombo(gameState, ball.x, ball.y);
    }

    if (gameState.perks.top_is_lava && borderHitCode >= 2) {
      resetCombo(gameState, ball.x, ball.y + gameState.ballSize);
    }
    if (gameState.perks.trampoline) {
      decreaseCombo(
        gameState,
        gameState.perks.trampoline,
        ball.x,
        ball.y + gameState.ballSize,
      );
    }

    schedulGameSound(gameState, "wallBeep", ball.x, 1);
    gameState.levelWallBounces++;
    gameState.runStatistics.wall_bounces++;
  }

  // Puck collision
  const ylimit =
    gameState.gameZoneHeight - gameState.puckHeight - gameState.ballSize / 2;
  const ballIsUnderPuck =
    Math.abs(ball.x - gameState.puckPosition) <
    gameState.ballSize / 2 + gameState.puckWidth / 2;
  if (
    ball.y > ylimit &&
    ball.vy > 0 &&
    (ballIsUnderPuck ||
      (gameState.perks.extra_life &&
        ball.y > ylimit + gameState.puckHeight / 2))
  ) {
    if (ballIsUnderPuck) {
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const angle = Math.atan2(
        -gameState.puckWidth / 2,
        (ball.x - gameState.puckPosition) *
          (gameState.perks.concave_puck
            ? -1 / (1 + gameState.perks.concave_puck)
            : 1),
      );
      ball.vx = speed * Math.cos(angle);
      ball.vy = speed * Math.sin(angle);
      schedulGameSound(gameState, "wallBeep", ball.x, 1);
    } else {
      ball.vy *= -1;
      justLostALife(gameState, ball, ball.x, ball.y);
    }
    if (gameState.perks.streak_shots) {
      resetCombo(gameState, ball.x, ball.y);
    }
    if (gameState.perks.trampoline) {
      increaseCombo(gameState, gameState.perks.trampoline, ball.x, ball.y);
    }
    if (
      gameState.perks.nbricks &&
      ball.hitSinceBounce < gameState.perks.nbricks
    ) {
      resetCombo(gameState, ball.x, ball.y);
    }

    if (!ball.hitSinceBounce && gameState.bricks.find((i) => i)) {
      gameState.runStatistics.misses++;
      if (gameState.perks.forgiving) {
        const loss = Math.floor(
          (gameState.levelMisses / 10 / gameState.perks.forgiving) *
            (gameState.combo - baseCombo(gameState)),
        );
        decreaseCombo(gameState, loss, ball.x, ball.y - gameState.ballSize);
      } else {
        resetCombo(gameState, ball.x, ball.y);
      }
      gameState.levelMisses++;
      makeText(
        gameState,
        gameState.puckPosition,
        gameState.gameZoneHeight - gameState.puckHeight * 2,
        "red",
        t("play.missed_ball"),
        gameState.puckHeight,
        500,
      );
    }
    gameState.runStatistics.puck_bounces++;
    ball.hitSinceBounce = 0;
    ball.brokenSinceBounce = 0;
    ball.sapperUses = 0;
    ball.piercePoints = gameState.perks.pierce * 3;
  }

  const lostOnSides =
    (gameState.perks.unbounded && ball.x < -gameState.gameZoneWidth / 2) ||
    ball.x > gameState.canvasWidth + gameState.gameZoneWidth / 2;

  const lostInTheSky =
    gameState.perks.unbounded > 1 && ball.y < -gameState.gameZoneWidth / 2;

  if (
    gameState.running &&
    (ball.y > gameState.gameZoneHeight + gameState.ballSize / 2 ||
      lostOnSides ||
      lostInTheSky)
  ) {
    ball.destroyed = true;
    gameState.runStatistics.balls_lost++;
    if (!gameState.balls.find((b) => !b.destroyed)) {
      gameOver(
        t("gameOver.lost.title"),
        t("gameOver.lost.summary", { score: gameState.score }),
      );
    }
  }
  const radius = gameState.ballSize / 2;
  // Make ball/coin bonce, and return bricks that were hit
  const { x, y, previousX, previousY } = ball;

  const vhit = hitsSomething(previousX, y, radius);
  const hhit = hitsSomething(x, previousY, radius);
  const chit =
    (typeof vhit == "undefined" &&
      typeof hhit == "undefined" &&
      hitsSomething(x, y, radius)) ||
    undefined;

  const hitBrick = vhit ?? hhit ?? chit;

  if (typeof hitBrick !== "undefined") {
    const initialBrickColor = gameState.bricks[hitBrick];
    ball.hitSinceBounce++;

    if (gameState.perks.nbricks) {
      if (ball.hitSinceBounce > gameState.perks.nbricks) {
        resetCombo(gameState, ball.x, ball.y);
      } else {
        increaseCombo(gameState, gameState.perks.nbricks, ball.x, ball.y);
      }
      // We need to reset at each hit, otherwise it's just an OP version of single puck hit streak
    }

    let pierce = false;
    let damage =
      1 +
      (shouldPierceByColor(gameState, vhit, hhit, chit)
        ? gameState.perks.pierce_color
        : 0);

    gameState.brickHP[hitBrick] -= damage;

    const used = Math.min(
      ball.piercePoints,
      Math.max(1, gameState.brickHP[hitBrick] + 1),
    );
    gameState.brickHP[hitBrick] -= used;
    ball.piercePoints -= used;

    if (gameState.brickHP[hitBrick] < 0) {
      gameState.brickHP[hitBrick] = 0;
      pierce = true;
    }
    if (typeof vhit !== "undefined" || typeof chit !== "undefined") {
      if (!pierce) {
        ball.y = ball.previousY;
        ball.vy *= -1;
      }
    }
    if (typeof hhit !== "undefined" || typeof chit !== "undefined") {
      if (!pierce) {
        ball.x = ball.previousX;
        ball.vx *= -1;
      }
    }

    if (!gameState.brickHP[hitBrick]) {
      ball.brokenSinceBounce++;

      explodeBrick(gameState, hitBrick, ball, false);
      if (
        ball.sapperUses < gameState.perks.sapper &&
        initialBrickColor !== "black" && // don't replace a brick that bounced with sturdy_bricks
        !gameState.bricks[hitBrick]
      ) {
        setBrick(gameState, hitBrick, "black");
        ball.sapperUses++;
      }
    } else {
      schedulGameSound(gameState, "wallBeep", x, 1);
      makeLight(
        gameState,
        brickCenterX(gameState, hitBrick),
        brickCenterY(gameState, hitBrick),
        "white",
        gameState.brickWidth + 2,
        50 * gameState.brickHP[hitBrick],
      );
    }
  }

  if (!isOptionOn("basic")) {
    const remainingPierce = ball.piercePoints;
    const remainingSapper = ball.sapperUses < gameState.perks.sapper;
    const willMiss =
      isOptionOn("red_miss") && ball.vy > 0 && !ball.hitSinceBounce;
    const extraCombo = gameState.combo - 1;
    if (
      willMiss ||
      (extraCombo && Math.random() > 0.1 / (1 + extraCombo)) ||
      (remainingSapper && Math.random() > 0.1 / (1 + remainingSapper)) ||
      (extraCombo && Math.random() > 0.1 / (1 + extraCombo))
    ) {
      const color =
        (remainingSapper && (Math.random() > 0.5 ? "orange" : "red")) ||
        (willMiss && "red") ||
        gameState.ballsColor;

      makeParticle(
        gameState,
        ball.x,
        ball.y,
        gameState.perks.pierce_color || remainingPierce
          ? -ball.vx + ((Math.random() - 0.5) * gameState.baseSpeed) / 3
          : (Math.random() - 0.5) * gameState.baseSpeed,
        gameState.perks.pierce_color || remainingPierce
          ? -ball.vy + ((Math.random() - 0.5) * gameState.baseSpeed) / 3
          : (Math.random() - 0.5) * gameState.baseSpeed,
        color,
        true,
        gameState.coinSize / 2,
        100,
      );
    }
  }
}

function justLostALife(gameState: GameState, ball: Ball, x: number, y: number) {
  gameState.perks.extra_life -= 1;
  if (gameState.perks.extra_life < 0) {
    gameState.perks.extra_life = 0;
  } else if (gameState.perks.sacrifice) {
    gameState.combo *= gameState.perks.sacrifice;
    gameState.bricks.forEach(
      (color, index) => color && explodeBrick(gameState, index, ball, true),
    );
  }

  schedulGameSound(gameState, "lifeLost", ball.x, 1);

  if (!isOptionOn("basic")) {
    for (let i = 0; i < 10; i++)
      makeParticle(
        gameState,
        x,
        y,
        Math.random() * gameState.baseSpeed * 3,
        gameState.baseSpeed * 3,
        "red",
        false,
        gameState.coinSize / 2,
        150,
      );
  }
}

function makeCoin(
  gameState: GameState,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color = "gold",
  points = 1,
) {
  let weight = 0.8 + Math.random() * 0.2 + Math.min(2, points * 0.01);
  weight *= 5 / (5 + gameState.perks.etherealcoins);

  append(gameState.coins, (p: Partial<Coin>) => {
    p.x = x;
    p.y = y;
    p.collidedLastFrame = true;
    p.size = gameState.coinSize;
    p.previousX = x;
    p.previousY = y;
    p.vx = vx;
    p.vy = vy;
    // p.sx = 0;
    // p.sy = 0;
    p.color = color;
    p.a = Math.random() * Math.PI * 2;
    p.sa = Math.random() - 0.5;
    p.points = points;
    p.weight = weight;
    p.metamorphosisPoints = gameState.perks.metamorphosis;
  });
}

function makeParticle(
  gameState: GameState,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: colorString,
  ethereal = false,
  size = 8,
  duration = 150,
) {
  append(gameState.particles, (p: Partial<ParticleFlash>) => {
    p.time = gameState.levelTime;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.duration = duration;
    p.ethereal = ethereal;
  });
}

function makeText(
  gameState: GameState,
  x: number,
  y: number,
  color: colorString,
  text: string,
  size = 20,
  duration = 500,
) {
  append(gameState.texts, (p: Partial<TextFlash>) => {
    p.time = gameState.levelTime;
    p.x = x;
    p.y = y;
    p.color = color;
    p.size = size;
    p.duration = clamp(duration, 400, 2000);
    p.text = text;
  });
}

function makeLight(
  gameState: GameState,
  x: number,
  y: number,
  color: colorString,
  size = 8,
  duration = 150,
) {
  append(gameState.lights, (p: Partial<LightFlash>) => {
    p.time = gameState.levelTime;
    p.x = x;
    p.y = y;
    p.color = color;
    p.size = size;
    p.duration = duration;
  });
}

export function append<T>(
  where: ReusableArray<T>,
  makeItem: (match: Partial<T>) => void,
) {
  while (
    where.list[where.indexMin] &&
    !where.list[where.indexMin].destroyed &&
    where.indexMin < where.list.length
  ) {
    where.indexMin++;
  }
  if (where.indexMin < where.list.length) {
    where.list[where.indexMin].destroyed = false;
    makeItem(where.list[where.indexMin]);
    where.indexMin++;
  } else {
    const p = { destroyed: false };
    makeItem(p);
    where.list.push(p);
  }
  where.total++;
}

export function destroy<T>(where: ReusableArray<T>, index: number) {
  if (where.list[index].destroyed) return;
  where.list[index].destroyed = true;
  where.indexMin = Math.min(where.indexMin, index);
  where.total--;
}

export function liveCount<T>(where: ReusableArray<T>) {
  return where.total;
}

export function empty<T>(where: ReusableArray<T>) {
  let destroyed = 0;
  where.total = 0;
  where.indexMin = 0;
  where.list.forEach((i) => {
    if (!i.destroyed) {
      i.destroyed = true;
      destroyed++;
    }
  });
  return destroyed;
}

export function forEachLiveOne<T>(
  where: ReusableArray<T>,
  cb: (t: T, index: number) => void,
) {
  where.list.forEach((item: T, index: number) => {
    if (item && !item.destroyed) {
      cb(item, index);
    }
  });
}
