# Zoho Creator Automation - End-to-End Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [When to Use Which Tool](#when-to-use-which-tool)
3. [HTML Snippet Editing Flow](#html-snippet-editing-flow)
4. [Zoho Save API](#zoho-save-api)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Zoho Creator                         │
├──────────────────┬──────────────────────────────────────┤
│  Zoho MCP Tools  │     Playwright MCP Tools             │
│  (Data Only)     │     (UI Automation)                  │
├──────────────────┼──────────────────────────────────────┤
│ • Get Apps       │ • Navigate to page builder           │
│ • Get Forms      │ • Click HTML Snippet                 │
│ • Get Reports    │ • Open CodeMirror editor             │
│ • Add Records    │ • Edit code via CodeMirror API       │
│ • Update Records │ • Save via button click or API       │
│ • Delete Records │ • Verify on live page                │
│ • Get Fields     │                                      │
└──────────────────┴──────────────────────────────────────┘
```

## When to Use Which Tool

### Use Zoho MCP When:
- Adding/updating/deleting records
- Querying report data
- Getting form/report metadata
- Working with approvals

### Use Playwright MCP When:
- Changing page layout or design
- Editing HTML snippets
- Modifying component properties
- Any visual/UI change

---

## HTML Snippet Editing Flow

### Step 1: Navigate to Page Builder
```
browser_navigate:
  url: "https://creator.zoho.com/appbuilder/{account}/{app}/page/{page}/edit"
browser_wait_for: 3 seconds
```

### Step 2: Click HTML Snippet Component
```
# Find the HTML Snippet in the preview iframe
browser_click on the HTML Snippet component
browser_wait_for: 2 seconds
```

### Step 3: Open Code Editor
```
# Click Configure button
browser_click on Configure button
browser_wait_for: 3 seconds
```

### Step 4: Edit Content via CodeMirror
```javascript
// The HTML content is in the 3rd CodeMirror (index 2) in frame 0
const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;

// Find the line containing your text
for (let i = 0; i < cm.lineCount(); i++) {
  if (cm.getLine(i).includes('Text to find')) {
    // Select and replace
    const lineContent = cm.getLine(i);
    const start = lineContent.indexOf('Text to find');
    cm.setSelection(
      { line: i, ch: start },
      { line: i, ch: start + 'Text to find'.length }
    );
    cm.replaceSelection('Replacement text');
    break;
  }
}
```

### Step 5: Save Changes
```
# Click Save button in popup
browser_run_code: (click #zctemplate-dialog-okBtn)
browser_wait_for: 2 seconds

# Close popup
browser_press_key: Escape

# Exit page builder
browser_click on Done link (#builder-close)
```

### Step 6: Verify on Live Page
```
browser_navigate:
  url: "https://creatorapp.zoho.com/{account}/{app}/#Page:{page}"
browser_wait_for: 3 seconds
browser_take_screenshot
```

---

## Zoho Save API

When you edit and save an HTML snippet in Zoho Creator, it makes this API call:

### Endpoint
```
POST https://creator.zoho.com/appbuilder/{account}/{app}/storeFunction
```

### Headers
```
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
```

### Body Parameters
| Parameter | Description |
|-----------|-------------|
| `appLinkName` | App link name |
| `text` | URL-encoded HTML content |
| `zohoruntime` | Current timestamp (milliseconds) |
| `zccpn` | CSRF token from browser cookies |
| `parentPageId` | The page ID |
| `htmlviewid` | The HTML snippet view ID |
| `linkName` | Snippet name (e.g., `html_snippet1`) |
| `scripttype` | Always `htmlpagemodify` |

### Getting Required IDs
- `zccpn`: From browser cookies
- `parentPageId`/`htmlviewid`: From the `workflowstr` attribute on `#pageScriptContent` input
- `linkName`: Usually `html_snippet1`

---

## Common Patterns

### Pattern 1: Handle Overlays Blocking Clicks
```javascript
// Remove freezer overlays that block clicks
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());

// Then click the target element
document.getElementById('builder-close').click();
```

### Pattern 2: Find CodeMirror Content
```javascript
// There are 3 CodeMirror instances; content is in the 3rd one
const editors = document.querySelectorAll('.CodeMirror');
const contentEditor = editors[2];  // Index 2 = 3rd editor

// Verify it has content
console.log(contentEditor.CodeMirror.getValue().length);  // Should be > 0
```

### Pattern 3: Monitor Network Requests
```
browser_network_requests:
  static: false
  requestBody: true
  requestHeaders: true
```
Call this before performing actions to capture all API calls.

---

## Troubleshooting

### Issue: CodeMirror content is empty (length: 0)
**Cause:** Wrong CodeMirror instance selected
**Fix:** Use index 2 (3rd instance), not index 0

### Issue: Click is intercepted by overlay
**Cause:** Zoho shows a freezer overlay during saves
**Fix:** Remove `.zc-freezer` elements via JavaScript before clicking

### Issue: Changes don't persist after save
**Cause:** Save button wasn't clicked before closing editor
**Fix:** Always click `#zctemplate-dialog-okBtn` before pressing Escape

### Issue: Can't find element by ref
**Cause:** Page state changed, refs are stale
**Fix:** Call `browser_snapshot` again to get fresh refs

### Issue: Line number not found
**Cause:** CodeMirror uses 0-based indexing
**Fix:** UI line 128 = CodeMirror index 127
