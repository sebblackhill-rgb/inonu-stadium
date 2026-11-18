# İnönü Tribün Savaşı — TikTok LIVE chant battle

Single-file browser game (Three.js r128 inlined, works offline). Portrait 9:16 for TikTok LIVE screen share.

**Play:** https://sebblackhill-rgb.github.io/inonu-stadium/  ·  **Clip:** share.mp4

## Viewer commands
| Comment / action | Effect |
|---|---|
| `1` / `home` / `ev` | Take a seat in the HOME end (black & white) |
| `2` / `away` / `dep` | Take a seat in the AWAY end (red & yellow) |
| any other comment | Chant (+ chant meter). High chant + momentum → attacks → goals |
| ❤️ likes | Small chant boost |
| `davul` / `drum` 🥁 | Hit the stand drum (BOOM, nearby fans jump) |
| `meşale` / `torch` 🔥 | Light a torch with smoke in team colours |
| `şişe` / `bottle`, `çakmak` / `lighter` | Throw onto the pitch (dents rival chant; 3 throws in 20 s → referee warning, −20 chant) |
| 🌹 small gift (<5) | Drum hit · gift ≥5 → torch · ≥100 → stand wave · ≥1000 → giant TIFO + penalty kick |

## Keys / URL
H test panel · M sound · L Turkish/English · `?bot=1` demo crowd · `?live=1` TikTok via Playroom · `?lang=en`.
API: `window.handleLiveEvent({type:'chat'|'like'|'gift', userId, username, comment, giftName, diamondCount, repeatCount, likeCount})`.

Rename teams / keywords in the `CONFIG` block at the top of `src/game1.js`, then run `./build.sh`.
No official club names or crests are used.
