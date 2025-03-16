import {baseCombo} from "./gameStateMutators";
import {brickCenterX, brickCenterY, currentLevelInfo, isTelekinesisActive, max_levels} from "./game_utils";
import {colorString, GameState} from "./types";
import {t} from "./i18n/i18n";
import {gameState} from "./game";
import {isOptionOn} from "./options";

export const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
export const ctx = gameCanvas.getContext("2d", {
    alpha: false,
}) as CanvasRenderingContext2D;
export const bombSVG = document.createElement("img");
export const background = document.createElement("img");
export const backgroundCanvas = document.createElement("canvas");

export function render(gameState: GameState) {

    const level = currentLevelInfo(gameState);
    const {width, height} = gameCanvas;
    if (!width || !height) return;

    if (gameState.currentLevel || gameState.levelTime) {
        menuLabel.innerText = t('play.current_lvl', {
            level: gameState.currentLevel + 1,
            max: max_levels(gameState)
        });
    } else {
        menuLabel.innerText = t('play.menu_label')
    }
    scoreDisplay.innerText = `$${gameState.score}`;

    scoreDisplay.className =
        gameState.lastScoreIncrease > gameState.levelTime - 500 ? "active" : "";

    // Clear
    if (!isOptionOn("basic") && !level.color && level.svg) {
        // Without this the light trails everything
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.6;
        gameState.coins.forEach((coin) => {
            if (!coin.destroyed)
                drawFuzzyBall(ctx, coin.color, gameState.coinSize * 2, coin.x, coin.y);
        });
        gameState.balls.forEach((ball) => {
            drawFuzzyBall(
                ctx,
                gameState.ballsColor,
                gameState.ballSize * 2,
                ball.x,
                ball.y,
            );
        });
        ctx.globalAlpha = 0.5;
        gameState.bricks.forEach((color, index) => {
            if (!color) return;
            const x = brickCenterX(gameState, index),
                y = brickCenterY(gameState, index);
            drawFuzzyBall(
                ctx,
                color == "black" ? "#666" : color,
                gameState.brickWidth,
                x,
                y,
            );
        });
        ctx.globalAlpha = 1;
        gameState.flashes.forEach((flash) => {
            const {x, y, time, color, size, type, duration} = flash;
            const elapsed = gameState.levelTime - time;
            ctx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2);
            if (type === "ball") {
                drawFuzzyBall(ctx, color, size, x, y);
            }
            if (type === "particle") {
                drawFuzzyBall(ctx, color, size * 3, x, y);
            }
        });
        // Decides how brights the bg black parts can get
        ctx.globalAlpha = 0.2;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        // Decides how dark the background black parts are when lit (1=black)
        ctx.globalAlpha = 0.8;
        ctx.globalCompositeOperation = "multiply";
        if (level.svg && background.width && background.complete) {
            if (backgroundCanvas.title !== level.name) {
                backgroundCanvas.title = level.name;
                backgroundCanvas.width = gameState.canvasWidth;
                backgroundCanvas.height = gameState.canvasHeight;
                const bgctx = backgroundCanvas.getContext(
                    "2d",
                ) as CanvasRenderingContext2D;
                bgctx.fillStyle = level.color || "#000";
                bgctx.fillRect(0, 0, gameState.canvasWidth, gameState.canvasHeight);
                const pattern = ctx.createPattern(background, "repeat");
                if (pattern) {
                    bgctx.fillStyle = pattern;
                    bgctx.fillRect(0, 0, width, height);
                }
            }

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

        gameState.flashes.forEach((flash) => {
            const {x, y, time, color, size, type, duration} = flash;
            const elapsed = gameState.levelTime - time;
            ctx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2);
            if (type === "particle") {
                drawBall(ctx, color, size, x, y);
            }
        });
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const lastExplosionDelay = Date.now() - gameState.lastExplosion + 5;
    const shaked = lastExplosionDelay < 200 && !isOptionOn('basic');
    if (shaked) {
        const amplitude =
            ((gameState.perks.bigger_explosions + 1) * 50) / lastExplosionDelay;
        ctx.translate(
            Math.sin(Date.now()) * amplitude,
            Math.sin(Date.now() + 36) * amplitude,
        );
    }
    if (gameState.perks.bigger_explosions && !isOptionOn('basic')) {
        if (shaked) {
            gameCanvas.style.filter = 'brightness(' + (1 + 100 / (1 + lastExplosionDelay)) + ')';
        } else {
            gameCanvas.style.filter = ''
        }
    }
    // Coins
    ctx.globalAlpha = 1;

    gameState.coins.forEach((coin) => {
        if (!coin.destroyed) {
            ctx.globalCompositeOperation =
                coin.color === "gold" || level.color ? "source-over" : "screen";
            drawCoin(
                ctx,
                coin.color,
                coin.size,
                coin.x,
                coin.y,
                level.color || "black",
                coin.a,
            );
        }
    });

    // Black shadow around balls
    if (!isOptionOn("basic")) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = Math.min(0.8, gameState.coins.length / 20);
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
    gameState.flashes = gameState.flashes.filter(
        (f) => gameState.levelTime - f.time < f.duration && !f.destroyed,
    );

    gameState.flashes.forEach((flash) => {
        const {x, y, time, color, size, type, duration} = flash;
        const elapsed = gameState.levelTime - time;
        ctx.globalAlpha = Math.max(0, Math.min(1, 2 - (elapsed / duration) * 2));
        if (type === "text") {
            ctx.globalCompositeOperation = "source-over";
            drawText(ctx, flash.text, color, size, x, y - elapsed / 10);
        } else if (type === "particle") {
            ctx.globalCompositeOperation = "screen";
            drawBall(ctx, color, size, x, y);
            drawFuzzyBall(ctx, color, size, x, y);
        }
    });

    if (gameState.perks.extra_life) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = gameState.puckColor;
        for (let i = 0; i < gameState.perks.extra_life; i++) {
            ctx.fillRect(
                gameState.offsetXRoundedDown,
                gameState.gameZoneHeight - gameState.puckHeight / 2 + 2 * i,
                gameState.gameZoneWidthRoundedUp,
                1,
            );
        }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    gameState.balls.forEach((ball) => {
        // The white border around is to distinguish colored balls from coins/bg
        drawBall(
            ctx,
            gameState.ballsColor,
            gameState.ballSize,
            ball.x,
            ball.y,
            gameState.puckColor,
        );

        if (isTelekinesisActive(gameState, ball)) {
            ctx.strokeStyle = gameState.puckColor;
            ctx.beginPath();
            ctx.bezierCurveTo(
                gameState.puckPosition,
                gameState.gameZoneHeight,
                gameState.puckPosition,
                ball.y,
                ball.x,
                ball.y,
            );
            ctx.stroke();
        }
    });
    // The puck
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (gameState.perks.streak_shots && gameState.combo > baseCombo(gameState)) {
        drawPuck(ctx, "red", gameState.puckWidth, gameState.puckHeight, -2);
    }
    drawPuck(ctx, gameState.puckColor, gameState.puckWidth, gameState.puckHeight);

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
                comboText,
                "#FFF",
                gameState.puckHeight,
                gameState.puckPosition,
                gameState.gameZoneHeight - gameState.puckHeight / 2,
                false,
            );
        }
    }
    //  Borders
    const hasCombo = gameState.combo > baseCombo(gameState);
    ctx.globalCompositeOperation = "source-over";
    if (gameState.offsetXRoundedDown) {
        // draw outside of gaming area to avoid capturing borders in recordings
        ctx.fillStyle =
            hasCombo && gameState.perks.left_is_lava ? "red" : gameState.puckColor;
        ctx.fillRect(gameState.offsetX - 1, 0, 1, height);
        ctx.fillStyle =
            hasCombo && gameState.perks.right_is_lava ? "red" : gameState.puckColor;
        ctx.fillRect(width - gameState.offsetX + 1, 0, 1, height);
    } else {
        ctx.fillStyle = "red";
        if (hasCombo && gameState.perks.left_is_lava) ctx.fillRect(0, 0, 1, height);
        if (hasCombo && gameState.perks.right_is_lava)
            ctx.fillRect(width - 1, 0, 1, height);
    }

    if (gameState.perks.top_is_lava && gameState.combo > baseCombo(gameState)) {
        ctx.fillStyle = "red";
        ctx.fillRect(
            gameState.offsetXRoundedDown,
            0,
            gameState.gameZoneWidthRoundedUp,
            1,
        );
    }
    const redBottom =
        gameState.perks.compound_interest && gameState.combo > baseCombo(gameState);
    ctx.fillStyle = redBottom ? "red" : gameState.puckColor;
    if (isOptionOn("mobile-mode")) {
        ctx.fillRect(
            gameState.offsetXRoundedDown,
            gameState.gameZoneHeight,
            gameState.gameZoneWidthRoundedUp,
            1,
        );
        if (!gameState.running) {
            drawText(
                ctx,
                t('play.mobile_press_to_play'),
                gameState.puckColor,
                gameState.puckHeight,
                gameState.canvasWidth / 2,
                gameState.gameZoneHeight +
                (gameState.canvasHeight - gameState.gameZoneHeight) / 2,
            );
        }
    } else if (redBottom) {
        ctx.fillRect(
            gameState.offsetXRoundedDown,
            gameState.gameZoneHeight - 1,
            gameState.gameZoneWidthRoundedUp,
            1,
        );
    }

    if (shaked) {
        ctx.resetTransform();
    }

}

