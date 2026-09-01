// Playable slice of the Crit 5 game: a scrolling camera over multi-map
// stages (see stages.ts), each ending in a boss. Sprites/bg/audio from
// public/assets/ (see CREDITS.md). game-rules.ts stays the pure rule engine
// this file drives.
import { applyHit, bossHp, isGameOver, isMonsterDead, loseLife, STARTING_LIVES, type Weapon } from "./game-rules.ts";
import { buildMap, STAGES, type MapSpec } from "./stages.ts";
import { isTouchDevice, setupTouchControls } from "./touch-controls.ts";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 260;
const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 40;
const BASE_MONSTER_SIZE = 32;
const MOVE_SPEED = 4;
const PROJECTILE_SPEED = 7;
const MONSTER_PROJECTILE_SPEED = 4;
const FIRE_COOLDOWN_MS = 280;
const HURT_FLASH_MS = 260;
const INVULNERABLE_MS = 900;
const HIT_FLASH_MS = 120;
const POP_LIFE_MS = 320;
const SHAKE_MS = 220;
const GRAVITY = 0.6;
const JUMP_SPEED = 10;
const MAP_EDGE_MARGIN = 20;
const MONSTER_ATTACK_RANGE = 260;
const MONSTER_ATTACK_COOLDOWN_MS = 1400;

type PlayerAnim = "idle" | "run" | "hurt";

interface Monster {
  x: number;
  hp: number;
  alive: boolean;
  isBoss: boolean;
  width: number;
  height: number;
  flashUntil: number;
  lastAttackAt: number;
}

interface Projectile {
  x: number;
  vx: number;
  owner: "player" | "monster";
  weapon?: Weapon;
}

interface Pickup {
  x: number;
  kind: "gun" | "fruit";
  fruitEmoji: string;
  taken: boolean;
}

interface Obstacle {
  x: number;
  width: number;
  kind: "block" | "gap";
}

interface Pop {
  x: number;
  y: number;
  glyph: string;
  startedAt: number;
}

