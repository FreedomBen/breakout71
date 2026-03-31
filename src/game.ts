import {
  allLevels,
  allLevelsAndIcons,
  appVersion,
  icons,
  upgrades,
} from "./loadGameData";
import {
  Ball,
  Coin,
  GameState,
  LightFlash,
  OptionId,
  ParticleFlash,
  PerksMap,
  RunParams,
  TextFlash,
} from "./types";
import { getAudioContext, playPendingSounds } from "./sounds";
import {
  currentLevelInfo,
  describeLevel,
  getRowColIndex,
  highScoreText,
  hoursSpentPlaying,
  sample,
  sumOfValues,
} from "./game_utils";

import "./PWA/sw_loader";
import { getCurrentLang, languages, t } from "./i18n/i18n";
import {
  commitSettingsChangesToLocalStorage,
  cycleMaxCoins,
  getCurrentMaxCoins,
  getCurrentMaxParticles,
  getSettingValue,
  getTotalScore,
  setSettingValue,
} from "./settings";
import {
  forEachLiveOne,
  gameStateTick,
  liveCount,
  normalizeGameState,
  setLevel,
  setMousePos,
} from "./gameStateMutators";
import {
  backgroundCanvas,
  gameCanvas,
  getHaloScale,
  haloCanvas,
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
import { getPixelRatio, isOptionOn, options, toggleOption } from "./options";
import { clamp, extractLinkFromText, miniMarkDown } from "./pure_functions";
import { helpMenuEntry } from "./help";
import { creativeMode } from "./creative";
import { hideAnyTooltip, setupTooltips } from "./tooltip";
import { startingPerkMenuButton } from "./startingPerks";
import "./migrations";
import { getHistory } from "./gameOver";
import { generateSaveFileContent } from "./generateSaveFileContent";
import { runHistoryViewerMenuEntry } from "./runHistoryViewer";
import { openScorePanel } from "./openScorePanel";
import { monitorLevelsUnlocks } from "./monitorLevelsUnlocks";
import { levelEditorMenuEntry } from "./levelEditor";
import { categories } from "./upgrades";
import { reasonLevelIsLocked } from "./get_level_unlock_condition";
import { frameStarted, getWorstFPSAndReset, startWork } from "./fps";

export async function play() {
  if (await applyFullScreenChoice()) return;
  if (gameState.running) return;
  gameState.running = true;
  gameState.ballStickToPuck = false;

  startRecordingGame(gameState);
  getAudioContext()?.resume();
  resumeRecording();
  hideAnyTooltip();
  // document.body.classList[gameState.running ? 'add' : 'remove']('running')
}

export function pause(playerAskedForPause: boolean) {
  if (!gameState.running) return;

  if (gameState.pauseTimeout && playerAskedForPause) {
    return;
  }

  if (gameState.startParams.computer_controlled) {
    if (gameState.startParams?.computer_controlled) {
      play();
    }
    return;
  }
  const stop = () => {
    gameState.running = false;

    setTimeout(() => {
      if (!gameState.running) getAudioContext()?.suspend();
    }, 1000);

    pauseRecording();
    if (gameState.pauseTimeout) {
      // In case an instant pause was requested while a delayed pause was pending
      clearTimeout(gameState.pauseTimeout);
      gameState.pauseTimeout = null;
    }
    gameState.needsRender = true;
  };

  if (playerAskedForPause) {
    // Pausing many times in a run will make pause slower
    gameState.pauseUsesDuringRun++;
    gameState.pauseTimeout = setTimeout(
      stop,
      Math.min(Math.max(0, gameState.pauseUsesDuringRun - 5) * 50, 500),
    );
  } else {
    stop();
  }

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
  hideAnyTooltip();
}

export const fitSize = (gameState: GameState) => {
  if (!gameState) throw new Error("Missign game state");
  const past_off = gameState.offsetXRoundedDown,
    past_width = gameState.gameZoneWidthRoundedUp,
    past_heigh = gameState.gameZoneHeight;

  const width = Math.floor(window.innerWidth * getPixelRatio()),
    height = Math.floor(window.innerHeight * getPixelRatio());

  gameState.canvasWidth = width;
  gameState.canvasHeight = height;
  gameCanvas.width = width;
  gameCanvas.height = height;
  backgroundCanvas.width = width;
  backgroundCanvas.height = height;
  const haloScale = getHaloScale();
  haloCanvas.width = width / haloScale;
  haloCanvas.height = height / haloScale;

  gameState.gameZoneHeight = isOptionOn("mobile-mode")
    ? Math.floor(height * 0.8)
    : height;

  const baseWidth = Math.round(
    Math.min(
      gameState.canvasWidth,
      (gameState.gameZoneHeight *
        0.73 *
        (gameState.gridSize + gameState.perks.unbounded * 2)) /
        gameState.gridSize,
    ),
  );

  // in case getPixelRatio changed value
  gameState.ballSize = Math.ceil(20 * getPixelRatio());
  gameState.coinSize = Math.ceil(14 * getPixelRatio());
  gameState.puckHeight = Math.ceil(20 * getPixelRatio());
  forEachLiveOne(gameState.coins, (b) => (b.size = gameState.coinSize));

  gameState.brickWidth =
    Math.floor(
      baseWidth / (gameState.gridSize + gameState.perks.unbounded * 2) / 2,
    ) * 2;

  gameState.gameZoneWidth = gameState.brickWidth * gameState.gridSize;
  gameState.offsetX = Math.floor(
    (gameState.canvasWidth - gameState.gameZoneWidth) / 2,
  );
  // Space between left side and border
  gameState.offsetXRoundedDown =
    gameState.offsetX - gameState.perks.unbounded * gameState.brickWidth;
  if (
    gameState.offsetX <
    gameState.ballSize + gameState.perks.unbounded * 2 * gameState.brickWidth
  )
    gameState.offsetXRoundedDown = 0;
  gameState.gameZoneWidthRoundedUp = width - 2 * gameState.offsetXRoundedDown;
  backgroundCanvas.title = "resized";
  // Ensure puck stays within bounds
  setMousePos(gameState, gameState.puckPosition);

  function mapXY(item: ParticleFlash | TextFlash | LightFlash) {
    item.x =
      gameState.offsetXRoundedDown +
      ((item.x - past_off) / past_width) * gameState.gameZoneWidthRoundedUp;
    item.y = (item.y / past_heigh) * gameState.gameZoneHeight;
  }

  function mapXYPastCoord(coin: Coin | Ball) {
    coin.x =
      gameState.offsetXRoundedDown +
      ((coin.x - past_off) / past_width) * gameState.gameZoneWidthRoundedUp;
    coin.y = (coin.y / past_heigh) * gameState.gameZoneHeight;
    coin.previousX = coin.x;
    coin.previousY = coin.y;
  }

  gameState.balls.forEach(mapXYPastCoord);
  forEachLiveOne(gameState.coins, mapXYPastCoord);
  forEachLiveOne(gameState.particles, mapXY);
  forEachLiveOne(gameState.texts, mapXY);
  forEachLiveOne(gameState.lights, mapXY);
  pause(true);
  // For safari mobile https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`,
  );
};
window.addEventListener("resize", () => fitSize(gameState));
window.addEventListener("fullscreenchange", () => fitSize(gameState));

