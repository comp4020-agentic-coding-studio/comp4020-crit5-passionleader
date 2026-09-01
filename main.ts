// Minimal playable slice of the Crit 5 game, now with the sourced CC0 assets
// (public/assets/) wired in for animation, background, and sound. The rules
// stay in game-rules.ts and are untouched by this pass.
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
const HURT_FLASH_MS = 260;
const HIT_FLASH_MS = 120;
const POP_LIFE_MS = 320;
const SHAKE_MS = 220;

type PlayerAnim = "idle" | "run" | "hurt";

interface Monster {
  x: number;
  hp: number;
  alive: boolean;
  flashUntil: number;
}

interface Projectile {
  x: number;
  weapon: Weapon;
}

interface Pickup {
  x: number;
  kind: "gun" | "fruit";
  fruitEmoji: string;
  taken: boolean;
}

interface Pop {
  x: number;
  y: number;
  glyph: string;
  startedAt: number;
}

function must<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

function loadFrames(dir: string, name: string, count: number): Promise<HTMLImageElement[]> {
  return Promise.all(
    Array.from({ length: count }, (_, i) => loadImage(`./assets/${dir}/${name}-${i + 1}.png`)),
  );
}

function makeSfxPool(src: string, size = 4): HTMLAudioElement[] {
  return Array.from({ length: size }, () => {
    const audio = new Audio(src);
    audio.volume = 0.5;
    return audio;
  });
}

function playSfx(pool: HTMLAudioElement[]): void {
  const free = pool.find((a) => a.paused || a.ended) ?? pool[0];
  free.currentTime = 0;
  free.play().catch(() => {});
}

const canvas = must(document.querySelector<HTMLCanvasElement>("#game"), "missing #game canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = must(canvas.getContext("2d"), "2d canvas context unavailable");

const player = { x: 40, vx: 0, facing: 1 as 1 | -1 };
let weapon: Weapon = "boomerang";
let lives = STARTING_LIVES;
let score = 0;
let gameOver = false;
let lastFireAt = -Infinity;
let hurtUntil = -Infinity;
let shakeUntil = -Infinity;

const monsters: Monster[] = [
  { x: 420, hp: 2, alive: true, flashUntil: -Infinity },
  { x: 640, hp: 2, alive: true, flashUntil: -Infinity },
];

const pickups: Pickup[] = [
  { x: 300, kind: "fruit", fruitEmoji: "🍓", taken: false },
  { x: 540, kind: "gun", fruitEmoji: "", taken: false },
  { x: 720, kind: "fruit", fruitEmoji: "🍌", taken: false },
];

const projectiles: Projectile[] = [];
const pops: Pop[] = [];
const keys = new Set<string>();

const bgm = new Audio("./assets/audio/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.35;
const sfxHit = makeSfxPool("./assets/audio/hit.wav");
const sfxHurt = makeSfxPool("./assets/audio/hurt.wav", 2);
const sfxPickup = makeSfxPool("./assets/audio/pickup.wav");
const sfxPowerup = makeSfxPool("./assets/audio/powerup.wav", 1);
let bgmStarted = false;

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (!bgmStarted) {
    bgmStarted = true;
    bgm.play().catch(() => {});
  }
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
  const now = performance.now();

  player.vx = 0;
  if (keys.has("ArrowLeft")) player.vx = -MOVE_SPEED;
  if (keys.has("ArrowRight")) player.vx = MOVE_SPEED;
  if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;
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
        monster.flashUntil = now + HIT_FLASH_MS;
        playSfx(sfxHit);
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
      hurtUntil = now + HURT_FLASH_MS;
      shakeUntil = now + SHAKE_MS;
      playSfx(sfxHurt);
      if (isGameOver(lives)) gameOver = true;
    }
  }

  for (const pickup of pickups) {
    if (pickup.taken) continue;
    if (overlap(player.x, PLAYER_WIDTH, pickup.x, 20)) {
      pickup.taken = true;
      pops.push({
        x: pickup.x + 10,
        y: GROUND_Y - 30,
        glyph: pickup.kind === "gun" ? "+GUN" : "+10",
        startedAt: now,
      });
      if (pickup.kind === "fruit") {
        score += 10;
        playSfx(sfxPickup);
      } else {
        weapon = "gun";
        playSfx(sfxPowerup);
      }
    }
  }

  for (let i = pops.length - 1; i >= 0; i--) {
    if (now - pops[i].startedAt > POP_LIFE_MS) pops.splice(i, 1);
  }
}

function playerFrame(state: PlayerAnim, now: number): HTMLImageElement {
  if (state === "hurt") {
    const frames = sprites.playerHurt;
    return frames[Math.floor(now / 100) % frames.length];
  }
  if (state === "run") {
    const frames = sprites.playerRun;
    return frames[Math.floor(now / 80) % frames.length];
  }
  const frames = sprites.playerIdle;
  return frames[Math.floor(now / 220) % frames.length];
}

