import { rawUpgrades } from "./rawUpgrades";
import { options } from "./options";

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
  size: number;
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
  wall_bounces: number;
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
export type GameState = {
  // Width of the canvas element in pixels
  canvasWidth: number;
  // Height of the canvas element in pixels
  canvasHeight: number;
  // Distance between the left of the canvas and the left of the leftmost brick, in pixels
  offsetX: number;
  // Distance between the left of the canvas and the left border of the game area, in pixels.
  // Can be 0 when no border is shown
  offsetXRoundedDown: number;
  // Width of the bricks area, in pixels
  gameZoneWidth: number;
  // Width of the game area between the left and right borders, in pixels
  gameZoneWidthRoundedUp: number;
  // Height of the play area, between the top of the canvas and the bottom of the puck.
  // Does not include the finger zone on mobile.
  gameZoneHeight: number;
  // Size of one brick in pixels
  brickWidth: number;
  // Size of the current level's grid
  gridSize: number;
  // 0 based index of the current level in the run (level X / 7)
  currentLevel: number;

  // 10 levels selected randomly at start for the run
  runLevels: Level[];
  // Width of the puck in pixels, changed by some perks and resizes
  puckWidth: number;
  // perks the user currently has
  perks: PerksMap;
  // Base speed of the ball in pixels/tick
  baseSpeed: number;
  // Score multiplier
  combo: number;
  // Whether the game is running or paused
  running: boolean;
  // Position of the center of the puck on the canvas in pixels, from the left of the canvas.
  puckPosition: number;
  // Will be set if the game is about to be paused. Game pause is delayed by a few milliseconds if you pause a few times in a run,
  // to avoid abuse of the "release to pause" feature on mobile.
  pauseTimeout: NodeJS.Timeout | null;

  // Current run score
  score: number;
  // levelTime of the last time the score increase, to render the score differently
  lastScoreIncrease: number;
  // levelTime of the last explosion, for screen shake
  lastExplosion: number;
  // High score at the beginning of the run
  highScore: number;
  // Balls currently in game, game over if it's empty
  balls: Ball[];
  // Color of the balls, can be changed by some perks
  ballsColor: colorString;
  // Array of bricks to display. 'black' means bomb. '' means no brick.
  bricks: colorString[];

  flashes: Flash[];
  coins: Coin[];
  levelStartScore: number;
  levelMisses: number;
  levelSpawnedCoins: number;
  lastPlayedCoinGrab: number;

  MAX_COINS: number;
  MAX_PARTICLES: number;
  puckColor: colorString;
  ballSize: number;
  coinSize: number;
  puckHeight: number;
  totalScoreAtRunStart: number;
  isCreativeModeRun: boolean;
  pauseUsesDuringRun: number;
  keyboardPuckSpeed: number;
  lastTick: number;
  lastTickDown: number;
  runStatistics: RunStats;
  lastOffered: Partial<{ [k in PerkId]: number }>;
  levelTime: number;
  levelWallBounces: number;
  autoCleanUses: number;
};

export type RunParams = {
  level?: string;
  levelToAvoid?: string;
  perks?: Partial<PerksMap>;
};
export type OptionDef = {
  default: boolean;
  name: string;
  help: string;
  disabled: () => boolean;
};
export type OptionId = keyof typeof options;
