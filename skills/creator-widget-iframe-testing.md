# Test a Creator Widget from Outside (cross-origin iframe eval)

Use this when: you must drive, seed, or measure a DEPLOYED Creator widget from a browser-automation
session — load-test it, seed N records, measure render cost, simulate drag, or check concurrency.
Do NOT use to edit the widget — change `widget.html` and re-deploy (see `creator-widget-build-register.md`).

## Key fact (verified 2026-06-14)
1. A registered widget runs INSIDE a cross-origin iframe: `iframe[name="embedded-preview"]` on
   `creatorapp.zoho.com`, served from `zappsusercontent.com`.
2. You CANNOT read it from the parent page — `iframe.contentDocument` is null (cross-origin), and
   `document.querySelector('.card')` from the parent finds nothing.
3. BUT an ELEMENT-SCOPED `browser_evaluate` runs INSIDE the iframe's frame. Pass any element ref
   that is inside the iframe; reach the widget's window with `el.ownerDocument.defaultView`.

## Step 0 — get an element ref inside the iframe
1. `browser_navigate` to the app base URL; `browser_wait_for` ~8s so the widget boots.
2. `browser_snapshot` with `target: 'iframe[name="embedded-preview"]'`.
3. Copy any stable ref inside it (e.g. the composer input). Use it as the `target` of every
   `browser_evaluate` below.

## Seed N records (drive the widget's already-initialized SDK)
The widget already ran `ZOHO.CREATOR.init()`, so `ZOHO.CREATOR.API` is ready on its window.
```js
async (el) => {
  const w = el.ownerDocument.defaultView, API = w.ZOHO.CREATOR.API;
  let ok = 0, fail = 0, i = 0; const N = 100, POOL = 6;        // POOL 6 avoids HTTP 429 (see creator-bulk-write-throttling.md)
  const sleep = ms => new Promise(r => w.setTimeout(r, ms));
  async function worker(){ while (i < N){ const n = ++i;
    try { const r = await API.addRecord({ appName:'<app>', formName:'<Form>', data:{ data:{ Field:'row '+n } } });
          (r && r.code === 3000) ? ok++ : fail++; }
    catch(e){ fail++; await sleep(500); } } }
  await Promise.all(Array.from({length: POOL}, worker));
  return { ok, fail };
}
```

## Measure render cost (no widget code change)
```js
(el) => { const d = el.ownerDocument, w = d.defaultView, s = d.getElementById('search');
  const t0 = w.performance.now(); s.value=''; s.dispatchEvent(new w.Event('input',{bubbles:true}));
  return { ms: w.performance.now()-t0, cards: d.querySelectorAll('.card').length,
           nodes: d.getElementById('board').getElementsByTagName('*').length }; }
```
To count render passes: attach a `MutationObserver` (childList) on `#board` BEFORE firing N keystrokes;
count how many times columns are re-added (debounce should collapse a burst to 1).

## Simulate an HTML5 drag (no flaky mouse automation)
```js
async (el) => { const d = el.ownerDocument, w = d.defaultView;
  const card = d.querySelector('.col[data-status="To Do"] .card'), col = d.querySelector('.col[data-status="Done"]');
  const dt = new w.DataTransfer(), fire = (t,ty)=>t.dispatchEvent(new w.DragEvent(ty,{bubbles:true,cancelable:true,dataTransfer:dt}));
  fire(card,'dragstart'); fire(col,'dragover'); fire(col,'drop'); await new Promise(r=>w.setTimeout(r,200));
  return { movedToDone: !!d.querySelector('.col[data-status="Done"] [data-id="'+card.dataset.id+'"]') }; }
```
Decision rule: pass the SAME `dt` object to dragstart → dragover → drop (it carries the dragged id).

## If you see X → do Y
- `contentDocument` is null / "cannot access cross-origin frame" → do NOT use parent-document queries; use element-scoped `browser_evaluate` (it runs in the frame).
- A captured element does nothing after a re-render → the widget rebuilt the DOM and detached your node; RE-QUERY the element by selector each time inside the eval, never reuse a stale handle.
- Seeding writes fail with ~HTTP 429 → you exceeded the write rate; lower POOL / add backoff per `creator-bulk-write-throttling.md`.

## Related Skills
- `creator-bulk-write-throttling.md` — pool + backoff for the seeding loop.
- `creator-widget-scalability.md` — what the render/scroll/node numbers mean.
- `creator-widget-js-sdk.md` — exact SDK call shapes used above.
