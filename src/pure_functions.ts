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
