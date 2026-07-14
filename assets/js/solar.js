(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['systemCost','systemSize','monthlyBill','elecRate','sunHours',
             'degradation','netMetering','federalITC','stateIncentive',
             'annualIncrease','purchaseMethod','loanRate','loanTerm'];
  var el = {};

  function compute(i) {
    var itcCredit = i.systemCost * (i.federalITC / 100);
    var netCost = Math.max(0, i.systemCost - itcCredit - i.stateIncentive);

    var year1kWh = i.systemSize * i.sunHours;

    var loanTotalCost = netCost;
    var monthlyPmt = 0;
    if (i.purchaseMethod === 'loan' && i.loanRate > 0 && i.loanTerm > 0) {
      monthlyPmt = U.monthlyPayment(netCost, i.loanRate, i.loanTerm * 12);
      loanTotalCost = monthlyPmt * i.loanTerm * 12;
    }
    var effectiveCost = i.purchaseMethod === 'loan' ? loanTotalCost : netCost;

    var cumulativeSavings = [];
    var costLine = [];
    var totalSavings = 0;
    var paybackYear = null;

    for (var y = 1; y <= 25; y++) {
      var yearProduction = year1kWh * Math.pow(1 - i.degradation / 100, y - 1);
      var yearRate = i.elecRate * Math.pow(1 + i.annualIncrease / 100, y - 1);
      var yearSavings = yearProduction * yearRate * (i.netMetering / 100);
      totalSavings += yearSavings;

      cumulativeSavings.push(totalSavings);
      costLine.push(effectiveCost);

      if (paybackYear === null && totalSavings >= effectiveCost) {
        var prev = y > 1 ? cumulativeSavings[y - 2] : 0;
        paybackYear = (y - 1) + (effectiveCost - prev) / (totalSavings - prev);
      }
    }

    var monthlySavingsY1 = (year1kWh * i.elecRate * (i.netMetering / 100)) / 12;
    var roi = effectiveCost > 0 ? (totalSavings - effectiveCost) / effectiveCost : 0;

    return {
      paybackYears: paybackYear || 25,
      totalSavings25yr: totalSavings,
      roi: roi,
      year1Production: year1kWh,
      monthlySavings: monthlySavingsY1,
      netCost: netCost,
      effectiveCost: effectiveCost,
      itcCredit: itcCredit,
      cumulativeSavings: cumulativeSavings,
      costLine: costLine
    };
  }

  function readInputs() {
    return {
      systemCost: U.readField(el.systemCost, { min: 0, fallback: 25000 }).value,
      systemSize: U.readField(el.systemSize, { min: 0.1, max: 100, fallback: 8 }).value,
      monthlyBill: U.readField(el.monthlyBill, { min: 0, fallback: 150 }).value,
      elecRate: U.readField(el.elecRate, { min: 0.01, max: 1, fallback: 0.16 }).value,
      sunHours: U.readField(el.sunHours, { min: 800, max: 2600, fallback: 1600 }).value,
      degradation: U.readField(el.degradation, { min: 0, max: 5, fallback: 0.5 }).value,
      netMetering: U.readField(el.netMetering, { min: 0, max: 100, fallback: 100 }).value,
      federalITC: U.readField(el.federalITC, { min: 0, max: 100, fallback: 30 }).value,
      stateIncentive: U.readField(el.stateIncentive, { min: 0, fallback: 0 }).value,
      annualIncrease: U.readField(el.annualIncrease, { min: 0, max: 15, fallback: 3 }).value,
      purchaseMethod: el.purchaseMethod.value,
      loanRate: U.readField(el.loanRate, { min: 0, max: 20, fallback: 5.5 }).value,
      loanTerm: U.readField(el.loanTerm, { min: 1, max: 30, fallback: 15 }).value
    };
  }

  function render(r) {
    U.setText('outPayback', r.paybackYears < 25 ? r.paybackYears.toFixed(1) + ' years' : '25+ years');
    U.setText('outSavings25', U.formatUSD(r.totalSavings25yr, false));
    U.setText('outROI', U.formatPercent(r.roi));
    U.setText('outYear1kWh', U.formatNumber(Math.round(r.year1Production)) + ' kWh');
    U.setText('outMonthlySavings', U.formatUSD(r.monthlySavings, true));
    U.setText('outNetCost', U.formatUSD(r.netCost, false));
    U.setText('outITC', U.formatUSD(r.itcCredit, false));

    U.announce('Estimated payback ' + (r.paybackYears < 25 ? r.paybackYears.toFixed(1) + ' years' : 'over 25 years') +
               ', with 25-year savings of ' + U.formatUSD(r.totalSavings25yr, false) + '.');

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('solarChart');
    if (!container || !U.renderLineChart) return;
    if (!r.cumulativeSavings.length) { container.innerHTML = ''; return; }

    U.renderLineChart(container, {
      series: [
        { points: r.cumulativeSavings, color: 'var(--chart-1)', label: 'Cumulative savings' },
        { points: r.costLine, color: 'var(--chart-2)', label: 'System cost' }
      ],
      xLabel: 'Years',
      xTicks: [
        { i: 0, label: '1' },
        { i: 4, label: '5' },
        { i: 9, label: '10' },
        { i: 14, label: '15' },
        { i: 19, label: '20' },
        { i: 24, label: '25' }
      ],
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Cumulative solar savings vs. system cost over 25 years'
    });
  }

  function recalc() { render(compute(readInputs())); }

  function toggleLoan() {
    var loanFields = document.getElementById('loanFields');
    if (loanFields) loanFields.hidden = el.purchaseMethod.value !== 'loan';
  }

  function init() {
    var ok = true;
    ids.forEach(function (id) { el[id] = document.getElementById(id); if (!el[id]) ok = false; });
    if (!ok) return;

    toggleLoan();

    var debounced = U.debounce(recalc, 120);
    ids.forEach(function (id) {
      var node = el[id];
      var evt = node.tagName === 'SELECT' ? 'change' : 'input';
      node.addEventListener(evt, debounced);
    });
    el.purchaseMethod.addEventListener('change', toggleLoan);
    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.USFC_solar = { compute: compute };
})();
