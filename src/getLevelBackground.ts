import {RawLevel} from "./types";

export function hashCode(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    let code = string.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

import _backgrounds from "./backgrounds.json";
const backgrounds = _backgrounds as string[];

export function getLevelBackground(level:RawLevel){

    let svg = level.svg !== null && backgrounds[level.svg % backgrounds.length];

    if (!level.color && !svg) {
      svg = backgrounds[hashCode(level.name) % backgrounds.length];
    }
    return svg
}