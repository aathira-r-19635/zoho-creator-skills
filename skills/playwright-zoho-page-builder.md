# Playwright: Zoho Page Builder Navigation

## Purpose
Navigate Zoho Creator page builder to access HTML Snippet components.

## Session Recovery
- If browser context closes during navigation, re-navigate to the target URL
- Session cookies should persist - no re-login needed
- If "Target page, context or browser has been closed" error occurs, retry navigation

## Steps

### 1. Navigate to Page Builder
```
browser_navigate:
  url: "https://creator.zoho.com/appbuilder/{account}/{app}/page/{page}/edit"
browser_wait_for: 5 seconds
```

### 2. Handle Notification Popups (if any)
Zoho Creator may show notification permission popups. If visible:
- Click "Allow" to dismiss
- Continue with automation

### 3. Enter Edit Mode (if not already in page builder)
```
browser_click on "Edit this application" link
browser_wait_for: 3 seconds
```

### 4. Access HTML Snippet in Design Preview Frame
The HTML Snippet component lives inside an iframe. Access it like this:
```javascript
async (page) => {
  const frame = page.frames().find(f => f.url().includes('appbuilder'));
  const previewFrame = frame.childFrames()[0];  // Design preview iframe
  
  const result = await previewFrame.evaluate(() => {
    const el = document.querySelector('.zc-pb-embed-cnt-holder');
    if (el) {
      el.click();
      return 'Clicked HTML snippet';
    }
    return 'Element not found';
  });
  return result;
}
```
browser_wait_for: 2 seconds

### 5. Open Code Editor via Configure Button
```
# The properties panel appears after clicking the snippet
browser_snapshot  # Get fresh refs for Configure button
browser_click on ref of "Configure" button
browser_wait_for: 3 seconds
```

### 6. Find CodeMirror Editor
- Content is in the **3rd CodeMirror instance** (index 2) in the appbuilder frame
- Use `playwright-code-editor` skill to edit content
- See `html-snippet-syntax.md` for proper Deluge syntax

### 7. Save Changes
```
# Click Save button in code editor popup
browser_snapshot  # Get fresh refs
browser_click on ref of "Save" button
browser_wait_for: 2 seconds

# Close editor popup
browser_press_key: Escape
browser_wait_for: 1 second

# Exit page builder
browser_snapshot  # Get fresh refs
browser_click on ref of "Done" link (id: builder-close)
# If blocked by overlay, remove .zc-freezer elements first via JavaScript
browser_wait_for: 2 seconds
```

### 8. Verify Changes
```
browser_navigate:
  url: "https://creatorapp.zoho.com/{account}/{app}/#Page:{page}"
browser_wait_for: 5 seconds
browser_snapshot  # Verify the changes are visible
```

## Key Refs to Find
- HTML Snippet component: inside design preview iframe (`.zc-pb-embed-cnt-holder`)
- Configure button: Look for button with text "Configure" in the properties panel
- Save button: Look for button with text "Save" in the code editor
- Done link: Look for link with id "builder-close" in the top bar

## Tips
- Always wait 2-3 seconds after each click
- Use `browser_snapshot` to find current refs before clicking
- **IMPORTANT**: Always click Save BEFORE pressing Escape
- **IMPORTANT**: Click Done after pressing Escape to fully exit page builder
- If refs are stale, capture a new `browser_snapshot`
- **Handle freezer overlays**: Remove `.zc-freezer` elements if they block clicks
- **Handle notification popups**: Click "Allow" if notification permission dialog appears
- **Session recovery**: If browser context closes, re-navigate (cookies persist)

## Iframe Navigation Pattern
```javascript
// Access design preview iframe
const frame = page.frames().find(f => f.url().includes('appbuilder'));
const previewFrame = frame.childFrames()[0];

// Interact with elements inside iframe
await previewFrame.evaluate(() => {
  document.querySelector('.zc-pb-embed-cnt-holder').click();
});
```

## Freezer Overlay Handling
```javascript
// Remove freezer overlays that block clicks
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
```
