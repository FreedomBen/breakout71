import { allLevels, appVersion, icons, upgrades } from "./loadGameData";
import {
  Ball,
  Coin,
  GameState,
  OptionId,
  PerkId,
  RunParams,
  Upgrade,
} from "./types";
import { getAudioContext } from "./sounds";
import {
  currentLevelInfo,
  getRowColIndex,
  max_levels,
  pickedUpgradesHTMl,
} from "./game_utils";

import "./PWA/sw_loader";
import { getCurrentLang, t } from "./i18n/i18n";
import { getSettingValue, getTotalScore, setSettingValue } from "./settings";
import {
  gameStateTick,
  normalizeGameState,
  pickRandomUpgrades,
  putBallsAtPuck,
  resetBalls,
  resetCombo,
  setLevel,
  setMousePos,
} from "./gameStateMutators";
import {
  backgroundCanvas,
  bombSVG,
  ctx,
  gameCanvas,
  render,
  scoreDisplay,
} from "./render";
import {
  pauseRecording,
  recordOneFrame,
  resumeRecording,
  startRecordingGame,
} from "./recording";
import { newGameState } from "./newGameState";
import {
  alertsOpen,
  asyncAlert,
  AsyncAlertAction,
  closeModal,
} from "./asyncAlert";
import { isOptionOn, options, toggleOption } from "./options";
import {hashCode} from "./getLevelBackground";

export function play() {
  if (gameState.running) return;
  gameState.running = true;

  startRecordingGame(gameState);
  getAudioContext()?.resume();
  resumeRecording();
  document.body.className = gameState.running ? " running " : " paused ";
}

export function pause(playerAskedForPause: boolean) {
  if (!gameState.running) return;
  if (gameState.pauseTimeout) return;

  gameState.pauseTimeout = setTimeout(
    () => {
      gameState.running = false;

      setTimeout(() => {
        if (!gameState.running) getAudioContext()?.suspend();
      }, 1000);

      pauseRecording();
      gameState.pauseTimeout = null;
      document.body.className = gameState.running ? " running " : " paused ";
      scoreDisplay.className = "";
      gameState.needsRender = true;
    },
    Math.min(Math.max(0, gameState.pauseUsesDuringRun - 5) * 50, 500),
  );

  if (playerAskedForPause) {
    // Pausing many times in a run will make pause slower
    gameState.pauseUsesDuringRun++;
  }

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

export const fitSize = () => {
  const { width, height } = gameCanvas.getBoundingClientRect();
  gameState.canvasWidth = width;
  gameState.canvasHeight = height;
  gameCanvas.width = width;
  gameCanvas.height = height;
  ctx.fillStyle = currentLevelInfo(gameState)?.color || "black";
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, width, height);
  backgroundCanvas.width = width;
  backgroundCanvas.height = height;

  gameState.gameZoneHeight = isOptionOn("mobile-mode")
    ? (height * 80) / 100
    : height;
  const baseWidth = Math.round(
    Math.min(gameState.canvasWidth, gameState.gameZoneHeight * 0.73),
  );
  gameState.brickWidth = Math.floor(baseWidth / gameState.gridSize / 2) * 2;
  gameState.gameZoneWidth = gameState.brickWidth * gameState.gridSize;
  gameState.offsetX = Math.floor(
    (gameState.canvasWidth - gameState.gameZoneWidth) / 2,
  );
  gameState.offsetXRoundedDown = gameState.offsetX;
  if (gameState.offsetX < gameState.ballSize) gameState.offsetXRoundedDown = 0;
  gameState.gameZoneWidthRoundedUp = width - 2 * gameState.offsetXRoundedDown;
  backgroundCanvas.title = "resized";
  // Ensure puck stays within bounds
  setMousePos(gameState, gameState.puckPosition);
  gameState.coins = [];
  gameState.flashes = [];
  pause(true);
  putBallsAtPuck(gameState);
  // For safari mobile https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`,
  );
};
window.addEventListener("resize", fitSize);
window.addEventListener("fullscreenchange", fitSize);

setInterval(() => {
  // Sometimes, the page changes size without triggering the event (when switching to fullscreen, closing debug panel...)
  const { width, height } = gameCanvas.getBoundingClientRect();
  if (width !== gameState.canvasWidth || height !== gameState.canvasHeight)
    fitSize();
}, 1000);

