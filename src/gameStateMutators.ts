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
  currentLevelInfo,
  distanceBetween,
  getMajorityValue,
  getPossibleUpgrades,
  getRowColIndex,
  isTelekinesisActive,
  max_levels,
} from "./game_utils";
import { t } from "./i18n/i18n";
import { icons } from "./loadGameData";

import { addToTotalScore } from "./settings";
import { background } from "./render";
import { gameOver } from "./gameOver";
import {
  bordersHitCheck,
  brickIndex,
  coinBrickHitCheck,
  fitSize,
  gameState,
  hasBrick,
  hitsSomething,
  openUpgradesPicker,
  pause,
  shouldPierceByColor,
} from "./game";
import { stopRecording } from "./recording";
import { isOptionOn } from "./options";

export function setMousePos(gameState: GameState, x: number) {
  // Sets the puck position, and updates the ball position if they are supposed to follow it
  gameState.puckPosition = x;
  gameState.needsRender = true;
}

function getBallDefaultVx(gameState: GameState) {
  return (
    (gameState.perks.concave_puck ? 0 : 1) *
    (Math.random() > 0.5 ? gameState.baseSpeed : -gameState.baseSpeed)
  );
}

export function resetBalls(gameState: GameState) {
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

      sx: 0,
      sy: 0,
      piercedSinceBounce: 0,
      hitSinceBounce: 0,
      hitItem: [],
      sapperUses: 0,
    });
  }
  gameState.ballStickToPuck = true;
}

export function putBallsAtPuck(gameState: GameState) {
  // This reset could be abused to cheat quite easily
  const count = gameState.balls.length;
  const perBall = gameState.puckWidth / (count + 1);
  const vx = getBallDefaultVx(gameState);
  gameState.balls.forEach((ball, i) => {
    const x =
      gameState.puckPosition - gameState.puckWidth / 2 + perBall * (i + 1);

    ball.x = x;
    ball.previousX = x;
    ball.y = gameState.gameZoneHeight - 1.5 * gameState.ballSize;
    ball.previousY = ball.y;
    ball.vx = vx;
    ball.previousVX = ball.vx;
    ball.vy = -gameState.baseSpeed;
    ball.previousVY = ball.vy;
    ball.sx = 0;
    ball.sy = 0;
    ball.hitItem = [];
    ball.hitSinceBounce = 0;
    ball.piercedSinceBounce = 0;
  });
}

