import { GameState, Level, PerkId, RawLevel, Upgrade } from "./types";
import { allLevels, icons, transformRawLevel, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import {
  confirmRestart,
  creativeModeThreshold,
  gameState,
  restart,
} from "./game";
import { asyncAlert, requiredAsyncAlert } from "./asyncAlert";
import {
  describeLevel,
  highScoreText,
  reasonLevelIsLocked,
  sumOfValues,
} from "./game_utils";
import { getHistory } from "./gameOver";
import { noCreative } from "./upgrades";
import { levelIconHTML } from "./levelIcon";

export function creativeMode(gameState: GameState) {
  return {
    icon: icons["icon:creative"],
    text: t("lab.menu_entry"),
    help:
      (getTotalScore() < creativeModeThreshold &&
        t("lab.unlocks_at", { score: creativeModeThreshold })) ||
      t("lab.help"),
    disabled: getTotalScore() < creativeModeThreshold,
    async value() {
      openCreativeModePerksPicker();
    },
  };
}

export async function openCreativeModePerksPicker() {
  let creativeModePerks: Partial<{ [id in PerkId]: number }> = getSettingValue(
      "creativeModePerks",
      {},
    );
  const customLevels = (getSettingValue("custom_levels", []) as RawLevel[]).map(
    transformRawLevel,
  );

  while (true  ) {

    const levelOptions= [
         ...allLevels.map((l, li) => {
            const problem =
              reasonLevelIsLocked(li, getHistory(), true)?.text || "";
            return {
              icon: icons[l.name],
              text: l.name,
              value: l,
              disabled: !!problem,
              tooltip: problem || describeLevel(l),
              className:''
            };
          }),
          ...customLevels.map((l) => ({
            icon: levelIconHTML(l.bricks, l.size, l.color),
            text: l.name,
            value: l,
            disabled: !l.bricks.filter((b) => b !== "_").length,
            tooltip: describeLevel(l),
              className:''
          }))
    ]

    const selectedLeveOption= levelOptions.find(l=>l.text===getSettingValue("creativeModeLevel", '')) || levelOptions[0]
    selectedLeveOption.className= 'highlight'


    const choice=await asyncAlert<Upgrade | Level | "reset" | "play">({
      title: t("lab.menu_entry"),
      className: "actionsAsGrid",
      content: [
        {
            icon: icons['icon:reset'],
          value: "reset",
          text: t("lab.reset"),
          disabled: !sumOfValues(creativeModePerks),
        },
          {
            icon: icons['icon:new_run'],
          value: "play",
          text: t("lab.play"),
          disabled: !sumOfValues(creativeModePerks),
        },

        t("lab.instructions"),
        ...upgrades
          .filter((u) => !noCreative.includes(u.id))
          .map((u) => ({
            icon: u.icon,
            text: u.name,
            help:
              (creativeModePerks[u.id] || 0) +
              "/" +
              (u.max + (creativeModePerks.limitless || 0)),
            value: u,
            className: creativeModePerks[u.id]
              ? "sandbox highlight"
              : "sandbox not-highlighed",
            tooltip: u.help(creativeModePerks[u.id] || 1),
          })),
        t("lab.select_level"),
          ...levelOptions
      ],
    })
    if(!choice)return
    if (choice === "reset") {
      upgrades.forEach((u) => {
        creativeModePerks[u.id] = 0;
      });
      setSettingValue("creativeModePerks", creativeModePerks);
      setSettingValue("creativeModeLevel", '')
    }  else if (choice === "play" || ("bricks" in choice && choice.name==getSettingValue("creativeModeLevel", ''))) {
      if (await confirmRestart(gameState)) {
        restart({
          perks: creativeModePerks,
          level: selectedLeveOption.value,
          isCreativeRun: true,
        });
        return
      }
    } else if ("bricks" in choice) {
      setSettingValue("creativeModeLevel", choice.name);
    } else if (choice) {
      creativeModePerks[choice.id] =
        ((creativeModePerks[choice.id] || 0) + 1) %
        (choice.max + 1 + (creativeModePerks.limitless || 0));

      setSettingValue("creativeModePerks", creativeModePerks);
    }
  }
}
