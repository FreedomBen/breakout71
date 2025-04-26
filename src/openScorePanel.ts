import { GameState } from "./types";
import { asyncAlert } from "./asyncAlert";
import { t } from "./i18n/i18n";
import {
  levelsListHTMl,
  max_levels,
  pickedUpgradesHTMl,
} from "./game_utils";
import { getCreativeModeWarning, getHistory } from "./gameOver";
import { pause } from "./game";
import { allLevels, icons } from "./loadGameData";
import { firstWhere } from "./pure_functions";
import { getSettingValue, getTotalScore } from "./settings";
import {getLevelUnlockCondition, reasonLevelIsLocked, upgradeName} from "./get_level_unlock_condition";

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
  if (gameState.creative) return "";
  const unlocked = new Set(getSettingValue("breakout_71_unlocked_levels", []));
  const firstUnlockable = firstWhere(allLevels, (l, li) => {
    if (unlocked.has(l.name)) return;
    const reason = reasonLevelIsLocked(li,  l.name, getHistory(), false);
    if (!reason) return;

    const { minScore, forbidden, required } = getLevelUnlockCondition(li, l.name);
    const missing = required.filter((id) => !gameState?.perks?.[id]);
    // we can't have a forbidden perk
    if (forbidden.find((id) => gameState?.perks?.[id])) {
      return;
    }

    // All required upgrades need to be unlocked
    if (missing.find((u) => u.threshold > getTotalScore())) {
      return;
    }

    return {
      l,
      li,
      minScore,
      forbidden,
      required,
      missing,
      reason,
    };
  });

  if (!firstUnlockable) return "";
  let missingPoints = Math.max(0, firstUnlockable.minScore - gameState.score);
  let missingUpgrades = firstUnlockable.missing.map((id) => upgradeName(id)).join(", ");

  const title =
    (missingUpgrades &&
      t("score_panel.get_upgrades_to_unlock", {
        missingUpgrades,
        points: missingPoints,
        level: firstUnlockable.l.name,
      })) ||
    t("score_panel.score_to_unlock", {
      points: missingPoints,
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
