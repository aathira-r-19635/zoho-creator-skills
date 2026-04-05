# Playwright: Zoho Login & Navigation

## Purpose
Navigate to Zoho Creator and ensure user is logged in before automation.

## Session Persistence (IMPORTANT)

### Automatic Session Persistence
- Playwright MCP automatically persists browser sessions in `.playwright-mcp/` directory
- Login cookies (including `zccpn` token) are saved between sessions
- Future automation runs will reuse existing sessions without requiring re-login
- Session expires after several hours/days (Zoho cookie lifetime)

### Session Recovery (CRITICAL)
- Browser context can close unexpectedly during long automation sessions
- Common error: "Target page, context or browser has been closed"
- **Recovery steps:**
  1. The browser session has terminated
  2. Re-navigate to the target URL
  3. Session cookies should still be valid (no re-login needed)
  4. If re-login is required, ask the user to login manually
- **Prevention:** Handle navigation errors gracefully - retry navigation if context closes

### Session Storage
- **Location**: `.playwright-mcp/` directory (already in `.gitignore`)
- **What's stored**: Browser cookies, localStorage, session data
- **Security**: Session data is NOT source controlled (gitignored)
- **Benefit**: Future agents automatically inherit active sessions

### When Login is Required
- First time running automation
- Session has expired
- Cookies have been cleared
- Switching to a different Zoho account
- Browser context closed and cookies invalidated

## Steps

### 1. Navigate to App
```
browser_navigate:
  url: "https://creator.zoho.com/account_owner/app_link_name/#Page:page_name"
browser_wait_for: 3-5 seconds
```

### 2. Handle Login (if redirected)
- If redirected to accounts.zoho.com, user must login manually
- Wait for user confirmation before proceeding
- After successful login, session will be persisted automatically

### 3. Verify Login Success
```
browser_snapshot
# Check for app content, not login page
```

### 4. Navigate to Page Builder
```
browser_navigate:
  url: "https://creator.zoho.com/appbuilder/account_owner/app_link_name/page/page_name/edit"
browser_wait_for: 5 seconds
```

### 5. Handle Browser Context Closed Error
If you encounter "Target page, context or browser has been closed":
```
# Simply re-navigate - cookies should persist
browser_navigate:
  url: "https://creator.zoho.com/appbuilder/account_owner/app_link_name/page/page_name/edit"
browser_wait_for: 5 seconds

# If redirected to login, session expired - ask user to login
```

## Example URLs
- Live app: `https://creatorapp.zoho.com/achyutmenont0_zohotest/continental-group/#Page:Dashboard`
- Page builder: `https://creator.zoho.com/appbuilder/achyutmenont0_zohotest/continental-group/page/Dashboard/edit`

## Tips
- Always use `browser_wait_for` with 3-5 seconds after navigation
- Use `browser_snapshot` to verify page loaded correctly
- See `playwright-zoho-page-builder` for editor automation
- If session is active, skip manual login and proceed directly to automation
- **Handle errors gracefully**: Catch navigation errors and retry
- **Check for notification popups**: Zoho may show notification permission dialogs
