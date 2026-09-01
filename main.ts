// Minimal playable slice of the Crit 5 game. Placeholder-rectangle visuals on
// purpose: the point of this pass is the loop and the rules (see
// game-rules.ts), not the art. A later pass swaps these rects for the sourced
// sprites in public/assets/ without touching the logic below.
import { applyHit, isGameOver, isMonsterDead, loseLife, STARTING_LIVES, type Weapon } from "./game-rules.ts";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 260;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 40;
const MONSTER_WIDTH = 32;
const MONSTER_HEIGHT = 32;
const MOVE_SPEED = 4;
const PROJECTILE_SPEED = 7;
const FIRE_COOLDOWN_MS = 280;

interface Monster {
  x: number;
  hp: number;
  alive: boolean;
}

interface Projectile {
  x: number;
  weapon: Weapon;
}

interface Pickup {
  x: number;
  kind: "gun" | "fruit";
  taken: boolean;
}

function must<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

const canvas = must(document.querySelector<HTMLCanvasElement>("#game"), "missing #game canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = must(canvas.getContext("2d"), "2d canvas context unavailable");

const player = { x: 40, vx: 0 };
let weapon: Weapon = "boomerang";
let lives = STARTING_LIVES;
let score = 0;
let gameOver = false;
let lastFireAt = -Infinity;

const monsters: Monster[] = [
  { x: 420, hp: 2, alive: true },
  { x: 640, hp: 2, alive: true },
];

const pickups: Pickup[] = [
  { x: 300, kind: "fruit", taken: false },
  { x: 540, kind: "gun", taken: false },
];

const projectiles: Projectile[] = [];

const keys = new Set<string>();

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (e.code === "Space") fire();
  else keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

function fire(): void {
  if (gameOver) return;
  const now = performance.now();
  if (now - lastFireAt < FIRE_COOLDOWN_MS) return;
  lastFireAt = now;
  projectiles.push({ x: player.x + PLAYER_WIDTH, weapon });
}

function overlap(ax: number, aw: number, bx: number, bw: number): boolean {
  return ax < bx + bw && ax + aw > bx;
}

function update(): void {
  if (gameOver) return;

  player.vx = 0;
  if (keys.has("ArrowLeft")) player.vx = -MOVE_SPEED;
  if (keys.has("ArrowRight")) player.vx = MOVE_SPEED;
  player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, player.x + player.vx));

  for (const p of projectiles) p.x += PROJECTILE_SPEED;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].x > CANVAS_WIDTH) projectiles.splice(i, 1);
  }

  for (const monster of monsters) {
    if (!monster.alive) continue;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const shot = projectiles[i];
      if (overlap(shot.x, 6, monster.x, MONSTER_WIDTH)) {
        monster.hp = applyHit(monster.hp, shot.weapon);
        projectiles.splice(i, 1);
        if (isMonsterDead(monster.hp)) {
          monster.alive = false;
          score += 50;
        }
        break;
      }
    }

    if (monster.alive && overlap(player.x, PLAYER_WIDTH, monster.x, MONSTER_WIDTH)) {
      lives = loseLife(lives);
      monster.alive = false;
      if (isGameOver(lives)) gameOver = true;
    }
  }

  for (const pickup of pickups) {
    if (pickup.taken) continue;
    if (overlap(player.x, PLAYER_WIDTH, pickup.x, 20)) {
      pickup.taken = true;
      if (pickup.kind === "fruit") score += 10;
      else weapon = "gun";
    }
  }
}

function draw(): void {
  ctx.fillStyle = "#0f1a12";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#1c3d21";
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  for (const pickup of pickups) {
    if (pickup.taken) continue;
    ctx.fillStyle = pickup.kind === "gun" ? "#e0c341" : "#e0527a";
    ctx.fillRect(pickup.x, GROUND_Y - 20, 20, 20);
  }

  ctx.fillStyle = "#5ad1e6";
  for (const shot of projectiles) ctx.fillRect(shot.x, GROUND_Y - PLAYER_HEIGHT / 2 - 3, 10, 6);

  for (const monster of monsters) {
    if (!monster.alive) continue;
    ctx.fillStyle = "#c23b3b";
    ctx.fillRect(monster.x, GROUND_Y - MONSTER_HEIGHT, MONSTER_WIDTH, MONSTER_HEIGHT);
  }

  ctx.fillStyle = "#3d7bd6";
  ctx.fillRect(player.x, GROUND_Y - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);

  ctx.fillStyle = "#f4f4f0";
  ctx.font = "16px monospace";
  ctx.fillText(`LIVES ${lives}  SCORE ${score}  WEAPON ${weapon.toUpperCase()}`, 12, 22);

  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#f4f4f0";
    ctx.font = "28px monospace";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2 - 90, CANVAS_HEIGHT / 2);
  }
}

function loop(): void {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
