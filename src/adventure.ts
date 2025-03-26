import {GameState, PerksMap} from "./types";
import {sample, sumOfValues} from "./game_utils";
import {allLevels, icons, upgrades} from "./loadGameData";
import {t} from "./i18n/i18n";
import {hashCode} from "./getLevelBackground";
import {requiredAsyncAlert} from "./asyncAlert";

const MAX_DIFFICULTY = 3+4
export async function openAdventureRunUpgradesPicker(gameState: GameState) {
    let maxDifficulty = 3;

    const catchRate =
        (gameState.score - gameState.levelStartScore) /
        (gameState.levelSpawnedCoins || 1);

    if (gameState.levelWallBounces == 0) {
        maxDifficulty++;
    }
    if (gameState.levelTime < 30 * 1000) {
        maxDifficulty++;
    }
    if (catchRate === 1) {
        maxDifficulty++;
    }
    if (gameState.levelMisses === 0) {
        maxDifficulty++;
    }

    let actions = range(0, maxDifficulty).map(difficulty => getPerksForPath(gameState.score, gameState.currentLevel, gameState.seed, gameState.adventurePath, gameState.perks, difficulty))

    return requiredAsyncAlert({
        title: 'Choose your next step',
        text: 'Click one of the options below to continue',
        actions,
    })
}


function getPerksForPath(score: number, currentLevel: number, seed: string, path: string, basePerks: PerksMap, difficulty: number) {
    const hashSeed = seed + path
    let cost = (1 + difficulty) * Math.pow(1.5, currentLevel) * 10
    if (!difficulty && cost > score) {
        cost = score
    }

    const levels = allLevels
        .sort((a, b) => hashCode(hashSeed + a.name) - hashCode(hashSeed + b.name))
        .slice(0, MAX_DIFFICULTY)
        .sort((a,b)=>a.size-b.size)

    let level = levels[difficulty]
    let text = level.name + ' $' + cost, help = []

    let perks = {}
    // TODO exclude irrelevant perks


    upgrades
        .filter((u) => !u?.requires || basePerks[u?.requires])
        .filter(u => basePerks[u.id] < u.max)
        .sort((a, b) => hashCode(hashSeed + difficulty+a.id) - hashCode(hashSeed + difficulty+b.id))
        .slice(0, difficulty+1)
        .forEach(u => {
            perks[u.id] = basePerks[u.id] + 1
            help.push(u.name +
                (basePerks[u.id]
                    ? t("level_up.upgrade_perk_to_level", {
                        level: basePerks[u.id] + 1,
                    })
                    : ""))
        })

    let totalPerksValue = sumOfValues({...basePerks, ...perks})
    let targetPerks = 10 + difficulty * 3
    let toRemove = Math.max(0, totalPerksValue - targetPerks)
    while (toRemove) {
        const possibleDowngrades = Object.keys(basePerks).filter(
            k => !perks[k] && basePerks[k] > 0
        )
        if (!possibleDowngrades.length) {
            break
        }
        const downGraded = sample(possibleDowngrades)

        perks[downGraded] = basePerks[downGraded] - 1
        if (!perks[downGraded]) {
            help.push(t('level_up.perk_loss') + upgrades.find(u => u.id == downGraded)?.help(1))
        } else {
            help.push(t('level_up.downgrade') + upgrades.find(u => u.id == downGraded)?.help(perks[downGraded]))
        }
        toRemove--
    }
    return {
        value: {
            cost,
            level,
            perks,
            difficulty
        },
        icon: icons[level.name],
        disabled: cost > score,
        text, help: help.join('/') || 'No change to perks',
    }
}

function range(start: number, end: number): number[] {
    const result = []
    for (let i = start; i < end; i++) result.push(i)
    return result
}