interface Banner {
  text: string;
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

function overlap(ax: number, aw: number, bx: number, bw: number): boolean {
  return ax < bx + bw && ax + aw > bx;
}

const canvas = must(document.querySelector<HTMLCanvasElement>("#game"), "missing #game canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = must(canvas.getContext("2d"), "2d canvas context unavailable");

const player = { x: 60, y: 0, vy: 0, vx: 0, facing: 1 as 1 | -1, grounded: true };
let weapon: Weapon = "boomerang";
let lives = STARTING_LIVES;
let score = 0;
let gameOver = false;
let victory = false;
let lastFireAt = -Infinity;
let hurtUntil = -Infinity;
let invulnerableUntil = -Infinity;
let shakeUntil = -Infinity;
let banner: Banner | null = null;
let firstInputGiven = false;

let stageIndex = 0;
let mapIndex = 0;
let mapSpec: MapSpec = buildMap(0, 0);
let cameraX = 0;

let monsters: Monster[] = [];
let pickups: Pickup[] = [];
let obstacles: Obstacle[] = [];
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
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
  if (!bgmStarted) {
    bgmStarted = true;
    bgm.play().catch(() => {});
  }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) firstInputGiven = true;
  if (e.code === "Space") fire();
  else if (e.code === "ArrowUp") jump();
  else keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

function instantiateMonster(spec: { x: number; hp: number; isBoss: boolean }): Monster {
  const stage = STAGES[stageIndex];
  const scale = spec.isBoss ? stage.monsterScale * 1.8 : stage.monsterScale;
  return {
    x: spec.x,
    hp: spec.hp,
    alive: true,
    isBoss: spec.isBoss,
    width: BASE_MONSTER_SIZE * scale,
    height: BASE_MONSTER_SIZE * scale,
    flashUntil: -Infinity,
    lastAttackAt: -Infinity,
  };
}

function loadMap(newStageIndex: number, newMapIndex: number): void {
  stageIndex = newStageIndex;
  mapIndex = newMapIndex;
  mapSpec = buildMap(stageIndex, mapIndex);
  monsters = mapSpec.monsters.map(instantiateMonster);
  pickups = mapSpec.pickups.map((p) => ({ ...p, taken: false }));
  obstacles = mapSpec.obstacles.slice();
  projectiles.length = 0;
  resetPlayerToMapStart();
}

function resetPlayerToMapStart(): void {
  player.x = 60;
  player.y = 0;
  player.vy = 0;
  player.grounded = true;
  cameraX = 0;
}

function advanceMap(): void {
  loadMap(stageIndex, mapIndex + 1);
}

function advanceStage(): void {
  if (stageIndex >= STAGES.length - 1) {
    victory = true;
    gameOver = true;
    return;
  }
  loadMap(stageIndex + 1, 0);
  banner = { text: `STAGE ${stageIndex + 1}`, startedAt: performance.now() };
}

function takeHit(now: number): void {
  lives = loseLife(lives);
  hurtUntil = now + HURT_FLASH_MS;
  invulnerableUntil = now + INVULNERABLE_MS;
  shakeUntil = now + SHAKE_MS;
  playSfx(sfxHurt);
  if (isGameOver(lives)) gameOver = true;
}

function fallIntoGap(now: number): void {
  takeHit(now);
  if (!gameOver) resetPlayerToMapStart();
}

function fire(): void {
  if (gameOver) return;
  const now = performance.now();
  if (now - lastFireAt < FIRE_COOLDOWN_MS) return;
  lastFireAt = now;
  const dir = player.facing;
  projectiles.push({
    x: player.x + (dir === 1 ? PLAYER_WIDTH : -6),
    vx: PROJECTILE_SPEED * dir,
    owner: "player",
    weapon,
  });
}

function jump(): void {
  if (gameOver) return;
  if (player.grounded) {
    player.vy = JUMP_SPEED;
    player.grounded = false;
  }
}

function obstacleAt(worldX: number): Obstacle | undefined {
  return obstacles.find((o) => worldX >= o.x && worldX <= o.x + o.width);
}

function update(): void {
  if (gameOver) return;
  const now = performance.now();
  const stage = STAGES[stageIndex];

  player.vx = 0;
  if (keys.has("ArrowLeft")) player.vx = -MOVE_SPEED;
  if (keys.has("ArrowRight")) player.vx = MOVE_SPEED;
  if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;

  let nextX = player.x + player.vx;
  const footX = nextX + PLAYER_WIDTH / 2;
  const blocking = player.grounded ? obstacleAt(footX) : undefined;
  if (blocking?.kind === "block") {
    nextX = player.vx > 0 ? blocking.x - PLAYER_WIDTH : blocking.x + blocking.width;
  }
  player.x = Math.max(0, Math.min(mapSpec.width - PLAYER_WIDTH, nextX));

  player.y += player.vy;
  player.vy -= GRAVITY;
  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  if (player.grounded) {
    const gap = obstacleAt(player.x + PLAYER_WIDTH / 2);
    if (gap?.kind === "gap") {
      fallIntoGap(now);
      return;
    }
  }

  cameraX = Math.max(0, Math.min(player.x - CANVAS_WIDTH / 2, mapSpec.width - CANVAS_WIDTH));

  for (const p of projectiles) p.x += p.vx;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].x < -50 || projectiles[i].x > mapSpec.width + 50) projectiles.splice(i, 1);
  }

  for (const monster of monsters) {
    if (!monster.alive) continue;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const shot = projectiles[i];
      if (shot.owner !== "player" || !shot.weapon) continue;
      if (overlap(shot.x, 6, monster.x, monster.width)) {
        monster.hp = applyHit(monster.hp, shot.weapon);
        monster.flashUntil = now + HIT_FLASH_MS;
        playSfx(sfxHit);
        projectiles.splice(i, 1);
        if (isMonsterDead(monster.hp)) {
          monster.alive = false;
          score += monster.isBoss ? 500 : 50;
        }
        break;
      }
    }

    if (monster.alive && stage.monsterAttacks && now - monster.lastAttackAt > MONSTER_ATTACK_COOLDOWN_MS) {
      const dist = Math.abs(player.x - monster.x);
      if (dist < MONSTER_ATTACK_RANGE) {
        monster.lastAttackAt = now;
        const dir = player.x > monster.x ? 1 : -1;
        projectiles.push({ x: monster.x, vx: MONSTER_PROJECTILE_SPEED * dir, owner: "monster" });
      }
    }

    if (monster.alive && now >= invulnerableUntil && overlap(player.x, PLAYER_WIDTH, monster.x, monster.width)) {
      takeHit(now);
    }

    if (!monster.alive && monster.isBoss) {
      advanceStage();
      return;
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const shot = projectiles[i];
    if (shot.owner === "monster" && overlap(shot.x, 8, player.x, PLAYER_WIDTH)) {
      projectiles.splice(i, 1);
      if (now >= invulnerableUntil) takeHit(now);
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

  if (!mapSpec.isBossMap && player.x + PLAYER_WIDTH >= mapSpec.width - MAP_EDGE_MARGIN) {
    advanceMap();
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

function drawBanner(now: number): void {
  if (!banner) return;
  const elapsed = now - banner.startedAt;
  if (elapsed > 1000) {
    banner = null;
    return;
  }
  const alpha = elapsed < 750 ? 1 : 1 - (elapsed - 750) / 250;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 34, CANVAS_WIDTH, 44);
  ctx.fillStyle = "#f4f4f0";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(banner.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 4);
  ctx.textAlign = "left";
  ctx.restore();
}

function draw(): void {
  const now = performance.now();
  const stage = STAGES[stageIndex];

  ctx.save();
  if (now < shakeUntil) {
    const t = (shakeUntil - now) / SHAKE_MS;
    ctx.translate((Math.random() - 0.5) * 6 * t, (Math.random() - 0.5) * 4 * t);
  }

  ctx.drawImage(sprites.bgFar, -cameraX, 0, mapSpec.width, GROUND_Y + 10);

  const treeH = 150;
  for (const worldX of [40, mapSpec.width - 100]) {
    const tw = (sprites.tree.width / sprites.tree.height) * treeH;
    ctx.drawImage(sprites.tree, worldX - cameraX, GROUND_Y - treeH + 20, tw, treeH);
  }
  const plantH = 46;
  for (let i = 0; i < mapSpec.width; i += 260) {
    const pw = (sprites.plant.width / sprites.plant.height) * plantH;
    ctx.drawImage(sprites.plant, i + 90 - cameraX, GROUND_Y - plantH, pw, plantH);
  }

  const tile = 40;
  for (let gx = 0; gx < mapSpec.width; gx += tile) {
    ctx.drawImage(sprites.ground, gx - cameraX, GROUND_Y, tile, CANVAS_HEIGHT - GROUND_Y);
  }
  for (const obstacle of obstacles) {
    const sx = obstacle.x - cameraX;
    if (obstacle.kind === "gap") {
      ctx.fillStyle = "#0a0f0b";
      ctx.fillRect(sx, GROUND_Y, obstacle.width, CANVAS_HEIGHT - GROUND_Y);
    } else {
      ctx.fillStyle = "#6b5334";
      ctx.fillRect(sx, GROUND_Y - 28, obstacle.width, 28);
    }
  }

  if (stage.bgTint) {
    ctx.fillStyle = stage.bgTint;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  for (const pickup of pickups) {
    if (pickup.taken) continue;
    const sx = pickup.x - cameraX;
    ctx.font = "22px system-ui, sans-serif";
    if (pickup.kind === "fruit") {
      ctx.fillText(pickup.fruitEmoji, sx, GROUND_Y - 4);
    } else {
      ctx.fillStyle = "#e0c341";
      ctx.fillRect(sx, GROUND_Y - 22, 22, 12);
      ctx.fillRect(sx + 14, GROUND_Y - 30, 6, 10);
    }
  }

  for (const shot of projectiles) {
    const sx = shot.x - cameraX;
    if (shot.owner === "monster") {
      ctx.fillStyle = "#c23b3b";
      ctx.beginPath();
      ctx.ellipse(sx + 5, GROUND_Y - PLAYER_HEIGHT / 2, 6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (shot.weapon === "boomerang") {
      ctx.strokeStyle = "#f0d24a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx + 5, GROUND_Y - PLAYER_HEIGHT / 2, 6, 0.3, Math.PI * 1.7);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#5ad1e6";
      ctx.beginPath();
      ctx.ellipse(sx + 5, GROUND_Y - PLAYER_HEIGHT / 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const monster of monsters) {
    if (!monster.alive) continue;
    const sx = monster.x - cameraX;
    const frame = sprites.slime[Math.floor(now / 140) % sprites.slime.length];
    drawSpriteFeetAt(frame, sx, GROUND_Y, monster.height, 1);
    if (monster.isBoss) {
      ctx.fillStyle = "rgba(194,59,59,0.6)";
      ctx.fillRect(sx, GROUND_Y - monster.height - 12, monster.width, 5);
      ctx.fillStyle = "#c23b3b";
      const fullBossHp = bossHp(STAGES[stageIndex].monsterHp);
      ctx.fillRect(sx, GROUND_Y - monster.height - 12, monster.width * Math.max(0, monster.hp / fullBossHp), 5);
    }
    if (now < monster.flashUntil) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(sx, GROUND_Y - monster.height, monster.width, monster.height);
      ctx.restore();
    }
  }

  const playerState: PlayerAnim = now < hurtUntil ? "hurt" : player.vx !== 0 ? "run" : "idle";
  drawSpriteFeetAt(
    playerFrame(playerState, now),
    player.x - cameraX,
    GROUND_Y - player.y,
    PLAYER_HEIGHT + 24,
    player.facing,
  );

  for (const pop of pops) {
    const t = (now - pop.startedAt) / POP_LIFE_MS;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.fillStyle = "#f4f4f0";
    ctx.font = "bold 14px monospace";
    ctx.fillText(pop.glyph, pop.x - cameraX, pop.y - t * 16);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(10,10,10,0.45)";
  ctx.fillRect(6, 6, 230, 46);
  ctx.fillStyle = "#f4f4f0";
  ctx.font = "16px monospace";
  ctx.fillText("❤️".repeat(Math.max(0, lives)), 14, 26);
  ctx.fillText(`SCORE ${score}  ${weapon.toUpperCase()}`, 14, 44);

  drawBanner(now);
  ctx.restore();

  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#f4f4f0";
    ctx.font = "28px monospace";
    ctx.textAlign = "center";
    ctx.fillText(victory ? "YOU WIN" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.textAlign = "left";
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
  loadMap(0, 0);
  banner = { text: "STAGE 1", startedAt: performance.now() };
  if (isTouchDevice()) {
    const touchControls = must(document.querySelector<HTMLElement>("#touch-controls"), "missing #touch-controls");
    touchControls.hidden = false;
    setupTouchControls(keys, fire, jump);
  }
  loop();
});

// Extension point for the follow-up slice: an in-world key-guide pictogram
// (arrow/space icons, not text) should only render while stageIndex === 0,
// mapIndex === 0, and !firstInputGiven — call it from draw() before the HUD.
