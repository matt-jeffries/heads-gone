#!/bin/sh
# Wraps the game page (written without <html>/<head>, as published to claude.ai) into a
# full document for the website, with the home-screen app tags.
# Usage: scripts/wrap.sh path/to/game.html > index.html
cat <<'HEAD'
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0c1a42">
<meta name="description" content="The football forehead guessing game. Tilt down when you get it, tilt up to pass.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Head's Gone">
</head><body>
HEAD
cat "$1"
cat <<'TAIL'
<script>
  // Offline support (sw.js). Skipped when opened as a local file.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
</script>
</body></html>
TAIL
