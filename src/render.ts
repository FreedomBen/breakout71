import { baseCombo, forEachLiveOne, liveCount } from "./gameStateMutators";
import {
  brickCenterX,
  brickCenterY,
  // countBricksAbove,
  // countBricksBelow,
  currentLevelInfo,
  isMovingWhilePassiveIncome,
  isPickyEatingPossible,
  telekinesisEffectRate,
  yoyoEffectRate,
  max_levels,
  reachRedRowIndex,
} from "./game_utils";
import { colorString, GameState } from "./types";
import { t } from "./i18n/i18n";
import { gameState, lastMeasuredFPS } from "./game";
import { isOptionOn } from "./options";

export const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
export const ctx = gameCanvas.getContext("2d", {
  alpha: false,
}) as CanvasRenderingContext2D;

export const bombSVG = document.createElement("img");
bombSVG.src =
  "data:image/svg+xml;base64," +
  btoa(`<svg width="144" height="144" viewBox="0 0 38.101 38.099" xmlns="http://www.w3.org/2000/svg">
 <path d="m6.1528 26.516c-2.6992-3.4942-2.9332-8.281-.58305-11.981a10.454 10.454 0 017.3701-4.7582c1.962-.27726 4.1646.05953 5.8835.90027l.45013.22017.89782-.87417c.83748-.81464.91169-.87499 1.0992-.90271.40528-.058713.58876.03425 1.1971.6116l.55451.52679 1.0821-1.0821c1.1963-1.1963 1.383-1.3357 2.1039-1.5877.57898-.20223 1.5681-.19816 2.1691.00897 1.4613.50314 2.3673 1.7622 2.3567 3.2773-.0058.95654-.24464 1.5795-.90924 2.3746-.40936.48928-.55533.81057-.57898 1.2737-.02039.41018.1109.77714.42322 1.1792.30172.38816.3694.61323.2797.93044-.12803.45666-.56674.71598-1.0242.60507-.601-.14597-1.3031-1.3088-1.3969-2.3126-.09459-1.0161.19245-1.8682.92392-2.7432.42567-.50885.5643-.82851.5643-1.3031 0-.50151-.14026-.83177-.51211-1.2028-.50966-.50966-1.0968-.64829-1.781-.41996l-.37348.12477-2.1006 2.1006.52597.55696c.45421.48194.5325.58876.57898.78855.09622.41588.07502.45014-.88396 1.4548l-.87173.9125.26339.57979a10.193 10.193 0 01.9231 4.1001c.03996 2.046-.41996 3.8082-1.4442 5.537-.55044.928-1.0185 1.5013-1.8968 2.3241-.83503.78284-1.5526 1.2827-2.4904 1.7361-3.4266 1.657-7.4721 1.3422-10.549-.82035-.73473-.51782-1.7312-1.4621-2.2515-2.1357zm21.869-4.5584c-.0579-.19734-.05871-2.2662 0-2.4545.11906-.39142.57898-.63361 1.0038-.53005.23812.05708.54147.32455.6116.5382.06279.19163.06769 2.1805.0065 2.3811-.12558.40773-.61649.67602-1.0462.57164-.234-.05708-.51615-.30498-.57568-.50722m3.0417-2.6013c-.12313-.6222.37837-1.1049 1.0479-1.0079.18348.0261.25279.08399 1.0071.83911.75838.75838.81301.82362.84074 1.0112.10193.68499-.40365 1.1938-1.034 1.0405-.1949-.0473-.28786-.12558-1.0144-.85216-.7649-.76409-.80241-.81057-.84645-1.0316m.61323-3.0629a.85623.85623 0 01.59284-.99975c.28949-.09214 2.1814-.08318 2.3917.01141.38734.17369.6279.61078.53984.98181-.06035.25606-.35391.57327-.60181.64992-.25279.07747-2.2278.053-2.4097-.03017-.26013-.11906-.46318-.36125-.51374-.61323" fill="#fff" opacity="0.3"/>
</svg>`);
bombSVG.onload = () => (gameState.needsRender = true);

export const background = document.createElement("img");
background.onload = () => (gameState.needsRender = true);
export const backgroundCanvas = document.createElement("canvas");

export const haloCanvas = document.createElement("canvas");
const haloCanvasCtx = haloCanvas.getContext("2d", {
  alpha: false,
}) as CanvasRenderingContext2D;

