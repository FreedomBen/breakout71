import { GameState, Level, PerkId } from "./types";
import { pickedUpgradesHTMl, sample, sumOfValues } from "./game_utils";
import { allLevels, icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { requiredAsyncAlert } from "./asyncAlert";
import { debuffs } from "./debuffs";

type AdventureModeButton = {
  text: string;
  icon: string;
  help?: string;
  value: AdventureModeSelection;
};
type AdventureModeSelection = {
  cost: number;
  level?: Level;
  perk?: PerkId;
  discard?: PerkId;
};
const MAX_LVL = 3;
export async function openAdventureRunUpgradesPicker(gameState: GameState) {
  // Just add random debuff for now
  const debuffToApply = sample(
    debuffs.filter((d) => gameState.debuffs[d.id] < d.max),
  );
  if (debuffToApply) {
    gameState.debuffs[debuffToApply.id]++;
  }

  let levelChoiceCount = 1;

  const catchRate =
    (gameState.score - gameState.levelStartScore) /
    (gameState.levelSpawnedCoins || 1);

  if (gameState.levelWallBounces == 0) {
    levelChoiceCount++;
  }
  if (gameState.levelTime < 30 * 1000) {
    levelChoiceCount++;
  }
  if (catchRate === 1) {
    levelChoiceCount++;
  }
  if (gameState.levelMisses === 0) {
    levelChoiceCount++;
  }

  let perkChoices = 2 + gameState.perks.one_more_choice + levelChoiceCount;

  const priceMultiplier =
    1 +
    Math.ceil(
      gameState.currentLevel * Math.pow(1.05, gameState.currentLevel) * 10,
    );

  const levelChoices: AdventureModeButton[] = [...allLevels]
    .sort(() => Math.random() - 0.5)
    .slice(0, MAX_LVL)
    .sort((a, b) => a.bricksCount - b.bricksCount)
    .slice(0, Math.min(MAX_LVL, levelChoiceCount))
    .map((level, levelIndex) => ({
      text: t("premium.pick_level", {
        name: level.name,
        cost: priceMultiplier * levelIndex,
      }),
      icon: icons[level.name],
      help:
        level.size +
        "x" +
        level.size +
        " with " +
        level.bricksCount +
        " bricks",
      value: {
        level,
        cost: priceMultiplier * levelIndex,
      },
    }));

  const perksChoices = upgrades
    .filter((u) => u.adventure)
    .filter((u) => !u?.requires || gameState.perks[u?.requires])
    .filter((u) => gameState.perks[u.id] < u.max)
    .sort(() => Math.random() - 0.5)
    .slice(0, perkChoices);

  const discardChoices: AdventureModeButton[] =
    sumOfValues(gameState.perks) > 5
      ? upgrades
          .filter((u) => u.adventure)
          .filter((u) => gameState.perks[u.id])
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((u, ui) => {
            return {
              icon: `<span class="red-icon">${u.icon}</span>`,
              text: t("premium.discard", { name: u.name }),
              help: t("premium.discard_help"),
              value: { discard: u.id, cost: 0 },
            };
          })
      : [];

  let used = new Set();
  let choice: AdventureModeSelection | null = null;
  while (
    (choice = await requiredAsyncAlert({
      title: t("premium.next_step_title"),
      content: [
        `
    <p>${t("premium.choose_next_step", { score: gameState.score })}</p>
    ${pickedUpgradesHTMl(gameState)} 
            `,
        ...perksChoices.map((u, ui) => {
          const lvl = gameState.perks[u.id];
          const cost =
            (priceMultiplier + sumOfValues(gameState.perks) + lvl) * (ui + 1);
          return {
            icon: u.icon,
            text:
              lvl == 0
                ? t("premium.pick_perk", { name: u.name, cost })
                : t("premium.upgrade_perk_to_level", {
                    name: u.name,
                    cost,
                    lvl: lvl + 1,
                  }),
            help: u.help(lvl + 1),
            value: { perk: u.id, cost },
            disabled: gameState.score < cost || used.has(u.id),
          };
        }),
        discardChoices.length ? "You can discard some perks" : "",
        ...discardChoices,
        `Click a level below to continue`,
        ...levelChoices.map((p) => ({
          ...p,
          disabled: gameState.score < p.value.cost,
        })),
      ],
    }))
  ) {
    gameState.score -= choice.cost;
    if (choice.perk) {
      used.add(choice.perk);
      gameState.perks[choice.perk]++;
    }
    if (choice.discard) {
      used.add(choice.discard);
      gameState.perks[choice.discard] = 0;
    }
    if (choice.level) {
      gameState.runLevels[gameState.currentLevel + 1] = choice.level;

      return;
    }
  }
}
