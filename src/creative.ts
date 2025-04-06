import { GameState, Level, PerkId, Upgrade } from "./types";
import { allLevels, icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import {confirmRestart, creativeModeThreshold, gameState, restart} from "./game";
import {asyncAlert, requiredAsyncAlert} from "./asyncAlert";
import { describeLevel, highScoreText, sumOfValues } from "./game_utils";

export function creativeMode(gameState: GameState) {
  return {
    icon: icons["icon:sandbox"],
    text: t("lab.menu_entry"),
    help:
      // highScoreForMode("creative") ||
      (getTotalScore() < creativeModeThreshold &&
        t("lab.unlocks_at", { score: creativeModeThreshold })) ||
      t("lab.help"),
    disabled: getTotalScore() < creativeModeThreshold,
    async value() {
        openCreativeModePerksPicker()

    },
  };
}

export async function openCreativeModePerksPicker() {


  let creativeModePerks: Partial<{ [id in PerkId]: number }> = getSettingValue(
      "creativeModePerks" ,
      {},
    ),
    choice: Upgrade | Level | "reset" | void;

  let noCreative: PerkId[] = [
    "extra_levels",
    "shunt",
    "one_more_choice",
    "instant_upgrade",
  ];

  while (
    (choice = await asyncAlert<Upgrade | Level | "reset">({
      title: t("lab.menu_entry"),
      className: "actionsAsGrid",
      content: [
        t("lab.instructions"),
        {
          value: "reset",
          text: t("lab.reset"),
          disabled: !sumOfValues(creativeModePerks),
        },
        ...upgrades
          .filter((u) => !noCreative.includes(u.id))
          .map((u) => ({
            icon: u.icon,
            text: u.name,
            help:
              (creativeModePerks[u.id] || 0) +
              "/" +
              u.max,
            value: u,
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
    if (choice === "reset") {
      upgrades.forEach((u) => {
        creativeModePerks[u.id] = 0;
      });
    } else if ("bricks" in choice) {
      setSettingValue("creativeModePerks" , creativeModePerks);
       if (await confirmRestart(gameState)) {
        restart({  perks:creativeModePerks, level:choice.name});
      }
       return
    } else if (choice) {
      creativeModePerks[choice.id] =
        ((creativeModePerks[choice.id] || 0) + 1) %
        (choice.max +1);
    }else{
        return
    }
  }

}
