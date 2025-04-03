# Breakout 71

Break colourful bricks, catch bouncing coins and select powerful upgrades !

- [Play now](https://breakout.lecaro.me/)  
- [Donate](https://paypal.me/renanlecaro)
- Bitcoin : bc1qlh8kywy3ttsuqqa08yx2rdc8dqhdvyt43wlxmr
- [Discord](https://discord.gg/bbcQw4x5zA)
- [Post your comments on itch.io](https://renanlecaro.itch.io/breakout71)    
- [F-Droid](https://f-droid.org/en/packages/me.lecaro.breakout/)  
- [Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout)  
- [GitLab](https://gitlab.com/lecarore/breakout71)  



# Changelog

## Todo

## Next release

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
 
## 29059721.

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

## UX / gameplay

- mobile option: relative movement of the touch would be amplified and added to the puck 
- mobile option: don't pause on mobile when lifting finger
- [obigre] Offer to level ups perks separately from picking new ones 
- strict sample size red borders ?
- on mobile, add an element that feels like it can be "grabbed" and make it shine while writing "Push here to play"
- add a clickable button to allow sound to play in chrome android
- see how to do fullscreen on ios, or at least explain to do aA/hide toolbars
- when game resumes near bottom, be unvulnerable for .5s ? , once per level


## Game engine features ideas
- save state in localstorage for easy resume of a game in progress
- ask for permanent storage
- more help somewhere accessible
- limit GC by reusing coins and particles
- convert captures to mp4 unsing ffmpeg wasm because reddit refuses webm files
- disable zooming (for ios double tap)
- few puck bounces = more choices / upgrades
- show total score on end screen (score added to total) 
- handle back bouton in menu 
- balls could collide with each other
- manifest for PWA (android and apple)  
- Offline mode web for iphone 
- controller support on web/mobile
- enable export of gameplay capture in webview
- endgame histograms could work as filters, when you hover a bar, all other histograms would show the stats of those runs only, without changing reference of categories
- would be nice to have a leaderboard for not using each perk too. Like "best runs without hot start"
- restart run on r
- when missing, redo particle trail, but give speed to particle that matches ball direction
- Overgrowth — when the ball touches a bomb brick it turns into a regular green brick and spawns 1 more bricks near it (additional levels spawn 2 additional bricks)

## graphics ideas
- Waterline under the puck, coins slow down a lot, reflections
- webgl rendering:  background gradient light map, shinier coins
- experiment with showing the combo somewhere else, maybe top center, maybe instead of score. 

## Easy perks ideas  
- snowball :  Combo resets every 0.1s . +1 combo for each combo gained Since last reset.
- Chain reaction : +lvl*lvl combo per brick broken by an explosion, combo resets after explosion is over
- coins doubled when touched by ball, lvl times, looks smaller and lighter
- coins stained by balls
- [vikingerik] : reward multiballs with combo somehow
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

## Hard perk ideas
- accelerometer controls coins and balls
 - [colin] side pucks - same as above but with two side pucks : hard to know where to put them 

## ideas to sort
- wind : move coins based on puck movement not position  
- loop only when 7 rerolls have been acumulated. 
- store much more details about run (level by level) as numbers only (instead of json that gets big false)
- double coin value when they hit the sides
- [colin]Brambles — coins that touch the walls and ceiling get stuck and are thrown back when the last brick is destroyed
- [colin]Ball of Greed — the ball can collect coins (might be worth dividing into levels: lvl 1, can collect coins only after two bounces on bricks or walls. lvl 2, can collect after 1 bounce. lvl 3, can collect coins anytime)(or change the ball collection radius as the level grows) 
- [colin]Fountain toss — each coin lost has a 1 in 10 chance to give +1 combo (until combo 50)
- [colin]Pocket money — bricks absorb coins that touch them, which are released on brick destruction (with a bonus?)
- [colin]Phantom ball — the ball phases through 2 bricks then becomes solid (lvl2: through 6 bricks, lvl3; through all bricks until it touches a wall) 
- [colin]Cryptomoney — coins that should be generated by bricks are instantly collected, but count for half their value
- [colin]Relative time — ball speed depends on its position: if it's high up on thi screen it's fast, if it's lower it's slower
- [colin] turn ball gravity on after a top bar hit, and until bouncing on puck
- [colin] hitman - hit the marked brick for +5 combo. each level increases the combo you get for it.
- [colin] sweet spot - place your puck directly below a moving spot at the top of the level to increase your combo
- ball attracted by bricks of the color of the ball
- level flips horizontally every time a ball bounces on puck
- coins that hit the puck disappear, missed ones are scored 
- [colin] close quarters - balle attirée par tous les blocs/par un bloc aléatoire, actif à portée de bloc (+1bloc au lvlup)/proportionnel à une force (+puissance au lvlup)…
- [colin] plusieurs perks qui déclenchent des effets quand une balle est perdue. par ex: +3 combo à chaque balle perdue, 5 blocs transformés en bombe, balle et coins ralentis, blocs régénérés…
- [colin] faster style - augmente le combo en fonction de la vitesse de la balle
- [colin] perk: analyzer - permet de voir les caractéristiques cachées des blocs (sturdy…)
- [colin] perk: roulette - gagne instantanément 2 perks aléatoires
- combo climbs every time a ball bounces on puck (but bounce is random?) 
- [colin] reward the player with more choices/perks for breaking a brick while having reached an increasing combo thresholds. 5 combo, then 10, then 20, then 40 etc… once a threshold is reached you aren't rewarded for that threshold again until you start a rew run
- [colin] inspired by Balatro's score system : have some perks add to the multiplicator, and some others to the amount of coins in a brick (or the raw value of coins inside), so that you users want to improve both for maximized profit ! maybe tie one of the to perks that help you, and the other to perks that are bad to you, so that gambling players are forced to make their life harder

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
- fruits
- animals
- countries flags and shapes



## extend re-playability
- hard mode : bricks take many hits, perks more rare, missing clears level score, missing coins deducts score..
- architect mode : 
  - play 7 levels, each with a different build. 
  - Perk levels can only be used once, so if you take one for level 1, you won't have it to level 2-7. 
  - Your final score is your worst score times your best score  
  - You'll see the levels in advance

- stats by lack of perk, like "best score without using hot start". 
- split screen multiplayer
- Add color schemes into the game (ex : Catppuccin, Dracula, Terminal, etc)

Instead of automatically unlocking things at the end of each run, add the coins to the user's account, 
and let them spend those coins on upgrades. The upgrades would then be explained. They could have a condition like
"reach high score of 1000" or 'reach high score of 99999 without using "hot start"'. 
This requires recording a bit more info about each run. 

- final bosses (large vertical level that scrolls down faster and faster)

## Rejected ideas
- https://weblate.org/fr/ quite annoying to have merge conflicts while pushing, i'll enable it later. 
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

