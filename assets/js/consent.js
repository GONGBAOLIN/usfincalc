/* ==========================================================================
   USFinCalc — Consent management + Google Consent Mode v2 (consent.js)

   Works with the inline <head> snippet that sets gtag consent DEFAULTS to
   "denied" before any Google tag loads. This script:
     1. On load, if the user previously accepted, updates consent to granted
        (the head snippet already denied by default, so returning "rejected"
        users stay denied).
     2. If no choice is stored, shows an accessible consent banner.
     3. Persists the choice so the banner does not reappear.

   Consent signals (Consent Mode v2):
     ad_storage, ad_user_data, ad_personalization, analytics_storage.

   The consent CHOICE is the only thing stored (localStorage). Calculator
   inputs are never stored. Depends on the head gtag() stub.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'usfc_consent_v1';   // stored value: 'granted' | 'denied'
  var gtag = window.gtag || function () { (window.dataLayer = window.dataLayer || []).push(arguments); };

  function applyConsent(state) {
    var v = state === 'granted' ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
      analytics_storage: v
    });
  }

  function readChoice() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveChoice(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: choice is session-only */ }
  }

  function removeBanner(banner) {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  }

  function decide(choice, banner) {
    saveChoice(choice);
    applyConsent(choice);
    removeBanner(banner);
    try {
      window.dispatchEvent(new CustomEvent('usfc:consent', { detail: { choice: choice } }));
    } catch (e) { /* CustomEvent unsupported: ads.js falls back to its own check */ }
  }

  function buildBanner() {
    var banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');

    var inner = document.createElement('div');
    inner.className = 'consent__inner container';

    var text = document.createElement('p');
    text.className = 'consent__text';
    text.innerHTML = 'We use cookies to support advertising that keeps USFinCalc free. ' +
      'You can accept personalized ads or continue with non-personalized ads only. ' +
      'See our <a href="/privacy-policy">Privacy Policy</a>.';

    var actions = document.createElement('div');
    actions.className = 'consent__actions';

    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'btn btn--ghost consent__btn';
    reject.textContent = 'Reject non-essential';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'btn btn--primary consent__btn';
    accept.textContent = 'Accept all';

    reject.addEventListener('click', function () { decide('denied', banner); });
    accept.addEventListener('click', function () { decide('granted', banner); });

    actions.appendChild(reject);
    actions.appendChild(accept);
    inner.appendChild(text);
    inner.appendChild(actions);
    banner.appendChild(inner);
    return banner;
  }

  function init() {
    var choice = readChoice();
    if (choice === 'granted') { applyConsent('granted'); return; }
    if (choice === 'denied') { applyConsent('denied'); return; }
    // No stored choice -> default stays denied (from head snippet), show banner.
    var banner = buildBanner();
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  // Expose a way to re-open the banner (e.g. a "Cookie settings" footer link).
  window.USFC_consent = {
    reset: function () {
      try { window.localStorage.removeItem(KEY); } catch (e) {}
      if (!document.querySelector('.consent')) document.body.appendChild(buildBanner());
    }
  };
})();
