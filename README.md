# İnönü Tribün Savaşı — TikTok LIVE chant battle

Single-file browser game (Three.js r128 inlined, works offline). Portrait 9:16 for TikTok LIVE screen share.

## The look (v5)
- **Stadium:** a Tüpraş/İnönü-style bowl. Roofed, tiered stands with cantilever roofs and LED fascia; four floodlight masts with light cones; generic scrolling LED boards that switch to GOOOL on a goal; a scoreboard screen; dugouts with subs and coaches; corner flags; goal nets; a mown-stripe pitch with real proportions (penalty box, six-yard box, spot, arcs, corner arcs).
- **Match:** 11 v 11. Home plays 4-4-2 in black and white, away 4-3-3 in red and yellow. Goalkeepers wear green and purple, and the referee and two linesmen wear yellow. Players hold shape, carry, pass and shoot, and the keeper dives. The scorer runs to the corner and slides, followed by a ⏪ slow-mo replay close-up. Everything is still driven by the chant and momentum logic and the penalty queue.
- **Crowd:** viewer fans with scarves, plus an ambient instanced crowd. Also: waving flags, a Mexican wave (stand-wave gifts, or both ends loud), tifos, flares and smoke, a capo with a megaphone on the home end, phone lights when an end is loud or at full time, paper rain and camera shake on a goal.
- **Performance:** instanced meshes, about 230–250 draw calls. A built-in fps monitor steps quality down high → medium → low (pixel ratio, light cones, ambient crowd density and animation rate) when fps stays under 30. It never flaps back up. `?q=low|med|high` locks a level.

**Play:** https://sebblackhill-rgb.github.io/inonu-stadium/  ·  **Clip:** share.mp4

## Viewer commands
| Comment / action | Effect |
|---|---|
| `1` `11` `1!` / `home` / `ev` / `ev sahibi` | Take a seat in the HOME end (black & white) |
| `2` `22` `2!` / `away` / `dep` / `deplasman` | Take a seat in the AWAY end (red & yellow) |
| likes / gifts before picking | Held (not counted for anyone) + on-screen "pick a team" prompt; applied once you type 1 or 2 |
| any other comment (incl. a team keyword once seated) | Chant (same value for every comment). A silent end (<8 % chant) never shoots. Chant % sets the goal chance shown on each meter (⚽ %) |
| `davul` / `drum` 🥁 · `meşale` / `torch` 🔥 | Drum hit (rate-limited rhythm) · torch with smoke |
| `şişe` / `bottle` · `çakmak` / `lighter` | Throw onto the pitch (−4 rival chant). 3 throws in 20 s = an offence: 1st verbal warning, 2nd yellow card −15 chant, 3rd+ 30 s throw ban. A 👀 "ref is watching" cue appears after the 2nd throw. After an offence that end's throws don't count (and don't hurt the rivals) for 20 s. Resets every match; risk meter and ⚠️💬🟨 chips always on screen |
| gifts | <5 💎 drum · ≥5 torch · ≥100 stand wave · ≥1000 TIFO + queued PENALTY. Rule: up to 2 queued per team, taken in arrival order at the next open-play moment (after a celebration or an in-flight shot resolves; stoppage time if needed). Extra tifos and tifos during the full-time ceremony add chant only; the queue is cleared at kickoff, so nothing carries into the next match. Repeats are batched (x12 counter) |

Joins use an explicit token list: every word of the comment must be one team's keyword, so "1990", "1 dakika", "go home" never seat anyone; each accepted form is logged once ("✅ “11” = EV SAHİBİ"). Actions are matched as whole words only ("dumb", "durum", "cakmakta" do nothing; "dumb davul" drums). "su"/"water" are deliberately not bottle aliases (too common in Turkish chat). Rankings: "BU MAÇ" (this match) and "GECENİN" (whole night) rotate; gifts earn 4·√diamonds, capped at 60 per match. 16 s full-time ceremony (score, series, fan of the match, top 3), then kickoff shows "MAÇ n"; match counter + series in the HUD.

Scoring rules: likes earn only like points (0.2 each, max 3/min); comments earn the 1-pt-per-2s activity point. Gift streaks are de-duplicated: with a provider streak/combo id the credited count is the highest repeatCount seen for that id; without one, a viewer+gift within 4 s is one cumulative streak (duplicates and late lower counts add nothing; a fresh "1" after >1 s is a new combo; a singles-only feed counts every event). Gift penalties convert at 60 % + 30 % × chant. Several instances sharing storage (OBS source + preview) merge: the series is only changed by read-modify-write at full time and the night board keeps each viewer's best score.

Tests: `node tests/acceptance.js` (headless, 72 checks: deterministic suite, 11v11/kits/passing/replay/wave/draw-call/quality-fallback checks, live bridge, audio policy, translations, 30-min bot soak, emulated iPhone). Share clip: `node tests/record-share-clip.js`.

## Keys / URL
H test panel · M sound · L Turkish/English (all chrome switches) · P pause · ? help overlay. Test panel also has ⏸ pause and ⟳ restart match.
URL: `?bot=1` demo crowd · `?live=1` TikTok via Playroom · `?lang=en` · `?sound=1` (sound starts on the first tap/key) · `?demo=0` no start screen/bots · `?panel=0` · `?seed=N` · `?clip=1` video mode · `?q=low|med|high` lock graphics quality · `?help=1` · camera `?cx ?cy ?lx ?fov ?fp ?lk`.
With `?live=1` a status pill shows connecting / connected / failed / disconnected / no-events. Failures retry after 5 → 10 → 30 → 60 s (5 tries), then the pill becomes "tap to retry"; after a disconnect it offers "tap to reconnect".
Slow devices: frames up to 0.25 s are simulated in 50 ms substeps, so matches don't go into slow motion. API: `window.handleLiveEvent({type:'chat'|'like'|'gift', userId, username, comment, giftName, diamondCount, repeatCount, likeCount})`.

Rename teams / keywords in the `CONFIG` block at the top of `src/game1.js`, then run `./build.sh`.
No official club names or crests are used.
