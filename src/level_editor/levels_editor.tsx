import {  Palette, RawLevel } from "../types";
import _palette from "../data/palette.json";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { moveLevel, resizeLevel, setBrick } from "./levels_editor_util";
import {
  automaticBackgroundColor,
  levelCodeToRawLevel,
} from "../pure_functions";

const palette = _palette as Palette;

let allLevels = null;

function App() {
  const [selected, setSelected] = useState("W");
  const [applying, setApplying] = useState("");
  const [levels, setLevels] = useState([]);
  useEffect(() => {
    fetch("http://localhost:4400/src/data/levels.json")
      .then((r) => r.json())
      .then((lvls) => {
        const cleaned = lvls.map((l) => ({
          name: l.name,
          size: l.size,
          bricks: (l.bricks + "_".repeat(l.size * l.size)).slice(
            0,
            l.size * l.size,
          ),
          credit: l.credit || "",
        }));
        const sorted = [
          ...cleaned
            .filter((l) => l.name.match("icon:"))
            .sort((a, b) => (a.name > b.name ? 1 : -1)),
          ...cleaned.filter((l) => !l.name.match("icon:")),
        ];
        setLevels(sorted as RawLevel[]);
        allLevels = sorted;
      });
  }, []);

  const updateLevel = (index: number, change: Partial<RawLevel>) => {
    setLevels((list) =>
      list.map((l, li) => (li === index ? { ...l, ...change } : l)),
    );
  };

  const deleteLevel = (index: number) => {
    if (confirm("Delete level")) {
      setLevels(levels.filter((l, i) => i !== index));
    }
  };
  useEffect(() => {
    if (!allLevels || JSON.stringify(allLevels) === JSON.stringify(levels))
      return;
    const timoutId = setTimeout(() => {
      return fetch("http://localhost:4400/src/data/levels.json", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(levels, null, 2),
      });
    }, 500);
    return () => clearTimeout(timoutId);
  }, [levels]);

  return (
    <div
      onMouseUp={() => {
        setApplying("");
      }}
    >
      <div id={"levels"}>
        {levels.map((level, li) => {
          const { name, credit, bricks, size, svg, color } = level;

          const brickButtons = [];
          for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
              const index = y * size + x;
              brickButtons.push(
                <button
                  key={index}
                  onMouseDown={() => {
                    if (!applying) {
                      const color = selected === bricks[index] ? "_" : selected;
                      setApplying(color);
                      updateLevel(li, setBrick(level, index, color));
                    }
                  }}
                  onMouseEnter={() => {
                    if (applying) {
                      updateLevel(li, setBrick(level, index, applying));
                    }
                  }}
                  style={{
                    background: palette[bricks[index]] || "transparent",
                    left: x * 40,
                    top: y * 40,
                    width: 40,
                    height: 40,
                    position: "absolute",
                  }}
                >
                  {(palette[bricks[index]] == "black" && "💣") || " "}
                </button>,
              );
            }
          }

          return (
            <div key={li}>
              <input
                className={"name"}
                type="text"
                value={name}
                onChange={(e) => updateLevel(li, { name: e.target.value })}
              />
              <input
                className={"credit"}
                type="text"
                value={credit || ""}
                onChange={(e) => updateLevel(li, { credit: e.target.value })}
              />

              <div className={"buttons"}>
                <button onClick={() => deleteLevel(li)}>Delete</button>
                <button onClick={() => updateLevel(li, resizeLevel(level, -1))}>
                  -
                </button>
                <button onClick={() => updateLevel(li, resizeLevel(level, +1))}>
                  +
                </button>
                <button
                  onClick={() => updateLevel(li, moveLevel(level, -1, 0))}
                >
                  L
                </button>
                <button onClick={() => updateLevel(li, moveLevel(level, 1, 0))}>
                  R
                </button>
                <button
                  onClick={() => updateLevel(li, moveLevel(level, 0, -1))}
                >
                  U
                </button>
                <button onClick={() => updateLevel(li, moveLevel(level, 0, 1))}>
                  D
                </button>
              </div>
              <div
                className="level-bricks-preview"
                style={{
                  width: size * 40,
                  height: size * 40,
                  background: automaticBackgroundColor(bricks.split("")),
                }}
              >
                {brickButtons}
              </div>
            </div>
          );
        })}
      </div>
      <div id={"palette"}>
        {Object.entries(palette).map(([code, color]) => (
          <button
            key={code}
            className={code === selected ? "active" : ""}
            style={{
              background: color || "",
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "1px solid black",
            }}
            onClick={() => setSelected(code)}
          >
            {(color == "" && "x") || (color == "black" && "💣") || " "}
          </button>
        ))}
      </div>
      <button
        id="new-level"
        onClick={() => {
          const name = prompt("Name ? ");
          if (!name) return;

          setLevels((l) => [
            ...l,
            {
              name,
              size: 8,
              bricks:
                "________________________________________________________________",
              svg: null,
              color: "",
            },
          ]);
        }}
      >
        new
      </button>
      <button
        id="import-level"
        onClick={() => {
          const code = prompt("Level Code ? ");
          if (!code) return;
          const l = levelCodeToRawLevel(code);
          if (!l) return;
          setLevels((list) => [...list, l]);
        }}
      >
        import
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("app") as HTMLDivElement);
root.render(<App />);
