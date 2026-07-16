(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['income', 'region', 'existingChildren', 'childcareType', 'planCollege', 'inflation'];
  var el = {};

  var BASE_ANNUAL = {
    housing: 3680, food: 2600, transportation: 2080,
    clothing: 820, healthcare: 1520, childcare: 3200, misc: 1700
  };

  var REGION_FACTOR = { northeast: 1.12, midwest: 0.92, south: 0.95, west: 1.08 };
  var CHILDCARE_FACTOR = { center: 1.0, nanny: 1.45, family: 0.55, none: 0.0 };
  var COLLEGE_4YR = 100000;

  function compute(i) {
    var incomeFactor;
    if (i.income < 60000) incomeFactor = 0.78;
    else if (i.income < 110000) incomeFactor = 1.0;
    else if (i.income < 180000) incomeFactor = 1.25;
    else incomeFactor = 1.5;

    var regionFactor = REGION_FACTOR[i.region] || 1.0;
    var childcareFactor = CHILDCARE_FACTOR[i.childcareType] || 1.0;
    var siblingDiscount = i.existingChildren > 0 ? 0.76 : 1.0;

    var categories = {};
    var keys = Object.keys(BASE_ANNUAL);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var base = BASE_ANNUAL[key] * incomeFactor * regionFactor * siblingDiscount;
      if (key === 'childcare') base *= childcareFactor;
      categories[key] = base;
    }

    var annualBase = 0;
    for (var k2 = 0; k2 < keys.length; k2++) {
      annualBase += categories[keys[k2]];
    }

    var yearCosts = [];
    var cumulative = [];
    var total = 0;
    var inflationRate = i.inflation / 100;

    for (var yr = 0; yr < 18; yr++) {
      var ageFactor = 1.0;
      if (yr >= 12) ageFactor = 1.2;
      else if (yr >= 6) ageFactor = 1.1;

      var childcareCut = 1.0;
      if (yr >= 13) childcareCut = 0;
      else if (yr >= 6) childcareCut = 0.4;

      var yearCost = 0;
      for (var k3 = 0; k3 < keys.length; k3++) {
        var cat = keys[k3];
        var val = categories[cat] * ageFactor * Math.pow(1 + inflationRate, yr);
        if (cat === 'childcare') val *= childcareCut;
        yearCost += val;
      }

      yearCosts.push(yearCost);
      total += yearCost;
      cumulative.push(total);
    }

    var collegeCost = 0;
    if (i.planCollege === 'yes') {
      collegeCost = COLLEGE_4YR * Math.pow(1 + inflationRate, 18);
      for (var c = 0; c < 4; c++) {
        var cYear = collegeCost / 4;
        cumulative.push(total + cYear * (c + 1));
      }
      total += collegeCost;
    }

    return {
      totalBirthTo17: total - collegeCost,
      totalWithCollege: total,
      collegeCost: collegeCost,
      annualAverage: (total - collegeCost) / 18,
      monthlyAverage: (total - collegeCost) / 18 / 12,
      categories: categories,
      cumulative: cumulative,
      yearCosts: yearCosts
    };
  }

  function readInputs() {
    return {
      income: U.readField(el.income, { min: 0, fallback: 100000 }).value,
      region: el.region.value,
      existingChildren: U.readField(el.existingChildren, { min: 0, max: 10, fallback: 0 }).value,
      childcareType: el.childcareType.value,
      planCollege: el.planCollege.value,
      inflation: U.readField(el.inflation, { min: 0, max: 15, fallback: 3 }).value
    };
  }

  function render(r) {
    U.setText('outTotal', U.formatUSD(r.totalBirthTo17, false));
    U.setText('outWithCollege', U.formatUSD(r.totalWithCollege, false));
    U.setText('outCollege', U.formatUSD(r.collegeCost, false));
    U.setText('outAnnual', U.formatUSD(r.annualAverage, false));
    U.setText('outMonthly', U.formatUSD(r.monthlyAverage, false));
    U.announce('Total cost birth to 17 is ' + U.formatUSD(r.totalBirthTo17, false));
    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('chartChildCost');
    if (!container || !U.renderLineChart) return;
    if (!r.cumulative.length) { container.innerHTML = ''; return; }

    var points = r.cumulative;
    var n = points.length;
    var xTicks = [
      { i: 0, label: 'Birth' },
      { i: 5, label: 'Age 5' },
      { i: 11, label: 'Age 11' },
      { i: 17, label: 'Age 17' }
    ];
    if (n > 18) xTicks.push({ i: n - 1, label: 'College' });

    U.renderLineChart(container, {
      series: [
        { points: points, color: 'var(--chart-2)', label: 'Cumulative cost' }
      ],
      xTicks: xTicks,
      xLabel: 'Child age',
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Cumulative cost of raising a child'
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

  window.USFC_childCost = { compute: compute };
})();
