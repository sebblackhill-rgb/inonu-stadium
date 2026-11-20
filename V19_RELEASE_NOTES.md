# v1.9 — İnönü: organic supporter waves and match finale

Staging only; stacked on v1.8 branch and its draft PR. Do not merge straight into main.

## Changes
- A real positive chant rise across 70% triggers the existing stadium Mexican-wave animation, if at least three fans belong to that team and the 25 s cooldown has elapsed.
- Viewer card celebrates the wave briefly and suggests free DRUM/DAVUL comments.
- In the last ten simulated minutes, active attacks get a FINAL ATTACK cue. When neither side is attacking, a neutral FINAL MINUTES cue invites both teams.
- The existing full-time result panel gets one short glow/sweep, disabled for OS reduced motion.
- No new goals, shots, penalties, odds, supporter points, additional gift conversions or meshes are introduced.
- Source modules and the standalone generated index.html are both included.

## Quality gates
Node module checks; bash build.sh; match-cycle, natural soak, prior visual tests, plus tests/v19-finale-browser.mjs. Final screenshot in browser-evidence.

## Pending
Check both sides' late-match states, real phone FPS/OBS and actual LIVE settlement.
