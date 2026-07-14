/* ==========================================================================
   USFinCalc — Wedding Budget Calculator (wedding-budget.js)
   Allocates a total wedding budget across vendor categories, adjusted for
   guest count, and calculates a monthly savings timeline.

   Allocation model: US 2024–2026 averages (The Knot / Zola industry data).
   Per-guest categories scale linearly with guestCount/120; fixed categories
   stay constant; all percentages are re-normalized to 100%.

   Depends on core.js. No client-side storage.

   Element IDs in wedding-budget-calculator.html:
     inputs : totalBudget, guestCount, monthsToSave, alreadySaved
     outputs: outPerGuest, outMonthlySavings, outSavingsProgress,
              outVenue, outCatering, outPhoto, outMusic, outFlowers,
              outAttire, outStationery, outTransport, outFavors, outBuffer
     chart  : #weddingChart
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var CATEGORIES = [
    { key: 'venue',      label: 'Venue & Rentals',        basePct: 0.30, perGuest: false },
    { key: 'catering',   label: 'Catering & Bar',         basePct: 0.25, perGuest: true  },
    { key: 'photo',      label: 'Photography & Video',    basePct: 0.12, perGuest: false },
    { key: 'music',      label: 'Music & Entertainment',  basePct: 0.08, perGuest: false },
    { key: 'flowers',    label: 'Flowers & Decor',        basePct: 0.08, perGuest: false },
    { key: 'attire',     label: 'Attire & Beauty',        basePct: 0.07, perGuest: false },
    { key: 'stationery', label: 'Stationery & Invites',   basePct: 0.03, perGuest: true  },
    { key: 'transport',  label: 'Transportation',         basePct: 0.02, perGuest: false },
    { key: 'favors',     label: 'Favors & Gifts',         basePct: 0.02, perGuest: true  },
    { key: 'buffer',     label: 'Buffer & Tips',          basePct: 0.03, perGuest: false }
  ];

  var BASELINE_GUESTS = 120;

  function compute(i) {
    var totalBudget = Math.max(0, i.totalBudget || 0);
    var guestCount = Math.max(1, i.guestCount || 1);
    var monthsToSave = Math.max(1, i.monthsToSave || 1);
    var alreadySaved = Math.max(0, i.alreadySaved || 0);

    var scaleFactor = guestCount / BASELINE_GUESTS;

    var adjusted = CATEGORIES.map(function (c) {
      return { key: c.key, label: c.label, pct: c.perGuest ? c.basePct * scaleFactor : c.basePct };
    });

    var totalPct = adjusted.reduce(function (sum, c) { return sum + c.pct; }, 0);
    adjusted.forEach(function (c) { c.pct = c.pct / totalPct; });
    adjusted.forEach(function (c) { c.dollars = Math.round(totalBudget * c.pct); });

    var perGuest = guestCount > 0 ? totalBudget / guestCount : 0;
    var remaining = Math.max(0, totalBudget - alreadySaved);
    var monthlySavings = remaining / monthsToSave;
    var savingsProgress = totalBudget > 0 ? Math.min(100, (alreadySaved / totalBudget) * 100) : 0;

    var series = { months: [], saved: [] };
    for (var m = 0; m <= monthsToSave; m++) {
      series.months.push(m);
      series.saved.push(Math.min(totalBudget, alreadySaved + monthlySavings * m));
    }

    return {
      totalBudget: totalBudget,
      guestCount: guestCount,
      perGuest: perGuest,
      monthlySavings: monthlySavings,
      savingsProgress: savingsProgress,
      remaining: remaining,
      monthsToSave: monthsToSave,
      categories: adjusted,
      series: series
    };
  }

  var el = {};
  var ids = ['totalBudget', 'guestCount', 'monthsToSave', 'alreadySaved'];

  function readInputs() {
    return {
      totalBudget:  U.readField(el.totalBudget, { min: 0, fallback: 30000 }).value,
      guestCount:   U.readField(el.guestCount, { min: 1, max: 1000, fallback: 120 }).value,
      monthsToSave: U.readField(el.monthsToSave, { min: 1, max: 120, fallback: 12 }).value,
      alreadySaved: U.readField(el.alreadySaved, { min: 0, fallback: 0 }).value
    };
  }

  function drawChart(r) {
    var container = document.getElementById('weddingChart');
    if (!container || !U.renderLineChart || !r.series.months.length) return;
    var n = r.series.months.length;
    var ticks = [];
    [0, Math.floor((n - 1) / 2), n - 1].forEach(function (idx) {
      ticks.push({ i: idx, label: 'Mo ' + r.series.months[idx] });
    });
    U.renderLineChart(container, {
      series: [
        { points: r.series.saved, color: 'var(--color-primary)', label: 'Cumulative Savings' }
      ],
      xLabel: 'Month',
      xTicks: ticks,
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Wedding savings timeline from now to your wedding date'
    });
  }

  function render(r) {
    U.setText('outPerGuest', U.formatUSD(r.perGuest, false));
    U.setText('outMonthlySavings', U.formatUSD(r.monthlySavings, false) + '/mo');
    U.setText('outSavingsProgress', Math.round(r.savingsProgress) + '% funded');

    r.categories.forEach(function (c) {
      var outId = 'out' + c.key.charAt(0).toUpperCase() + c.key.slice(1);
      var cell = document.getElementById(outId);
      if (cell) cell.textContent = U.formatUSD(c.dollars, false);
      var pctId = 'outPct' + c.key.charAt(0).toUpperCase() + c.key.slice(1);
      var pctCell = document.getElementById(pctId);
      if (pctCell) pctCell.textContent = Math.round(c.pct * 100) + '%';
    });

    U.announce(
      'Budget of ' + U.formatUSD(r.totalBudget, false) + ' for ' + r.guestCount +
      ' guests. You need to save ' + U.formatUSD(r.monthlySavings, false) +
      ' per month over ' + r.monthsToSave + ' months.'
    );

    drawChart(r);
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

  window.USFC_weddingBudget = { compute: compute };
})();
