/* v2.0.1 Desktop rehearsal assistant. Local, privacy-safe and read-only.
   It cannot validate paid gifts or publish/merge the game. */
(function () {
  "use strict";
  const V201 = "v2.0.1";
  const TESTS = [
    ["webgl", "WebGL context"],
    ["render", "Render samples"],
    ["frame", "Frame-time stability"],
    ["canvas", "Game canvas"],
    ["local", "Local/secure origin"],
    ["bridge", "LIVE connection"],
    ["gifts", "Real paid gifts"],
    ["obs", "Real OBS capture"],
    ["audio", "Audio and stream overlays"]
  ];
  function isLocal() {
    return ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  }
  function inspect() {
    const ops = window.V20Ops && window.V20Ops.report
      ? window.V20Ops.report() : null;
    const canvas = document.querySelector("canvas");
    const rect = canvas && canvas.getBoundingClientRect();
    const samples = ops ? ops.frame.samples : 0;
    const p95 = ops ? ops.frame.p95Ms : null;
    const live = ops && ops.mode === "live";
    const checks = [
      {id:"webgl",state:!ops ? "WAIT" :
        ops.webgl.lost > ops.webgl.restored ? "WARN" : "OK",
        detail:ops && ops.webgl.lost ? "Context loss observed; inspect on your Windows GPU" :
          "No reported WebGL context loss"},
      {id:"render",state:samples < 10 ? "WAIT" : "OK",
        detail:samples+" sampled render intervals (target at least 10)"},
      {id:"frame",state:samples < 10 ? "WAIT" :
          p95 !== null && p95 > 50 ? "WARN" : "OK",
        detail:p95===null ? "Start gameplay to measure" :
          "p95 "+p95+" ms, ~"+(ops.frame.estimatedP95Fps ?? "?")+" FPS; verify in actual OBS"},
      {id:"canvas",state:rect && rect.width > 0 && rect.height > 0 ? "OK" : "WAIT",
        detail:"A visible game canvas is required"},
      {id:"local",state:isLocal() || location.protocol==="https:" ? "OK" : "WARN",
        detail:isLocal() ? "Local staging (safe for mock rehearsal)" :
          location.protocol==="https:" ? "HTTPS stage" : "Use localhost or HTTPS"},
      {id:"bridge",state:!live ? "N/A" :
          ["live","ok","listening"].includes(ops.bridgeConnection) ? "CHECK" : "WARN",
        detail:!live ? "Local game rehearsal; not connected to TikTok" :
          "Bridge status is not proof of genuine paid gifts"},
      {id:"gifts",state:"OPEN",detail:"Actual provider event shapes, group IDs and paid receipts still unverified"},
      {id:"obs",state:"OPEN",detail:"Complete a 20–30 minute OBS capture on the actual PC"},
      {id:"audio",state:"OPEN",detail:"Listen to audio and check TikTok overlays/safe areas in OBS"}
    ];
    return {
      tool:V201, checkedAt:new Date().toISOString(),
      mode:ops?.mode ?? "unknown",
      approvedForProduction:false,
      actualTikTokGiftContractVerified:false,
      controlledPaidGiftReceiptsReconciled:false,
      liveHardwareOBSValidated:false,
      summary:{
        ok:checks.filter(c=>c.state==="OK").length,
        warning:checks.filter(c=>c.state==="WARN").length,
        manualOpen:checks.filter(c=>c.state==="OPEN"||c.state==="CHECK").length
      },
      checks, runtime:ops,
      instructions:"Preview one game at a time. Real LIVE checks must use a controlled private session. Download the report and keep it without identifying user data."
    };
  }
  function saveReport() {
    const data=JSON.stringify(inspect(),null,2);
    const blob=new Blob([data],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;
    anchor.download="desktop-rehearsal-"+(window.V20Ops?.report()?.game||"game")+".json";
    anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function dom(tag,txt) {
    const el=document.createElement(tag);
    if (txt!==undefined) el.textContent=txt;
    return el;
  }
  function draw() {
    const panel=document.getElementById("test-panel");
    if (!panel) return;
    let root=document.getElementById("v201-preflight");
    if (!root) {
      root=dom("section");root.id="v201-preflight";
      root.setAttribute("aria-label","Desktop preflight checks");
      root.style.cssText="border:1px solid #6b94a1;border-radius:9px;margin:10px 0;padding:10px;background:#111c29;color:#f0f7fb;font:12px/1.5 system-ui";
      root.appendChild(dom("b","v2.0.1 · DESKTOP REHEARSAL"));
      const explanation=dom("p","Safe preview checks. LIVE paid-gift and real OBS proof remain open.");
      explanation.style.margin="4px 0";
      root.appendChild(explanation);
      const table=dom("div");table.id="v201-results";table.setAttribute("role","status");
      table.style.cssText="display:grid;gap:4px;margin:7px 0 9px";
      root.appendChild(table);
      const run=dom("button","Run checks again");run.type="button";run.onclick=()=>draw();
      const exportBtn=dom("button","Export rehearsal report");
      exportBtn.type="button";exportBtn.onclick=saveReport;
      run.style.marginRight="6px";
      root.append(run,exportBtn);
      panel.appendChild(root);
    }
    const values=inspect();
    const results=document.getElementById("v201-results");
    if (!results) return;
    results.replaceChildren();
    for(const item of values.checks) {
      const name=TESTS.find(c=>c[0]===item.id)?.[1]||item.id;
      const el=dom("div",item.state+" · "+name+" — "+item.detail);
      el.style.padding="3px 5px";
      el.style.borderLeft="3px solid "+
        (item.state==="OK"?"#83d3a5":item.state==="WARN"?"#eeab73":"#7d96ac");
      results.appendChild(el);
    }
  }
  window.V201Rehearsal=Object.freeze({inspect,draw,saveReport});
  window.__v201Preflight=inspect;
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",draw,{once:true});
  else draw();
})();
