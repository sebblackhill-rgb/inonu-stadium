# İnönü Tribün Savaşı — v3 Retest QA Report

**Tested:** 18 Nov 2026, https://sebblackhill-rgb.github.io/inonu-stadium/ — deployed build identifies as **`inonu-v3`** (730 KB single HTML file, Three.js bundled). The previous report covered `inonu-v1` (690 KB).
**How:** hands-on in a desktop browser at 1280×720 plus an emulated phone layout (the page's own mobile mode, forced via its `?mobile=1` parameter — not a physical phone), across four parallel page instances; roughly six full matches played or accelerated through the page's own test hooks; every test-panel control exercised; the live-event API (`window.handleLiveEvent`) driven directly for edge cases; matcher unit checks via the page's own `window.__match`; full read of the v3 bundled source. **Zero JavaScript errors** across the whole session.
**Bottom line:** v3 is a direct, thorough response to the v1 report. Every bug that was reproduced in the v1 session is addressed in every path I could exercise here — some verified in natural gameplay, some on the page's accelerated test hooks, and two v1 items remain source-only confirmations. Two genuine new issues (one needs a real-provider check before it can be called a real-stream defect) plus a few small nits, listed below.

**Confidence labels:**
- **[LIVE]** reproduced through gameplay, the page's own UI, or its event path at natural speed.
- **[ACCEL]** reproduced on the page's documented fast-forward/test hooks (`__step`/`__soak`, `?retryScale`, pumped chant to reach a game state) — real code path, but the setup or clock was accelerated rather than natural play.
- **[SOURCE]** found by reading the bundled code, not reproduced in a live run.

---

## A. v1 findings — retest verdicts

| v1 item | Verdict | Evidence |
|---|---|---|
| A1 Lion penalty dropped during goal celebration | **ADDRESSED [LIVE+ACCEL]** | The goal was reached with pumped chant and accelerated stepping; the gift itself and everything after ran the normal path: sent mid-celebration it now queues (`penQ=1`, phase stays `celebrate`) and the penalty is taken at the next open play — observed sequence `celebrate→play→penalty`, taker credited to the gifter. |
| A2 "dumb" hits the drum (substring match) | **ADDRESSED [LIVE]** | Whole-word token matching with Turkish letter folding. Unit-checked 27 strings through the page's own matcher: `dumb`, `durum`, `çakmakta`, `su` trigger nothing; `dumb davul` drums; `MEŞALE` (uppercase) works. |
| A3 `?sound=1` shows 🔊 but plays silence | **ADDRESSED [LIVE]** | Boots honestly: 🔇 + warning styling + a "Ses kapalı — açmak için dokun" pill. First real tap → AudioContext `running`, 🔊, pill hides. Normal PLAY flow also reaches `running`. |
| A4 `?live=1` silent when the bridge fails | **ADDRESSED [ACCEL]** | A status pill shows connecting / connected / failed / lost / quiet. Backoff timing verified on the page's built-in `?retryScale` hook (delays scaled 1:1 with the configured 5s→10s→30s→60s ladder), stops after 5 tries, then offers tap-to-retry; tapping resets and retries. Unscaled wall-clock timing not re-measured. |
| A5 English mode leaves Turkish chrome | **ADDRESSED [LIVE]** | All UI strings moved into the string table. After pressing L: panel, hints, buttons, chips and titles all English; swept for 16 Turkish words — none left in the tested surfaces. |
| A6 Awkward short codes in join lines | **ADDRESSED [LIVE]** | Full names ("EV SAHİBİ tribününe katıldı"), join batching ("+4 DEPLASMAN: @ayse.k, @deniz_tr +2"), and each accepted join token is echoed once ("✅ "1" = EV SAHİBİ tribünü") so the rule is visible. |
| B1 Penalty annuls an in-flight shot | **ADDRESSED [SOURCE, consistent in LIVE runs]** | Queued penalties only start when no shot is in flight; in the live penalty sequences observed, each penalty waited for play to open. The old kill line still exists in `startPenalty` but now appears unreachable mid-shot; a shot interrupted exactly at a queue boundary was not constructed. |
| B2 Low-FPS slow motion | **IMPROVED [SOURCE]** | The frame loop now simulates up to 0.25s per frame in ≤50ms substeps and draws once, which reduces the slow-motion risk on slower devices. Stalls beyond that 0.25s cap (or sustained very low frame rates) are not covered by this change and still need timing tests on real hardware; "3-minute match stays 3 minutes" is not established here. |

## B. v1 design items — what changed

Nearly all of the twelve design items and ten polish items show concrete, tested changes. Two qualifications up front: the away end is still generic (old D3, still open), and the new `cover.jpg` was verified to exist but its contents were not visually inspected. Verified live unless noted:

- **Referee-warning spam (C1) → escalating ladder, verified [LIVE+ACCEL].** 3 throws in 20s = offence. 1st: verbal warning; 2nd: yellow card −15 chant (yellow card element confirmed on screen); 3rd: 30-second throw ban. After any offence, a 20s cooldown where that end's throws neither count nor hurt the rivals — verified: rival chant delta 0 during cooldown and ban, "sayılmadı" / "yasaklı" log lines shown. A 👀 "HAKEM İZLİYOR" cue fires after the 2nd throw (recorded firing; at that instant a goal popup had screen priority, which is the popup priority system working as designed — the cue's on-screen appearance was not separately eyeballed). Cooldown gaps were advanced on the accelerated clock. Bots now play cautious near the threshold.
- **Endless bot joins (C2) → hard cap, verified [ACCEL].** After a long accelerated run at 30 events/s: exactly 70 bot fans (cap, seed included), plateau held, no recycled `_8`-style names. Natural-speed confirmation would take much longer; the cap logic itself is the same either way.
- **Throwing trap (C3) → telegraphed.** The full rule is printed in the legend, a permanent risk line shows each end's count ("DEP 2/3 → SÖZLÜ UYARI"), and warning chips (⚠️💬🟨⛔) sit under the fan counts (old C12 addressed too). Throwing is still strategically net-negative, but now honestly so — remaining concern is downgraded to a design note (section D).
- **"su" bottle alias (C4)** — removed deliberately, with a comment citing the v1 report.
- **Ambiguous digits (C5) → explicit permitted tokens [LIVE].** "1", "11", "1!", "111", "ev sahibi", "⚫" join home; "1990", "1 dakika", "go home", "1 2" never join. Matches the v1 acceptance criteria exactly.
- **Team keyword worth less than chat (C6)** — addressed: equal chant value.
- **Leaderboard (C7) → two boards, verified [LIVE].** "🎤 BU MAÇ" (per-match, resets at kickoff) alternates with "⭐ GECENİN TARAFTARLARI" (8s/4s cycle). Night board and series persist in localStorage (8h window) and survive reload — verified: 75 night entries and an accumulated series restored after a fresh page load. Gift ranking points are now 4·√diamonds capped at 60/match — verified: a 1,500-diamond Lion earns exactly 60 points under this rule, not ~155.
- **Gifts from unjoined viewers (C8) → held, verified [LIVE].** Likes and gifts from someone who hasn't picked a side are held (not auto-seated); a prompt asks them to type 1 or 2 ("@x: hediyen bekliyor → 1 ya da 2 yaz!"); on joining, held likes chant and held gifts apply — verified end-to-end: a held Lion queued its penalty under the gifter's name the moment they typed "1".
- **Flat match loop (C9) → ceremony + series, verified [LIVE+ACCEL].** 16-second full-time panel: final score with crests, winner, series line, fan of the match, top 3, next-match countdown (screenshot 1). Match counter chip ("MAÇ 6 · SERİ 2-3 (1🤝)"). Chant, throws, offences and per-match points all reset at kickoff. The matches that produced these ceremonies were reached on the accelerated clock; the ceremony itself rendered and was inspected live.
- **Goals without chanting (C10) → gated [SOURCE].** Ends below 8% chant never shoot; shot rate scales with chant. Consistent with observation (a quiet instance drifted to full time scoreless) but not measured statistically.
- **Log flooding (C11) → addressed.** Join lines batched; log capped at 5 lines.
- **Polish:** label clutter (D1) capped at 10 non-overlapping tags — clean in all screenshots; mobile tall-sky (D2) reframed — both goals in view in the emulated phone layout (screenshot 2; forced mobile mode in a 1280-wide browser viewport, not a physical phone); social preview (D4) — full og:/twitter meta and a `cover.jpg` that returns HTTP 200 (existence and bytes verified, image content not inspected); PLAY is now a real focused `<button>` (D5); drum spam (D6) batched — one effect per 1.5s with an "xN" ticker; `?help=1` overlay documents every key and URL param (D7); pause/resume/restart/reset-series/new-viewer controls added (D8) — pause verified with zero clock drift over 3 wall seconds and a "⏸" clock; restart keeps the match number while a natural full time increments it.
- **Still open from v1:** the away end is still generic "MİSAFİR/VISITORS" (D3) — the joke bot name is gone, but the rival still has no identity. That may be deliberate; if not, it is the biggest remaining flavour gap.

