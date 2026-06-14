# Scaffold a New Creator App + Components (builder UI)

Use this when: you need to create a BRAND-NEW Creator application from the dashboard and add its
components (Form / Report / Page) via the builder UI with Playwright.
Do NOT use when: the app already exists and you only add a widget+page (see
`creator-widget-build-register.md`), or you want a form's fields+data fast from a CSV (see
`creator-csv-import-schema.md`).

## 1. Create the app from scratch (verified 2026-06-14)
1. Open the dashboard gallery: `https://creator.zoho.com/userhome/<account>/dashboard#gallery`; wait 3-5s.
2. Click `New Application`: `page.getByText('New Application').click()`.
3. Click `Create from scratch`: `page.locator('text=Create from scratch').click()`.
4. Fill the app name in the dialog textbox (id `#appName`; placeholder starts `Examples: Campaign Monitor,`):
   `page.getByRole('textbox',{name:'Examples: Campaign Monitor,'}).fill('<App Name>')`.
5. Click the dialog `Create` button. You land in the builder at
   `creator.zoho.com/appbuilder/<account>/<app-link>/edit`. The app **link-name** is the slugified
   name (e.g. "Atlas" → `atlas`) — use it in every later URL and in `#Page:` hashes.

## 2. Add a component (Form / Report / Page)
From the builder, the create triggers open the component picker (header `.zc-dem-create-header`):
- **Form** → `#create-form-trigger` → choose `From scratch` or `Import with data`
  (card `.zc-dem-integration-card-title`). For the fast import path see `creator-csv-import-schema.md`.
- **Page** → `#create-page-trigger` → `Blank`. To embed a widget on it see
  `creator-widget-build-register.md` step 4.
- **Report** → `#create-report-trigger` (same picker pattern; INFERRED — not re-verified this
  session because CSV import auto-creates a `<Form> Report`).
After creation the builder URL is `/formbuilder/<Form>/edit`, `/pagebuilder/<Page>/edit`, or
`/reportbuilder/<Report>/edit` (verified 2026-06-14 for form & page).

## If you see X → do Y
- `New Application` not found → you are not on `#gallery`; navigate to the dashboard gallery URL
  first and wait 3-5s.
- App-name dialog textbox not found by id `#appName` → match it by placeholder
  `Examples: Campaign Monitor,`.
- A component shows under a wrong/duplicate name → names are slugified and must be UNIQUE across
  forms/reports/pages (a Page whose link collides with a Report link breaks navigation — see
  `creator-widget-build-register.md`).

## Related Skills
- `creator-csv-import-schema.md` — fast Form schema + seed via CSV import.
- `creator-widget-build-register.md` — add a Page + embed a widget on it.
- `creator-delete-components.md` — remove a redundant component cleanly.
- `open-creator-app.md` — open an EXISTING app and navigate to its live page hash.
