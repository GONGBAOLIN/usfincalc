/* ==========================================================================
   USFinCalc — Auto loan calculator (auto-loan.js)
   Monthly car payment with sales tax and trade-in. Depends on core.js.
   No client-side storage.

   Sales tax convention: most US states tax (vehicle price - trade-in value),
   i.e. the trade-in reduces the taxable amount. A few states tax the full
   price; this calculator uses the common trade-in-credit method and says so.

   Element IDs in auto-loan-calculator.html:
     inputs : price, downAuto, tradeIn, salesTax, termMonths, apr
     outputs: outMonthlyAuto, outFinanced, outSalesTax, outTotalInterestAuto,
              outTotalCostAuto, outUpfront
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['price','downAuto','tradeIn','salesTax','termMonths','apr'];
  var el = {};

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var price = Math.max(0, i.price || 0);
    var down = Math.max(0, i.down || 0);
    var trade = U.clamp(i.tradeIn || 0, 0, price);

    // Sales tax on price minus trade-in credit (common-state method)
    var taxableBase = Math.max(0, price - trade);
    var salesTax = taxableBase * (i.salesTaxPct || 0) / 100;

    // Amount financed = price + tax - down - trade-in
    var financed = price + salesTax - down - trade;
    if (financed < 0) financed = 0;

    var months = Math.max(0, i.termMonths || 0);
    var monthly = U.monthlyPayment(financed, i.apr || 0, months);

    var totalPaid = monthly * months;
    var totalInterest = totalPaid - financed;
    if (totalInterest < 0) totalInterest = 0;

    var upfront = down + trade;
    // Total cost of the car to the buyer: down + trade + all loan payments
    var totalCost = down + trade + totalPaid;

    return {
      salesTax: salesTax,
      financed: financed,
      monthly: monthly,
      totalInterest: totalInterest,
      totalCost: totalCost,
      upfront: upfront
    };
  }

  function readInputs() {
    return {
      price:       U.readField(el.price, { min: 0, fallback: 0 }).value,
      down:        U.readField(el.downAuto, { min: 0, fallback: 0 }).value,
      tradeIn:     U.readField(el.tradeIn, { min: 0, fallback: 0 }).value,
      salesTaxPct: U.readField(el.salesTax, { min: 0, max: 15, fallback: 0 }).value,
      termMonths:  U.readField(el.termMonths, { min: 1, fallback: 60 }).value,
      apr:         U.readField(el.apr, { min: 0, max: 30, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outMonthlyAuto', U.formatUSD(r.monthly, true));
    U.setText('outFinanced', U.formatUSD(r.financed, false));
    U.setText('outSalesTax', U.formatUSD(r.salesTax, false));
    U.setText('outTotalInterestAuto', U.formatUSD(r.totalInterest, false));
    U.setText('outTotalCostAuto', U.formatUSD(r.totalCost, false));
    U.setText('outUpfront', U.formatUSD(r.upfront, false));

    U.announce('Estimated car payment ' + U.formatUSD(r.monthly, true) +
               ' per month, financing ' + U.formatUSD(r.financed, false) + '.');
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

  window.USFC_autoloan = { compute: compute };
})();
