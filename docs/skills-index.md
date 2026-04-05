# Skills Index

Complete index of all skills in this repository, organized by category.

## Quick Reference

### Need to...
- **Login to Zoho Creator?** → `playwright-zoho-login.md`
- **Work with records?** → `zoho-mcp-data-operations.md`
- **Edit page HTML?** → `playwright-code-editor.md`
- **Make a commit?** → `github-identity-enforcement.md`
- **Understand the full workflow?** → `../docs/zoho-creator-automation.md`

---

## Playwright MCP Skills (Browser Automation)

### Core Skills
| Skill | File | Purpose |
|-------|------|---------|
| Login & Navigation | `playwright-zoho-login.md` | Navigate to Zoho Creator, handle login, session persistence |
| Page Builder | `playwright-zoho-page-builder.md` | Access HTML snippet components in page builder |
| Code Editor | `playwright-code-editor.md` | Edit CodeMirror content programmatically |
| Save & Verify | `playwright-zoho-save.md` | Save changes and verify on live page |

### Supporting Skills
| Skill | File | Purpose |
|-------|------|---------|
| Network Monitoring | `playwright-network-monitoring.md` | Capture and analyze Zoho API calls |
| HTML Snippet Syntax | `html-snippet-syntax.md` | Deluge syntax reference for HTML snippets |

### Skill Dependencies
```
playwright-zoho-login
    ↓
playwright-zoho-page-builder
    ↓
playwright-code-editor
    ↓
playwright-zoho-save
```

**Reference:** `html-snippet-syntax.md` - Consult when writing HTML snippet content

---

## Zoho MCP Skills (Data Operations)

| Skill | File | Purpose |
|-------|------|---------|
| Basics | `zoho-mcp-basics.md` | List apps, forms, reports, pages, auth setup |
| Data Operations | `zoho-mcp-data-operations.md` | Add, update, query, delete records |
| Session Closure | `zoho-mcp-session-closure.md` | Close session, save learnings, push to main |
| Closure Workflow | `session-closure-workflow.md` | **MANDATORY** 10-step checklist for session closure |

---

## Development Skills

| Skill | File | Purpose |
|-------|------|---------|
| Git Identity | `github-identity-enforcement.md` | Ensure correct corporate Git identity |

---

## Documentation

| Document | Path | Purpose |
|----------|------|---------|
| Agent Instructions | `AGENTS.md` | Quick reference for AI agents |
| Automation Guide | `docs/zoho-creator-automation.md` | End-to-end workflows |
| Contributing Guide | `CONTRIBUTING.md` | How to contribute |
| README | `README.md` | Repository overview |

---

## Skill Details

### playwright-zoho-login.md
**What it covers:**
- Navigating to Zoho Creator apps
- Handling login redirects
- Session persistence via `.playwright-mcp/`
- When manual login is needed vs automatic

**Key concepts:**
- Browser cookies persist between sessions
- `zccpn` token stored in cookies
- Session expires after hours/days
- Future agents inherit active sessions

---

### playwright-zoho-page-builder.md
**What it covers:**
- Entering edit mode
- Selecting HTML Snippet components
- Opening code editor via Configure button
- Save sequence and verification
- URL formats for page builder and live pages

**Key concepts:**
- Page builder URL: `/appbuilder/{account}/{app}/pagebuilder/{page}/edit`
- Live page URLs: `#Page:{page}` for non-menu pages, `#{page}` for menu pages
- Always snapshot before clicking
- Wait 2-3 seconds after each action
- Use dynamic refs, not hardcoded IDs

---

### playwright-code-editor.md
**What it covers:**
- Finding CodeMirror instances across all frames
- Locating specific text
- Selecting and replacing text
- Setting entire content via `cm.setValue()`
- Verification of changes

**Key concepts:**
- **Recommended**: Iterate all frames to find CodeMirror by content match
- HTML snippet editor opens in popup (`zctemplate-dialog`), CodeMirror in main frame
- 0-based indexing (UI line 42 = index 41)
- Always focus before editing
- Use `setSelection()` + `replaceSelection()` for partial edits

---