export function normalizeGameState(gameState: GameState) {
  // This function resets most parameters on the state to correct values, and should be used even when the game is paused

  gameState.baseSpeed = Math.max(
    3,
    gameState.gameZoneWidth / 12 / 10 +
      gameState.currentLevel / 3 +
      gameState.levelTime / (30 * 1000) -
      gameState.perks.slow_down * 2,
  );

  gameState.puckWidth =
    (gameState.gameZoneWidth / 12) *
    (3 - gameState.perks.smaller_puck + gameState.perks.bigger_puck);

  if (
    gameState.puckPosition <
    gameState.offsetXRoundedDown + gameState.puckWidth / 2
  ) {
    gameState.puckPosition =
      gameState.offsetXRoundedDown + gameState.puckWidth / 2;
  }
  if (
    gameState.puckPosition >
    gameState.offsetXRoundedDown +
      gameState.gameZoneWidthRoundedUp -
      gameState.puckWidth / 2
  ) {
    gameState.puckPosition =
      gameState.offsetXRoundedDown +
      gameState.gameZoneWidthRoundedUp -
      gameState.puckWidth / 2;
  }
  if (gameState.ballStickToPuck) {
    putBallsAtPuck(gameState);
  }
}

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

  if (prev > gameState.combo && gameState.perks.soft_reset) {
    gameState.combo += Math.floor(
      ((prev - gameState.combo) * (gameState.perks.soft_reset * 10)) / 100,
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
      makeText(gameState, x, y, "red", "-" + lost, 20, 150);
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
    schedulGameSound(gameState, "comboDecrease", x, 1);
    if (typeof x !== "undefined" && typeof y !== "undefined") {
      makeText(gameState, x, y, "red", "-" + lost, 20, 300);
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

  if (liveCount(gameState.particles) > gameState.MAX_PARTICLES) {
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

export function explodeBrick(
  gameState: GameState,
  index: number,
  ball: Ball,
  isExplosion: boolean,
) {
  const color = gameState.bricks[index];
  if (!color) return;

  if (color === "black") {
    delete gameState.bricks[index];
    const x = brickCenterX(gameState, index),
      y = brickCenterY(gameState, index);
    schedulGameSound(gameState, "explode", ball.x, 1);

    const col = index % gameState.gridSize;
    const row = Math.floor(index / gameState.gridSize);
    const size = 1 + gameState.perks.bigger_explosions;
    // Break bricks around
    for (let dx = -size; dx <= size; dx++) {
      for (let dy = -size; dy <= size; dy++) {
        const i = getRowColIndex(gameState, row + dy, col + dx);
        if (gameState.bricks[i] && i !== -1) {
          // Study bricks resist explosions too
          if (
            gameState.bricks[i] !== "black" &&
            gameState.perks.sturdy_bricks > Math.random() * 5
          )
            continue;
          explodeBrick(gameState, i, ball, true);
        }
      }
    }

    // Blow nearby coins
    forEachLiveOne(gameState.coins, (c) => {
      const dx = c.x - x;
      const dy = c.y - y;
      const d2 = Math.max(gameState.brickWidth, Math.abs(dx) + Math.abs(dy));
      c.vx += ((dx / d2) * 10 * size) / c.weight;
      c.vy += ((dy / d2) * 10 * size) / c.weight;
    });
    gameState.lastExplosion = Date.now();

    makeLight(gameState, x, y, "white", gameState.brickWidth * 2, 150);

    spawnExplosion(
      gameState,
      7 * (1 + gameState.perks.bigger_explosions),
      x,
      y,
      "white",
    );
    ball.hitSinceBounce++;
    gameState.runStatistics.bricks_broken++;
  } else if (color) {
    // Even if it bounces we don't want to count that as a miss
    ball.hitSinceBounce++;

    // Flashing is take care of by the tick loop
    const x = brickCenterX(gameState, index),
      y = brickCenterY(gameState, index);

    gameState.bricks[index] = "";

    let coinsToSpawn = gameState.combo;
    if (gameState.perks.sturdy_bricks) {
      // +10% per level
      coinsToSpawn += Math.ceil(
        ((10 + gameState.perks.sturdy_bricks) / 10) * coinsToSpawn,
      );
    }

    gameState.levelSpawnedCoins += coinsToSpawn;
    gameState.runStatistics.coins_spawned += coinsToSpawn;
    gameState.runStatistics.bricks_broken++;
    const maxCoins = gameState.MAX_COINS * (isOptionOn("basic") ? 0.5 : 1);
    const spawnableCoins =
      liveCount(gameState.coins) > gameState.MAX_COINS
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
        gameState.perks.metamorphosis ? color : "gold",
        points,
      );
    }

    gameState.combo += Math.max(
      0,
      gameState.perks.streak_shots +
        gameState.perks.compound_interest +
        gameState.perks.left_is_lava +
        gameState.perks.right_is_lava +
        gameState.perks.top_is_lava +
        gameState.perks.picky_eater,
    );

    if (!isExplosion) {
      // color change
      if (
        (gameState.perks.picky_eater || gameState.perks.pierce_color) &&
        color !== gameState.ballsColor &&
        color
      ) {
        if (gameState.perks.picky_eater) {
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
    makeLight(gameState, x, y, color, gameState.brickWidth, 40);

    spawnExplosion(gameState, 5 + Math.min(gameState.combo, 30), x, y, color);
  }

  if (!gameState.bricks[index] && color !== "black") {
    ball.hitItem?.push({
      index,
      color,
    });
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
    .filter((u) => gameState.perks[u.id] < u.max)
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
  if (gameState.score > gameState.highScore && !gameState.isCreativeModeRun) {
    gameState.highScore = gameState.score;
    localStorage.setItem("breakout-3-hs", gameState.score.toString());
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

  if (Date.now() - gameState.lastPlayedCoinGrab > 16) {
    gameState.lastPlayedCoinGrab = Date.now();

    schedulGameSound(gameState, "coinCatch", coin.x, 1);
  }
  gameState.runStatistics.score += coin.points;
}

export async function setLevel(gameState: GameState, l: number) {
  stopRecording();
  pause(false);
  if (l > 0) {
    await openUpgradesPicker(gameState);
  }
  gameState.currentLevel = l;
  gameState.levelTime = 0;
  gameState.levelWallBounces = 0;
  gameState.autoCleanUses = 0;
  gameState.lastTickDown = gameState.levelTime;
  gameState.levelStartScore = gameState.score;
  gameState.levelSpawnedCoins = 0;
  gameState.levelMisses = 0;
  gameState.runStatistics.levelsPlayed++;

  // Reset combo silently
  gameState.combo = baseCombo(gameState) + gameState.perks.hot_start * 15;

  resetBalls(gameState);

  const lvl = currentLevelInfo(gameState);
  if (lvl.size !== gameState.gridSize) {
    gameState.gridSize = lvl.size;
    fitSize();
  }
  empty(gameState.coins);
  empty(gameState.particles);
  empty(gameState.lights);
  empty(gameState.texts);
  gameState.bricks = [...lvl.bricks];
  gameState.needsRender = true;
  // This caused problems with accented characters like the ô of côte d'ivoire for odd reasons
  // background.src = 'data:image/svg+xml;base64,' + btoa(lvl.svg)
  background.src = "data:image/svg+xml;UTF8," + lvl.svg;
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

export function gameStateTick(
  gameState: GameState,
  // How many frames to compute at once, can go above 1 to compensate lag
  frames = 1,
) {
  gameState.runStatistics.max_combo = Math.max(
    gameState.runStatistics.max_combo,
    gameState.combo,
  );

  gameState.balls = gameState.balls.filter((ball) => !ball.destroyed);

  const remainingBricks = gameState.bricks.filter(
    (b) => b && b !== "black",
  ).length;

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
  if (!remainingBricks && !liveCount(gameState.coins)) {
    if (gameState.currentLevel + 1 < max_levels(gameState)) {
      setLevel(gameState, gameState.currentLevel + 1);
    } else {
      gameOver(
        t("gameOver.win.title"),
        t("gameOver.win.summary", { score: gameState.score }),
      );
    }
  } else if (gameState.running || gameState.levelTime) {
    const coinRadius = Math.round(gameState.coinSize / 2);

    forEachLiveOne(gameState.coins, (coin, coinIndex) => {
      if (gameState.perks.coin_magnet) {
        const attractionX =
          ((frames * (gameState.puckPosition - coin.x)) /
            (100 +
              Math.pow(coin.y - gameState.gameZoneHeight, 2) +
              Math.pow(coin.x - gameState.puckPosition, 2))) *
          gameState.perks.coin_magnet *
          100;
        coin.vx += attractionX;
        coin.sa -= attractionX / 10;
      }

      const ratio = 1 - (gameState.perks.viscosity * 0.03 + 0.005) * frames;

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
      coin.vy += frames * coin.weight * 0.8;

      const speed = Math.abs(coin.sx) + Math.abs(coin.sx);
      const hitBorder = bordersHitCheck(coin, coin.size / 2, frames);

      if (
        coin.y > gameState.gameZoneHeight - coinRadius - gameState.puckHeight &&
        coin.y < gameState.gameZoneHeight + gameState.puckHeight + coin.vy &&
        Math.abs(coin.x - gameState.puckPosition) <
          coinRadius +
            gameState.puckWidth / 2 + // a bit of margin to be nice
            gameState.puckHeight
      ) {
        addToScore(gameState, coin);
        destroy(gameState.coins, coinIndex);
      } else if (coin.y > gameState.canvasHeight + coinRadius) {
        destroy(gameState.coins, coinIndex);
        if (gameState.perks.compound_interest) {
          resetCombo(gameState, coin.x, coin.y);
        }
      }

      const hitBrick = coinBrickHitCheck(coin);

      if (gameState.perks.metamorphosis && typeof hitBrick !== "undefined") {
        if (
          gameState.bricks[hitBrick] &&
          coin.color !== gameState.bricks[hitBrick] &&
          gameState.bricks[hitBrick] !== "black" &&
          !coin.coloredABrick
        ) {
          gameState.bricks[hitBrick] = coin.color;
          coin.coloredABrick = true;

          schedulGameSound(gameState, "colorChange", coin.x, 0.3);
        }
      }
      if (typeof hitBrick !== "undefined" || hitBorder) {
        coin.vx *= 0.8;
        coin.vy *= 0.8;
        coin.sa *= 0.9;
        if (speed > 20) {
          schedulGameSound(gameState, "coinBounce", coin.x, 0.2);
        }

        if (Math.abs(coin.vy) < 3) {
          coin.vy = 0;
        }
      }
    });

    gameState.balls.forEach((ball) => ballTick(gameState, ball, frames));

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

  if (
    gameState.perks.respawn &&
    ball.hitItem?.length > 1 &&
    !isOptionOn("basic")
  ) {
    for (
      let i = 0;
      i < ball.hitItem?.length - 1 && i < gameState.perks.respawn;
      i++
    ) {
      const { index, color } = ball.hitItem[i];
      if (gameState.bricks[index] || color === "black") continue;
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
  }

  const borderHitCode = bordersHitCheck(ball, gameState.ballSize / 2, delta);
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
          (gameState.perks.concave_puck ? -0.5 : 1),
      );
      ball.vx = speed * Math.cos(angle);
      ball.vy = speed * Math.sin(angle);
      schedulGameSound(gameState, "wallBeep", ball.x, 1);
    } else {
      ball.vy *= -1;
      gameState.perks.extra_life = Math.max(0, gameState.perks.extra_life - 1);

      schedulGameSound(gameState, "lifeLost", ball.x, 1);
      if (!isOptionOn("basic")) {
        for (let i = 0; i < 10; i++)
          makeParticle(
            gameState,
            ball.x,
            ball.y,
            Math.random() * gameState.baseSpeed * 3,
            gameState.baseSpeed * 3,
            "red",
            false,
            gameState.coinSize / 2,
            150,
          );
      }
    }
    if (gameState.perks.streak_shots) {
      resetCombo(gameState, ball.x, ball.y);
    }

    if (gameState.perks.respawn) {
      ball.hitItem
        .slice(0, -1)
        .slice(0, gameState.perks.respawn)
        .forEach(({ index, color }) => {
          if (!gameState.bricks[index] && color !== "black")
            gameState.bricks[index] = color;
        });
    }
    ball.hitItem = [];
    if (!ball.hitSinceBounce) {
      gameState.runStatistics.misses++;
      gameState.levelMisses++;
      resetCombo(gameState, ball.x, ball.y);
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
    ball.sapperUses = 0;
    ball.piercedSinceBounce = 0;
  }

  if (
    ball.y > gameState.gameZoneHeight + gameState.ballSize / 2 &&
    gameState.running
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
  let sturdyBounce =
    hitBrick &&
    gameState.bricks[hitBrick] !== "black" &&
    gameState.perks.sturdy_bricks &&
    gameState.perks.sturdy_bricks > Math.random() * 5;

  let pierce = false;
  if (sturdyBounce || typeof hitBrick === "undefined") {
    // cannot pierce
  } else if (shouldPierceByColor(vhit, hhit, chit)) {
    pierce = true;
  } else if (ball.piercedSinceBounce < gameState.perks.pierce * 3) {
    pierce = true;
    ball.piercedSinceBounce++;
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

  if (sturdyBounce) {
    schedulGameSound(gameState, "wallBeep", x, 1);
    return;
  }
  if (typeof hitBrick !== "undefined") {
    const initialBrickColor = gameState.bricks[hitBrick];

    explodeBrick(gameState, hitBrick, ball, false);

    if (
      ball.sapperUses < gameState.perks.sapper &&
      initialBrickColor !== "black" && // don't replace a brick that bounced with sturdy_bricks
      !gameState.bricks[hitBrick]
    ) {
      gameState.bricks[hitBrick] = "black";
      ball.sapperUses++;
    }
  }

  if (!isOptionOn("basic")) {
    const remainingPierce =
      gameState.perks.pierce * 3 - ball.piercedSinceBounce;
    const remainingSapper = ball.sapperUses < gameState.perks.sapper;
    const extraCombo = gameState.combo - 1;
    if (
      (extraCombo && Math.random() > 0.1 / (1 + extraCombo)) ||
      (remainingSapper && Math.random() > 0.1 / (1 + remainingSapper)) ||
      (extraCombo && Math.random() > 0.1 / (1 + extraCombo))
    ) {
      const color = remainingSapper
        ? Math.random() > 0.5
          ? "orange"
          : "red"
        : gameState.ballsColor;

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

function makeCoin(
  gameState: GameState,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color = "gold",
  points = 1,
) {
  append(gameState.coins, (p: Partial<Coin>) => {
    p.x = x;
    p.y = y;
    p.size = gameState.coinSize;
    p.previousX = x;
    p.previousY = y;
    p.vx = vx;
    p.vy = vy;
    p.sx = 0;
    p.sy = 0;
    p.color = color;
    p.a = Math.random() * Math.PI * 2;
    p.sa = Math.random() - 0.5;
    p.weight = 0.8 + Math.random() * 0.2 + Math.min(2, points * 0.01);
    p.points = points;
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
  duration = 150,
) {
  append(gameState.texts, (p: Partial<TextFlash>) => {
    p.time = gameState.levelTime;
    p.x = x;
    p.y = y;
    p.color = color;
    p.size = size;
    p.duration = duration;
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
  where.total = 0;
  where.indexMin = 0;
  where.list.forEach((i) => (i.destroyed = true));
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
