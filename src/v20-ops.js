/* v2.0 OBS/LIVE operational diagnostics.
   Bounded, PII-free counters and local performance samples only.
   NOT a proof of TikTok provider authenticity or successful paid gift settlement. */
(function () {
  "use strict";
  const qp = new URLSearchParams(location.search);
  const mode = qp.get("live") === "1" ? "live" : qp.get("demo") === "1" ? "demo" : "test";
  const began = performance.now();
  const samples = new Float32Array(240);
  const countByType = {chat:0, like:0, gift:0, other:0};
  const outcome = {forwarded:0, applied:0, held:0, duplicate:0, rejected:0};
  let seen = 0, frames = 0, slot = 0, used = 0, lastFrame = 0, lastEvent = 0;
  let slow = 0, giantGaps = 0, connection = mode === "live" ? "connecting" : "sandbox";
  let lost = 0, restored = 0, refresh = 0, game = "game";
  function init(name) { game = String(name || "game").slice(0,32); paint(); }
  function event(kind, result) {
    const k = Object.hasOwn(countByType, kind) ? kind : "other";
    seen++; countByType[k]++;
    lastEvent = performance.now();
    const r = Object.hasOwn(outcome, result) ? result : "forwarded";
    outcome[r]++;
  }
  function link(value) {
    const v = String(value || "").toLowerCase();
    if (["connecting","live","listening","ok","quiet","retrying","disconnected","down","fail","lost","sandbox"].includes(v)) {
      connection = v;
    }
    paint();
  }
  function frame(now) {
    if (!Number.isFinite(now)) return;
    if (lastFrame) {
      const d = now - lastFrame;
      if (d > 3000) giantGaps++;
      else if (d > 0) {
        samples[slot] = d; slot = (slot + 1) % samples.length;
        used = Math.min(samples.length, used + 1);
        if (d > 50) slow++;
      }
    }
    lastFrame = now; frames++;
    if (++refresh % 120 === 0) paint();
  }
  function report() {
    const n = used, arr = Array.from(samples.slice(0,n)).sort((a,b)=>a-b);
    const pct = p => n ? Math.round(arr[Math.min(n-1,Math.floor((n-1)*p))]*10)/10 : null;
    const elapsed = Math.max(0,(performance.now()-began)/1000);
    const eventAge = lastEvent ? Math.round((performance.now()-lastEvent)/1000) : null;
    const p95 = pct(.95);
    return {
      schema:1, release:"v2.0-rc", game, mode,
      bridgeConnection:connection, providerContractVerified:false,
      verifiedPaidGiftSettlement:false, // never asserted from a local test
      sessionSeconds:Math.round(elapsed),
      eventAgeSeconds:eventAge, receivedEvents:seen,
      kinds:{...countByType}, processing:{...outcome},
      frame:{samples:n, medianMs:pct(.5), p95Ms:p95,
        estimatedP95Fps:p95?Math.round(10000/p95)/10:null,
        slowFrames:slow, longPauses:giantGaps, totalRenderFrames:frames},
      webgl:{lost,restored}, viewport:{
        width:innerWidth,height:innerHeight,dpr:Math.round((devicePixelRatio||1)*10)/10},
      warning:lost>restored?"WEBGL_CONTEXT_LOST":
        (n>=10 && p95>50?"RENDER_P95_OVER_50MS":
        (mode==="live"&&["down","lost","fail","disconnected"].includes(connection)?"LIVE_BRIDGE_DOWN":
        (mode==="live"&&eventAge!==null&&eventAge>90?"NO_RECENT_PROVIDER_EVENT":"NONE")))
    };
  }
  function json() { return JSON.stringify(report(),null,2); }
  function download() {
    const blob = new Blob([json()],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url;
    a.download="v20-"+game+"-ops.json"; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function paint() {
    const root = document.getElementById("test-panel");
    if (!root) return;
    let host = document.getElementById("v20-ops");
    if (!host) {
      host = document.createElement("section");
      host.id="v20-ops";host.setAttribute("aria-label","v2.0 stream operations");
      host.style.cssText="border:1px solid #8292ad;border-radius:8px;padding:9px;margin-top:12px;background:#172033;color:#e8eef7;font:12px/1.45 system-ui";
      const label = document.createElement("b");label.textContent="v2.0 · STREAM HEALTH (HOST)";
      const detail = document.createElement("div");detail.id="v20-ops-data";
      detail.style.cssText="overflow-wrap:anywhere;margin:4px 0";
      const button = document.createElement("button");button.type="button";
      button.textContent="Export safe diagnostics";button.onclick=download;
      host.append(label,detail,button);root.appendChild(host);
    }
    const r=report(), fps=r.frame.estimatedP95Fps;
    document.getElementById("v20-ops-data").textContent=
      "Bridge "+r.bridgeConnection+" · feed "+r.receivedEvents+" events · "+
      "render p95 "+(fps===null?"warming":fps+" FPS")+" · "+
      "flags "+r.warning+" · gifts unverified";
  }
  document.addEventListener("DOMContentLoaded",paint,{once:true});
  window.addEventListener("webglcontextlost",()=>{lost++;paint()},true);
  window.addEventListener("webglcontextrestored",()=>{restored++;paint()},true);
  window.V20Ops = Object.freeze({init,event,link,frame,report,json,download});
  window.__v20Health = report; // read-only QA hook
})();
