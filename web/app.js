/* Krylo web interface. MIT License. */
{
const K = window.Krylo, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem('krylo-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('krylo-' + k, JSON.stringify(v)); } catch (e) {} } };
let lang = store.get('lang', (navigator.language || '').toLowerCase().startsWith('uk') ? 'uk' : 'en');
const S = Object.assign({ naca: '2412', src: 'naca', custom: '', npan: 160, alpha: 4, re: 1000000,
  pa0: -6, pa1: 12, pda: 1,
  span: 10, cr: 1.8, taper: 0.5, twist: -2, walpha: 4, a0: 6.28, al0: -2.1,
  alt: 0, mass: 1000, S: 16, AR: 7.5, e: 0.8, cd0: 0.03, clmax: 1.5 }, store.get('state', {}));
const save = () => store.set('state', S);
const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const nf = (x, d = 3) => Number.isFinite(x) ? x.toLocaleString(lang === 'uk' ? 'uk-UA' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';

const T = {
  tagline: ['Open-source aerodynamic analysis', 'Відкритий аеродинамічний аналіз'],
  t_airfoil: ['Airfoil', 'Профіль'], t_polar: ['Polar', 'Поляра'], t_wing: ['Wing', 'Крило'], t_atm: ['Atmosphere', 'Атмосфера'], t_perf: ['Performance', 'Характеристики'], t_val: ['Validation', 'Валідація'], t_about: ['Methods & source', 'Методи та код'],
  af_h: ['Airfoil analysis — panel method', 'Аналіз профілю — метод панелей'],
  af_p: ['Hess–Smith source–vortex panel method: pressure distribution, lift and pitching moment of any airfoil in inviscid, incompressible flow.', 'Метод панелей Гесса–Сміта (джерела + вихор): розподіл тиску, підйомна сила та момент тангажу будь-якого профілю в невʼязкому нестисливому потоці.'],
  naca: ['NACA 4-digit', 'NACA 4 цифри'], custom: ['Custom coordinates', 'Власні координати'], code: ['NACA code', 'Код NACA'], panels: ['Panels', 'Панелей'], alpha: ['Angle of attack α', 'Кут атаки α'], re: ['Reynolds number (drag estimate)', 'Число Рейнольдса (оцінка опору)'],
  paste: ['Paste coordinates (Selig .dat format: name line, then x y pairs)', 'Вставте координати (формат Selig .dat: рядок назви, потім пари x y)'],
  shape: ['Geometry', 'Геометрія'], cpplot: ['Pressure coefficient (−Cp, upper surface solid)', 'Коефіцієнт тиску (−Cp, верхня поверхня — суцільна)'],
  cdest: ['cd (estimate)', 'cd (оцінка)'], ld: ['L/D (section)', 'L/D (профіль)'], tc: ['t/c', 't/c'],
  af_note: ['Inviscid model: it does not predict stall or maximum lift. Profile drag is an empirical flat-plate + form-factor estimate, not a boundary-layer solution.', 'Невʼязка модель: не передбачає зриву чи максимальної підйомної сили. Профільний опір — емпірична оцінка (пластина + коефіцієнт форми), а не розрахунок примежового шару.'],
  csv: ['Download CSV', 'Завантажити CSV'], copy: ['Copy CSV', 'Копіювати CSV'], copied: ['Copied', 'Скопійовано'],
  po_h: ['Lift and moment polar', 'Поляра підйомної сили та моменту'], po_p: ['Sweeps the angle of attack and fits the lift-curve slope and zero-lift angle — the inputs a wing analysis needs.', 'Перебирає кути атаки й визначає нахил кривої підйомної сили та кут нульової підйомної сили — вхідні дані для розрахунку крила.'],
  from: ['From α', 'Від α'], to: ['To α', 'До α'], step: ['Step', 'Крок'], slope: ['Lift slope a₀', 'Нахил a₀'], al0: ['Zero-lift angle α_L0', 'Кут нульової підйомної сили α_L0'], usewing: ['Use in wing analysis →', 'Використати для крила →'],
  wi_h: ['Wing analysis — lifting-line theory', 'Аналіз крила — теорія несучої лінії'], wi_p: ['Prandtl’s lifting-line theory (Glauert series) for a straight, tapered, linearly twisted wing: lift, induced drag, span efficiency and span loading.', 'Теорія несучої лінії Прандтля (ряд Глауерта) для прямого крила зі звуженням і лінійною круткою: підйомна сила, індуктивний опір, коефіцієнт Освальда та розподіл навантаження.'],
  span: ['Span b', 'Розмах b'], cr: ['Root chord', 'Коренева хорда'], taper: ['Taper ratio λ', 'Звуження λ'], twist: ['Tip twist (− = washout)', 'Крутка кінця (− = зменшення)'], a0: ['Section lift slope a₀ (/rad)', 'Нахил профілю a₀ (/рад)'],
  planform: ['Planform (half wing)', 'Форма в плані (півкрила)'], loading: ['Span loading: local cl (blue) and normalised load cl·c/c̄·CL (yellow)', 'Розподіл по розмаху: місцевий cl (синій) і нормоване навантаження (жовтий)'],
  wi_note: ['Valid for moderate-to-high aspect ratio, unswept wings at angles below stall.', 'Справедливо для прямих крил середнього та великого подовження на кутах до зриву.'], useperf: ['Use in performance →', 'Використати для характеристик →'],
  at_h: ['International Standard Atmosphere', 'Міжнародна стандартна атмосфера'], at_p: ['ISO 2533 / US Standard Atmosphere 1976, troposphere and lower stratosphere (0–20 km).', 'ISO 2533 / Стандартна атмосфера США 1976, тропосфера й нижня стратосфера (0–20 км).'], alt: ['Altitude', 'Висота'],
  temp: ['Temperature', 'Температура'], press: ['Pressure', 'Тиск'], dens: ['Density', 'Густина'], sigma: ['Density ratio σ', 'Відносна густина σ'], sound: ['Speed of sound', 'Швидкість звуку'], visc: ['Dynamic viscosity', 'Динамічна вʼязкість'], kvisc: ['Kinematic viscosity', 'Кінематична вʼязкість'],
  atplot: ['Density (blue) and temperature (yellow) vs altitude', 'Густина (синя) і температура (жовта) від висоти'],
  pe_h: ['Steady level flight performance', 'Характеристики усталеного горизонтального польоту'], pe_p: ['Parabolic drag polar CD = CD0 + CL²/(π·e·AR): stall speed, best lift-to-drag speed, drag and power required.', 'Параболічна поляра CD = CD0 + CL²/(π·e·AR): швидкість звалювання, швидкість найкращої якості, потрібні опір і потужність.'],
  mass: ['Mass', 'Маса'], area: ['Wing area S', 'Площа крила S'], ar: ['Aspect ratio AR', 'Подовження AR'], eff: ['Oswald efficiency e', 'Коефіцієнт Освальда e'], cd0: ['Zero-lift drag CD0', 'Опір при нульовій підйомній силі CD0'], clmax: ['CLmax (from tests or data)', 'CLmax (з випробувань чи даних)'],
  vs: ['Stall speed', 'Швидкість звалювання'], vbest: ['Best L/D speed', 'Швидкість найкращої якості'], ldmax: ['Max L/D', 'Макс. якість L/D'], clstar: ['CL at best L/D', 'CL найкращої якості'],
  ldplot: ['Lift-to-drag ratio vs airspeed', 'Аеродинамічна якість від швидкості'], dplot: ['Drag (blue, N) and power required (yellow, kW) vs airspeed', 'Опір (синій, Н) і потрібна потужність (жовта, кВт) від швидкості'],
  va_h: ['Validation', 'Валідація'], va_p: ['Every result Krylo produces is checked against independent references: analytical theory, textbook values and the standard atmosphere tables. These checks run live in your browser; the same suite runs with node tests/run.js.', 'Кожен результат Krylo перевіряється незалежними джерелами: аналітичною теорією, підручниковими значеннями та таблицями стандартної атмосфери. Перевірки виконуються просто у вашому браузері; той самий набір запускається командою node tests/run.js.'],
  check: ['Check', 'Перевірка'], kr: ['Krylo', 'Krylo'], ref: ['Reference', 'Еталон'], src: ['Source', 'Джерело'], passed: ['checks passed', 'перевірок пройдено'],
  foot: ['Krylo is free and open-source (MIT License). Results are for education and preliminary design; they are not certified engineering data.', 'Krylo — безкоштовне відкрите ПЗ (ліцензія MIT). Результати призначені для навчання та попереднього проєктування й не є сертифікованими інженерними даними.'],
};
const t = k => (T[k] || [k, k])[lang === 'uk' ? 1 : 0];

/* ---------- SVG line chart ---------- */
function chart(series, o = {}) {
  const W = 640, H = o.h || 300, m = { l: 52, r: 14, t: 12, b: 34 };
  const xs = series.flatMap(s => s.pts.map(p => p[0])), ys = series.flatMap(s => s.pts.map(p => p[1]));
  let x0 = o.x0 ?? Math.min(...xs), x1 = o.x1 ?? Math.max(...xs), y0 = o.y0 ?? Math.min(...ys), y1 = o.y1 ?? Math.max(...ys);
  if (o.equal) { const span = Math.max(x1 - x0, (y1 - y0) * (W - m.l - m.r) / (H - m.t - m.b)); const yc = (y0 + y1) / 2, hh = span * (H - m.t - m.b) / (W - m.l - m.r) / 2; y0 = yc - hh; y1 = yc + hh; }
  if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
  const pad = o.equal ? 0 : (y1 - y0) * 0.06; y0 -= pad; y1 += pad;
  const X = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r), Y = y => H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);
  const ticks = (a, b, n) => { const st = Math.pow(10, Math.floor(Math.log10((b - a) / n))), f = [1, 2, 2.5, 5, 10].find(f => (b - a) / (f * st) <= n) * st, out = []; for (let v = Math.ceil(a / f) * f; v <= b + 1e-9; v += f) out.push(+v.toPrecision(10)); return out; };
  let g = '';
  if (!o.noGrid) {
    for (const v of ticks(x0, x1, 7)) g += `<line x1="${X(v)}" y1="${m.t}" x2="${X(v)}" y2="${H - m.b}" stroke="currentColor" stroke-opacity=".1"/><text x="${X(v)}" y="${H - m.b + 16}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">${+v.toFixed(4)}</text>`;
    for (const v of ticks(y0, y1, 5)) g += `<line x1="${m.l}" y1="${Y(v)}" x2="${W - m.r}" y2="${Y(v)}" stroke="currentColor" stroke-opacity="${v === 0 ? .4 : .1}"/><text x="${m.l - 6}" y="${Y(v) + 4}" font-size="11" text-anchor="end" fill="currentColor" opacity=".7">${+v.toFixed(4)}</text>`;
  }
  if (o.xl) g += `<text x="${W - m.r}" y="${H - 4}" font-size="11" text-anchor="end" fill="currentColor" opacity=".7">${esc(o.xl)}</text>`;
  if (o.yl) g += `<text x="${m.l}" y="${m.t - 2}" font-size="11" fill="currentColor" opacity=".7" dy="-1">${esc(o.yl)}</text>`;
  for (const s of series) {
    if (s.dot) { g += s.pts.map(p => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${s.r || 5}" fill="${s.color}" stroke="#0b1f3a" stroke-width="1.2"/>`).join(''); continue; }
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join('') + (s.close ? 'Z' : '');
    g += `<path d="${d}" fill="${s.fill || 'none'}" stroke="${s.color}" stroke-width="${s.w || 2}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'chart')}">${g}</svg>`;
}
const BLUE = 'var(--blue)', YEL = '#e0b400';
const slider = (id, lab, min, max, step, unit = '') => `<div class=field><label for=${id}><span>${lab}</span><output id=${id}-o></output></label><input type=range id=${id} min=${min} max=${max} step=${step} value="${S[id]}" data-u="${unit}"></div>`;
const num = (id, lab, step = 'any') => `<div class=field><label for=${id}>${lab}</label><input type=number id=${id} step=${step} value="${S[id]}"></div>`;
const res = rows => `<div class=res>${rows.map(r => `<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>`;
const dec = s => (String(s).split('.')[1] || '').length;
function bind(root, run) {
  const upd = () => { $$('input,select,textarea', root).forEach(el => { if (el.id && el.id in S) S[el.id] = el.type === 'range' || el.type === 'number' ? +el.value : el.value; const o = $('#' + el.id + '-o'); if (o) o.textContent = nf(+el.value, dec(el.step)) + (el.dataset.u ? ' ' + el.dataset.u : ''); }); save(); run(); };
  root.addEventListener('input', upd); upd();
}
function exportBtns(name, rows) {
  const csv = rows.map(r => r.join(',')).join('\n');
  return `<div class=row style="margin-top:6px">${framed ? '' : `<a class="btn ghost sm" download="${name}.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(csv)}">${t('csv')}</a>`}<button class="btn ghost sm" data-copy="${esc(csv)}">${t('copy')}</button></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (!b) return; try { navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = t('copied'); }); } catch (err) {} });

