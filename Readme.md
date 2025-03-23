# Breakout 71

Break colourful bricks, catch bouncing coins and select powerful upgrades !

- [Play now](https://breakout.lecaro.me/)  
- [Donate](https://paypal.me/renanlecaro)
- [Discord](https://discord.gg/DZSPqyJkwP)
- [Post your comments on itch.io](https://renanlecaro.itch.io/breakout71)   
- [Help and tips about the game](./Help.md)
- [Credits](./Credits.md) 
- [Open source android version on F-Droid](https://f-droid.org/en/packages/me.lecaro.breakout/)  
- [Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout)  
- [GitLab](https://gitlab.com/lecarore/breakout71)  
- [HackerNews thread](https://news.ycombinator.com/item?id=43183131)  


# System requirements 

Breakout 71 can work offline (add it to home screen) and perform well even on low-end devices. 
It's very lean and does not take much storage space (Roughly 0.1MB).
If the app stutters, turn on "fast mode" in the settings to render a simplified view that should be faster.
There's also an easy mode for kids (slower ball).
 
# Next
 
- sturdy bricks:  map of remaining hits

# bugs

- perk : travel map 
* [colin] parfois je dois appuyer plusieurs fois sur "Start a new run" pour vraiment commencer une nouvelle partie. dans ce cas, lhécran de jeu derrière se "désassombrit" comme si le jeu avait démarré plusieurs parties en même temps.
* [colin] lorsque le puck est trop petit, l'affichage du combo disparaît. mais c'est peut-être volontaire pour qu'il ne dépasse pas du puck ? afficher simplement le chiffre serait suffisant et tiendrait dans le puck
* [colin] le niveau bug parfois et ne peux pas démarrer. dans ce cas, la balle apparait comme démarrant sans être attachée au puck, comme si la partie avait déjà commencée. il faut redémarrer B71 pour que ça fonctionne
 
# UX
- instead of the free perk at level one, offer to skip lvl 1 and directly pick 4 perks, but only if you manage to clear lvl 1 with 4 upgrades. 
- the onboarding feels weird, missing a tutorial
- It's a bit confusing at first to grasp that one upgrade is applied randomly at the start of the game
- on mobile, add an element that feels like it can be "grabbed" and make it shine while writing "Push here to play"
- add a clickable button to allow sound to play in chrome android
- add pwe manifest 
- offline mode with service worker
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


# graphics

- lights shadows with background gradient light map ? 
- webgl rendering
- shinier coins by applying glow to them
- experiment with showing the combo somewhere else, maybe top center, maybe instead of score. 
- the white outline on bricks associated with picky eater kinda works but i feel it's more distracting than anything. maybe try something different ? put a cross on matching coloured bricks, or the contrary, grey out other bricks.

# New perks ideas 

- [colin] Corner shot - the puck can go beyond the screen limits so as to make corner shots easier.
- [colin] Mental charge - the puck is divided into two smaller pucks, then 3 smaller ones at lvl 2
- [colin] Batteries - lvl1: recharge les pouvoirs du puck quand la balle touche le haut de l'écran (1 fois par lancer, se recharge en touchant le puck). lvl2: également après voir détruit 6 blocs. lvl3: également quand elle touche les bords de l'écran
- [colin] Combos extrêmes: lvl2 pour tous les combos, qui fait que le combo rapporte doubl ou triple, mais si sur un niveau la condition n'est pas respectée alors le perk ne donne plus de combo bonus pour ce niveau.
- [colin] Mytosis - les blocs bombe n'explosent pas mais relâchent une nouvelle balle à la place
- [colin] Juggle - au début du niveau, chaque balle est lancée l'une après au lieu de toutes à la fois
- [colin] Side-kick - briser un bloc par le côté génère plus de coins que par le dessus ou le dessous.
- [colin] Capital - les vies non perdues à la fin du niveau rapportent un bonus de points
- bricks are invisible, but ..
- second puck (symmetric to the first one)
- offer next level choice after upgrade pick
- ban 3 random perks from pool, doesn't tell you which ones, gain 2 upgrades 
- 3 random perks immediately, or maybe "all level get twice as many upgrades, but they are applied randomly, and you aren't told which ones you have."
- wrap left / right
- pause and cheat again 
- wrap top / bottom : coins fall back from top of screen, ball flies to the top and comes back from the screen bottom ? 
- faster coins, double value 
- wind (puck positions adds force to coins and balls)
- balls repulse coins
- n% of coins missed respawn at the top
- lightning : missing triggers and explosive lighting strike around ball path
- coins repulse coins (could get really laggy)
- balls repulse coins
- balls attract coins
- twice as many coins after a wall bounce, twice as little otherwise ?
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
- transparents coins
- coins of different colors repulse
- bricks follow game of life pattern with one update every second 
- 2x coins when ball goes downward / upward, half that amount otherwise ?
- new ball spawns when reaching combo X
- missing with combo triggers explosive lightning strike
- correction : pick one past upgrade to remove and replace by something else 
- puck bounce predictions rendered with particles or lines (requires big refactor)
- the more balls are close to a brick, the more coins she spawns when breaking
- combo resets when puck moves
- [colin] mirror puck - a mirrored puck at the top of the screen follows as you move the bottom puck. it helps with keeping combos up and preventing the ball from touching the ceiling. it could appear as a hollow puck so as to not draw too much attention from the main bottom puck.
- [colin] side pucks - same as above but with two side pucks.
- [colin] ball coins - coins share the same physics as coins and bounce on walls and bricks
- [colin] bigger ball - self-explanatory
- [colin] smaller ball - yes.
- [colin] sturdy ball - does more damage to bricks, to conter sturdy bricks
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
- ball attracted by bricks of the color of the ball
- ball avoids brick of wrong color
- coins avoid ball of different color
- colored coins only (coins should be of the color of the ball to count )
- level flips horizontally every time a ball bounces on puck
- coins that hit the puck disappear, missed ones are scored 
- [colin] close quarters - balle attirée par tous les blocs/par un bloc aléatoire, actif à portée de bloc (+1bloc au lvlup)/proportionnel à une force (+puissance au lvlup)…
- [colin] plusieurs perks qui déclenchent des effets quand une balle est perdue. par ex: +3 combo à chaque balle perdue, 5 blocs transformés en bombe, balle et coins ralentis, blocs régénérés…
- [colin] faster style - augmente le combo en fonction de la vitesse de la balle
- [colin] perk: analyzer - permet de voir les caractéristiques cachées des blocs (sturdy…)
- [colin] perk: roulette - gagne instantanément 2 perks aléatoires
- combo climbs every time a ball bounces on puck (but bounce is random?) 
- combo climbs by 1 every 2 second, unless no coin was caught, then it resets

# extra levels

- famous games
- letters
- fruits
- animals
- countries flags and shapes, with name as background

# extra settings

- add a toggle to switch between the “coin” design and colored bubbles
- on mobile, relative movement of the touch would be amplified and added to the puck 
- option : don't pause on mobile when lifting finger

# Premium: infinite mode

Allow players to loop the game, adding one hasard per loop, making it harder and harder to exploit each strategy. 
The high score are separated from the main mode. The scores are added for unlock. You no longer get upgrades after the first 7 levels.
The score you make in each level is instead multiplied by the number of "upgrades" and "choices" you would have had.

The score is your "fuel", and lets you pick the next level from a list. Each level has a cost, preview, and one or two downgrades. 
Each downgrade acts as a score multiplier. 
Your goal is no longer to score higher, but to go farther

Possible challenges : 
    - Add negative coins that make the coin magnet less usage
    - add negative bricks that clear coins and reset combo
    - add a brick eating enemy that forces you to play fast
    - add a force field for 10s that negates hots start
    - other perks can be randomly turned off
    - ball keeps accelerating until unplayable
    - graphical effects like trail, contrast, blur to make it harder to see what's going on
    - ball creates a draft behind itself that blows coins in odd patterns

- add red anti-coins that apply downgrades
  - destroy your combo
  - hurt your score
  - behave like heavier coins.  
  - deactivate a perk for this level
  - reduce your number of coins 
  - destroy all coins on screen 
  - lowers your combo 
  - reduce your choice for your next perk 
   

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


# other

- balls have gravity : quite hard to balance the strenght of flying off the puck
- non brick-shaped bricks, tilted bricks,moving blocks : not yet
