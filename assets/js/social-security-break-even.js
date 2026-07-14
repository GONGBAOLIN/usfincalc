/* ==========================================================================
   USFinCalc — Social Security break-even calculator (social-security-break-even.js)
   Compares claiming Social Security at an earlier vs. a later age and finds the
   break-even age where the delayed claim's cumulative total overtakes the early
   claim's.

   Statutory benefit adjustment relative to full retirement age (FRA):
     Claiming EARLY (before FRA): permanent reduction of
       5/9 of 1% per month for the first 36 months early  (~6.667%/yr), plus
       5/12 of 1% per month for any months beyond 36       (5%/yr).
     Claiming LATE (after FRA): Delayed Retirement Credits of
       2/3 of 1% per month                                  (8%/yr), capped at age 70.
     Claiming AT FRA: 100% of the primary insurance amount (PIA).

   Break-even: walk month by month from the later claim age. Each month, add the
   monthly benefit to whichever claim(s) have started. The break-even age is the
   first age at which the delayed claim's cumulative total >= the early claim's.
   An optional annual COLA inflates both benefit streams equally.

   Depends on core.js. No client-side storage.

   Element IDs in social-security-break-even-calculator.html:
     inputs : fraBenefit, fra, earlyAge, lateAge, lifeExp, cola
     outputs: outBreakEven, outEarlyLabel, outLateLabel, outEarlyBenefit,
              outLateBenefit, outEarlyTotal, outLateTotal
     chart  : #ssChart
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  /* Benefit as a fraction of PIA for a given claim age vs. FRA.
     Ages in years (may be fractional). */
  function benefitFactor(claimAge, fra) {
    var months = Math.round((claimAge - fra) * 12);
    if (months === 0) return 1;
    if (months < 0) {
      var early = -months; // months before FRA
      var first = Math.min(early, 36);
      var extra = Math.max(0, early - 36);
      var reduction = first * (5 / 9) / 100 + extra * (5 / 12) / 100;
      return Math.max(0, 1 - reduction);
    }
    // Delayed credits cap at age 70.
    var creditMonths = Math.min(months, Math.round((70 - fra) * 12));
    return 1 + creditMonths * (2 / 3) / 100;
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var fraBenefit = Math.max(0, i.fraBenefit || 0);
    var fra = U.clamp(i.fra || 67, 62, 70);
    var earlyAge = U.clamp(i.earlyAge || 62, 62, 70);
    var lateAge = U.clamp(i.lateAge || 70, 62, 70);
    var lifeExp = Math.max(0, i.lifeExp || 0);
    var cola = Math.max(0, (i.cola || 0)) / 100;

    // Ensure early < late; if reversed or equal, still compute sensibly.
    if (lateAge < earlyAge) { var t = earlyAge; earlyAge = lateAge; lateAge = t; }

    var earlyMonthly = fraBenefit * benefitFactor(earlyAge, fra);
    var lateMonthly = fraBenefit * benefitFactor(lateAge, fra);

    // Walk month by month from the earlier claim age to life expectancy.
    // Track cumulative totals; find first month where late >= early.
    var startAge = earlyAge;
    var endMonths = Math.max(0, Math.round((lifeExp - startAge) * 12));
    var earlyStartM = 0; // early claim begins at startAge
    var lateStartM = Math.round((lateAge - startAge) * 12);

    var monthlyCola = Math.pow(1 + cola, 1 / 12) - 1;
    var earlyCum = 0, lateCum = 0;
    var breakEvenAgeMonths = -1;
    // series for chart, sampled yearly
    var series = { ages: [], early: [], late: [] };

    for (var m = 0; m <= endMonths; m++) {
      // apply COLA growth to the monthly amounts over time
      var grow = cola > 0 ? Math.pow(1 + monthlyCola, m) : 1;
      if (m >= earlyStartM) earlyCum += earlyMonthly * grow;
      if (m >= lateStartM) lateCum += lateMonthly * grow;

      if (breakEvenAgeMonths < 0 && m >= lateStartM && lateCum >= earlyCum && lateCum > 0) {
        breakEvenAgeMonths = m;
      }
      // sample once per 12 months for the chart
      if (m % 12 === 0) {
        series.ages.push(startAge + m / 12);
        series.early.push(earlyCum);
        series.late.push(lateCum);
      }
    }

    var breakEvenAge = breakEvenAgeMonths >= 0 ? startAge + breakEvenAgeMonths / 12 : null;

    return {
      earlyAge: earlyAge,
      lateAge: lateAge,
      earlyMonthly: earlyMonthly,
      lateMonthly: lateMonthly,
      earlyTotal: earlyCum,
      lateTotal: lateCum,
      breakEvenAge: breakEvenAge,
      lifeExp: lifeExp,
      series: series
    };
  }

  var el = {};
  var ids = ['fraBenefit','fra','earlyAge','lateAge','lifeExp','cola'];

  function readInputs() {
    return {
      fraBenefit: U.readField(el.fraBenefit, { min: 0, fallback: 2000 }).value,
      fra:        U.readField(el.fra, { min: 62, max: 70, fallback: 67 }).value,
      earlyAge:   U.readField(el.earlyAge, { min: 62, max: 70, fallback: 62 }).value,
      lateAge:    U.readField(el.lateAge, { min: 62, max: 70, fallback: 70 }).value,
      lifeExp:    U.readField(el.lifeExp, { min: 62, max: 120, fallback: 85 }).value,
      cola:       U.readField(el.cola, { min: 0, max: 10, fallback: 0 }).value
    };
  }

  /* Format an age in years (may be fractional) as "N yr M mo". */
  function fmtAge(age) {
    if (age == null) return 'Never';
    var years = Math.floor(age);
    var months = Math.round((age - years) * 12);
    if (months === 12) { years += 1; months = 0; }
    if (months === 0) return years + '';
    return years + ' yr ' + months + ' mo';
  }

  function drawChart(r) {
    var container = document.getElementById('ssChart');
    if (!container || !U.renderLineChart || !r.series.ages.length) return;
    var ticks = [];
    var n = r.series.ages.length;
    [0, Math.floor((n - 1) / 2), n - 1].forEach(function (idx) {
      ticks.push({ i: idx, label: String(Math.round(r.series.ages[idx])) });
    });
    U.renderLineChart(container, {
      series: [
        { points: r.series.late, color: 'var(--color-primary)', label: 'Claim at ' + fmtAge(r.lateAge) + ' (delayed)' },
        { points: r.series.early, color: 'var(--color-muted)', label: 'Claim at ' + fmtAge(r.earlyAge) + ' (early)' }
      ],
      xLabel: 'Age',
      xTicks: ticks,
      yFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Cumulative Social Security benefits by age for an early versus delayed claim'
    });
  }

  function render(r) {
    U.setText('outBreakEven', fmtAge(r.breakEvenAge));
    U.setText('outEarlyLabel', fmtAge(r.earlyAge));
    U.setText('outLateLabel', fmtAge(r.lateAge));
    U.setText('outEarlyBenefit', U.formatUSD(r.earlyMonthly, false) + '/mo');
    U.setText('outLateBenefit', U.formatUSD(r.lateMonthly, false) + '/mo');
    U.setText('outEarlyTotal', U.formatUSD(r.earlyTotal, false));
    U.setText('outLateTotal', U.formatUSD(r.lateTotal, false));

    U.announce(r.breakEvenAge == null
      ? 'Claiming at ' + fmtAge(r.lateAge) + ' does not break even by the life expectancy entered.'
      : 'Delaying to ' + fmtAge(r.lateAge) + ' breaks even against claiming at ' +
        fmtAge(r.earlyAge) + ' at age ' + fmtAge(r.breakEvenAge) + '.');

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

  window.USFC_socialSecurityBreakEven = { compute: compute, benefitFactor: benefitFactor };
})();
