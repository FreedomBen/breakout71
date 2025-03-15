// Settings

let cachedSettings: { [key: string]: unknown } = {};

export function getSettingValue<T>(key: string, defaultValue: T) {
    if (typeof cachedSettings[key] == "undefined") {
        try {
            const ls = localStorage.getItem("breakout-settings-enable-" + key);
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
        localStorage.setItem("breakout-settings-enable-" + key, JSON.stringify(value));
    } catch (e) {
        console.warn(e);
    }
}

