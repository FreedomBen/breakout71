import { GameState, Level, PerkId, Upgrade } from "./types";
import { allLevels, icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import { confirmRestart, creativeModeThreshold, restart } from "./game";
import { asyncAlert, requiredAsyncAlert } from "./asyncAlert";
import { describeLevel, highScoreForMode } from "./game_utils";

export function creativeMode(gameState: GameState) {
  return {
    icon: icons["icon:sandbox"],
    text: t("lab.menu_entry"),
    help:
      highScoreForMode("creative") ||
      (getTotalScore() < creativeModeThreshold &&
        t("lab.unlocks_at", { score: creativeModeThreshold })) ||
      t("lab.help"),
    disabled: getTotalScore() < creativeModeThreshold,
    async value() {
      if (await confirmRestart(gameState)) {
        restart({ mode: "creative" });
      }
    },
  };
}

export async function openCreativeModePerksPicker(
  gameState,
  currentLevel: number,
) {
  gameState.readyToRender = false;

  let creativeModePerks: Partial<{ [id in PerkId]: number }> = getSettingValue(
      "creativeModePerks_" + currentLevel,
      {},
    ),
    choice: Upgrade | Level | void;

  upgrades.forEach((u) => {
    creativeModePerks[u.id] = Math.min(
      creativeModePerks[u.id] || 0,
      u.max - gameState.bannedPerks[u.id],
    );
  });

  let noCreative: PerkId[] = [
    "extra_levels",
    "shunt",
    "one_more_choice",
    "instant_upgrade",
  ];

  while (
    (choice = await requiredAsyncAlert<Upgrade | Level>({
      title: t("lab.title", { lvl: currentLevel + 1 }),
      actionsAsGrid: true,
      content: [
        t("lab.instructions"),
        ...upgrades
          .filter((u) => !noCreative.includes(u.id))
          .map((u) => ({
            icon: u.icon,
            text: u.name,
            help:
              (creativeModePerks[u.id] || 0) +
              "/" +
              (u.max - gameState.bannedPerks[u.id]),
            value: u,
            disabled: u.max - gameState.bannedPerks[u.id] <= 0,
            className: creativeModePerks[u.id]
              ? "sandbox"
              : "sandbox grey-out-unless-hovered",
            tooltip: u.help(creativeModePerks[u.id] || 1),
          })),
        t("lab.select_level"),
        ...allLevels.map((l) => ({
          icon: icons[l.name],
          text: l.name,
          value: l,
          tooltip: describeLevel(l),
        })),
      ],
    }))
  ) {
    if ("bricks" in choice) {
      setSettingValue("creativeModePerks_" + currentLevel, creativeModePerks);
      upgrades.forEach((u) => {
        gameState.perks[u.id] = creativeModePerks[u.id];
        gameState.bannedPerks[u.id] += creativeModePerks[u.id];
      });
      gameState.runLevels[currentLevel] = choice;
      break;
    } else if (choice) {
      creativeModePerks[choice.id] =
        ((creativeModePerks[choice.id] || 0) + 1) %
        (choice.max - gameState.bannedPerks[choice.id] + 1);
    }
  }
}
