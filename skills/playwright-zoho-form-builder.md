# Playwright: Zoho Form Builder Automation

## Purpose
Automate Zoho Creator form builder: add/delete fields, configure lookups, drag-and-drop.

## Navigation
```
Form builder URL: https://creator.zoho.com/appbuilder/{account}/{app}/formbuilder/{form_link_name}/edit
```

## Open Form Builder
1. Navigate to form edit URL (above)
2. Inside the iframe, find and click "Open Form Builder" link
3. Wait 5 seconds for full builder to load

## Field Palette (Left Sidebar)
- **Basic Fields**: Single Line, Number, Date, Drop Down, etc.
- **Advanced Fields**: Lookup, SubForm, File Upload, Signature, etc.
- Fields appear as clickable cards with icons

## Adding a Lookup Field (Step-by-Step)

### 1. Drag Lookup from Sidebar to Form Canvas
```javascript
// Use Playwright dragTo:
page.locator('.lookupIcon').closest('[class*="field-item"]').dragTo(formCanvas)
```
Or click the Lookup card twice.

### 2. Configure in Dialog
A "Lookup Field" dialog appears with:
- **Applications**: Select the target app (e.g., "CONTINENTAL GROUP")
- **Forms**: Dropdown → select target form (e.g., "Motor Type")
- **Fields**: Dropdown → select display field (e.g., "Motor Type")
- **Display format**: Choose radio:
  - Single selection: Drop Down / Radio
  - **Multiple selection: Multi Select / Checkbox** ← for multiselect lookups
- **Overview**: Shows mapping info
- Click **Done** to add field

### 3. Rename Field (Field Properties Panel)
After adding, the field is selected. In the right panel:
- **Field name**: Display name (e.g., "Motor Types")
- **Field link name**: Internal name (e.g., "Motor_Types")
- Use Playwright `locator('text=Field name').locator('..').locator('input').fill('New Name')`

### 4. Save Form
- Click **Done** button (top right) to save and exit form builder

## Deleting a Field
1. Click the field in the form canvas (left sidebar list or main canvas)
2. Click the trash/delete icon next to the field name
3. Confirm deletion dialog: click **"I understand, Proceed"**
4. Click **Done** to save

## Key Zoho UI Quirks

### Select2 Dropdown Masks
- Zoho uses select2 masks that intercept clicks
- If a click fails with "intercepts pointer events", press `Escape` first

### Shadow DOM
- Field properties panel uses shadow DOM
- Use Playwright native locators: `page.locator('text=Field name').locator('..').locator('input')`
- Avoid raw JavaScript `document.querySelectorAll` in shadow DOM

### Iframe Structure
- Form canvas is inside iframe (frame index 1)
- Field properties panel is in the main frame
- Use `page.frames()[1]` for canvas interactions

### Input Selection
- Triple-click (`clickCount: 3`) to select all text in inputs

### Field Types Reference
| Display Name | Type ID | Notes |
|-------------|---------|-------|
| Single Line | 1 | Text field |
| Number | 5 | Integer |
| Lookup (single) | 12 | Single-select lookup |
| Lookup (multi) | 14 | Multi-select lookup |

## Screenshot Debugging
Take screenshots at each step when working with form builder:
```
browser_take_screenshot: { filename: "step-name.png", type: "png" }
```

## Complete Example: Add Multiselect Lookup
```
1. Navigate to form builder URL
2. Click "Open Form Builder" in iframe
3. Drag "Lookup" from Advanced Fields to canvas
4. In dialog: select Form → select Field → choose "Multi Select" → Done
5. Rename field name and link name in properties panel
6. Click Done (top right) to save form
```