/* ---------- airfoil source ---------- */
function airfoil() {
  if (S.src === 'custom') return K.parseAirfoil(S.custom);
  return K.naca4(S.naca, Math.round(S.npan / 2));
}

/* ---------- views ---------- */
const V = {};
V.airfoil = () => `<h1>${t('af_h')}</h1><p class=lead>${t('af_p')}</p><div class=tool><div class=panel id=ctl>
 <div class=seg role=group><button data-src=naca aria-pressed=${S.src === 'naca'}>${t('naca')}</button><button data-src=custom aria-pressed=${S.src === 'custom'}>${t('custom')}</button></div>
 ${S.src === 'naca' ? `<div class=field><label for=naca>${t('code')}</label><input type=text id=naca value="${esc(S.naca)}" maxlength=4 inputmode=numeric></div>${slider('npan', t('panels'), 40, 240, 10)}` : `<div class=field><label for=custom>${t('paste')}</label><textarea id=custom spellcheck=false>${esc(S.custom)}</textarea></div>`}
 ${slider('alpha', t('alpha'), -10, 15, 0.5, '°')}${num('re', t('re'), 10000)}
 <p class=err id=err></p></div><div><div id=out></div><p class=note>${t('af_note')}</p></div></div>`;
V.airfoil.run = () => {
  let af; const err = $('#err'); err.textContent = '';
  try { af = airfoil(); } catch (e) { err.textContent = e.message; $('#out').innerHTML = ''; return; }
  const r = K.panel(af, S.alpha), d = K.sectionDrag(af.tc, Math.max(1e4, S.re));
  const up = r.surface.filter(p => p.upper).sort((a, b) => a.x - b.x), lo = r.surface.filter(p => !p.upper).sort((a, b) => a.x - b.x);
  $('#out').innerHTML = `<h2>${esc(af.name)}</h2>` + res([['cl', nf(r.cl, 4)], ['cm c/4', nf(r.cm, 4)], [t('cdest'), nf(d.cd, 5)], [t('ld'), nf(r.cl / d.cd, 1)], [t('tc'), nf(af.tc * 100, 1) + ' %'], [t('panels'), r.panels]])
    + `<div class=chart><h3>${t('shape')} · α = ${nf(S.alpha, 1)}°</h3>${chart([{ pts: af.map(p => [p[0], p[1]]), color: BLUE, fill: 'color-mix(in srgb,var(--blue) 14%,transparent)', close: true }], { equal: true, x0: -0.02, x1: 1.02, h: 200, label: 'airfoil', xl: 'x/c' })}</div>`
    + `<div class=chart><h3>${t('cpplot')}</h3>${chart([{ pts: up.map(p => [p.x, -p.cp]), color: BLUE }, { pts: lo.map(p => [p.x, -p.cp]), color: BLUE, dash: '5 4' }], { x0: 0, x1: 1, xl: 'x/c', yl: '−Cp', label: 'Cp distribution' })}</div>`
    + exportBtns('krylo-cp-' + af.name.replace(/\W+/g, ''), [['x', 'y', 'Cp', 'surface']].concat(r.surface.map(p => [p.x.toFixed(5), p.y.toFixed(5), p.cp.toFixed(5), p.upper ? 'upper' : 'lower'])));
};
V.polar = () => `<h1>${t('po_h')}</h1><p class=lead>${t('po_p')}</p><div class=tool><div class=panel id=ctl>
 ${num('pa0', t('from') + ' (°)', 0.5)}${num('pa1', t('to') + ' (°)', 0.5)}${num('pda', t('step') + ' (°)', 0.25)}<p class=err id=err></p><button class=btn id=usew>${t('usewing')}</button></div><div id=out></div></div>`;