export async function openUpgradesPicker(gameState: GameState) {
  const catchRate =
    (gameState.score - gameState.levelStartScore) /
    (gameState.levelSpawnedCoins || 1);

  let repeats = 1;
  let choices = 3;

  let timeGain = "",
    catchGain = "",
    wallHitsGain = "",
    missesGain = "";

  if (gameState.levelWallBounces == 0) {
    repeats++;
    choices++;
    wallHitsGain = t("level_up.plus_one_upgrade");
  } else if (gameState.levelWallBounces < 5) {
    choices++;
    wallHitsGain = t("level_up.plus_one_choice");
  }
  if (gameState.levelTime < 30 * 1000) {
    repeats++;
    choices++;
    timeGain = t("level_up.plus_one_upgrade");
  } else if (gameState.levelTime < 60 * 1000) {
    choices++;
    timeGain = t("level_up.plus_one_choice");
  }
  if (catchRate === 1) {
    repeats++;
    choices++;
    catchGain = t("level_up.plus_one_upgrade");
  } else if (catchRate > 0.9) {
    choices++;
    catchGain = t("level_up.plus_one_choice");
  }
  if (gameState.levelMisses === 0) {
    repeats++;
    choices++;
    missesGain = t("level_up.plus_one_upgrade");
  } else if (gameState.levelMisses <= 3) {
    choices++;
    missesGain = t("level_up.plus_one_choice");
  }

  while (repeats--) {
    const actions = pickRandomUpgrades(
      gameState,
      choices +
        gameState.perks.one_more_choice -
        gameState.perks.instant_upgrade,
    );
    if (!actions.length) break;
    let textAfterButtons = `
        <p>${t("level_up.after_buttons", {
          level: gameState.currentLevel + 1,
          max: max_levels(gameState),
        })} </p>
        <p>${pickedUpgradesHTMl(gameState)}</p>
        <div id="level-recording-container"></div> 
        
        `;

    const compliment =
      (timeGain &&
        catchGain &&
        missesGain &&
        wallHitsGain &&
        t("level_up.compliment_perfect")) ||
      ((timeGain || catchGain || missesGain || wallHitsGain) &&
        t("level_up.compliment_good")) ||
      t("level_up.compliment_advice");

    const upgradeId = (await asyncAlert<PerkId>({
      title:
        t("level_up.pick_upgrade_title") +
        (repeats ? " (" + (repeats + 1) + ")" : ""),
      actions,
      text: `<p>${t("level_up.before_buttons", {
        score: gameState.score - gameState.levelStartScore,
        catchGain,
        levelSpawnedCoins: gameState.levelSpawnedCoins,
        time: Math.round(gameState.levelTime / 1000),
        timeGain,
        levelMisses: gameState.levelMisses,
        missesGain,
        levelWallBounces: gameState.levelWallBounces,
        wallHitsGain,
        compliment,
      })}
        </p>`,
      allowClose: false,
      textAfterButtons,
    })) as PerkId;

    gameState.perks[upgradeId]++;
    if (upgradeId === "instant_upgrade") {
      repeats += 2;
    }

    gameState.runStatistics.upgrades_picked++;
  }
  resetCombo(gameState, undefined, undefined);
  resetBalls(gameState);
}

gameCanvas.addEventListener("mouseup", (e) => {
  if (e.button !== 0) return;
  if (gameState.running) {
    pause(true);
  } else {
    play();
    if (isOptionOn("pointerLock") && gameCanvas.requestPointerLock) {
      gameCanvas.requestPointerLock().then();
    }
  }
});

gameCanvas.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === gameCanvas) {
    setMousePos(gameState, gameState.puckPosition + e.movementX);
  } else {
    setMousePos(gameState, e.x);
  }
});

gameCanvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!e.touches?.length) return;
  setMousePos(gameState, e.touches[0].pageX);
  play();
});
gameCanvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  pause(true);
});
gameCanvas.addEventListener("touchcancel", (e) => {
  e.preventDefault();
  pause(true);
});
gameCanvas.addEventListener("touchmove", (e) => {
  if (!e.touches?.length) return;
  setMousePos(gameState, e.touches[0].pageX);
});

export function brickIndex(x: number, y: number) {
  return getRowColIndex(
    gameState,
    Math.floor(y / gameState.brickWidth),
    Math.floor((x - gameState.offsetX) / gameState.brickWidth),
  );
}

export function hasBrick(index: number): number | undefined {
  if (gameState.bricks[index]) return index;
}

