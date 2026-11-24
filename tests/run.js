// Krylo validation suite — run with:  node tests/run.js
// Each check compares Krylo against an independent reference (theory, textbook value or standard table).
const K = require('../web/krylo.js');
const checks = require('../web/validation.js')(K);
let fail = 0;
for (const c of checks) {
  const ok = Math.abs(c.value - c.ref) <= c.tol;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(58)} krylo=${c.value.toPrecision(5).padStart(10)}  ref=${String(c.ref).padStart(8)} ±${c.tol}  (${c.source})`);
}
console.log(`\n${checks.length - fail}/${checks.length} checks passed`);
process.exit(fail ? 1 : 0);