export const haloScale = 8;

export function render(gameState: GameState) {
  if (!gameState.readyToRender) return;
  const level = currentLevelInfo(gameState);

  const hasCombo = gameState.combo > baseCombo(gameState);
  const { width, height } = gameCanvas;
  if (!width || !height) return;

  if (gameState.currentLevel || gameState.levelTime) {
    menuLabel.innerText = gameState.loop
      ? t("play.current_lvl_loop", {
          level: gameState.currentLevel + 1,
          max: max_levels(gameState),
          loop: gameState.loop,
        })
      : t("play.current_lvl", {
          level: gameState.currentLevel + 1,
          max: max_levels(gameState),
        });
  } else {
    menuLabel.innerText = t("play.menu_label");
  }

  const catchRate = gameState.levelSpawnedCoins
    ? (gameState.levelSpawnedCoins - gameState.levelLostCoins) /
      gameState.levelSpawnedCoins
    : 1;

  scoreDisplay.innerHTML =
    (isOptionOn("show_fps")
      ? ` 
               <span class="${(Math.abs(lastMeasuredFPS - 60) < 2 && " ") || (Math.abs(lastMeasuredFPS - 60) < 10 && "good") || "bad"}">
            ${lastMeasuredFPS} FPS
        </span><span> / </span>
         
            `
      : "") +
    (isOptionOn("show_stats")
      ? ` 
        <span class="${(catchRate > 0.95 && "great") || (catchRate > 0.9 && "good") || ""}" data-tooltip="${t("play.stats.coins_catch_rate")}">
            ${Math.floor(catchRate * 100)}%
        </span><span> / </span>
        <span class="${(gameState.levelTime < 30000 && "great") || (gameState.levelTime < 60000 && "good") || ""}" data-tooltip="${t("play.stats.levelTime")}">
        ${Math.ceil(gameState.levelTime / 1000)}s 
        </span><span> / </span>
        <span class="${(gameState.levelWallBounces < 3 && "great") || (gameState.levelWallBounces < 10 && "good") || ""}" data-tooltip="${t("play.stats.levelWallBounces")}">
        ${gameState.levelWallBounces} B 
        </span><span> / </span>  
        <span class="${(gameState.levelMisses < 3 && "great") || (gameState.levelMisses < 6 && "good") || ""}" data-tooltip="${t("play.stats.levelMisses")}">
        ${gameState.levelMisses} M
        </span><span> / </span>
        `
      : "") +
    `<span class="score" data-tooltip="${t("play.score_tooltip")}">$${gameState.score}</span>`;

  scoreDisplay.className =
    gameState.lastScoreIncrease > gameState.levelTime - 500 ? "active" : "";





  // Clear
  if (!isOptionOn("basic") && level.svg && level.color === "#000000") {
    haloCanvasCtx.globalCompositeOperation = "source-over";
    haloCanvasCtx.globalAlpha = 0.9;
    haloCanvasCtx.fillStyle = level.color;
    haloCanvasCtx.fillRect(0, 0, width / haloScale, height / haloScale);

    haloCanvasCtx.globalCompositeOperation = "screen";

    forEachLiveOne(gameState.coins, (coin) => {
        const color= gameState.perks.metamorphosis || isOptionOn("colorful_coins") ?
      coin.color : 'gold';
      haloCanvasCtx.globalAlpha = 0.5;
      drawFuzzyBall(
        haloCanvasCtx,
        color,
        (gameState.coinSize * 2) / haloScale,
        coin.x / haloScale,
        coin.y / haloScale,
      );

      if (isOptionOn("extra_bright")) {
        haloCanvasCtx.globalAlpha = 0.2;
        drawFuzzyBall(
          haloCanvasCtx,
          color,
          (gameState.coinSize * 10) / haloScale,
          coin.x / haloScale,
          coin.y / haloScale,
        );
      }
    });
    gameState.balls.forEach((ball) => {
        haloCanvasCtx.globalAlpha = 0.5;
      drawFuzzyBall(
        haloCanvasCtx,
        gameState.ballsColor,
        (gameState.ballSize * 3) / haloScale,
        ball.x / haloScale,
        ball.y / haloScale,
      );
      if (isOptionOn("extra_bright")) {

        haloCanvasCtx.globalAlpha = 0.2;
        drawFuzzyBall(
            haloCanvasCtx,
            gameState.ballsColor,
            (gameState.ballSize * 6) / haloScale,
            ball.x / haloScale,
            ball.y / haloScale,
        );
      }
    });
    haloCanvasCtx.globalAlpha = isOptionOn("extra_bright") ? 0.2 : 0.05;
    gameState.bricks.forEach((color, index) => {
      if (!color) return;
      const x = brickCenterX(gameState, index),
        y = brickCenterY(gameState, index);
      drawFuzzyBall(
        haloCanvasCtx,
        color == "black" ? "#666" : color,
        (gameState.brickWidth * 2) / haloScale,
        x / haloScale,
        y / haloScale,
      );
    });

    forEachLiveOne(gameState.particles, (flash) => {
      const { x, y, time, color, size, duration } = flash;
      const elapsed = gameState.levelTime - time;
      haloCanvasCtx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2);
      drawFuzzyBall(
        haloCanvasCtx,
        color,
        (size * 3) / haloScale,
        x / haloScale,
        y / haloScale,
      );
      if (isOptionOn("extra_bright")) {
        haloCanvasCtx.globalAlpha *= 0.5
        drawFuzzyBall(
            haloCanvasCtx,
            color,
            (size * 6) / haloScale,
            x / haloScale,
            y / haloScale,
        );
      }
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(haloCanvas, 0, 0, width, height);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "multiply";
    if (level.svg && background.width && background.complete) {
      if (backgroundCanvas.title !== level.name) {
        backgroundCanvas.title = level.name;
        backgroundCanvas.width = gameState.canvasWidth;
        backgroundCanvas.height = gameState.canvasHeight;
        const bgctx = backgroundCanvas.getContext(
          "2d",
        ) as CanvasRenderingContext2D;

        bgctx.globalCompositeOperation = "source-over";
        bgctx.fillStyle = level.color || "#000";
        bgctx.fillRect(0, 0, gameState.canvasWidth, gameState.canvasHeight);
        if (gameState.perks.clairvoyant >= 3) {
          const pageSource = document.body.innerHTML.replace(/\s+/gi, "");
          const lineWidth = Math.ceil(gameState.canvasWidth / 15);
          const lines = Math.ceil(gameState.canvasHeight / 20);
          const chars = lineWidth * lines;
          let start = Math.ceil(Math.random() * (pageSource.length - chars));
          for (let i = 0; i < lines; i++) {
            bgctx.fillStyle = "white";
            bgctx.font = "20px Courier";
            bgctx.fillText(
              pageSource.slice(
                start + i * lineWidth,
                start + (i + 1) * lineWidth,
              ),
              0,
              i * 20,
              gameState.canvasWidth,
            );
          }
        } else {
          const pattern = ctx.createPattern(background, "repeat");
          if (pattern) {
            bgctx.globalCompositeOperation = "screen";
            bgctx.fillStyle = pattern;
            bgctx.fillRect(0, 0, width, height);
          }
        }
      }

      ctx.globalCompositeOperation = "darken";
      ctx.drawImage(backgroundCanvas, 0, 0);
    } else {
      // Background not loaded yes
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = level.color || "#000";
    ctx.fillRect(0, 0, width, height);
    forEachLiveOne(gameState.particles, (flash) => {
      const { x, y, time, color, size, duration } = flash;
      const elapsed = gameState.levelTime - time;
      ctx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2);
      drawBall(ctx, color, size, x, y);
    });
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const lastExplosionDelay = Date.now() - gameState.lastExplosion + 5;
  const shaked = lastExplosionDelay < 200 && !isOptionOn("basic");
  if (shaked) {
    const amplitude =
      ((gameState.perks.bigger_explosions + 1) * 50) / lastExplosionDelay;
    ctx.translate(
      Math.sin(Date.now()) * amplitude,
      Math.sin(Date.now() + 36) * amplitude,
    );
  }

  // Coins
  ctx.globalAlpha = 1;
  forEachLiveOne(gameState.coins, (coin) => {
    const color= gameState.perks.metamorphosis || isOptionOn("colorful_coins") ?
      coin.color : 'gold'
    // ctx.globalCompositeOperation = "source-over";
    ctx.globalCompositeOperation =
      color === "gold" ||
      level.color !== "#000000" ||
      isOptionOn("opaque_coins")
        ? "source-over"
        : "screen";
    drawCoin(
      ctx,
      color,
      coin.size,
      coin.x,
      coin.y,
      (hasCombo && gameState.perks.asceticism && "red") ||
        (color === "gold" && "gold") ||
        isOptionOn("opaque_coins")
        ? gameState.puckColor
        : color,
      coin.a,
    );
  });

  // Black shadow around balls
  if (!isOptionOn("basic")) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.min(0.8, liveCount(gameState.coins) / 20);
    gameState.balls.forEach((ball) => {
      drawBall(
        ctx,
        level.color || "#000",
        gameState.ballSize * 6,
        ball.x,
        ball.y,
      );
    });
  }

  ctx.globalCompositeOperation = "source-over";
  renderAllBricks();

  ctx.globalCompositeOperation = "screen";
  forEachLiveOne(gameState.lights, (flash) => {
    const { x, y, time, color, size, duration } = flash;
    const elapsed = gameState.levelTime - time;
    ctx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2) * 0.5;
    drawBrick(ctx, color, x, y, -1, gameState.perks.clairvoyant >= 2);
  });

  ctx.globalCompositeOperation = "screen";
  forEachLiveOne(gameState.texts, (flash) => {
    const { x, y, time, color, size, duration } = flash;
    const elapsed = gameState.levelTime - time;
    ctx.globalAlpha = Math.max(0, Math.min(1, 2 - (elapsed / duration) * 2));
    ctx.globalCompositeOperation = "source-over";
    drawText(ctx, flash.text, color, size, x, y - elapsed / 10);
  });

  forEachLiveOne(gameState.particles, (particle) => {
    const { x, y, time, color, size, duration } = particle;
    const elapsed = gameState.levelTime - time;
    ctx.globalAlpha = Math.max(0, Math.min(1, 2 - (elapsed / duration) * 2));
    ctx.globalCompositeOperation = "screen";
    drawBall(ctx, color, size, x, y);
  });
  if (gameState.perks.extra_life) {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = gameState.puckColor;
    for (let i = 0; i < gameState.perks.extra_life; i++) {
      ctx.fillRect(
        gameState.perks.unbounded ? 0 : gameState.offsetXRoundedDown,
        gameState.gameZoneHeight - gameState.puckHeight / 2 + 2 * i,
        gameState.perks.unbounded
          ? gameState.canvasWidth
          : gameState.gameZoneWidthRoundedUp,
        1,
      );
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  gameState.balls.forEach((ball) => {
    const drawingColor = gameState.ballsColor;

    // The white border around is to distinguish colored balls from coins/bg
    drawBall(
      ctx,
      drawingColor,
      gameState.ballSize,
      ball.x,
      ball.y,
      gameState.puckColor,
    );

    if (
      telekinesisEffectRate(gameState, ball) ||
      yoyoEffectRate(gameState, ball)
    ) {
      ctx.beginPath();
      ctx.moveTo(gameState.puckPosition, gameState.gameZoneHeight);
      ctx.globalAlpha = Math.max(
        telekinesisEffectRate(gameState, ball),
        yoyoEffectRate(gameState, ball),
      );
      ctx.strokeStyle = gameState.puckColor;
      ctx.bezierCurveTo(
        gameState.puckPosition,
        gameState.gameZoneHeight,
        gameState.puckPosition,
        ball.y,
        ball.x,
        ball.y,
      );
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.setLineDash(emptyArray);
    }
    ctx.globalAlpha = 1;
    if (gameState.perks.clairvoyant && gameState.ballStickToPuck) {
      ctx.strokeStyle = gameState.ballsColor;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + ball.vx * 10, ball.y + ball.vy * 10);
      ctx.stroke();
    }
  });
  // The puck
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  drawPuck(
    ctx,
    gameState.puckColor,
    gameState.puckWidth,
    gameState.puckHeight,
    0,
    gameState.perks.concave_puck,
    gameState.perks.streak_shots && hasCombo ? getDashOffset(gameState) : -1,
  );

  if (gameState.combo > 1) {
    ctx.globalCompositeOperation = "source-over";
    const comboText = "x " + gameState.combo;
    const comboTextWidth = (comboText.length * gameState.puckHeight) / 1.8;
    const totalWidth = comboTextWidth + gameState.coinSize * 2;
    const left = gameState.puckPosition - totalWidth / 2;
    if (totalWidth < gameState.puckWidth) {
      drawCoin(
        ctx,
        "gold",
        gameState.coinSize,
        left + gameState.coinSize / 2,
        gameState.gameZoneHeight - gameState.puckHeight / 2,
        gameState.puckColor,
        0,
      );
      drawText(
        ctx,
        comboText,
        "#000",
        gameState.puckHeight,
        left + gameState.coinSize * 1.5,
        gameState.gameZoneHeight - gameState.puckHeight / 2,
        true,
      );
    } else {
      drawText(
        ctx,
        comboTextWidth > gameState.puckWidth
          ? gameState.combo.toString()
          : comboText,
        "#000",
        comboTextWidth > gameState.puckWidth ? 12 : 20,
        gameState.puckPosition,
        gameState.gameZoneHeight - gameState.puckHeight / 2,
        false,
      );
    }
  }
  //  Borders

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = gameState.perks.unbounded ? 0.1 : 1;

  let redLeftSide =
    hasCombo &&
    !gameState.perks.unbounded &&
    (gameState.perks.left_is_lava || gameState.perks.trampoline);
  let redRightSide =
    hasCombo &&
    !gameState.perks.unbounded &&
    (gameState.perks.right_is_lava || gameState.perks.trampoline);
  let redTop =
    hasCombo &&
    gameState.perks.unbounded <= 2 &&
    (gameState.perks.top_is_lava || gameState.perks.trampoline);

  if (gameState.offsetXRoundedDown) {
    // draw outside of gaming area to avoid capturing borders in recordings
    drawStraightLine(
      ctx,
      gameState,
      (redLeftSide && "red") || "white",
      gameState.offsetX - 1,
      0,
      gameState.offsetX - 1,
      height,
      gameState.perks.unbounded ? 0.1 : 1,
    );

    drawStraightLine(
      ctx,
      gameState,
      (redRightSide && "red") || "white",
      width - gameState.offsetX + 1,
      0,
      width - gameState.offsetX + 1,
      height,
      gameState.perks.unbounded ? 0.1 : 1,
    );
  } else {
    drawStraightLine(
      ctx,
      gameState,
      (redLeftSide && "red") || "",
      0,
      0,
      0,
      height,
      1,
    );

    drawStraightLine(
      ctx,
      gameState,
      (redRightSide && "red") || "",
      width - 1,
      0,
      width - 1,
      height,
      1,
    );
  }
  if (redTop)
    drawStraightLine(
      ctx,
      gameState,
      "red",
      gameState.perks.unbounded ? 0 : gameState.offsetXRoundedDown,
      1,
      gameState.perks.unbounded ? width : width - gameState.offsetXRoundedDown,
      1,
      1,
    );

  ctx.globalAlpha = 1;
  drawStraightLine(
    ctx,
    gameState,
    (hasCombo && gameState.perks.compound_interest && "red") ||
      (isOptionOn("mobile-mode") && "white") ||
      "",
    gameState.offsetXRoundedDown,
    gameState.gameZoneHeight,
    width - gameState.offsetXRoundedDown,
    gameState.gameZoneHeight,
    1,
  );


  if (!isOptionOn("basic") && isOptionOn("contrast") && level.svg && level.color === "#000000") {

    // haloCanvasCtx.globalCompositeOperation = 'multiply';
    // haloCanvasCtx.fillRect(0,0,haloCanvas.width,haloCanvas.height)
    haloCanvasCtx.fillStyle = 'white'
    haloCanvasCtx.globalAlpha = 0.25;
    haloCanvasCtx.globalCompositeOperation = 'screen';
    haloCanvasCtx.fillRect(0,0,haloCanvas.width,haloCanvas.height)
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "soft-light";
    ctx.drawImage(haloCanvas, 0, 0, width, height);
  }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  if (isOptionOn("mobile-mode") && !gameState.running) {
    drawText(
      ctx,
      t("play.mobile_press_to_play"),
      gameState.puckColor,
      gameState.puckHeight,
      gameState.canvasWidth / 2,
      gameState.gameZoneHeight +
        (gameState.canvasHeight - gameState.gameZoneHeight) / 2,
    );
  }


  if (shaked) {
    ctx.resetTransform();
  }
}

function drawStraightLine(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  mode: "white" | "" | "red",
  x1,
  y1,
  x2,
  y2,
  alpha = 1,
) {
  ctx.globalAlpha = alpha;
  if (!mode) return;
  if (mode == "red") {
    ctx.strokeStyle = "red";
    ctx.lineDashOffset = getDashOffset(gameState);
    ctx.lineWidth = 2;
    ctx.setLineDash(redBorderDash);
  } else {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (mode == "red") {
    ctx.setLineDash(emptyArray);
    ctx.lineWidth = 1;
  }
  ctx.globalAlpha = 1;
}

let cachedBricksRender = document.createElement("canvas");
let cachedBricksRenderKey = "";

export function renderAllBricks() {
  ctx.globalAlpha = 1;

  const hasCombo = gameState.combo > baseCombo(gameState);

  const redBorderOnBricksWithWrongColor =
    hasCombo && gameState.perks.picky_eater && isPickyEatingPossible(gameState);

  const redColorOnAllBricks = hasCombo && isMovingWhilePassiveIncome(gameState);

  const redRowReach = reachRedRowIndex(gameState);

  let offset = getDashOffset(gameState);
  if (
    !(
      redBorderOnBricksWithWrongColor ||
      redColorOnAllBricks ||
      redRowReach !== -1 ||
      gameState.perks.zen
    )
  ) {
    offset = 0;
  }

  const clairVoyance =
    gameState.perks.clairvoyant && gameState.brickHP.reduce((a, b) => a + b, 0);

  const newKey =
    gameState.gameZoneWidth +
    "_" +
    gameState.bricks.join("_") +
    bombSVG.complete +
    "_" +
    redRowReach +
    "_" +
    redBorderOnBricksWithWrongColor +
    "_" +
    redColorOnAllBricks +
    "_" +
    gameState.ballsColor +
    "_" +
    gameState.perks.pierce_color +
    "_" +
    clairVoyance +
    "_" +
    offset;

  if (newKey !== cachedBricksRenderKey) {
    cachedBricksRenderKey = newKey;

    cachedBricksRender.width = gameState.gameZoneWidth;
    cachedBricksRender.height = gameState.gameZoneWidth + 1;
    const canctx = cachedBricksRender.getContext(
      "2d",
    ) as CanvasRenderingContext2D;
    canctx.clearRect(0, 0, gameState.gameZoneWidth, gameState.gameZoneWidth);
    canctx.resetTransform();
    canctx.translate(-gameState.offsetX, 0);
    // Bricks
    gameState.bricks.forEach((color, index) => {
      const x = brickCenterX(gameState, index),
        y = brickCenterY(gameState, index);

      if (!color) return;

      let redBecauseOfReach =
        redRowReach === Math.floor(index / gameState.level.size);

      let redBorder =
        (gameState.ballsColor !== color &&
          color !== "black" &&
          redBorderOnBricksWithWrongColor) ||
        (hasCombo && gameState.perks.zen && color === "black") ||
        redBecauseOfReach ||
        redColorOnAllBricks;

      canctx.globalCompositeOperation = "source-over";
      drawBrick(
        canctx,
        color,
        x,
        y,
        redBorder ? offset : -1,
        gameState.perks.clairvoyant >= 2,
      );
      if (gameState.brickHP[index] > 1 && gameState.perks.clairvoyant) {
        canctx.globalCompositeOperation =
          gameState.perks.clairvoyant >= 2 ? "source-over" : "destination-out";
        drawText(
          canctx,
          gameState.brickHP[index].toString(),
          color,
          gameState.puckHeight,
          x,
          y,
        );
      }

      if (color === "black") {
        canctx.globalCompositeOperation = "source-over";
        drawIMG(canctx, bombSVG, gameState.brickWidth, x, y);
      }
    });
  }

  ctx.drawImage(cachedBricksRender, gameState.offsetX, 0);
}

let cachedGraphics: { [k: string]: HTMLCanvasElement } = {};

export function drawPuck(
  ctx: CanvasRenderingContext2D,
  color: colorString,
  puckWidth: number,
  puckHeight: number,
  yOffset = 0,
  concave_puck: number,
  redBorderOffset: number,
) {
  const key =
    "puck" +
    color +
    "_" +
    puckWidth +
    "_" +
    puckHeight +
    "_" +
    concave_puck +
    "_" +
    redBorderOffset;

  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = puckWidth;
    can.height = puckHeight * 2;
    const canctx = can.getContext("2d") as CanvasRenderingContext2D;
    canctx.fillStyle = color;

    canctx.beginPath();
    canctx.moveTo(0, puckHeight * 2);

    if (concave_puck) {
      canctx.lineTo(0, puckHeight * 0.75);
      canctx.bezierCurveTo(
        puckWidth / 2,
        (puckHeight * (2 + concave_puck)) / 3,
        puckWidth / 2,
        (puckHeight * (2 + concave_puck)) / 3,
        puckWidth,
        puckHeight * 0.75,
      );
      canctx.lineTo(puckWidth, puckHeight * 2);
    } else {
      canctx.lineTo(0, puckHeight * 1.25);
      canctx.bezierCurveTo(
        0,
        puckHeight * 0.75,
        puckWidth,
        puckHeight * 0.75,
        puckWidth,
        puckHeight * 1.25,
      );
      canctx.lineTo(puckWidth, puckHeight * 2);
    }

    canctx.fill();

    if (redBorderOffset !== -1) {
      canctx.strokeStyle = "red";
      canctx.lineWidth = 4;
      canctx.setLineDash(redBorderDash);
      canctx.lineDashOffset = redBorderOffset;
      canctx.stroke();
    }

    cachedGraphics[key] = can;
  }

  ctx.drawImage(
    cachedGraphics[key],
    Math.round(gameState.puckPosition - puckWidth / 2),
    gameState.gameZoneHeight - puckHeight * 2 + yOffset,
  );
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  color: colorString,
  width: number,
  x: number,
  y: number,
  borderColor = "",
) {
  const key = "ball" + color + "_" + width + "_" + borderColor;

  const size = Math.round(width);
  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = size;
    can.height = size;

    const canctx = can.getContext("2d") as CanvasRenderingContext2D;
    canctx.beginPath();
    canctx.arc(size / 2, size / 2, Math.round(size / 2) - 1, 0, 2 * Math.PI);
    canctx.fillStyle = color;
    canctx.fill();
    if (borderColor) {
      canctx.lineWidth = 2;
      canctx.strokeStyle = borderColor;
      canctx.stroke();
    }

    cachedGraphics[key] = can;
  }
  ctx.drawImage(
    cachedGraphics[key],
    Math.round(x - size / 2),
    Math.round(y - size / 2),
  );
}