function drawSpriteFeetAt(img: HTMLImageElement, footX: number, footY: number, height: number, facing: 1 | -1): void {
  const width = (img.width / img.height) * height;
  ctx.save();
  if (facing === -1) {
    ctx.translate(footX + width, footY - height);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, width, height);
  } else {
    ctx.drawImage(img, footX, footY - height, width, height);
  }
  ctx.restore();
}

function draw(): void {
  const now = performance.now();
  ctx.save();
  if (now < shakeUntil) {
    const t = (shakeUntil - now) / SHAKE_MS;
    ctx.translate((Math.random() - 0.5) * 6 * t, (Math.random() - 0.5) * 4 * t);
  }

  ctx.drawImage(sprites.bgFar, 0, 0, CANVAS_WIDTH, GROUND_Y + 10);

  const treeH = 150;
  ctx.drawImage(sprites.tree, 40, GROUND_Y - treeH + 20, (sprites.tree.width / sprites.tree.height) * treeH, treeH);
  ctx.drawImage(sprites.tree, 700, GROUND_Y - treeH + 30, (sprites.tree.width / sprites.tree.height) * treeH, treeH);
  const plantH = 46;
  for (const px of [180, 470, 760]) {
    ctx.drawImage(sprites.plant, px, GROUND_Y - plantH, (sprites.plant.width / sprites.plant.height) * plantH, plantH);
  }

  const tile = 40;
  for (let gx = 0; gx < CANVAS_WIDTH; gx += tile) {
    ctx.drawImage(sprites.ground, gx, GROUND_Y, tile, CANVAS_HEIGHT - GROUND_Y);
  }

  for (const pickup of pickups) {
    if (pickup.taken) continue;
    ctx.font = "22px system-ui, sans-serif";
    if (pickup.kind === "fruit") {
      ctx.fillText(pickup.fruitEmoji, pickup.x, GROUND_Y - 4);
    } else {
      ctx.fillStyle = "#e0c341";
      ctx.fillRect(pickup.x, GROUND_Y - 22, 22, 12);
      ctx.fillRect(pickup.x + 14, GROUND_Y - 30, 6, 10);
    }
  }

  for (const shot of projectiles) {
    if (shot.weapon === "boomerang") {
      ctx.strokeStyle = "#f0d24a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(shot.x + 5, GROUND_Y - PLAYER_HEIGHT / 2, 6, 0.3, Math.PI * 1.7);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#5ad1e6";
      ctx.beginPath();
      ctx.ellipse(shot.x + 5, GROUND_Y - PLAYER_HEIGHT / 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const monster of monsters) {
    if (!monster.alive) continue;
    const frame = sprites.slime[Math.floor(now / 140) % sprites.slime.length];
    drawSpriteFeetAt(frame, monster.x, GROUND_Y, MONSTER_HEIGHT, 1);
    if (now < monster.flashUntil) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(monster.x, GROUND_Y - MONSTER_HEIGHT, MONSTER_WIDTH, MONSTER_HEIGHT);
      ctx.restore();
    }
  }

  const playerState: PlayerAnim = now < hurtUntil ? "hurt" : player.vx !== 0 ? "run" : "idle";
  drawSpriteFeetAt(playerFrame(playerState, now), player.x, GROUND_Y, PLAYER_HEIGHT + 24, player.facing);

  for (const pop of pops) {
    const t = (now - pop.startedAt) / POP_LIFE_MS;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.fillStyle = "#f4f4f0";
    ctx.font = "bold 14px monospace";
    ctx.fillText(pop.glyph, pop.x, pop.y - t * 16);
    ctx.restore();
  }

  ctx.fillStyle = "#f4f4f0";
  ctx.font = "16px monospace";
  ctx.fillText("❤️".repeat(Math.max(0, lives)), 12, 24);
  ctx.fillText(`SCORE ${score}  WEAPON ${weapon.toUpperCase()}`, 12, 42);

  ctx.restore();

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

interface Sprites {
  playerIdle: HTMLImageElement[];
  playerRun: HTMLImageElement[];
  playerHurt: HTMLImageElement[];
  slime: HTMLImageElement[];
  bgFar: HTMLImageElement;
  ground: HTMLImageElement;
  tree: HTMLImageElement;
  plant: HTMLImageElement;
}

let sprites: Sprites;

Promise.all([
  loadFrames("player", "idle", 4),
  loadFrames("player", "run", 6),
  loadFrames("player", "hurt", 2),
  loadFrames("monster", "slime", 4),
  loadImage("./assets/bg/jungle-far.png"),
  loadImage("./assets/bg/ground.png"),
  loadImage("./assets/bg/tree.png"),
  loadImage("./assets/bg/plant.png"),
]).then(([playerIdle, playerRun, playerHurt, slime, bgFar, ground, tree, plant]) => {
  sprites = { playerIdle, playerRun, playerHurt, slime, bgFar, ground, tree, plant };
  loop();
});
