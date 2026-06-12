/* ==========================================================================
   USFinCalc — HSA Tax Savings calculator (hsa.js)
   Estimates the first-year tax savings from funding a Health Savings Account
   and projects the tax-free growth of contributing the same amount each year.

   An HSA has a "triple tax advantage":
     1. Contributions are pre-tax (reduce taxable income; payroll deductions
        also avoid FICA).
     2. Growth is tax-free.
     3. Qualified medical withdrawals are tax-free.

   Method:
     limit = (coverage==='family' ? family : selfOnly) + (age>=55 ? catchUp : 0)
     contribution capped at the limit.
     Federal income-tax savings = tax(taxable) - tax(taxable - contribution),
       which correctly handles a contribution that spans a bracket boundary.
     FICA savings (payroll only): SS 6.2% up to the wage base + Medicare 1.45%.
       Above the wage base only Medicare applies.
     State savings = contribution * stateMarginalRate (user-supplied flat rate;
       most states follow the federal exclusion, a few — CA, NJ — do not).
     Growth: future value of contributing `contribution` each year for `years`
       at `return`, all tax-free (ordinary annuity).

   Depends on core.js, federal-tax.js. No client-side storage.

   Element IDs in hsa-tax-savings-calculator.html:
     inputs : hsaIncome, hsaFilingStatus, hsaCoverage, hsaAge, hsaContribution,
              hsaPayroll, hsaStateRate, hsaYears, hsaReturn
     outputs: outHsaLimit, outHsaFedSavings, outHsaFicaSavings,
              outHsaStateSavings, outHsaTotalSavings, outHsaEffRate,
              outHsaGrowth, hsaNote
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC || !window.USFC_FEDERAL_2026) return;
  var U = window.USFC;
  var FED = window.USFC_FEDERAL_2026;

  var ids = ['hsaIncome','hsaFilingStatus','hsaCoverage','hsaAge','hsaContribution',
             'hsaPayroll','hsaStateRate','hsaYears','hsaReturn'];
  var el = {};

  function taxFromBrackets(income, brackets) {
    if (!(income > 0)) return 0;
    var tax = 0, lower = 0;
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (income > b.upTo) { tax += (b.upTo - lower) * b.rate; lower = b.upTo; }
      else { tax += (income - lower) * b.rate; return tax; }
    }
    return tax;
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var income = Math.max(0, i.income || 0);
    var status = i.filingStatus || 'single';
    var coverage = i.coverage === 'family' ? 'family' : 'self';
    var age = Math.max(0, i.age || 0);
    var payroll = i.payroll !== false;       // default: payroll deduction
    var stateRate = Math.max(0, (i.stateRatePct || 0) / 100);
    var years = Math.max(0, Math.round(i.years || 0));
    var ret = (i.returnPct || 0) / 100;

    var hsa = FED.hsa;
    var limit = (coverage === 'family' ? hsa.family : hsa.selfOnly) +
                (age >= 55 ? hsa.catchUp : 0);

    // Contribution defaults to the limit; never exceed it.
    var requested = (i.contribution != null && i.contribution > 0) ? i.contribution : limit;
    var contribution = Math.min(requested, limit);
    var cappedAtLimit = requested > limit;

    // Federal income-tax savings via marginal brackets (after standard deduction).
    var stdDed = FED.standardDeduction[status] || FED.standardDeduction.single;
    var brackets = FED.brackets[status] || FED.brackets.single;
    var taxable = Math.max(0, income - stdDed);
    var taxableAfter = Math.max(0, taxable - contribution);
    var fedSavings = taxFromBrackets(taxable, brackets) - taxFromBrackets(taxableAfter, brackets);

    // FICA savings (payroll deductions only).
    var ficaSavings = 0;
    if (payroll) {
      var f = FED.fica;
      // Social Security 6.2% applies only on the contribution that sits below
      // the wage base; treat the contribution as the top slice of earnings.
      var ssApplicable = Math.max(0, Math.min(contribution, f.socialSecurityWageBase - (income - contribution)));
      ssApplicable = Math.max(0, Math.min(ssApplicable, contribution));
      if (income <= f.socialSecurityWageBase) ssApplicable = contribution;
      else if (income - contribution >= f.socialSecurityWageBase) ssApplicable = 0;
      ficaSavings = ssApplicable * f.socialSecurityRate + contribution * f.medicareRate;
    }

    var stateSavings = contribution * stateRate;
    var totalSavings = fedSavings + ficaSavings + stateSavings;
    var effRate = contribution > 0 ? totalSavings / contribution : 0;

    // Tax-free growth: contribute `contribution` each year for `years` at `ret`.
    var growth = 0;
    if (years > 0) {
      growth = (ret === 0) ? contribution * years
                           : contribution * ((Math.pow(1 + ret, years) - 1) / ret);
    }

    return {
      limit: limit, contribution: contribution, cappedAtLimit: cappedAtLimit,
      fedSavings: fedSavings, ficaSavings: ficaSavings, stateSavings: stateSavings,
      totalSavings: totalSavings, effRate: effRate, growth: growth,
      payroll: payroll, years: years
    };
  }

  function readInputs() {
    return {
      income:       U.readField(el.hsaIncome, { min: 0, fallback: 0 }).value,
      filingStatus: el.hsaFilingStatus ? el.hsaFilingStatus.value : 'single',
      coverage:     el.hsaCoverage ? el.hsaCoverage.value : 'self',
      age:          U.readField(el.hsaAge, { min: 0, max: 120, fallback: 40 }).value,
      contribution: U.readField(el.hsaContribution, { min: 0, fallback: 0 }).value,
      payroll:      el.hsaPayroll ? el.hsaPayroll.value !== 'no' : true,
      stateRatePct: U.readField(el.hsaStateRate, { min: 0, max: 15, fallback: 0 }).value,
      years:        U.readField(el.hsaYears, { min: 0, max: 60, fallback: 0 }).value,
      returnPct:    U.readField(el.hsaReturn, { min: 0, max: 20, fallback: 0 }).value
    };
  }

  function render(r) {
    U.setText('outHsaLimit', U.formatUSD(r.limit, false));
    U.setText('outHsaFedSavings', U.formatUSD(r.fedSavings, true));
    U.setText('outHsaFicaSavings', U.formatUSD(r.ficaSavings, true));
    U.setText('outHsaStateSavings', U.formatUSD(r.stateSavings, true));
    U.setText('outHsaTotalSavings', U.formatUSD(r.totalSavings, true));
    U.setText('outHsaEffRate', U.formatPercent(r.effRate));

    var growthRow = document.getElementById('hsaGrowthRow');
    if (growthRow) growthRow.hidden = !(r.years > 0);
    U.setText('outHsaGrowth', U.formatUSD(r.growth, false));

    var ficaRow = document.getElementById('hsaFicaRow');
    if (ficaRow) ficaRow.hidden = !r.payroll;

    var note = document.getElementById('hsaNote');
    if (note) {
      if (r.contribution <= 0) {
        note.textContent = 'Enter your income and a contribution to see your tax savings.';
      } else if (r.cappedAtLimit) {
        note.textContent = 'Capped at the 2026 limit of ' + U.formatUSD(r.limit, false) +
          '. Contributing the maximum saves about ' + U.formatUSD(r.totalSavings, false) + ' in tax this year.';
      } else {
        note.textContent = 'Funding ' + U.formatUSD(r.contribution, false) + ' saves about ' +
          U.formatUSD(r.totalSavings, false) + ' in tax this year — an effective ' +
          U.formatPercent(r.effRate) + ' discount on every dollar contributed.';
      }
    }

    U.announce('Estimated first-year HSA tax savings ' + U.formatUSD(r.totalSavings, false) + '.');
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

  window.USFC_hsa = { compute: compute };
})();
