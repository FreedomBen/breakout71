let levelIconHTMLCanvas = document.createElement("canvas");

const levelIconHTMLCanvasCtx =
  process.env.NODE_ENV !== "test" &&
  (levelIconHTMLCanvas.getContext("2d", {
    antialias: false,
    alpha: true,
  }) as CanvasRenderingContext2D);

export function levelIconHTML(
  bricks: string[],
  levelSize: number,
  color: string,
) {
  const size = 46;
  const c = levelIconHTMLCanvas;
  const ctx = levelIconHTMLCanvasCtx;

  if (!ctx) return "";
  c.width = size;
  c.height = size;

  ctx.clearRect(0, 0, size, size);

  const pxSize = size / levelSize;
  for (let x = 0; x < levelSize; x++) {
    for (let y = 0; y < levelSize; y++) {
      const c = bricks[y * levelSize + x];
      if (c) {
        ctx.fillStyle = c;
        ctx.fillRect(
          Math.floor(pxSize * x),
          Math.floor(pxSize * y),
          Math.ceil(pxSize),
          Math.ceil(pxSize),
        );
      }
    }
  }

  return `<img alt="" width="${size}" height="${size}" src="${c.toDataURL()}"/>`;
}
