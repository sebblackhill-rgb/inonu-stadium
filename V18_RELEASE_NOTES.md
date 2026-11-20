# v1.8 — İnönü: readable attacking opportunities

**Staging only.** Layered on the v1.7 cinematic branch, not public main.

## Implemented
- A non-blocking 9:16 match card displaying attack direction and actual
  current goal probability computed by the existing goalChance() model.
- Penalty cue when there is a real `state.pen`, with free-action
  chant instructions (DRUM/TORCH; DAVUL/MEŞALE).
- Shows nothing for a non-attacking or quiet phase, avoiding permanent HUD clutter.
- Reduced-motion support; class transitions only; no new WebGL meshes or
  match timing, odds, gift accounting changes.
- Updated both modular source and the assembled standalone `index.html`.
- New Chromium spectator state/score integrity test and screenshots.

## Test contract
`bash build.sh`, `node --test tests/stabilization.test.mjs`,
existing browser tests and `tests/v18-viewer-browser.mjs`.

## Next acceptance
Verify both home/away penalty directions, intro, broadcaster framing, original
goal-replay priority, audio behaviour and real device GPU/OBS stability.
