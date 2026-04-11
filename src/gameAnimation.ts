import {GameState, PerkId, RunParams, Upgrade} from "./types";
import {newGameState} from "./newGameState";
import {render} from "./render";
import {gameStateTick, normalizeGameState, putBallsAtPuck, setLevel} from "./gameStateMutators";
import {allLevelsAndIcons, upgrades} from "./loadGameData";


let counter = 0

export function getGameAnimation(params: RunParams) {
  const width = 300, height = 400;
  counter++
  const id = 'preview_' + counter
  setTimeout(async () => {

    let gameState: GameState;

    let ctx: CanvasRenderingContext2D;

    async function reset() {
      gameState = newGameState({
        ...params,
        animated_perk_preview: true,
      })
      await setLevel(gameState, 0)
      gameState.canvasWidth = width;
      gameState.canvasHeight = height;
      gameState.gameZoneWidth = width;
      gameState.gameZoneHeight = height;
      gameState.ballSize = 20
      gameState.ballSize = 14
      gameState.puckHeight = 20
      gameState.ballStickToPuck = false;
      gameState.puckWidth = 0
      gameState.puckPosition=width/2

      gameState.brickWidth =
        Math.floor(
          width / (gameState.level.size + gameState.perks.unbounded * 2) / 2,
        ) * 2;
      gameState.offsetX = 0
      gameState.offsetXRoundedDown = 0
      gameState.gameZoneWidthRoundedUp = width
      gameState.running = true
      normalizeGameState(gameState)
      putBallsAtPuck(gameState)

    }

    async function previewFrame() {
      if (!gameState) return
      if (gameState.isGameOver) await reset()
      const canvas = document.getElementById(id) as HTMLCanvasElement
      if (!canvas) return

      if (!ctx) {
        ctx = canvas.getContext("2d", {
          alpha: false,
        }) as CanvasRenderingContext2D;
      }
      normalizeGameState(gameState)
      gameState.levelTime += 1000 / 60
      gameStateTick(gameState, 1)
      render(gameState, ctx)
      requestAnimationFrame(previewFrame)
    }

    await reset()
    previewFrame()
  })

  return `<canvas class="game_preview" id="${id}" width="${width}" height="${height}"/>`
}

const customSettings:Record<PerkId, { perks:RunParams["perks"], noAi?:boolean }>={
  shocks:{
    perks:{
      multiball:3,
      shocks:1
    }
  },
  slow_down:{
    perks:{
      slow_down:3
    }
  },
  viscosity:{
    perks:{
      viscosity:3
    }
  },
  coin_magnet:{
    perks:{coin_magnet:2, base_combo:2}
  },
  bigger_explosions:{
    perks:{
      bigger_explosions:1,
      pierce:2,
      concave_puck:1
    }
  }
}


export function getPerkAnimation(perkId:PerkId){
  const { requires } = upgrades.find(
    (u) => u.id === perkId,
  ) as Upgrade;

  const demoParams={
    perks: { [perkId]: 1 },
    level: allLevelsAndIcons.find((l) => l.name === "icon:" + perkId)
  }
  if(customSettings[perkId]?.perks) {
    Object.assign(demoParams.perks, customSettings[perkId].perks)
  }
  if(requires){
    demoParams.perks[requires]||=1
  }
  return getGameAnimation(demoParams)
}