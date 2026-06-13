# Scaling a Creator Widget (large datasets)

## Use this when…
A custom Creator JS-SDK widget (board/list/dashboard) reads/renders hundreds-to-thousands of
records, OR it lags while typing/searching or moving items. Do NOT use for widgets under ~100
records — the plain `render()` is fine there; the techniques below add complexity you don't need.

## Prerequisites
1. Before step 1, confirm the widget uses the v1 SDK — see `creator-widget-js-sdk.md`.
2. Confirm there is a single `render()` that rebuilds the board and a `boot()` that runs once.

## Read path (already scales — do not touch)
1. `getAllRecords` returns max 200/page. Loop pages; stop when a page is short (< 200).
2. Verify: 545 records = 3 reads, sub-second. Reads are NOT the bottleneck.

## Render path — fix these in order
1. Debounce search/filter at 120 ms so a keystroke burst coalesces into ONE render:
   `searchTimer = setTimeout(function(){ query = v; resetLimits(); render(); }, 120);`
   Verify: 545 items, 10 rapid keystrokes — blocking drops 73.8 ms → 0.2 ms; renders ~10 → 1.
2. Use event delegation. Attach drag/click/keydown ONCE to the static `#board` in `wireBoard()`,
   never per card. Inside each handler call `e.target.closest('.card')` / `.closest('.col')`.
   Verify: listeners drop ~2,725/render → 6 total; `render()` only rebuilds `board.innerHTML`.
   ```js
   board.addEventListener("click", function (e) {
     var card = e.target.closest(".card"); if (!card) return;
     if (e.target.closest(".edit")) openEdit(card.dataset.id);
     else if (e.target.closest(".del")) doDelete(card.dataset.id);
   });
   // dragstart/dragend/dragover/drop delegated the same way; call wireBoard() once in boot()
   ```
3. Keep optimistic CRUD: per-item `_pending` lock + last-write-wins (see `creator-widget-js-sdk.md`).
   Verify: 5 concurrent moves (overlapping in-flight updates) all land — none stuck, none lost.

## Windowing / infinite scroll (SHIPPED — verified live 2026-06-13 at 545 records)
Working code: `stm-task-widget/app/widget.html` — `render()` and the scroll handler in `wireBoard()`.
1. Declare the per-status render cap:
   `var PAGE_RENDER = 50; var limits = {};`
   `function resetLimits(){ for (var i=0;i<STATUSES.length;i++) limits[STATUSES[i]] = PAGE_RENDER; }`
   Call `resetLimits()` once at startup.
2. In `render()`, per column: ALWAYS render pending cards; cap the rest at `limits[status]`:
   `var pend = items.filter(t=>t._pending); var rest = items.filter(t=>!t._pending);`
   `var shown = rest.slice(0, limits[status]);` then render `pend.concat(shown)`.
   Pending cards always show so new/optimistic cards stay visible under the cap.
3. Keep the count badge TRUE total, not the capped count:
   `var total = tasks.filter(t=>normStatus(t.Status)===status).length;` — show `total` in the badge.
4. SCROLL-CONTAINER GOTCHA (non-obvious): the WHOLE board scrolls inside `.board-wrap`
   (`= board.parentNode`). The columns and `.col-body` do NOT scroll — they expand to full content
   height (verified `scrollHeight === clientHeight`). Attach the scroll listener to `.board-wrap`,
   NOT a column/col-body. Diagnose by comparing `scrollHeight` vs `clientHeight` of each candidate.
5. Attach ONE `"scroll"` listener on `.board-wrap` inside `wireBoard()`:
   ```js
   var scroller = board.parentNode;                 // .board-wrap
   scroller.addEventListener("scroll", function () {
     if (scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 320) return;
     var grew = false;
     STATUSES.forEach(function (status) {
       var total = tasks.filter(function (t) { return normStatus(t.Status) === status; }).length;
       if (limits[status] < total) { limits[status] += PAGE_RENDER; grew = true; }
     });
     if (grew) render();
   });
   ```
   Decision rule: if `scrollTop + clientHeight < scrollHeight - 320` → not near bottom, return.
   Else → raise `limits[status]` by 50 for every column with hidden cards, then `render()`.
6. SCROLL-POSITION PRESERVATION (critical): `render()` does `board.innerHTML = ""`, which collapses
   `#board` height and resets `.board-wrap.scrollTop` to 0 → user is yanked to the top. FIX: snapshot
   `scroller.scrollTop` at the START of `render()`; restore it at the END (`scroller.scrollTop = saved`).
7. Keep new/moved cards visible under the cap by surfacing them to the FRONT of `tasks`:
   - `submitNew`: `tasks.unshift(temp); render();`
   - `changeStatus`: `var mi = tasks.indexOf(t); if (mi>0){ tasks.splice(mi,1); tasks.unshift(t); }`
8. Reset caps to 50 on SEARCH and on LOAD: call `resetLimits()` before `render()` in the search
   handler (filtered results start at top) and after `tasks = data` in the load handler.
9. Verify: DOM 6,558 nodes (all 545 rendered) → 1,821 nodes (150 cards). Scrolling grows
   150 → 300 → 450 with scroll position preserved (observed `scrollTop` 3941, then 8303).

## If you see X → do Y
- Renders do NOT coalesce to ~1 after debounce → you call `render()` outside the `setTimeout`, or re-bind listeners per render; move `render()` inside the timer and wire once in `wireBoard()`.
- Scroll listener never fires → you attached it to `.col`/`.col-body` (which don't scroll); re-attach to `.board-wrap` (step 4 diagnosis).
- View jumps to top on every render → you skipped the `scroller.scrollTop` snapshot/restore (step 6).
- New/moved cards vanish under the cap → you didn't `unshift` them to the front of `tasks` (step 7).
- Concurrent/bulk writes return ~HTTP 429 → throttle to a pool of ~6 with retry+backoff; see `creator-bulk-write-throttling.md`.

## Beyond ~2k items (next, not yet shipped)
1. Push search to `getAllRecords` criteria instead of in-memory filtering (server-side filtering).
2. Add load-more pagination — fetch pages on demand, not all upfront.
3. Targeted DOM patching — move just the changed card's node instead of rebuilding the board.

## Tips
1. Measure inside the widget iframe with `performance.now()` + a `MutationObserver` (counts render passes).
2. Worked example with before/after numbers: `stm-task-widget/` (`app/widget.html`, `SCALABILITY.md`).

## Related Skills
- `creator-widget-js-sdk.md` — SDK calls + optimistic-CRUD hardening.
- `creator-widget-build-register.md` — build, pack, register, re-deploy.
- `creator-bulk-write-throttling.md` — pool + backoff for bulk/parallel writes (avoids HTTP 429).
- `creator-widget-iframe-testing.md` — measure render/scroll/node counts from outside the cross-origin iframe.
