# Breakout 71

A simple, single player, challenging arcade breakout game.
The goal is to break all the bricks of 7 levels, which catching as many coins as you can. 
You have only one life, if you lose your ball you'll go back to the start
At the end of each level, you get to select an upgrade.

[Play now](https://breakout.lecaro.me/) - 
[Google Play](https://play.google.com/store/apps/details?id=me.lecaro.breakout) - 
[itch.io](https://renanlecaro.itch.io/breakout71) - 
[GitLab](https://gitlab.com/lecarore/breakout71)
[Donate](https://github.com/sponsors/renanlecaro)

## TODO
 
- Fdroid 
- show total score on end screen (score added to total) 
- show stats on end screen compared to other runs
- handle back bouton in menu
- more levels : famous simple games, letters, fruits, animals
- perk : elastic between balls
- perk : wrap left / right
- perk : twice as many coins after a wall bounce, twice as little otherwise
- perk : fusion reactor (gather coins in one spot to triple their value)
- perk : missing makes you loose all score of level, but otherwise multiplier goes up after each breaking
- perk : n/10 of the broken bricks respawn when the ball comes back   
- perk : bricks take twice as many hits but drop 50% more coins
- perk : wind (puck positions adds force to coins and balls) 
- perk : balls repulse each other
- perk : balls repulse coins

## maybe

- Make a small mp4 of game which can be shown on gameover and shared. https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- perk : soft reset, cut combo in half instead of zero
- perk : missile goes when you catch coin
- perk : missile goes when you break a brick
- when game resumes near bottom, be unvulnerable for .5s ? , once per level
- accelerometer controls coins and balls
- mouvement relatif du puck
- balls should collide with each other
- randomize coins gravity a bit, to make fall more appealing
- apply global curve / brightness to canvas when things blow, or just always to make neon effect better
- perk: bricks attract coins
- perk : puck bounce +1 combo, hit nothing resets
- manifest for PWA (android and apple)
- publish on fdroid 
- nerf the hot start a bit
- brick parts fly around with trailing effect ? 
- trailing white lines behind ball 
- some 3d ish effect ? 
- shrink brick at beaking time ? 
- perk : multiple hits on the same brick (show remaining resistance as number)
- particle effect around ball when loosing some combo (looks bad)
- Make bricks shadow the light ? using a "fill path" in screen mode, with a gradient background...would get very laggy, maybe just for the ball
- keyboard support 
- perk : bricks attract ball
- perk : replay last level (remove score, restores lives if any, and rebuild )
- perk: breaking bricks stains neighbours
- perk: extra kick after bouncing on puck
- perk: transparent coins
- perk: coins of different colors repulse
- 2x coins when ball goes downward ?
- engine: Offline mode web for iphone 
- engine: webgl rendering (not with sdf though, that's super slow)



## Credits

I pulled many background patterns from https://pattern.monster/
They are displayed in [patterns.html](patterns.html) for easy inclusion.
Some of the sound generating code was written by ChatGPT, and heavily
adapted to my usage over time. Some of the pixel art is taken from google
image search. I hope to replace it by my own over time. 

[Heart](https://www.youtube.com/watch?v=gdWiTfzXb1g)
[Sonic](https://www.deviantart.com/graystripe2000/art/Pixel-art-16x16-Sonic-936384096)
[Finn](https://at.pinterest.com/pin/finn-the-human-pixel-art--140806230775275/)
[Mushroom](https://pixelartmaker.com/art/cce4295a92035ea)

## APK version

The web app is around 50kb, compressed down to 10kb with gzip
I wanted an APK to start in fullscreen and be able to list it on fdroid and the play store. 

I stated with an empty view and went to work trimming it down, with the help of that tutorial
https://github.com/fractalwrench/ApkGolf/blob/master/blog/BLOG_POST.md
