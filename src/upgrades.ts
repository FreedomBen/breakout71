import { t } from "./i18n/i18n";

import { comboKeepingRate } from "./pure_functions";
import { PerkId } from "./types";

// Those perks are excluded from creative mode
export const noCreative: PerkId[] = [
  "extra_levels",
  "shunt",
  "one_more_choice",
  "instant_upgrade",
];

// Those perks are excluded from the starting perks list
export const notStartingPerk: PerkId[] = ["instant_upgrade"];

export const rawUpgrades = [
  {
    requires: "",
    threshold: 0,
    gift: false,

    id: "extra_life",
    max: 7,
    name: t("upgrades.extra_life.name"),
    help: (lvl: number) =>
      lvl === 1
        ? t("upgrades.extra_life.tooltip")
        : t("upgrades.extra_life.help_plural", { lvl }),
    fullHelp: t("upgrades.extra_life.verbose_description"),
  },

  {
    requires: "",
    threshold: 0,
    id: "base_combo",
    gift: true,

    max: 7,
    name: t("upgrades.base_combo.name"),
    help: (lvl: number) =>
      t("upgrades.base_combo.tooltip", { coins: 1 + lvl * 3 }),
    fullHelp: t("upgrades.base_combo.verbose_description"),
  },
  {
    requires: "",
    threshold: 0,
    gift: false,

    id: "slow_down",
    max: 2,
    name: t("upgrades.slow_down.name"),
    help: (lvl: number) => t("upgrades.slow_down.tooltip", { lvl }),
    fullHelp: t("upgrades.slow_down.verbose_description"),
  },
  {
    requires: "",
    threshold: 0,
    gift: false,

    id: "bigger_puck",
    max: 2,
    name: t("upgrades.bigger_puck.name"),
    help: () => t("upgrades.bigger_puck.tooltip"),
    fullHelp: t("upgrades.bigger_puck.verbose_description"),
  },
  {
    requires: "",
    threshold: 0,
    gift: false,

    id: "viscosity",
    max: 3,

    name: t("upgrades.viscosity.name"),
    help: () => t("upgrades.viscosity.tooltip"),
    fullHelp: t("upgrades.viscosity.verbose_description"),
  },
  {
    requires: "",
    threshold: 50,
    gift: false,

    id: "skip_last",
    max: 7,
    name: t("upgrades.skip_last.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.skip_last.tooltip")
        : t("upgrades.skip_last.help_plural", { lvl }),
    fullHelp: t("upgrades.skip_last.verbose_description"),
  },
  {
    requires: "",
    threshold: 100,
    id: "streak_shots",
    gift: true,

    max: 1,
    name: t("upgrades.streak_shots.name"),
    help: (lvl: number) => t("upgrades.streak_shots.tooltip", { lvl }),
    fullHelp: t("upgrades.streak_shots.verbose_description"),
  },

  {
    requires: "",

    threshold: 200,
    id: "left_is_lava",
    gift: true,

    max: 1,

    name: t("upgrades.left_is_lava.name"),
    help: (lvl: number) => t("upgrades.left_is_lava.tooltip", { lvl }),
    fullHelp: t("upgrades.left_is_lava.verbose_description"),
  },
  {
    requires: "",

    threshold: 300,
    id: "right_is_lava",
    gift: true,

    max: 1,
    name: t("upgrades.right_is_lava.name"),
    help: (lvl: number) => t("upgrades.right_is_lava.tooltip", { lvl }),
    fullHelp: t("upgrades.right_is_lava.verbose_description"),
  },
  {
    requires: "",

    threshold: 400,
    id: "top_is_lava",
    gift: true,

    max: 1,
    name: t("upgrades.top_is_lava.name"),
    help: (lvl: number) => t("upgrades.top_is_lava.tooltip", { lvl }),
    fullHelp: t("upgrades.top_is_lava.verbose_description"),
  },
  {
    requires: "",

    threshold: 500,
    id: "telekinesis",
    gift: true,

    max: 1,
    name: t("upgrades.telekinesis.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.telekinesis.tooltip")
        : t("upgrades.telekinesis.help_plural"),
    fullHelp: t("upgrades.telekinesis.verbose_description"),
  },
  {
    requires: "",
    threshold: 700,
    gift: false,

    id: "coin_magnet",
    max: 3,
    name: t("upgrades.coin_magnet.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.coin_magnet.tooltip")
        : t("upgrades.coin_magnet.help_plural"),
    fullHelp: t("upgrades.coin_magnet.verbose_description"),
  },
  {
    requires: "",

    threshold: 800,
    id: "multiball",
    gift: true,

    max: 6,
    name: t("upgrades.multiball.name"),
    help: (lvl: number) => t("upgrades.multiball.tooltip", { count: lvl + 1 }),
    fullHelp: t("upgrades.multiball.verbose_description"),
  },
  {
    requires: "",

    threshold: 1000,
    gift: false,

    id: "smaller_puck",
    max: 2,
    name: t("upgrades.smaller_puck.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.smaller_puck.tooltip")
        : t("upgrades.smaller_puck.help_plural"),
    fullHelp: t("upgrades.smaller_puck.verbose_description"),
  },
  {
    requires: "",
    threshold: 1500,
    id: "pierce",
    gift: false,

    max: 3,
    name: t("upgrades.pierce.name"),
    help: (lvl: number) => t("upgrades.pierce.tooltip", { count: 3 * lvl }),
    fullHelp: t("upgrades.pierce.verbose_description"),
  },
  {
    requires: "",

    threshold: 2000,
    id: "picky_eater",
    gift: true,

    max: 1,
    name: t("upgrades.picky_eater.name"),
    help: (lvl: number) => t("upgrades.picky_eater.tooltip", { lvl }),
    fullHelp: t("upgrades.picky_eater.verbose_description"),
  },
  {
    requires: "",

    threshold: 2500,
    gift: false,

    id: "metamorphosis",
    max: 1,
    name: t("upgrades.metamorphosis.name"),
    help: (lvl: number) => t("upgrades.metamorphosis.tooltip", { lvl }),
    fullHelp: t("upgrades.metamorphosis.verbose_description"),
  },
  {
    requires: "",

    threshold: 3000,
    id: "compound_interest",
    gift: true,

    max: 1,
    name: t("upgrades.compound_interest.name"),
    help: (lvl: number) => t("upgrades.compound_interest.tooltip", { lvl }),
    fullHelp: t("upgrades.compound_interest.verbose_description"),
  },
  {
    requires: "",
    threshold: 4000,
    id: "hot_start",
    gift: true,

    max: 3,
    name: t("upgrades.hot_start.name"),
    help: (lvl: number) =>
      t("upgrades.hot_start.tooltip", {
        start: lvl * 30 + 1,
        loss: lvl,
      }),
    fullHelp: t("upgrades.hot_start.verbose_description"),
  },
  {
    requires: "",

    threshold: 6000,
    id: "sapper",
    gift: false,

    max: 7,
    name: t("upgrades.sapper.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.sapper.tooltip")
        : t("upgrades.sapper.help_plural", { lvl }),
    fullHelp: t("upgrades.sapper.verbose_description"),
  },
  {
    requires: "",

    threshold: 9000,
    id: "bigger_explosions",
    gift: false,

    max: 1,
    name: t("upgrades.bigger_explosions.name"),
    help: (lvl: number) => t("upgrades.bigger_explosions.tooltip"),
    fullHelp: t("upgrades.bigger_explosions.verbose_description"),
  },
  {
    requires: "",

    threshold: 13000,
    gift: false,

    adventure: false,
    id: "extra_levels",
    max: 3,
    name: t("upgrades.extra_levels.name"),
    help: (lvl: number) =>
      t("upgrades.extra_levels.tooltip", { count: lvl + 7 }),
    fullHelp: t("upgrades.extra_levels.verbose_description"),
  },
  {
    requires: "",

    threshold: 15000,
    gift: false,

    id: "pierce_color",
    max: 4,
    name: t("upgrades.pierce_color.name"),
    help: (lvl: number) => t("upgrades.pierce_color.tooltip", { lvl }),
    fullHelp: t("upgrades.pierce_color.verbose_description"),
  },
  {
    requires: "",
    threshold: 18000,
    gift: false,

    id: "soft_reset",
    max: 3,
    name: t("upgrades.soft_reset.name"),
    help: (lvl: number) =>
      t("upgrades.soft_reset.tooltip", {
        percent: Math.round(comboKeepingRate(lvl) * 100),
      }),
    fullHelp: t("upgrades.soft_reset.verbose_description"),
  },
  {
    requires: "multiball",
    threshold: 21000,
    gift: false,

    id: "ball_repulse_ball",
    max: 3,
    name: t("upgrades.ball_repulse_ball.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.ball_repulse_ball.tooltip")
        : t("upgrades.ball_repulse_ball.help_plural"),
    fullHelp: t("upgrades.ball_repulse_ball.verbose_description"),
  },
  {
    requires: "multiball",
    threshold: 25000,
    gift: false,

    id: "ball_attract_ball",
    max: 3,
    name: t("upgrades.ball_attract_ball.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.ball_attract_ball.tooltip")
        : t("upgrades.ball_attract_ball.help_plural"),
    fullHelp: t("upgrades.ball_attract_ball.verbose_description"),
  },
  {
    requires: "",

    threshold: 30000,
    gift: false,

    id: "puck_repulse_ball",
    max: 2,
    name: t("upgrades.puck_repulse_ball.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.puck_repulse_ball.tooltip")
        : t("upgrades.puck_repulse_ball.help_plural"),
    fullHelp: t("upgrades.puck_repulse_ball.verbose_description"),
  },
  {
    requires: "",

    threshold: 35000,
    gift: false,

    id: "wind",
    max: 3,
    name: t("upgrades.wind.name"),
    help: (lvl: number) =>
      lvl == 1 ? t("upgrades.wind.tooltip") : t("upgrades.wind.help_plural"),
    fullHelp: t("upgrades.wind.verbose_description"),
  },
  {
    requires: "",

    threshold: 40000,
    gift: false,

    id: "sturdy_bricks",
    max: 4,
    name: t("upgrades.sturdy_bricks.name"),
    help: (lvl: number) =>
      // lvl == 1
      t("upgrades.sturdy_bricks.tooltip", { lvl, percent: lvl * 50 }),
    // ?
    // : t("upgrades.sturdy_bricks.help_plural"),
    fullHelp: t("upgrades.sturdy_bricks.verbose_description"),
  },
  {
    requires: "",

    threshold: 45000,
    gift: false,

    id: "respawn",
    max: 4,
    name: t("upgrades.respawn.name"),
    help: (lvl: number) =>
      t("upgrades.respawn.tooltip", {
        percent: Math.floor(100 * comboKeepingRate(lvl)),
        delay: (3 / lvl).toFixed(2),
      }),
    fullHelp: t("upgrades.respawn.verbose_description"),
  },
  {
    requires: "",
    threshold: 50000,
    gift: false,

    id: "one_more_choice",
    max: 3,
    name: t("upgrades.one_more_choice.name"),
    help: (lvl: number) => t("upgrades.one_more_choice.tooltip", { lvl }),
    fullHelp: t("upgrades.one_more_choice.verbose_description"),
  },
  {
    requires: "",

    threshold: 55000,
    gift: false,

    id: "instant_upgrade",
    max: 2,
    adventure: false,
    name: t("upgrades.instant_upgrade.name"),
    help: (lvl: number) => t("upgrades.instant_upgrade.tooltip", { lvl }),
    fullHelp: t("upgrades.instant_upgrade.verbose_description"),
  },
  {
    requires: "",
    threshold: 60000,
    gift: false,

    id: "concave_puck",
    max: 1,
    name: t("upgrades.concave_puck.name"),
    help: (lvl: number) => t("upgrades.concave_puck.tooltip"),
    fullHelp: t("upgrades.concave_puck.verbose_description"),
  },
  {
    requires: "",

    threshold: 65000,
    gift: false,

    id: "helium",
    max: 1,
    name: t("upgrades.helium.name"),
    help: (lvl: number) => t("upgrades.helium.tooltip"),
    fullHelp: t("upgrades.helium.verbose_description"),
  },
  {
    requires: "",

    threshold: 70000,
    gift: true,

    id: "asceticism",
    max: 1,
    name: t("upgrades.asceticism.name"),
    help: (lvl: number) => t("upgrades.asceticism.tooltip", { combo: lvl * 3 }),
    fullHelp: t("upgrades.asceticism.verbose_description"),
  },
  {
    requires: "",

    threshold: 75000,
    gift: false,

    id: "unbounded",
    max: 3,
    name: t("upgrades.unbounded.name"),
    help: (lvl: number) => t("upgrades.unbounded.tooltip", { lvl }),
    fullHelp: t("upgrades.unbounded.verbose_description"),
  },
  {
    requires: "",

    threshold: 80000,
    gift: false,

    id: "shunt",
    max: 3,
    name: t("upgrades.shunt.name"),
    help: (lvl: number) =>
      t("upgrades.shunt.tooltip", {
        percent: Math.round(comboKeepingRate(lvl) * 100),
      }),
    fullHelp: t("upgrades.shunt.verbose_description"),
  },
  {
    requires: "",

    threshold: 85000,
    gift: false,

    id: "yoyo",
    max: 1,
    name: t("upgrades.yoyo.name"),
    help: (lvl: number) => t("upgrades.yoyo.tooltip"),
    fullHelp: t("upgrades.yoyo.verbose_description"),
  },
  {
    requires: "",

    threshold: 90000,
    gift: true,

    id: "nbricks",
    max: 3,
    name: t("upgrades.nbricks.name"),
    help: (lvl: number) => t("upgrades.nbricks.tooltip", { lvl }),
    fullHelp: t("upgrades.nbricks.verbose_description"),
  },
  {
    requires: "",

    threshold: 95000,
    gift: false,

    id: "etherealcoins",
    max: 1,
    name: t("upgrades.etherealcoins.name"),
    help: (lvl: number) => t("upgrades.etherealcoins.tooltip"),
    fullHelp: t("upgrades.etherealcoins.verbose_description"),
  },
  {
    requires: "multiball",
    threshold: 100000,
    gift: false,

    id: "shocks",
    max: 1,
    name: t("upgrades.shocks.name"),
    help: (lvl: number) => t("upgrades.shocks.tooltip"),
    fullHelp: t("upgrades.shocks.verbose_description"),
  },
  {
    requires: "",
    threshold: 105000,
    gift: true,

    id: "zen",
    max: 1,
    name: t("upgrades.zen.name"),
    help: (lvl: number) => t("upgrades.zen.tooltip", { lvl }),
    fullHelp: t("upgrades.zen.verbose_description"),
  },
  {
    requires: "extra_life",
    threshold: 110000,
    gift: false,

    id: "sacrifice",
    max: 1,
    name: t("upgrades.sacrifice.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.sacrifice.help_l1")
        : t("upgrades.sacrifice.help_over", { lvl }),
    fullHelp: t("upgrades.sacrifice.verbose_description"),
  },

  {
    requires: "",
    threshold: 115000,
    gift: true,

    id: "trampoline",
    max: 1,
    name: t("upgrades.trampoline.name"),
    help: (lvl: number) => t("upgrades.trampoline.tooltip", { lvl }),
    fullHelp: t("upgrades.trampoline.verbose_description"),
  },
  {
    requires: "",

    threshold: 120000,
    gift: false,

    id: "ghost_coins",
    max: 3,
    name: t("upgrades.ghost_coins.name"),
    help: (lvl: number) => t("upgrades.ghost_coins.tooltip", { lvl }),
    fullHelp: t("upgrades.ghost_coins.verbose_description"),
  },
  {
    requires: "",
    threshold: 125000,
    gift: false,

    id: "forgiving",
    max: 1,
    name: t("upgrades.forgiving.name"),
    help: (lvl: number) => t("upgrades.forgiving.tooltip"),
    fullHelp: t("upgrades.forgiving.verbose_description"),
  },
  {
    requires: "",

    threshold: 130000,
    gift: false,

    id: "ball_attracts_coins",
    max: 3,
    name: t("upgrades.ball_attracts_coins.name"),
    help: (lvl: number) => t("upgrades.ball_attracts_coins.tooltip"),
    fullHelp: t("upgrades.ball_attracts_coins.verbose_description"),
  },
  {
    requires: "",
    threshold: 135000,
    // a bit too hard when starting up
    gift: false,

    id: "reach",
    max: 1,
    name: t("upgrades.reach.name"),
    help: (lvl: number) => t("upgrades.reach.tooltip", { lvl }),
    fullHelp: t("upgrades.reach.verbose_description"),
  },
  {
    requires: "",

    threshold: 140000,
    gift: true,

    id: "passive_income",
    max: 4,
    name: t("upgrades.passive_income.name"),
    help: (lvl: number) =>
      t("upgrades.passive_income.tooltip", { time: lvl * 0.25, lvl }),
    fullHelp: t("upgrades.passive_income.verbose_description"),
  },
  {
    requires: "",
    threshold: 145000,
    gift: false,

    id: "clairvoyant",
    max: 1,
    name: t("upgrades.clairvoyant.name"),
    help: (lvl: number) => t("upgrades.clairvoyant.tooltip"),
    fullHelp: t("upgrades.clairvoyant.verbose_description"),
  },
  {
    requires: "",

    threshold: 150000,
    gift: true,

    id: "side_kick",
    max: 3,
    name: t("upgrades.side_kick.name"),
    help: (lvl: number) =>
      t("upgrades.side_kick.tooltip", { lvl, loss: lvl * 2 }),
    fullHelp: t("upgrades.side_kick.verbose_description"),
  },
  {
    requires: "",

    threshold: 150000,
    gift: true,

    id: "side_flip",
    max: 3,
    name: t("upgrades.side_flip.name"),
    help: (lvl: number) =>
      t("upgrades.side_flip.tooltip", { lvl, loss: lvl * 2 }),
    fullHelp: t("upgrades.side_flip.verbose_description"),
  },
  {
    requires: "",
    threshold: 155000,
    gift: false,

    id: "implosions",
    max: 1,
    name: t("upgrades.implosions.name"),
    help: (lvl: number) => t("upgrades.implosions.tooltip"),
    fullHelp: t("upgrades.implosions.verbose_description"),
  },
  {
    requires: "",
    threshold: 160000,
    gift: false,

    id: "corner_shot",
    max: 1,
    name: t("upgrades.corner_shot.name"),
    help: (lvl: number) => t("upgrades.corner_shot.tooltip"),
    fullHelp: t("upgrades.corner_shot.verbose_description"),
  },
  {
    requires: "",
    threshold: 165000,
    gift: false,

    id: "addiction",
    max: 7,
    name: t("upgrades.addiction.name"),
    help: (lvl: number) =>
      t("upgrades.addiction.tooltip", { lvl, delay: (5 / lvl).toFixed(2) }),
    fullHelp: t("upgrades.addiction.verbose_description"),
  },
  {
    requires: "",
    threshold: 170000,
    gift: false,

    id: "fountain_toss",
    max: 7,
    name: t("upgrades.fountain_toss.name"),
    help: (lvl: number) =>
      t("upgrades.fountain_toss.tooltip", { lvl, max: lvl * 30 }),
    fullHelp: t("upgrades.fountain_toss.verbose_description"),
  },
  {
    requires: "",
    threshold: 175000,
    gift: false,

    id: "limitless",
    max: 1,
    name: t("upgrades.limitless.name"),
    help: (lvl: number) => t("upgrades.limitless.tooltip", { lvl }),
    fullHelp: t("upgrades.limitless.verbose_description"),
  },
  {
    requires: "",
    threshold: 180000,
    gift: false,

    id: "minefield",
    max: 3,
    name: t("upgrades.minefield.name"),
    help: (lvl: number) => t("upgrades.minefield.tooltip", { lvl }),
    fullHelp: t("upgrades.minefield.verbose_description"),
  },
  {
    requires: "",
    threshold: 185000,
    gift: false,

    id: "trickledown",
    max: 1,
    name: t("upgrades.trickledown.name"),
    help: (lvl: number) => t("upgrades.trickledown.tooltip", { lvl }),
    fullHelp: t("upgrades.trickledown.verbose_description"),
  },
  {
    requires: "",
    threshold: 190000,
    gift: false,

    id: "transparency",
    max: 3,
    name: t("upgrades.transparency.name"),
    help: (lvl: number) => t("upgrades.transparency.tooltip", { lvl }),
    fullHelp: t("upgrades.transparency.verbose_description"),
  },
  {
    requires: "",
    threshold: 195000,
    gift: false,

    id: "superhot",
    max: 3,
    name: t("upgrades.superhot.name"),
    help: (lvl: number) => t("upgrades.superhot.tooltip", { lvl }),
    fullHelp: t("upgrades.superhot.verbose_description"),
  },
  {
    requires: "",
    threshold: 200000,
    gift: false,

    id: "bricks_attract_coins",
    max: 3,
    name: t("upgrades.bricks_attract_coins.name"),
    help: (lvl: number) => t("upgrades.bricks_attract_coins.tooltip", { lvl }),
    fullHelp: t("upgrades.bricks_attract_coins.verbose_description"),
  },
  {
    requires: "",
    threshold: 205000,
    gift: false,

    id: "rainbow",
    max: 7,
    name: t("upgrades.rainbow.name"),
    help: (lvl: number) => t("upgrades.rainbow.tooltip", { lvl }),
    fullHelp: t("upgrades.rainbow.verbose_description"),
  },
  {
    requires: "metamorphosis",
    threshold: 210000,
    gift: false,

    id: "hypnosis",
    max: 1,
    name: t("upgrades.hypnosis.name"),
    help: (lvl: number) => t("upgrades.hypnosis.tooltip", { lvl }),
    fullHelp: t("upgrades.hypnosis.verbose_description"),
  },
  {
    requires: "",
    threshold: 215000,
    gift: false,
    id: "bricks_attract_ball",
    max: 1,
    name: t("upgrades.bricks_attract_ball.name"),
    help: (lvl: number) =>
      t("upgrades.bricks_attract_ball.tooltip", { count: lvl * 3 }),
    fullHelp: t("upgrades.bricks_attract_ball.verbose_description"),
  },
] as const;
