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