let lastPolar = null;
V.polar.run = () => {
  const err = $('#err'); err.textContent = '';
  try {
    if (!(S.pda > 0) || S.pa1 <= S.pa0 || (S.pa1 - S.pa0) / S.pda > 200) throw new Error(lang === 'uk' ? 'Перевірте діапазон і крок (до 200 точок).' : 'Check the range and step (max 200 points).');
    const af = airfoil(), p = K.polar(af, S.pa0, S.pa1, S.pda); lastPolar = p;
    $('#out').innerHTML = `<h2>${esc(af.name)}</h2>` + res([[t('slope'), nf(p.slopePerRad, 3) + ' /rad'], ['', nf(p.slopePerDeg, 4) + ' /°'], [t('al0'), nf(p.alphaL0, 2) + '°']])
      + `<div class=chart><h3>cl (α)</h3>${chart([{ pts: p.rows.map(r => [r.alpha, r.cl]), color: BLUE }, { pts: p.rows.map(r => [r.alpha, r.cl]), color: BLUE, dot: true, r: 3 }], { xl: 'α (°)', yl: 'cl', label: 'lift curve' })}</div>`
      + `<div class=chart><h3>cm c/4 (α)</h3>${chart([{ pts: p.rows.map(r => [r.alpha, r.cm]), color: YEL }], { xl: 'α (°)', yl: 'cm', label: 'moment curve', h: 220 })}</div>`
      + `<div class=scroll><table><thead><tr><th class=n>α (°)</th><th class=n>cl</th><th class=n>cm c/4</th></tr></thead><tbody>${p.rows.map(r => `<tr><td class=n>${nf(r.alpha, 2)}</td><td class=n>${nf(r.cl, 4)}</td><td class=n>${nf(r.cm, 4)}</td></tr>`).join('')}</tbody></table></div>`
      + exportBtns('krylo-polar', [['alpha_deg', 'cl', 'cm_c4']].concat(p.rows.map(r => [r.alpha, r.cl.toFixed(5), r.cm.toFixed(5)])));
  } catch (e) { err.textContent = e.message; $('#out').innerHTML = ''; }
};
V.wing = () => `<h1>${t('wi_h')}</h1><p class=lead>${t('wi_p')}</p><div class=tool><div class=panel id=ctl>
 ${slider('span', t('span'), 0.5, 40, 0.1, 'm')}${slider('cr', t('cr'), 0.05, 6, 0.01, 'm')}${slider('taper', t('taper'), 0.1, 1, 0.01)}${slider('twist', t('twist'), -8, 4, 0.5, '°')}${slider('walpha', t('alpha') + ' (root)', -4, 12, 0.25, '°')}
 ${num('a0', t('a0'), 0.01)}${num('al0', t('al0') + ' (°)', 0.01)}<button class=btn id=usep>${t('useperf')}</button></div><div><div id=out></div><p class=note>${t('wi_note')}</p></div></div>`;