const angles = 32;

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  color: colorString,
  size: number,
  x: number,
  y: number,
  borderColor: colorString,
  rawAngle: number,
) {
  const angle =
    ((Math.round((rawAngle / Math.PI) * 2 * angles) % angles) + angles) %
    angles;
  const key =
    "coin with halo" +
    "_" +
    color +
    "_" +
    size +
    "_" +
    borderColor +
    "_" +
    (color === "gold" ? angle : "whatever");

  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = size;
    can.height = size;

    const canctx = can.getContext("2d") as CanvasRenderingContext2D;

    // coin
    canctx.beginPath();
    canctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    canctx.fillStyle = color;
    canctx.fill();

    canctx.strokeStyle = borderColor;
    if (borderColor == "red") {
      canctx.lineWidth = 2;
      canctx.setLineDash(redBorderDash);
    }
    canctx.stroke();

    if (color === "gold") {
      // Fill in
      canctx.beginPath();
      canctx.arc(size / 2, size / 2, (size / 2) * 0.6, 0, 2 * Math.PI);
      canctx.fillStyle = "rgba(255,255,255,0.5)";
      canctx.fill();

      canctx.translate(size / 2, size / 2);
      canctx.rotate(angle / 16);
      canctx.translate(-size / 2, -size / 2);

      canctx.globalCompositeOperation = "multiply";
      drawText(canctx, "$", color, size - 2, size / 2, size / 2 + 1);
      drawText(canctx, "$", color, size - 2, size / 2, size / 2 + 1);
    }
    cachedGraphics[key] = can;
  }
  ctx.drawImage(
    cachedGraphics[key],
    Math.round(x - size / 2),
    Math.round(y - size / 2),
  );
}

