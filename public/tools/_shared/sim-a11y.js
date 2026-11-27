/* ==========================================================================
   sim-a11y.js: small accessibility helpers for the static simulators.

   MINIMAL LOCAL EQUIVALENT written by lane S (1.9) because lane T's shared
   file was not on this branch yet. Lane T owns public/tools/_shared/: when
   its sim-a11y.js lands, keep theirs and drop this one.

     SFA11y.reducedMotion()   true when the reader asked for less motion
     SFA11y.announce(text)    polite screen-reader announcement
   ========================================================================== */
(function () {
  'use strict';
  if (window.SFA11y) return;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var live = null;
  function announce(text) {
    if (!live) {
      live = document.createElement('div');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('role', 'status');
      live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
      (document.body || document.documentElement).appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = String(text); }, 30);
  }
  window.SFA11y = {
    reducedMotion: function () { return !!(mq && mq.matches); },
    announce: announce
  };
})();
