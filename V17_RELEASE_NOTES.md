# v1.7 cinematic gameplay — Build the Great Pyramid

**Isolated Pyramid branch**, never merge this branch to İnönü `main`.
Based on `codex/pyramid-stabilization-20261119`.

- Team-coloured construction milestone focus (at most once every 6 s).
- Wide reveal when a crew completes the build race.
- Short Apep reveal as the boss phase begins.
- Two-stage victory scene: finished pyramid first, full-valley view second.
- All transitions are camera-only with no new geometry or particle allocations.
- `?cinema=0`, `?calm=1` and OS reduced-motion disable new shots.
- No changes to time, ledger, paid gift accounting, boss HP or winner selection.

## Quality gates

`node --check src/game.js`; `node --test tests/*.test.mjs`;
existing Pyramid Chrome checks plus `node tests/v17-cinematic-browser.mjs`.
The isolated workflow preserves the staged source and screenshots.

## Critical repository note

This branch lives in `inonu-stadium` temporarily as a recovered separate
game. Migrate to private `pyramid-live` before any release; never mix Pyramid
source with İnönü deployed HTML. Actual LIVE connector contract and device FPS
require separate verification.
