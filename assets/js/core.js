/* ==========================================================================
   USFinCalc — Shared core (core.js)
   Formatting, parsing, validation, debounce, a11y helpers, nav toggle.
   ES6+, zero dependencies, no client-side storage.
   Exposed as window.USFC for per-calculator scripts.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Formatters (memoized Intl instances) ---- */
  const usd0 = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
  const usd2 = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const pct = new Intl.NumberFormat('en-US', {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2,
  });
  const num = new Intl.NumberFormat('en-US');

  /** Format a number as USD. cents=false -> whole dollars. */
  function formatUSD(value, cents) {
    if (!isFinite(value)) return '—';
    return (cents ? usd2 : usd0).format(value);
  }
  /** Format a 0-1 ratio as a percent string. */
  function formatPercent(ratio) {
    if (!isFinite(ratio)) return '—';
    return pct.format(ratio);
  }
  function formatNumber(value) {
    if (!isFinite(value)) return '—';
    return num.format(value);
  }

  /* ---- Parsing & validation ---- */
  /** Strip $ , % and whitespace, return a finite Number or NaN. */
  function parseNumber(raw) {
    if (typeof raw === 'number') return raw;
    if (raw == null) return NaN;
    const cleaned = String(raw).replace(/[^0-9.\-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
    return Number(cleaned);
  }

  /** Clamp n into [min, max]. */
  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  /**
   * Read+validate a numeric field. Returns { value, ok }.
   * opts: { min, max, required, allowZero }
   * Toggles [data-invalid] on the wrapping .field and aria-invalid on input.
   */
  function readField(input, opts) {
    opts = opts || {};
    const field = input.closest('.field');
    const value = parseNumber(input.value);
    let ok = true;

    if (isNaN(value)) {
      ok = !opts.required;
    } else {
      if (opts.min != null && value < opts.min) ok = false;
      if (opts.max != null && value > opts.max) ok = false;
      if (value === 0 && opts.allowZero === false && opts.required) ok = false;
    }

    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (field) field.setAttribute('data-invalid', ok ? 'false' : 'true');

    return { value: isNaN(value) ? (opts.fallback != null ? opts.fallback : 0) : value, ok };
  }

  /* ---- Debounce (trailing) ---- */
  function debounce(fn, wait) {
    let t;
    return function () {
      const ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait == null ? 120 : wait);
    };
  }

  /* ---- a11y: announce results via an aria-live region ---- */
  let liveRegion = null;
  function ensureLiveRegion() {
    if (liveRegion) return liveRegion;
    liveRegion = document.getElementById('usfc-live');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'usfc-live';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
    return liveRegion;
  }
  function announce(message) {
    const r = ensureLiveRegion();
    // clear then set so repeated identical messages re-announce
    r.textContent = '';
    window.requestAnimationFrame(function () { r.textContent = message; });
  }

  /** Write text to an element by id (no-op if missing). */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ---- Finance helper: standard amortized monthly payment ---- */
  /** principal P, annualRatePct (e.g. 6.5), termMonths. */
  function monthlyPayment(P, annualRatePct, termMonths) {
    if (!(P > 0) || !(termMonths > 0)) return 0;
    const r = (annualRatePct / 100) / 12;
    if (r === 0) return P / termMonths;
    const f = Math.pow(1 + r, termMonths);
    return (P * r * f) / (f - 1);
  }

  /* ---- Mobile nav toggle (auto-wires .site-nav__toggle) ---- */
  function initNav() {
    const toggle = document.querySelector('.site-nav__toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      const open = links.getAttribute('data-open') === 'true';
      links.setAttribute('data-open', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    // close on link tap (mobile)
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Dropdown menus in the nav (.nav-dropdown > button + .nav-dropdown__menu) ---- */
  function initDropdowns() {
    const dropdowns = Array.prototype.slice.call(document.querySelectorAll('.nav-dropdown'));
    if (!dropdowns.length) return;

    function closeAll(except) {
      dropdowns.forEach(function (d) {
        if (d === except) return;
        const btn = d.querySelector('.nav-dropdown__toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }

    dropdowns.forEach(function (d) {
      const btn = d.querySelector('.nav-dropdown__toggle');
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const open = btn.getAttribute('aria-expanded') === 'true';
        closeAll(d);
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });

    // Close on outside click and on Escape.
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-dropdown')) closeAll(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll(null);
    });
  }

  /* ---- Highlight the current page's nav link by pathname ---- */
  function initClusterLink() {
    const links = document.getElementById('nav-links');
    if (!links || links.querySelector('a[href="/clusters"]')) return;
    const about = links.querySelector('a[href="/about"]');
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '/clusters';
    link.textContent = 'Clusters';
    item.appendChild(link);
    if (about && about.parentElement) {
      about.parentElement.before(item);
    } else {
      links.appendChild(item);
    }
  }

  /* ---- Copy-to-clipboard (auto-wires [data-copy] buttons) ----
     A [data-copy="#targetId"] button copies the text/value of #targetId
     and briefly swaps its label to confirm. Used by "cite this tool" blocks. */
  function initCopyButtons() {
    const buttons = Array.prototype.slice.call(document.querySelectorAll('[data-copy]'));
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const sel = btn.getAttribute('data-copy');
        const target = sel && document.querySelector(sel);
        if (!target) return;
        const text = 'value' in target ? target.value : target.textContent;
        const done = function () {
          const original = btn.getAttribute('data-label') || btn.textContent;
          btn.setAttribute('data-label', original);
          btn.textContent = 'Copied';
          announce('Copied to clipboard');
          window.setTimeout(function () { btn.textContent = original; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {
            if ('select' in target) { target.select(); }
          });
        } else if ('select' in target) {
          target.select();
          try { document.execCommand('copy'); done(); } catch (e) { /* no-op */ }
        }
      });
    });
  }

  /* ---- Minimal dependency-free SVG line chart ----
     Renders one or two series into a container element as a responsive SVG.
     opts: {
       series: [{ points:[y0,y1,...], color, label }, ...],  // 1-2 series, equal length, x = index
       width, height,           // viewBox units (default 640x260)
       xLabel, yFormat,         // yFormat(value)->string for the max label
       xTicks: [{i, label}],    // optional x-axis tick labels
       title                    // accessible title
     }
     Y axis is auto-scaled from 0 to the max across all series. */
  function renderLineChart(container, opts) {
    if (!container) return;
    opts = opts || {};
    var series = (opts.series || []).filter(function (s) { return s && s.points && s.points.length; });
    if (!series.length) { container.innerHTML = ''; return; }

    var W = opts.width || 640, H = opts.height || 260;
    var padL = 64, padR = 16, padT = 16, padB = 40;
    var plotW = W - padL - padR, plotH = H - padT - padB;

    var n = series[0].points.length;
    var maxY = 0;
    series.forEach(function (s) { s.points.forEach(function (v) { if (v > maxY) maxY = v; }); });
    if (maxY <= 0) maxY = 1;

    var xAt = function (i) { return padL + (n <= 1 ? 0 : (i / (n - 1)) * plotW); };
    var yAt = function (v) { return padT + plotH - (v / maxY) * plotH; };

    var yFormat = opts.yFormat || function (v) { return String(Math.round(v)); };
    var svgns = 'http://www.w3.org/2000/svg';

    function line(x1, y1, x2, y2, cls) {
      return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
             '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" class="' + cls + '"/>';
    }

    var parts = [];
    // horizontal gridlines + y labels at 0, 50%, 100%
    [0, 0.5, 1].forEach(function (f) {
      var v = maxY * f, y = yAt(v);
      parts.push(line(padL, y, W - padR, y, 'chart__grid'));
      parts.push('<text x="' + (padL - 8) + '" y="' + (y + 4).toFixed(1) +
                 '" class="chart__ylabel" text-anchor="end">' + yFormat(v) + '</text>');
    });
    // x axis baseline
    parts.push(line(padL, padT + plotH, W - padR, padT + plotH, 'chart__axis'));
    // x ticks
    (opts.xTicks || []).forEach(function (t) {
      var x = xAt(t.i);
      parts.push('<text x="' + x.toFixed(1) + '" y="' + (H - padB + 22) +
                 '" class="chart__xlabel" text-anchor="middle">' + t.label + '</text>');
    });
    if (opts.xLabel) {
      parts.push('<text x="' + (padL + plotW / 2).toFixed(1) + '" y="' + (H - 4) +
                 '" class="chart__axis-title" text-anchor="middle">' + opts.xLabel + '</text>');
    }
    // series polylines
    series.forEach(function (s) {
      var d = s.points.map(function (v, i) { return xAt(i).toFixed(1) + ',' + yAt(v).toFixed(1); }).join(' ');
      parts.push('<polyline points="' + d + '" fill="none" stroke="' + (s.color || 'currentColor') +
                 '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>');
    });

    var titleId = 'chart-title-' + (container.id || 'x');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart__svg" role="img" ' +
              'aria-labelledby="' + titleId + '" preserveAspectRatio="xMidYMid meet" xmlns="' + svgns + '">' +
              '<title id="' + titleId + '">' + (opts.title || 'Chart') + '</title>' +
              parts.join('') + '</svg>';

    // legend (only if labels present and >1 series)
    var legend = '';
    if (series.length > 1 || series.some(function (s) { return s.label; })) {
      legend = '<div class="chart__legend">' + series.map(function (s) {
        return '<span class="chart__legend-item"><span class="chart__swatch" style="background:' +
               (s.color || 'currentColor') + '"></span>' + (s.label || '') + '</span>';
      }).join('') + '</div>';
    }
    container.innerHTML = svg + legend;
  }

  /* Donut / composition chart. Splits a total into proportional arcs using
     stroke-dasharray on concentric <circle> elements (no arc-path trig, fully
     deterministic). Zero-value segments are skipped. Renders a center label and
     a legend with amount + percent per segment.
       opts.segments   : [{ label, value, color }]  value >= 0
       opts.centerLabel : big text in the hole (e.g. total)
       opts.centerSub   : small text under it
       opts.valueFormat : fn(value) -> string for legend amounts
       opts.title       : accessible <title> */
  function renderDonutChart(container, opts) {
    if (!container) return;
    opts = opts || {};
    var segs = (opts.segments || []).filter(function (s) { return s && s.value > 0; });
    var total = segs.reduce(function (a, s) { return a + s.value; }, 0);
    if (!segs.length || total <= 0) { container.innerHTML = ''; return; }

    var svgns = 'http://www.w3.org/2000/svg';
    var W = 260, H = 260, cx = W / 2, cy = H / 2;
    var r = 92, sw = 34;               // ring radius + stroke width
    var C = 2 * Math.PI * r;           // circumference
    var valueFormat = opts.valueFormat || function (v) { return String(Math.round(v)); };

    var parts = [];
    // track ring (subtle full circle behind the segments)
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" ' +
               'class="chart__donut-track" stroke-width="' + sw + '"/>');

    // segment arcs, rotated so they start at 12 o'clock and go clockwise
    var offset = 0;
    segs.forEach(function (s) {
      var frac = s.value / total;
      var len = frac * C;
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" ' +
                 'stroke="' + (s.color || 'currentColor') + '" stroke-width="' + sw + '" ' +
                 'stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" ' +
                 'stroke-dashoffset="' + (-offset).toFixed(2) + '" ' +
                 'transform="rotate(-90 ' + cx + ' ' + cy + ')"/>');
      offset += len;
    });

    // center text
    if (opts.centerLabel) {
      parts.push('<text x="' + cx + '" y="' + (cy - 2) +
                 '" class="chart__donut-center" text-anchor="middle">' + opts.centerLabel + '</text>');
    }
    if (opts.centerSub) {
      parts.push('<text x="' + cx + '" y="' + (cy + 20) +
                 '" class="chart__donut-sub" text-anchor="middle">' + opts.centerSub + '</text>');
    }

    var titleId = 'donut-title-' + (container.id || 'x');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart__svg chart__svg--donut" ' +
              'role="img" aria-labelledby="' + titleId + '" preserveAspectRatio="xMidYMid meet" xmlns="' + svgns + '">' +
              '<title id="' + titleId + '">' + (opts.title || 'Chart') + '</title>' +
              parts.join('') + '</svg>';

    var legend = '<ul class="chart__legend chart__legend--donut">' + segs.map(function (s) {
      var pct = Math.round((s.value / total) * 100);
      return '<li class="chart__legend-item"><span class="chart__swatch chart__swatch--box" style="background:' +
             (s.color || 'currentColor') + '"></span>' +
             '<span class="chart__legend-label">' + (s.label || '') + '</span>' +
             '<span class="chart__legend-value">' + valueFormat(s.value) + '</span>' +
             '<span class="chart__legend-pct">' + pct + '%</span></li>';
    }).join('') + '</ul>';

    container.innerHTML = '<div class="chart__donut-wrap">' + svg + legend + '</div>';
  }

  function bootNav() { initNav(); initDropdowns(); initClusterLink(); initActiveLink(); initCopyButtons(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootNav);
  } else {
    bootNav();
  }

  /* ---- Public API ---- */
  window.USFC = {
    formatUSD: formatUSD,
    formatPercent: formatPercent,
    formatNumber: formatNumber,
    parseNumber: parseNumber,
    clamp: clamp,
    readField: readField,
    debounce: debounce,
    announce: announce,
    setText: setText,
    monthlyPayment: monthlyPayment,
    renderLineChart: renderLineChart,
    renderDonutChart: renderDonutChart,
  };
})();
