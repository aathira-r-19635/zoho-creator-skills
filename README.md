# Zoho Creator Automation Skills

A collection of granular agent skills for automating Zoho Creator using Playwright MCP and Zoho MCP tools.

## What This Repo Solves

Zoho MCP provides tools for **data operations** but NOT for **UI/page customization**. These skills bridge that gap by showing agents how to use Playwright MCP to automate the Zoho Creator page builder.

## Skills Overview

### Zoho MCP Skills
| Skill | Purpose |
|-------|---------|
| `zoho-mcp-basics` | List apps, forms, reports, pages |
| `zoho-mcp-data-operations` | Add, update, query records |

### Playwright MCP Skills
| Skill | Purpose |
|-------|---------|
| `playwright-zoho-login` | Navigate to Zoho Creator & handle login |
| `playwright-zoho-page-builder` | Access HTML snippet editor |
| `playwright-code-editor` | Edit CodeMirror content programmatically |
| `playwright-zoho-save` | Save changes & verify on live page |
| `playwright-network-monitoring` | Capture Zoho API calls |

## Quick Start

### For Data Operations
```
1. Read skills/zoho-mcp-basics.md
2. Use Zoho MCP tools directly
```

### For UI Changes
```
1. Read skills/playwright-zoho-login.md
2. Follow the skill dependency chain
3. Execute steps in order
```

## Key Learnings

### CodeMirror Editing
- HTML content lives in the **3rd CodeMirror instance** (index 2) in frame 0
- Use `cm.setSelection()` + `cm.replaceSelection()` for edits
- UI line 128 = CodeMirror index 127

### Save Flow
1. Edit content in CodeMirror
2. Click Save (`#zctemplate-dialog-okBtn`)
3. Press Escape to close popup
4. Click Done (`#builder-close`)
5. Navigate to live page to verify

### Zoho Save API
```
POST /appbuilder/{account}/{app}/storeFunction
Body: appLinkName=&text={encoded HTML}&zohoruntime=&zccpn=&parentPageId=&htmlviewid=&linkName=&scripttype=htmlpagemodify
```

## Documentation
- See `docs/zoho-creator-automation.md` for end-to-end guides
- See `AGENTS.md` for agent-specific instructions
