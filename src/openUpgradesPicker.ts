import { GameState, PerkId } from "./types";
import {
  catchRateBest,
  catchRateGood,
  levelTimeBest,
  levelTimeGood,
  missesBest,
  missesGood,
  wallBouncedBest,
  wallBouncedGood,
} from "./pure_functions";
import { t } from "./i18n/i18n";
import { icons, upgrades } from "./loadGameData";
import { asyncAlert, requiredAsyncAlert } from "./asyncAlert";
import {
  escapeAttribute,
  getPossibleUpgrades,
  levelsListHTMl,
  max_levels,
  upgradeLevelAndMaxDisplay,
} from "./game_utils";
import { getNearestUnlockHTML } from "./openScorePanel";

export async function openUpgradesPicker(gameState: GameState) {
  const catchRate =
    gameState.levelCoughtCoins / (gameState.levelSpawnedCoins || 1);

  let choices = 3;
  let upgradesWon = 1;
  let medals = [];
  function challengeResult(
    name: String,
    description: String,
    medal: "gold" | "silver" | "no",
  ) {
    if (medal === "gold") {
      choices++;
      upgradesWon++;
    }
    if (medal === "silver") {
      upgradesWon++;
    }
    medals.push(`<div  class="upgrade" data-tooltip="${escapeAttribute(description)}">
                        ${icons["icon:" + medal + "_medal"]}
                        <p>
                        <strong>${name}</strong><br/>
                        ${{ gold: t("level_up.gold"), silver: t("level_up.silver"), no: t("level_up.no") }[medal]}
                        </p> 
                    </div>`);
  }

  challengeResult(
    t("level_up.challenges.levelWallBounces.name", {
      value: gameState.levelWallBounces,
    }),
    t("level_up.challenges.levelWallBounces.description", {
      silver: wallBouncedGood,
      gold: wallBouncedBest,
    }),
    (gameState.levelWallBounces < wallBouncedBest && "gold") ||
      (gameState.levelWallBounces < wallBouncedGood && "silver") ||
      "no",
  );

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
    }),
    t("level_up.challenges.catchRateGood.description", {
      silver: catchRateGood,
      gold: catchRateBest,
      caught: gameState.levelCoughtCoins,
      total: gameState.levelSpawnedCoins,
    }),
    (catchRate > catchRateBest / 100 && "gold") ||
      (catchRate > catchRateGood / 100 && "silver") ||
      "no",
  );

  challengeResult(
    t("level_up.challenges.levelMisses.name", { value: gameState.levelMisses }),
    t("level_up.challenges.levelMisses.description", {
      silver: missesGood,
      gold: missesBest,
    }),
    (gameState.levelMisses < missesBest && "gold") ||
      (gameState.levelMisses < missesGood && "silver") ||
      "no",
  );

  gameState.upgrade_points += upgradesWon;

  let offered: PerkId[] = getPossibleUpgrades(gameState)
    .map((u) => ({
      ...u,
      score: Math.random() + (gameState.lastOffered[u.id] || 0),
    }))
    .sort((a, b) => a.score - b.score)
    .filter((u) => gameState.perks[u.id] < u.max + gameState.perks.limitless)
    .map((u) => u.id);

  const fromStart = upgrades
    .map((u) => u.id)
    .filter((id) => gameState.perks[id]);

  while (true) {
    const updatedChoices = gameState.perks.one_more_choice + choices;
    let list = upgrades.filter(
      (u) =>
        offered.slice(0, updatedChoices).includes(u.id) ||
        gameState.perks[u.id],
    );

    list = list
      .filter((u) => fromStart.includes(u.id))
      .concat(list.filter((u) => !fromStart.includes(u.id)));

    list.forEach((u) => {
      dontOfferTooSoon(gameState, u.id);
    });

    const actions = list.map((u) => {
      const max = u.max + gameState.perks.limitless;
      const lvl = gameState.perks[u.id];

      const button =
        !gameState.upgrade_points || gameState.perks[u.id] >= max
          ? ""
          : ` <button data-resolve-to="${u.id}">${
              lvl ? t("level_up.upgrade") : t("level_up.pick")
            }</button>`;

      const lvlInfo = lvl ? upgradeLevelAndMaxDisplay(u, gameState) : "";
      const help = u.help(Math.max(1, lvl));

      return {
        u,
        button,
        html: `<div  class="upgrade choice ${
          (!lvl && gameState.upgrade_points && " ") ||
          (lvl && "used") ||
          "greyed-out"
        }" >
                        ${icons["icon:" + u.id]}
                        <p data-tooltip="${escapeAttribute(lvl ? help : u.fullHelp(Math.max(1, lvl)))}">
                        <strong>${u.name}</strong> ${lvlInfo}
                        ${lvl ? "" : help}
                        </p>
                       ${button}
                    </div>`,
      };
    });

    const forcePick =
      gameState.upgrade_points > 0 && !!actions.find((a) => a.button !== "");

    const upgradeId = await requiredAsyncAlert<PerkId | null>({
      title: t("level_up.title", {
        level: gameState.currentLevel,
        max: max_levels(gameState),
      }),
      content: [
        {
          disabled: forcePick,
          text: t("level_up.go", { name: gameState.level.name }),
          help: forcePick
            ? t("level_up.go_with_upgrades", {
                count: gameState.upgrade_points,
              })
            : "",
          icon: icons[gameState.level.name],
          value: null,
        },

        t("level_up.upgrade_perks"),

        ...actions.filter((a) => gameState.perks[a.u.id]).map((a) => a.html),

        t("level_up.add_perks"),
        ...actions.filter((a) => !gameState.perks[a.u.id]).map((a) => a.html),

        t("level_up.challenges.intro"),
        ...medals,
        getNearestUnlockHTML(gameState),
        levelsListHTMl(gameState, gameState.currentLevel),
        `<div id="level-recording-container"></div>`,
      ],
    });

    if (upgradeId) {
      gameState.perks[upgradeId]++;
      gameState.runStatistics.upgrades_picked++;
      gameState.upgrade_points--;
    } else {
      return;
    }
  }
}

export function dontOfferTooSoon(gameState: GameState, id: PerkId) {
  gameState.lastOffered[id] = Math.round(Date.now() / 1000);
}
