(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['annualMiles','gasPrice','gasMPG','elecRate','evEfficiency',
             'evPrice','gasCarPrice','evCredit','stateIncentive',
             'evMaintenance','gasMaintenance','insuranceDiff','fuelIncrease'];
  var el = {};

  function compute(i) {
    var years = 5;
    var evNetPrice = Math.max(0, i.evPrice - i.evCredit - i.stateIncentive);
    var gasCarPrice = i.gasCarPrice;

    var evCumulative = [];
    var gasCumulative = [];
    var evTotal = evNetPrice;
    var gasTotal = gasCarPrice;
    var evFuelTotal = 0;
    var gasFuelTotal = 0;
    var breakEvenYear = null;

    for (var y = 1; y <= years; y++) {
      var esc = Math.pow(1 + i.fuelIncrease / 100, y - 1);
      var yearGasPrice = i.gasPrice * esc;
      var yearElecRate = i.elecRate * esc;

      var gasFuel = i.gasMPG > 0 ? (i.annualMiles / i.gasMPG) * yearGasPrice : 0;
      var evFuel = i.evEfficiency > 0 ? (i.annualMiles / i.evEfficiency) * yearElecRate : 0;

      gasFuelTotal += gasFuel;
      evFuelTotal += evFuel;

      evTotal += evFuel + i.evMaintenance + i.insuranceDiff;
      gasTotal += gasFuel + i.gasMaintenance;

      evCumulative.push(evTotal);
      gasCumulative.push(gasTotal);

      if (breakEvenYear === null && evTotal <= gasTotal) {
        breakEvenYear = y;
      }
    }

    var savings = gasCumulative[4] - evCumulative[4];
    var totalMiles = i.annualMiles * years;
    var evCostPerMile = totalMiles > 0 ? evCumulative[4] / totalMiles : 0;
    var gasCostPerMile = totalMiles > 0 ? gasCumulative[4] / totalMiles : 0;

    var evFuelY1 = i.evEfficiency > 0 ? (i.annualMiles / i.evEfficiency) * i.elecRate : 0;
    var gasFuelY1 = i.gasMPG > 0 ? (i.annualMiles / i.gasMPG) * i.gasPrice : 0;

    return {
      evTotal5yr: evCumulative[4],
      gasTotal5yr: gasCumulative[4],
      savings: savings,
      evAnnualFuel: evFuelY1,
      gasAnnualFuel: gasFuelY1,
      maintenanceSavings: (i.gasMaintenance - i.evMaintenance) * years,
      breakEvenYear: breakEvenYear,
      evCostPerMile: evCostPerMile,
      gasCostPerMile: gasCostPerMile,
      evCumulative: evCumulative,
      gasCumulative: gasCumulative
    };
  }

  function readInputs() {
    return {
      annualMiles: U.readField(el.annualMiles, { min: 0, fallback: 12000 }).value,
      gasPrice: U.readField(el.gasPrice, { min: 0, fallback: 3.50 }).value,
      gasMPG: U.readField(el.gasMPG, { min: 1, max: 80, fallback: 28 }).value,
      elecRate: U.readField(el.elecRate, { min: 0.01, max: 1, fallback: 0.16 }).value,
      evEfficiency: U.readField(el.evEfficiency, { min: 1, max: 8, fallback: 3.5 }).value,
      evPrice: U.readField(el.evPrice, { min: 0, fallback: 35000 }).value,
      gasCarPrice: U.readField(el.gasCarPrice, { min: 0, fallback: 32000 }).value,
      evCredit: U.readField(el.evCredit, { min: 0, max: 7500, fallback: 7500 }).value,
      stateIncentive: U.readField(el.stateIncentive, { min: 0, fallback: 0 }).value,
      evMaintenance: U.readField(el.evMaintenance, { min: 0, fallback: 600 }).value,
      gasMaintenance: U.readField(el.gasMaintenance, { min: 0, fallback: 1200 }).value,
      insuranceDiff: U.readField(el.insuranceDiff, { min: -5000, max: 5000, fallback: 200 }).value,
      fuelIncrease: U.readField(el.fuelIncrease, { min: 0, max: 20, fallback: 3 }).value
    };
  }

  function render(r) {
    U.setText('outEVTotal', U.formatUSD(r.evTotal5yr, false));
    U.setText('outGasTotal', U.formatUSD(r.gasTotal5yr, false));
    U.setText('outSavings', (r.savings >= 0 ? 'Save ' : 'Spend more ') + U.formatUSD(Math.abs(r.savings), false));
    U.setText('outBreakEven', r.breakEvenYear ? 'Year ' + r.breakEvenYear : 'N/A');
    U.setText('outEVFuel', U.formatUSD(r.evAnnualFuel, false) + '/yr');
    U.setText('outGasFuel', U.formatUSD(r.gasAnnualFuel, false) + '/yr');
    U.setText('outEVPerMile', '$' + r.evCostPerMile.toFixed(2) + '/mi');
    U.setText('outGasPerMile', '$' + r.gasCostPerMile.toFixed(2) + '/mi');
    U.setText('outMaintSavings', U.formatUSD(r.maintenanceSavings, false));

    U.announce('5-year EV cost ' + U.formatUSD(r.evTotal5yr, false) +
               ' vs gas ' + U.formatUSD(r.gasTotal5yr, false) +
               '. ' + (r.savings >= 0 ? 'EV saves ' : 'Gas saves ') + U.formatUSD(Math.abs(r.savings), false) + '.');

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('evGasChart');
    if (!container || !U.renderLineChart) return;

    U.renderLineChart(container, {
      series: [
        { points: r.evCumulative, color: 'var(--chart-1)', label: 'EV total cost' },
        { points: r.gasCumulative, color: 'var(--chart-2)', label: 'Gas car total cost' }
      ],
      xLabel: 'Year',
      xTicks: [
        { i: 0, label: '1' },
        { i: 1, label: '2' },
        { i: 2, label: '3' },
        { i: 3, label: '4' },
        { i: 4, label: '5' }
      ],
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: '5-year cumulative ownership cost: EV vs gas vehicle'
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

  window.USFC_evVsGas = { compute: compute };
})();
