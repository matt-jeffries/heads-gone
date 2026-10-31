# Hand-drawn full-time scenes (retired)

The earlier full-time animations: a different pencil-and-crayon scene for each pundit line,
drawn on canvas with Rough.js. Replaced in the game by `finale.js` (one flat cartoon
animation per result). The scene each line used is still tagged in `verdicts.js`.

To bring them back: load Rough.js (https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js)
and this `scenes.js`, then call `Sketch.play(canvas, items, onItem, { once: true })` with
`items[i].scene` set from `verdicts.js`.
