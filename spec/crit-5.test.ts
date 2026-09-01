import { describe, expect, it } from "vitest";
import { applyHit, isGameOver, isMonsterDead, loseLife, MONSTER_MAX_HP } from "../game-rules.ts";

// Crit 5 spec, mechanically checkable slice:
// - "one rule of the game has a focused automated test" -> the boomerang/gun
//   damage rule below.
// - "it can be lost: a wrong move is possible, and play ends somewhere" ->
//   the losable-run rule below.
// Everything else in the spec (no tutorial, teaches itself in five minutes,
// process evidence) is judged by a person or by check:evidence, not here.

describe("monster damage", () => {
  it("survives one boomerang hit but not two", () => {
    let hp = MONSTER_MAX_HP;
    hp = applyHit(hp, "boomerang");
    expect(isMonsterDead(hp)).toBe(false);
    hp = applyHit(hp, "boomerang");
    expect(isMonsterDead(hp)).toBe(true);
  });

  it("dies in a single gun hit", () => {
    const hp = applyHit(MONSTER_MAX_HP, "gun");
    expect(isMonsterDead(hp)).toBe(true);
  });
});

describe("losable run", () => {
  it("ends the run once the third life is lost", () => {
    let lives = 3;
    lives = loseLife(lives);
    expect(isGameOver(lives)).toBe(false);
    lives = loseLife(lives);
    expect(isGameOver(lives)).toBe(false);
    lives = loseLife(lives);
    expect(isGameOver(lives)).toBe(true);
  });
});
