import { GameState } from "./types";
import { getMajorityValue } from "./game_utils";

export function resetBalls(gameState: GameState) {
  const count = 1 + (gameState.perks?.multiball || 0);
  const perBall = gameState.puckWidth / (count + 1);
  gameState.balls = [];
  gameState.ballsColor = "#FFF";
  if (gameState.perks.picky_eater || gameState.perks.pierce_color) {
    gameState.ballsColor =
      getMajorityValue(gameState.bricks.filter((i) => i)) || "#FFF";
  }
  for (let i = 0; i < count; i++) {
    const x =
      gameState.puckPosition - gameState.puckWidth / 2 + perBall * (i + 1);
    const vx = Math.random() > 0.5 ? gameState.baseSpeed : -gameState.baseSpeed;

    gameState.balls.push({
      x,
      previousX: x,
      y: gameState.gameZoneHeight - 1.5 * gameState.ballSize,
      previousY: gameState.gameZoneHeight - 1.5 * gameState.ballSize,
      vx,
      previousVX: vx,
      vy: -gameState.baseSpeed,
      previousVY: -gameState.baseSpeed,

      sx: 0,
      sy: 0,
      sparks: 0,
      piercedSinceBounce: 0,
      hitSinceBounce: 0,
      hitItem: [],
      bouncesList: [],
      sapperUses: 0,
    });
  }
}

export function putBallsAtPuck(gameState: GameState) {
  // This reset could be abused to cheat quite easily
  const count = gameState.balls.length;
  const perBall = gameState.puckWidth / (count + 1);
  gameState.balls.forEach((ball, i) => {
    const x =
      gameState.puckPosition - gameState.puckWidth / 2 + perBall * (i + 1);
    ball.x = x;
    ball.previousX = x;
    ball.y = gameState.gameZoneHeight - 1.5 * gameState.ballSize;
    ball.previousY = ball.y;
    ball.vx = Math.random() > 0.5 ? gameState.baseSpeed : -gameState.baseSpeed;
    ball.previousVX = ball.vx;
    ball.vy = -gameState.baseSpeed;
    ball.previousVY = ball.vy;
    ball.sx = 0;
    ball.sy = 0;
    ball.hitItem = [];
    ball.hitSinceBounce = 0;
    ball.piercedSinceBounce = 0;
  });
}
