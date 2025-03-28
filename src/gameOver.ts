import { allLevels, appVersion, upgrades } from "./loadGameData";
import { t } from "./i18n/i18n";
import { RunHistoryItem } from "./types";
import { gameState, pause, restart } from "./game";
import { currentLevelInfo, findLast, pickedUpgradesHTMl } from "./game_utils";
import { getTotalScore } from "./settings";
import { stopRecording } from "./recording";
import { asyncAlert } from "./asyncAlert";

export function getUpgraderUnlockPoints() {
  let list = [] as { threshold: number; title: string }[];

  upgrades.forEach((u) => {
    if (u.threshold) {
      list.push({
        threshold: u.threshold,
        title: u.name + " " + t("level_up.unlocked_perk"),
      });
    }
  });

  allLevels.forEach((l) => {
    list.push({
      threshold: l.threshold,
      title: l.name + " " + t("level_up.unlocked_level"),
    });
  });

  return list
    .filter((o) => o.threshold)
    .sort((a, b) => a.threshold - b.threshold);
}

export function addToTotalPlayTime(ms: number) {
  try {
    localStorage.setItem(
      "breakout_71_total_play_time",
      JSON.stringify(
        JSON.parse(localStorage.getItem("breakout_71_total_play_time") || "0") +
          ms,
      ),
    );
  } catch (e) {}
}

export function gameOver(title: string, intro: string) {
  if (!gameState.running) return;
  if (gameState.isGameOver) return;
  gameState.isGameOver = true;
  pause(true);
  stopRecording();
  addToTotalPlayTime(gameState.runStatistics.runTime);
  gameState.runStatistics.max_level = gameState.currentLevel + 1;

  let animationDelay = -300;
  const getDelay = () => {
    animationDelay += 800;
    return "animation-delay:" + animationDelay + "ms;";
  };
  // unlocks
  let unlocksInfo = "";
  const endTs = getTotalScore();
  const startTs = endTs - gameState.score;
  const list = getUpgraderUnlockPoints();
  list
    .filter((u) => u.threshold > startTs && u.threshold < endTs)
    .forEach((u) => {
      unlocksInfo += `
<p class="progress"  >
   <span>${u.title}</span>
    <span class="progress_bar_part" style="${getDelay()}"></span>
</p>
`;
    });
  const previousUnlockAt =
    findLast(list, (u) => u.threshold <= endTs)?.threshold || 0;
  const nextUnlock = list.find((u) => u.threshold > endTs);

  if (nextUnlock) {
    const total = nextUnlock?.threshold - previousUnlockAt;
    const done = endTs - previousUnlockAt;

    intro += t("gameOver.next_unlock", {
      points: nextUnlock.threshold - endTs,
    });

    const scaleX = (done / total).toFixed(2);
    unlocksInfo += `
            <p class="progress"   >
           <span>${nextUnlock.title}</span>
        <span style="transform: scale(${scaleX},1);${getDelay()}" class="progress_bar_part"></span>
        </p>

`;
    list
      .slice(list.indexOf(nextUnlock) + 1)
      .slice(0, 3)
      .forEach((u) => {
        unlocksInfo += `
        <p class="progress"  >
           <span>${u.title}</span> 
        </p> 
`;
      });
  }

  let unlockedItems = list.filter(
    (u) => u.threshold > startTs && u.threshold < endTs,
  );
  if (unlockedItems.length) {
    unlocksInfo += `<p>${t("gameOver.unlocked_count", { count: unlockedItems.length })} ${unlockedItems.map((u) => u.title).join(", ")}</p>`;
  }

  // Avoid the sad sound right as we restart a new games
  gameState.combo = 1;

  asyncAlert({
    allowClose: true,
    title,
    content: [
      `
        ${gameState.isCreativeModeRun ? `<p>${t("gameOver.test_run")}</p> ` : ""}
        <p>${intro}</p>
        <p>${t("gameOver.cumulative_total", { startTs, endTs })}</p>
        ${unlocksInfo}  
        `,
      {
        value: null,
        text: t("gameOver.restart"),
        help: "",
      },
      `<div id="level-recording-container"></div> 
           ${pickedUpgradesHTMl(gameState)}
        ${getHistograms()} 
        `,
    ],
  }).then(() =>
    restart({
      levelToAvoid: currentLevelInfo(gameState).name
    }),
  );
}

export function getHistograms() {
  let runStats = "";
  // TODO separate adventure and normal runs
  try {
    // Stores only top 100 runs
    let runsHistory = JSON.parse(
      localStorage.getItem("breakout_71_runs_history") || "[]",
    ) as RunHistoryItem[];
    runsHistory.sort((a, b) => a.score - b.score).reverse();
    runsHistory = runsHistory.slice(0, 100);

    runsHistory.push({
      ...gameState.runStatistics,
      perks: gameState.perks,
      appVersion,
    });

    // Generate some histogram
    if (!gameState.isCreativeModeRun)
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
        `<p>${t("gameOver.stats.intro", { count: runsHistory.length - 1 })}</p>` +
        runStats;
    }
  } catch (e) {
    console.warn(e);
  }
  return runStats;
}
