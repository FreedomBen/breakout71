const MAX_COINS = 400;
const canvas = document.getElementById("game");
let ctx = canvas.getContext("2d", {alpha: false});

let ballSize = 20;
const coinSize = Math.round(ballSize * 0.8);
const puckHeight = ballSize;

if (allLevels.find(l => l.focus)) {
    allLevels = allLevels.filter(l => l.focus)
}
// Used to render perk icons
const perkIconsLevels = {}
allLevels = allLevels.filter(l => {
    if (l.name.startsWith('perk:')) {
        perkIconsLevels[l.name.split(':')[1]] = l
        return false
    }
    return true
})
allLevels.forEach((l, li) => {
    l.threshold = li < 8 ? 0 : Math.round(Math.min(Math.pow(10, 1 + (li + l.size) / 30) * 10, 5000) * (li))
    l.sortKey = (Math.random() + 3) / 3.5 * l.bricks.filter(i => i).length
})

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

function resetCombo(x, y) {
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
    return lost
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

function play() {
    if (running) return
    running = true
    if (audioContext) {
        audioContext.resume()
    }
    resumeRecording()
}

function pause() {
    if (!running) return
    running = false
    needsRender = true
    if (audioContext) {
        setTimeout(() => {
            if (!running)
                audioContext.suspend()
        }, 1000)
    }
    pauseRecording()
}

let offsetX, offsetXRoundedDown, gameZoneWidth, gameZoneWidthRoundedUp, gameZoneHeight, brickWidth, needsRender = true;

const background = document.createElement("img");
const backgroundCanvas = document.createElement("canvas");
background.addEventListener("load", () => {
    needsRender = true
})


const fitSize = () => {
    const {width, height} = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = currentLevelInfo()?.color || 'black'
    ctx.globalAlpha = 1
    ctx.fillRect(0, 0, width, height)
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;


    gameZoneHeight = isSettingOn("mobile-mode") ? (height * 80) / 100 : height;
    const baseWidth = Math.round(Math.min(canvas.width, gameZoneHeight * 0.73));
    brickWidth = Math.floor(baseWidth / gridSize / 2) * 2;
    gameZoneWidth = brickWidth * gridSize;
    offsetX = Math.floor((canvas.width - gameZoneWidth) / 2);
    offsetXRoundedDown = offsetX
    if (offsetX < ballSize) offsetXRoundedDown = 0
    gameZoneWidthRoundedUp = width - 2 * offsetXRoundedDown
    backgroundCanvas.title = 'resized'
    // Ensure puck stays within bounds
    setMousePos(puck);
    coins = [];
    flashes = [];
    pause()
    putBallsAtPuck();
    // For safari mobile https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};
window.addEventListener("resize", fitSize);

function recomputeTargetBaseSpeed() {
    // We never want the ball to completely stop, it will move at least 3px per frame
    baseSpeed = Math.max(3, gameZoneWidth / 12 / 10 + currentLevel / 3 + levelTime / (30 * 1000) - perks.slow_down * 2);
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
            time: levelTime,
            size,
            x: x + ((Math.random() - 0.5) * brickWidth) / 2,
            y: y + ((Math.random() - 0.5) * brickWidth) / 2,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            color,
            duration: 150
        });
    }
}


let score = 0;

let lastexplosion = 0;
let highScore = parseFloat(localStorage.getItem("breakout-3-hs") || "0");

let lastPlayedCoinGrab = 0

