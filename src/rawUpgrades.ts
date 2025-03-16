import { t } from "./i18n/i18n";

export const rawUpgrades = [
  {
    requires: "",
    threshold: 0,
    giftable: false,
    id: "extra_life",
    max: 7,
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
    help: () => t("upgrades.slow_down.help"),
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
    help: () => t("upgrades.left_is_lava.help"),
    fullHelp: t("upgrades.left_is_lava.fullHelp"),
  },
  {
    requires: "",
    threshold: 0,
    id: "right_is_lava",
    giftable: true,
    max: 1,
    name: t("upgrades.right_is_lava.name"),
    help: () => t("upgrades.right_is_lava.help"),
    fullHelp: t("upgrades.right_is_lava.fullHelp"),
  },
  {
    requires: "",
    threshold: 0,
    id: "top_is_lava",
    giftable: true,
    max: 1,
    name: t("upgrades.top_is_lava.name"),
    help: () => t("upgrades.top_is_lava.help"),
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
    max: 2,
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
    giftable: true,
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
    help: (lvl: number) => t("upgrades.picky_eater.help"),
    fullHelp: t("upgrades.picky_eater.fullHelp"),
  },
  {
    requires: "",
    threshold: 5000,
    giftable: false,
    id: "metamorphosis",
    max: 1,
    name: t("upgrades.metamorphosis.name"),
    help: (lvl: number) => t("upgrades.metamorphosis.help"),
    fullHelp: t("upgrades.metamorphosis.fullHelp"),
  },
  {
    requires: "",
    threshold: 6000,
    id: "compound_interest",
    giftable: true,
    max: 1,
    name: t("upgrades.compound_interest.name"),
    help: (lvl: number) => t("upgrades.compound_interest.help"),
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
        start: lvl * 15 + 1,
        lvl,
      }),
    fullHelp: t("upgrades.hot_start.fullHelp"),
  },
  {
    requires: "",
    threshold: 9000,
    id: "sapper",
    giftable: true,
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
    max: 1,
    name: t("upgrades.pierce_color.name"),
    help: (lvl: number) => t("upgrades.pierce_color.help"),
    fullHelp: t("upgrades.pierce_color.fullHelp"),
  },
  {
    requires: "",
    threshold: 18000,
    giftable: false,
    id: "soft_reset",
    max: 9,
    name: t("upgrades.soft_reset.name"),
    help: (lvl: number) => t("upgrades.soft_reset.help", { percent: 10 * lvl }),
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
    name: t("upgrades.telekinesis.name"),
    help: (lvl: number) =>
      lvl == 1
        ? t("upgrades.telekinesis.help")
        : t("upgrades.telekinesis.help_plural"),
    fullHelp: t("upgrades.telekinesis.fullHelp"),
  },
  {
    requires: "",
    threshold: 45000,
    giftable: false,
    id: "respawn",
    max: 4,
    name: t("upgrades.respawn.name"),
    help: (lvl: number) =>
      lvl == 1 ? t("upgrades.respawn.help") : t("upgrades.respawn.help_plural"),
    fullHelp: t("upgrades.respawn.fullHelp"),
  },
  {
    requires: "",
    threshold: 50000,
    giftable: false,
    id: "one_more_choice",
    max: 3,
    name: t("upgrades.one_more_choice.name"),
    help: (lvl: number) => t("upgrades.one_more_choice.help"),
    fullHelp: t("upgrades.one_more_choice.fullHelp"),
  },
  {
    requires: "",
    threshold: 55000,
    giftable: false,
    id: "instant_upgrade",
    max: 2,
    name: t("upgrades.instant_upgrade.name"),
    help: (lvl: number) => t("upgrades.instant_upgrade.help"),
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
] as const;
