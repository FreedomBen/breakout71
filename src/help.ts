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
    text: t("help.title"),
    help: t("help.help"),
    async value() {
      await asyncAlert({
        title: t("help.title"),
        allowClose: true,
        content: [
          miniMarkDown(
            t("help.content", {
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
          miniMarkDown(t("help.upgrades")),
          ...upgrades.map(
            (u) => `
<div class="upgrade used">
            ${icons['icon:'+u.id]}
            <p>
                <strong>${u.name}</strong><br/>
          ${u.help(1)}
          </p> 
        </div>
        
          ${miniMarkDown(u.fullHelp)}
`,
          ),
          "<h2>" + t("help.levels") + "</h2>",
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
