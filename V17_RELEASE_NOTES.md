# v1.7 cinematic gameplay — İnönü Tribün Savaşı

**Staging only.** Based on `codex/stabilization-20261119`, not deployed to `main`.

- Small broadcast push-in during eligible attacking possession with sufficient chant.
- Portrait goal-mouth framing for queued gift penalties, before the shot.
- Existing scorer celebration and goal replay take priority over the new camera modes.
- Camera modes exposed for QA: wide / attack / penalty / celebrate / replay.
- `?cinema=0` and OS reduced-motion disable the new movement.
- Match physics, conversion probabilities, crowd rules, gifts, scoreboard and timers are untouched.

## Quality gates

`bash build.sh` is required after changes under `src/` because the deployed
game is the generated single-file `index.html`.
Run `node --test tests/stabilization.test.mjs` and existing Chrome suite plus
`node tests/v17-cinematic-browser.mjs`. The staging workflow rebuilds the HTML
and uploads a deployable snapshot + screenshots.

## Field checks

Review attacking scenes and both directions of penalties in portrait,
including a goal-replay interruption, reduced-motion mode and low-end devices.
Check that both goal mouths and the score remain legible.
Real TikTok LIVE settlement and OBS FPS remain unverified.
