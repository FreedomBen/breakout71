import { allLevels, icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { asyncAlert } from "./asyncAlert";
import { miniMarkDown } from "./pure_functions";
import {
  catchRateBest,
  catchRateGood,
  levelTimeBest,
  levelTimeGood,
  missesBest,
  missesGood,
  wallBouncedBest,
  wallBouncedGood,
} from "./pure_functions";

export function helpMenuEntry() {
  return {
    icon: icons["icon:help"],
    text: t("main_menu.help_title"),
    help: t("main_menu.help_help"),
    async value() {
      await asyncAlert({
        title: t("main_menu.help_title"),
        allowClose: true,
        content: [
          miniMarkDown(
            t("main_menu.help_content", {
              catchRateBest,
              catchRateGood,
              levelTimeBest,
              levelTimeGood,
              missesBest,
              missesGood,
              wallBouncedBest,
              wallBouncedGood,
            }),
          ),
          miniMarkDown(t("main_menu.help_upgrades")),
          ...upgrades.map(
            (u) => `
<div class="upgrade used">
            ${u.icon}
            <p>
                <strong>${u.name}</strong><br/>
          ${u.help(1)}
          </p> 
        </div>
        
          ${miniMarkDown(u.fullHelp)}
`,
          ),
          "<h2>" + t("main_menu.credit_levels") + "</h2>",
          ...allLevels
            .filter((l) => l.credit?.trim())
            .map(
              (l) => `
<div class="upgrade used">
            ${icons[l.name]}
            <div>
            <p>
                <strong>${l.name}</strong> 
          </p> 
          ${miniMarkDown(l.credit || "")}
</div>
             
        </div>`,
            ),
        ],
      });
    },
  };
}
