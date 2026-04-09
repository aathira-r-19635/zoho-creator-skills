# Playwright: Zoho User Input Workflow Validation

## Purpose
Create and test "User input of a field" workflow validations in Zoho Creator that prevent form submission when invalid values are entered.

## Key Rules (CRITICAL)

1. **`cancel submit` does NOT work** in "User input of a field" triggers — it only works in "On validate" triggers
2. **Workaround:** Use `alert` + `input.field_name = null;` then make the field **mandatory** in form builder
3. **For Number fields:** Use `input.field = null;` — `clear input.field;` only works for Dropdown/MultiSelect/Radio/Checkbox
4. **Mandatory field** ensures Zoho's built-in validation blocks submission when the workflow clears the field

## Workflow Deluge Script Pattern

```deluge
if (input.SM_Number <= 0)
{
	alert "SM Number must be greater than zero. Please enter a valid positive number.";
	input.SM_Number = null;
}
```

## Create Workflow Steps

### 1. Navigate to Workflow Builder
```
browser_navigate: https://creator.zoho.com/appbuilder/{account}/{app}/workflow/edit
```

### 2. Select Form & Create Workflow
```
# Click the form name (e.g., "Shipping Method")
# Click "Create Workflow"
# Select "On a form event"
# Select "Created or Edited" radio
# Select "User input of a field" from dropdown
# Select the target field from dropdown (e.g., "SM Number")
# Name the workflow
# Click "Create Workflow"
```

### 3. Add Deluge Script Action
```
# Click "Add New Action"
# Select "Deluge Script"
# Enter the validation code (see pattern above)
# Click "Save"
# Close the action panel
```

### 4. Save & Exit
```
# Remove freezer overlays if needed
browser_run_code: |
  async (page) => {
    document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
  }
# Click "Done" to exit workflow builder
```

## Make Field Mandatory

### 1. Open Form Builder
```
browser_navigate: https://creator.zoho.com/appbuilder/{account}/{app}/formbuilder/{Form_Name}/edit
```

### 2. Click the Field
```
# Click on the target field (e.g., "SM Number") in the form canvas
# The Field Properties panel appears on the right
```

### 3. Enable Mandatory
```
# Click the "Mandatory" label (not the checkbox directly — the label intercepts clicks)
# Click "Done" to save and exit
```

## Testing Workflow Validation

### Step 1: Navigate to Live Form
```
browser_navigate: https://creatorapp.zoho.com/{account}/{app}/#Form:{Form_Name}
browser_wait_for: 3 seconds
```

### Step 2: Test Invalid Input (≤ 0)
```
# Fill the form fields
browser_fill_form:
  fields:
    - name: "Shipping Method", type: "textbox", value: "Test Freight"
    - name: "SM Number", type: "textbox", value: "0"

# CRITICAL: Click another field to shift focus — this triggers the "user input" event
browser_click: another textbox

# Wait for workflow to execute
browser_wait_for: 2 seconds

# Verify alert appeared
browser_snapshot
# Check snapshot for: alertdialog "SM Number must be greater than zero..."

# Verify field was cleared (textbox shows empty / no value text)

# Dismiss alert
browser_click: "OK" button
```

### Step 3: Test Valid Input (> 0)
```
# Enter a valid positive number
browser_fill_form:
  fields:
    - name: "SM Number", type: "textbox", value: "5"

# Shift focus
browser_click: another textbox

# Wait for workflow
browser_wait_for: 2 seconds

# Verify NO alert appeared (snapshot should not show alertdialog)
# Field value "5" should still be visible
```

### Step 4: Test Mandatory Field Blocking
```
# If field is null (cleared by workflow), click Submit
# Zoho's mandatory validation should block with "This field is required" error
```

## Common Issues

### `cancel submit` Syntax Error
- **Error:** "'cancel submit' can be used only in on validate actions"
- **Fix:** Replace with `input.field_name = null;` + make field mandatory

### `clear input.field` Not Working on Number Fields
- **`clear` only works for:** Dropdown, MultiSelect, Radio, Checkbox
- **For Number fields:** Use `input.field_name = null;`

### Workflow Not Triggering
- **Cause:** Focus didn't shift away from the field
- **Fix:** Click another field after entering value to trigger "user input" event

### Freezer Overlay Blocking Clicks
```javascript
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
```

### Beforeunload Dialog on Navigation
- Use `browser_handle_dialog: { accept: true }` when leaving unsaved pages

## Full Flow Checklist

1. Create workflow: Created or Edited → User input of `<field>`
2. Add Deluge: `if (input.field <= 0) { alert "..."; input.field = null; }`
3. Save workflow → Done
4. Open form builder → Select field → Check "Mandatory" → Done
5. Navigate to live form
6. Test invalid input → alert + field cleared
7. Test valid input → no alert, value retained
8. Test submission with null field → blocked by mandatory validation
