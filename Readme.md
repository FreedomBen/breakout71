# Breakout 71

Break colourful bricks, catch bouncing coins and select powerful upgrades !

- [Play now](https://breakout.lecaro.me/)  
- [Post your comments on itch.io](https://renanlecaro.itch.io/breakout71)   
- [Help and tips about the game](./Help.md)
- [Credits](./Credits.md) 
- [Open source android version on F-Droid](https://f-droid.org/en/packages/me.lecaro.breakout/)  
- [Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout)  
- [GitLab](https://gitlab.com/lecarore/breakout71)  
- [HackerNews thread](https://news.ycombinator.com/item?id=43183131)  
- [Donate](https://github.com/sponsors/renanlecaro)


# Requirements 

The app should work offline and perform well even on low-end devices. 
It's very lean and does not take much storage space (Roughly 0.1MB).
If the app stutters, turn on "fast mode" in the settings to render a simplified view that should be faster.
There's also an easy mode for kids (slower ball).

# bugs

- having Hot Start and Single puck hit streak perks in a run resets combo from start [29014379] 
- The ball goes through Sturdy bricks sometimes, but it does not break 
nor bounce back after hitting them (and indeed this does not cause a 
miss). In the video you can clearly witness it several time, and it 
becomes especially apparent towards the end. I guess this is somehow 
related to Color Piercing or Piercing (or both).
- Easy Cleanup activates twice if the latest Respawn happens before all 
the coins have been caught or fallen off screen. As you can see, I had 
Lv 1 on both the perks: the ball hit the second to last brick, the last 
one is automatically destroyed, but then another one gets respawned and 
quickly destroyed again.


# Game engine features  

- the onboarding feels weird, missing a tutorial
- apk version soft locks at start.    
- shinier coins by applying glow to them ? 
- ask for permanent storage
- It's a bit confusing at first to grasp that one upgrade is applied randomly at the start of the game
- on mobile, add an element that feels like it can be "grabbed" and make it shine while writing "Push here to play"
- add a clickable button to allow sound to play in chrome android
- offline mode with service worker
- add pwe manifest 
- see how to do fullscreen on ios, or at least explain to do aA/hide toolbars
- experiment with showing the combo somewhere else, maybe top center, maybe instead of score. 
- more help somewhere accessible
- limit GC by reusing coins and particles
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
- Offline mode web for iphone 
- controller support on web/mobile
- webgl rendering
- enable export of gameplay capture in webview
- endgame histograms could work as filters, when you hover a bar, all other histograms would show the stats of those runs only, without changing reference of categories
- sound when ball changes color
- option : don't pause on mobile when lifting finger
- option : accelerated relative movements on mobile
- maybe just have 10 background, and always use the same one for the nth level of each run  ?  
- would be nice to have a leaderboard for not using each perk too. Like "best runs without hot start"
- restart run on r
- when missing, redo particle trail, but give speed to particle that matches ball direction

# New perks ideas 
- second puck (symmeric to the first one)
- keep combo between level, loose half your run score when missing any bricks
- offer next level choice after upgrade pick
- ban 3 random perks from pool, doesn't tell you which ones, gain 2 upgrades 
- 3 random perks immediately, or maybe "all level get twice as many upgrades, but they are applied randomly, and you aren't told which ones you have."
- wrap left / right
- pause and cheat again 
- wrap top / bottom : coins fall back from top of screen, ball flies to the top and comes back from the screen bottom ? 
- faster coins, double value
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
- the more balls are close to a brick, the more coins she spawns when breaking
- combo resets when puck moves
- gravity is flipped on the opposite side to the puck (for coins)
- balls have gravity
- coins don't have gravity
- [colin] yoyo - when the ball falls back down, it curbs towards your puck (after hitting a brick or top)
- [colin] single block combo - get +1 combo if the ball only breaks a single block before reaching the puck
- [colin] mirror puck - a mirrored puck at the top of the screen follows as you move the bottom puck. it helps with keeping combos up and preventing the ball from touching the ceiling. it could appear as a hollow puck so as to not draw too much attention from the main bottom puck.
- [colin] side pucks - same as above but with two side pucks.
- [colin] ball coins - coins share the same physics as coins and bounce on walls and bricks
- [colin] phantom coins - coins pass through bricks
- [colin] drifting coins - coins slowly drift away from the brick they were generated from, and they need to be collected by the ball
- [colin] bigger ball - self-explanatory
- [colin] smaller ball - yes.
- [colin] sturdy ball - does more damage to bricks, to conter sturdy bricks
- [colin] accumulation - coins aglutinate into bigger coins that hold more value
- [colin] forgiving - you can miss several times without losing your combo. or alternatively, include this ability into the soft reset perk.
- [colin] plot - plot the ball's trajectory as you position your puck
- [colin] golden corners - catch coins at the sides of the puck to double their value
- [colin] varied diet - your combo grows if you keep hitting different coloured bricks each time
- [colin] earthquake - when the puck hits any side of the screen with velocity, the screen shakes and a brick explodes/falls from the level. alternatively, any brick you catch with the puck gives you the coins at the current combo rate. each level lowers the amount of hits before a brick falls
- [colin] statue - stand still to make the combo grow. move for too long and thi combo will quickly drop
- [colin] piggy bank - bricks absorb coins that fall onto it, and release them back as they are broken, with added value
- [colin] trickle up - if you first hit is the lowest brick of a column, all bricks above get +1 coin inside
- [colin] wormhole - the puck sometimes don't bounce the ball back up but teleports it to the top of the screen as if it fell through from bottom to top. higher levels reduce the times it takes to reload that effect
- [colin] hitman - hit the marked brick for +5 combo. each level increases the combo you get for it.
- [colin] sweet spot - place your puck directly below a moving spot at the top of the level to increase your combo

# Balancing ideas

The dominant strategy now is Compound Interest lvl 3 + coin magnet/viscosity/
and hot start + explosives and multiball

- make Compound Interest less OP making it full reset when coins lost
- cap hot start to lvl 2, or make it decrease faster
- make puck smaller as combo increases ? 
- coin magnet has no effect when too close, or coins might overshoot, or coins bounce and spread more ? 
- add red anti-coins, they destroy your combo and your score, and they behave like heavier coins.  

# extra levels

- famous games
- letters
- fruits
- animals
- countries flags and shapes, with name as background

# big features

- use ts and a bundler to get fewer bugs and compatibility with old browsers / webviews
- final bosses (large vertical level that scrolls down faster and faster)
- split screen multiplayer
- translation
- Add color schemes into the game (ex : Catppuccin, Dracula, Terminal, etc)
- add a toggle to switch between the “coin” design and colored bubbles
- sandbox mode
- hard mode : bricks take many hits, perks more rare, missing clears level score, missing coins deducts score..
- stats by lack of perk, like "best score without using hot start". 

Instead of automatically unlocking things at the end of each run, add the coins to the user's account, 
and let them spend those coins on upgrades. The upgrades would then be explained. They could have a condition like
"reach high score of 1000" or 'reach high score of 99999 without using "hot start"'. 
This requires recording a bit more info about each run. 
I could unlock the "pro stand" at $999 that just holds the play area higher. 


# Colin's feedback (cwpute/obigre)
 
IMPROVEMENTS ON EXISTING PERKS  :

* instead of "lives", have the perk be like a fourth wall that prevents the ball from falling down but disapears after one strike. it is functionally the same but provides visual feedback to the player so they know they have that perk.
* limit levels to only a handful of coulours, like 5 max, so that the colour-related perks are more viable.

GENERAL REMARKS ON DIFFERENT ASPECTS :

* when the player reaches the last level, alow them to loop the run, unlocking a permanent bonus for this run. For example: +5 combo, +1 life per loop… the counterpart would be hazards that slowly populate the levels.
* different visual effects on ball to represent which perks it's imbued with (pierce, sapper…). remove visual while it's not affected (can't pierce/sap anymore until touching the puck).
* always visually put the ball on top of coins so as to clearly see it. sometimes a black outline appears to distinguesh it from coins, this should be used more often imo.
* not brick-shaped bricks, or tilted bricks, that can bounce the ball into fun angles to spice up the game. or even moving blocks !
* reward the player with more choices/perks for breaking a brick while having reached an increasing combo thresholds. 5 combo, then 10, then 20, then 40 etc… once a threshold is reached you aren't rewarded for that threshold again until you start a rew run
* inspired by Balatro's score system : have some perks add to the multiplicator, and some others to the amount of coins in a brick (or the raw value of coins inside), so that you users want to improve both for maximized profit ! maybe tie one of the to perks that help you, and the other to perks that are bad to you, so that gambling players are forced to make their life harder
* the white outline on bricks asociated with picky eater kinda works but i feel it's more distracting than anything. maybe try something different ? put a cross on matching coloured bricks, or the contrary, grey out other bricks.
* also regarding colour : make it so the ball always start with a colour that matches one currently present in the level. sometimes you don't have white present and it's a waste of a combo :/
* negative coins, they would spawn from bricks as a hazard and do any of the following: -deactivate a perk for this level -reduce your number of coins -reduce your choice for your next perk -despawn all current coins on screen -lowers your combo. they could either be a negative perk with a bonus, like the small puck, or a hazard that spawns in later levels.
* the way combos look on the puck was better when you didn't see the coin visual on it ! now it easily overflows out of the puck with reduced visibility

