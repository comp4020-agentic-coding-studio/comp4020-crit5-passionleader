# Asset credits

This game mixes two kinds of assets: some are hand-authored by the project
author or synthesised programmatically for this project; the rest are
free/open-licence files sourced from [OpenGameArt.org](https://opengameart.org)
and re-cropped/resized to keep the shipped payload small, never otherwise
redrawn. Each section below says which. None of this game's art, music, or
characters are taken from SEGA's *Wonder Boy* --- see `Plan.md` and
`CLAUDE.md` for the "mood, not the IP" rule that governs the design.

## Player sprite --- `player/`

**Red Hat Boy** by [Aleksandr Panteleymonov (gamedevpetya)](https://opengameart.org/content/red-hat-boy-free-sprites)
Licence: **CC0 1.0** (public domain, no attribution required).
Source zip: <https://opengameart.org/sites/default/files/redhatfiles.zip>

## Monster sprite --- `monster/slime-1..4.png`

Hand-authored by the project author (Python/Pillow, squash-and-stretch
blob with a highlight/shadow lobe and dot eyes) --- not sourced from
OpenGameArt, so no third-party licence applies. Replaces the previously
credited **Pixel art animated Slime** by
[Sanctumpixel](https://opengameart.org/content/pixel-art-animated-slime)
(CC0 1.0), which was reviewed and rejected in favour of an original look
that matches the redrawn player and gun.

## Background --- `bg/jungle-far.png`, `bg/ground.png`, `bg/plant.png`

Hand-authored by the project author (Python/Pillow): a dusk-gradient sky
over three parallax silhouette ridgelines (`jungle-far.png`, stretched to
the map by the game, not tiled), a grass-to-soil ground strip built to
tile edge-to-edge since the game repeats it every 40px (`ground.png`), and
a small fern/berry clump (`plant.png`). Not sourced from OpenGameArt, so no
third-party licence applies.

## Tree --- `bg/tree.png`

**2D Platformer Jungle Pack** by [Tio Aimar](https://opengameart.org/content/2d-platformer-jungle-pack)
Licence: **CC0 1.0 Universal** ("Credit ... this is not mandatory", per the
pack's own `License.txt`).
Source zip: <https://opengameart.org/sites/default/files/2D%20Platformer%20Jungle%20Pack%20%28Tio%20Aimar%29_0.zip>

- `tree.png` <- `PNG/jungle_pack_57.png`

A hand-authored replacement for this file was drafted and rejected (too
plain next to the rest of the set) --- still sourced from the pack above
pending a second attempt.

## Music --- `audio/seong_retro_adventure.mp3`

Original composition by the project author, written and recorded in Logic
Pro specifically for this game --- not sourced from OpenGameArt, so no
third-party licence applies. This replaces an earlier track the author had
built by ear-copying an existing song closely enough to raise a real
plagiarism risk; that file was pulled before ever being credited as
"original" here and swapped for this fully original composition instead.

## Sound effects --- `audio/*.wav`

Synthesised from scratch in Python (stdlib `wave`/`struct`/`math`, raw
square/sawtooth waveforms with hand-tuned pitch sweeps and envelopes) ---
not sampled or sourced from anywhere, so no third-party licence applies.
Replaces the previously credited **8-Bit Sound Effect Pack (Vol. 001)** by
[Shades](https://opengameart.org/content/8-bit-sound-effect-pack-vol-001)
(CC0), reviewed and rejected in favour of effects tuned specifically to
this game's hit/hurt/pickup/powerup moments.

- `hit.wav` --- sharp square-wave chirp, 900->220 Hz, 110ms
- `hurt.wav` --- sawtooth sweep, 500->90 Hz, 320ms
- `pickup.wav` --- two-note ascending chime, 660->990 Hz, 180ms
- `powerup.wav` --- four-note rising arpeggio, 760ms

## Everything else

The boomerang, gun icon/bolt, HUD hearts, and projectile shapes are drawn
directly on the canvas (no image asset) --- simple enough that sourcing one
would have cost more clarity than it bought. The gun was redrawn from flat
placeholder rectangles to a small shaded blaster silhouette with a
glow-core plasma bolt, still entirely vector code in `main.ts`.