export function drawFuzzyBall(
  ctx: CanvasRenderingContext2D,
  color: colorString,
  width: number,
  x: number,
  y: number,
) {
  const key = "fuzzy-circle" + color + "_" + width;
  if (!color) debugger;
  const size = Math.round(width * 3);
  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = size;
    can.height = size;

    const canctx = can.getContext("2d") as CanvasRenderingContext2D;
    const gradient = canctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    canctx.fillStyle = gradient;
    canctx.fillRect(0, 0, size, size);
    cachedGraphics[key] = can;
  }
  ctx.drawImage(
    cachedGraphics[key],
    Math.round(x - size / 2),
    Math.round(y - size / 2),
  );
}

export function drawBrick(
  ctx: CanvasRenderingContext2D,
  color: colorString,
  x: number,
  y: number,
  offset: number = 0,
  borderOnly: boolean,
) {
  const tlx = Math.ceil(x - gameState.brickWidth / 2);
  const tly = Math.ceil(y - gameState.brickWidth / 2);
  const brx = Math.ceil(x + gameState.brickWidth / 2) - 1;
  const bry = Math.ceil(y + gameState.brickWidth / 2) - 1;

  const width = brx - tlx,
    height = bry - tly;
  const key =
    "brick" +
    color +
    "_" +
    "_" +
    width +
    "_" +
    height +
    "_" +
    offset +
    "_" +
    borderOnly;

  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = width;
    can.height = height;
    const bord = 4;
    const cornerRadius = 2;
    const canctx = can.getContext("2d") as CanvasRenderingContext2D;

    canctx.fillStyle = color;

    canctx.setLineDash(offset !== -1 ? redBorderDash : emptyArray);
    canctx.lineDashOffset = offset;
    canctx.strokeStyle = offset !== -1 ? "red" : color;
    canctx.lineJoin = "round";
    canctx.lineWidth = bord;
    roundRect(
      canctx,
      bord / 2,
      bord / 2,
      width - bord,
      height - bord,
      cornerRadius,
    );
    if (!borderOnly) {
      canctx.fill();
    }
    canctx.stroke();

    cachedGraphics[key] = can;
  }
  ctx.drawImage(cachedGraphics[key], tlx, tly, width, height);
  // It's not easy to have a 1px gap between bricks without antialiasing
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawIMG(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number,
  x: number,
  y: number,
) {
  const key = "svg" + img + "_" + size + "_" + img.complete;

  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = size;
    can.height = size;

    const canctx = can.getContext("2d") as CanvasRenderingContext2D;

    const ratio = size / Math.max(img.width, img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    canctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

    cachedGraphics[key] = can;
  }
  ctx.drawImage(
    cachedGraphics[key],
    Math.round(x - size / 2),
    Math.round(y - size / 2),
  );
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: colorString,
  fontSize: number,
  x: number,
  y: number,
  left = false,
) {
  const key = "text" + text + "_" + color + "_" + fontSize + "_" + left;

  if (!cachedGraphics[key]) {
    const can = document.createElement("canvas");
    can.width = fontSize * text.length;
    can.height = fontSize;
    const canctx = can.getContext("2d") as CanvasRenderingContext2D;
    canctx.fillStyle = color;
    canctx.textAlign = left ? "left" : "center";
    canctx.textBaseline = "middle";
    canctx.font = fontSize + "px monospace";

    canctx.fillText(text, left ? 0 : can.width / 2, can.height / 2, can.width);

    cachedGraphics[key] = can;
  }
  ctx.drawImage(
    cachedGraphics[key],
    left ? x : Math.round(x - cachedGraphics[key].width / 2),
    Math.round(y - cachedGraphics[key].height / 2),
  );
}

export const scoreDisplay = document.getElementById(
  "score",
) as HTMLButtonElement;
const menuLabel = document.getElementById("menuLabel") as HTMLButtonElement;

const emptyArray = [];
const redBorderDash = [5, 5];

export function getDashOffset(gameState: GameState) {
  if (isOptionOn("basic")) {
    return 0;
  }
  return Math.floor(((gameState.levelTime % 500) / 500) * 10) % 10;
}
