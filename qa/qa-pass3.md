# İnönü Tribün Savaşı — v5 Full-Pass QA Report

**Tested:** 19 Nov 2026, https://sebblackhill-rgb.github.io/inonu-stadium/ — deployed build identifies as **`inonu-v5`** (770 KB single HTML file, Three.js bundled). The previous report covered `inonu-v3` (730 KB).
**How:** hands-on in a desktop browser at 1280×720 and an emulated 390×844 phone viewport (iPhone-class), plus the page's own forced-mobile frame (`?mobile=1`) and its English (`?lang=en`), sound-request (`?sound=1`) and live-bridge (`?live=1&retryScale=0.05`) configurations. One full match played to natural full time at real speed; several more accelerated through the page's own hooks (`__step`/`__soak`); the live-event API (`window.handleLiveEvent`) driven directly for streak/held/throw/penalty edge cases; matcher unit checks via `window.__match`; full read of the v5 bundled source.
**Bottom line:** v5 is a direct response to the v3 report, and every v3 defect I could re-exercise is fixed and re-verified live for the sequences tested. No new scoring-corrupting defect was found. The remaining findings are two visible layout collisions (B1, B2), two behaviour semantics worth a deliberate decision — match timing in a hidden tab (B4) and one series shared across tabs (B3) — plus small cleanups.

**Confidence labels:**
- **[LIVE]** reproduced through gameplay, the page's own UI, or its event path in this session.
- **[ACCEL]** reproduced on the page's documented fast-forward hooks — real code path, accelerated clock.
- **[SOURCE]** found by reading the bundled code, not reproduced in a live run.
- Synthetic events are labelled; a simulated gift is not a verified TikTok delivery.

---

## A. v3 findings — retest verdicts

| v3 item | Verdict | Evidence (this session) |
|---|---|---|
| C1 Out-of-order gift streaks double-count | **FIXED [LIVE, synthetic sequences]** | The v3 repro sequence (one user, repeatCount 1,2,5,5-dup,4-late, with a streak id) now credits exactly 5 diamonds (was 9). Id-less streak 1,3,2 within the combo window credits 3. A singles-only feed (always repeatCount 1) credits every event (4/4). A fresh "1" after 4s silence starts a new combo (2 total). These are synthetic events through the page's own handler keyed by `streakId/comboId/groupId`; which shape the real TikTok delivery actually takes is unverified, so the real-feed contract remains the launch gate (Section E). |
| C2 Like cap swamped by activity point | **FIXED [LIVE]** | 15 likes → exactly 3 pts; 30 → still 3; 40 (after a 2.5s wait past the chat-point gate) → still 3. Likes route with points suppressed; the 1-pt/2s activity drip is comments-only now, and the config documents the rule. |
| C3 Two tabs fight over saved state | **ADDRESSED [LIVE] with a remaining design note** | Series writes are now read-modify-write, the night board merges by best score, and a `storage` listener syncs tabs. No more silent reset. Remaining coupling in B3 below. |
| C4 "sayıldı" log lies about expired held gifts | **FIXED [LIVE]** | Gift held → wait 185s → join: nothing applied, no "sayıldı" line. Live held gift → join: 30 diamonds applied and the line fires. |
| C5 Pick prompt can lag reality | **STILL PRESENT [LIVE, minor]** | Prompts still flush on the ~2.6s cycle; the prompt element sits visible-but-empty between flushes. Harmless. |
| D2 Penalty conversion fixed at 75% | **ADDRESSED [LIVE]** | Conversion is now chant-scaled (`60% + 0.3 × chant%`): measured 79% at chant 64 and 66% at chant 19. |
| D3 Rival end has no identity | **STILL OPEN** | Away end is still generic "MİSAFİR/VISITORS". |
| B2 Low-FPS slow motion | **PARTIALLY RE-OPENED [LIVE]** — see B4 |