export function hitsSomething(x: number, y: number, radius: number) {
  return (
    hasBrick(brickIndex(x - radius, y - radius)) ??
    hasBrick(brickIndex(x + radius, y - radius)) ??
    hasBrick(brickIndex(x + radius, y + radius)) ??
    hasBrick(brickIndex(x - radius, y + radius))
  );
}

export function shouldPierceByColor(
  vhit: number | undefined,
  hhit: number | undefined,
  chit: number | undefined,
) {
  if (!gameState.perks.pierce_color) return false;
  if (
    typeof vhit !== "undefined" &&
    gameState.bricks[vhit] !== gameState.ballsColor
  ) {
    return false;
  }
  if (
    typeof hhit !== "undefined" &&
    gameState.bricks[hhit] !== gameState.ballsColor
  ) {
    return false;
  }
  if (
    typeof chit !== "undefined" &&
    gameState.bricks[chit] !== gameState.ballsColor
  ) {
    return false;
  }
  return true;
}

export function coinBrickHitCheck(coin: Coin) {
  // Make ball/coin bonce, and return bricks that were hit
  const radius = coin.size / 2;
  const { x, y, previousX, previousY } = coin;

  const vhit = hitsSomething(previousX, y, radius);
  const hhit = hitsSomething(x, previousY, radius);
  const chit =
    (typeof vhit == "undefined" &&
      typeof hhit == "undefined" &&
      hitsSomething(x, y, radius)) ||
    undefined;

  if (typeof vhit !== "undefined" || typeof chit !== "undefined") {
    coin.y = coin.previousY;
    coin.vy *= -1;

    //   Roll on corners
    const leftHit = gameState.bricks[brickIndex(x - radius, y + radius)];
    const rightHit = gameState.bricks[brickIndex(x + radius, y + radius)];

    if (leftHit && !rightHit) {
      coin.vx += 1;
      coin.sa -= 1;
    }
    if (!leftHit && rightHit) {
      coin.vx -= 1;
      coin.sa += 1;
    }
  }
  if (typeof hhit !== "undefined" || typeof chit !== "undefined") {
    coin.x = coin.previousX;
    coin.vx *= -1;
  }
  return vhit ?? hhit ?? chit;
}

export function bordersHitCheck(
  coin: Coin | Ball,
  radius: number,
  delta: number,
) {
  if (coin.destroyed) return;
  coin.previousX = coin.x;
  coin.previousY = coin.y;
  coin.x += coin.vx * delta;
  coin.y += coin.vy * delta;
  coin.sx ||= 0;
  coin.sy ||= 0;
  coin.sx += coin.previousX - coin.x;
  coin.sy += coin.previousY - coin.y;
  coin.sx *= 0.9;
  coin.sy *= 0.9;

  if (gameState.perks.wind) {
    coin.vx +=
      ((gameState.puckPosition -
        (gameState.offsetX + gameState.gameZoneWidth / 2)) /
        gameState.gameZoneWidth) *
      gameState.perks.wind *
      0.5;
  }

  let vhit = 0,
    hhit = 0;

  if (coin.x < gameState.offsetXRoundedDown + radius) {
    coin.x =
      gameState.offsetXRoundedDown +
      radius +
      (gameState.offsetXRoundedDown + radius - coin.x);
    coin.vx *= -1;
    hhit = 1;
  }
  if (coin.y < radius) {
    coin.y = radius + (radius - coin.y);
    coin.vy *= -1;
    vhit = 1;
  }
  if (coin.x > gameState.canvasWidth - gameState.offsetXRoundedDown - radius) {
    coin.x =
      gameState.canvasWidth -
      gameState.offsetXRoundedDown -
      radius -
      (coin.x -
        (gameState.canvasWidth - gameState.offsetXRoundedDown - radius));
    coin.vx *= -1;
    hhit = 1;
  }

  return hhit + vhit * 2;
}

export function tick() {
  const currentTick = performance.now();
  const timeDeltaMs = currentTick - gameState.lastTick;
  gameState.lastTick = currentTick;

  const frames = Math.min(4, timeDeltaMs / (1000 / 60));

  if (gameState.keyboardPuckSpeed) {
    setMousePos(
      gameState,
      gameState.puckPosition + gameState.keyboardPuckSpeed,
    );
  }

  normalizeGameState(gameState);

  if (gameState.running) {
    gameState.levelTime += timeDeltaMs;
    gameState.runStatistics.runTime += timeDeltaMs;
    gameStateTick(gameState, frames);
  }
  if (gameState.running || gameState.needsRender) {
    gameState.needsRender = false;
    render(gameState);
  }
  if (gameState.running) {
    recordOneFrame(gameState);
  }
  requestAnimationFrame(tick);
}

