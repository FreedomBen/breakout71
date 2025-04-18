import { t } from "./i18n/i18n";

import { OptionDef, OptionId } from "./types";
import { getSettingValue, setSettingValue } from "./settings";
import { hoursSpentPlaying } from "./pure_functions";

export const options = {
  sound: {
    default: true,
    name: t("settings.sounds"),
    help: t("settings.sounds_help"),
  },
  "mobile-mode": {
    default: window.innerHeight > window.innerWidth,
    name: t("settings.mobile"),
    help: t("settings.mobile_help"),
  },
  basic: {
    default: false,
    name: t("settings.basic"),
    help: t("settings.basic_help"),
  },
  colorful_coins: {
    default: false,
    name: t("settings.colorful_coins"),
    help: t("settings.colorful_coins_help"),
  },
  extra_bright: {
    default: true,
    name: t("settings.extra_bright"),
    help: t("settings.extra_bright_help"),
  },
  contrast: {
    default: false,
    name: t("settings.contrast"),
    help: t("settings.contrast_help"),
  },
  show_fps: {
    default: false,
    name: t("settings.show_fps"),
    help: t("settings.show_fps_help"),
  },
  show_stats: {
    default: false,
    name: t("settings.show_stats"),
    help: t("settings.show_stats_help"),
  },
  pointerLock: {
    default: false,
    name: t("settings.pointer_lock"),
    help: t("settings.pointer_lock_help"),
  },
  easy: {
    default: false,
    name: t("settings.kid"),
    help: t("settings.kid_help"),
  },
  precise_physics: {
    default: true,
    name: t("settings.precise_physics"),
    help: t("settings.precise_physics_help"),
  },
  // Could not get the sharing to work without loading androidx and all the modern android things so for now I'll just disable sharing in the android app
  record: {
    default: false,
    name: t("settings.record"),
    help: t("settings.record_help"),
  },
  fullscreen: {
    default: false,
    name: t("settings.fullscreen"),
    help: t("settings.fullscreen_help"),
  },
  donation_reminder: {
    default: hoursSpentPlaying() > 5,
    name: t("settings.donation_reminder"),
    help: t("settings.donation_reminder_help"),
  },
  red_miss: {
    default: true,
    name: t("settings.red_miss"),
    help: t("settings.red_miss_help"),
  },
  comboIncreaseTexts: {
    default: true,
    name: t("settings.comboIncreaseTexts"),
    help: t("settings.comboIncreaseTexts_help"),
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