## C. New issues in v3

**C1. [LIVE, under an assumed streak contract] Out-of-order repeatCount events double-count — if real deliveries behave this way.**
The streak de-dup handles exact duplicates but not lower-count events arriving after higher ones. Synthetic sequence sent as one user with one gift name: repeatCount 1, 2, 5, 5 (duplicate tail), then 4 (late, lower). Credited: 9 diamonds' worth. Expected under an assumed cumulative-repeatCount-per-combo contract: 5. The final `repeatCount:4` event fell through and was credited as +4.
Important caveat: whether real TikTok deliveries actually behave this way is **unverified**. It is not established that one user+gift shares a single cumulative streak, that repeatCount is never reused across separate combos, or that the provider can deliver out of order at all. Before treating this as a real-stream defect, the actual delivery contract needs testing against the live bridge: real streak/combo IDs, when repeatCount resets, how a new combo is signalled, late "final" events, and reconnect behaviour.
*Acceptance test (once the contract is known):* replay the provider's real out-of-order/duplicate cases (whatever they turn out to be) and confirm credited diamonds equal the provider's authoritative final count for the streak.

**C2. [LIVE] The like-points cap is swamped by the activity point (rate extrapolated).**
Likes route through `fanChant`, which also grants +1 ranking point every 2s (the "chatEvery" path). Measured once: 15 likes → 4 points (3 like points at the documented cap + 1 activity point). Extrapolating that mechanism, a dedicated liker could earn on the order of ~30 pts/min regardless of the intended 3 pts/min like cap — that figure is arithmetic from the 1-per-2s rule, not a measured full minute. Either this is the intended "any engagement drips points" rule (then it wants documenting, and the like cap is effectively dead code) or likes should not trip the chat-point path.
*Acceptance test:* pick the rule, then measure a real 60s of continuous liking and confirm the total matches the documented choice.

