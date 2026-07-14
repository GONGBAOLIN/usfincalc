(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['batteryCapacity','batteryCost','installCost','peakRate',
             'offPeakRate','dailyCycling','solarPaired','backupValue',
             'degradation','federalITC','demandSavings'];
  var el = {};

  function compute(i) {
    var totalHardware = i.batteryCost + i.installCost;
    var itcCredit = i.solarPaired === 'yes' ? totalHardware * (i.federalITC / 100) : 0;
    var netCost = Math.max(0, totalHardware - itcCredit);

    var rateDiff = Math.max(0, i.peakRate - i.offPeakRate);
    var dailyArbitrage = i.dailyCycling * rateDiff;
    var annualArbitrage = dailyArbitrage * 365;
    var annualDemand = i.demandSavings * 12;
    var annualBackup = i.backupValue;

    var cumulativeSavings = [];
    var costLine = [];
    var totalSavings = 0;
    var paybackYear = null;
    var period = 15;

    for (var y = 1; y <= period; y++) {
      var yearDeg = Math.pow(1 - i.degradation / 100, y - 1);
      var yearArbitrage = annualArbitrage * yearDeg;
      var yearDemand = annualDemand * yearDeg;
      var yearSavings = yearArbitrage + yearDemand + annualBackup;

      totalSavings += yearSavings;
      cumulativeSavings.push(totalSavings);
      costLine.push(netCost);

      if (paybackYear === null && totalSavings >= netCost) {
        var prev = y > 1 ? cumulativeSavings[y - 2] : 0;
        paybackYear = (y - 1) + (netCost - prev) / (totalSavings - prev);
      }
    }

    var roi10yr = netCost > 0 && cumulativeSavings.length >= 10
      ? (cumulativeSavings[9] - netCost) / netCost : 0;

    var lifetimeCycles = i.dailyCycling * 365 * 10;
    var effectiveCostPerKWh = lifetimeCycles > 0 ? netCost / lifetimeCycles : 0;

    var annualSavingsY1 = annualArbitrage + annualDemand + annualBackup;

    return {
      annualSavings: annualSavingsY1,
      paybackYears: paybackYear || period,
      roi10yr: roi10yr,
      effectiveCostPerKWh: effectiveCostPerKWh,
      lifetimeValue: totalSavings,
      netCost: netCost,
      itcCredit: itcCredit,
      cumulativeSavings: cumulativeSavings,
      costLine: costLine
    };
  }

  function readInputs() {
    return {
      batteryCapacity: U.readField(el.batteryCapacity, { min: 1, max: 100, fallback: 13.5 }).value,
      batteryCost: U.readField(el.batteryCost, { min: 0, fallback: 10000 }).value,
      installCost: U.readField(el.installCost, { min: 0, fallback: 3500 }).value,
      peakRate: U.readField(el.peakRate, { min: 0.01, max: 2, fallback: 0.35 }).value,
      offPeakRate: U.readField(el.offPeakRate, { min: 0.01, max: 2, fallback: 0.12 }).value,
      dailyCycling: U.readField(el.dailyCycling, { min: 0, max: 100, fallback: 10 }).value,
      solarPaired: el.solarPaired.value,
      backupValue: U.readField(el.backupValue, { min: 0, fallback: 200 }).value,
      degradation: U.readField(el.degradation, { min: 0, max: 10, fallback: 2 }).value,
      federalITC: U.readField(el.federalITC, { min: 0, max: 100, fallback: 30 }).value,
      demandSavings: U.readField(el.demandSavings, { min: 0, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outAnnualSavings', U.formatUSD(r.annualSavings, false));
    U.setText('outPayback', r.paybackYears < 15 ? r.paybackYears.toFixed(1) + ' years' : '15+ years');
    U.setText('outROI10', U.formatPercent(r.roi10yr));
    U.setText('outCostPerKWh', '$' + r.effectiveCostPerKWh.toFixed(3) + '/kWh');
    U.setText('outLifetime', U.formatUSD(r.lifetimeValue, false));
    U.setText('outNetCost', U.formatUSD(r.netCost, false));
    U.setText('outITC', U.formatUSD(r.itcCredit, false));

    U.announce('Annual savings ' + U.formatUSD(r.annualSavings, false) +
               ', payback in ' + (r.paybackYears < 15 ? r.paybackYears.toFixed(1) + ' years' : 'over 15 years') + '.');

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('batteryChart');
    if (!container || !U.renderLineChart) return;
    if (!r.cumulativeSavings.length) { container.innerHTML = ''; return; }

    U.renderLineChart(container, {
      series: [
        { points: r.cumulativeSavings, color: 'var(--chart-1)', label: 'Cumulative savings' },
        { points: r.costLine, color: 'var(--chart-2)', label: 'Battery system cost' }
      ],
      xLabel: 'Years',
      xTicks: [
        { i: 0, label: '1' },
        { i: 4, label: '5' },
        { i: 9, label: '10' },
        { i: 14, label: '15' }
      ],
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Cumulative battery savings vs. system cost over 15 years'
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

  window.USFC_homeBattery = { compute: compute };
})();
