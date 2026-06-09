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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
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
  };
})();
