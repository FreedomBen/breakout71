import { Level, Palette, RawLevel, Upgrade } from "./types";
import _palette from "./data/palette.json";
import _rawLevelsList from "./data/levels.json";
import _appVersion from "./data/version.json";
import { rawUpgrades } from "./upgrades";
import { getLevelBackground } from "./getLevelBackground";
import { levelIconHTML } from "./levelIcon";

import { automaticBackgroundColor } from "./pure_functions";

const palette = _palette as Palette;

const rawLevelsList = _rawLevelsList as RawLevel[];

export const appVersion = _appVersion as string;

export const icons = {} as { [k: string]: string };

export function transformRawLevel(level: RawLevel) {
  const splitBricks = level.bricks.split("");
  const bricks = splitBricks
    .map((c) => palette[c])
    .slice(0, level.size * level.size);
  const bricksCount = bricks.filter((i) => i).length;
  const icon = levelIconHTML(bricks, level.size, level.color);
  icons[level.name] = icon;
  return {
    ...level,
    bricks,
    bricksCount,
    icon,
    color: automaticBackgroundColor(splitBricks),
    svg: getLevelBackground(level),
    sortKey: ((Math.random() + 3) / 3.5) * bricksCount,
  };
}

export const allLevelsAndIcons = rawLevelsList.map(
  transformRawLevel,
) as Level[];

export const allLevels = allLevelsAndIcons.filter(
  (l) => !l.name.startsWith("icon:"),
);

export const upgrades = rawUpgrades.map((u) => ({
  ...u,
  icon: icons["icon:" + u.id],
})) as Upgrade[];
