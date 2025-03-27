import { t } from "./i18n/i18n";

export const debuffs = [
  {
    id: "negative_coins",
    max: 20,
    name: t("debuffs.negative_coins.name"),
    help: (lvl: number) => t("debuffs.negative_coins.help", { lvl }),
  },
  {
    id: "negative_bricks",
    max: 20,
    name: t("debuffs.negative_bricks.name"),
    help: (lvl: number) => t("debuffs.negative_bricks.help", { lvl }),
  },

  {
    id: "void_coins_on_touch",
    max: 1,
    name: t("debuffs.void_coins_on_touch.name"),
    help: (lvl: number) => t("debuffs.void_coins_on_touch.help", { lvl }),
  },
  {
    id: "void_brick_on_touch",
    max: 1,
    name: t("debuffs.void_brick_on_touch.name"),
    help: (lvl: number) => t("debuffs.void_brick_on_touch.help", { lvl }),
  },
  {
    id: "downward_wind",
    max: 20,
    name: t("debuffs.downward_wind.name"),
    help: (lvl: number) => t("debuffs.downward_wind.help", { lvl }),
  },

  {
    id: "side_wind",
    max: 20,
    name: t("debuffs.side_wind.name"),
    help: (lvl: number) => t("debuffs.side_wind.help", { lvl }),
  },
] as const;

/*
Possible challenges :

  - add a force field for 10s that negates hots start
  - other perks can be randomly turned off
  - ball keeps accelerating until unplayable
  - graphical effects like trail, contrast, blur to make it harder to see what's going on
  - ball creates a draft behind itself that blows coins in odd patterns
  - bricks are invisible

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
