import { allLevels, appVersion, icons, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { GameState, RunHistoryItem } from "./types";
import { gameState, pause, restart } from "./game";
import {
  currentLevelInfo,
  describeLevel,
  pickedUpgradesHTMl,
} from "./game_utils";
import {
  askForPersistentStorage,
  getSettingValue,
  getTotalScore,
  setSettingValue,
} from "./settings";
import { stopRecording } from "./recording";
import { asyncAlert } from "./asyncAlert";
import { editRawLevelList } from "./levelEditor";
import { openCreativeModePerksPicker } from "./creative";
import {
  isLevelLocked,
  reasonLevelIsLocked,
} from "./get_level_unlock_condition";
import { getWorstFPSAndReset } from "./fps";
import {
  applySettingsChangeReco,
  settingsChangeRecommendations,
} from "./openUpgradesPicker";

export function addToTotalPlayTime(ms: number) {
  setSettingValue(
    "breakout_71_total_play_time",
    getSettingValue("breakout_71_total_play_time", 0) + ms,
  );
}

export async function gameOver(title: string, intro: string) {
  if (!gameState.running) return;
  // Ignore duplicated calls, can happen when ticking is split in multiple updates because the ball goes fast
  if (gameState.isGameOver) return;
  gameState.isGameOver = true;
  pause(false);
  askForPersistentStorage();
  stopRecording();
  addToTotalPlayTime(gameState.runStatistics.runTime);

  if (typeof gameState.startParams.isEditorTrialRun === "number") {
    editRawLevelList(gameState.startParams.isEditorTrialRun);
    restart({});
    return;
  }

  if (gameState.startParams.isCreativeRun) {
    openCreativeModePerksPicker();
    restart({});
    return;
  }

  // unlocks
  const endTs = getTotalScore();
  const startTs = endTs - gameState.score;
  const unlockedPerks = upgrades.filter(
    (o) => o.threshold > startTs && o.threshold < endTs,
  );
   const levelStats= t("gameOver.lastLevelSummary", {
          catchRate:Math.floor(gameState.levelCoughtCoins / (gameState.levelSpawnedCoins||1) * 100),
          levelCoughtCoins: gameState.levelCoughtCoins,
          levelSpawnedCoins: gameState.levelSpawnedCoins,
          duration:Math.ceil(gameState.levelTime / 1000),
          levelMisses: gameState.levelMisses ,
          level:(gameState.currentLevel+1)
        })

  let unlocksInfo = unlockedPerks.length
    ? `

    <h2>${unlockedPerks.length === 1 ? t("gameOver.unlocked_perk") : t("gameOver.unlocked_perk_plural", { count: unlockedPerks.length })}</h2>
    
      ${unlockedPerks
        .map(
          (u) => ` 
       <div class="upgrade used">
          ${icons["icon:" + u.id]}
          <p>
          <strong>${u.name}</strong>
           ${u.help(1)}
        </p>  
      </div>
      `,
        )
        .join("\n")}       
    `
    : "";

  // Avoid the sad sound right as we restart a new games
  gameState.combo = 1;

  const choice = await asyncAlert({
    allowClose: true,
    title,
    content: [
      getCreativeModeWarning(gameState) ||

        levelStats ,
        intro,
       startTs != endTs ? t("gameOver.cumulative_total", { startTs, endTs }):'',

      settingsChangeRecommendations(),
      {
        icon: icons["icon:new_run"],
        value: null,
        text: t("confirmRestart.yes"),
        help: "",
      },
      `<div id="level-recording-container"></div>`,

      unlocksInfo,
      getHistograms(gameState),
      pickedUpgradesHTMl(gameState),
    ],
  });
  applySettingsChangeReco(choice);
  restart({
    levelToAvoid: currentLevelInfo(gameState).name,
  });
}

export function getCreativeModeWarning(gameState: GameState) {
  if (gameState.creative) {
    return "<p>" + t("gameOver.creative") + "</p>";
  }
  return "";
}

let runsHistory = [];

try {
  runsHistory = JSON.parse(
    localStorage.getItem("breakout_71_runs_history") || "[]",
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 100) as RunHistoryItem[];
} catch (e) {}

export function getHistory() {
  return runsHistory;
}

export function getHistograms(gameState: GameState) {
  if (gameState.creative) return "";
  let unlockedLevels = "";
  let runStats = "";
  try {
    const locked = allLevels
      .map((l, li) => ({
        li,
        l,
        r: reasonLevelIsLocked(li, l.name, runsHistory, false)?.text,
      }))
      .filter((l) => l.r);

    gameState.runStatistics.runTime = Math.round(
      gameState.runStatistics.runTime,
    );
    const perks = { ...gameState.perks };
    for (let id in perks) {
      if (!perks[id]) {
        delete perks[id];
      }
    }
    runsHistory.push({
      ...gameState.runStatistics,
      perks,
      appVersion,
    });

    const unlocked = locked.filter(
      ({ li, l }) => !isLevelLocked(li, l.name, runsHistory),
    );
    if (unlocked.length) {
      unlockedLevels = `

      <h2>${unlocked.length === 1 ? t("unlocks.just_unlocked") : t("unlocks.just_unlocked_plural", { count: unlocked.length })}</h2>
      
        ${unlocked
          .map(
            ({ l, r }) => ` 
         <div class="upgrade used">
            ${icons[l.name]}
            <p>
            <strong>${l.name}</strong>
          ${describeLevel(l)}
          </p>  
        </div>
        `,
          )
          .join("\n")}       
      `;
    }

    // Generate some histogram

    localStorage.setItem(
      "breakout_71_runs_history",
      JSON.stringify(runsHistory, null, 2),
    );

    const makeHistogram = (
      title: string,
      getter: (hi: RunHistoryItem) => number,
      unit: string,
    ) => {
      let values = runsHistory.map((h) => getter(h) || 0);
      let min = Math.min(...values);
      let max = Math.max(...values);
      // No point
      if (min === max) return "";
      if (max - min < 10) {
        // This is mostly useful for levels
        min = Math.max(0, max - 10);
        max = Math.max(max, min + 10);
      }
      // One bin per unique value, max 10
      const binsCount = Math.min(values.length, 10);
      if (binsCount < 3) return "";
      const bins = [] as number[];
      const binsTotal = [] as number[];
      for (let i = 0; i < binsCount; i++) {
        bins.push(0);
        binsTotal.push(0);
      }
      const binSize = (max - min) / bins.length;
      const binIndexOf = (v: number) =>
        Math.min(bins.length - 1, Math.floor((v - min) / binSize));
      values.forEach((v) => {
        if (isNaN(v)) return;
        const index = binIndexOf(v);
        bins[index]++;
        binsTotal[index] += v;
      });
      if (bins.filter((b) => b).length < 3) return "";
      const maxBin = Math.max(...bins);
      const lastValue = values[values.length - 1];
      const activeBin = binIndexOf(lastValue);

      const bars = bins
        .map((v, vi) => {
          const style = `height: ${(v / maxBin) * 80}px`;
          return `<span class="${vi === activeBin ? "active" : ""}"><span style="${style}" title="${v} run${v > 1 ? "s" : ""} between ${Math.floor(min + vi * binSize)} and ${Math.floor(min + (vi + 1) * binSize)}${unit}"
              ><span>${(!v && " ") || (vi == activeBin && lastValue + unit) || Math.round(binsTotal[vi] / v) + unit}</span></span></span>`;
        })
        .join("");

      return `<h2 class="histogram-title">${title} : <strong>${lastValue}${unit}</strong></h2>
            <div class="histogram">${bars}</div>
            `;
    };

    runStats += makeHistogram(
      t("gameOver.stats.total_score"),
      (r) => r.score,
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.catch_rate"),
      (r) => Math.round((r.score / r.coins_spawned) * 100),
      "%",
    );
    runStats += makeHistogram(
      t("gameOver.stats.bricks_broken"),
      (r) => r.bricks_broken,
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.bricks_per_minute"),
      (r) => Math.round((r.bricks_broken / r.runTime) * 1000 * 60),
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.hit_rate"),
      (r) => Math.round((1 - r.misses / r.puck_bounces) * 100),
      "%",
    );
    runStats += makeHistogram(
      t("gameOver.stats.duration_per_level"),
      (r) => Math.round(r.runTime / 1000 / r.levelsPlayed),
      "s",
    );
    runStats += makeHistogram(
      t("gameOver.stats.level_reached"),
      (r) => r.levelsPlayed,
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.upgrades_applied"),
      (r) => r.upgrades_picked,
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.balls_lost"),
      (r) => r.balls_lost,
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.combo_avg"),
      (r) => Math.round(r.coins_spawned / r.bricks_broken),
      "",
    );
    runStats += makeHistogram(
      t("gameOver.stats.combo_max"),
      (r) => r.max_combo,
      "",
    );

    if (runStats) {
      runStats =
        `<p>${t("gameOver.stats_intro", { count: runsHistory.length - 1 })}</p>` +
        runStats;
    }
  } catch (e) {
    console.warn(e);
  }
  return unlockedLevels + runStats;
}