let lastWing = null;
V.wing.run = () => {
  const w = K.liftingLine({ span: S.span, rootChord: S.cr, taper: S.taper, twist: S.twist, alpha: S.walpha, a0: S.a0, alphaL0: S.al0, terms: 30 }); lastWing = w;
  const half = S.span / 2, ct = S.cr * S.taper;
  const plan = [[0, 0], [half, S.cr * 0.25 - ct * 0.25], [half, S.cr * 0.25 + ct * 0.75], [0, S.cr]].map(p => [p[0], -p[1]]);
  $('#out').innerHTML = res([['CL', nf(w.CL, 4)], ['CDi', nf(w.CDi, 5)], ['e', nf(w.e, 4)], ['AR', nf(w.AR, 2)], ['S', nf(w.S, 2) + ' m²'], ['c̄', nf(w.meanChord, 3) + ' m']])
    + `<div class=chart><h3>${t('planform')}</h3>${chart([{ pts: plan, color: BLUE, fill: 'color-mix(in srgb,var(--blue) 14%,transparent)', close: true }, { pts: [[0, -S.cr * 0.25], [half, -S.cr * 0.25]], color: YEL, dash: '6 4', w: 1.5 }], { equal: true, x0: -0.02 * half, x1: half * 1.02, h: 200, xl: 'y (m)', label: 'planform' })}</div>`
    + `<div class=chart><h3>${t('loading')}</h3>${chart([{ pts: w.span.map(p => [p.eta, p.cl]), color: BLUE }, { pts: w.span.map(p => [p.eta, p.load]), color: YEL }], { x0: 0, x1: 1, y0: 0, xl: '2y/b', label: 'span loading' })}</div>`
    + exportBtns('krylo-span-loading', [['eta_2y_over_b', 'y_m', 'cl_local', 'load_norm']].concat(w.span.map(p => [p.eta.toFixed(4), p.y.toFixed(4), p.cl.toFixed(5), p.load.toFixed(5)])));
};
V.atm = () => `<h1>${t('at_h')}</h1><p class=lead>${t('at_p')}</p><div class=tool><div class=panel id=ctl>${slider('alt', t('alt'), 0, 20000, 100, 'm')}</div><div id=out></div></div>`;
V.atm.run = () => {
  const a = K.isa(S.alt), prof = []; for (let h = 0; h <= 20000; h += 500) prof.push(K.isa(h));
  $('#out').innerHTML = res([[t('temp'), nf(a.T - 273.15, 2) + ' °C'], [t('press'), nf(a.p / 1000, 3) + ' kPa'], [t('dens'), nf(a.rho, 4) + ' kg/m³'], [t('sigma'), nf(a.sigma, 4)], [t('sound'), nf(a.a, 2) + ' m/s'], [t('visc'), nf(a.mu * 1e5, 4) + '×10⁻⁵ Pa·s'], [t('kvisc'), nf(a.nu * 1e5, 4) + '×10⁻⁵ m²/s']])
    + `<div class=chart><h3>${t('atplot')}</h3>${chart([{ pts: prof.map(p => [p.h / 1000, p.rho / 1.225]), color: BLUE }, { pts: prof.map(p => [p.h / 1000, p.T / 288.15]), color: YEL }, { pts: [[S.alt / 1000, a.rho / 1.225]], color: '#ffd500', dot: true }], { y0: 0, y1: 1, xl: 'h (km)', yl: 'ρ/ρ₀ · T/T₀', label: 'atmosphere' })}</div>`
    + exportBtns('krylo-isa', [['h_m', 'T_K', 'p_Pa', 'rho_kg_m3', 'a_m_s', 'mu_Pa_s']].concat(prof.map(p => [p.h, p.T.toFixed(3), p.p.toFixed(2), p.rho.toFixed(5), p.a.toFixed(3), p.mu.toExponential(5)])));
};
V.perf = () => `<h1>${t('pe_h')}</h1><p class=lead>${t('pe_p')}</p><div class=tool><div class=panel id=ctl>
 ${slider('alt', t('alt'), 0, 12000, 100, 'm')}${num('mass', t('mass') + ' (kg)', 1)}${num('S', t('area') + ' (m²)', 0.1)}${num('AR', t('ar'), 0.1)}${num('e', t('eff'), 0.01)}${num('cd0', t('cd0'), 0.001)}${num('clmax', t('clmax'), 0.05)}<p class=err id=err></p></div><div id=out></div></div>`;