### playwright-zoho-save.md
**What it covers:**
- Save button interaction
- Closing editor popups
- Exiting page builder
- Verifying on live page

**Key concepts:**
- Save → Wait → Escape → Wait → Done
- Always verify on live page
- Handle overlay elements if they block clicks

---

### playwright-network-monitoring.md
**What it covers:**
- Capturing API calls
- Analyzing request/response data
- Learning Zoho's internal APIs

**Key concepts:**
- Use before performing actions
- Extract IDs and tokens
- Understand save API endpoint

---

### html-snippet-syntax.md
**What it covers:**
- Deluge tag syntax (`<%{ }%>` and `<%= %>`)
- Common patterns for HTML snippets
- Conditional rendering and loops
- Code editor workflow
- Troubleshooting snippet issues

**Key concepts:**
- `<%{ }%>` for logic execution (no output)
- `<%= %>` for value output
- Server-side execution before page render
- Reference Zoho help docs for complex patterns

---

### zoho-mcp-basics.md
**What it covers:**
- Listing applications
- Getting form metadata
- Getting report metadata
- Understanding app structure

**When to use:**
- Before data operations
- To discover available forms/reports
- To understand app layout

---

### zoho-mcp-data-operations.md
**What it covers:**
- Adding records to forms
- Updating existing records
- Querying reports with criteria
- Deleting records

**When to use:**
- Working with data (not UI)
- Bulk operations
- Automated data migrations

---

### zoho-mcp-session-closure.md
**What it covers:**
- Session closure workflow overview
- Saving session learnings as skills
- Zoho MCP authentication setup
- Common OAuth errors and fixes
- Commit and push to main

**When to use:**
- User asks to "close session" or "save learnings"
- End of automation task with new discoveries

**Key concepts:**
- "Authorize via Connection" > "On Demand"
- Use getApplications for workspace discovery
- Max 100 lines per skill file

---

### session-closure-workflow.md
**What it covers:**
- **MANDATORY 10-step checklist** for session closure
- Trigger words that activate this workflow
- Complete step-by-step process from learnings to push
- Quick reference bash script

**When to use:**
- User says "close session", "be ready", "wrap up", "done for today"
- **Every single time** - no exceptions

**Key concepts:**
- ALL 10 steps must be completed
- Document learnings → Update skills → Update docs → Verify gitignore
- Close browser → Verify identity → Review → Commit → Push → Final check
- Never skip steps, never commit sensitive files

---

### github-identity-enforcement.md
**What it covers:**
- Setting correct Git identity
- Verifying identity before commits
- Correcting wrong identity in history
- GitHub CLI authentication

**Key concepts:**
- Only corporate Zoho accounts allowed
- `--local` flag, not `--global`
- Identity verified before every commit

---

## Finding the Right Skill

### By Task

| Task | Skill to Read |
|------|---------------|
| Login to Zoho Creator | `playwright-zoho-login.md` |
| Edit HTML on a page | `playwright-zoho-page-builder.md` → `playwright-code-editor.md` |
| Add/update records | `zoho-mcp-data-operations.md` |
| Find form fields | `zoho-mcp-basics.md` |
| Debug API calls | `playwright-network-monitoring.md` |
| Make a Git commit | `github-identity-enforcement.md` |

### By Tool

| Tool | Skills |
|------|--------|
| Playwright MCP | All `playwright-*.md` files |
| Zoho MCP | All `zoho-mcp-*.md` files |
| Git/GitHub | `github-identity-enforcement.md` |

---

## Learning Path

### For New Developers/Agents
1. Start with `AGENTS.md` for quick overview
2. Read `playwright-zoho-login.md` for authentication
3. Follow the dependency chain for UI changes
4. Read `zoho-mcp-data-operations.md` for data work

### For Contributors
1. Read `CONTRIBUTING.md` completely
2. Study existing skills for patterns
3. Create new skills following the template
4. Submit PR for review

### For Maintainers
1. Review PRs against checklist in `CONTRIBUTING.md`
2. Test skill examples manually
3. Keep docs in sync with code
4. Deprecate obsolete skills as MCP evolves
