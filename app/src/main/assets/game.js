const MAX_COINS = 400;
const canvas = document.getElementById("game");
let ctx = canvas.getContext("2d", {alpha: false});

let ballSize = 20;
const coinSize = Math.round(ballSize * 0.8);
const puckHeight = ballSize;

if (allLevels.find(l => l.focus)) {
    allLevels = allLevels.filter(l => l.focus)
}
allLevels=allLevels.filter(l=>!l.draft)


let runLevels = []

let currentLevel = 0;

const bombSVG = document.createElement('img')
bombSVG.src = 'data:image/svg+xml;base64,' + btoa(`<svg width="144" height="144" version="1.1" viewBox="0 0 38.101 38.099" xmlns="http://www.w3.org/2000/svg">
 <path d="m6.1528 26.516c-2.6992-3.4942-2.9332-8.281-.58305-11.981a10.454 10.454 0 017.3701-4.7582c1.962-.27726 4.1646.05953 5.8835.90027l.45013.22017.89782-.87417c.83748-.81464.91169-.87499 1.0992-.90271.40528-.058713.58876.03425 1.1971.6116l.55451.52679 1.0821-1.0821c1.1963-1.1963 1.383-1.3357 2.1039-1.5877.57898-.20223 1.5681-.19816 2.1691.00897 1.4613.50314 2.3673 1.7622 2.3567 3.2773-.0058.95654-.24464 1.5795-.90924 2.3746-.40936.48928-.55533.81057-.57898 1.2737-.02039.41018.1109.77714.42322 1.1792.30172.38816.3694.61323.2797.93044-.12803.45666-.56674.71598-1.0242.60507-.601-.14597-1.3031-1.3088-1.3969-2.3126-.09459-1.0161.19245-1.8682.92392-2.7432.42567-.50885.5643-.82851.5643-1.3031 0-.50151-.14026-.83177-.51211-1.2028-.50966-.50966-1.0968-.64829-1.781-.41996l-.37348.12477-2.1006 2.1006.52597.55696c.45421.48194.5325.58876.57898.78855.09622.41588.07502.45014-.88396 1.4548l-.87173.9125.26339.57979a10.193 10.193 0 01.9231 4.1001c.03996 2.046-.41996 3.8082-1.4442 5.537-.55044.928-1.0185 1.5013-1.8968 2.3241-.83503.78284-1.5526 1.2827-2.4904 1.7361-3.4266 1.657-7.4721 1.3422-10.549-.82035-.73473-.51782-1.7312-1.4621-2.2515-2.1357zm21.869-4.5584c-.0579-.19734-.05871-2.2662 0-2.4545.11906-.39142.57898-.63361 1.0038-.53005.23812.05708.54147.32455.6116.5382.06279.19163.06769 2.1805.0065 2.3811-.12558.40773-.61649.67602-1.0462.57164-.234-.05708-.51615-.30498-.57568-.50722m3.0417-2.6013c-.12313-.6222.37837-1.1049 1.0479-1.0079.18348.0261.25279.08399 1.0071.83911.75838.75838.81301.82362.84074 1.0112.10193.68499-.40365 1.1938-1.034 1.0405-.1949-.0473-.28786-.12558-1.0144-.85216-.7649-.76409-.80241-.81057-.84645-1.0316m.61323-3.0629a.85623.85623 0 01.59284-.99975c.28949-.09214 2.1814-.08318 2.3917.01141.38734.17369.6279.61078.53984.98181-.06035.25606-.35391.57327-.60181.64992-.25279.07747-2.2278.053-2.4097-.03017-.26013-.11906-.46318-.36125-.51374-.61323" fill="#fff" opacity="0.3"/>
</svg>`);


// Whatever
let puckWidth = 200;
const perks = {};

let baseSpeed = 12; // applied to x and y
let combo = 1;

function baseCombo() {
    return 1 + perks.base_combo * 3;
}

function resetCombo(x, y ) {
    const prev = combo;
    combo = baseCombo();
    if (!levelTime) {
        combo += perks.hot_start * 15;
    }
    if (prev > combo && perks.soft_reset) {
        combo += Math.floor((prev - combo) / (1 + perks.soft_reset))
    }
    const lost = Math.max(0, prev - combo);
    if (lost) {
        incrementRunStatistics('combo_resets', 1)
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
}

function decreaseCombo(by, x, y) {
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

let running = false, puck = 400;

let offsetX, gameZoneWidth, gameZoneHeight, brickWidth, needsRender = true;

const background = document.createElement("img");
const backgroundCanvas = document.createElement("canvas");
background.addEventListener("load", () => {
    needsRender = true
})

const fitSize = () => {
    const {width, height} = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;


    gameZoneHeight = isSettingOn("mobile-mode") ? (height * 80) / 100 : height;
    const baseWidth = Math.round(Math.min(canvas.width, gameZoneHeight * 0.73));
    brickWidth = Math.floor(baseWidth / gridSize / 2) * 2;
    gameZoneWidth = brickWidth * gridSize;
    offsetX = Math.floor((canvas.width - gameZoneWidth) / 2);
    backgroundCanvas.title = 'resized'
    // Ensure puck stays within bounds
    setMousePos(puck);
    coins = [];
    flashes = [];
    running = false;
    needsRender = true;
    putBallsAtPuck();
};
window.addEventListener("resize", fitSize);

function recomputeTargetBaseSpeed() {
    baseSpeed = gameZoneWidth / 12 / 10 + currentLevel / 3 + levelTime / (30 * 1000) - perks.slow_down * 2;
}


function brickCenterX(index) {
    return offsetX + ((index % gridSize) + 0.5) * brickWidth;
}

function brickCenterY(index) {
    return (Math.floor(index / gridSize) + 0.5) * brickWidth;
}

function getRowCol(index) {
    return {
        col: index % gridSize, row: Math.floor(index / gridSize),
    };
}

function getRowColIndex(row, col) {
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) return -1;
    return row * gridSize + col;
}


function spawnExplosion(count, x, y, color, duration = 150, size = coinSize) {
    if (!!isSettingOn("basic")) return;
    for (let i = 0; i < count; i++) {
        flashes.push({
            type: "particle",
            duration,
            time: levelTime,
            size,
            color,
            x: x + ((Math.random() - 0.5) * brickWidth) / 2,
            y: y + ((Math.random() - 0.5) * brickWidth) / 2,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
        });
    }
}


let score = 0;
let scoreStory = [];

let lastexplosion = 0;
let highScore = parseFloat(localStorage.getItem("breakout-3-hs") || "0");

let lastPlayedCoinGrab = 0

function addToScore(coin) {
    coin.destroyed = true
    score += coin.points;
    addToTotalScore(coin.points)
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("breakout-3-hs", score);
    }
    if (!isSettingOn('basic')) {
        flashes.push({
            type: "particle",
            duration: 100 + Math.random() * 50,
            time: levelTime,
            size: coinSize / 2,
            color: coin.color,
            x: coin.previousx,
            y: coin.previousy,
            vx: (canvas.width - coin.x) / 100,
            vy: -coin.y / 100,
            ethereal: true,
        })
    }

    if (Date.now() - lastPlayedCoinGrab > 16) {
        lastPlayedCoinGrab = Date.now()
        sounds.coinCatch(coin.x)
    }
    incrementRunStatistics('caught_coins', coin.points)

}

let balls = [];

function resetBalls() {
    const count = 1 + (perks?.multiball || 0);
    const perBall = puckWidth / (count + 1);
    balls = [];
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
            color: currentLevelInfo()?.black_puck ? '#000' : "#FFF",
            hitSinceBounce: 0,
            piercedSinceBounce: 0,
            sparks: 0,
        });
    }
}