V.perf.run = () => {
  const err = $('#err'); err.textContent = '';
  try {
    if (!(S.mass > 0 && S.S > 0 && S.AR > 0 && S.e > 0 && S.cd0 > 0 && S.clmax > 0)) throw new Error(lang === 'uk' ? 'Усі значення мають бути додатними.' : 'All values must be positive.');
    const p = K.performance({ altitude: S.alt, mass: S.mass, S: S.S, AR: S.AR, e: S.e, cd0: S.cd0, clmax: S.clmax });
    $('#out').innerHTML = res([[t('vs'), nf(p.vs, 1) + ' m/s'], ['', nf(p.vs * 3.6, 0) + ' km/h'], [t('vbest'), nf(p.vBest, 1) + ' m/s'], [t('ldmax'), nf(p.ldMax, 2)], [t('clstar'), nf(p.clStar, 3)], [t('dens'), nf(p.atm.rho, 4) + ' kg/m³']])
      + `<div class=chart><h3>${t('ldplot')}</h3>${chart([{ pts: p.curve.map(c => [c.V, c.ld]), color: BLUE }, { pts: [[p.vBest, p.ldMax]], color: '#ffd500', dot: true }], { y0: 0, xl: 'V (m/s)', yl: 'L/D', label: 'L/D vs V' })}</div>`
      + `<div class=chart><h3>${t('dplot')}</h3>${chart([{ pts: p.curve.map(c => [c.V, c.D]), color: BLUE }, { pts: p.curve.map(c => [c.V, c.P / 1000 * 10]), color: YEL }], { y0: 0, xl: 'V (m/s)', yl: 'D (N) · P×10 (kW)', label: 'drag and power' })}</div>`
      + exportBtns('krylo-performance', [['V_m_s', 'CL', 'CD', 'L_over_D', 'D_N', 'P_W']].concat(p.curve.map(c => [c.V.toFixed(3), c.cl.toFixed(5), c.cd.toFixed(5), c.ld.toFixed(3), c.D.toFixed(2), c.P.toFixed(1)])));
  } catch (e) { err.textContent = e.message; $('#out').innerHTML = ''; }
};
V.val = () => { const cs = window.KryloValidation(K); let pass = 0; const rows = cs.map(c => { const ok = Math.abs(c.value - c.ref) <= c.tol; if (ok) pass++; return `<tr><td>${esc(c.name)}</td><td class=n>${c.value.toPrecision(5)}</td><td class=n>${c.ref} ± ${c.tol}</td><td>${esc(c.source)}</td><td class=${ok ? 'ok' : 'bad'}>${ok ? '✓' : '✗'}</td></tr>`; }).join('');
  return `<h1>${t('va_h')}</h1><p class=lead>${t('va_p')}</p><p><b class=${pass === cs.length ? 'ok' : 'bad'}>${pass}/${cs.length}</b> ${t('passed')}</p><div class=scroll><table><thead><tr><th>${t('check')}</th><th class=n>${t('kr')}</th><th class=n>${t('ref')}</th><th>${t('src')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`; };
