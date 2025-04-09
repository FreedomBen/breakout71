import { allLevels, appVersion, icons, upgrades } from "./loadGameData";
import {
  Ball,
  Coin,
  GameState,
  LightFlash,
  OptionId,
  ParticleFlash,
  PerkId,
  RunParams,
  TextFlash,
} from "./types";
import { getAudioContext, playPendingSounds } from "./sounds";
import {
  currentLevelInfo,
  describeLevel,
  getRowColIndex,
  highScoreText,
  levelsListHTMl,
  max_levels,
  pickedUpgradesHTMl,
  reasonLevelIsLocked,
} from "./game_utils";

import "./PWA/sw_loader";
import { getCurrentLang, t } from "./i18n/i18n";
import {
  cycleMaxCoins,
  cycleMaxParticles,
  getCurrentMaxCoins,
  getCurrentMaxParticles,
  getSettingValue,
  getTotalScore,
  setSettingValue,
} from "./settings";
import {
  forEachLiveOne,
  gameStateTick,
  normalizeGameState,
  pickRandomUpgrades,
  setLevel,
  setMousePos,
} from "./gameStateMutators";
import {
  backgroundCanvas,
  gameCanvas,
  haloCanvas,
  haloScale,
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
  requiredAsyncAlert,
} from "./asyncAlert";
import { isOptionOn, options, toggleOption } from "./options";
import { hashCode } from "./getLevelBackground";
import {
  catchRateBest, catchRateGood,
  hoursSpentPlaying,
  levelTimeBest,
  levelTimeGood, missesBest, missesGood,
  wallBouncedBest,
  wallBouncedGood
} from "./pure_functions";
import { helpMenuEntry } from "./help";
import { creativeMode } from "./creative";
import { setupTooltips } from "./tooltip";
import { startingPerkMenuButton } from "./startingPerks";
import "./migrations";
import { getHistory } from "./gameOver";
import { generateSaveFileContent } from "./generateSaveFileContent";
import { runHistoryViewerMenuEntry } from "./runHistoryViewer";
import { getNearestUnlockHTML, openScorePanel } from "./openScorePanel";
import { monitorLevelsUnlocks } from "./monitorLevelsUnlocks";

export async function play() {
  if (await applyFullScreenChoice()) return;
  if (gameState.running) return;
  gameState.running = true;
  gameState.ballStickToPuck = false;

  startRecordingGame(gameState);
  getAudioContext()?.resume();
  resumeRecording();
  // document.body.classList[gameState.running ? 'add' : 'remove']('running')
}

export function pause(playerAskedForPause: boolean) {
  if (!gameState.running) return;
  if (gameState.pauseTimeout) return;

  const stop = () => {
    gameState.running = false;

    setTimeout(() => {
      if (!gameState.running) getAudioContext()?.suspend();
    }, 1000);

    pauseRecording();
    gameState.pauseTimeout = null;
    // document.body.className = gameState.running ? " running " : " paused ";
    scoreDisplay.className = "";
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
}

export const fitSize = () => {
  const past_off = gameState.offsetXRoundedDown,
    past_width = gameState.gameZoneWidthRoundedUp,
    past_heigh = gameState.gameZoneHeight;

  const { width, height } = gameCanvas.getBoundingClientRect();
  gameState.canvasWidth = width;
  gameState.canvasHeight = height;
  gameCanvas.width = width;
  gameCanvas.height = height;
  // ctx.fillStyle = currentLevelInfo(gameState)?.color || "black";
  // ctx.globalAlpha = 1;
  // ctx.fillRect(0, 0, width, height);
  backgroundCanvas.width = width;
  backgroundCanvas.height = height;

  haloCanvas.width = width / haloScale;
  haloCanvas.height = height / haloScale;

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

  let timeGain = "",
    catchGain = "",
    wallHitsGain = "",
    missesGain = "";

  if (gameState.levelWallBounces < wallBouncedBest) {
    repeats++;
    gameState.rerolls++;
    wallHitsGain = t("level_up.plus_one_upgrade_and_reroll");
  } else if (gameState.levelWallBounces < wallBouncedGood) {
    repeats++;
    wallHitsGain = t("level_up.plus_one_upgrade");
  }
  if (gameState.levelTime < levelTimeBest * 1000) {
    repeats++;
    gameState.rerolls++;
    timeGain = t("level_up.plus_one_upgrade_and_reroll");
  } else if (gameState.levelTime < levelTimeGood * 1000) {
    repeats++;
    timeGain = t("level_up.plus_one_upgrade");
  }
  if (catchRate > catchRateBest/100) {
    repeats++;
    gameState.rerolls++;
    catchGain = t("level_up.plus_one_upgrade_and_reroll");
  } else if (catchRate > catchRateGood/100) {
    repeats++;
    catchGain = t("level_up.plus_one_upgrade");
  }
  if (gameState.levelMisses < missesBest) {
    repeats++;
    gameState.rerolls++;
    missesGain = t("level_up.plus_one_upgrade_and_reroll");
  } else if (gameState.levelMisses < missesGood) {
    repeats++;
    missesGain = t("level_up.plus_one_upgrade");
  }

  while (repeats--) {
    const actions: Array<{
      text: string;
      icon: string;
      value: PerkId | "reroll";
      help: string;
    }> = pickRandomUpgrades(
      gameState,
      3 + gameState.perks.one_more_choice - gameState.perks.instant_upgrade,
    );
    if (!actions.length) break;

    if (gameState.rerolls)
      actions.push({
        text: t("level_up.reroll", { count: gameState.rerolls }),
        help: t("level_up.reroll_help"),
        value: "reroll" as const,
        icon: icons["icon:reroll"],
      });

    const compliment =
      (timeGain &&
        catchGain &&
        missesGain &&
        wallHitsGain &&
        t("level_up.compliment_perfect")) ||
      ((timeGain || catchGain || missesGain || wallHitsGain) &&
        t("level_up.compliment_good")) ||
      t("level_up.compliment_advice");

    const upgradeId = await requiredAsyncAlert<PerkId | "reroll">({
      title:
        t("level_up.pick_upgrade_title") +
        (repeats ? " (" + (repeats + 1) + ")" : ""),
      content: [
        `<p>${t("level_up.before_buttons", {
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
        </p>
  <p>${t("level_up.after_buttons", {
    level: gameState.currentLevel + 1,
    max: max_levels(gameState),
  })} </p>
        <p>${levelsListHTMl(gameState, gameState.currentLevel + 1)}</p>
`,
        ...actions,

        pickedUpgradesHTMl(gameState),
        getNearestUnlockHTML(gameState),

        `<div id="level-recording-container"></div>`,
      ],
    });

    if (upgradeId === "reroll") {
      repeats++;
      gameState.rerolls--;
    } else {
      gameState.perks[upgradeId]++;
      if (upgradeId === "instant_upgrade") {
        repeats += 2;
      }
      gameState.runStatistics.upgrades_picked++;
    }
  }
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
  normalizeGameState(gameState);
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
  if (isOptionOn("sound")) {
    playPendingSounds(gameState);
  }

  requestAnimationFrame(tick);
  FPSCounter++;
}

let FPSCounter = 0;
export let lastMeasuredFPS = 60;

setInterval(() => {
  lastMeasuredFPS = FPSCounter;
  FPSCounter = 0;
}, 1000);

setInterval(() => {
  monitorLevelsUnlocks(gameState);
}, 500);

window.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause(true);
  }
});

