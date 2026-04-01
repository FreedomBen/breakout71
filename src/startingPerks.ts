import {Upgrade} from "./types";
import {getSettingValue, getTotalScore} from "./settings";

export function isBlackListedForStart(u: Upgrade) {
  return !!(u.requires || u.threshold > getTotalScore());
}

export function isStartingPerk(u: Upgrade): boolean {
  return (
    !isBlackListedForStart(u) && getSettingValue("start_with_" + u.id, u.gift)
  );
}
