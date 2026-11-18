#!/bin/bash
# Assemble the single-file game: head.html + three.inc + game*.js
cd "$(dirname "$0")"
{ cat src/head.html; cat src/three.inc; echo '<script>'; cat src/game1.js src/game2.js src/game3.js src/game4.js; echo '</script>'; echo '</body></html>'; } > index.html
echo built $(wc -c < index.html) bytes
