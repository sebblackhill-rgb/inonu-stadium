#!/usr/bin/env python3
"""Read-only, bounded public static-site recovery for owner's Pyramid build.
No credential access, no JS execution, no write to hosted site.
Usage: python3 tools/recover_pyramid.py
"""
import hashlib
import html.parser
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ORIGIN = "https://0f34b9b3e51449f5.flypod.page"
EXPECTED = "b60c6e5904c8262c8972b8a11825711f4c9724c0b81ae397af2c5754377791ef"
OUT = Path("pyramid-recovery")
MAX_ITEM = 12 * 1024 * 1024
MAX_TOTAL = 30 * 1024 * 1024
MAX_ASSETS = 90

class Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in {"script","img","audio","video","source"}:
            if d.get("src"): self.links.add(d["src"])
        if tag == "link" and d.get("href"): self.links.add(d["href"])

def file_name(url):
    p = urllib.parse.urlparse(url)
    root = urllib.parse.urlparse(ORIGIN)
    if p.scheme != root.scheme or p.hostname != root.hostname:
        return None
    clean = urllib.parse.unquote(p.path or "/")
    if "\x00" in clean or "\\" in clean: return None
    parts = PurePosixPath(clean.lstrip("/")).parts
    if any(t in {"..", "."} for t in parts): return None
    if not parts: return "index.html"
    if len(parts) > 12: return None
    if p.query: return None    # do not guess cache-busted dynamic query assets
    name = "/".join(parts)
    return name + "index.html" if name.endswith("/") else name

def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; owner-preservation/1.0)",
        "Accept": "text/html,application/javascript,text/css,image/*,*/*;q=0.8"
    })
    with urllib.request.urlopen(req, timeout=22) as response:
        final = response.geturl()
        if urllib.parse.urlparse(final).hostname != urllib.parse.urlparse(ORIGIN).hostname:
            raise ValueError("cross-origin redirect not followed for archive")
        length = int(response.headers.get("Content-Length") or "0")
        if length > MAX_ITEM: raise ValueError("resource too large")
        body = response.read(MAX_ITEM + 1)
        if len(body) > MAX_ITEM: raise ValueError("resource exceeded maximum bytes")
        return body, response.headers.get("Content-Type","")

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    report = {
       "capturedAt":datetime.now(timezone.utc).isoformat(),
       "url":ORIGIN,"expectedSha256":EXPECTED,"status":"unavailable",
       "files":[],"warnings":[],"sourceVerified":False
    }
    site = OUT/"site"
    site.mkdir(parents=True,exist_ok=True)
    try:
        data, content_type = fetch(ORIGIN+"/")
        if len(data)<100 or b"<html" not in data[:4096].lower():
            raise ValueError("response does not look like a web game HTML document")
        sha=hashlib.sha256(data).hexdigest()
        (site/"index.html").write_bytes(data)
        report.update(status="html-recovered",htmlSha256=sha,
                      htmlBytes=len(data),sourceVerified=sha==EXPECTED,
                      contentType=content_type)
        report["files"].append({"path":"index.html","bytes":len(data),"sha256":sha})
        if sha != EXPECTED:
            report["warnings"].append("HTML hash differs from 19 Nov Grokbot QA; verify the captured revision before editing")
        parser=Links()
        parser.feed(data.decode("utf-8","replace"))
        links = sorted({urllib.parse.urljoin(ORIGIN+"/",v) for v in parser.links})
        total = len(data)
        archived = 0
        for url in links:
            if archived >= MAX_ASSETS or total >= MAX_TOTAL:
                report["warnings"].append("Archive reached bounded size/file cap")
                break
            relative = file_name(url)
            if relative is None or relative == "index.html": continue
            try:
                blob, ctype = fetch(url)
                if len(blob)+total>MAX_TOTAL: raise ValueError("total size cap")
                dest = site/relative
                dest.parent.mkdir(parents=True,exist_ok=True)
                dest.write_bytes(blob)
                total += len(blob)
                archived += 1
                report["files"].append({"path":relative,"bytes":len(blob),
                    "sha256":hashlib.sha256(blob).hexdigest(),"contentType":ctype})
            except (OSError, ValueError, urllib.error.URLError) as e:
                report["warnings"].append("Asset not archived: "+relative+": "+str(e)[:180])
        report["assetCount"]=archived
        report["externalReferences"] = [u for u in links if file_name(u) is None][:60]
    except Exception as e:
        report["error"] = str(e)
        report["warnings"].append("Hosted source could not be retrieved; get original Grokbot workspace export")
    (OUT/"recovery-report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf-8")
    print(json.dumps({k:report.get(k) for k in ["status","htmlSha256","htmlBytes","sourceVerified","assetCount","error","warnings"]},indent=2))
    return 0 if report["status"]=="html-recovered" else 2

if __name__ == "__main__":
    raise SystemExit(main())
