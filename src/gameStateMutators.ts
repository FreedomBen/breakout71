import { Ball, BallLike, Coin, colorString, GameState, PerkId } from "./types";
import { sounds } from "./sounds";
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
      sparks: 0,
      piercedSinceBounce: 0,
      hitSinceBounce: 0,
      hitItem: [],
      sapperUses: 0,
    });
  }
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

  if (!gameState.running && !gameState.levelTime) {
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
  if (!gameState.levelTime) {
    gameState.combo += gameState.perks.hot_start * 15;
  }
  if (prev > gameState.combo && gameState.perks.soft_reset) {
    gameState.combo += Math.floor(
      ((prev - gameState.combo) * (gameState.perks.soft_reset * 10)) / 100,
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

export function spawnExplosion(
  gameState: GameState,
  count: number,
  x: number,
  y: number,
  color: string,
  duration = 150,
  size = gameState.coinSize,
) {
  if (!!isOptionOn("basic")) return;
  if (gameState.flashes.length > gameState.MAX_PARTICLES) {
    // Avoid freezing when lots of explosion happen at once
    count = 1;
  }
  for (let i = 0; i < count; i++) {
    gameState.flashes.push({
      type: "particle",
      time: gameState.levelTime,
      size,
      x: x + ((Math.random() - 0.5) * gameState.brickWidth) / 2,
      y: y + ((Math.random() - 0.5) * gameState.brickWidth) / 2,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      color,
      duration,
      ethereal: false,
    });
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

    sounds.explode(ball.x);

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
    gameState.coins.forEach((c) => {
      const dx = c.x - x;
      const dy = c.y - y;
      const d2 = Math.max(gameState.brickWidth, Math.abs(dx) + Math.abs(dy));
      c.vx += ((dx / d2) * 10 * size) / c.weight;
      c.vy += ((dy / d2) * 10 * size) / c.weight;
    });
    gameState.lastExplosion = Date.now();

    gameState.flashes.push({
      type: "ball",
      duration: 150,
      time: gameState.levelTime,
      size: gameState.brickWidth * 2,
      color: "white",
      x,
      y,
    });
    spawnExplosion(
      gameState,
      7 * (1 + gameState.perks.bigger_explosions),
      x,
      y,
      "white",
      150,
      gameState.coinSize,
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

    // coins = coins.filter((c) => !c.destroyed);
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
      gameState.coins.length > gameState.MAX_COINS
        ? 1
        : Math.floor(maxCoins - gameState.coins.length) / 3;

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

      gameState.coins.push({
        points,
        size: gameState.coinSize, //-Math.floor(Math.log2(points)),
        color: gameState.perks.metamorphosis ? color : "gold",
        x: cx,
        y: cy,
        previousX: cx,
        previousY: cy,
        // Use previous speed because the ball has already bounced
        vx: ball.previousVX * (0.5 + Math.random()),
        vy: ball.previousVY * (0.5 + Math.random()),
        sx: 0,
        sy: 0,
        a: Math.random() * Math.PI * 2,
        sa: Math.random() - 0.5,
        weight: 0.8 + Math.random() * 0.2,
      });
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
        sounds.colorChange(ball.x, 0.8);
        gameState.lastExplosion = gameState.levelTime;
        gameState.ballsColor = color;
        if (!isOptionOn("basic")) {
          gameState.balls.forEach((ball) => {
            spawnExplosion(
              gameState,
              7,
              ball.previousX,
              ball.previousY,
              color,
              150,
              15,
            );
          });
        }
      } else {
        sounds.comboIncreaseMaybe(gameState.combo, ball.x, 1);
      }
    }

    gameState.flashes.push({
      type: "ball",
      duration: 40,
      time: gameState.levelTime,
      size: gameState.brickWidth,
      color: color,
      x,
      y,
    });
    spawnExplosion(
      gameState,
      5 + Math.min(gameState.combo, 30),
      x,
      y,
      color,
      150,
      gameState.coinSize / 2,
    );
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

export function addToScore(gameState: GameState, coin: Coin) {
  coin.destroyed = true;
  gameState.score += coin.points;
  gameState.lastScoreIncrease = gameState.levelTime;

  addToTotalScore(gameState, coin.points);
  if (gameState.score > gameState.highScore && !gameState.isCreativeModeRun) {
    gameState.highScore = gameState.score;
    localStorage.setItem("breakout-3-hs", gameState.score.toString());
  }
  if (!isOptionOn("basic")) {
    gameState.flashes.push({
      type: "particle",
      duration: 100 + Math.random() * 50,
      time: gameState.levelTime,
      size: gameState.coinSize / 2,
      color: coin.color,
      x: coin.previousX,
      y: coin.previousY,
      vx: (gameState.canvasWidth - coin.x) / 100,
      vy: -coin.y / 100,
      ethereal: true,
    });
  }

  if (Date.now() - gameState.lastPlayedCoinGrab > 16) {
    gameState.lastPlayedCoinGrab = Date.now();
    sounds.coinCatch(coin.x);
  }
  gameState.runStatistics.score += coin.points;
}

export function setLevel(gameState: GameState, l: number) {
  stopRecording();
  pause(false);
  if (l > 0) {
    openUpgradesPicker(gameState);
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

  resetCombo(gameState, undefined, undefined);
  resetBalls(gameState);

  const lvl = currentLevelInfo(gameState);
  if (lvl.size !== gameState.gridSize) {
    gameState.gridSize = lvl.size;
    fitSize();
  }
  gameState.coins = [];
  gameState.bricks = [...lvl.bricks];
  gameState.flashes = [];

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
  const max = gameState.gameZoneWidth / 2;
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
  gameState.flashes.push({
    type: "particle",
    duration: 100,
    time: gameState.levelTime,
    size: gameState.coinSize / 2,
    color: rainbowColor(),
    ethereal: true,
    x: a.x,
    y: a.y,
    vx: -dx * speed + a.vx + (Math.random() - 0.5) * rand,
    vy: -dy * speed + a.vy + (Math.random() - 0.5) * rand,
  });
  if (
    impactsBToo &&
    typeof b.vx !== "undefined" &&
    typeof b.vy !== "undefined"
  ) {
    gameState.flashes.push({
      type: "particle",
      duration: 100,
      time: gameState.levelTime,
      size: gameState.coinSize / 2,
      color: rainbowColor(),
      ethereal: true,
      x: b.x,
      y: b.y,
      vx: dx * speed + b.vx + (Math.random() - 0.5) * rand,
      vy: dy * speed + b.vy + (Math.random() - 0.5) * rand,
    });
  }
}

export function attract(gameState: GameState, a: Ball, b: Ball, power: number) {
  const distance = distanceBetween(a, b);
  // Ensure we don't get soft locked
  const min = gameState.gameZoneWidth * 0.5;
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
  gameState.flashes.push({
    type: "particle",
    duration: 100,
    time: gameState.levelTime,
    size: gameState.coinSize / 2,
    color: rainbowColor(),
    ethereal: true,
    x: a.x,
    y: a.y,
    vx: dx * speed + a.vx + (Math.random() - 0.5) * rand,
    vy: dy * speed + a.vy + (Math.random() - 0.5) * rand,
  });
  gameState.flashes.push({
    type: "particle",
    duration: 100,
    time: gameState.levelTime,
    size: gameState.coinSize / 2,
    color: rainbowColor(),
    ethereal: true,
    x: b.x,
    y: b.y,
    vx: -dx * speed + b.vx + (Math.random() - 0.5) * rand,
    vy: -dy * speed + b.vy + (Math.random() - 0.5) * rand,
  });
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

  gameState.coins = gameState.coins.filter((coin) => !coin.destroyed);
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
  if (!remainingBricks && !gameState.coins.length) {
    if (gameState.currentLevel + 1 < max_levels(gameState)) {
      setLevel(gameState, gameState.currentLevel + 1);
    } else {
      gameOver(
        t("gameOver.win.title"),
        t("gameOver.win.summary", { score: gameState.score }),
      );
    }
  } else if (gameState.running || gameState.levelTime) {
    let playedCoinBounce = false;
    const coinRadius = Math.round(gameState.coinSize / 2);

    gameState.coins.forEach((coin) => {
      if (coin.destroyed) return;
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
      } else if (coin.y > gameState.canvasHeight + coinRadius) {
        coin.destroyed = true;
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
          sounds.colorChange(coin.x, 0.3);
        }
      }
      if (typeof hitBrick !== "undefined" || hitBorder) {
        coin.vx *= 0.8;
        coin.vy *= 0.8;
        coin.sa *= 0.9;
        if (speed > 20 && !playedCoinBounce) {
          playedCoinBounce = true;
          sounds.coinBounce(coin.x, 0.2);
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
          gameState.flashes.push({
            type: "particle",
            duration: 150,
            ethereal: true,
            time: gameState.levelTime,
            size: gameState.coinSize / 2,
            color: rainbowColor(),
            x:
              gameState.offsetXRoundedDown +
              Math.random() * gameState.gameZoneWidthRoundedUp,
            y: Math.random() * gameState.gameZoneHeight,
            vx: windD * 8,
            vy: 0,
          });
        }
      }
    }

    gameState.flashes.forEach((flash) => {
      if (flash.type === "particle") {
        flash.x += flash.vx * frames;
        flash.y += flash.vy * frames;
        if (!flash.ethereal) {
          flash.vy += 0.5;
          if (hasBrick(brickIndex(flash.x, flash.y))) {
            flash.destroyed = true;
          }
        }
      }
    });
  }

  if (gameState.combo > baseCombo(gameState)) {
    // The red should still be visible on a white bg
    const baseParticle = !isOptionOn("basic") &&
      (gameState.combo - baseCombo(gameState)) * Math.random() > 5 &&
      gameState.running && {
        type: "particle" as const,
        duration: 100 * (Math.random() + 1),
        time: gameState.levelTime,
        size: gameState.coinSize / 2,
        color: "red",
        ethereal: true,
      };

    if (gameState.perks.top_is_lava) {
      baseParticle &&
        gameState.flashes.push({
          ...baseParticle,
          x:
            gameState.offsetXRoundedDown +
            Math.random() * gameState.gameZoneWidthRoundedUp,
          y: 0,
          vx: (Math.random() - 0.5) * 10,
          vy: 5,
        });
    }

    if (gameState.perks.left_is_lava && baseParticle) {
      gameState.flashes.push({
        ...baseParticle,
        x: gameState.offsetXRoundedDown,
        y: Math.random() * gameState.gameZoneHeight,
        vx: 5,
        vy: (Math.random() - 0.5) * 10,
      });
    }

    if (gameState.perks.right_is_lava && baseParticle) {
      gameState.flashes.push({
        ...baseParticle,
        x: gameState.offsetXRoundedDown + gameState.gameZoneWidthRoundedUp,
        y: Math.random() * gameState.gameZoneHeight,
        vx: -5,
        vy: (Math.random() - 0.5) * 10,
      });
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
      baseParticle &&
        gameState.flashes.push({
          ...baseParticle,
          x,
          y: gameState.gameZoneHeight,
          vx: (Math.random() - 0.5) * 10,
          vy: -5,
        });
    }
    if (gameState.perks.streak_shots) {
      const pos = 0.5 - Math.random();
      baseParticle &&
        gameState.flashes.push({
          ...baseParticle,
          duration: 100,
          x: gameState.puckPosition + gameState.puckWidth * pos,
          y: gameState.gameZoneHeight - gameState.puckHeight,
          vx: pos * 10,
          vy: -5,
        });
    }
  }
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

      gameState.flashes.push({
        type: "particle",
        duration: 250,
        ethereal: true,
        time: gameState.levelTime,
        size: gameState.coinSize / 2,
        color,
        x: brickCenterX(gameState, index) + (dx * gameState.brickWidth) / 2,
        y: brickCenterY(gameState, index) + (dy * gameState.brickWidth) / 2,
        vx: vertical ? 0 : -dx * gameState.baseSpeed,
        vy: vertical ? -dy * gameState.baseSpeed : 0,
      });
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
    sounds.wallBeep(ball.x);
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
      sounds.wallBeep(ball.x);
    } else {
      ball.vy *= -1;
      gameState.perks.extra_life = Math.max(0, gameState.perks.extra_life - 1);
      sounds.lifeLost(ball.x);
      if (!isOptionOn("basic")) {
        for (let i = 0; i < 10; i++)
          gameState.flashes.push({
            type: "particle",
            ethereal: false,
            color: "red",
            destroyed: false,
            duration: 150,
            size: gameState.coinSize / 2,
            time: gameState.levelTime,
            x: ball.x,
            y: ball.y,
            vx: Math.random() * gameState.baseSpeed * 3,
            vy: gameState.baseSpeed * 3,
          });
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
      gameState.flashes.push({
        type: "text",
        text: t("play.missed_ball"),
        duration: 500,
        time: gameState.levelTime,
        size: gameState.puckHeight * 1.5,
        color: "red",
        x: gameState.puckPosition,
        y: gameState.gameZoneHeight - gameState.puckHeight * 2,
      });
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
    sounds.wallBeep(x);
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
    ball.sparks += (delta * (gameState.combo - 1)) / 30;
    if (ball.sparks > 1) {
      gameState.flashes.push({
        type: "particle",
        duration: 100 * ball.sparks,
        time: gameState.levelTime,
        size: gameState.coinSize / 2,
        color: gameState.ballsColor,
        x: ball.x,
        y: ball.y,
        vx: (Math.random() - 0.5) * gameState.baseSpeed,
        vy: (Math.random() - 0.5) * gameState.baseSpeed,
        ethereal: false,
      });
      ball.sparks = 0;
    }
  }
}