function addToScore(coin) {
    coin.destroyed = true
    score += coin.points;
    addToTotalScore(coin.points)
    if (score > highScore && !hadOverrides) {
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
        runStatistics.score+=coin.points


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
        Object.assign(ball, {
            x,
            previousx: x,
            y: gameZoneHeight - 1.5 * ballSize,
            previousy: gameZoneHeight - 1.5 * ballSize,
            vx: Math.random() > 0.5 ? baseSpeed : -baseSpeed,
            vy: -baseSpeed,
            sx: 0,
            sy: 0,
            hitItem: [],
            hitSinceBounce: 0,
            piercedSinceBounce: 0,
            // piercedSinceBounce: 0,
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


function pickedUpgradesHTMl() {
    let list = ''
    for (let u of upgrades) {
        for (let i = 0; i < perks[u.id]; i++)
            list += u.icon + ' '
    }

    return list
}

async function openUpgradesPicker() {

     const catchRate = (score - levelStartScore) / (levelSpawnedCoins || 1);

    let repeats = 1;
    let choices = 3;

    let timeGain = '', catchGain = '', missesGain = ''
    if (levelTime < 30 * 1000) {
        repeats++;
        choices++;
        timeGain = " (+1 upgrade)"
    } else if (levelTime < 60 * 1000) {
        choices++;
        timeGain = " (+1 choice)"
    }
    if (catchRate === 1) {
        repeats++;
        choices++;
        catchGain = " (+1 upgrade)"
    } else if (catchRate > 0.9) {
        choices++;
        catchGain = " (+1 choice)"
    }
    if (levelMisses === 0) {
        repeats++;
        choices++;
        missesGain = " (+1 upgrade)"
    } else if (levelMisses <= 3) {
        choices++;
        missesGain = " (+1 choice)"
    }




    while (repeats--) {
        const actions = pickRandomUpgrades(choices);
        if (!actions.length) break
        let textAfterButtons = `
<p>Upgrades picked so far : </p><p>${pickedUpgradesHTMl()}</p>
<div id="level-recording-container"></div> 
`;

        const cb = await asyncAlert({
            title: "Pick an upgrade " + (repeats ? "(" + (repeats + 1) + ")" : ""), actions,
            text: `<p>
You caught ${score - levelStartScore} coins ${catchGain} out of ${levelSpawnedCoins} in ${Math.round(levelTime / 1000)} seconds${timeGain}.
        You missed ${levelMisses} times ${missesGain}.</p>`,
            allowClose: false,
            textAfterButtons
        });
        cb();
        runStatistics.upgrades_picked++
    }
    resetCombo();
    resetBalls();
}

function setLevel(l) {
    pause()
    if (l > 0) {
        openUpgradesPicker().then();
    }
    currentLevel = l;

    levelTime = 0;
    lastTickDown = levelTime;
    levelStartScore = score;
    levelSpawnedCoins = 0;
    levelMisses = 0;
    runStatistics.levelsPlayed++

    resetCombo();
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

    background.src = 'data:image/svg+xml;base64,' + btoa(lvl.svg)
    stopRecording()
    startRecordingGame()
}

function currentLevelInfo() {
    return runLevels[currentLevel % runLevels.length];
}

function reset_perks() {

    for (let u of upgrades) {
        perks[u.id] = 0;
    }

    if (nextRunOverrides.perks) {
        const first = Object.keys(nextRunOverrides.perks)[0]
        Object.assign(perks, nextRunOverrides.perks)
        nextRunOverrides.perks = null
        return first
    }

    const giftable = getPossibleUpgrades().filter(u => u.giftable)
    const randomGift = isSettingOn('easy') ? 'slow_down' : giftable[Math.floor(Math.random() * giftable.length)].id;
    perks[randomGift] = 1;

    return randomGift
}

const upgrades = [
    {
        "threshold": 0,
        "id": "extra_life",
        "name": "+1 life",
        "max": 7,
        "help": "Survive dropping the ball",
        extraLevelsHelp: `One more life just in case`
    },
    {
        "threshold": 0,
        "id": "streak_shots",
        "giftable": true,
        "name": "Single puck hit streak",
        "max": 1,
        "help": "Break many bricks at once."
    },

    {
        "threshold": 0,
        "id": "base_combo",
        "giftable": true,
        "name": "+3 base combo",
        "max": 7,
        "help": "Your combo starts at 4",
        extraLevelsHelp: `Combo starts 3 points higher`
    },
    {
        "threshold": 0,
        "id": "slow_down",
        "name": "Slower ball",
        "max": 2,
        "help": "Slows down the ball",
        extraLevelsHelp: `Make it even slower`
    },
    {
        "threshold": 0,
        "id": "bigger_puck",
        "name": "Bigger puck",
        "max": 2,
        "help": "Catches more coins",
        extraLevelsHelp: `Even bigger puck`
    },
    {
        "threshold": 0,
        "id": "viscosity",
        "name": "Viscosity",
        "max": 3,
        "help": "Slower coins fall",
        extraLevelsHelp: `Even slower fall`,
        tryout: {
            perks: {viscosity: 3, base_combo: 3},
            level: 'Waves'
        }
    },
    {
        "threshold": 0,
        "id": "sides_are_lava",
        "giftable": true,
        "name": "Shoot straight",
        "max": 1,
        "help": "Avoid the sides for more coins."
    },
    {
        "threshold": 0,
        "id": "top_is_lava",
        "giftable": true,
        "name": "Sky is the limit",
        "max": 1,
        "help": "Avoid the top for more coins."
    },
    {
        "threshold": 0,
        "id": "skip_last",
        "name": "Easy Cleanup",
        "max": 7,
        "help": "The last brick will self-destruct",
        extraLevelsHelp: `Level clears one brick earlier`,
    },
    {
        "threshold": 500,
        "id": "telekinesis",
        "giftable": true,
        "name": "Puck controls ball",
        "max": 2,
        "help": "Control the ball's trajectory",
        extraLevelsHelp: `Stronger effect on the ball`,
    },
    {
        "threshold": 1000,
        "id": "coin_magnet",
        "name": "Coins magnet",
        "max": 3,
        "help": "Puck attracts coins",
        tryout: {
            perks: {coin_magnet: 3, base_combo: 3}
        }, extraLevelsHelp: `Stronger effect on the coins`,
    },
    {
        "threshold": 1500,
        "id": "multiball",
        "giftable": true,
        "name": "+1 ball",
        "max": 6,
        "help": "Start with two balls",
        extraLevelsHelp: `One more ball`,
    },
    {
        "threshold": 2000,
        "id": "smaller_puck",
        "name": "Smaller puck",
        "max": 2,
        "help": "Gives you more control",
        extraLevelsHelp: `Even smaller puck`,
    },
    {
        "threshold": 3000,
        "id": "pierce",
        "giftable": true,
        "name": "Piercing",
        "max": 3,
        "help": "Ball pierces 3 bricks",
        extraLevelsHelp: `Pierce 3 more bricks`,
    },
    {
        "threshold": 4000,
        "id": "picky_eater",
        "giftable": true,
        "name": "Picky eater",
        "color_blind_exclude": true,
        "max": 1,
        "help": "Break bricks color by color",

        tryout: {
            perks: {picky_eater: 1},
            level: 'Mountain'
        }
    },
    {
        "threshold": 5000,
        "id": "metamorphosis",
        "name": "Stain",
        "color_blind_exclude": true,
        "max": 1,
        "help": "Coins color the bricks they touch",
        tryout: {
            perks: {metamorphosis: 3},
            level: 'Lines'
        }
    },
    {
        "threshold": 6000,
        "id": "catch_all_coins",
        "giftable": true,
        "name": "Compound interest",
        "max": 3,
        "help": "Avoid missing coins with your puck",
        extraLevelsHelp: `Combo grows faster but missed coins hurt it more`,
    },
    {
        "threshold": 7000,
        "id": "hot_start",
        "giftable": true,
        "name": "Hot start",
        "max": 3,
        "help": "Clear the level quickly",
        extraLevelsHelp: `Combo starts higher but shrinks faster`,
    },
    {
        "threshold": 9000,
        "id": "sapper",
        "giftable": true,
        "name": "Sapper",
        "max": 7,
        "help": "1st brick hit becomes bomb",
        extraLevelsHelp: `1 more brick replaced by a bomb`,
    },
    {
        "threshold": 11000,
        "id": "bigger_explosions",
        "name": "Kaboom",
        "max": 1,
        "help": "Bigger explosions",
        tryout: {
            perks: {bigger_explosions: 1},
            level: 'Ship'
        }
    },
    {
        "threshold": 13000,
        "id": "extra_levels",
        "name": "+1 level",
        "max": 3,
        "help": "Play 8 levels instead of 7",
        extraLevelsHelp: `1 more brick replaced by a bomb`,
    },
    {
        "threshold": 15000,
        "id": "pierce_color",
        "name": "Color pierce",
        "color_blind_exclude": true,
        "max": 1,
        "help": "Ball breaks same color bricks"
    },
    {
        "threshold": 18000,
        "id": "soft_reset",
        "name": "Soft reset",
        "max": 2,
        "help": "Combo grows slower but resets less",
        extraLevelsHelp: `Even slower combo growth but softer reset`,
    },
    {
        "threshold": 21000,
        "id": "ball_repulse_ball",
        "name": "Personal space",
        requires: 'multiball',
        "max": 3,
        "help": "Balls repulse balls.",
        extraLevelsHelp: 'Stronger repulsion force ',
        tryout: {
            perks: {ball_repulse_ball: 1, multiball: 2},
        }
    },
    {
        "threshold": 25000,
        "id": "ball_attract_ball",
        requires: 'multiball',
        "name": "Gravity",
        "max": 3,
        "help": "Balls attract balls.", extraLevelsHelp: 'Stronger attraction force ',
        tryout: {
            perks: {ball_attract_ball: 1, multiball: 2},
        }
    },
    {
        "threshold": 30000,
        "id": "puck_repulse_ball",
        "name": "Soft landing",
        extraLevelsHelp: 'Stronger repulsion force ',
        "max": 3,
        "help": "Puck repulses balls.",
    },
    {
        "threshold": 35000,
        "id": "wind",
        "name": "Wind",
        "max": 3,
        "help": "Puck position creates wind.", extraLevelsHelp: 'Stronger wind force ',
    },
    {
        "threshold": 40000,
        "id": "sturdy_bricks",
        "name": "Sturdy bricks",
        "max": 4,
        "help": "Bricks sometimes resist hits but drop more coins.",
        extraLevelsHelp: 'Bricks resist more and drop more coins ',
    },
    {
        "threshold": 45000,
        "id": "respawn",
        "name": "Respawn",
        "max": 4,
        "help": "The first brick hit will respawn.", extraLevelsHelp: 'More bricks can respawn ',
    },
]


let totalScoreAtRunStart = getTotalScore()

function getPossibleUpgrades() {
    return upgrades
        .filter(u => !(isSettingOn('color_blind') && u.color_blind_exclude))
        .filter(u => totalScoreAtRunStart >= u.threshold)
        .filter(u => !u.requires || perks[u.requires])
}


function shuffleLevels(nameToAvoid = null) {
    const target = nextRunOverrides?.level;
    if (target) {
        runLevels = allLevels.filter(l => l.name === target)
        nextRunOverrides.level = null
        if (runLevels.length) return
        console.log('target level not found, will take random  one : ' + target)
    }

    runLevels = allLevels
        .filter((l, li) => totalScoreAtRunStart >= l.threshold)
        .filter(l => l.name !== nameToAvoid || allLevels.length === 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 7 + 3)
        .sort((a, b) => a.sortKey - b.sortKey);

}

function getUpgraderUnlockPoints() {
    let list = []

    upgrades
        .filter(u => !(isSettingOn('color_blind') && u.color_blind_exclude))
        .forEach(u => {
            if (u.threshold) {
                list.push({
                    threshold: u.threshold,
                    title: u.name + ' (Perk)'
                })
            }
        })

    allLevels.forEach((l, li) => {
        list.push({
            threshold: l.threshold,
            title: l.name + ' (Level)',
        })
    })

    return list.filter(o => o.threshold).sort((a, b) => a.threshold - b.threshold)
}


let lastOffered = {}

function dontOfferTooSoon(id) {
    lastOffered[id] = Math.round(Date.now() / 1000)
}

function pickRandomUpgrades(count) {

    let list = getPossibleUpgrades()
        .map(u => ({...u, score: Math.random() + (lastOffered[u.id] || 0)}))
        .sort((a, b) => a.score - b.score)
        .filter(u => perks[u.id] < u.max)
        .slice(0, count)
        .sort((a, b) => a.id > b.id ? 1 : -1)

    list.forEach(u => {
        dontOfferTooSoon(u.id)
    })

    return list.map(u => ({
        text: u.name + (perks[u.id] ? ' lvl ' + (perks[u.id] + 1) : ''),
        icon: u.icon,
        value: () => {
            perks[u.id]++;
        },
        help: (perks[u.id] && u.extraLevelsHelp) || u.help,
        // max: u.max,
        // checked: perks[u.id]
    }))


}

let nextRunOverrides = {level: null, perks: null}
let hadOverrides = false

function restart() {
    console.log("restart")
    hadOverrides = !!(nextRunOverrides.level || nextRunOverrides.perks)
    // When restarting, we want to avoid restarting with the same level we're on, so we exclude from the next
    // run's level list
    totalScoreAtRunStart = getTotalScore()
    shuffleLevels(levelTime || score ? currentLevelInfo().name : null);
    resetRunStatistics()
    score = 0;

    const randomGift = reset_perks();

    dontOfferTooSoon(randomGift)

    setLevel(0);
    pauseRecording()
}

function setMousePos(x) {

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

canvas.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return;
    if (running) {
        pause()
    } else {
        play()
    }
});

canvas.addEventListener("mousemove", (e) => {
    setMousePos(e.x);
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!e.touches?.length) return;
    setMousePos(e.touches[0].pageX);
    play()
});
canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    pause()
});
canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    pause()
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
    const {x, y, previousx, previousy} = ballOrCoin;

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

    if (perks.wind) {
        coin.vx += (puck - (offsetX + gameZoneWidth / 2)) / gameZoneWidth * perks.wind * 0.5;
    }

    let vhit = 0, hhit = 0;


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
    if (coin.x > canvas.width - offsetXRoundedDown - radius) {
        coin.x = canvas.width - offsetXRoundedDown - radius;
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
        runStatistics.runTime += currentTick - lastTick
        runStatistics.max_combo = Math.max(runStatistics.max_combo, combo)

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

            if (perks.wind) {

                const windD = (puck - (offsetX + gameZoneWidth / 2)) / gameZoneWidth * 2 * perks.wind
                for (var i = 0; i < perks.wind; i++) {
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
    }

    const speedLimitDampener = 1 + perks.telekinesis + perks.ball_repulse_ball + perks.puck_repulse_ball + perks.ball_attract_ball
    if (ball.vx * ball.vx + ball.vy * ball.vy < baseSpeed * baseSpeed * 2) {
        ball.vx *= (1 + .02 / speedLimitDampener);
        ball.vy *= (1 + .02 / speedLimitDampener);
    } else {
        ball.vx *= (1 - .02 / speedLimitDampener);
        if (Math.abs(ball.vy) > 0.5 * baseSpeed) {
            ball.vy *= (1 - .02 / speedLimitDampener);
        }
    }

    if (perks.ball_repulse_ball) {
        for (b2 of balls) {
            // avoid computing this twice, and repulsing itself
            if (b2.x >= ball.x) continue
            repulse(ball, b2, perks.ball_repulse_ball, true)
        }
    }
    if (perks.ball_attract_ball) {
        for (b2 of balls) {
            // avoid computing this twice, and repulsing itself
            if (b2.x >= ball.x) continue
            attract(ball, b2, perks.ball_attract_ball)
        }
    }
    if (perks.puck_repulse_ball && Math.abs(ball.x - puck) < puckWidth / 2 + ballSize * (9 + perks.puck_repulse_ball) / 10) {
        repulse(ball, {
            x: puck,
            y: gameZoneHeight,
            color: currentLevelInfo()?.black_puck ? '#000' : '#FFF',
        }, perks.puck_repulse_ball, false)
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

        if (perks.respawn) {
            ball.hitItem.slice(0, -1).slice(0, perks.respawn)
                .forEach(({index, color}) => bricks[index] = bricks[index] || color)
        }
        ball.hitItem = []
        if (!ball.hitSinceBounce) {
            runStatistics.misses++
            levelMisses++;
            const loss = resetCombo(ball.x, ball.y)
            if (ball.bouncesList?.length) {
                ball.bouncesList.push({
                    x: ball.previousx,
                    y: ball.previousy
                })
                for (si = 0; si < ball.bouncesList.length - 1; si++) {
                    // segement
                    const start = ball.bouncesList[si]
                    const end = ball.bouncesList[si + 1]
                    const distance = distanceBetween(start, end)

                    const parts = distance / 30
                    for (var i = 0; i < parts; i++) {
                        flashes.push({
                            type: "particle",
                            duration: 200,
                            ethereal: true,
                            time: levelTime,
                            size: coinSize / 2,
                            color: loss ? 'red' : ball.color,
                            x: start.x + (i / (parts - 1)) * (end.x - start.x),
                            y: start.y + (i / (parts - 1)) * (end.y - start.y),
                            vx: (Math.random() - 0.5) * baseSpeed,
                            vy: (Math.random() - 0.5) * baseSpeed,
                        });
                    }
                }
            }

        }
        runStatistics.puck_bounces++
        ball.hitSinceBounce = 0;
        ball.sapperUses = 0;
        ball.piercedSinceBounce = 0;
        ball.bouncesList = [{
            x: ball.previousx,
            y: ball.previousy
        }]
    }

    if (ball.y > gameZoneHeight + ballSize / 2 && running) {
        ball.destroyed = true;
        runStatistics.balls_lost++
        if (!balls.find((b) => !b.destroyed)) {
            if (perks.extra_life) {
                perks.extra_life--;
                resetBalls();
                sounds.revive();
                pause()
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
        const initialBrickColor = bricks[hitBrick]

        explodeBrick(hitBrick, ball, false);

        if (ball.sapperUses < perks.sapper && initialBrickColor !== "black" &&
            // don't replace a brick that bounced with sturdy_bricks
            !bricks[hitBrick]) {
            bricks[hitBrick] = "black";
            ball.sapperUses++
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


function getTotalScore() {
    try {
        return JSON.parse(localStorage.getItem('breakout_71_total_score') || '0')
    } catch (e) {
        return 0
    }
}

function addToTotalScore(points) {
    if (hadOverrides) return
    try {
        localStorage.setItem('breakout_71_total_score', JSON.stringify(getTotalScore() + points))
    } catch (e) {
    }
}


function gameOver(title, intro) {
    if (!running) return;
    pause()
    stopRecording()

    runStatistics.max_level = currentLevel+1

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
<p class="progress"  >
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

        const scaleX = (done / total).toFixed(2)
        unlocksInfo += `
            <p class="progress"   >
           <span>${nextUnlock.title}</span>
        <span style="transform: scale(${scaleX},1);${getDelay()}" class="progress_bar_part"></span>
        </p>

`
        list.slice(list.indexOf(nextUnlock) + 1).slice(0, 3).forEach(u => {
            unlocksInfo += `
        <p class="progress"  >
           <span>${u.title}</span> 
        </p> 
`
        })
    }



    // Avoid the sad sound right as we restart a new games
    combo = 1
    asyncAlert({
        allowClose: true, title, text: `
        <p>${intro}</p>
        ${unlocksInfo}  
        `, textAfterButtons: ` 
        <div id="level-recording-container"></div>
        ${getHistograms(true)} 
        `
    }).then(() => restart());
}

function getHistograms(saveStats){

    if (hadOverrides) {return''}

    let runStats=''
    try {
        // Stores only top 100 runs
        let runsHistory = JSON.parse(localStorage.getItem('breakout_71_runs_history') || '[]');
        runsHistory.sort((a,b)=>a.score-b.score).reverse()
        runsHistory=runsHistory.slice(0, 100)
         runsHistory.push(runStatistics)

        // Generate some histogram
        if(saveStats) {
            localStorage.setItem('breakout_71_runs_history', JSON.stringify(runsHistory, null, 2))
        }
        const makeHistogram = (title, getter, unit) => {
            let values = runsHistory.map(h => getter(h) || 0)
            const min = Math.min(...values)
            const max = Math.max(...values)
            // No point
            if(min===max) return ''
            // One bin per unique value, max 10
            const binsCount = Math.min(values.length,10)
            if(binsCount<3) return ''
            const bins = []
            const binsTotal = []
            for(let i=0;i<binsCount;i++){
                bins.push(0)
                binsTotal.push(0)
            }
            const binSize = (max - min) / bins.length
            const binIndexOf = v => Math.min(bins.length - 1, Math.floor((v - min) / binSize))
            values.forEach(v => {
                if(isNaN(v)) return
                const index=binIndexOf(v)
                bins[index]++
                binsTotal[index]+=v
            })
            if(bins.filter(b=>b).length<3) return ''
            const maxBin = Math.max(...bins)
            const lastValue = values[values.length - 1]
            const activeBin = binIndexOf(lastValue)
            return `<h2 class="histogram-title">${title} : <strong>${lastValue}${unit}</strong></h2><div class="histogram">
                ${bins.map((v, vi) => `<span   class="${vi === activeBin ? 'active' : ''}"><span style="height:${v / maxBin * 80}px" title="${v} run${v>1 ? 's':''} between ${
                Math.floor(min + vi * binSize)} and ${Math.floor(min + (vi + 1) * binSize)}${unit}"
              ><span>${
                    (!v && ' ') || (vi==activeBin && lastValue+unit) || (Math.round(binsTotal[vi]/v)+unit)
            }</span></span></span>`).join('')}
            </div>
            `
        }


        runStats += makeHistogram('Total score', r => r.score, '')
        runStats += makeHistogram('Catch rate', r => Math.round(r.score / r.coins_spawned * 100), '%')
        runStats += makeHistogram('Bricks broken', r => r.bricks_broken, '')
        runStats += makeHistogram('Bricks broken per minute', r =>Math.round(r.bricks_broken/r.runTime*1000*60), ' bpm')
        runStats += makeHistogram('Hit rate', r => Math.round((1-r.misses / r.puck_bounces) * 100), '%')
        runStats += makeHistogram('Duration per level', r =>  Math.round(r.runTime/1000/r.levelsPlayed), 's')
        runStats += makeHistogram('Level reached', r => r.levelsPlayed, '')
        runStats += makeHistogram('Upgrades applied', r => r.upgrades_picked, '')
        runStats += makeHistogram('Balls lost', r => r.balls_lost, '')
        runStats += makeHistogram('Average combo', r => Math.round(r.coins_spawned /r.bricks_broken) , '')
        runStats += makeHistogram('Max combo', r => r.max_combo , '')

        if(runStats){
            runStats= `<p>Find below your run statistics compared to past runs.</p>`+ runStats
        }
    } catch (e) {
        console.warn(e)
    }
    return runStats
}


function resetRunStatistics() {
    runStatistics = {
        started: Date.now(),
        levelsPlayed: 0,
        runTime: 0,
        coins_spawned: 0,
        score: 0,
        bricks_broken:0,
        misses:0,
        balls_lost:0,
        puck_bounces:0,
        upgrades_picked:1,
        max_combo:1
    }
}
function explodeBrick(index, ball, isExplosion) {
    const color = bricks[index];

    if (color === 'black') {
        delete bricks[index];
        const x = brickCenterX(index), y = brickCenterY(index);

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
        spawnExplosion(7 * (1 + perks.bigger_explosions), x, y, 'white', 150, coinSize,);
        ball.hitSinceBounce++;
        runStatistics.bricks_broken++
    } else if (color) {
        // Even if it bounces we don't want to count that as a miss
        ball.hitSinceBounce++;

        if (perks.sturdy_bricks && perks.sturdy_bricks * 2 > Math.random() * 10) {
            // Resist
            sounds.coinBounce(ball.x, 1)
            return
        }
        // Flashing is take care of by the tick loop
        const x = brickCenterX(index), y = brickCenterY(index);

        bricks[index] = "";

        levelSpawnedCoins += combo;

        runStatistics.coins_spawned+=combo
        runStatistics.bricks_broken++


        coins = coins.filter((c) => !c.destroyed);
        let coinsToSpawn = combo
        if (perks.sturdy_bricks) {
            // +10% per level
            coinsToSpawn += Math.ceil((10 + perks.sturdy_bricks) / 10 * coinsToSpawn)
        }

        while (coinsToSpawn--) {
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

                // Use previous speed because the ball has already bounced
                vx: ball.previousvx * (0.5 + Math.random()),
                vy: ball.previousvy * (0.5 + Math.random()),
                sx: 0,
                sy: 0,
                weight: 0.8 + Math.random() * 0.2
            });
        }


        combo += Math.max(0, perks.streak_shots + perks.catch_all_coins + perks.sides_are_lava + perks.top_is_lava + perks.picky_eater
            - Math.round(Math.random() * perks.soft_reset));

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

        flashes.push({
            type: "ball", duration: 40, time: levelTime, size: brickWidth, color: color, x, y,
        });
        spawnExplosion(5 + combo, x, y, color, 100, coinSize / 2);
    }

    if (!bricks[index]) {
        ball.hitItem?.push({
            index,
            color
        })
    }
}

function max_levels() {
    if (hadOverrides) return 1
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

        // Without this the light trails everything
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = .4
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);


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
            if (type === "ball") {
                drawFuzzyBall(ctx, color, size, x, y);
            }
            if (type === "particle") {
                drawFuzzyBall(ctx, color, size * 3, x, y);
            }

        });
        // Decides how brights the bg black parts can get
        ctx.globalAlpha = .2;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        // Decides how dark the background black parts are when lit (1=black)
        ctx.globalAlpha = .8;
        ctx.globalCompositeOperation = "multiply";
        if (level.svg) {
            if (backgroundCanvas.title !== level.name && background.complete) {
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
            if (background.complete) {
                ctx.drawImage(backgroundCanvas, 0, 0)
            } else {
                // Background not loaded yes
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, width, height);
            }
        }
    } else {

        ctx.globalAlpha = 1
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

    if (combo > baseCombo()) {
        // The red should still be visible on a white bg
        ctx.globalCompositeOperation = !level.color && level.svg ? "screen" : 'source-over';
        ctx.globalAlpha = (2 + combo - baseCombo()) / 50;
        const baseParticle = !isSettingOn('basic') && (combo - baseCombo()) * Math.random() > 5 && running && {
            type: "particle",
            duration: 100 * (Math.random() + 1),
            time: levelTime,
            size: coinSize / 2,
            color: 'red',
            ethereal: true,
        }

        if (perks.top_is_lava) {
            drawRedGradientSquare(ctx, offsetXRoundedDown, 0, gameZoneWidthRoundedUp, ballSize, 0, 0, 0, ballSize);
            baseParticle && flashes.push({
                ...baseParticle,
                x: offsetXRoundedDown + Math.random() * gameZoneWidthRoundedUp,
                y: 0,
                vx: (Math.random() - 0.5) * 10,
                vy: 5,
            })
        }
        if (perks.sides_are_lava) {
            drawRedGradientSquare(ctx, offsetXRoundedDown, 0, ballSize, gameZoneHeight, 0, 0, ballSize, 0,);
            drawRedGradientSquare(ctx, offsetXRoundedDown + gameZoneWidthRoundedUp - ballSize, 0, ballSize, gameZoneHeight, ballSize, 0, 0, 0,);
            const fromLeft = Math.random() > 0.5
            baseParticle && flashes.push({
                ...baseParticle,
                x: offsetXRoundedDown + (fromLeft ? 0 : gameZoneWidthRoundedUp),
                y: Math.random() * gameZoneHeight,
                vx: fromLeft ? 5 : -5,
                vy: (Math.random() - 0.5) * 10,
            })
        }
        if (perks.catch_all_coins) {
            drawRedGradientSquare(ctx, offsetXRoundedDown, gameZoneHeight - ballSize, gameZoneWidthRoundedUp, ballSize, 0, ballSize, 0, 0,);
            let x = puck
            do {
                x = offsetXRoundedDown + gameZoneWidthRoundedUp * Math.random()
            } while (Math.abs(x - puck) < puckWidth / 2)
            baseParticle && flashes.push({
                ...baseParticle,
                x,
                y: gameZoneHeight,
                vx: (Math.random() - 0.5) * 10,
                vy: -5,
            })
        }
        if (perks.streak_shots) {
            drawRedGradientSquare(ctx, puck - puckWidth / 2, gameZoneHeight - puckHeight - ballSize, puckWidth, ballSize, 0, ballSize, 0, 0,);
            const pos = (0.5 - Math.random())
            baseParticle && flashes.push({
                ...baseParticle,
                duration: 100,
                x: puck + puckWidth * pos,
                y: gameZoneHeight - puckHeight,
                vx: (pos) * 10,
                vy: -5,
            })
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
        const amplitude = (perks.bigger_explosions + 1) * 50 / lastExplosionDelay
        ctx.translate(Math.sin(Date.now()) * amplitude, Math.sin(Date.now() + 36) * amplitude);
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

        ctx.globalCompositeOperation = "source-over";
        drawText(ctx, "x " + combo, !level.black_puck ? '#000' : '#FFF', puckHeight, {
            x: puck, y: gameZoneHeight - puckHeight / 2,
        });
    }
    //  Borders
    ctx.fillStyle = puckColor;
    ctx.globalCompositeOperation = "source-over";
    if (offsetXRoundedDown) {
        // draw outside of gaming area to avoid capturing borders in recordings
        ctx.fillRect(offsetX - 1, 0, 1, height);
        ctx.fillRect(width - offsetX + 1, 0, 1, height);
    }
    if (isSettingOn("mobile-mode")) {
        ctx.fillRect(offsetXRoundedDown, gameZoneHeight, gameZoneWidthRoundedUp, 1);
        if (!running) {
            drawText(ctx, "Keep pressing here to play", puckColor, puckHeight, {
                x: canvas.width / 2, y: gameZoneHeight + (canvas.height - gameZoneHeight) / 2,
            });
        }
    }

    if (shaked) {
        ctx.resetTransform();
    }

    recordOneFrame()
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

function drawRedGradientSquare(ctx, x, y, width, height, redX, redY, blackX, blackY) {
    const key = "gradient" + width + "_" + height + "_" + redX + "_" + redY + "_" + blackX + "_" + blackY;

    if (!cachedGraphics[key]) {
        const can = document.createElement("canvas");
        can.width = width;
        can.height = height;
        const canctx = can.getContext("2d");

        const gradient = canctx.createLinearGradient(redX, redY, blackX, blackY);
        gradient.addColorStop(0, "rgba(255,0,0,1)");
        gradient.addColorStop(1, "rgba(255,0,0,0)");
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
    },
    coinBounce: (pan, volume) => {
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
    document.body.className = (running ? " running " : " paused ") + (currentLevelInfo()?.black_puck ? ' black_puck ' : ' ');
}, 100);

window.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pause()
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

        actions.filter(i => i).forEach(({text, value, help, checked = 0, max = 0, disabled, icon = ''}) => {
            const button = document.createElement("button");
            let checkMark = ''
            if (max) {
                checkMark += '<span class="checks">'
                for (let i = 0; i < max; i++) {
                    checkMark += '<span class="' + (checked > i ? "checked" : "unchecked") + '"></span>';
                }
                checkMark += '</span>'
            }
            button.innerHTML = `
${icon}
${checkMark}
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
    running = false
    const cb = await asyncAlert({
        title: ` ${score} points at level ${currentLevel + 1} / ${max_levels()}`,
        text: `

<p>Upgrades picked so far : </p>
<p>${pickedUpgradesHTMl()}</p>
         
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
        disabled: () => false
    }, "mobile-mode": {
        default: window.innerHeight > window.innerWidth,
        name: `Mobile mode`,
        help: `Leaves space for your thumb.`,
        afterChange() {
            fitSize();
        },
        disabled: () => false
    },
    basic: {
        default: false, name: `Basic graphics`, help: `Better performance on older devices.`,
        disabled: () => false
    },
    "easy": {
        default: false, name: `Kids mode`, help: `Starting perk always "slower ball".`, restart: true,
        disabled: () => false
    }, "color_blind": {
        default: false, name: `Color blind mode`, help: `Removes mechanics about colors.`, restart: true,
        disabled: () => false
    },
    // Could not get the sharing to work without loading androidx and all the modern android things so for now i'll just disable sharing in the android app
    "record": {
        default: false, name: `Record gameplay videos`, help: `Get a video of each level.`,
        disabled() {
            return window.location.search.includes('isInWebView=true')
        }
    },
    gif: {
        default: false, name: `Make a gif too`, help: `3x heavier, 2x smaller, 7s max`,
        disabled() {
            return window.location.protocol === "file:" || !isSettingOn('record')
        }
    }
};

async function openSettingsPanel() {

    pause()

    const optionsList = [];
    for (const key in options) {
        if (options[key])
            optionsList.push({
                disabled: options[key].disabled(),
                checked: isSettingOn(key) ? 1 : 0,
                max: 1, text: options[key].name, help: options[key].help, value: () => {
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
            {
                text: 'Unlocks',
                help: "See and try what you've unlocked",
                async value() {
                    const ts = getTotalScore()
                    const actions = [...upgrades
                        .sort((a, b) => a.threshold - b.threshold)
                        .map(({
                                  name,
                                  max,
                                  help, id,
                                  threshold, icon, tryout
                              }) => ({
                                text: name,
                                help: ts >= threshold ? help : `Unlocks at total score ${threshold}.`,
                                disabled: ts < threshold,
                                value: tryout || {perks: {[id]: max}},
                                icon
                            })
                        )

                        ,
                        ...allLevels
                            .sort((a, b) => a.threshold - b.threshold)
                            .map((l, li) => {
                                const avaliable = ts >= l.threshold
                                return ({
                                    text: l.name,
                                    help: avaliable ? `A ${l.size}x${l.size} level with ${l.bricks.filter(i => i).length} bricks` : `Unlocks at total score ${l.threshold}.`,
                                    disabled: !avaliable,
                                    value: {level: l.name},
                                    icon: levelIconHTML(l)
                                })
                            })
                    ]

                    const tryOn = await asyncAlert({
                        title: `You unlocked ${Math.round(actions.filter(a => !a.disabled).length / actions.length * 100)}% of the game.`,
                        text: `
                       <p> Your total score is ${ts}. Below are all the upgrades and levels the games has to offer. They greyed out ones can be unlocked by increasing your total score. </p> 
                       `,
                        textAfterButtons: `<p>
The total score increases every time you score in game.
Your high score is ${highScore}. 
Click an item above to start a test run with it.
                </p>`,
                        actions


                        ,
                        allowClose: true,
                    })
                    if (tryOn) {
                        nextRunOverrides = tryOn
                        restart()
                    }
                }
            },

            ...optionsList,

            (document.fullscreenEnabled || document.webkitFullscreenEnabled) && (document.fullscreenElement !== null ? {
                    text: "Exit Fullscreen",
                    help: "Might not work on some machines",
                    value() {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.webkitCancelFullScreen) {
                            document.webkitCancelFullScreen();
                        }
                    }
                } :
                {
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
                }),
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
        <p>
            <span>Made in France by <a href="https://lecaro.me">Renan LE CARO</a>.</span> 
            <a href="./privacy.html" target="_blank">Privacy Policy</a>
            <a href="https://f-droid.org/en/packages/me.lecaro.breakout/" target="_blank">F-Droid</a>
            <a href="https://play.google.com/store/apps/details?id=me.lecaro.breakout" target="_blank">Google Play</a>
            <a href="https://renanlecaro.itch.io/breakout71" target="_blank">itch.io</a> 
            <a href="https://gitlab.com/lecarore/breakout71" target="_blank">Gitlab</a>
            <a href="https://breakout.lecaro.me/" target="_blank">Web version</a>
            <span>v.${window.appVersion}</span>
         </p>
        `
    })
    if (cb) {
        cb()
    }
}

function distance2(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
}

function distanceBetween(a, b) {
    return Math.sqrt(distance2(a, b))
}

function rainbowColor() {
    return `hsl(${Math.round((levelTime / 4)) * 2 % 360},100%,70%)`
}

function repulse(a, b, power, impactsBToo) {

    const distance = distanceBetween(a, b)
    // Ensure we don't get soft locked
    const max = gameZoneWidth / 2
    if (distance > max) return
    // Unit vector
    const dx = (a.x - b.x) / distance
    const dy = (a.y - b.y) / distance
    const fact = -power * (max - distance) / (max * 1.2) / 3 * Math.min(500, levelTime) / 500
    if (impactsBToo) {
        b.vx += dx * fact
        b.vy += dy * fact
    }
    a.vx -= dx * fact
    a.vy -= dy * fact

    const speed = 10
    const rand = 2
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
    })
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
        })
    }

}

function attract(a, b, power) {

    const distance = distanceBetween(a, b)
    // Ensure we don't get soft locked
    const min = gameZoneWidth * .5
    if (distance < min) return
    // Unit vector
    const dx = (a.x - b.x) / distance
    const dy = (a.y - b.y) / distance

    const fact = power * (distance - min) / min * Math.min(500, levelTime) / 500
    b.vx += dx * fact
    b.vy += dy * fact
    a.vx -= dx * fact
    a.vy -= dy * fact

    const speed = 10
    const rand = 2
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
    })
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
    })
}

let levelIconHTMLCanvas = document.createElement('canvas')
const levelIconHTMLCanvasCtx = levelIconHTMLCanvas.getContext("2d", {antialias: false, alpha: true})

function levelIconHTML(level, title) {
    const size = 40
    const c = levelIconHTMLCanvas
    const ctx = levelIconHTMLCanvasCtx
    c.width = size
    c.height = size
    if (level.color) {
        ctx.fillStyle = level.color
        ctx.fillRect(0, 0, size, size)
    } else {
        ctx.clearRect(0, 0, size, size)
    }
    const pxSize = size / level.size
    for (let x = 0; x < level.size; x++) {
        for (let y = 0; y < level.size; y++) {
            const c = level.bricks[y * level.size + x]
            if (c) {
                ctx.fillStyle = c
                ctx.fillRect(Math.floor(pxSize * x), Math.floor(pxSize * y), Math.ceil(pxSize), Math.ceil(pxSize))
            }
        }
    }
    // I don't think many blind people will benefit for this but it's nice to have something to put in "alt"
    return `<img title="${title || level.name}" alt="Icon for ${level.name}" width="${size}" height="${size}" src="${c.toDataURL()}"/>`
}

upgrades.forEach(u => u.icon = levelIconHTML(perkIconsLevels[u.id], u.name))

let mediaRecorder, captureStream, recordCanvas, recordCanvasCtx, levelGif, gifCanvas, gifCtx


function recordOneFrame() {
    if (!isSettingOn('record')) {
        return
    }
    if (!running) return;
    drawMainCanvasOnSmallCanvas()
    // Start recording after you hit something
    if (levelSpawnedCoins && levelGif) {
        recordGifFrame()
    }
    if (captureStream.requestFrame) {
        captureStream.requestFrame()
    } else {
        captureStream.getVideoTracks()[0].requestFrame()
    }
}


function drawMainCanvasOnSmallCanvas() {
    if(!recordCanvasCtx) return
    recordCanvasCtx.drawImage(canvas, offsetXRoundedDown, 0, gameZoneWidthRoundedUp, gameZoneHeight, 0, 0, recordCanvas.width, recordCanvas.height)
    recordCanvasCtx.fillStyle = currentLevelInfo()?.black_puck ? '#000' : '#FFF'
    recordCanvasCtx.textBaseline = "top";
    recordCanvasCtx.font = "12px monospace";
    recordCanvasCtx.textAlign = "right";
    recordCanvasCtx.fillText(score.toString(), recordCanvas.width - 12, 12)
    recordCanvasCtx.textAlign = "left";
    recordCanvasCtx.fillText((currentLevel + 1) + '/' + max_levels(), 12, 12)
}

let nthGifFrame = 0, gifFrameReduction = 2

function recordGifFrame() {
    if (nthGifFrame / 60 > 7) return
    gifCtx.globalCompositeOperation = 'screen'
    gifCtx.globalAlpha = 1 / gifFrameReduction
    gifCtx?.drawImage(canvas, offsetXRoundedDown, 0, gameZoneWidthRoundedUp, gameZoneHeight, 0, 0, gifCanvas.width, gifCanvas.height)
    nthGifFrame++
    if (!(nthGifFrame % gifFrameReduction)) {
        levelGif.addFrame(gifCtx, {delay: Math.round(gifFrameReduction * 1000 / 60), copy: true});
        gifCtx.globalCompositeOperation = 'source-over'
        gifCtx.fillStyle = 'black'
        gifCtx.fillRect(0, 0, gifCanvas.width, gifCanvas.height)

    }
}

function startRecordingGame() {
    if (!isSettingOn('record')) {
        return
    }
    if (!recordCanvas) {
        // Smaller canvas with less details
        recordCanvas = document.createElement("canvas")
        recordCanvasCtx = recordCanvas.getContext("2d", {antialias: false, alpha: false})

        gifCanvas = document.createElement("canvas")
        gifCtx = gifCanvas.getContext("2d", {antialias: false, alpha: false})
    }

    recordCanvas.width = gameZoneWidthRoundedUp
    recordCanvas.height = gameZoneHeight
    gifCanvas.width = 400
    gifCanvas.height = Math.floor( gameZoneHeight *(400/gameZoneWidthRoundedUp) )


    // Gif worker won't work there
    if (window.location.protocol !== "file:" && isSettingOn('gif')) {
        nthGifFrame = 0
        levelGif = new GIF({
            workers: 2,
            quality: 10,
            repeat: 0,
            background: currentLevelInfo()?.color || '#000',
            width: gifCanvas.width,
            height: gifCanvas.height,
            dither: false,
        });
    } else {
        levelGif = null
    }

    // drawMainCanvasOnSmallCanvas()
    const recordedChunks = [];
    captureStream = captureStream || recordCanvas.captureStream(0);
    const instance = new MediaRecorder(captureStream);
    mediaRecorder = instance
    instance.start();
    mediaRecorder.pause()
    instance.ondataavailable = function (event) {
        recordedChunks.push(event.data);
    }

    instance.onstop = async function () {
        let targetDiv ;
        let blob = new Blob(recordedChunks, {type: "video/webm"});
        if(blob.size< 200000) return // under 0.2MB, probably bugged out or pointlessly short

        while(!(targetDiv = document.getElementById("level-recording-container"))){
            await new Promise(r=>setTimeout(r, 200))
        }
        const video = document.createElement("video")
        video.autoplay = true
        video.controls = false
        video.disablepictureinpicture = true
        video.disableremoteplayback = true
        video.width = recordCanvas.width
        video.height = recordCanvas.height
        targetDiv.style.width = recordCanvas.width + 'px'
        targetDiv.style.height = recordCanvas.height + 'px'
        video.loop = true
        video.muted = true
        video.playsinline = true
        video.src = URL.createObjectURL(blob);

        const a = document.createElement("a")
        a.download = captureFileName('webm')
        a.target = "_blank"
        a.href = video.src
        a.textContent = `Download video (${(blob.size / 1000000).toFixed(2)}MB)`
        targetDiv.appendChild(video)
        targetDiv.appendChild(a)

    }

    levelGif?.on('finished', function (blob) {
        let targetDiv = document.getElementById("level-recording-container")
        const url = URL.createObjectURL(blob)
        const img = document.createElement("img")
        img.src = url
        targetDiv?.appendChild(img)

        const giflink = document.createElement("a")
        giflink.textContent = `Download GIF (${(blob.size / 1000000).toFixed(2)}MB)`
        giflink.href = url
        giflink.download = captureFileName('gif')
        targetDiv?.appendChild(giflink)
    })


}

function pauseRecording() {
    if (!isSettingOn('record')) {
        return
    }
    if (mediaRecorder?.state === 'recording') {
        mediaRecorder?.pause()
    }
}

function resumeRecording() {
    if (!isSettingOn('record')) {
        return
    }
    if (mediaRecorder?.state === 'paused') {
        mediaRecorder.resume()
    }

}

function stopRecording() {
    if (!isSettingOn('record')) {
        return
    }
    if (!mediaRecorder) return;
    mediaRecorder?.stop()
    levelGif?.render()
    mediaRecorder = null
    levelGif = null
}

function captureFileName(ext) {
    return "breakout-71-capture-" + new Date().toISOString().replace(/[^0-9\-]+/gi, '-') + '.' + ext
}







fitSize()
restart()
tick();