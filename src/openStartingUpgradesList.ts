import { upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { asyncAlert } from "./asyncAlert";
import { Upgrade } from "./types";
import { getIcon } from "./levelIcon";
import { isStartingPerk } from "./startingPerks";
import { openUpgradeDetails } from "./openUpgradeDetails";

export async function openStartingUpgradesList() {
  const starting = upgrades.filter(isStartingPerk);

  const id = await asyncAlert<Upgrade["id"]>({
    title: t("settings.starting_upgrades"),
    content: [
      t("settings.starting_upgrades_help", { count: starting.length }),
      ...(starting.length
        ? starting.map(({ name, id, help }) => ({
            text: name,
            value: id,
            icon: getIcon("icon:" + id),
            help: help(1),
            className: "upgrade choice used",
          }))
        : [t("settings.starting_upgrades_empty")]),
    ],
    allowClose: true,
  });
  if (id) {
    await openUpgradeDetails(id, openStartingUpgradesList);
  }
}
