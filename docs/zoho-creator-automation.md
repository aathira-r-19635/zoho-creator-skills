# Zoho Creator Automation - End-to-End Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Session Persistence](#session-persistence)
3. [When to Use Which Tool](#when-to-use-which-tool)
4. [HTML Snippet Editing Flow](#html-snippet-editing-flow)
5. [Zoho Save API](#zoho-save-api)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

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

## Session Persistence

### How It Works
- Playwright MCP automatically persists browser sessions in `.playwright-mcp/` directory
- Login cookies (including `zccpn` token) are saved between sessions
- Future automation runs reuse existing sessions without requiring re-login
- Session expires after several hours/days (Zoho cookie lifetime)

### Session Storage
- **Location**: `.playwright-mcp/` directory (already in `.gitignore`)
- **What's stored**: Browser cookies, localStorage, session data
- **Security**: Session data is NOT source controlled (gitignored)
- **Benefit**: Future agents automatically inherit active sessions

### When Manual Login is Required
- First time running automation
- Session has expired
- Cookies have been cleared
- Switching to a different Zoho account

### Workflow for Agents
1. Try navigating to the page builder URL
2. If redirected to login page → ask user to login manually
3. After login → session is automatically persisted
4. Future runs → skip login, proceed directly to automation

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
browser_snapshot  # Get fresh refs
browser_click on ref of HTML Snippet component
browser_wait_for: 2 seconds
```

### Step 3: Open Code Editor
```
# Click Configure button
browser_snapshot  # Get fresh refs
browser_click on ref of "Configure" button
browser_wait_for: 3 seconds
```

### Step 4: Find the Text to Edit
```javascript
async (page) => {
  const result = await page.frames()[0].evaluate(() => {
    const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
    for (let i = 0; i < cm.lineCount(); i++) {
      const line = cm.getLine(i);
      if (line.includes('Text to find')) {
        return { found: true, line: i + 1, content: line };
      }
    }
    return { found: false };
  });
  return result;
}
```

### Step 5: Edit Content via CodeMirror
```javascript
async (page) => {
  const result = await page.frames()[0].evaluate(() => {
    const cmElements = document.querySelectorAll('.CodeMirror');
    const cm = cmElements[2].CodeMirror;  // 3rd editor
    
    cm.focus();
    
    const lineIdx = 41;  // UI line 42 = index 41
    const lineContent = cm.getLine(lineIdx);
    const startPos = lineContent.indexOf('Old Text');
    
    cm.setSelection(
      { line: lineIdx, ch: startPos },
      { line: lineIdx, ch: startPos + 'Old Text'.length }
    );
    
    cm.replaceSelection('New Text');
    cm.scrollIntoView({ line: lineIdx, ch: 0 }, 200);
    
    return { success: true, newContent: cm.getLine(lineIdx) };
  });
  return result;
}
```

### Step 6: Save Changes
```
# Click Save button in code editor popup
browser_snapshot  # Get fresh refs
browser_click on ref of "Save" button
browser_wait_for: 2 seconds

# Close popup
browser_press_key: Escape
browser_wait_for: 1 second

# Exit page builder
browser_snapshot  # Get fresh refs
browser_click on ref of "Done" link
browser_wait_for: 2 seconds
```

### Step 7: Verify on Live Page
```
browser_navigate:
  url: "https://creatorapp.zoho.com/{account}/{app}/#Page:{page}"
browser_wait_for: 3 seconds
browser_snapshot  # Verify the changes are visible
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

## HTML Snippet Syntax Reference

### Overview
Zoho Creator HTML snippets combine standard HTML markup with server-side Deluge scripting. The code executes server-side before the page renders in the browser.

### Deluge Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `<%{ ... }%>` | Execute Deluge logic (no output) | `<%{ if(input.Status == "Approved") { } }%>` |
| `<%= ... %>` | Output Deluge value | `<%= input.Field_Name %>` |

### Examples

**Display a field value:**
```html
<p>Customer: <%= input.Customer_Name %></p>
<h1><%= "Hello World" %></h1>
```

**Conditional rendering:**
```html
<%{ if(input.Status == "Approved") { %>
  <p style="color: green;">Status: Approved</p>
<%{ } %>
```

**Loop through records:**
```html
<ul>
<%{ for each item in input.Order_Items { %>
  <li><%= item.Product_Name %> - $<%= item.Price %></li>
<%{ } %>
</ul>
```

### Important Notes
- HTML snippets execute server-side before page renders
- Do NOT use `<% %>` for output - use `<%= %>` instead
- Always close Deluge blocks: `<%{ ... }%>`
- Cannot directly manipulate client-side DOM (use JavaScript for that)
- Keep logic lightweight - complex data fetching should be done in Page "On Load" workflow

### Official Documentation
- https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets
- https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets/articles/understand-html-snippets

---

## Troubleshooting

### Issue: Redirected to login page
**Cause:** Session expired or no active session
**Fix:**
1. Ask user to login manually
2. After login, session will be persisted automatically
3. Future runs won't require re-login

### Issue: Browser context closed
**Cause:** Browser session terminated during automation
**Fix:**
1. Re-navigate to the target URL
2. Session cookies should persist (no re-login needed)
3. If redirected to login, session expired - ask user to login
**Prevention:** Handle navigation errors gracefully

### Issue: CodeMirror content is empty (length: 0)
**Cause:** Wrong CodeMirror instance selected
**Fix:** Use index 2 (3rd instance), not index 0

### Issue: Click is intercepted by overlay
**Cause:** Zoho shows a freezer overlay during saves
**Fix:** Remove `.zc-freezer` elements via JavaScript before clicking
```javascript
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
```

### Issue: Changes don't persist after save
**Cause:** Save button wasn't clicked before closing editor
**Fix:** Always click Save button before pressing Escape

### Issue: Can't find element by ref
**Cause:** Page state changed, refs are stale
**Fix:** Call `browser_snapshot` again to get fresh refs

### Issue: Line number not found
**Cause:** CodeMirror uses 0-based indexing
**Fix:** UI line 128 = CodeMirror index 127

### Issue: Text replacement doesn't work
**Cause:** CodeMirror not focused or wrong selection
**Fix:**
1. Call `cm.focus()` before making selections
2. Verify the text exists using the find script first
3. Check that `startPos` is not -1 (text not found)

### Issue: Page builder doesn't close after Done
**Cause:** Done button not clicked or Save popup still open
**Fix:**
1. Click Save button
2. Wait 2 seconds
3. Press Escape to close popup
4. Wait 1 second
5. Click Done button

### Issue: Notification popup appears
**Cause:** Zoho requests browser notification permissions
**Fix:** Click "Allow" to dismiss and continue automation

### Issue: HTML snippet not rendering on live page
**Cause:** Deluge syntax error or incorrect tags
**Fix:**
1. Verify Deluge tags are properly closed: `<%{ ... }%>`
2. Use `<%= %>` for output, `<%{ }%>` for logic
3. Check Zoho help docs for correct syntax
4. Reference: https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets

---

## GitHub Identity Enforcement

### Rule
This repository uses **only** the GitHub account: `https://github.com/aathira-r-19635`

### Verification
Before making commits, always verify:
```bash
git config user.name   # aathira-r-19635
git config user.email  # aathira.r@zohocorp.com
gh auth status         # aathira-r-19635
git remote -v          # aathira-r-19635/zoho-creator-skills.git
```

### Configuration
```bash
git config --local user.name "aathira-r-19635"
git config --local user.email "aathira.r@zohocorp.com"
```

### Important
- This is machine-specific (not source controlled)
- Other developers will have their own setups
- See `skills/github-identity-enforcement.md` for full details
