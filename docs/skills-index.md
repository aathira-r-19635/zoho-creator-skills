# Skills Index

Complete index of all skills in this repository.

## Quick Reference

### Need to...
- **Set up MCP in Zoho Code IDE?** → `zoho-code-mcp-setup.md`
- **Login to Zoho?** → `playwright-zoho-login.md`
- **Work with records?** → `zoho-mcp.md`
- **Change form fields?** → `playwright-zoho-form-builder.md`
- **Make a commit?** → `github-identity-enforcement.md`
- **Close session?** → `session-closure-workflow.md`

---

## Skills

### Zoho MCP (Data Operations)
| Skill | File | Purpose |
|-------|------|---------|
| MCP Tools | `zoho-mcp.md` | List apps, forms, records. Add/update/delete data |
| MCP Basics | `zoho-mcp-basics.md` | List & explore apps, forms, reports, pages |
| MCP Data Ops | `zoho-mcp-data-operations.md` | Add, update, query, delete records |
| Zoho Code MCP Setup | `zoho-code-mcp-setup.md` | Configure MCP in Zoho Code IDE (.zcode/ai/mcp.json) |
| Session Closure | `zoho-mcp-session-closure.md` | MCP auth setup, session closure context |

### Playwright (Browser Automation)
| Skill | File | Purpose |
|-------|------|---------|
| Login & Session | `playwright-zoho-login.md` | Navigate, session persistence, URL patterns |
| Form Builder | `playwright-zoho-form-builder.md` | Add/delete fields, configure lookups, drag-and-drop |

### Development
| Skill | File | Purpose |
|-------|------|---------|
| Git Identity | `github-identity-enforcement.md` | Ensure correct corporate Git identity |

### Session Closure
| Skill | File | Purpose |
|-------|------|---------|
| Closure Workflow | `session-closure-workflow.md` | **MANDATORY** checklist for closing sessions |

### Reference
| Skill | File | Purpose |
|-------|------|---------|
| Deluge Aggregates | `deluge-aggregate-functions.md` | Use `.count()`, `.sum()` instead of loops |

---

## Skill Dependencies
```
playwright-zoho-login (session/auth)
    ↓
zoho-mcp (data)       playwright-zoho-form-builder (UI)
```

## Skill Details

### zoho-mcp.md
- `ZohoCreator_getApplications` - List apps (use `complete: true`)
- `ZohoCreator_getForms/Reports` - List app components
- `ZohoCreator_getFormMetadata` - Discover field link names
- `ZohoCreator_getCreatorRecords` - Fetch records (up to 200)
- `ZohoCreator_updateRecordByID` - Update single record
- `ZohoCreator_addRecords` - Add records (up to 200)
- **DO NOT use** `ZohoCreator_getWorkspaces` (Code 2945 error)

### playwright-zoho-login.md
- Session auto-persists in `.playwright-mcp/`
- Recovery: re-navigate if context closes
- URL patterns for live pages, page builder, form builder

### playwright-zoho-form-builder.md
- Navigate to `formbuilder/{form}/edit`
- Click "Open Form Builder" in iframe
- Drag fields from sidebar to canvas
- Configure lookup fields: select form → select field → choose display type → Done
- Delete fields: click field → trash icon → confirm → Done
- Key quirks: select2 masks (press Escape), shadow DOM (use Playwright locators)

### session-closure-workflow.md
- **MANDATORY 8-step checklist** when user says "close session"
- Document learnings → Update skills → Update docs → Verify gitignore
- Close browser → Verify identity → Review → Commit → Push

---

## Documentation

| Document | Path |
|----------|------|
| Agent Instructions | `AGENTS.md` |
| Automation Guide | `docs/zoho-creator-automation.md` |
| Contributing | `CONTRIBUTING.md` |
| README | `README.md` |
