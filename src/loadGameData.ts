import { Level, Palette, RawLevel, Upgrade } from "./types";
import _palette from "./palette.json";
import _rawLevelsList from "./levels.json";
import _appVersion from "./version.json";
import { rawUpgrades } from "./rawUpgrades";
import _backgrounds from "./backgrounds.json";
const backgrounds = _backgrounds as string[];
const palette = _palette as Palette;

const rawLevelsList = _rawLevelsList as RawLevel[];

export const appVersion = _appVersion as string;

let levelIconHTMLCanvas = document.createElement("canvas");
const levelIconHTMLCanvasCtx = levelIconHTMLCanvas.getContext("2d", {
  antialias: false,
  alpha: true,
}) as CanvasRenderingContext2D;

function levelIconHTML(
  bricks: string[],
  levelSize: number,
  levelName: string,
  color: string,
) {
  const size = 40;
  const c = levelIconHTMLCanvas;
  const ctx = levelIconHTMLCanvasCtx;
  c.width = size;
  c.height = size;

  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }
  const pxSize = size / levelSize;
  for (let x = 0; x < levelSize; x++) {
    for (let y = 0; y < levelSize; y++) {
      const c = bricks[y * levelSize + x];
      if (c) {
        ctx.fillStyle = c;
        ctx.fillRect(
          Math.floor(pxSize * x),
          Math.floor(pxSize * y),
          Math.ceil(pxSize),
          Math.ceil(pxSize),
        );
      }
    }
  }
  // I don't think many blind people will benefit for this but it's nice to have something to put in "alt"
  return `<img alt="${levelName}" width="${size}" height="${size}" src="${c.toDataURL()}"/>`;
}

export const icons = {} as { [k: string]: string };

export const allLevels = rawLevelsList
  .map((level) => {
    const bricks = level.bricks
      .split("")
      .map((c) => palette[c])
      .slice(0, level.size * level.size);
    const icon = levelIconHTML(bricks, level.size, level.name, level.color);
    icons[level.name] = icon;
    let svg = level.svg !== null && backgrounds[level.svg];

    if (!level.color && !svg) {
      svg = backgrounds[hashCode(level.name) % backgrounds.length];
    }
    return {
      ...level,
      bricks,
      icon,
      svg,
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

function hashCode(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    let code = string.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
