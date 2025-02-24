# Breakout 71

Break colourful bricks, catch bouncing coins and select powerful upgrades !

[Play now](https://breakout.lecaro.me/) - 
[Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout) - 
[itch.io](https://renanlecaro.itch.io/breakout71) - 
[SubReddit](https://www.reddit.com/r/Breakout71/)
[GitLab](https://gitlab.com/lecarore/breakout71) - 
[Donate](https://github.com/sponsors/renanlecaro)
 

# Goal

The goal is to catch as many coins as possible during 7 levels. 
Coins appear when you break bricks.
They fly around, bounce and roll, and you need to catch them with your puck to increase your score. 
Your score is displayed in the top right corner of the screen.
You must delete all bricks to progress to the next level. 
If you drop the ball, it's game over, unless you had the "extra life" upgrade.

# Upgrades 

After clearing a level, you'll be able to pick upgrades among a small selection presented to you. 
The upgrade you pick will apply until the end of the run. You will get more upgrade choices, and even the ability to pick
multiple upgrades at the end of the level if you play well : catch all coins, clear the level quickly and never miss.
You also get a free random upgrade at the beginning of each run. You can see which upgrades you have
(and a few more details) by clicking your score at the top right of the screen.

Upgrades apply to the whole run and can synergize. For example, if you combine "sapper" and "piercing", the first brick 
you hit after a puck bounce will immediately be transformed to an explosive brick, and detonated by the same ball, 
effectively giving you an explosive ball.  

Some upgrades help with aiming, like "puck control balls". Some upgrades can be picked multiple times to increase the effect, you'll see for example "+1 ball level 2" which adds a third ball.

When you first play, only a few upgrades are available, you unlock the rest by simply playing and scoring points. There's a similar 
mechanic for levels unlock. At the end of a run, the things you just unlocked will be shown, and you can check the full content in menu / unlocks.

Many upgrades impact your combo. 

# Combo

Your "combo" is the number of coins spawned when a brick breaks. It is displayed on your puck, for example x4 means each
brick will spawn 4 coins. It will reset if you miss. 

Many upgrades impact your combo :

### Single puck hit streak

The combo grows by one when breaking a brick, but resets when a ball hits the puck. 
Once you combo is high, the puck will glow red, to remind you that it will hurt your combo to touch it with any ball. 
The combo does not reset when the ball is lost, provided you have more than one ball.

### +3 base combo

The combo starts at 4, and resets to 4 if another upgrade resets it. 
Picking this again will raise the starting combo by 3 each time. 
There are no downsides to this upgrade.

### Shoot straight

The combo grow each time you break a brick. 
The combo resets whenever the ball touches the left or right of the play area. 
Once your combo is a bit high, the sides will glow red to let you know you shouldn't touch them.

### Sky is the limit

The combo grow each time you break a brick. 
The combo resets whenever the ball touches the top of the play area. 
Once your combo is a bit high, the top will glow red to let you know you shouldn't touch it.

### Picky eater

Each time you break a brick, if the ball and brick color are the same, your combo grows by one. 
Otherwise, the combo resets, and the ball takes the color of the brick. 
Bricks of the wrong colors should glow red once you have a small combo going.


### Compound interest

Each time you break a brick, your combo grows by one. 
Each time a coin falls around your puck and is lost, your combo decreases by one.
Once you have a small combo going, the bottom of the screen will glow red around the puck, to remind you to catch all coins.
If you level this further, then the combo grows and shrinks faster.


### Hot start

Your combo starts at 15 at the beginning of the level. 
Every second, it decreases by one. 
If you level this further, the combo starts 15 points higher and shrinks 1 point / s more.


### Soft reset

Whenever your combo resets, it only looses half of its value. 
However, whenever it should increase, it has 50% chance of staying the same. 
If you pick it a second time, the effect is more pronounced : the combo keeps 66% of its value on reset, but only grows 33% of the time.
If you have many perks that grow the combo every time a brick breaks, then it will still grow every time just slower.

# Longer runs

The default run lasts 7 levels. The selection process is to pick those levels at random, then sort them (more or less) by 
number of bricks present, so that runs start with smaller levels and the bigger ones are left for the end. You can extend
the run by picking up to three times the "+1 level" upgrade.

"Sturdy bricks" and "Respawn" can also extend the game time significantly.

# Aiming

What decides how the ball flies away is only the position of the puck hit. If the ball hits the puck dead center, it will
bounce back up vertically, while in you hit more on one side, it will have more angle. 
The puck speed and incoming angle have no impact on the ball direction after bouncing.
You might find that a smaller puck makes it a bit easier to aim near corners, but also makes it much harder to catch coins.
"Wind" and "puck controls ball" can help you aim even after the ball bounced to the wrong direction.
"Slower ball" gives you a bit more time to aim, particularly useful in later levels where the ball goes faster. The ball also
accelerates as you spend time in each level. 

# Requirements 

The app should work offline and perform well even on low-end devices. 
It's very lean and does not take much storage space (Roughly 0.1MB).
If the app stutters, turn on "fast mode" in the settings to render a simplified view that should be faster.
There's also an easy mode for kids (slower ball) and a color-blind mode (no color related game mechanics).

# Roadmap

There are many possible perks left to implement : 

- wrap left / right
- +1 upgrade per level but -2 choices
- n% of the broken bricks respawn when the ball touches the puck
- bricks break 50% of the time but drop 50% more coins
- wind (puck positions adds force to coins and balls)
- balls repulse coins
- n% of coins missed respawn at the top
- lightning : missing triggers and explosive lighting strike around ball path
- coins repulse coins (could get really laggy)
- balls repulse coins
- balls attract coins
- twice as many coins after a wall bounce, twice as little otherwise ? 
- fusion reactor (gather coins in one spot to triple their value)
- missing makes you loose all score of level, but otherwise multiplier goes up after each breaking
- soft reset, cut combo in half instead of zero
- missile goes when you catch coin
- missile goes when you break a brick
- puck bounce +1 combo, hit nothing resets
- multiple hits on the same brick (show remaining resistance as number) 
- bricks attract ball
- replay last level (remove score, restores lives if any, and rebuild )
- accelerometer controls coins and balls
- bricks attract coins
- breaking bricks stains neighbours
- extra kick after bouncing on puck
- transparent coins
- coins of different colors repulse
- bricks follow game of life pattern with one update every second 
- 2x coins when ball goes downward / upward, half that amount otherwise ?
- new ball spawns when reaching combo X
- missing with combo triggers explosive lightning strike
- correction : pick one past upgrade to remove and replace by something else 
- puck bounce predictions rendered with particles or lines (requires big refactor)

The "engine" could be better

- convert captures to mp4 unsing ffmpeg wasm because reddit refuses webm files
- few puck bounces = more choices / upgrades
- disable zooming (for ios double tap)
- particles when bouncing on sides / top
- show total score on end screen (score added to total) 
- show stats on end screen compared to other runs
- handle back bouton in menu 
- mouvement relatif du puck
- balls should collide with each other
- when game resumes near bottom, be unvulnerable for .5s ? , once per level
- apply global curve / brightness to canvas when things blow, or just always to make neon effect better
- manifest for PWA (android and apple)  
- lights shadows  
- keyboard support
- Offline mode web for iphone 
- controller support on web/mobile
- webgl rendering
- enable export of gameplay capture in webview
- endgame histograms could work as filters, when you hover a bar, all other histograms would show the stats of those runs only, without changing reference of categories


Some extra levels wouldn't hurt

- famous games
- letters
- fruits
- animals


# Credits

I pulled many background patterns from https://pattern.monster/
They are displayed in [patterns.html](patterns.html) for easy inclusion.

Some of the sound generating code was written by ChatGPT, and heavily
adapted to my usage over time.

Some of the pixel art is taken from google image search results, I hope to replace it by my own over time : 
[Heart](https://www.youtube.com/watch?v=gdWiTfzXb1g)  
[Mushroom](https://pixelartmaker.com/art/cce4295a92035ea)
 

I wanted an APK to start in fullscreen and be able to list it on fdroid and the play store. I started with an empty view and went to work trimming it down, with the help of that tutorial 
https://github.com/fractalwrench/ApkGolf/blob/master/blog/BLOG_POST.md
