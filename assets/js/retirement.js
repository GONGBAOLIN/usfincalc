/* ==========================================================================
   USFinCalc — Retirement calculator (retirement.js)
   Projects 401(k)/IRA balance growth from now to retirement age.

   Model (annual steps, contributions added at year end):
     Each year, the existing balance grows by the expected return, then that
     year's contributions are added: your own (salary x contribution %) plus
     the employer match (salary x match-rate, capped at a % of salary).
     Salary is assumed flat in today's dollars; the inflation-adjusted
     ending balance restates the nominal future balance in today's dollars.

   This is the standard future-value-of-an-annuity approach with an explicit
   year loop so the employer-match cap and starting balance are exact.

   Depends on core.js. No client-side storage.

   Element IDs in retirement-calculator.html:
     inputs : currentAge, retireAge, currentBalance, annualSalary,
              contribPct, matchPct, matchLimitPct, expReturn, inflation
     outputs: outNominal, outReal, outContribTotal, outMatchTotal,
              outGrowthTotal, outYears
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var currentAge = Math.max(0, i.currentAge || 0);
    var retireAge = Math.max(0, i.retireAge || 0);
    var years = Math.max(0, Math.round(retireAge - currentAge));

    var balance = Math.max(0, i.currentBalance || 0);
    var salary = Math.max(0, i.annualSalary || 0);
    var contribPct = Math.max(0, i.contribPct || 0) / 100;
    var matchPct = Math.max(0, i.matchPct || 0) / 100;
    var matchLimitPct = Math.max(0, i.matchLimitPct || 0) / 100;
    var r = (i.expReturn || 0) / 100;
    var inflation = (i.inflation || 0) / 100;

    var startBalance = balance;
    var ownAnnual = salary * contribPct;
    // Employer matches your contribution rate up to a cap (% of salary),
    // at the match ratio (matchPct: 0.5 = 50c/$, 1.0 = full dollar match).
    var matchedRate = Math.min(contribPct, matchLimitPct);
    var matchAnnual = salary * matchedRate * matchPct;

    var totalOwn = 0, totalMatch = 0;
    for (var y = 0; y < years; y++) {
      balance = balance * (1 + r);
      balance += ownAnnual + matchAnnual;
      totalOwn += ownAnnual;
      totalMatch += matchAnnual;
    }

    var nominal = balance;
    var totalContrib = totalOwn + totalMatch + startBalance;
    var growth = nominal - totalContrib;
    if (growth < 0) growth = 0;

    // Restate nominal future dollars in today's purchasing power.
    var real = years > 0 ? nominal / Math.pow(1 + inflation, years) : nominal;

    return {
      years: years,
      nominal: nominal,
      real: real,
      totalOwn: totalOwn,
      totalMatch: totalMatch,
      totalContrib: totalOwn + totalMatch,
      startBalance: startBalance,
      growth: growth
    };
  }

  var el = {};
  var ids = ['currentAge','retireAge','currentBalance','annualSalary',
             'contribPct','matchPct','matchLimitPct','expReturn','inflation'];

  function readInputs() {
    return {
      currentAge:     U.readField(el.currentAge, { min: 0, max: 100, fallback: 30 }).value,
      retireAge:      U.readField(el.retireAge, { min: 0, max: 100, fallback: 65 }).value,
      currentBalance: U.readField(el.currentBalance, { min: 0, fallback: 0 }).value,
      annualSalary:   U.readField(el.annualSalary, { min: 0, fallback: 0 }).value,
      contribPct:     U.readField(el.contribPct, { min: 0, max: 100, fallback: 0 }).value,
      matchPct:       U.readField(el.matchPct, { min: 0, max: 200, fallback: 0 }).value,
      matchLimitPct:  U.readField(el.matchLimitPct, { min: 0, max: 100, fallback: 0 }).value,
      expReturn:      U.readField(el.expReturn, { min: 0, max: 30, fallback: 0 }).value,
      inflation:      U.readField(el.inflation, { min: 0, max: 20, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outNominal', U.formatUSD(r.nominal, false));
    U.setText('outReal', U.formatUSD(r.real, false));
    U.setText('outContribTotal', U.formatUSD(r.totalContrib, false));
    U.setText('outMatchTotal', U.formatUSD(r.totalMatch, false));
    U.setText('outGrowthTotal', U.formatUSD(r.growth, false));
    U.setText('outYears', U.formatNumber(r.years) + (r.years === 1 ? ' year' : ' years'));

    U.announce('Projected retirement balance ' + U.formatUSD(r.nominal, false) +
      ' nominal, about ' + U.formatUSD(r.real, false) +
      ' in today’s dollars after ' + r.years + ' years.');
  }

  function recalc() { render(compute(readInputs())); }

  function init() {
    var ok = true;
    ids.forEach(function (id) { el[id] = document.getElementById(id); if (!el[id]) ok = false; });
    if (!ok) return;

    var debounced = U.debounce(recalc, 120);
    ids.forEach(function (id) {
      var node = el[id];
      var evt = node.tagName === 'SELECT' ? 'change' : 'input';
      node.addEventListener(evt, debounced);
    });
    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.USFC_retirement = { compute: compute };
})();
