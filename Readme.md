# Breakout 71

Break colourful bricks, catch bouncing coins and select powerful upgrades !

- [Play now](https://breakout.lecaro.me/)  
- [Donate](https://paypal.me/renanlecaro)
- [Discord](https://discord.gg/DZSPqyJkwP)
- [Post your comments on itch.io](https://renanlecaro.itch.io/breakout71)   
- [Help and tips about the game](./Help.md)

- [F-Droid](https://f-droid.org/en/packages/me.lecaro.breakout/)  
- [Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout)  
- [GitLab](https://gitlab.com/lecarore/breakout71)  
- [HackerNews thread](https://news.ycombinator.com/item?id=43183131)  


# Premium: allow looping

Allow players to loop the game :
- keep your score 
- keep 1 perk, level it up beyond the max
- ban all other perks 
- unlock all upgrades in loop 1+

Hard to scale : 
- 


# Todo  
- Make fullscreen an option and turn it back on when playing
- real time stats as the option says. 
- weee sound when ball lost to side or sky

- [jaceys] Counters for coins lost, misses, and boundary bounces, as well as a timer.
 
- people assume unbounded  allows for wrap around
- coin magnet and viscosity : only one level ~2.5
- Boost Ascetism : give +2 or even +3 combo per brick destroyed
- wind : move coins based on puck movement not position
- show -N points in red when combo resets
- reach  is too punishing now, maybe only reset if you hit the lowest populate row of the level, if it's not a full width row 
- respawn: N% of bricks respawn after N seconds
- [jaceys] Move the restart button out of the menu, so that it is more easily accessible
- [jaceys] A visual indication of whether a ball has hit a brick this serve
- [obigre] Offer to level ups perks separately
- bring back detailed help of perks as "intel"
- https://weblate.org/fr/



# System requirements 

Breakout 71 can work offline (add it to home screen) and perform well even on low-end devices. 
It's very lean and does not take much storage space (Roughly 0.1MB).
If the app stutters, turn on "fast mode" in the settings to render a simplified view that should be faster.
There's also an easy mode for kids (slower ball).
 

# UX

- strict sample size red borders ? 
- add some tutorial-like hints
- It's a bit confusing at first to grasp that one upgrade is applied randomly at the start of the game. Offer instead to skip lvl 1 and directly pick 4 perks, but only if you manage to clear lvl 1 with 4 upgrades. 
- on mobile, add an element that feels like it can be "grabbed" and make it shine while writing "Push here to play"
- add a clickable button to allow sound to play in chrome android
- see how to do fullscreen on ios, or at least explain to do aA/hide toolbars
- translation
- when game resumes near bottom, be unvulnerable for .5s ? , once per level


# Game engine features  
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

# graphics

- webgl rendering:  background gradient light map, shinier coins
- experiment with showing the combo somewhere else, maybe top center, maybe instead of score. 

# Easy perks ideas 

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


# Medium difficulty perks ideas 

- offer next level choice after upgrade pick
- Dividends — +1 combo per 10 coins lost (band-aid for players who struggle, useful addition when choosing Ascetism)
- [colin] mirror puck - a mirrored puck at the top of the screen follows as you move the bottom puck. it helps with keeping combos up and preventing the ball from touching the ceiling. it could appear as a hollow puck so as to not draw too much attention from the main bottom puck.
- [colin] Combos extrêmes: lvl2 pour tous les combos, qui fait que le combo rapporte double ou triple, mais si sur un niveau la condition n'est pas respectée alors le perk ne donne plus de combo bonus pour ce niveau.
- [colin] Mytosis - les blocs bombe n'explosent pas mais relâchent une nouvelle balle à la place (clashes with "shocks" and "sapper")
- [colin] Juggle - au début du niveau, chaque balle est lancée l'une après au lieu de toutes à la fois (needs some work)
- SUPER HOT
- bricks attract ball
- bricks attract coins
- wrap left / right
- correction : pick one past upgrade to remove and replace by something else 
- +1 combo when ball goes downward, reset if upward
- 2x speed after bouncing on puck
- the more balls are close to a brick, the more combo is gained when breaking it. If only one ball, loose one point or reset
- ball avoids brick of wrong color

# Hard perk ideas
- accelerometer controls coins and balls
 - [colin] side pucks - same as above but with two side pucks : hard to know where to put them 

# to sort
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

# Probably not
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


# extra levels

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

# extra settings

- add a toggle to switch between the “coin” design and colored bubbles
- on mobile, relative movement of the touch would be amplified and added to the puck 
- option : don't pause on mobile when lifting finger


# extend re-playability
- hard mode : bricks take many hits, perks more rare, missing clears level score, missing coins deducts score..
- stats by lack of perk, like "best score without using hot start". 
- split screen multiplayer
- Add color schemes into the game (ex : Catppuccin, Dracula, Terminal, etc)

Instead of automatically unlocking things at the end of each run, add the coins to the user's account, 
and let them spend those coins on upgrades. The upgrades would then be explained. They could have a condition like
"reach high score of 1000" or 'reach high score of 99999 without using "hot start"'. 
This requires recording a bit more info about each run. 
I could unlock the "pro stand" at $999 that just holds the play area higher. 

# increase skill ceiling

- reroll mechanic, rerolls are reward for better play
- make puck smaller as combo increases ?

- final bosses (large vertical level that scrolls down faster and faster)
- when the player reaches the last level, allow them to loop the run, unlocking a permanent bonus for this run. For example: +5 combo, +1 life per loop… the counterpart would be hazards that slowly populate the levels.
  

# Colin's feedback (cwpute/obigre)
 
* reward the player with more choices/perks for breaking a brick while having reached an increasing combo thresholds. 5 combo, then 10, then 20, then 40 etc… once a threshold is reached you aren't rewarded for that threshold again until you start a rew run
* inspired by Balatro's score system : have some perks add to the multiplicator, and some others to the amount of coins in a brick (or the raw value of coins inside), so that you users want to improve both for maximized profit ! maybe tie one of the to perks that help you, and the other to perks that are bad to you, so that gambling players are forced to make their life harder


# Credits

I pulled many background patterns from https://pattern.monster/
They are displayed in [patterns.html](editor/patterns.html) for easy inclusion.

Some of the sound generating code was written by ChatGPT, and heavily
adapted to my usage over time.

Some of the pixel art is taken from google image search results, I hope to replace it by my own over time : 
[Heart](https://www.youtube.com/watch?v=gdWiTfzXb1g)  
[Mushroom](https://pixelartmaker.com/art/cce4295a92035ea)
https://prohama.com/whale-2-pattern/
https://prohama.com/shark-2-pattern/
https://prohama.com/bird-1-size-13x12/
https://prohama.com/pingwin-4-pattern/
https://prohama.com/dog-21-pattern/

I wanted an APK to start in fullscreen and be able to list it on fdroid and the play store. I started with an empty view and went to work trimming it down, with the help of that tutorial 
https://github.com/fractalwrench/ApkGolf/blob/master/blog/BLOG_POST.md


# Other noteworthy games in the breakout genre

LBreakoutHD : https://sourceforge.net/p/lgames/code/HEAD/tree/trunk/lbreakouthd/

Wizorb https://store.steampowered.com/app/207420/Wizorb/

Rollers of the realm : narratif, chaque balle est un aventurier
https://store.steampowered.com/app/262470/Rollers_of_the_Realm/