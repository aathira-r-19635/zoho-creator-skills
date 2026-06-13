# Task Board widget — scalability

Verified 2026-06-13 against the live `simple-task-manager` app with **545 records**
(4 seed + 541 created through the widget's own JS SDK).

## How it was tested
- **Load:** 545 records created via `ZOHO.CREATOR.API.addRecord` (concurrency pool driven from the browser).
- **Measurements:** taken inside the live widget iframe via `performance.now()` and a `MutationObserver`.
- **Concurrency:** 5 status-moves fired back-to-back so their `updateRecord` calls overlap in flight.

## Results at 545 items

| Metric | Before hardening | After hardening |
|---|---|---|
| Records loaded (paginated read, 200/page) | 545 (3 reads) ✓ | 545 (3 reads) ✓ |
| Board DOM nodes | 6,558 (all cards rendered, no windowing) | same |
| Full board re-render | ~9.6 ms | ~8 ms (no listener wiring) |
| **10 rapid keystrokes — main-thread blocking** | **73.8 ms** | **0.2 ms** |
| **Renders per 10-keystroke burst** | **~10** | **1** |
| Per-render event listeners wired | ~2,725 (5 × 545) | 6 (delegated, attached once) |
| 5 concurrent moves | — | all land, 0 stuck, 0 lost (545 intact) ✓ |

## What changed (this revision)
1. **Search debounced (120 ms)** — typing no longer triggers a full render per keystroke.
2. **Event delegation** — drag/edit/delete/keyboard handlers are attached **once** to `#board`
   (via `wireBoard()` in `boot()`), not per card. `render()` now only rebuilds innerHTML, so it
   stays O(N) for DOM work with **zero listener churn** as the board grows.
   Verified live: edit-click, Enter-to-edit (a11y), drag-drop move, and concurrent moves all still work.

## Lazy loading (implemented)
Per-column rendering is now capped and grows on scroll, so the DOM no longer holds every card.

- **Per-column render cap:** 50 cards initially, **growing by 50 each time the user scrolls near the bottom**.
- **Scroll container is `.board-wrap`, NOT `col-body`** — the scroll listener must be attached to `.board-wrap`.
- **Scroll position is preserved across renders:** `render()` snapshots `.board-wrap` `scrollTop` before rebuilding innerHTML and restores it afterward, so re-rendering never jumps the board back to the top.
- **New/moved cards `unshift`** onto their column so they land within the rendered cap and stay visible.
- **Measured impact (150 cards):** board DOM **6,558 → 1,821 nodes**; the rendered count grows **150 → 300 → 450** as the user scrolls, with scroll position preserved each step.

## Verdict
Comfortable to **~1–2k items** with the current "render everything" model (render ≈ O(N),
~8 ms at 545). Reads scale via pagination; concurrent UI moves are correct under load.

## Write rate limit (important for bulk/parallel writes)
A burst of **~12 concurrent `addRecord` calls hit a transient API rate limit (~HTTP 429) after ~400
rapid writes**. A pool of **~6 with retry + backoff** completed 140 writes cleanly. User-driven moves
(a few at a time) never hit this, but any *bulk/parallel write* feature must throttle + retry.

## Roadmap beyond ~2k items
- **Server-side filtering** — push search to the report via `getAllRecords` criteria instead of
  fetching everything and filtering in memory.
- **"Load more" / lazy pagination** — fetch and render pages on demand rather than all up front.
- **Targeted DOM patching** — on a single move, move just that card's node instead of rebuilding the
  whole board (avoids the O(N) rebuild per optimistic change).
- **Bulk writes** — throttle to ~6 concurrent with retry/backoff (see above).
