import { Level, Palette, RawLevel, Upgrade } from "./types";
import _palette from "./data/palette.json";
import _rawLevelsList from "./data/levels.json";
import _appVersion from "./data/version.json";
import { rawUpgrades } from "./upgrades";
import { getLevelBackground } from "./getLevelBackground";
import { levelIconHTML } from "./levelIcon";

const palette = _palette as Palette;

const rawLevelsList = _rawLevelsList as RawLevel[];

export const appVersion = _appVersion as string;

export const icons = {} as { [k: string]: string };

export const allLevels = rawLevelsList
  .map((level) => {
    const bricks = level.bricks
      .split("")
      .map((c) => palette[c])
      .slice(0, level.size * level.size);
    const icon = levelIconHTML(bricks, level.size, level.color);
    icons[level.name] = icon;
    return {
      ...level,
      bricks,
      icon,
      svg: getLevelBackground(level),
    };
  })
  .filter((l) => !l.name.startsWith("icon:"))
  .map((l, li) => ({
    ...l,
    threshold:
      li < 8
        ? 0
        : Math.round(
            Math.min(Math.pow(10, 1 + (li + l.size) / 30) * 10, 5000) * li,
          ),
    sortKey: ((Math.random() + 3) / 3.5) * l.bricks.filter((i) => i).length,
  })) as Level[];

export const upgrades = rawUpgrades.map((u) => ({
  ...u,
  icon: icons["icon:" + u.id],
})) as Upgrade[];
