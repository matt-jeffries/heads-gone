// Full-time animations: mounts the design handoff's GoalAnimation / GameOverAnimation
// (football-animations.js, a React island) and plays one per result in turn, looping forever.
// Same API as the old finale.js: Finale.play(host, [{ mood: "win" | "lose" | "draw" }], onItem, { once })
(function () {
  const HOLD = 1.6; // seconds the final title stays up before the next result
  let root = null, host = null, timer = null, token = 0;

  function stop() {
    token++;
    clearTimeout(timer); timer = null;
    if (root) { root.unmount(); root = null; host = null; }
  }

  function play(el, items, onItem) {
    stop();
    const FA = window.FootballAnimations;
    if (!FA || !window.ReactDOM || !items.length) return;
    host = el; root = ReactDOM.createRoot(el);
    const my = ++token;
    const step = (i) => {
      if (my !== token) return;
      const it = items[i];
      const Comp = it.mood === "win" ? FA.GoalAnimation : FA.GameOverAnimation;
      onItem && onItem(i);
      root.render(React.createElement(Comp, {
        key: my + ":" + i,
        onComplete: () => {
          if (my !== token) return;
          timer = setTimeout(() => step((i + 1) % items.length), HOLD * 1000);
        },
      }));
    };
    step(0);
  }

  window.Finale = { play, stop };
})();
