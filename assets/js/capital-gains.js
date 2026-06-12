/* ==========================================================================
   USFinCalc — Capital gains tax calculator (capital-gains.js)
   Estimates federal tax on the sale of an asset, separating LONG-TERM
   (held > 1 year, preferential 0/15/20% rates) from SHORT-TERM (held <= 1
   year, taxed as ordinary income at marginal rates). Adds the 3.8% Net
   Investment Income Tax (NIIT) when MAGI exceeds the threshold.

   Method:
     gain = max(0, salePrice - costBasis)
     SHORT-TERM: stack the gain on top of other ordinary taxable income and
       take the MARGINAL ordinary tax: tax(other+gain) - tax(other).
     LONG-TERM: the rate depends on total taxable income. The gain fills the
       0% / 15% / 20% bands that sit above the taxpayer's other taxable
       income, using the LTCG breakpoints.
     NIIT: 3.8% on the gain to the extent MAGI (other income + gain) exceeds
       the NIIT threshold.

   Depends on core.js, federal-tax.js. No client-side storage.

   Element IDs in capital-gains-calculator.html:
     inputs : salePrice, costBasis, otherIncome, cgFilingStatus, holding
     outputs: outCgGain, outCgRate, outCgFederal, outCgNiit, outCgTotalTax,
              outCgNet, outCgEffRate, cgRateNote
   ========================================================================== */
(function () {
  'use strict';
  if (!window.USFC || !window.USFC_FEDERAL_2026) return;
  var U = window.USFC;
  var FED = window.USFC_FEDERAL_2026;

  var ids = ['salePrice','costBasis','otherIncome','cgFilingStatus','holding'];
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

  /**
   * Long-term capital gains tax: the gain stacks ON TOP of other taxable
   * income and is taxed through the 0/15/20% bands.
   * other = other taxable income (after deductions); gain = LT gain.
   */
  function longTermTax(other, gain, bp) {
    var tax = 0, remaining = gain, top = other + gain;
    // 0% band: from `other` up to ltcg0Max
    var band0 = Math.max(0, Math.min(top, bp.ltcg0Max) - other);
    band0 = Math.min(band0, remaining);
    remaining -= band0; // taxed at 0%
    // 15% band: up to ltcg15Max
    var band15 = Math.max(0, Math.min(top, bp.ltcg15Max) - Math.max(other, bp.ltcg0Max));
    band15 = Math.min(band15, remaining);
    tax += band15 * 0.15;
    remaining -= band15;
    // 20% band: the rest
    tax += Math.max(0, remaining) * 0.20;
    return tax;
  }

  /** Pure calculation — exported for testing. */
  function compute(i) {
    var sale = Math.max(0, i.salePrice || 0);
    var basis = Math.max(0, i.costBasis || 0);
    var other = Math.max(0, i.otherIncome || 0);
    var status = i.filingStatus || 'single';
    var isLong = i.holding === 'long';

    var gain = Math.max(0, sale - basis);

    var stdDed = FED.standardDeduction[status] || FED.standardDeduction.single;
    var otherTaxable = Math.max(0, other - stdDed);

    var brackets = FED.brackets[status] || FED.brackets.single;
    var bp = FED.longTermCapitalGains[status] || FED.longTermCapitalGains.single;

    var federal, rateLabel;
    if (gain === 0) {
      federal = 0; rateLabel = '—';
    } else if (isLong) {
      federal = longTermTax(otherTaxable, gain, bp);
      // Effective LT rate on the gain, for display.
      var r = federal / gain;
      rateLabel = r < 0.0005 ? '0%' : (r <= 0.155 ? '15%' : (r >= 0.199 ? '20%' : 'blended'));
    } else {
      // Short-term: marginal ordinary tax on the stacked gain.
      federal = taxFromBrackets(otherTaxable + gain, brackets) -
                taxFromBrackets(otherTaxable, brackets);
      rateLabel = 'ordinary';
    }

    // NIIT 3.8% on the gain above the MAGI threshold (uses gross income proxy).
    var niitThresh = FED.niit.threshold[status] || FED.niit.threshold.single;
    var magi = other + gain;
    var niitBase = Math.max(0, Math.min(gain, magi - niitThresh));
    var niit = niitBase * FED.niit.rate;

    var totalTax = federal + niit;
    var net = gain - totalTax;
    var effRate = gain > 0 ? totalTax / gain : 0;

    return {
      gain: gain, federal: federal, niit: niit, totalTax: totalTax,
      net: net, effRate: effRate, rateLabel: rateLabel, isLong: isLong
    };
  }

  function readInputs() {
    return {
      salePrice:    U.readField(el.salePrice, { min: 0, fallback: 0 }).value,
      costBasis:    U.readField(el.costBasis, { min: 0, fallback: 0 }).value,
      otherIncome:  U.readField(el.otherIncome, { min: 0, fallback: 0 }).value,
      filingStatus: el.cgFilingStatus ? el.cgFilingStatus.value : 'single',
      holding:      el.holding ? el.holding.value : 'long'
    };
  }

  function render(r) {
    U.setText('outCgGain', U.formatUSD(r.gain, false));
    U.setText('outCgRate', r.rateLabel);
    U.setText('outCgFederal', U.formatUSD(r.federal, false));
    U.setText('outCgNiit', U.formatUSD(r.niit, false));
    U.setText('outCgTotalTax', U.formatUSD(r.totalTax, false));
    U.setText('outCgNet', U.formatUSD(r.net, false));
    U.setText('outCgEffRate', U.formatPercent(r.effRate));

    var note = document.getElementById('cgRateNote');
    if (note) {
      note.textContent = r.gain === 0 ? 'Enter a sale price above your cost basis to see the tax.'
        : (r.isLong
            ? 'Long-term rate applies (asset held more than one year).'
            : 'Short-term gains are taxed as ordinary income at your marginal rate.');
    }

    U.announce('Estimated capital gains tax ' + U.formatUSD(r.totalTax, false) +
               ' on a ' + U.formatUSD(r.gain, false) + ' gain.');
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

  window.USFC_capitalgains = { compute: compute };
})();
