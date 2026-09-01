# Crit 5 reflection

**What was the breakthrough that moved the work forward?**

I set out to build something in the spirit of the SEGA arcade games I grew up
on, but because I told Claude Code to source free assets rather than draw
anything from scratch, the result kept sliding toward an early-2000s
Flash-game feel — a blend of Claude's asset choices and my own half-formed
vision, not what I actually meant. Writing `Plan.md` and `CLAUDE.md` carefully
up front wasn't enough by itself; even "obvious" mechanics (a scrolling map,
a boss whose HP scales with the stage) only appeared once I described them
in that much detail. The real breakthrough was two decisions: composing the
retro BGM myself in Logic Pro — I used its AI session player to perform the
parts, but picked every chord progression and instrument by hand myself —
and running a second Claude Code session, the two messaging each other directly
(`ListAgents`/`SendMessage`) while I managed both. Directing, not just
prompting once, is what closed the gap.

**What did this change about who I want to be as a software developer?**

Watching game credits list a stage designer, an asset designer, a sound
engineer, and a director side by side, I realized I had reconstructed that
structure without meaning to: myself as director, sound engineer, and QA; one
Claude session as asset/stage designer and internal QA; another as the
implementer. It felt like being the CEO of a small team of Claude Code
instances — and the ceiling of what came out tracked my own skill as a
director, not the model's alone. I'm not there yet, but I want to grow into
someone who can direct a project like this well enough to actually ship it to
a real market.
