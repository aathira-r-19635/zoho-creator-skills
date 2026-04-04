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

## Authentication
- User must be logged into Zoho Creator before automation
- If redirected to login, pause and ask user to login manually
- zccpn token is stored in browser cookies

## Important Patterns

### Always Wait After Navigation
```
browser_navigate → browser_wait_for (3-5 seconds)
```

### Always Snapshot Before Actions
```
browser_snapshot → identify refs → browser_click
```

### CodeMirror Editing
- HTML content is in the **3rd CodeMirror** (index 2) in frame 0
- UI line numbers are 1-based; CodeMirror is 0-based
- Use `setSelection()` + `replaceSelection()` for text replacement

### Save Sequence
1. Click Save in code editor popup
2. Press Escape to close popup
3. Click Done to exit page builder
4. Navigate to live page to verify

## Error Handling
- If element not found, capture new `browser_snapshot`
- If click is blocked, remove overlay elements via JavaScript
- If changes don't persist, verify Save was clicked before Done

## Tools Available
- **Zoho MCP**: Data operations (forms, reports, records)
- **Playwright MCP**: Browser automation (clicks, navigation, screenshots)
- **browser_run_code**: Execute JavaScript in page context
- **browser_network_requests**: Monitor API calls
