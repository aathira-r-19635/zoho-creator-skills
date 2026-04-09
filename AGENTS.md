# AGENTS.md - Zoho Creator Automation Agent Instructions

## Overview
Skills for automating Zoho Creator using Playwright MCP and Zoho MCP tools.

**This is a living, multi-developer repository.** Follow `CONTRIBUTING.md`.

## Quick Decision Tree

### Need to work with data (records)?
→ Use **Zoho MCP tools** (see `skills/zoho-mcp.md`)
- Add/update/delete records
- Query reports
- Get form metadata

### Need to change form structure (fields)?
→ Use **Playwright Form Builder** (see `skills/playwright-zoho-form-builder.md`)
- Add/delete fields
- Configure lookups
- Drag-and-drop UI

### Need to navigate/authenticate?
→ Use **Playwright Login** (see `skills/playwright-zoho-login.md`)
- Session persistence
- URL patterns

### Need to make commits?
→ Read `CONTRIBUTING.md` and `skills/github-identity-enforcement.md`
- Use only your corporate GitHub account

### User says "close session" / "be ready" / "wrap up"?
→ **MUST follow `skills/session-closure-workflow.md` completely**
- Document learnings, update skills, update docs
- Close browser, verify identity, commit, push to main

## Skill Dependencies
```
playwright-zoho-login (session/auth)
    ↓
zoho-mcp (data operations)       playwright-zoho-form-builder (UI changes)
```

## Authentication & Session

### Session Persistence
- Playwright MCP auto-persists sessions in `.playwright-mcp/` (gitignored)
- Login cookies (including `zccpn` token) survive between runs
- No re-login needed unless session expires

### Session Recovery
If "Target page, context or browser has been closed":
1. Re-navigate to the target URL
2. Session cookies should persist
3. If redirected to login, session expired — ask user to login

### URL Patterns
| Type | URL Format |
|------|-----------|
| Live page ("Page" type) | `https://creatorapp.zoho.com/{account}/{app}/#Page:{page}` |
| Live page (menu item) | `https://creatorapp.zoho.com/{account}/{app}/#{page}` |
| Page builder | `https://creator.zoho.com/appbuilder/{account}/{app}/pagebuilder/{page}/edit` |
| Form builder | `https://creator.zoho.com/appbuilder/{account}/{app}/formbuilder/{form}/edit` |

## Important Patterns

### Always Wait After Navigation
```
browser_navigate → browser_wait_for (3-5 seconds)
```

### Always Snapshot Before Actions
```
browser_snapshot → identify refs → browser_click
```

### Screenshot for Debugging
```
browser_take_screenshot: { filename: "step.png", type: "png" }
```

## Error Handling

### Element Not Found
→ Capture new `browser_snapshot`

### Click Blocked by Overlay
→ Remove `.zc-freezer` elements:
```javascript
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
```

### Select2 Dropdown Mask Intercepts Clicks
→ Press `Escape` first, then click

### Notification Popup
→ Click "Allow" to dismiss

## GitHub Identity Enforcement (CRITICAL)

### Rule
Use ONLY your corporate Zoho GitHub account.

### Before Any Git Operations
```bash
git config user.name   # Your GitHub username
git config user.email  # Your @zohocorp.com email
git remote -v          # Your fork
gh auth status         # Your account
```

### If Wrong
```bash
git config --local user.name "your-username"
git config --local user.email "your.email@zohocorp.com"
```

## Multi-Developer Workflow

### When You Discover New Patterns
1. Test thoroughly
2. Update relevant skill files
3. Update `AGENTS.md` if workflows change
4. Commit with clear message
5. Follow `CONTRIBUTING.md`

### When MCP Tools Change
- Update skills to use new tools
- Mark old approaches as deprecated
- Document the transition

## Zoho MCP Authentication (Apr 2026)

### Use "Authorize via Connection" Mode
- Configure at: `https://creator-XXXXXXX.zohomcp.com` → Connection tab
- All tools pre-authorized server-side

### Known Issue: `ZohoCreator_getWorkspaces`
- **Fails with Code 2945** — do NOT use
- **Use instead:** `ZohoCreator_getApplications` with `{complete: true}`
- Extract `workspace_name` from response

### Config Files (NOT source controlled)
- OAuth tokens: `~/.qwen/mcp-oauth-tokens.json`
- MCP config: `~/.qwen/settings.json`

## Skills Index

| Skill | Purpose |
|-------|---------|
| `zoho-mcp.md` | MCP tools: getApps, getForms, getRecords, add/update/delete records |
| `playwright-zoho-login.md` | Session persistence, navigation, URL patterns |
| `playwright-zoho-form-builder.md` | Form builder: add/delete fields, configure lookups, drag-and-drop |
| `deluge-aggregate-functions.md` | Use `.count()`, `.sum()`, `.avg()` instead of loops |
| `github-identity-enforcement.md` | Git identity verification and correction |
| `session-closure-workflow.md` | Mandatory steps when closing a session |
| `zoho-mcp-session-closure.md` | MCP-specific session closure context |

## Key References
- `CONTRIBUTING.md` - Contributor guide
- `docs/skills-index.md` - Complete skills index
- `docs/zoho-creator-automation.md` - End-to-end workflows
- **Zoho Official Docs**: https://help.zoho.com/portal/en/kb/creator
