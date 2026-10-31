// Hand-drawn full-time scenes. Shapes are drawn with Rough.js (falling back to plain canvas
// strokes if it fails to load) and redrawn 12 times a second with fresh randomness, so the
// lines boil like a flip-book. Each scene can also move a camera to get in close.
// Sketch.play(canvas, [{ scene: "lastgasp:swing", win, lose, info }], onItem) loops the list.
(() => {
  const W = 320, H = 180;
  const GL = 100;                         // goal line (front view)
  const GX0 = 118, GX1 = 202, GB = 62;    // posts and crossbar
  const PENCIL = "#2a2a33", PAPER = "#f6f3ea", GRASS = "#5f9f55", LINE = "#ffffff";
  const SKIN = ["#f1c7a5", "#e0ac83", "#c48659", "#8d5a3b", "#5e3a25"];
  const HAIR = ["#2b2018", "#5a3b22", "#c9a24f", "#151515", "#7a3b1d"];
  const KITS = [
    { shirt: "#d7263d", shorts: "#ffffff", socks: "#d7263d" },
    { shirt: "#8fc9ea", shorts: "#ffffff", socks: "#8fc9ea" },
    { shirt: "#c8102e", stripe: "#1d3c8f", shorts: "#c8102e", socks: "#1d3c8f" },
    { shirt: "#f4f4f4", stripe: "#222222", shorts: "#222222", socks: "#222222" },
    { shirt: "#f2c230", shorts: "#1b4d2e", socks: "#f2c230" },
    { shirt: "#7a1f3d", shorts: "#ffffff", socks: "#8fc9ea" },
    { shirt: "#f4f4f4", shorts: "#1f2d6b", socks: "#f4f4f4" },
    { shirt: "#1f3fa0", shorts: "#ffffff", socks: "#1f3fa0" },
    { shirt: "#f28c28", shorts: "#222222", socks: "#f28c28" },
    { shirt: "#2e8b57", stripe: "#f4f4f4", shorts: "#ffffff", socks: "#2e8b57" },
    { shirt: "#5b2a86", shorts: "#5b2a86", socks: "#f4f4f4" },
  ];
  const KEEPER = [{ shirt: "#c6e03a", shorts: "#222222", socks: "#c6e03a" }, { shirt: "#ff8fb1", shorts: "#222222", socks: "#ff8fb1" }, { shirt: "#3a3a3a", shorts: "#3a3a3a", socks: "#3a3a3a" }];
  const REF = { shirt: "#1c1c1c", shorts: "#1c1c1c", socks: "#1c1c1c" };
  const COAT = { shirt: "#34343c", shorts: "#2a2a30", socks: "#2a2a30" };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const pop = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2));
  const J = (a = 0.5) => (Math.random() - 0.5) * 2 * a;
  const rad = (d) => (d * Math.PI) / 180;
  const person = (kit) => ({ ...kit, skin: pick(SKIN), hair: pick(HAIR) });

  let c;          // the 2D context for the current frame
  let R = null;   // Rough.js canvas, when the library loaded
  let Z = 1;      // current camera zoom
  let BASE = [1, 0, 0, 1, 0, 0];

  // ---------- pencil and crayon ----------
  function stroke(pts, w = 1, col = PENCIL, alpha = 0.9, jit = 0.45) {
    if (R) {
      c.globalAlpha = alpha;
      R.linearPath(pts, { stroke: col, strokeWidth: w, roughness: Math.min(1.6, jit * 1.8), bowing: 0.8, disableMultiStroke: w > 2.2, preserveVertices: pts.length > 6 });
      c.globalAlpha = 1;
      return;
    }
    c.lineCap = c.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x + J(jit), y + J(jit)) : c.moveTo(x + J(jit), y + J(jit))));
      c.strokeStyle = col; c.globalAlpha = pass ? alpha * 0.5 : alpha; c.lineWidth = pass ? w * 0.7 : w;
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  function crayon(path, col, box, alpha = 0.8, gap = 1.8) {
    c.save(); c.beginPath(); path(); c.clip();
    c.globalAlpha = 0.35; c.fillStyle = col; c.fill();
    const [x0, y0, x1, y1] = box, h = y1 - y0;
    c.beginPath();
    for (let x = x0 - h; x < x1; x += gap) { c.moveTo(x + J(0.6), y1 + J(0.6)); c.lineTo(x + h * 0.7 + J(0.6), y0 + J(0.6)); }
    c.globalAlpha = alpha; c.strokeStyle = col; c.lineWidth = 1.2; c.stroke();
    c.restore(); c.globalAlpha = 1;
  }
  // A filled shape: { poly: [[x,y]...] } or { ell: [cx, cy, w, h] }, crayoned in with an outline.
  function shape(g, col, { outline = true, gap = 1.5, alpha = 1 } = {}) {
    if (!R) {
      const pts = g.poly || circlePts(g.ell[0], g.ell[1], 1).map(([x, y]) => [g.ell[0] + (x - g.ell[0]) * g.ell[2] / 2, g.ell[1] + (y - g.ell[1]) * g.ell[3] / 2]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      crayon(() => { c.moveTo(...pts[0]); pts.slice(1).forEach((q) => c.lineTo(...q)); c.closePath(); }, col, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], 0.85 * alpha, gap);
      if (outline) stroke([...pts, pts[0]], 0.8);
      return;
    }
    const draw = (opt) => (g.poly ? R.polygon(g.poly, opt) : R.ellipse(g.ell[0], g.ell[1], g.ell[2], g.ell[3], opt));
    c.globalAlpha = 0.5 * alpha; draw({ fill: col, fillStyle: "solid", stroke: "none", roughness: 0.5 });
    c.globalAlpha = alpha;
    draw({ fill: col, fillStyle: "hachure", hachureGap: gap, fillWeight: 0.9, hachureAngle: -41 + J(10), stroke: outline ? PENCIL : "none", strokeWidth: 0.85, roughness: 1, bowing: 1 });
    c.globalAlpha = 1;
  }
  // Light comes from the left, so the right-hand side of things gets a soft shadow.
  function shade(pts, alpha = 0.18) {
    c.globalAlpha = alpha; c.fillStyle = "#101018"; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const circlePts = (x, y, r, n = 14) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos((i / n) * 6.283) * r, y + Math.sin((i / n) * 6.283) * r]);
  function blob(x, y, r, col) { shape({ ell: [x, y, r * 2, r * 2] }, col, { gap: Math.max(0.8, r * 0.35) }); }
  function rectC(x, y, w, h, col, alpha = 0.8, outline = true) { shape({ poly: rectPts(x, y, w, h) }, col, { outline, alpha: Math.min(1, alpha + 0.2) }); }
  // Run a drawing in screen space, unaffected by the camera.
  function screen(fn) { const z = Z; c.save(); c.setTransform(...BASE); Z = 1; fn(); c.restore(); Z = z; }
  // Hand-lettered text. Anything near the top (y <= 40) is a caption and stays on screen.
  function say(txt, x, y, size = 16, col = PENCIL, k = 1, tilt = -6) {
    if (k <= 0) return;
    if (y <= 40 && Z !== 1) return screen(() => say(txt, x, y, size, col, k, tilt));
    size /= Z;
    c.save(); c.translate(x + J(0.3), y + J(0.3)); c.rotate(rad(tilt)); c.scale(pop(k), pop(k));
    c.font = `${size}px "Permanent Marker", "Comic Sans MS", cursive`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 4 / Z; c.strokeStyle = PAPER; c.strokeText(txt, 0, 0);
    c.fillStyle = col; c.fillText(txt, 0, 0);
    c.restore();
  }
  // Small painted lettering on signs and vehicles: no outline, so it stays legible when tiny.
  function label(txt, x, y, size, col) {
    c.save(); c.font = `700 ${size}px "Barlow Semi Condensed", "Arial Narrow", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = col; c.fillText(txt, x, y); c.restore();
  }
  // Boards sit on the screen, not in the scene, so the camera doesn't move them.
  function board(x, y, txt, w = 54) {
    screen(() => { rectC(x, y, w, 18, "#26262c", 0.9); say(txt, x + w / 2, y + 10, 12, "#f5c244", 1, 0); });
  }

  // ---------- people ----------
  const P = {
    stand: () => ({ lean: 0, uF: 8, fF: 14, uB: -8, fB: -4, tF: 4, sF: 2, tB: -4, sB: -2 }),
    run(p, a = 1) {
      const s = Math.sin(p), s2 = -s, tF = 38 * a * s, tB = 38 * a * s2;
      return { lean: 12 * a, tF, sF: tF - (12 + 55 * Math.max(0, -s)) * a, tB, sB: tB - (12 + 55 * Math.max(0, -s2)) * a,
        uF: -40 * a * s, fF: -40 * a * s + 75, uB: -40 * a * s2, fB: -40 * a * s2 + 75 };
    },
    kick: (k) => ({ lean: lerp(5, -12, k), tF: lerp(-50, 80, ease(k)), sF: lerp(-50, 80, ease(k)) - lerp(80, 0, k), tB: 10, sB: 5, uF: -60, fF: -30, uB: 70, fB: 95 }),
    up: (base = P.stand()) => ({ ...base, uF: 165, fF: 175, uB: -165, fB: -175 }),
    head: (base = P.stand()) => ({ ...base, uF: 150, fF: 235, uB: -150, fB: -235 }),
    kneel: (arms = "up") => ({ lean: -12, tF: 0, sF: -90, tB: 6, sB: -95, ...(arms === "up" ? { uF: 160, fF: 170, uB: -160, fB: -170 } : { uF: 150, fF: 235, uB: -150, fB: -235 }) }),
    sit: () => ({ lean: 25, nod: 30, tF: 85, sF: 20, tB: 78, sB: 12, uF: 50, fF: 80, uB: 40, fB: 70 }),
    slide: () => ({ lean: -55, tF: 85, sF: 90, tB: 35, sB: -45, uF: -120, fF: -100, uB: -135, fB: -120 }),
    fold: () => ({ ...P.stand(), uF: 15, fF: 100, uB: 15, fB: 100 }),
    dive: () => ({ lean: 0, uF: 172, fF: 178, uB: 165, fB: 175, tF: 12, sF: 5, tB: -12, sB: -15 }),
    sad: (p) => ({ ...P.run(p, 0.35), lean: 16, nod: 28, uF: 6 * Math.sin(p), fF: 10, uB: -6 * Math.sin(p), fB: 6 }),
  };
  const hipH = { stand: 18, kneel: 9.5, sit: 2, slide: 4 };

  const vec = (a, f) => [Math.sin(rad(a)) * f, Math.cos(rad(a))];
  const add = (p, v, l) => [p[0] + v[0] * l, p[1] + v[1] * l];
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  function limb(a, b, w, col) { stroke([a, b], w + 1.5, PENCIL, 0.85, 0.3); stroke([a, b], w, col, 0.95, 0.25); }

  // Facing the camera ("front") or walking away from it ("back"). Arms and legs open out
  // to either side; a leg whose thigh swings forward in the pose is drawn lifted.
  function figureFacing(o) {
    const k = o.kit, pose = o.pose, shirt = o.bare ? k.skin : k.shirt, back = o.view === "back";
    c.save(); c.translate(o.x, o.y); c.rotate(rad(o.rot || 0) * (o.f || 1)); c.scale(o.s || 1, o.s || 1);
    const neck = [0, -13], head = [0, -18.5];
    const kneeling = pose.sF <= -80;
    const leg = (side, t) => {
      const lift = kneeling ? 0 : clamp01(t / 45), hp = [side * 2.2, 0];
      if (kneeling) { const kn = add(hp, [side * 0.15, 1], 9); return [hp, kn, add(kn, [0, 1], 1.2)]; }
      const kn = add(hp, [side * 0.12, 1], 9 * (1 - 0.35 * lift)), ft = add(kn, [side * 0.05, 1], 9 * (1 - 0.45 * lift));
      return [hp, kn, ft];
    };
    const arm = (side, u, fo) => {
      const sh = [side * 3.6, -12.2];
      const e = add(sh, vec(Math.abs(u), side), 7);
      return [sh, e, add(e, vec(Math.abs(fo), side), 6.5)];
    };
    const legs = [leg(-1, pose.tB), leg(1, pose.tF)], arms = [arm(-1, pose.uB, pose.fB), arm(1, pose.uF, pose.fF)];
    if (!o.rot) {
      const fy = Math.max(legs[0][2][1], legs[1][2][1]) + 1.2;
      c.globalAlpha = 0.3; c.fillStyle = "#16310f"; c.beginPath(); c.ellipse(3.5, fy, 9.5, 2.2, 0.05, 0, 6.283); c.fill(); c.globalAlpha = 1;
    }
    for (const [hp, kn, ft] of legs) {
      limb(hp, kn, 2.8, k.skin); limb(hp, mix(hp, kn, 0.55), 4.2, k.shorts);
      limb(mix(kn, ft, 0.3), ft, 3, k.socks);
      stroke([[ft[0] - 1.2, ft[1] + 0.3], [ft[0] + 1.2, ft[1] + 0.3]], 2.8, PENCIL, 0.95, 0.2);
    }
    const tp = [[-4.4, -13], [4.4, -13], [3.8, 0.5], [-3.8, 0.5]];
    shape({ poly: tp }, shirt, { gap: 1.2 });
    if (k.stripe && !o.bare) for (const x of [-1.8, 1.8]) stroke([[x, -12.6], [x, 0]], 1.4, k.stripe, 0.9, 0.2);
    shade([[0.6, -13], [4.4, -13], [3.8, 0.5], [0.6, 0.5]]);
    for (const [sh, e, h] of arms) {
      limb(sh, e, 2.5, k.skin); if (!o.bare) limb(sh, mix(sh, e, 0.5), 3.5, shirt);
      limb(e, h, 2.3, k.skin);
    }
    if (o.prop === "gloves") for (const [, , h] of arms) blob(h[0], h[1], 2.6, "#c8102e");
    if (o.prop === "carry") ball(arms[1][2][0] - 1, arms[1][2][1] - 2, 3, 99);
    if (back) {
      blob(head[0], head[1], 4.6, k.hair);
      if (o.number !== false) say(String(o.number || 7), 0, -7.5, 6 * Z, k.stripe || (k.shirt === "#f4f4f4" ? PENCIL : "#ffffff"), 1, 0);
    } else {
      blob(head[0], head[1], 4.6, k.skin);
      stroke(Array.from({ length: 7 }, (_, i) => { const a = rad(195 + i * 25); return [head[0] + Math.cos(a) * 4.1, head[1] + Math.sin(a) * 4.1]; }), 2.6, k.hair, 0.95, 0.3);
      c.fillStyle = PENCIL;
      if (o.ko) for (const x of [-1.7, 1.7]) { stroke([[x - 0.8, head[1] - 0.6], [x + 0.8, head[1] + 1]], 0.5, PENCIL, 1, 0.05); stroke([[x - 0.8, head[1] + 1], [x + 0.8, head[1] - 0.6]], 0.5, PENCIL, 1, 0.05); }
      else if (o.cry) for (const x of [-1.6, 1.6]) stroke([[x - 0.9, head[1] - 0.2], [x, head[1] + 0.5], [x + 0.9, head[1] - 0.2]], 0.5, PENCIL, 1, 0.05);
      else for (const x of [-1.6, 1.6]) { c.beginPath(); c.arc(head[0] + x, head[1] + 0.2, 0.55, 0, 6.283); c.fill(); }
      if (o.cry) {
        // wailing: a wide-open mouth and two fountains of tears
        c.fillStyle = "#5a1f24"; c.beginPath(); c.ellipse(0, head[1] + 2.5, 1.6, 1.2 + Math.abs(Math.sin(o.cry * 9)) * 0.5, 0, 0, 6.283); c.fill();
        for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
          const ph = (o.cry * 1.6 + i / 4) % 1;
          c.globalAlpha = 0.9; c.fillStyle = "#5fb4ea"; c.beginPath(); c.arc(side * (2 + ph * 9), head[1] + 0.5 - Math.sin(ph * Math.PI) * 4 + ph * ph * 6, 0.75, 0, 6.283); c.fill(); c.globalAlpha = 1;
        }
      } else if (o.mouth) stroke([[-1.2, head[1] + 2.6], [0, head[1] + 2], [1.2, head[1] + 2.6]], 0.6);
      if (o.scarf) { stroke([[-3.6, -12.8], [3.6, -12.8]], 2.2, o.scarf, 0.95, 0.15); stroke([[2.4, -12.4], [3.2, -6]], 2, o.scarf, 0.95, 0.15); }
    }
    c.restore();
  }

  // o: { x, y (hip), f (facing 1|-1), s (scale), view, kit, pose, rot, bare, swing, tears, mouth, prop }
  function figure(o) {
    if (o.view) return figureFacing(o);
    const f = o.f || 1, k = o.kit, pose = o.pose, shirt = o.bare ? k.skin : k.shirt;
    c.save(); c.translate(o.x, o.y); c.rotate(rad(o.rot || 0) * f); c.scale(o.s || 1, o.s || 1);
    const hip = [0, 0];
    const neck = [Math.sin(rad(pose.lean)) * f * 13, -Math.cos(rad(pose.lean)) * 13];
    const hd = pose.lean + (pose.nod || 0);
    const head = add(neck, [Math.sin(rad(hd)) * f, -Math.cos(rad(hd))], 5.5);
    const leg = (t, sh) => { const kn = add(hip, vec(t, f), 9); return [kn, add(kn, vec(sh, f), 9)]; };
    const arm = (u, fo) => { const e = add(neck, vec(u, f), 7); return [e, add(e, vec(fo, f), 6.5)]; };
    const drawLeg = ([kn, ft]) => {
      limb(hip, kn, 2.8, k.skin); limb(hip, mix(hip, kn, 0.55), 4.4, k.shorts);
      limb(mix(kn, ft, 0.3), ft, 3, k.socks);
      stroke([ft, [ft[0] + 2.6 * f, ft[1] + 0.4]], 2.8, PENCIL, 0.95, 0.25);
    };
    const drawArm = ([e, h]) => {
      limb(neck, e, 2.5, k.skin); if (!o.bare) limb(neck, mix(neck, e, 0.5), 3.5, shirt);
      limb(e, h, 2.3, k.skin);
    };
    const back = { leg: leg(pose.tB, pose.sB), arm: arm(pose.uB, pose.fB) };
    const front = { leg: leg(pose.tF, pose.sF), arm: arm(pose.uF, pose.fF) };
    if (!o.rot) {
      const fy = Math.max(back.leg[1][1], front.leg[1][1], 0) + 1.2;
      c.globalAlpha = 0.3; c.fillStyle = "#16310f"; c.beginPath(); c.ellipse(3.5, fy, 9.5, 2.2, 0.05, 0, 6.283); c.fill(); c.globalAlpha = 1;
    }
    drawArm(back.arm);
    if (pose.cross) drawLeg(front.leg);
    drawLeg(back.leg);
    // torso
    const d = [neck[0] / 13, neck[1] / 13], n = [-d[1], d[0]];
    const tp = [add(neck, n, 3.8), add(neck, n, -3.8), add(hip, n, -3.4), add(hip, n, 3.4)];
    shape({ poly: tp }, shirt, { gap: 1.2 });
    if (k.stripe && !o.bare) for (const off of [-1.8, 1.8]) stroke([add(neck, n, off), add(hip, n, off)], 1.4, k.stripe, 0.9, 0.2);
    shade(n[0] >= 0 ? [neck, tp[0], tp[3], hip] : [neck, tp[1], tp[2], hip]);
    if (!pose.cross) drawLeg(front.leg);
    drawArm(front.arm);
    // head
    blob(head[0], head[1] - 0.6, 4.6, k.skin);
    stroke(Array.from({ length: 7 }, (_, i) => { const a = rad(f > 0 ? 150 + i * 30 : 30 - i * 30); return [head[0] + Math.cos(a) * 4.1, head[1] - 0.6 + Math.sin(a) * 4.1]; }), 2.6, k.hair, 0.95, 0.3);
    c.fillStyle = PENCIL; c.beginPath(); c.arc(head[0] + 2.2 * f, head[1] - 1, 0.6, 0, 6.283); c.fill();
    if (o.mouth) stroke([[head[0] + 0.6 * f, head[1] + 2.2], [head[0] + 1.6 * f, head[1] + 1.6], [head[0] + 2.6 * f, head[1] + 2.2]], 0.6);
    if (o.tears) for (let i = 0; i < 3; i++) {
      const ph = (o.tears + i / 3) % 1;
      blob(head[0] + 2.2 * f + ph * 2 * f, head[1] + 1 + ph * 14, 0.9, "#4aa3df");
    }
    if (o.swing) { // shirt whirled overhead
      const h = front.arm[1];
      shape({ poly: circlePts(0, 0, 1, 10).map(([x, y]) => { const a = o.swing; return [h[0] + x * 5 * Math.cos(a) - y * 2.4 * Math.sin(a), h[1] - 2 + x * 5 * Math.sin(a) + y * 2.4 * Math.cos(a)]; }) }, k.shirt, { gap: 1 });
    }
    if (o.prop === "whistle") blob(head[0] + 4 * f, head[1] + 1.5, 0.9, "#cfcfcf");
    if (o.prop === "gloves") for (const h of [back.arm[1], front.arm[1]]) blob(h[0], h[1], 2.6, "#c8102e");
    if (o.prop === "suitcase") { const h = front.arm[1]; rectC(h[0] - 3.5, h[1] + 0.5, 7, 6, "#7a4f2a", 0.95); }
    if (o.prop === "mic") { const h = front.arm[1]; stroke([h, [h[0] + 1.5 * f, h[1] - 4]], 1.2); blob(h[0] + 1.8 * f, h[1] - 5, 1.3, "#333333"); }
    if (o.prop === "drink") { const h = front.arm[1]; rectC(h[0] - 1.2, h[1] - 4, 2.6, 4, "#f28c28", 0.95); stroke([[h[0], h[1] - 4], [h[0] + 1.5 * f, h[1] - 7]], 0.6); }
    if (o.shades) stroke([[head[0] + 0.4 * f, head[1] - 1], [head[0] + 3.6 * f, head[1] - 1]], 1.6, "#111111", 1, 0.1);
    if (o.prop === "flag") {
      const h = front.arm[1];
      stroke([h, [h[0], h[1] - 18]], 0.9);
      const wv = Math.sin(Date.now() / 120) * 1.5;
      shape({ poly: [[h[0], h[1] - 18], [h[0] + 5.5, h[1] - 19 + wv], [h[0] + 11, h[1] - 18], [h[0] + 11, h[1] - 11], [h[0] + 5.5, h[1] - 12 + wv], [h[0], h[1] - 11]] }, "#ffffff", { gap: 1.2 });
    }
    c.restore();
  }
  // Draw a list of figures back to front.
  // People further up the pitch are further away, so they're drawn smaller. A scene can switch
  // this off (persp: false) or a figure can keep its own size (fixed: true).
  let PERSP = true;
  const persp = (fy) => Math.max(0.62, Math.min(1.3, lerp(0.8, 1.25, (fy - GL) / 70)));
  const crowd = (list) => {
    for (const o of list) {
      if (!PERSP || o.fixed) continue;
      const s0 = o.s || 1, fy = o.y + 18 * s0, s1 = persp(fy) * (o.size || 1);
      o.y = fy - (fy - o.y) * (s1 / s0); o.s = s1;
    }
    list.sort((a, b) => a.y + (a.s || 1) * 18 - (b.y + (b.s || 1) * 18)).forEach(figure);
  };

  // A shaded football. `gy` is the ground directly beneath it: the shadow sits there, and the
  // gap between ball and shadow is what tells you how high it is and how far away.
  function ball(x, y, r = 3.2, gy = null) {
    const g = gy == null ? y + r * 0.85 : gy;
    const h = Math.max(0, g - y - r * 0.85), sc = 1 / (1 + h / 22);
    c.globalAlpha = 0.12 + 0.3 * sc; c.fillStyle = "#16310f";
    c.beginPath(); c.ellipse(x + r * 0.35 + h * 0.12, g, r * 1.15 * sc + 0.3, r * 0.38 * sc + 0.15, 0, 0, 6.283); c.fill();
    c.globalAlpha = 1;
    const grd = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    grd.addColorStop(0, "#ffffff"); grd.addColorStop(0.65, "#efede6"); grd.addColorStop(1, "#a9a69d");
    c.fillStyle = grd; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    // panels: a black pentagon in the middle and five more round the edge, turning as it travels
    c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.clip();
    const spin = (x * 0.9 + y * 0.6) / Math.max(1, r);
    const pent = (cx, cy, pr, a0) => { c.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + i * 1.2566; c.lineTo(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr); } c.closePath(); c.fill(); };
    c.fillStyle = "#1f1f24";
    const ox = Math.cos(spin) * r * 0.18, oy = Math.sin(spin) * r * 0.12;
    pent(x + ox, y + oy, r * 0.36, spin);
    c.strokeStyle = "#6b6a66"; c.lineWidth = Math.max(0.2, r * 0.07);
    for (let i = 0; i < 5; i++) {
      const a = spin + i * 1.2566 + 0.628, px = x + ox + Math.cos(a) * r * 0.95, py = y + oy + Math.sin(a) * r * 0.95;
      pent(px, py, r * 0.3, a + 0.628);
      c.beginPath(); c.moveTo(x + ox + Math.cos(a - 0.628) * r * 0.36, y + oy + Math.sin(a - 0.628) * r * 0.36);
      c.lineTo(x + ox + Math.cos(a - 0.628) * r * 0.75, y + oy + Math.sin(a - 0.628) * r * 0.75); c.stroke();
    }
    c.restore();
    c.lineWidth = Math.max(0.5, r * 0.18); c.strokeStyle = PENCIL; c.beginPath(); c.arc(x + J(0.1), y + J(0.1), r, 0, 6.283); c.stroke();
  }

  // ---------- places ----------
  const fans = Array.from({ length: 70 }, (_, i) => [rnd(0, W), rnd(22, 50), pick(["#d7263d", "#8fc9ea", "#f2c230", "#f4f4f4", "#1f3fa0", "#2e8b57"])]);
  function pitch() {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    rectC(-2, 16, W + 4, 38, "#a6adbd", 0.35, false);
    for (const [x, y, col] of fans) { c.globalAlpha = 0.7; c.fillStyle = col; c.beginPath(); c.arc(x + J(0.3), y + J(0.3), 2.2, 0, 6.283); c.fill(); }
    c.globalAlpha = 1;
    rectC(-2, 50, W + 4, 6, "#ffffff", 0.6);
    crayon(() => c.rect(0, 56, W, H - 56), GRASS, [0, 56, W, H], 0.55, 2.2);
    stroke([[0, GL], [W, GL]], 1.2, LINE, 0.9);
    stroke([[96, GL], [88, 112], [232, 112], [224, GL]], 1.1, LINE, 0.9);
    stroke([[60, GL], [34, 140], [286, 140], [260, GL]], 1.1, LINE, 0.9);
  }
  // The goal seen from the pitch: a front frame, and a smaller back frame behind it so the
  // net has depth. Balls that are in the net are drawn by `inside`, behind the mesh.
  const BX0 = GX0 + 11, BX1 = GX1 - 11, BT = GB + 9, BG = GL - 10;
  function goal(bulge, shake = 0, inside = null) {
    const disp = (x, y) => {
      if (!bulge || bulge.k <= 0) return [x, y];
      const dx = bulge.x - x, dy = bulge.y - y, m = bulge.k * Math.max(0, 1 - Math.hypot(dx, dy) / 24);
      return [x - dx * m * 0.25, y - dy * m * 0.25 - m * 3];
    };
    // floor of the goal, behind the line
    shape({ poly: [[GX0, GL], [GX1, GL], [BX1, BG], [BX0, BG]] }, "#4f8a47", { outline: false, gap: 2 });
    inside?.();
    const net = "#7d828c";
    for (let x = BX0; x <= BX1; x += 5.5) stroke(Array.from({ length: 6 }, (_, i) => disp(x, BT + i * ((BG - BT) / 5))), 0.5, net, 0.55, 0.15);
    for (let y = BT; y <= BG; y += 5.5) stroke(Array.from({ length: 10 }, (_, i) => disp(BX0 + i * ((BX1 - BX0) / 9), y)), 0.5, net, 0.55, 0.15);
    for (let i = 0; i <= 4; i++) {          // side nets and roof
      const k = i / 4;
      stroke([[GX0, lerp(GB, GL, k)], [BX0, lerp(BT, BG, k)]], 0.5, net, 0.5, 0.15);
      stroke([[GX1, lerp(GB, GL, k)], [BX1, lerp(BT, BG, k)]], 0.5, net, 0.5, 0.15);
      stroke([[lerp(GX0, GX1, k), GB], [lerp(BX0, BX1, k), BT]], 0.5, net, 0.5, 0.15);
    }
    stroke([[BX0, BG], [BX0, BT], [BX1, BT], [BX1, BG]], 1, "#d9d9d9", 0.9, 0.2);
    stroke([[GX0, GB], [BX0, BT]], 0.9, "#d9d9d9", 0.9, 0.2); stroke([[GX1, GB], [BX1, BT]], 0.9, "#d9d9d9", 0.9, 0.2);
    const b = GB + Math.sin(Date.now() / 18) * shake;
    c.globalAlpha = 0.22; c.strokeStyle = "#16310f"; c.lineWidth = 2.6; c.beginPath();      // frame shadow on the grass
    c.moveTo(GX0, GL); c.lineTo(GX0 + 16, GL + 7); c.lineTo(GX1 + 16, GL + 7); c.lineTo(GX1, GL); c.stroke(); c.globalAlpha = 1;
    stroke([[GX0, GL], [GX0, b], [GX1, b], [GX1, GL]], 3.4, PENCIL, 0.9);
    stroke([[GX0, GL], [GX0, b], [GX1, b], [GX1, GL]], 1.9, "#ffffff", 1, 0.2);
  }
  // A ball that has hit the back of the net and drops to the floor of the goal.
  const netBall = (x, y, since) => ball(x, Math.min(BG - 2, y + Math.max(0, since) * 45), 2.1, BG);
  function spark(x, y, k) {
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < 6; i++) { const a = rad(i * 60 + 20); stroke([[x + Math.cos(a) * 4, y + Math.sin(a) * 4], [x + Math.cos(a) * (6 + k * 6), y + Math.sin(a) * (6 + k * 6)]], 0.9, "#c8102e", 0.9, 0.2); }
  }
  function rain() {
    c.beginPath();
    for (let i = 0; i < 60; i++) { const x = rnd(-20, W), y = rnd(-10, H); c.moveTo(x, y); c.lineTo(x - 3, y + 9); }
    c.strokeStyle = "#5b7fa6"; c.globalAlpha = 0.45; c.lineWidth = 0.7; c.stroke(); c.globalAlpha = 1;
  }
  // A ball's path from a to b over [t0,t1], with a lift and a shrink as it heads away.
  // gb is the ground under the target (e.g. the goal floor for a ball hitting the back of the net).
  function flight(t, t0, t1, a, b, lift = 18, r0 = 3.2, r1 = 2.3, bend = 0, gb = null) {
    const k = seg(t, t0, t1);
    const x = lerp(a[0], b[0], k) + Math.sin(k * Math.PI) * bend, y = lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * lift;
    const gy = lerp(a[1] + r0 * 0.85, gb == null ? b[1] + r1 * 0.85 : gb, k);
    return { x, y, r: lerp(r0, r1, k), k, gy };
  }
  const keeperAt = (st, t, t0, dir) => {
    const k = seg(t, t0, t0 + 0.45);
    return { x: 160 + dir * 30 * ease(k), y: GL - 1 - 18 * 0.8 - Math.sin(k * Math.PI) * 7 + k * 6, s: 0.8, f: dir, view: "front", kit: st.K,
      pose: k > 0 ? { ...P.dive(), uB: 175, fB: 178 } : { ...P.stand(), uF: 35, fF: 40, uB: 35, fB: 40, tF: 0, tB: 0 }, rot: 75 * ease(k) };
  };

  // Someone flat out on the grass, seen from above and in front: arms flung wide, head to one side.
  function lying(o) {
    const sc = o.s || persp(o.y) * 0.9, d = o.dir || 1;
    c.globalAlpha = 0.28; c.fillStyle = "#16310f"; c.beginPath(); c.ellipse(o.x + d * 2 * sc, o.y + 3.5 * sc, 16 * sc, 3 * sc, 0, 0, 6.283); c.fill(); c.globalAlpha = 1;
    figureFacing({ x: o.x - d * 6 * sc, y: o.y, s: sc, rot: 90 * d, view: "front", kit: o.kit, ko: o.ko !== false,
      pose: { ...P.stand(), uF: 115 + (o.wave || 0), fF: 125 + (o.wave || 0), uB: 120, fB: 110, tF: 0, tB: 0 } });
  }
  // A cartoon soul leaving the body.
  function ghost(x, y, k) {
    if (k <= 0 || k >= 1) return;
    const gy = y - k * 34, gx = x + Math.sin(k * 9) * 3, a = k < 0.15 ? k / 0.15 : (1 - k) / 0.85;
    c.save(); c.globalAlpha = 0.85 * a; c.translate(gx, gy); c.scale(1.3, 1.3);
    c.beginPath(); c.arc(0, 0, 4, Math.PI, 0); c.lineTo(4, 7);
    for (let i = 0; i < 4; i++) c.quadraticCurveTo(3 - i * 2 - 0.5, 9 - (i % 2) * 2, 2 - i * 2, 7);
    c.closePath(); c.fillStyle = "#ffffff"; c.fill(); c.lineWidth = 0.6; c.strokeStyle = PENCIL; c.stroke();
    c.fillStyle = PENCIL; for (const ex of [-1.4, 1.4]) { c.beginPath(); c.ellipse(ex, 0.5, 0.6, 0.9, 0, 0, 6.283); c.fill(); }
    c.restore();
  }
  // A football shirt on its own, for pegs and hands.
  function tshirt(x, y, sc, kit, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rad(rot)); c.scale(sc, sc);
    shape({ poly: [[-5, -7], [-1.8, -7], [0, -5.6], [1.8, -7], [5, -7], [9, -3.5], [6.5, -1], [5, -2.5], [5, 7], [-5, 7], [-5, -2.5], [-6.5, -1], [-9, -3.5]] }, kit.shirt, { gap: 1.1 });
    if (kit.stripe) for (const sx of [-2, 2]) stroke([[sx, -6.5], [sx, 6.5]], 1.4, kit.stripe, 0.9, 0.15);
    shade([[1, -7], [5, -7], [5, 7], [1, 7]], 0.12);
    c.restore();
  }
  // The team coach, side on, facing right. gy is the road under its wheels; door 0..1 is how open it is.
  function coach(x, gy, col, door = 0, trim = "#ffffff") {
    c.globalAlpha = 0.3; c.fillStyle = "#1d1f24"; c.beginPath(); c.ellipse(x + 52, gy + 1, 56, 3.5, 0, 0, 6.283); c.fill(); c.globalAlpha = 1;
    shape({ poly: [[x, gy - 6], [x, gy - 40], [x + 94, gy - 40], [x + 102, gy - 33], [x + 104, gy - 6]] }, col, { gap: 1.4 });
    rectC(x + 1, gy - 15, 102, 5, trim, 0.9, false);
    for (let i = 0; i < 6; i++) rectC(x + 5 + i * 12.5, gy - 35, 10, 10, "#cfe3f2", 0.75);
    shape({ poly: [[x + 94, gy - 37], [x + 101, gy - 31], [x + 101, gy - 22], [x + 94, gy - 22]] }, "#cfe3f2", { gap: 1 });
    // door: a dark gap that the panel slides back across
    rectC(x + 80, gy - 35, 11, 28, door > 0 ? "#2c3038" : col, 0.9);
    if (door < 1) rectC(x + 80 + door * 11 * 0.8, gy - 35, 11 * (1 - door * 0.8), 28, "#cfe3f2", 0.5);
    label("TEAM COACH", x + 40, gy - 19.5, 5.5, "#ffffff");
    for (const wx of [x + 18, x + 82]) { blob(wx, gy - 4, 5.5, "#2b2b30"); blob(wx, gy - 4, 2.2, "#9aa0aa"); }
  }

  // ---------- scenes ----------
  const S = {};

  // Late winner: dribble past a slide tackle, top corner, then a shirt-swing or knee-slide celebration.
  S.lastgasp = {
    dur: 5.2,
    cam: (t, st) => track(t, [[0, 60, 140, 2.2], [1.6, 140, 135, 1.9], [2.2, 160, 95, 1.7], [2.6, 160 + st.side * 15, 88, 2.2], [3.4, 120, 140, 2.1], [5.2, 85, 145, 2.3]]),
    setup: (o) => ({ A: person(o.win), D: person(o.lose), K: person(pick(KEEPER)), side: pick([-1, 1]) }),
    draw(t, st, v) {
      pitch();
      const tx = 160 + st.side * 24, ty = 76, arrive = 2.4;
      goal(t > arrive ? { x: tx, y: ty, k: Math.max(0.3, 1.4 - (t - arrive) * 1.2) } : null, 0, t > arrive ? () => netBall(tx, ty, t - arrive - 0.15) : null);
      board(8, 6, "90+4'", 46);
      const run = ease(seg(t, 0, 1.6));
      let ax = lerp(30, 140, run), ay = lerp(150, 132, run), pose = P.run(t * 13), f = 1, extra = {};
      if (t >= 1.6 && t < 2.1) pose = P.kick(seg(t, 1.6, 1.9));
      if (t >= 2.5) {
        const k = t - 2.5;
        if (v === "swing") { ax = 140 - k * 34; ay = 132 + k * 6; f = -1; pose = { ...P.run(t * 13), uF: 175, fF: 175 }; extra = { bare: true, swing: t * 9 }; }
        else { ax = 140 - 55 * (1 - Math.exp(-k * 2.2)); ay = 132 + (hipH.stand - hipH.kneel) * 1.1; f = -1; pose = { ...P.kneel("up"), lean: -25 }; }
        say(v === "swing" ? "GOOOAL!" : "GOAL!", 160, 34, 24, "#c8102e", seg(t, 2.45, 2.8));
      }
      const dk = seg(t, 0.9, 1.7);
      const D = { x: lerp(270, 160, ease(dk)), y: dk > 0 ? 150 : 136, s: 1.1, f: -1, kit: st.D, pose: dk > 0 ? P.slide() : P.run(t * 12) };
      const A = { x: ax, y: ay, s: 1.1, f, kit: st.A, pose, ...extra };
      crowd([keeperAt(st, t, 1.95, -st.side), D, A]);
      const foot = [A.x + 9 * A.s, A.y + 19 * A.s];
      if (t < 1.9) ball(...foot, 3.2);
      else if (t < arrive) { const b = flight(t, 1.9, arrive, foot, [tx, ty], 22, 3.2, 2.1, 0, BG); ball(b.x, b.y, b.r, b.gy); }
    },
  };

  // Goal then the fans flood on.
  S.invasion = {
    dur: 5,
    cam: (t) => track(t, [[0, 160, 125, 2.2], [1.2, 160, 125, 2], [3, 160, 120, 1.35]]),
    setup: (o) => ({
      A: person(o.win), K: person(pick(KEEPER)), bx: rnd(BX0 + 6, BX1 - 6),
      fans: Array.from({ length: 16 }, (_, i) => {
        const fromSide = Math.random() < 0.4, sx = fromSide ? pick([-20, 340]) : rnd(0, W);
        return { sx, sy: fromSide ? rnd(110, 170) : 200, tx: rnd(90, 230), ty: rnd(118, 160), d: 0.5 + i * 0.12, side: fromSide,
          kit: person({ shirt: Math.random() < 0.6 ? o.win.shirt : pick(KITS).shirt, stripe: Math.random() < 0.3 ? o.win.stripe : null, shorts: "#3d5a99", socks: "#3d5a99" }) };
      }),
    }),
    draw(t, st) {
      pitch();
      goal({ x: st.bx, y: 78, k: Math.max(0.2, 1 - t) }, 0, () => netBall(st.bx, 78, t));
      const figs = [{ x: 160, y: GL - 2, s: 0.8, f: 1, kit: st.K, pose: P.sit() }];
      figs.push({ x: 160, y: 132 - Math.abs(Math.sin(t * 6)) * 4, s: 1.1, view: "front", kit: st.A, pose: P.up(P.stand()) });
      for (const fan of st.fans) {
        const k = seg(t, fan.d, fan.d + 2), there = k >= 1;
        figs.push({ x: lerp(fan.sx, fan.tx, ease(k)), y: lerp(fan.sy, fan.ty, ease(k)) - (there ? Math.abs(Math.sin(t * 8 + fan.d * 9)) * 3 : 0),
          f: fan.tx > fan.sx ? 1 : -1, view: there ? "front" : fan.side ? null : "back", number: false, kit: fan.kit,
          pose: there ? P.up(P.stand()) : P.run(t * 14 + fan.d * 5) });
      }
      crowd(figs);
      say("SCENES!", 160, 30, 22, "#c8102e", seg(t, 1.2, 1.6));
    },
  };

  // Pinball goal: off a defender, off the post, trickles over the line.
  S.scrappy = {
    dur: 5,
    cam: (t) => track(t, [[0, 120, 140, 2], [0.9, 160, 110, 1.6], [1.5, 180, 92, 2.2], [2.6, 175, 98, 2.1], [4, 150, 115, 1.6]]),
    setup: (o) => ({ A: person(o.win), D: person(o.lose), K: person(pick(KEEPER)) }),
    draw(t, st, v) {
      pitch();
      // One shot: it clips the inside of the post and carries on into the net.
      const over = 1.6, touch = 1.35;
      let b;
      if (t < 0.8) b = { x: 122, y: 159, r: 3.2 };
      else if (t < touch) b = flight(t, 0.8, touch, [122, 159], [GX1 - 4, 77], 10, 3.2, 2.4, 0, GL);
      else if (t < over) { b = flight(t, touch, over, [GX1 - 4, 77], [BX1 - 5, 75], 0, 2.4, 2.1, 0, BG); b.gy = lerp(GL, BG, b.k); }
      const inNet = t >= touch;
      goal(t > over ? { x: BX1 - 5, y: 75, k: Math.max(0.2, 1.2 - (t - over)) } : null, t > touch && t < touch + 0.3 ? 0.4 : 0,
        inNet ? () => (t < over ? ball(b.x, b.y, b.r, b.gy) : netBall(BX1 - 5, 75, t - over)) : null);
      const ap = t < 0.5 ? P.run(t * 12) : t < 0.9 ? P.kick(seg(t, 0.5, 0.8)) : t > over + 0.2 ? { ...P.stand(), uF: 150, fF: 150 + Math.sin(t * 12) * 20 } : P.stand();
      const kick = v === "kick" && t > over + 0.3;
      crowd([
        kick ? { x: 136, y: 104, f: -1, kit: st.D, pose: { ...P.stand(), tF: -60, sF: -150 + Math.sin(t * 10) * 20, uF: -30, fF: 0 } }
          : { x: 136, y: 104, view: "front", kit: st.D, pose: P.stand() },
        keeperAt(st, t, 0.95, 1),
        { x: 110 + seg(t, 0, 0.5) * 10, y: 140, view: "back", kit: st.A, pose: ap },
      ]);
      if (!inNet) ball(b.x, b.y, b.r, b.gy);
      say("doink", GX1 + 14, 70, 10, PENCIL, seg(t, touch, touch + 0.15), 8);
      say("GOAL!", 160, 32, 22, "#c8102e", seg(t, over, over + 0.3));
    },
  };

  // Free kick over the wall into the top corner. Variants: stamp, reps, rocket.
  S.topbins = {
    dur: 5,
    cam: (t, st, v) => v === "reps" ? [160, 110, 1.45] : track(t, [[0, 160, 145, 2.1], [1, 160, 115, 1.6], [1.7, 160 + st.side * 25, 78, 2.4], [2.6, 160, 110, 1.6]]),
    setup: (o) => ({ A: person(o.win), wall: [0, 1, 2, 3].map(() => person(o.lose)), K: person(pick(KEEPER)), side: pick([-1, 1]) }),
    draw(t, st, v) {
      pitch();
      const fast = v === "rocket", kickAt = 1.0, fly = fast ? 0.28 : 0.7, arrive = kickAt + fly;
      const shots = v === "reps" ? [[st.side, arrive], [-st.side, arrive + 1.1], [st.side * 0.1, arrive + 2.0]] : [[st.side, arrive]];
      const tgt = (sd) => [160 + sd * 25, 75];
      const inNet = shots.filter(([, a]) => t > a), last = inNet[inNet.length - 1];
      goal(last ? { x: tgt(last[0])[0], y: 75, k: Math.max(0.25, (fast ? 1.9 : 1.3) - (t - last[1]) * 1.3) } : null,
        fast && t > arrive && t < arrive + 0.5 ? 1.2 : 0,
        () => inNet.forEach(([sd, a]) => netBall(...tgt(sd), t - a - 0.15)));
      const figs = st.wall.map((kit, i) => {
        const j = Math.sin(seg(t, kickAt, kickAt + 0.45) * Math.PI) * 8;
        return { x: 137 + i * 15, y: 112 - j, view: "front", kit, pose: j > 0.5 ? P.up(P.stand()) : { ...P.stand(), uF: 12, fF: 8, uB: 12, fB: 8 } };
      });
      figs.push(keeperAt(st, t, kickAt + 0.1, -st.side));
      const celebrate = t > arrive + 0.2 && v !== "reps";
      const ap = t < 0.6 ? P.stand() : t < kickAt ? P.run(t * 12) : t < kickAt + 0.3 ? P.kick(seg(t, kickAt - 0.1, kickAt + 0.15)) : celebrate ? { ...P.run(t * 11), uF: 90, fF: 90, uB: -90, fB: -90 } : P.stand();
      const ax = celebrate ? 160 - st.side * (t - arrive - 0.2) * 32 : 160;
      const A = celebrate ? { x: ax, y: 142, f: -st.side, kit: st.A, pose: ap } : { x: ax, y: 142 + seg(t, 0.6, kickAt) * -4, view: "back", kit: st.A, pose: ap };
      figs.push(A);
      crowd(figs);
      for (const [sd, a] of shots) {
        const k0 = a - fly;
        if (t < k0) { if (sd === shots[0][0] || t > k0 - 0.4) ball(166, 162, 3.2); continue; }
        if (t < a) {
          const b = flight(t, k0, a, [166, 162], tgt(sd), fast ? 10 : 40, 3.2, 2.1, fast ? 0 : -sd * 30, BG);
          if (fast) for (let i = 1; i < 4; i++) stroke([[b.x, b.y + i * 4], [b.x + J(2), b.y + i * 4 + 8]], 0.7, PENCIL, 0.5);
          ball(b.x, b.y, b.r, b.gy);
        }
      }
      if (v === "stamp" && t > arrive + 0.2) {
        const x = st.side > 0 ? GX1 - 9 : GX0 + 9, y = GB + 7, k = pop(seg(t, arrive + 0.2, arrive + 0.6));
        c.save(); c.translate(x, y); c.scale(k, k); c.setLineDash([1.5, 1.5]);
        stroke([[-10, -8], [10, -8], [10, 8], [-10, 8], [-10, -8]], 1, "#c8102e", 0.9, 0.2); c.restore(); c.setLineDash([]);
      }
      say(fast ? "BANG!" : v === "reps" ? `${inNet.length} FROM ${shots.length}` : "TOP BINS!", 160, 32, 22, "#c8102e", seg(t, arrive, arrive + 0.3));
    },
  };

  // Goal after goal. Variant "flag": the keeper waves a white flag.
  S.rout = {
    dur: 5.5,
    cam: (t) => track(t, [[0, 160, 115, 1.4], [3.5, 160, 100, 1.6], [5.5, 160, 95, 2.2]]),
    setup: (o) => ({ team: [0, 1, 2].map(() => person(o.win)), K: person(pick(KEEPER)), shots: Array.from({ length: 7 }, (_, i) => ({ at: 0.4 + i * 0.55, from: [rnd(90, 230), rnd(150, 170)], to: [rnd(BX0 + 4, BX1 - 4), rnd(BT + 4, BG - 6)] })) }),
    draw(t, st, v) {
      pitch();
      const done = st.shots.filter((s) => t > s.at + 0.35), lastS = done[done.length - 1];
      goal(lastS ? { x: lastS.to[0], y: lastS.to[1], k: Math.max(0.2, 1 - (t - lastS.at - 0.35) * 2) } : null, 0,
        () => done.forEach((s) => netBall(s.to[0], s.to[1], t - s.at - 0.5)));
      board(8, 6, `GOALS ${done.length}`, 64);
      const flop = done.length >= 3;
      const figs = [flop ? { x: 160, y: GL - 3, s: 0.8, f: 1, kit: st.K, pose: v === "flag" ? { ...P.sit(), uF: 160, fF: 170 } : P.sit(), prop: v === "flag" ? "flag" : null }
        : { x: 160, y: GL - 1 - 18 * 0.8, s: 0.8, view: "front", kit: st.K, pose: P.stand() }];
      st.team.forEach((kit, i) => figs.push({ x: 90 + i * 70, y: 138 - Math.abs(Math.sin(t * 7 + i)) * 3, view: "front", kit, pose: P.up(P.stand()) }));
      crowd(figs);
      for (const s of st.shots) if (t > s.at && t < s.at + 0.35) { const b = flight(t, s.at, s.at + 0.35, s.from, s.to, 14, 3.2, 2.1, 0, BG); ball(b.x, b.y, b.r, b.gy); }
      if (v === "flag") say("WE SURRENDER", 160, 32, 16, PENCIL, seg(t, 3, 3.3));
    },
  };

  // In the stands: a crying kid in the losers' scarf.
  S.crying = {
    dur: 5,
    persp: false,
    cam: (t) => track(t, [[0, 160, 90, 1.15], [1.4, 160, 92, 1.2], [2.4, 150, 118, 1.7], [5, 150, 118, 1.8]]),
    setup: (o) => ({ kid: person(o.lose), dad: person({ ...o.lose, shirt: "#4b5563", stripe: null, shorts: "#2f3a4a", socks: "#2f3a4a" }), col: o.lose.shirt, info: o.info,
      seats: Array.from({ length: 4 }, (_, r) => Array.from({ length: 11 }, (_, i) => Math.random() < 0.18 ? person(pick([o.lose, o.win])) : null)) }),
    draw(t, st) {
      // Rows of mostly empty seats under a scoreboard that says it all.
      c.fillStyle = "#d8d4ca"; c.fillRect(0, 0, W, H);
      rectC(90, 14, 140, 40, "#26262c", 0.95);
      label(`${st.info.w}  ${st.info.ws}`, 160, 26, 11, "#f5c244"); label(`${st.info.l}  ${st.info.ls}`, 160, 40, 11, "#f5c244");
      label("FULL TIME", 160, 50, 5, "#ffffff");
      st.seats.forEach((row, r) => {
        const y = 66 + r * 26;
        row.forEach((fan, i) => {
          const x = 12 + i * 29 + (r % 2) * 10;
          shape({ poly: [[x - 9, y + 2], [x + 9, y + 2], [x + 9, y + 14], [x - 9, y + 14]] }, st.col, { gap: 1.6, alpha: 0.8 });
          if (fan) figureFacing({ x, y: y + 8, s: 0.75, view: "front", kit: fan, pose: { ...P.stand(), uF: 20, fF: 60, uB: 20, fB: 60 } });
        });
        rectC(-2, y + 14, W + 4, 7, "#9aa3b5", 0.9, false);
      });
      // Dad, scarf on, hand over his face; his lad beside him, inconsolable.
      const sob = Math.abs(Math.sin(t * 6)) * 1.5;
      figureFacing({ x: 120, y: 132, s: 2.1, view: "front", kit: st.dad, scarf: st.col,
        pose: { ...P.stand(), uB: 150, fB: 268, uF: t > 2.6 ? 100 : 15, fF: t > 2.6 ? 60 + Math.sin(t * 7) * 8 : 25 } });
      figureFacing({ x: 158, y: 146 - sob, s: 1.45, view: "front", kit: st.kid, cry: t > 0.8 ? t : 0, mouth: true, pose: { ...P.stand(), uF: 25 + sob * 6, fF: 20, uB: 25 + sob * 6, fB: 20 } });
      say("WAAAAAH", 205, 92, 16, "#1f3fa0", seg(t, 0.8, 1.1), 10);
    },
  };

  // Rondo: winners pass it round while a loser chases.
  S.ole = {
    dur: 5.6,
    cam: (t) => track(t, [[0, 160, 125, 1.9], [5.6, 160, 125, 1.6]]),
    setup: (o) => ({ ring: [0, 1, 2, 3, 4].map(() => person(o.win)), mid: person(o.lose) }),
    draw(t, st) {
      pitch();
      goal(null);
      const pos = st.ring.map((_, i) => [160 + Math.cos(rad(i * 72 + 90)) * 78, 140 + Math.sin(rad(i * 72 + 90)) * 22]);
      const step = 0.75, n = Math.floor(t / step), k = (t % step) / step;
      const from = pos[(n * 2) % 5], to = pos[(n * 2 + 2) % 5];
      const bx = lerp(from[0], to[0], ease(k)), by = lerp(from[1], to[1], ease(k)) - Math.sin(k * Math.PI) * 10;
      const chaseK = Math.min(1, k + 0.15);
      const cx = lerp(from[0], to[0], chaseK * 0.6) * 0.6 + 160 * 0.4, cy = 132;
      const figs = st.ring.map((kit, i) => ({ x: pos[i][0], y: pos[i][1] - 18, s: 1, f: pos[i][0] < 160 ? 1 : -1, kit,
        pose: i === (n * 2) % 5 && k < 0.25 ? P.kick(k * 4) : P.stand() }));
      figs.push({ x: cx, y: cy - 18, s: 1, f: to[0] > cx ? 1 : -1, kit: st.mid, pose: P.run(t * 14), nod: 10 });
      crowd(figs);
      ball(bx, by + 17, 3, lerp(from[1], to[1], ease(k)) + 19.5);
      for (let i = 1; i <= Math.min(n, 6); i++) say("OLÉ!", pos[(i * 2) % 5][0], pos[(i * 2) % 5][1] - 46, 13, "#c8102e", seg(t, i * step, i * step + 0.25), i % 2 ? -8 : 8);
    },
  };

  // The old teletext results page.
  S.ceefax = {
    dur: 5,
    setup: (o) => ({ info: o.info }),
    draw(t, st) {
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      rectC(14, 6, 292, 168, "#55555f", 0.8);
      c.fillStyle = "#050505"; c.fillRect(26, 16, 268, 140);
      const row = (txt, y, col, bg) => {
        if (bg) { c.fillStyle = bg; c.fillRect(30, y - 9, 260, 12); }
        c.font = 'bold 11px "Courier New", monospace'; c.fillStyle = col; c.textBaseline = "alphabetic"; c.fillText(txt, 34, y);
      };
      const mosaic = [[0, 0], [1, 0], [2, 1], [0, 1], [3, 0], [1, 2]];
      mosaic.forEach(([x, y]) => { c.fillStyle = "#e33"; c.fillRect(246 + x * 9, 22 + y * 6, 8, 5); });
      row("302  FOOTBALL", 30, "#ffffff");
      row(" FULL-TIME RESULT          ", 50, "#ffffff", "#1f3fd0");
      const i = st.info, line = `${i.w} ${i.ws} (${i.wsWord}) ${i.l} ${i.ls}`;
      const typed = line.slice(0, Math.floor(seg(t, 0.4, 2.2) * line.length));
      row(typed + (Math.floor(t * 3) % 2 ? "_" : " "), 78, "#ffe040");
      if (t > 2.6) row("Read it twice, it's not a typo", 104, "#40e0f0");
      if (t > 3.4) row("More reaction: page 303", 130, "#ffffff");
      stroke([[26, 16], [294, 16], [294, 156], [26, 156], [26, 16]], 1);
    },
  };

  // Loser blazes it over the bar.
  S.miss = {
    dur: 4.5,
    cam: (t) => track(t, [[0, 140, 140, 2.2], [0.9, 150, 120, 1.7], [1.6, 160, 80, 1.4], [2.6, 150, 125, 2]]),
    setup: (o) => ({ L: person(o.lose), K: person(pick(KEEPER)) }),
    draw(t, st) {
      pitch();
      goal(null);
      const lp = t < 0.6 ? P.run(t * 12) : t < 1.0 ? P.kick(seg(t, 0.6, 0.85)) : t > 1.6 ? P.head() : P.stand();
      crowd([
        { x: 160, y: GL - 1 - 18 * 0.8, s: 0.8, view: "front", kit: st.K, pose: t > 1 ? P.up(P.stand()) : { ...P.stand(), uF: 35, fF: 40, uB: 35, fB: 40 } },
        { x: 150, y: 150 - seg(t, 0, 0.6) * 10, view: "back", kit: st.L, pose: lp },
      ]);
      if (t < 0.85) ball(154, 156, 3.2);
      else if (t < 1.7) { const b = flight(t, 0.85, 1.7, [154, 156], [175, -10], 10, 3.2, 1.6, 0, 56); ball(b.x, b.y, b.r, b.gy); }
      say("ROW Z!", 210, 32, 20, "#c8102e", seg(t, 1.4, 1.7));
    },
  };

  // Off the post, back out towards us, and down to the knees.
  S.post = {
    dur: 4.5,
    cam: (t, st) => track(t, [[0, 150, 140, 2.2], [0.8, 150, 120, 1.7], [1.25, 160 + st.side * 42, 85, 2.4], [1.9, 150, 130, 2], [3, 150, 135, 2.5]]),
    setup: (o) => ({ L: person(o.lose), K: person(pick(KEEPER)), side: pick([-1, 1]) }),
    draw(t, st) {
      pitch();
      goal(null, t > 1.2 && t < 1.6 ? 0.8 : 0);
      const px = st.side > 0 ? GX1 : GX0;
      const down = t > 1.7;
      const lp = t < 0.5 ? P.run(t * 12) : t < 0.9 ? P.kick(seg(t, 0.5, 0.75)) : down ? P.kneel(t > 2.6 ? "head" : "up") : P.stand();
      crowd([
        keeperAt(st, t, 0.8, -st.side),
        { x: 150, y: down ? 148 - 1 - 9.5 * 1.1 : 148 - 18 * 1.1, s: 1.1, view: down ? "front" : "back", kit: st.L, pose: lp },
      ]);
      let b;
      if (t < 0.75) b = { x: 155, y: 150, r: 3.2 };
      else if (t < 1.2) b = flight(t, 0.75, 1.2, [155, 150], [px, 78], 10, 3.2, 2.3, 0, GL);
      else b = flight(t, 1.2, 2.2, [px, 78], [px + st.side * 110, 195], 25, 2.3, 4.2);
      ball(b.x, b.y, b.r, b.gy);
      spark(px, 78, seg(t, 1.2, 1.45));
      say("CLANG!", px + st.side * 20, 62, 16, PENCIL, seg(t, 1.2, 1.4), st.side * 8);
      say("NOOO!", 120, 32, 20, "#1f3fa0", seg(t, 1.9, 2.2));
    },
  };

  // The team bus leaves without them. Variant "airport": a plane takes off instead.
  S.walkhome = {
    dur: 6.5,
    persp: false,
    cam: (t, st, v) => v === "airport" ? track(t, [[0, 90, 112, 1.8], [2.2, 190, 100, 1.6], [5, 245, 70, 1.4]]) : track(t, [[0, 120, 130, 1.8], [2.2, 140, 130, 1.7], [3.4, 170, 125, 1.3], [6.5, 240, 130, 1.6]]),
    setup: (o) => ({ walkers: [0, 1, 2].map(() => person(o.lose)), col: o.lose.shirt, one: person(o.lose) }),
    draw(t, st, v) {
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      rectC(-2, -2, W + 4, 70, "#aab3c2", 0.35, false);
      crayon(() => c.rect(0, 120, W, 34), "#8a8f98", [0, 120, W, 154], 0.6);
      for (let x = 0; x < W; x += 24) stroke([[x + 4, 137], [x + 16, 137]], 1.2, "#ffffff");
      crayon(() => c.rect(0, 154, W, 26), GRASS, [0, 154, W, H], 0.5);
      if (v === "airport") {
        // runway behind the road
        crayon(() => c.rect(0, 92, W, 14), "#9a9fa8", [0, 92, W, 106], 0.6);
        for (let x = 0; x < W; x += 30) stroke([[x + 6, 99], [x + 20, 99]], 1.2, "#ffffff");
        const roll = seg(t, 0.8, 2.2), climb = seg(t, 2.2, 5);
        const x = lerp(60, 200, ease(roll)) + climb * 110, y = 94 - climb * 62, r = -16 * Math.min(1, climb * 3);
        airliner(x, y, r, 0.85, st.col, climb < 0.08);
        const cx = lerp(-40, 90, ease(seg(t, 0, 1.6)));
        rectC(cx, 128, 34, 12, st.col, 0.9); rectC(cx + 6, 121, 20, 8, "#cfe3f2", 0.7);
        blob(cx + 7, 141, 3, "#333"); blob(cx + 27, 141, 3, "#333");
        say("BYE THEN", 230, 30, 16, "#c8102e", seg(t, 2.2, 2.6));
      } else {
        // Thrown off the team coach on a wet motorway, soaked by it as it pulls away, then the long walk.
        c.fillStyle = "#e7e3da"; c.fillRect(0, 0, W, 120);
        shape({ poly: [[-5, 120], [-5, 92], [40, 80], [95, 90], [150, 76], [210, 88], [270, 74], [330, 86], [330, 120]] }, "#9fb39a", { outline: false, gap: 2 });
        crayon(() => c.rect(0, 112, W, 10), "#7d9a6f", [0, 112, W, 122], 0.5);
        crayon(() => c.rect(0, 122, W, 32), "#7f848d", [0, 122, W, 154], 0.6);
        for (let x = 0; x < W; x += 24) stroke([[x + 4, 139], [x + 16, 139]], 1.2, "#ffffff");
        crayon(() => c.rect(0, 154, W, 6), "#b9b4aa", [0, 154, W, 160], 0.7);   // kerb and pavement
        crayon(() => c.rect(0, 160, W, 20), "#a8a39a", [0, 160, W, H], 0.5);
        for (const lx of [20, 120, 220, 320]) { stroke([[lx, 156], [lx, 96], [lx + 9, 94]], 1.4, "#5c6068"); blob(lx + 10, 95, 1.6, "#f5d97a"); }
        for (const [px, pw] of [[60, 14], [175, 18], [262, 12]]) shape({ ell: [px, 167, pw, 3] }, "#93a7bd", { outline: false, gap: 1 });   // puddles
        // road sign the lads are heading for
        stroke([[300, 158], [300, 112]], 1.6, "#5c6068");
        rectC(278, 96, 40, 18, "#1f6b3a", 0.95);
        label("HOME", 298, 101.5, 7, "#ffffff"); label("212 miles", 298, 109, 5.5, "#ffffff");
        const go = 2.3, bx = 20 + Math.pow(seg(t, go, go + 2), 2) * 400;
        const door = t < 0.2 ? seg(t, 0, 0.2) : t < go - 0.3 ? 1 : 1 - seg(t, go - 0.3, go);
        coach(bx, 150, "#2d3a5a", door, st.col);
        // the manager's arm out of the door, pointing them off
        if (t < go - 0.3) { const ax = bx + 91, ay = 125; stroke([[ax - 2, ay], [ax + 7, ay + 1 + Math.sin(t * 9)]], 2.2, "#34343c"); blob(ax + 8, ay + 1 + Math.sin(t * 9), 1.3, "#e0ac83"); }
        const walk = seg(t, 3.4, 6.5);
        crowd(st.walkers.map((kit, i) => {
          const off = 0.3 + i * 0.5, out = seg(t, off, off + 0.5);
          const x0 = lerp(bx + 86, 128 + i * 22, ease(out)), x = x0 + walk * 120;
          const shiver = t > go + 0.6 && walk === 0 ? Math.sin(t * 40 + i) * 0.4 : 0;
          return { x: x + shiver, y: 165 - 18, s: 1, f: 1, kit, pose: t < off ? P.stand() : out < 1 || walk > 0 ? P.sad(t * 6 + i * 2) : { ...P.stand(), lean: 8, nod: 32, uF: 4, fF: 8, uB: -4, fB: -2 } };
        }).filter((o, i) => t > 0.3 + i * 0.5));
        // the spray as the coach goes through the puddle
        const sp = seg(t, go + 0.7, go + 1.3);
        if (sp > 0 && sp < 1) for (let i = 0; i < 14; i++) {
          const a = rad(-20 - i * 9), r = 10 + sp * 40;
          blob(160 + Math.cos(a) * r * 1.2 + i, 152 + Math.sin(a) * r * 0.8 + sp * sp * 30, 1.4, "#7fb3e0");
        }
        say("SPLOOSH", 165, 108, 13, "#1f3fa0", sp > 0 && sp < 1 ? seg(t, go + 0.7, go + 0.85) : 0, 8);
        say("OFF!", bx + 104, 104, 12, "#c8102e", t > 0.3 && t < go - 0.3 ? 1 : 0, 6);
        rain();
      }
    },
  };

  // A side-on airliner: fuselage, swept wing, engine, fin, windows and a stripe in the team colour.
  function airliner(x, y, r, s, col, gear) {
    c.save(); c.translate(x, y); c.rotate(rad(r)); c.scale(s, s);
    shape({ poly: [[-4, 3], [6, 3], [-10, 15], [-17, 15]] }, "#b7bcc6", { gap: 1.2 });                 // far wing
    shape({ poly: [[-30, 0], [-26, 0], [-35, 5], [-40, 5]] }, "#c9ced7", { gap: 1.2 });                 // tailplane
    shape({ poly: [[-35, -5], [-40, -20], [-33, -20], [-24, -6]] }, col, { gap: 1 });                    // fin
    shape({ poly: [[-36, -5], [-22, -6], [24, -6], [30, -5], [34.5, -2.5], [36, 0.5], [34, 3.5], [26, 5.5], [-22, 5.5], [-31, 2.5]] }, "#f2f3f6", { gap: 1.6 });
    stroke([[-30, 1.5], [30, 1.5]], 1.4, col, 0.9, 0.15);
    for (let i = -20; i < 24; i += 3.2) { c.fillStyle = "#3b5b86"; c.beginPath(); c.arc(i, -2, 0.6, 0, 6.283); c.fill(); }
    shape({ poly: [[27, -4], [31.5, -3.4], [33.4, -1.4], [28.5, -1.6]] }, "#3b5b86", { gap: 0.8, outline: false });
    shape({ poly: [[-2, 3], [8, 3], [-6, 16], [-12, 16]] }, "#d4d8e0", { gap: 1.2 });                  // near wing
    shape({ ell: [-1, 10, 11, 5] }, "#a9aeb8", { gap: 1 });                                             // engine
    if (gear) for (const gx of [-8, 22]) { stroke([[gx, 5], [gx, 9]], 0.8); blob(gx, 10, 1.5, "#333333"); }
    c.restore();
  }

  // The manager's misery. Variants: sacked, dressing, refund, shirt, despair, training.
  S.manager = {
    dur: 5,
    cam: (t, st, v) => v === "dressing" ? track(t, [[0, 80, 115, 2], [1.8, 80, 115, 2], [2.4, 200, 105, 1.6]]) : v === "training" ? [160, 120, 1.35] : v === "refund" ? [160, 120, 1.4] : v === "shirt" ? track(t, [[0, 150, 96, 1.35], [1.4, 185, 100, 1.7], [2.6, 150, 97, 1.4], [5, 130, 97, 1.4]]) : track(t, [[0, 75, 140, 2.4], [1.5, 110, 125, 1.6], [5, 110, 120, 1.7]]),
    setup: (o) => ({ M: person(COAT), team: [0, 1, 2, 3].map(() => person(o.lose)), fan: person({ shirt: o.lose.shirt, stripe: o.lose.stripe, shorts: "#3d5a99", socks: "#3d5a99" }),
      notes: Array.from({ length: 14 }, () => ({ x: rnd(0, W), d: rnd(0, 2.5), r: rnd(0, 6) })), lose: o.lose }),
    draw(t, st, v) {
      if (v === "shirt") {
        // The gaffer peels the shirt off him and hangs it back on its peg.
        c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
        rectC(-2, -2, W + 4, 120, "#d9cdb5", 0.5, false);
        const peg = (i) => 40 + i * 48, empty = 1;
        for (let i = 0; i < 6; i++) {
          stroke([[peg(i), 34], [peg(i), 40]], 1.2); label(String(i + 3), peg(i), 28, 6, PENCIL);
          if (i !== empty) tshirt(peg(i), 48, 1.1, st.lose);
        }
        rectC(10, 100, 300, 8, "#8a5a33", 0.85);
        crayon(() => c.rect(0, 116, W, 64), "#b9b2a6", [0, 116, W, H], 0.5);
        const reach = 1.4, peel = seg(t, reach + 0.1, reach + 0.8), back = seg(t, reach + 1.1, reach + 2.6), hung = t > reach + 2.7;
        const mx = t < reach ? lerp(-20, 170, ease(seg(t, 0, reach))) : lerp(170, peg(empty) + 16, ease(back));
        const mf = back > 0 && !hung ? -1 : 1;
        const bare = peel > 0.3;
        crowd([
          { x: 210 + (bare ? Math.sin(t * 40) * 0.5 : 0), y: 150 - 18 * 1.25, s: 1.25, view: "front", kit: st.team[0], bare,
            pose: bare ? { ...P.stand(), uF: 15, fF: 270, uB: 18, fB: 265 } : P.stand() },
          { x: mx, y: 152 - 18 * 1.3, s: 1.3, f: mf, kit: st.M,
            pose: t < reach ? P.run(t * 11, 0.6) : peel < 1 ? { ...P.stand(), uF: lerp(80, 150, peel), fF: lerp(90, 160, peel) } : hung ? { ...P.stand(), uF: 40, fF: 80 } : { ...P.run(t * 11, 0.5), uF: 90, fF: 90 } },
        ]);
        // the shirt: on him, lifted off, carried, then on the peg
        if (peel > 0.3 && !hung) {
          const hx = mx + mf * (peel < 1 ? 12 : 17.5), hy = peel < 1 ? 100 : 111;
          tshirt(peel < 1 ? lerp(210, hx, ease(seg(peel, 0.3, 1))) : hx, peel < 1 ? lerp(118, hy, ease(seg(peel, 0.3, 1))) + 8 : hy + 8, 1.3, st.lose, Math.sin(t * 8) * 8);
        }
        if (hung) tshirt(peg(empty), 48, 1.1, st.lose);
        if (bare) say("brrr", 238, 92, 10, "#1f3fa0", seg(t, reach + 0.8, reach + 1), 6);
        say("NOT FIT TO WEAR IT", 160, 30, 15, "#c8102e", seg(t, reach + 2.7, reach + 3));
        return;
      }
      if (v === "dressing") {
        c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
        rectC(-2, -2, W + 4, 120, "#d9cdb5", 0.5, false);
        for (let i = 0; i < 6; i++) { stroke([[30 + i * 50, 40], [30 + i * 50, 46]], 1); rectC(22 + i * 50, 46, 16, 14, st.lose.shirt, 0.85); }
        rectC(10, 104, 300, 9, "#8a5a33", 0.85);
        crayon(() => c.rect(0, 118, W, 62), "#b9b2a6", [0, 118, W, H], 0.5);
        crowd([
          { x: 60, y: 132, s: 1.25, f: 1, kit: st.M, pose: { ...P.stand(), uF: 95 + Math.sin(t * 9) * 12, fF: 100 } },
          ...st.team.map((kit, i) => ({ x: 150 + i * 42, y: 130, s: 1.05, view: "back", number: 4 + i * 3, kit, pose: { ...P.stand(), uF: 40, fF: 150, uB: 40, fB: 150 } })),
        ]);
        say("...lads?", 70, 70, 14, PENCIL, seg(t, 0.8, 1.1));
        say("NAH", 230, 66, 16, "#c8102e", seg(t, 2, 2.3));
        return;
      }
      pitch();
      goal(null);
      c.setLineDash([3, 3]); stroke([[20, 128], [120, 128], [120, 176]], 1, LINE); c.setLineDash([]);
      const figs = [];
      let mp = P.head();
      if (v === "training") {
        mp = { ...P.stand(), uF: 120, fF: 160 };
        for (let i = 0; i < 6; i++) { const x = 150 + i * 24; shape({ poly: [[x, 150], [x + 4, 160], [x - 4, 160]] }, "#f28c28", { gap: 1 }); }
        st.team.forEach((kit, i) => { const a = t * 1.6 + i * 1.5; figs.push({ x: 220 + Math.cos(a) * 70, y: 128 + Math.sin(a) * 18, s: 0.85, f: -Math.sin(a) > 0 ? 1 : -1, kit, pose: P.run(t * 13 + i) }); });
        say("PEEP!", 95, 108, 14, "#c8102e", (t * 1.5) % 1 < 0.5 ? 1 : 0);
        say("LAPS!", 230, 34, 18, "#c8102e", seg(t, 1, 1.3));
      }
      if (v === "sacked" || v === "despair") st.team.forEach((kit, i) => figs.push({ x: 160 + i * 34, y: 122, s: 0.85, f: -1, kit, pose: P.sit() }));
      if (v === "refund") {
        mp = P.sit();
        figs.push({ x: 230, y: 124 - Math.abs(Math.sin(t * 5)) * 3, s: 1.1, f: -1, kit: st.fan, pose: P.up(P.stand()) });
      }
      if (v === "shirt") {
        mp = { ...P.stand(), uF: 100, fF: 100 };
        const sx = 170, sy = 158;
        shape({ poly: [[sx - 8, sy - 6], [sx + 8, sy - 6], [sx + 12, sy - 2], [sx + 7, sy], [sx + 6, sy + 8], [sx - 6, sy + 8], [sx - 7, sy], [sx - 12, sy - 2]] }, st.lose.shirt, { gap: 1.2 });
        figs.push({ x: lerp(200, 330, seg(t, 0.5, 5)), y: 128, s: 1, f: 1, kit: st.team[0], pose: P.sad(t * 6), bare: true });
      }
      figs.push({ x: 70, y: v === "refund" ? 160 : 140, s: 1.2, f: 1, kit: st.M, pose: mp, prop: v === "training" ? "whistle" : null });
      crowd(figs);
      if (v === "refund") {
        const hx = 230, hy = 124 - 28;
        stroke([[hx, hy + 6], [hx, hy - 16]], 1);
        rectC(hx - 24, hy - 34, 48, 18, "#ffffff", 0.6);
        say("REFUND!", hx, hy - 25, 11, "#c8102e", 1, 0);
        for (const n of st.notes) { const y = ((t - n.d) * 30) % 200 - 10; if (t > n.d) { c.save(); c.translate(n.x + Math.sin(t * 3 + n.r) * 8, y); c.rotate(Math.sin(t * 4 + n.r)); rectC(-5, -2.5, 10, 5, "#7fb069", 0.9); c.restore(); } }
      }
      if (v === "sacked") {
        const k = seg(t, 1.6, 1.9);
        if (k > 0) screen(() => {
          c.save(); c.translate(160, 70); c.rotate(rad(-12)); c.scale(pop(k), pop(k)); stroke([[-62, -16], [62, -16], [62, 16], [-62, 16], [-62, -16]], 2.4, "#c8102e"); c.restore();
          say("SACKED", 160, 70, 26, "#c8102e", k, -12);
        });
      }
      if (v === "despair") { rain(); say("SIGH", 160, 32, 18, PENCIL, seg(t, 1, 1.3)); }
      if (v === "shirt") say("NOT FIT TO WEAR IT", 160, 30, 15, "#c8102e", seg(t, 1, 1.3));
    },
  };

  // The rabona that goes wrong.
  S.rabona = {
    dur: 4.6,
    cam: (t) => track(t, [[0, 80, 140, 2.3], [1.2, 155, 140, 2.6], [2.4, 160, 145, 2.8], [4.6, 165, 140, 2.2]]),
    setup: (o) => ({ L: person(o.lose), K: person(pick(KEEPER)) }),
    draw(t, st) {
      pitch();
      goal(null);
      let x = lerp(60, 150, ease(seg(t, 0, 1.2))), y = 136, pose = P.run(t * 12), rot = 0;
      if (t >= 1.2 && t < 1.7) { const k = seg(t, 1.2, 1.6); pose = { ...P.stand(), cross: true, tF: lerp(10, -35, k), sF: lerp(0, -95, k), uF: -60, fF: -30, uB: 80, fB: 100, lean: -8 }; }
      if (t >= 1.7) { const k = ease(seg(t, 1.7, 2.3)); rot = -95 * k; y = 136 + 15 * k; pose = { ...P.stand(), tF: 40 * k, sF: 60 * k, uF: 120, fF: 150, uB: -110, fB: -140 }; }
      crowd([
        { x: 160, y: GL - 15, s: 0.8, f: 1, kit: st.K, pose: t > 2.3 ? { ...P.stand(), lean: Math.sin(t * 18) * 6, uF: 30, fF: 120 } : P.stand() },
        { x, y, s: 1.1, f: 1, kit: st.L, pose, rot },
      ]);
      const bx = t < 1.2 ? x + 10 : 171 + seg(t, 2.0, 4.6) * 25;
      ball(bx, 155 + (t < 1.2 ? 0 : 0), 3.2);
      say("WHIFF", 175, 112, 14, PENCIL, seg(t, 1.5, 1.7), 10);
      say("?!", 120, 112, 24, "#c8102e", seg(t, 2.3, 2.6));
      if (t > 2.4) say("HA HA", 200, 40, 14, PENCIL, 1, 6);
    },
  };

  // Giants against tiny ones. Variant "lace": a kneeling loser tries to lace a winner's boot.
  S.menboys = {
    dur: 5,
    persp: false,
    cam: (t, st, v) => v === "lace" ? [160, 90, 1] : track(t, [[0, 160, 125, 1.6], [5, 160, 115, 2]]),
    setup: (o) => ({ big: [0, 1, 2].map(() => person(o.win)), small: [0, 1, 2].map(() => person(o.lose)), win: o.win, lose: o.lose }),
    draw(t, st, v) {
      if (v === "lace") return lace(t, st);
      pitch();
      goal(null);
      const figs = [];
      st.big.forEach((kit, i) => figs.push({ x: 80 + i * 80, y: 160 - 18 * 1.45, s: 1.45, view: "front", kit, pose: { ...P.stand(), uF: 40, fF: 150, uB: 40, fB: 150 } }));
      st.small.forEach((kit, i) => figs.push({ x: 112 + i * 80 - (i === 2 ? 70 : 0), y: 166 - 18 * 0.62 - Math.abs(Math.sin(t * 7 + i)) * 7, s: 0.62, view: "front", kit, pose: P.up(P.stand()) }));
      crowd(figs);
      ball(160, 160 - 18 * 1.45 - 1.45 * 26 - Math.abs(Math.sin(t * 5)) * 16, 3.2, 160);
    },
  };

  // Close-up: a loser's hands making a mess of the winner's laces.
  function lace(t, st) {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    crayon(() => c.rect(0, 128, W, 52), GRASS, [0, 128, W, H], 0.55, 2.2);
    c.save(); c.translate(150, 118); c.scale(1.5, 1.5);
    for (const sx of [-34, -18, 12, 30]) rectC(sx, 15, 5, 4, "#26262c", 0.9);                            // studs
    shape({ poly: [[-42, 10], [50, 10], [50, 15], [-42, 15]] }, "#26262c", { gap: 1 });                       // sole
    shape({ poly: [[-40, 10], [-39, -6], [-31, -16], [-14, -20], [0, -27], [14, -27], [18, -13], [36, -5], [47, 2], [48, 10]] }, "#2b2f3a", { gap: 1.3 });
    stroke([[-34, 4], [-10, -4], [20, 0], [44, 6]], 2.2, st.win.shirt, 0.95, 0.3);                           // stripe in the winner's colour
    stroke([[2, -27], [14, -27], [16, -16], [4, -18], [2, -27]], 1, "#555a66", 0.9, 0.2);                     // collar
    for (let i = 0; i < 4; i++) {                                                                             // laces
      const y = -18 + i * 4.2;
      stroke([[4 + i * 4, y], [18 + i * 3, y + 3]], 1.1, "#ffffff", 0.95, 0.2);
      stroke([[18 + i * 3, y], [4 + i * 4, y + 3]], 1.1, "#ffffff", 0.95, 0.2);
    }
    const mess = Math.floor(seg(t, 0.8, 3.5) * 16);
    if (mess) stroke(Array.from({ length: mess + 2 }, (_, i) => [14 + Math.sin(i * 2.3) * (4 + i * 0.5), -22 + Math.cos(i * 1.7) * (3 + i * 0.35)]), 0.9, "#ffffff", 0.95, 0.6);
    // two fumbling hands coming in from the right
    const wob = Math.sin(t * 11) * 2;
    for (const [hx, hy, ax, ay] of [[16 + wob, -32, 130, -48], [30 - wob, -24, 130, -14]]) {
      limb([ax, ay], [hx + 8, hy - 2], 9, st.lose.shirt);
      blob(hx, hy, 6, "#e0ac83");
      for (let f = 0; f < 3; f++) stroke([[hx - 3, hy - 3 + f * 3], [hx - 9 + J(1), hy - 2 + f * 3 + J(1)]], 2.2, "#e0ac83", 1, 0.3);
    }
    c.restore();
    say("NOT FIT TO LACE THEM", 160, 32, 15, "#c8102e", seg(t, 1.5, 1.8));
    if (t > 2.6) say("KNOTS!", 236, 150, 16, PENCIL, seg(t, 2.6, 2.9), 8);
  }

  // The referee ends it. Variant "ht": the board says it was over at half-time.
  S.whistle = {
    dur: 5,
    cam: (t) => track(t, [[0, 160, 110, 2.3], [1.5, 160, 120, 1.8], [2.5, 160, 130, 1.5]]),
    setup: (o) => ({ R: person(REF), losers: [0, 1, 2].map(() => person(o.lose)), winners: [0, 1].map(() => person(o.win)), info: o.info }),
    draw(t, st, v) {
      pitch();
      goal(null);
      if (v === "ht") board(8, 6, `HT ${st.info.ws}-${st.info.ls}`, 70);
      const figs = [{ x: 160, y: 124, s: 1.1, f: 1, kit: st.R, pose: { ...P.stand(), uF: 165, fF: 175, uB: 40, fB: 120 }, prop: "whistle" }];
      st.losers.forEach((kit, i) => {
        const k = ease(seg(t, 1.6 + i * 0.25, 2.1 + i * 0.25));
        figs.push({ x: 70 + i * 110 - (i === 1 ? 40 : 0), y: 138 + k * 14, s: 1, f: i ? -1 : 1, kit, pose: P.stand(), rot: -90 * k });
      });
      st.winners.forEach((kit, i) => figs.push({ x: 210 + i * 40, y: 116, s: 0.9, view: "front", kit, pose: { ...P.stand(), uF: 40, fF: 150, uB: 40, fB: 150 } }));
      crowd(figs);
      ["PEEP!", "PEEP!", "PEEEEP!"].forEach((w, i) => say(w, 85 + i * 75, 30 + i * 4, 14 + i * 3, "#c8102e", seg(t, 0.3 + i * 0.4, 0.5 + i * 0.4), i % 2 ? 8 : -8));
    },
  };

  // A draw: handshake and a shirt swap.
  S.draw = {
    dur: 4.6,
    cam: (t) => track(t, [[0, 160, 130, 1.6], [1.4, 160, 125, 2.6], [2.6, 160, 125, 2.6], [3.2, 160, 125, 2.2]]),
    setup: (o) => ({ A: person(o.win), B: person(o.lose) }),
    draw(t, st) {
      pitch();
      goal(null);
      const k = ease(seg(t, 0, 1.4)), swap = t > 2.6;
      const shake = t > 1.4 ? Math.sin(t * 16) * 8 : 0;
      const pose = t > 1.4 ? { ...P.stand(), uF: 70, fF: 90 + shake } : P.run(t * 12);
      crowd([
        { x: lerp(40, 148, k), y: 132, s: 1.1, f: 1, kit: swap ? { ...st.A, shirt: st.B.shirt, stripe: st.B.stripe } : st.A, pose },
        { x: lerp(280, 172, k), y: 132, s: 1.1, f: -1, kit: swap ? { ...st.B, shirt: st.A.shirt, stripe: st.A.stripe } : st.B, pose },
      ]);
      say(swap ? "SHIRT SWAP" : "GOOD GAME", 160, 34, 18, PENCIL, seg(t, swap ? 2.6 : 1.4, swap ? 2.9 : 1.7));
    },
  };


  // ---------- scenes added for variety: each margin gets its own ----------

  // Goalmouth scramble, a toe-poke in, then the scorer collapses exhausted.
  S.scramble = {
    dur: 5,
    cam: (t) => track(t, [[0, 165, 105, 2.3], [2.6, 160, 105, 2.1], [3.4, 150, 120, 2.2]]),
    setup: (o) => ({ A: person(o.win), bodies: [0, 1, 2, 3, 4].map((i) => person(i % 2 ? o.lose : o.win)), K: person(pick(KEEPER)),
      hops: Array.from({ length: 7 }, () => [rnd(140, 185), rnd(104, 116)]) }),
    draw(t, st) {
      pitch();
      const pokeAt = 2.4, inAt = 2.75;
      const hop = Math.min(st.hops.length - 2, Math.floor(t / 0.34)), hk = (t % 0.34) / 0.34;
      let b = t < pokeAt ? { x: lerp(st.hops[hop][0], st.hops[hop + 1][0], hk), y: lerp(st.hops[hop][1], st.hops[hop + 1][1], hk) - Math.sin(hk * Math.PI) * 4, r: 2.7 } : flight(t, pokeAt, inAt, st.hops[hop], [158, 86], 2, 2.7, 2.2, 0, BG);
      if (t < pokeAt) b.gy = lerp(st.hops[hop][1], st.hops[hop + 1][1], hk) + 2.3;
      const inNet = t > inAt;
      goal(inNet ? { x: 158, y: 86, k: Math.max(0.2, 1 - (t - inAt)) } : null, 0, inNet ? () => netBall(158, 86, t - inAt) : null);
      const figs = st.bodies.map((kit, i) => ({ x: 142 + i * 11 + Math.sin(t * 9 + i) * 3, y: 93 + (i % 2) * 6 + Math.abs(Math.sin(t * 7 + i * 2)) * -2, view: i % 2 ? "front" : "back", number: false, kit, pose: P.run(t * 14 + i, 0.6) }));
      figs.push({ x: 160 + Math.sin(t * 6) * 6, y: GL - 1 - 18 * 0.8, s: 0.8, view: "front", kit: st.K, pose: { ...P.stand(), uF: 60, fF: 70, uB: 60, fB: 70 } });
      const done = t > inAt + 0.4;
      figs.push(done ? { x: 150, y: 128, f: 1, kit: st.A, pose: { ...P.stand(), uF: 160, fF: 170, uB: -100, fB: -120 }, rot: -90 * ease(seg(t, inAt + 0.4, inAt + 0.9)) }
        : { x: 150, y: 116, view: "back", kit: st.A, pose: t > pokeAt - 0.2 && t < pokeAt + 0.2 ? P.kick(seg(t, pokeAt - 0.2, pokeAt + 0.1)) : P.run(t * 12, 0.7) });
      crowd(figs);
      if (!inNet) ball(b.x, b.y, b.r, b.gy);
      if (done) for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; blob(140 + i * 6, 112 - ph * 10, 1, "#4aa3df"); }
      say("PHEW", 95, 32, 20, PENCIL, seg(t, inAt + 0.9, inAt + 1.2));
      say("GOAL!", 210, 32, 18, "#c8102e", seg(t, inAt, inAt + 0.3), 8);
    },
  };

  // Cross from the right wing, tapped in at the back post.
  S.tapin = {
    dur: 5,
    cam: (t) => track(t, [[0, 230, 130, 2], [1.2, 210, 115, 1.6], [2, 140, 100, 2.1], [3, 150, 110, 1.8]]),
    setup: (o) => ({ wing: person(o.win), nine: person(o.win), D: person(o.lose), K: person(pick(KEEPER)) }),
    draw(t, st) {
      pitch();
      const cross = 1.2, meet = 1.9, inAt = 2.15;
      const inNet = t > inAt;
      goal(inNet ? { x: 132, y: 84, k: Math.max(0.2, 1.2 - (t - inAt)) } : null, 0, inNet ? () => netBall(132, 84, t - inAt) : null);
      const wx = lerp(255, 240, seg(t, 0, cross)), wy = lerp(150, 116, seg(t, 0, cross));
      const nx = lerp(160, 136, ease(seg(t, 0.5, meet))), ny = lerp(140, 104, ease(seg(t, 0.5, meet)));
      const party = t > inAt + 0.3;
      crowd([
        party ? { x: 150, y: 110, view: "front", kit: st.wing, pose: P.up(P.stand()) } : { x: wx, y: wy, f: -1, kit: st.wing, pose: t < cross ? P.run(t * 13) : t < cross + 0.3 ? P.kick(seg(t, cross, cross + 0.25)) : P.stand() },
        party ? { x: 136, y: 104, view: "front", kit: st.nine, pose: P.up(P.stand()) } : { x: nx, y: ny, view: "back", kit: st.nine, pose: t > meet - 0.15 && t < meet + 0.2 ? P.kick(seg(t, meet - 0.15, meet + 0.1)) : P.run(t * 13) },
        { x: lerp(170, 150, seg(t, 0.8, meet)), y: 100, view: "front", kit: st.D, pose: t > meet ? P.head() : P.run(t * 12, 0.6) },
        keeperAt(st, t, cross + 0.2, 1),
      ]);
      let b;
      if (t < cross) b = { x: wx - 6, y: wy + 19, r: 3 };
      else if (t < meet) b = flight(t, cross, meet, [wx - 6, wy + 19], [nx + 2, ny + 15], 26, 3, 2.6);
      else if (t < inAt) b = flight(t, meet, inAt, [nx + 2, ny + 15], [132, 84], 3, 2.6, 2.2, 0, BG);
      if (b) ball(b.x, b.y, b.r, b.gy);
      say("BACK POST!", 160, 32, 18, "#c8102e", seg(t, inAt, inAt + 0.3));
    },
  };

  // Nutmeg: through the defender's legs, and he ends up on the floor.
  S.nutmeg = {
    dur: 4.6,
    cam: (t) => track(t, [[0, 120, 140, 2.6], [1.3, 160, 140, 2.7], [3, 185, 140, 2.4]]),
    setup: (o) => ({ A: person(o.win), D: person(o.lose) }),
    draw(t, st) {
      pitch();
      const megAt = 1.3;
      const ax = t < megAt ? lerp(90, 148, t / megAt) : 148 + (t - megAt) * 32, ay = t < megAt ? 140 : 140 - Math.sin(seg(t, megAt, megAt + 0.8) * Math.PI) * 8;
      const spin = seg(t, megAt + 0.1, megAt + 0.8), down = t > megAt + 0.8;
      crowd([
        { x: 168, y: down ? 156 : 140, f: spin > 0.5 ? 1 : -1, kit: st.D, pose: down ? P.sit() : { ...P.stand(), tF: 22, sF: 18, tB: -22, sB: -18, uF: 40, fF: 50 }, nod: 0 },
        { x: ax, y: ay, f: 1, kit: st.A, pose: P.run(t * 13) },
      ]);
      ball(t < megAt ? ax + 9 : Math.max(lerp(160, 200, seg(t, megAt, megAt + 1)), ax + 9), 159, 3.2);
      say("NUTMEG!", 160, 32, 22, "#c8102e", seg(t, megAt + 0.1, megAt + 0.4));
      if (down) say("?", 168, 108, 16, PENCIL, 1, 0);
    },
  };

  // Half-time: the winners stroll down the tunnel, job done.
  S.tunnel = {
    dur: 5,
    cam: (t) => track(t, [[0, 160, 120, 1.4], [5, 115, 72, 1.8]]),
    setup: (o) => ({ win: [0, 1, 2].map(() => person(o.win)), lose: [0, 1, 2].map(() => person(o.lose)), info: o.info }),
    draw(t, st) {
      pitch();
      // tunnel mouth in the stand
      shape({ poly: [[78, 56], [78, 34], [84, 26], [104, 26], [110, 34], [110, 56]] }, "#26262c", { gap: 1 });
      board(8, 6, `HT ${st.info.ws}-${st.info.ls}`, 70);
      const figs = st.win.map((kit, i) => {
        const k = seg(t, i * 0.4, 4 + i * 0.4);
        return { x: lerp(150 + i * 30, 94, k), y: lerp(130 - i * 6, 42, k), view: "back", number: 9 + i, kit, pose: P.run(t * 9 + i, 0.4) };
      }).filter((o) => o.y > 44);
      st.lose.forEach((kit, i) => figs.push({ x: 170 + i * 40, y: 150 - i * 12, f: -1, kit, pose: P.sit() }));
      crowd(figs);
      say("FEET UP AT HALF-TIME", 160, 32, 14, "#c8102e", seg(t, 2, 2.3));
    },
  };

  // Everyone's down. The winners keep scoring until the ref says enough.
  S.dead = {
    dur: 6,
    cam: (t) => track(t, [[0, 160, 120, 1.3], [2.4, 160, 118, 1.35], [3.1, 172, 128, 2], [4.4, 172, 128, 2.1], [6, 160, 118, 1.4]]),
    setup: (o) => ({ A: person(o.win), mate: person(o.win), lose: [0, 1, 2].map(() => person(o.lose)), K: person(pick(KEEPER)), info: o.info,
      shots: [0.5, 1.05, 1.6, 2.15].map((at) => ({ at, to: [rnd(BX0 + 6, BX1 - 6), rnd(BT + 6, BG - 8)] })) }),
    draw(t, st) {
      pitch();
      const done = st.shots.filter((s) => t > s.at + 0.35), last = done[done.length - 1];
      goal(last ? { x: last.to[0], y: last.to[1], k: Math.max(0.15, 0.9 - (t - last.at - 0.35)) } : null, 0, () => done.forEach((s) => netBall(s.to[0], s.to[1], t - s.at - 0.35)));
      // the opposition are already flat out, and their souls are drifting off
      const bodies = [{ x: 160, y: GL - 3, kit: st.K, dir: -1 }, { x: 82, y: 126, kit: st.lose[0], dir: 1 }, { x: 244, y: 122, kit: st.lose[1], dir: -1 }, { x: 108, y: 156, kit: st.lose[2], dir: 1, flag: true }];
      bodies.forEach((o) => lying({ ...o, wave: o.flag ? 40 + Math.sin(t * 8) * 15 : 0 }));
      const fb = bodies[3], fs = persp(fb.y) * 0.9;            // a white flag waved from the floor
      const fx = fb.x - 6 * fs + 13 * fs, fy = fb.y - 9 * fs;
      stroke([[fx, fy + 4], [fx + 1, fy - 12]], 0.9);
      const wv = Math.sin(t * 10) * 1.5;
      shape({ poly: [[fx + 1, fy - 12], [fx + 6, fy - 13 + wv], [fx + 11, fy - 12], [fx + 11, fy - 6], [fx + 6, fy - 7 + wv], [fx + 1, fy - 6]] }, "#ffffff", { gap: 1.2 });
      bodies.forEach((o, i) => ghost(o.x, o.y - 6, seg(t, 0.9 + i * 0.45, 3.4 + i * 0.45)));
      // he keeps putting them in until a teammate drags him away
      const grab = 2.9, kicking = st.shots.some((s) => t > s.at - 0.25 && t < s.at + 0.05);
      const pull = ease(seg(t, grab + 0.3, 5)), ax = 160 + pull * 34;
      const shot = st.shots.find((s) => t > s.at - 0.25 && t < s.at + 0.05);
      const flail = t > grab + 0.2 ? { ...P.stand(), tF: Math.max(0, Math.sin(t * 14)) * 60, uF: 120, fF: 140, uB: 120, fB: 140 } : shot ? P.kick(seg(t, shot.at - 0.25, shot.at + 0.05)) : P.stand();
      const mk = ease(seg(t, 2.3, grab)), mx = lerp(330, ax + 11, mk);
      crowd([
        { x: ax, y: 140, view: "back", number: 9, kit: st.A, pose: flail },
        { x: mx, y: 141, f: -1, kit: st.mate, pose: mk < 1 ? P.run(t * 14) : { ...P.stand(), lean: -12, uF: 80, fF: 95, uB: 70, fB: 85, tF: -15, sF: -20, tB: 15, sB: 10 } },
      ]);
      for (const sh of st.shots) if (t > sh.at && t < sh.at + 0.35) { const b = flight(t, sh.at, sh.at + 0.35, [ax + 3, 155], sh.to, 9, 3.2, 2.1, 0, BG); ball(b.x, b.y, b.r, b.gy); }
      const between = st.shots.some((sh) => t > sh.at && t < sh.at + 0.2);
      if (!between) ball(ax + 3, 155, 3.1);                      // there's always another ball
      say("STOP!", mx + 6, 104, 16, "#c8102e", seg(t, grab, grab + 0.2), 8);
      say("THEY'RE ALREADY DEAD", 160, 30, 15, "#c8102e", seg(t, 3.6, 3.9));
    },
  };

  // Running riot: a conga line snakes across the pitch.
  S.conga = {
    dur: 5,
    cam: (t) => [160, 125, 1.5],
    setup: (o) => ({ team: [0, 1, 2, 3, 4, 5].map(() => person(o.win)), D: person(o.lose) }),
    draw(t, st) {
      pitch();
      goal(null);
      const figs = st.team.map((kit, i) => {
        const u = t * 0.22 - i * 0.06, x = 20 + ((u * 300) % 330), y = 132 + Math.sin(u * 14) * 14;
        return { x, y, f: 1, kit, pose: { ...P.run(t * 8 + (i % 2) * 3, 0.45), lean: 6, uF: 85, fF: 85, uB: 80, fB: 80 } };
      });
      figs.push({ x: 260, y: 110, f: -1, kit: st.D, pose: P.head() });
      crowd(figs);
      for (let i = 0; i < 4; i++) say("♪", 40 + ((t * 70 + i * 80) % 260), 92 - ((t * 20 + i * 7) % 20), 12, PENCIL, 1, 0);
      say("RUNNING RIOT", 160, 32, 20, "#c8102e", seg(t, 0.6, 0.9));
    },
  };

  // Side-on thunderbolt volley, in off the underside of the bar.
  S.volley = {
    dur: 4.8,
    cam: (t) => track(t, [[0, 150, 120, 1.9], [1.2, 180, 115, 1.6], [1.6, 250, 105, 2.2], [3, 210, 115, 1.7]]),
    setup: (o) => ({ A: person(o.win), K: person(pick(KEEPER)) }),
    draw(t, st) {
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      rectC(-2, 30, W + 4, 50, "#a6adbd", 0.35, false);
      crayon(() => c.rect(0, 80, W, H - 80), GRASS, [0, 80, W, H], 0.55, 2.2);
      const G = 150, PX = 262, TOP = 104;                                   // ground, goal line, crossbar height
      const hitAt = 1.45, volleyAt = 1.1;
      const bulge = t > hitAt + 0.15 ? Math.max(0, 1 - (t - hitAt) * 1.4) * 6 : 0;
      // side-on goal: net slopes back from the bar to the ground behind
      stroke([[PX, TOP], [PX + 22 + bulge, G - 10], [PX + 24, G]], 0.8, "#7d828c", 0.7);
      for (let i = 1; i < 6; i++) stroke([[PX + i * 4, TOP + i * 3], [PX + i * 4 + bulge * 0.6, G]], 0.5, "#7d828c", 0.5);
      for (let j = 1; j < 5; j++) stroke([[PX, TOP + j * 9], [PX + 22 + bulge, TOP + j * 9 + 2]], 0.5, "#7d828c", 0.5);
      c.globalAlpha = 0.22; c.fillStyle = "#16310f"; c.fillRect(PX, G - 1, 30, 3); c.globalAlpha = 1;
      const shake = t > hitAt && t < hitAt + 0.5 ? Math.sin(t * 90) * 1.2 : 0;
      stroke([[PX, G], [PX, TOP + shake]], 3.4, PENCIL); stroke([[PX, G], [PX, TOP + shake]], 1.9, "#ffffff", 1, 0.2);
      stroke([[PX - 2, TOP + shake], [PX + 6, TOP - 2 + shake]], 3.4, PENCIL); stroke([[PX - 2, TOP + shake], [PX + 6, TOP - 2 + shake]], 1.9, "#ffffff", 1, 0.2);
      const kdive = seg(t, volleyAt + 0.15, volleyAt + 0.5);
      crowd([
        { x: PX - 6, y: G - 18 * 0.95 - kdive * 8, s: 0.95, fixed: true, f: -1, kit: st.K, pose: kdive > 0 ? P.dive() : P.stand(), rot: -50 * kdive },
        { x: 150, y: G - 18 * 1.1, s: 1.1, fixed: true, f: 1, kit: st.A, pose: t > volleyAt - 0.25 && t < volleyAt + 0.3 ? { ...P.kick(seg(t, volleyAt - 0.25, volleyAt + 0.05)), lean: -20 } : t > 2.2 ? P.up(P.run(t * 12, 0.6)) : P.stand() },
      ]);
      let b;
      if (t < volleyAt) { const k = t / volleyAt; b = { x: lerp(60, 160, k), y: lerp(60, 132, k * k), r: 3.2, gy: G }; }
      else if (t < hitAt) b = { ...flight(t, volleyAt, hitAt, [160, 132], [PX + 3, TOP + 4], 4, 3.2, 3.2), gy: G };
      else if (t < hitAt + 0.25) b = { ...flight(t, hitAt, hitAt + 0.25, [PX + 3, TOP + 4], [PX + 10, G - 3], 0, 3.2, 3.2), gy: G };
      else b = { x: PX + 12, y: G - 3, r: 3.2, gy: G };
      if (t > volleyAt && t < hitAt) for (let i = 1; i < 5; i++) stroke([[b.x - i * 6, b.y + i * 1.6], [b.x - i * 6 - 5, b.y + i * 1.6 + 1.3]], 0.8, PENCIL, 0.5);
      ball(b.x, b.y, b.r, b.gy);
      spark(PX + 3, TOP + 3, seg(t, hitAt, hitAt + 0.3));
      say("BANG!", 110, 32, 26, "#c8102e", seg(t, volleyAt, volleyAt + 0.3));
      say("IN OFF THE BAR!", 225, 88, 12, PENCIL, seg(t, hitAt + 0.3, hitAt + 0.6), -3);
    },
  };

  // Post-match interview in the rain: thumbs up, looking for positives.
  S.interview = {
    dur: 4.6,
    persp: false,
    cam: (t) => track(t, [[0, 160, 115, 1.6], [4.6, 160, 112, 2]]),
    setup: (o) => ({ M: person(COAT), Rp: person({ shirt: "#8a6d4b", shorts: "#2a2a30", socks: "#2a2a30" }) }),
    draw(t, st) {
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) rectC(30 + i * 34, 40 + j * 20, 30, 16, (i + j) % 2 ? "#cfd6e4" : "#e8dccb", 0.7);
      crayon(() => c.rect(0, 120, W, 60), GRASS, [0, 120, W, H], 0.55, 2.2);
      crowd([
        { x: 135, y: 150 - 18 * 1.5, s: 1.5, fixed: true, f: 1, kit: st.M, pose: { ...P.stand(), uF: 120, fF: 175 + Math.sin(t * 4) * 6, nod: -5 }, mouth: true },
        { x: 195, y: 150 - 18 * 1.4, s: 1.4, fixed: true, f: -1, kit: st.Rp, pose: { ...P.stand(), uF: 70, fF: 80 }, prop: "mic" },
      ]);
      for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i / 4) % 1; say("+", 120 + i * 9, 70 - ph * 30, 14, "#2e8b57", 1 - ph * 0.6, 0); }
      rain();
      say("PLENTY OF POSITIVES", 160, 32, 16, PENCIL, seg(t, 0.8, 1.1));
    },
  };

  // A comfortable afternoon: winners in deckchairs while the losers chase about.
  S.deckchair = {
    dur: 4.8,
    cam: (t) => track(t, [[0, 150, 135, 2], [4.8, 160, 125, 1.6]]),
    setup: (o) => ({ win: [0, 1].map(() => person(o.win)), lose: [0, 1].map(() => person(o.lose)), stripe: o.win.shirt }),
    draw(t, st) {
      pitch();
      goal(null);
      // the sun
      blob(290, 18, 9, "#f5c244");
      for (let i = 0; i < 8; i++) { const a = rad(i * 45 + t * 20); stroke([[290 + Math.cos(a) * 12, 18 + Math.sin(a) * 12], [290 + Math.cos(a) * 16, 18 + Math.sin(a) * 16]], 1, "#f5c244"); }
      const chair = (x, y) => {
        shape({ poly: [[x - 9, y], [x + 4, y], [x + 10, y - 16], [x + 6, y - 16]] }, "#ffffff", { gap: 0.9 });
        for (let i = 0; i < 3; i++) stroke([[x - 6 + i * 4, y], [x + 7 + i * 1, y - 16]], 1.6, st.stripe, 0.9, 0.15);
        stroke([[x - 10, y + 8], [x - 4, y], [x + 2, y + 8]], 0.9); stroke([[x + 4, y], [x + 10, y + 8]], 0.9);
      };
      const figs = [];
      st.lose.forEach((kit, i) => figs.push({ x: (60 + t * 55 + i * 40) % 340 - 10, y: 110 + i * 10, f: 1, kit, pose: P.run(t * 15 + i) }));
      crowd(figs);
      [[120, 150], [185, 155]].forEach(([x, y], i) => {
        chair(x, y);
        figure({ x: x - 1, y: y - 2, s: 1.25, f: -1, kit: st.win[i], pose: { ...P.sit(), lean: -35, nod: 0, uF: i ? 100 : 160, fF: i ? 150 : 230, uB: -150, fB: -235 }, shades: true, prop: i ? "drink" : null });
      });
      say("COMFORTABLE", 160, 32, 20, "#c8102e", seg(t, 0.8, 1.1));
    },
  };

  // Bad day at the office, literally.
  S.office = {
    dur: 4.6,
    persp: false,
    cam: (t) => track(t, [[0, 160, 105, 1.6], [4.6, 150, 108, 2]]),
    setup: (o) => ({ L: person(o.lose), info: o.info, sheets: Array.from({ length: 6 }, () => ({ x: rnd(120, 220), d: rnd(0, 3), r: rnd(0, 6) })) }),
    draw(t, st) {
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      rectC(-2, -2, W + 4, 132, "#d8dfe6", 0.5, false);
      crayon(() => c.rect(0, 130, W, 50), "#a58b6a", [0, 130, W, H], 0.6);
      blob(60, 50, 12, "#ffffff"); stroke([[60, 50], [60, 42]], 1); stroke([[60, 50], [66, 53]], 1);   // wall clock
      rectC(150, 112, 110, 7, "#8a5a33", 0.9); stroke([[158, 119], [158, 150]], 2.5); stroke([[252, 119], [252, 150]], 2.5);   // desk
      rectC(212, 84, 34, 24, "#33363d", 0.95); stroke([[229, 108], [229, 112]], 2);                           // monitor
      c.save(); c.translate(229, 96);
      stroke([[-13, -7], [-6, -2], [0, -4], [7, 5], [13, 8]], 1.2, "#e04848", 1, 0.2);                          // results going down
      c.restore();
      say(`${st.info.ls}-${st.info.ws}`, 229, 79, 9, PENCIL, 1, 0);
      const spill = seg(t, 1.6, 2.2);
      c.save(); c.translate(190, 108); c.rotate(rad(spill * 80)); rectC(-3, -7, 6, 7, "#ffffff", 0.9); c.restore();
      if (spill > 0) shape({ ell: [198 + spill * 8, 111, 6 + spill * 14, 3] }, "#6b4a2b", { outline: false });
      rectC(118, 131, 20, 3.5, "#3a3a44", 0.9); stroke([[119, 131], [116, 104]], 2.2); stroke([[128, 134], [128, 150]], 2); stroke([[121, 150], [135, 150]], 2);   // chair
      figure({ x: 130, y: 129, s: 1.4, f: 1, kit: st.L, pose: { ...P.head({ ...P.sit(), lean: 28, nod: 25 }), sF: 0, sB: 5 } });
      for (const sh of st.sheets) if (t > sh.d) { const y = 60 + ((t - sh.d) * 25) % 70; c.save(); c.translate(sh.x + Math.sin(t * 2 + sh.r) * 10, y); c.rotate(Math.sin(t * 3 + sh.r) * 0.6); rectC(-4, -5, 8, 10, "#ffffff", 0.9); c.restore(); }
      say("MONDAY", 60, 72, 10, PENCIL, 1, 0);
      say("BAD DAY AT THE OFFICE", 160, 32, 15, "#c8102e", seg(t, 0.8, 1.1));
    },
  };

  // Second gear: the winner strolls with the ball while the losers sprint and can't catch him.
  S.stroll = {
    dur: 4.8,
    cam: (t) => [160, 130, 1.6],
    setup: (o) => ({ A: person(o.win), chase: [0, 1, 2].map(() => person(o.lose)) }),
    draw(t, st) {
      pitch();
      goal(null);
      const ax = 60 + t * 30;
      const figs = [{ x: ax, y: 130, f: 1, kit: st.A, pose: { ...P.run(t * 6, 0.35), lean: -4, uF: -40, fF: -80, uB: -40, fB: -80 } }];
      st.chase.forEach((kit, i) => figs.push({ x: ax - 34 - i * 22 + Math.sin(t * 3 + i) * 3, y: 126 + i * 7, f: 1, kit, pose: P.run(t * 18 + i, 1.2), tears: false }));
      crowd(figs);
      ball(ax + 10 + Math.abs(Math.sin(t * 3)) * 3, 148.5, 3.2);
      for (let i = 0; i < 3; i++) say("♪", ax + 8 + i * 6, 96 - ((t * 15 + i * 5) % 14), 10, PENCIL, 1, 0);
      // gearstick gauge
      screen(() => {
        rectC(222, 8, 90, 40, "#26262c", 0.9);
        for (let g = 1; g <= 5; g++) say(String(g), 234 + (g - 1) * 16, 22, 12, g === 2 ? "#f5c244" : "#9aa0aa", 1, 0);
        say("GEAR", 267, 39, 10, "#ffffff", 1, 0);
      });
      say("SECOND GEAR", 120, 32, 18, "#c8102e", seg(t, 0.8, 1.1));
    },
  };

  // Couldn't lay a glove: the loser swings boxing gloves and the winner sways out of reach.
  S.boxing = {
    dur: 4.6,
    cam: (t) => [160, 135, 2.4],
    setup: (o) => ({ A: person(o.win), L: person(o.lose) }),
    draw(t, st) {
      pitch();
      const p = (t * 2.2) % 1, punching = p < 0.4, jab = Math.sin(Math.min(1, p / 0.4) * Math.PI);
      crowd([
        { x: 145, y: 132, f: 1, kit: st.L, prop: "gloves", pose: { ...P.stand(), lean: 8 + jab * 10, uF: 50 + jab * 40, fF: 80 + jab * 10, uB: 60, fB: 150, tF: 15, sF: 8, tB: -12, sB: -14 } },
        { x: 182, y: 132, f: -1, kit: st.A, pose: { ...P.stand(), lean: -8 - jab * 26, uF: 20, fF: 40, uB: -20, fB: -40 }, mouth: false },
      ]);
      if (punching && jab > 0.8) say(pick(["WHIFF", "MISS", "SWISH"]), 172, 102, 12, PENCIL, 1, 8);
      say("NOT A GLOVE ON HIM", 160, 32, 16, "#c8102e", seg(t, 1, 1.3));
    },
  };

  // Never really got going: running on the spot, stuck in the mud.
  S.stuck = {
    dur: 4.6,
    cam: (t) => [150, 135, 2.3],
    setup: (o) => ({ L: person(o.lose), past: person(o.win) }),
    draw(t, st) {
      pitch();
      shape({ ell: [150, 151, 40, 9] }, "#6b4a2b", { gap: 1.2 });
      crowd([
        { x: 150, y: 134, f: 1, kit: st.L, pose: P.run(t * 26, 1.1) },
        { x: lerp(40, 330, seg(t, 1, 4)), y: 120, f: 1, kit: st.past, pose: P.run(t * 12, 0.7) },
      ]);
      for (let i = 0; i < 5; i++) { const ph = (t * 3 + i / 5) % 1; blob(140 - ph * 18 + i * 2, 148 - Math.sin(ph * Math.PI) * 12, 1.4, "#6b4a2b"); }
      for (let i = 0; i < 3; i++) stroke([[132 - i * 4, 124 + i * 6], [124 - i * 4, 124 + i * 6]], 0.8, PENCIL, 0.6);
      say("NEVER GOT GOING", 160, 32, 18, "#c8102e", seg(t, 0.8, 1.1));
    },
  };

  // Too little too late: a consolation goal, grab the ball, and the final whistle goes.
  S.consolation = {
    dur: 4.8,
    cam: (t) => track(t, [[0, 150, 120, 1.8], [1.5, 160, 105, 1.9], [2.6, 160, 120, 1.6]]),
    setup: (o) => ({ L: person(o.lose), R: person(REF), K: person(pick(KEEPER)), info: o.info }),
    draw(t, st) {
      pitch();
      const shot = 0.7, inAt = 1.05, grab = 1.8, peep = 2.4;
      const inNet = t > inAt && t < grab;
      goal(inNet ? { x: 180, y: 82, k: 0.8 } : null, 0, inNet ? () => netBall(180, 82, t - inAt) : null);
      board(8, 6, t > peep ? `FT ${st.info.ls}-${st.info.ws}` : `90' ${st.info.ls - 1}-${st.info.ws}`, 64);
      const lx = t < grab ? lerp(150, 165, seg(t, 0, shot)) : lerp(180, 160, seg(t, grab, peep));
      const ly = t < grab ? lerp(150, 140, seg(t, 0, shot)) : lerp(100, 125, seg(t, grab, peep));
      crowd([
        keeperAt(st, t, shot, -1),
        t < grab ? { x: lx, y: ly - (t > inAt ? 0 : 0), view: "back", kit: st.L, pose: t > shot - 0.3 && t < shot + 0.1 ? P.kick(seg(t, shot - 0.3, shot)) : t > inAt ? P.stand() : P.run(t * 12) }
          : { x: lx, y: ly, view: "front", kit: st.L, prop: t < peep ? "carry" : null, pose: t < peep ? P.run(t * 13) : P.head() },
        { x: 230, y: 118, f: -1, kit: st.R, prop: "whistle", pose: t > peep ? { ...P.stand(), uF: 165, fF: 175 } : P.stand() },
      ]);
      if (t < inAt) { const b = t < shot ? { x: lx + 4, y: ly + 18, r: 3.2 } : flight(t, shot, inAt, [lx + 4, ly + 18], [180, 82], 8, 3.2, 2.1, 0, BG); ball(b.x, b.y, b.r, b.gy); }
      say("PEEEEP!", 230, 32, 20, "#c8102e", seg(t, peep, peep + 0.3));
      if (t > peep + 0.5) say("TOO LATE", 110, 32, 18, PENCIL, seg(t, peep + 0.5, peep + 0.8));
    },
  };

  // Driven to the airport: out of the car, across to the plane, up the steps, gone.
  S.airport = {
    dur: 7,
    persp: false,
    cam: (t) => track(t, [[0, 110, 120, 1.7], [1.6, 130, 118, 1.8], [3.8, 175, 100, 2], [4.6, 175, 100, 1.7], [7, 245, 70, 1.4]]),
    setup: (o) => ({ P: person(o.lose), col: o.lose.shirt, carCol: pick(KITS).shirt }),
    draw(t, st) {
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      rectC(-2, -2, W + 4, 70, "#aab3c2", 0.35, false);
      crayon(() => c.rect(0, 92, W, 14), "#9a9fa8", [0, 92, W, 106], 0.6);
      for (let x = 0; x < W; x += 30) stroke([[x + 6, 99], [x + 20, 99]], 1.2, "#ffffff");
      crayon(() => c.rect(0, 106, W, 14), GRASS, [0, 106, W, 120], 0.5);
      crayon(() => c.rect(0, 120, W, 34), "#8a8f98", [0, 120, W, 154], 0.6);
      for (let x = 0; x < W; x += 24) stroke([[x + 4, 137], [x + 16, 137]], 1.2, "#ffffff");
      crayon(() => c.rect(0, 154, W, 26), GRASS, [0, 154, W, H], 0.5);
      const board = 4.4, roll = seg(t, 4.8, 5.6), climb = seg(t, 5.6, 7);
      const px = 175 + ease(roll) * 50 + climb * 110, py = 94 - climb * 62, pr = -16 * Math.min(1, climb * 3);
      airliner(px, py, pr, 0.85, st.col, climb < 0.08);
      // steps up to the door, wheeled away once he's on board
      const stepsX = t < board + 0.3 ? 0 : -(t - board - 0.3) * 40;
      if (stepsX > -60) { shape({ poly: [[180 + stepsX, 100], [192 + stepsX, 100], [192 + stepsX, 88], [186 + stepsX, 88]] }, "#d0d3da", { gap: 1 }); for (let i = 0; i < 4; i++) stroke([[183 + i * 2 + stepsX, 97 - i * 3], [190 + stepsX, 97 - i * 3]], 0.6); }
      // the car pulls up
      const cx = lerp(-40, 70, ease(seg(t, 0, 1.4)));
      rectC(cx, 128, 36, 12, st.carCol, 0.9); rectC(cx + 6, 120, 22, 8, "#cfe3f2", 0.7);
      ball(cx + 8, 140, 3.4, 143); ball(cx + 28, 140, 3.4, 143);
      say("TAXI", cx + 18, 125, 6, PENCIL, 1, 0);
      // the passenger, suitcase in hand
      if (t > 1.5 && t < board) {
        const k = seg(t, 1.6, 3.4), up = seg(t, 3.5, board);
        const x = k < 1 ? lerp(cx + 30, 182, k) : lerp(182, 189, up), y = k < 1 ? lerp(140, 98, k) - 18 * lerp(1, 0.7, k) : 98 - 18 * 0.7 - up * 10;
        figure({ x, y, s: lerp(1, 0.7, k), f: 1, kit: st.P, pose: up >= 1 ? { ...P.stand(), uF: 170, fF: 175 } : P.sad(t * 7), prop: "suitcase" });
      }
      if (t > 3.6 && t < 4.6) say("TA-RA", 200, 62, 12, PENCIL, seg(t, 3.6, 3.9), 6);
      say("DRIVE HIM TO THE AIRPORT", 160, 32, 14, "#c8102e", seg(t, 1, 1.3));
    },
  };

  // ---------- camera and frames ----------
  function render(canvas, scene, st, v, t) {
    c = canvas.getContext("2d");
    if (window.rough && (!R || R.canvas !== canvas)) R = window.rough.canvas(canvas);
    const sx = canvas.width / W, sy = canvas.height / H;
    BASE = [sx, 0, 0, sy, 0, 0];
    c.setTransform(...BASE); c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    let [cx, cy, z] = scene.cam ? scene.cam(t, st, v) : [W / 2, H / 2, 1];
    z = Math.max(1, z);
    const hw = W / 2 / z, hh = H / 2 / z;
    cx = Math.min(W - hw, Math.max(hw, cx)); cy = Math.min(H - hh, Math.max(hh, cy));
    Z = z; PERSP = scene.persp !== false;
    c.setTransform(sx * z, 0, 0, sy * z, sx * (W / 2 - cx * z), sy * (H / 2 - cy * z));
    scene.draw(t, st, v);
  }
  // Ease the camera between keyframes: [[time, x, y, zoom], ...]
  function track(t, keys) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], k = ease((t - a[0]) / (b[0] - a[0]));
      return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)];
    }
    return keys[keys.length - 1].slice(1);
  }

  // ---------- player ----------
  let run = null;
  // With { once: true } it plays the list through and holds on the last frame instead of looping.
  function play(canvas, items, onItem, opts = {}) {
    stop();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const state = { i: -1, start: 0, last: 0, st: null, item: null };
    const next = (now) => {
      state.i = (state.i + 1) % items.length;
      state.item = items[state.i];
      const [name, v] = state.item.scene.split(":");
      state.scene = S[name] || S.scrappy; state.v = v;
      state.st = state.scene.setup(state.item);
      state.start = now;
      onItem?.(state.i);
    };
    const frame = (now) => {
      if (!run || run.state !== state) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      if (w && canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr * H / W); }
      const over = state.i >= 0 && (now - state.start) / 1000 > state.scene.dur + (still ? 2.5 : 1.4);
      if (over && opts.once && state.i === items.length - 1) { render(canvas, state.scene, state.st, state.v, state.scene.dur); run = null; return; }
      if (state.i < 0 || over) next(now);
      if (now - state.last > 83) {        // draw "on twos" for a hand-animated feel
        state.last = now;
        const t = still ? state.scene.dur : Math.min(state.scene.dur, (now - state.start) / 1000);
        render(canvas, state.scene, state.st, state.v, t);
      }
      run.raf = requestAnimationFrame(frame);
    };
    run = { state, raf: requestAnimationFrame(frame) };
    document.fonts?.load('16px "Permanent Marker"').catch(() => {});
  }
  function stop() { if (run) cancelAnimationFrame(run.raf); run = null; }

  // Draws one frame of a scene at time t; handy for checking a scene without waiting.
  function still(canvas, item, t) {
    const [name, v] = item.scene.split(":"), sc = S[name];
    canvas.width = 640; canvas.height = 360;
    render(canvas, sc, sc.setup(item), v, t);
  }
  window.Sketch = { play, stop, still, kits: KITS, scenes: Object.keys(S) };
})();
