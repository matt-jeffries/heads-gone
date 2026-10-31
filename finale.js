// Full-time animation: one flat cartoon scene per result, the same every game; only the
// text around it changes. Win: the boot strikes the ball into the net and the goal turns
// into a trophy. Lose: the ball clangs off the post and a rain cloud rolls in.
// Finale.play(host, [{ mood: "win" | "lose" | "draw" }], onItem, { once }) plays each in turn.
(() => {
  const NAVY = "#140f5c";
  const DUR = { win: 6.4, lose: 6.0, draw: 6.0 };
  const PAL = {
    win: { bg: "#5ffd9c", boot: "#4dd0e6", bootDark: "#39a9c9", sole: "#2b8fb0", stripe: "#e8e24a", shine: "#9be7f2", ball: "#ffffff", ballShade: "#d4d5ea" },
    lose: { bg: "#8e9bb8", boot: "#7a9fb3", bootDark: "#5f8397", sole: "#557a8d", stripe: "#b9b48a", shine: "#a9c3d0", ball: "#eceef3", ballShade: "#c4c6d6" },
    draw: { bg: "#b9c7e4", boot: "#6cb8cc", bootDark: "#4f97ad", sole: "#3f8299", stripe: "#d9d36a", shine: "#a7dbe6", ball: "#ffffff", ballShade: "#d4d5ea" },
  };

  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeIn = (k) => k * k * k;
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const back = (k) => (k <= 0 ? 0 : 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2));
  const O = `stroke="${NAVY}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;

  // ---------- drawings (the same shapes as the approved stills) ----------
  const sparkle = (s, col) => `<path d="M0 ${-s} L${s * 0.28} ${-s * 0.28} L${s} 0 L${s * 0.28} ${s * 0.28} L0 ${s} L${-s * 0.28} ${s * 0.28} L${-s} 0 L${-s * 0.28} ${-s * 0.28}Z" fill="${col}"/>`;
  const ball = (p, uid) => `
    <defs><clipPath id="hg-bc-${uid}"><circle r="44"/></clipPath></defs>
    <circle r="44" fill="${p.ball}"/>
    <g clip-path="url(#hg-bc-${uid})">
      <g class="spin">
        <g fill="${NAVY}">
          <path d="M-3 -16 L10.3 -6.3 L5.2 9.3 L-11.2 9.3 L-16.3 -6.3z"/><path d="M12.9 -23.8 L8.1 -38.4 L20.5 -47.4 L32.9 -38.4 L28.2 -23.8z"/>
          <path d="M22.7 6.3 L35 -2.6 L47.4 6.3 L42.7 20.9 L27.4 20.9z"/><path d="M-3 25 L9.4 34 L4.6 48.5 L-10.6 48.5 L-15.4 34z"/>
          <path d="M-28.7 6.3 L-33.4 20.9 L-48.7 20.9 L-53.4 6.3 L-41 -2.6z"/><path d="M-18.9 -23.8 L-34.2 -23.8 L-38.9 -38.4 L-26.5 -47.4 L-14.1 -38.4z"/>
        </g>
        <path d="M-3 -16 L-3 -48 M10.3 -6.3 L40.8 -16.1 M5.2 9.3 L24.1 35.2 M-11.2 9.3 L-30.1 35.2 M-16.3 -6.3 L-46.8 -16.1" stroke="${NAVY}" stroke-width="4.5" stroke-linecap="round"/>
      </g>
      <path d="M8 -46 a46 46 0 0 1 0 92 q30 -46 0 -92z" fill="${p.ballShade}" opacity=".85"/>
    </g>
    <circle r="44" fill="none" stroke="${NAVY}" stroke-width="7"/>
    <path d="M-26 -26 q8 -8 18 -10" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  const boot = (p) => `
    <path ${O} d="M2 54 V24 q0 -12 10 -12 h18 q8 0 10 6 l4 6 q34 6 62 12 q26 6 28 22 q0 4 -6 6 H8 q-6 0 -6 -6z" fill="${p.boot}"/>
    <path d="M100 32 q18 4 22 18 q-4 2 -10 2 q-2 -12 -12 -20z" fill="${p.bootDark}"/>
    <path d="M2 46 H122" stroke="${NAVY}" stroke-width="5" fill="none"/>
    <path d="M6 48 H118 V52 H6z" fill="${p.sole}"/>
    <path d="M58 22 l-10 24 M70 25 l-10 21" stroke="${p.stripe}" stroke-width="7" stroke-linecap="round"/>
    <path d="M46 22 l7 -6 M56 24 l7 -6 M66 26 l7 -6 M76 28 l7 -6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <g fill="${NAVY}"><rect x="10" y="56" width="9" height="9" rx="2"/><rect x="32" y="56" width="9" height="9" rx="2"/><rect x="74" y="56" width="9" height="9" rx="2"/><rect x="98" y="56" width="9" height="9" rx="2"/></g>
    <path d="M10 20 q0 -4 4 -4 h12" stroke="${p.shine}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  const goal = () => `
    <path d="M228 146 H328 V306 H228z" fill="#e3e6ee" opacity=".55"/>
    <g class="net" stroke="#9aa3b8" stroke-width="2.5">
      <path d="M244 146 V306 M260 146 V306 M276 146 V306 M292 146 V306 M308 146 V306"/>
      <path d="M228 162 H328 M228 178 H328 M228 194 H328 M228 210 H328 M228 226 H328 M228 242 H328 M228 258 H328 M228 274 H328 M228 290 H328"/>
    </g>
    <path d="M222 312 V140 H334 V312" fill="none" stroke="${NAVY}" stroke-width="13" stroke-linejoin="round"/>
    <path d="M222 312 V140 H334 V312" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>`;
  const trophy = () => `
    <path ${O} d="M138 128 q-34 0 -34 34 q0 40 52 52" fill="none"/>
    <path ${O} d="M262 128 q34 0 34 34 q0 40 -52 52" fill="none"/>
    <path d="M138 128 q-26 2 -26 34 q0 32 44 46" fill="none" stroke="#f9d21a" stroke-width="7"/>
    <path ${O} d="M134 112 h132 v18 q0 96 -66 112 q-66 -16 -66 -112z" fill="#fdd116"/>
    <path d="M224 132 q0 84 -24 104 q50 -20 56 -104z" fill="#d6a81a"/>
    <rect ${O} x="126" y="98" width="148" height="22" rx="11" fill="#fdd116"/>
    <path class="shine" d="M150 132 q-4 40 10 70" stroke="#fff3a6" stroke-width="9" stroke-linecap="round" fill="none" opacity=".8"/>
    <path ${O} d="M200 140 l10 21 23 3 -17 16 4 23 -20 -11 -20 11 4 -23 -17 -16 23 -3z" fill="#f7a933"/>
    <path ${O} d="M188 242 h24 l6 34 h-36z" fill="#fdd116"/>
    <rect ${O} x="160" y="276" width="80" height="36" rx="6" fill="#9c6a4a"/>
    <rect x="178" y="287" width="44" height="12" rx="3" fill="#f5c244"/>`;
  const cloud = () => `
    <g class="rain" stroke="#4aa3df" stroke-width="6" stroke-linecap="round">
      <path d="M14 62 l-6 14"/><path d="M38 62 l-6 14"/><path d="M62 62 l-6 14"/><path d="M86 62 l-6 14"/>
    </g>
    <path ${O} d="M10 56 q-18 0 -18 -18 q0 -18 20 -18 q4 -22 28 -22 q22 0 28 18 q26 -4 30 18 q14 2 14 12 q0 10 -14 10z" fill="#d9dde6"/>`;

  // A goal seen at an angle: near post on the left, far post on the right, net behind.
  const goal3 = () => `
    <path d="M236 140 L372 168 L392 156 L262 126 Z M262 126 L262 284 L392 266 L392 156 Z" fill="#e3e6ee" opacity=".5"/>
    <g class="net" stroke="#9aa3b8" stroke-width="2.2" fill="none">
      <path d="M262 126 L262 284 M288 132 L288 281 M314 138 L314 277 M340 144 L340 274 M366 150 L366 270 M392 156 L392 266"/>
      <path d="M262 150 L392 178 M262 176 L392 200 M262 202 L392 222 M262 228 L392 244 M262 254 L392 255"/>
      <path d="M236 140 L262 126 M270 147 L296 133 M304 154 L330 140 M338 161 L364 147 M236 312 L262 284 M372 290 L392 266"/>
    </g>
    <path d="M236 312 V140 L372 168 V290" fill="none" stroke="${NAVY}" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M236 312 V140 L372 168 V290" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;

  // A faceless flat player, side on, built from lines so the limbs can move.
  const KIT = { skin: "#f2b49b", hair: "#3a2a22", shirt: "#e8edff", trim: "#5b6bd6", shorts: "#3b4258", socks: "#ffffff", boots: NAVY };
  const LIMB = (k, w, col) => `<line data-k="${k}o" stroke="${NAVY}" stroke-width="${w + 7}" stroke-linecap="round"/><line data-k="${k}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const legSvg = (n) => LIMB(`${n}th`, 15, KIT.skin) + LIMB(`${n}sh`, 13, KIT.skin) + LIMB(`${n}so`, 13, KIT.socks) + LIMB(`${n}ft`, 9, KIT.boots) + `<line data-k="${n}sd" stroke="${KIT.shorts}" stroke-width="20" stroke-linecap="round"/>`;
  const armSvg = (n) => LIMB(`${n}up`, 11, KIT.shirt) + LIMB(`${n}fo`, 9, KIT.skin);
  const player = () => `<g data-k="player">${armSvg("ab")}${legSvg("lb")}
    ${LIMB("torso", 28, KIT.shirt)}<line data-k="stripe" stroke="${KIT.trim}" stroke-width="4" stroke-linecap="round"/>
    ${legSvg("lf")}${armSvg("af")}
    <circle data-k="head" r="16" fill="${KIT.skin}" stroke="${NAVY}" stroke-width="5"/><path data-k="hair" fill="${KIT.hair}" stroke="${NAVY}" stroke-width="4" stroke-linejoin="round"/></g>`;

  const SPARKLES = [[62, 112, 11, NAVY, 0], [338, 96, 9, "#f5c244", 0.35], [96, 214, 7, "#f5c244", 0.7], [352, 210, 8, NAVY, 1.05], [196, 52, 8, "#ff6b8a", 0.5]];
  const CONFETTI = ["#ff6b8a", "#4fc3ea", "#f5c244", "#ff6b8a", "#7c5cff", "#4fc3ea", "#f5c244", "#ff6b8a", "#4fc3ea", "#f5c244"]
    .map((col, i) => ({ col, x: 40 + i * 34 + (i % 3) * 7, d: (i * 0.37) % 1.6, sp: 0.8 + (i % 4) * 0.12, r: i * 47 }));

  let uidN = 0;
  function build(mood) {
    const p = PAL[mood], uid = ++uidN, win = mood === "win";
    return `<svg viewBox="0 30 400 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <g data-k="shot">
        <ellipse cx="200" cy="318" rx="190" ry="9" fill="#b9bad8"/>
        <path d="M20 312 H380" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>
        <g data-k="goal">${goal3()}</g>
        <ellipse data-k="pshadow" cy="314" rx="34" ry="5" fill="#b9bad8"/>
        ${player()}
        ${win ? "" : `<g data-k="clang" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"><path d="M226 186 l-12 -10 M222 202 l-16 -2 M228 168 l-4 -14"/></g>`}
        <g data-k="sball">${ball(p, uid + "s")}</g>
      </g>
      <circle data-k="wipe" cx="200" cy="185" r="0" fill="${p.bg}"/>
      <g data-k="hero" style="display:none">
        <circle data-k="bg" cx="200" cy="185" r="128" fill="${p.bg}"/>
        ${win ? SPARKLES.map((s, i) => `<g data-k="sp${i}">${sparkle(s[2], s[3])}</g>`).join("") : ""}
        ${win ? CONFETTI.map((c, i) => `<rect data-k="cf${i}" x="-6" y="-3" width="12" height="6" rx="2" fill="${c.col}"/>`).join("") : ""}
        ${win ? "" : `<g data-k="cloud">${cloud()}</g>`}
        <ellipse cx="200" cy="318" rx="170" ry="9" fill="#b9bad8"/>
        <path d="M60 312 H340" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>
        ${win ? `<g data-k="trophy">${trophy()}</g>` : ""}
        <g data-k="boot">${boot(p)}</g>
        <g data-k="hball">${ball(p, uid + "h")}</g>
      </g>
    </svg>`;
  }

  // ---------- motion ----------
  const poseRun = (ph) => { const s = Math.sin(ph), tF = 34 * s, tB = -34 * s;
    return { lean: 10, tF, sF: tF - (12 + 55 * Math.max(0, -s)), tB, sB: tB - (12 + 55 * Math.max(0, s)), uF: -38 * s, fF: -38 * s + 70, uB: 38 * s, fB: 38 * s + 70 }; };
  const poseKick = (k) => ({ lean: lerp(6, -10, k), tF: lerp(-45, 80, k), sF: lerp(-45, 80, k) - lerp(90, 5, k), tB: 8, sB: 2, uF: lerp(-30, -70, k), fF: -40, uB: lerp(60, 80, k), fB: 110 });
  const poseUp = (b) => ({ ...b, lean: -4, tF: 4, sF: 0, tB: -4, sB: 0, uF: 160, fF: 178, uB: 35, fB: 120 });
  const poseHead = (b) => ({ ...b, lean: 6, tF: 4, sF: 0, tB: -4, sB: 0, uF: 150, fF: 250, uB: 145, fB: 245 });
  const mix = (a, b, k) => Object.fromEntries(Object.keys(a).map((n) => [n, lerp(a[n], b[n] ?? a[n], k)]));
  const at = (o, ang, len) => [o[0] + Math.sin(ang * Math.PI / 180) * len, o[1] + Math.cos(ang * Math.PI / 180) * len];
  function drawPlayer(els, hx, hy, pose) {
    const ln = (k, a, b) => { for (const id of [k, k + "o"]) { const e = els[id]; if (!e) continue; e.setAttribute("x1", a[0]); e.setAttribute("y1", a[1]); e.setAttribute("x2", b[0]); e.setAttribute("y2", b[1]); } };
    const hip = [hx, hy], neck = at(hip, 180 - pose.lean, 50), head = at(neck, 180 - pose.lean, 22);
    ln("torso", hip, neck); ln("stripe", at(hip, 180 - pose.lean, 30).map((v, i) => v + (i ? 0 : -6)), at(hip, 180 - pose.lean, 44).map((v, i) => v + (i ? 0 : -6)));
    const leg = (n, t, sh) => {
      const knee = at(hip, t, 40), ankle = at(knee, sh, 40);
      ln(n + "th", hip, knee); ln(n + "sh", knee, ankle); ln(n + "so", at(knee, sh, 16), ankle); ln(n + "ft", ankle, at(ankle, sh + 90, 12));
      ln(n + "sd", hip, at(hip, t, 16));
      return at(ankle, sh + 90, 12);
    };
    const arm = (n, u, f) => { const sh = at(neck, 180 - pose.lean, -6), el = at(sh, u, 26); ln(n + "up", sh, el); ln(n + "fo", el, at(el, f, 24)); };
    arm("ab", pose.uB, pose.fB); leg("lb", pose.tB, pose.sB);
    const foot = leg("lf", pose.tF, pose.sF); arm("af", pose.uF, pose.fF);
    els.head.setAttribute("cx", head[0]); els.head.setAttribute("cy", head[1]);
    els.hair.setAttribute("d", `M${head[0] - 17} ${head[1] + 2} A17 17 0 0 1 ${head[0] + 14} ${head[1] - 9} Q${head[0] + 2} ${head[1] - 6} ${head[0] - 4} ${head[1] + 6} Z`);
    els.pshadow.setAttribute("cx", hx + 4);
    return foot;
  }

  const SHOT = 1.25, CUT = 2.7;
  function frame(els, mood, t) {
    const set = (k, v) => els[k] && els[k].setAttribute("transform", v);
    const win = mood === "win";
    // ----- part 1: the shot -----
    els.shot.style.display = t < CUT + 0.35 ? "" : "none";
    if (t < CUT + 0.35) {
      const run = seg(t, 0, 0.95), hx = lerp(-30, 112, easeOut(run)) + (t > SHOT ? seg(t, SHOT, 1.8) * 10 : 0);
      let pose, hy = 232;
      if (t < 0.95) { pose = poseRun(t * 15); hy -= Math.abs(Math.cos(t * 15)) * 4; }
      else if (t < 1.45) pose = poseKick(ease(seg(t, 0.95, SHOT + 0.08)));
      else if (t < 1.75) pose = mix(poseKick(1), win ? poseUp(poseKick(1)) : poseHead(poseKick(1)), ease(seg(t, 1.45, 1.75)));
      else pose = win ? poseUp(poseKick(1)) : poseHead(poseKick(1));
      if (t > 1.75) hy -= win ? Math.abs(Math.sin((t - 1.75) * 9)) * 10 : 0;
      drawPlayer(els, hx, hy, pose);
      const BX = 178, BY = 294, R = 0.42;
      let bx = BX, by = BY, bs = R, spin = 0;
      if (win) {
        const k = seg(t, SHOT, 1.75), d = seg(t, 1.75, 2.1);
        if (t >= SHOT && t < 1.75) { const e = easeOut(k); bx = lerp(BX, 318, e); by = lerp(BY, 214, e) - Math.sin(e * Math.PI) * 30; bs = lerp(R, 0.32, e); spin = e * 500; }
        else if (t >= 1.75) { bx = 318 + d * 3; by = lerp(214, 268, easeIn(d)); bs = 0.32; spin = 500; }
        const rip = seg(t, 1.7, 2.4), bulge = Math.sin(rip * Math.PI * 3) * (1 - rip) * 7;
        els.net.setAttribute("transform", `translate(${bulge} ${-bulge * 0.4})`);
      } else {
        const k = seg(t, SHOT, 1.62), bk = seg(t, 1.62, 2.15), b2 = seg(t, 2.15, 2.5);
        if (t >= SHOT && t < 1.62) { const e = easeOut(k); bx = lerp(BX, 213, e); by = lerp(BY, 196, e) - Math.sin(e * Math.PI) * 24; bs = lerp(R, 0.38, e); spin = e * 400; }
        else if (t >= 1.62 && t < 2.15) { bx = lerp(213, 168, bk); by = lerp(196, BY, easeIn(bk)) - Math.sin(bk * Math.PI) * 18; bs = lerp(0.38, R, bk); spin = 400 - bk * 220; }
        else if (t >= 2.15) { bx = lerp(168, 158, b2); by = BY - Math.sin(b2 * Math.PI) * 10; spin = 180 - b2 * 60; }
        const sh = seg(t, 1.62, 2.2), wob = Math.sin(sh * Math.PI * 7) * (1 - sh) * 2.5;
        set("goal", `rotate(${t > 1.62 ? wob : 0} 236 312)`);
        els.clang.setAttribute("opacity", String(t > 1.62 && t < 2.1 ? 1 - seg(t, 1.85, 2.1) : 0));
      }
      set("sball", `translate(${bx} ${by}) scale(${bs})`);
      els.spin.forEach((e) => e.setAttribute("transform", `rotate(${spin})`));
    }
    // ----- the cut: a circle of the result colour sweeps over -----
    const grow = easeIn(seg(t, CUT, CUT + 0.35)), shrink = easeOut(seg(t, CUT + 0.35, CUT + 0.7));
    els.wipe.setAttribute("r", String(t < CUT + 0.35 ? grow * 290 : lerp(290, 128, shrink)));
    els.wipe.style.display = t > CUT + 0.72 ? "none" : "";
    els.hero.style.display = t > CUT + 0.35 ? "" : "none";
    if (t <= CUT + 0.35) return;
    // ----- part 2: the result card -----
    const h = t - CUT - 0.35;
    set("bg", `translate(200 185) scale(${t < CUT + 0.7 ? lerp(290, 128, shrink) / 128 : 1}) translate(-200 -185)`);
    const slide = (k) => (1 - easeOut(k)) * 90;
    set("boot", `translate(${46 - slide(seg(h, 0.25, 0.7))} 244)`);
    if (win) {
      set("hball", `translate(${298 + slide(seg(h, 0.35, 0.8))} 268) rotate(${-slide(seg(h, 0.35, 0.8)) * 2})`);
      const g = back(seg(h, 0.1, 0.6)), idle = h > 0.7 ? Math.sin((h - 0.7) * 2.4) * 0.025 : 0, tilt = h > 0.7 ? Math.sin((h - 0.7) * 1.7) * 2.5 : 0;
      set("trophy", `translate(200 312) rotate(${tilt}) scale(${g * (1 + idle)}) translate(-200 -312)`);
      const sh = ((h - 0.7) % 2.6) / 2.6;
      els.shine.setAttribute("transform", h > 0.7 ? `translate(${lerp(-10, 90, sh)} 0)` : "");
      els.shine.setAttribute("opacity", h > 0.7 ? String(0.85 * Math.sin(sh * Math.PI)) : "0.8");
      SPARKLES.forEach((s, i) => { const ph = h - 0.5 - s[4], k = ph < 0 ? 0 : Math.sin(((ph % 1.5) / 1.5) * Math.PI); set(`sp${i}`, `translate(${s[0]} ${s[1]}) scale(${k}) rotate(${ph * 40})`); });
      CONFETTI.forEach((c, i) => { const ph = h - 0.3 - c.d, cyc = 2.6 / c.sp, k = ph < 0 ? -1 : (ph % cyc) / cyc;
        set(`cf${i}`, k < 0 ? "translate(-50 -50)" : `translate(${c.x + Math.sin(ph * 3 + i) * 10} ${lerp(30, 330, k)}) rotate(${c.r + ph * 220})`); });
    } else {
      // the ball sits glum in the middle, a little squashed, as the cloud rolls in
      set("hball", `translate(${232 + slide(seg(h, 0.35, 0.8))} ${276 + 4} ) scale(1 0.88)`);
      const k = mood === "draw" ? 0 : easeOut(seg(h, 0.4, 1));
      els.cloud.style.display = mood === "draw" ? "none" : "";
      set("cloud", `translate(${lerp(170, 140, k)} ${lerp(-80, 80, k) + (h > 1 ? Math.sin((h - 1) * 1.6) * 3 : 0)})`);
      els.rainLines.forEach((l, i) => { const ph = h - 0.9 - i * 0.18, k2 = ph < 0 ? -1 : (ph % 0.7) / 0.7;
        l.setAttribute("transform", k2 < 0 ? "translate(0 -200)" : `translate(${-k2 * 6} ${k2 * 34})`); l.setAttribute("opacity", k2 < 0 ? "0" : String(1 - k2)); });
    }
  }

  let run = null;
  function mount(host, mood) {
    host.innerHTML = build(mood);
    const els = {};
    host.querySelectorAll("[data-k]").forEach((n) => (els[n.dataset.k] = n));
    els.net = host.querySelector(".net"); els.spin = [...host.querySelectorAll(".spin")]; els.shine = host.querySelector(".shine");
    els.rainLines = [...host.querySelectorAll(".rain path")];
    return els;
  }
  function play(host, items, onItem, opts = {}) {
    stop();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const state = { i: -1, start: 0 };
    const next = (now) => {
      state.i++; state.start = now;
      state.mood = items[state.i].mood || "win";
      state.els = mount(host, state.mood);
      onItem?.(state.i);
    };
    const tick = (now) => {
      if (!run || run.state !== state) return;
      const last = state.i === items.length - 1;
      if (state.i < 0) next(now);
      else if (!(last && opts.once) && (now - state.start) / 1000 > DUR[state.mood] + 1.2) {
        if (last) state.i = -1;
        next(now);
      }
      const t = (now - state.start) / 1000;
      frame(state.els, state.mood, still ? Math.max(DUR[state.mood], t) : t);
      run.raf = requestAnimationFrame(tick);
    };
    run = { state, raf: requestAnimationFrame(tick) };
  }
  function stop() { if (run) cancelAnimationFrame(run.raf); run = null; }
  // One frame at time t, for checking the drawing without waiting.
  function still(host, mood, t) { frame(mount(host, mood), mood, t); }
  window.Finale = { play, stop, still, DUR };
})();