function putBallsAtPuck() {
    const count = balls.length;
    const perBall = puckWidth / (count + 1);
    balls.forEach((ball, i) => {
        const x = puck - puckWidth / 2 + perBall * (i + 1);
        Object.assign(ball, {
            x,
            previousx: x,
            y: gameZoneHeight - 1.5 * ballSize,
            previousy: gameZoneHeight - 1.5 * ballSize,
            vx: Math.random() > 0.5 ? baseSpeed : -baseSpeed,
            vy: -baseSpeed,
            sx: 0,
            sy: 0,
        });
    });
}

resetBalls();
// Default, recomputed at each level load
let bricks = [];
let flashes = [];
let coins = [];
let levelStartScore = 0;
let levelMisses = 0;
let levelSpawnedCoins = 0;

function getLevelStats() {
    const catchRate = (score - levelStartScore) / (levelSpawnedCoins || 1);
    let stats = `
        you caught ${score - levelStartScore} coins out of ${levelSpawnedCoins} in ${Math.round(levelTime / 1000)} seconds.
        `;
    stats += levelMisses ? `You missed ${levelMisses} times. ` : "";
    let text = [stats];
    let repeats = 1;
    let choices = 3;

    if (levelTime < 30 * 1000) {
        repeats++;
        choices++;
        text.push("speed bonus: +1 upgrade and choice");
    } else if (levelTime < 60 * 1000) {
        choices++;
        text.push("speed bonus: +1 choice");
    }
    if (catchRate === 1) {
        repeats++;
        choices++;
        text.push("coins bonus: +1 upgrade and choice");
    } else if (catchRate > 0.9) {
        choices++;
        text.push("coins bonus: +1 choice.");
    }
    if (levelMisses === 0) {
        repeats++;
        choices++;
        text.push("accuracy bonus: +1 upgrade and choice");
    } else if (levelMisses <= 3) {
        choices++;
        text.push("accuracy bonus:+1 choice");
    }

    return {
        stats, text: text.map(t => '<p>' + t + '</p>').join('\n'), repeats, choices,
    };
}

async function openUpgradesPicker() {
    let {text, repeats, choices} = getLevelStats();
    scoreStory.push(`Finished level ${currentLevel + 1} (${currentLevelInfo().name}): ${text}`,);

    while (repeats--) {
        const actions = pickRandomUpgrades(choices);
        if (!actions.length) break
        let textAfterButtons;
        if (actions.length < choices) {
            textAfterButtons = `<p>You are running out of upgrades, more will be unlocked when you catch lots of coins.</p>`
        }
        const cb = await asyncAlert({
            title: "Pick an upgrade " + (repeats ? "(" + (repeats + 1) + ")" : ""), actions, text, allowClose: false,
            textAfterButtons
        });
        cb();
    }
    resetCombo();
    resetBalls();
}

function setLevel(l) {
    running = false;
    needsRender = true
    if (l > 0) {
        openUpgradesPicker().then();
    }
    currentLevel = l;

    levelTime = 0;
    lastTickDown = levelTime;
    levelStartScore = score;
    levelSpawnedCoins = 0;
    levelMisses = 0;

    resetCombo();
    recomputeTargetBaseSpeed();
    resetBalls();

    const lvl = currentLevelInfo();
    if (lvl.size !== gridSize) {
        gridSize = lvl.size;
        fitSize();
    }
    incrementRunStatistics('lvl_size_' + lvl.size, 1)
    incrementRunStatistics('lvl_name_' + lvl.name, 1)
    coins = [];
    bricks = [...lvl.bricks];
    flashes = [];

    background.src = 'data:image/svg+xml;base64,' + btoa(lvl.svg)

}

function currentLevelInfo() {
    return runLevels[currentLevel % runLevels.length];
}

function reset_perks() {

    for (let u of upgrades) {
        perks[u.id] = 0;
    }

    const giftable = getPossibleUpgrades().filter(u => u.giftable)
    if (!giftable.length) {
        debugger
    }

    const randomGift = isSettingOn('easy') ? 'slow_down' : giftable[Math.floor(Math.random() * giftable.length)].id;
    perks[randomGift] = 1;
    return randomGift
}

const upgrades = [{
    minimumTotalScore: 3000,
    id: 'multiball',
    giftableAfterTotalScore: 20000,
    name: "+1 ball",
    max: 3,
    help: `Start each level with one more balls.`,
}, {
    minimumTotalScore: 5000,
    id: 'pierce',
    giftableAfterTotalScore: 15000,
    name: "Ball pierces bricks",
    max: 3,
    help: `Pierce through 3 blocks after bouncing on the puck.`,
}, {
    minimumTotalScore: 500,
    id: 'telekinesis',
    giftableAfterTotalScore: 900,
    name: "Puck controls ball",
    max: 2,
    help: `Control the ball's trajectory with the puck.`,
}, {
    minimumTotalScore: 0,
    extra_levels_minimum_total_score: 250,
    id: 'extra_life',
    name: "+1 life",
    max: 3,
    help: `Allows you to survive dropping the ball once.`,
}, {
    minimumTotalScore: 20000,
    id: 'sapper',
    giftableAfterTotalScore: 32000,
    name: "Bricks become bombs",
    max: 1,
    help: `Broken blocks are replaced by bombs.`,
}, {
    minimumTotalScore: 100000,
    id: 'soft_reset',
    name: "Soft reset",
    max: 2,
    help: `Only loose half your combo when it resets.`,
},

    {
        minimumTotalScore: 30000,
        id: 'bigger_explosions',
        name: "Bigger explosions",
        max: 1,
        help: `All bombs have larger area of effect.`,
    },

    {
        minimumTotalScore: 2000,
        id: 'coin_magnet',
        name: "Puck attracts coins",
        max: 3,
        help: `Coins falling are drawn toward the puck.`,
    },

    {
        minimumTotalScore: 7000,
        id: 'metamorphosis',
        name: "Coins stain bricks",
        color_blind_exclude: true,
        max: 1,
        help: `Coins color the bricks they touch.`,
    },

    {
        minimumTotalScore: 6000,
        id: 'picky_eater',
        giftableAfterTotalScore: 9000,
        name: "Single color streak",
        color_blind_exclude: true,
        max: 1,
        help: `Hit bricks of the same color for more coins.`,
    },

    {
        minimumTotalScore: 80000,
        id: 'pierce_color',
        name: "Color pierce",
        color_blind_exclude: true,
        max: 1,
        help: `Colored ball pierces bricks of the same color.`,
    },

    {
        minimumTotalScore: 0,
        id: 'streak_shots',
        giftableAfterTotalScore: 1500,
        name: "Single puck hit streak",
        max: 1,
        help: `Break many bricks at once for more coins.`,
    },

    {
        minimumTotalScore: 10000,
        id: 'hot_start',
        giftableAfterTotalScore: 24000,
        name: "Hot start",
        max: 3,
        help: `Clear the level quickly for more coins.`,
    },

    {
        minimumTotalScore: 200,
        id: 'sides_are_lava',
        giftableAfterTotalScore: 500,
        name: "Shoot straight",
        max: 1,
        help: `Avoid the sides for more coins.`,
    }, {
        minimumTotalScore: 600,
        id: 'top_is_lava',
        giftableAfterTotalScore: 1200,
        name: "Sky is the limit",
        max: 1,
        help: `Avoid the top for more coins.`,
    },

    {
        minimumTotalScore: 8000,
        id: 'catch_all_coins',
        giftableAfterTotalScore: 16000,
        name: "Compound interest",
        max: 3,
        help: `Catch all coins with your puck for even more coins.`,
    }, {
        minimumTotalScore: 0,
        extra_levels_minimum_total_score: 6250,
        id: 'viscosity',
        name: "Slower coins fall",
        max: 3,
        help: `Coins quickly decelerate and fall more slowly.`,
    },

    {
        minimumTotalScore: 0,
        extra_levels_minimum_total_score: 750,
        id: 'base_combo',
        giftableAfterTotalScore: 0,
        name: "+3 base combo",
        max: 3,
        help: `Your combo starts 3 points higher.`,
    },

    {
        minimumTotalScore: 0,
        extra_levels_minimum_total_score: 25,
        id: 'slow_down',
        name: "Slower ball",
        max: 2,
        help: `Slows down the ball.`,
    }, {
        minimumTotalScore: 65000,
        id: 'extra_levels',
        name: "+1 level",
        max: 3,
        help: `Play one more level before game over.`,
    }, {
        minimumTotalScore: 2500,
        id: 'skip_last',
        name: "Last brick breaks",
        max: 3,
        help: `The last brick will self-destruct.`,
    }, {
        minimumTotalScore: 3600, id: 'smaller_puck', name: "Smaller puck", max: 2, help: `Gives you more control.`,
    }, {
        minimumTotalScore: 0,
        extra_levels_minimum_total_score: 0,
        id: 'bigger_puck',
        name: "Bigger puck",
        max: 2,
        help: `Catches more coins.`,
    }]

