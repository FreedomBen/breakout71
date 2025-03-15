import {fitSize} from "./game";
import {t} from "./i18n/i18n";
import {getSettingValue, setSettingValue} from "./settings";

export const options = {
  sound: {
    default: true,
    name: t('main_menu.sounds'),
    help: t('main_menu.sounds_help'),
    afterChange: () => {},
    disabled: () => false,
  },
  "mobile-mode": {
    default: window.innerHeight > window.innerWidth,
    name: t('main_menu.mobile'),
    help: t('main_menu.mobile_help'),
    afterChange() {
      fitSize();
    },
    disabled: () => false,
  },
  basic: {
    default: false,
    name: t('main_menu.basic'),
    help: t('main_menu.basic_help'),
    afterChange: () => {},
    disabled: () => false,
  },
  pointerLock: {
    default: false,
    name: t('main_menu.pointer_lock'),
    help: t('main_menu.pointer_lock_help'),
    afterChange: () => {},
    disabled: () => !document.body.requestPointerLock,
  },
  easy: {
    default: false,
    name: t('main_menu.kid'),
    help: t('main_menu.kid_help'),
    afterChange: () => {},
    disabled: () => false,
  },
  // Could not get the sharing to work without loading androidx and all the modern android things so for now I'll just disable sharing in the android app
  record: {
    default: false,
    name: t('main_menu.record'),
    help: t('main_menu.record_help'),
    afterChange: () => {},
    disabled() {
      return window.location.search.includes("isInWebView=true");
    },
  },
} as const satisfies { [k: string]: OptionDef };

export type OptionDef = {
  default: boolean;
  name: string;
  help: string;
  disabled: () => boolean;
  afterChange: () => void;
};
export type OptionId = keyof typeof options;

export function isOptionOn(key: OptionId) {
  return getSettingValue(key, options[key]?.default)
}

export function toggleOption(key: OptionId) {
  setSettingValue(key, !isOptionOn(key))
  options[key].afterChange();
}