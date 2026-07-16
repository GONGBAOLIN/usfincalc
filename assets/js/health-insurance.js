(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = [
    'deductible', 'coinsurance', 'copay', 'oopMax',
    'expectedCosts', 'premium', 'hsaContribution', 'taxRate'
  ];
  var el = {};

  function compute(i) {
    var yourCostForCare;
    if (i.expectedCosts <= i.deductible) {
      yourCostForCare = i.expectedCosts;
    } else {
      var overDeductible = i.expectedCosts - i.deductible;
      var coinsuranceCost = overDeductible * (i.coinsurance / 100);
      yourCostForCare = Math.min(i.deductible + coinsuranceCost, i.oopMax);
    }

    var annualPremiums = i.premium * 12;
    var totalAnnualCost = yourCostForCare + annualPremiums;
    var hsaTaxSaving = i.hsaContribution * (i.taxRate / 100);
    var effectiveCost = totalAnnualCost - hsaTaxSaving;
    var insuranceSaved = Math.max(0, i.expectedCosts - yourCostForCare);

    var deductiblePortion = Math.min(i.expectedCosts, i.deductible);
    var coinsurancePortion = yourCostForCare - deductiblePortion;

    return {
      yourCostForCare: yourCostForCare,
      annualPremiums: annualPremiums,
      totalAnnualCost: totalAnnualCost,
      hsaTaxSaving: hsaTaxSaving,
      effectiveCost: effectiveCost,
      insuranceSaved: insuranceSaved,
      deductiblePortion: deductiblePortion,
      coinsurancePortion: coinsurancePortion
    };
  }

  function readInputs() {
    return {
      deductible: U.readField(el.deductible, { min: 0, fallback: 1500 }).value,
      coinsurance: U.readField(el.coinsurance, { min: 0, max: 100, fallback: 20 }).value,
      copay: U.readField(el.copay, { min: 0, fallback: 30 }).value,
      oopMax: U.readField(el.oopMax, { min: 0, fallback: 8000 }).value,
      expectedCosts: U.readField(el.expectedCosts, { min: 0, fallback: 5000 }).value,
      premium: U.readField(el.premium, { min: 0, fallback: 450 }).value,
      hsaContribution: U.readField(el.hsaContribution, { min: 0, fallback: 0 }).value,
      taxRate: U.readField(el.taxRate, { min: 0, max: 50, fallback: 24 }).value
    };
  }

  function render(r) {
    U.setText('outYourCost', U.formatUSD(r.yourCostForCare, false));
    U.setText('outPremiums', U.formatUSD(r.annualPremiums, false));
    U.setText('outTotalCost', U.formatUSD(r.totalAnnualCost, false));
    U.setText('outHsaSaving', U.formatUSD(r.hsaTaxSaving, false));
    U.setText('outEffective', U.formatUSD(r.effectiveCost, false));
    U.setText('outInsuranceSaved', U.formatUSD(r.insuranceSaved, false));
    U.announce('Total annual healthcare cost is ' + U.formatUSD(r.totalAnnualCost, false));
    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('chartHealthInsurance');
    if (!container || !U.renderDonutChart) return;

    var segments = [];
    if (r.annualPremiums > 0) segments.push({ label: 'Premiums', value: r.annualPremiums, color: 'var(--chart-3)' });
    if (r.deductiblePortion > 0) segments.push({ label: 'Deductible', value: r.deductiblePortion, color: 'var(--chart-2)' });
    if (r.coinsurancePortion > 0) segments.push({ label: 'Coinsurance', value: r.coinsurancePortion, color: 'var(--chart-4)' });
    if (r.insuranceSaved > 0) segments.push({ label: 'Insurance covers', value: r.insuranceSaved, color: 'var(--chart-1)' });

    U.renderDonutChart(container, {
      segments: segments,
      centerLabel: U.formatUSD(r.totalAnnualCost, false),
      centerSub: 'you pay/year',
      valueFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Annual healthcare cost breakdown'
    });
  }

  function recalc() { render(compute(readInputs())); }

  function init() {
    var ok = true;
    ids.forEach(function (id) {
      el[id] = document.getElementById(id);
      if (!el[id]) ok = false;
    });
    if (!ok) return;

    var debounced = U.debounce(recalc, 120);
    ids.forEach(function (id) {
      el[id].addEventListener('input', debounced);
    });
    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.USFC_healthInsurance = { compute: compute };
})();