All v3 passed-checks that I re-exercised still pass (joins, whole-word matching, throw ladder, held flow, gift tiers, ceremony, persistence, honest sound states, live-bridge failure handling, help overlay, URL params).

---

## B. Findings in v5 (ranked)

**B1. [LIVE, cosmetic, medium] The in-stadium screen doubles the scoreboard right behind the HUD.**
The 3D world contains a working stadium screen (`WX.scoreCanvas`) that renders team names, the score and "MAÇ SONU"/minute. At the kickoff camera sweep and through the full-time ceremony it projects into the top-right HUD cluster, sitting directly behind the away chant meter and the "🎤 BU MAÇ" board chip — the viewer sees two scoreboards stacked on each other (screenshots 1 and 2). On the mobile frame it is visible near the series chip during normal play too. It is diegetic and the data is correct, but the composition reads as a rendering bug at exactly the two most-watched moments (kickoff, full time).
*Fix direction:* move the in-world screen up/back or rotate the FT/kickoff camera so the screen never lands under the HUD cluster; or dim it when the ceremony panel is up.
*Acceptance test:* screenshot at kickoff sweep and during the 16s FT panel on desktop and `?mobile=1` → no second scoreboard within the HUD strip.

**B2. [LIVE, cosmetic] The pick-a-team prompt and the sound pill occupy the same slot and overlap.**
With sound blocked pending a tap and an undecided viewer waiting, `#prompt` ("@cem34: önce takımını seç → 1 = EV · 2 = DEP") and `#soundpill` ("🔈 Ses kapalı — açmak için dokun") render at the identical position — both `display:block` at top 599px on the forced-mobile frame, and both at top 740px in the true 390×844 viewport (prompt 93–298px, pill 104–286px wide) — each partially covering the other (screenshot 3). Desktop shows the sound pill only after a sound request, but the same collision applies there.
*Fix direction:* stack them (prompt above pill) or hide the sound pill while a prompt is pending.
*Acceptance test:* `?sound=1`, fire a like from an unjoined viewer → prompt and pill never intersect.

**B3. [LIVE, design decision] Two open tabs now share one series — every tab's matches count.**
The v3 overwrite is fixed, but the merged behaviour means a preview tab and the OBS overlay tab both bump the same stored series and night board. Observed incidentally: tab A (natural match, never finished) absorbed tab B's accelerated full-time results into its on-screen series mid-match. If you ever run a preview alongside OBS, the series will double-count. If one tab per stream is the rule, this is fine — say so in the docs; otherwise add a leader guard (e.g. `?write=0` for previews, or a storage-lock single writer).
*Acceptance test:* two tabs, one completes a match → series increments by exactly one, and a `?write=0` tab never writes.

**B4. [LIVE runtime behaviour] A backgrounded/hidden tab runs slow — roughly 5x behind real time.**
Verified in this session: with the tab hidden, rAF is throttled to about 1 fps and the 0.25s-per-frame simulation cap then gates the match — measured ~10 wall-seconds per game-minute while hidden (designed: 2s), recovering immediately when the tab is foregrounded again. Foregrounded, the match keeps real time even while the renderer degrades. What this means for any specific deployment (for example a hidden or occluded overlay source) is not something I could test here — it depends on how the page is hosted on stream day. If the page will ever run hidden, consider a wall-clock catch-up mode; otherwise document that the tab must stay active.
*Also observed:* the quality monitor works — at 5.3 fps the renderer auto-dropped to "low" and kept simulating.

**B5. [LIVE, minor] Full-time panel shows an empty "BU MAÇIN EN İYİLERİ" section for quiet matches.**
A 0–0 match with no point-scoring fans renders the top-3 header with no rows and no MOTM line (screenshot 1, panel lower half). Hide the section when empty, or show a "sessiz maç!" line.