window.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause(true);
  }
});

scoreDisplay.addEventListener("click", (e) => {
  e.preventDefault();
  openScorePanel();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause(true);
  }
});

async function openScorePanel() {
  pause(true);
  const cb = await asyncAlert({
    title: t("score_panel.title", {
      score: gameState.score,
      level: gameState.currentLevel + 1,
      max: max_levels(gameState),
    }),
    text: `
            ${gameState.isCreativeModeRun ? "<p>${t('score_panel.test_run}</p>" : ""}
            <p>${t("score_panel.upgrades_picked")}</p>
            <p>${pickedUpgradesHTMl(gameState)}</p>
        `,
    allowClose: true,
    actions: [
      {
        text: t("score_panel.resume"),
        help: t("score_panel.resume_help"),
        value: () => {},
      },
      {
        text: t("score_panel.restart"),
        help: t("score_panel.restart_help"),
        value: () => {
          restart({ levelToAvoid: currentLevelInfo(gameState).name });
        },
      },
    ],
  });
  if (cb) {
    cb();
  }
}

document.getElementById("menu")?.addEventListener("click", (e) => {
  e.preventDefault();
  openSettingsPanel();
});

async function openSettingsPanel() {
  pause(true);

  const actions: AsyncAlertAction<() => void>[] = [
    {
      text: t("main_menu.resume"),
      help: t("main_menu.resume_help"),
      value() {},
    },
    {
      text: t("main_menu.unlocks"),
      help: t("main_menu.unlocks_help"),
      value() {
        openUnlocksList();
      },
    },
  ];

  for (const key of Object.keys(options) as OptionId[]) {
    if (options[key])
      actions.push({
        icon: isOptionOn(key)
          ? icons["icon:checkmark_checked"]
          : icons["icon:checkmark_unchecked"],
        text: options[key].name,
        help: options[key].help,
        value: () => {
          toggleOption(key);
          if (key === "mobile-mode") fitSize();

          openSettingsPanel();
        },
      });
  }
  const creativeModeThreshold = Math.max(...upgrades.map((u) => u.threshold));

  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
    if (document.fullscreenElement !== null) {
      actions.push({
        text: t("main_menu.fullscreen_exit"),
        help: t("main_menu.fullscreen_exit_help"),
        icon: icons["icon:exit_fullscreen"],
        value() {
          toggleFullScreen();
        },
      });
    } else {
      actions.push({
        text: t("main_menu.fullscreen"),
        help: t("main_menu.fullscreen_help"),

        icon: icons["icon:fullscreen"],
        value() {
          toggleFullScreen();
        },
      });
    }
  }

  actions.push({
    text: t("sandbox.title"),
    help:
      getTotalScore() < creativeModeThreshold
        ? t("sandbox.unlocks_at", { score: creativeModeThreshold })
        : t("sandbox.help"),
    disabled: getTotalScore() < creativeModeThreshold,
    async value() {
      let creativeModePerks: Partial<{ [id in PerkId]: number }> =
          getSettingValue("creativeModePerks", {}),
        choice: "start" | Upgrade | void;

      while (
        (choice = await asyncAlert<"start" | Upgrade>({
          title: t("sandbox.title"),
          text: t("sandbox.instructions"),
          actionsAsGrid: true,
          actions: [
            ...upgrades.map((u) => ({
              icon: u.icon,
              text: u.name,
              help: (creativeModePerks[u.id] || 0) + "/" + u.max,
              value: u,
              className: creativeModePerks[u.id]
                ? ""
                : "grey-out-unless-hovered",
            })),
            {
              text: t("sandbox.start"),
              value: "start",
            },
          ],
        }))
      ) {
        if (choice === "start") {
          setSettingValue("creativeModePerks", creativeModePerks);
          restart({ perks: creativeModePerks });

          break;
        } else if (choice) {
          creativeModePerks[choice.id] =
            ((creativeModePerks[choice.id] || 0) + 1) % (choice.max + 1);
        }
      }
    },
  });
  actions.push({
    text: t("main_menu.reset"),
    help: t("main_menu.reset_help"),
    async value() {
      if (
        await asyncAlert({
          title: t("main_menu.reset"),
          text: t("main_menu.reset_instruction"),
          actions: [
            {
              text: t("main_menu.reset_confirm"),
              value: true,
            },
            {
              text: t("main_menu.reset_cancel"),
              value: false,
            },
          ],
          allowClose: true,
        })
      ) {
        localStorage.clear();
        window.location.reload();
      }
    },
  });

  actions.push({
    text: t("main_menu.download_save_file"),
    help: t("main_menu.download_save_file_help"),
    async value() {
      const localStorageContent: Record<string, string> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) as string;
        const value = localStorage.getItem(key) as string;

        // Store the key-value pair in the object
        localStorageContent[key] = value;
      }

      const signedPayload=JSON.stringify(localStorageContent)
      const dlLink = document.createElement("a");

      dlLink.setAttribute(
        "href",
        "data:application/json;base64," +
          btoa(
            JSON.stringify({
              fileType: "B71-save-file",
              appVersion,
              signedPayload,
              key: hashCode('Security by obscurity, but really the game is oss so eh'+signedPayload)
            }),
          ),
      );

      dlLink.setAttribute(
        "download",
        "b71-save-" +
          new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[^0-9]+/gi, "-") +
          ".b71",
      );
      document.body.appendChild(dlLink);
      dlLink.click();
      setTimeout(() => document.body.removeChild(dlLink), 1000);
    },
  });

  actions.push({
    text: t("main_menu.load_save_file"),
    help: t("main_menu.load_save_file_help"),
    async value() {
      if (!document.getElementById("save_file_picker")) {
        let input: HTMLInputElement = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("id", "save_file_picker");
        input.setAttribute("accept", ".b71");
        input.style.position = "absolute";
        input.style.left = "-1000px";
        input.addEventListener("change", async (e) => {
          try {
            const file = input && input.files?.item(0);
            if (file) {
              const content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function () {
                  resolve(reader.result?.toString() || "");
                };
                reader.onerror = function () {
                  reject(reader.error);
                };

                // Read the file as a text string

                reader.readAsText(file);
              });
              const {
                fileType,
                appVersion: fileVersion,
                signedPayload,key
              } = JSON.parse(content);
              if (fileType !== "B71-save-file")
                throw new Error("Not a B71 save file");
              if (fileVersion > appVersion)
                throw new Error(
                  "Please update your app first, this file is for version " +
                    fileVersion +
                    " or newer.",
                );

              if(key!== hashCode('Security by obscurity, but really the game is oss so eh'+signedPayload)){
                throw new Error("Key does not match content.")
              }

              const localStorageContent=JSON.parse(signedPayload)
              localStorage.clear();
              for (let key in localStorageContent) {
                localStorage.setItem(key, localStorageContent[key]);
              }
              await asyncAlert({
                title: t("main_menu.save_file_loaded"),
                text: t("main_menu.save_file_loaded_help"),
                actions: [{ text: t("main_menu.save_file_loaded_ok") }],
              });
              window.location.reload();
            }
          } catch (e: any) {
            await asyncAlert({
              title: t("main_menu.save_file_error"),
              text: e.message,
              actions: [{ text: t("main_menu.save_file_loaded_ok") }],
            });
          }
          input.value = "";
        });
        document.body.appendChild(input);
      }
      document.getElementById("save_file_picker")?.click();
    },
  });

  actions.push({
    text: t("main_menu.language"),
    help: t("main_menu.language_help"),
    async value() {
      const pick = await asyncAlert({
        title: t("main_menu.language"),
        text: t("main_menu.language_help"),
        actions: [
          {
            text: "English",
            value: "en",
          },
          {
            text: "Français",
            value: "fr",
          },
        ],
        allowClose: true,
      });
      if (pick && pick !== getCurrentLang() && (await confirmRestart())) {
        setSettingValue("lang", pick);
        window.location.reload();
      }
    },
  });

  const cb = await asyncAlert<() => void>({
    title: t("main_menu.title"),
    text: ``,
    allowClose: true,
    actions,
    textAfterButtons: t("main_menu.footer_html", { appVersion }),
  });
  if (cb) {
    cb();
    gameState.needsRender = true;
  }
}

