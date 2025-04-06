import { RunHistoryItem } from "./types";

function migrate(name: string, cb: () => void) {
  if (!localStorage.getItem(name)) {
    try {
      cb();
      console.debug("Ran migration : " + name);
      localStorage.setItem(name, "" + Date.now());
    } catch (e) {
      console.warn("Migration " + name + " failed : ", e);
    }
  }
}

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

  let cleaned=runsHistory.filter(r=> {
    if('mode' in r){
      if(r.mode !== 'short'){
        return false
      }
    }
    return  true
  })
  if(cleaned.length!==runsHistory.length)
  localStorage.setItem(
    "breakout_71_runs_history",
    JSON.stringify(cleaned),
  );
});
