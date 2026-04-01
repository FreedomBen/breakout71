import { RunParams, Upgrade } from "./types";
import { allLevelsAndIcons, upgrades } from "./loadGameData";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import { asyncAlert } from "./asyncAlert";
import { miniMarkDown } from "./pure_functions";
import { t } from "./i18n/i18n";
import { confirmRestart, gameState, restart } from "./game";
import { getCheckboxIcon, getIcon } from "./levelIcon";

export async function openUpgradeDetails(
  id: Upgrade["id"],
  onClose: () => void,
) {
  const { name, help, fullHelp, gift } = upgrades.find(
    (u) => u.id === id,
  ) as Upgrade;

  const allowedAsStart = getSettingValue("start_with_" + id, gift);
  const allowedInGame = getSettingValue("offer-upgrade-" + id, true);

  const allowDisabling =
    !allowedInGame ||
    upgrades
      .filter((u) => getTotalScore() >= u.threshold)
      .filter((u) => getSettingValue("offer-upgrade-" + u.id, true))?.length >
      15;

  const action = await asyncAlert<string>({
    title: name,
    content: [
      `<div class="full-width-icon">${getIcon("icon:" + id, 350)}</div>`,

      help(1),
      miniMarkDown(fullHelp(1)),
      {
        text: t("unlocks.start_new_game_with"),
        help: t("unlocks.start_new_game_with_help"),
        value: "use",
        icon: getIcon("icon:new_run"),
      },
      {
        icon: getCheckboxIcon(allowedAsStart),
        value: "toggle-start-with",
        text: t("unlocks.starting_perk"),
        help: t("unlocks.starting_perk_help"),
      },
      {
        icon: getCheckboxIcon(allowedInGame),
        value: "toggle-offer-upgrade",
        text: t("unlocks.upgrade_choice_perk"),
        help: allowDisabling
          ? t("unlocks.upgrade_choice_perk_help")
          : t("unlocks.upgrade_choice_perk_locked"),
        disabled: !allowDisabling,
      },
    ],
    allowClose: true,
  });
  if (!action) return onClose();

  switch (action) {
    case "use":
      if (await confirmRestart(gameState)) {
        restart({
          perks: { [id]: 1 },
          level: allLevelsAndIcons.find((l) => l.name === "icon:" + id),
        } as RunParams);
        return;
      }
      break;
    case "toggle-start-with":
      setSettingValue("start_with_" + id, !allowedAsStart);
      break;
    case "toggle-offer-upgrade":
      setSettingValue("offer-upgrade-" + id, !allowedInGame);
      break;
  }
  return openUpgradeDetails(id, onClose);
}
