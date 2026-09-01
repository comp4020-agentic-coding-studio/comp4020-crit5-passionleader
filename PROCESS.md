# Process overview

<!-- TEMPLATE: this file is a shape to fill in, not a form. Replace everything
     in it with your own overview, and delete this comment — `pnpm
     check:evidence` will remind you if it's still here. -->

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

One paragraph: the thing, and the idea behind it.

## The moments that mattered

Three or four for an assignment; fewer is fine for a weekly prototype. Keep the
list short so each moment has room to do all four jobs:

1. **what happened** --- the problem, or the thing that went wrong
2. **what you did instead of the obvious thing** --- the call you made, and why
   it beat the obvious one
3. **how you knew it was right** --- the check you ran, the viewport you looked
   at, what you read before accepting the diff
4. **the citation** --- a commit or commit range, a `CLAUDE.md` change, a check
   that went from red to green, a prompt paired with the commit it produced

Jobs 2 and 3 are the ones the repo can't tell a reader on its own, so they're
where the marks are. The strongest moments are the ones where a correction
landed in the **harness** --- the standards and checks your work has to satisfy
--- rather than in a retry: a rule added to `CLAUDE.md`, a check wired up, an
attempt thrown away. Retrying until it passes is the routine case, and changing
what the work runs against is the skilled one.

Cite each moment as a link whose text is the commit hash or range and whose
target is this repo's commit or compare URL, so a reader clicks straight to the
evidence:

