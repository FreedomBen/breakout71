import fr from './fr.json'
import en from './en.json'
import {getSettingValue} from "../settings";

type translationKeys = keyof typeof en
type translation= { [key in translationKeys] : string }
const languages:Record<string, translation>= {fr,en}
export function getCurrentLang(){
   return  getSettingValue('lang',getFirstBrowserLanguage())
}

export function t(key: translationKeys, params: {[key:string]:any} = {}):string {
    const lang = getCurrentLang()
    let template=languages[lang]?.[key] || languages.en[key]
    for(let key in params){
        template=template.split('{{'+key+'}}').join(`${params[key]}`)
    }
    return template
}

function getFirstBrowserLanguage() {
    const preferred_languages = [
        ...navigator.languages,
        navigator.language,
        'en'
    ].filter(i => i)
        .map(i => i.slice(0, 2).toLowerCase())
    const supported = Object.keys(languages)

    return preferred_languages.find(k=>supported.includes(k)) || 'en'

};
