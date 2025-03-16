import {t} from "./i18n/i18n";

import {OptionDef, OptionId} from "./types";
import {getSettingValue, setSettingValue} from "./settings";

export const options = {
    sound: {
        default: true,
        name: t('main_menu.sounds'),
        help: t('main_menu.sounds_help'),
        disabled: () => false,
    },
    "mobile-mode": {
        default: window.innerHeight > window.innerWidth,
        name: t('main_menu.mobile'),
        help: t('main_menu.mobile_help'),
        disabled: () => false,
    },
    basic: {
        default: false,
        name: t('main_menu.basic'),
        help: t('main_menu.basic_help'),
        disabled: () => false,
    },
    pointerLock: {
        default: false,
        name: t('main_menu.pointer_lock'),
        help: t('main_menu.pointer_lock_help'),
        disabled: () => !document.body.requestPointerLock,
    },
    easy: {
        default: false,
        name: t('main_menu.kid'),
        help: t('main_menu.kid_help'),
        disabled: () => false,
    },
    // Could not get the sharing to work without loading androidx and all the modern android things so for now I'll just disable sharing in the android app
    record: {
        default: false,
        name: t('main_menu.record'),
        help: t('main_menu.record_help'),
        disabled() {
            return window.location.search.includes("isInWebView=true");
        },
    },
} as const satisfies { [k: string]: OptionDef };

export function isOptionOn(key: OptionId) {
    return getSettingValue("breakout-settings-enable-" + key, options[key]?.default)
}

export function toggleOption(key: OptionId) {
    setSettingValue("breakout-settings-enable-" +key, !isOptionOn(key))
}