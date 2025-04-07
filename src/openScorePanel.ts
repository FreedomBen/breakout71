import { GameState } from "./types";
import { asyncAlert } from "./asyncAlert";
import { t } from "./i18n/i18n";
import {
  getLevelUnlockCondition,
  levelsListHTMl,
  max_levels,
  pickedUpgradesHTMl,
  reasonLevelIsLocked,
} from "./game_utils";
import { getCreativeModeWarning, getHistory } from "./gameOver";
import { pause } from "./game";
import { allLevels, icons } from "./loadGameData";

export async function openScorePanel(gameState: GameState) {
  pause(true);

  await asyncAlert({
    title: t("score_panel.title", {
      score: gameState.score,
      level: gameState.currentLevel + 1,
      max: max_levels(gameState),
    }),

    content: [
      getCreativeModeWarning(gameState),
      pickedUpgradesHTMl(gameState),
      levelsListHTMl(gameState, gameState.currentLevel),
      getNearestUnlockHTML(gameState),
      gameState.rerolls
        ? t("score_panel.rerolls_count", { rerolls: gameState.rerolls })
        : "",
    ],
    allowClose: true,
  });
}

export function getNearestUnlockHTML(gameState: GameState) {
  const unlockable = allLevels
    .map((l, li) => {
      const { minScore, forbidden, required } = getLevelUnlockCondition(li);
      return {
        l,
        li,
        minScore,
        forbidden,
        required,
        missing: required.filter((u) => !gameState?.perks?.[u.id]),
        reason: reasonLevelIsLocked(li, getHistory(), false),
      };
    })
    .filter(
      ({ reason, forbidden, missing }) =>
        // Level needs to be locked
        reason &&
        // we can't have a forbidden perk
        !forbidden.find((u) => gameState?.perks?.[u.id]) &&
        // All required upgrades need to be unlocked
        !missing.find((u) => u.threshold > gameState.totalScoreAtRunStart),
    );

  const firstUnlockable =
    unlockable.find(({ missing }) => !missing.length) || unlockable[0];

  if (!firstUnlockable) return "";
  let missingPoints = firstUnlockable.minScore - gameState.score;
  let missingUpgrades = firstUnlockable.missing.map((u) => u.name).join(", ");

  const title =
    (missingUpgrades &&
      t("score_panel.get_upgrades_to_unlock", {
        missingUpgrades,
        points: missingPoints,
        level: firstUnlockable.l.name,
      })) ||
    (missingPoints > 0 &&
      t("score_panel.score_to_unlock", {
        points: missingPoints,
        level: firstUnlockable.l.name,
      })) ||
    t("score_panel.continue_to_unlock", {
      level: firstUnlockable.l.name,
    });

  return `
<p>${t("score_panel.close_to_unlock")}</p>
    <div class="upgrade used">
          ${icons[firstUnlockable.l.name]}
          <p>
          <strong>${title}</strong>
        ${firstUnlockable.reason?.text}
        </p>  
      </div>
  
  `;
}
