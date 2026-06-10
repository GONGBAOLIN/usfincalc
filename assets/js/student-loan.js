/* ==========================================================================
   USFinCalc — Student loan calculator (student-loan.js)
   Federal standard repayment (fixed payment over the term) plus the impact of
   an optional extra monthly payment: months saved and interest saved.
   Depends on core.js. No client-side storage.

   Scope by design: models a single fixed-rate loan on the standard amortization
   schedule. Does NOT model income-driven plans (IBR/SAVE/PAYE), forgiveness,
   grace-period interest capitalization, or private-vs-federal differences.
   Those vary widely and are covered by the disclaimer, not by added rules.

   Element IDs in student-loan-calculator.html:
     inputs : balance, intRate, termYears, extra
     outputs: outMonthly, outPayoffWith, outInterestBase, outInterestWith,
              outInterestSaved, outTimeSaved
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['balance', 'intRate', 'termYears', 'extra'];
  var el = {};

  /* Simulate month-by-month payoff given a fixed base payment plus optional
     extra. Returns total interest paid and the number of months to payoff. */
  function simulate(balance, monthlyRate, basePayment, extra) {
    var bal = balance;
    var pay = basePayment + Math.max(0, extra);
    var totalInterest = 0;
    var months = 0;
    // Cap iterations so a too-small payment can't loop forever.
    var MAX = 1200; // 100 years
    while (bal > 0.005 && months < MAX) {
      var interest = bal * monthlyRate;
      var principal = pay - interest;
      if (principal <= 0) { months = MAX; break; } // payment can't cover interest
      if (principal > bal) principal = bal;
      bal -= principal;
      totalInterest += interest;
      months++;
    }
    return { months: months, totalInterest: totalInterest, capped: months >= MAX };
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var balance = Math.max(0, i.balance || 0);
    var annualRate = Math.max(0, i.intRate || 0);
    var years = Math.max(1, i.termYears || 10);
    var extra = Math.max(0, i.extra || 0);

    var monthlyRate = annualRate / 100 / 12;
    var termMonths = Math.round(years * 12);

    // Standard fixed monthly payment over the full term.
    var monthly = U.monthlyPayment(balance, annualRate, termMonths);

    // Baseline: no extra payment, pay over the scheduled term.
    var base = simulate(balance, monthlyRate, monthly, 0);
    // With extra payment: same base payment + extra each month.
    var withExtra = simulate(balance, monthlyRate, monthly, extra);

    var interestSaved = base.totalInterest - withExtra.totalInterest;
    if (interestSaved < 0) interestSaved = 0;
    var monthsSaved = base.months - withExtra.months;
    if (monthsSaved < 0) monthsSaved = 0;

    return {
      monthly: monthly,
      payoffWithMonths: withExtra.months,
      interestBase: base.totalInterest,
      interestWith: withExtra.totalInterest,
      interestSaved: interestSaved,
      monthsSaved: monthsSaved,
      hasExtra: extra > 0
    };
  }

  function readInputs() {
    return {
      balance:   U.readField(el.balance, { min: 0, fallback: 0 }).value,
      intRate:   U.readField(el.intRate, { min: 0, max: 30, fallback: 0 }).value,
      termYears: U.readField(el.termYears, { min: 1, max: 30, fallback: 10 }).value,
      extra:     U.readField(el.extra, { min: 0, fallback: 0 }).value
    };
  }

  /* Format a month count as "Ny Mm" (e.g. 126 -> "10y 6m"). */
  function fmtMonths(m) {
    var y = Math.floor(m / 12);
    var mo = m % 12;
    if (y <= 0) return mo + 'm';
    if (mo === 0) return y + 'y';
    return y + 'y ' + mo + 'm';
  }

  function render(r) {
    U.setText('outMonthly', U.formatUSD(r.monthly, true));
    U.setText('outPayoffWith', fmtMonths(r.payoffWithMonths));
    U.setText('outInterestBase', U.formatUSD(r.interestBase, false));
    U.setText('outInterestWith', U.formatUSD(r.interestWith, false));
    U.setText('outInterestSaved', r.hasExtra ? U.formatUSD(r.interestSaved, false) : '$0');
    U.setText('outTimeSaved', r.hasExtra ? fmtMonths(r.monthsSaved) : '0m');

    U.announce('Standard payment ' + U.formatUSD(r.monthly, true) + ' per month. ' +
      (r.hasExtra
        ? 'With extra payments you save ' + U.formatUSD(r.interestSaved, false) +
          ' in interest and pay off ' + fmtMonths(r.monthsSaved) + ' sooner.'
        : 'Add an extra monthly payment to see interest and time saved.'));
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

  window.USFC_studentloan = { compute: compute };
})();
