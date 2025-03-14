import {allLevels, appVersion, icons, upgrades} from "./loadGameData";
import {
    Ball,
    BallLike,
    Coin,
    colorString,
    GameState,
    PerkId,
    PerksMap,
    RunHistoryItem, RunParams,
    RunStats,
    Upgrade,
} from "./types";
import {OptionId, options} from "./options";
import {getAudioContext, getAudioRecordingTrack, sounds} from "./sounds";
import {putBallsAtPuck, resetBalls} from "./resetBalls";
import {sumOfKeys} from "./game_utils";


export const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = gameCanvas.getContext("2d", {
    alpha: false,
}) as CanvasRenderingContext2D;

const bombSVG = document.createElement("img");
bombSVG.src =
    "data:image/svg+xml;base64," +
    btoa(`<svg width="144" height="144" viewBox="0 0 38.101 38.099" xmlns="http://www.w3.org/2000/svg">
 <path d="m6.1528 26.516c-2.6992-3.4942-2.9332-8.281-.58305-11.981a10.454 10.454 0 017.3701-4.7582c1.962-.27726 4.1646.05953 5.8835.90027l.45013.22017.89782-.87417c.83748-.81464.91169-.87499 1.0992-.90271.40528-.058713.58876.03425 1.1971.6116l.55451.52679 1.0821-1.0821c1.1963-1.1963 1.383-1.3357 2.1039-1.5877.57898-.20223 1.5681-.19816 2.1691.00897 1.4613.50314 2.3673 1.7622 2.3567 3.2773-.0058.95654-.24464 1.5795-.90924 2.3746-.40936.48928-.55533.81057-.57898 1.2737-.02039.41018.1109.77714.42322 1.1792.30172.38816.3694.61323.2797.93044-.12803.45666-.56674.71598-1.0242.60507-.601-.14597-1.3031-1.3088-1.3969-2.3126-.09459-1.0161.19245-1.8682.92392-2.7432.42567-.50885.5643-.82851.5643-1.3031 0-.50151-.14026-.83177-.51211-1.2028-.50966-.50966-1.0968-.64829-1.781-.41996l-.37348.12477-2.1006 2.1006.52597.55696c.45421.48194.5325.58876.57898.78855.09622.41588.07502.45014-.88396 1.4548l-.87173.9125.26339.57979a10.193 10.193 0 01.9231 4.1001c.03996 2.046-.41996 3.8082-1.4442 5.537-.55044.928-1.0185 1.5013-1.8968 2.3241-.83503.78284-1.5526 1.2827-2.4904 1.7361-3.4266 1.657-7.4721 1.3422-10.549-.82035-.73473-.51782-1.7312-1.4621-2.2515-2.1357zm21.869-4.5584c-.0579-.19734-.05871-2.2662 0-2.4545.11906-.39142.57898-.63361 1.0038-.53005.23812.05708.54147.32455.6116.5382.06279.19163.06769 2.1805.0065 2.3811-.12558.40773-.61649.67602-1.0462.57164-.234-.05708-.51615-.30498-.57568-.50722m3.0417-2.6013c-.12313-.6222.37837-1.1049 1.0479-1.0079.18348.0261.25279.08399 1.0071.83911.75838.75838.81301.82362.84074 1.0112.10193.68499-.40365 1.1938-1.034 1.0405-.1949-.0473-.28786-.12558-1.0144-.85216-.7649-.76409-.80241-.81057-.84645-1.0316m.61323-3.0629a.85623.85623 0 01.59284-.99975c.28949-.09214 2.1814-.08318 2.3917.01141.38734.17369.6279.61078.53984.98181-.06035.25606-.35391.57327-.60181.64992-.25279.07747-2.2278.053-2.4097-.03017-.26013-.11906-.46318-.36125-.51374-.61323" fill="#fff" opacity="0.3"/>
</svg>`);

const makeEmptyPerksMap = () => {
    const p = {} as any;
    upgrades.forEach((u) => (p[u.id] = 0));
    return p as PerksMap;
};


export function baseCombo() {
    return 1 + gameState.perks.base_combo * 3 + gameState.perks.smaller_puck * 5;
}

export function resetCombo(x: number | undefined, y: number | undefined) {
    const prev = gameState.combo;
    gameState.combo = baseCombo();
    if (!levelTime) {
        gameState.combo += gameState.perks.hot_start * 15;
    }
    if (prev > gameState.combo && gameState.perks.soft_reset) {
        gameState.combo += Math.floor((prev - gameState.combo) / (1 + gameState.perks.soft_reset));
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
                time: levelTime,
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

export function decreaseCombo(by: number, x: number, y: number) {
    const prev = gameState.combo;
    gameState.combo = Math.max(baseCombo(), gameState.combo - by);
    const lost = Math.max(0, prev - gameState.combo);

    if (lost) {
        sounds.comboDecrease();
        if (typeof x !== "undefined" && typeof y !== "undefined") {
            gameState.flashes.push({
                type: "text",
                text: "-" + lost,
                time: levelTime,
                color: "red",
                x: x,
                y: y,
                duration: 300,
                size: gameState.puckHeight,
            });
        }
    }
}


export function play() {
    if (gameState.running) return;
    gameState.running = true;

    startRecordingGame();
    getAudioContext()?.resume();
    resumeRecording();
    document.body.className = gameState.running ? " running " : " paused ";
}

export function pause(playerAskedForPause: boolean) {
    if (!gameState.running) return;
    if (gameState.pauseTimeout) return;

    gameState.pauseTimeout = setTimeout(
        () => {
            gameState.running = false;
            gameState.needsRender = true;

            setTimeout(() => {
                if (!gameState.running) getAudioContext()?.suspend();
            }, 1000);

            pauseRecording();
            gameState.pauseTimeout = null;
            document.body.className = gameState.running ? " running " : " paused ";
        },
        Math.min(Math.max(0, pauseUsesDuringRun - 5) * 50, 500),
    );

    if (playerAskedForPause) {
        // Pausing many times in a run will make pause slower
        pauseUsesDuringRun++;
    }

    if (document.exitPointerLock) {
        document.exitPointerLock();
    }
}


const background = document.createElement("img");
const backgroundCanvas = document.createElement("canvas");
background.addEventListener("load", () => {
    gameState.needsRender = true;
});

export const fitSize = () => {
    const {width, height} = gameCanvas.getBoundingClientRect();
    gameState.canvasWidth = width;
    gameState.canvasHeight = height;
    gameCanvas.width = width;
    gameCanvas.height = height;
    ctx.fillStyle = currentLevelInfo()?.color || "black";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, height);
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;

    gameState.gameZoneHeight = isSettingOn("mobile-mode") ? (height * 80) / 100 : height;
    const baseWidth = Math.round(Math.min(gameState.canvasWidth, gameState.gameZoneHeight * 0.73));
    gameState.brickWidth = Math.floor(baseWidth / gameState.gridSize / 2) * 2;
    gameState.gameZoneWidth = gameState.brickWidth * gameState.gridSize;
    gameState.offsetX = Math.floor((gameState.canvasWidth - gameState.gameZoneWidth) / 2);
    gameState.offsetXRoundedDown = gameState.offsetX;
    if (gameState.offsetX < gameState.ballSize) gameState.offsetXRoundedDown = 0;
    gameState.gameZoneWidthRoundedUp = width - 2 * gameState.offsetXRoundedDown;
    backgroundCanvas.title = "resized";
    // Ensure puck stays within bounds
    setMousePos(gameState.puckPosition);
    gameState.coins = [];
    gameState.flashes = [];
    pause(true);
    putBallsAtPuck(gameState);
    // For safari mobile https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`,
    );
};
window.addEventListener("resize", fitSize);
window.addEventListener("fullscreenchange", fitSize);

setInterval(() => {
    // Sometimes, the page changes size without triggering the event (when switching to fullscreen, closing debug panel...)
    const {width, height} = gameCanvas.getBoundingClientRect();
    if (width !== gameState.canvasWidth || height !== gameState.canvasHeight) fitSize();
}, 1000);

export function recomputeTargetBaseSpeed() {
    // We never want the ball to completely stop, it will move at least 3px per frame
    gameState.baseSpeed = Math.max(
        3,
        gameState.gameZoneWidth / 12 / 10 +
        gameState.currentLevel / 3 +
        levelTime / (30 * 1000) -
        gameState.perks.slow_down * 2,
    );
}

export function brickCenterX(index: number) {
    return gameState.offsetX + ((index % gameState.gridSize) + 0.5) * gameState.brickWidth;
}

export function brickCenterY(index: number) {
    return (Math.floor(index / gameState.gridSize) + 0.5) * gameState.brickWidth;
}

export function getRowColIndex(row: number, col: number) {
    if (row < 0 || col < 0 || row >= gameState.gridSize || col >= gameState.gridSize) return -1;
    return row * gameState.gridSize + col;
}