function computeUpgradeCurrentMaxLevel(u, ts) {
    let max = 0
    const setMax = (v) => max = Math.max(max, v)
    if (u.max && ts >= u.minimumTotalScore) {
        setMax(1)
    }
    if (u.max > 1) {
        if (u.minimumTotalScore) {
            setMax(Math.min(u.max, Math.floor(ts / u.minimumTotalScore)))
        } else if (u.extra_levels_minimum_total_score) {
            setMax(Math.min(u.max, Math.floor(ts / u.extra_levels_minimum_total_score) + 1))
        }
    }

    return max
}

function getPossibleUpgrades() {
    const ts = getTotalScore()
    return upgrades
        .filter(u => !(isSettingOn('color_blind') && u.color_blind_exclude))
        .map(u => ({
            ...u, max: computeUpgradeCurrentMaxLevel(u, ts), giftable: ts >= (u.giftableAfterTotalScore ?? Infinity)
        })).filter(u => u.max > 0)
}

function levelTotalScoreCondition(l, li) {
    return li < 8 ? 0 : Math.round(Math.pow(10, 1 + (li + l.size) / 30) * (li)) * 10
}

function shuffleLevels(nameToAvoid = null) {
    const ts = getTotalScore()
    runLevels = allLevels
        .filter((l, li) => ts >= levelTotalScoreCondition(l, li))
        .filter(l => l.name !== nameToAvoid || allLevels.length === 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 7 + 3)
        .sort((a, b) => a.bricks.filter(i => i).length - b.bricks.filter(i => i).length)
}

function getUpgraderUnlockPoints() {
    let list = []

    upgrades
        .filter(u => !(isSettingOn('color_blind') && u.color_blind_exclude))
        .forEach(u => {
            if (u.minimumTotalScore) {
                list.push({
                    threshold: u.minimumTotalScore,
                    title: 'Unlock: ' + u.name,
                    help: 'This new perks will be added to the choices offered to you.'
                })
            }
            if (u.max > 1) {
                for (var l = 1; l < u.max; l++) list.push({
                    threshold: l * (u.minimumTotalScore || u.extra_levels_minimum_total_score || 0),
                    title: 'Upgrade: ' + u.name,
                    help: 'You will be able to take this perk ' + (l + 1) + ' times for greater effect.'
                })
            }
            if (u.giftableAfterTotalScore) {
                list.push({
                    threshold: u.giftableAfterTotalScore,
                    title: 'Start: ' + u.name,
                    help: u.name + ' will be added to the list of possible starting perks.'
                })
            }

        })

    allLevels.forEach((l, li) => {
        list.push({
            threshold: levelTotalScoreCondition(l, li),
            title: 'Level: ' + l.name,
            help: l.name + ' will be added to the list of possible levels.'
        })
    })

    return list.filter(o => o.threshold).sort((a, b) => a.threshold - b.threshold)
}


function pickRandomUpgrades(count) {


    let list = getPossibleUpgrades()
        .sort(() => Math.random() - 0.5)
        .filter(u => perks[u.id] < u.max)
        .slice(0, count)
        .sort((a, b) => a.id > b.id ? 1 : -1)
        .map(u => {

            incrementRunStatistics('offered_upgrade.' + u.id, 1)
            return {
                key: u.id, text: u.name, value: () => {
                    perks[u.id]++;
                    incrementRunStatistics('picked_upgrade.' + u.id, 1)
                    scoreStory.push("Picked upgrade : " + u.name);
                }, help: u.help, max: u.max,

                checked: perks[u.id],

            }
        })


    return list;
}


function restart() {
    console.log("restart")
    // When restarting, we want to avoid restarting with the same level we're on, so we exclude from the next
    // run's level list
    shuffleLevels(levelTime || score ? currentLevelInfo().name : null);
    resetRunStatistics()
    score = 0;
    scoreStory = [];
    const randomGift = reset_perks();

    incrementRunStatistics('starting_upgrade.' + randomGift, 1)

    setLevel(0);
    scoreStory.push(`You started playing with the upgrade "${upgrades.find(u => u.id === randomGift)?.name}" on the level "${runLevels[0].name}". `,);
}

function setMousePos(x) {

    needsRender = true;
    puck = x;

    if (offsetX > ballSize) {
        // We have borders visible, enforce them
        if (puck < offsetX + puckWidth / 2) {
            puck = offsetX + puckWidth / 2;
        }
        if (puck > offsetX + gameZoneWidth - puckWidth / 2) {
            puck = offsetX + gameZoneWidth - puckWidth / 2;
        }
    } else {
        // Let puck touch the border of the screen
        if (puck < puckWidth / 2) {
            puck = puckWidth / 2;
        }
        if (puck > offsetX * 2 + gameZoneWidth - puckWidth / 2) {
            puck = offsetX * 2 + gameZoneWidth - puckWidth / 2;
        }
    }
    if (!running && !levelTime) {
        putBallsAtPuck();
    }
}

canvas.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    running = !running;
});

canvas.addEventListener("mousemove", (e) => {
    setMousePos(e.x);
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!e.touches?.length) return;
    setMousePos(e.touches[0].pageX);
    running = true;
});
canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    running = false;
});
canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    running = false;
    needsRender = true
});
canvas.addEventListener("touchmove", (e) => {
    if (!e.touches?.length) return;
    setMousePos(e.touches[0].pageX);
});

let lastTick = performance.now();

function brickIndex(x, y) {
    return getRowColIndex(Math.floor(y / brickWidth), Math.floor((x - offsetX) / brickWidth),);
}

function hasBrick(index) {
    if (bricks[index]) return index;
}

function hitsSomething(x, y, radius) {
    return (hasBrick(brickIndex(x - radius, y - radius)) ?? hasBrick(brickIndex(x + radius, y - radius)) ?? hasBrick(brickIndex(x + radius, y + radius)) ?? hasBrick(brickIndex(x - radius, y + radius)));
}

function shouldPierceByColor(ballOrCoin, vhit, hhit, chit) {
    if (!perks.pierce_color) return false
    // if (ballOrCoin.color === 'white') return true
    if (typeof vhit !== 'undefined' && bricks[vhit] !== ballOrCoin.color) {
        return false
    }
    if (typeof hhit !== 'undefined' && bricks[hhit] !== ballOrCoin.color) {
        return false
    }
    if (typeof chit !== 'undefined' && bricks[chit] !== ballOrCoin.color) {
        return false
    }
    return true
}

