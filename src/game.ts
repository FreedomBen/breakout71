import {allLevels, appVersion, icons, upgrades} from "./loadGameData";
import {Ball, BallLike, Coin, colorString, Flash, FlashTypes, Level, PerkId, RunHistoryItem, RunStats} from "./types";
import {OptionId, options} from "./options";

const MAX_COINS = 400;
const MAX_PARTICLES = 600;
export const gameCanvas = document.getElementById("game") as HTMLCanvasElement;
let ctx = gameCanvas.getContext("2d", {alpha: false});

        const puckColor = "#FFF";
let ballSize = 20;
const coinSize = Math.round(ballSize * 0.8);
const puckHeight = ballSize;

allLevels.forEach((l, li) => {
    l.threshold =
        li < 8
            ? 0
            : Math.round(
                Math.min(Math.pow(10, 1 + (li + l.size) / 30) * 10, 5000) * li,
            );
    l.sortKey = ((Math.random() + 3) / 3.5) * l.bricks.filter((i) => i).length;
});

let runLevels: Level[] = [];

let currentLevel = 0;

const bombSVG = document.createElement("img");
bombSVG.src =
    "data:image/svg+xml;base64," +
    btoa(`<svg width="144" height="144" viewBox="0 0 38.101 38.099" xmlns="http://www.w3.org/2000/svg">
 <path d="m6.1528 26.516c-2.6992-3.4942-2.9332-8.281-.58305-11.981a10.454 10.454 0 017.3701-4.7582c1.962-.27726 4.1646.05953 5.8835.90027l.45013.22017.89782-.87417c.83748-.81464.91169-.87499 1.0992-.90271.40528-.058713.58876.03425 1.1971.6116l.55451.52679 1.0821-1.0821c1.1963-1.1963 1.383-1.3357 2.1039-1.5877.57898-.20223 1.5681-.19816 2.1691.00897 1.4613.50314 2.3673 1.7622 2.3567 3.2773-.0058.95654-.24464 1.5795-.90924 2.3746-.40936.48928-.55533.81057-.57898 1.2737-.02039.41018.1109.77714.42322 1.1792.30172.38816.3694.61323.2797.93044-.12803.45666-.56674.71598-1.0242.60507-.601-.14597-1.3031-1.3088-1.3969-2.3126-.09459-1.0161.19245-1.8682.92392-2.7432.42567-.50885.5643-.82851.5643-1.3031 0-.50151-.14026-.83177-.51211-1.2028-.50966-.50966-1.0968-.64829-1.781-.41996l-.37348.12477-2.1006 2.1006.52597.55696c.45421.48194.5325.58876.57898.78855.09622.41588.07502.45014-.88396 1.4548l-.87173.9125.26339.57979a10.193 10.193 0 01.9231 4.1001c.03996 2.046-.41996 3.8082-1.4442 5.537-.55044.928-1.0185 1.5013-1.8968 2.3241-.83503.78284-1.5526 1.2827-2.4904 1.7361-3.4266 1.657-7.4721 1.3422-10.549-.82035-.73473-.51782-1.7312-1.4621-2.2515-2.1357zm21.869-4.5584c-.0579-.19734-.05871-2.2662 0-2.4545.11906-.39142.57898-.63361 1.0038-.53005.23812.05708.54147.32455.6116.5382.06279.19163.06769 2.1805.0065 2.3811-.12558.40773-.61649.67602-1.0462.57164-.234-.05708-.51615-.30498-.57568-.50722m3.0417-2.6013c-.12313-.6222.37837-1.1049 1.0479-1.0079.18348.0261.25279.08399 1.0071.83911.75838.75838.81301.82362.84074 1.0112.10193.68499-.40365 1.1938-1.034 1.0405-.1949-.0473-.28786-.12558-1.0144-.85216-.7649-.76409-.80241-.81057-.84645-1.0316m.61323-3.0629a.85623.85623 0 01.59284-.99975c.28949-.09214 2.1814-.08318 2.3917.01141.38734.17369.6279.61078.53984.98181-.06035.25606-.35391.57327-.60181.64992-.25279.07747-2.2278.053-2.4097-.03017-.26013-.11906-.46318-.36125-.51374-.61323" fill="#fff" opacity="0.3"/>
</svg>`);

// Whatever
let puckWidth = 200;

const perks = {} as { [id in PerkId]: number };

let baseSpeed = 12; // applied to x and y
let combo = 1;

function baseCombo() {
    return 1 + perks.base_combo * 3 + perks.smaller_puck * 5;
}

function resetCombo(x: number | undefined, y: number | undefined) {
    const prev = combo;
    combo = baseCombo();
    if (!levelTime) {
        combo += perks.hot_start * 15;
    }
    if (prev > combo && perks.soft_reset) {
        combo += Math.floor((prev - combo) / (1 + perks.soft_reset));
    }
    const lost = Math.max(0, prev - combo);
    if (lost) {
        for (let i = 0; i < lost && i < 8; i++) {
            setTimeout(() => sounds.comboDecrease(), i * 100);
        }
        if (typeof x !== "undefined" && typeof y !== "undefined") {
            flashes.push({
                type: "text",
                text: "-" + lost,
                time: levelTime,
                color: "red",
                x: x,
                y: y,
                duration: 150,
                size: puckHeight,
            });
        }
    }
    return lost;
}

function decreaseCombo(by: number, x: number, y: number) {
    const prev = combo;
    combo = Math.max(baseCombo(), combo - by);
    const lost = Math.max(0, prev - combo);

    if (lost) {
        sounds.comboDecrease();
        if (typeof x !== "undefined" && typeof y !== "undefined") {
            flashes.push({
                type: "text",
                text: "-" + lost,
                time: levelTime,
                color: "red",
                x: x,
                y: y,
                duration: 300,
                size: puckHeight,
            });
        }
    }
}

let gridSize = 12;

let running = false,
    puck = 400,
    pauseTimeout: number | null = null;

function play() {
    if (running) return;
    running = true;
    if (audioContext) {
        audioContext.resume().then();
    }
    resumeRecording();
    document.body.className = running ? " running " : " paused ";
}

function pause(playerAskedForPause: boolean) {
    if (!running) return;
    if (pauseTimeout) return;

    pauseTimeout = setTimeout(
        () => {
            running = false;
            needsRender = true;
            if (audioContext) {
                setTimeout(() => {
                    if (!running) audioContext.suspend().then();
                }, 1000);
            }
            pauseRecording();
            pauseTimeout = null;
            document.body.className = running ? " running " : " paused ";
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

let offsetX: number,
    offsetXRoundedDown: number,
    gameZoneWidth: number,
    gameZoneWidthRoundedUp: number,
    gameZoneHeight: number,
    brickWidth: number,
    needsRender = true;

const background = document.createElement("img");
const backgroundCanvas = document.createElement("canvas");
background.addEventListener("load", () => {
    needsRender = true;
});

export const fitSize = () => {
    const {width, height} = gameCanvas.getBoundingClientRect();
    gameCanvas.width = width;
    gameCanvas.height = height;
    ctx.fillStyle = currentLevelInfo()?.color || "black";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, height);
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;

    gameZoneHeight = isSettingOn("mobile-mode") ? (height * 80) / 100 : height;
    const baseWidth = Math.round(Math.min(gameCanvas.width, gameZoneHeight * 0.73));
    brickWidth = Math.floor(baseWidth / gridSize / 2) * 2;
    gameZoneWidth = brickWidth * gridSize;
    offsetX = Math.floor((gameCanvas.width - gameZoneWidth) / 2);
    offsetXRoundedDown = offsetX;
    if (offsetX < ballSize) offsetXRoundedDown = 0;
    gameZoneWidthRoundedUp = width - 2 * offsetXRoundedDown;
    backgroundCanvas.title = "resized";
    // Ensure puck stays within bounds
    setMousePos(puck);
    coins = [];
    flashes = [];
    pause(true);
    putBallsAtPuck();
    // For safari mobile https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`,
    );
};
window.addEventListener("resize", fitSize);
window.addEventListener("fullscreenchange", fitSize);

function recomputeTargetBaseSpeed() {
    // We never want the ball to completely stop, it will move at least 3px per frame
    baseSpeed = Math.max(
        3,
        gameZoneWidth / 12 / 10 +
        currentLevel / 3 +
        levelTime / (30 * 1000) -
        perks.slow_down * 2,
    );
}

function brickCenterX(index: number) {
    return offsetX + ((index % gridSize) + 0.5) * brickWidth;
}

function brickCenterY(index: number) {
    return (Math.floor(index / gridSize) + 0.5) * brickWidth;
}

function getRowColIndex(row: number, col: number) {
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) return -1;
    return row * gridSize + col;
}

