import {allLevels, icons, upgrades} from "./loadGameData";
import {t} from "./i18n/i18n";
import {asyncAlert} from "./asyncAlert";
import {miniMarkDown} from "./pure_functions";

export function helpMenuEntry() {
    return {
        icon: icons['icon:help'],
        text: t('main_menu.help_title'),
        help: t('main_menu.help_help'),
        async value() {
            await asyncAlert({
                title:t('main_menu.help_title'),
                allowClose:true,
                content:[
                    miniMarkDown(t('main_menu.help_content')),
                    t('main_menu.help_upgrades'),
                    ...upgrades.map(u=>`


<div class="upgrade used">
            ${u.icon}
            <p>
                <strong>${u.name}</strong><br/>
          ${u.help(1)}
          </p> 
        </div>
        
          ${miniMarkDown(u.fullHelp)}
`),
                    miniMarkDown(t('main_menu.credits')),

                    t('main_menu.credit_levels'),
                      ...allLevels.filter(l=>l.credit?.startsWith('http')).map(l=>`
<div class="upgrade used">
            ${icons[l.name]}
            <p>
                <strong>${l.name}</strong><br/>
          <a href="${l.credit}" target="_blank">${l.credit}</a> 
          </p> 
        </div>`)

                ]
            })
        }
    }
}