function brickHitCheck(ballOrCoin, radius, isBall) {
    // Make ball/coin bonce, and return bricks that were hit
    const {x, y, previousx, previousy, hitSinceBounce} = ballOrCoin;

    const vhit = hitsSomething(previousx, y, radius);
    const hhit = hitsSomething(x, previousy, radius);
    const chit = (typeof vhit == "undefined" && typeof hhit == "undefined" && hitsSomething(x, y, radius)) || undefined;


    let pierce = isBall && ballOrCoin.piercedSinceBounce < perks.pierce * 3;
    if (pierce && (typeof vhit !== "undefined" || typeof hhit !== "undefined" || typeof chit !== "undefined")) {
        ballOrCoin.piercedSinceBounce++
    }
    if (isBall && shouldPierceByColor(ballOrCoin, vhit, hhit, chit)) {
        pierce = true
    }


    if (typeof vhit !== "undefined" || typeof chit !== "undefined") {
        if (!pierce) {
            ballOrCoin.y = ballOrCoin.previousy;
            ballOrCoin.vy *= -1;
        }

        if (!isBall) {
            //   Roll on corners
            const leftHit = bricks[brickIndex(x - radius, y + radius)];
            const rightHit = bricks[brickIndex(x + radius, y + radius)];

            if (leftHit && !rightHit) {
                ballOrCoin.vx += 1;
            }
            if (!leftHit && rightHit) {
                ballOrCoin.vx -= 1;
            }
        }
    }
    if (typeof hhit !== "undefined" || typeof chit !== "undefined") {
        if (!pierce) {
            ballOrCoin.x = ballOrCoin.previousx;
            ballOrCoin.vx *= -1;
        }
    }

    return vhit ?? hhit ?? chit;
}

function bordersHitCheck(coin, radius, delta) {
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

    let vhit = 0, hhit = 0;


    if (coin.x < (offsetX > ballSize ? offsetX : 0) + radius) {
        coin.x = offsetX + radius;
        coin.vx *= -1;
        hhit = 1;
    }
    if (coin.y < radius) {
        coin.y = radius;
        coin.vy *= -1;
        vhit = 1;
    }
    if (coin.x > canvas.width - (offsetX > ballSize ? offsetX : 0) - radius) {
        coin.x = canvas.width - offsetX - radius;
        coin.vx *= -1;
        hhit = 1;
    }

    return hhit + vhit * 2;
}

let lastTickDown = 0;