V.about = () => lang === 'uk' ? `<div class=prose><h1>Методи та вихідний код</h1>
<p>Krylo — безкоштовна програма з відкритим кодом (ліцензія MIT) для аеродинамічного аналізу просто в браузері, без встановлення. Створена для студентів, викладачів і конструкторів малих літальних апаратів.</p>
<h2>Метод панелей (профіль)</h2><p>Поверхню профілю ділять на N прямих панелей. Кожна несе джерело сталої інтенсивності qᵢ, а всі разом — вихор сталої інтенсивності γ (метод Гесса–Сміта). Умова непротікання в середині кожної панелі дає N рівнянь, умова Кутти (рівні за модулем дотичні швидкості на двох панелях задньої кромки) — ще одне. Систему розвʼязують методом Гаусса. Cp = 1 − (Vₜ/V∞)²; сили отримують інтегруванням тиску, перевіряючи теоремою Жуковського.</p>
<h2>Теорія несучої лінії (крило)</h2><p>Циркуляцію подають рядом Γ(θ) = 2bV∞ Σ Aₙ sin(nθ) (непарні n для симетричного навантаження) і задовольняють рівняння Прандтля в N точках. CL = π·AR·A₁, CDi = π·AR·Σ n·Aₙ², e = 1/(1+δ).</p>
<h2>Атмосфера та характеристики</h2><p>МСА за ISO 2533 до 20 км; вʼязкість за формулою Сазерленда. Характеристики — з параболічної поляри.</p>
<h2>Обмеження</h2><p>Потік невʼязкий і нестисливий: немає зриву, CLmax, ефектів стисливості (M > 0,3) чи примежового шару. Оцінка профільного опору емпірична. Результати — для навчання та попереднього проєктування.</p>
<h2>Література</h2><p>J. L. Hess, A. M. O. Smith (1967); J. Moran, <i>Introduction to Theoretical and Computational Aerodynamics</i>; J. D. Anderson, <i>Fundamentals of Aerodynamics</i>; J. Katz, A. Plotkin, <i>Low-Speed Aerodynamics</i>; ISO 2533:1975.</p>
<h2>Код</h2><p>Двигун розрахунків — <code>krylo.js</code> (без залежностей, працює в браузері й Node.js). Тести: <code>node tests/run.js</code>. Пропозиції та виправлення вітаються через GitHub.</p></div>`
: `<div class=prose><h1>Methods &amp; source</h1>
<p>Krylo is free, open-source (MIT License) software for aerodynamic analysis that runs entirely in the browser — no installation. It is built for students, teachers and designers of small aircraft and drones.</p>
<h2>Panel method (airfoil)</h2><p>The airfoil surface is divided into N straight panels. Each carries a constant-strength source qᵢ, and all share one constant vortex strength γ (Hess–Smith method). Flow tangency at each panel midpoint gives N equations; the Kutta condition (equal tangential speed magnitude on the two trailing-edge panels) gives one more. The system is solved by Gaussian elimination. Cp = 1 − (Vₜ/V∞)²; forces come from integrating pressure and are cross-checked with the Kutta–Joukowski theorem.</p>
<h2>Lifting-line theory (wing)</h2><p>Circulation is expanded as Γ(θ) = 2bV∞ Σ Aₙ sin(nθ) (odd n for symmetric loading) and Prandtl’s equation is enforced at N collocation points. CL = π·AR·A₁, CDi = π·AR·Σ n·Aₙ², e = 1/(1+δ).</p>
<h2>Atmosphere and performance</h2><p>ISO 2533 standard atmosphere to 20 km; Sutherland’s law for viscosity. Performance from a parabolic drag polar.</p>
<h2>Limitations</h2><p>Inviscid, incompressible flow: no stall, no CLmax prediction, no compressibility (M &gt; 0.3) and no boundary layer. Profile drag is an empirical estimate. Results are for education and preliminary design.</p>
<h2>References</h2><p>J. L. Hess &amp; A. M. O. Smith (1967); J. Moran, <i>Introduction to Theoretical and Computational Aerodynamics</i>; J. D. Anderson, <i>Fundamentals of Aerodynamics</i>; J. Katz &amp; A. Plotkin, <i>Low-Speed Aerodynamics</i>; ISO 2533:1975.</p>
<h2>Source code</h2><p>The solver is <code>krylo.js</code> — dependency-free, runs in browsers and Node.js. Tests: <code>node tests/run.js</code>. Issues and contributions are welcome on GitHub.</p></div>`;

