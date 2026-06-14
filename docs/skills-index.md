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
| Creator Widget JS SDK (v1) | `creator-widget-js-sdk.md` | Verified v1 ZOHO.CREATOR.API contract: server-side `criteria` read-filter (==/!=/&&/\|\|/contains/startsWith), double-data-wrap add/update, criteria/multi-row delete, code 3000, SYNC `getInitParams`, optimistic-CRUD hardening |
| Build, Package & Register a Creator Widget | `creator-widget-build-register.md` | Hand-build, zet-pack, register a custom HTML/JS widget, then embed it on a page (verified builder selectors + real mouse-API drag) |
| Create Form Schema + Seed via CSV Import | `creator-csv-import-schema.md` | Stand up Creator form schema + seed data fast via CSV "Import with data" (auto-fields from headers; choice fields get allow_other_choice) |
| Creator Widget Scalability | `creator-widget-scalability.md` | Keep a widget responsive at scale: debounce, event delegation, IMPLEMENTED lazy-load/infinite-scroll (per-column cap, `.board-wrap` scroll, position preserved); verified 545 records → 1,821 DOM nodes |
| Throttle Bulk / Parallel Writes | `creator-bulk-write-throttling.md` | Worker-pool (6) + exponential backoff for bulk/parallel writes; avoids ~HTTP 429 from ~12 concurrent addRecord after ~400 writes |
| Test a Widget from Outside (iframe eval) | `creator-widget-iframe-testing.md` | Drive/seed/measure a deployed widget from a browser session via element-scoped eval on its cross-origin iframe (load-test, render timing, synthetic drag) |
| Make a Creator App Single-Page (App Menu Builder) | `creator-single-page-app.md` | Trim the nav menu to one entry for a single-page/widget app without deleting any components or data |
| Delete Creator Components (Report / Page) Safely | `creator-delete-components.md` | Permanently delete a Creator report or page via the builder without breaking the data layer the app depends on |

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

## Meta / Process

Skills for turning session work into durable, reusable repository assets.

| Skill | File | Purpose |
|-------|------|---------|
| Knowledge Reflection Workflow (Repeatable) | `knowledge-reflection-workflow.md` | Repeatable process to turn a session's learnings into reusable repo assets (skills/agents/indexes) |

---

## Custom Agents

Pre-built subagents that bundle the right skills for a whole job. Delegate to one when a task matches its scope.

| Agent | File | Purpose |
|-------|------|---------|
| creator-widget-developer | `.claude/agents/creator-widget-developer.md` | Build, register, embed, and live-test a custom HTML/JS widget (Creator JS SDK v1, no server) inside a Zoho Creator app |
| creator-app-builder | `.claude/agents/creator-app-builder.md` | Scaffold or restructure a Creator app's components — create app, add forms/fields/lookups, add list/Kanban reports, add pages, arrange the menu/single-page layout, or remove redundant components |
| creator-app-documenter | `.claude/agents/creator-app-documenter.md` | When a user asks for a user guide / documentation / manual / PDF walkthrough of a Zoho Creator app |
| creator-qa-tester | `.claude/agents/creator-qa-tester.md` | Test/QA/validate a Zoho Creator app or form — exercise CRUD, probe field validations, monitor network for silent failures, and report bugs with repro/severity |

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
