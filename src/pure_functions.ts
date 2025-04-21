import { Ball, GameState } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function comboKeepingRate(level: number) {
  return clamp(1 - (1 / (1 + level)) * 1.5, 0, 1);
}

export function ballTransparency(ball: Ball, gameState: GameState) {
  if (!gameState.perks.transparency) return 0;
  return clamp(
    gameState.perks.transparency *
      (1 - (ball.y / gameState.gameZoneHeight) * 1.2),
    0,
    1,
  );
}

export function coinsBoostedCombo(gameState: GameState) {
  let boost =
    1 + gameState.perks.sturdy_bricks / 2 + gameState.perks.smaller_puck / 2;
  if (gameState.perks.transparency) {
    let min = 1;
    gameState.balls.forEach((ball) => {
      const bt = ballTransparency(ball, gameState);
      if (bt < min) {
        min = bt;
      }
    });
    boost += (min * gameState.perks.transparency) / 2;
  }
  return Math.ceil(Math.max(gameState.combo, gameState.lastCombo) * boost);
}

export function miniMarkDown(md: string) {
  let html: { tagName: string; text: string }[] = [];
  let lastNode: { tagName: string; text: string } | null = null;

  md.split("\n").forEach((line) => {
    const titlePrefix = line.match(/^#+ /)?.[0];

    if (titlePrefix) {
      if (lastNode) html.push(lastNode);
      lastNode = {
        tagName: "h" + (titlePrefix.length - 1),
        text: line.slice(titlePrefix.length),
      };
    } else if (line.startsWith("- ")) {
      if (lastNode?.tagName !== "ul") {
        if (lastNode) html.push(lastNode);
        lastNode = { tagName: "ul", text: "" };
      }
      lastNode.text += "<li>" + line.slice(2) + "</li>";
    } else if (!line.trim()) {
      if (lastNode) html.push(lastNode);
      lastNode = null;
    } else {
      if (lastNode?.tagName !== "p") {
        if (lastNode) html.push(lastNode);
        lastNode = { tagName: "p", text: "" };
      }
      lastNode.text += line + " ";
    }
  });
  if (lastNode) {
    html.push(lastNode);
  }
  return html
    .map(
      (h) =>
        "<" +
        h.tagName +
        ">" +
        h.text.replace(
          /\bhttps?:\/\/[^\s<>]+/gi,
          (a) => `<a href="${a}">${a}</a>`,
        ) +
        "</" +
        h.tagName +
        ">",
    )
    .join("\n");
}

export function firstWhere<Input, Output>(
  arr: Input[],
  mapper: (item: Input, index: number) => Output | undefined,
): Output | undefined {
  for (let i = 0; i < arr.length; i++) {
    const result = mapper(arr[i], i);
    if (typeof result !== "undefined") return result;
  }
}

export const wallBouncedBest = 3,
  wallBouncedGood = 10,
  levelTimeBest = 30,
  levelTimeGood = 60,
  catchRateBest = 95,
  catchRateGood = 90,
  missesBest = 3,
  missesGood = 6;