setInterval(() => {
  // Sometimes, the page changes size without triggering the event (when switching to fullscreen, closing debug panel...)

  const width = Math.floor(window.innerWidth * getPixelRatio()),
    height = Math.floor(window.innerHeight * getPixelRatio());

  if (width !== gameState.canvasWidth || height !== gameState.canvasHeight)
    fitSize(gameState);
}, 1000);

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
    setMousePos(
      gameState,
      gameState.puckPosition + e.movementX * getPixelRatio(),
    );
  } else {
    setMousePos(gameState, e.clientX * getPixelRatio());
  }
});

let timers = [];
function startPlayCountDown() {
  stopPlayCountDown();

  gameState.startCountDown = 3;
  gameState.needsRender = true;

  timers.push(
    setTimeout(() => {
      gameState.startCountDown = 2;
      gameState.needsRender = true;
    }, 1000),
  );
  timers.push(
    setTimeout(() => {
      gameState.startCountDown = 1;
      gameState.needsRender = true;
    }, 2000),
  );
  timers.push(
    setTimeout(() => {
      gameState.startCountDown = 0;
      play();
    }, 3000),
  );
}
function stopPlayCountDown() {
  if (!timers.length) return;

  gameState.startCountDown = 0;
  timers.forEach((id) => clearTimeout(id));
  timers.length = 0;
}
gameCanvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!e.touches?.length) return;
  setMousePos(gameState, e.touches[0].pageX * getPixelRatio());
  normalizeGameState(gameState);
  if (gameState.levelTime || !isOptionOn("touch_delayed_start")) {
    play();
  } else {
    //   start play sequence
    startPlayCountDown();
  }
});
gameCanvas.addEventListener("touchend", (e) => {
  stopPlayCountDown();
  e.preventDefault();
  pause(true);
});
gameCanvas.addEventListener("touchcancel", (e) => {
  stopPlayCountDown();
  e.preventDefault();
  pause(true);
});
gameCanvas.addEventListener("touchmove", (e) => {
  if (!e.touches?.length) return;
  setMousePos(gameState, e.touches[0].pageX * getPixelRatio());
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

export function tick() {
  frameStarted();
  startWork("physics");
  const currentTick = performance.now();
  const timeDeltaMs = currentTick - gameState.lastTick;
  gameState.lastTick = currentTick;

  let frames = Math.min(4, timeDeltaMs / (1000 / 60));
  if (gameState.keyboardPuckSpeed) {
    setMousePos(
      gameState,
      gameState.puckPosition + gameState.keyboardPuckSpeed,
    );
  }
  if (gameState.perks.superhot) {
    frames *= clamp(
      Math.abs(gameState.puckPosition - gameState.lastPuckPosition) / 5,
      0.2 / gameState.perks.superhot,
      1,
    );
  }

  normalizeGameState(gameState);
  if (gameState.running) {
    gameState.levelTime += timeDeltaMs * frames;
    gameState.runStatistics.runTime += timeDeltaMs * frames;
    const maxBallSpeed =
      Math.sqrt(
        Math.max(0, ...gameState.balls.map(({ vx, vy }) => vx * vx + vy * vy)),
      ) * frames;
    const steps = Math.ceil(maxBallSpeed / 8);
    for (let i = 0; i < steps; i++) {
      gameStateTick(gameState, frames / steps);
    }
  }
  gameState.lastPuckPosition = gameState.puckPosition;

  if (gameState.running || gameState.needsRender) {
    gameState.needsRender = false;
    render(gameState);
  }
  startWork("record video");
  if (gameState.running) {
    recordOneFrame(gameState);
  }
  startWork("sound");
  if (isOptionOn("sound")) {
    playPendingSounds(gameState);
  }
  startWork("idle");

  requestAnimationFrame(tick);
}

setInterval(() => {
  monitorLevelsUnlocks(gameState);
}, 500);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause(true);
  }
});
if (getSettingValue("score-opened", 0) < 3) {
  scoreDisplay.classList.add("button-look");
}
const menuDisplay = document.getElementById("menu") as HTMLButtonElement;
if (getSettingValue("menu-opened", 0) < 3) {
  menuDisplay.classList.add("button-look");
}

