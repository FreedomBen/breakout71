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
    getPossibleUpgrades,
    levelsListHTMl,
    max_levels,
    pickedUpgradesHTMl,
    upgradeLevelAndMaxDisplay
} from "./game_utils";
import {getNearestUnlockHTML} from "./openScorePanel";

export async function openUpgradesPicker(gameState: GameState) {
    const catchRate =
        gameState.levelCoughtCoins / (gameState.levelSpawnedCoins || 1);

    gameState.extra_lives++
    let choices =  3 + gameState.perks.one_more_choice

    if (gameState.levelWallBounces < wallBouncedGood) {
        choices++;
        gameState.extra_lives++;
        if (gameState.levelWallBounces < wallBouncedBest) {
            choices++;
        }
    }

    if (gameState.levelTime < levelTimeGood * 1000) {
        choices++;
        gameState.extra_lives++;
        if (gameState.levelTime < levelTimeBest * 1000) {
            choices++;
        }
    }
    if (catchRate > catchRateGood / 100) {
        choices++;
        gameState.extra_lives++;
        if (catchRate > catchRateBest / 100) {
            choices++;
        }
    }
    if (gameState.levelMisses < missesGood) {
        choices++;
        gameState.extra_lives++;
        if (gameState.levelMisses < missesBest) {
            choices++;
        }
    }

    let offered:PerkId[]= getPossibleUpgrades(gameState)
        .map((u) => ({
            ...u,
            score: Math.random() + (gameState.lastOffered[u.id] || 0),
        }))
        .sort((a, b) => a.score - b.score)
        .filter((u) => gameState.perks[u.id] < u.max + gameState.perks.limitless)
        .slice(0, choices)
        .map(u=>u.id)


    offered.forEach((id) => {
        dontOfferTooSoon(gameState, id);
    });

    let list = upgrades.filter(u=>offered.includes(u.id)||gameState.perks[u.id])

    while (true) {
        let actions: Array<{
            text: string;
            icon: string;
            value: PerkId | null;
            help: string;
            className: string;
            tooltip: string;
        }> =  list.map((u) => {

            const disabled= !gameState.extra_lives || gameState.perks[u.id] >= u.max + gameState.perks.limitless
            const lvl=  gameState.perks[u.id]
             
            return ({
                text: u.name + (lvl ?  upgradeLevelAndMaxDisplay(u, gameState):''),
                help: u.help(Math.max(1, lvl)),
                tooltip: u.fullHelp(Math.max(1, lvl)),
                icon: icons["icon:" + u.id],
                value: u.id as PerkId,
                className: "upgrade " + (disabled && lvl ? 'no-border ':' ') + ( lvl ? '':'grey-out-unless-hovered ') ,
                disabled:disabled ,
            })
        })
         actions = [
            ...actions.filter(a=>gameState.perks[a.value]),
            ...actions.filter(a=>!gameState.perks[a.value]),
        ]

        const upgradeId = await asyncAlert<PerkId | null>({
            title:
               t("level_up.title", {
                    level: gameState.currentLevel ,
                    max: max_levels(gameState),
                }),
            content: [
                {
                      text: t('level_up.go',{name:gameState.level.name}),
                        icon: icons[gameState.level.name],
                        value:null,
                },
                // pickedUpgradesHTMl(gameState),

               gameState.extra_lives ? `<p>${t("level_up.instructions", { 
                    count:gameState.extra_lives
                })}</p>` :`<p>${t("level_up.no_points")}</p>` ,
                ...actions,
                levelsListHTMl(gameState, gameState.currentLevel ),
                getNearestUnlockHTML(gameState),
                `<div id="level-recording-container"></div>`,
            ],
        });

        if (upgradeId ) {
            gameState.perks[upgradeId]++;
            gameState.runStatistics.upgrades_picked++;
            gameState.extra_lives--
        }else{
            return
        }
    }
}

export function dontOfferTooSoon(gameState: GameState, id: PerkId) {
    gameState.lastOffered[id] = Math.round(Date.now() / 1000);
}