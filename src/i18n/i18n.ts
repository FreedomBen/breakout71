import en from "./en.json";
import fr from "./fr.json";
// import ar from "./ar.json";
// import de from "./de.json";
// import es from "./es.json";
// import ko from "./ko.json";
// import ru from "./ru.json";
// import ur from "./ur.json";
// import uz from "./uz.json";
// import zh from "./zh.json";

export const languages = [
  {
    text: "English",
    value: "en",
    strings: en,

    levelName: "UK",
  },
  {
    text: "Français",
    value: "fr",
    strings: fr,

    levelName: "France",
  },
  // {
  //   text: "عربي",
  //   value: "ar",
  //   strings: ar,
  //
  //   levelName: "Lebanon",
  // },
  // {
  //   text: "Español",
  //   value: "es",
  //   strings: es,
  //
  //   levelName: "Spain",
  // },
  // {
  //   text: "Русский",
  //   value: "ru",
  //   strings: ru,
  //
  //   levelName: "Russia",
  // },

  // {
  //   text: "Deutsch",
  //   value: "de",
  //   strings: de,
  //
  //   levelName: "Germany",
  // },
  // {
  //   text: "汉语",
  //   value: "zh",
  //   strings: zh,
  //
  //   levelName: "China",
  // },
  // {
  //   text: "o'zbek tili",
  //   value: "uz",
  //   strings: uz,
  //   levelName: "Uzbekistan",
  // },
  // {
  //   text: "اردو",
  //   value: "ur",
  //   strings: ur,
  //
  //   levelName: "Pakistan",
  // },
  // {
  //   text: "한국인",
  //   value: "ko",
  //   strings: ko,
  //
  //   levelName: "Korea",
  // },
];

import { getSettingValue } from "../settings";

type translationKeys = keyof typeof en;
type translation = { [key in translationKeys]: string };
const languagesMap: Record<string, translation> = {};
languages.forEach((l) => (languagesMap[l.value] = l.strings));

let defaultLang =
  [...navigator.languages, navigator.language]
    .filter((i) => i)
    .map((i) => i.slice(0, 2).toLowerCase())
    .find((k) => k in languagesMap) || "en";
export function getCurrentLang() {
  return getSettingValue("lang", defaultLang);
}

export function t(
  key: translationKeys,
  params: { [key: string]: any } = {},
): string {
  const lang = getCurrentLang();
  let template = languagesMap[lang]?.[key] || languagesMap.en[key];
  for (let key in params) {
    template = template.split("{{" + key + "}}").join(`${params[key]}`);
  }
  return template;
}
