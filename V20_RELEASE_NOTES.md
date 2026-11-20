# İnönü Tribün Savaşı v2.0 — LIVE-readiness release candidate

**STAGING ONLY.** Based on v1.9. No public main or Pages deployment.

## Implemented
- Privacy-safe, bounded host stream-health diagnostics, estimated p95 render FPS, WebGL context warnings, browser portrait dimensions, event counters and JSON export.
- Tests with a local Playroom mock for first valid gift and repeated delivery. CI cannot verify TikTok's genuine paid gift events.
- Corrected gift streak recognition: a repeated group-ID one-shot can no longer be credited again. Provider message IDs are deduplicated using a bounded 20,000-key map even across reconnect.
- Strict LIVE isolation: demo bots cannot be seeded via `?seed=` or enabled with `?host=1`; host/test-origin events cannot enter LIVE scoring.
- Remote script substitution via `?bridgeSrc=` works only on localhost, never on the publicly shared LIVE URL.
- Existing unsubscribe and generation guards retained; a provider disconnect now starts bounded retry instead of leaving the host indefinitely disconnected.
- Source modules and standalone deployable `index.html` both committed.

## Release gates
1. Validate provider eventId, repeatCount, repeatEnd and streak/group ID with actual redacted TikTok LIVE data. **Mock is not provider proof.**
2. Perform controlled paid gift settlement/reconnect/replay audit in a small private LIVE stream; reconcile ledger and visibility against actual provider receipts.
3. Record 20–30 minutes of real Windows OBS portrait rendering. Inspect host-health export, latency, CPU/GPU, sound, overlays and actual p95 FPS.
4. Run two-browser/tab test; ensure only one writer updates persistent series and nightly rankings. Use `?write=0` for preview tab.
5. Human review of safe-area and both home/away outcomes before merging the stacked stabilisation/v1.7/v1.8/v1.9/v2.0 PRs.

## Local diagnostics
Open the staging app on localhost, show host panel (H), and export **v2.0 STREAM HEALTH**. The JSON excludes usernames, event IDs and raw paid gift details.
