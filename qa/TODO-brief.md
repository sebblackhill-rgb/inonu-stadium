# Outstanding work (in order). Commit+push after each small step.
1. Finish cross-check of v1 QA report (/cursor/stores/user/grok-bot/agents/a4a99712-9754-42b9-89af-5dfe76472992/assets/e127ce42a085cd172eb19b685482531898d402c699a312b89844a85d45d304e7.txt): every item ID -> status.
2. Fix the new issues + nits from the pass-2 retest report qa/qa-pass2.md, with acceptance tests (make code robust where a real-provider check is pending).
3. Visual upgrade: realistic Inonu/Tupras stadium (roofed tiered stands, floodlights, generic LED boards, dugouts, corner flags, nets, striped pitch with correct markings, scoreboard screen). Real 11v11 match: two kits, keepers in different colours, referee + linesmen; formation (4-4-2/4-3-3), dribble, pass, shoot, keeper dives, goal celebrations; driven by existing chant/momentum logic + penalty queue. Crowd: denser animated crowd, scarves/flags, Mexican wave, tifo, flares/smoke, home capo with megaphone/drum, phone lights, paper rain on goal, slow-mo replay of goal scorer, camera shake. Phone perf: instancing/LOD, >=30fps on emulated iPhone, auto quality downgrade. 9:16 friendly. Keep all mechanics/tests; add tests for 11v11 presence + fps fallback.
4. Redeploy, verify live tag, re-record 10s share.mp4 (players, goal, crowd), check frames, screenshots of new look.
Report: item status table (v1 + pass-2), tests, live tag, clip, screenshots.

## Pass 3 (qa/qa-pass3.md) -> v6. Commit+push after each step.
- [ ] B1 stadium screen never under HUD at kickoff sweep / FT ceremony (desktop + ?mobile=1); dim during ceremony; test: projected screen bounds vs HUD strip
- [ ] B2 #prompt stacked above #soundpill, never intersect; test ?sound=1 + unjoined like
- [ ] B3 ?write=0 preview (never writes series/night) + single-writer storage lock; docs "one tab per stream"; test 2 tabs -> series +1 exactly, write=0 never writes
- [ ] B4 time-based match: wall-clock catch-up when hidden/throttled (fixed substeps, capped catch-up/frame, no render when hidden); test throttle + hide
- [ ] B5 empty top-3 -> "Sessiz maç!" / "Quiet match!"
- [ ] B6 cover.jpg 1200x630 landscape desktop capture, no wrapped text; og/twitter tags
- [ ] B7 reset state.warnings at kickoff + test
- [ ] C5 hide empty #prompt
- [ ] D3 rotating nightly fictional rival identity (name+colours), CONFIG + ?rival= override, no real clubs
- [ ] Desktop hint "telefon görünümü · OBS overlay" / "phone view · OBS overlay" in margin on wide desktop
- [ ] version inonu-v6, full suite desktop+phone, deploy, verify tag 200, screenshots kickoff+FT desktop+mobile, re-record share.mp4 + check frames
