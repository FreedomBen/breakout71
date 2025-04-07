import { RunHistoryItem } from "./types";

import _appVersion from "./data/version.json";
import {generateSaveFileContent} from "./generateSaveFileContent";

// The page will be reloaded if any migrations were run
let migrationsRun=0
function migrate(name: string, cb: () => void) {
  if (!localStorage.getItem(name)) {
    try {
      cb();
      console.debug("Ran migration : " + name);
      localStorage.setItem(name, "" + Date.now());
      migrationsRun++
    } catch (e) {
      console.warn("Migration " + name + " failed : ", e);
    }
  }
}

migrate("save_data_before_upgrade_to_"+_appVersion, () => {
  localStorage.setItem("recovery_data",JSON.stringify(generateSaveFileContent()));
});


migrate("migrate_high_scores", () => {
  const old = localStorage.getItem("breakout-3-hs");
  if (old) {
    localStorage.setItem("breakout-3-hs-short", old);
    localStorage.removeItem("breakout-3-hs");
  }
});
migrate("recover_high_scores", () => {
  let runsHistory = JSON.parse(
    localStorage.getItem("breakout_71_runs_history") || "[]",
  ) as RunHistoryItem[];
  runsHistory.forEach((r) => {
    const currentHS = parseInt(
      localStorage.getItem("breakout-3-hs-" + (r.mode || "short")) || "0",
    );
    if (r.score > currentHS) {
      localStorage.setItem(
        "breakout-3-hs-" + (r.mode || "short"),
        "" + r.score,
      );
    }
  });
});

migrate("remove_long_and_creative_mode_data", () => {
  let runsHistory = JSON.parse(
    localStorage.getItem("breakout_71_runs_history") || "[]",
  ) as RunHistoryItem[];

  let cleaned = runsHistory.filter((r) => {
    if(!r.perks) return
    if ("mode" in r) {
      if (r.mode !== "short") {
        return false;
      }
    }
    return true;
  });
  if (cleaned.length !== runsHistory.length)
    localStorage.setItem("breakout_71_runs_history", JSON.stringify(cleaned));
});


migrate("compact_runs_data", () => {
  let runsHistory = JSON.parse(
    localStorage.getItem("breakout_71_runs_history") || "[]",
  ) as RunHistoryItem[];

  runsHistory.forEach((r) => {
    r.runTime=Math.round(r.runTime)
    for(let key in r.perks){
      if(r.perks && !r.perks[key]){
        delete r.perks[key]
      }
    }
    if('best_level_score' in r) {
      delete r.best_level_score
    }
    if('worst_level_score' in r) {
      delete r.worst_level_score
    }

  });

  localStorage.setItem("breakout_71_runs_history", JSON.stringify(runsHistory));
});


// Avoid a boot loop by setting the hash before reloading
// We can't set the query string as it is used for other things
if(migrationsRun && !window.location.hash){
  window.location.hash='#reloadAfterMigration'
  window.location.reload()
}