**C3. [LIVE, in-browser only] Two same-origin tabs fight over the saved series/night state.**
Reproduced with two tabs of the game in the same browser profile: both read and write the same localStorage keys, and each tab's periodic persist overwrites the other's series and night board — tab A's accumulated series was reset to 0-0-0 after tab B persisted. Whether this matters in the real streaming setup (e.g. an OBS browser source plus a preview) is **unverified** — whether those share storage was not tested.
*Acceptance test (if the real setup shares storage):* open two instances, complete a match in one → the stored series reflects both instances' matches, or a single-writer guard makes the second instance read-only.

**C4. [SOURCE] The "gift counted" log can lie about expired held gifts.**
Held gifts expire after 180s, but the "hediyesi … sayıldı ✅" log line fires whenever the pending record had any gifts, even if all of them expired and nothing was applied. Cosmetic, but it misleads the streamer at exactly the moment a viewer finally picks a side.
*Acceptance test:* gift, wait past the expiry, join → no "sayıldı" line when nothing was applied; line shows when at least one gift applied.

**C5. [LIVE, cosmetic] The pick-a-team prompt can lag reality.**
Prompts flush every 2.6s; a viewer who joins inside that window can still be named in a "hediyen bekliyor" prompt for a moment. Harmless; worth a filter at flush time.

## D. Design notes (judgment calls, not defects)

1. **Throwing is now honest but still a trap strategically.** Every throw costs the rivals 4 chant but builds toward −15 and a ban for your own end. The telegraphing is good enough that this is now a flavour choice: fine if you want "passionate but costly", but expect viewers to learn to never throw.
2. **Penalty conversion is fixed at 75%** regardless of chant, while normal shots scale with chant. Reasonable (a gift is a gift), but the 🦁 meta may dominate close matches; consider tying conversion to chant like normal shots.
3. **The rival end deserves an identity** (carried over from v1 D3). Even a per-match rotating name ("BU GECE: …") would multiply the drama for a Beşiktaş audience.
4. **Stoppage time is a genuinely nice touch** — the clock showing "90+' + uzatma: penaltı" while queued penalties play out is exactly the kind of detail that makes viewers trust the rules.

## E. Passed checks (verified live unless noted)

