(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['fuelType','fuelPrice','annualHeating','annualCooling',
             'hspf','seer','installCost','existingEfficiency',
             'climateZone','federalCredit','stateRebate'];
  var el = {};

  var CLIMATE_FACTORS = {
    '1': { heat: 0.4, cool: 1.6 },
    '2': { heat: 0.6, cool: 1.4 },
    '3': { heat: 0.8, cool: 1.2 },
    '4': { heat: 1.0, cool: 1.0 },
    '5': { heat: 1.2, cool: 0.8 },
    '6': { heat: 1.4, cool: 0.6 },
    '7': { heat: 1.6, cool: 0.4 }
  };

  var CO2_PER_DOLLAR = {
    'gas': 11.7,
    'oil': 15.6,
    'propane': 12.7,
    'electric': 0
  };

  function compute(i) {
    var netCost = Math.max(0, i.installCost - i.federalCredit - i.stateRebate);

    var heatPumpCOP = i.hspf / 3.412;
    var existingEff = i.existingEfficiency / 100;

    var cf = CLIMATE_FACTORS[i.climateZone] || CLIMATE_FACTORS['4'];

    var adjHeating = i.annualHeating * cf.heat;
    var adjCooling = i.annualCooling * cf.cool;

    var heatingSavingsFrac;
    if (i.fuelType === 'electric') {
      heatingSavingsFrac = 1 - (1 / heatPumpCOP);
    } else {
      heatingSavingsFrac = 1 - (existingEff / heatPumpCOP);
    }
    heatingSavingsFrac = Math.max(0, heatingSavingsFrac);

    var existingSEER = 13;
    var coolingSavingsFrac = Math.max(0, 1 - (existingSEER / i.seer));

    var annualHeatingSavings = adjHeating * heatingSavingsFrac;
    var annualCoolingSavings = adjCooling * coolingSavingsFrac;
    var annualSavings = annualHeatingSavings + annualCoolingSavings;

    var paybackYears = annualSavings > 0 ? netCost / annualSavings : 99;

    var cumulativeSavings = [];
    var costLine = [];
    for (var y = 1; y <= 15; y++) {
      cumulativeSavings.push(annualSavings * y);
      costLine.push(netCost);
    }

    var co2Factor = CO2_PER_DOLLAR[i.fuelType] || 0;
    var co2Reduction = annualHeatingSavings * co2Factor;

    return {
      annualSavings: annualSavings,
      paybackYears: Math.min(paybackYears, 99),
      totalSavings15yr: annualSavings * 15,
      co2Reduction: co2Reduction,
      monthlyHeatingSavings: annualHeatingSavings / 12,
      monthlyCoolingSavings: annualCoolingSavings / 12,
      netCost: netCost,
      cumulativeSavings: cumulativeSavings,
      costLine: costLine
    };
  }

  function readInputs() {
    return {
      fuelType: el.fuelType.value,
      fuelPrice: U.readField(el.fuelPrice, { min: 0.01, fallback: 1.20 }).value,
      annualHeating: U.readField(el.annualHeating, { min: 0, fallback: 1800 }).value,
      annualCooling: U.readField(el.annualCooling, { min: 0, fallback: 600 }).value,
      hspf: U.readField(el.hspf, { min: 5, max: 20, fallback: 10 }).value,
      seer: U.readField(el.seer, { min: 8, max: 40, fallback: 20 }).value,
      installCost: U.readField(el.installCost, { min: 0, fallback: 12000 }).value,
      existingEfficiency: U.readField(el.existingEfficiency, { min: 40, max: 100, fallback: 80 }).value,
      climateZone: el.climateZone.value,
      federalCredit: U.readField(el.federalCredit, { min: 0, max: 2000, fallback: 2000 }).value,
      stateRebate: U.readField(el.stateRebate, { min: 0, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outAnnualSavings', U.formatUSD(r.annualSavings, false));
    U.setText('outPayback', r.paybackYears < 99 ? r.paybackYears.toFixed(1) + ' years' : 'N/A');
    U.setText('outSavings15', U.formatUSD(r.totalSavings15yr, false));
    U.setText('outCO2', U.formatNumber(Math.round(r.co2Reduction)) + ' lbs/yr');
    U.setText('outMonthlyHeating', U.formatUSD(r.monthlyHeatingSavings, true));
    U.setText('outMonthlyCooling', U.formatUSD(r.monthlyCoolingSavings, true));
    U.setText('outNetCost', U.formatUSD(r.netCost, false));

    U.announce('Estimated annual savings ' + U.formatUSD(r.annualSavings, false) +
               ', payback in ' + (r.paybackYears < 99 ? r.paybackYears.toFixed(1) + ' years' : 'over 15 years') + '.');

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('heatPumpChart');
    if (!container || !U.renderLineChart) return;
    if (!r.cumulativeSavings.length) { container.innerHTML = ''; return; }

    U.renderLineChart(container, {
      series: [
        { points: r.cumulativeSavings, color: 'var(--chart-1)', label: 'Cumulative savings' },
        { points: r.costLine, color: 'var(--chart-2)', label: 'Installation cost' }
      ],
      xLabel: 'Years',
      xTicks: [
        { i: 0, label: '1' },
        { i: 4, label: '5' },
        { i: 9, label: '10' },
        { i: 14, label: '15' }
      ],
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Cumulative heat pump savings vs. installation cost over 15 years'
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

  window.USFC_heatPump = { compute: compute };
})();
