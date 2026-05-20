# App Documentation PDF Generator

## Purpose
Automatically walk through a Zoho Creator app, capture screenshots of every section, and generate a polished PDF user guide.

## Trigger
User says: "document the app", "create a user guide", "generate PDF documentation", "prepare a document of the application"

---

## Skill 1 — App Structure Discovery (MCP)

```
ZohoCreator_getForms    { account_owner_name, app_link_name }
ZohoCreator_getReports  { account_owner_name, app_link_name }
ZohoCreator_getFields   { account_owner_name, app_link_name, form_link_name }  ← run for ALL forms in parallel
```
- `getFields` returns: `display_name`, `mandatory`, `type`, `choices` — use these to build the fields table in the doc
- Run all `getFields` calls in parallel to save time

---

## Skill 2 — Screenshot Strategy (Playwright)

### Setup
```bash
mkdir -p <app>-doc/screenshots
```

### List view
```
browser_navigate: https://creatorapp.zoho.com/{account}/{app}#Report:{Report_Link_Name}
browser_take_screenshot: filename="<app>-doc/screenshots/NN-section-list.png"
```

### Add form view
```
browser_navigate: https://creatorapp.zoho.com/{account}/{app}/#Form:{Form_Link_Name}
browser_take_screenshot: filename="<app>-doc/screenshots/NN-section-add-form.png"
```

### Popup screenshots
```
browser_click: trigger button
browser_wait_for: 3 seconds
browser_take_screenshot: filename="<app>-doc/screenshots/NN-popup.png"
```

### Naming convention
```
01-dashboard.png
02-[section]-list.png
03-[section]-add-form.png
04-[section]-popup.png
...
```

---

## Skill 3 — Document Structure

Order sections as:
1. **Cover page** — app name, date, "For End Users"
2. **Table of Contents**
3. **Dashboard** — screenshots + widget descriptions + app flow diagram
4. **Masters** — simplest to most complex (e.g. Region → Currency → Users → Customers → Products)
5. **Main Flow** — entry point first (e.g. RFQ → Quotation → Approvals)
6. **Supporting sections** — Archive, Bin, Reports etc.

**Per section template:**
- List screenshot with caption
- "How to" numbered steps (include Add button `+` annotation on list view)
- Add form screenshot with caption
- Fields table: `Field | Description | Required?`
- **All action buttons must be documented** — for every list view, identify every button (inline row buttons, `···` context menus, header buttons) and document what each one does. Never skip a button.

**Masters must always come before flow sections** — flow forms depend on master data being set up first.

---

## Skill 3a — Button & Action Discovery

Before writing each section, scan all interactive elements on the page:

### Row-level actions (hover `···` menu)
- Hover over a row → `···` appears on the left
- Click `···` → context menu shows inline actions (e.g. Mark as Active, Mark as Inactive, Edit, Delete)
- Document every option in the context menu

### Column action buttons
- Buttons that appear as columns in list rows (e.g. Pick, Archive, Raise Quotation in RFQ)
- Screenshot the list view and annotate each button column with a numbered callout
- Explain what each button does when clicked — status changes, redirects, popups, etc.

### Header buttons
- `+` Add button — always annotate on list views
- Search, Filter, Export icons — mention briefly in the section intro

### Status indicators
- `Active` (blue) / `Inactive` (gray) — always document with the `···` → Mark as Active/Inactive flow
- One screenshot of the `···` context menu is enough; note it applies to all master records

---

## Skill 4 — Annotations

Use SVG overlays with numbered callout circles positioned absolutely over images:

```html
<div class="annotated">
  <img src="screenshots/NN-page.png" alt="...">
  <svg viewBox="0 0 1290 600" preserveAspectRatio="none">
    <defs>
      <marker id="a1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#444"/>
      </marker>
    </defs>
    <line x1="X1" y1="Y1" x2="X2" y2="Y2" stroke="#444" stroke-width="2.5" marker-end="url(#a1)"/>
    <rect x="X" y="Y" width="18" height="18" rx="9" fill="#444"/>
    <text x="X" y="Y" text-anchor="middle" fill="white" font-size="11" font-weight="bold">1</text>
  </svg>
</div>
```

Always add a **callout legend** below the annotated image:
```html
<div class="callout-legend">
  <div class="callout-legend-item">
    <div class="callout-badge">1</div>
    <span><strong>Label</strong> — explanation of what to click / what it does</span>
  </div>
</div>
```

**Color rule: always use `#444` (dark gray) — never use bright or red colors for annotations.**

---

## Skill 4a — Annotation Alignment Verification

After writing SVG annotations, always verify they are correctly positioned by rendering the HTML and screenshotting each annotated div with Node.js Playwright:

```javascript
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('file://' + path.resolve('<app>-doc/<app>-user-guide.html'));
  await page.waitForTimeout(1500);
  const divs = await page.locator('.annotated').all();
  for (let i = 0; i < divs.length; i++) {
    await divs[i].screenshot({ path: '<app>-doc/screenshots/ann-' + i + '.png' });
  }
  await browser.close();
})();
```

Read each `ann-N.png` to visually confirm arrows hit their targets. If misaligned, fix the SVG coordinates and re-run.

### Coordinate conversion formula

SVG `viewBox="0 0 1290 600"` maps to the rendered image width. When the image renders at ~1044px wide inside the HTML container:

```
SVG_x = rendered_px_x × 1.236
SVG_y = rendered_px_y × 0.834
```

Use this to convert observed pixel positions (from the rendered screenshot) to the correct SVG `x2`/`y2` endpoint values.

### Badge placement rules

- **Target is in top-right corner** (e.g. "+" button): place badge just below-left, arrow points up to the button
- **Target is a column button** (e.g. Pick, Archive): place badges stacked on the right side (SVG x≈450), arrows fan left to each button at the correct row y
- **Target is a status indicator in a column**: place badge to the right of the column, horizontal arrow pointing left at the value
- **Target is a context menu item**: place badge outside the menu area to the right, diagonal arrow pointing into the menu item

---

## Skill 5 — PDF Generation

Playwright MCP blocks `file://` protocol — use Node.js Playwright directly:

```javascript
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve('<app>-doc/<app>-user-guide.html'));
  await page.waitForTimeout(2000);
  await page.pdf({
    path: '<app>-doc/<AppName>-User-Guide.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  await browser.close();
})();
```

Run with: `node -e "..."` or save as a script and run `node generate-pdf.js`

---

## Output
```
<app>-doc/
├── <AppName>-User-Guide.pdf     ← final PDF (~3MB)
├── <app>-user-guide.html        ← source HTML
└── screenshots/                 ← all captured PNGs
    ├── 01-dashboard.png
    ├── 02-...
    └── NN-...
```
