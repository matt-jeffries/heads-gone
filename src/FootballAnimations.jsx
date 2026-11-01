// Built into ../football-animations.js with:
//   npx esbuild@0.24.0 src/FootballAnimations.jsx --loader:.jsx=jsx --jsx=transform --format=iife --minify --target=es2018 --outfile=football-animations.js
// Changes from the handoff: React comes from the global UMD build, the host wrapper is renamed
// ScenePlayer (it clashed with the striker Player), and the exports go on window.FootballAnimations.
// FootballAnimations.jsx — self-contained React component (no dependencies beyond React).
// Usage:
//   import { GoalAnimation, GameOverAnimation } from './FootballAnimations';
//   <GoalAnimation onComplete={() => setShowResult(true)} />
//   <GameOverAnimation loop />
// Props: loop (bool, default false) · playing (bool, default true) · onComplete (fn) · style / className (wrapper)
// The animation renders a 1920x1080 scene scaled to fit the wrapper's width (16:9).
const { createContext, useContext, useEffect, useMemo, useRef, useState } = React;

const Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

const CompositionCtx = createContext(null);
const useComposition = () => useContext(CompositionCtx);

// Scene timing: "nat" = authored length the choreography was written against, "dur" = playback length.
const SCENES = {
  "goal": [
    {
      "name": "Strike",
      "dur": 0.68,
      "nat": 1.3
    },
    {
      "name": "Flight",
      "dur": 1,
      "nat": 2.2
    },
    {
      "name": "Net",
      "dur": 0.47,
      "nat": 0.6
    },
    {
      "name": "Goal",
      "dur": 1.01,
      "nat": 1.3
    },
    {
      "name": "Trophy",
      "dur": 3.12,
      "nat": 4
    }
  ],
  "gameover": [
    {
      "name": "Strike",
      "dur": 0.8,
      "nat": 1.3
    },
    {
      "name": "Flight",
      "dur": 1.05,
      "nat": 1.8
    },
    {
      "name": "Post",
      "dur": 1.17,
      "nat": 1.5
    },
    {
      "name": "Whistle",
      "dur": 1.15,
      "nat": 1.9
    },
    {
      "name": "GameOver",
      "dur": 2.26,
      "nat": 2.9
    }
  ]
};

