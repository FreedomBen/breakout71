import { getTotalScore } from "./settings";
import { icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { asyncAlert } from "./asyncAlert";
import { Upgrade } from "./types";
import { miniMarkDown } from "./pure_functions";
import { categories } from "./upgrades";
import { openUpgradeDetails } from "./openUpgradeDetails";

export async function openUnlockedUpgradesList() {
  const ts = getTotalScore();
  const upgradeActions = upgrades
    .map(({ name, id, threshold, help, category, fullHelp }) => ({
      text: name,
      disabled: ts < threshold,
      value: id,
      icon: icons["icon:" + id],
      category,
      help:
        ts < threshold
          ? t("unlocks.minTotalScore", { score: threshold })
          : help(1),
      // tooltip: ts < threshold ? "" : fullHelp(1) + " [id:" + id + "]",
      threshold,
      className: "upgrade choice " + (ts > threshold ? "used" : ""),
      // actionLabel: t("unlocks.use"),
    }))
    .sort((a, b) => a.threshold - b.threshold);

  const id = await asyncAlert<Upgrade["id"]>({
    title: t("unlocks.title_upgrades", {
      unlocked: upgradeActions.filter((a) => !a.disabled).length,
      out_of: upgradeActions.length,
    }),
    content: [
      t("unlocks.intro", { ts }),
      upgradeActions.find((u) => u.disabled)
        ? t("unlocks.greyed_out_help")
        : "",
      miniMarkDown(t("unlocks.category.beginner")),
      ...upgradeActions.filter((u) => u.category == categories.beginner),
      miniMarkDown(t("unlocks.category.combo")),
      ...upgradeActions.filter((u) => u.category == categories.combo),
      miniMarkDown(t("unlocks.category.combo_boost")),
      ...upgradeActions.filter((u) => u.category == categories.combo_boost),
      miniMarkDown(t("unlocks.category.simple")),
      ...upgradeActions.filter((u) => u.category == categories.simple),
      miniMarkDown(t("unlocks.category.advanced")),
      ...upgradeActions.filter((u) => u.category == categories.advanced),
    ],
    allowClose: true,
  });
  if (id) {
    await openUpgradeDetails(id, openUnlockedUpgradesList);
  }
}
