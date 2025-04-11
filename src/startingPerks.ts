import { asyncAlert } from "./asyncAlert";
import { PerkId, Upgrade } from "./types";
import { t } from "./i18n/i18n";
import { icons, upgrades } from "./loadGameData";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import { isOptionOn } from "./options";
import { notStartingPerk } from "./upgrades";

export function startingPerkMenuButton() {
  return {
    disabled: isOptionOn("easy"),
    icon: icons["icon:starting_perks"],
    text: t("starting_perks.title"),
    help: t("starting_perks.help"),
    async value() {
      await openStartingPerksEditor();
    },
  };
}

export function isBlackListedForStart(u: Upgrade) {
  return !!(
    notStartingPerk.includes(u.id) ||
    u.requires ||
    u.threshold > getTotalScore()
  );
}
export function isStartingPerk(u: Upgrade): boolean {
  return (
    !isBlackListedForStart(u) && getSettingValue("start_with_" + u.id, u.gift)
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
    title: t("starting_perks.title"),
    className: "actionsAsGrid",
    content: [
      checkedList.length
        ? t("starting_perks.checked")
        : t("starting_perks.random"),
      ...checkedList,
      t("starting_perks.unchecked"),
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