const TABS = [['airfoil', 't_airfoil'], ['polar', 't_polar'], ['wing', 't_wing'], ['atm', 't_atm'], ['perf', 't_perf'], ['val', 't_val'], ['about', 't_about']];
function render() {
  document.documentElement.lang = lang;
  const tab = (location.hash.slice(1) || 'airfoil'), v = V[tab] ? tab : 'airfoil';
  $('#tagline').textContent = t('tagline');
  $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  $('#tabs').innerHTML = TABS.map(([k, l]) => `<a href="#${k}" ${k === v ? 'aria-current=page' : ''}>${t(l)}</a>`).join('');
  $('#foot').textContent = t('foot');
  $('#main').innerHTML = V[v]();
  const ctl = $('#ctl');
  if (ctl && V[v].run) bind(ctl, V[v].run);
  $$('[data-src]').forEach(b => b.onclick = () => { S.src = b.dataset.src; if (S.src === 'custom' && !S.custom) S.custom = 'NACA 0012 (example — replace)\n' + K.naca4('0012', 40).slice().reverse().map(p => p[0].toFixed(5) + ' ' + p[1].toFixed(5)).join('\n'); save(); render(); });
  const uw = $('#usew'); if (uw) uw.onclick = () => { if (lastPolar) { S.a0 = +lastPolar.slopePerRad.toFixed(3); S.al0 = +lastPolar.alphaL0.toFixed(2); save(); location.hash = 'wing'; } };
  const up = $('#usep'); if (up) up.onclick = () => { if (lastWing) { S.S = +lastWing.S.toFixed(3); S.AR = +lastWing.AR.toFixed(3); S.e = +(lastWing.e * 0.85).toFixed(3); save(); location.hash = 'perf'; } };
}
$$('[data-lang]').forEach(b => b.onclick = () => { lang = b.dataset.lang; store.set('lang', lang); render(); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
render();
}
