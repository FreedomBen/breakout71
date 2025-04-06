import { t } from "./i18n/i18n";

import { comboKeepingRate } from "./pure_functions";

export const rawUpgrades = [
  {
    requires: "",

    threshold: 0,
    giftable: false,
    id: "extra_life",
    max: 3,
    name: t("upgrades.extra_life.name"),
    help: (lvl: number) =>
      lvl === 1
        ? t("upgrades.extra_life.help")
        : t("upgrades.extra_life.help_plural", { lvl }),
    fullHelp: t("upgrades.extra_life.fullHelp"),
  },
  {
    requires: "",
    threshold: 0,
    id: "streak_shots",
    giftable: true,
    max: 1,
    name: t("upgrades.streak_shots.name"),
    help: (lvl: number) => t("upgrades.streak_shots.help", { lvl }),
    fullHelp: t("upgrades.streak_shots.fullHelp"),
  },

  {
    requires: "",

    threshold: 0,
    id: "base_combo",
    giftable: true,
    max: 7,
    name: t("upgrades.base_combo.name"),
    help: (lvl: number) =>
      t("upgrades.base_combo.help", { coins: 1 + lvl * 3 }),
    fullHelp: t("upgrades.base_combo.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    giftable: false,
    id: "slow_down",
    max: 2,
    name: t("upgrades.slow_down.name"),
    help: (lvl: number) => t("upgrades.slow_down.help", { lvl }),
    fullHelp: t("upgrades.slow_down.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    giftable: false,
    id: "bigger_puck",
    max: 2,
    name: t("upgrades.bigger_puck.name"),
    help: () => t("upgrades.bigger_puck.help"),
    fullHelp: t("upgrades.bigger_puck.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    giftable: false,
    id: "viscosity",
    max: 3,

    name: t("upgrades.viscosity.name"),
    help: () => t("upgrades.viscosity.help"),
    fullHelp: t("upgrades.viscosity.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    id: "left_is_lava",
    giftable: true,
    max: 1,

    name: t("upgrades.left_is_lava.name"),
    help: (lvl: number) => t("upgrades.left_is_lava.help", { lvl }),
    fullHelp: t("upgrades.left_is_lava.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    id: "right_is_lava",
    giftable: true,
    max: 1,
    name: t("upgrades.right_is_lava.name"),
    help: (lvl: number) => t("upgrades.right_is_lava.help", { lvl }),
    fullHelp: t("upgrades.right_is_lava.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    id: "top_is_lava",
    giftable: true,
    max: 1,
    name: t("upgrades.top_is_lava.name"),
    help: (lvl: number) => t("upgrades.top_is_lava.help", { lvl }),
    fullHelp: t("upgrades.top_is_lava.fullHelp"),
  },
  {
    requires: "",

    threshold: 0,
    giftable: false,
    id: "skip_last",
    max: 7,
    name: t("upgrades.skip_last.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.skip_last.help")
        : t("upgrades.skip_last.help_plural", { lvl }),
    fullHelp: t("upgrades.skip_last.fullHelp"),
  },
  {
    requires: "",

    threshold: 500,
    id: "telekinesis",
    giftable: true,
    max: 1,
    name: t("upgrades.telekinesis.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.telekinesis.help")
        : t("upgrades.telekinesis.help_plural"),
    fullHelp: t("upgrades.telekinesis.fullHelp"),
  },
  {
    requires: "",

    threshold: 1000,
    giftable: false,
    id: "coin_magnet",
    max: 3,
    name: t("upgrades.coin_magnet.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.coin_magnet.help")
        : t("upgrades.coin_magnet.help_plural"),
    fullHelp: t("upgrades.coin_magnet.fullHelp"),
  },
  {
    requires: "",

    threshold: 1500,
    id: "multiball",
    giftable: true,
    max: 6,
    name: t("upgrades.multiball.name"),
    help: (lvl: number) => t("upgrades.multiball.help", { count: lvl + 1 }),
    fullHelp: t("upgrades.multiball.fullHelp"),
  },
  {
    requires: "",

    threshold: 2000,
    giftable: false,
    id: "smaller_puck",
    max: 2,
    name: t("upgrades.smaller_puck.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.smaller_puck.help")
        : t("upgrades.smaller_puck.help_plural"),
    fullHelp: t("upgrades.smaller_puck.fullHelp"),
  },
  {
    requires: "",

    threshold: 3000,
    id: "pierce",
    giftable: false,
    max: 3,
    name: t("upgrades.pierce.name"),
    help: (lvl: number) => t("upgrades.pierce.help", { count: 3 * lvl }),
    fullHelp: t("upgrades.pierce.fullHelp"),
  },
  {
    requires: "",

    threshold: 4000,
    id: "picky_eater",
    giftable: true,
    max: 1,
    name: t("upgrades.picky_eater.name"),
    help: (lvl: number) => t("upgrades.picky_eater.help", { lvl }),
    fullHelp: t("upgrades.picky_eater.fullHelp"),
  },
  {
    requires: "",

    threshold: 5000,
    giftable: false,
    id: "metamorphosis",
    max: 1,
    name: t("upgrades.metamorphosis.name"),
    help: (lvl: number) => t("upgrades.metamorphosis.help", { lvl }),
    fullHelp: t("upgrades.metamorphosis.fullHelp"),
  },
  {
    requires: "",

    threshold: 6000,
    id: "compound_interest",
    giftable: true,
    max: 1,
    name: t("upgrades.compound_interest.name"),
    help: (lvl: number) => t("upgrades.compound_interest.help", { lvl }),
    fullHelp: t("upgrades.compound_interest.fullHelp"),
  },
  {
    requires: "",
    threshold: 7000,
    id: "hot_start",
    giftable: true,
    max: 3,
    name: t("upgrades.hot_start.name"),
    help: (lvl: number) =>
      t("upgrades.hot_start.help", {
        start: lvl * 30 + 1,
        loss: lvl,
      }),
    fullHelp: t("upgrades.hot_start.fullHelp"),
  },
  {
    requires: "",

    threshold: 9000,
    id: "sapper",
    giftable: false,
    max: 7,
    name: t("upgrades.sapper.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.sapper.help")
        : t("upgrades.sapper.help_plural", { lvl }),
    fullHelp: t("upgrades.sapper.fullHelp"),
  },
  {
    requires: "",

    threshold: 11000,
    id: "bigger_explosions",
    giftable: false,
    max: 1,
    name: t("upgrades.bigger_explosions.name"),
    help: (lvl: number) => t("upgrades.bigger_explosions.help"),
    fullHelp: t("upgrades.bigger_explosions.fullHelp"),
  },
  {
    requires: "",

    threshold: 13000,
    giftable: false,
    adventure: false,
    id: "extra_levels",
    max: 3,
    name: t("upgrades.extra_levels.name"),
    help: (lvl: number) => t("upgrades.extra_levels.help", { count: lvl + 7 }),
    fullHelp: t("upgrades.extra_levels.fullHelp"),
  },
  {
    requires: "",

    threshold: 15000,
    giftable: false,
    id: "pierce_color",
    max: 4,
    name: t("upgrades.pierce_color.name"),
    help: (lvl: number) => t("upgrades.pierce_color.help", { lvl }),
    fullHelp: t("upgrades.pierce_color.fullHelp"),
  },
  {
    requires: "",
    threshold: 18000,
    giftable: false,
    id: "soft_reset",
    max: 3,
    name: t("upgrades.soft_reset.name"),
    help: (lvl: number) =>
      t("upgrades.soft_reset.help", {
        percent: Math.round(comboKeepingRate(lvl) * 100),
      }),
    fullHelp: t("upgrades.soft_reset.fullHelp"),
  },
  {
    requires: "multiball",
    threshold: 21000,
    giftable: false,
    id: "ball_repulse_ball",
    max: 3,
    name: t("upgrades.ball_repulse_ball.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.ball_repulse_ball.help")
        : t("upgrades.ball_repulse_ball.help_plural"),
    fullHelp: t("upgrades.ball_repulse_ball.fullHelp"),
  },
  {
    requires: "multiball",
    threshold: 25000,
    giftable: false,
    id: "ball_attract_ball",
    max: 3,
    name: t("upgrades.ball_attract_ball.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.ball_attract_ball.help")
        : t("upgrades.ball_attract_ball.help_plural"),
    fullHelp: t("upgrades.ball_attract_ball.fullHelp"),
  },
  {
    requires: "",

    threshold: 30000,
    giftable: false,
    id: "puck_repulse_ball",
    max: 2,
    name: t("upgrades.puck_repulse_ball.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.puck_repulse_ball.help")
        : t("upgrades.puck_repulse_ball.help_plural"),
    fullHelp: t("upgrades.puck_repulse_ball.fullHelp"),
  },
  {
    requires: "",

    threshold: 35000,
    giftable: false,
    id: "wind",
    max: 3,
    name: t("upgrades.wind.name"),
    help: (lvl: number) =>
      lvl == 1 ? t("upgrades.wind.help") : t("upgrades.wind.help_plural"),
    fullHelp: t("upgrades.wind.fullHelp"),
  },
  {
    requires: "",

    threshold: 40000,
    giftable: false,
    id: "sturdy_bricks",
    max: 4,
    name: t("upgrades.sturdy_bricks.name"),
    help: (lvl: number) =>
      // lvl == 1
      t("upgrades.sturdy_bricks.help", { lvl, percent: lvl * 50 }),
    // ?
    // : t("upgrades.sturdy_bricks.help_plural"),
    fullHelp: t("upgrades.sturdy_bricks.fullHelp"),
  },
  {
    requires: "",

    threshold: 45000,
    giftable: false,
    id: "respawn",
    max: 4,
    name: t("upgrades.respawn.name"),
    help: (lvl: number) =>
      t("upgrades.respawn.help", {
        percent: Math.floor(100 * comboKeepingRate(lvl)),
        delay: (3 / lvl).toFixed(2),
      }),
    fullHelp: t("upgrades.respawn.fullHelp"),
  },
  {
    requires: "",
    threshold: 50000,
    giftable: false,
    id: "one_more_choice",
    max: 3,
    name: t("upgrades.one_more_choice.name"),
    help: (lvl: number) => t("upgrades.one_more_choice.help", { lvl }),
    fullHelp: t("upgrades.one_more_choice.fullHelp"),
  },
  {
    requires: "",

    threshold: 55000,
    giftable: false,
    id: "instant_upgrade",
    max: 2,
    adventure: false,
    name: t("upgrades.instant_upgrade.name"),
    help: (lvl: number) => t("upgrades.instant_upgrade.help", { lvl }),
    fullHelp: t("upgrades.instant_upgrade.fullHelp"),
  },
  {
    requires: "",
    threshold: 60000,
    giftable: false,
    id: "concave_puck",
    max: 1,
    name: t("upgrades.concave_puck.name"),
    help: (lvl: number) => t("upgrades.concave_puck.help"),
    fullHelp: t("upgrades.concave_puck.fullHelp"),
  },
  {
    requires: "",

    threshold: 65000,
    giftable: false,
    id: "helium",
    max: 1,
    name: t("upgrades.helium.name"),
    help: (lvl: number) => t("upgrades.helium.help"),
    fullHelp: t("upgrades.helium.fullHelp"),
  },
  {
    requires: "",

    threshold: 70000,
    giftable: true,
    id: "asceticism",
    max: 1,
    name: t("upgrades.asceticism.name"),
    help: (lvl: number) => t("upgrades.asceticism.help", { combo: lvl * 3 }),
    fullHelp: t("upgrades.asceticism.fullHelp"),
  },
  {
    requires: "",

    threshold: 75000,
    giftable: false,
    id: "unbounded",
    max: 1,
    name: t("upgrades.unbounded.name"),
    help: (lvl: number) =>
      lvl > 1
        ? t("upgrades.unbounded.help_no_ceiling", { lvl })
        : t("upgrades.unbounded.help", { lvl }),
    fullHelp: t("upgrades.unbounded.fullHelp"),
  },
  {
    requires: "",

    threshold: 80000,
    giftable: false,
    id: "shunt",
    max: 3,
    name: t("upgrades.shunt.name"),
    help: (lvl: number) =>
      t("upgrades.shunt.help", {
        percent: Math.round(comboKeepingRate(lvl) * 100),
      }),
    fullHelp: t("upgrades.shunt.fullHelp"),
  },
  {
    requires: "",

    threshold: 85000,
    giftable: false,
    id: "yoyo",
    max: 1,
    name: t("upgrades.yoyo.name"),
    help: (lvl: number) => t("upgrades.yoyo.help"),
    fullHelp: t("upgrades.yoyo.fullHelp"),
  },
  {
    requires: "",

    threshold: 90000,
    giftable: true,
    id: "nbricks",
    max: 3,
    name: t("upgrades.nbricks.name"),
    help: (lvl: number) => t("upgrades.nbricks.help", { lvl }),
    fullHelp: t("upgrades.nbricks.fullHelp"),
  },
  {
    requires: "",

    threshold: 95000,
    giftable: false,
    id: "etherealcoins",
    max: 1,
    name: t("upgrades.etherealcoins.name"),
    help: (lvl: number) => t("upgrades.etherealcoins.help"),
    fullHelp: t("upgrades.etherealcoins.fullHelp"),
  },
  {
    requires: "multiball",
    threshold: 100000,
    giftable: false,
    id: "shocks",
    max: 1,
    name: t("upgrades.shocks.name"),
    help: (lvl: number) => t("upgrades.shocks.help"),
    fullHelp: t("upgrades.shocks.fullHelp"),
  },
  {
    requires: "",
    threshold: 105000,
    giftable: true,
    id: "zen",
    max: 1,
    name: t("upgrades.zen.name"),
    help: (lvl: number) => t("upgrades.zen.help", { lvl }),
    fullHelp: t("upgrades.zen.fullHelp"),
  },
  {
    requires: "extra_life",
    threshold: 110000,
    giftable: false,
    id: "sacrifice",
    max: 1,
    name: t("upgrades.sacrifice.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.sacrifice.help_l1")
        : t("upgrades.sacrifice.help_over", { lvl }),
    fullHelp: t("upgrades.sacrifice.fullHelp"),
  },

  {
    requires: "",
    threshold: 115000,
    giftable: true,
    id: "trampoline",
    max: 1,
    name: t("upgrades.trampoline.name"),
    help: (lvl: number) => t("upgrades.trampoline.help", { lvl }),
    fullHelp: t("upgrades.trampoline.fullHelp"),
  },
  {
    requires: "",

    threshold: 120000,
    giftable: false,
    id: "ghost_coins",
    max: 1,
    name: t("upgrades.ghost_coins.name"),
    help: (lvl: number) => t("upgrades.ghost_coins.help", { lvl }),
    fullHelp: t("upgrades.ghost_coins.fullHelp"),
  },
  {
    requires: "",
    threshold: 125000,
    giftable: false,
    id: "forgiving",
    max: 1,
    name: t("upgrades.forgiving.name"),
    help: (lvl: number) => t("upgrades.forgiving.help"),
    fullHelp: t("upgrades.forgiving.fullHelp"),
  },
  {
    requires: "",

    threshold: 130000,
    giftable: false,
    id: "ball_attracts_coins",
    max: 3,
    name: t("upgrades.ball_attracts_coins.name"),
    help: (lvl: number) => t("upgrades.ball_attracts_coins.help"),
    fullHelp: t("upgrades.ball_attracts_coins.fullHelp"),
  },
  {
    requires: "",
    threshold: 135000,
    // a bit too hard when starting up
    giftable: false,
    id: "reach",
    max: 1,
    name: t("upgrades.reach.name"),
    help: (lvl: number) => t("upgrades.reach.help", { lvl }),
    fullHelp: t("upgrades.reach.fullHelp"),
  },
  {
    requires: "",

    threshold: 140000,
    giftable: true,
    id: "passive_income",
    max: 4,
    name: t("upgrades.passive_income.name"),
    help: (lvl: number) =>
      t("upgrades.passive_income.help", { time: lvl * 0.25, lvl }),
    fullHelp: t("upgrades.passive_income.fullHelp"),
  },
  {
    requires: "",
    threshold: 145000,
    giftable: false,
    id: "clairvoyant",
    max: 1,
    name: t("upgrades.clairvoyant.name"),
    help: (lvl: number) => t("upgrades.clairvoyant.help"),
    fullHelp: t("upgrades.clairvoyant.fullHelp"),
  },
  {
    requires: "",

    threshold: 150000,
    giftable: true,
    id: "side_kick",
    max: 3,
    name: t("upgrades.side_kick.name"),
    help: (lvl: number) => t("upgrades.side_kick.help", { lvl, loss: lvl * 2 }),
    fullHelp: t("upgrades.side_kick.fullHelp"),
  },
  {
    requires: "",
    threshold: 155000,
    giftable: false,
    id: "implosions",
    max: 1,
    name: t("upgrades.implosions.name"),
    help: (lvl: number) => t("upgrades.implosions.help"),
    fullHelp: t("upgrades.implosions.fullHelp"),
  },
  {
    requires: "",
    threshold: 160000,
    giftable: false,
    id: "corner_shot",
    max: 1,
    name: t("upgrades.corner_shot.name"),
    help: (lvl: number) => t("upgrades.corner_shot.help"),
    fullHelp: t("upgrades.corner_shot.fullHelp"),
  },
  {
    requires: "",
    threshold: 165000,
    giftable: false,
    id: "addiction",
    max: 7,
    name: t("upgrades.addiction.name"),
    help: (lvl: number) =>
      t("upgrades.addiction.help", { lvl, delay: (5 / lvl).toFixed(2) }),
    fullHelp: t("upgrades.addiction.fullHelp"),
  },
  {
    requires: "",
    threshold: 170000,
    giftable: false,
    id: "fountain_toss",
    max: 7,
    name: t("upgrades.fountain_toss.name"),
    help: (lvl: number) =>
      t("upgrades.fountain_toss.help", { lvl, max: lvl * 30 }),
    fullHelp: t("upgrades.fountain_toss.fullHelp"),
  },
  {
    requires: "",
    threshold: 175000,
    giftable: false,
    id: "limitless",
    max: 1,
    name: t("upgrades.limitless.name"),
    help: (lvl: number) => t("upgrades.limitless.help", { lvl }),
    fullHelp: t("upgrades.limitless.fullHelp"),
  }
] as const;
