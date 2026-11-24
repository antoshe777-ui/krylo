/*!
 * Krylo — open-source aerodynamic analysis engine
 * MIT License. See LICENSE.
 *
 * Contents
 *   naca4(code, n)            NACA 4-digit airfoil coordinates (cosine spacing)
 *   parseAirfoil(text)        Selig-format coordinates → points
 *   panel(points, alphaDeg)   Hess–Smith source/vortex panel method (inviscid, incompressible)
 *   polar(points, a0, a1, da) Lift/moment sweep
 *   sectionDrag(tc, Re)       Empirical profile-drag estimate (flat plate + form factor)
 *   liftingLine(opts)         Prandtl lifting-line theory (Glauert series), symmetric loading
 *   isa(h)                    International Standard Atmosphere, 0–20 km
 *   performance(opts)         Steady level flight: drag polar, L/D, stall, best glide
 * Works in the browser (window.Krylo) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  const PI = Math.PI, D2R = PI / 180;

  /* ---------- geometry ---------- */
  function naca4(code, n) {
    n = n || 80;                                   // points per surface
    const s = String(code).padStart(4, '0');
    if (!/^\d{4}$/.test(s)) throw new Error('NACA code must have 4 digits');
    const m = +s[0] / 100, p = +s[1] / 10;
    const tc = (+s.slice(2)) / 100;
    if (tc < 0.01 || tc > 0.40) throw new Error('Thickness (last two digits) must be 01–40 %');
    if (m > 0 && p === 0) throw new Error('Camber position (2nd digit) must be 1–9 when camber is used');
    const up = [], lo = [];
    for (let i = 0; i <= n; i++) {
      const x = 0.5 * (1 - Math.cos(PI * i / n));
      // closed trailing edge (−0.1036 coefficient)
      const yt = 5 * tc * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x);
      let yc = 0, dy = 0;
      if (m > 0 && p > 0) {
        if (x < p) { yc = m / (p * p) * (2 * p * x - x * x); dy = 2 * m / (p * p) * (p - x); }
        else { yc = m / ((1 - p) * (1 - p)) * ((1 - 2 * p) + 2 * p * x - x * x); dy = 2 * m / ((1 - p) * (1 - p)) * (p - x); }
      }
      const th = Math.atan(dy);
      up.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]);
      lo.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]);
    }
    // Order: trailing edge → lower surface → leading edge → upper surface → trailing edge (clockwise)
    const pts = lo.slice().reverse().concat(up.slice(1));
    pts.tc = tc; pts.name = 'NACA ' + s;
    return pts;
  }

  // Selig format: optional name line, then x y pairs from TE over the upper surface to LE and back along the lower surface.
  function parseAirfoil(text) {
    const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let name = 'Custom airfoil';
    const pts = [];
    for (const l of lines) {
      const nums = l.replace(/,/g, ' ').split(/\s+/).map(Number);
      if (nums.length >= 2 && nums.every(Number.isFinite)) pts.push([nums[0], nums[1]]);
      else if (!pts.length) name = l;
    }
    if (pts.length < 20) throw new Error('Need at least 20 coordinate points');
    // Selig goes upper first (counter-clockwise from TE); reverse to clockwise (lower first).
    const area = pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + (p[0] * q[1] - q[0] * p[1]); }, 0);
    const ordered = area > 0 ? pts.slice().reverse() : pts.slice();
    let tmax = 0;
    for (const p of ordered) for (const q of ordered) if (Math.abs(p[0] - q[0]) < 0.01) tmax = Math.max(tmax, Math.abs(p[1] - q[1]));
    ordered.tc = tmax; ordered.name = name;
    return ordered;
  }

  /* ---------- linear algebra ---------- */
  function solve(A, b) {                               // Gaussian elimination, partial pivoting
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      if (Math.abs(M[c][c]) < 1e-14) throw new Error('Singular system — check the airfoil geometry');
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }

  /* ---------- Hess–Smith panel method ----------
     Constant-strength source on each panel + one constant vortex strength on all panels.
     N flow-tangency conditions + 1 Kutta condition (equal tangential speed magnitude at the two trailing-edge panels).
     Reference: J. L. Hess & A. M. O. Smith (1967); J. Moran, Introduction to Theoretical and Computational Aerodynamics (1984). */
  function geometry(pts) {
    const N = pts.length - 1, P = [];
    for (let j = 0; j < N; j++) {
      const [x1, y1] = pts[j], [x2, y2] = pts[j + 1];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      P.push({ x1, y1, x2, y2, xm: (x1 + x2) / 2, ym: (y1 + y2) / 2, len, th: Math.atan2(dy, dx) });
    }
    return P;
  }
  function influence(P) {
    const N = P.length, LN = [], BT = [];
    for (let i = 0; i < N; i++) {
      LN.push(new Array(N)); BT.push(new Array(N));
      const { xm, ym } = P[i];
      for (let j = 0; j < N; j++) {
        const p = P[j];
        if (i === j) { LN[i][j] = 0; BT[i][j] = PI; continue; }
        const r1 = Math.hypot(xm - p.x1, ym - p.y1), r2 = Math.hypot(xm - p.x2, ym - p.y2);
        LN[i][j] = Math.log(r2 / r1);
        BT[i][j] = Math.atan2((p.x1 - xm) * (p.y2 - ym) - (p.y1 - ym) * (p.x2 - xm),
                              (p.x1 - xm) * (p.x2 - xm) + (p.y1 - ym) * (p.y2 - ym));
      }
    }
    return { LN, BT };
  }
  function panel(pts, alphaDeg, cache) {
    const P = (cache && cache.P) || geometry(pts), N = P.length;
    const { LN, BT } = (cache && cache.inf) || influence(P);
    const a = alphaDeg * D2R, A = [], b = [];
    const s = (i, j) => Math.sin(P[i].th - P[j].th), c = (i, j) => Math.cos(P[i].th - P[j].th);
    for (let i = 0; i < N; i++) {
      const row = new Array(N + 1).fill(0);
      for (let j = 0; j < N; j++) {
        row[j] = (s(i, j) * LN[i][j] + c(i, j) * BT[i][j]) / (2 * PI);
        row[N] += (c(i, j) * LN[i][j] - s(i, j) * BT[i][j]) / (2 * PI);
      }
      A.push(row); b.push(Math.sin(P[i].th - a));
    }
    // Kutta condition: Vt(first) + Vt(last) = 0
    const k = new Array(N + 1).fill(0);
    for (const i of [0, N - 1]) {
      for (let j = 0; j < N; j++) {
        k[j] += (s(i, j) * BT[i][j] - c(i, j) * LN[i][j]) / (2 * PI);
        k[N] += (s(i, j) * LN[i][j] + c(i, j) * BT[i][j]) / (2 * PI);
      }
    }
    A.push(k); b.push(-(Math.cos(a - P[0].th) + Math.cos(a - P[N - 1].th)));
    const x = solve(A, b), q = x.slice(0, N), g = x[N];
    // Surface tangential velocity and Cp (panels after the leading-edge point are on the upper surface)
    let iLE = 0; for (let j = 1; j < pts.length; j++) if (pts[j][0] < pts[iLE][0]) iLE = j;
    const out = [];
    let cl = 0, cm = 0, cx = 0, cy = 0;
    for (let i = 0; i < N; i++) {
      let vt = Math.cos(a - P[i].th);
      for (let j = 0; j < N; j++) {
        vt += q[j] * (s(i, j) * BT[i][j] - c(i, j) * LN[i][j]) / (2 * PI);
        vt += g * (s(i, j) * LN[i][j] + c(i, j) * BT[i][j]) / (2 * PI);
      }
      const cp = 1 - vt * vt;
      // outward normal for clockwise ordering: (−sinθ, cosθ) → force on body = −cp·n·ds
      const nx = -Math.sin(P[i].th), ny = Math.cos(P[i].th);
      const fx = -cp * nx * P[i].len, fy = -cp * ny * P[i].len;
      cx += fx; cy += fy;
      cm += -(P[i].xm - 0.25) * fy + P[i].ym * fx;   // nose-up positive, about quarter chord
      out.push({ x: P[i].xm, y: P[i].ym, cp, vt, upper: i >= iLE });
    }
    cl = cy * Math.cos(a) - cx * Math.sin(a);
    const cdp = cy * Math.sin(a) + cx * Math.cos(a);        // should be ≈ 0 (d'Alembert)
    const perim = P.reduce((t, p) => t + p.len, 0);
    const clGamma = 2 * g * perim;                          // Kutta–Joukowski: cl = 2Γ/(V c), Γ = γ·perimeter
    return { alpha: alphaDeg, cl, clGamma, cm, cdPressure: cdp, surface: out, panels: N };
  }
  function polar(pts, a0, a1, da) {
    const P = geometry(pts), cache = { P, inf: influence(P) }, rows = [];
    for (let a = a0; a <= a1 + 1e-9; a += da) { const r = panel(pts, +a.toFixed(6), cache); rows.push({ alpha: r.alpha, cl: r.cl, cm: r.cm }); }
    // linear fit for lift slope and zero-lift angle
    const n = rows.length, sx = rows.reduce((t, r) => t + r.alpha, 0), sy = rows.reduce((t, r) => t + r.cl, 0);
    const sxx = rows.reduce((t, r) => t + r.alpha * r.alpha, 0), sxy = rows.reduce((t, r) => t + r.alpha * r.cl, 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), icpt = (sy - slope * sx) / n;
    return { rows, slopePerDeg: slope, slopePerRad: slope / D2R, alphaL0: -icpt / slope };
  }

  /* ---------- empirical profile drag ---------- */
  function sectionDrag(tc, Re) {
    const cf = Re < 5e5 ? 1.328 / Math.sqrt(Re) : 0.074 / Math.pow(Re, 0.2);
    const ff = 1 + 2 * tc + 60 * Math.pow(tc, 4);
    return { cf, ff, cd: 2 * cf * ff, regime: Re < 5e5 ? 'laminar' : 'turbulent' };
  }

  /* ---------- Prandtl lifting-line theory ----------
     Γ(θ) = 2 b V Σ A_n sin(nθ), n odd (symmetric). Collocation at θ_k = kπ/(2N), k = 1..N.
     Σ A_n sin(nθ)(μ n + sinθ) = μ (α − α_L0) sinθ,  μ = c(θ)·a0 / (4b). */
  function liftingLine(o) {
    const N = o.terms || 20, b = o.span, cr = o.rootChord, lam = o.taper, a0 = o.a0 || 2 * PI;
    const alphaL0 = (o.alphaL0 || 0) * D2R, aRoot = o.alpha * D2R, tw = (o.twist || 0) * D2R;
    const chord = eta => cr * (1 - (1 - lam) * eta);         // eta = |2y/b|
    const S = b * cr * (1 + lam) / 2, AR = b * b / S;
    const A = [], rhs = [], th = [];
    for (let k = 1; k <= N; k++) {
      const t = k * PI / (2 * N), eta = Math.abs(Math.cos(t)), c = chord(eta), mu = c * a0 / (4 * b);
      const alphaLocal = aRoot + tw * eta;
      th.push(t);
      A.push(Array.from({ length: N }, (_, j) => { const n = 2 * j + 1; return Math.sin(n * t) * (mu * n + Math.sin(t)); }));
      rhs.push(mu * (alphaLocal - alphaL0) * Math.sin(t));
    }
    const An = solve(A, rhs);
    const CL = PI * AR * An[0];
    const delta = An.slice(1).reduce((s, a, j) => s + (2 * j + 3) * (a / An[0]) * (a / An[0]), 0);
    const CDi = PI * AR * An.reduce((s, a, j) => s + (2 * j + 1) * a * a, 0);
    const span = [];
    for (let k = 0; k <= 40; k++) {
      const t = (k / 40) * (PI / 2), eta = Math.cos(t);
      const G = An.reduce((s, a, j) => s + a * Math.sin((2 * j + 1) * t), 0);   // Γ/(2bV)
      const c = chord(eta), cl = c > 0 ? 4 * b * G / c : 0;
      span.push({ eta, y: eta * b / 2, cl, load: cl * c / (CL * S / b || 1) });
    }
    return { S, AR, CL, CDi, e: 1 / (1 + delta), An, span, meanChord: S / b };
  }

  /* ---------- International Standard Atmosphere (0–20 km) ---------- */
  function isa(h) {
    const R = 287.053, g = 9.80665;
    if (h < 0 || h > 20000) throw new Error('Altitude must be 0–20 000 m');
    let T, p;
    if (h <= 11000) { T = 288.15 - 0.0065 * h; p = 101325 * Math.pow(T / 288.15, g / (0.0065 * R)); }
    else { T = 216.65; p = 22632.06 * Math.exp(-g * (h - 11000) / (R * T)); }
    const rho = p / (R * T), a = Math.sqrt(1.4 * R * T), mu = 1.458e-6 * Math.pow(T, 1.5) / (T + 110.4);
    return { h, T, p, rho, a, mu, nu: mu / rho, sigma: rho / 1.225 };
  }

  /* ---------- steady level flight performance ---------- */
  function performance(o) {
    const atm = isa(o.altitude), W = o.mass * 9.80665, S = o.S, k = 1 / (PI * o.e * o.AR), cd0 = o.cd0;
    const vs = Math.sqrt(2 * W / (atm.rho * S * o.clmax));
    const clStar = Math.sqrt(cd0 / k), ldMax = 1 / (2 * Math.sqrt(k * cd0));
    const vBest = Math.sqrt(2 * W / (atm.rho * S * clStar));
    const curve = [];
    const v0 = Math.max(vs, 1), v1 = Math.max(vs * 4, vBest * 2.5);
    for (let i = 0; i <= 60; i++) {
      const V = v0 + (v1 - v0) * i / 60, q = 0.5 * atm.rho * V * V, cl = W / (q * S), cd = cd0 + k * cl * cl;
      curve.push({ V, cl, cd, ld: cl / cd, D: q * S * cd, P: q * S * cd * V });
    }
    return { atm, W, vs, vBest, clStar, ldMax, sinkMin: null, curve, k };
  }

  const api = { naca4, parseAirfoil, panel, polar, sectionDrag, liftingLine, isa, performance, solve, version: '1.0.0' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Krylo = api;
})(typeof window !== 'undefined' ? window : globalThis);
