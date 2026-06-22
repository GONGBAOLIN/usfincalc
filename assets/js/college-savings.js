/* ==========================================================================
   USFinCalc — 529 College Savings calculator (college-savings.js)
   Projects what a 529 plan will be worth when a child starts college and
   compares it to the inflated cost of a degree.

   Model:
     yearsToCollege Y = max(0, collegeStartAge - childAge)
     n = Y * 12 months; net return r = max(0, annualReturn - expenseRatio);
     monthly return m = r/12

     Projected balance AT matriculation (net of plan fees):
       FV = currentSavings*(1+r)^Y  +  monthly*[((1+m)^n - 1)/m]
       (lump grows at the net rate; contributions as an ordinary annuity)

     Fee drag = same projection at the gross return minus the net projection.

     Inflated cost of college year k (k=0..collegeYears-1), paid at time Y+k:
       cost_k = annualCostNow * (1 + infl)^(Y + k)
     Total nominal cost = Σ cost_k

     Goal needed AT matriculation, assuming the balance keeps earning r while
     it's drawn down over the college years (first year paid immediately):
       goal = Σ cost_k / (1+r)^k

     Gap = FV - goal  (negative = shortfall)
     Coverage = FV / goal
     Required monthly to fully fund:
       requiredMonthly = (goal - currentSavings*(1+r)^Y) / [((1+m)^n - 1)/m]

   Depends on core.js. No client-side storage.

   Element IDs in 529-college-savings-calculator.html:
     inputs : childAge, collegeAge, collegeYears, currentSavings,
              monthlyContribution, expectedReturn, expenseRatio, annualCostNow,
              costInflation
     outputs: outProjSavings, outProjCost, outGoalNow, outGap, outCoverage,
              outFeeCost, outRequiredMonthly, csNote
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['childAge','collegeAge','collegeYears','currentSavings',
             'monthlyContribution','expectedReturn','expenseRatio','annualCostNow','costInflation'];
  var el = {};

  /** Future value of an ordinary annuity of `pmt` over `n` periods at rate `m`. */
  function annuityFV(pmt, m, n) {
    if (!(n > 0)) return 0;
    if (m === 0) return pmt * n;
    return pmt * ((Math.pow(1 + m, n) - 1) / m);
  }
  /** Annuity factor [((1+m)^n - 1)/m] — FV per $1 of periodic contribution. */
  function annuityFactor(m, n) {
    if (!(n > 0)) return 0;
    if (m === 0) return n;
    return (Math.pow(1 + m, n) - 1) / m;
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var childAge = Math.max(0, i.childAge || 0);
    var collegeAge = Math.max(0, i.collegeAge || 18);
    var collegeYears = Math.max(1, Math.round(i.collegeYears || 4));
    var current = Math.max(0, i.currentSavings || 0);
    var monthly = Math.max(0, i.monthlyContribution || 0);
    var grossR = (i.expectedReturn || 0) / 100;
    var fee = Math.max(0, (i.expenseRatio || 0) / 100);
    // Net-of-fee return drives the actual projection; never below zero.
    var r = Math.max(0, grossR - fee);
    var infl = (i.costInflation || 0) / 100;
    var annualCostNow = Math.max(0, i.annualCostNow || 0);

    var Y = Math.max(0, collegeAge - childAge);
    var m = r / 12;
    var n = Math.round(Y * 12);

    // Projected balance at matriculation (net of fees).
    var lumpFV = current * Math.pow(1 + r, Y);
    var contribFV = annuityFV(monthly, m, n);
    var projSavings = lumpFV + contribFV;

    // Same projection at the gross (pre-fee) return, to isolate the fee drag.
    var mGross = grossR / 12;
    var projGross = current * Math.pow(1 + grossR, Y) + annuityFV(monthly, mGross, n);
    var feeCost = Math.max(0, projGross - projSavings);

    // Inflated cost per college year and discounted goal at matriculation.
    var totalCost = 0;
    var goal = 0;
    for (var k = 0; k < collegeYears; k++) {
      var costK = annualCostNow * Math.pow(1 + infl, Y + k);
      totalCost += costK;
      goal += costK / Math.pow(1 + r, k);
    }

    var gap = projSavings - goal;                 // negative => shortfall
    var coverage = goal > 0 ? projSavings / goal : (projSavings > 0 ? 1 : 0);

    // Required monthly to exactly hit the goal, keeping current savings.
    var factor = annuityFactor(m, n);
    var requiredMonthly;
    if (factor > 0) {
      requiredMonthly = Math.max(0, (goal - lumpFV) / factor);
    } else {
      // No time to contribute (already at/after college age).
      requiredMonthly = 0;
    }

    return {
      yearsToCollege: Y, projSavings: projSavings, totalCost: totalCost,
      goalNow: goal, gap: gap, coverage: coverage, feeCost: feeCost,
      requiredMonthly: requiredMonthly, fullyFunded: gap >= 0
    };
  }

  function readInputs() {
    return {
      childAge:            U.readField(el.childAge, { min: 0, max: 30, fallback: 3 }).value,
      collegeAge:          U.readField(el.collegeAge, { min: 1, max: 40, fallback: 18 }).value,
      collegeYears:        U.readField(el.collegeYears, { min: 1, max: 10, fallback: 4 }).value,
      currentSavings:      U.readField(el.currentSavings, { min: 0, fallback: 0 }).value,
      monthlyContribution: U.readField(el.monthlyContribution, { min: 0, fallback: 0 }).value,
      expectedReturn:      U.readField(el.expectedReturn, { min: 0, max: 20, fallback: 6 }).value,
      expenseRatio:        U.readField(el.expenseRatio, { min: 0, max: 5, fallback: 0 }).value,
      annualCostNow:       U.readField(el.annualCostNow, { min: 0, fallback: 0 }).value,
      costInflation:       U.readField(el.costInflation, { min: 0, max: 15, fallback: 5 }).value
    };
  }

  function render(r) {
    U.setText('outProjSavings', U.formatUSD(r.projSavings, false));
    U.setText('outProjCost', U.formatUSD(r.totalCost, false));
    U.setText('outGoalNow', U.formatUSD(r.goalNow, false));
    U.setText('outGap', (r.gap >= 0 ? '+' : '−') + U.formatUSD(Math.abs(r.gap), false).replace(/^[-−]/, ''));
    U.setText('outCoverage', U.formatPercent(r.coverage));
    U.setText('outFeeCost', U.formatUSD(r.feeCost, false));
    U.setText('outRequiredMonthly', U.formatUSD(r.requiredMonthly, true));

    var gapEl = document.getElementById('outGap');
    if (gapEl) gapEl.style.color = r.gap >= 0 ? 'var(--color-accent)' : 'var(--color-warning)';

    var note = document.getElementById('csNote');
    if (note) {
      if (r.yearsToCollege <= 0) {
        note.textContent = 'College starts now or has started — contributions no longer have time to grow. The goal shown assumes the balance is drawn down over the college years.';
      } else if (r.fullyFunded) {
        note.textContent = 'On track: your projected savings cover the estimated cost. Any surplus can roll to another beneficiary or, within limits, a Roth IRA.';
      } else {
        note.textContent = 'Projected shortfall. To fully fund the goal, contribute about ' +
          U.formatUSD(r.requiredMonthly, true) + '/month instead.';
      }
    }

    U.announce('Projected 529 balance ' + U.formatUSD(r.projSavings, false) +
               ' against a goal of ' + U.formatUSD(r.goalNow, false) + '.');
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

  window.USFC_college = { compute: compute, annuityFV: annuityFV };
})();
