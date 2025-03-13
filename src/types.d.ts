import { rawUpgrades } from "./rawUpgrades";

export type colorString = string;

export type RawLevel = {
  name: string;
  size: number;
  bricks: string;
  svg: number | null;
  color: string;
};
export type Level = {
  name: string;
  size: number;
  bricks: colorString[];
  svg: string;
  color: string;
  threshold: number;
  sortKey: number;
};

export type Palette = { [k: string]: string };

export type Upgrade = {
  threshold: number;
  giftable: boolean;
  id: PerkId;
  name: string;
  icon: string;
  max: number;
  help: (lvl: number) => string;
  fullHelp: string;
  requires: PerkId | "";
};

export type PerkId = (typeof rawUpgrades)[number]["id"];

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }

  interface Document {
    webkitFullscreenEnabled?: boolean;
    webkitCancelFullScreen?: () => void;
  }

  interface Element {
    webkitRequestFullscreen: typeof Element.requestFullscreen;
  }

  interface MediaStream {
    // https://devdoc.net/web/developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStream.html
    // On firefox, the capture stream has the requestFrame option
    // instead of the track, go figure
    requestFrame?: () => void;
  }
}

export type BallLike = {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
};

export type Coin = {
  points: number;
  color: colorString;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  sx: number;
  sy: number;
  a: number;
  sa: number;
  weight: number;
  destroyed?: boolean;
  coloredABrick?: boolean;
};
export type Ball = {
  x: number;
  previousX: number;
  y: number;
  previousY: number;
  vx: number;
  vy: number;
  previousVX: number;
  previousVY: number;
  sx: number;
  sy: number;
  sparks: number;
  piercedSinceBounce: number;
  hitSinceBounce: number;
  hitItem: { index: number; color: string }[];
  bouncesList: { x: number; y: number }[];
  sapperUses: number;
  destroyed?: boolean;
};

interface BaseFlash {
  time: number;
  color: colorString;
  duration: number;
  size: number;
  destroyed?: boolean;
  x: number;
  y: number;
}
interface ParticleFlash extends BaseFlash {
  type: "particle";
  vx: number;
  vy: number;
  ethereal: boolean;
}

interface TextFlash extends BaseFlash {
  type: "text";
  text: string;
}

interface BallFlash extends BaseFlash {
  type: "ball";
}

export type Flash = ParticleFlash | TextFlash | BallFlash;

export type RunStats = {
  started: number;
  levelsPlayed: number;
  runTime: number;
  coins_spawned: number;
  score: number;
  bricks_broken: number;
  misses: number;
  balls_lost: number;
  puck_bounces: number;
  upgrades_picked: number;
  max_combo: number;
  max_level: number;
};

export type PerksMap = {
  [k in PerkId]: number;
};

export type RunHistoryItem = RunStats & {
  perks?: PerksMap;
  appVersion?: string;
};
