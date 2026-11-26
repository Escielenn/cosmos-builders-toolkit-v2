/* ==========================================================================
   sim-loop.js: one animation loop for the four static simulators
   (Rogue, Tidelock, ExoForge, Solaris).

   Plain-JS twin of src/lib/sim/frame-loop.ts; keep the two in step. The
   static sims cannot import from the app bundle, so the same rules live
   here as a classic script that defines window.SFSim:

     SFSim.loop(frame, opts)      one rAF loop. frame(time, dt) gets a dt
                                  clamped to opts.maxDt (default 100 ms) and
                                  0 on the first frame after a start or a
                                  park, so motion never jumps. The loop parks
                                  while the tab is hidden or the iframe is
                                  scrolled off screen and resumes by itself.
     SFSim.stepBudget(max)        whole integrator steps for elapsed time,
                                  carrying the fraction: the same number of
                                  steps per second at 30, 60 or 120 Hz.
     SFSim.smoothing(dt)          CLAUDE.md camera formula, 1 - 0.0001^(dt/1000).
     SFSim.perFrame(k, dt)        a legacy "fraction per 60 Hz frame" as a
                                  time-based factor (identical at 16.67 ms).
     SFSim.text(el, str)          textContent write that skips unchanged
                                  values (no layout work for a still readout).
     SFSim.html(el, str)          same for innerHTML.
     SFSim.style(el, prop, str)   same for one inline style property.
     SFSim.adaptivePixelRatio()   steps a WebGL renderer's pixel ratio down
                                  when the device cannot hold the frame rate.
     SFSim.reducedMotion          prefers-reduced-motion, live.

   No dependencies, no globals but SFSim.
   ========================================================================== */
(function () {
  'use strict';
  if (window.SFSim) return;

  var FRAME_MS = 1000 / 60;

  function loop(frame, opts) {
    opts = opts || {};
    var maxDt = opts.maxDt || 100;
    var active = false, handle = 0, last = -1, onScreen = true, observer = null;

    function parked() { return document.hidden || !onScreen; }

    function tick(time) {
      handle = 0;
      if (!active) return;
      if (parked()) { last = -1; return; }
      var dt = last < 0 ? 0 : time - last;
      last = time;
      if (dt < 0) dt = 0;
      if (dt > maxDt) dt = maxDt;
      frame(time, dt);
      if (active && !handle) handle = requestAnimationFrame(tick);
    }

    function wake() {
      if (!active || handle || parked()) return;
      last = -1;
      handle = requestAnimationFrame(tick);
    }

    var api = {
      start: function () {
        if (active) return api;
        active = true;
        document.addEventListener('visibilitychange', wake);
        // In an iframe the implicit root is the top-level viewport, so this
        // also catches the wrapper page being scrolled down to its footer.
        if ('IntersectionObserver' in window) {
          try {
            observer = new IntersectionObserver(function (entries) {
              onScreen = entries[entries.length - 1].isIntersecting;
              wake();
            });
            observer.observe(document.documentElement);
          } catch (e) { observer = null; onScreen = true; }
        }
        wake();
        return api;
      },
      stop: function () {
        active = false;
        if (handle) cancelAnimationFrame(handle);
        handle = 0;
        document.removeEventListener('visibilitychange', wake);
        if (observer) observer.disconnect();
        observer = null; onScreen = true;
        return api;
      },
      isTicking: function () { return !!handle; }
    };
    return api;
  }

  function stepBudget(maxPerFrame) {
    var carry = 0;
    var max = maxPerFrame || Infinity;
    return {
      take: function (dtMs, stepsPerSecond) {
        if (dtMs <= 0 || stepsPerSecond <= 0) return 0;
        carry += (dtMs / 1000) * stepsPerSecond;
        var whole = Math.floor(carry + 1e-9);
        carry = Math.max(0, carry - whole);
        if (whole > max) { whole = max; carry = 0; }
        return whole;
      },
      reset: function () { carry = 0; }
    };
  }

  function smoothing(dtMs, residual) {
    if (dtMs <= 0) return 0;
    return 1 - Math.pow(residual || 0.0001, dtMs / 1000);
  }

  function perFrame(k, dtMs) {
    if (dtMs <= 0) return 0;
    return 1 - Math.pow(1 - k, dtMs / FRAME_MS);
  }

  // Cached DOM writes. The cache lives on the element so a node replaced by
  // innerHTML elsewhere starts clean.
  function text(el, value) {
    if (!el) return;
    value = String(value);
    if (el.__sfText === value) return;
    el.__sfText = value;
    el.textContent = value;
  }
  function html(el, value) {
    if (!el) return;
    if (el.__sfHtml === value) return;
    el.__sfHtml = value;
    el.innerHTML = value;
  }
  function style(el, prop, value) {
    if (!el) return;
    var key = '__sfStyle_' + prop;
    if (el[key] === value) return;
    el[key] = value;
    el.style[prop] = value;
  }

  /**
   * Dynamic resolution for a three.js renderer. Starts at min(dpr, max) and
   * steps down (never up, so it cannot oscillate) when the average frame
   * over a one-second window is slower than `slowMs`. `floor` is the lowest
   * ratio it will use. Call .sample(dt) once per RENDERED frame.
   */
  function adaptivePixelRatio(renderer, opts) {
    opts = opts || {};
    var max = opts.max || 2;
    var floor = opts.floor || 0.75;
    var slowMs = opts.slowMs || 26; // worse than ~38 fps, sustained
    var onChange = opts.onChange || function () {};
    var ratio = Math.min(window.devicePixelRatio || 1, max);
    var sum = 0, n = 0, settle = 0;
    renderer.setPixelRatio(ratio);
    return {
      get ratio() { return ratio; },
      sample: function (dtMs) {
        if (dtMs <= 0) return;
        // Ignore the first frames after a change: they pay for the resize.
        if (settle > 0) { settle--; return; }
        sum += dtMs; n++;
        if (sum < 1000) return;
        var avg = sum / n;
        sum = 0; n = 0;
        if (avg > slowMs && ratio > floor) {
          ratio = Math.max(floor, Math.round(ratio * 0.8 * 100) / 100);
          renderer.setPixelRatio(ratio);
          settle = 6;
          onChange(ratio);
        }
      },
      /** Idle or static frames are not evidence: forget the window. */
      idle: function () { sum = 0; n = 0; },
      reset: function () {
        ratio = Math.min(window.devicePixelRatio || 1, max);
        renderer.setPixelRatio(ratio);
        sum = 0; n = 0; settle = 6;
      }
    };
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var SFSim = {
    FRAME_MS: FRAME_MS,
    loop: loop,
    stepBudget: stepBudget,
    smoothing: smoothing,
    perFrame: perFrame,
    text: text,
    html: html,
    style: style,
    adaptivePixelRatio: adaptivePixelRatio,
    reducedMotion: mq ? mq.matches : false
  };
  if (mq) {
    var onMq = function (e) { SFSim.reducedMotion = e.matches; };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }
  window.SFSim = SFSim;
})();
