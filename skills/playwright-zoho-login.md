# Playwright: Zoho Login & Navigation

## Purpose
Navigate to Zoho Creator and ensure user is logged in before automation.

## Steps

### 1. Navigate to App
```
browser_navigate:
  url: "https://creator.zoho.com/account_owner/app_link_name/#Page:page_name"
```

### 2. Handle Login (if redirected)
- If redirected to accounts.zoho.com, user must login manually
- Wait for user confirmation before proceeding

### 3. Verify Login Success
```
browser_snapshot
# Check for app content, not login page
```

### 4. Navigate to Page Builder
```
browser_navigate:
  url: "https://creator.zoho.com/appbuilder/account_owner/app_link_name/page/page_name/edit"
```

## Example URLs
- Live app: `https://creatorapp.zoho.com/achyutmenont0_zohotest/continental-group/#Page:Dashboard`
- Page builder: `https://creator.zoho.com/appbuilder/achyutmenont0_zohotest/continental-group/page/Dashboard/edit`

## Tips
- Always use `browser_wait_for` with 3-5 seconds after navigation
- Use `browser_snapshot` to verify page loaded correctly
- See `playwright-zoho-page-builder` for editor automation