function tick() {

    recomputeTargetBaseSpeed();
    const currentTick = performance.now();

    puckWidth = (gameZoneWidth / 12) * (3 - perks.smaller_puck + perks.bigger_puck);

    if (running) {

        levelTime += currentTick - lastTick;
        // How many time to compute
        let delta = Math.min(4, (currentTick - lastTick) / (1000 / 60));
        delta *= running ? 1 : 0


        coins = coins.filter((coin) => !coin.destroyed);
        balls = balls.filter((ball) => !ball.destroyed);

        const remainingBricks = bricks.filter((b) => b && b !== "black").length;

        if (levelTime > lastTickDown + 1000 && perks.hot_start) {
            lastTickDown = levelTime;
            decreaseCombo(perks.hot_start, puck, gameZoneHeight - 2 * puckHeight);
        }

        if (remainingBricks < perks.skip_last) {
            bricks.forEach((type, index) => {
                if (type) {
                    explodeBrick(index, balls[0], true);
                }
            });
        }
        if (!remainingBricks && !coins.length) {
            incrementRunStatistics('level_time', levelTime)

            if (currentLevel + 1 < max_levels()) {
                setLevel(currentLevel + 1);
            } else {
                gameOver("Run finished with " + score + " points", "You cleared all levels for this run.");
            }
        } else if (running || levelTime) {
            let playedCoinBounce = false;
            const coinRadius = Math.round(coinSize / 2);

            coins.forEach((coin) => {
                if (coin.destroyed) return;
                if (perks.coin_magnet) {
                    coin.vx += ((delta * (puck - coin.x)) / (100 + Math.pow(coin.y - gameZoneHeight, 2) + Math.pow(coin.x - puck, 2))) * perks.coin_magnet * 100;
                }

                const ratio = 1 - (perks.viscosity * 0.03 + 0.005) * delta;

                coin.vy *= ratio;
                coin.vx *= ratio;

                // Gravity
                coin.vy += delta * coin.weight * 0.8;

                const speed = Math.abs(coin.sx) + Math.abs(coin.sx);
                const hitBorder = bordersHitCheck(coin, coinRadius, delta);

                if (coin.y > gameZoneHeight - coinRadius - puckHeight && coin.y < gameZoneHeight + puckHeight + coin.vy && Math.abs(coin.x - puck) < coinRadius + puckWidth / 2 + // a bit of margin to be nice
                    puckHeight) {
                    addToScore(coin);

                } else if (coin.y > canvas.height + coinRadius) {
                    coin.destroyed = true;
                    if (perks.catch_all_coins) {
                        decreaseCombo(coin.points * perks.catch_all_coins, coin.x, canvas.height - coinRadius);
                    }
                }

                const hitBrick = brickHitCheck(coin, coinRadius, false);

                if (perks.metamorphosis && typeof hitBrick !== "undefined") {
                    if (bricks[hitBrick] && coin.color !== bricks[hitBrick] && bricks[hitBrick] !== "black" && !coin.coloredABrick) {
                        bricks[hitBrick] = coin.color;
                        coin.coloredABrick = true
                    }
                }
                if (typeof hitBrick !== "undefined" || hitBorder) {
                    coin.vx *= 0.8;
                    coin.vy *= 0.8;

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
    }

    render();

    requestAnimationFrame(tick);
    lastTick = currentTick;
}

function isTelekinesisActive(ball) {
    return perks.telekinesis && !ball.hitSinceBounce && ball.vy < 0;
}

function ballTick(ball, delta) {
    ball.previousvx = ball.vx;
    ball.previousvy = ball.vy;

    if (isTelekinesisActive(ball)) {
        ball.vx += ((puck - ball.x) / 1000) * delta * perks.telekinesis;
    } else if (ball.vx * ball.vx + ball.vy * ball.vy < baseSpeed * baseSpeed * 2) {
        ball.vx *= 1.01;
        ball.vy *= 1.01;
    } else {
        ball.vx *= 0.99;
        if (Math.abs(ball.vy) > 0.5 * baseSpeed) {
            ball.vy *= 0.99;
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
        ball.bouncesList?.push({x: ball.previousx, y: ball.previousy})
    }

    // Puck collision
    const ylimit = gameZoneHeight - puckHeight - ballSize / 2;
    if (ball.y > ylimit && Math.abs(ball.x - puck) < ballSize / 2 + puckWidth / 2 && ball.vy > 0) {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const angle = Math.atan2(-puckWidth / 2, ball.x - puck);
        ball.vx = speed * Math.cos(angle);
        ball.vy = speed * Math.sin(angle);

        sounds.wallBeep(ball.x);
        if (perks.streak_shots) {
            resetCombo(ball.x, ball.y);
        }
        if (!ball.hitSinceBounce) {
            incrementRunStatistics('miss')
            levelMisses++;
            flashes.push({
                type: "text",
                text: 'miss',
                time: levelTime,
                color: ball.color,
                x: ball.x,
                y: ball.y - ballSize,
                duration: 450,
                size: puckHeight,
            })
            if (ball.bouncesList?.length) {
                ball.bouncesList.push({
                    x: ball.previousx,
                    y: ball.previousy
                })
                for(si=0; si< ball.bouncesList.length-1;si++){
                    // segement
                    const start= ball.bouncesList[si]
                    const end= ball.bouncesList[si+1]
                    const distance=  Math.sqrt(Math.pow(start.x-end.x,2)+ Math.pow(start.y-end.y,2))
                    const parts = distance/30
                    for(var i = 0; i <parts;i++ ){
                        flashes.push({
                            type: "particle",
                            duration: 200,
                            ethereal: true,
                            time: levelTime,
                            size: coinSize / 2,
                            color: ball.color,
                            x: start.x + (i/(parts-1))*(end.x-start.x),
                            y: start.y + (i/(parts-1))*(end.y-start.y),
                            vx: (Math.random() - 0.5) * baseSpeed,
                            vy: (Math.random() - 0.5) * baseSpeed,
                        });
                    }
                }
            }

        }
        incrementRunStatistics('puck_bounces')
        ball.hitSinceBounce = 0;
        ball.piercedSinceBounce = 0;
        ball.bouncesList = [{
              x: ball.previousx,
                    y: ball.previousy
        }]
    }

    if (ball.y > gameZoneHeight + ballSize / 2 && running) {
        ball.destroyed = true;
        if (!balls.find((b) => !b.destroyed)) {
            if (perks.extra_life) {
                perks.extra_life--;
                resetBalls();
                sounds.revive();
                running = false;
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
                gameOver("Game Over", "You dropped the ball after catching " + score + " coins. ");
            }
        }
    }
    const hitBrick = brickHitCheck(ball, ballSize / 2, true);
    if (typeof hitBrick !== "undefined") {
        const wasABomb = bricks[hitBrick] === "black";
        explodeBrick(hitBrick, ball, false);

        if (perks.sapper && !wasABomb) {
            bricks[hitBrick] = "black";
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
                color: ball.color,
                x: ball.x,
                y: ball.y,
                vx: (Math.random() - 0.5) * baseSpeed,
                vy: (Math.random() - 0.5) * baseSpeed,
            });
            ball.sparks = 0;
        }
    }
}


let runStatistics = {};

function resetRunStatistics() {
    runStatistics = {
        started: Date.now(),
        ended: null,
        width: window.innerWidth,
        height: window.innerHeight,
        easy: isSettingOn('easy'),
        color_blind: isSettingOn('color_blind'),
    }
}


function incrementRunStatistics(key, amount = 1) {
    runStatistics[key + '_total'] = (runStatistics[key + '_total'] || 0) + amount
    runStatistics[key + '_lvl_' + currentLevel] = (runStatistics[key + '_lvl_' + currentLevel] || 0) + amount
}

function getTotalScore() {
    try {
        return JSON.parse(localStorage.getItem('breakout_71_total_score') || '0')
    } catch (e) {
        return 0
    }
}

function addToTotalScore(points) {
    try {
        localStorage.setItem('breakout_71_total_score', JSON.stringify(getTotalScore() + points))
    } catch (e) {
    }
}

function gameOver(title, intro) {
    if (!running) return;
    running = false;
    needsRender = true

    runStatistics.ended = Date.now()

    const {stats} = getLevelStats();

    scoreStory.push(`During level ${currentLevel + 1} ${stats}`);
    if (balls.find((b) => !b.destroyed)) {
        scoreStory.push(`You cleared the last level and won. `);
    } else {
        scoreStory.push(`You dropped the ball and finished your run early. `);
    }

    try {
        // Stores only last 100 runs
        const runsHistory = JSON.parse(localStorage.getItem('breakout_71_history') || '[]').slice(0, 99).concat([runStatistics])

        // Generate some histogram

        localStorage.setItem('breakout_71_history', '<pre>' + JSON.stringify(runsHistory, null, 2) + '</pre>')
    } catch {
    }

    let animationDelay = -300
    const getDelay = () => {
        animationDelay += 800
        return 'animation-delay:' + animationDelay + 'ms;'
    }
    // unlocks
    let unlocksInfo = ''
    const endTs = getTotalScore()
    const startTs = endTs - score
    const list = getUpgraderUnlockPoints()
    list.filter(u => u.threshold > startTs && u.threshold < endTs).forEach(u => {
        unlocksInfo += `
<p class="progress" title=${JSON.stringify(u.help)}>
   <span>${u.title}</span>
    <span class="progress_bar_part" style="${getDelay()}"></span>
</p>
`
    })

    const previousUnlockAt = list.findLast(u => u.threshold <= endTs)?.threshold || 0
    const nextUnlock = list.find(u => u.threshold > endTs)

    if (nextUnlock) {
        const total = nextUnlock?.threshold - previousUnlockAt
        const done = endTs - previousUnlockAt
        intro += `Score ${nextUnlock.threshold - endTs} more points to reach the next unlock.`

        unlocksInfo += `
            <p class="progress"  title=${JSON.stringify(unlocksInfo.help)}>
           <span>${nextUnlock.title}</span>
        <span style="transform: scale(${(done / total).toFixed(2)},1);${getDelay()}" class="progress_bar_part"></span>
        </p>

`
        list.slice(list.indexOf(nextUnlock) + 1).slice(0, 3).forEach(u => {
            unlocksInfo += `
        <p class="progress"  title=${JSON.stringify(u.help)}>
           <span>${u.title}</span> 
        </p> 
`
        })
    }

    // Avoid the sad sound right as we restart a new games
    combo=1
    asyncAlert({
        allowClose: true, title, text: `
        <p>${intro}</p>
        ${unlocksInfo}  
        `, textAfterButtons: ` 
        
        ${scoreStory.map((t) => "<p>" + t + "</p>").join("")} 
        `
    }).then(() => restart());
}

function explodeBrick(index, ball, isExplosion) {
    const color = bricks[index];
    if (color === 'black') {
        delete bricks[index];
        const x = brickCenterX(index), y = brickCenterY(index);

        incrementRunStatistics('explosion', 1)
        sounds.explode(ball.x);
        const {col, row} = getRowCol(index);
        const size = 1 + perks.bigger_explosions;
        // Break bricks around
        for (let dx = -size; dx <= size; dx++) {
            for (let dy = -size; dy <= size; dy++) {
                const i = getRowColIndex(row + dy, col + dx);
                if (bricks[i] && i !== -1) {
                    explodeBrick(i, ball, true)
                }
            }
        }
        // Blow nearby coins
        coins.forEach((c) => {
            const dx = c.x - x;
            const dy = c.y - y;
            const d2 = Math.max(brickWidth, Math.abs(dx) + Math.abs(dy));
            c.vx += (dx / d2) * 10 * size / c.weight;
            c.vy += (dy / d2) * 10 * size / c.weight;
        });
        lastexplosion = Date.now();

        flashes.push({
            type: "ball", duration: 150, time: levelTime, size: brickWidth * 2, color: "white", x, y,
        });
        spawnExplosion(7 * (1 + perks.bigger_explosions), x, y, "white", 150, coinSize,);
        ball.hitSinceBounce++;
    } else if (color) {
        // Flashing is take care of by the tick loop
        const x = brickCenterX(index), y = brickCenterY(index);

        bricks[index] = "";

        levelSpawnedCoins += combo;

        incrementRunStatistics('spawned_coins', combo)

        coins = coins.filter((c) => !c.destroyed);
        for (let i = 0; i < combo; i++) {
            // Avoids saturating the canvas with coins
            if (coins.length > MAX_COINS * (isSettingOn("basic") ? 0.5 : 1)) {
                // Just pick a random one
                coins[Math.floor(Math.random() * coins.length)].points++;
                continue;
            }

            const coord = {
                x: x + (Math.random() - 0.5) * (brickWidth - coinSize),
                y: y + (Math.random() - 0.5) * (brickWidth - coinSize),
            };

            coins.push({
                points: 1,
                color, ...coord,
                previousx: coord.x,
                previousy: coord.y,
                vx: ball.vx * (0.5 + Math.random()),
                vy: ball.vy * (0.5 + Math.random()),
                sx: 0,
                sy: 0,
                weight: 0.8 + Math.random() * 0.2
            });
        }

        combo += perks.streak_shots + perks.catch_all_coins + perks.sides_are_lava + perks.top_is_lava + perks.picky_eater;

        if (!isExplosion) {
            // color change
            if ((perks.picky_eater || perks.pierce_color) && color !== ball.color) {
                // reset streak
                if (perks.picky_eater) resetCombo(ball.x, ball.y);
                ball.color = color;
            } else {
                sounds.comboIncreaseMaybe(ball.x, 1);
            }
        }
        ball.hitSinceBounce++;

        flashes.push({
            type: "ball", duration: 40, time: levelTime, size: brickWidth, color: color, x, y,
        });
        spawnExplosion(5 + combo, x, y, color, 100, coinSize / 2);
    }
}

function max_levels() {
    return 7 + perks.extra_levels;
}

function render() {
    if (running) needsRender = true
    if (!needsRender) {
        return
    }
    needsRender = false;

    const level = currentLevelInfo();
    const {width, height} = canvas;
    if (!width || !height) return;

    let scoreInfo = "";
    for (let i = 0; i < perks.extra_life; i++) {
        scoreInfo += "🖤 ";
    }

    scoreInfo += score.toString();
    scoreDisplay.innerText = scoreInfo;


    if (!isSettingOn("basic") && !level.color && level.svg && !level.black_puck) {

        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.7
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.3;
        const gradient = ctx.createLinearGradient(offsetX, gameZoneHeight - puckHeight, offsetX, height - puckHeight * 3,);
        gradient.addColorStop(0, "black");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(offsetX, gameZoneHeight - puckHeight * 3, gameZoneWidth, puckHeight * 4,);

        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.6;
        coins.forEach((coin) => {
            if (!coin.destroyed) drawFuzzyBall(ctx, coin.color, coinSize * 2, coin.x, coin.y);
        });
        balls.forEach((ball) => {
            drawFuzzyBall(ctx, ball.color, ballSize * 2, ball.x, ball.y);
        });
        ctx.globalAlpha = 0.5;
        bricks.forEach((color, index) => {
            if (!color) return;
            const x = brickCenterX(index), y = brickCenterY(index);
            drawFuzzyBall(ctx, color == 'black' ? '#666' : color, brickWidth, x, y);
        });
        ctx.globalAlpha = 1;
        flashes.forEach((flash) => {
            const {x, y, time, color, size, type, duration} = flash;
            const elapsed = levelTime - time;
            ctx.globalAlpha = Math.min(1, 2 - (elapsed / duration) * 2);
            if (type === "ball" || type === "particle") {
                drawFuzzyBall(ctx, color, size, x, y);
            }
        });

        ctx.globalAlpha = 0.9;
        ctx.globalCompositeOperation = "multiply";
        if (level.svg && background.complete) {
            if (backgroundCanvas.title !== level.name) {
                backgroundCanvas.title = level.name
                backgroundCanvas.width = canvas.width
                backgroundCanvas.height = canvas.height
                const bgctx = backgroundCanvas.getContext("2d")
                bgctx.fillStyle = level.color
                bgctx.fillRect(0, 0, canvas.width, canvas.height)
                bgctx.fillStyle = ctx.createPattern(background, "repeat");
                bgctx.fillRect(0, 0, width, height);
                console.log("redrew context")
            }
            ctx.drawImage(backgroundCanvas, 0, 0)


        }
    } else {

        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1
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

    if (combo > baseCombo()) {
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = (2 + combo - baseCombo()) / 50;

        if (perks.top_is_lava) {
            drawRedGradientSquare(ctx, offsetX, 0, gameZoneWidth, ballSize, 0, 0, 0, ballSize,);
        }
        if (perks.sides_are_lava) {
            drawRedGradientSquare(ctx, offsetX, 0, ballSize, gameZoneHeight, 0, 0, ballSize, 0,);
            drawRedGradientSquare(ctx, offsetX + gameZoneWidth - ballSize, 0, ballSize, gameZoneHeight, ballSize, 0, 0, 0,);
        }
        if (perks.catch_all_coins) {
            drawRedGradientSquare(ctx, offsetX, gameZoneHeight - ballSize, gameZoneWidth, ballSize, 0, ballSize, 0, 0,);
        }
        if (perks.streak_shots) {
            drawRedGradientSquare(ctx, puck - puckWidth / 2, gameZoneHeight - puckHeight - ballSize, puckWidth, ballSize, 0, ballSize, 0, 0,);
        }
        if (perks.picky_eater) {
            let okColors = new Set(balls.map((b) => b.color));

            bricks.forEach((type, index) => {
                if (!type || type === "black" || okColors.has(type)) return;
                const x = brickCenterX(index), y = brickCenterY(index);
                drawFuzzyBall(ctx, "red", brickWidth, x, y);
            });
        }
        ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const lastExplosionDelay = Date.now() - lastexplosion + 5;
    const shaked = lastExplosionDelay < 200;
    if (shaked) {
        ctx.translate((Math.sin(Date.now()) * 50) / lastExplosionDelay, (Math.sin(Date.now() + 36) * 50) / lastExplosionDelay,);
    }

    ctx.globalCompositeOperation = "source-over";
    renderAllBricks(ctx);

    ctx.globalCompositeOperation = "screen";
    flashes = flashes.filter((f) => levelTime - f.time < f.duration && !f.destroyed,);

    flashes.forEach((flash) => {
        const {x, y, time, color, size, type, text, duration, points} = flash;
        const elapsed = levelTime - time;
        ctx.globalAlpha = Math.max(0, Math.min(1, 2 - (elapsed / duration) * 2));
        if (type === "text") {
            ctx.globalCompositeOperation = "source-over";
            drawText(ctx, text, color, size, {x, y: y - elapsed / 10});
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
        if (!coin.destroyed) drawCoin(ctx, coin.color, coinSize, coin, level.color || 'black');
    });


    // Black shadow around balls
    if (coins.length > 10 && !isSettingOn('basic')) {
        ctx.globalAlpha = Math.min(0.8, (coins.length - 10) / 50);
        balls.forEach((ball) => {
            drawBall(ctx, level.color || "#000", ballSize * 6, ball.x, ball.y);
        });
    }


    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over";
    const puckColor = level.black_puck ? '#000' : '#FFF'
    balls.forEach((ball) => {
        drawBall(ctx, ball.color, ballSize, ball.x, ball.y);
        // effect
        if (isTelekinesisActive(ball)) {
            ctx.strokeStyle = puckColor;
            ctx.beginPath();
            ctx.bezierCurveTo(puck, gameZoneHeight, puck, ball.y, ball.x, ball.y);
            ctx.stroke();
        }
    });
    // The puck

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over";
    drawPuck(ctx, puckColor, puckWidth, puckHeight)


    if (combo > 1) {
        ctx.globalCompositeOperation = "destination-out";
        drawText(ctx, "x " + combo, "white", puckHeight, {
            x: puck, y: gameZoneHeight - puckHeight / 2,
        });
    }
    //  Borders
    ctx.fillStyle = puckColor;
    ctx.globalCompositeOperation = "source-over";
    if (offsetX > ballSize) {
        ctx.fillRect(offsetX, 0, 1, height);
        ctx.fillRect(width - offsetX - 1, 0, 1, height);
    }
    if (isSettingOn("mobile-mode")) {
        ctx.fillRect(offsetX, gameZoneHeight, gameZoneWidth, 1);
        if (!running) {
            drawText(ctx, "Keep pressing here to play", puckColor, puckHeight, {
                x: canvas.width / 2, y: gameZoneHeight + (canvas.height - gameZoneHeight) / 2,
            });
        }
    }

    if (shaked) {
        ctx.resetTransform();
    }
}

let cachedBricksRender = document.createElement("canvas");
let cachedBricksRenderKey = null;

function renderAllBricks(destinationCtx) {
    ctx.globalAlpha = 1;

    const level = currentLevelInfo();

    const newKey = gameZoneWidth + "_" + bricks.join("_") + bombSVG.complete;
    if (newKey !== cachedBricksRenderKey) {
        cachedBricksRenderKey = newKey;

        cachedBricksRender.width = gameZoneWidth;
        cachedBricksRender.height = gameZoneWidth + 1;
        const ctx = cachedBricksRender.getContext("2d");
        ctx.clearRect(0, 0, gameZoneWidth, gameZoneWidth);
        ctx.resetTransform();
        ctx.translate(-offsetX, 0);
        // Bricks
        bricks.forEach((color, index) => {
            const x = brickCenterX(index), y = brickCenterY(index);

            if (!color) return;
            drawBrick(ctx, color, x, y, level.squared || false);
            if (color === 'black') {
                ctx.globalCompositeOperation = "source-over";
                drawIMG(ctx, bombSVG, brickWidth, x, y);
            }
        });
    }

    destinationCtx.drawImage(cachedBricksRender, offsetX, 0);
}

let cachedGraphics = {};

function drawPuck(ctx, color, puckWidth, puckHeight) {

    const key = "puck" + color + "_" + puckWidth + '_' + puckHeight;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = puckWidth;
        can.height = puckHeight * 2;
        const canctx = can.getContext("2d");
        canctx.fillStyle = color;


        canctx.beginPath();
        canctx.moveTo(0, puckHeight * 2)
        canctx.lineTo(0, puckHeight * 1.25)
        canctx.bezierCurveTo(0, puckHeight * .75, puckWidth, puckHeight * .75, puckWidth, puckHeight * 1.25)
        canctx.lineTo(puckWidth, puckHeight * 2)
        canctx.fill();
        cachedGraphics[key] = can;
    }

    ctx.drawImage(cachedGraphics[key], Math.round(puck - puckWidth / 2), gameZoneHeight - puckHeight * 2,);


}

function drawBall(ctx, color, width, x, y) {
    const key = "ball" + color + "_" + width;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        const size = Math.round(width);
        can.width = size;
        can.height = size;

        const canctx = can.getContext("2d");
        canctx.beginPath();
        canctx.arc(size / 2, size / 2, Math.round(size / 2), 0, 2 * Math.PI);
        canctx.fillStyle = color;
        canctx.fill();
        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], Math.round(x - width / 2), Math.round(y - width / 2),);
}

function drawCoin(ctx, color, width, ball, bg) {
    const key = "coin with halo" + "_" + color + "_" + width + '_' + bg;

    const size = width * 3;
    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = size;
        can.height = size;

        const canctx = can.getContext("2d");

        // coin
        canctx.beginPath();
        canctx.arc(size / 2, size / 2, width / 2, 0, 2 * Math.PI);
        canctx.fillStyle = color;
        canctx.fill();

        canctx.strokeStyle = bg;
        canctx.stroke();

        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], Math.round(ball.x - size / 2), Math.round(ball.y - size / 2),);
}

function drawFuzzyBall(ctx, color, width, x, y) {
    const key = "fuzzy-circle" + color + "_" + width;

    const size = Math.round(width * 3);
    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = size;
        can.height = size;

        const canctx = can.getContext("2d");
        const gradient = canctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2,);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        canctx.fillStyle = gradient;
        canctx.fillRect(0, 0, size, size);
        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], Math.round(x - size / 2), Math.round(y - size / 2),);
}