export function spawnExplosion(
    count: number,
    x: number,
    y: number,
    color: string,
    duration = 150,
    size = gameState.coinSize,
) {
    if (!!isSettingOn("basic")) return;
    if (gameState.flashes.length > gameState.MAX_PARTICLES) {
        // Avoid freezing when lots of explosion happen at once
        count = 1;
    }
    for (let i = 0; i < count; i++) {
        gameState.flashes.push({
            type: "particle",
            time: levelTime,
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


export function addToScore(coin: Coin) {
    coin.destroyed = true;
    gameState.score += coin.points;

    addToTotalScore(coin.points);
    if (gameState.score > gameState.highScore && !isCreativeModeRun) {
        gameState.highScore = gameState.score;
        localStorage.setItem("breakout-3-hs", gameState.score.toString());
    }
    if (!isSettingOn("basic")) {
        gameState.flashes.push({
            type: "particle",
            duration: 100 + Math.random() * 50,
            time: levelTime,
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
    runStatistics.score += coin.points;
}


export function pickedUpgradesHTMl() {
    let list = "";
    for (let u of upgrades) {
        for (let i = 0; i < gameState.perks[u.id]; i++) list += icons["icon:" + u.id] + " ";
    }
    return list;
}

async function openUpgradesPicker() {
    const catchRate = (gameState.score - gameState.levelStartScore) / (gameState.levelSpawnedCoins || 1);

    let repeats = 1;
    let choices = 3;

    let timeGain = "",
        catchGain = "",
        missesGain = "";
    if (levelTime < 30 * 1000) {
        repeats++;
        choices++;
        timeGain = " (+1 upgrade and choice)";
    } else if (levelTime < 60 * 1000) {
        choices++;
        timeGain = " (+1 choice)";
    }
    if (catchRate === 1) {
        repeats++;
        choices++;
        catchGain = " (+1 upgrade and choice)";
    } else if (catchRate > 0.9) {
        choices++;
        catchGain = " (+1 choice)";
    }
    if (gameState.levelMisses === 0) {
        repeats++;
        choices++;
        missesGain = " (+1 upgrade and choice)";
    } else if (gameState.levelMisses <= 3) {
        choices++;
        missesGain = " (+1 choice)";
    }

    while (repeats--) {
        const actions = pickRandomUpgrades(
            choices + gameState.perks.one_more_choice - gameState.perks.instant_upgrade,
        );
        if (!actions.length) break;
        let textAfterButtons = `
        <p>You just finished level ${gameState.currentLevel + 1}/${max_levels()} and picked those upgrades so far : </p><p>${pickedUpgradesHTMl()}</p>
        <div id="level-recording-container"></div> 
        
        `;

        const upgradeId = (await asyncAlert<PerkId>({
            title: "Pick an upgrade " + (repeats ? "(" + (repeats + 1) + ")" : ""),
            actions,
            text: `<p>
                You caught ${gameState.score - gameState.levelStartScore} coins ${catchGain} out of ${gameState.levelSpawnedCoins} in ${Math.round(levelTime / 1000)} seconds${timeGain}.
        You missed ${gameState.levelMisses} times ${missesGain}. 
        ${(timeGain && catchGain && missesGain && "Impressive, keep it up !") || ((timeGain || catchGain || missesGain) && "Well done !") || "Try to catch all coins, never miss the bricks or clear the level under 30s to gain additional choices and upgrades."}
        </p>`,
            allowClose: false,
            textAfterButtons,
        })) as PerkId;

        gameState.perks[upgradeId]++;
        if (upgradeId === "instant_upgrade") {
            repeats += 2;
        }

        runStatistics.upgrades_picked++;
    }
    resetCombo(undefined, undefined);
    resetBalls(gameState);
}

export function setLevel(l: number) {
    stopRecording();
    pause(false);
    if (l > 0) {
        openUpgradesPicker();
    }
    gameState.currentLevel = l;

    levelTime = 0;
    level_skip_last_uses = 0;
    lastTickDown = levelTime;
    gameState.levelStartScore = gameState.score;
    gameState.levelSpawnedCoins = 0;
    gameState.levelMisses = 0;
    runStatistics.levelsPlayed++;

    resetCombo(undefined, undefined);
    recomputeTargetBaseSpeed();
    resetBalls(gameState);

    const lvl = currentLevelInfo();
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

export function currentLevelInfo() {
    return gameState.runLevels[gameState.currentLevel % gameState.runLevels.length];
}


export function getPossibleUpgrades(gameState:GameState) {
    return upgrades
        .filter((u) => gameState.totalScoreAtRunStart >= u.threshold)
        .filter((u) => !u?.requires || gameState.perks[u?.requires]);
}

export function getUpgraderUnlockPoints() {
    let list = [] as { threshold: number; title: string }[];

    upgrades.forEach((u) => {
        if (u.threshold) {
            list.push({
                threshold: u.threshold,
                title: u.name + " (Perk)",
            });
        }
    });

    allLevels.forEach((l) => {
        list.push({
            threshold: l.threshold,
            title: l.name + " (Level)",
        });
    });

    return list
        .filter((o) => o.threshold)
        .sort((a, b) => a.threshold - b.threshold);
}

let lastOffered = {} as { [k in PerkId]: number };

export function dontOfferTooSoon(id: PerkId) {
    lastOffered[id] = Math.round(Date.now() / 1000);
}

export function pickRandomUpgrades(count: number) {
    let list = getPossibleUpgrades(gameState)
        .map((u) => ({...u, score: Math.random() + (lastOffered[u.id] || 0)}))
        .sort((a, b) => a.score - b.score)
        .filter((u) => gameState.perks[u.id] < u.max)
        .slice(0, count)
        .sort((a, b) => (a.id > b.id ? 1 : -1));

    list.forEach((u) => {
        dontOfferTooSoon(u.id);
    });

    return list.map((u) => ({
        text: u.name + (gameState.perks[u.id] ? " lvl " + (gameState.perks[u.id] + 1) : ""),
        icon: icons["icon:" + u.id],
        value: u.id as PerkId,
        help: u.help(gameState.perks[u.id] + 1),
    }));
}


export function restart(params:RunParams) {
     Object.assign(gameState, newGameState(params))
    resetRunStatistics();
    pauseUsesDuringRun = 0;
    pauseRecording();
    setLevel(0);
}


export function setMousePos(x: number) {
    gameState.needsRender = true;
    gameState.puckPosition = x;

    // We have borders visible, enforce them
    if (gameState.puckPosition < gameState.offsetXRoundedDown + gameState.puckWidth / 2) {
        gameState.puckPosition = gameState.offsetXRoundedDown + gameState.puckWidth / 2;
    }
    if (gameState.puckPosition > gameState.offsetXRoundedDown + gameState.gameZoneWidthRoundedUp - gameState.puckWidth / 2) {
        gameState.puckPosition = gameState.offsetXRoundedDown + gameState.gameZoneWidthRoundedUp - gameState.puckWidth / 2;
    }
    if (!gameState.running && !levelTime) {
        putBallsAtPuck(gameState);
    }
}

gameCanvas.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    if (gameState.running) {
        pause(true);
    } else {
        play();
        if (isSettingOn("pointerLock")) {
            gameCanvas.requestPointerLock();
        }
    }
});

gameCanvas.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === gameCanvas) {
        setMousePos(gameState.puckPosition + e.movementX);
    } else {
        setMousePos(e.x);
    }
});

gameCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!e.touches?.length) return;
    setMousePos(e.touches[0].pageX);
    play();
});
gameCanvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    pause(true);
});
gameCanvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    pause(true);
    gameState.needsRender = true;
});
gameCanvas.addEventListener("touchmove", (e) => {
    if (!e.touches?.length) return;
    setMousePos(e.touches[0].pageX);
});


export function brickIndex(x: number, y: number) {
    return getRowColIndex(
        Math.floor(y / gameState.brickWidth),
        Math.floor((x - gameState.offsetX) / gameState.brickWidth),
    );
}

export function hasBrick(index: number): number | undefined {
    if (gameState.bricks[index]) return index;
}

export function hitsSomething(x: number, y: number, radius: number) {
    return (
        hasBrick(brickIndex(x - radius, y - radius)) ??
        hasBrick(brickIndex(x + radius, y - radius)) ??
        hasBrick(brickIndex(x + radius, y + radius)) ??
        hasBrick(brickIndex(x - radius, y + radius))
    );
}

export function shouldPierceByColor(
    vhit: number | undefined,
    hhit: number | undefined,
    chit: number | undefined,
) {
    if (!gameState.perks.pierce_color) return false;
    if (typeof vhit !== "undefined" && gameState.bricks[vhit] !== gameState.ballsColor) {
        return false;
    }
    if (typeof hhit !== "undefined" && gameState.bricks[hhit] !== gameState.ballsColor) {
        return false;
    }
    if (typeof chit !== "undefined" && gameState.bricks[chit] !== gameState.ballsColor) {
        return false;
    }
    return true;
}

