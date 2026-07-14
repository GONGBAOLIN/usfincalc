/* ==========================================================================
   USFinCalc — RSU tax calculator (rsu-tax.js)
   Estimates the after-tax value of vesting RSUs and exposes the common
   "22% under-withholding trap": employers withhold federal tax on RSU
   income at the 22% supplemental flat rate (37% on the portion over $1M),
   but a high earner's RSU income is really taxed at their marginal rate
   (often 32-37%). The difference becomes a balance due at filing.

   Method: stack RSU income on top of base salary and take the MARGINAL
   federal/state tax — tax(base+rsu) - tax(base) — after the standard
   deduction. FICA: Social Security only applies to RSU wages up to the
   remaining room under the annual wage base (base salary uses it first);
   Medicare 1.45% on all RSU wages + 0.9% additional above the threshold
   on combined comp.

   Depends on core.js, federal-tax.js, state-tax.js. No client-side storage.

   Element IDs in rsu-tax-calculator.html:
     inputs : shares, vestPrice, baseSalary, rsuFilingStatus, rsuState
     outputs: outRsuGross, outWithheld, outActualFed, outGap, outGapLabel,
              outRsuSS, outRsuMedicare, outRsuState, outRsuNet, outRsuEffRate,
              gapNote
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC || !window.USFC_FEDERAL_2026 || !window.USFC_STATE) return;
  var U = window.USFC;
  var FED = window.USFC_FEDERAL_2026;
  var STATES = window.USFC_STATE;

  var SUPP_RATE = 0.22;          // federal supplemental withholding (<= $1M)
  var SUPP_RATE_HIGH = 0.37;     // on supplemental wages over $1M
  var SUPP_THRESHOLD = 1000000;

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

  function stateTax(taxable, code) {
    var s = STATES[code];
    if (!s || s.type === 'none') return 0;
    if (s.type === 'flat') return Math.max(0, taxable) * s.rate;
    return taxFromBrackets(taxable, s.brackets);
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var shares = Math.max(0, i.shares || 0);
    var price = Math.max(0, i.vestPrice || 0);
    var base = Math.max(0, i.baseSalary || 0);
    var status = i.filingStatus || 'single';
    var rsu = shares * price;

    var fedBrackets = FED.brackets[status] || FED.brackets.single;
    var stdDed = FED.standardDeduction[status] || FED.standardDeduction.single;

    // ---- Marginal federal income tax on the RSU slice ----
    var baseTaxable = Math.max(0, base - stdDed);
    var combinedTaxable = Math.max(0, base + rsu - stdDed);
    var actualFed = taxFromBrackets(combinedTaxable, fedBrackets) -
                    taxFromBrackets(baseTaxable, fedBrackets);
    if (actualFed < 0) actualFed = 0;

    // ---- Employer federal withholding (supplemental flat) ----
    var withheld;
    if (rsu <= SUPP_THRESHOLD) {
      withheld = rsu * SUPP_RATE;
    } else {
      withheld = SUPP_THRESHOLD * SUPP_RATE + (rsu - SUPP_THRESHOLD) * SUPP_RATE_HIGH;
    }

    // Gap: positive = under-withheld (you owe more at filing)
    var gap = actualFed - withheld;

    // ---- FICA on RSU wages ----
    // Social Security: base salary consumes the wage base first.
    var ssRoom = Math.max(0, FED.fica.socialSecurityWageBase - base);
    var rsuSSWages = Math.min(rsu, ssRoom);
    var rsuSS = rsuSSWages * FED.fica.socialSecurityRate;

    // Medicare 1.45% on all RSU + additional 0.9% on combined over threshold
    var rsuMedicare = rsu * FED.fica.medicareRate;
    var addlThreshold = FED.fica.additionalMedicareThreshold[status] ||
                        FED.fica.additionalMedicareThreshold.single;
    var combinedComp = base + rsu;
    var addlBaseAlready = Math.max(0, base - addlThreshold);
    var addlCombined = Math.max(0, combinedComp - addlThreshold);
    var rsuAddlMedicareWages = addlCombined - addlBaseAlready;
    if (rsuAddlMedicareWages > 0) {
      rsuMedicare += rsuAddlMedicareWages * FED.fica.additionalMedicareRate;
    }

    // ---- Marginal state tax on the RSU slice ----
    var baseStTaxable = Math.max(0, base);
    var combinedStTaxable = Math.max(0, base + rsu);
    var rsuState = stateTax(combinedStTaxable, i.state || 'CA') -
                   stateTax(baseStTaxable, i.state || 'CA');
    if (rsuState < 0) rsuState = 0;

    var totalActualTax = actualFed + rsuSS + rsuMedicare + rsuState;
    var net = rsu - totalActualTax;
    var effRate = rsu > 0 ? totalActualTax / rsu : 0;

    return {
      rsu: rsu,
      withheld: withheld,
      actualFed: actualFed,
      gap: gap,
      rsuSS: rsuSS,
      rsuMedicare: rsuMedicare,
      rsuState: rsuState,
      net: net,
      effectiveRate: effRate
    };
  }

  var el = {};
  var ids = ['shares','vestPrice','baseSalary','rsuFilingStatus','rsuState'];

  function readInputs() {
    return {
      shares: U.readField(el.shares, { min: 0, fallback: 0 }).value,
      vestPrice: U.readField(el.vestPrice, { min: 0, fallback: 0 }).value,
      baseSalary: U.readField(el.baseSalary, { min: 0, fallback: 0 }).value,
      filingStatus: el.rsuFilingStatus.value,
      state: el.rsuState.value
    };
  }

  function render(r) {
    U.setText('outRsuGross', U.formatUSD(r.rsu, false));
    U.setText('outWithheld', U.formatUSD(r.withheld, false));
    U.setText('outActualFed', U.formatUSD(r.actualFed, false));
    U.setText('outRsuSS', U.formatUSD(r.rsuSS, false));
    U.setText('outRsuMedicare', U.formatUSD(r.rsuMedicare, false));
    U.setText('outRsuState', U.formatUSD(r.rsuState, false));
    U.setText('outRsuNet', U.formatUSD(r.net, false));
    U.setText('outRsuEffRate', U.formatPercent(r.effectiveRate));

    var gapEl = document.getElementById('outGap');
    var gapLabel = document.getElementById('outGapLabel');
    var gapNote = document.getElementById('gapNote');
    var underWithheld = r.gap > 0.5;
    var overWithheld = r.gap < -0.5;

    if (gapEl) {
      gapEl.textContent = U.formatUSD(Math.abs(r.gap), false);
      gapEl.className = underWithheld ? 'text-warning' : (overWithheld ? 'text-positive' : '');
    }
    if (gapLabel) {
      gapLabel.textContent = underWithheld ? 'Estimated additional tax owed at filing'
        : (overWithheld ? 'Estimated federal refund from RSU' : 'Withholding roughly matches');
    }
    if (gapNote) {
      gapNote.hidden = !underWithheld;
    }

    U.announce('After-tax RSU value ' + U.formatUSD(r.net, false) +
      (underWithheld ? '. Warning: 22% withholding under-withholds by about ' +
        U.formatUSD(r.gap, false) + ', which may be owed at filing.' : '.'));

    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('rsuChart');
    if (!container || !U.renderDonutChart) return;
    U.renderDonutChart(container, {
      segments: [
        { label: 'After-tax value', value: r.net,         color: 'var(--chart-1)' },
        { label: 'Federal tax',     value: r.actualFed,   color: 'var(--chart-2)' },
        { label: 'Social Security', value: r.rsuSS,       color: 'var(--chart-3)' },
        { label: 'Medicare',        value: r.rsuMedicare, color: 'var(--chart-5)' },
        { label: 'State tax',       value: r.rsuState,    color: 'var(--chart-4)' }
      ],
      centerLabel: U.formatUSD(r.rsu, false),
      centerSub: 'RSU value',
      valueFormat: function (v) { return U.formatUSD(v, false); },
      title: 'After-tax RSU value versus federal tax, FICA and state tax'
    });
  }

  function recalc() { render(compute(readInputs())); }

  function populateStates() {
    var sel = el.rsuState;
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

  window.USFC_rsu = { compute: compute };
})();
