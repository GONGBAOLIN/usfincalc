(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = [
    'income', 'replaceYears', 'children', 'collegeCost',
    'mortgageBalance', 'otherDebt', 'finalExpenses',
    'existingCoverage', 'savings', 'spouseIncome'
  ];
  var el = {};

  function compute(i) {
    var incomeNeed = i.income * i.replaceYears;
    var educationNeed = i.children * i.collegeCost;
    var debtNeed = i.mortgageBalance + i.otherDebt;
    var finalNeed = i.finalExpenses;

    var totalNeed = incomeNeed + educationNeed + debtNeed + finalNeed;
    var resources = i.existingCoverage + i.savings + (i.spouseIncome * i.replaceYears * 0.5);
    var coverageGap = Math.max(0, totalNeed - resources);

    return {
      totalNeed: totalNeed,
      coverageGap: coverageGap,
      incomeNeed: incomeNeed,
      educationNeed: educationNeed,
      debtNeed: debtNeed,
      finalNeed: finalNeed,
      resources: resources
    };
  }

  function readInputs() {
    return {
      income: U.readField(el.income, { min: 0, fallback: 85000 }).value,
      replaceYears: U.readField(el.replaceYears, { min: 1, max: 30, fallback: 10 }).value,
      children: U.readField(el.children, { min: 0, max: 10, fallback: 2 }).value,
      collegeCost: U.readField(el.collegeCost, { min: 0, fallback: 80000 }).value,
      mortgageBalance: U.readField(el.mortgageBalance, { min: 0, fallback: 300000 }).value,
      otherDebt: U.readField(el.otherDebt, { min: 0, fallback: 25000 }).value,
      finalExpenses: U.readField(el.finalExpenses, { min: 0, fallback: 15000 }).value,
      existingCoverage: U.readField(el.existingCoverage, { min: 0, fallback: 100000 }).value,
      savings: U.readField(el.savings, { min: 0, fallback: 50000 }).value,
      spouseIncome: U.readField(el.spouseIncome, { min: 0, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outGap', U.formatUSD(r.coverageGap, false));
    U.setText('outRecommended', U.formatUSD(r.totalNeed, false));
    U.setText('outIncome', U.formatUSD(r.incomeNeed, false));
    U.setText('outEducation', U.formatUSD(r.educationNeed, false));
    U.setText('outDebt', U.formatUSD(r.debtNeed, false));
    U.setText('outFinal', U.formatUSD(r.finalNeed, false));
    U.setText('outResources', U.formatUSD(r.resources, false));
    U.announce('Coverage gap is ' + U.formatUSD(r.coverageGap, false));
    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('chartLifeInsurance');
    if (!container || !U.renderDonutChart) return;

    var segments = [];
    if (r.incomeNeed > 0) segments.push({ label: 'Income replacement', value: r.incomeNeed, color: 'var(--chart-1)' });
    if (r.debtNeed > 0) segments.push({ label: 'Mortgage & debt', value: r.debtNeed, color: 'var(--chart-2)' });
    if (r.educationNeed > 0) segments.push({ label: 'Education fund', value: r.educationNeed, color: 'var(--chart-3)' });
    if (r.finalNeed > 0) segments.push({ label: 'Final expenses', value: r.finalNeed, color: 'var(--chart-4)' });

    U.renderDonutChart(container, {
      segments: segments,
      centerLabel: U.formatUSD(r.totalNeed, false),
      centerSub: 'total need',
      valueFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Coverage need breakdown'
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

  window.USFC_lifeInsurance = { compute: compute };
})();
