# Great Pyramid v2.0 — isolated LIVE-readiness release candidate

**PYRAMID ONLY**. This code resides on an isolated Pyramid branch of `inonu-stadium`. **NEVER MERGE INTO INONU MAIN.** Move it to a private `pyramid-live` repository before any launch.

## Implemented
- Bounded, anonymous host diagnostics for bridge state, p95 frame timing, WebGL context, received event outcomes and JSON export without personal data.
- 20-second Playroom script load and 30-second insertCoin handshake timeouts; failed transports retain bounded retry.
- Disconnect subscriptions now retire listener callbacks, invalidate old generations and schedule retry without replaying old event handlers.
- The existing gift ledger, streak settlement, team joins, conservation rules and Apep HP remain unchanged.
- A local Playroom mock replays a gift with an identical ID to assert no duplicate credited gift; no real TikTok funds involved.
- Existing source contracts, natural-time scenario tests and portrait Chromium screenshot tests remain.

## Release gates
1. Move Pyramid source to its dedicated private GitHub repository, preserve history, disable accidental pages publishing in the `inonu-stadium` repository.
2. Obtain redacted genuine TikTok LIVE event shapes and test group-id/streak-end settlement, retry, late join and gift preservation.
3. Run controlled paid test gifts and verify the ledger against real receipts. Mock tests DO NOT validate genuine TikTok gift settlement.
4. Test a 20–30 minute OBS portrait stream on actual hardware (performance, WebGL context, loss/recovery, safe-area and sound).
5. Human confirm timeouts, reserve-full support warnings and disconnect actions prior to production.

## Host panel
Open staging locally and press H. Export an anonymous v2.0 stream-health report, or call `window.V20Ops.download()`. Never post captures containing real profile photos/IDs publicly.
