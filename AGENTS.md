# AGENTS.md - Zoho Creator Automation Agent Instructions

## Overview
This repo contains skills for automating Zoho Creator using Playwright MCP and Zoho MCP tools. Use these skills to perform data operations and UI customizations.

**This is a living, multi-developer repository.** Multiple Zoho Creator developers contribute to and maintain these skills. Always follow the contributing guidelines in `CONTRIBUTING.md`.

## Quick Decision Tree

### Need to work with data (records)?
→ Use **Zoho MCP tools** (see `skills/zoho-mcp-*`)
- Add/update/delete records
- Query reports
- Get form metadata

### Need to change page layout/UI?
→ Use **Playwright MCP** (see `skills/playwright-*`)
- Edit HTML snippets
- Modify page components
- Change visual elements

### Need to make commits?
→ Read `CONTRIBUTING.md` and `skills/github-identity-enforcement.md` first
- Use only your corporate GitHub account
- Follow the contribution workflow
- Write clear commit messages

## Skill Dependencies
```
playwright-zoho-login
    ↓
playwright-zoho-page-builder
    ↓
playwright-code-editor
    ↓
playwright-zoho-save
```

## Authentication & Session Persistence

### Session Persistence (IMPORTANT)
- Playwright MCP **automatically persists** browser sessions in `.playwright-mcp/` directory
- Login cookies (including `zccpn` token) are saved between sessions
- **Future agents automatically inherit active sessions** - no re-login needed
- Session expires after several hours/days (Zoho cookie lifetime)

### Session Recovery (CRITICAL)
- Browser context can close unexpectedly during long sessions
- If you see "Target page, context or browser has been closed" error:
  1. The browser session has terminated
  2. You must re-navigate to the target URL
  3. Session cookies should still be valid (no re-login needed)
  4. If re-login is required, ask the user to login manually
- **Always handle navigation errors gracefully** - retry navigation if context closes

### Session Storage
- **Location**: `.playwright-mcp/` directory (already in `.gitignore`)
- **Security**: Session data is NOT source controlled
- **Benefit**: Seamless automation across sessions

### Login Flow
1. Try navigating to page builder URL
2. If redirected to login → ask user to login manually
3. After login → session is automatically persisted
4. Future runs → skip login, proceed directly to automation
5. **If browser context closes** → re-navigate (cookies should persist)

## HTML Snippet Syntax Reference

### Deluge Tags in HTML Snippets
Zoho Creator HTML snippets support embedding Deluge code using special tags:

| Tag | Purpose | Example |
|-----|---------|---------|
| `<%{ ... }%>` | Execute Deluge logic (no output) | `<%{ if(input.Status == "Approved") { } }%>` |
| `<%= ... %>` | Output Deluge value | `<%= input.Field_Name %>` |

### Common Patterns
```html
<!-- Display a field value -->
<p>Customer: <%= input.Customer_Name %></p>

<!-- Conditional rendering -->
<%{ if(input.Status == "Approved") { %>
  <p style="color: green;">Status: Approved</p>
<%{ } %>

<!-- Simple text output -->
<h1><%= "Hello World" %></h1>
```

### Important Notes
- HTML snippets are executed server-side before page renders
- Do NOT use `<% %>` for output - use `<%= %>` instead
- Always close Deluge blocks properly: `<%{ ... }%>`
- See `skills/html-snippet-syntax.md` for complete syntax reference
- Official docs: https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets

## Important Patterns

### Always Wait After Navigation
```
browser_navigate → browser_wait_for (3-5 seconds)
```

### Always Snapshot Before Actions
```
browser_snapshot → identify refs → browser_click
```

### CodeMirror Editing (Complete Flow)
1. **Find the text**:
   ```javascript
   // Search for text in CodeMirror (index 2 = 3rd editor)
   const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
   for (let i = 0; i < cm.lineCount(); i++) {
     if (cm.getLine(i).includes('Text to find')) {
       return { line: i + 1, content: cm.getLine(i) };
     }
   }
   ```

