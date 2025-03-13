export const rawUpgrades = [
  {
    requires: "",
    threshold: 0,
    giftable: false,
    id: "extra_life",
    name: "+1 life",
    max: 7,
    help: (lvl: number) =>
      `The ball will bounce on the bottom ${lvl} time${lvl > 1 ? "s" : ""} before being lost.`,
    fullHelp: `Normally, you have one ball per run, and the run is over as soon as you drop it.
         This perk adds a white bar at the bottom of the screen that will save a ball once, and break in the process. 
         You'll loose one level of that perk every time a ball bounces at the bottom of the screen. `,
  },
  {
    requires: "",
    threshold: 0,
    id: "streak_shots",
    giftable: true,
    name: "Single puck hit streak",
    max: 1,
    help: (lvl: number) => `More coins if you break many bricks at once`,
    fullHelp: `Every time you break a brick, your combo (number of coins per bricks) increases by one. However, as soon as the ball touches your puck, 
        the combo is reset to its default value, and you'll just get one coin per brick. So you should try to hit many bricks in one go for more score. 
        Once your combo rises above the base value, your puck will become red to remind you that it will destroy your combo to touch it with the ball.
         This can stack with other combo related perks, the combo will rise faster but reset more easily as any of the conditions is enough to reset it. `,
  },

  {
    requires: "",
    threshold: 0,
    id: "base_combo",
    giftable: true,
    name: "+3 base combo",
    max: 7,
    help: (lvl: number) => `Every brick drops at least ${1 + lvl * 3} coins.`,
    fullHelp: `Your combo (number of coins per bricks) normally starts at 1 at the beginning of the level, and resets to one when you bounce around without hitting anything. 
        With this perk, the combo starts 3 points higher, so you'll always get at least 4 coins per brick. Whenever your combo reset, it will go back to 4 and not 1. 
        Your ball will glitter a bit to indicate that its combo is higher than one.`,
  },
  {
    requires: "",
    threshold: 0,
    giftable: false,
    id: "slow_down",
    name: "Slower ball",
    max: 2,
    help: (lvl: number) => `Ball moves ${lvl > 1 ? "even" : ""} more slowly.`,

    fullHelp: `The ball starts relatively slow, but every level of your run it will start a bit faster, and it will also accelerate if you spend a lot of time in one level. This perk makes it
         more manageable. You can get it at the start every time by enabling kid mode in the menu.`,
  },
  {
    requires: "",
    threshold: 0,
    giftable: false,
    id: "bigger_puck",
    name: "Bigger puck",
    max: 2,
    help: (lvl: number) => `Easily catch ${lvl > 1 ? "even" : ""} more coins.`,
    fullHelp: `A bigger puck makes it easier to never miss the ball and to catch more coins, and also to precisely angle the bounces (the ball's angle only depends on where it hits the puck). 
        However, a large puck is harder to use around the sides of the level, and will make it sometimes unavoidable to miss (not hit anything) which comes with downsides. `,
  },
  {
    requires: "",
    threshold: 0,
    giftable: false,
    id: "viscosity",
    name: "Viscosity",
    max: 3,
    help: (lvl: number) => `${lvl > 1 ? "Even slower" : "Slower"} coins fall.`,

    fullHelp: `Coins normally accelerate with gravity and explosions to pretty high speeds. This perk constantly makes them slow down, as if they were in some sort of viscous liquid. 
        This makes catching them easier, and combines nicely with perks that influence the coin's movement. `,
  },
  {
    requires: "",
    threshold: 0,
    id: "left_is_lava",
    giftable: true,
    name: "Avoid left side",
    max: 1,
    help: (lvl: number) => `More coins if you don't touch the left side.`,

    fullHelp: `Whenever you break a brick, your combo will increase by one, so you'll get one more coin from all the next bricks you break.
         However, your combo will reset as soon as your ball hits the left side . 
        As soon as your combo rises, the left side becomes red to remind you that you should avoid hitting them. 
        The effect stacks with other combo perks, combo rises faster with more upgrades but will also reset if any
         of the reset conditions are met.`,
  },
  {
    requires: "",
    threshold: 0,
    id: "right_is_lava",
    giftable: true,
    name: "Avoid right side",
    max: 1,
    help: (lvl: number) => `More coins if you don't touch the right side.`,

    fullHelp: `Whenever you break a brick, your combo will increase by one, so you'll get one more coin from all the next bricks you break.
         However, your combo will reset as soon as your ball hits the right side . 
        As soon as your combo rises, the right side becomes red to remind you that you should avoid hitting them. 
        The effect stacks with other combo perks, combo rises faster with more upgrades but will also reset if any
         of the reset conditions are met.`,
  },
  {
    requires: "",
    threshold: 0,
    id: "top_is_lava",
    giftable: true,
    name: "Sky is the limit",
    max: 1,
    help: (lvl: number) => `More coins if you don't touch the top.`,
    fullHelp: `Whenever you break a brick, your combo will increase by one. However, your combo will reset as soon as your ball hit the top of the screen. 
        When your combo is above the minimum,  a red bar will appear at the top to remind you that you should avoid hitting it. 
        The effect stacks with other combo perks.`,
  },
  {
    requires: "",
    threshold: 0,
    giftable: false,
    id: "skip_last",
    name: "Easy Cleanup",
    max: 7,
    help: (lvl: number) =>
      `The last ${lvl > 1 ? lvl + " bricks" : "brick"} left will self-destruct.`,
    fullHelp: `You need to break all bricks to go to the next level. However, it can be hard to get the last ones. 
        Clearing a level early brings extra choices when upgrading. Never missing the bricks is also very beneficial. 
        So if you find it difficult to break the last bricks, getting this perk a few time can help.`,
  },
  {
    requires: "",
    threshold: 500,
    id: "telekinesis",
    giftable: true,
    name: "Puck controls ball",
    max: 2,
    help: (lvl: number) =>
      lvl == 1
        ? `Control the ball's trajectory.`
        : `Stronger effect on the ball`,
    fullHelp: `Right after the ball hits your puck, you'll be able to direct it left and right by moving your puck. 
        The effect stops when the ball hits a brick and resets the next time it touches the puck. It also does nothing when the ball is going downward after bouncing at the top. `,
  },
  {
    requires: "",
    threshold: 1000,
    giftable: false,
    id: "coin_magnet",
    name: "Coins magnet",
    max: 3,
    help: (lvl: number) =>
      lvl == 1 ? `Puck attracts coins.` : `Stronger effect on the coins`,

    fullHelp: `Directs the coins to the puck. The effect is stronger if the coin is close to it already. Catching 90% or 100% of coins bring special bonuses in the game. 
         Another way to catch more coins is to hit bricks from the bottom. The ball's speed and direction impacts the spawned coin's velocity. `,
  },
  {
    requires: "",
    threshold: 1500,
    id: "multiball",
    giftable: true,
    name: "+1 ball",
    max: 6,
    help: (lvl: number) => `Start every levels with ${lvl + 1} balls.`,
    fullHelp: `As soon as you drop the ball in Breakout 71, you loose. With this perk, you get two balls, and so you can afford to lose one. 
         The lost balls come back on the next level. Having more than one balls makes some further perks available, and of course clears the level faster.`,
  },
  {
    requires: "",
    threshold: 2000,
    giftable: false,
    id: "smaller_puck",
    name: "Smaller puck",
    max: 2,
    help: (lvl: number) =>
      lvl == 1
        ? `Also gives +5 base combo.`
        : `Even smaller puck and higher base combo`,
    fullHelp: `This makes the puck smaller, which in theory makes some corner shots easier, but really just raises the difficulty. 
         That's why you also get a nice bonus of +5 coins per brick for all bricks you'll break after picking this.  `,
  },
  {
    requires: "",
    threshold: 3000,
    id: "pierce",
    giftable: true,
    name: "Piercing",
    max: 3,
    help: (lvl: number) =>
      `Ball pierces ${3 * lvl} bricks after a puck bounce.`,
    fullHelp: `The ball normally bounces as soon as it touches something. With this perk, it will continue its trajectory for up to 3 bricks broken. 
        After that, it will bounce on the 4th brick, and you'll need to touch the puck to reset the counter. This combines particularly well with Sapper. `,
  },
  {
    requires: "",
    threshold: 4000,
    id: "picky_eater",
    giftable: true,
    name: "Picky eater",
    max: 1,
    help: (lvl: number) => `More coins if you break bricks color by color.`,

    fullHelp: `Whenever you break a brick the same color as your ball, your combo increases by one. 
        If it's a different color, the ball takes that new color, but the combo resets.
        The bricks with the right color will get a white border. 
        Once you get a combo higher than your minimum, the bricks of the wrong color will get a red halo. 
        If you have more than one ball, they all change color whenever one of them hits a brick.
        
        `,
  },
  {
    requires: "",
    threshold: 5000,
    giftable: false,
    id: "metamorphosis",
    name: "Stain",
    max: 1,
    help: (lvl: number) => `Coins color the bricks they touch.`,

    fullHelp: `With this perk, coins will be of the color of the brick they come from, and will color the first brick they touch in the same color. Coins spawn with the speed
        of the ball that broke them, which means you can aim a bit in the direction of the bricks you want to "paint".
        `,
  },
  {
    requires: "",
    threshold: 6000,
    id: "compound_interest",
    giftable: true,
    name: "Compound interest",
    max: 1,
    help: () => `+1 combo per brick broken, resets on coin lost`,

    fullHelp: `Your combo will grow by one every time you break a brick, spawning more and more coin with every brick you break. Be sure however to catch every one of those coins
        with your puck, as any lost coin will decrease your combo by one point. One your combo is above the minimum, the bottom of the play area will
        have a red line to remind you that coins should not go there. This perk combines with other combo perks, the combo will rise faster but reset more easily.
        `,
  },
  {
    requires: "",
    threshold: 7000,
    id: "hot_start",
    giftable: true,
    name: "Hot start",
    max: 3,
    help: (lvl: number) =>
      `Start at combo ${lvl * 15 + 1}, -${lvl} combo per second`,
    fullHelp: `At the start of every level, your combo will start at +15 points, but then every second it will be decreased by one. This means the first 15 seconds in a level will spawn
        many more coins than the following ones, and you should make sure that you clear the level quickly. The effect stacks with other combo related perks, so you might be able to raise 
        the combo after the 15s timeout, but it will keep ticking down. Every time you take the perk again, the effect will be more dramatic.
        `,
  },
  {
    requires: "",
    threshold: 9000,
    id: "sapper",
    giftable: true,
    name: "Sapper",
    max: 7,
    help: (lvl: number) =>
      lvl === 1
        ? "The first brick broken becomes a bomb."
        : `The first ${lvl} bricks broken become bombs.`,
    fullHelp: `Instead of just disappearing, the first brick you break will be replaced by a bomb brick. Bouncing the ball on the puck re-arms the effect. "Piercing" will instantly
        detonate the bomb that was just placed. Leveling-up this perk will allow you to place more bombs. Remember that bombs impact the velocity of nearby coins, so too many explosions
        could make it hard to catch the fruits of your hard work. 
        `,
  },
  {
    requires: "",
    threshold: 11000,
    id: "bigger_explosions",
    name: "Kaboom",
    max: 1,
    giftable: false,

    help: (lvl: number) => "Bigger explosions",

    fullHelp: `The default explosion clears a 3x3 square, with this it becomes a 5x5 square, and the blowback on the coins is also significantly stronger. `,
  },
  {
    requires: "",
    threshold: 13000,
    giftable: false,
    id: "extra_levels",
    name: "+1 level",
    max: 3,
    help: (lvl: number) => `Play ${lvl + 7} levels instead of 7`,
    fullHelp: `The default run can last a max of 7 levels, after which the game is over and whatever score you reached is your run score. 
        Each level of this perk lets you go one level higher. The last levels are often the ones where you make the most score, so the difference can be dramatic.`,
  },
  {
    requires: "",
    threshold: 15000,
    giftable: false,
    id: "pierce_color",
    name: "Color pierce",
    max: 1,
    help: (lvl: number) => `Balls pierce bricks of their color.`,
    fullHelp: `Whenever a ball hits a brick of the same color, it will just go through unimpeded. 
        Once it reaches a brick of a different color, it will break it, take its color and bounce.`,
  },
  {
    requires: "",
    threshold: 18000,
    giftable: false,
    id: "soft_reset",
    name: "Soft reset",
    max: 2,
    help: (lvl: number) =>
      `Combo grows ${lvl > 1 ? "even" : ""} slower but resets less.`,
    fullHelp: `The combo normally climbs every time you break a brick. This will sometimes cancel that climb, but also limit the impact of a combo reset.`,
  },
  {
    requires: "multiball",
    threshold: 21000,
    giftable: false,
    id: "ball_repulse_ball",
    name: "Personal space",
    max: 3,
    help: (lvl: number) =>
      lvl === 1 ? `Balls repulse balls.` : "Stronger repulsion force",

    fullHelp: `Balls that are less than half a screen width away will start repulsing each other. The repulsion force is stronger if they are close to each other.
         Particles will jet out to symbolize this force being applied. This perk is only offered if you have more than one ball already.`,
  },
  {
    requires: "multiball",
    threshold: 25000,
    giftable: false,
    id: "ball_attract_ball",
    name: "Gravity",
    max: 3,
    help: (lvl: number) =>
      lvl === 1 ? `Balls attract balls.` : "Stronger attraction force",

    fullHelp: `Balls that are more than half a screen width away will start attracting each other. The attraction force is stronger when they are furthest away from each other.
         Rainbow particles will fly to symbolize the attraction force. This perk is only offered if you have more than one ball already.`,
  },
  {
    requires: "",
    threshold: 30000,
    giftable: false,
    id: "puck_repulse_ball",
    name: "Soft landing",
    max: 2,
    help: (lvl: number) =>
      lvl === 1 ? `Puck repulses balls.` : "Stronger repulsion force",
    fullHelp: `When a ball gets close to the puck, it will start slowing down, and even potentially bouncing without touching the puck.`,
  },
  {
    requires: "",
    threshold: 35000,
    giftable: false,
    id: "wind",
    name: "Wind",
    max: 3,
    help: (lvl: number) =>
      lvl === 1 ? `Puck position creates wind.` : "Stronger wind force",
    fullHelp: `The wind depends on where your puck is, if it's in the center of the screen nothing happens, if it's on the left it will blow leftwise, if it's on the right of the screen
        then it will blow rightwise. The wind affects both the balls and coins.`,
  },
  {
    requires: "",
    threshold: 40000,
    giftable: false,
    id: "sturdy_bricks",
    name: "Sturdy bricks",
    max: 4,
    help: (lvl: number) =>
      lvl === 1
        ? `Bricks sometimes resist hits but drop more coins.`
        : "Bricks resist more and drop more coins",
    fullHelp: `With level one of this perk, the ball has a 20% chance to bounce harmlessly on bricks, 
        but generates 10% more coins when it does break one. 
        This +10% is not shown in the combo number. At level 4 the ball has 80% chance of bouncing and brings 40% more coins.`,
  },
  {
    requires: "",
    threshold: 45000,
    giftable: false,
    id: "respawn",
    name: "Respawn",
    max: 4,
    help: (lvl: number) =>
      lvl === 1
        ? `The first brick hit of two+ will respawn.`
        : "More bricks can respawn",
    fullHelp: `After breaking two or more bricks, when the ball hits the puck, the first brick will be put back in place, provided that space is free and the brick wasn't a bomb.
        Some particle effect will let you know where bricks will appear. Levelling this up lets you respawn up to 4 bricks at a time, but there should always be at least one destroyed.
        `,
  },
  {
    requires: "",
    threshold: 50000,
    giftable: false,
    id: "one_more_choice",
    name: "+1 choice until run end",
    max: 3,
    help: (lvl: number) =>
      lvl === 1
        ? `Further level ups will offer one more option in the list.`
        : "Even more options",
    fullHelp: `Every upgrade menu will have one more option. 
         Doesn't increase the number of upgrades you can pick.  
        `,
  },
  {
    requires: "",
    threshold: 55000,
    giftable: false,
    id: "instant_upgrade",
    name: "+2 upgrades now",
    max: 2,
    help: (lvl: number) =>
      lvl === 1 ? `-1 choice until run end.` : "Even fewer options",
    fullHelp: `Immediately pick two upgrades, so that you get one free one and one to repay the one used to get this perk. Every further menu to pick upgrades will have fewer options to choose from.`,
  },
] as const;
