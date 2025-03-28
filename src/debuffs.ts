import { t } from "./i18n/i18n";
import {Debuff} from "./types";

export const debuffs = [
  {
    id: "negative_coins",
    max: 20,
    name: (lvl: number) => t("debuffs.negative_coins.help",{lvl}),
    help: (lvl: number) => t("debuffs.negative_coins.help", { lvl }),
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
    name: (lvl: number,banned:string) => t("debuffs.banned.description",{lvl,banned}),
    help: (lvl: number,perk:string) => t("debuffs.banned.help", { lvl,perk }),
  },
  {
    id: "interference",
    max: 20,
    name: (lvl: number) => t("debuffs.interference.help", { lvl }),
    help: (lvl: number) => t("debuffs.interference.help", { lvl }),
  },

] as const as Debuff[];

/*
Possible challenges :

  - interference : telekinesis works backward for lvl/2 seconds every 5 seconds (show timer ?)
  - exclusion : one of your current perks (except the kept one) is banned
  - fireworks : some bricks are explosive, you're not told which ones
  -

  - graphical effects like trail, contrast, blur to make it harder to see what's going on
  - ball creates a draft behind itself that blows coins in odd patterns
  - bricks are invisible
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
