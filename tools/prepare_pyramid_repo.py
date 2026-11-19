#!/usr/bin/env python3
"""Convert recovered public Pyramid HTML into an editable standalone source tree."""
import hashlib, json, re, sys
from pathlib import Path

EXPECTED = "b60c6e5904c8262c8972b8a11825711f4c9724c0b81ae397af2c5754377791ef"

def main():
    raw=Path(sys.argv[1]).read_bytes()
    out=Path(sys.argv[2])
    page=raw.decode("utf-8")
    css=list(re.finditer(r"<style>\s*(.*?)\s*</style>",page,re.S))
    scripts=list(re.finditer(r"<script>(.*?)</script>",page,re.S))
    if len(css)!=1 or len(scripts)!=2:
        raise ValueError("Unexpected Pyramid source format")
    style,three,game=css[0].group(1),scripts[0].group(1),scripts[1].group(1)
    if "@license" not in three or "window.handleLiveEvent" not in game or "const state =" not in game:
        raise ValueError("Recovered site is not expected game build")
    for folder in ("archive","src","vendor","tests"):
        (out/folder).mkdir(parents=True,exist_ok=True)
    (out/"src/game.js").write_text(game+"\n")
    (out/"vendor/three.min.js").write_text(three+"\n")
    (out/"styles.css").write_text(style+"\n")
    (out/"archive/served-index-2026-11-19.html").write_bytes(raw)
    page=re.sub(r"<style>\s*.*?\s*</style>",'<link rel="stylesheet" href="./styles.css" />',page,count=1,flags=re.S)
    page=page.replace(scripts[0].group(0),'<script src="./vendor/three.min.js"></script>',1)
    page=page.replace(scripts[1].group(0),'<script src="./src/game.js"></script>',1)
    page=re.sub(r"<!-- This page is hosted on flypod.*?</script>","",page,count=1,flags=re.S)
    page=re.sub(r'<script async src="/_flypod/widget\.js".*?</script>',"",page,count=1,flags=re.S)
    page=re.sub(r'<script type="module" src="https://static\.cloudflareinsights\.com/.*?</script>',"",page,count=1,flags=re.S)
    (out/"index.html").write_text(page)
    (out/".nojekyll").write_text("")
    sha=hashlib.sha256(raw).hexdigest()
    manifest={"capturedAt":"2026-11-19","source":"public Flypod browser build",
      "origin":"https://0f34b9b3e51449f5.flypod.page",
      "servedHtmlSha256":sha,"matchesPriorQA":sha==EXPECTED,"priorQASha256":EXPECTED,
      "sizeBytes":len(raw),"gameJsSha256":hashlib.sha256(game.encode()).hexdigest(),
      "limitations":["original Grokbot authoring workspace unavailable","no real LIVE provider testing"]}
    (out/"SOURCE-MANIFEST.json").write_text(json.dumps(manifest,indent=2)+"\n")
    (out/"README.md").write_text("""# Build the Great Pyramid - recovered source

Recovered 19 November 2026 from its public Flypod page. This is
an editable reconstruction of the served HTML, not Grokbot's original
authoring project. The new SHA differs from the older QA hash.

Run locally with python3 -m http.server 8000, then open localhost:8000/?demo=0.
Do not start LIVE until the real provider and payments are validated.

- index.html: editable entry point
- styles.css: the original inline stylesheet
- src/game.js: game code, unchanged at baseline
- vendor/three.min.js: inlined MIT-licensed Three.js
- archive/served-index-2026-11-19.html: raw public hosted bytes
- SOURCE-MANIFEST.json: hashes and provenance

This branch is solely a Pyramid archive. Never merge it into
the unrelated Inonu game. Move it into its own pyramid-live repository.
""")
    (out/"tests/source-integrity.test.mjs").write_text("""import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=readFileSync(new URL('../archive/served-index-2026-11-19.html',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('../SOURCE-MANIFEST.json',import.meta.url),'utf8'));
test('raw source hash reconciles',()=>assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.servedHtmlSha256));
test('live entry point exists',()=>assert.match(readFileSync(new URL('../src/game.js',import.meta.url),'utf8'),/window\.handleLiveEvent\s*=\s*handleLiveEvent/));
test('hosting code removed from editable entry',()=>{
 const s=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(!s.includes('/_flypod/widget.js'));
 assert(s.includes('./src/game.js') && s.includes('./vendor/three.min.js'));
});
""")
    print(json.dumps(manifest,indent=2))

if __name__=="__main__":
    main()
