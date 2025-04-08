import {GameState, UpgradeLike} from "./types";
import {getSettingValue, setSettingValue} from "./settings";
import {allLevels, icons} from "./loadGameData";
import { getLevelUnlockCondition} from "./game_utils";

import {t} from "./i18n/i18n";
import {toast} from "./toast";
import {schedulGameSound} from "./gameStateMutators";

let list: {minScore: number, forbidden: UpgradeLike[], required: UpgradeLike[]}[] ;
let unlocked=new Set(getSettingValue('breakout_71_unlocked_levels',[]) as string[])

export function monitorLevelsUnlocks(gameState:GameState){
    if(gameState.creative) return;

    if(!list){
        list=allLevels.map((l,li)=>({
            name:l.name,li,l,
            ...getLevelUnlockCondition(li)
        }))

    }

    list.forEach(({name, minScore,  forbidden, required, l})=>{
        // Already unlocked
        if(unlocked.has(name)) return
        // Score not reached yet
        if(gameState.score<minScore) return
        // We are missing a required perk
        if(required.find(id=>!gameState.perks[id])) return;
        // We have a forbidden perk
        if(forbidden.find(id=>gameState.perks[id])) return;
        // Level just got unlocked
        unlocked.add(name)
        setSettingValue('breakout_71_unlocked_levels', getSettingValue('breakout_71_unlocked_levels',[]).concat([name]))

        toast(icons[name]+'<strong>'+t('unlocks.just_unlocked')+'</strong>')
        schedulGameSound(gameState, 'colorChange', 0, 1)

    })
}