import { t } from "./i18n/i18n";

import { OptionDef, OptionId } from "./types";
import { getSettingValue, setSettingValue } from "./settings";
import { hoursSpentPlaying } from "./pure_functions";

export const options = {
  sound: {
    default: true,
    name: t("main_menu.sounds"),
    help: t("main_menu.sounds_help"),
  },
  "mobile-mode": {
    default: window.innerHeight > window.innerWidth,
    name: t("main_menu.mobile"),
    help: t("main_menu.mobile_help"),
  },
  basic: {
    default: false,
    name: t("main_menu.basic"),
    help: t("main_menu.basic_help"),
  },
  colorful_coins: {
    default: false,
    name: t("main_menu.colorful_coins"),
    help: t("main_menu.colorful_coins_help"),
  },
  extra_bright: {
    default: true,
    name: t("main_menu.extra_bright"),
    help: t("main_menu.extra_bright_help"),
  },
  contrast: {
    default: false,
    name: t("main_menu.contrast"),
    help: t("main_menu.contrast_help"),
  },
  show_fps: {
    default: false,
    name: t("main_menu.show_fps"),
    help: t("main_menu.show_fps_help"),
  },
  show_stats: {
    default: false,
    name: t("main_menu.show_stats"),
    help: t("main_menu.show_stats_help"),
  },
  pointerLock: {
    default: false,
    name: t("main_menu.pointer_lock"),
    help: t("main_menu.pointer_lock_help"),
  },
  easy: {
    default: false,
    name: t("main_menu.kid"),
    help: t("main_menu.kid_help"),
  },
  // Could not get the sharing to work without loading androidx and all the modern android things so for now I'll just disable sharing in the android app
  record: {
    default: false,
    name: t("main_menu.record"),
    help: t("main_menu.record_help"),
  },
  fullscreen: {
    default: false,
    name: t("main_menu.fullscreen"),
    help: t("main_menu.fullscreen_help"),
  },
  donation_reminder: {
    default: hoursSpentPlaying() > 5,
    name: t("main_menu.donation_reminder"),
    help: t("main_menu.donation_reminder_help"),
  },
  red_miss: {
    default: true,
    name: t("main_menu.red_miss"),
    help: t("main_menu.red_miss_help"),
  },
  comboIncreaseTexts: {
    default: true,
    name: t("main_menu.comboIncreaseTexts"),
    help: t("main_menu.comboIncreaseTexts_help"),
  },
} as const satisfies { [k: string]: OptionDef };

export function isOptionOn(key: OptionId) {
  return getSettingValue(
    "breakout-settings-enable-" + key,
    options[key]?.default,
  );
}

export function toggleOption(key: OptionId) {
  setSettingValue("breakout-settings-enable-" + key, !isOptionOn(key));
}