- one commit: [`a1b2c3d`](https://github.com/YOUR-ORG/YOUR-REPO/commit/a1b2c3d)
- a range:
  [`a1b2c3d...e4f5a6b`](https://github.com/YOUR-ORG/YOUR-REPO/compare/a1b2c3d...e4f5a6b)

To pair a prompt with the commit it produced, quote the prompt (curated, not a
full transcript) next to the citation:

> the prompt, verbatim

Screenshots are welcome where one carries the verification better than a
sentence does. Commit the file to this repo and link it with a **relative**
path, which is what makes it render on GitHub: `![alt text](docs/before.png)`.
Images don't count towards the word count and don't replace the citation.

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.

## Working notes (draft — fold into the overview above before shipping)

Raw log, one or two lines per slice, written right after each push. Not the
deliverable — replace this whole section (and remove the `TEMPLATE:` comment
at the top) with the curated, cited overview before shipping.

- [`c768321`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/c768321):
  named Wonder Boy as the visual/mechanical motif in `CLAUDE.md`/`Plan.md`
  (mood, not the IP — no copied character art/logos), and wrote in the
  per-slice rhythm this session runs on: dev server up for every result,
  re-check against the published crit-5 spec each time, commit+push per
  slice, a running note here instead of writing `PROCESS.md` once at the end.
- [`dc389e9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/dc389e9):
  sourced CC0 sprites (player, slime), a jungle background/ground tile, one
  BGM loop and four SFX from OpenGameArt, trimmed/resized to keep the payload
  small (~1.1 MB total), credited in `public/assets/CREDITS.md`. Not wired
  into the game yet — two sessions are splitting this crit (a second,
  lower-effort session building the minimal playable loop in
  `main.ts`/`game-rules.ts`; this session sourcing assets, keeping the
  harness current, and integrating/verifying against the rubric before each
  push) — worth a line in the final reflection about directing a second
  agent as part of "how you directed the work."
- [`bf1bcee`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/bf1bcee):
  the delegated session's minimal playable loop — `game-rules.ts` matching
  `spec/crit-5.test.ts`'s exact signatures, and a canvas loop (move, fire,
  monster HP, life loss, game over) with placeholder rectangles standing in
  for art. `pnpm check` green (20 tests) before I picked the branch back up.
- [`2a5b312`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/2a5b312):
  replaced every placeholder rectangle with the sourced sprites/background
  from `dc389e9` --- animated player (idle/run/hurt) and slime frames,
  layered jungle/ground/tree/plant art, bgm + four SFX (bgm starts on first
  keypress to respect autoplay policy). Added hit-flash, a brief shake and
  hurt-frame feedback on taking damage, and a small pickup pop label, per
  `Plan.md`'s "punchy, readable feedback" note. `game-rules.ts` untouched;
  `pnpm check` still green. Still owe: an actual playtest-driven change (not
  yet done by a human clicking through it) and stage 2/3 + bosses.
- **Playtest-driven change** (the required one): the user played `2a5b312` at
  `localhost:5173` and reported nine issues, the headline one being "there's
  only one flat map, and it doesn't scroll." That single observation drove
  [`13967e7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/13967e7):
  a camera/world-scrolling rewrite with 5 maps per stage, a boss on the last
  map of each stage (hp = 10x that stage's regular monster hp), per-stage
  difficulty scaling (monster hp 2/3/4, ranged attacks and bigger sprites
  from stage 2 on, gun delayed to stage 2), jump + block/gap obstacles, a
  fix for the score/lives text being unreadable against the sky (a backing
  bar, not a missing draw call), a "STAGE N" intro banner, per-stage colour
  tint for background variety, and a fix for projectiles always firing right
  regardless of which way the player was facing. Playtesting also surfaced a
  bug no code-reading would have caught: standing next to a stationary
  monster to shoot it drained all 3 lives in a couple of frames, since
  nothing gated repeat contact damage — added invulnerability frames after
  any hit. `pnpm check` green (21 tests, +1 for boss-hp scaling).
- [`b53464f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/b53464f):
  added on-screen touch controls (`touch-controls.ts`, a hidden
  `#touch-controls` button row) per the user's request that a touch device
  get a virtual keyboard; only revealed when `isTouchDevice()` is true, so
  keyboard play is unaffected. `pnpm check` green (21 tests).
- [`fe13de7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/fe13de7):
  added an in-world key-guide pictogram (arrow keycaps + a space bar, icons
  only, no text) drawn on stage 1's first map until the first input or a 4s
  timeout, per the user's request to show the controls as an in-game drawing
  rather than an instructions screen. `pnpm check` green (21 tests).
- **Second playtest round** (another actually-played-it feedback pass):
  [`23eba26`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/23eba26):
  pause (⏸)/mute (🔊) icon buttons top-right, revealing resume/reset when
  paused (reset also escapes a GAME OVER screen, previously only possible by
  reloading); monster projectiles now only connect while grounded, so a
  jump dodges them; the stage-2 gun pickup moved from its first map to its
  second; a heart pickup on stage 3's first map restores one life (capped
  at 3); fire rate capped at 2 shots/sec for both weapons; swapped the CC0
  placeholder BGM loop for an original track the user supplied
  (`Seongs_adventure.mp3`). Verified live with a headless-browser pass
  through the pause/resume/mute state machine and temporary (removed before
  commit) debug hooks confirming the gun/heart pickups land on the intended
  map indices and that `grounded` toggles correctly on jump. `pnpm check`
  green (21 tests).
- [`ea19272`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/ea19272):
  swapped the header's "Home" link for a contact `mailto:` link, widened the
  playable area on desktop via a `min-width: 900px` media query (CSS max-width
  only --- canvas render resolution untouched, so `image-rendering: pixelated`
  keeps the upscale crisp), and made the touch-control buttons wider
  left-to-right for easier thumb targets. Delegated to the medium session as
  a narrow, decoupled UI slice (`index.html`/`styles.css` only, no engine
  files) while this session handled the BGM issue below in parallel;
  confirmed by diffing the commit against the delegated spec, an independent
  `pnpm check` (21 tests), and a headless-browser pass measuring the actual
  rendered bounding boxes at a 1400x900 desktop viewport and a 390x844 touch
  viewport, plus screenshots at both sizes. Touch controls' mobile-only
  visibility (`isTouchDevice()`) was already correct and needed no change.
- [`9431355`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/9431355):
  swapped the BGM track a second time after the author disclosed the
  supposedly "original" track credited in `23eba26` was actually an ear-copy
  of an existing song --- a real plagiarism risk for a publicly-assessed
  deliverable, not just a filename problem, so renaming alone (the author's
  first instinct) was rejected in favour of sourcing a genuinely original
  replacement. Copied the author's newly-composed track in, updated the
  `bgm` audio src, and corrected `CREDITS.md` to describe both the fix and
  why it was needed, rather than leaving the earlier (now-inaccurate)
  "original track" claim in place. Chose not to rewrite git history to
  scrub the old file from past commits, since this is a shared repo other
  sessions are actively working against and the risk was in the file's
  content, not its filename --- the forward fix (delete + replace + correct
  the record) fully addresses it going forward. `pnpm check` green
  (21 tests).
- [`7e1b3cf`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/7e1b3cf):
  another playtest-driven fix --- the user reported still taking damage from
  jumping over a monster. `23eba26`'s jump-dodge only gated the
  monster-*projectile* collision on `player.grounded`; the separate
  monster-*body* contact check had no such gate, so touching a monster's x
  range always hurt regardless of jump state. Added the same `grounded` gate
  there. Verified with a temporary (removed before commit) debug hook driving
  frame-by-frame state from a headless browser: lives stayed unchanged across
  35 airborne frames directly over a monster, then dropped exactly on the
  frame the player landed while still overlapping it. `pnpm check` green
  (21 tests).
- [`3c1882b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-passionleader/commit/3c1882b):
  the author asked whether the remaining CC0 assets should be hand-authored
  instead -- reversing `Plan.md`'s source-first default. Drafted replacements
  for player/monster/background/gun/SFX in a scratch dir first (delegating
  SFX synthesis to the peer session), built a review page compositing all of
  them at true in-game scale, and had the author approve/reject per asset
  before wiring anything in. Approved: slime, background (sky/hills/ground/
  plants), the gun (redrawn as vector shapes in `main.ts`, no PNG) and its
  bullet, and all four SFX. Rejected: the player sprite ("캐릭터 구림" --
  wants a 2-heads-tall chibi design, human or not) and `bg/tree.png` ("너무
  허술해 보임"). Only the approved half was wired in and credited; player and
  tree stay CC0-sourced pending a second attempt. `pnpm check` green
  (21 tests); verified live via the dev server, not just the review page.
  Still owe: the character and tree redo.
