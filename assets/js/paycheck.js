/* ==========================================================================
   USFinCalc — Paycheck calculator (paycheck.js)
   Estimates take-home pay: federal income tax (progressive on taxable
   income after standard deduction + pre-tax 401k), FICA (Social Security
   capped at wage base, Medicare + Additional Medicare), and state income
   tax (simplified). Depends on core.js, federal-tax.js, state-tax.js.
   No client-side storage.

   Element IDs in paycheck-calculator.html:
     inputs : salary, payFreq, filingStatus, state, k401
     outputs: outNetPeriod, outNetAnnual, outGrossPeriod, outFederal,
              outSS, outMedicare, outState, out401k, outEffRate, outFreqLabel
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC || !window.USFC_FEDERAL_2026 || !window.USFC_STATE) return;
  var U = window.USFC;
  var FED = window.USFC_FEDERAL_2026;
  var STATES = window.USFC_STATE;

  var FREQ = { annual: 1, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52 };
  var FREQ_LABEL = {
    annual: 'year', monthly: 'month', semimonthly: 'paycheck',
    biweekly: 'paycheck', weekly: 'week'
  };

  /** Marginal tax on `income` given a [{upTo,rate}] bracket array. */
  function taxFromBrackets(income, brackets) {
    if (!(income > 0)) return 0;
    var tax = 0, lower = 0;
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (income > b.upTo) {
        tax += (b.upTo - lower) * b.rate;
        lower = b.upTo;
      } else {
        tax += (income - lower) * b.rate;
        return tax;
      }
    }
    return tax;
  }

  function stateTax(stateTaxable, stateCode) {
    var s = STATES[stateCode];
    if (!s || s.type === 'none') return 0;
    if (s.type === 'flat') return Math.max(0, stateTaxable) * s.rate;
    return taxFromBrackets(stateTaxable, s.brackets);
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var gross = Math.max(0, i.salary || 0);
    var status = i.filingStatus || 'single';
    var k401Pct = U.clamp(i.k401 || 0, 0, 90) / 100;

    var pretax401k = gross * k401Pct;

    // ---- FICA: computed on gross wages (401k is NOT exempt from FICA) ----
    var ssWages = Math.min(gross, FED.fica.socialSecurityWageBase);
    var socialSecurity = ssWages * FED.fica.socialSecurityRate;

    var medicare = gross * FED.fica.medicareRate;
    var addlThreshold = FED.fica.additionalMedicareThreshold[status] ||
                        FED.fica.additionalMedicareThreshold.single;
    if (gross > addlThreshold) {
      medicare += (gross - addlThreshold) * FED.fica.additionalMedicareRate;
    }

    // ---- Federal income tax: taxable = gross - 401k - standard deduction ----
    var stdDed = FED.standardDeduction[status] || FED.standardDeduction.single;
    var fedTaxable = Math.max(0, gross - pretax401k - stdDed);
    var federal = taxFromBrackets(fedTaxable, FED.brackets[status] || FED.brackets.single);

    // ---- State income tax: simplified, on gross - 401k ----
    var stTaxable = Math.max(0, gross - pretax401k);
    var state = stateTax(stTaxable, i.state || 'TX');

    var totalTax = federal + socialSecurity + medicare + state;
    var net = gross - totalTax - pretax401k;

    var freq = FREQ[i.payFreq] || 1;
    var effRate = gross > 0 ? totalTax / gross : 0;

    return {
      gross: gross,
      pretax401k: pretax401k,
      federal: federal,
      socialSecurity: socialSecurity,
      medicare: medicare,
      state: state,
      net: net,
      freq: freq,
      freqKey: i.payFreq || 'annual',
      grossPerPeriod: gross / freq,
      netPerPeriod: net / freq,
      effectiveRate: effRate
    };
  }

  var el = {};
  var ids = ['salary','payFreq','filingStatus','state','k401'];

  function readInputs() {
    return {
      salary: U.readField(el.salary, { min: 0, fallback: 0 }).value,
      payFreq: el.payFreq.value,
      filingStatus: el.filingStatus.value,
      state: el.state.value,
      k401: U.readField(el.k401, { min: 0, max: 90, fallback: 0 }).value
    };
  }

  function render(r) {
    var per = FREQ_LABEL[r.freqKey] || 'period';
    U.setText('outNetPeriod', U.formatUSD(r.netPerPeriod, true));
    U.setText('outNetAnnual', U.formatUSD(r.net, false));
    U.setText('outGrossPeriod', U.formatUSD(r.grossPerPeriod, true));
    U.setText('outFederal', U.formatUSD(r.federal, false));
    U.setText('outSS', U.formatUSD(r.socialSecurity, false));
    U.setText('outMedicare', U.formatUSD(r.medicare, false));
    U.setText('outState', U.formatUSD(r.state, false));
    U.setText('out401k', U.formatUSD(r.pretax401k, false));
    U.setText('outEffRate', U.formatPercent(r.effectiveRate));
    U.setText('outFreqLabel', per);

    U.announce('Estimated take-home pay ' + U.formatUSD(r.netPerPeriod, true) +
               ' per ' + per + ', or ' + U.formatUSD(r.net, false) + ' per year.');

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('paycheckChart');
    if (!container || !U.renderDonutChart) return;
    U.renderDonutChart(container, {
      segments: [
        { label: 'Take-home pay', value: r.net,             color: 'var(--chart-1)' },
        { label: 'Federal tax',   value: r.federal,         color: 'var(--chart-2)' },
        { label: 'Social Security', value: r.socialSecurity, color: 'var(--chart-3)' },
        { label: 'Medicare',      value: r.medicare,        color: 'var(--chart-5)' },
        { label: 'State tax',     value: r.state,           color: 'var(--chart-4)' },
        { label: '401(k)',        value: r.pretax401k,      color: 'var(--chart-6)' }
      ],
      centerLabel: U.formatUSD(r.gross, false),
      centerSub: 'gross / year',
      valueFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Where your gross pay goes: take-home pay, federal tax, FICA, state tax and 401(k)'
    });
  }

  function recalc() { render(compute(readInputs())); }

  function populateStates() {
    var sel = el.state;
    if (!sel || sel.options.length > 1) return;
    var codes = Object.keys(STATES).filter(function (k) { return k !== 'vintage'; });
    codes.sort(function (a, b) { return STATES[a].name.localeCompare(STATES[b].name); });
    codes.forEach(function (code) {
      var o = document.createElement('option');
      o.value = code;
      o.textContent = STATES[code].name +
        (STATES[code].type === 'none' ? ' (no income tax)' : '');
      sel.appendChild(o);
    });
    sel.value = 'CA';
  }

  function init() {
    var ok = true;
    ids.forEach(function (id) { el[id] = document.getElementById(id); if (!el[id]) ok = false; });
    if (!ok) return;
    populateStates();

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

  window.USFC_paycheck = { compute: compute, taxFromBrackets: taxFromBrackets };
})();