2. **Replace the text**:
   ```javascript
   const cm = document.querySelectorAll('.CodeMirror')[2].CodeMirror;
   cm.focus();
   const lineIdx = UI_line - 1;  // 0-based indexing
   const startPos = cm.getLine(lineIdx).indexOf('Old Text');
   cm.setSelection({ line: lineIdx, ch: startPos }, { line: lineIdx, ch: startPos + 'Old Text'.length });
   cm.replaceSelection('New Text');
   ```

3. **Save**:
   - Click Save button in code editor
   - Wait 2 seconds
   - Press Escape to close popup
   - Wait 1 second
   - Click Done to exit page builder

### Save Sequence (CRITICAL)
1. Click Save in code editor popup
2. Wait 2 seconds
3. Press Escape to close popup
4. Wait 1 second
5. Click Done to exit page builder
6. Navigate to live page to verify

## Error Handling
- If element not found → capture new `browser_snapshot`
- If click is blocked → remove overlay elements via JavaScript
- If changes don't persist → verify Save was clicked before Escape
- If redirected to login → ask user to login, then session persists automatically
- **If browser context closes** → re-navigate to target URL (cookies should persist)
- **If notification popup appears** → click "Allow" to dismiss and proceed
- **If freezer overlay blocks clicks** → remove `.zc-freezer` elements via JavaScript

### Notification Popup Handling
Zoho Creator may show browser notification permission popups. When this happens:
1. Look for notification permission dialog
2. Click "Allow" to dismiss
3. Continue with automation

### Freezer Overlay Handling
Zoho shows freezer overlays during saves that can block clicks:
```javascript
// Remove freezer overlays
document.querySelectorAll('.zc-freezer, .zc-freezer-layer').forEach(el => el.remove());
```

## GitHub Identity Enforcement (CRITICAL)

### Rule
This repository MUST ONLY use your **corporate Zoho GitHub account**.

### Before Any Git Operations
1. Verify git identity:
   ```bash
   git config user.name  # Your GitHub username
   git config user.email  # Your @zohocorp.com email
   ```
2. Verify remote:
   ```bash
   git remote -v  # Should show: your-org/zoho-creator-skills.git
   ```
3. Verify gh CLI:
   ```bash
   gh auth status  # Should show your corporate account
   ```

### If Identity is Wrong
- Stop immediately
- Fix git config: `git config --local user.name "your-username"` and `git config --local user.email "your.email@zohocorp.com"`
- Fix gh auth: `gh auth login --hostname github.com`
- See `skills/github-identity-enforcement.md` for detailed procedures

### Important
- This is machine-specific configuration
- DO NOT source control `.git/config` or auth tokens
- Each developer uses their own corporate account

## Multi-Developer Workflow

### This Repo is Shared
- Multiple Zoho Creator developers contribute
- Skills evolve over time
- New skills are added regularly
- Obsolete skills are deprecated

### When You Discover New Patterns
1. Test the pattern thoroughly
2. Update relevant skill files
3. Update this file if workflows change
4. Commit with clear message explaining what and why
5. Follow `CONTRIBUTING.md` guidelines

### When MCP Tools Change
- Check if existing skills can be simplified
- Update skills to use new MCP tools when available
- Mark old approaches as deprecated
- Document the transition

## Tools Available
- **Zoho MCP**: Data operations (forms, reports, records)
- **Playwright MCP**: Browser automation (clicks, navigation, screenshots)
- **browser_run_code**: Execute JavaScript in page context
- **browser_network_requests**: Monitor API calls

## Key References
- `CONTRIBUTING.md` - Complete contributor guide
- `docs/zoho-creator-automation.md` - End-to-end workflows
- `docs/skills-index.md` - Complete skills index
- `skills/playwright-zoho-login.md` - Authentication details
- `skills/playwright-zoho-page-builder.md` - Page builder navigation
- `skills/playwright-code-editor.md` - CodeMirror editing
- `skills/playwright-zoho-save.md` - Save & verify workflow
- `skills/html-snippet-syntax.md` - HTML snippet Deluge syntax reference
- **Zoho Official Docs**: https://help.zoho.com/portal/en/kb/creator/developer-guide/pages/snippets