function derive(scenes) {
  let a = 0, p = 0;
  const sec = [], CUES = {};
  for (const s of scenes) {
    sec.push({ playStart: p, dur: s.dur, authStart: a, nat: s.nat });
    CUES[s.name] = a;
    a += s.nat; p += s.dur;
  }
  return { sec, CUES, authoredTotal: a, playTotal: p };
}
function toAuthored(d, t) {
  for (const s of d.sec) if (t < s.playStart + s.dur) return s.authStart + Math.max(0, t - s.playStart) * (s.nat / s.dur);
  return d.authoredTotal;
}
function useFont() {
  useEffect(() => {
    if (document.querySelector('link[data-football-font]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Anton&display=swap';
    l.setAttribute('data-football-font', '');
    document.head.appendChild(l);
  }, []);
}

// When not looping, playback stops just before the closing fade-to-dark so the final title stays on screen.
const END_FADE = 0.7;
function ScenePlayer({ scenes, Piece, loop = false, playing = true, onComplete, style, className }) {
  useFont();
  const d = useMemo(() => derive(scenes), [scenes]);
  const stopAt = loop ? d.playTotal : d.playTotal - END_FADE * (d.sec[d.sec.length - 1].dur / d.sec[d.sec.length - 1].nat);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const cb = useRef(onComplete);
  cb.current = onComplete;
  useEffect(() => {
    if (!playing) return;
    let raf, start = performance.now() - tRef.current * 1000, fired = false;
    const tick = (now) => {
      let el = (now - start) / 1000;
      if (el >= stopAt) {
        if (loop) { start = now; el = 0; }
        else { tRef.current = stopAt; setT(stopAt); if (!fired) { fired = true; cb.current && cb.current(); } return; }
      }
      tRef.current = el; setT(el);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, loop, stopAt]);

  const wrap = useRef(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = wrap.current;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const T = toAuthored(d, t);
  const value = { T, CUES: d.CUES, authoredTotal: d.authoredTotal };
  return (
    <div ref={wrap} className={className} style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', background: '#0e3a3b', ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <CompositionCtx.Provider value={value}>
          <Piece />
        </CompositionCtx.Provider>
      </div>
    </div>
  );
}

// Shared football rig + the two films (GoalFilm, GameOverFilm).
const D = Math.PI / 180;
const MOTION = {
  enter: Easing.easeOutCubic,
  glide: Easing.easeInOutSine,
  pop: Easing.easeOutBack,
  strike: Easing.easeInCubic,
  fall: Easing.easeInQuad,
  linear: Easing.linear,
};
const tw = (T, a, b, s, e, ease = MOTION.glide) =>
  T <= s ? a : T >= e ? b : a + (b - a) * ease((T - s) / (e - s));
const prog = (T, s, e, ease = MOTION.linear) => tw(T, 0, 1, s, e, ease);
function keyed(T, keys) {
  const n = keys.length;
  if (T <= keys[0].t) return keys[0].v;
  if (T >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0;
  while (T > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], h = b.t - a.t, u = (T - a.t) / h;
  const tan = (j, key) => {
    if (j <= 0 || j >= n - 1) return 0;
    const p = keys[j - 1], q = keys[j + 1];
    return ((q.v[key] ?? 0) - (p.v[key] ?? 0)) / (q.t - p.t) * 0.85;
  };
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const o = {};
  for (const key in a.v) o[key] = h00 * a.v[key] + h10 * h * tan(i, key) + h01 * b.v[key] + h11 * h * tan(i + 1, key);
  return o;
}
const decay = (dt, rate) => (dt < 0 ? 0 : Math.exp(-dt * rate));

const C = {
  sky: '#2fa9a6', skyDeep: '#26918f', floor: '#23807e', floorDeep: '#1d6f6d',
  line: 'rgba(255,255,255,0.22)',
  skin: '#e7b88e', skinShade: '#c99167', hair: '#3a2a20',
  shirt: '#f6f3ec', shirtShade: '#d6d1c4', shorts: '#1f3b4d', shortsShade: '#172e3c',
  boot: '#18232a', kit: '#1d3a5c', kitShade: '#142a44', sock: '#f6f3ec', sockShade: '#cfcabd', gk: '#f2c14e', gkShade: '#d6a439', keeper: '#1b2226', keeperShade: '#11171a', glove: '#f6f3ec',
  post: '#f7f5ef', net: 'rgba(255,255,255,0.38)',
  cream: '#f6f1e3', gold: '#f2b53a', goldDeep: '#d9932a', bronze: '#6e4b2e',
  mint: '#5fd3a5', fade: '#0e3a3b', slate: '#121b21', coral: '#e8664f',
};

/* ---------- Player rig (side view, facing right) ---------- */
const LEN = { torso: 168, neck: 18, head: 36, up: 86, fore: 80, thigh: 122, shin: 118, foot: 46 };
const GROUND = 998;
const FRONT = GROUND + 12;
const PLANT = [560, GROUND];
const vec = (a, l) => [Math.sin(a * D) * l, Math.cos(a * D) * l];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];

// Hip is solved from whichever foot carries the weight (w: 0 = plant foot, 1 = kicking foot at kx)
function rig(p) {
  const sK = vec(p.sT, LEN.thigh), sA = vec(p.sS, LEN.shin);
  const kK = vec(p.kT, LEN.thigh), kA = vec(p.kS, LEN.shin);
  const hipP = [PLANT[0] - sK[0] - sA[0], PLANT[1] - sK[1] - sA[1]];
  const hipK = [p.kx - kK[0] - kA[0], GROUND - kK[1] - kA[1]];
  const hb = mix(mix(hipP, hipK, p.w), [p.hx || 0, p.hy || 0], p.free || 0);
  const hip = [hb[0], hb[1] - p.lift];
  const sk = add(hip, sK), sa = add(sk, sA), st = add(sa, vec(p.sS + p.sF, LEN.foot));
  const kk = add(hip, kK), ka = add(kk, kA), kt = add(ka, vec(p.kS + p.kF, LEN.foot));
  const up = [Math.sin(p.torso * D), -Math.cos(p.torso * D)];
  const sh = [hip[0] + up[0] * (LEN.torso - 14), hip[1] + up[1] * (LEN.torso - 14)];
  const top = [hip[0] + up[0] * LEN.torso, hip[1] + up[1] * LEN.torso];
  const hd = [top[0] + up[0] * (LEN.neck + LEN.head), top[1] + up[1] * (LEN.neck + LEN.head)];
  const fe = add(sh, vec(p.aF1, LEN.up)), fh = add(fe, vec(p.aF2, LEN.fore));
  const be = add(sh, vec(p.aB1, LEN.up)), bh = add(be, vec(p.aB2, LEN.fore));
  return { hip, sk, sa, st, kk, ka, kt, top, sh, hd, fe, fh, be, bh, up };
}

const Seg = ({ a, b, w, c }) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
);
const Part = ({ at, a, children }) => <g transform={`translate(${at[0]} ${at[1]}) rotate(${-a})`}>{children}</g>;

/* Soft-body limbs: one continuous outline through hip-knee-ankle, so joints bend like flesh */
const prof = (keys) => (x) => {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [x0, y0] = keys[i], [x1, y1] = keys[i + 1];
    if (x <= x1) { const k = (x - x0) / (x1 - x0); return y0 + (y1 - y0) * (k * k * (3 - 2 * k)); }
  }
  return keys[keys.length - 1][1];
};
const LEG_W = prof([[0, 46], [0.18, 45], [0.4, 37], [0.5, 31], [0.6, 34], [0.74, 27], [0.92, 19], [1, 18]]);
const ARM_W = prof([[0, 28], [0.3, 25], [0.48, 19], [0.58, 20], [0.9, 15], [1, 14]]);
function chainAt(a, b, c, s) {
  const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const d = s * (l1 + l2);
  return d <= l1 ? mix(a, b, d / l1) : mix(b, c, (d - l1) / l2);
}
function crClosed(P) {
  const n = P.length;
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
// side: [lo, hi] fraction of half-width on each side of the centreline (default full limb)
function limb(a, b, c, wf, s0 = 0, s1 = 1, side = [-1, 1], grow = 0) {
  const N = 14, S = [];
  for (let i = 0; i <= N; i++) S.push(s0 + ((s1 - s0) * i) / N);
  const pts = S.map((x) => chainAt(a, b, c, x));
  const tang = S.map((x) => {
    const e = 0.06, p = chainAt(a, b, c, Math.max(0, x - e)), q = chainAt(a, b, c, Math.min(1, x + e));
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [(q[0] - p[0]) / L, (q[1] - p[1]) / L];
  });
  const Lp = [], Rp = [];
  S.forEach((x, i) => {
    const w = (wf(x) + grow) / 2, n = [-tang[i][1], tang[i][0]];
    Lp.push([pts[i][0] + n[0] * w * side[1], pts[i][1] + n[1] * w * side[1]]);
    Rp.push([pts[i][0] + n[0] * w * side[0], pts[i][1] + n[1] * w * side[0]]);
  });
  return crClosed([...Lp, ...Rp.reverse()]);
}

function Boot({ at, a, dark }) {
  return (
    <Part at={at} a={a}>
      <path d="M -16 -10 L 12 -12 C 28 -8 46 0 56 10 C 58 18 52 22 42 22 L -14 22 C -21 14 -21 -2 -16 -10 Z" fill={dark ? '#0f171c' : C.boot} />
      <path d="M -14 20 L 44 20" stroke="#f6f3ec" strokeWidth={3} opacity={0.5} />
      <path d="M 4 -4 L 30 2" stroke="#f6f3ec" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
    </Part>
  );
}
function Leg({ hip, k, a, s, f, shade }) {
  const sk = shade ? C.skinShade : C.skin, kit = shade ? C.kitShade : C.kit, sock = shade ? C.sockShade : C.sock;
  return (
    <g>
      <path d={limb(hip, k, a, LEG_W)} fill={sk} />
      <path d={limb(hip, k, a, LEG_W, 0.04, 0.96, [0.25, 1])} fill={C.skinShade} opacity={shade ? 0.55 : 0.7} />
      <path d={limb(hip, k, a, LEG_W, 0.64, 1, [-1, 1], 2)} fill={sock} />
      <path d={limb(hip, k, a, LEG_W, 0.66, 0.99, [0.2, 1], 2)} fill={C.sockShade} opacity={0.8} />
      <path d={limb(hip, k, a, LEG_W, 0.635, 0.665, [-1, 1], 3)} fill={kit} />
      <Boot at={a} a={s + f - 90} dark={shade} />
      <path d={limb(hip, k, a, LEG_W, -0.02, 0.27, [-1, 1], 16)} fill={kit} />
      <path d={limb(hip, k, a, LEG_W, -0.02, 0.27, [0.35, 1], 16)} fill={C.kitShade} opacity={0.9} />
      {!shade && <path d={limb(hip, k, a, LEG_W, 0, 0.27, [-0.1, 0.1], 16)} fill="#f6f3ec" />}
    </g>
  );
}
function Arm({ s, e, h, shade }) {
  const sk = shade ? C.skinShade : C.skin, kit = shade ? C.kitShade : C.kit;
  const dir = [h[0] - e[0], h[1] - e[1]], L = Math.hypot(dir[0], dir[1]) || 1;
  const hand = [h[0] + (dir[0] / L) * 8, h[1] + (dir[1] / L) * 8];
  return (
    <g>
      <path d={limb(s, e, h, ARM_W)} fill={sk} />
      <path d={limb(s, e, h, ARM_W, 0.05, 0.95, [0.3, 1])} fill={C.skinShade} opacity={0.6} />
      <circle cx={hand[0]} cy={hand[1]} r={13} fill={sk} />
      <path d={limb(s, e, h, ARM_W, -0.04, 0.25, [-1, 1], 12)} fill={kit} />
      <path d={limb(s, e, h, ARM_W, 0.2, 0.25, [-1, 1], 12)} fill="#f6f3ec" />
    </g>
  );
}
function Player({ pose }) {
  const r = rig(pose);
  const contact = (p) => Math.max(0, 1 - (GROUND + 12 - p[1]) / 140);
  return (
    <g>
      <ellipse cx={r.hip[0] - 60} cy={FRONT + 4} rx={160} ry={12} fill="rgba(8,40,40,0.16)" />
      <ellipse cx={r.st[0] - 14} cy={FRONT + 3} rx={56} ry={7} fill="rgba(8,40,40,0.34)" opacity={contact(r.sa)} />
      <ellipse cx={r.kt[0] - 14} cy={FRONT + 3} rx={56} ry={7} fill="rgba(8,40,40,0.34)" opacity={contact(r.ka)} />
      <Arm s={r.sh} e={r.be} h={r.bh} shade />
      <Leg hip={r.hip} k={r.sk} a={r.sa} s={pose.sS} f={pose.sF} shade />
      <Part at={r.hip} a={-pose.torso}>
        <path d="M -9 -164 L -7 -198 L 15 -198 L 15 -164 Z" fill={C.skinShade} />
        <path d="M -31 4 C -39 -50 -43 -112 -39 -150 C -35 -168 -16 -175 2 -175 C 24 -175 39 -165 41 -140 C 43 -108 37 -50 33 4 Z" fill={C.kit} />
        <path d="M -31 4 C -39 -50 -43 -112 -39 -150 L -24 -150 C -26 -100 -21 -50 -15 4 Z" fill={C.kitShade} />
        <path d="M -9 -150 C -7 -100 -5 -50 -1 4" fill="none" stroke="#f6f3ec" strokeWidth={7} />
        <path d="M -4 -174 C 6 -164 20 -163 30 -170" fill="none" stroke="#f6f3ec" strokeWidth={6} strokeLinecap="round" />
        <rect x={-33} y={-14} width={68} height={22} rx={4} fill={C.kit} />
      </Part>
      <Leg hip={r.hip} k={r.kk} a={r.ka} s={pose.kS} f={pose.kF} />
      <g transform={`translate(${r.hd[0]} ${r.hd[1]}) rotate(${pose.torso * 0.35 + 8 * (pose.cupped || 0)})`}>
        <path d="M -26 -20 C -24 -38 -6 -44 12 -40 C 28 -36 34 -20 32 -4 L 38 5 L 32 9 C 32 22 26 34 12 36 C -4 38 -20 32 -26 18 C -32 6 -30 -8 -26 -20 Z" fill={C.skin} />
        <ellipse cx={-4} cy={3} rx={6} ry={9} fill={C.skinShade} />
        <path d="M -31 -4 C -37 -34 -14 -51 10 -49 C 29 -49 41 -36 37 -19 C 31 -26 20 -28 8 -26 C 0 -16 -4 -6 -9 4 C -15 6 -20 12 -24 20 C -31 12 -31 4 -31 -4 Z" fill={C.hair} />
      </g>
      <Arm s={r.sh} e={r.fe} h={r.fh} />
    </g>
  );
}

// Poses read like mocap keys: weight transfer, a lagging shin that whips through, arm counter-balance
const KX_RUN = 322, KX_LAND = 660;
const base = { w: 0, kx: KX_RUN, lift: 0, kF: 100, sF: 88, free: 0, hx: 0, hy: 0, cupped: 0 };
const POSE = {
  stride:  { ...base, w: 1, torso: 16, kT: -6, kS: -28, kF: 100, sT: 38, sS: 14, sF: 84, aF1: -38, aF2: -12, aB1: 48, aB2: 84 },
  plant:   { ...base, w: 0, torso: 15, kT: -22, kS: -58, kF: 108, sT: 24, sS: 6, sF: 84, aF1: 20, aF2: 50, aB1: 10, aB2: 40 },
  load:    { ...base, torso: 12, kT: -22, kS: -76, kF: 108, sT: 18, sS: -12, aF1: 62, aF2: 88, aB1: -34, aB2: -12 },
  windup: { ...base, torso: 14, kT: -18, kS: -86, kF: 46, sT: 18, sS: -10, aF1: 80, aF2: 104, aB1: -46, aB2: -26 },
  drive: { ...base, torso: 17, kT: 8, kS: -58, kF: 50, sT: 18, sS: -12, aF1: 92, aF2: 114, aB1: -44, aB2: -22 },
  contact: { ...base, torso: 19, kT: 32, kS: 2, kF: 70, sT: 18, sS: -14, aF1: 98, aF2: 120, aB1: -40, aB2: -18 },
  release: { ...base, torso: 15, kT: 58, kS: 32, kF: 66, sT: 12, sS: -12, sF: 92, lift: 4, aF1: 104, aF2: 128, aB1: -50, aB2: -30 },
  follow: { ...base, torso: 8, kT: 72, kS: 48, kF: 72, sT: 4, sS: -12, sF: 100, lift: 12, aF1: 100, aF2: 126, aB1: -58, aB2: -38 },
  land:    { ...base, w: 1, kx: KX_LAND, torso: 10, kT: 14, kS: -2, kF: 92, sT: -26, sS: -72, sF: 120, aF1: 52, aF2: 84, aB1: -28, aB2: -8 },
  settle:  { ...base, w: 1, kx: KX_LAND, torso: 5, kT: 6, kS: 0, kF: 90, sT: -12, sS: -16, sF: 104, aF1: 22, aF2: 40, aB1: -14, aB2: 0 },
  cheer:   { ...base, w: 1, kx: KX_LAND, torso: -6, kT: 4, kS: 0, kF: 90, sT: -10, sS: -12, sF: 100, lift: 4, aF1: 165, aF2: 175, aB1: -165, aB2: -175 },
  despair: { ...base, w: 1, kx: KX_LAND, torso: -2, kT: 8, kS: 2, kF: 90, sT: -8, sS: -10, sF: 98, aF1: 120, aF2: -136, aB1: 114, aB2: -140, cupped: 1 },
};
const contactRig = rig(POSE.contact);
const BR = 34;
const BALL0 = [contactRig.kt[0] + 22, FRONT - BR];

const RUN_P = 0.8, RUN_V = 600, PLANT_LEAD = 0.36;
const PLANT_HIP = rig(POSE.plant).hip;
function runPose(T, tPlant) {
  const th = (2 * Math.PI * (T - tPlant)) / RUN_P + Math.PI / 2 - 0.35 - Math.PI;
  const leg = (q) => {
    const thigh = -4 + 30 * Math.sin(q);
    const knee = 28 + 78 * Math.max(0, -Math.sin(q - 0.55));
    return [thigh, thigh - knee];
  };
  const [kT, kS] = leg(th), [sT, sS] = leg(th + Math.PI);
  const reach = (t1, t2) => 122 * Math.cos(t1 * D) + 118 * Math.cos(t2 * D);
  const hy = GROUND - Math.max(reach(kT, kS), reach(sT, sS)) - 4;
  const hx = PLANT_HIP[0] - RUN_V * (tPlant - T);
  const aF1 = 46 * Math.sin(th), aB1 = 46 * Math.sin(th + Math.PI);
  return { ...base, free: 1, hx, hy, torso: 15, kT, kS, kF: 96, sT, sS, sF: 96,
    aF1, aF2: aF1 + 75, aB1, aB2: aB1 + 75 };
}
function strikeKeys(tC, after) {
  return [
    { t: tC - PLANT_LEAD, v: { ...POSE.plant, free: 0 } },
    { t: tC - 0.17, v: POSE.windup },
    { t: tC, v: POSE.contact },
    { t: tC + 0.32, v: POSE.release },
    { t: tC + 0.85, v: POSE.follow },
    { t: tC + 1.5, v: POSE.land },
    { t: tC + 2.4, v: POSE.settle },
    ...after,
  ];
}
function playerPose(T, tC, after) {
  const tPlant = tC - PLANT_LEAD;
  const k = prog(T, tPlant - 0.12, tPlant, MOTION.glide);
  if (k >= 1) return keyed(T, strikeKeys(tC, after));
  const run = runPose(T, tPlant);
  if (k <= 0) return run;
  const pl = { ...POSE.plant, free: 0, hx: run.hx, hy: run.hy };
  const o = {};
  for (const key in run) o[key] = run[key] + (pl[key] - run[key]) * k;
  return o;
}
function runCamX(T, tC, settled) {
  const tPlant = tC - PLANT_LEAD;
  const hx = PLANT_HIP[0] - RUN_V * (tPlant - T);
  return hx + 330 + (settled - hx - 330) * prog(T, tPlant - 0.9, tPlant + 0.3, MOTION.glide);
}

/* ---------- Ball ---------- */
function Ball({ x, y, s, rot, ghost }) {
  const r = 26 * s;
  if (ghost) return <circle cx={x} cy={y} r={BR * s} fill={C.cream} opacity={ghost} />;
  const pent = (cx, cy, rr) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = (-90 + i * 72) * D;
      return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
    }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${(s * BR) / 26})`}>
      <circle r={26} fill="#f8f6f0" />
      <g clipPath="url(#ballClip)" transform={`rotate(${rot})`}>
        <polygon points={pent(0, 0, 9)} fill="#1d2a2c" />
        {[0, 72, 144, 216, 288].map((a) => (
          <polygon key={a} points={pent(Math.sin(a * D) * 24, -Math.cos(a * D) * 24, 8)} fill="#1d2a2c" />
        ))}
      </g>
      <circle r={26} fill="url(#ballShade)" />
    </g>
  );
}
const groundAt = (s) => (s >= 0.8 ? FRONT - ((1 - s) / 0.2) * (FRONT - 900) : Math.max(858, 900 - ((0.8 - s) / 0.06) * 42));
function BallShadow({ x, s, y }) {
  const gy = groundAt(s);
  const h = Math.max(0, gy - BR * s - y);
  const k = Math.max(0, 1 - h / 260);
  return <ellipse cx={x} cy={gy + 2} rx={38 * s * (0.6 + 0.4 * k)} ry={7 * s} fill="rgba(8,40,40,0.3)" opacity={k} />;
}

/* ---------- Goal + net ---------- */
const G = { fx0: 1160, fx1: 2260, fy0: 450, fy1: 900, bx0: 1228, bx1: 2192, by0: 522, by1: 858 };
function Net({ hit, amp }) {
  const pull = (x, y) => {
    if (!amp) return [x, y];
    const dx = hit[0] - x, dy = hit[1] - y;
    const f = amp * 0.42 * Math.exp(-(dx * dx + dy * dy) / (2 * 95 * 95));
    return [x + dx * f, y + dy * f];
  };
  const lines = [];
  const N = 14;
  for (let x = G.bx0; x <= G.bx1 + 1; x += 26) {
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(pull(x, G.by0 + ((G.by1 - G.by0) * i) / N).join(','));
    lines.push(pts.join(' '));
  }
  for (let y = G.by0; y <= G.by1 + 1; y += 26) {
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(pull(G.bx0 + ((G.bx1 - G.bx0) * i) / N, y).join(','));
    lines.push(pts.join(' '));
  }
  const side = [];
  for (let k = 0; k <= 1.001; k += 1 / 11) {
    side.push([[G.fx0, G.fy0 + (G.fy1 - G.fy0) * k], [G.bx0, G.by0 + (G.by1 - G.by0) * k]]);
    side.push([[G.fx1, G.fy0 + (G.fy1 - G.fy0) * k], [G.bx1, G.by0 + (G.by1 - G.by0) * k]]);
  }
  for (let k = 0; k <= 1.001; k += 1 / 30)
    side.push([[G.fx0 + (G.fx1 - G.fx0) * k, G.fy0], [G.bx0 + (G.bx1 - G.bx0) * k, G.by0]]);
  return (
    <g>
      <polygon points={`${G.bx0},${G.by0} ${G.bx1},${G.by0} ${G.bx1},${G.by1} ${G.bx0},${G.by1}`} fill="rgba(10,50,50,0.12)" />
      {lines.map((p, i) => <polyline key={i} points={p} fill="none" stroke={C.net} strokeWidth={1.6} />)}
      {side.map(([a, b], i) => <line key={'s' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.net} strokeWidth={1.4} />)}
      <polyline points={`${G.fx0},${G.fy1} ${G.bx0},${G.by1} ${G.bx1},${G.by1} ${G.fx1},${G.fy1}`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
      <polyline points={`${G.bx0},${G.by1} ${G.bx0},${G.by0} ${G.bx1},${G.by0} ${G.bx1},${G.by1}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} />
    </g>
  );
}
function GoalShadow() {
  const d = 150;
  return (
    <g fill="rgba(8,40,40,0.2)">
      <polygon points={`${G.fx0 - 10},${G.fy1} ${G.fx0 + 10},${G.fy1} ${G.fx0 - d + 10},${G.fy1 + 40} ${G.fx0 - d - 14},${G.fy1 + 40}`} />
      <polygon points={`${G.fx1 - 10},${G.fy1} ${G.fx1 + 10},${G.fy1} ${G.fx1 - d + 10},${G.fy1 + 40} ${G.fx1 - d - 14},${G.fy1 + 40}`} />
      <polygon points={`${G.fx0 - d - 14},${G.fy1 + 40} ${G.fx1 - d + 10},${G.fy1 + 40} ${G.fx1 - d + 10},${G.fy1 + 50} ${G.fx0 - d - 14},${G.fy1 + 50}`} />
      <polygon points={`${G.bx0},${G.by1} ${G.bx1},${G.by1} ${G.fx1},${G.fy1} ${G.fx0},${G.fy1}`} opacity={0.6} />
    </g>
  );
}
function Frame({ wobble = 0 }) {
  return (
    <g>
      <rect x={G.fx0 - 10 + wobble} y={G.fy0 - 10} width={20} height={G.fy1 - G.fy0 + 10} rx={4} fill={C.post} />
      <rect x={G.fx0 + 4 + wobble} y={G.fy0} width={6} height={G.fy1 - G.fy0} fill="rgba(0,0,0,0.08)" />
      <rect x={G.fx1 - 10} y={G.fy0 - 10} width={20} height={G.fy1 - G.fy0 + 10} rx={4} fill={C.post} />
      <rect x={G.fx0 - 10 + wobble} y={G.fy0 - 10} width={G.fx1 - G.fx0 + 20 - wobble} height={20} rx={4} fill={C.post} />
    </g>
  );
}