**B6. [LIVE, minor] Social preview image is portrait.**
`cover.jpg` verified visually this time: a real gameplay capture, on-brand — good. But it is 959×1198 portrait; most platforms expect ~1200×630 landscape for `og:image`/`twitter:summary_large_image` and will crop. Also within the image the goal banner wraps "%75" to a second line and the top-of-stands banner text collides with the momentum chip. Regenerate landscape from a desktop capture.

**B7. [observed counter + SOURCE] `state.warnings` never resets.**
Observed live: the per-end warning counter reached 6 after three offences in one session (it accumulates across restarts and matches). Reading the kickoff code confirms nothing resets it [SOURCE]. Currently display-only, but if anything ever reads it, it will mislead. Reset it in the kickoff block with the other per-end state.

---

## C. Visuals & first-time customer experience

Assessed as a first-time viewer landing mid-stream, then as a participant.

What works:
- **Instant legibility.** Score, minute, both chant meters, momentum and the join instructions ("1 yaz → EV SAHİBİ / 2 yaz → DEPLASMAN") are all visible without scrolling on desktop and the phone frame. The permanent throw-rule line and per-end risk line ("DEP 2/3 → SÖZLÜ UYARI") make the only punishable action fully knowable before you try it.
- **Every input echoes.** Joins confirm with the end name and a one-time rule echo; held gifts announce themselves and resolve with a receipt; drum/torch actions log immediately. A viewer never wonders whether their message landed.
- **English mode is complete.** Swept 24 Turkish strings across start screen, panel, gameplay log, warnings and prompts after pressing L / `?lang=en`: zero leftovers; log lines render in English ("@ali34 joined the HOME end").
- **Honest chrome.** Sound boots muted with a clear tap-to-enable pill; the live bridge narrates its own state (connecting → failed with retry counter → tap-to-retry) instead of faking a crowd.
- **The ceremony matters.** The 16-second full-time panel (score, crests, series line, countdown) plus the persistent night board give a session-shaped arc; the in-stadium screen, tifo and goal replays give real broadcast flavour.
- **Auto quality scaling** keeps the show moving on weak hardware (observed drop to "low" at ~5 fps).

What hurts the first impression:
- The doubled-scoreboard composition (B1) at kickoff and full time — the two moments a newcomer is watching hardest.
- The pill collision (B2) reads as a broken layout to a first-time mobile viewer.
- The away end being "MİSAFİR" (D3) still costs the rivalry its punch; a rotating nightly rival name would multiply the drama.
- On desktop the game renders inside a narrow portrait stage with wide empty margins — correct for a phone-shaped OBS overlay, but a viewer opening the link directly on desktop may think the page failed to fill the screen. A one-line "telefon görünümü · OBS overlay" hint, or a wider desktop stage, would set expectations.

---

## D. Passed checks (verified live this session)