let cachedBricksRender = document.createElement("canvas");
let cachedBricksRenderKey = "";

export function renderAllBricks() {
    ctx.globalAlpha = 1;

    const redBorderOnBricksWithWrongColor =
        gameState.combo > baseCombo(gameState) && gameState.perks.picky_eater && !isOptionOn('basic');

    const newKey =
        gameState.gameZoneWidth +
        "_" +
        gameState.bricks.join("_") +
        bombSVG.complete +
        "_" +
        redBorderOnBricksWithWrongColor +
        "_" +
        gameState.ballsColor +
        "_" +
        gameState.perks.pierce_color;
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

            const borderColor =
                (gameState.ballsColor !== color &&
                    color !== "black" &&
                    redBorderOnBricksWithWrongColor &&
                    "red") ||
                color;

            drawBrick(canctx, color, borderColor, x, y);
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
) {
    const key = "puck" + color + "_" + puckWidth + "_" + puckHeight;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = puckWidth;
        can.height = puckHeight * 2;
        const canctx = can.getContext("2d") as CanvasRenderingContext2D;
        canctx.fillStyle = color;

        canctx.beginPath();
        canctx.moveTo(0, puckHeight * 2);
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
        canctx.fill();
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

        if (color === "gold") {
            canctx.strokeStyle = borderColor;
            canctx.stroke();

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
    borderColor: colorString,
    x: number,
    y: number,
) {
    const tlx = Math.ceil(x - gameState.brickWidth / 2);
    const tly = Math.ceil(y - gameState.brickWidth / 2);
    const brx = Math.ceil(x + gameState.brickWidth / 2) - 1;
    const bry = Math.ceil(y + gameState.brickWidth / 2) - 1;

    const width = brx - tlx,
        height = bry - tly;
    const key = "brick" + color + "_" + borderColor + "_" + width + "_" + height;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = width;
        can.height = height;
        const bord = 2;
        const cornerRadius = 2;
        const canctx = can.getContext("2d") as CanvasRenderingContext2D;

        canctx.fillStyle = color;
        canctx.strokeStyle = borderColor;
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
        canctx.fill();
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

export const scoreDisplay = document.getElementById("score") as HTMLButtonElement;
const menuLabel = document.getElementById("menuLabel") as HTMLButtonElement;