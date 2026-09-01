// Canvas-drawn vector visuals for the two new hazard entities (orange/blue
// circles). Matches the flat-shape style already used for the boomerang,
// gun, and HUD hearts in main.ts — no image assets, see CREDITS.md.
//
// Both are self-contained draw calls: pass the 2D context, the entity's
// center position, and its radius. Whoever wires the entity/update loop
// (position, spawn timing, hit/miss detection) can call these directly
// once that data model lands — nothing here assumes a particular entity
// shape beyond x/y/radius.

const ORANGE_FILL = "#f2954e";
const ORANGE_OUTLINE = "#7a3d10";
const ORANGE_GLINT = "rgba(255, 255, 255, 0.55)";

const BLUE_FILL = "#5ad1e6";
const BLUE_OUTLINE = "#1c5c68";
const BLUE_GLINT = "rgba(255, 255, 255, 0.55)";
const BLUE_PIP_LIT = "#eafeff";
const BLUE_PIP_DIM = "rgba(20, 60, 68, 0.55)";

/** Instant heart-loss hazard: solid orange circle, dark outline, sharp glint. */
export function drawOrangeHazard(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.fillStyle = ORANGE_OUTLINE;
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ORANGE_FILL;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ORANGE_GLINT;
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Miss-counter hazard: blue circle that costs a heart after `missLimit`
 * misses. `missCount` (0..missLimit) is rendered as a ring of pips around
 * the circle so the player can see how close it is to triggering.
 */
export function drawBlueHazard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  missCount: number,
  missLimit: number = 5,
): void {
  ctx.fillStyle = BLUE_OUTLINE;
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BLUE_FILL;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BLUE_GLINT;
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  const pipRadius = 1.6;
  const ringRadius = radius + 6;
  for (let i = 0; i < missLimit; i++) {
    const angle = (Math.PI * 2 * i) / missLimit - Math.PI / 2;
    const px = x + Math.cos(angle) * ringRadius;
    const py = y + Math.sin(angle) * ringRadius;
    ctx.fillStyle = i < missCount ? BLUE_PIP_LIT : BLUE_PIP_DIM;
    ctx.beginPath();
    ctx.arc(px, py, pipRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