function scoreOpen(e) {
  e.preventDefault();
  if (!alertsOpen) {
    setSettingValue("score-opened", getSettingValue("score-opened", 0) + 1);
    openScorePanel(gameState);
  }
}

scoreDisplay.addEventListener("click", scoreOpen);
scoreDisplay.addEventListener("mousedown", scoreOpen);

menuDisplay.addEventListener("click", (e) => {
  e.preventDefault();
  if (!alertsOpen) {
    setSettingValue("menu-opened", getSettingValue("menu-opened", 0) + 1);
    openMainMenu();
  }
});

export const creativeModeThreshold = Math.max(
  ...upgrades.map((u) => u.threshold),
);

export async function openMainMenu() {
  pause(true);

  const actions: AsyncAlertAction<() => void>[] = [
    {
      icon: icons["icon:new_run"],
      text: t("main_menu.normal"),
      help: highScoreText() || t("main_menu.normal_help"),
      value: () => {
        restart({
          levelToAvoid: currentLevelInfo(gameState).name,
        });
      },
    },
    creativeMode(gameState),
    runHistoryViewerMenuEntry(),
    levelEditorMenuEntry(),
    {
      icon: icons["icon:unlocked_upgrades"],
      text: t("unlocks.upgrades"),
      help: t("main_menu.unlocks_help"),
      value() {
        openUnlockedUpgradesList();
      },
    },
    {
      icon: icons["icon:unlocked_levels"],
      text: t("unlocks.levels"),
      help: t("main_menu.unlocks_help"),
      value() {
        openUnlockedLevelsList();
      },
    },

    ...donationNag(gameState),
    {
      text: t("main_menu.settings_title"),
      help: t("main_menu.settings_help"),
      icon: icons["icon:settings"],
      value() {
        openSettingsMenu();
      },
    },
    helpMenuEntry(),
  ];

  const cb = await asyncAlert<() => void>({
    title: t("main_menu.title"),
    content: [
      ...actions,

      `<p>       
        <span>Made in France by <a href="https://lecaro.me">Renan LE CARO</a>.</span> 
        <a href="https://paypal.me/renanlecaro" target="_blank">Donate</a>
        <a href="https://discord.gg/bbcQw4x5zA" target="_blank">Discord</a>
        <a href="https://f-droid.org/en/packages/me.lecaro.breakout/" target="_blank">F-Droid</a>
        <a href="https://play.google.com/store/apps/details?id=me.lecaro.breakout" target="_blank">Google Play</a>
        <a href="https://renanlecaro.itch.io/breakout71" target="_blank">itch.io</a> 
        <a href="https://gitlab.com/lecarore/breakout71" target="_blank">Gitlab</a>
        <a href="https://hosted.weblate.org/projects/breakout-71/" target="_blank">Weblate</a>
        <a href="https://breakout.lecaro.me/" target="_blank">Web version</a>
        <a href="https://news.ycombinator.com/item?id=43183131" target="_blank">HackerNews</a>
        <a href="https://breakout.lecaro.me/privacy.html" target="_blank">Privacy Policy</a>
        <a href="https://archive.lecaro.me/public-files/b71/" target="_blank">Archives</a>
        <span>v.${appVersion}</span>
      </p>`,
    ],
    allowClose: true,
  });
  if (cb) {
    cb();
    gameState.needsRender = true;
  }
}