async function openUnlocksList() {
  const ts = getTotalScore();
  const actions = [
    ...upgrades
      .sort((a, b) => a.threshold - b.threshold)
      .map(({ name, id, threshold, icon, fullHelp }) => ({
        text: name,
        help:
          ts >= threshold ? fullHelp : t("unlocks.unlocks_at", { threshold }),
        disabled: ts < threshold,
        value: { perks: { [id]: 1 } } as RunParams,
        icon,
      })),
    ...allLevels
      .sort((a, b) => a.threshold - b.threshold)
      .map((l) => {
        const available = ts >= l.threshold;
        return {
          text: l.name,
          help: available
            ? t("unlocks.level_description", {
                size: l.size,
                bricks: l.bricks.filter((i) => i).length,
              })
            : t("unlocks.unlocks_at", { threshold: l.threshold }),
          disabled: !available,
          value: { level: l.name } as RunParams,
          icon: icons[l.name],
        };
      }),
  ];

  const percentUnlock = Math.round(
    (actions.filter((a) => !a.disabled).length / actions.length) * 100,
  );
  const tryOn = await asyncAlert<RunParams>({
    title: t("unlocks.title", { percentUnlock }),
    text: `<p>${t("unlocks.intro", { ts })}
   ${percentUnlock < 100 ? t("unlocks.greyed_out_help") : ""}</p> 
                       `,
    textAfterButtons: `<p> 
Your high score is ${gameState.highScore}. 
Click an item above to start a run with it.
                </p>`,
    actions,
    allowClose: true,
  });
  if (tryOn) {
    if (await confirmRestart()) {
      restart(tryOn);
    }
  }
}

