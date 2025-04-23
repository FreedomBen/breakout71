import { icons, transformRawLevel } from "./loadGameData";
import { t } from "./i18n/i18n";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import { asyncAlert } from "./asyncAlert";
import { Palette, RawLevel } from "./types";
import { levelIconHTML } from "./levelIcon";

import _palette from "./data/palette.json";
import { restart } from "./game";
import { describeLevel } from "./game_utils";
import {
  automaticBackgroundColor,
  levelCodeToRawLevel,
  MAX_LEVEL_SIZE,
  MIN_LEVEL_SIZE,
} from "./pure_functions";

const palette = _palette as Palette;

export function levelEditorMenuEntry() {
  const min = 10000;
  const disabled = getTotalScore() < min;
  return {
    icon: icons["icon:editor"],
    text: t("editor.title"),
    disabled,
    help: disabled ? t("editor.locked", { min }) : t("editor.help"),
    async value() {
      openLevelEditorLevelsList().then();
    },
  };
}

async function openLevelEditorLevelsList() {
  const rawList = getSettingValue("custom_levels", []) as RawLevel[];
  const customLevels = rawList.map(transformRawLevel);

  let choice = await asyncAlert({
    title: t("editor.title"),
    content: [
      ...customLevels.map((l, li) => ({
        text: l.name,
        icon: levelIconHTML(l.bricks, l.size, l.color),
        value() {
          editRawLevelList(li);
        },
        help: l.credit || describeLevel(l),
      })),
      {
        text: t("editor.new_level"),
        icon: icons["icon:editor"],
        value() {
          rawList.push({
            color: "",
            size: 6,
            bricks: "____________________________________",
            name: "custom level" + (rawList.length + 1),
            credit: "",
          });
          setSettingValue("custom_levels", rawList);
          editRawLevelList(rawList.length - 1);
        },
      },
      {
        text: t("editor.import"),
        help: t("editor.import_instruction"),
        value() {
          const code = prompt(t("editor.import_instruction"))?.trim();
          if (code) {
            const lvl = levelCodeToRawLevel(code);
            if (lvl) {
              rawList.push(lvl);
              setSettingValue("custom_levels", rawList);
            }
          }
          openLevelEditorLevelsList();
        },
      },
    ],
  });
  if (typeof choice == "function") choice();
}

export async function editRawLevelList(nth: number, color = "W") {
  let rawList = getSettingValue("custom_levels", []) as RawLevel[];
  const level = rawList[nth];
  const bricks = level.bricks.split("");
  let grid = "";
  for (let y = 0; y < level.size; y++) {
    grid += '<div style="background: ' + (level.color || "black") + ';">';
    for (let x = 0; x < level.size; x++) {
      const c = bricks[y * level.size + x];
      grid += `<span data-resolve-to="paint_brick:${x}:${y}" style="background: ${palette[c]}">${c == "B" ? "💣" : ""}</span>`;
    }
    grid += "</div>";
  }

  const levelColors = new Set(bricks);
  levelColors.delete("_");
  levelColors.delete("B");

  let colorList =
    '<div class="palette">' +
    Object.entries(palette)
      .filter(([key, value]) => key !== "_")
      .filter(
        ([key, value]) =>
          levelColors.size < 5 || levelColors.has(key) || key === "B",
      )
      .map(
        ([key, value]) =>
          `<span data-resolve-to="set_color:${key}" data-selected="${key == color}" style="background: ${value}">${key == "B" ? "💣" : ""}</span>`,
      )
      .join("") +
    "</div>";

  const clicked = await asyncAlert<string | null>({
    title: t("editor.editing.title", { name: level.name }),
    content: [
      t("editor.editing.color"),
      colorList,
      t("editor.editing.help"),
      `<div class="gridEdit" style="--grid-size:${level.size};">${grid}</div>`,

      {
        icon: icons["icon:new_run"],
        text: t("editor.editing.play"),
        value: "play",
      },
      {
        text: t("editor.editing.rename"),
        value: "rename",
        help: level.name,
      },
      {
        text: t("editor.editing.credit"),
        value: "credit",
        help: level.credit,
      },
      {
        text: t("editor.editing.delete"),
        value: "delete",
      },
      {
        text: t("editor.editing.copy"),
        value: "copy",
        help: t("editor.editing.copy_help"),
      },
      {
        text: t("editor.editing.bigger"),
        value: "size:+1",
        disabled: level.size >= MAX_LEVEL_SIZE,
      },
      {
        text: t("editor.editing.smaller"),
        value: "size:-1",
        disabled: level.size <= MIN_LEVEL_SIZE,
      },
      {
        text: t("editor.editing.left"),
        value: "move:-1:0",
      },
      {
        text: t("editor.editing.right"),
        value: "move:1:0",
      },
      {
        text: t("editor.editing.up"),
        value: "move:0:-1",
      },
      {
        text: t("editor.editing.down"),
        value: "move:0:1",
      },
    ],
  });
  if (!clicked) return;
  if (typeof clicked === "string") {
    const [action, a, b] = clicked.split(":");
    if (action == "paint_brick") {
      const x = parseInt(a),
        y = parseInt(b);
      bricks[y * level.size + x] =
        bricks[y * level.size + x] === color ? "_" : color;
      level.bricks = bricks.join("");
    }
    if (action == "set_color") {
      color = a;
    }
    if (action == "size") {
      const newSize = level.size + parseInt(a);
      const newBricks = [];
      for (let y = 0; y < newSize; y++) {
        for (let x = 0; x < newSize; x++) {
          newBricks.push(
            (x < level.size && y < level.size && bricks[y * level.size + x]) ||
              "_",
          );
        }
      }
      level.size = newSize;
      level.bricks = newBricks.join("");
    }
    if (action == "move") {
      const dx = parseInt(a),
        dy = parseInt(b);
      const newBricks = [];
      for (let y = 0; y < level.size; y++) {
        for (let x = 0; x < level.size; x++) {
          const tx = x - dx;
          const ty = y - dy;
          if (tx < 0 || tx >= level.size || ty < 0 || ty >= level.size) {
            newBricks.push("_");
          } else {
            newBricks.push(bricks[ty * level.size + tx]);
          }
        }
      }
      level.bricks = newBricks.join("");
    }
    if (action === "play") {
      restart({
        level: transformRawLevel(level),
        isEditorTrialRun: nth,
        perks: {
          base_combo: 7,
        },
      });
      return;
    }
    if (action === "copy") {
      let text =
        "```\n[" +
        (level.name || "unnamed level")?.replace(/\[|\]/gi, " ") +
        "]";
      bricks.forEach((b, bi) => {
        if (!(bi % level.size)) text += "\n";
        text += b;
      });
      text +=
        "\n[" +
        (level.credit?.replace(/\[|\]/gi, " ") || "Missing credits") +
        "]\n```";
      navigator.clipboard.writeText(text);
      // return
    }
    if (action === "rename") {
      const name = prompt(t("editor.editing.rename_prompt"), level.name);
      if (name) {
        level.name = name;
      }
    }
    if (action === "credit") {
      const credit = prompt(
        t("editor.editing.credit_prompt"),
        level.credit || "",
      );
      if (credit !== "null") {
        level.credit = credit || "";
      }
    }
    if (action === "delete") {
      rawList = rawList.filter((l, li) => li !== nth);
      setSettingValue("custom_levels", rawList);
      openLevelEditorLevelsList();
      return;
    }
  }

  level.color = automaticBackgroundColor(bricks);

  setSettingValue("custom_levels", rawList);
  editRawLevelList(nth, color);
}
