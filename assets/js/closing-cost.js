(function () {
  'use strict';
  if (!window.USFC) return;
  var U = window.USFC;

  var ids = ['homePrice', 'downPayment', 'loanType', 'state', 'points', 'titleInsurance'];
  var el = {};

  var STATE_DATA = {
    AL: { transfer: 0.001, recording: 150 }, AK: { transfer: 0, recording: 100 },
    AZ: { transfer: 0, recording: 75 }, AR: { transfer: 0.0033, recording: 100 },
    CA: { transfer: 0.0011, recording: 100 }, CO: { transfer: 0.001, recording: 75 },
    CT: { transfer: 0.0075, recording: 150 }, DE: { transfer: 0.04, recording: 150 },
    FL: { transfer: 0.007, recording: 100 }, GA: { transfer: 0.001, recording: 100 },
    HI: { transfer: 0.002, recording: 125 }, ID: { transfer: 0, recording: 75 },
    IL: { transfer: 0.001, recording: 100 }, IN: { transfer: 0, recording: 75 },
    IA: { transfer: 0.0016, recording: 75 }, KS: { transfer: 0, recording: 75 },
    KY: { transfer: 0.001, recording: 75 }, LA: { transfer: 0, recording: 100 },
    ME: { transfer: 0.0044, recording: 100 }, MD: { transfer: 0.005, recording: 150 },
    MA: { transfer: 0.00456, recording: 150 }, MI: { transfer: 0.0075, recording: 100 },
    MN: { transfer: 0.0033, recording: 100 }, MS: { transfer: 0, recording: 75 },
    MO: { transfer: 0, recording: 75 }, MT: { transfer: 0, recording: 100 },
    NE: { transfer: 0.00225, recording: 75 }, NV: { transfer: 0.0026, recording: 100 },
    NH: { transfer: 0.015, recording: 100 }, NJ: { transfer: 0.004, recording: 200 },
    NM: { transfer: 0, recording: 75 }, NY: { transfer: 0.004, recording: 250 },
    NC: { transfer: 0.002, recording: 100 }, ND: { transfer: 0, recording: 75 },
    OH: { transfer: 0.004, recording: 75 }, OK: { transfer: 0.00075, recording: 75 },
    OR: { transfer: 0.001, recording: 100 }, PA: { transfer: 0.02, recording: 200 },
    RI: { transfer: 0.0046, recording: 125 }, SC: { transfer: 0.0037, recording: 100 },
    SD: { transfer: 0.001, recording: 75 }, TN: { transfer: 0.0037, recording: 100 },
    TX: { transfer: 0, recording: 100 }, UT: { transfer: 0, recording: 75 },
    VT: { transfer: 0.015, recording: 100 }, VA: { transfer: 0.0025, recording: 100 },
    WA: { transfer: 0.018, recording: 150 }, WV: { transfer: 0.0033, recording: 75 },
    WI: { transfer: 0.003, recording: 75 }, WY: { transfer: 0, recording: 75 },
    DC: { transfer: 0.014, recording: 200 }
  };

  function compute(i) {
    var loanAmount = i.homePrice * (1 - i.downPayment / 100);
    var sd = STATE_DATA[i.state] || { transfer: 0, recording: 100 };

    var origination = loanAmount * 0.0075;
    var appraisal = 550;
    var creditReport = 50;
    var floodCert = 20;
    var pointsCost = loanAmount * (i.points / 100);

    var titleIns = i.titleInsurance === 'yes' ? i.homePrice * 0.005 : 0;
    var lenderTitle = loanAmount * 0.0035;
    var titleSearch = 400;
    var settlement = 800;

    var transferTax = i.homePrice * sd.transfer;
    var recording = sd.recording;

    // Prepaid interest = ~15 days of per-diem interest at closing.
    // No rate input on this tool, so assume a representative 6.5% APR (2026).
    var ASSUMED_APR = 0.065;
    var prepaidInterest = loanAmount * (ASSUMED_APR / 365) * 15;
    var escrowTaxes = (i.homePrice * 0.012 / 12) * 3;
    var escrowInsurance = 150 * 3;

    var loanSpecific = 0;
    if (i.loanType === 'FHA') loanSpecific = loanAmount * 0.0175;
    else if (i.loanType === 'VA') loanSpecific = loanAmount * 0.023;

    var lenderFees = origination + appraisal + creditReport + floodCert + pointsCost + loanSpecific;
    var titleFees = titleIns + lenderTitle + titleSearch + settlement;
    var govFees = transferTax + recording;
    var prepaids = prepaidInterest + escrowTaxes + escrowInsurance;

    var totalClosing = lenderFees + titleFees + govFees + prepaids;
    var downPaymentAmt = i.homePrice * (i.downPayment / 100);
    var cashNeeded = totalClosing + downPaymentAmt;
    var pctOfPrice = (totalClosing / i.homePrice) * 100;

    return {
      totalClosing: totalClosing,
      cashNeeded: cashNeeded,
      pctOfPrice: pctOfPrice,
      lenderFees: lenderFees,
      titleFees: titleFees,
      govFees: govFees,
      prepaids: prepaids,
      downPaymentAmt: downPaymentAmt,
      origination: origination,
      appraisal: appraisal,
      pointsCost: pointsCost,
      loanSpecific: loanSpecific,
      titleIns: titleIns,
      lenderTitle: lenderTitle,
      transferTax: transferTax,
      recording: recording
    };
  }

  function readInputs() {
    return {
      homePrice: U.readField(el.homePrice, { min: 10000, fallback: 400000 }).value,
      downPayment: U.readField(el.downPayment, { min: 0, max: 100, fallback: 20 }).value,
      loanType: el.loanType.value,
      state: el.state.value,
      points: U.readField(el.points, { min: 0, max: 5, fallback: 0 }).value,
      titleInsurance: el.titleInsurance.value
    };
  }

  function render(r) {
    U.setText('outTotal', U.formatUSD(r.totalClosing, false));
    U.setText('outCash', U.formatUSD(r.cashNeeded, false));
    U.setText('outPct', r.pctOfPrice.toFixed(1) + '%');
    U.setText('outLender', U.formatUSD(r.lenderFees, false));
    U.setText('outTitle', U.formatUSD(r.titleFees, false));
    U.setText('outGov', U.formatUSD(r.govFees, false));
    U.setText('outPrepaids', U.formatUSD(r.prepaids, false));
    U.setText('outDown', U.formatUSD(r.downPaymentAmt, false));
    U.announce('Estimated closing costs are ' + U.formatUSD(r.totalClosing, false));
    drawChart(r);
  }

  function drawChart(r) {
    var container = document.getElementById('chartClosingCost');
    if (!container || !U.renderDonutChart) return;

    var segments = [];
    if (r.lenderFees > 0) segments.push({ label: 'Lender fees', value: r.lenderFees, color: 'var(--chart-3)' });
    if (r.titleFees > 0) segments.push({ label: 'Title & settlement', value: r.titleFees, color: 'var(--chart-4)' });
    if (r.govFees > 0) segments.push({ label: 'Government (tax & recording)', value: r.govFees, color: 'var(--chart-2)' });
    if (r.prepaids > 0) segments.push({ label: 'Prepaids & escrow', value: r.prepaids, color: 'var(--chart-5)' });

    U.renderDonutChart(container, {
      segments: segments,
      centerLabel: U.formatUSD(r.totalClosing, false),
      centerSub: 'closing costs',
      valueFormat: function (v) { return U.formatUSD(v, false); },
      title: 'Closing cost breakdown'
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

  window.USFC_closingCost = { compute: compute };
})();