export async function confirmRestart() {
  if (!gameState.currentLevel) return true;

  return asyncAlert({
    title: t("confirmRestart.title"),
    text: t("confirmRestart.text"),
    actions: [
      {
        value: true,
        text: t("confirmRestart.yes"),
      },
      {
        value: false,
        text: t("confirmRestart.no"),
      },
    ],
  });
}

export function toggleFullScreen() {
  try {
    if (document.fullscreenElement !== null) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    } else {
      const docel = document.documentElement;
      if (docel.requestFullscreen) {
        docel.requestFullscreen();
      } else if (docel.webkitRequestFullscreen) {
        docel.webkitRequestFullscreen();
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

const pressed: { [k: string]: number } = {
  ArrowLeft: 0,
  ArrowRight: 0,
  Shift: 0,
};

export function setKeyPressed(key: string, on: 0 | 1) {
  pressed[key] = on;
  gameState.keyboardPuckSpeed =
    ((pressed.ArrowRight - pressed.ArrowLeft) *
      (1 + pressed.Shift * 2) *
      gameState.gameZoneWidth) /
    50;
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
    toggleFullScreen();
  } else if (e.key in pressed) {
    setKeyPressed(e.key, 1);
  }
  if (e.key === " " && !alertsOpen) {
    if (gameState.running) {
      pause(true);
    } else {
      play();
    }
  } else {
    return;
  }
  e.preventDefault();
});

document.addEventListener("keyup", async (e) => {
  const focused = document.querySelector("button:focus");
  if (e.key in pressed) {
    setKeyPressed(e.key, 0);
  } else if (
    e.key === "ArrowDown" &&
    focused?.nextElementSibling?.tagName === "BUTTON"
  ) {
    (focused?.nextElementSibling as HTMLButtonElement)?.focus();
  } else if (
    e.key === "ArrowUp" &&
    focused?.previousElementSibling?.tagName === "BUTTON"
  ) {
    (focused?.previousElementSibling as HTMLButtonElement)?.focus();
  } else if (e.key === "Escape" && closeModal) {
    closeModal();
  } else if (e.key === "Escape" && gameState.running) {
    pause(true);
  } else if (e.key.toLowerCase() === "m" && !alertsOpen) {
    openSettingsPanel().then();
  } else if (e.key.toLowerCase() === "s" && !alertsOpen) {
    openScorePanel().then();
  } else if (e.key.toLowerCase() === "r" && !alertsOpen) {
    if (await confirmRestart()) {
      restart({ levelToAvoid: currentLevelInfo(gameState).name });
    }
  } else {
    return;
  }
  e.preventDefault();
});

export const gameState = newGameState({});

export function restart(params: RunParams) {
  Object.assign(gameState, newGameState(params));
  pauseRecording();
  setLevel(gameState, 0);
}

restart({});
fitSize();
tick();

// @ts-ignore
// window.stressTest= ()=>restart({level:'Shark',perks:{base_combo:100, pierce:10, multiball:8}})
window.stressTest = () =>
  restart({ level: "Shark", perks: { sapper: 2, pierce: 10, multiball: 3 } });
