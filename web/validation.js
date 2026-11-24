// Shared validation cases used by the test runner (Node) and the in-app Validation tab (browser).
(function (root) {
  function cases(K) {
    const D = Math.PI / 180, out = [];
    const add = (name, value, ref, tol, source) => out.push({ name, value, ref, tol, source });
    const n0012 = K.naca4('0012', 80), n2412 = K.naca4('2412', 80), n4412 = K.naca4('4412', 80);
    add('NACA 0012, α = 0°: lift coefficient (symmetry)', K.panel(n0012, 0).cl, 0, 1e-6, 'symmetry');
    const p0 = K.polar(n0012, -4, 8, 2);
    add('NACA 0012: lift slope per rad (2π·(1 + 0.77·t/c))', p0.slopePerRad, +(2 * Math.PI * (1 + 0.77 * 0.12)).toFixed(3), 0.15, 'thin-airfoil theory + thickness correction');
    add('NACA 0012, α = 5°: cl (inviscid)', K.panel(n0012, 5).cl, 0.60, 0.02, 'inviscid panel / XFOIL-inviscid ≈ 0.60');
    const p2 = K.polar(n2412, -4, 8, 2);
    add('NACA 2412: zero-lift angle (deg)', p2.alphaL0, -2.08, 0.15, 'thin-airfoil theory (−2.08°); experiment ≈ −2.1°');
    add('NACA 2412: cm about c/4', K.panel(n2412, 2).cm, -0.053, 0.008, 'thin-airfoil theory');
    add('NACA 4412: cm about c/4', K.panel(n4412, 2).cm, -0.106, 0.012, 'thin-airfoil theory');
    const r = K.panel(n2412, 5);
    add('NACA 2412, α = 5°: pressure drag ≈ 0 (d’Alembert)', r.cdPressure, 0, 0.002, 'potential-flow theory');
    add('NACA 2412, α = 5°: cl from pressure vs Kutta–Joukowski', r.cl - r.clGamma, 0, 0.02, 'internal consistency');
    const rect = K.liftingLine({ span: 10, rootChord: 10 / 6, taper: 1, alpha: 5, a0: 2 * Math.PI, terms: 30 });
    add('Rectangular wing AR 6: span efficiency e', rect.e, 0.95, 0.01, 'Glauert / Anderson, Fundamentals of Aerodynamics');
    const ell = K.liftingLine({ span: 10, rootChord: 2 * 10 / 6 / 1.4, taper: 0.4, alpha: 5, a0: 2 * Math.PI, terms: 30 });
    add('Taper 0.4 wing AR 6: span efficiency e (near-elliptic)', ell.e, 0.99, 0.01, 'Anderson, Fundamentals of Aerodynamics');
    add('Lifting line: CDi = CL²/(π·e·AR)', rect.CDi - rect.CL * rect.CL / (Math.PI * rect.e * rect.AR), 0, 1e-6, 'identity');
    add('ISA sea level: density (kg/m³)', K.isa(0).rho, 1.225, 0.0005, 'ISO 2533 / US Std Atm 1976');
    add('ISA 5 000 m: density (kg/m³)', K.isa(5000).rho, 0.7361, 0.001, 'US Std Atm 1976');
    add('ISA 11 000 m: pressure (Pa)', K.isa(11000).p, 22632, 5, 'US Std Atm 1976');
    add('ISA 15 000 m: pressure (Pa)', K.isa(15000).p, 12045, 10, 'US Std Atm 1976');
    add('ISA sea level: speed of sound (m/s)', K.isa(0).a, 340.29, 0.05, 'US Std Atm 1976');
    const perf = K.performance({ altitude: 0, mass: 1000, S: 16, AR: 7.5, e: 0.8, cd0: 0.03, clmax: 1.5 });
    add('Performance: max L/D = ½·√(π·e·AR / CD0)', perf.ldMax, +(0.5 * Math.sqrt(Math.PI * 0.8 * 7.5 / 0.03)).toFixed(3), 0.01, 'drag-polar theory');
    add('Performance: stall speed √(2W/(ρ S CLmax)) (m/s)', perf.vs, +Math.sqrt(2 * 1000 * 9.80665 / (1.225 * 16 * 1.5)).toFixed(3), 0.01, 'definition');
    return out;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = cases; else root.KryloValidation = cases;
})(typeof window !== 'undefined' ? window : globalThis);
