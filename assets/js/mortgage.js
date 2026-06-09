/* ==========================================================================
   USFinCalc — Mortgage calculator (mortgage.js)
   Full PITI: Principal & Interest + Taxes + Insurance (+ PMI + HOA).
   Depends on window.USFC (core.js). No client-side storage.

   Element IDs expected in mortgage-calculator.html:
     inputs : homePrice, downAmount, downType(select $|%), loanTerm, rate,
              taxAnnual, taxType(select $|%), insurance, hoa, pmiRate
     outputs: outMonthly, outPI, outTax, outIns, outPmi, outHoa,
              outLoanAmount, outTotalInterest, outTotalPaid, outDownPct, pmiRow
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['homePrice','downAmount','downType','loanTerm','rate',
             'taxAnnual','taxType','insurance','hoa','pmiRate'];
  var el = {};

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var price = Math.max(0, i.homePrice || 0);

    // Down payment: dollar amount or percent of price
    var down = i.downType === '%'
      ? price * (i.downPayment || 0) / 100
      : Math.min(i.downPayment || 0, price);
    down = U.clamp(down, 0, price);

    var loan = price - down;
    var downPct = price > 0 ? down / price : 0;

    var pi = U.monthlyPayment(loan, i.rate || 0, (i.termYears || 0) * 12);

    // Property tax: annual dollars or percent of price -> monthly
    var taxAnnual = i.taxType === '%'
      ? price * (i.taxAnnual || 0) / 100
      : (i.taxAnnual || 0);
    var taxMonthly = taxAnnual / 12;

    var insMonthly = (i.insuranceAnnual || 0) / 12;
    var hoaMonthly = i.hoa || 0;

    // PMI applies only when down payment < 20%. Annual rate % of loan.
    var pmiMonthly = 0;
    var pmiApplies = downPct < 0.20 && loan > 0;
    if (pmiApplies) {
      pmiMonthly = loan * (i.pmiRate || 0) / 100 / 12;
    }

    var monthly = pi + taxMonthly + insMonthly + hoaMonthly + pmiMonthly;
    var months = (i.termYears || 0) * 12;
    var totalPaid = pi * months;              // P&I only, over full term
    var totalInterest = totalPaid - loan;

    return {
      loan: loan,
      downPct: downPct,
      pi: pi,
      taxMonthly: taxMonthly,
      insMonthly: insMonthly,
      hoaMonthly: hoaMonthly,
      pmiMonthly: pmiMonthly,
      pmiApplies: pmiApplies,
      monthly: monthly,
      totalInterest: totalInterest > 0 ? totalInterest : 0,
      totalPaid: totalPaid
    };
  }

  function readInputs() {
    return {
      homePrice:  U.readField(el.homePrice, { min: 0, fallback: 0 }).value,
      downPayment:U.readField(el.downAmount, { min: 0, fallback: 0 }).value,
      downType:   el.downType.value,
      termYears:  U.readField(el.loanTerm, { min: 1, fallback: 30 }).value,
      rate:       U.readField(el.rate, { min: 0, max: 25, fallback: 0 }).value,
      taxAnnual:  U.readField(el.taxAnnual, { min: 0, fallback: 0 }).value,
      taxType:    el.taxType.value,
      insuranceAnnual: U.readField(el.insurance, { min: 0, fallback: 0 }).value,
      hoa:        U.readField(el.hoa, { min: 0, fallback: 0 }).value,
      pmiRate:    U.readField(el.pmiRate, { min: 0, max: 5, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outMonthly', U.formatUSD(r.monthly, true));
    U.setText('outPI', U.formatUSD(r.pi, true));
    U.setText('outTax', U.formatUSD(r.taxMonthly, true));
    U.setText('outIns', U.formatUSD(r.insMonthly, true));
    U.setText('outHoa', U.formatUSD(r.hoaMonthly, true));
    U.setText('outLoanAmount', U.formatUSD(r.loan, false));
    U.setText('outDownPct', U.formatPercent(r.downPct));
    U.setText('outTotalInterest', U.formatUSD(r.totalInterest, false));
    U.setText('outTotalPaid', U.formatUSD(r.totalPaid, false));

    // PMI row toggles visibility
    var pmiRow = document.getElementById('pmiRow');
    if (pmiRow) pmiRow.hidden = !r.pmiApplies;
    U.setText('outPmi', U.formatUSD(r.pmiMonthly, true));

    U.announce('Estimated monthly payment ' + U.formatUSD(r.monthly, true) +
               ', total of ' + U.formatUSD(r.monthly, false) + ' per month including taxes and insurance.');
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
    recalc(); // initial paint from default values
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  // Expose pure fn for tests
  window.USFC_mortgage = { compute: compute };
})();
