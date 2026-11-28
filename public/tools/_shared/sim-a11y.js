/* ==========================================================================
   sim-a11y.js: window.SFA11y, the accessibility helpers every static
   simulator shares (X9, X10). Load after sim-loop.js.

     SFA11y.reducedMotion()        true when the user asked for reduced
                                   motion (reads SFSim.reducedMotion live,
                                   falls back to matchMedia).
     SFA11y.decorative(dt)         dt for decorative motion: 0 when reduced
                                   motion is on, dt otherwise. Multiply
                                   twinkle, auto-rotate, cloud drift and the
                                   like by it. Physics time is never gated.
     SFA11y.announce(text)         say text through one polite live region
                                   (created on first use). Repeats of the
                                   same text are dropped; bursts are
                                   coalesced so a slider drag does not
                                   flood a screen reader.
     SFA11y.live(el, politeness)   mark an element (a status badge) as a
                                   live region: role="status", aria-live.

   Also keeps html.sf-reduced-motion in step with the preference so
   sim-a11y.css can stop CSS motion for the in-app toggle as well.
   No dependencies, no globals but SFA11y.
   ========================================================================== */
(function () {
  'use strict';
  if (window.SFA11y) return;

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function reducedMotion() {
    if (window.SFSim && typeof window.SFSim.reducedMotion === 'boolean') return window.SFSim.reducedMotion;
    return mq ? mq.matches : false;
  }

  function syncClass() {
    var root = document.documentElement;
    if (!root) return;
    if (reducedMotion()) root.classList.add('sf-reduced-motion');
    else root.classList.remove('sf-reduced-motion');
  }
  syncClass();
  if (mq) {
    // Run after sim-loop.js's own listener has updated SFSim.reducedMotion.
    var onChange = function () { setTimeout(syncClass, 0); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  function decorative(dt) { return reducedMotion() ? 0 : dt; }

  var region = null, last = '', timer = 0, pending = '';
  function ensureRegion() {
    if (region && document.body && document.body.contains(region)) return region;
    region = document.createElement('div');
    region.className = 'sr-only';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    (document.body || document.documentElement).appendChild(region);
    return region;
  }
  function announce(text) {
    text = String(text == null ? '' : text).trim();
    if (!text || text === last) return;
    pending = text;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = 0;
      if (pending === last) return;
      last = pending;
      ensureRegion().textContent = pending;
    }, 400);
  }

  function live(el, politeness) {
    if (!el) return el;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', politeness || 'polite');
    el.setAttribute('aria-atomic', 'true');
    return el;
  }

  window.SFA11y = { reducedMotion: reducedMotion, decorative: decorative, announce: announce, live: live };
})();
