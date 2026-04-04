# Playwright: Zoho Save & Verify

## Purpose
Save changes in Zoho Creator page builder and verify on live page.

## Save Sequence

### 1. Save Code Editor
```
# Click Save in code editor popup
browser_run_code: (click #zctemplate-dialog-okBtn)
browser_wait_for: 2 seconds
```

### 2. Close Editor Popup
```
browser_press_key: Escape
browser_wait_for: 1 second
```

### 3. Exit Page Builder
```
browser_click on "Done" link (id: builder-close)
# If blocked by overlay, use:
browser_run_code: (remove .zc-freezer elements, then click #builder-close)
```

## Verify Changes

### Navigate to Live Page
```
browser_navigate:
  url: "https://creatorapp.zoho.com/account_owner/app_link/#Page:page_name"
browser_wait_for: 3 seconds
```

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

## Common Issues
- **Overlay blocking clicks**: Remove `.zc-freezer` elements via JavaScript
- **Changes not persisting**: Ensure Save was clicked before Done
- **Stale content**: Hard refresh the live page

## Full Flow
1. Edit in code editor (see `playwright-code-editor`)
2. Save code editor
3. Exit page builder
4. Navigate to live page
5. Screenshot and verify
