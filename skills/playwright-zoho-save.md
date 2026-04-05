# Playwright: Zoho Save & Verify

## Purpose
Save changes in Zoho Creator page builder and verify on live page.

## Save Sequence (CRITICAL)

Follow this exact sequence to ensure changes persist:

### 1. Save Code Editor
```
browser_snapshot  # Get fresh refs
browser_click on ref of "Save" button
browser_wait_for: 2 seconds
```

### 2. Close Editor Popup
```
browser_press_key: Escape
browser_wait_for: 1 second
```

### 3. Exit Page Builder
```
browser_snapshot  # Get fresh refs
# The Done button has id "builder-close"
# If blocked by freezer overlay, remove it first:
browser_run_code: |
  async (page) => {
    await page.evaluate(() => {
      document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
    });
    const doneBtn = document.getElementById('builder-close');
    if (doneBtn) doneBtn.click();
  }
browser_wait_for: 2 seconds
```

### 4. Handle Notification Popups (if any)
Zoho Creator may show browser notification permission popups during save:
- Look for notification permission dialog
- Click "Allow" to dismiss
- Continue with verification

### 5. Navigate to Live Page
```
browser_navigate:
  url: "https://creatorapp.zoho.com/{account}/{app}/#Page:{page}"
browser_wait_for: 5 seconds
```

## Verify Changes

### Take Screenshot
```
browser_take_screenshot:
  filename: "verify-change.png"
  type: "png"
```

### Check Content
```
browser_snapshot
# Verify text appears in snapshot
```

### Verify via JavaScript
```javascript
async (page) => {
  const result = await page.evaluate(() => {
    const allText = document.body.innerText;
    return {
      hasExpectedText: allText.includes('Expected Text'),
      pageTitle: document.title
    };
  });
  return result;
}
```

## Common Issues

### Freezer Overlay Blocking Clicks
Zoho shows a freezer overlay during saves that blocks interaction:
```javascript
// Remove freezer overlays
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
// Then click the target element
document.getElementById('builder-close').click();
```

### Changes Not Persisting
- **Cause**: Save button wasn't clicked before closing editor
- **Fix**: Always click Save button before pressing Escape

### Stale Content on Live Page
- **Cause**: Browser cache or page didn't fully reload
- **Fix**: Hard refresh or navigate away and back

### Browser Context Closed
- **Cause**: Session terminated during save
- **Fix**: Re-navigate to page builder, re-edit, and re-save

### Notification Popup Appearing
- **Cause**: Zoho requests notification permissions
- **Fix**: Click "Allow" to dismiss and continue

## Full Flow
1. Edit in code editor (see `playwright-code-editor`)
2. Save code editor (click Save button)
3. Wait 2 seconds
4. Press Escape to close popup
5. Wait 1 second
6. Remove freezer overlays if present
7. Click Done to exit page builder
8. Wait 2 seconds
9. Handle notification popup if appears
10. Navigate to live page
11. Wait 5 seconds for page to load
12. Screenshot and verify

## Save API Details

When you save an HTML snippet, Zoho makes this API call:

### Endpoint
```
POST https://creator.zoho.com/appbuilder/{account}/{app}/storeFunction
```

### Body Parameters
| Parameter | Description |
|-----------|-------------|
| `appLinkName` | App link name |
| `text` | URL-encoded HTML/Deluge content |
| `zohoruntime` | Current timestamp (milliseconds) |
| `zccpn` | CSRF token from browser cookies |
| `parentPageId` | The page ID |
| `htmlviewid` | The HTML snippet view ID |
| `linkName` | Snippet name (e.g., `html_snippet1`) |
| `scripttype` | Always `htmlpagemodify` |

## Session Recovery
If the browser context closes during save:
1. Re-navigate to the page builder URL
2. Re-open the code editor
3. Re-apply your changes
4. Follow the save sequence again
5. Session cookies should persist (no re-login needed)
