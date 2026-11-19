import test from 'node:test';
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