scoreDisplay.addEventListener("click", (e) => {
  e.preventDefault();
  if (!alertsOpen) {
    openScorePanel(gameState);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause(true);
  }
});

(document.getElementById("menu") as HTMLButtonElement).addEventListener(
  "click",
  (e) => {
    e.preventDefault();
    if (!alertsOpen) {
      openMainMenu();
    }
  },
);

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
    {
      icon: icons["icon:unlocks"],
      text: t("main_menu.unlocks"),
      help: t("main_menu.unlocks_help"),
      value() {
        openUnlocksList();
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
    content: [...actions,

      `<p>       
        <span>Made in France by <a href="https://lecaro.me">Renan LE CARO</a>.</span> 
        <a href="https://paypal.me/renanlecaro" target="_blank">Donate</a>
        <a href="https://discord.gg/bbcQw4x5zA" target="_blank">Discord</a>
        <a href="https://f-droid.org/en/packages/me.lecaro.breakout/" target="_blank">F-Droid</a>
        <a href="https://play.google.com/store/apps/details?id=me.lecaro.breakout" target="_blank">Google Play</a>
        <a href="https://renanlecaro.itch.io/breakout71" target="_blank">itch.io</a> 
        <a href="https://gitlab.com/lecarore/breakout71" target="_blank">Gitlab</a>
        <a href="https://breakout.lecaro.me/" target="_blank">Web version</a>
        <a href="https://news.ycombinator.com/item?id=43183131" target="_blank">HackerNews</a>
        <a href="https://breakout.lecaro.me/privacy.html" target="_blank">Privacy Policy</a>
        <a href="https://archive.lecaro.me/public-files/b71/" target="_blank">Archives</a>
        <span>v.${appVersion}</span>
      </p>`
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

  const languages = [
    {
      text: "English",
      value: "en",
      icon: icons["UK"],
    },
    {
      text: "Français",
      value: "fr",
      icon: icons["France"],
    },
  ];
  actions.push({
    icon: languages.find((l) => l.value === getCurrentLang())?.icon,
    text: t("main_menu.language"),
    help: t("main_menu.language_help"),
    async value() {
      const pick = await asyncAlert({
        title: t("main_menu.language"),
        content: [t("main_menu.language_help"), ...languages],
        allowClose: true,
      });
      if (
        pick &&
        pick !== getCurrentLang() &&
        (await confirmRestart(gameState))
      ) {
        setSettingValue("lang", pick);
        window.location.reload();
      }
    },
  });
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
          fitSize();
          applyFullScreenChoice();
          openSettingsMenu();
        },
      });
  }
  actions.push({
    icon: icons["icon:download"],
    text: t("main_menu.download_save_file"),
    help: t("main_menu.download_save_file_help"),
    async value() {
      const signedPayload = generateSaveFileContent();

      const dlLink = document.createElement("a");

      dlLink.setAttribute(
        "href",
        "data:application/json;base64," +
          btoa(
            JSON.stringify({
              fileType: "B71-save-file",
              appVersion,
              signedPayload,
              key: hashCode(
                "Security by obscurity, but really the game is oss so eh" +
                  signedPayload,
              ),
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
    icon: icons["icon:upload"],
    text: t("main_menu.load_save_file"),
    help: t("main_menu.load_save_file_help"),
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
              const {
                fileType,
                appVersion: fileVersion,
                signedPayload,
                key,
              } = JSON.parse(content);
              if (fileType !== "B71-save-file")
                throw new Error("Not a B71 save file");
              if (fileVersion > appVersion)
                throw new Error(
                  "Please update your app first, this file is for version " +
                    fileVersion +
                    " or newer.",
                );

              if (
                key !==
                hashCode(
                  "Security by obscurity, but really the game is oss so eh" +
                    signedPayload,
                )
              ) {
                throw new Error("Key does not match content.");
              }

              const localStorageContent = JSON.parse(signedPayload);
              localStorage.clear();
              for (let key in localStorageContent) {
                localStorage.setItem(key, localStorageContent[key]);
              }
              await asyncAlert({
                title: t("main_menu.save_file_loaded"),
                content: [
                  t("main_menu.save_file_loaded_help"),
                  { text: t("main_menu.save_file_loaded_ok") },
                ],
              });
              window.location.reload();
            }
          } catch (e: any) {
            await asyncAlert({
              title: t("main_menu.save_file_error"),
              content: [
                e.message,
                { text: t("main_menu.save_file_loaded_ok") },
              ],
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
    text: t("main_menu.max_coins", { max: getCurrentMaxCoins() }),
    help: t("main_menu.max_coins_help"),
    async value() {
      cycleMaxCoins();
      await openSettingsMenu();
    },
  });
  actions.push({
    icon: icons["icon:particles"],
    text: t("main_menu.max_particles", { max: getCurrentMaxParticles() }),
    help: t("main_menu.max_particles_help"),
    async value() {
      cycleMaxParticles();
      await openSettingsMenu();
    },
  });

  actions.push({
    icon: icons["icon:reset"],
    text: t("main_menu.reset"),
    help: t("main_menu.reset_help"),
    async value() {
      if (
        await asyncAlert({
          title: t("main_menu.reset"),
          content: [
            t("main_menu.reset_instruction"),
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

async function openUnlocksList() {
  const ts = getTotalScore();
  const hintField = isOptionOn("mobile-mode") ? "help" : "tooltip";

  const upgradeActions = upgrades
    .sort((a, b) => a.threshold - b.threshold)
    .map(({ name, id, threshold, icon, help }) => ({
      text: name,
      disabled: ts < threshold,
      value: { perks: { [id]: 1 } } as RunParams,
      icon,
      [hintField]:
        ts < threshold
          ? t("unlocks.minTotalScore", { score: threshold })
          : help(1),
    }));

  const unlockedBefore = new Set(
    getSettingValue("breakout_71_unlocked_levels", []),
  );
  const levelActions = allLevels.map((l, li) => {
    const lockedBecause = unlockedBefore.has(l.name)
      ? null
      : reasonLevelIsLocked(li, getHistory(), true);
    const percentUnlocked = lockedBecause?.reached
      ? `<span class="progress-inline"><span style="transform: scale(${Math.floor((lockedBecause.reached / lockedBecause.minScore) * 100) / 100},1)"></span></span>`
      : "";

    return {
      text: l.name + percentUnlocked,
      disabled: !!lockedBecause,
      value: { level: l.name } as RunParams,
      icon: icons[l.name],
      [hintField]: lockedBecause?.text || describeLevel(l),
    };
  });

  const tryOn = await asyncAlert<RunParams>({
    title: t("unlocks.title_upgrades", {
      unlocked: upgradeActions.filter((a) => !a.disabled).length,
      out_of: upgradeActions.length,
    }),
    content: [
      `<p>${t("unlocks.intro", { ts })}
   ${upgradeActions.find((u) => u.disabled) ? t("unlocks.greyed_out_help") : ""}</p>  `,
      ...upgradeActions,
      t("unlocks.level", {
        unlocked: levelActions.filter((a) => !a.disabled).length,
        out_of: levelActions.length,
      }),
      ...levelActions,
    ],
    allowClose: true,
    className: isOptionOn("mobile-mode") ? "" : "actionsAsGrid",
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
    openScorePanel().then();
  } else if (
    e.key.toLowerCase() === "r" &&
    !alertsOpen &&
    pageLoad < Date.now() - 500
  ) {
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
  // fitSize();
  Object.assign(gameState, newGameState(params));
  // Recompute brick size according to level
  fitSize();
  pauseRecording();
  setLevel(gameState, 0);
}

restart({});

tick();
setupTooltips();
document
  .getElementById("menu")
  ?.setAttribute("data-tooltip", t("play.menu_tooltip"));
