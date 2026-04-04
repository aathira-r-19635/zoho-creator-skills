# AGENTS.md - Zoho Creator Automation Agent Instructions

## Overview
This repo contains skills for automating Zoho Creator using Playwright MCP and Zoho MCP tools. Use these skills to perform data operations and UI customizations.

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

### Session Storage
- **Location**: `.playwright-mcp/` directory (already in `.gitignore`)
- **Security**: Session data is NOT source controlled
- **Benefit**: Seamless automation across sessions

### Login Flow
1. Try navigating to page builder URL
2. If redirected to login → ask user to login manually
3. After login → session is automatically persisted
4. Future runs → skip login, proceed directly to automation

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

## Tools Available
- **Zoho MCP**: Data operations (forms, reports, records)
- **Playwright MCP**: Browser automation (clicks, navigation, screenshots)
- **browser_run_code**: Execute JavaScript in page context
- **browser_network_requests**: Monitor API calls

## GitHub Identity Enforcement (CRITICAL)

### Rule
This repository MUST ONLY use GitHub account: `https://github.com/aathira-r-19635`

### Before Any Git Operations
1. Verify git identity:
   ```bash
   git config user.name  # Should be: Aathira PR
   git config user.email  # Should be: aadhirapr@gmail.com
   ```
2. Verify remote:
   ```bash
   git remote -v  # Should show: aathira-r-19635/zoho-creator-skills.git
   ```
3. Verify gh CLI:
   ```bash
   gh auth status  # Should show: aathira-r-19635
   ```

### If Identity is Wrong
- Stop immediately
- Fix git config: `git config --local user.name "Aathira PR"` and `git config --local user.email "aadhirapr@gmail.com"`
- Fix gh auth: `gh auth login --hostname github.com`
- See `skills/github-identity-enforcement.md` for detailed procedures

### Important
- This is machine-specific configuration
- DO NOT source control `.git/config` or auth tokens
- Other developers will have their own setups

## Key References
- See `skills/playwright-zoho-login.md` for authentication details
- See `skills/playwright-zoho-page-builder.md` for page builder navigation
- See `skills/playwright-code-editor.md` for CodeMirror editing examples
- See `docs/zoho-creator-automation.md` for complete end-to-end documentation
