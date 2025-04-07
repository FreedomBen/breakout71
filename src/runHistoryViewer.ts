import {getHistory} from "./gameOver";
import {icons} from "./loadGameData";
import {t} from "./i18n/i18n";
import {asyncAlert} from "./asyncAlert";
import {rawUpgrades} from "./upgrades";

export function runHistoryViewerMenuEntry(){
    const history = getHistory()

    return {
        icon:icons['icon:history'],
        text:t('history.title'),
        disabled : history.length<10,
        help: history.length<10 ? t('history.locked'):t('history.help',{count:history.length}),
       async value(){
            let sort = 0
            let sortDir = -1
            let columns = [
                {
                    label:t('history.columns.started'),
                    field: r=>r.started,
                    render(v){
                        return new Date(v).toISOString().slice(0,10)
                    }
                },
                {
                    label:t('history.columns.score'),
                    field: r=>r.score
                },
                {
                    label:t('history.columns.runTime'),
                    tooltip:t('history.columns.runTime_tooltip'),

                    field: r=>r.runTime,
                    render(v){
                        return Math.floor(v/1000)+'s'
                    }
                },
                {
                    label:t('history.columns.puck_bounces'),
                    tooltip:t('history.columns.puck_bounces_tooltip'),
                    field: r=>r.puck_bounces,
                },
                {
                    label:t('history.columns.max_combo'),
                    field: r=>r.max_combo,
                },
                {
                    label:t('history.columns.upgrades_picked'),
                    field: r=>r.upgrades_picked,
                },
                ...rawUpgrades.map(u=>({
                    label: icons['icon:'+u.id],
                    tooltip:u.name,
                    field: r=>r.perks[u.id]||0,
                    render(v){
                        if(!v) return '-'
                        return  v
                    }
                }))
            ]
           while(true){
               const header = columns.map((c, ci) => `<th data-tooltip="${c.tooltip || ''}" data-resolve-to="sort:${ci}">${c.label}</th>`).join('')
               const toString = v => v.toString()
               const tbody = history.sort((a, b) => sortDir * (columns[sort].field(a) - columns[sort].field(b))).map(h => '<tr>' + columns.map(c => {
                   const value = c.field(h) ?? 0
                   const render = c.render || toString
                   return '<td>' + render(value) + '</td>'
               }).join('') + '</tr>').join('')


               const result = await asyncAlert({
                   title: t('history.title'),
                   className: 'history',
                   content: [
                       `
<table>
<thead><tr>${header}</tr></thead>
<tbody>${tbody}</tbody>
</table>
                    `

                   ]
               })
               if(!result) return
               if(result.startsWith('sort:')){
                   const newSort = parseInt(result.split(':')[1])
                   if(newSort==sort){
                       sortDir*=-1
                   }else{
                       sortDir=-1
                       sort=newSort

                   }
               }
           }
        }
    }
}