// Settings

import {GameState} from "./types";

let cachedSettings: { [key: string]: unknown } = {};

export function getSettingValue<T>(key: string, defaultValue: T) {
    if (typeof cachedSettings[key] == "undefined") {
        try {
            const ls = localStorage.getItem( key);
            if (ls) cachedSettings[key] = JSON.parse(ls) as T;
        } catch (e) {
            console.warn(e);
        }
    }
    return cachedSettings[key] as T ?? defaultValue;
}

export function setSettingValue<T>(key: string, value: T) {
    cachedSettings[key] = value
    try {
        localStorage.setItem( key, JSON.stringify(value));
    } catch (e) {
        console.warn(e);
    }
}

export function getTotalScore() {
    return getSettingValue('breakout_71_total_score', 0)

}

export function addToTotalScore(gameState: GameState, points: number) {
    if (gameState.isCreativeModeRun) return;
    setSettingValue('breakout_71_total_score', getTotalScore() + points)
}

