export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function comboKeepingRate(level: number) {
  return clamp(1 - (1 / (1 + level)) * 1.5, 0, 1);
}

export function hoursSpentPlaying() {
  try {
    const timePlayed =
      localStorage.getItem("breakout_71_total_play_time") || "0";
    return Math.floor(parseFloat(timePlayed) / 1000 / 60 / 60);
  } catch (e) {
    return 0;
  }
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
