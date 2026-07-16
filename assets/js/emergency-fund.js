(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['monthlyExpenses', 'employmentType', 'stability', 'dependents', 'currentSavings', 'monthlySavings'];
  var el = {};

  function compute(i) {
    var baseMonths = 3;
    if (i.employmentType === 'self-employed') baseMonths += 3;
    if (i.stability === 'low') baseMonths += 2;
    else if (i.stability === 'moderate') baseMonths += 1;
    var depBonus = Math.min(i.dependents, 3);
    baseMonths += depBonus;
    if (i.employmentType === 'dual-income') baseMonths = Math.max(3, baseMonths - 2);

    var recommendedMonths = Math.max(3, Math.min(12, baseMonths));
    var targetFund = i.monthlyExpenses * recommendedMonths;
    var gap = Math.max(0, targetFund - i.currentSavings);
    var monthsToGoal = (gap > 0 && i.monthlySavings > 0) ? Math.ceil(gap / i.monthlySavings) : 0;

    var points = [];
    var goalLine = [];
    var months = Math.max(monthsToGoal, 12);
    for (var m = 0; m <= months; m++) {
      var saved = Math.min(i.currentSavings + i.monthlySavings * m, targetFund);
      points.push(saved);
      goalLine.push(targetFund);
    }

    return {
      recommendedMonths: recommendedMonths,
      targetFund: targetFund,
      gap: gap,
      monthsToGoal: monthsToGoal,
      funded: i.currentSavings >= targetFund ? 100 : Math.round((i.currentSavings / targetFund) * 100),
      points: points,
      goalLine: goalLine
    };
  }

  function readInputs() {
    return {
      monthlyExpenses: U.readField(el.monthlyExpenses, { min: 0, fallback: 4500 }).value,
      employmentType: el.employmentType.value,
      stability: el.stability.value,
      dependents: U.readField(el.dependents, { min: 0, max: 10, fallback: 1 }).value,
      currentSavings: U.readField(el.currentSavings, { min: 0, fallback: 5000 }).value,
      monthlySavings: U.readField(el.monthlySavings, { min: 0, fallback: 500 }).value
    };
  }

  function render(r) {
    U.setText('outMonths', r.recommendedMonths + ' months');
    U.setText('outTarget', U.formatUSD(r.targetFund, false));
    U.setText('outGap', U.formatUSD(r.gap, false));
    U.setText('outTimeToGoal', r.monthsToGoal > 0 ? r.monthsToGoal + ' months' : 'Fully funded');
    U.setText('outFunded', r.funded + '%');
    U.announce('Target emergency fund is ' + U.formatUSD(r.targetFund, false) + ', gap is ' + U.formatUSD(r.gap, false));
    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('chartEmergencyFund');
    if (!container || !U.renderLineChart) return;
    if (!r.points.length) { container.innerHTML = ''; return; }

    var n = r.points.length;
    var xTicks = [
      { i: 0, label: 'Now' },
      { i: Math.round((n - 1) / 3), label: 'Mo ' + Math.round((n - 1) / 3) },
      { i: Math.round((n - 1) * 2 / 3), label: 'Mo ' + Math.round((n - 1) * 2 / 3) },
      { i: n - 1, label: 'Mo ' + (n - 1) }
    ];

    U.renderLineChart(container, {
      series: [
        { points: r.points, color: 'var(--chart-1)', label: 'Your savings' },
        { points: r.goalLine, color: 'var(--chart-2)', label: 'Target fund' }
      ],
      xTicks: xTicks,
      xLabel: 'Months',
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Savings growth toward emergency fund goal'
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
      var node = el[id];
      var evt = node.tagName === 'SELECT' ? 'change' : 'input';
      node.addEventListener(evt, debounced);
    });
    recalc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.USFC_emergencyFund = { compute: compute };
})();
