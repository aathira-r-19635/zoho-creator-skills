# Build, Package & Register a Creator Widget

Use this when: you need a custom HTML/JS widget in a Creator app, packaged as a zip and uploaded via Developer Tools, then embedded on a page.
Do NOT use when: you only need to call the JS SDK from inside an already-registered widget — use `creator-widget-js-sdk.md` instead.

## Preconditions
Before step 1, confirm BOTH:
1. `zet` (zoho-extension-toolkit) is installed globally. Verify: run `zet --version`; if "command not found" → run `npm install -g zoho-extension-toolkit`, then re-verify.
2. You are logged into the Creator app in the browser (registration is UI-only).
DO NOT run `zet init --zoho-service creator`. That flag path only supports CRM and fails non-interactively. Hand-build the structure (step 1).

## Steps

### 1. Hand-build the project structure
Create exactly these 3 files under your project folder `<proj>` (reference example: `stm-task-widget/`, verified 2026-06-13):
1. `<proj>/plugin-manifest.json` with EXACTLY this content:
   ```json
   { "service": "CREATOR", "cspDomains": { "connect-src": [] }, "config": [] }
   ```
2. `<proj>/app/widget.html` — the entry file. Inline CSS + JS + the SDK `<script>` tag. Must be fully self-contained (no external files).
3. `<proj>/app/translations/en.json` with EXACTLY this content:
   ```json
   {}
   ```
Verify: all 3 paths exist and `widget.html` is under `app/` (not the project root).

### 2. Pack the zip
1. Run: `cd <proj> && zet pack`  (no login needed).
2. Verify: file `<proj>/dist/<proj>.zip` now exists.
If you see "command not found" → re-do preconditions step 1.

### 3. Register in the Creator app
1. Open the app, then click `Settings` → `Developer Tools` → `Widgets` → `Create`.
2. Click `Upload File`.
3. Set Hosting = `Internal`.
4. Upload `dist/<proj>.zip`.
5. Set Index File = `/widget.html` (EXACTLY this — NOT `/app/widget.html`). Creator serves the zip's `app/` folder as the web ROOT.
6. Save.
Verify: the widget row appears in the Widgets list.

### 4. Embed on a page
1. Click `Design` → `Add New` → `Page` → `Blank`.
2. Give the page a UNIQUE name (must NOT match any existing report name — collisions break embedding/navigation).
3. In the page builder, open the left panel `Widgets`.
4. Drag the widget tile onto the canvas. It is jQuery-UI MOUSE-based (NOT HTML5 drag): mousedown on the tile → ≥3 mouse-move steps toward the canvas centre (~25%/50%/75% of the path, brief pause each) → mouseup over the canvas. A single instantaneous move or HTML5 `browser_drag` is IGNORED (use `browser_drag` only as a fallback); verify a placeholder appears on the canvas mid-drag.
5. Save the page. Note its LinkName.

### 5. Open the live page
The page hash is `#Page:<LinkName>` (e.g. `#Page:Board`), NOT `#<LinkName>`.
1. Navigate to the app base URL first and let it fully boot.
2. THEN navigate to `.../#Page:<LinkName>`.
Verify: the widget renders inside the page.

### 6. Update an existing widget (re-deploy)
1. Edit `widget.html`, then re-run `zet pack` (step 2).
2. Open `Settings` → `Developer Tools` → `Widgets`.
3. Hover the widget row (`#widgetListing tr.odd`) to REVEAL its actions, then click Edit (`#widgetListing a[name="editWidget"]`). The Edit/Download/Delete actions are hidden until the row is hovered — a cold click times out.
4. Click Browse and re-attach `dist/<proj>.zip` (selector: `#widgetUploadField` → file chooser). The upload field clears on EDIT, so you MUST re-attach every time.
5. Confirm Index File still = `/widget.html`.
6. Click Update (selector: `#addWidget`).
Verify it is the NEW build (not cached): the widget runs in a cross-origin `zappsusercontent.com` iframe. Read the rendered DOM / computed style THROUGH that frame (e.g. confirm a CSS property you just changed) — do NOT trust the screenshot alone. (Verified 2026-06-13.)

## Decision rules / failure recovery
- If the app hangs on the splash screen or the widget 404s → Index File was set to `/app/widget.html` (Creator then requests `.../app/app/widget.html`). Fix: set Index File to `/widget.html` (step 3.5).
- If saving a widget edit does nothing / the old zip stays → the upload field cleared on EDIT. Fix: re-attach the zip (step 6.4) before clicking Update.
- If the deep-link hangs the app boot → you loaded `#Page:<LinkName>` before the app base was ready. Fix: load the app base URL first, then the hash (step 5).
- If `zet init --zoho-service creator` errors or picks CRM → that flag only supports CRM. Fix: hand-build the structure (step 1).
- If `zet pack` says "command not found" → `zet` is not installed. Fix: re-do preconditions step 1.

## Related Skills
- `creator-widget-js-sdk.md` — JS SDK calls inside the widget.
- `creator-single-page-app.md` — building the page/app the widget lives on.
- `open-creator-app.md` — open the app and navigate to the live page hash.
