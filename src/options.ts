import { fitSize } from "./game";

export const options = {
  sound: {
    default: true,
    name: `Game sounds`,
    help: `Can slow down some phones.`,
    afterChange: () => {},
    disabled: () => false,
  },
  "mobile-mode": {
    default: window.innerHeight > window.innerWidth,
    name: `Mobile mode`,
    help: `Leaves space for your thumb.`,
    afterChange() {
      fitSize();
    },
    disabled: () => false,
  },
  basic: {
    default: false,
    name: `Basic graphics`,
    help: `Better performance on older devices.`,
    afterChange: () => {},
    disabled: () => false,
  },
  pointerLock: {
    default: false,
    name: `Mouse pointer lock`,
    help: `Locks and hides the mouse cursor.`,
    afterChange: () => {},
    disabled: () => !document.body.requestPointerLock,
  },
  easy: {
    default: false,
    name: `Kids mode`,
    help: `Start future runs with "slower ball".`,
    afterChange: () => {},
    disabled: () => false,
  }, // Could not get the sharing to work without loading androidx and all the modern android things so for now i'll just disable sharing in the android app
  record: {
    default: false,
    name: `Record gameplay videos`,
    help: `Get a video of each level.`,
    afterChange: () => {},
    disabled() {
      return window.location.search.includes("isInWebView=true");
    },
  }
} as const satisfies { [k: string]: OptionDef };

export type OptionDef = {
  default: boolean;
  name: string;
  help: string;
  disabled: () => boolean;
  afterChange: () => void;
};
export type OptionId = keyof typeof options;