function drawBrick(ctx, color, x, y, squared) {
    const tlx = Math.ceil(x - brickWidth / 2);
    const tly = Math.ceil(y - brickWidth / 2);
    const brx = Math.ceil(x + brickWidth / 2) - 1;
    const bry = Math.ceil(y + brickWidth / 2) - 1;

    const width = brx - tlx, height = bry - tly;
    const key = "brick" + color + "_" + width + "_" + height + '_' + squared
    // "_" +
    // isSettingOn("rounded-bricks");

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = width;
        can.height = height;
        const canctx = can.getContext("2d");


        if (squared) {

            canctx.fillStyle = color;
            canctx.fillRect(0, 0, width, height);
        } else {

            const bord = Math.floor(brickWidth / 6);
            canctx.strokeStyle = color;
            canctx.lineJoin = "round";
            canctx.lineWidth = bord * 1.5;
            canctx.strokeRect(bord, bord, width - bord * 2, height - bord * 2);

            canctx.fillStyle = color;
            canctx.fillRect(bord, bord, width - bord * 2, height - bord * 2);
        }

        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], tlx, tly, width, height);
    // It's not easy to have a 1px gap between bricks without antialiasing
}

function drawRedGradientSquare(ctx, x, y, width, height, redX, redY, blackX, blackY, color = "red",) {
    const key = "gradient" + width + "_" + height + "_" + redX + "_" + redY + "_" + blackX + "_" + blackY + "_" + color;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = width;
        can.height = height;
        const canctx = can.getContext("2d");

        const gradient = canctx.createLinearGradient(redX, redY, blackX, blackY);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "black");
        canctx.fillStyle = gradient;
        canctx.fillRect(0, 0, width, height);
        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], x, y, width, height);
}


