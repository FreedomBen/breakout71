import { t } from "./i18n/i18n";
import { Debuff } from "./types";

export const debuffs = [
  {
    id: "deadly_coins",
    max: 20,
    name: (lvl: number) => t("debuffs.deadly_coins.help", { lvl }),
    help: (lvl: number) => t("debuffs.deadly_coins.help", { lvl }),
  },
  {
    id: "frozen_coins",
    max: 20,
    name: (lvl: number) => t("debuffs.frozen_coins.help", { lvl }),
    help: (lvl: number) => t("debuffs.frozen_coins.help", { lvl }),
  },
  {
    id: "more_bombs",
    max: 20,
    name: (lvl: number) => t("debuffs.more_bombs.help", { lvl }),
    help: (lvl: number) => t("debuffs.more_bombs.help", { lvl }),
  },
  {
    id: "banned",
    max: 50,
    name: (lvl: number, banned: string) =>
      t("debuffs.banned.description", { lvl, banned }),
    help: (lvl: number, perk: string) =>
      t("debuffs.banned.help", { lvl, perk }),
  },
  {
    id: "interference",
    max: 20,
    name: (lvl: number) => t("debuffs.interference.help", { lvl }),
    help: (lvl: number) => t("debuffs.interference.help", { lvl }),
  },

  {
    id: "fragility",
    max: 5,
    name: (lvl: number) => t("debuffs.fragility.help", { percent: lvl * 20 }),
    help: (lvl: number) => t("debuffs.fragility.help", { percent: lvl * 20 }),
  },
  {
    id: "sturdiness",
    max: 5,
    name: (lvl: number) => t("debuffs.sturdiness.help", { lvl }),
    help: (lvl: number) => t("debuffs.sturdiness.help", { lvl }),
  },
] as const as Debuff[];

/*
Possible challenges :

  - exclusion : one of your current perks (except the kept one) is banned
  - fireworks : some bricks are explosive, you're not told which ones

  - ball creates a draft behind itself that blows coins in odd patterns
  - downward wind
  - side wind
- add red anti-coins that apply downgrades
  - destroy your combo
  - hurt your score
  - behave like heavier coins.
  - deactivate a perk for this level
  - reduce your number of coins
  - destroy all coins on screen
  - lowers your combo
  - reduce your choice for your next perk

 */
