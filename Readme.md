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
- Boring cheat – I found out a way to farm points: if you have Respawn 
Lv 3 or 4 you can endlessly hit the same cluster of bricks, and if you 
manage to put the pluck in a comfortable position (i.e. straight line) 
it's very easy to farm plenty of coins with the aid of appropriate combo 
perks. No video though, this happened on the app while I was playing 
casually (it's quite easy to reproduce, though). I wouldn't do that 
because it's mind-numbingly dull, but still I'm not sure this kind of 
play is intended or if it should even be allowed.



# Game engine features  

- the onboarding feels weird, missing a tutorial
- Players can't choose the initial perk
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

# Perks ideas 
- Combo balancing : make Compound Interest less OP by defaulting to soft reset for others, or by making it loose more for each missed coin
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
