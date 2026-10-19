/* ==========================================================================
   science-embed.js — the Science pages, framed by the app.

   docs/stellarforge/15-PAGE-CHROME.md: each simulator's Science page is a
   standalone child page. The app renders its PageHeader ("Back to <sim>",
   // THE SCIENCE, "Showing our work") above this document in an iframe
   (src/components/simulators/SimulatorSciencePage.tsx) and sizes the frame
   to the content, so the page scrolls once, not twice.

   When embedded, this hides the document's own title block (which the
   PageHeader replaces) and the fixed starfield (a full-height canvas inside
   an auto-height frame would be enormous). Opened directly, the page is
   untouched.
   ========================================================================== */
(function () {
  if (window.self === window.top) return;
  document.documentElement.classList.add('sf-embedded');
  var css =
    '.sf-embedded .science-page>h1,' +
    '.sf-embedded .science-page>.subtitle,' +
    '.sf-embedded .header>.tool-name,' +
    '.sf-embedded .header>.subtitle,' +
    '.sf-embedded .header>h1,' +
    '.sf-embedded canvas.starfield{display:none!important}' +
    // Align to the app's content edge (the PageHeader's left edge) and let
    // the app's void show through.
    '.sf-embedded .science-page,.sf-embedded .container{margin-left:0!important;padding:8px 0 48px!important}' +
    '.sf-embedded,.sf-embedded body{background:transparent!important}' +
    '.sf-embedded body{overflow:hidden}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
