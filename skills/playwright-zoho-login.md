# Playwright: Zoho Login & Session

## Purpose
Navigate to Zoho Creator with session persistence.

## Session Persistence
- Playwright MCP auto-persists sessions in `.playwright-mcp/` (gitignored)
- Login cookies (including `zccpn` token) survive between runs
- No re-login needed unless session expires

## Session Recovery
If "Target page, context or browser has been closed":
1. Re-navigate to the target URL
2. Session cookies should persist
3. If redirected to login, session expired — ask user to login

## Steps

### 1. Navigate to App
```
browser_navigate: https://creatorapp.zoho.com/{account}/{app}/#Page:{page}
browser_wait_for: 3-5 seconds
```

### 2. Handle Login (if redirected)
- User must login manually at accounts.zoho.com
- Session persists after successful login

### 3. Navigate to Page Builder
```
browser_navigate: https://creator.zoho.com/appbuilder/{account}/{app}/pagebuilder/{page}/edit
browser_wait_for: 5 seconds
```

### 4. Navigate to Form Builder
```
browser_navigate: https://creator.zoho.com/appbuilder/{account}/{app}/formbuilder/{form}/edit
browser_wait_for: 5 seconds
```

## URL Patterns
| Type | URL |
|------|-----|
| Live page ("Page" type, not in menu) | `https://creatorapp.zoho.com/{account}/{app}/#Page:{page}` |
| Live page (menu item) | `https://creatorapp.zoho.com/{account}/{app}/#{page}` |
| Page builder | `https://creator.zoho.com/appbuilder/{account}/{app}/pagebuilder/{page}/edit` |
| Form builder | `https://creator.zoho.com/appbuilder/{account}/{app}/formbuilder/{form}/edit` |

## Tips
- Always wait 3-5 seconds after navigation
- Use `browser_snapshot` to verify page loaded
- Press `Escape` to close select2 dropdown masks that block clicks
- Remove `.zc-freezer` overlays if they block interactions
