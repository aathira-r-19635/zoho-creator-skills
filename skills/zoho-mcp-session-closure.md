# Zoho MCP Session Closure & Handoff

## Purpose
Properly close a Zoho Creator automation session: save learnings, update docs, verify gitignore, commit to main.

## IMPORTANT: Always Use the Mandatory Workflow
**When user says "close session", "be ready", "wrap up":**
→ **Follow `session-closure-workflow.md` completely**
→ This file provides context; the workflow file is the mandatory checklist
→ ALL 10 steps in `session-closure-workflow.md` must be completed

## When to Use
- User asks to "close session", "wrap up", "save learnings", "push to main"
- End of an automation task with new discoveries

## Session Closure Workflow (See `session-closure-workflow.md` for full checklist)

### 1. Identify Learnings to Save
Ask: **What did we discover/fix in this session?**
- New authentication flows
- API scope requirements
- Error patterns and solutions
- Configuration changes
- UI automation patterns (CodeMirror editing, page URLs)

### 2. Update/Create Skills
- Create new skill files (max 100 lines each)
- Update existing skills with new patterns
- Follow naming: `zoho-mcp-*.md` or `playwright-*.md`

### 3. Update Documentation
- `AGENTS.md` - Add new patterns/flows
- `docs/skills-index.md` - Add new skill entries
- `docs/zoho-creator-automation.md` - Update end-to-end workflows
- `README.md` - Update overview if needed

### 4. Verify .gitignore (CRITICAL)
Check that sensitive/temp files are properly ignored:
- OAuth tokens: `mcp-oauth-tokens.json`, `oauth_creds.json`
- Debug logs: `.qwen/debug/*.txt`, `.qwen/tmp/**`
- Browser session: `.playwright-mcp/`
- Debug screenshots: `*.png` (all PNG screenshots)
- OS files: `.DS_Store`, `Thumbs.db`
- IDE configs: `.vscode/`, `.idea/`

Review `.gitignore` and add any missing patterns.
**Never commit** tokens, credentials, or debug files.

### 5. Check for Untracked Files
```bash
git status  # Review all untracked files
```
- Add new skill files and docs to git
- Leave sensitive files untracked (verify in .gitignore)

### 6. Commit & Push to Main
```bash
cd /path/to/zoho-creator-skills
git add -A
git commit -m "docs: <what was learned and updated>"
git push origin main
```
- Verify git identity before commit
- Write clear, descriptive commit message

## Zoho MCP Authentication (Updated Apr 2026)

### Authorization Mode: "Authorize via Connection"
- Configure at: `https://creator-XXXXXXX.zohomcp.com` → Connection tab
- Select **"Authorize via Connection"** (not "On Demand")
- All tools pre-authorized server-side, no OAuth scope issues
- Fix for error Code 2945 (invalid oauthscope)

### Configuration
- MCP URL in `~/.qwen/settings.json` (httpUrl field)
- OAuth tokens in `~/.qwen/mcp-oauth-tokens.json` (gitignored)

## Key Zoho MCP Tools
- `ZohoCreator_getApplications` - List apps (works ✅)
- `ZohoCreator_getForms/Reports/Pages` - List app components
- `ZohoCreator_getRecordByID` - Get single record
- `ZohoCreator_addRecords` - Add records (up to 200)
- `ZohoCreator_updateRecords/deleteRecords` - Bulk operations
- `ZohoCreator_getWorkspaces` - May fail with scope errors

### Workspace Discovery
- `getWorkspaces` may fail with scope errors
- Use `getApplications` instead - each app returns `workspace_name`
- Extract unique workspace names from applications list

## Skill Standards
- Max 100 lines per skill file
- Clear purpose statement
- Usage pattern with code examples
- Common errors and fixes
- Keep it focused - one skill = one topic
