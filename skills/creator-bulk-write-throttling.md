# Throttle Bulk / Parallel Writes (avoid HTTP 429)

Use this when: you fire MANY `addRecord`/`updateRecord` calls programmatically (bulk import, seeding
test data, a "move all" action). Do NOT use for user-driven single writes — one move/add never hits
the limit.

## The limit (verified 2026-06-13)
- ~12 concurrent `addRecord` calls hit a transient rate limit (~HTTP 429) after ~400 rapid writes.
- A pool of ~6 concurrent WITH retry + backoff completed 140 writes with 0 failures.
- Reads (`getAllRecords`) are a separate, higher quota — pagination is not affected.

## Rules
1. Cap concurrency at 6 in-flight writes (a fixed-size worker pool draining a queue).
2. Retry ONLY a transient/429 error, with exponential backoff. Do NOT retry a deterministic error
   (e.g. code `2945 EXTRA_KEY_FOUND_IN_JSON`) — fix the payload instead (see `creator-widget-js-sdk.md`).
3. Max 4 attempts per item; after that, count it failed and keep going (don't block the queue).

## Worker-pool + backoff (drop-in)
```js
async function bulkWrite(items, writeOne) {          // writeOne(item) -> Promise<boolean>
  var POOL = 6, idx = 0, ok = 0, fail = 0;
  function sleep(ms){ return new Promise(function (r){ setTimeout(r, ms); }); }
  async function attempt(item) {
    for (var a = 0; a < 4; a++) {                    // up to 4 tries
      try { if (await writeOne(item)) return true; } // true on success (code 3000)
      catch (e) { /* fall through to backoff */ }
      await sleep(250 * Math.pow(2, a) + Math.floor(Math.random() * 200)); // 250/500/1000/2000ms + jitter
    }
    return false;
  }
  async function worker(){ while (idx < items.length) { (await attempt(items[idx++])) ? ok++ : fail++; } }
  var pool = []; for (var i = 0; i < POOL; i++) pool.push(worker());
  await Promise.all(pool);
  return { ok: ok, fail: fail };
}
// Example writeOne — resolves true only on code 3000:
// function writeOne(t){ return ZOHO.CREATOR.API.addRecord(
//   { appName: APP, formName: FORM, data: { data: { Task_Name: t.name, Status: t.status } } }
// ).then(function (r){ return r && r.code === 3000; }); }
```

## Decision rules
- `writeOne` resolves `true` (code 3000) → counted ok; stop retrying that item.
- It throws or resolves falsy → wait `250 * 2^attempt` ms (+ jitter), retry, up to 4 attempts.
- After 4 failed attempts → count as fail; continue the queue.

## If you see X → do Y
- Many writes still fail with ~429 at pool 6 → lower `POOL` to 3 and/or raise the base delay (250 → 500).
- ALL writes fail with code `2945` → payload shape is wrong (NOT a rate issue); double-wrap `data:{ data:{...} }` per `creator-widget-js-sdk.md`.

## Tips
- Throughput reference: pool 12 ≈ 18 writes/s but throttles after ~400; pool 6 + retry is slower but reliable.

## Related Skills
- `creator-widget-js-sdk.md` — exact `addRecord`/`updateRecord` shapes + code 3000 success rule.
- `creator-widget-scalability.md` — render-side scaling (lazy load, delegation, debounce).
