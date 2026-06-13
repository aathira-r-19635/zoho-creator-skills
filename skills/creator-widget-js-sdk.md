# Creator Widget JS SDK (v1)

Use this when: writing browser JS inside a custom HTML Creator widget that must read/write Creator records (board, dashboard, single-page tool).
Do NOT use when: writing Deluge server code, or expecting a v2 SDK — there is NO `ZOHO.CREATOR.DATA` or `ZOHO.CREATOR.META` namespace in widgets. Only v1 `ZOHO.CREATOR.API` exists (verified 2026-06-13).

## Prerequisites
Before step 1, confirm BOTH:
1. The widget is registered in the Creator app (do that first via creator-widget-build-register.md).
2. This exact script tag is in your `<head>`:
```html
<script src="https://js.zohostatic.com/creator/widgets/version/1.0/widgetsdk-min.js"></script>
```
Verify: `typeof ZOHO.CREATOR === 'object'` is `true` in the browser console.

## Steps
1. Init exactly once before ANY API call. Put ALL API calls inside the `.then`:
```js
ZOHO.CREATOR.init().then(function () { /* all API calls go here */ });
```
2. Wrap every API call so only code `3000` resolves. DECISION RULE: if `res.code === 3000` → resolve (success); else → reject with the code (treat as error):
```js
function call(p) {
  return new Promise(function (resolve, reject) {
    p.then(function (res) { res && res.code === 3000 ? resolve(res) : reject(res && res.code); });
  });
}
```
3. READ — paginate. `pageSize` MAX is 200. Start `page` at 1. DECISION RULE: if returned `rows.length < pageSize` → that was the last page, stop; else → fetch `page + 1`:
```js
ZOHO.CREATOR.API.getAllRecords({ appName, reportName, page, pageSize: 200 })
  .then(function (res) { var rows = res.data || []; /* ... */ });
```
SERVER-SIDE FILTER (verified 2026-06-13): pass a `criteria` string — it filters on the SERVER, combine with pagination. Operators verified working: `==`, `!=`, `&&`, `||`, `.contains()`, `.startsWith()`. Response is `{ code, data }` ONLY — there is NO total-count field (compute counts with a criteria query if you need "X of N").
```js
ZOHO.CREATOR.API.getAllRecords({ appName, reportName, page: 1, pageSize: 200,
  criteria: '(Status == "Done" && Task_Name.contains("LT"))' });
```
4. ADD — `data` MUST be DOUBLE-wrapped (`data:{ data:{...} }`), and use `formName` (NOT `reportName`):
```js
ZOHO.CREATOR.API.addRecord({ appName, formName, data: { data: { Field: value } } });
```
5. UPDATE — use `reportName` + `id`, DOUBLE-wrap `data`:
```js
ZOHO.CREATOR.API.updateRecord({ appName, reportName, id, data: { data: { Field: value } } });
```
6. DELETE — pass `criteria` (a string), NEVER `id`:
```js
ZOHO.CREATOR.API.deleteRecord({ appName, reportName, criteria: 'ID == ' + id });
```
Delete is criteria-based → ONE call can remove MANY rows (e.g. `criteria: 'Project_ID == "' + pid + '"'` cascade-deletes all a project's tasks). Response (verified 2026-06-13): `{ result: [ { code:3000, data:{ID}, message:"Record Deleted Successfully" } ], code:3000 }`. Shares the ~HTTP 429 write quota — throttle bulk deletes (see `creator-bulk-write-throttling.md`).
7. UTIL — `getInitParams()` is SYNCHRONOUS (verified 2026-06-14): it returns an object DIRECTLY (not a Promise). Feature-detect, then read keys; NEVER `.then()` it (doing so throws — the STM widget did this and silently lost theming).
```js
var u = (ZOHO.CREATOR.UTIL && ZOHO.CREATOR.UTIL.getInitParams) ? ZOHO.CREATOR.UTIL.getInitParams() : null;
// u → { scope, envUrlFragment, appLinkName, loginUser, themeBrandColor }   (verified shape)
if (u) {
  if (u.themeBrandColor) { /* set accent */ }
  if (/development|stage/i.test(u.envUrlFragment || "")) { /* DEV/STAGE badge — "" = production */ }
  var me = u.loginUser;            // the viewer's EMAIL (key is `loginUser`, NOT `user`); match to a Member for "My Work"
}
```
Other UTIL keys: `getQueryParams`, `getWidgetParams`, `navigateParentURL`, `setImageData` (shapes verify per use).
Other UTIL keys: `setImageData`, `getQueryParams`, `getWidgetParams`, `navigateParentURL` — shapes UNVERIFIED; feature-detect + catch-guard the same way.

## If you see X → do Y
- If ADD/UPDATE returns HTTP 401 with code `2945` (`EXTRA_KEY_FOUND_IN_JSON`) → you passed fields flat as `data:{...}`. Re-send DOUBLE-wrapped: `data:{ data:{...} }`.
- If DELETE returns `Invalid Configuration...!!!` → you passed `id`. Re-send with `criteria: 'ID == ' + id` instead.
- If a READ returns code `3000` with `data:[]` → this is an EMPTY report, NOT an error. Always read `res.data || []`. The `3100`/`9280` "empty" codes are UNVERIFIED — only tolerate them on page 1 AND when the board is already empty, so a real error never wipes a populated board.

## Tips (optimistic CRUD, proven via adversarial review)
- New rows: use a MONOTONIC temp-id counter. NEVER use array length as an id.
- Rollback: RE-RESOLVE the record by ID before reverting. NEVER mutate a captured object or array index — a refresh can swap the array.
- Per-item `_pending` lock + LAST-WRITE-WINS rollback: revert ONLY if the current value still equals the value you set.
- Disable the manual Refresh button while `pendingOps > 0`.
- Full reviewed worked example: `stm-task-widget/app/widget.html` in this repo.

## Related Skills
- creator-widget-build-register.md
- zoho-mcp-data-operations.md
- creator-single-page-app.md
