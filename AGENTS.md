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

### Need a custom HTML UI / frontend for an app?
→ Build a **Creator Widget (JS SDK)** — see `skills/creator-widget-js-sdk.md` + `skills/creator-widget-build-register.md` (or delegate to the **creator-widget-developer** agent)

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

### Zoho Code IDE MCP Setup
→ See `skills/zoho-code-mcp-setup.md` for complete guide
- Config file: `.zcode/ai/mcp.json` (project-level, gitignored)
- Transport type: `sse` (Server-Sent Events)
- Requires **MCP Manager extension** (`nicepkg.aide-mcp-manager`) to be active
- **Reload IDE** after config changes for connection to initialize

### Config Files (NOT source controlled)
- Zoho Code IDE MCP: `.zcode/ai/mcp.json` (gitignored)
- OAuth tokens: `~/.qwen/mcp-oauth-tokens.json`
- MCP config: `~/.qwen/settings.json`

## Custom Agents

Pre-built subagents that bundle the right skills for a whole job. Delegate to one when a task matches its scope instead of wiring the skills together by hand.

| Agent | File | Purpose |
|-------|------|---------|
| `creator-widget-developer` | `.claude/agents/creator-widget-developer.md` | Build, register, embed, and live-test a custom HTML/JS widget (Creator JS SDK v1, no server) inside a Zoho Creator app |
| `creator-app-builder` | `.claude/agents/creator-app-builder.md` | Scaffold or restructure a Creator app's components — create app, add forms/fields/lookups, add list/Kanban reports, add pages, arrange the menu/single-page layout, or remove redundant components |
| `creator-app-documenter` | `.claude/agents/creator-app-documenter.md` | When a user asks for a user guide / documentation / manual / PDF walkthrough of a Zoho Creator app |
| `creator-qa-tester` | `.claude/agents/creator-qa-tester.md` | Test/QA/validate a Zoho Creator app or form — exercise CRUD, probe field validations, monitor network for silent failures, and report bugs with repro/severity |

## Reflecting Learnings (Repeatable)

Before session closure, turn what you learned into reusable repo assets (skills/agents/indexes).

**Write every asset for the least capable model that will use it** — numbered imperative steps, exact commands/selectors/URLs, explicit decision rules, and an "if error X → do Y" line for each known failure.

→ Follow `skills/knowledge-reflection-workflow.md` or run the `/reflect-learnings` command.

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
| `zoho-code-mcp-setup.md` | Setting up MCP in Zoho Code IDE (.zcode/ai/mcp.json) |
| `creator-widget-js-sdk.md` | Verified v1 ZOHO.CREATOR.API contract: server-side `criteria` read-filter (==/!=/&&/\|\|/contains/startsWith), double-data-wrap add/update, criteria/multi-row delete, code 3000, SYNC `getInitParams`, optimistic-CRUD hardening |
| `creator-app-scaffold.md` | Create a NEW Creator app from the dashboard (New Application → Create from scratch) + add Form/Report/Page via the builder picker (`#create-form-trigger`/`#create-page-trigger`/`.zc-dem-create-header`) |
| `creator-widget-build-register.md` | Hand-build, zet-pack, and register a custom HTML/JS widget in a Creator app, then embed it on a page (verified builder selectors + real mouse-API drag) |
| `creator-csv-import-schema.md` | Stand up Creator form schema + seed data FAST via CSV "Import with data" (auto-fields from headers; choice fields get allow_other_choice); flat-FK-by-code joins |
| `creator-widget-scalability.md` | Keep a widget responsive at scale: debounce search, event delegation, and IMPLEMENTED lazy-load/infinite-scroll (per-column cap, `.board-wrap` scroll, position preserved) — verified 545 records → 1,821 DOM nodes |
| `creator-bulk-write-throttling.md` | Worker-pool (6) + exponential backoff for bulk/parallel writes; avoids the ~HTTP 429 that ~12 concurrent addRecord calls trigger after ~400 writes |
| `creator-widget-iframe-testing.md` | Drive/seed/measure a deployed widget from a browser session via element-scoped eval on its cross-origin iframe (load-test, render timing, synthetic drag) |
| `creator-single-page-app.md` | Trim the nav menu to one entry for a single-page/widget app without deleting any components or data |
| `creator-delete-components.md` | Permanently delete a Creator report or page via the builder without breaking the data layer the app depends on |
| `knowledge-reflection-workflow.md` | Repeatable process to turn a session's learnings into reusable repo assets (skills/agents/indexes) |

## Key References
- `CONTRIBUTING.md` - Contributor guide
- `docs/skills-index.md` - Complete skills index
- `docs/zoho-creator-automation.md` - End-to-end workflows
- **Zoho Official Docs**: https://help.zoho.com/portal/en/kb/creator
