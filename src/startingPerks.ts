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
export function isStartingPerk(u: Upgrade): boolean {

  return getSettingValue("start_with_" + u.id, u.giftable);
}

export async function openStartingPerksEditor() {
  const ts = getTotalScore();
  const avaliable = upgrades.filter(
    (u) =>
      !u.requires && !["instant_upgrade"].includes(u.id) && u.threshold <= ts,
  );
  const starting = avaliable.filter((u) => isStartingPerk(u));
  const buttons = avaliable.map((u) => {
    const checked = isStartingPerk(u);
    return {
      icon: u.icon,
      text: u.name,
      tooltip: u.help(1),
      value: u,
      disabled: checked && starting.length < 2,
      checked,
    };
  });

  const perk: Upgrade | null | void = await asyncAlert({
    title: t("main_menu.starting_perks"),
    className: "actionsAsGrid",
    content: [
      t("main_menu.starting_perks_checked"),
      ...buttons.filter((b) => b.checked),
      t("main_menu.starting_perks_unchecked"),
      ...buttons.filter((b) => !b.checked),
    ],
  });
  if (perk) {
    setSettingValue("start_with_" + perk.id, !isStartingPerk(perk));
    openStartingPerksEditor();
  }
}
