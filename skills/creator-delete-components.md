# Delete Creator Components (Report / Page) Safely

Use this when: you must permanently delete ONE report or ONE page in the Creator builder (e.g. an unused Kanban or an obsolete page) without breaking the data layer.
Do NOT use when: you have not yet run the Step 0 safety gate, OR the component is the one form/report the app reads/writes through. Deletion is permanent — there is NO undo.

## Prerequisites
Before Step 0, confirm BOTH:
- Zoho MCP tools are callable: `getReports`, `getForms`, `getPages`, `getSections` (setup: see `zoho-mcp-basics.md`).
- A browser is logged into the Creator builder for the target app.

## Type Codes (verified 2026-06-13)
- report `type 1` = list report
- report `type 4` = Kanban report
- form `type 1` = form
- section `type 3` AND `page_type 2` = a Page

## Step 0 — Safety gate (ALWAYS run first; never skip)
1. Run MCP `getReports` for the app. Note every report `link_name` + `type`.
2. Run MCP `getForms` for the app. Note every form `link_name`.
3. Identify which ONE report the app reads through (usually a `type 1` list report) and which ONE form it writes to (usually `type 1`).
4. Decision rule: If the component you intend to delete IS that read-report OR that write-form → STOP. Do NOT delete it.
5. Decision rule: If deleting a Kanban (`type 4`) report → safe ONLY if the app reads a DIFFERENT report. If unsure which report the app reads → STOP and check `creator-single-page-app.md`.

## Step A — Delete a REPORT
Note: the component-switcher right-click menu has ONLY Open Design / Open Builder / Access Live — there is NO Delete there, and the report Design view top bar has no Delete either. Use this exact path:
1. Open the report's Design view at URL: `.../appbuilder/<acct>/<app>/report/<ReportLink>/edit`.
2. In the design canvas, click the button labeled `Open Report Properties`. Verify the URL then ends in `/reportbuilder/<ReportLink>/edit`.
3. Click the top-right kebab `More` (`⋮`). A menu appears with 3 items, top-to-bottom: Rename / Duplicate / Delete.
4. Click the Delete link by id: `a#zc-del-comp`. (The MIDDLE item is Duplicate — do not click by row position.)
5. A confirm dialog appears: `Delete Report — Do you really want to delete this report?`.
6. Click the confirm button by id: `input#proceedBtn`.
7. Verify: go to Step C.

## Step B — Delete a PAGE
Element ids for the page path are NOT pinned; click visible menu LABELS, never by row position.
1. Open the page's page builder at URL: `.../appbuilder/<acct>/<app>/page/<PageLink>/edit`.
2. Click the top-bar kebab `⋮` (more). A menu appears: Rename / Duplicate / Delete.
3. Click the visible item labeled `Delete`.
4. A confirm dialog appears. Click its primary (filled) button labeled `Delete` or `OK` — the rightmost action, NEVER `Cancel`/`X`.
5. Verify: go to Step C.

## Step C — Verify success
1. Re-run MCP `getReports`, `getPages`, `getForms`, `getSections`.
2. Decision rule: If ONLY the intended component is gone AND the read-report + write-form from Step 0 still exist → success. Else → the wrong thing was deleted; go to "App broke" below.
3. Load the live app. Confirm it still reads (list loads) and writes (add/edit works).

## If you see X → do Y
- If the right-click switcher menu shows no Delete → that menu never has Delete; use Step A (Open Report Properties → `⋮` → `a#zc-del-comp`).
- If a `Duplicate Report` dialog opened instead of deleting → you clicked the middle (Duplicate) item. Close the dialog via its `X` WITHOUT confirming. Re-target Delete by id `a#zc-del-comp`.
- If the live app broke after deleting → you deleted a component the app read/wrote through. Restore/recreate it, then re-run Step 0 before any future delete.
- If you cannot find `a#zc-del-comp` → you are not in Report Properties; redo Step A.2 so the URL ends in `/reportbuilder/<ReportLink>/edit`.
- If clicking `Delete` in the page builder does nothing / no dialog appears → the `⋮` menu collapsed before the click landed; re-open `⋮` and click the `Delete` LABEL again (never by row position).
- If Step C still shows the component after confirming → you clicked `Cancel`/`X`, not the primary button; redo Step A.6 / B.4 targeting the filled primary action.

## Tips
- Always target `a#zc-del-comp` (Delete) and `input#proceedBtn` (confirm OK) by id, never by row position (verified 2026-06-13).
- Deletion is permanent — there is no undo. Run Step 0 every single time.

## Related Skills
- `creator-single-page-app.md` — understand which report a single-page app reads/writes through.
- `zoho-mcp-basics.md` — set up and call the MCP getReports/getForms/getPages/getSections tools.