export function coinBrickHitCheck(coin: Coin) {
    // Make ball/coin bonce, and return bricks that were hit
    const radius = gameState.coinSize / 2;
    const {x, y, previousX, previousY} = coin;

    const vhit = hitsSomething(previousX, y, radius);
    const hhit = hitsSomething(x, previousY, radius);
    const chit =
        (typeof vhit == "undefined" &&
            typeof hhit == "undefined" &&
            hitsSomething(x, y, radius)) ||
        undefined;

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
    return vhit ?? hhit ?? chit;
}

export function bordersHitCheck(coin: Coin | Ball, radius: number, delta: number) {
    if (coin.destroyed) return;
    coin.previousX = coin.x;
    coin.previousY = coin.y;
    coin.x += coin.vx * delta;
    coin.y += coin.vy * delta;
    coin.sx ||= 0;
    coin.sy ||= 0;
    coin.sx += coin.previousX - coin.x;
    coin.sy += coin.previousY - coin.y;
    coin.sx *= 0.9;
    coin.sy *= 0.9;

    if (gameState.perks.wind) {
        coin.vx +=
            ((gameState.puckPosition - (gameState.offsetX + gameState.gameZoneWidth / 2)) / gameState.gameZoneWidth) *
            gameState.perks.wind *
            0.5;
    }

    let vhit = 0,
        hhit = 0;

    if (coin.x < gameState.offsetXRoundedDown + radius) {
        coin.x =
            gameState.offsetXRoundedDown + radius + (gameState.offsetXRoundedDown + radius - coin.x);
        coin.vx *= -1;
        hhit = 1;
    }
    if (coin.y < radius) {
        coin.y = radius + (radius - coin.y);
        coin.vy *= -1;
        vhit = 1;
    }
    if (coin.x > gameState.canvasWidth - gameState.offsetXRoundedDown - radius) {
        coin.x =
            gameState.canvasWidth -
            gameState.offsetXRoundedDown -
            radius -
            (coin.x - (gameState.canvasWidth - gameState.offsetXRoundedDown - radius));
        coin.vx *= -1;
        hhit = 1;
    }

    return hhit + vhit * 2;
}