function spawnExplosion(count: number, x: number, y: number, color: string, duration = 150, size = coinSize) {
    if (!!isSettingOn("basic")) return;
    if (flashes.length > MAX_PARTICLES) {
        // Avoid freezing when lots of explosion happen at once
        count = 1;
    }
    for (let i = 0; i < count; i++) {
        flashes.push({
            type: "particle",
            time: levelTime,
            size,
            x: x + ((Math.random() - 0.5) * brickWidth) / 2,
            y: y + ((Math.random() - 0.5) * brickWidth) / 2,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            color,
            duration,
        });
    }
}

let score = 0;

let lastExplosion = 0;
let highScore = parseFloat(localStorage.getItem("breakout-3-hs") || "0");

let lastPlayedCoinGrab = 0;

function addToScore(coin: Coin) {
    coin.destroyed = true;
    score += coin.points;
    addToTotalScore(coin.points);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("breakout-3-hs", score.toString());
    }
    if (!isSettingOn("basic")) {
        flashes.push({
            type: "particle",
            duration: 100 + Math.random() * 50,
            time: levelTime,
            size: coinSize / 2,
            color: coin.color,
            x: coin.previousx,
            y: coin.previousy,
            vx: (gameCanvas.width - coin.x) / 100,
            vy: -coin.y / 100,
            ethereal: true,
        });
    }

    if (Date.now() - lastPlayedCoinGrab > 16) {
        lastPlayedCoinGrab = Date.now();
        sounds.coinCatch(coin.x);
    }
    runStatistics.score += coin.points;
}

let balls: Ball[] = [];
let ballsColor:colorString = "white" ;

