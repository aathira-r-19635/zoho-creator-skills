# Skills Index

Complete index of all skills in this repository, organised by use case.

---

## User Guide

Skills for documenting Zoho Creator apps as end-user PDF guides.

| Skill | File | Purpose |
|-------|------|---------|
| App Documentation PDF | `app-documentation-pdf.md` ⭐ | Screenshot every section, annotate with SVG callouts, build HTML user guide, export to PDF |

**Key rules:**
- Every button must have a screenshot with annotation — never describe buttons in text only
- Capture bulk action buttons (appear when rows are selected), `···` context menus, column buttons, and popups
- Order: Masters first → Flow sections → Supporting sections

---

## Testing

Skills for validating app behaviour, form workflows, and API interactions.

| Skill | File | Purpose |
|-------|------|---------|
| User Input Validation | `playwright-zoho-user-input-validation.md` | Create and test field-level workflow validations that block form submission on invalid input |
| Network Monitoring | `playwright-network-monitoring.md` | Capture and analyse Zoho Creator API calls to understand save mechanisms and debug workflows |
| Save & Verify | `playwright-zoho-save.md` | Save changes in page builder and verify they appear correctly on the live page |

---

## Development

Skills for building and modifying Zoho Creator apps — forms, pages, code, and data.

| Skill | File | Purpose |
|-------|------|---------|
| Form Builder | `playwright-zoho-form-builder.md` | Add/delete fields, configure lookups, drag-and-drop in the form builder |
| Page Builder | `playwright-zoho-page-builder.md` | Navigate Zoho Creator page builder to access HTML Snippet components |
| Code Editor | `playwright-code-editor.md` | Edit HTML content in Zoho Creator's CodeMirror-based code editor |
| HTML Snippet Syntax | `html-snippet-syntax.md` | Reference for writing HTML snippets with Deluge code in Zoho Creator pages |
| HTML Snippet Syntax (Playwright) | `playwright-html-snippet-syntax.md` | Correct syntax for writing Deluge code inside HTML snippets |
| Deluge Aggregates | `deluge-aggregate-functions.md` | Use `.count()`, `.sum()` etc. instead of `for each` loops |
| MCP Data Operations | `zoho-mcp-data-operations.md` | Add, update, query, and delete records in Zoho Creator forms and reports |
| Zoho Code MCP Setup | `zoho-code-mcp-setup.md` | Configure MCP server connection inside Zoho Code IDE |

---

## Shared / Infrastructure

Foundational skills used across all three categories.

| Skill | File | Purpose |
|-------|------|---------|
| Open Creator App | `open-creator-app.md` ⭐ | Full end-to-end: MCP app discovery + Playwright browser login + app open |
| Login & Session | `playwright-zoho-login.md` | Navigate to Zoho Creator with session persistence and URL patterns |
| MCP Tools | `zoho-mcp.md` | Full Zoho MCP tools reference with auth and workspace discovery |
| MCP Basics | `zoho-mcp-basics.md` | List and explore apps, forms, reports, and pages |
| Git Identity | `github-identity-enforcement.md` | Ensure correct corporate Git identity for all commits |
| Session Closure | `session-closure-workflow.md` | **MANDATORY** checklist when closing a session: document → update skills → commit → push |
| MCP Session Closure | `zoho-mcp-session-closure.md` | MCP auth setup and session closure context |

---

## Quick Reference

### Need to...
- **Generate a PDF user guide?** → `app-documentation-pdf.md` ⭐
- **Test form field validation?** → `playwright-zoho-user-input-validation.md`
- **Monitor API calls?** → `playwright-network-monitoring.md`
- **Add/edit form fields?** → `playwright-zoho-form-builder.md`
- **Edit a page/HTML snippet?** → `playwright-zoho-page-builder.md` + `playwright-code-editor.md`
- **Write Deluge code?** → `deluge-aggregate-functions.md` + `html-snippet-syntax.md`
- **Work with records?** → `zoho-mcp-data-operations.md`
- **Open any Creator app?** → `open-creator-app.md` ⭐
- **Make a commit?** → `github-identity-enforcement.md`
- **Close session?** → `session-closure-workflow.md`

---

## Skill Dependencies

```
playwright-zoho-login (session/auth)
         ↓
zoho-mcp (data)          playwright-zoho-form-builder (UI — Development)
zoho-mcp-data-operations  playwright-zoho-page-builder
                          playwright-code-editor
                          playwright-zoho-save
                          playwright-network-monitoring  (Testing)
                          playwright-zoho-user-input-validation
                          app-documentation-pdf          (User Guide)
```

---

## Documentation

| Document | Path |
|----------|------|
| Agent Instructions | `AGENTS.md` |
| Automation Guide | `docs/zoho-creator-automation.md` |
| Contributing | `CONTRIBUTING.md` |
| README | `README.md` |
