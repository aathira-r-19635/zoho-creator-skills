# Make a Creator App Single-Page (App Menu Builder)

**Use this when:** you want a widget-only (single-page) Creator app experience but MUST keep
the data-backing form/report the widget reads/writes.

**Do NOT use when:** you actually want to delete a component (form/report/page) for real —
use `creator-delete-components.md` instead. App Menu Builder ONLY hides menu entries; it does
NOT delete components or data.

## Preconditions (confirm ALL before step 1)
1. The app is open in the Builder Design view.
2. You know the `link_name` of the widget page you will KEEP.
3. (Optional) Zoho MCP is connected so you can verify components survive — see `zoho-mcp-basics.md`.

## Steps
The App Menu Builder edits ONLY the navigation menu, NOT the components themselves.

1. In the Builder Design view, click the **"App Menu Builder"** link in the top-right corner.
2. Click the **Select** button.
3. Check the checkbox of EVERY section/component you want to remove from the menu.
   - Checking a section header auto-checks all its child components.
   - System sections (`App Preferences`, `Approvals`) and empty auto-sections (`Reports`) are removable too — check them if present.
4. Confirm ONLY the widget page you want to keep is left UNCHECKED. Everything else must be checked.
5. Click the **Remove** button.
6. A dialog titled **"Delete Elements"** appears. Click **OK**.
   - DECISION RULE: This label is misleading. It ONLY unlists menu entries. The underlying
     form/report/page components persist and stay reachable. Click OK with confidence.
7. Stop. With exactly one remaining menu item, the app auto-lands on it. Do NOT set any
   separate default-landing option — none exists and none is needed.

## Verify success (verified 2026-06-13)
1. Confirm the left **"Components"** tab still lists your components, grouped as `User` vs `System`.
2. (If MCP connected) Call `ZohoCreator_getForms`, `ZohoCreator_getReports`, and
   `ZohoCreator_getPages`.
   - DECISION RULE: If each call still returns EVERYTHING (including the trimmed items) →
     success, the trim was non-destructive. If anything is missing → you deleted a real
     component, not just a menu entry; restore it (see Troubleshooting).
3. Open the widget and confirm it still reads/writes its form & report. The JS SDK addresses
   them by `link_name` regardless of menu visibility, so data must still load.
   - Verify: the widget shows its data and add/update still works.

## Troubleshooting — If you see X, do Y
- If the **"Delete Elements"** dialog makes you fear it destroys data → it does not. This is
  the App Menu Builder, not component delete. Click OK; components persist under the Components tab.
- If the **widget shows no data after trimming** → you removed the backing form/report as an
  actual component, not just its menu entry. Fix: only ever use App Menu Builder here; keep the
  form/report as components. To truly delete components, see `creator-delete-components.md`.
- If a **live menu hash `#<SectionLink>` lands on an unexpected page** → this is expected. A
  section and a report can share the same `link_name` without conflict; the hash resolves to
  the section's child page. No action needed.
- If you **removed a component by mistake** → re-add it to the menu from the Components tab; this
  restores it. The trim is non-destructive and safe to redo.

## Notes
- "Single-page" means the menu has exactly one entry; the app then auto-lands there.
- The data-backing form + report the widget uses MUST remain as components, but they do NOT
  need to appear in the menu.

## Related Skills
- `creator-widget-build-register.md` — build/register the widget page you keep.
- `creator-delete-components.md` — when you actually need to delete a component (not just unlist it).
- `zoho-mcp-basics.md` — verify forms/reports/pages survived the menu trim.
