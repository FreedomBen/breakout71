import { GameState, PerkId } from "./types";
import {
  catchRateBest,
  catchRateGood,
  choicePerGold,
  choicePerSilver,
  levelTimeBest,
  levelTimeGood,
  missesBest,
  missesGood,
  upPerGold,
  upPerSilver,
} from "./pure_functions";
import { t } from "./i18n/i18n";
import { icons } from "./loadGameData";
import { requiredAsyncAlert } from "./asyncAlert";
import {
  escapeAttribute,
  getPossibleUpgrades,
  levelsListHTMl,
  max_levels,
  pickedUpgradesHTMl,
  upgradeLevelAndMaxDisplay,
} from "./game_utils";
import { getFirstUnlockable, getNearestUnlockHTML } from "./openScorePanel";
import { isOptionOn } from "./options";

export async function openUpgradesPicker(gameState: GameState) {
  const catchRate =
    gameState.levelCoughtCoins / (gameState.levelSpawnedCoins || 1);

  let medals = [];
  let upgradePoints = 1;
  let extraChoices = 0;

  let hasMedals = 0;

  function challengeResult(
    name: String,
    description: String,
    medal: "gold" | "silver" | "no",
  ) {
    let choices = 0,
      up = 0;
    if (medal === "gold") {
      choices += choicePerGold;
      up += upPerGold;
    } else if (medal === "silver") {
      choices += choicePerSilver;
      up += upPerSilver;
    }
    if (medal !== "no") {
      hasMedals++;
    }

    extraChoices += choices;
    upgradePoints += up;
    medals.push(`<div  class="upgrade" data-tooltip="${escapeAttribute(description)}">
                        ${icons["icon:" + medal + "_medal"]}
                        <p>
                        <strong>${name}</strong><br/>
                        ${
                          up || choices
                            ? t("level_up.challenges.gain", { up, choices })
                            : t("level_up.challenges.no_gain")
                        }
                      
                        </p> 
                    </div>`);
  }

  challengeResult(
    t("level_up.challenges.levelTime.name", {
      value: Math.ceil(gameState.levelTime / 1000),
    }),
    t("level_up.challenges.levelTime.description", {
      silver: levelTimeGood,
      gold: levelTimeBest,
    }),
    (gameState.levelTime < levelTimeBest * 1000 && "gold") ||
      (gameState.levelTime < levelTimeGood * 1000 && "silver") ||
      "no",
  );

  challengeResult(
    t("level_up.challenges.catchRateGood.name", {
      value: Math.floor(catchRate * 100),
      caught: gameState.levelCoughtCoins,
      total: gameState.levelSpawnedCoins,
    }),
    t("level_up.challenges.catchRateGood.description", {
      silver: catchRateGood,
      gold: catchRateBest,
    }),
    (catchRate > catchRateBest / 100 && "gold") ||
      (catchRate > catchRateGood / 100 && "silver") ||
      "no",
  );

  challengeResult(
    gameState.levelMisses
      ? t("level_up.challenges.levelMisses.name", {
          value: gameState.levelMisses,
        })
      : t("level_up.challenges.levelMisses.none"),
    t("level_up.challenges.levelMisses.description", {
      silver: missesGood,
      gold: missesBest,
    }),
    (gameState.levelMisses < missesBest && "gold") ||
      (gameState.levelMisses < missesGood && "silver") ||
      "no",
  );

  if (hasMedals == 0) {
    medals.length = 0;
  } else if (hasMedals == 1) {
    medals.unshift(t("level_up.challenges.earned_medal", { count: hasMedals }));
  } else {
    medals.unshift(
      t("level_up.challenges.earned_medal_plural", { count: hasMedals }),
    );
  }

  let sorted = getPossibleUpgrades(gameState)
    .map((u) => ({
      ...u,
      score: Math.random() + (gameState.lastOffered[u.id] || 0),
    }))
    .sort((a, b) => a.score - b.score)
    .filter((u) => gameState.perks[u.id] < u.max + gameState.perks.limitless);

  while (true) {
    // refresh the list if you pick extra one_more_choice
    const offered = sorted.slice(
      0,
      3 + extraChoices + gameState.perks.one_more_choice,
    );
    offered.forEach((u) => {
      dontOfferTooSoon(gameState, u.id);
    });

    const unlockable = getFirstUnlockable(gameState);
    let unlockRelatedUpgradesOffered = 0;
    let unlockHint = "";

    const upgradesActions = offered.map((u) => {
      let className = "";
      if (isOptionOn("level_unlocks_hints")) {
        if (unlockable?.forbidden?.includes(u.id) && !gameState.perks[u.id]) {
          unlockRelatedUpgradesOffered++;
          className += " forbidden";
          unlockHint = t("level_up.forbidden", {
            levelName: unlockable?.l.name || "",
          });
        }
        if (unlockable?.required?.includes(u.id)) {
          unlockRelatedUpgradesOffered++;
          className += " required";
          unlockHint = t("level_up.required", {
            levelName: unlockable?.l.name || "",
          });
        }
      }
      return {
        value: u.id,
        disabled: gameState.perks[u.id] >= u.max + gameState.perks.limitless,
        text:
          u.name +
          (gameState.perks[u.id]
            ? upgradeLevelAndMaxDisplay(u, gameState)
            : ""),
        icon: icons["icon:" + u.id],
        help: unlockHint || u.help(gameState.perks[u.id] || 1),
        tooltip: u.fullHelp(gameState.perks[u.id] || 1),
        className,
        actionLabel: gameState.perks[u.id] ? "upgrade" : "pick",
      };
    });

    const upgradeId = await requiredAsyncAlert<PerkId>({
      title: t("level_up.title", {
        level: gameState.currentLevel,
        max: max_levels(gameState),
      }),
      content: [
        t("level_up.upgrade_perks", {
          coins: gameState.levelCoughtCoins,
          count: upgradePoints,
        }),
        ...upgradesActions,
        levelsListHTMl(gameState, gameState.currentLevel),
        unlockRelatedUpgradesOffered ? getNearestUnlockHTML(gameState) : "",

        ...medals,
        pickedUpgradesHTMl(gameState),
        `<div id="level-recording-container"></div>`,
      ],
    });
    upgradePoints--;
    gameState.perks[upgradeId]++;
    gameState.runStatistics.upgrades_picked++;
    if (!upgradePoints) {
      return;
    }
  }
}

export function dontOfferTooSoon(gameState: GameState, id: PerkId) {
  gameState.lastOffered[id] = Math.round(Date.now() / 1000);
}