- Boot, start screen, PLAY (real button, keyboard-focusable), intro sweep, kickoff whistle.
- Joins: digits, repeated digits, "1!" variant, team names, team-colour emoji, Turkish case-folded keywords; non-join messages correctly never join; one-time rule echo per token.
- Held-flow: unassigned like + gift → pending + prompt; join applies them; pending caps in source (5 gifts, 400 viewers, 180s gift expiry).
- Actions: drum/torch/bottle/lighter with correct effects and logs; whole-word matching; Turkish folding.
- Throw ladder: watch cue fired, verbal warning, yellow (−15, yellow card visual), 30s ban, cooldown semantics, per-end tracking, reset at kickoff. (Cooldown waits on the accelerated clock.)
- Gifts: Rose/Donut/Party/Lion tiers; effect batching with xN ticker; wave throttle; diminishing points cap 60; tifo momentum spike.
- Penalties: queueing during celebration, max-2-per-team cap with documented chant fallback, taken in arrival order, not started mid-shot in observed sequences, not queued after FT ("maç bitti — penaltı yok"), stoppage-time extension (clock holds at "90+' + uzatma: penaltı" and full time waits for the queue to drain — observed on the accelerated clock), queue cleared at kickoff.
- Match engine: goals, saves/post misses with chant%→chance% explanations, celebrations, rubber-banding, momentum, minChant shot gate [SOURCE], stoppage display.
- Full time: 16s ceremony with score/winner/series/MOTM/top-3/countdown; series and match counter; per-match board reset; night board + series persistence across reload.
- Sound: honest icon/pill states, gesture unlock, mute toggle, live icon updates. (State-level verification; no audible output — see Gaps.)
- Live bridge: status pill states, backoff ladder shape (5→10→30→60s, verified on the scale hook), 5-try cap, tap-to-retry, lost/quiet watchdog strings in source [partially SOURCE].
- Controls: H/M/L/P/? keys, panel hide, help overlay open/close, pause (zero drift over 3 wall seconds), restart, series reset, bot toggle + rate slider, new-viewer button.
- URL params: `?bot`, `?demo=0`, `?lang=en`, `?sound=1`, `?panel=0`, `?seed`, `?mobile=1`, `?clip=1` (static frame renders, panel hidden), `?help=1`, `?live=1`, plus the `?retryScale`/`?bridgeSrc` test hooks.
- Emulated phone layout (forced mobile mode, not a physical device): panel auto-hidden, camera reframed for tall screens, all HUD elements reachable and readable in the 1280-wide test viewport.
- No JS errors anywhere in the session across four tabs and hours of accelerated game time.

## F. Testing gaps — what I could NOT verify

- **Real TikTok LIVE connection.** The Playroom CDN (unpkg) was unreachable from the test browser again (same as v1), so event field names (`diamondCount` vs `giftValue`), real like batching, real streak shapes (see C1's caveat) and reconnect against a live broadcast all remain unproven. The failure *handling* is now verified good; the success path is not.
- **Real-device / OBS performance.** This was browser-based testing, which renders far slower than real hardware — actual device and OBS behaviour cannot be established here. Test on a physical phone and in the real OBS browser source before going live, including the frame-timing question behind old B2 (stalls beyond the new 0.25s substep cap are untested).
- **Audio output.** Graph state and unlock behaviour verified; actual sound quality/mix cannot be judged in this setup. The offline `__renderAudio` share-clip pipeline is untested.
- **Tab-hidden behaviour, iOS Safari quirks, multi-hour wall-clock stability.** Accelerated logic ran clean for the equivalent of many matches, but that is not a wall-clock soak test.
- **`cover.jpg` contents** (existence verified, image not visually inspected), **physical-phone rendering** (mobile was an emulated layout), and **micro-spacing** at odd viewport sizes (no overlaps seen in the viewports used).
- **Whether the real streaming setup shares storage across instances** (see C3).

## G. Suggested priority for the builder

1. **Pin down the real streak delivery contract, then address C1 if the assumption holds** — it is the only new issue that would corrupt scoring, and only if real deliveries can arrive out of order within one streak.
2. **Decide the like-points rule (C2)** and measure one full minute of liking to confirm the chosen behaviour.
3. **Check whether your real OBS/preview setup shares storage (C3)**; if it does, add a guard.
4. The two cosmetic items (C4, C5) whenever convenient.
5. Then the same standing gap as v1: **prove the real feed** with one test broadcast before going live.

---

*Screenshots: (1) the new full-time ceremony — score, winner, series line, fan of the match, top 3 and next-match countdown, captured in the 1280×720 desktop browser. (2) live gameplay in the page's forced mobile mode inside the same 1280-wide browser viewport — an emulated layout check, not a physical phone.*
