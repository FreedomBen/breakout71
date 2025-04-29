import {GameState, PerkId} from "./types";
import {
    catchRateBest,
    catchRateGood,
    levelTimeBest,
    levelTimeGood,
    missesBest,
    missesGood,
    wallBouncedBest,
    wallBouncedGood
} from "./pure_functions";
import {t} from "./i18n/i18n";
import {icons, upgrades} from "./loadGameData";
import {asyncAlert} from "./asyncAlert";
import {
    escapeAttribute,
    getPossibleUpgrades,
    levelsListHTMl,
    max_levels,
    upgradeLevelAndMaxDisplay
} from "./game_utils";
import {getNearestUnlockHTML} from "./openScorePanel";

export async function openUpgradesPicker(gameState: GameState) {
    const catchRate =
        gameState.levelCoughtCoins / (gameState.levelSpawnedCoins || 1);

    let choices = 3
    let livesWon=1

    if (gameState.levelWallBounces < wallBouncedGood) {
        choices++;

        livesWon++;
        if (gameState.levelWallBounces < wallBouncedBest) {
            choices++;
        }
    }

    if (gameState.levelTime < levelTimeGood * 1000) {
        choices++;
        livesWon++;
        if (gameState.levelTime < levelTimeBest * 1000) {
            choices++;
        }
    }
    if (catchRate > catchRateGood / 100) {
        choices++;
        livesWon++;
        if (catchRate > catchRateBest / 100) {
            choices++;
        }
    }
    if (gameState.levelMisses < missesGood) {
        choices++;
        livesWon++;
        if (gameState.levelMisses < missesBest) {
            choices++;
        }
    }

gameState.extra_lives+=livesWon

    let offered: PerkId[] = getPossibleUpgrades(gameState)
        .map((u) => ({
            ...u,
            score: Math.random() + (gameState.lastOffered[u.id] || 0),
        }))
        .sort((a, b) => a.score - b.score)
        .filter((u) => gameState.perks[u.id] < u.max + gameState.perks.limitless)
        .map(u => u.id)

    const fromStart = upgrades.map(u => u.id).filter(id => gameState.perks[id])

    while (true) {

        const updatedChoices =   gameState.perks.one_more_choice + choices
        let list = upgrades.filter(u => offered.slice(0, updatedChoices).includes(u.id) || gameState.perks[u.id])

        list = list.filter(u => fromStart.includes(u.id))
            .concat(list.filter(u => !fromStart.includes(u.id)))

        list.forEach((u) => {
            dontOfferTooSoon(gameState, u.id);
        });


        const upgradeId = await asyncAlert<PerkId | null>({
            title:
                t("level_up.title", {
                    level: gameState.currentLevel,
                    max: max_levels(gameState),
                }),
            content: [
                {
                    text: t('level_up.go', {name: gameState.level.name}),
                    icon: icons[gameState.level.name],
                    value: null,
                },

                gameState.extra_lives ? `<p>${t("level_up.instructions", {
                    count: gameState.extra_lives,
                    gain:livesWon
                })}</p>` : `<p>${t("level_up.no_points")}</p>`,
                ...list.map((u) => {
                    const max = u.max + gameState.perks.limitless
                    const lvl = gameState.perks[u.id]

                    const button = !gameState.extra_lives || gameState.perks[u.id] >= max ?
                        '' : ` <button data-resolve-to="${u.id}">${
                            lvl ? t('level_up.upgrade') : t('level_up.pick')
                        }</button>`

                    const lvlInfo = lvl ? upgradeLevelAndMaxDisplay(u, gameState) : ''
                    return `<div  class="upgrade choice ${
                        (!lvl && gameState.extra_lives && 'free') ||
                        (lvl && 'used') ||
                        'greyed-out'
                    }" >
                        ${icons["icon:" + u.id]}
                        <p data-tooltip="${escapeAttribute(u.fullHelp(Math.max(1, lvl)))}">
                        <strong>${u.name}</strong> ${lvlInfo}
                        ${u.help(Math.max(1, lvl))}
                        </p>
                       ${button}
                    </div>`
                })
                ,
                levelsListHTMl(gameState, gameState.currentLevel),
                getNearestUnlockHTML(gameState),
                `<div id="level-recording-container"></div>`,
            ],
        });

        if (upgradeId) {
            gameState.perks[upgradeId]++;
            gameState.runStatistics.upgrades_picked++;
            gameState.extra_lives--
        } else {
            return
        }
    }
}

export function dontOfferTooSoon(gameState: GameState, id: PerkId) {
    gameState.lastOffered[id] = Math.round(Date.now() / 1000);
}