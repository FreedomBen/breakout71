// Settings

let cachedSettings: { [key: string]: unknown } = {};

 try {
   for(let key in localStorage){

 try {
      cachedSettings[key] = JSON.parse(localStorage.getItem(key)||'null')  ;
 } catch (e) {
  console.warn(e);
}
   }
} catch (e) {
  console.warn(e);
}

export function getSettingValue<T>(key: string, defaultValue: T) {
  return (cachedSettings[key] as T) ?? defaultValue;
}

export function setSettingValue<T>(key: string, value: T) {
  cachedSettings[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(e);
  }
}

export function getTotalScore() {
  return getSettingValue("breakout_71_total_score", 0);
}

export function getCurrentMaxCoins() {
  return Math.pow(2, getSettingValue("max_coins", 2)) * 200;
}
export function getCurrentMaxParticles() {
  return  getCurrentMaxCoins()
}
export function cycleMaxCoins() {
  setSettingValue("max_coins", (getSettingValue("max_coins", 2) + 1) % 10);
}
