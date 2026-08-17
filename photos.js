/* MindAICode — optional real photographs for the analogies.
 *
 * A real photo of an Indian post box is recognised instantly in a way a drawing
 * is not. But the drawings animate in sync with the code, work offline and never
 * 404 — so photos are an ENHANCEMENT layered on top, never a replacement.
 *
 * HOW TO ADD ONE
 *   1. Put the file in an `img/` folder next to the html, using the exact names
 *      in FILES below. JPG or PNG, ideally under 120 KB, roughly square.
 *   2. That is all. No code change. If a file is missing or fails to load, the
 *      drawing simply stays — the page never shows a broken image or a gap.
 *
 * Licensing is on you: use your own photos or something clearly royalty-free,
 * and keep a note of where each came from.
 */

window.MINDAICODE_PHOTOS = {

  /* set to false to ignore photos entirely, even if the files exist */
  ENABLED: true,

  FILES: {
    jar:      'img/jar.jpg',           // a labelled glass jar in a kitchen
    postbox:  'img/post-box.jpg',      // a row of apartment post boxes, numbers visible
    register: 'img/register.jpg',      // a class attendance register with names and ticks
    vending:  'img/vending.jpg',       // a vending machine, slot and tray visible
    cinema:   'img/cinema.jpg'         // a row of cinema seats from behind, in the dark
  },

  /* shown under a photo so a student knows what they are looking at */
  CAPTIONS: {
    jar:      'a labelled jar — the label stays, the contents change',
    postbox:  'post boxes — each with its own number',
    register: 'a class register — one name at a time',
    vending:  'a vending machine — in, decide, out',
    cinema:   'a dark cinema — nobody can see their own row'
  }
};

(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  const P = window.MINDAICODE_PHOTOS;

  const CSS = [
    '.artSlot{display:block;}',
    '.artPhoto{display:block;width:100%;max-width:230px;height:auto;border-radius:10px;',
    '  border:1px solid var(--border);margin:0 auto;}',
    '.artCap{font-size:10.5px;color:var(--muted);font-style:italic;text-align:center;margin-top:5px;}'
  ].join('\n');
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* Try to load a photo. Only if it genuinely loads do we swap the drawing out —
     so a missing file is completely invisible to the student. */
  function tryPhoto(host) {
    const key = host.dataset.photo;
    if (!key || host.dataset.photoDone) return;
    host.dataset.photoDone = '1';
    if (!P.ENABLED) return;
    const src = P.FILES[key];
    if (!src) return;

    const img = new Image();
    img.onload = function () {
      // guard against a 404 page served as an image, or a 1px placeholder
      if (!img.naturalWidth || img.naturalWidth < 40) return;
      const slot = document.createElement('span');
      slot.className = 'artSlot';
      img.className = 'artPhoto';
      img.alt = P.CAPTIONS[key] || key;
      slot.appendChild(img);
      if (P.CAPTIONS[key]) {
        const cap = document.createElement('span');
        cap.className = 'artCap';
        cap.textContent = P.CAPTIONS[key];
        slot.appendChild(cap);
      }
      // keep the drawing in the DOM but out of sight: the animations still
      // target it, and it comes back if the photo is ever removed
      Array.prototype.forEach.call(host.children, function (c) { c.style.display = 'none'; });
      host.appendChild(slot);
      host.dataset.photoShown = '1';
    };
    img.onerror = function () { /* no photo, no problem — the drawing stays */ };
    img.src = src;
  }

  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-photo]'), tryPhoto);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(scan, 0));
  else setTimeout(scan, 0);

  window.MindAICodePhotos = { scan: scan, tryPhoto: tryPhoto };
})();
