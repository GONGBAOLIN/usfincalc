/* ==========================================================================
   USFinCalc — Home affordability calculator (home-affordability.js)
   Estimates the maximum home price you can afford using the standard
   28/36 DTI rule, consistent with the PITI model in mortgage.js.

   Method:
     front-end cap = 28% of gross monthly income  -> max PITI
     back-end cap  = 36% of gross monthly income - other monthly debts
                                                  -> max PITI
     maxPITI = min(front, back)

   PITI = P&I + propertyTax + insurance + PMI (+ HOA).
   Property tax is a % of price; PMI is a % of the loan; both scale with the
   (unknown) price. We solve a closed-form linear equation rather than iterate:

     price = down + loan, where down = price * dpPct  ->  loan = price*(1-dpPct)
     P&I per dollar of loan = mortgageFactor (from amortization)
     PITI(price) = loan*mf + price*taxPct/12 + insMonthly + hoaMonthly
                   + (pmiApplies ? loan*pmiPct/12 : 0)
     Group by price:
       PITI = price * [ (1-dpPct)*mf + taxPct/12 + (pmiApplies?(1-dpPct)*pmiPct/12:0) ]
              + insMonthly + hoaMonthly
     Solve price = (maxPITI - insMonthly - hoaMonthly) / perPrice

   Depends on core.js. No client-side storage.

   Element IDs in home-affordability-calculator.html:
     inputs : annualIncome, monthlyDebts, downPayment, affRate, affTerm,
              affTaxRate, affInsurance, affHoa, affPmiRate, affDtiFront, affDtiBack
     outputs: outMaxPrice, outMaxLoan, outMaxPiti, outAffPI, outAffTax,
              outAffIns, outAffPmi, outAffHoa, outDownUsed, outDtiBinding, affNote
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['annualIncome','monthlyDebts','downPayment','affRate','affTerm',
             'affTaxRate','affInsurance','affHoa','affPmiRate','affDtiFront','affDtiBack'];
  var el = {};

  /** Monthly P&I per $1 of loan principal, given rate% and term months. */
  function mortgageFactor(annualRatePct, termMonths) {
    if (!(termMonths > 0)) return 0;
    var r = (annualRatePct / 100) / 12;
    if (r === 0) return 1 / termMonths;
    var f = Math.pow(1 + r, termMonths);
    return (r * f) / (f - 1);
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var income = Math.max(0, i.annualIncome || 0);
    var debts = Math.max(0, i.monthlyDebts || 0);
    var down = Math.max(0, i.downPayment || 0);
    var grossMonthly = income / 12;

    var frontPct = (i.dtiFront != null ? i.dtiFront : 28) / 100;
    var backPct = (i.dtiBack != null ? i.dtiBack : 36) / 100;

    // Max PITI from each rule; affordability is the lower.
    var frontMax = grossMonthly * frontPct;
    var backMax = grossMonthly * backPct - debts;
    var maxPiti = Math.max(0, Math.min(frontMax, backMax));
    var binding = (backMax < frontMax) ? 'back' : 'front';

    var mf = mortgageFactor(i.rate || 0, (i.termYears || 30) * 12);
    var taxPct = (i.taxRatePct || 0) / 100;
    var pmiPct = (i.pmiRatePct || 0) / 100;
    var insMonthly = (i.insuranceAnnual || 0) / 12;
    var hoaMonthly = i.hoa || 0;

    // We don't know the down-payment % until we know price, so solve in two
    // passes: assume the down payment is a fixed dollar amount. loan = price - down.
    // PITI = (price-down)*mf + price*taxPct/12 + insMonthly + hoaMonthly + pmi
    // PMI applies if down/price < 0.20. We solve assuming PMI applies, then
    // re-solve without PMI if the resulting down% turns out >= 20%.
    function solve(withPmi) {
      // coefficient on price:
      //   (price-down)*mf -> price*mf - down*mf
      //   price*taxPct/12
      //   withPmi: (price-down)*pmiPct/12 -> price*pmiPct/12 - down*pmiPct/12
      var perPrice = mf + taxPct / 12 + (withPmi ? pmiPct / 12 : 0);
      var constant = -down * mf + insMonthly + hoaMonthly +
                     (withPmi ? -down * pmiPct / 12 : 0);
      if (perPrice <= 0) return 0;
      var price = (maxPiti - constant) / perPrice;
      return Math.max(0, price);
    }

    // First pass assuming PMI applies (down < 20%).
    var price = solve(true);
    var downPct = price > 0 ? down / price : 1;
    var pmiApplies = downPct < 0.20;
    if (!pmiApplies) {
      // Re-solve without PMI.
      price = solve(false);
      downPct = price > 0 ? down / price : 1;
    }

    // If the DTI rules leave no room for a payment, nothing is affordable.
    // (Avoids a spurious tiny price from the down-payment term when maxPiti<=0.)
    if (maxPiti <= 0) { price = 0; downPct = 1; pmiApplies = false; }

    var loan = Math.max(0, price - down);
    var pi = loan * mf;
    var taxMonthly = price * taxPct / 12;
    var pmiMonthly = pmiApplies ? loan * pmiPct / 12 : 0;
    var piti = pi + taxMonthly + insMonthly + hoaMonthly + pmiMonthly;

    return {
      maxPrice: price, maxLoan: loan, maxPiti: maxPiti, actualPiti: piti,
      pi: pi, taxMonthly: taxMonthly, insMonthly: insMonthly,
      pmiMonthly: pmiMonthly, hoaMonthly: hoaMonthly, downUsed: down,
      downPct: downPct, pmiApplies: pmiApplies, binding: binding,
      grossMonthly: grossMonthly
    };
  }

  function readInputs() {
    return {
      annualIncome:    U.readField(el.annualIncome, { min: 0, fallback: 0 }).value,
      monthlyDebts:    U.readField(el.monthlyDebts, { min: 0, fallback: 0 }).value,
      downPayment:     U.readField(el.downPayment, { min: 0, fallback: 0 }).value,
      rate:            U.readField(el.affRate, { min: 0, max: 25, fallback: 0 }).value,
      termYears:       U.readField(el.affTerm, { min: 1, fallback: 30 }).value,
      taxRatePct:      U.readField(el.affTaxRate, { min: 0, max: 10, fallback: 0 }).value,
      insuranceAnnual: U.readField(el.affInsurance, { min: 0, fallback: 0 }).value,
      hoa:             U.readField(el.affHoa, { min: 0, fallback: 0 }).value,
      pmiRatePct:      U.readField(el.affPmiRate, { min: 0, max: 5, fallback: 0 }).value,
      dtiFront:        U.readField(el.affDtiFront, { min: 1, max: 100, fallback: 28 }).value,
      dtiBack:         U.readField(el.affDtiBack, { min: 1, max: 100, fallback: 36 }).value
    };
  }

  function render(r) {
    U.setText('outMaxPrice', U.formatUSD(r.maxPrice, false));
    U.setText('outMaxLoan', U.formatUSD(r.maxLoan, false));
    U.setText('outMaxPiti', U.formatUSD(r.maxPiti, true));
    U.setText('outAffPI', U.formatUSD(r.pi, true));
    U.setText('outAffTax', U.formatUSD(r.taxMonthly, true));
    U.setText('outAffIns', U.formatUSD(r.insMonthly, true));
    U.setText('outAffHoa', U.formatUSD(r.hoaMonthly, true));
    U.setText('outDownUsed', U.formatUSD(r.downUsed, false) + ' (' + U.formatPercent(r.downPct) + ')');

    var pmiRow = document.getElementById('affPmiRow');
    if (pmiRow) pmiRow.hidden = !r.pmiApplies;
    U.setText('outAffPmi', U.formatUSD(r.pmiMonthly, true));

    var note = document.getElementById('affNote');
    if (note) {
      note.textContent = r.maxPrice <= 0
        ? 'Your monthly debts use up the 36% limit — pay down debt or lower your assumptions to qualify.'
        : (r.binding === 'back'
            ? 'Your existing debts are the limiting factor (the 36% back-end rule applies).'
            : 'Your income is the limiting factor (the 28% front-end rule applies).');
    }

    U.announce('Estimated maximum home price ' + U.formatUSD(r.maxPrice, false) + '.');

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('affChart');
    if (!container || !U.renderDonutChart) return;
    U.renderDonutChart(container, {
      segments: [
        { label: 'Principal & interest', value: r.pi,         color: 'var(--chart-3)' },
        { label: 'Property tax',         value: r.taxMonthly, color: 'var(--chart-2)' },
        { label: 'Home insurance',       value: r.insMonthly, color: 'var(--chart-5)' },
        { label: 'PMI',                  value: r.pmiApplies ? r.pmiMonthly : 0, color: 'var(--chart-4)' },
        { label: 'HOA',                  value: r.hoaMonthly, color: 'var(--chart-6)' }
      ],
      centerLabel: U.formatUSD(r.maxPiti, true),
      centerSub: 'max PITI / mo',
      valueFormat: function (v) { return U.formatUSD(v, true); },
      title: 'How your maximum monthly payment splits across principal, interest, taxes, insurance, PMI and HOA'
    });
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

  window.USFC_affordability = { compute: compute, mortgageFactor: mortgageFactor };
})();
