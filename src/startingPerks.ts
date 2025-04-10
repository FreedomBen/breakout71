import { asyncAlert } from "./asyncAlert";
import { PerkId, Upgrade } from "./types";
import { t } from "./i18n/i18n";
import { icons, upgrades } from "./loadGameData";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import { isOptionOn } from "./options";

export function startingPerkMenuButton() {
  return {
    disabled: isOptionOn("easy"),
    icon: icons["icon:starting_perks"],
    text: t("main_menu.starting_perks"),
    help: t("main_menu.starting_perks_help"),
    async value() {
      await openStartingPerksEditor();
    },
  };
}

export function isBlackListedForStart(u: Upgrade) {
  return !!(
    u.requires ||
    ["instant_upgrade"].includes(u.id) ||
    u.threshold > getTotalScore()
  );
}
export function isStartingPerk(u: Upgrade): boolean {
  return (
    !isBlackListedForStart(u) &&
    getSettingValue("start_with_" + u.id, u.giftable)
  );
}

export async function openStartingPerksEditor() {
  const avaliable = upgrades.filter((u) => !isBlackListedForStart(u));
  const buttons = avaliable.map((u) => {
    const checked = isStartingPerk(u);
    return {
      icon: u.icon,
      text: u.name,
      tooltip: u.help(1),
      value: [u],
      checked,
    };
  });
  const checkedList = buttons.filter((b) => b.checked);

  const perks: Upgrade[] | null | void = await asyncAlert({
    title: t("main_menu.starting_perks"),
    className: "actionsAsGrid",
    content: [
      checkedList.length
        ? t("main_menu.starting_perks_checked")
        : t("main_menu.starting_perks_full_random"),
      ...checkedList,
      t("main_menu.starting_perks_unchecked"),
      ...buttons.filter((b) => !b.checked),
    ],
  });
  if (perks) {
    perks?.forEach((perk) => {
      setSettingValue("start_with_" + perk.id, !isStartingPerk(perk));
    });
    openStartingPerksEditor();
  }
}
