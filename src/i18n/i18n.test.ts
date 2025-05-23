import { languages } from "./i18n";

describe("translation quality checks", () => {
  it("no html, links, puck", () => {
    const badKeys: String[] = [];
    for (let { value: languageCode, strings } of languages) {
      const translations = strings as Record<string, string>;
      for (let key in translations) {
        if (
          translations[key].match(
            /<|>|http|puck|palet|퍽|disco|шайба|冰球|rondelle/gi,
          )
        ) {
          badKeys.push(languageCode + ":" + key + " : " + translations[key]);
        }
      }
    }
    expect(badKeys).toEqual([]);
  });
});