- Boot, start screen, PLAY, intro sweep, kickoff; **one full match to natural full time** (2–2), ceremony, series increment and automatic next-match kickoff observed at real speed.
- **True 390×844 phone viewport pass:** stage fills the width exactly (390px, no horizontal scroll, zero DOM overflow), scoreboard, crests, meters, momentum, night board, feed, risk lines, legend and throw-rule line all render inside the viewport and stay readable; start screen and live gameplay both inspected (screenshots 4-5).
- Joins: "1", "11", "1!", "111", "ev sahibi", "EV SAHİBİ", "⚫", "⚪", "2", "deplasman", "🔴" join; "1990", "1 dakika", "go home", "1 2" never join (unit-checked through `__match`).
- Actions: "davul/drum/🥁", "meşale/torch", "şişe/bottle/🍾", "çakmak/lighter"; "dumb", "durum", "çakmakta", "su" trigger nothing; "dumb davul" drums; "MEŞALE" uppercase works.
- Streak contracts: id-keyed duplicates/out-of-order rejected; id-less window, singles feed, and new-combo-after-silence all correct (Section A, C1).
- Likes: exact 3/min cap, no activity-point leak (A, C2).
- Held flow: unassigned like+gift → pending + prompt; join applies them with the receipt line; expired gifts apply nothing and log nothing (A, C4).
- Throw ladder [LIVE, synthetic user]: throw −4 rival chant; 3-in-20s → verbal warning (no chant cost) + 21s cooldown (throws "sayılmadı", no hurt); next 3 → yellow card −15; next 3 → 30s ban ("⛔ EV atış yasaklı (30 sn)"), throws during ban blocked. Per-end tracking and kickoff reset verified.
- Penalties: Lion during a goal celebration queues (phase stays `celebrate`, queue depth 1) and is taken at next open play, conversion chant-scaled; queue clears; never lost.
- Gifts: tier thresholds, batching ticker, diminishing points (1,500-diamond Lion = exactly 60 pts cap).
- Full time: ceremony content (score, result, series line, top-fans header, countdown), series chip ("MAÇ 4 · SERİ 2-0 (2🤝)"), per-match board reset, chant/throws/offence/penalty-queue reset at kickoff.
- Persistence: series {2-0-2} and 80 night entries restored after a full reload; "Seriyi sıfırla" zeroes both immediately.
- Pause: zero clock drift over 2.5 wall seconds, "⏸ 0'" clock, resume works, restart works.
- Sound: honest muted boot + pill on `?sound=1`; trusted tap → AudioContext `running`, 🔊, pill hides; mute toggle live.
- Live bridge: pill states, exact backoff (5/10/30/60s × retryScale measured 250/500/1500/3000ms), 5-try cap, tap-to-retry resets and re-attempts (6th attempt observed).
- URL params exercised: `?bot`, `?demo`, `?lang`, `?sound`, `?live`, `?retryScale`, `?mobile`, `?clip` (clean static frame, panel hidden).
- English sweep: zero Turkish leftovers in chrome or gameplay log.
- Zero JavaScript errors across all tabs and the whole session.

---

## E. Testing gaps — what I could NOT verify

- **Real TikTok LIVE delivery.** The Playroom CDN was again unreachable from the test environment, so field names (`diamondCount` vs `giftValue`), real like batching, real streak shapes and reconnect against a live broadcast remain unproven. The streak results above cover the tested synthetic sequences only. Failure handling is verified good; the success path is not. One real test broadcast before going live is still the launch gate.
- **Physical phone.** Phone results come from an emulated 390×844 viewport in a desktop browser engine: layout and rendering are genuine at that size, but touch behaviour, mobile Safari quirks and real GPU performance are unverified.
- **Audio quality/mix.** Graph state and unlock verified; actual sound cannot be judged here. The `__renderAudio` share-clip pipeline is untested.
- **Multi-hour soak and 70-bot stress on real hardware.** Bot cap (70) and crowd code verified in source; the test environment is too slow to stress-render it meaningfully (it auto-dropped to low quality at ~5 fps with only ~45 fans).
- **Screenshot 2 timing nuance:** the doubled scoreboard at FT was captured consistently, but exact frames vary with camera motion; treat the acceptance test as the judge.

## F. Suggested priority for the builder

1. **B1** (stadium screen vs HUD) — the most visible flaw, at the two most-watched moments.
2. **B2** (prompt/pill collision) — one CSS/stacking change.
3. **B3 decision** — document "one tab only" or add `?write=0` for preview tabs.
4. **B5 + B7** — empty top-3 section and the unreset counter; tiny cleanups.
5. **B6** — landscape cover image.
6. Then the standing gate: **one real test broadcast** (E) and a real-phone pass before launch.

---
*Screenshots: (1) full-time ceremony with the doubled scoreboard, (2) zoom of the overlap, (3) the pill/prompt collision, (4) 390×844 start screen, (5) 390×844 live gameplay. Synthetic events were used for streak/held/throw/penalty edge cases; all scoring-affecting results are labelled accordingly. No real gifts, broadcasts or account changes were made.*