function drawIMG(ctx, img, size, x, y) {
    const key = "svg" + img + "_" + size + '_' + img.complete;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = size;
        can.height = size;

        const canctx = can.getContext("2d");

        const ratio = size / Math.max(img.width, img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        canctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], Math.round(x - size / 2), Math.round(y - size / 2),);
}

function drawText(ctx, text, color, fontSize, {x, y}) {
    const key = "text" + text + "_" + color + "_" + fontSize;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = fontSize * text.length;
        can.height = fontSize;
        const canctx = can.getContext("2d");
        canctx.fillStyle = color;
        canctx.textAlign = "center";
        canctx.textBaseline = "middle";
        canctx.font = fontSize + "px monospace";

        canctx.fillText(text, can.width / 2, can.height / 2, can.width);

        cachedGraphics[key] = can;
    }
    ctx.drawImage(cachedGraphics[key], Math.round(x - cachedGraphics[key].width / 2), Math.round(y - cachedGraphics[key].height / 2),);
}

function pixelsToPan(pan) {
    return (pan - offsetX) / gameZoneWidth;
}

let lastComboPlayed = NaN, shepard = 6;

function playShepard(delta, pan, volume) {
    const shepardMax = 11, factor = 1.05945594920268, baseNote = 392;
    shepard += delta;
    if (shepard > shepardMax) shepard = 0;
    if (shepard < 0) shepard = shepardMax;

    const play = (note) => {
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
    wallBeep: (pan) => {
        if (!isSettingOn("sound")) return;
        createSingleBounceSound(800, pixelsToPan(pan));
    },

    comboIncreaseMaybe: (x, volume) => {
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
    }, coinBounce: (pan, volume) => {
        if (!isSettingOn("sound")) return;
        createSingleBounceSound(1200, pixelsToPan(pan), volume);
    }, explode: (pan) => {
        if (!isSettingOn("sound")) return;
        createExplosionSound(pixelsToPan(pan));
    }, revive: () => {
        if (!isSettingOn("sound")) return;
        createRevivalSound(500);
    }, coinCatch(pan) {
        if (!isSettingOn("sound")) return;
        createSingleBounceSound(440, pixelsToPan(pan), .8)
    }
};

// How to play the code on the leftconst context = new window.AudioContext();
let audioContext, delayNode;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function createSingleBounceSound(baseFreq = 800, pan = 0.5, volume = 1, duration = 0.1,) {
    const context = getAudioContext();
    // Frequency for the metal "ping"
    const baseFrequency = baseFreq; // Hz

    // Create an oscillator for the impact sound
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(baseFrequency, context.currentTime);

    // Create a gain node to control the volume
    const gainNode = context.createGain();
    oscillator.connect(gainNode);

    // Create a stereo panner node for left-right panning
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(pan * 2 - 1, context.currentTime);
    gainNode.connect(panner);
    panner.connect(context.destination);

    // Set up the gain envelope to simulate the impact and quick decay
    gainNode.gain.setValueAtTime(0.8 * volume, context.currentTime); // Initial impact
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration,); // Quick decay

    // Start the oscillator
    oscillator.start(context.currentTime);

    // Stop the oscillator after the decay
    oscillator.stop(context.currentTime + duration);
}

