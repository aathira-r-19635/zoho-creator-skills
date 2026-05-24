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

## Skill 2b — Standard HTML Template (Cover + CSS)

Always use this template as the base for every new user guide. Replace `{COMPANY}`, `{APP_NAME}`, `{APP_DESC}`, `{ROLES}`, `{VERSION}`, `{DATE}` with app-specific values.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{COMPANY} {APP_NAME} — User Guide</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 14px; line-height: 1.6; }

  /* ---- COVER ---- */
  .cover { width: 100%; height: 100vh; min-height: 820px; background: #fff; page-break-after: always; display: flex; flex-direction: column; border-top: 7px solid #1a1a2e; }
  .cover-inner { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 56px 72px 44px; }
  .cover-co { font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #1a1a2e; }
  .cover-mid { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0; }
  .cover-tag { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #aaa; margin-bottom: 22px; }
  .cover-h1 { font-size: 46px; font-weight: 700; color: #111; line-height: 1.2; margin-bottom: 20px; }
  .cover-desc { font-size: 14px; color: #777; line-height: 1.65; max-width: 500px; }
  .cover-bot { border-top: 1px solid #e5e5e5; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .cover-bot-l { font-size: 11px; color: #999; line-height: 1.9; }
  .cover-bot-r { font-size: 10px; color: #bbb; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.9; }

  /* ---- TOC ---- */
  .toc-page { padding: 40px 50px; page-break-after: always; }
  .toc-page h2 { font-size: 20px; font-weight: 600; color: #111; margin-bottom: 20px; }
  .toc-page ol { padding-left: 22px; list-style: decimal; }
  .toc-page ol > li { padding: 5px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; color: #111; }
  .toc-page ol > li > a { color: #111; text-decoration: none; }
  .toc-page .sub { padding-left: 18px; margin: 3px 0 0; list-style: disc; }
  .toc-page .sub li { font-size: 12px; color: #777; padding: 1px 0; border: none; }

  /* ---- SECTION ---- */
  .section { padding: 24px 50px; }
  .section + .section { border-top: 1px solid #f0f0f0; }
  .section h2 { font-size: 22px; font-weight: 600; color: #111; margin-bottom: 6px; }
  .section h3 { font-size: 13px; font-weight: 600; color: #111; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .section h4 { font-size: 13px; font-weight: 600; color: #444; margin: 12px 0 5px; }
  .section p { font-size: 13px; line-height: 1.65; color: #555; margin-bottom: 7px; }
  .section ul, .section ol { padding-left: 18px; font-size: 13px; color: #555; margin-bottom: 7px; }
  .section li { margin-bottom: 3px; line-height: 1.55; }
  .section .note { background: #fafafa; border-left: 2px solid #ccc; padding: 10px 14px; font-size: 12px; color: #666; margin: 10px 0; }

  /* ---- ANNOTATED IMAGE ---- */
  .annotated { display: grid; width: 100%; margin: 12px 0 4px; }
  .annotated > * { grid-column: 1; grid-row: 1; }
  .annotated img { display: block; width: 100%; height: auto; border: 1px solid #ebebeb; }
  .annotated svg { width: 100%; height: 100%; pointer-events: none; overflow: visible; align-self: stretch; }

  /* ---- CALLOUT LEGEND ---- */
  .callout-legend { display: flex; flex-direction: column; gap: 5px; margin: 4px 0 14px; }
  .callout-legend-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #555; background: #fafafa; border: 1px solid #ebebeb; border-radius: 3px; padding: 6px 12px; }
  .callout-badge { width: 18px; height: 18px; border-radius: 9px; background: #333; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }

  /* ---- TABLE ---- */
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 12px 0 18px; }
  th { background: #f5f5f5; color: #333; padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e0e0; }
  td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; color: #444; vertical-align: top; }
  tr:last-child td { border-bottom: none; }

  /* ---- WORKFLOW ---- */
  .workflow { background: #fafafa; border: 1px solid #ebebeb; border-radius: 3px; padding: 28px 36px; font-size: 13px; color: #444; margin: 18px 0; }
  .workflow .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 8px; }
  .workflow .step-num { width: 24px; height: 24px; border-radius: 12px; background: #333; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .workflow .arrow { color: #ccc; font-size: 16px; margin: 2px 0 2px 8px; }

  /* ---- STATUS BADGES ---- */
  .status { display: inline-block; padding: 1px 7px; border-radius: 2px; font-size: 11px; font-weight: 500; background: #f0f0f0; color: #555; }
  .status.approved { background: #f0faf4; color: #2d6a4f; }
  .status.pending { background: #fffbf0; color: #92400e; }
  .status.rejected { background: #fff5f5; color: #9b2c2c; }
  .status.archived { background: #f5f5ff; color: #4338ca; }
  .status.deleted { background: #fdf4ff; color: #7e22ce; }
  .status.picked { background: #f0f8ff; color: #1e40af; }

  /* ---- PAGE BREAKS ---- */
  .page-break { page-break-before: always; }
  @media print {
    .section { page-break-inside: auto; }
    .annotated { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-inner">
    <div class="cover-co">{COMPANY}</div>
    <div class="cover-mid">
      <div class="cover-tag">User Documentation</div>
      <h1 class="cover-h1">{APP_NAME}</h1>
      <div class="cover-desc">{APP_DESC} Covers {ROLES}.</div>
    </div>
    <div class="cover-bot">
      <div class="cover-bot-l">
        <div>Version {VERSION} &nbsp;·&nbsp; {DATE}</div>
        <div>Built on Zoho Creator</div>
      </div>
      <div class="cover-bot-r">
        <div>Confidential</div>
        <div>For Internal Use Only</div>
      </div>
    </div>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc-page">
  <h2>Table of Contents</h2>
  <ol>
    <li><a href="#section1">Section 1</a></li>
    <!-- add items per app -->
  </ol>
</div>

<!-- SECTIONS -->
<div class="section" id="section1">
  <h2>1. Section Title</h2>
  <p>Description text.</p>

  <div class="annotated">
    <img src="01-screenshot.png" alt="Screenshot">
    <svg viewBox="0 0 1500 1049" preserveAspectRatio="none">
      <rect x="X" y="Y" width="26" height="26" rx="13" fill="#444"/>
      <text x="Xcenter" y="Ycenter" text-anchor="middle" fill="white" font-size="16" font-weight="bold">1</text>
    </svg>
  </div>
  <div class="callout-legend">
    <div class="callout-legend-item"><div class="callout-badge">1</div><span><strong>Button Name</strong> — what it does</span></div>
  </div>
</div>

</body>
</html>
```

### Cover page design notes
- **Top accent**: 7px solid `#1a1a2e` (dark navy) border at the very top of the page
- **Company name**: small caps, letter-spaced, `#1a1a2e` — top left
- **"User Documentation" tag**: 10px uppercase, `#aaa` — above the title
- **Title (`cover-h1`)**: 46px bold, `#111`, line-height 1.2 — split across lines with `<br>` for impact
- **Description**: 14px, `#777`, max-width 500px
- **Footer**: thin `#e5e5e5` top border, version + date left, "Confidential / For Internal Use Only" right
- **Background**: pure white — no gradients, no images, no color fill

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
- **Every button MUST have its own screenshot** — do not describe buttons in text alone. For every button type, capture a screenshot that shows it and annotate with a numbered callout. This includes:
  - `+` Add button on every list view
  - `···` context menu (open it and screenshot the options)
  - Every column-level action button (e.g. Pick, Archive, Raise Quotation)
  - Bulk action buttons (screenshot with rows selected so button is visible)
  - Any popup/result that appears after clicking a button

**Masters must always come before flow sections** — flow forms depend on master data being set up first.

---

## Skill 3a — Button & Action Discovery

Before writing each section, scan all interactive elements on the page:

**Rule: Every button type requires a dedicated screenshot with annotation. Never describe a button only in text.**

### Row-level actions (hover `···` menu)
- Hover over a row → `···` appears on the left
- Click `···` → context menu shows inline actions (e.g. Mark as Active, Mark as Inactive, Edit, Delete)
- **Screenshot the open context menu** and annotate each option with a numbered callout
- Document every option in the context menu

### Column action buttons
- Buttons that appear as columns in list rows (e.g. Pick, Archive, Raise Quotation in RFQ)
- **Screenshot the list view** and annotate each button column with a numbered callout
- If clicking a button opens a popup or changes state, **screenshot that result too**
- Explain what each button does when clicked — status changes, redirects, popups, etc.

### Header buttons
- `+` Add button — always annotate on the list view screenshot
- Search, Filter, Export icons — annotate on the list view screenshot and briefly explain each

### Bulk action buttons (row-selection toolbar)
- Some list views have **developer-configured bulk actions** that only appear when rows are selected via checkboxes
- To discover them: select one row → check if a custom toolbar appears at the top of the list
- These buttons are in `.zc-report-customaction-header` inside `.zc-report-newheader` (shown only when rows are selected)
- To find them via JS: `document.querySelectorAll('[class*="customaction"]')` after selecting a row
- **Screenshot 1**: list with rows selected so the bulk button is visible, annotate it
- **Screenshot 2**: the resulting popup/form that opens after clicking, annotate key fields

### Status indicators
- `Active` (blue) / `Inactive` (gray) — always document with the `···` → Mark as Active/Inactive flow
- One screenshot of the `···` context menu is enough; note it applies to all master records

---

## Skill 3b — Screenshot Sizing (Critical)

Zoho Creator app content does **not** fill the full viewport width in list views. The right side is pure white — invisible in the browser but shows as empty grey space in the PDF. Always crop every screenshot to its actual content width.

> **⚠️ Mandatory check before finalising any screenshot:**
> Open the PDF and verify every image fills its grey box edge to edge — left, right, top, bottom. If any image has empty white space on the right side, go back and crop it (Steps 1–3 below). Never skip this check.

### Step 1 — Measure actual content width with PIL

```python
from PIL import Image
import numpy as np

img = Image.open('path/to/screenshot.png')
arr = np.array(img)

for y in [100, 200, 400, 600]:
    row = arr[y]
    non_white = np.where((row[:,0] < 245) | (row[:,1] < 245) | (row[:,2] < 245))[0]
    if len(non_white) > 0:
        print(f'y={y}: content ends at x={non_white[-1]}')
```

### Step 2 — Crop to content width (round up to nearest 100px)

```python
cropped = img.crop((0, 0, 1500, 1049))   # or 1300, 1400 etc.
cropped.save('path/to/screenshot.png')
```

**Typical widths for Zoho Creator list views:**
- Most list views: content ends ~x=1477 → crop to **1500px**
- Narrower views (e.g. views with fewer columns): content ends ~x=1270 → crop to **1300px**
- Full-width views (fills entire viewport): keep at **2224px**

**⚠️ Different views have different content widths** — measure each screenshot individually. Never assume all screenshots from the same app are the same width.

### Step 3 — Update SVG viewBox to match cropped width

The `viewBox` width MUST match the cropped image pixel width exactly. These two are always coupled:

```html
<!-- image is 1500px wide → viewBox width = 1500 -->
<svg viewBox="0 0 1500 1049" preserveAspectRatio="none">

<!-- image is 1300px wide → viewBox width = 1300 -->
<svg viewBox="0 0 1300 1049" preserveAspectRatio="none">
```

If the viewBox doesn't match the image width, all badge positions will shift incorrectly.

---

## Skill 4 — Annotations

Use SVG overlays with numbered callout circles positioned absolutely over images:

**Screenshot dimensions:** Playwright MCP screenshots depend on the viewport set with `browser_resize`.
- At viewport **1559×700** → image is **2224×1049 px**. Then crop to content width (see Skill 3b).
- SVG `viewBox` height is always **1049** (after height crop). Width matches the cropped image width.

**⚠️ Viewport height rule:** Use a viewport height that matches the content, not a fixed tall value. If the app content doesn't fill the full viewport, the screenshot will have a large empty grey area at the bottom, making images look small in the PDF. **Recommended: `browser_resize` to 1559×700 before capturing list and detail views.**

**Badge-only style (preferred):** Place the numbered badge directly ON the UI element. No arrows.

```html
<div class="annotated">
  <img src="screenshots/NN-page.png" alt="...">
  <svg viewBox="0 0 1500 1049" preserveAspectRatio="none">
    <rect x="X" y="Y" width="26" height="26" rx="13" fill="#444"/>
    <text x="Xcenter" y="Ycenter+4" text-anchor="middle" fill="white" font-size="16" font-weight="bold">1</text>
  </svg>
</div>
```

- Badge center = target element center in image pixel coordinates (1:1 with viewBox)
- `rect x` = cx − 13, `rect y` = cy − 13
- `text x` = cx, `text y` = rect_y + 17
- Badge size: `width="26" height="26" rx="13"`, text `font-size="16"`

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

### Finding exact badge coordinates with pixel scanning

Never estimate badge positions by eye. Use PIL pixel cluster scanning to find the exact center of each button:

```python
from PIL import Image
import numpy as np

img = Image.open('path/to/screenshot.png')
arr = np.array(img)

def find_clusters(row_data, x_offset=0, gap=10, min_size=2):
    non_white = np.where((row_data[:,0] < 200) | (row_data[:,1] < 200) | (row_data[:,2] < 200))[0] + x_offset
    if len(non_white) < min_size: return []
    gaps = np.where(np.diff(non_white) > gap)[0]
    clusters, prev = [], 0
    for g in gaps:
        c = non_white[prev:g+1]
        if len(c) >= min_size: clusters.append((int(c[0]), int(c[-1])))
        prev = g+1
    c = non_white[prev:]
    if len(c) >= min_size: clusters.append((int(c[0]), int(c[-1])))
    return clusters

# Scan the first data row at the relevant y
y = 120  # adjust to the row where buttons appear
row = arr[y, 240:]  # skip nav sidebar (ends at ~x=240)
clusters = find_clusters(row, x_offset=240)
for s, e in clusters:
    print(f'  x={s}-{e}, center={(s+e)//2}')
```

Each cluster center is the badge `cx`. The row's midpoint is the badge `cy`.

### Badge placement rules for Zoho Creator list views

**⚠️ Column header row ≠ button position.** In Zoho Creator, the column header labels appear at one y-level, and the actual button widgets in data rows appear at a lower y-level. Always scan for where the button text IS in the first data row — never place a badge at the column header y.

**⚠️ x < 260 is a red flag.** The nav sidebar occupies x=0–239 in most screenshots. Any badge with x < 260 is likely pointing into the sidebar or empty space, not a real UI element.

**Typical y levels in a Zoho Creator list view (1049px tall screenshot):**
- `y ≈ 30–55`: Page title / toolbar (search, +Add button)
- `y ≈ 55–90`: Column header row (labels only — do NOT badge here for buttons)
- `y ≈ 115–130`: First data row button text — **badge here for row action buttons**
- `y ≈ 155–170`: Second data row (if first row is a header-style list)

**For dashboard section badges:** point to section title text (find via dark-pixel scan), not content rows within the section.

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
