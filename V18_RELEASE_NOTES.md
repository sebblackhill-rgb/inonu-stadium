# v1.8 — Build the Great Pyramid: teamwork and visible progress

**Pyramid-only isolated staging branch.** Do not merge into inonu-stadium main.

## Implemented
- An interactive-looking but non-interactive action cue that reads the real
  current state: join a crew, per-team % toward the next stone, stone delivery,
  Apep phase and next round.
- Free comment/like instructions first; paid gifts are not required to advance.
- Dynamic progress uses existing `T.pts / CONFIG.pullsPerBlock`; never
  fabricates contributions, changes ownership or allocates credits.
- Lightweight existing instanced worker rigs now brace and pull slightly
  farther in unison during actual rope-heave events; no added mesh draw calls.
- Bilingual prompt text and a new Chromium viewer state test.

## Test contract
`node --check src/game.js`, `node --test tests/*.test.mjs`,
prior browser, cinematic and `tests/v18-viewer-browser.mjs`.

## Critical repository restriction
Must be migrated into standalone private pyramid-live repo before any
production release. Real TikTok LIVE contract, purchases and phone/OBS
performance still need verification.