function donationNag(gameState) {
  if (!isOptionOn("donation_reminder")) return [];
  const hours = hoursSpentPlaying();
  return [
    {
      text: t("main_menu.donate", { hours }),
      help: t("main_menu.donate_help", {
        suggestion: Math.min(20, Math.max(1, 0.2 * hours)).toFixed(0),
      }),
      icon: icons["icon:premium"],
      value() {
        window.open("https://paypal.me/renanlecaro", "_blank");
      },
    },
  ];
}

async function openSettingsMenu() {
  pause(true);

  const actions: AsyncAlertAction<() => void>[] = [startingPerkMenuButton()];

  actions.push({
    icon: icons[
      languages.find((l) => l.value === getCurrentLang())?.levelName || ""
    ],
    text: t("settings.language"),
    help: t("settings.language_help"),
    async value() {
      const pick = await asyncAlert({
        title: t("settings.language"),
        content: [
          t("settings.language_help"),
          ...languages.map((l) => ({ ...l, icon: icons[l.levelName] })),
        ],
        allowClose: true,
      });
      if (
        pick &&
        pick !== getCurrentLang() &&
        (await confirmRestart(gameState))
      ) {
        setSettingValue("lang", pick);
        commitSettingsChangesToLocalStorage();
        window.location.reload();
      }
    },
  });
  for (const key of Object.keys(options) as OptionId[]) {
    // Skip displaying option if it does nothing
    if (window.devicePixelRatio === 1 && key == "match_pixel_ratio") continue;
    if (options[key]) {
      actions.push({
        icon: isOptionOn(key)
          ? icons["icon:checkmark_checked"]
          : icons["icon:checkmark_unchecked"],
        text: options[key].name,
        help: options[key].help,
        disabled:
          (isOptionOn("basic") &&
            [
              "extra_bright",
              "contrast",
              "smooth_lighting",
              "precise_lighting",
              "probabilistic_lighting",
            ].includes(key)) ||
          false,
        value: () => {
          toggleOption(key);
          fitSize(gameState);
          applyFullScreenChoice();
          openSettingsMenu();
        },
      });
    }
  }
  actions.push({
    icon: icons["icon:download"],
    text: t("settings.download_save_file"),
    help: t("settings.download_save_file_help"),
    async value() {
      const dlLink = document.createElement("a");
      const obj = {
        fileType: "B71-save-file",
        appVersion,
        payload: generateSaveFileContent(),
      };
      const json = JSON.stringify(obj, null, 2);
      dlLink.setAttribute(
        "href",
        "data:application/json;charset=utf-8," + encodeURIComponent(json),
      );

      dlLink.setAttribute(
        "download",
        "b71-save-" +
          new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[^0-9]+/gi, "-") +
          ".json",
      );
      document.body.appendChild(dlLink);
      dlLink.click();
      setTimeout(() => document.body.removeChild(dlLink), 1000);
    },
  });

  actions.push({
    icon: icons["icon:upload"],
    text: t("settings.load_save_file"),
    help: t("settings.load_save_file_help"),
    async value() {
      if (!document.getElementById("save_file_picker")) {
        let input: HTMLInputElement = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("id", "save_file_picker");
        input.setAttribute("accept", ".b71,.json");
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
              const { fileType, signedPayload, payload } = JSON.parse(content);
              if (fileType !== "B71-save-file")
                throw new Error("Not a B71 save file");
              if (payload) {
                localStorage.clear();
                for (let key in payload) {
                  localStorage.setItem(key, JSON.stringify(payload[key]));
                }
              } else if (signedPayload) {
                //   Old file format
                const localStorageContent = JSON.parse(signedPayload);
                localStorage.clear();
                for (let key in localStorageContent) {
                  localStorage.setItem(key, localStorageContent[key]);
                }
              }
              await asyncAlert({
                title: t("settings.save_file_loaded"),
                content: [
                  t("settings.save_file_loaded_help"),
                  { text: t("settings.save_file_loaded_ok") },
                ],
              });
              window.location.reload();
            }
          } catch (e: any) {
            await asyncAlert({
              title: t("settings.save_file_error"),
              content: [e.message, { text: t("settings.save_file_loaded_ok") }],
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
    icon: icons["icon:coins"],
    text: t("settings.max_coins", { max: getCurrentMaxCoins() }),
    help: t("settings.max_coins_help"),
    async value() {
      cycleMaxCoins();
      await openSettingsMenu();
    },
  });

  actions.push({
    icon: icons["icon:reset"],
    text: t("settings.reset"),
    help: t("settings.reset_help"),
    async value() {
      if (
        await asyncAlert({
          title: t("settings.reset"),
          content: [
            t("settings.reset_instruction"),
            {
              text: t("settings.reset_confirm"),
              value: true,
            },
            {
              text: t("settings.reset_cancel"),
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
    text: t("settings.autoplay"),
    help: t("settings.autoplay_help"),
    async value() {
      startComputerControlledGame(false);
    },
  });
  actions.push({
    text: t("settings.stress_test"),
    help: t("settings.stress_test_help"),
    async value() {
      startComputerControlledGame(true);
    },
  });

  const cb = await asyncAlert<() => void>({
    title: t("main_menu.settings_title"),
    content: [t("main_menu.settings_help"), ...actions],
    allowClose: true,
    className: "settings",
  });
  if (cb) {
    cb();
    gameState.needsRender = true;
  }
}

async function applyFullScreenChoice() {
  try {
    if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
      return false;
    }

    if (document.fullscreenElement !== null && !isOptionOn("fullscreen")) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      } else if (document.webkitCancelFullScreen) {
        await document.webkitCancelFullScreen();
        return true;
      }
    } else if (isOptionOn("fullscreen") && !document.fullscreenElement) {
      const docel = document.documentElement;
      if (docel.requestFullscreen) {
        await docel.requestFullscreen();
        return true;
      } else if (docel.webkitRequestFullscreen) {
        await docel.webkitRequestFullscreen();
        return true;
      }
    }
  } catch (e) {
    console.warn(e);
  }
  return false;
}

async function openUnlockedUpgradesList() {
  const ts = getTotalScore();
  const upgradeActions = upgrades
    .map(({ name, id, threshold, help, category, fullHelp }) => ({
      text: name,
      disabled: ts < threshold,
      value: {
        perks: { [id]: 1 },
        level: allLevelsAndIcons.find((l) => l.name === "icon:" + id),
      } as RunParams,
      icon: icons["icon:" + id],
      category,
      help:
        ts < threshold
          ? t("unlocks.minTotalScore", { score: threshold })
          : help(1),
      tooltip: ts < threshold ? "" : fullHelp(1) + " [id:" + id + "]",
      threshold,
      className: "upgrade choice " + (ts > threshold ? "used" : ""),
      actionLabel: t("unlocks.use"),
    }))
    .sort((a, b) => a.threshold - b.threshold);

  const tryOn = await asyncAlert<RunParams>({
    title: t("unlocks.title_upgrades", {
      unlocked: upgradeActions.filter((a) => !a.disabled).length,
      out_of: upgradeActions.length,
    }),
    content: [
      t("unlocks.intro", { ts }),
      upgradeActions.find((u) => u.disabled)
        ? t("unlocks.greyed_out_help")
        : "",
      miniMarkDown(t("unlocks.category.beginner")),
      ...upgradeActions.filter((u) => u.category == categories.beginner),
      miniMarkDown(t("unlocks.category.combo")),
      ...upgradeActions.filter((u) => u.category == categories.combo),
      miniMarkDown(t("unlocks.category.combo_boost")),
      ...upgradeActions.filter((u) => u.category == categories.combo_boost),
      miniMarkDown(t("unlocks.category.simple")),
      ...upgradeActions.filter((u) => u.category == categories.simple),
      miniMarkDown(t("unlocks.category.advanced")),
      ...upgradeActions.filter((u) => u.category == categories.advanced),
    ],
    allowClose: true,
    // className: "actionsAsGrid large",
  });
  if (tryOn) {
    if (await confirmRestart(gameState)) {
      restart({ ...tryOn });
    }
  }
}

async function openUnlockedLevelsList() {
  const unlockedBefore = new Set(
    getSettingValue("breakout_71_unlocked_levels", []),
  );
  const levelActions = allLevels.map((l, li) => {
    const lockedBecause = unlockedBefore.has(l.name)
      ? null
      : reasonLevelIsLocked(li, l.name, getHistory(), true);

    return {
      text: l.name,
      disabled: !!lockedBecause,
      value: { level: l } as RunParams,
      icon: icons[l.name],
      help: lockedBecause?.text || describeLevel(l),
      className: "upgrade choice " + (!lockedBecause ? "used" : ""),
      link: extractLinkFromText(l.credit || ""),
      tooltip: l.credit,
      actionLabel: t("unlocks.try"),
    };
  });

  const tryOn = await asyncAlert<RunParams>({
    title: t("unlocks.level", {
      unlocked: levelActions.filter((a) => !a.disabled).length,
      out_of: levelActions.length,
    }),
    content: [...levelActions],
    allowClose: true,
    className: "actionsAsGrid large",
  });
  if (tryOn) {
    if (await confirmRestart(gameState)) {
      restart({ ...tryOn });
    }
  }
}

export async function confirmRestart(gameState) {
  if (!gameState.currentLevel) return true;
  if (alertsOpen) return true;
  pause(true);
  return asyncAlert({
    title: t("confirmRestart.title"),
    content: [
      t("confirmRestart.text"),
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

document.addEventListener("keydown", async (e) => {
  if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
    toggleOption("fullscreen");
    applyFullScreenChoice();
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

let pageLoad = new Date();
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
    openMainMenu().then();
  } else if (e.key.toLowerCase() === "s" && !alertsOpen) {
    openScorePanel(gameState).then();
  } else if (
    e.key.toLowerCase() === "r" &&
    !alertsOpen &&
    pageLoad < Date.now() - 500
  ) {
    if (gameState.startParams.computer_controlled) {
      return startComputerControlledGame(gameState.startParams.stress);
    }
    // When doing ctrl + R in dev to refresh, i don't want to instantly restart a run
    if (await confirmRestart(gameState)) {
      restart({
        levelToAvoid: currentLevelInfo(gameState).name,
      });
    }
  } else {
    return;
  }
  e.preventDefault();
});

export const gameState = newGameState({});

export function restart(params: RunParams) {
  getWorstFPSAndReset();
  Object.assign(gameState, newGameState(params));
  // Recompute brick size according to level
  fitSize(gameState);

  pauseRecording();
  setLevel(gameState, 0);
  if (params?.computer_controlled) {
    play();
  }
}
if (window.location.search.match(/autoplay|stress/)) {
  startComputerControlledGame(window.location.search.includes("stress"));
} else {
  restart({});
}

export function startComputerControlledGame(stress: boolean = false) {
  const perks: Partial<PerksMap> = { base_combo: 20, pierce: 3 };
  if (stress) {
    Object.assign(perks, {
      base_combo: 150,
      pierce: 20,
      rainbow: 3,
      sapper: 2,
      etherealcoins: 1,
      bricks_attract_ball: 1,
      respawn: 3,
    });
  } else {
    for (let i = 0; i < 10; i++) {
      const u = sample(upgrades);
      perks[u.id] ||= Math.floor(Math.random() * u.max) + 1;
      if (u.requires) {
        perks[u.requires] ||= 1;
      }
    }
    perks.superhot = 0;
  }
  restart({
    level: sample(allLevels.filter((l) => l.color === "#000000")),
    computer_controlled: true,
    perks,
    stress,
  });
}

tick();
setupTooltips();
document
  .getElementById("menu")
  ?.setAttribute("data-tooltip", t("play.menu_tooltip"));