export function tick() {
    recomputeTargetBaseSpeed();
    const currentTick = performance.now();

    gameState.puckWidth =
        (gameState.gameZoneWidth / 12) * (3 - gameState.perks.smaller_puck + gameState.perks.bigger_puck);

    if (keyboardPuckSpeed) {
        setMousePos(gameState.puckPosition + keyboardPuckSpeed);
    }

    if (gameState.running) {
        levelTime += currentTick - lastTick;
        runStatistics.runTime += currentTick - lastTick;
        runStatistics.max_combo = Math.max(runStatistics.max_combo, gameState.combo);

        // How many times to compute
        let delta = Math.min(4, (currentTick - lastTick) / (1000 / 60));
        delta *= gameState.running ? 1 : 0;

        gameState.coins = gameState.coins.filter((coin) => !coin.destroyed);
        gameState.balls = gameState.balls.filter((ball) => !ball.destroyed);

        const remainingBricks = gameState.bricks.filter((b) => b && b !== "black").length;

        if (levelTime > lastTickDown + 1000 && gameState.perks.hot_start) {
            lastTickDown = levelTime;
            decreaseCombo(gameState.perks.hot_start, gameState.puckPosition, gameState.gameZoneHeight - 2 * gameState.puckHeight);
        }

        if (remainingBricks <= gameState.perks.skip_last && !level_skip_last_uses) {
            gameState.bricks.forEach((type, index) => {
                if (type) {
                    explodeBrick(index, gameState.balls[0], true);
                }
            });
            level_skip_last_uses++;
        }
        if (!remainingBricks && !gameState.coins.length) {
            if (gameState.currentLevel + 1 < max_levels()) {
                setLevel(gameState.currentLevel + 1);
            } else {
                gameOver(
                    "Run finished with " + gameState.score + " points",
                    "You cleared all levels for this run.",
                );
            }
        } else if (gameState.running || levelTime) {
            let playedCoinBounce = false;
            const coinRadius = Math.round(gameState.coinSize / 2);

            gameState.coins.forEach((coin) => {
                if (coin.destroyed) return;
                if (gameState.perks.coin_magnet) {
                    const attractionX =
                        ((delta * (gameState.puckPosition - coin.x)) /
                            (100 +
                                Math.pow(coin.y - gameState.gameZoneHeight, 2) +
                                Math.pow(coin.x - gameState.puckPosition, 2))) *
                        gameState.perks.coin_magnet *
                        100;
                    coin.vx += attractionX;
                    coin.sa -= attractionX / 10;
                }

                const ratio = 1 - (gameState.perks.viscosity * 0.03 + 0.005) * delta;

                coin.vy *= ratio;
                coin.vx *= ratio;
                if (coin.vx > 7 * gameState.baseSpeed) coin.vx = 7 * gameState.baseSpeed;
                if (coin.vx < -7 * gameState.baseSpeed) coin.vx = -7 * gameState.baseSpeed;
                if (coin.vy > 7 * gameState.baseSpeed) coin.vy = 7 * gameState.baseSpeed;
                if (coin.vy < -7 * gameState.baseSpeed) coin.vy = -7 * gameState.baseSpeed;
                coin.a += coin.sa;

                // Gravity
                coin.vy += delta * coin.weight * 0.8;

                const speed = Math.abs(coin.sx) + Math.abs(coin.sx);
                const hitBorder = bordersHitCheck(coin, coinRadius, delta);

                if (
                    coin.y > gameState.gameZoneHeight - coinRadius - gameState.puckHeight &&
                    coin.y < gameState.gameZoneHeight + gameState.puckHeight + coin.vy &&
                    Math.abs(coin.x - gameState.puckPosition) <
                    coinRadius +
                    gameState.puckWidth / 2 + // a bit of margin to be nice
                    gameState.puckHeight
                ) {
                    addToScore(coin);
                } else if (coin.y > gameState.canvasHeight + coinRadius) {
                    coin.destroyed = true;
                    if (gameState.perks.compound_interest) {
                        resetCombo(coin.x, coin.y);
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

            gameState.balls.forEach((ball) => ballTick(ball, delta));

            if (gameState.perks.wind) {
                const windD =
                    ((gameState.puckPosition - (gameState.offsetX + gameState.gameZoneWidth / 2)) / gameState.gameZoneWidth) *
                    2 *
                    gameState.perks.wind;
                for (let i = 0; i < gameState.perks.wind; i++) {
                    if (Math.random() * Math.abs(windD) > 0.5) {
                        gameState.flashes.push({
                            type: "particle",
                            duration: 150,
                            ethereal: true,
                            time: levelTime,
                            size: gameState.coinSize / 2,
                            color: rainbowColor(),
                            x: gameState.offsetXRoundedDown + Math.random() * gameState.gameZoneWidthRoundedUp,
                            y: Math.random() * gameState.gameZoneHeight,
                            vx: windD * 8,
                            vy: 0,
                        });
                    }
                }
            }

            gameState.flashes.forEach((flash) => {
                if (flash.type === "particle") {
                    flash.x += flash.vx * delta;
                    flash.y += flash.vy * delta;
                    if (!flash.ethereal) {
                        flash.vy += 0.5;
                        if (hasBrick(brickIndex(flash.x, flash.y))) {
                            flash.destroyed = true;
                        }
                    }
                }
            });
        }

        if (gameState.combo > baseCombo()) {
            // The red should still be visible on a white bg
            const baseParticle = !isSettingOn("basic") &&
                (gameState.combo - baseCombo()) * Math.random() > 5 &&
                gameState.running && {
                    type: "particle" as const,
                    duration: 100 * (Math.random() + 1),
                    time: levelTime,
                    size: gameState.coinSize / 2,
                    color: "red",
                    ethereal: true,
                };

            if (gameState.perks.top_is_lava) {
                baseParticle &&
                gameState.flashes.push({
                    ...baseParticle,
                    x: gameState.offsetXRoundedDown + Math.random() * gameState.gameZoneWidthRoundedUp,
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
                    x = gameState.offsetXRoundedDown + gameState.gameZoneWidthRoundedUp * Math.random();
                    attemps++;
                } while (Math.abs(x - gameState.puckPosition) < gameState.puckWidth / 2 && attemps < 10);
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

    render();

    requestAnimationFrame(tick);
    lastTick = currentTick;
}

export function isTelekinesisActive(ball: Ball) {
    return gameState.perks.telekinesis && !ball.hitSinceBounce && ball.vy < 0;
}

export function ballTick(ball: Ball, delta: number) {
    ball.previousVX = ball.vx;
    ball.previousVY = ball.vy;

    let speedLimitDampener =
        1 +
        gameState.perks.telekinesis +
        gameState.perks.ball_repulse_ball +
        gameState.perks.puck_repulse_ball +
        gameState.perks.ball_attract_ball;
    if (isTelekinesisActive(ball)) {
        speedLimitDampener += 3;
        ball.vx += ((gameState.puckPosition - ball.x) / 1000) * delta * gameState.perks.telekinesis;
    }

    if (ball.vx * ball.vx + ball.vy * ball.vy < gameState.baseSpeed * gameState.baseSpeed * 2) {
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
            repulse(ball, b2, gameState.perks.ball_repulse_ball, true);
        }
    }
    if (gameState.perks.ball_attract_ball) {
        for (let b2 of gameState.balls) {
            // avoid computing this twice, and repulsing itself
            if (b2.x >= ball.x) continue;
            attract(ball, b2, gameState.perks.ball_attract_ball);
        }
    }
    if (
        gameState.perks.puck_repulse_ball &&
        Math.abs(ball.x - gameState.puckPosition) <
        gameState.puckWidth / 2 + (gameState.ballSize * (9 + gameState.perks.puck_repulse_ball)) / 10
    ) {
        repulse(
            ball,
            {
                x: gameState.puckPosition,
                y: gameState.gameZoneHeight,
            },
            gameState.perks.puck_repulse_ball + 1,
            false,
        );
    }

    if (gameState.perks.respawn && ball.hitItem?.length > 1 && !isSettingOn("basic")) {
        for (let i = 0; i < ball.hitItem?.length - 1 && i < gameState.perks.respawn; i++) {
            const {index, color} = ball.hitItem[i];
            if (gameState.bricks[index] || color === "black") continue;
            const vertical = Math.random() > 0.5;
            const dx = Math.random() > 0.5 ? 1 : -1;
            const dy = Math.random() > 0.5 ? 1 : -1;

            gameState.flashes.push({
                type: "particle",
                duration: 250,
                ethereal: true,
                time: levelTime,
                size: gameState.coinSize / 2,
                color,
                x: brickCenterX(index) + (dx * gameState.brickWidth) / 2,
                y: brickCenterY(index) + (dy * gameState.brickWidth) / 2,
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
            resetCombo(ball.x, ball.y);
        }

        if (
            gameState.perks.right_is_lava &&
            borderHitCode % 2 &&
            ball.x > gameState.offsetX + gameState.gameZoneWidth / 2
        ) {
            resetCombo(ball.x, ball.y);
        }

        if (gameState.perks.top_is_lava && borderHitCode >= 2) {
            resetCombo(ball.x, ball.y + gameState.ballSize);
        }
        sounds.wallBeep(ball.x);
        ball.bouncesList?.push({x: ball.previousX, y: ball.previousY});
    }

    // Puck collision
    const ylimit = gameState.gameZoneHeight - gameState.puckHeight - gameState.ballSize / 2;
    const ballIsUnderPuck =
        Math.abs(ball.x - gameState.puckPosition) < gameState.ballSize / 2 + gameState.puckWidth / 2;
    if (
        ball.y > ylimit &&
        ball.vy > 0 &&
        (ballIsUnderPuck || (gameState.perks.extra_life && ball.y > ylimit + gameState.puckHeight / 2))
    ) {
        if (ballIsUnderPuck) {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const angle = Math.atan2(-gameState.puckWidth / 2, ball.x - gameState.puckPosition);
            ball.vx = speed * Math.cos(angle);
            ball.vy = speed * Math.sin(angle);
            sounds.wallBeep(ball.x);
        } else {
            ball.vy *= -1;
            gameState.perks.extra_life = Math.max(0, gameState.perks.extra_life - 1);
            sounds.lifeLost(ball.x);
            if (!isSettingOn("basic")) {
                for (let i = 0; i < 10; i++)
                    gameState.flashes.push({
                        type: "particle",
                        ethereal: false,
                        color: "red",
                        destroyed: false,
                        duration: 150,
                        size: gameState.coinSize / 2,
                        time: levelTime,
                        x: ball.x,
                        y: ball.y,
                        vx: Math.random() * gameState.baseSpeed * 3,
                        vy: gameState.baseSpeed * 3,
                    });
            }
        }
        if (gameState.perks.streak_shots) {
            resetCombo(ball.x, ball.y);
        }

        if (gameState.perks.respawn) {
            ball.hitItem
                .slice(0, -1)
                .slice(0, gameState.perks.respawn)
                .forEach(({index, color}) => {
                    if (!gameState.bricks[index] && color !== "black") gameState.bricks[index] = color;
                });
        }
        ball.hitItem = [];
        if (!ball.hitSinceBounce) {
            runStatistics.misses++;
            gameState.levelMisses++;
            resetCombo(ball.x, ball.y);
            gameState.flashes.push({
                type: "text",
                text: "miss",
                duration: 500,
                time: levelTime,
                size: gameState.puckHeight * 1.5,
                color: "red",
                x: gameState.puckPosition,
                y: gameState.gameZoneHeight - gameState.puckHeight * 2,
            });
        }
        runStatistics.puck_bounces++;
        ball.hitSinceBounce = 0;
        ball.sapperUses = 0;
        ball.piercedSinceBounce = 0;
        ball.bouncesList = [
            {
                x: ball.previousX,
                y: ball.previousY,
            },
        ];
    }

    if (ball.y > gameState.gameZoneHeight + gameState.ballSize / 2 && gameState.running) {
        ball.destroyed = true;
        runStatistics.balls_lost++;
        if (!gameState.balls.find((b) => !b.destroyed)) {
            gameOver(
                "Game Over",
                "You dropped the ball after catching " + gameState.score + " coins. ",
            );
        }
    }
    const radius = gameState.ballSize / 2;
    // Make ball/coin bonce, and return bricks that were hit
    const {x, y, previousX, previousY} = ball;

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

        explodeBrick(hitBrick, ball, false);

        if (
            ball.sapperUses < gameState.perks.sapper &&
            initialBrickColor !== "black" && // don't replace a brick that bounced with sturdy_bricks
            !gameState.bricks[hitBrick]
        ) {
            gameState.bricks[hitBrick] = "black";
            ball.sapperUses++;
        }
    }

    if (!isSettingOn("basic")) {
        ball.sparks += (delta * (gameState.combo - 1)) / 30;
        if (ball.sparks > 1) {
            gameState.flashes.push({
                type: "particle",
                duration: 100 * ball.sparks,
                time: levelTime,
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

const defaultRunStats = () =>
    ({
        started: Date.now(),
        levelsPlayed: 0,
        runTime: 0,
        coins_spawned: 0,
        score: 0,
        bricks_broken: 0,
        misses: 0,
        balls_lost: 0,
        puck_bounces: 0,
        upgrades_picked: 1,
        max_combo: 1,
        max_level: 0,
    }) as RunStats;


export function resetRunStatistics() {
    runStatistics = defaultRunStats();
}

export function getTotalScore() {
    try {
        return JSON.parse(localStorage.getItem("breakout_71_total_score") || "0");
    } catch (e) {
        return 0;
    }
}

export function addToTotalScore(points: number) {
    if (isCreativeModeRun) return;
    try {
        localStorage.setItem(
            "breakout_71_total_score",
            JSON.stringify(getTotalScore() + points),
        );
    } catch (e) {
    }
}

export function addToTotalPlayTime(ms: number) {
    try {
        localStorage.setItem(
            "breakout_71_total_play_time",
            JSON.stringify(
                JSON.parse(localStorage.getItem("breakout_71_total_play_time") || "0") +
                ms,
            ),
        );
    } catch (e) {
    }
}

export function gameOver(title: string, intro: string) {
    if (!gameState.running) return;
    pause(true);
    stopRecording();
    addToTotalPlayTime(runStatistics.runTime);
    runStatistics.max_level = gameState.currentLevel + 1;

    let animationDelay = -300;
    const getDelay = () => {
        animationDelay += 800;
        return "animation-delay:" + animationDelay + "ms;";
    };
    // unlocks
    let unlocksInfo = "";
    const endTs = getTotalScore();
    const startTs = endTs - gameState.score;
    const list = getUpgraderUnlockPoints();
    list
        .filter((u) => u.threshold > startTs && u.threshold < endTs)
        .forEach((u) => {
            unlocksInfo += `
<p class="progress"  >
   <span>${u.title}</span>
    <span class="progress_bar_part" style="${getDelay()}"></span>
</p>
`;
        });
    const previousUnlockAt =
        findLast(list, (u) => u.threshold <= endTs)?.threshold || 0;
    const nextUnlock = list.find((u) => u.threshold > endTs);

    if (nextUnlock) {
        const total = nextUnlock?.threshold - previousUnlockAt;
        const done = endTs - previousUnlockAt;
        intro += `Score ${nextUnlock.threshold - endTs} more points to reach the next unlock.`;

        const scaleX = (done / total).toFixed(2);
        unlocksInfo += `
            <p class="progress"   >
           <span>${nextUnlock.title}</span>
        <span style="transform: scale(${scaleX},1);${getDelay()}" class="progress_bar_part"></span>
        </p>

`;
        list
            .slice(list.indexOf(nextUnlock) + 1)
            .slice(0, 3)
            .forEach((u) => {
                unlocksInfo += `
        <p class="progress"  >
           <span>${u.title}</span> 
        </p> 
`;
            });
    }

    // Avoid the sad sound right as we restart a new games
    gameState.combo = 1;

    asyncAlert({
        allowClose: true,
        title,
        text: `
        ${isCreativeModeRun ? "<p>This test run and its score are not being recorded</p>" : ""}
        <p>${intro}</p>
        ${unlocksInfo}  
        `,
        actions: [
            {
                value: null,
                text: "Start a new run",
                help: "",
            },
        ],
        textAfterButtons: `<div id="level-recording-container"></div>
        ${getHistograms()} 
        `,
    }).then(() => restart({levelToAvoid:  currentLevelInfo().name}));
}

export function getHistograms() {
    let runStats = "";
    try {
        // Stores only top 100 runs
        let runsHistory = JSON.parse(
            localStorage.getItem("breakout_71_runs_history") || "[]",
        ) as RunHistoryItem[];
        runsHistory.sort((a, b) => a.score - b.score).reverse();
        runsHistory = runsHistory.slice(0, 100);

        runsHistory.push({...runStatistics, perks: gameState.perks, appVersion});

        // Generate some histogram
        if (!isCreativeModeRun)
            localStorage.setItem(
                "breakout_71_runs_history",
                JSON.stringify(runsHistory, null, 2),
            );

        const makeHistogram = (
            title: string,
            getter: (hi: RunHistoryItem) => number,
            unit: string,
        ) => {
            let values = runsHistory.map((h) => getter(h) || 0);
            let min = Math.min(...values);
            let max = Math.max(...values);
            // No point
            if (min === max) return "";
            if (max - min < 10) {
                // This is mostly useful for levels
                min = Math.max(0, max - 10);
                max = Math.max(max, min + 10);
            }
            // One bin per unique value, max 10
            const binsCount = Math.min(values.length, 10);
            if (binsCount < 3) return "";
            const bins = [] as number[];
            const binsTotal = [] as number[];
            for (let i = 0; i < binsCount; i++) {
                bins.push(0);
                binsTotal.push(0);
            }
            const binSize = (max - min) / bins.length;
            const binIndexOf = (v: number) =>
                Math.min(bins.length - 1, Math.floor((v - min) / binSize));
            values.forEach((v) => {
                if (isNaN(v)) return;
                const index = binIndexOf(v);
                bins[index]++;
                binsTotal[index] += v;
            });
            if (bins.filter((b) => b).length < 3) return "";
            const maxBin = Math.max(...bins);
            const lastValue = values[values.length - 1];
            const activeBin = binIndexOf(lastValue);

            const bars = bins
                .map((v, vi) => {
                    const style = `height: ${(v / maxBin) * 80}px`;
                    return `<span class="${vi === activeBin ? "active" : ""}"><span style="${style}" title="${v} run${v > 1 ? "s" : ""} between ${Math.floor(min + vi * binSize)} and ${Math.floor(min + (vi + 1) * binSize)}${unit}"
              ><span>${(!v && " ") || (vi == activeBin && lastValue + unit) || Math.round(binsTotal[vi] / v) + unit}</span></span></span>`;
                })
                .join("");

            return `<h2 class="histogram-title">${title} : <strong>${lastValue}${unit}</strong></h2>
            <div class="histogram">${bars}</div>
            `;
        };

        runStats += makeHistogram("Total score", (r) => r.score, "");
        runStats += makeHistogram(
            "Catch rate",
            (r) => Math.round((r.score / r.coins_spawned) * 100),
            "%",
        );
        runStats += makeHistogram("Bricks broken", (r) => r.bricks_broken, "");
        runStats += makeHistogram(
            "Bricks broken per minute",
            (r) => Math.round((r.bricks_broken / r.runTime) * 1000 * 60),
            " bpm",
        );
        runStats += makeHistogram(
            "Hit rate",
            (r) => Math.round((1 - r.misses / r.puck_bounces) * 100),
            "%",
        );
        runStats += makeHistogram(
            "Duration per level",
            (r) => Math.round(r.runTime / 1000 / r.levelsPlayed),
            "s",
        );
        runStats += makeHistogram("Level reached", (r) => r.levelsPlayed, "");
        runStats += makeHistogram("Upgrades applied", (r) => r.upgrades_picked, "");
        runStats += makeHistogram("Balls lost", (r) => r.balls_lost, "");
        runStats += makeHistogram(
            "Average combo",
            (r) => Math.round(r.coins_spawned / r.bricks_broken),
            "",
        );
        runStats += makeHistogram("Max combo", (r) => r.max_combo, "");

        if (runStats) {
            runStats =
                `<p>Find below your run statistics compared to  your ${runsHistory.length - 1} best runs.</p>` +
                runStats;
        }
    } catch (e) {
        console.warn(e);
    }
    return runStats;
}

export function explodeBrick(index: number, ball: Ball, isExplosion: boolean) {
    const color = gameState.bricks[index];
    if (!color) return;

    if (color === "black") {
        delete gameState.bricks[index];
        const x = brickCenterX(index),
            y = brickCenterY(index);

        sounds.explode(ball.x);

        const col = index % gameState.gridSize;
        const row = Math.floor(index / gameState.gridSize);
        const size = 1 + gameState.perks.bigger_explosions;
        // Break bricks around
        for (let dx = -size; dx <= size; dx++) {
            for (let dy = -size; dy <= size; dy++) {
                const i = getRowColIndex(row + dy, col + dx);
                if (gameState.bricks[i] && i !== -1) {
                    // Study bricks resist explisions too
                    if (gameState.bricks[i] !== "black" && gameState.perks.sturdy_bricks > Math.random() * 5)
                        continue;
                    explodeBrick(i, ball, true);
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
            time: levelTime,
            size: gameState.brickWidth * 2,
            color: "white",
            x,
            y,
        });
        spawnExplosion(
            7 * (1 + gameState.perks.bigger_explosions),
            x,
            y,
            "white",
            150,
            gameState.coinSize,
        );
        ball.hitSinceBounce++;
        runStatistics.bricks_broken++;
    } else if (color) {
        // Even if it bounces we don't want to count that as a miss
        ball.hitSinceBounce++;

        // Flashing is take care of by the tick loop
        const x = brickCenterX(index),
            y = brickCenterY(index);

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
        runStatistics.coins_spawned += coinsToSpawn;
        runStatistics.bricks_broken++;
        const maxCoins = gameState.MAX_COINS * (isSettingOn("basic") ? 0.5 : 1);
        const spawnableCoins =
            gameState.coins.length > gameState.MAX_COINS ? 1 : Math.floor(maxCoins - gameState.coins.length) / 3;

        const pointsPerCoin = Math.max(1, Math.ceil(coinsToSpawn / spawnableCoins));

        while (coinsToSpawn > 0) {
            const points = Math.min(pointsPerCoin, coinsToSpawn);
            if (points < 0 || isNaN(points)) {
                console.error({points});
                debugger;
            }

            coinsToSpawn -= points;

            const cx = x + (Math.random() - 0.5) * (gameState.brickWidth - gameState.coinSize),
                cy = y + (Math.random() - 0.5) * (gameState.brickWidth - gameState.coinSize);

            gameState.coins.push({
                points,
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
            gameState.perks.picky_eater -
            Math.round(Math.random() * gameState.perks.soft_reset),
        );

        if (!isExplosion) {
            // color change
            if (
                (gameState.perks.picky_eater || gameState.perks.pierce_color) &&
                color !== gameState.ballsColor &&
                color
            ) {
                if (gameState.perks.picky_eater) {
                    resetCombo(ball.x, ball.y);
                }

                gameState.ballsColor = color;
            } else {
                sounds.comboIncreaseMaybe(gameState.combo, ball.x, 1);
            }
        }

        gameState.flashes.push({
            type: "ball",
            duration: 40,
            time: levelTime,
            size: gameState.brickWidth,
            color: color,
            x,
            y,
        });
        spawnExplosion(5 + Math.min(gameState.combo, 30), x, y, color, 150, gameState.coinSize / 2);
    }

    if (!gameState.bricks[index] && color !== "black") {
        ball.hitItem?.push({
            index,
            color,
        });
    }
}

export function max_levels() {
    return 7 + gameState.perks.extra_levels;
}

export function render() {
    if (gameState.running) gameState.needsRender = true;
    if (!gameState.needsRender) {
        return;
    }
    gameState.needsRender = false;

    const level = currentLevelInfo();
    const {width, height} = gameCanvas;
    if (!width || !height) return;

    scoreDisplay.innerText = `L${gameState.currentLevel + 1}/${max_levels()} $${gameState.score}`;
    // Clear
    if (!isSettingOn("basic") && !level.color && level.svg) {
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
            drawFuzzyBall(ctx, gameState.ballsColor, gameState.ballSize * 2, ball.x, ball.y);
        });
        ctx.globalAlpha = 0.5;
        gameState.bricks.forEach((color, index) => {
            if (!color) return;
            const x = brickCenterX(index),
                y = brickCenterY(index);
            drawFuzzyBall(ctx, color == "black" ? "#666" : color, gameState.brickWidth, x, y);
        });
        ctx.globalAlpha = 1;
        gameState.flashes.forEach((flash) => {
            const {x, y, time, color, size, type, duration} = flash;
            const elapsed = levelTime - time;
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
            const elapsed = levelTime - time;
            ctx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2);
            if (type === "particle") {
                drawBall(ctx, color, size, x, y);
            }
        });
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const lastExplosionDelay = Date.now() - gameState.lastExplosion + 5;
    const shaked = lastExplosionDelay < 200;
    if (shaked) {
        const amplitude = ((gameState.perks.bigger_explosions + 1) * 50) / lastExplosionDelay;
        ctx.translate(
            Math.sin(Date.now()) * amplitude,
            Math.sin(Date.now() + 36) * amplitude,
        );
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
                gameState.coinSize,
                coin.x,
                coin.y,
                level.color || "black",
                coin.a,
            );
        }
    });

    // Black shadow around balls
    if (!isSettingOn("basic")) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = Math.min(0.8, gameState.coins.length / 20);
        gameState.balls.forEach((ball) => {
            drawBall(ctx, level.color || "#000", gameState.ballSize * 6, ball.x, ball.y);
        });
    }

    ctx.globalCompositeOperation = "source-over";
    renderAllBricks();

    ctx.globalCompositeOperation = "screen";
    gameState.flashes = gameState.flashes.filter(
        (f) => levelTime - f.time < f.duration && !f.destroyed,
    );

    gameState.flashes.forEach((flash) => {
        const {x, y, time, color, size, type, duration} = flash;
        const elapsed = levelTime - time;
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
        drawBall(ctx, gameState.ballsColor, gameState.ballSize, ball.x, ball.y, gameState.puckColor);

        if (isTelekinesisActive(ball)) {
            ctx.strokeStyle = gameState.puckColor;
            ctx.beginPath();
            ctx.bezierCurveTo(gameState.puckPosition, gameState.gameZoneHeight, gameState.puckPosition, ball.y, ball.x, ball.y);
            ctx.stroke();
        }
    });
    // The puck
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (gameState.perks.streak_shots && gameState.combo > baseCombo()) {
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
    const hasCombo = gameState.combo > baseCombo();
    ctx.globalCompositeOperation = "source-over";
    if (gameState.offsetXRoundedDown) {
        // draw outside of gaming area to avoid capturing borders in recordings
        ctx.fillStyle = hasCombo && gameState.perks.left_is_lava ? "red" : gameState.puckColor;
        ctx.fillRect(gameState.offsetX - 1, 0, 1, height);
        ctx.fillStyle = hasCombo && gameState.perks.right_is_lava ? "red" : gameState.puckColor;
        ctx.fillRect(width - gameState.offsetX + 1, 0, 1, height);
    } else {
        ctx.fillStyle = "red";
        if (hasCombo && gameState.perks.left_is_lava) ctx.fillRect(0, 0, 1, height);
        if (hasCombo && gameState.perks.right_is_lava) ctx.fillRect(width - 1, 0, 1, height);
    }

    if (gameState.perks.top_is_lava && gameState.combo > baseCombo()) {
        ctx.fillStyle = "red";
        ctx.fillRect(gameState.offsetXRoundedDown, 0, gameState.gameZoneWidthRoundedUp, 1);
    }
    const redBottom = gameState.perks.compound_interest && gameState.combo > baseCombo();
    ctx.fillStyle = redBottom ? "red" : gameState.puckColor;
    if (isSettingOn("mobile-mode")) {
        ctx.fillRect(gameState.offsetXRoundedDown, gameState.gameZoneHeight, gameState.gameZoneWidthRoundedUp, 1);
        if (!gameState.running) {
            drawText(
                ctx,
                "Press and hold here to play",
                gameState.puckColor,
                gameState.puckHeight,
                gameState.canvasWidth / 2,
                gameState.gameZoneHeight + (gameState.canvasHeight - gameState.gameZoneHeight) / 2,
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

    recordOneFrame();
}


let cachedBricksRender = document.createElement("canvas");
let cachedBricksRenderKey = "";

export function renderAllBricks() {
    ctx.globalAlpha = 1;

    const redBorderOnBricksWithWrongColor =
        gameState.combo > baseCombo() && gameState.perks.picky_eater;

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
            const x = brickCenterX(index),
                y = brickCenterY(index);

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

let levelTime = 0;
// Limits skip last to one use per level
let level_skip_last_uses = 0;

window.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pause(true);
    }
});

const scoreDisplay = document.getElementById("score") as HTMLButtonElement;
let alertsOpen = 0,
    closeModal: null | (() => void) = null;

type AsyncAlertAction<t> = {
    text?: string;
    value?: t;
    help?: string;
    disabled?: boolean;
    icon?: string;
    className?: string;
};

export function asyncAlert<t>({
                                  title,
                                  text,
                                  actions,
                                  allowClose = true,
                                  textAfterButtons = "",
                                  actionsAsGrid = false,
                              }: {
    title?: string;
    text?: string;
    actions?: AsyncAlertAction<t>[];
    textAfterButtons?: string;
    allowClose?: boolean;
    actionsAsGrid?: boolean;
}): Promise<t | void> {
    alertsOpen++;
    return new Promise((resolve) => {
        const popupWrap = document.createElement("div");
        document.body.appendChild(popupWrap);
        popupWrap.className = "popup " + (actionsAsGrid ? "actionsAsGrid " : "");

        function closeWithResult(value: t | undefined) {
            resolve(value);
            // Doing this async lets the menu scroll persist if it's shown a second time
            setTimeout(() => {
                document.body.removeChild(popupWrap);
            });
        }

        if (allowClose) {
            const closeButton = document.createElement("button");
            closeButton.title = "close";
            closeButton.className = "close-modale";
            closeButton.addEventListener("click", (e) => {
                e.preventDefault();
                closeWithResult(undefined);
            });
            closeModal = () => {
                closeWithResult(undefined);
            };
            popupWrap.appendChild(closeButton);
        }

        const popup = document.createElement("div");

        if (title) {
            const p = document.createElement("h2");
            p.innerHTML = title;
            popup.appendChild(p);
        }

        if (text) {
            const p = document.createElement("div");
            p.innerHTML = text;
            popup.appendChild(p);
        }

        const buttons = document.createElement("section");
        popup.appendChild(buttons);

        actions
            ?.filter((i) => i)
            .forEach(({text, value, help, disabled, className = "", icon = ""}) => {
                const button = document.createElement("button");

                button.innerHTML = `
${icon}
<div>
                    <strong>${text}</strong>
                    <em>${help || ""}</em>
            </div>`;

                if (disabled) {
                    button.setAttribute("disabled", "disabled");
                } else {
                    button.addEventListener("click", (e) => {
                        e.preventDefault();
                        closeWithResult(value);
                    });
                }
                button.className = className;
                buttons.appendChild(button);
            });

        if (textAfterButtons) {
            const p = document.createElement("div");
            p.className = "textAfterButtons";
            p.innerHTML = textAfterButtons;
            popup.appendChild(p);
        }

        popupWrap.appendChild(popup);
        (
            popup.querySelector("button:not([disabled])") as HTMLButtonElement
        )?.focus();
    }).then(
        (v: unknown) => {
            alertsOpen--;
            closeModal = null;
            return v as t | undefined;
        },
        () => {
            closeModal = null;
            alertsOpen--;
        },
    );
}

// Settings
let cachedSettings: Partial<{ [key in OptionId]: boolean }> = {};

export function isSettingOn(key: OptionId) {
    if (typeof cachedSettings[key] == "undefined") {
        try {
            const ls = localStorage.getItem("breakout-settings-enable-" + key);
            if (ls) cachedSettings[key] = JSON.parse(ls) as boolean;
        } catch (e) {
            console.warn(e);
        }
    }
    return cachedSettings[key] ?? options[key]?.default ?? false;
}

export function toggleSetting(key: OptionId) {
    cachedSettings[key] = !isSettingOn(key);
    try {
        localStorage.setItem(
            "breakout-settings-enable-" + key,
            JSON.stringify(cachedSettings[key]),
        );
    } catch (e) {
        console.warn(e);
    }
    options[key].afterChange();
}

scoreDisplay.addEventListener("click", (e) => {
    e.preventDefault();
    openScorePanel();
});

async function openScorePanel() {
    pause(true);
    const cb = await asyncAlert({
        title: ` ${gameState.score} points at level ${gameState.currentLevel + 1} / ${max_levels()}`,
        text: `
            ${isCreativeModeRun ? "<p>This is a test run, score is not recorded permanently</p>" : ""}
            <p>Upgrades picked so far : </p>
            <p>${pickedUpgradesHTMl()}</p>
        `,
        allowClose: true,
        actions: [
            {
                text: "Resume",
                help: "Return to your run",
                value: () => {
                },
            },
            {
                text: "Restart",
                help: "Start a brand new run.",
                value: () => {
                     restart({levelToAvoid:  currentLevelInfo().name})
                },
            },
        ],
    });
    if (cb) {
        cb();
    }
}

document.getElementById("menu")?.addEventListener("click", (e) => {
    e.preventDefault();
    openSettingsPanel();
});

async function openSettingsPanel() {
    pause(true);

    const actions: AsyncAlertAction<() => void>[] = [
        {
            text: "Resume",
            help: "Return to your run",
            value() {
            },
        },
        {
            text: "Starting perk",
            help: "Try perks and levels you unlocked",
            value() {
                openUnlocksList();
            },
        },
    ];

    for (const key of Object.keys(options) as OptionId[]) {
        if (options[key])
            actions.push({
                disabled: options[key].disabled(),
                icon: isSettingOn(key)
                    ? icons["icon:checkmark_checked"]
                    : icons["icon:checkmark_unchecked"],
                text: options[key].name,
                help: options[key].help,
                value: () => {
                    toggleSetting(key);
                    openSettingsPanel();
                },
            });
    }
    const creativeModeThreshold = Math.max(...upgrades.map((u) => u.threshold));

    if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
        if (document.fullscreenElement !== null) {
            actions.push({
                text: "Exit Fullscreen",
                icon: icons["icon:exit_fullscreen"],
                help: "Might not work on some machines",
                value() {
                    toggleFullScreen();
                },
            });
        } else {
            actions.push({
                icon: icons["icon:fullscreen"],
                text: "Fullscreen",
                help: "Might not work on some machines",
                value() {
                    toggleFullScreen();
                },
            });
        }
    }
    actions.push({
        text: "Creative mode",
        help:
            getTotalScore() < creativeModeThreshold
                ? "Unlocks at total score $" + creativeModeThreshold
                : "Test runs with custom perks",
        disabled: getTotalScore() < creativeModeThreshold,
        async value() {
            let creativeModePerks: Partial<{ [id in PerkId]: number }> = {},
                choice: "start" | Upgrade | void;
            while (
                (choice = await asyncAlert<"start" | Upgrade>({
                    title: "Select perks",
                    text: 'Select perks below and press "start run" to try them out in a test run. Scores and stats are not recorded.',
                    actionsAsGrid: true,
                    actions: [
                        ...upgrades.map((u) => ({
                            icon: u.icon,
                            text: u.name,
                            help: (creativeModePerks[u.id] || 0) + "/" + u.max,
                            value: u,
                            className: creativeModePerks[u.id]
                                ? ""
                                : "grey-out-unless-hovered",
                        })),
                        {
                            text: "Start run",
                            value: "start",
                        },
                    ],
                }))
                ) {
                if (choice === "start") {
                    restart({perks:creativeModePerks});

                    break;
                } else if (choice) {
                    creativeModePerks[choice.id] =
                        ((creativeModePerks[choice.id] || 0) + 1) % (choice.max + 1);
                }
            }
        },
    });
    actions.push({
        text: "Reset Game",
        help: "Erase high score and statistics",
        async value() {
            if (
                await asyncAlert({
                    title: "Reset",
                    actions: [
                        {
                            text: "Yes",
                            value: true,
                        },
                        {
                            text: "No",
                            value: false,
                        },
                    ],
                    allowClose: true,
                })
            ) {
                localStorage.clear();
                window.location.reload();
            }
        },
    });

    const cb = await asyncAlert<() => void>({
        title: "Breakout 71",
        text: ``,
        allowClose: true,
        actions,
        textAfterButtons: `
        <p>
            <span>Made in France by <a href="https://lecaro.me">Renan LE CARO</a>.</span> 
            <a href="https://breakout.lecaro.me/privacy.html" target="_blank">Privacy Policy</a>
            <a href="https://f-droid.org/en/packages/me.lecaro.breakout/" target="_blank">F-Droid</a>
            <a href="https://play.google.com/store/apps/details?id=me.lecaro.breakout" target="_blank">Google Play</a>
            <a href="https://renanlecaro.itch.io/breakout71" target="_blank">itch.io</a> 
            <a href="https://gitlab.com/lecarore/breakout71" target="_blank">Gitlab</a>
            <a href="https://breakout.lecaro.me/" target="_blank">Web version</a>
            <a href="https://news.ycombinator.com/item?id=43183131" target="_blank">HackerNews</a>
            <span>v.${appVersion}</span>
         </p>
        `,
    });
    if (cb) {
        cb();
    }
}

async function openUnlocksList() {
    const ts = getTotalScore();
    const actions = [
        ...upgrades
            .sort((a, b) => a.threshold - b.threshold)
            .map(({name, id, threshold, icon, fullHelp}) => ({
                text: name,
                help:
                    ts >= threshold ? fullHelp : `Unlocks at total score ${threshold}.`,
                disabled: ts < threshold,
                value: {perk: id} as RunParams,
                icon,
            })),
        ...allLevels
            .sort((a, b) => a.threshold - b.threshold)
            .map((l) => {
                const available = ts >= l.threshold;
                return {
                    text: l.name,
                    help: available
                        ? `A ${l.size}x${l.size} level with ${l.bricks.filter((i) => i).length} bricks`
                        : `Unlocks at total score ${l.threshold}.`,
                    disabled: !available,
                    value: {level: l.name} as RunParams,
                    icon: icons[l.name],
                };
            }),
    ];

    const percentUnlock = Math.round(
        (actions.filter((a) => !a.disabled).length / actions.length) * 100,
    );
    const tryOn = await asyncAlert<RunParams>({
        title: `You unlocked ${percentUnlock}% of the game.`,
        text: `
                       <p> Your total score is ${ts}. Below are all the upgrades and levels the games has to offer.
                        ${percentUnlock < 100 ? "The greyed out ones can be unlocked by increasing your total score. The total score increases every time you score in game." : ""}</p> 
                       `,
        textAfterButtons: `<p> 
Your high score is ${gameState.highScore}. 
Click an item above to start a run with it.
                </p>`,
        actions,
        allowClose: true,
    });
    if (tryOn) {
        if (
            !gameState.currentLevel ||
            (await asyncAlert({
                title: "Restart run to try this item?",
                text: "You're about to start a new run with the selected unlocked item, is that really what you wanted ? ",
                actions: [
                    {
                        value: true,
                        text: "Restart game to test item",
                    },
                    {
                        value: false,
                        text: "Cancel",
                    },
                ],
            }))
        ) {
            restart(tryOn);
        }
    }
}

export function distance2(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

export function distanceBetween(
    a: { x: number; y: number },
    b: { x: number; y: number },
) {
    return Math.sqrt(distance2(a, b));
}

export function rainbowColor(): colorString {
    return `hsl(${(Math.round(levelTime / 4) * 2) % 360},100%,70%)`;
}

export function repulse(a: Ball, b: BallLike, power: number, impactsBToo: boolean) {
    const distance = distanceBetween(a, b);
    // Ensure we don't get soft locked
    const max = gameState.gameZoneWidth / 2;
    if (distance > max) return;
    // Unit vector
    const dx = (a.x - b.x) / distance;
    const dy = (a.y - b.y) / distance;
    const fact =
        (((-power * (max - distance)) / (max * 1.2) / 3) *
            Math.min(500, levelTime)) /
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
        time: levelTime,
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
            time: levelTime,
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

export function attract(a: Ball, b: Ball, power: number) {
    const distance = distanceBetween(a, b);
    // Ensure we don't get soft locked
    const min = gameState.gameZoneWidth * 0.5;
    if (distance < min) return;
    // Unit vector
    const dx = (a.x - b.x) / distance;
    const dy = (a.y - b.y) / distance;

    const fact =
        (((power * (distance - min)) / min) * Math.min(500, levelTime)) / 500;
    b.vx += dx * fact;
    b.vy += dy * fact;
    a.vx -= dx * fact;
    a.vy -= dy * fact;

    const speed = 10;
    const rand = 2;
    gameState.flashes.push({
        type: "particle",
        duration: 100,
        time: levelTime,
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
        time: levelTime,
        size: gameState.coinSize / 2,
        color: rainbowColor(),
        ethereal: true,
        x: b.x,
        y: b.y,
        vx: -dx * speed + b.vx + (Math.random() - 0.5) * rand,
        vy: -dy * speed + b.vy + (Math.random() - 0.5) * rand,
    });
}

let mediaRecorder: MediaRecorder | null,
    captureStream: MediaStream,
    captureTrack: CanvasCaptureMediaStreamTrack,
    recordCanvas: HTMLCanvasElement,
    recordCanvasCtx: CanvasRenderingContext2D;

export function recordOneFrame() {
    if (!isSettingOn("record")) {
        return;
    }
    if (!gameState.running) return;
    if (!captureStream) return;
    drawMainCanvasOnSmallCanvas();
    if (captureTrack?.requestFrame) {
        captureTrack?.requestFrame();
    } else if (captureStream?.requestFrame) {
        captureStream.requestFrame();
    }
}

export function drawMainCanvasOnSmallCanvas() {
    if (!recordCanvasCtx) return;
    recordCanvasCtx.drawImage(
        gameCanvas,
        gameState.offsetXRoundedDown,
        0,
        gameState.gameZoneWidthRoundedUp,
        gameState.gameZoneHeight,
        0,
        0,
        recordCanvas.width,
        recordCanvas.height,
    );

    // Here we don't use drawText as we don't want to cache a picture for each distinct value of score
    recordCanvasCtx.fillStyle = "#FFF";
    recordCanvasCtx.textBaseline = "top";
    recordCanvasCtx.font = "12px monospace";
    recordCanvasCtx.textAlign = "right";
    recordCanvasCtx.fillText(gameState.score.toString(), recordCanvas.width - 12, 12);

    recordCanvasCtx.textAlign = "left";
    recordCanvasCtx.fillText(
        "Level " + (gameState.currentLevel + 1) + "/" + max_levels(),
        12,
        12,
    );
}

export function startRecordingGame() {
    if (!isSettingOn("record")) {
        return;
    }
    if (mediaRecorder) return;
    if (!recordCanvas) {
        // Smaller canvas with fewer details
        recordCanvas = document.createElement("canvas");
        recordCanvasCtx = recordCanvas.getContext("2d", {
            antialias: false,
            alpha: false,
        }) as CanvasRenderingContext2D;

        captureStream = recordCanvas.captureStream(0);
        captureTrack =
            captureStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;

        const track = getAudioRecordingTrack();
        if (track) {
            captureStream.addTrack(track.stream.getAudioTracks()[0]);
        }
    }

    recordCanvas.width = gameState.gameZoneWidthRoundedUp;
    recordCanvas.height = gameState.gameZoneHeight;

    // drawMainCanvasOnSmallCanvas()
    const recordedChunks: Blob[] = [];

    const instance = new MediaRecorder(captureStream, {
        videoBitsPerSecond: 3500000,
    });
    mediaRecorder = instance;
    instance.start();
    mediaRecorder.pause();
    instance.ondataavailable = function (event) {
        recordedChunks.push(event.data);
    };

    instance.onstop = async function () {
        let targetDiv: HTMLElement | null;
        let blob = new Blob(recordedChunks, {type: "video/webm"});
        if (blob.size < 200000) return; // under 0.2MB, probably bugged out or pointlessly short

        while (
            !(targetDiv = document.getElementById("level-recording-container"))
            ) {
            await new Promise((r) => setTimeout(r, 200));
        }
        const video = document.createElement("video");
        video.autoplay = true;
        video.controls = false;
        video.disablePictureInPicture = true;
        video.disableRemotePlayback = true;
        video.width = recordCanvas.width;
        video.height = recordCanvas.height;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.download = captureFileName("webm");
        a.target = "_blank";
        a.href = video.src;
        a.textContent = `Download video (${(blob.size / 1000000).toFixed(2)}MB)`;
        targetDiv.appendChild(video);
        targetDiv.appendChild(a);
    };
}

export function pauseRecording() {
    if (!isSettingOn("record")) {
        return;
    }
    if (mediaRecorder?.state === "recording") {
        mediaRecorder?.pause();
    }
}

export function resumeRecording() {
    if (!isSettingOn("record")) {
        return;
    }
    if (mediaRecorder?.state === "paused") {
        mediaRecorder.resume();
    }
}

export function stopRecording() {
    if (!isSettingOn("record")) {
        return;
    }
    if (!mediaRecorder) return;
    mediaRecorder?.stop();
    mediaRecorder = null;
}

export function captureFileName(ext = "webm") {
    return (
        "breakout-71-capture-" +
        new Date().toISOString().replace(/[^0-9\-]+/gi, "-") +
        "." +
        ext
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

export function toggleFullScreen() {
    try {
        if (document.fullscreenElement !== null) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        } else {
            const docel = document.documentElement;
            if (docel.requestFullscreen) {
                docel.requestFullscreen();
            } else if (docel.webkitRequestFullscreen) {
                docel.webkitRequestFullscreen();
            }
        }
    } catch (e) {
        console.warn(e);
    }
}

const pressed: { [k: string]: number } = {
    ArrowLeft: 0,
    ArrowRight: 0,
    Shift: 0,
};

export function setKeyPressed(key: string, on: 0 | 1) {
    pressed[key] = on;
    keyboardPuckSpeed =
        ((pressed.ArrowRight - pressed.ArrowLeft) *
            (1 + pressed.Shift * 2) *
            gameState.gameZoneWidth) /
        50;
}

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
        toggleFullScreen();
    } else if (e.key in pressed) {
        setKeyPressed(e.key, 1);
    }
    if (e.key === " " && !alertsOpen) {
        if (gameState.running) {
            pause(true);
        } else {
            play();
        }
    } else {
        return;
    }
    e.preventDefault();
});

document.addEventListener("keyup", (e) => {
    const focused = document.querySelector("button:focus");
    if (e.key in pressed) {
        setKeyPressed(e.key, 0);
    } else if (
        e.key === "ArrowDown" &&
        focused?.nextElementSibling?.tagName === "BUTTON"
    ) {
        (focused?.nextElementSibling as HTMLButtonElement)?.focus();
    } else if (
        e.key === "ArrowUp" &&
        focused?.previousElementSibling?.tagName === "BUTTON"
    ) {
        (focused?.previousElementSibling as HTMLButtonElement)?.focus();
    } else if (e.key === "Escape" && closeModal) {
        closeModal();
    } else if (e.key === "Escape" && gameState.running) {
        pause(true);
    } else if (e.key.toLowerCase() === "m" && !alertsOpen) {
        openSettingsPanel();
    } else if (e.key.toLowerCase() === "s" && !alertsOpen) {
        openScorePanel();
    } else {
        return;
    }
    e.preventDefault();
});


let isCreativeModeRun = false;
let pauseUsesDuringRun = 0;
let keyboardPuckSpeed = 0;
let lastTick = performance.now();
let lastTickDown = 0;
let runStatistics = defaultRunStats();

function newGameState(params:RunParams): GameState {
    const totalScoreAtRunStart=getTotalScore()
    const firstLevel = params?.level ? allLevels.filter((l) => l.name === params?.level) : [];

    const restInRandomOrder = allLevels
        .filter((l) => totalScoreAtRunStart >= l.threshold)
        .filter((l) => l.name !== params?.level)
        .filter((l) => l.name !== params?.levelToAvoid)
        .sort(() => Math.random() - 0.5);

    const runLevels = firstLevel.concat(
        restInRandomOrder.slice(0, 7 + 3).sort((a, b) => a.sortKey - b.sortKey),
    );

    const perks={...makeEmptyPerksMap(),...(params?.perks || {})}
    isCreativeModeRun =sumOfKeys(perks)> 1


    const gameState:GameState = {
        runLevels,
        currentLevel: 0,
        perks ,
        puckWidth: 200,
        baseSpeed: 12,
        combo: 1,
        gridSize: 12,
        running: false,
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
        needsRender: true,
        score: 0,
        lastExplosion: -1000,
        highScore: parseFloat(localStorage.getItem("breakout-3-hs") || "0"),
        balls: [],
        ballsColor: "white",
        bricks: [],
        flashes: [],
        coins: [],
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
        totalScoreAtRunStart
    }
    resetBalls(gameState);

    if(!sumOfKeys(gameState.perks)){
        const giftable = getPossibleUpgrades(gameState).filter((u) => u.giftable);
        const randomGift = (isSettingOn("easy") && "slow_down") ||
            giftable[Math.floor(Math.random() * giftable.length)].id;
        perks[randomGift] = 1;
        dontOfferTooSoon(randomGift);
    }

    return gameState
}




export const gameState = newGameState({})

restart({});
fitSize();
tick();