/* ---------- Keeper (front view) ---------- */
// land: 0 = upright/diving, 1 = on his side, propped on the ground-side elbow, top knee up, head lifted toward the ball
function Keeper({ x, y, rot, aL, aR, spread, land = 0, dir = 1 }) {
  const LAND = dir > 0 ? { '-1': [-38, 4], '1': [-16, -34] } : { '-1': [16, 34], '1': [38, -4] };
  const ARM_LAND = { lead: [174, 0], trail: [166, 2] };
  const leg = (side) => {
    const st = (side * Math.atan2(spread * 0.7, 102)) / D, ss = (side * Math.atan2(spread * 0.3, 103)) / D;
    const L = LAND[String(side)];
    const h = [side * 20, 0];
    const k = add(h, vec(st + (L[0] - st) * land, 102));
    const f = add(k, vec(ss + (L[1] - ss) * land, 103));
    return (
      <g key={'l' + side}>
        <path d={limb(h, k, f, LEG_W)} fill={C.skin} />
        <path d={limb(h, k, f, LEG_W, 0.04, 0.96, side > 0 ? [-1, -0.2] : [0.2, 1])} fill={C.skinShade} opacity={0.7} />
        <path d={limb(h, k, f, LEG_W, 0.62, 1, [-1, 1], 2)} fill={C.gk} />
        <path d={limb(h, k, f, LEG_W, 0.64, 1, side > 0 ? [-1, -0.2] : [0.2, 1], 2)} fill={C.gkShade} />
        <path d={side > 0 ? `M ${f[0] - 12} ${f[1] - 6} L ${f[0] + 14} ${f[1] - 6} C ${f[0] + 26} ${f[1] - 2} ${f[0] + 30} ${f[1] + 10} ${f[0] + 22} ${f[1] + 14} L ${f[0] - 14} ${f[1] + 14} Z` : `M ${f[0] + 12} ${f[1] - 6} L ${f[0] - 14} ${f[1] - 6} C ${f[0] - 26} ${f[1] - 2} ${f[0] - 30} ${f[1] + 10} ${f[0] - 22} ${f[1] + 14} L ${f[0] + 14} ${f[1] + 14} Z`} fill={C.boot} />
      </g>
    );
  };
  const arm = (side, a0) => {
    const tgt = side === -dir ? ARM_LAND.lead : ARM_LAND.trail;
    const a = a0 + (tgt[0] - a0) * land, a2 = a + 10 + tgt[1] * land;
    const s = [side * 40, -146];
    const e = add(s, [side * Math.sin(a * D) * 76, Math.cos(a * D) * 76]);
    const h = add(e, [side * Math.sin(a2 * D) * 66, Math.cos(a2 * D) * 66]);
    return (
      <g key={side}>
        <path d={limb(s, e, h, ARM_W, 0, 1, [-1, 1], 6)} fill={C.gk} />
        <path d={limb(s, e, h, ARM_W, 0.05, 0.95, side > 0 ? [-1, -0.25] : [0.25, 1], 6)} fill={C.gkShade} />
        <Part at={h} a={side * a2}>
          <rect x={-15} y={-4} width={30} height={16} rx={4} fill={C.keeper} />
          <rect x={-15} y={2} width={30} height={4} fill={C.gk} />
          <path d="M -18 10 C -21 22 -21 34 -18 42 L 18 42 C 21 34 21 22 18 10 Z" fill={C.glove} />
          {[-13.5, -4.5, 4.5, 13.5].map((fx, i) => (
            <rect key={i} x={fx - 4.6} y={34} width={9.2} height={i === 0 || i === 3 ? 20 : 25} rx={4.6} fill={C.glove} />
          ))}
          <path d="M -18 26 C -18 32 -14 38 -6 38 L 6 38 C 14 38 18 32 18 26" fill="none" stroke="#d9d4c6" strokeWidth={3} />
          <ellipse cx={-side * 21} cy={26} rx={6} ry={13} transform={`rotate(${side * 28} ${-side * 21} 26)`} fill={C.glove} />
          <rect x={-16} y={14} width={32} height={6} rx={3} fill={C.gk} opacity={0.9} />
        </Part>
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(0.8)`}>
      {leg(-1)}{leg(1)}
      <path d="M -46 -20 L 46 -20 L 50 44 L 6 48 L 0 30 L -6 48 L -50 44 Z" fill={C.keeper} />
      <path d="M -11 -160 L -11 -186 L 11 -186 L 11 -160 Z" fill={C.skinShade} />
      <path d="M -40 0 C -44 -60 -50 -120 -48 -146 C -42 -166 -22 -171 0 -171 C 22 -171 42 -166 48 -146 C 50 -120 44 -60 40 0 Z" fill={C.gk} />
      <path d="M 18 -170 C 42 -166 50 -140 48 -120 C 46 -80 44 -40 40 0 L 24 0 C 28 -60 30 -120 18 -170 Z" fill={C.gkShade} />
      <path d="M -14 -170 L 0 -152 L 14 -170" fill="none" stroke={C.keeper} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -40 -6 L 40 -6" stroke={C.keeper} strokeWidth={8} />
      {arm(-1, aL)}{arm(1, aR)}
      <g transform={`rotate(${-dir * 42 * land} 0 -178)`}>
      <ellipse cx={-28} cy={-204} rx={6} ry={9} fill={C.skinShade} />
      <ellipse cx={28} cy={-204} rx={6} ry={9} fill={C.skinShade} />
      <ellipse cx={0} cy={-204} rx={27} ry={33} fill={C.skin} />
      <path d="M 10 -236 C 30 -228 32 -186 10 -172 C 20 -190 22 -218 10 -236 Z" fill={C.skinShade} opacity={0.7} />
      <path d="M -29 -208 C -34 -244 34 -246 29 -208 C 24 -224 8 -228 0 -226 C -10 -228 -24 -224 -29 -208 Z" fill={C.hair} />
      </g>
    </g>
  );
}

/* ---------- Pitch world ---------- */
function Backdrop() {
  return (
    <g>
      <rect x={-2400} y={-400} width={5200} height={1170} fill={C.sky} />
      <rect x={-2400} y={300} width={5200} height={470} fill={C.skyDeep} opacity={0.35} />
      <rect x={-2400} y={760} width={5200} height={800} fill={C.floor} />
      <rect x={-2400} y={760} width={5200} height={8} fill={C.floorDeep} opacity={0.6} />
      <line x1={-2400} y1={900} x2={2800} y2={900} stroke={C.line} strokeWidth={4} />
      <line x1={-2400} y1={1060} x2={2800} y2={1060} stroke={C.line} strokeWidth={4} opacity={0.6} />
      <line x1={1000} y1={900} x2={940} y2={1060} stroke={C.line} strokeWidth={4} />
    </g>
  );
}
function Defs() {
  return (
    <defs>
      <clipPath id="ballClip"><circle r={26} /></clipPath>
      <radialGradient id="ballShade" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#0c2a2b" stopOpacity="0.45" />
      </radialGradient>
    </defs>
  );
}
function camT(f, z, sx = 0, sy = 0) {
  return `translate(${960 + sx} ${540 + sy}) scale(${z}) translate(${-f[0]} ${-f[1]})`;
}
const shake = (dt, amt) => {
  const d = decay(dt, 5) * amt;
  return [Math.sin(dt * 47) * d, Math.cos(dt * 39) * d * 0.7];
};
function bez(p0, c, p1, s) {
  const u = 1 - s;
  return [u * u * p0[0] + 2 * u * s * c[0] + s * s * p1[0], u * u * p0[1] + 2 * u * s * c[1] + s * s * p1[1]];
}

const StageWrap = ({ children, T }) => (
  <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: 'Anton, Impact, sans-serif' }}>
    {children}
  </div>
);
const Fade = ({ o }) => <div style={{ position: 'absolute', inset: 0, background: C.fade, opacity: o, pointerEvents: 'none' }} />;

function Letters({ text, T, start, stagger, size, colors, from = 110 }) {
  return (
    <div style={{ display: 'flex', gap: size * 0.02, lineHeight: 1 }}>
      {text.split('').map((ch, i) => {
        const k = prog(T, start + i * stagger, start + i * stagger + 0.9, MOTION.enter);
        return (
          <div key={i} style={{ overflow: 'hidden', padding: '0.06em 0.01em', width: ch === ' ' ? size * 0.25 : 'auto' }}>
            <div style={{ fontSize: size, color: colors(i), transform: `translateY(${(1 - k) * from}%)`, opacity: Math.min(1, k * 1.6), letterSpacing: '0.01em' }}>{ch === ' ' ? '\u00a0' : ch}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Trophy ---------- */
function Trophy({ shine }) {
  const sx = -260 + shine * 520;
  return (
    <svg viewBox="-200 -200 400 400" width={440} height={440} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id="cupClip"><path d="M -112 -150 L 112 -150 Q 108 20 0 62 Q -108 20 -112 -150 Z" /></clipPath>
      </defs>
      <path d="M -104 -122 C -196 -128 -186 4 -70 6" fill="none" stroke={C.goldDeep} strokeWidth={22} strokeLinecap="round" />
      <path d="M 104 -122 C 196 -128 186 4 70 6" fill="none" stroke={C.goldDeep} strokeWidth={22} strokeLinecap="round" />
      <path d="M -112 -150 L 112 -150 Q 108 20 0 62 Q -108 20 -112 -150 Z" fill={C.gold} />
      <g clipPath="url(#cupClip)">
        <rect x={30} y={-160} width={120} height={240} fill={C.goldDeep} opacity={0.55} />
        <rect x={sx} y={-200} width={44} height={320} fill="#fff6dc" opacity={0.6} transform={`rotate(18 ${sx} 0)`} />
      </g>
      <rect x={-124} y={-170} width={248} height={26} rx={10} fill={C.goldDeep} />
      <rect x={-20} y={58} width={40} height={52} fill={C.goldDeep} />
      <rect x={-50} y={102} width={100} height={20} rx={6} fill={C.gold} />
      <rect x={-86} y={122} width={172} height={54} rx={8} fill={C.bronze} />
      <rect x={-46} y={138} width={92} height={22} rx={3} fill={C.gold} opacity={0.85} />
      <polygon fill={C.cream} points={Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 18 : 40, a = (-90 + i * 36) * D;
        return `${Math.cos(a) * r},${-62 + Math.sin(a) * r}`;
      }).join(' ')} />
    </svg>
  );
}

function rand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const CONFETTI = (() => {
  const r = rand(42), cols = [C.gold, C.cream, C.mint, C.coral];
  return Array.from({ length: 70 }, () => ({
    x: r() * 1920, d: r() * 1.6, v: 160 + r() * 160, sw: 20 + r() * 50, ph: r() * 6.28,
    spin: 120 + r() * 300, c: cols[Math.floor(r() * cols.length)], w: 10 + r() * 10, h: 16 + r() * 14,
  }));
})();
function Confetti({ T, start }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {CONFETTI.map((p, i) => {
        const t = T - start - p.d;
        if (t < 0) return null;
        const y = -40 + t * p.v, x = p.x + Math.sin(t * 1.6 + p.ph) * p.sw;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: p.w, height: p.h, background: p.c, transform: `rotate(${t * p.spin}deg) scaleY(${Math.cos(t * 4 + p.ph)})` }} />;
      })}
    </div>
  );
}
function Sparkle({ x, y, s, o }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: 18, height: 18, background: C.cream, opacity: o, transform: `translate(-50%,-50%) rotate(45deg) scale(${s})` }} />;
}

/* ================= GOAL FILM ================= */
function GoalPiece() {
  const { T, CUES, authoredTotal } = useComposition();
  const tC = CUES.Flight - 0.3, tH = CUES.Net, end = authoredTotal;
  const pose = playerPose(T, tC, [{ t: tH + 0.4, v: POSE.settle }, { t: tH + 1.4, v: POSE.cheer }]);

  const HIT = [2178, 566];
  const ballAt = (t) => {
    if (t <= tC) return { x: BALL0[0], y: BALL0[1], s: 1, rot: 0 };
    if (t <= tH) {
      const s = (t - tC) / (tH - tC);
      const p = bez(BALL0, [(BALL0[0] + HIT[0]) / 2 + 160, 310], HIT, s);
      return { x: p[0], y: p[1], s: 1 - 0.24 * s, rot: (t - tC) * 540 };
    }
    const dt = t - tH;
    const x = tw(t, HIT[0], HIT[0] + 10, tH, tH + 0.25, MOTION.enter) - tw(t, 0, 20, tH + 0.25, tH + 1.6, MOTION.enter);
    let y = tw(t, HIT[1], HIT[1] + 6, tH, tH + 0.25, MOTION.enter);
    const sc = tw(t, 0.76, 0.74, tH, tH + 0.25);
    y += tw(t, 0, groundAt(0.74) - BR * 0.74 - HIT[1] - 6, tH + 0.25, tH + 0.9, MOTION.fall);
    if (t > tH + 0.9) y -= Math.sin(prog(t, tH + 0.9, tH + 1.3) * Math.PI) * 26;
    if (t > tH + 1.3) y -= Math.sin(prog(t, tH + 1.3, tH + 1.55) * Math.PI) * 8;
    return { x, y, s: sc, rot: (tH - tC) * 540 + 150 * (1 - Math.exp(-dt * 2.2)) };
  };
  const b = ballAt(T);
  const ghosts = T > tC + 0.05 && T < tH ? [0.06, 0.12, 0.18, 0.24].map((d, i) => ({ ...ballAt(T - d), o: 0.22 - i * 0.05 })) : [];

  const amp = T > tH ? decay(T - tH, 1.6) * (0.78 + 0.22 * Math.cos((T - tH) * 11)) * prog(T, tH, tH + 0.12) : 0;
  const kc = prog(T, tH - 0.85, tH - 0.55, MOTION.glide), kd = prog(T, tH - 0.55, tH + 0.35, MOTION.enter), kl = prog(T, tH + 0.35, tH + 1.0, MOTION.fall), kp = prog(T, tH + 1.0, tH + 2.0, MOTION.glide);
  const kLead = prog(T, tH - 0.6, tH + 0.05, MOTION.enter), kTrail = kLead;
  const keeper = {
    x: 1690 + kd * 95 + kl * 10, y: 728 + kc * 14 * (1 - kd) - kd * 56 + kl * 222 - kp * 4 + Math.sin(T * 3) * 2 * (1 - kc),
    rot: kd * 58 + kl * 30 - kp * 3, land: kl, dir: 1, aL: 35 + kc * 10 + 150 * kLead, aR: 35 + kc * 10 + 136 * kTrail, spread: 28 + kc * 8 - kd * 26,
  };

  const f0 = [runCamX(T, tC, 700), 790], f1 = [1500, 730], f2 = [1940, 660];
  const fk = prog(T, CUES.Flight - 0.2, tH, MOTION.glide), fk2 = prog(T, tH - 0.2, CUES.Goal + 3, MOTION.glide);
  const focus = mix(mix(f0, f1, fk), f2, fk2);
  const zoom = tw(T, 1.22, 0.98, CUES.Flight - 0.2, tH) + fk2 * 0.32 + prog(T, 0, CUES.Flight) * 0.05;
  const sh = shake(T - tH, T > tH ? 16 : 0);

  const dim = tw(T, 0, 0.72, CUES.Goal - 0.25, CUES.Goal + 0.45);
  const gUp = prog(T, CUES.Trophy - 0.15, CUES.Trophy + 0.65, MOTION.glide);
  const word = tw(T, 1.12, 1, CUES.Goal, CUES.Trophy) * (1 - gUp * 0.48);
  const tIn = prog(T, CUES.Trophy + 0.05, CUES.Trophy + 0.8, MOTION.enter);
  const tPop = prog(T, CUES.Trophy + 0.05, CUES.Trophy + 0.8, MOTION.pop);
  const circ = prog(T, CUES.Trophy - 0.1, CUES.Trophy + 0.65, MOTION.pop);
  const shine = prog(T, CUES.Trophy + 0.85, CUES.Trophy + 1.6, MOTION.glide);
  const fade = Math.max(1 - prog(T, 0, 0.6), prog(T, end - 0.7, end));
  const flash = T > tH ? decay(T - tH, 6) * 0.25 : 0;

  return (
    <StageWrap T={T}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <Defs />
        <g transform={camT(focus, zoom, sh[0], sh[1])}>
          <Backdrop />
          <Net hit={HIT} amp={amp} />
          <GoalShadow />
          <ellipse cx={keeper.x + Math.sign(keeper.rot) * Math.min(1, Math.abs(keeper.rot) / 60) * 60} cy={902} rx={70 + Math.min(1, Math.abs(keeper.rot) / 60) * 70} ry={9} fill="rgba(8,40,40,0.3)" opacity={Math.max(0.35, 1 - Math.max(0, 728 - keeper.y) / 120)} />
          {b.s < 0.8 && <BallShadow x={b.x} y={b.y} s={b.s} />}
          {b.s < 0.8 && <Ball x={b.x} y={b.y} s={b.s} rot={b.rot} />}
          <Keeper {...keeper} />
          {b.s >= 0.8 && <BallShadow x={b.x} y={b.y} s={b.s} />}
          {ghosts.map((g, i) => <Ball key={i} x={g.x} y={g.y} s={g.s} ghost={g.o} />)}
          {b.s >= 0.8 && <Ball x={b.x} y={b.y} s={b.s} rot={b.rot} />}
          <Frame />
          <Player pose={pose} />
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
      <div style={{ position: 'absolute', inset: 0, background: C.fade, opacity: dim }} />
      <div style={{ position: 'absolute', left: 960, top: 640, width: 560, height: 560, borderRadius: '50%', background: C.mint, transform: `translate(-50%,-50%) scale(${circ})`, opacity: Math.min(1, circ * 2) }} />
      {[[690, 420, 0.2], [1250, 470, 0.5], [740, 820, 0.9], [1210, 800, 1.2], [1300, 640, 1.6]].map(([x, y, d], i) => {
        const k = T - CUES.Trophy - 0.7 - d;
        const tw2 = k > 0 ? Math.max(0, Math.sin(k * 2.4)) : 0;
        return <Sparkle key={i} x={x} y={y} s={tw2} o={tw2} />;
      })}
      <div style={{ position: 'absolute', left: 960, top: 660, transform: `translate(-50%,-50%) translateY(${(1 - tIn) * 260}px) scale(${0.82 + 0.18 * tPop})`, opacity: tIn }}>
        <Trophy shine={shine} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center', transform: `translateY(-50%) translateY(${-gUp * 345}px) scale(${word})` }}>
        <Letters text="GOAL!!!" T={T} start={CUES.Goal} stagger={0.05} size={330} colors={(i) => (i > 3 ? C.gold : C.cream)} />
      </div>
      <Confetti T={T} start={CUES.Trophy + 0.3} />
      <Fade o={fade} />
    </StageWrap>
  );
}

/* ================= GAME OVER FILM ================= */
function Whistle({ blow, T }) {
  return (
    <svg viewBox="-220 -160 440 320" width={460} height={334} style={{ overflow: 'visible' }}>
      {[0, 1, 2].map((i) => {
        const k = ((T * 1.4 + i / 3) % 1);
        const r = 70 + k * 150;
        const a0 = -70 * D, a1 = 10 * D;
        const cx = 40, cy = -60;
        return (
          <path key={i} d={`M ${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`}
            fill="none" stroke={C.cream} strokeWidth={10} strokeLinecap="round" opacity={blow * (1 - k)} />
        );
      })}
      <path d="M 70 40 C 140 120 40 170 -40 150" fill="none" stroke={C.coral} strokeWidth={10} strokeLinecap="round" />
      <circle cx={70} cy={20} r={20} fill="none" stroke="#aeb6bb" strokeWidth={9} />
      <rect x={-190} y={-70} width={170} height={56} rx={12} fill="#c9d0d4" />
      <rect x={-190} y={-70} width={170} height={16} rx={8} fill="#e8ecee" />
      <circle cx={0} cy={0} r={72} fill="#c9d0d4" />
      <circle cx={-14} cy={-14} r={52} fill="#dfe4e7" />
      <circle cx={-26} cy={-26} r={20} fill="#f4f6f7" />
      <rect x={-46} y={-76} width={44} height={12} rx={4} fill="#5d676d" />
      <rect x={-200} y={-66} width={18} height={48} rx={6} fill="#5d676d" />
    </svg>
  );
}

function GameOverPiece() {
  const { T, CUES, authoredTotal } = useComposition();
  const tC = CUES.Flight - 0.3, tP = CUES.Post, end = authoredTotal;
  const pose = playerPose(T, tC, [{ t: tP + 0.35, v: POSE.settle }, { t: tP + 1.05, v: POSE.despair }]);

  const HIT = [G.fx0 - 10 - 24, 600];
  const ballAt = (t) => {
    if (t <= tC) return { x: BALL0[0], y: BALL0[1], s: 1, rot: 0 };
    if (t <= tP) {
      const s = (t - tC) / (tP - tC);
      const p = bez(BALL0, [(BALL0[0] + HIT[0]) * 0.45, (BALL0[1] + HIT[1]) / 2 - 70], HIT, 1 - Math.pow(1 - s, 1.9));
      return { x: p[0], y: p[1], s: 1 - 0.2 * s, rot: (t - tC) * 540 };
    }
    const r0 = (tP - tC) * 540;
    const a = prog(t, tP, tP + 0.75), bq = prog(t, tP + 0.75, tP + 1.35), c = prog(t, tP + 1.35, tP + 2.6, MOTION.enter);
    const x = HIT[0] - a * 170 - bq * 100 - c * 60;
    const sc = c > 0 ? 0.97 + 0.03 * c : bq > 0 ? 0.92 + 0.05 * bq : 0.8 + 0.12 * a;
    const rest = groundAt(sc) - BR * sc;
    let y = bq > 0 ? rest - Math.sin(bq * Math.PI) * 54 : HIT[1] + (rest - HIT[1]) * MOTION.fall(a);
    return { x, y, s: sc, rot: r0 - ((HIT[0] - x) / BR) * 57.3 };
  };
  const b = ballAt(T);
  const ghosts = T > tC + 0.05 && T < tP + 0.6 ? [0.06, 0.12, 0.18, 0.24].map((d, i) => ({ ...ballAt(T - d), o: 0.22 - i * 0.05 })) : [];
  const dtP = T - tP;
  const wob = dtP > 0 ? Math.sin(dtP * 55) * decay(dtP, 3) * 5 : 0;

  const kc = prog(T, tP - 0.95, tP - 0.7, MOTION.glide), kd = prog(T, tP - 0.7, tP + 0.25, MOTION.enter), kl = prog(T, tP + 0.25, tP + 0.9, MOTION.fall), kp = prog(T, tP + 0.9, tP + 1.9, MOTION.glide);
  const keeper = { land: kl, dir: -1, x: 1710 - kd * 160 - kl * 10, y: 728 + kc * 14 * (1 - kd) - kd * 50 + kl * 216 - kp * 4 + Math.sin(T * 3) * 2 * (1 - kc), rot: -(kd * 58 + kl * 30 - kp * 3), aR: 35 + kc * 10 + 150 * prog(T, tP - 0.65, tP, MOTION.enter), aL: 35 + kc * 10 + 136 * prog(T, tP - 0.65, tP, MOTION.enter), spread: 28 + kc * 8 - kd * 26 };

  const f0 = [runCamX(T, tC, 700), 790], f1 = [1150, 740], f2 = [950, 790];
  const fk = prog(T, CUES.Flight - 0.2, tP, MOTION.glide), fk2 = prog(T, tP + 0.3, CUES.Whistle + 2, MOTION.glide);
  const focus = mix(mix(f0, f1, fk), f2, fk2);
  const zoom = tw(T, 1.22, 1.2, CUES.Flight - 0.2, tP) - fk2 * 0.1 + prog(T, 0, CUES.Flight) * 0.05;
  const sh = shake(dtP, dtP > 0 ? 20 : 0);
  const ring = prog(T, tP, tP + 0.7, MOTION.enter);

  const dim = tw(T, 0, 0.8, CUES.Whistle - 0.3, CUES.Whistle + 0.4);
  const wIn = prog(T, CUES.Whistle, CUES.Whistle + 0.7, MOTION.enter);
  const wPop = prog(T, CUES.Whistle, CUES.Whistle + 0.7, MOTION.pop);
  const tB = CUES.Whistle + 0.75, blowing = T > tB && T < CUES.GameOver + 0.6;
  const blow = blowing ? Math.min(1, (T - tB) * 4) * Math.min(1, (CUES.GameOver + 0.6 - T) * 3) : 0;
  const jitter = blow ? Math.sin(T * 70) * 2.2 * blow : 0;
  const puff = T > tB ? decay(T - tB, 3) * 0.12 : 0;
  const wUp = prog(T, CUES.GameOver - 0.1, CUES.GameOver + 0.7, MOTION.glide);
  const fade = Math.max(1 - prog(T, 0, 0.6), prog(T, end - 0.7, end));

  return (
    <StageWrap T={T}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <Defs />
        <g transform={camT(focus, zoom, sh[0], sh[1])}>
          <Backdrop />
          <Net hit={[0, 0]} amp={0} />
          <GoalShadow />
          <ellipse cx={keeper.x + Math.sign(keeper.rot) * Math.min(1, Math.abs(keeper.rot) / 60) * 60} cy={902} rx={70 + Math.min(1, Math.abs(keeper.rot) / 60) * 70} ry={9} fill="rgba(8,40,40,0.3)" opacity={Math.max(0.35, 1 - Math.max(0, 728 - keeper.y) / 120)} />
          <Keeper {...keeper} />
          <BallShadow x={b.x} y={b.y} s={b.s} />
          {ghosts.map((g, i) => <Ball key={i} x={g.x} y={g.y} s={g.s} ghost={g.o} />)}
          <Ball x={b.x} y={b.y} s={b.s} rot={b.rot} />
          <Frame wobble={wob} />
          {ring > 0 && ring < 1 && [0, 0.25].map((d, i) => {
            const k = Math.max(0, ring - d) / (1 - d);
            return <circle key={i} cx={G.fx0} cy={HIT[1]} r={20 + k * 130} fill="none" stroke={C.cream} strokeWidth={5 * (1 - k)} opacity={1 - k} />;
          })}
          <Player pose={pose} />
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: C.slate, opacity: dim }} />
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: puff }} />
      <div style={{ position: 'absolute', left: 960, top: 560, transform: `translate(-50%,-50%) translateY(${(1 - wIn) * 300 - wUp * 270}px) scale(${(0.8 + 0.2 * wPop) * (1 - wUp * 0.42) * (1 + blow * 0.04)}) rotate(${-10 + jitter}deg)`, opacity: wIn }}>
        <Whistle blow={blow} T={T} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 620, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: 'translateY(-50%)' }}>
        <Letters text="GAME OVER" T={T} start={CUES.GameOver + 0.2} stagger={0.06} size={240} from={-110} colors={() => C.cream} />
        <div style={{ height: 4, background: C.coral, width: 620 * prog(T, CUES.GameOver + 0.85, CUES.GameOver + 1.6, MOTION.glide) }} />
      </div>
      <Fade o={fade} />
    </StageWrap>
  );
}


function GoalAnimation(props) {
  return <ScenePlayer scenes={SCENES.goal} Piece={GoalPiece} {...props} />;
}
function GameOverAnimation(props) {
  return <ScenePlayer scenes={SCENES.gameover} Piece={GameOverPiece} {...props} />;
}
window.FootballAnimations = { GoalAnimation, GameOverAnimation };
