# Breakout 71

Break colourful bricks, catch bouncing coins and select powerful upgrades !

- [Play now](https://breakout.lecaro.me/)  
- [Donate](https://paypal.me/renanlecaro)
- Bitcoin : bc1qlh8kywy3ttsuqqa08yx2rdc8dqhdvyt43wlxmr
- [Discord](https://discord.gg/bbcQw4x5zA)
- [itch.io](https://renanlecaro.itch.io/breakout71)    
- [F-Droid](https://f-droid.org/en/packages/me.lecaro.breakout/)  
- [Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout)  
- [GitLab](https://gitlab.com/lecarore/breakout71)  

# Current priorities 

The goal of this project is to make a game used by many people. 
The game is already pretty fun.

I'm now trying to translate it to (Lebanese) Arabic, Russian and (Chilean) Spanish. 
Other translation are very welcome, contact me if you'd like to submit one.
 

# Changelog
## To do

- redo video presentation

## Done

- option: reuse past frame's light in new frame lighting computation when there are 150+ coins on screen, to limit the performance impact of rendering lots of lights 

## 29084606

- simpler and more readable encoding for save files
- removed check of payload signature on save file, seemed to fail because of the poor encoding of the name of the "côte d'ivoire" level
- automatic detection of the number of steps required for physics
- trial runs detection fix

## 29083397

- highlight last used creative level
- access autoplay mode from the menu
- access stress test mode from the menu, show real time stats 
- Render bottom border differently to show how far the puck can go
- Corner Shot:  scale like Need Some Space
- grey out irrelevant options in the settings
- Back to Creative Menu at the end of a Creative level

## 29080170

- don't show unlock toast at first startup for levels that are unlocked by default
- Droplet particle color should be gold for gold coins 
- added levels: A Very Dangerous High-Five,  The Boys

## 29079818

- Imported levels : Mario, Minesweeper and Target
- Fixed an issue with localstorage saving of custom levels


## 29079805

- combo text on paddle will be grey if we're at the base combo
- transparency now rounds up
- import level up to 21 x 21
- corrected icon of "padding"

## 29079087

- measured and improve the performance (test here https://breakout.lecaro.me/?stresstest)
- added a few levels
- autoplay mode (with wake lock and computer play https://breakout.lecaro.me/?autoplay )
- Added particle and sound effect when coin drops below the "waterline" of the puck
- slower coins fall once they are under the paddle 
- in game level editor
- allow loading newer save in outdated app (for rollback)
- game crashes when reaching level 12 (no level info in runLevels)

## 29074385

- added back some extra languages
- superhot: fixed particles durations and level duration
- bricks aattract coins : less powerfull 
- bricks attract balls
- unbounded nerf : just adds padding around bricks, not combo add
- don't tell user to get -100 points to unlock level
- display colored coins when there's hypnosis or rainbow enabled

## 29071903

- new perk : hypnosis
- new perk : rainbow
- new perk : bricks attract coins
- Extra choice: wrong text for french "2 more choices"
- metamorphosis : when coins are spent, display them hollowed out
- super hot : starting level rework
- zen : added bombs to starting level

## 29071527

- super hot : time moves only when paddle moves. Later levels slow down even more the time when you're not moving.
- transparency : ball becomes transparent towards top of screen, +50% coins. 
- space coins : coins bounce without loosing momentum
- trickledown : coins spawn at the top of the screen
- unlocked content : start with perk icon as level
- allow removing all starting perks, to get full random
- rename "puck" into paddle
- use french as base language to keep consistent formal/informal tone 
- fixed memory leak in language detection code

## 29069860

- when rendering level icons, always use transparent background
- resized some levels to use as flags, added some missing languages as levels
- added machine translation, so that translators can try the game in their language first : ar,de,es,ko,ru,ur,uz,zh 
- change translation keys to get better sorted files 
- change fortunate ball to work more like coin magnet, carrying the balls around to catch them at next puck bounce
- add a test to forbid more than 5% grey bricks on black background, remove grey bricks border
- simplified texts to make translation easier 
- fixed some issues around saved level unlocks
- change donation text to not suggest an amount
- limited history to top 100 runs

## 29068563

- review the "next unlocks" in score and game over
- As soon as upgrade condition is reached, toast 
- As soon as level condition is reached, lock it in and tell the user 
- extra life only saves your last ball, max 7 instead of 3
- Don't use "RAZ" in French explanations. 
- explain ghost coin's slow down effect
- when there are only a few coins, make them brighter
- Perk : [colin] minefield 
- clear scheduled sounds if sounds off
- show unlocked levels above game stats in gameover screen
- reduce resolution of lights even more (1/16)

## 29067205

- tooltip isn't readable at bottom of screen
- added levels as tributes to game players
- display closest unlock with current perks in score and gameover screens
- initial perk icon = first level 
- fix starting perk option not working
- progress bar for unlock in unlocks menu  
- display runs history
- in the runs history, only save perks that were chosen by the user
- migration to save past content to localStorage.recovery_data right before starting a new version
- mention unlock conditions in help
- show unlock condition in unlocks menu for perks as tooltip
- fallback for mobile user to see unlock conditions
- New perk : "limitless" raises the max of all perks by 1 
- Boosted perk : side kick, now you just need to hit bricks from the left side to gain +lvl combo, hitting from the right side does -2xlvl combo
- add unlock conditions for levels in the form "reach high score X with perk A,B,C but without perk B,C,D"
- remove loop mode :
  - remove basecombo
  - remove mode
  - clear old runs in other mode
- ignore scores in creative mode
- remove the slow mode
- adjusted the light effects
- added white border around dark grey bricks
- remove the opaque coin options, all coins are opaque, but dark grey ones have white border
- archive each version as an html file and apk
- publish 29062687 on play store
- redo video
- review fastlane text

- tried and cancelled native desktop app build with tauri because : 
  - there's no cross compilation, so no exe build on linux
  - you need to sign executable differently for each platform
  - the .deb and .rmp files were 3.8M for a 0.1M app 
  - the appimage was crazy big (100M)
  - I'd need a mac to make a mac version that probably wouldn't run without doing the app store dance with apple

## 29062687

- tried and cancelled webgl rendering
  - it's a lot of code
  - i'm not great at it
  - it requires a significant rewrite
  - for most things, no perf difference
  - the main goal of having more colorful backgrounds can be achieved by running the lights layer at lower res
- "Miss warning" option is now on by default (ball's particles are red if catching it would be a "miss")
- "Show +X in gold"  option is now on by default (show a +X when combo increases)
- "High contrast" option added, off by default (applies lights layer again as "soft light" at the end of the render)
- "Colorful coins" option now applied at render time instead of coin spawn time, to make preview easier
- when settings are opened on pc, they show up on the side and the overlay is transparent to let you preview the changes

## 29062545

- Perks list now only lists upgrades that have been picked, or have banned levels 
- After clearing a level, that level is dimmed in the clairvoyant level list [Bearded-Axe]
- limited clairvoyant to level one outside looped runs [obigre]
- yoyo now has more effect when the ball is at the top of the screen [obigre]
- telekinesis now has more effect when the ball is at the bottom of the screen 
- "Top is lava" combo lost text is now spawned a bit lower to be more visible [obigre]

## 29061838

- New perk : Fountain toss [colin] - loosing coins makes your combo grow  
- Boosted : Asceticism now decreases combo instead of resetting it
- Graphics : show respawn particles even in basic mode [obigre]
- Graphics : adjusted the brightness of the game a bit more

## 29061490
 
- Graphics : option to add more light (on by default)
- Graphics : option to make coins more readable (on by default)
- Graphics : background light effects optimization 
- Graphics : all levels background have been checked (4 buggy ones removed) and will be assigned randomly
- Fixed : display gained combo was showing +0 sometimes

## 29060272

- Fixed: Strict sample size was counting destroyed bricks, now count hits as explained in the help
- Fixed: passive_income was resetting your combo if you moved around the end of the last level 
- Fixed: a high score issues was systematically erasing the high score in the web version, i added a migration to load the best score for your top games to recover the high score.
- QOL: option to display gained combo as onscreen text
- QOL: publish an apk to itch.io with every build 
- Internal: added a simple game data migration system 

## 29059721

- QOL: icons in settings menu
- QOL: choose starting perks
- QOL: fixed issue with reloading with [R] key
- QOL: gameover screen restarts in the same game mode
- Fixed: Trampoline render sides in red. 
- Fixed: tooltips stuck on mobile
- Fixed: issues with restarting a game with fullscreen on

## 29058981

- [jaceys] A visual indication of whether a ball has hit a brick this serve (as an option)
- Top down /reach: now only the lowest level of N bricks resets combo, and all other bricks do +N combo 
- picky eater: don't reset if no brick of ball color
- main menu : show high score
- keep high score of past runs
- tooltip on stats
- fixed : looping didn't work
- two abstract levels, stripes and openings
- added reset button for perks in lab mode

## 29058469

- New game mode : loop / long game
  - the goal is to build many different build centered on one perk
  - At the end of level 7, you get to restart at level 1 for 6 levels.
  - all your perks are banned except one
  - The perk you keep is leveled up, and can be leveled up a second time during the next loop
  - the perks you don't keep are "banned", meaning their max level is reduced by as many levels as you had picked
  - unlocked after unlocking all perks
- New game mode : lab / creative
  - the goal is to come up with 3 completely different but powerful play styles 
  - you freely create 3 builds from all the perks level available
  - you play them against the levels of your choice
  - try to make as much score as possible in total
  - unlocked after unlocking all perks
- New levels : 
  - Pingwin
  - Sunglasses
  - Balloon
- Adjusted levels : 
  - orca is no longer made of bombs, but gray block
- New perks
  - addiction : reward faster gameplay
- Adjusted perks
  - Hot start : 30 combo per level instead of 15
  - Telekinesis: limited to level 1  
  - Asceticism now gives +3 combo per lvl
  - Fortunate ball has a stronger effect
  - Bigger puck : puck can now cover the whole screen at higher levels, but not more
  - Corner shot : higher levels let you move further away from the play area
  - Forgiving : level 2 halves the penalty, level 3 is a third .. 
  - Helium : stronger anti gravity at higher levels
  - Implosions : works like bigger-explosions at higher levels
  - Metamorphosis : coins can stain more bricks at higher levels
  - Re-spawn : now delay based and probabilistic, to scale more easily with higher levels. no need to hit the puck
  - sacrifice : at level 2+ the combo is doubles/tripled just before clearing the screen of any bricks
  - shunt : changed the math keep 25% of combo at level 1,50% at level 2,63% at level 3,70% at level 4..
  - soft reset : same math as shunt  
  - smaller puck : now the puck can get as small as a ball 
  - Unbounded : at level 2+, the top of the level is gone too
  - concave_puck : ball bounces straighter and straighter, to the point where you can't move it without another perk
  - shocks lvl 2+ make bigger explosions
  - trampoline: nerfed a little bit, now all sides and top hit reduce combo 
  
- Quality of life 
  - Updated discord invite link that had expired 
  - Full screen is now a persistent option, when it's on the game will switch to full screen before starting
  - Added an option to always get colored coins
  - Made the "combo lost" text last 500ms instead of the pointless 150ms 
  - Added in-game help and credits, which can be translated 
  - Balancing : you earn an extra perk when playing well, and a reroll when playing perfectly
  - added a prominent "donate" link after 5h of playing, and setting to hide it permanently
  - disabled auto-release to F-Droid, i'll use the web version as the testing ground first
  - added a white border around all coins, to make dark ones visible on dark bg
  - [jaceys] counters for coins lost, misses, and boundary bounces, as well as a timer.
  - Unlocked list : split perk and levels, added tooltips

## 29049575

- added rerolls
- Sacrifice : clear screen instead of doubling coins

## 29048147

- Ascetism : render coins with red border if there's a combo
- Warn about unbounded
- Red border dashes

# Ideas and features 

## Easy perks ideas  
 
- "+1  coin for each brick within a small radius of the broken brick" ? 
- two for one : add a 2 for one upgrade combo to the choice lists
- cash out : double last level's gains  
- snowball :  Combo resets every 0.1s . +1 combo for each combo gained Since last reset.
- Chain reaction : +lvl*lvl combo per brick broken by an explosion, combo resets after explosion is over

- coins stained by balls
- fast pause : pause delay divided by {{lvl}} (helps with teleport)
- [colin] Capital - les vies non perdues à la fin du niveau rapportent un bonus de points
- ban 3 random perks from pool, gain 2 upgrades 
- faster coins, double value 
- balls repulse coins
- n% of coins missed respawn at the ball 
- +1 combo per brick broken after a wall bounce, reset otherwise 
- combo climbs by 1 every 2 second, unless no coin was caught, then it resets
- [colin] golden corners - catch coins at the sides of the puck to double their value
- [colin] varied diet - your combo grows by 2 when your ball changes color, but decreses by one when a brick is broken ?  
- [colin] trickle up - inverse of reach more or less 
- Dividends — +1 combo per 10 coins lost (band-aid for players who struggle, useful addition when choosing Ascetism)
- +lvl combo per bricks / resets after 5/lvl seconds without explosion ?
- +lvl combo per bricks / resets after 5/lvl seconds without coin catch  ?
- +lvl combo per bricks / resets after 5/lvl seconds without ball color change   ?
- +lvl combo per bricks / resets after 5/lvl seconds without sides hit ?
- + lvl x n combo when destroying a brick after bouncing on a side/top n times ?
- make stats a clairvoyant thing
- [colin]P ocket money — bricks absorb coins that touch them, which are released on brick destruction (with a bonus?)
- [colin] turn ball gravity on after a top bar hit, and until bouncing on puck
- fan : paddle motion creates upward draft that lifts coins and balls

## Medium difficulty perks ideas 
- balls collision split them into 4 smaller balls, lvl times (requires rework)
- offer next level choice after upgrade pick
- [colin] mirror puck - a mirrored puck at the top of the screen follows as you move the bottom puck. it helps with keeping combos up and preventing the ball from touching the ceiling. it could appear as a hollow puck so as to not draw too much attention from the main bottom puck.
- [colin] Combos extrêmes: lvl2 pour tous les combos, qui fait que le combo rapporte double ou triple, mais si sur un niveau la condition n'est pas respectée alors le perk ne donne plus de combo bonus pour ce niveau.
- [colin] Mytosis - les blocs bombe n'explosent pas mais relâchent une nouvelle balle à la place (clashes with "shocks" and "sapper")
- [colin] Juggle - au début du niveau, chaque balle est lancée l'une après au lieu de toutes à la fois (needs some work)
- SUPER HOT (time moves when puck moves)
- bricks attract ball
- bricks attract coins
- wrap left / right
- correction : pick one past upgrade to remove and replace by something else 
- +1 combo when ball goes downward, reset if upward
- 2x speed after bouncing on puck
- the more balls are close to a brick, the more combo is gained when breaking it. If only one ball, loose one point or reset
- ball avoids brick of wrong color
- puck slowly follows desired  position, but +1 combo

## Hard perk ideas
- accelerometer controls coins and balls
- [colin] side pucks - same as above but with two side pucks : hard to know where to put them 
- [colin] Perk: second puck in the middle of the screen

## ideas to sort
- wind : move coins based on puck movement not position  
- double coin value when they hit the sides
- [colin]Brambles — coins that touch the walls and ceiling get stuck and are thrown back when the last brick is destroyed
- [colin]Ball of Greed — the ball can collect coins (might be worth dividing into levels: lvl 1, can collect coins only after two bounces on bricks or walls. lvl 2, can collect after 1 bounce. lvl 3, can collect coins anytime)(or change the ball collection radius as the level grows)
- [colin]Phantom ball — the ball phases through 2 bricks then becomes solid (lvl2: through 6 bricks, lvl3; through all bricks until it touches a wall) 
- [colin]Cryptomoney — coins that should be generated by bricks are instantly collected, but count for half their value
- [colin]Relative time — ball speed depends on its position: if it's high up on thi screen it's fast, if it's lower it's slower

- ball attracted by bricks of the color of the ball
- level flips horizontally every time a ball bounces on puck
- [colin] close quarters - balle attirée par tous les blocs/par un bloc aléatoire, actif à portée de bloc (+1bloc au lvlup)/proportionnel à une force (+puissance au lvlup)…
- [colin] plusieurs perks qui déclenchent des effets quand une balle est perdue. par ex: +3 combo à chaque balle perdue, 5 blocs transformés en bombe, balle et coins ralentis, blocs régénérés…
- [colin] faster style - augmente le combo en fonction de la vitesse de la balle
- [colin] perk: roulette - gagne instantanément 2 perks aléatoires 

## extra levels

- Good games : 
  - FTL
  - Nova drift
  - Noita
  - Enter the gungeon
  - Zero Sivert
  - Factorio
  - Swarm
  - Nuclear throne
  - Brigador


- letters and an associated word or name
- famous characters and movies
- famous places : eiffel tower, taj mahal, etc..
- fruits
- animals
- countries flags and shapes


## UX / gameplay

- chill game mode, to just relax your mind :
  - no 7 levels limit
  - no upgrades offered at the end of the level 
  - get a  random perk
  - every 7 level it's replaced by another random perk
  - every 7 levels, +10 base combo and +1 piece
- avoid showing a +1 and -1 at the same time when a combo increase is reset
- explain to iOS users how to add the app to home screen to get fullscreen
- delayed start on mobile to let users place the puck where they want
- experiment with showing the combo somewhere else, maybe top center, maybe instead of score. 
- display a multiplicator if it's not 100%, have some perks add to it


## Game engine features ideas
- add a clickable button to allow sound to play in chrome android
- save state in localstorage for easy resume of a game in progress
- ask for permanent storage
- handle back bouton in menu 
- Offline mode web for iphone 
- controller support on web/mobile
- leaderboard for not using each perk, like "best runs without hot start"
 

## Maybe one day
- https://weblate.org/fr/ quite annoying to have merge conflicts while pushing, i'll enable it later. 
- auto-detect device performance at first startup and adjust settings accordingly (hard to do in any sort of useful way)
- [jaceys] Move the restart button out of the menu, so that it is more easily accessible (will allow user to choose starting perk instead)
- colored coins only (coins should be of the color of the ball to count, otherwise what ? i'd rather avoid negative points)
- coins avoid ball of different color (pointless)
- [colin] wormhole - the puck sometimes don't bounce the ball back up but teleports it to the top of the screen as if it fell through from bottom to top. higher levels reduce the times it takes to reload that effect (not sure how that to word that in 1 setence)
- [colin] Mental charge - the puck is divided into two smaller pucks, then 3 smaller ones at lvl 2 : what's the point ? 
- [colin] sturdy ball - does more damage to bricks, to conter sturdy bricks :that's pierce now
- [colin] plot - plot the ball's trajectory as you position your puck : too hard when you add other perks
- [colin] piggy bank - bricks absorb coins that fall onto it, and release them back as they are broken, with added value : equivalent to Asceticism
- [colin] ball coins - coins share the same physics as coins and bounce on walls and bricks : really hard to balance with speeds and all
- non brick-shaped bricks, tilted bricks,moving blocks : very difficult because of engine optimisations
- 3 random perks immediately, or maybe "all level get twice as many upgrades, but they are applied randomly, and you aren't told which ones you have."
- coins repulse coins, could get really laggy ?
- russian roulette: 5/6 chances to get a free upgrade, 1/6 chance of game over. Not really fun 
- [colin] bigger ball - self-explanatory, or is it ? what's the point ? physics would break now if ball bigger than bricks
- [colin] smaller ball - doable, but why
- [colin] earthquake - when the puck hits any side of the screen with velocity, the screen shakes and a brick explodes/falls from the level. alternatively, any brick you catch with the puck gives you the coins at the current combo rate. each level lowers the amount of hits before a brick falls. Problem : no limit on how often you can slam the puck around
- missile goes when you catch coin
- missile goes when you break a brick 
- [colin] Batteries - lvl1: recharge les pouvoirs du puck quand la balle touche le haut de l'écran (1 fois par lancer, se recharge en touchant le puck). lvl2: également après voir détruit 6 blocs. lvl3: également quand elle touche les bords de l'écran : i'll probably just let the second puck replace this
 - store much more details about run (level by level) as numbers only (instead of json that gets big false)
- [colin] hitman - hit the marked brick for +5 combo. each level increases the combo you get for it.
- [colin] sweet spot - place your puck directly below a moving spot at the top of the level to increase your combo
- [colin] reward the player with more choices/perks for breaking a brick while having reached an increasing combo thresholds. 5 combo, then 10, then 20, then 40 etc… once a threshold is reached you aren't rewarded for that threshold again until you start a rew run
- mobile option: relative movement of the touch would be amplified and added to the puck 
- mobile option: don't pause on mobile when lifting finger
- translate fastlane presentation texts to french
- convert captures to mp4 unsing ffmpeg wasm because reddit refuses webm files
- disable zooming (for ios double tap)
- Waterline under the puck, coins slow down a lot, reflections
- webgl rendering:  background gradient light map, shinier coins, quite hard
- on mobile, add an element that feels like it can be "grabbed" and make it shine while writing "Push here to play"
- hard mode : bricks take many hits, perks more rare, missing clears level score, missing coins deducts score..
- architect mode : 
  - play 7 levels, each with a different build. 
  - Perk levels can only be used once, so if you take one for level 1, you won't have it to level 2-7. 
  - Your final score is your worst score times your best score  
  - You'll see the levels in advance
- stats by lack of perk, like "best score without using hot start". 
- split screen multiplayer
- Add color schemes into the game (ex : Catppuccin, Dracula, Terminal, etc)
- final bosses (large vertical level that scrolls down faster and faster)
- add loop run where user levels can't be used in further loops (boring)
- add lab mode where you need to make three builds (complex, lots of clicking, not fun)

# Credits

I pulled many background patterns from https://pattern.monster/

I wanted an APK to start in fullscreen and be able to list it on fdroid and the play store. I started with an empty view and went to work trimming it down, with the help of that tutorial : https://github.com/fractalwrench/ApkGolf/blob/master/blog/BLOG_POST.md

Colin (obigre) brought a lot of fantastic ideas to the game, here's his website (in French) : https://colin-crapahute.bearblog.dev/

Tõnu Rääk made a Tiermaker template to share your favorite perk choices :  https://tiermaker.com/create/breakout-71-perks-18086724

# Breakout games suggestions

Here are a few interesting games in the breakout genre :

- LBreakoutHD : https://sourceforge.net/p/lgames/code/HEAD/tree/trunk/lbreakouthd/
- Wizorb : https://store.steampowered.com/app/207420/Wizorb/
- Ricochet infinity : https://www.myabandonware.com/game/ricochet-infinity-dxm
- Whackerball : https://store.steampowered.com/app/2192170/Whackerball/

# PC game suggestions

Here are a few games I've sank a lot of time in, and that inspired breakout in some way

- Heat signature : https://www.humblebundle.com/store/heat-signature
- FTL : https://www.gog.com/en/game/faster_than_light
- Nova drift :   https://www.gog.com/en/game/nova_drift
- Noita : https://www.gog.com/en/game/noita
- Enter the gungeon : https://www.gog.com/en/game/enter_the_gungeon
- Zero Sivert : https://store.steampowered.com/app/1782120/ZERO_Sievert/
- Factorio :  https://www.factorio.com/
- Nuclear throne : https://store.steampowered.com/app/242680/Nuclear_Throne/  (don't buy on GOG it's outdated) 
- Brigador :  https://www.gog.com/en/game/brigador
- Teleglitch https://www.gog.com/en/game/teleglitch_die_more_edition


# How to install

Breakout 71 can be installed and work offline in many ways:

- Download an index.html file from [itch.io](https://renanlecaro.itch.io/breakout71) to play offline on your computer (latest version always)
- Download the latest apk from [itch.io](https://renanlecaro.itch.io/breakout71) to play offline on your android phone (latest version always)
- Add [the app](https://breakout.lecaro.me/) to your home screen on android, and it should play even when offline thanks to the service workers (latest version always)
- Install the latest version from the play store  : https://play.google.com/store/apps/details?id=me.lecaro.breakout (updated from time to time) 
- Install the latest version from Fdroid : https://f-droid.org/packages/me.lecaro.breakout/ (updated very rarely because of the updates publication lag) 
- Download the index.html file or apk from my archive server : https://archive.lecaro.me/public-files/b71/ (any version including latests)

# System requirements 

The game should perform well even on low-end devices.  It's very lean and does not take much storage space (Roughly 0.1MB). The web version is supposed to work on iOS safari, Firefox ESR and chrome, on desktop and mobile.
If the app stutters, turn on "fast mode" in the settings to render a simplified view that should be faster. You can adjust many aspects of the game there, go have a look !

