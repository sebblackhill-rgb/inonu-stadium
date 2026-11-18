# İnönü Tribün Savaşı — TikTok LIVE chant battle

Single-file browser game (Three.js r128 inlined, works offline). Portrait 9:16 for TikTok LIVE screen share.

**Play:** https://sebblackhill-rgb.github.io/inonu-stadium/  ·  **Clip:** share.mp4

## Viewer commands
| Comment / action | Effect |
|---|---|
| `1` / `home` / `ev` | Take a seat in the HOME end (black & white) |
| `2` / `away` / `dep` | Take a seat in the AWAY end (red & yellow) |
| likes / gifts before picking | Held (not counted for anyone) + on-screen "pick a team" prompt; applied once you type 1 or 2 |
| any other comment | Chant. Chant % sets the goal chance shown on each meter (⚽ %) |
| `davul` / `drum` 🥁 · `meşale` / `torch` 🔥 | Drum hit (rate-limited rhythm) · torch with smoke |
| `şişe` / `bottle` · `çakmak` / `lighter` | Throw onto the pitch (−4 rival chant). 3 throws in 20 s = an offence: 1st verbal warning, 2nd yellow card −15 chant, 3rd+ 30 s throw ban. Resets every match; risk meter always on screen |
| gifts | <5 💎 drum · ≥5 torch · ≥100 stand wave · ≥1000 TIFO + queued PENALTY (never lost; taken at the next open-play moment, stoppage time if needed). Repeats are batched (x12 counter) |

Words are matched as whole words/tokens only ("dumb", "drummer", "torchlight" do nothing). Rankings: "BU MAÇ" (this match) and "GECENİN" (whole night) rotate; gifts earn 4·√diamonds, capped at 60 per match. Full-time ceremony + running series score.

Tests: `node tests/acceptance.js` (headless, 32 checks). Share clip: `node tests/record-share-clip.js`.

## Keys / URL
H test panel · M sound · L Turkish/English · `?bot=1` demo crowd · `?live=1` TikTok via Playroom · `?lang=en`.
With `?live=1` a status pill shows connecting / connected / failed / disconnected / no-events. API: `window.handleLiveEvent({type:'chat'|'like'|'gift', userId, username, comment, giftName, diamondCount, repeatCount, likeCount})`.

Rename teams / keywords in the `CONFIG` block at the top of `src/game1.js`, then run `./build.sh`.
No official club names or crests are used.