function createRevivalSound(baseFreq = 440) {
    const context = getAudioContext();

    // Create multiple oscillators for a richer sound
    const oscillators = [context.createOscillator(), context.createOscillator(), context.createOscillator(),];

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

    // Set up the gain envelope to simulate a smooth attack and decay
    gainNode.gain.setValueAtTime(0, context.currentTime); // Start at zero
    gainNode.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.5); // Ramp up to full volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2); // Slow decay

    // Start all oscillators
    oscillators.forEach((osc) => osc.start(context.currentTime));

    // Stop all oscillators after the decay
    oscillators.forEach((osc) => osc.stop(context.currentTime + 2));
}

let noiseBuffer;

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

setInterval(() => {
    document.body.className = (running ? " running " : " paused ") + (currentLevelInfo().black_puck ? ' black_puck ' : ' ');
}, 100);

window.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        running = false;
        needsRender = true
    }
});

const scoreDisplay = document.getElementById("score");


function asyncAlert({
                        title,
                        text,
                        actions = [{text: "OK", value: "ok", help: ""}],
                        allowClose = true,
                        textAfterButtons = ''
                    }) {
    return new Promise((resolve) => {
        const popupWrap = document.createElement("div");
        document.body.appendChild(popupWrap);
        popupWrap.className = "popup";

        function closeWithResult(value) {
            resolve(value);
            // Doing this async lets the menu scroll persist if it's shown a second time
            setTimeout(() => {
                document.body.removeChild(popupWrap);
            });
        }

        if (allowClose) {
            const closeButton = document.createElement("button");
            closeButton.title = "close"
            closeButton.className = "close-modale"
            closeButton.addEventListener('click', (e) => {
                e.preventDefault()
                closeWithResult(null)
            })
            popupWrap.appendChild(closeButton)
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

        actions.filter(i => i).forEach(({text, value, help, checked = 0, max = 0, disabled}) => {
            const button = document.createElement("button");
            let checkMark = ''
            if (max) {
                checkMark += '<span class="checks">'
                for (let i = 0; i < max; i++) {
                    checkMark += '<span class="' + (checked > i ? "checked" : "unchecked") + '"></span>';
                }
                checkMark += '</span>'
            }
            button.innerHTML = `${checkMark}
<div>
                    <strong>${text}</strong>
                    <em>${help || ''}</em>
            </div>`;


            if (disabled) {
                button.setAttribute("disabled", "disabled");
            } else {
                button.addEventListener("click", (e) => {
                    e.preventDefault();
                    closeWithResult(value)
                });
            }
            popup.appendChild(button);
        });

        if (textAfterButtons) {
            const p = document.createElement("div");
            p.className = 'textAfterButtons'
            p.innerHTML = textAfterButtons;
            popup.appendChild(p);
        }


        popupWrap.appendChild(popup);
    });
}

// Settings
let cachedSettings = {};

function isSettingOn(key) {
    if (typeof cachedSettings[key] == "undefined") {
        try {
            cachedSettings[key] = JSON.parse(localStorage.getItem("breakout-settings-enable-" + key),);
        } catch (e) {
            console.warn(e);
        }
    }
    return cachedSettings[key] ?? options[key]?.default ?? false;
}

function toggleSetting(key) {
    cachedSettings[key] = !isSettingOn(key);
    try {
        const lskey = "breakout-settings-enable-" + key;
        localStorage.setItem(lskey, JSON.stringify(cachedSettings[key]));
    } catch (e) {
        console.warn(e);
    }
    if (options[key].afterChange) options[key].afterChange();
}

scoreDisplay.addEventListener("click", async (e) => {
    e.preventDefault();
    const cb = await asyncAlert({
        title: `You scored ${score} points so far`, text: `
            <p>You are playing level ${currentLevel + 1} out of ${max_levels()}. </p>
            ${scoreStory.map((t) => "<p>" + t + "</p>").join("")} 
            <p>You high score is ${highScore}.</p>
        `, allowClose: true, actions: [{
            text: "New run", help: "Start a brand new run.", value: () => {
                restart();
                return true;
            },
        }],
    });
    if (cb) {
        await cb()
    }
});

document.getElementById("menu").addEventListener("click", (e) => {
    e.preventDefault();
    openSettingsPanel();
});

const options = {
    sound: {
        default: true, name: `Game sounds`, help: `Can slow down some phones.`,
    }, "mobile-mode": {
        default: window.innerHeight > window.innerWidth,
        name: `Mobile mode`,
        help: `Leaves space for your thumb.`,
        afterChange() {
            fitSize();
        },
    },
    basic: {
        default: false, name: `Fast mode`, help: `Simpler graphics for older devices.`,
    },
    "easy": {
        default: false, name: `Easy mode`, help: `Slower ball as starting perk.`, restart: true,
    }, "color_blind": {
        default: false, name: `Color blind mode`, help: `Removes mechanics about colors.`, restart: true,
    },
};

async function openSettingsPanel() {
    running = false;
    needsRender = true

    const optionsList = [];
    for (const key in options) {
        optionsList.push({
            checked: isSettingOn(key) ? 1 : 0, max: 1, text: options[key].name, help: options[key].help, value: () => {
                toggleSetting(key)
                if (options[key].restart) {
                    restart()
                } else {
                    openSettingsPanel();
                }
            },
        });
    }

    const cb = await asyncAlert({
        title: "Breakout 71", text: ` 
        `, allowClose: true, actions: [
            ...optionsList,

            (window.screenTop || window.screenY) && {
                text: "Fullscreen",
                help: "Might not work on some machines",
                value() {
                    const docel = document.documentElement
                    if (docel.requestFullscreen) {
                        docel.requestFullscreen();
                    } else if (docel.webkitRequestFullscreen) {
                        docel.webkitRequestFullscreen();
                    }
                }
            },
            {
                text: 'Reset Game',
                help: "Erase high score and statistics",
                async value() {
                    if (await asyncAlert({
                        title: 'Reset',
                        actions: [
                            {
                                text: 'Yes',
                                value: true
                            },
                            {
                                text: 'No',
                                value: false
                            }
                        ],
                        allowClose: true,
                    })) {
                        localStorage.clear()
                        window.location.reload()
                    }

                }

            }
        ],
        textAfterButtons: `
        <p>Made in France by <a href="https://lecaro.me">Renan LE CARO</a><br/>   
        <a href="./privacy.html" target="_blank">privacy policy</a> - 
        <a href="https://play.google.com/store/apps/details?id=me.lecaro.breakout" target="_blank">Google Play</a> - 
        <a href="https://renanlecaro.itch.io/breakout71" target="_blank">itch.io</a>
      
         </p>
        `
    })
    if (cb) {
        cb()
    }
}

fitSize()
restart()
tick();