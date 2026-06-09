/* ==========================================================================
   USFinCalc — AdSense loader (ads.js) — DISABLED until approved.

   How to activate after AdSense approval:
     1. Put your real publisher ID in PUBLISHER_ID below (ca-pub-XXXXXXXX...).
     2. Set ENABLED = true.
     3. Put the same pub-ID in /ads.txt (replace the placeholder line).
     4. Replace each ad-slot's data-ad-slot="0000000000" with the real slot ID
        from your AdSense dashboard (one per ad unit), or use Auto Ads.

   This loader is CONSENT-GATED: the AdSense script is only injected after the
   user has interacted with the consent banner. Until then nothing loads, which
   keeps us compliant with Consent Mode v2 defaults (denied). Personalized vs.
   non-personalized is then handled by Google based on the consent signals that
   consent.js sets.

   Depends on consent.js (for the stored choice) and core.js. No effect while
   ENABLED is false.
   ========================================================================== */
(function () {
  'use strict';

  var ENABLED = false;                          // <-- flip to true after approval
  var PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX';  // <-- real ID after approval
  var KEY = 'usfc_consent_v1';

  if (!ENABLED) return;

  function hasChoice() {
    try { return window.localStorage.getItem(KEY) != null; } catch (e) { return false; }
  }

  function loadAdSense() {
    if (document.getElementById('usfc-adsense')) return;
    var s = document.createElement('script');
    s.id = 'usfc-adsense';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
            encodeURIComponent(PUBLISHER_ID);
    document.head.appendChild(s);

    // Initialize each reserved ad slot as an <ins> unit.
    var slots = document.querySelectorAll('.ad-slot');
    slots.forEach(function (slot) {
      if (slot.querySelector('.adsbygoogle')) return;
      slot.removeAttribute('aria-hidden');
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', PUBLISHER_ID);
      ins.setAttribute('data-ad-slot', slot.getAttribute('data-ad-slot') || '0000000000');
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      slot.appendChild(ins);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  function maybeLoad() {
    if (hasChoice()) { loadAdSense(); return true; }
    return false;
  }

  function init() {
    if (maybeLoad()) return;
    // Wait for the consent banner decision (dispatched by consent.js).
    window.addEventListener('usfc:consent', function () { maybeLoad(); }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
