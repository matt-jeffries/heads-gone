# Head's Gone!

A Heads Up-style party game for footballers. Pick a category, hold the phone to your
forehead, and your mates describe the player. Tilt down = got it, tilt up = pass.

- `index.html` - the whole game (no build step). Written in artifact form (no `<html>/<head>` wrapper).
- `categories.js` - hand-picked starter categories.
- `verdicts.js` - full-time pundit lines, grouped by winning margin, each tagged with the scene that acts it out.
- `scenes.js` - hand-drawn (pencil and crayon on canvas) full-time animations.
- `wikidata-categories.js` - extra categories generated from Wikidata (empty until the script runs).
- `scripts/fetch-wikidata.mjs` - `node scripts/fetch-wikidata.mjs` queries Wikidata SPARQL and rewrites `wikidata-categories.js`.

Controls: tilt (DeviceOrientation; iOS asks permission on Start), the Pass / Got it buttons, or Up / Down arrow keys.
Tilt detection uses cos(beta)·cos(gamma), the vertical component of the screen's facing direction, so it works in portrait or landscape.