function resetBalls() {
    const count = 1 + (perks?.multiball || 0);
    const perBall = puckWidth / (count + 1);
    balls = [];
    ballsColor = "#FFF";
    for (let i = 0; i < count; i++) {
        const x = puck - puckWidth / 2 + perBall * (i + 1);
        balls.push({
            x,
            previousx: x,
            y: gameZoneHeight - 1.5 * ballSize,
            previousy: gameZoneHeight - 1.5 * ballSize,
            vx: Math.random() > 0.5 ? baseSpeed : -baseSpeed,
            vy: -baseSpeed,
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

function putBallsAtPuck() {
    // This reset could be abused to cheat quite easily
    const count = balls.length;
    const perBall = puckWidth / (count + 1);
    balls.forEach((ball, i) => {
        const x = puck - puckWidth / 2 + perBall * (i + 1);
        ball.x = x;
        ball.previousx = x;
        ball.y = gameZoneHeight - 1.5 * ballSize;
        ball.previousy = ball.y;
        ball.vx = Math.random() > 0.5 ? baseSpeed : -baseSpeed;
        ball.vy = -baseSpeed;
        ball.sx = 0;
        ball.sy = 0;
        ball.hitItem = [];
        ball.hitSinceBounce = 0;
        ball.piercedSinceBounce = 0;
    });
}

resetBalls();
// Default, recomputed at each level load
let bricks : colorString[] = [];
let flashes :Flash[] = [];
let coins: Coin[] = [];
let levelStartScore = 0;
let levelMisses = 0;
let levelSpawnedCoins = 0;

function pickedUpgradesHTMl() {
    let list = "";
    for (let u of upgrades) {
        for (let i = 0; i < perks[u.id]; i++) list += icons["icon:" + u.id] + " ";
    }
    return list;
}

async function openUpgradesPicker() {
    const catchRate = (score - levelStartScore) / (levelSpawnedCoins || 1);

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
    if (levelMisses === 0) {
        repeats++;
        choices++;
        missesGain = " (+1 upgrade and choice)";
    } else if (levelMisses <= 3) {
        choices++;
        missesGain = " (+1 choice)";
    }

    while (repeats--) {
        const actions = pickRandomUpgrades(
            choices + perks.one_more_choice - perks.instant_upgrade,
        );
        if (!actions.length) break;
        let textAfterButtons = `
        <p>You just finished level ${currentLevel + 1}/${max_levels()} and picked those upgrades so far : </p><p>${pickedUpgradesHTMl()}</p>
        <div id="level-recording-container"></div> 
        
        `;

        const upgradeId = (await asyncAlert<PerkId>({
            title: "Pick an upgrade " + (repeats ? "(" + (repeats + 1) + ")" : ""),
            actions,
            text: `<p>
                You caught ${score - levelStartScore} coins ${catchGain} out of ${levelSpawnedCoins} in ${Math.round(levelTime / 1000)} seconds${timeGain}.
        You missed ${levelMisses} times ${missesGain}. 
        ${(timeGain && catchGain && missesGain && "Impressive, keep it up !") || ((timeGain || catchGain || missesGain) && "Well done !") || "Try to catch all coins, never miss the bricks or clear the level under 30s to gain additional choices and upgrades."}
        </p>`,
            allowClose: false,
            textAfterButtons,
        })) as PerkId;

        perks[upgradeId]++;
        if (upgradeId === "instant_upgrade") {
            repeats += 2;
        }

        runStatistics.upgrades_picked++;
    }
    resetCombo(undefined, undefined);
    resetBalls();
}

function setLevel(l:number) {
    pause(false);
    if (l > 0) {
        openUpgradesPicker().then();
    }
    currentLevel = l;

    levelTime = 0;
    lastTickDown = levelTime;
    levelStartScore = score;
    levelSpawnedCoins = 0;
    levelMisses = 0;
    runStatistics.levelsPlayed++;

    resetCombo(undefined, undefined);
    recomputeTargetBaseSpeed();
    resetBalls();

    const lvl = currentLevelInfo();
    if (lvl.size !== gridSize) {
        gridSize = lvl.size;
        fitSize();
    }
    coins = [];
    bricks = [...lvl.bricks];
    flashes = [];

    // This caused problems with accented characters like the ô of côte d'ivoire for odd reasons
    // background.src = 'data:image/svg+xml;base64,' + btoa(lvl.svg)
    background.src = "data:image/svg+xml;UTF8," + lvl.svg;
    stopRecording();
    startRecordingGame();
}

function currentLevelInfo() {
    return runLevels[currentLevel % runLevels.length];
}

function reset_perks():PerkId {
    for (let u of upgrades) {
        perks[u.id] = 0;
    }

    const giftable = getPossibleUpgrades().filter((u) => u.giftable);
    const randomGift =
        nextRunOverrides?.perk   ||
        (isSettingOn("easy") && "slow_down" ) ||  giftable[Math.floor(Math.random() * giftable.length)].id;

    perks[randomGift] = 1;

    delete nextRunOverrides.perk;
    return randomGift as PerkId;
}

let totalScoreAtRunStart = getTotalScore();

function getPossibleUpgrades() {
    return upgrades
        .filter((u) => totalScoreAtRunStart >= u.threshold)
        .filter((u) => !u?.requires || perks[u?.requires]);
}

function shuffleLevels(nameToAvoid = null) {
    const target = nextRunOverrides?.level;
    const firstLevel = nextRunOverrides?.level
        ? allLevels.filter((l) => l.name === target)
        : [];

    const restInRandomOrder = allLevels
        .filter((l) => totalScoreAtRunStart >= l.threshold)
        .filter((l) => l.name !== nextRunOverrides?.level)
        .filter((l) => l.name !== nameToAvoid || allLevels.length === 1)
        .sort(() => Math.random() - 0.5);

    runLevels = firstLevel.concat(
        restInRandomOrder.slice(0, 7 + 3).sort((a, b) => a.sortKey - b.sortKey),
    );
}

function getUpgraderUnlockPoints() {
    let list = [];

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

let lastOffered = {} as {[k in PerkId]:number};

function dontOfferTooSoon(id:PerkId) {
    lastOffered[id] = Math.round(Date.now() / 1000);
}

function pickRandomUpgrades(count: number) {
    let list = getPossibleUpgrades()
        .map((u) => ({...u, score: Math.random() + (lastOffered[u.id] || 0)}))
        .sort((a, b) => a.score - b.score)
        .filter((u) => perks[u.id] < u.max)
        .slice(0, count)
        .sort((a, b) => (a.id > b.id ? 1 : -1));

    list.forEach((u) => {
        dontOfferTooSoon(u.id);
    });

    return list.map((u) => ({
        text: u.name + (perks[u.id] ? " lvl " + (perks[u.id] + 1) : ""),
        icon: icons["icon:" + u.id],
        value: u.id as PerkId,
        help: u.help(perks[u.id] + 1),
    }));
}

type RunOverrides = { level?: PerkId; perk?: string };

let nextRunOverrides = {} as RunOverrides;


let pauseUsesDuringRun = 0;

function restart() {
    // When restarting, we want to avoid restarting with the same level we're on, so we exclude from the next
    // run's level list
    totalScoreAtRunStart = getTotalScore();
    shuffleLevels(levelTime || score ? currentLevelInfo().name : null);
    resetRunStatistics();
    score = 0;
    pauseUsesDuringRun = 0;

    const randomGift = reset_perks();

    dontOfferTooSoon(randomGift);

    setLevel(0);
    pauseRecording();
}

let keyboardPuckSpeed = 0;

function setMousePos(x:number) {
    needsRender = true;
    puck = x;

    // We have borders visible, enforce them
    if (puck < offsetXRoundedDown + puckWidth / 2) {
        puck = offsetXRoundedDown + puckWidth / 2;
    }
    if (puck > offsetXRoundedDown + gameZoneWidthRoundedUp - puckWidth / 2) {
        puck = offsetXRoundedDown + gameZoneWidthRoundedUp - puckWidth / 2;
    }
    if (!running && !levelTime) {
        putBallsAtPuck();
    }
}

gameCanvas.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    if (running) {
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
        setMousePos(puck + e.movementX);
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
    needsRender = true;
});
gameCanvas.addEventListener("touchmove", (e) => {
    if (!e.touches?.length) return;
    setMousePos(e.touches[0].pageX);
});

let lastTick = performance.now();

function brickIndex(x:number, y:number) {
    return getRowColIndex(
        Math.floor(y / brickWidth),
        Math.floor((x - offsetX) / brickWidth),
    );
}

function hasBrick(index:number):number|undefined {
    if (bricks[index]) return index;
}

function hitsSomething(x:number, y:number, radius:number) {
    return (
        hasBrick(brickIndex(x - radius, y - radius)) ??
        hasBrick(brickIndex(x + radius, y - radius)) ??
        hasBrick(brickIndex(x + radius, y + radius)) ??
        hasBrick(brickIndex(x - radius, y + radius))
    );
}

function shouldPierceByColor(vhit:number|undefined, hhit:number|undefined, chit:number|undefined) {
    if (!perks.pierce_color) return false;
    if (typeof vhit !== "undefined" && bricks[vhit] !== ballsColor) {
        return false;
    }
    if (typeof hhit !== "undefined" && bricks[hhit] !== ballsColor) {
        return false;
    }
    if (typeof chit !== "undefined" && bricks[chit] !== ballsColor) {
        return false;
    }
    return true;
}

function ballBrickHitCheck(ball:Ball) {
    const radius=ballSize / 2
    // Make ball/coin bonce, and return bricks that were hit
    const {x, y, previousx, previousy} = ball;

    const vhit = hitsSomething(previousx, y, radius);
    const hhit = hitsSomething(x, previousy, radius);
    const chit =
        (typeof vhit == "undefined" &&
            typeof hhit == "undefined" &&
            hitsSomething(x, y, radius)) ||
        undefined;

    let pierce =   ball.piercedSinceBounce < perks.pierce * 3;
    if (
        pierce &&
        (typeof vhit !== "undefined" ||
            typeof hhit !== "undefined" ||
            typeof chit !== "undefined")
    ) {
        ball.piercedSinceBounce++;
    }
    if (  shouldPierceByColor(vhit, hhit, chit)) {
        pierce = true;
    }

    if (typeof vhit !== "undefined" || typeof chit !== "undefined") {
        if (!pierce) {
            ball.y = ball.previousy;
            ball.vy *= -1;
        }

    }
    if (typeof hhit !== "undefined" || typeof chit !== "undefined") {
        if (!pierce) {
            ball.x = ball.previousx;
            ball.vx *= -1;
        }
    }

    return vhit ?? hhit ?? chit;
}
function coinBrickHitCheck(coin:Coin) {

    // Make ball/coin bonce, and return bricks that were hit
    const radius=coinSize/2
    const {x, y, previousx, previousy} = coin;

    const vhit = hitsSomething(previousx, y, radius);
    const hhit = hitsSomething(x, previousy, radius);
    const chit =
        (typeof vhit == "undefined" &&
            typeof hhit == "undefined" &&
            hitsSomething(x, y, radius)) ||
        undefined;

    if (typeof vhit !== "undefined" || typeof chit !== "undefined") {
            coin.y = coin.previousy;
            coin.vy *= -1;

            //   Roll on corners
            const leftHit = bricks[brickIndex(x - radius, y + radius)];
            const rightHit = bricks[brickIndex(x + radius, y + radius)];

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
        coin.x = coin.previousx;
        coin.vx *= -1;
    }
    return vhit ?? hhit ?? chit;
}

function bordersHitCheck(coin:Coin|Ball, radius:number, delta:number) {
    if (coin.destroyed) return;
    coin.previousx = coin.x;
    coin.previousy = coin.y;
    coin.x += coin.vx * delta;
    coin.y += coin.vy * delta;
    coin.sx ||= 0;
    coin.sy ||= 0;
    coin.sx += coin.previousx - coin.x;
    coin.sy += coin.previousy - coin.y;
    coin.sx *= 0.9;
    coin.sy *= 0.9;

    if (perks.wind) {
        coin.vx +=
            ((puck - (offsetX + gameZoneWidth / 2)) / gameZoneWidth) *
            perks.wind *
            0.5;
    }

    let vhit = 0,
        hhit = 0;

    if (coin.x < offsetXRoundedDown + radius) {
        coin.x = offsetXRoundedDown + radius;
        coin.vx *= -1;
        hhit = 1;
    }
    if (coin.y < radius) {
        coin.y = radius;
        coin.vy *= -1;
        vhit = 1;
    }
    if (coin.x > gameCanvas.width - offsetXRoundedDown - radius) {
        coin.x = gameCanvas.width - offsetXRoundedDown - radius;
        coin.vx *= -1;
        hhit = 1;
    }

    return hhit + vhit * 2;
}

let lastTickDown = 0;

function tick() {
    recomputeTargetBaseSpeed();
    const currentTick = performance.now();

    puckWidth =
        (gameZoneWidth / 12) * (3 - perks.smaller_puck + perks.bigger_puck);

    if (keyboardPuckSpeed) {
        setMousePos(puck + keyboardPuckSpeed);
    }

    if (running) {
        levelTime += currentTick - lastTick;
        runStatistics.runTime += currentTick - lastTick;
        runStatistics.max_combo = Math.max(runStatistics.max_combo, combo);

        // How many times to compute
        let delta = Math.min(4, (currentTick - lastTick) / (1000 / 60));
        delta *= running ? 1 : 0;

        coins = coins.filter((coin) => !coin.destroyed);
        balls = balls.filter((ball) => !ball.destroyed);

        const remainingBricks = bricks.filter((b) => b && b !== "black").length;

        if (levelTime > lastTickDown + 1000 && perks.hot_start) {
            lastTickDown = levelTime;
            decreaseCombo(perks.hot_start, puck, gameZoneHeight - 2 * puckHeight);
        }

        if (remainingBricks <= perks.skip_last) {
            bricks.forEach((type, index) => {
                if (type) {
                    explodeBrick(index, balls[0], true);
                }
            });
        }
        if (!remainingBricks && !coins.length) {
            if (currentLevel + 1 < max_levels()) {
                setLevel(currentLevel + 1);
            } else {
                gameOver(
                    "Run finished with " + score + " points",
                    "You cleared all levels for this run.",
                );
            }
        } else if (running || levelTime) {
            let playedCoinBounce = false;
            const coinRadius = Math.round(coinSize / 2);

            coins.forEach((coin) => {
                if (coin.destroyed) return;
                if (perks.coin_magnet) {
                    coin.vx +=
                        ((delta * (puck - coin.x)) /
                            (100 +
                                Math.pow(coin.y - gameZoneHeight, 2) +
                                Math.pow(coin.x - puck, 2))) *
                        perks.coin_magnet *
                        100;
                }

                const ratio = 1 - (perks.viscosity * 0.03 + 0.005) * delta;

                coin.vy *= ratio;
                coin.vx *= ratio;
                if (coin.vx > 7 * baseSpeed) coin.vx = 7 * baseSpeed;
                if (coin.vx < -7 * baseSpeed) coin.vx = -7 * baseSpeed;
                if (coin.vy > 7 * baseSpeed) coin.vy = 7 * baseSpeed;
                if (coin.vy < -7 * baseSpeed) coin.vy = -7 * baseSpeed;
                coin.a += coin.sa;

                // Gravity
                coin.vy += delta * coin.weight * 0.8;

                const speed = Math.abs(coin.sx) + Math.abs(coin.sx);
                const hitBorder = bordersHitCheck(coin, coinRadius, delta);

                if (
                    coin.y > gameZoneHeight - coinRadius - puckHeight &&
                    coin.y < gameZoneHeight + puckHeight + coin.vy &&
                    Math.abs(coin.x - puck) <
                    coinRadius +
                    puckWidth / 2 + // a bit of margin to be nice
                    puckHeight
                ) {
                    addToScore(coin);
                } else if (coin.y > gameCanvas.height + coinRadius) {
                    coin.destroyed = true;
                    if (perks.compound_interest) {
                        resetCombo(
                            coin.x,coin.y
                        );
                    }
                }

                const hitBrick = coinBrickHitCheck(coin);

                if (perks.metamorphosis && typeof hitBrick !== "undefined") {
                    if (
                        bricks[hitBrick] &&
                        coin.color !== bricks[hitBrick] &&
                        bricks[hitBrick] !== "black" &&
                        !coin.coloredABrick
                    ) {
                        bricks[hitBrick] = coin.color;
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

            balls.forEach((ball) => ballTick(ball, delta));

            if (perks.wind) {
                const windD =
                    ((puck - (offsetX + gameZoneWidth / 2)) / gameZoneWidth) *
                    2 *
                    perks.wind;
                for (let i = 0; i < perks.wind; i++) {
                    if (Math.random() * Math.abs(windD) > 0.5) {
                        flashes.push({
                            type: "particle",
                            duration: 150,
                            ethereal: true,
                            time: levelTime,
                            size: coinSize / 2,
                            color: rainbowColor(),
                            x: offsetXRoundedDown + Math.random() * gameZoneWidthRoundedUp,
                            y: Math.random() * gameZoneHeight,
                            vx: windD * 8,
                            vy: 0,
                        });
                    }
                }
            }

            flashes.forEach((flash) => {
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

        if (combo > baseCombo()) {
            // The red should still be visible on a white bg
            const baseParticle = !isSettingOn("basic") &&
                (combo - baseCombo()) * Math.random() > 5 &&
                running && {
                    type: "particle" as FlashTypes,
                    duration: 100 * (Math.random() + 1),
                    time: levelTime,
                    size: coinSize / 2,
                    color: "red",
                    ethereal: true,
                };

            if (perks.top_is_lava) {
                baseParticle &&
                flashes.push({
                    ...baseParticle,
                    x: offsetXRoundedDown + Math.random() * gameZoneWidthRoundedUp,
                    y: 0,
                    vx: (Math.random() - 0.5) * 10,
                    vy: 5,
                });
            }
            if (perks.sides_are_lava) {
                const fromLeft = Math.random() > 0.5;
                baseParticle &&
                flashes.push({
                    ...baseParticle,
                    x: offsetXRoundedDown + (fromLeft ? 0 : gameZoneWidthRoundedUp),
                    y: Math.random() * gameZoneHeight,
                    vx: fromLeft ? 5 : -5,
                    vy: (Math.random() - 0.5) * 10,
                });
            }
            if (perks.compound_interest) {
                let x = puck, attemps=0;
                do {
                    x = offsetXRoundedDown + gameZoneWidthRoundedUp * Math.random();
                    attemps++
                } while (Math.abs(x - puck) < puckWidth / 2 && attemps<10);
                baseParticle &&
                flashes.push({
                    ...baseParticle,
                    x,
                    y: gameZoneHeight,
                    vx: (Math.random() - 0.5) * 10,
                    vy: -5,
                });
            }
            if (perks.streak_shots) {
                const pos = 0.5 - Math.random();
                baseParticle &&
                flashes.push({
                    ...baseParticle,
                    duration: 100,
                    x: puck + puckWidth * pos,
                    y: gameZoneHeight - puckHeight,
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

function isTelekinesisActive(ball:Ball) {
    return perks.telekinesis && !ball.hitSinceBounce && ball.vy < 0;
}

function ballTick(ball:Ball, delta:number) {
    ball.previousvx = ball.vx;
    ball.previousvy = ball.vy;

    let speedLimitDampener =
        1 +
        perks.telekinesis +
        perks.ball_repulse_ball +
        perks.puck_repulse_ball +
        perks.ball_attract_ball;
    if (isTelekinesisActive(ball)) {
        speedLimitDampener += 3;
        ball.vx += ((puck - ball.x) / 1000) * delta * perks.telekinesis;
    }

    if (ball.vx * ball.vx + ball.vy * ball.vy < baseSpeed * baseSpeed * 2) {
        ball.vx *= 1 + 0.02 / speedLimitDampener;
        ball.vy *= 1 + 0.02 / speedLimitDampener;
    } else {
        ball.vx *= 1 - 0.02 / speedLimitDampener;
        ball.vy *= 1 - 0.02 / speedLimitDampener;
    }
    // Ball could get stuck horizontally because of ball-ball interactions in repulse/attract
    if (Math.abs(ball.vy) < 0.2 * baseSpeed) {
        ball.vy += ((ball.vy > 0 ? 1 : -1) * 0.02) / speedLimitDampener;
    }

    if (perks.ball_repulse_ball) {
        for (let b2 of balls) {
            // avoid computing this twice, and repulsing itself
            if (b2.x >= ball.x) continue;
            repulse(ball, b2, perks.ball_repulse_ball, true);
        }
    }
    if (perks.ball_attract_ball) {
        for (let b2 of balls) {
            // avoid computing this twice, and repulsing itself
            if (b2.x >= ball.x) continue;
            attract(ball, b2, perks.ball_attract_ball);
        }
    }
    if (
        perks.puck_repulse_ball &&
        Math.abs(ball.x - puck) <
        puckWidth / 2 + (ballSize * (9 + perks.puck_repulse_ball)) / 10
    ) {
        repulse(
            ball,
            {
                x: puck,
                y: gameZoneHeight,
            },
            perks.puck_repulse_ball,
            false,
        );
    }

    if (perks.respawn && ball.hitItem?.length > 1 && !isSettingOn("basic")) {
        for (let i = 0; i < ball.hitItem?.length - 1 && i < perks.respawn; i++) {
            const {index, color} = ball.hitItem[i];
            if (bricks[index] || color === "black") continue;
            const vertical = Math.random() > 0.5;
            const dx = Math.random() > 0.5 ? 1 : -1;
            const dy = Math.random() > 0.5 ? 1 : -1;

            flashes.push({
                type: "particle",
                duration: 250,
                ethereal: true,
                time: levelTime,
                size: coinSize / 2,
                color,
                x: brickCenterX(index) + (dx * brickWidth) / 2,
                y: brickCenterY(index) + (dy * brickWidth) / 2,
                vx: vertical ? 0 : -dx * baseSpeed,
                vy: vertical ? -dy * baseSpeed : 0,
            });
        }
    }

    const borderHitCode = bordersHitCheck(ball, ballSize / 2, delta);
    if (borderHitCode) {
        if (perks.sides_are_lava && borderHitCode % 2) {
            resetCombo(ball.x, ball.y);
        }
        if (perks.top_is_lava && borderHitCode >= 2) {
            resetCombo(ball.x, ball.y + ballSize);
        }
        sounds.wallBeep(ball.x);
        ball.bouncesList?.push({x: ball.previousx, y: ball.previousy});
    }

    // Puck collision
    const ylimit = gameZoneHeight - puckHeight - ballSize / 2;
    if (
        ball.y > ylimit &&
        Math.abs(ball.x - puck) < ballSize / 2 + puckWidth / 2 &&
        ball.vy > 0
    ) {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const angle = Math.atan2(-puckWidth / 2, ball.x - puck);
        ball.vx = speed * Math.cos(angle);
        ball.vy = speed * Math.sin(angle);

        sounds.wallBeep(ball.x);
        if (perks.streak_shots) {
            resetCombo(ball.x, ball.y);
        }

        if (perks.respawn) {
            ball.hitItem
                .slice(0, -1)
                .slice(0, perks.respawn)
                .forEach(({index, color}) => {
                    if (!bricks[index] && color !== "black") bricks[index] = color;
                });
        }
        ball.hitItem = [];
        if (!ball.hitSinceBounce) {
            runStatistics.misses++;
            levelMisses++;
            resetCombo(ball.x, ball.y);
            flashes.push({
                type: "text",
                text: "miss",
                duration: 500,
                time: levelTime,
                size: puckHeight * 1.5,
                color: "red",
                x: puck,
                y: gameZoneHeight - puckHeight * 2,
            });
        }
        runStatistics.puck_bounces++;
        ball.hitSinceBounce = 0;
        ball.sapperUses = 0;
        ball.piercedSinceBounce = 0;
        ball.bouncesList = [
            {
                x: ball.previousx,
                y: ball.previousy,
            },
        ];
    }

    if (ball.y > gameZoneHeight + ballSize / 2 && running) {
        ball.destroyed = true;
        runStatistics.balls_lost++;
        if (!balls.find((b) => !b.destroyed)) {
            if (perks.extra_life) {
                perks.extra_life--;
                resetBalls();
                sounds.revive();
                pause(false);
                coins = [];
                flashes.push({
                    type: "ball",
                    duration: 500,
                    time: levelTime,
                    size: brickWidth * 2,
                    color: "white",
                    x: ball.x,
                    y: ball.y,
                });
            } else {
                gameOver(
                    "Game Over",
                    "You dropped the ball after catching " + score + " coins. ",
                );
            }
        }
    }
    const hitBrick = ballBrickHitCheck(ball);
    if (typeof hitBrick !== "undefined") {
        const initialBrickColor = bricks[hitBrick];

        explodeBrick(hitBrick, ball, false);

        if (
            ball.sapperUses < perks.sapper &&
            initialBrickColor !== "black" && // don't replace a brick that bounced with sturdy_bricks
            !bricks[hitBrick]
        ) {
            bricks[hitBrick] = "black";
            ball.sapperUses++;
        }
    }

    if (!isSettingOn("basic")) {
        ball.sparks += (delta * (combo - 1)) / 30;
        if (ball.sparks > 1) {
            flashes.push({
                type: "particle",
                duration: 100 * ball.sparks,
                time: levelTime,
                size: coinSize / 2,
                color: ballsColor,
                x: ball.x,
                y: ball.y,
                vx: (Math.random() - 0.5) * baseSpeed,
                vy: (Math.random() - 0.5) * baseSpeed,
            });
            ball.sparks = 0;
        }
    }
}

const defaultRunStats = () => ({
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
let runStatistics = defaultRunStats();

function resetRunStatistics() {
    runStatistics = defaultRunStats();
}

function getTotalScore() {
    try {
        return JSON.parse(localStorage.getItem("breakout_71_total_score") || "0");
    } catch (e) {
        return 0;
    }
}

function addToTotalScore(points:number) {
    try {
        localStorage.setItem(
            "breakout_71_total_score",
            JSON.stringify(getTotalScore() + points),
        );
    } catch (e) {
    }
}

function addToTotalPlayTime(ms:number) {
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

function gameOver(title:string, intro:string) {
    if (!running) return;
    pause(true);
    stopRecording();
    addToTotalPlayTime(runStatistics.runTime);
    runStatistics.max_level = currentLevel + 1;

    let animationDelay = -300;
    const getDelay = () => {
        animationDelay += 800;
        return "animation-delay:" + animationDelay + "ms;";
    };
    // unlocks
    let unlocksInfo = "";
    const endTs = getTotalScore();
    const startTs = endTs - score;
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
    combo = 1;

    asyncAlert({
        allowClose: true,
        title,
        text: `
        <p>${intro}</p>
        ${unlocksInfo}  
        `,
        actions:[{
            value:null,
            text:'Start a new run',
            help:'',
        }],
        textAfterButtons: `<div id="level-recording-container"></div>
        ${getHistograms()} 
        `,
    }).then(() => restart());

}

function getHistograms() {
    let runStats = "";
    try {
        // Stores only top 100 runs
        let runsHistory = JSON.parse(
            localStorage.getItem("breakout_71_runs_history") || "[]",
        ) as RunHistoryItem[];
        runsHistory.sort((a, b) => a.score - b.score).reverse();
        runsHistory = runsHistory.slice(0, 100);

        runsHistory.push({...runStatistics, perks,appVersion});

        // Generate some histogram

        localStorage.setItem(
            "breakout_71_runs_history",
            JSON.stringify(runsHistory, null, 2),
        );

        const makeHistogram = (title:string, getter: (hi:RunHistoryItem)=>number, unit:string) => {
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
            const bins = [];
            const binsTotal = [];
            for (let i = 0; i < binsCount; i++) {
                bins.push(0);
                binsTotal.push(0);
            }
            const binSize = (max - min) / bins.length;
            const binIndexOf = (v:number) =>
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

function explodeBrick(index:number, ball:Ball, isExplosion:boolean) {
    const color = bricks[index];
    if (!color) return;

    if (color === "black") {
        delete bricks[index];
        const x = brickCenterX(index),
            y = brickCenterY(index);

        sounds.explode(ball.x);

        const col = index % gridSize;
        const row = Math.floor(index / gridSize);
        const size = 1 + perks.bigger_explosions;
        // Break bricks around
        for (let dx = -size; dx <= size; dx++) {
            for (let dy = -size; dy <= size; dy++) {
                const i = getRowColIndex(row + dy, col + dx);
                if (bricks[i] && i !== -1) {
                    explodeBrick(i, ball, true);
                }
            }
        }

        // Blow nearby coins
        coins.forEach((c) => {
            const dx = c.x - x;
            const dy = c.y - y;
            const d2 = Math.max(brickWidth, Math.abs(dx) + Math.abs(dy));
            c.vx += ((dx / d2) * 10 * size) / c.weight;
            c.vy += ((dy / d2) * 10 * size) / c.weight;
        });
        lastExplosion = Date.now();

        flashes.push({
            type: "ball",
            duration: 150,
            time: levelTime,
            size: brickWidth * 2,
            color: "white",
            x,
            y,
        });
        spawnExplosion(
            7 * (1 + perks.bigger_explosions),
            x,
            y,
            "white",
            150,
            coinSize,
        );
        ball.hitSinceBounce++;
        runStatistics.bricks_broken++;
    } else if (color) {
        // Even if it bounces we don't want to count that as a miss
        ball.hitSinceBounce++;

        if (perks.sturdy_bricks && perks.sturdy_bricks > Math.random() * 5) {
            // Resist
            sounds.coinBounce(ball.x, 1);
            return;
        }
        // Flashing is take care of by the tick loop
        const x = brickCenterX(index),
            y = brickCenterY(index);

        bricks[index] = "";

        // coins = coins.filter((c) => !c.destroyed);
        let coinsToSpawn = combo;
        if (perks.sturdy_bricks) {
            // +10% per level
            coinsToSpawn += Math.ceil(
                ((10 + perks.sturdy_bricks) / 10) * coinsToSpawn,
            );
        }

        levelSpawnedCoins += coinsToSpawn;
        runStatistics.coins_spawned += coinsToSpawn;
        runStatistics.bricks_broken++;
        const maxCoins = MAX_COINS * (isSettingOn("basic") ? 0.5 : 1);
        const spawnableCoins =
            coins.length > MAX_COINS ? 1 : Math.floor(maxCoins - coins.length) / 3;

        const pointsPerCoin = Math.max(1, Math.ceil(coinsToSpawn / spawnableCoins));

        while (coinsToSpawn > 0) {
            const points = Math.min(pointsPerCoin, coinsToSpawn);
            if (points < 0 || isNaN(points)) {
                console.error({points});
                debugger;
            }

            coinsToSpawn -= points;

            const cx = x + (Math.random() - 0.5) * (brickWidth - coinSize),
                cy = y + (Math.random() - 0.5) * (brickWidth - coinSize);

            coins.push({
                points,
                color: perks.metamorphosis ? color : "gold",
                x: cx,
                y: cy,
                previousx: cx,
                previousy: cy,
                // Use previous speed because the ball has already bounced
                vx: ball.previousvx * (0.5 + Math.random()),
                vy: ball.previousvy * (0.5 + Math.random()),
                sx: 0,
                sy: 0,
                a: Math.random() * Math.PI * 2,
                sa: Math.random() - 0.5,
                weight: 0.8 + Math.random() * 0.2,
            });
        }

        combo += Math.max(
            0,
            perks.streak_shots +
            perks.compound_interest +
            perks.sides_are_lava +
            perks.top_is_lava +
            perks.picky_eater -
            Math.round(Math.random() * perks.soft_reset),
        );

        if (!isExplosion) {
            // color change
            if (
                (perks.picky_eater || perks.pierce_color) &&
                color !== ballsColor &&
                color
            ) {
                if (perks.picky_eater) {
                    resetCombo(ball.x, ball.y);
                }

                ballsColor = color;
            } else {
                sounds.comboIncreaseMaybe(ball.x, 1);
            }
        }

        flashes.push({
            type: "ball",
            duration: 40,
            time: levelTime,
            size: brickWidth,
            color: color,
            x,
            y,
        });
        spawnExplosion(5 + Math.min(combo, 30), x, y, color, 150, coinSize / 2);
    }

    if (!bricks[index] && color!=='black') {
        ball.hitItem?.push({
            index,
            color,
        });
    }
}

function max_levels() {
    return 7 + perks.extra_levels;
}

function render() {
    if (running) needsRender = true;
    if (!needsRender) {
        return;
    }
    needsRender = false;

    const level = currentLevelInfo();
    const {width, height} = gameCanvas;
    if (!width || !height) return;

    let scoreInfo = "";
    for (let i = 0; i < perks.extra_life; i++) {
        scoreInfo += "🖤 ";
    }

    scoreInfo += "L" + (currentLevel + 1) + "/" + max_levels() + " ";
    scoreInfo += "$" + score.toString();

    scoreDisplay.innerText = scoreInfo;
    // Clear
    if (!isSettingOn("basic") && !level.color && level.svg) {
        // Without this the light trails everything
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.6;
        coins.forEach((coin) => {
            if (!coin.destroyed)
                drawFuzzyBall(ctx, coin.color, coinSize * 2, coin.x, coin.y);
        });
        balls.forEach((ball) => {
            drawFuzzyBall(ctx, ballsColor, ballSize * 2, ball.x, ball.y);
        });
        ctx.globalAlpha = 0.5;
        bricks.forEach((color, index) => {
            if (!color) return;
            const x = brickCenterX(index),
                y = brickCenterY(index);
            drawFuzzyBall(ctx, color == "black" ? "#666" : color, brickWidth, x, y);
        });
        ctx.globalAlpha = 1;
        flashes.forEach((flash) => {
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
                backgroundCanvas.width = gameCanvas.width;
                backgroundCanvas.height = gameCanvas.height;
                const bgctx = backgroundCanvas.getContext(
                    "2d",
                ) as CanvasRenderingContext2D;
                bgctx.fillStyle = level.color || "#000";
                bgctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
                bgctx.fillStyle = ctx.createPattern(background, "repeat");
                bgctx.fillRect(0, 0, width, height);
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

        flashes.forEach((flash) => {
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
    const lastExplosionDelay = Date.now() - lastExplosion + 5;
    const shaked = lastExplosionDelay < 200;
    if (shaked) {
        const amplitude = ((perks.bigger_explosions + 1) * 50) / lastExplosionDelay;
        ctx.translate(
            Math.sin(Date.now()) * amplitude,
            Math.sin(Date.now() + 36) * amplitude,
        );
    }

    ctx.globalCompositeOperation = "source-over";
    renderAllBricks();

    ctx.globalCompositeOperation = "screen";
    flashes = flashes.filter(
        (f) => levelTime - f.time < f.duration && !f.destroyed,
    );

    flashes.forEach((flash) => {
        const {x, y, time, color, size, type, text, duration} = flash;
        const elapsed = levelTime - time;
        ctx.globalAlpha = Math.max(0, Math.min(1, 2 - (elapsed / duration) * 2));
        if (type === "text") {
            ctx.globalCompositeOperation = "source-over";
            drawText(ctx, text, color, size, x, y - elapsed / 10);
        } else if (type === "particle") {
            ctx.globalCompositeOperation = "screen";
            drawBall(ctx, color, size, x, y);
            drawFuzzyBall(ctx, color, size, x, y);
        }
    });

    // Coins
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    coins.forEach((coin) => {
        if (!coin.destroyed)
            drawCoin(
                ctx,
                coin.color,
                coinSize,
                coin.x,
                coin.y,
                level.color || "black",
                coin.a,
            );
    });

    // Black shadow around balls
    if (coins.length > 10 && !isSettingOn("basic")) {
        ctx.globalAlpha = Math.min(0.8, (coins.length - 10) / 50);
        balls.forEach((ball) => {
            drawBall(ctx, level.color || "#000", ballSize * 6, ball.x, ball.y);
        });
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    balls.forEach((ball) => {
        // The white border around is to distinguish colored balls from coins/bg
        drawBall(ctx, ballsColor, ballSize, ball.x, ball.y, puckColor);

        if (isTelekinesisActive(ball)) {
            ctx.strokeStyle = puckColor;
            ctx.beginPath();
            ctx.bezierCurveTo(puck, gameZoneHeight, puck, ball.y, ball.x, ball.y);
            ctx.stroke();
        }
    });
    // The puck
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (perks.streak_shots && combo > baseCombo()) {
        drawPuck(ctx, "red", puckWidth, puckHeight, -2);
    }
    drawPuck(ctx, puckColor, puckWidth, puckHeight);

    if (combo > 1) {
        ctx.globalCompositeOperation = "source-over";
        const comboText = "x " + combo;
        const comboTextWidth = (comboText.length * puckHeight) / 1.8;
        const totalWidth = comboTextWidth + coinSize * 2;
        const left = puck - totalWidth / 2;
        if (totalWidth < puckWidth) {
            drawCoin(
                ctx,
                "gold",
                coinSize,
                left + coinSize / 2,
                gameZoneHeight - puckHeight / 2,
                puckColor,
                0,
            );
            drawText(
                ctx,
                comboText,
                "#000",
                puckHeight,
                left + coinSize * 1.5,
                gameZoneHeight - puckHeight / 2,
                true,
            );
        } else {
            drawText(
                ctx,
                comboText,
                "#FFF",
                puckHeight,
                puck,
                gameZoneHeight - puckHeight / 2,
                false,
            );
        }
    }
    //  Borders
    const redSides = perks.sides_are_lava && combo > baseCombo();
    ctx.fillStyle = redSides ? "red" : puckColor;
    ctx.globalCompositeOperation = "source-over";
    if (offsetXRoundedDown) {
        // draw outside of gaming area to avoid capturing borders in recordings
        ctx.fillRect(offsetX - 1, 0, 1, height);
        ctx.fillRect(width - offsetX + 1, 0, 1, height);
    } else if (redSides) {
        ctx.fillRect(0, 0, 1, height);
        ctx.fillRect(width - 1, 0, 1, height);
    }

    if (perks.top_is_lava && combo > baseCombo())
        drawRedSquare(ctx, offsetXRoundedDown, 0, gameZoneWidthRoundedUp, 1);
    const redBottom = perks.compound_interest && combo > baseCombo();
    ctx.fillStyle = redBottom ? "red" : puckColor;
    if (isSettingOn("mobile-mode")) {
        ctx.fillRect(offsetXRoundedDown, gameZoneHeight, gameZoneWidthRoundedUp, 1);
        if (!running) {
            drawText(
                ctx,
                "Press and hold here to play",
                puckColor,
                puckHeight,
                gameCanvas.width / 2,
                gameZoneHeight + (gameCanvas.height - gameZoneHeight) / 2,
            );
        }
    } else if (redBottom) {
        ctx.fillRect(
            offsetXRoundedDown,
            gameZoneHeight - 1,
            gameZoneWidthRoundedUp,
            1,
        );
    }

    if (shaked) {
        ctx.resetTransform();
    }

    recordOneFrame();
}

let cachedBricksRender = document.createElement("canvas");
let cachedBricksRenderKey = null;

function renderAllBricks() {
    ctx.globalAlpha = 1;

    const redBorderOnBricksWithWrongColor =
        combo > baseCombo() && perks.picky_eater;

    const newKey =
        gameZoneWidth +
        "_" +
        bricks.join("_") +
        bombSVG.complete +
        "_" +
        redBorderOnBricksWithWrongColor +
        "_" +
        ballsColor;
    if (newKey !== cachedBricksRenderKey) {
        cachedBricksRenderKey = newKey;

        cachedBricksRender.width = gameZoneWidth;
        cachedBricksRender.height = gameZoneWidth + 1;
        const canctx = cachedBricksRender.getContext("2d") as CanvasRenderingContext2D;
        canctx.clearRect(0, 0, gameZoneWidth, gameZoneWidth);
        canctx.resetTransform();
        canctx.translate(-offsetX, 0);
        // Bricks
        bricks.forEach((color, index) => {
            const x = brickCenterX(index),
                y = brickCenterY(index);

            if (!color) return;
            const borderColor =
                (ballsColor === color && puckColor) ||
                (color !== "black" && redBorderOnBricksWithWrongColor && "red") ||
                color;
            drawBrick(canctx, color, borderColor, x, y);
            if (color === "black") {
                canctx.globalCompositeOperation = "source-over";
                drawIMG(canctx, bombSVG, brickWidth, x, y);
            }
        });
    }

    ctx.drawImage(cachedBricksRender, offsetX, 0);
}

let cachedGraphics = {};

function drawPuck(ctx:CanvasRenderingContext2D, color:colorString,
                  puckWidth:number, puckHeight:number, yoffset = 0) {
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
        Math.round(puck - puckWidth / 2),
        gameZoneHeight - puckHeight * 2 + yoffset,
    );
}

function drawBall(ctx:CanvasRenderingContext2D,
                  color:colorString, width:number, x:number, y:number, borderColor = "") {
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

function drawCoin(ctx:CanvasRenderingContext2D, color:colorString, size:number,
                  x:number, y:number, borderColor:colorString, rawAngle:number) {
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

function drawFuzzyBall(ctx:CanvasRenderingContext2D, color:colorString, width:number,
                       x:number, y:number) {
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

function drawBrick(ctx:CanvasRenderingContext2D, color:colorString, borderColor:colorString,
                   x:number, y:number) {
    const tlx = Math.ceil(x - brickWidth / 2);
    const tly = Math.ceil(y - brickWidth / 2);
    const brx = Math.ceil(x + brickWidth / 2) - 1;
    const bry = Math.ceil(y + brickWidth / 2) - 1;

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

function roundRect(ctx:CanvasRenderingContext2D, x:number, y:number, width:number, height:number, radius:number) {
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

function drawRedSquare(ctx:CanvasRenderingContext2D, x:number, y:number, width:number, height:number) {
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, width, height);
}

function drawIMG(ctx:CanvasRenderingContext2D, img:HTMLImageElement, size:number, x:number, y:number) {
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

function drawText(ctx:CanvasRenderingContext2D,
                  text:string, color:colorString, fontSize:number, x:number, y:number, left = false) {
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

function pixelsToPan(pan:number) {
    return (pan - offsetX) / gameZoneWidth;
}

let lastComboPlayed = NaN,
    shepard = 6;

function playShepard(delta:number, pan:number, volume:number) {
    const shepardMax = 11,
        factor = 1.05945594920268,
        baseNote = 392;
    shepard += delta;
    if (shepard > shepardMax) shepard = 0;
    if (shepard < 0) shepard = shepardMax;

    const play = (note:number) => {
        const freq = baseNote * Math.pow(factor, note);
        const diff = Math.abs(note - shepardMax * 0.5);
        const maxDistanceToIdeal = 1.5 * shepardMax;
        const vol = Math.max(0, volume * (1 - diff / maxDistanceToIdeal));
        createSingleBounceSound(freq, pan, vol);
        return freq.toFixed(2) + " at " + Math.floor(vol * 100) + "% diff " + diff;
    };

    play(1 + shepardMax + shepard);
    play(shepard);
    play(-1 - shepardMax + shepard);
}

const sounds = {
    wallBeep: (pan:number) => {
        if (!isSettingOn("sound")) return;
        createSingleBounceSound(800, pixelsToPan(pan));
    },

    comboIncreaseMaybe: (x:number, volume:number) => {
        if (!isSettingOn("sound")) return;
        let delta = 0;
        if (!isNaN(lastComboPlayed)) {
            if (lastComboPlayed < combo) delta = 1;
            if (lastComboPlayed > combo) delta = -1;
        }
        playShepard(delta, pixelsToPan(x), volume);
        lastComboPlayed = combo;
    },

    comboDecrease() {
        if (!isSettingOn("sound")) return;
        playShepard(-1, 0.5, 0.5);
    },
    coinBounce: (pan:number, volume:number) => {
        if (!isSettingOn("sound")) return;
        createSingleBounceSound(1200, pixelsToPan(pan), volume, 0.1, "triangle");
    },
    explode: (pan:number) => {
        if (!isSettingOn("sound")) return;
        createExplosionSound(pixelsToPan(pan));
    },
    revive: () => {
        if (!isSettingOn("sound")) return;
        createRevivalSound(500);
    },
    coinCatch(pan:number) {
        if (!isSettingOn("sound")) return;
        createSingleBounceSound(900, pixelsToPan(pan), 0.8, 0.1, "triangle");
    },
};

// How to play the code on the leftconst context = new window.AudioContext();
let audioContext:AudioContext, audioRecordingTrack:MediaStreamAudioDestinationNode;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioRecordingTrack = audioContext.createMediaStreamDestination();
    }
    return audioContext;
}

function createSingleBounceSound(
    baseFreq = 800,
    pan = 0.5,
    volume = 1,
    duration = 0.1,
    type:OscillatorType = "sine",
) {
    const context = getAudioContext();
    // Frequency for the metal "ping"
    const baseFrequency = baseFreq; // Hz

    // Create an oscillator for the impact sound
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(baseFrequency, context.currentTime);

    // Create a gain node to control the volume
    const gainNode = context.createGain();
    oscillator.connect(gainNode);

    // Create a stereo panner node for left-right panning
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(pan * 2 - 1, context.currentTime);
    gainNode.connect(panner);
    panner.connect(context.destination);
    panner.connect(audioRecordingTrack);

    // Set up the gain envelope to simulate the impact and quick decay
    gainNode.gain.setValueAtTime(0.8 * volume, context.currentTime); // Initial impact
    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
    ); // Quick decay

    // Start the oscillator
    oscillator.start(context.currentTime);

    // Stop the oscillator after the decay
    oscillator.stop(context.currentTime + duration);
}

function createRevivalSound(baseFreq = 440) {
    const context = getAudioContext();

    // Create multiple oscillators for a richer sound
    const oscillators = [
        context.createOscillator(),
        context.createOscillator(),
        context.createOscillator(),
    ];

    // Set the type and frequency for each oscillator
    oscillators.forEach((osc, index) => {
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq + index * 2, context.currentTime); // Slight detuning
    });

    // Create a gain node to control the volume
    const gainNode = context.createGain();

    // Connect all oscillators to the gain node
    oscillators.forEach((osc) => osc.connect(gainNode));

    // Create a stereo panner node for left-right panning
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(0, context.currentTime); // Center panning
    gainNode.connect(panner);
    panner.connect(context.destination);
    panner.connect(audioRecordingTrack);

    // Set up the gain envelope to simulate a smooth attack and decay
    gainNode.gain.setValueAtTime(0, context.currentTime); // Start at zero
    gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.5); // Ramp up to full volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2); // Slow decay

    // Start all oscillators
    oscillators.forEach((osc) => osc.start(context.currentTime));

    // Stop all oscillators after the decay
    oscillators.forEach((osc) => osc.stop(context.currentTime + 2));
}

let noiseBuffer:AudioBuffer;

function createExplosionSound(pan = 0.5) {
    const context = getAudioContext();
    // Create an audio buffer
    if (!noiseBuffer) {
        const bufferSize = context.sampleRate * 2; // 2 seconds
        noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Fill the buffer with random noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    // Create a noise source
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Create a gain node to control the volume
    const gainNode = context.createGain();
    noiseSource.connect(gainNode);

    // Create a filter to shape the explosion sound
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, context.currentTime); // Set the initial frequency
    gainNode.connect(filter);

    // Create a stereo panner node for left-right panning
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(pan * 2 - 1, context.currentTime); // pan 0 to 1 maps to -1 to 1

    // Connect filter to panner and then to the destination (speakers)
    filter.connect(panner);
    panner.connect(context.destination);
    panner.connect(audioRecordingTrack);

    // Ramp down the gain to simulate the explosion's fade-out
    gainNode.gain.setValueAtTime(1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);

    // Lower the filter frequency over time to create the "explosive" effect
    filter.frequency.exponentialRampToValueAtTime(60, context.currentTime + 1);

    // Start the noise source
    noiseSource.start(context.currentTime);

    // Stop the noise source after the sound has played
    noiseSource.stop(context.currentTime + 1);
}

let levelTime = 0;


window.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pause(true);
    }
});

const scoreDisplay = document.getElementById("score");
let alertsOpen = 0,
    closeModal = null;

function asyncAlert<t>({
                           title,
                           text,
                           actions,
                           allowClose = true,
                           textAfterButtons = "",
                       }: {
    title?: string;
    text?: string;
    actions?: {
        text?: string;
        value?: t;
        help?: string;
        disabled?: boolean;
        icon?: string;
    }[];
    textAfterButtons?: string;
    allowClose?: boolean;
}): Promise<t | void> {
    alertsOpen++;
    return new Promise((resolve) => {
        const popupWrap = document.createElement("div");
        document.body.appendChild(popupWrap);
        popupWrap.className = "popup";

        function closeWithResult(value: t | void) {
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
                closeWithResult(null);
            });
            closeModal = () => {
                closeWithResult(null);
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

        actions
            .filter((i) => i)
            .forEach(({text, value, help, disabled, icon = ""}) => {
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
                popup.appendChild(button);
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
        (v: t | null) => {
            alertsOpen--;
            closeModal = null;
            return v;
        },
        () => {
            closeModal = null;
            alertsOpen--;
        },
    );
}

// Settings
let cachedSettings = {};

export function isSettingOn(key: OptionId) {
    if (typeof cachedSettings[key] == "undefined") {
        try {
            cachedSettings[key] = JSON.parse(
                localStorage.getItem("breakout-settings-enable-" + key),
            );
        } catch (e) {
            console.warn(e);
        }
    }
    return cachedSettings[key] ?? options[key]?.default ?? false;
}

export function toggleSetting(key:OptionId) {
    cachedSettings[key] = !isSettingOn(key);
    try {
        const lskey = "breakout-settings-enable-" + key;
        localStorage.setItem(lskey, JSON.stringify(cachedSettings[key]));
    } catch (e) {
        console.warn(e);
    }
    if (options[key].afterChange) options[key].afterChange();
}


scoreDisplay.addEventListener("click", (e) => {
    e.preventDefault();
    openScorePanel().then();
});

async function openScorePanel() {
    pause(true);
    const cb = await asyncAlert({
        title: ` ${score} points at level ${currentLevel + 1} / ${max_levels()}`,
        text: `
            <p>Upgrades picked so far : </p>
            <p>${pickedUpgradesHTMl()}</p>
        `,
        allowClose: true,
        actions: [
            {
                text: "Resume",
                help: "Return to your run",
                value:()=>{}
            },
            {
                text: "Restart",
                help: "Start a brand new run.",
                value: () => {
                    restart();
                },
            },
        ],
    });
    if (cb) {
           cb();
    }
}

document.getElementById("menu").addEventListener("click", (e) => {
    e.preventDefault();
    openSettingsPanel().then();
});


async function openSettingsPanel() {
    pause(true);

    const optionsList = [];
    for (const key in options) {
        if (options[key])
            optionsList.push({
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

    const cb = await asyncAlert<() => void>({
        title: "Breakout 71",
        text: ` 
        `,
        allowClose: true,
        actions: [
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
                    openUnlocksList()
                },
            },

            ...optionsList,

            (document.fullscreenEnabled || document.webkitFullscreenEnabled) &&
            (document.fullscreenElement !== null
                ? {
                    text: "Exit Fullscreen",
                    icon: icons["icon:exit_fullscreen"],
                    help: "Might not work on some machines",
                    value() {
                        toggleFullScreen();
                    },
                }
                : {
                    icon: icons["icon:fullscreen"],
                    text: "Fullscreen",
                    help: "Might not work on some machines",
                    value() {
                        toggleFullScreen();
                    },
                }),
            {
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
            },
        ],
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
                    ts >= threshold
                        ? fullHelp
                        : `Unlocks at total score ${threshold}.`,
                disabled: ts < threshold,
                value: {perk: id} as RunOverrides,
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
                    value: {level: l.name} as RunOverrides,
                    icon: icons[l.name],
                };
            }),
    ];

    const tryOn = await asyncAlert({
        title: `You unlocked ${Math.round((actions.filter((a) => !a.disabled).length / actions.length) * 100)}% of the game.`,
        text: `
                       <p> Your total score is ${ts}. Below are all the upgrades and levels the games has to offer. They greyed out ones can be unlocked by increasing your total score. </p> 
                       `,
        textAfterButtons: `<p>
The total score increases every time you score in game.
Your high score is ${highScore}. 
Click an item above to start a run with it.
                </p>`,
        actions,
        allowClose: true,
    });
    if (tryOn) {
        if (
            !currentLevel ||
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
            nextRunOverrides = tryOn;
            restart();
        }
    }
}

function distance2(a:{x:number,y:number}, b:{x:number,y:number}) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

function distanceBetween(a:{x:number,y:number}, b:{x:number,y:number}) {
    return Math.sqrt(distance2(a, b));
}

function rainbowColor():colorString {
    return `hsl(${(Math.round(levelTime / 4) * 2) % 360},100%,70%)`;
}

function repulse(a:Ball, b:BallLike, power:number, impactsBToo:boolean) {
    const distance = distanceBetween(a, b);
    // Ensure we don't get soft locked
    const max = gameZoneWidth / 2;
    if (distance > max) return;
    // Unit vector
    const dx = (a.x - b.x) / distance;
    const dy = (a.y - b.y) / distance;
    const fact =
        (((-power * (max - distance)) / (max * 1.2) / 3) *
            Math.min(500, levelTime)) /
        500;
    if (impactsBToo) {
        b.vx += dx * fact;
        b.vy += dy * fact;
    }
    a.vx -= dx * fact;
    a.vy -= dy * fact;

    const speed = 10;
    const rand = 2;
    flashes.push({
        type: "particle",
        duration: 100,
        time: levelTime,
        size: coinSize / 2,
        color: rainbowColor(),
        ethereal: true,
        x: a.x,
        y: a.y,
        vx: -dx * speed + a.vx + (Math.random() - 0.5) * rand,
        vy: -dy * speed + a.vy + (Math.random() - 0.5) * rand,
    });
    if (impactsBToo) {
        flashes.push({
            type: "particle",
            duration: 100,
            time: levelTime,
            size: coinSize / 2,
            color: rainbowColor(),
            ethereal: true,
            x: b.x,
            y: b.y,
            vx: dx * speed + b.vx + (Math.random() - 0.5) * rand,
            vy: dy * speed + b.vy + (Math.random() - 0.5) * rand,
        });
    }
}

function attract(a:Ball, b:BallLike, power:number) {
    const distance = distanceBetween(a, b);
    // Ensure we don't get soft locked
    const min = gameZoneWidth * 0.5;
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
    flashes.push({
        type: "particle",
        duration: 100,
        time: levelTime,
        size: coinSize / 2,
        color: rainbowColor(),
        ethereal: true,
        x: a.x,
        y: a.y,
        vx: dx * speed + a.vx + (Math.random() - 0.5) * rand,
        vy: dy * speed + a.vy + (Math.random() - 0.5) * rand,
    });
    flashes.push({
        type: "particle",
        duration: 100,
        time: levelTime,
        size: coinSize / 2,
        color: rainbowColor(),
        ethereal: true,
        x: b.x,
        y: b.y,
        vx: -dx * speed + b.vx + (Math.random() - 0.5) * rand,
        vy: -dy * speed + b.vy + (Math.random() - 0.5) * rand,
    });
}

let mediaRecorder:MediaRecorder,
    captureStream:MediaStream,
     captureTrack:CanvasCaptureMediaStreamTrack,
    recordCanvas:HTMLCanvasElement,
    recordCanvasCtx:CanvasRenderingContext2D;

function recordOneFrame() {
    if (!isSettingOn("record")) {
        return;
    }
    if (!running) return;
    if (!captureStream) return;
    drawMainCanvasOnSmallCanvas();
    if (captureTrack?.requestFrame) {
        captureTrack?.requestFrame();
    }else if(captureStream?.requestFrame){
        captureStream.requestFrame();

    }
}

function drawMainCanvasOnSmallCanvas() {
    if (!recordCanvasCtx) return;
    recordCanvasCtx.drawImage(
        gameCanvas,
        offsetXRoundedDown,
        0,
        gameZoneWidthRoundedUp,
        gameZoneHeight,
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
    recordCanvasCtx.fillText(score.toString(), recordCanvas.width - 12, 12);

    recordCanvasCtx.textAlign = "left";
    recordCanvasCtx.fillText(
        "Level " + (currentLevel + 1) + "/" + max_levels(),
        12,
        12,
    );
}

function startRecordingGame() {
    if (!isSettingOn("record")) {
        return;
    }
    if (!recordCanvas) {
        // Smaller canvas with fewer details
        recordCanvas = document.createElement("canvas");
        recordCanvasCtx = recordCanvas.getContext("2d", {
            antialias: false,
            alpha: false,
        }) as CanvasRenderingContext2D;

        captureStream = recordCanvas.captureStream(0) ;
        captureTrack = captureStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack

        if (isSettingOn("sound") && getAudioContext() && audioRecordingTrack) {
            captureStream.addTrack(audioRecordingTrack.stream.getAudioTracks()[0]);
        }
    }

    recordCanvas.width = gameZoneWidthRoundedUp;
    recordCanvas.height = gameZoneHeight;

    // drawMainCanvasOnSmallCanvas()
    const recordedChunks = [];

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
        let targetDiv:HTMLElement;
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
        // targetDiv.style.width = recordCanvas.width + 'px'
        // targetDiv.style.height = recordCanvas.height + 'px'
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

function pauseRecording() {
    if (!isSettingOn("record")) {
        return;
    }
    if (mediaRecorder?.state === "recording") {
        mediaRecorder?.pause();
    }
}

function resumeRecording() {
    if (!isSettingOn("record")) {
        return;
    }
    if (mediaRecorder?.state === "paused") {
        mediaRecorder.resume();
    }
}

function stopRecording() {
    if (!isSettingOn("record")) {
        return;
    }
    if (!mediaRecorder) return;
    mediaRecorder?.stop();
    mediaRecorder = null;
}

function captureFileName(ext='webm') {
    return (
        "breakout-71-capture-" +
        new Date().toISOString().replace(/[^0-9\-]+/gi, "-") +
        "." +
        ext
    );
}

function findLast<T>(arr:T[], predicate:(item:T,index:number,array:T[])=>boolean) {
    let i = arr.length;
    while (--i)
        if (predicate(arr[i], i, arr)) {
            return arr[i];
        }
}

function toggleFullScreen() {
    try {
        if (document.fullscreenElement !== null) {
            if (document.exitFullscreen) {
                document.exitFullscreen().then();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        } else {
            const docel = document.documentElement;
            if (docel.requestFullscreen) {
                docel.requestFullscreen().then();
            } else if (docel.webkitRequestFullscreen) {
                docel.webkitRequestFullscreen();
            }
        }
    } catch (e) {
        console.warn(e);
    }
}

const pressed = {
    ArrowLeft: 0,
    ArrowRight: 0,
    Shift: 0,
};

function setKeyPressed(key:string, on:0|1) {
    pressed[key] = on;
    keyboardPuckSpeed =
        ((pressed.ArrowRight - pressed.ArrowLeft) *
            (1 + pressed.Shift * 2) *
            gameZoneWidth) /
        50;
}

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
        toggleFullScreen();
    } else if (e.key in pressed) {
        setKeyPressed(e.key, 1);
    }
    if (e.key === " " && !alertsOpen) {
        if (running) {
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
    const focused = document.querySelector("button:focus")
    if (e.key in pressed) {
        setKeyPressed(e.key, 0);
    } else if (
        e.key === "ArrowDown" && focused?.nextElementSibling?.tagName === "BUTTON"
    ) {
        (focused?.nextElementSibling as HTMLButtonElement)?.focus();
    } else if (
        e.key === "ArrowUp" &&
        focused?.previousElementSibling?.tagName ===
        "BUTTON"
    ) {
        (focused?.previousElementSibling as HTMLButtonElement)?.focus();

    } else if (e.key === "Escape" && closeModal) {
        closeModal();
    } else if (e.key === "Escape" && running) {
        pause(true);
    } else if (e.key.toLowerCase() === "m" && !alertsOpen) {
        openSettingsPanel().then();
    } else if (e.key.toLowerCase() === "s" && !alertsOpen) {
        openScorePanel().then();
    } else {
        return;
    }
    e.preventDefault();
});

fitSize();
restart();
tick();
