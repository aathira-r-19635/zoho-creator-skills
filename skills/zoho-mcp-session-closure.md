# Zoho MCP Session Closure & Handoff

## Purpose
Properly close a Zoho Creator automation session: save learnings, update docs, commit to main.

## When to Use
- User asks to "close session", "wrap up", "save learnings", "push to main"
- End of an automation task with new discoveries

## Session Closure Workflow

### 1. Identify Learnings to Save
Ask: **What did we discover/fix in this session?**
- New authentication flows
- API scope requirements
- Error patterns and solutions
- Configuration changes

### 2. Update/Create Skills
- Create new skill files (max 100 lines each)
- Update existing skills with new patterns
- Follow naming: `zoho-mcp-*.md` or `playwright-*.md`

### 3. Update Documentation
- `AGENTS.md` - Add new patterns/flows
- `docs/skills-index.md` - Add new skill entries
- `README.md` - Update overview if needed

### 4. Commit & Push to Main
```bash
cd /path/to/zoho-creator-skills
git add -A
git commit -m "docs: <what was learned and updated>"
git push origin main
```

## Zoho MCP Authentication (Updated Apr 2026)

### Authorization Mode: "Authorize via Connection"
- Configure at: `https://creator-XXXXXXX.zohomcp.com` → Connection tab
- Select **"Authorize via Connection"** (not "On Demand")
- Ensures all tools are pre-authorized server-side
- No client-side OAuth scope issues

### Configuration
- MCP Server URL in `~/.qwen/settings.json`:
  ```json
  {
    "mcpServers": {
      "zoho-creator": {
        "httpUrl": "https://creator-XXXXXXX.zohomcp.com/mcp/XXX/message"
      }
    }
  }
  ```
- OAuth tokens stored in `~/.qwen/mcp-oauth-tokens.json` (gitignored)

### Common Error: Invalid OAuth Scope (Code 2945)
**Fix:** Switch from "Authorization on Demand" → "Authorize via Connection"
- Go to Zoho MCP console → Connection → Select "Authorize via Connection"
- Native Connection shows "Connected" status
- All tools work without client-side OAuth issues

## Key Zoho MCP Tools
- `ZohoCreator_getApplications` - List apps (works ✅)
- `ZohoCreator_getForms` - List forms in app
- `ZohoCreator_getReports` - List reports in app
- `ZohoCreator_getRecordByID` - Get single record
- `ZohoCreator_addRecords` - Add records (up to 200)
- `ZohoCreator_updateRecords` - Bulk update records
- `ZohoCreator_deleteRecords` - Bulk delete records
- `ZohoCreator_getWorkspaces` - Requires workspace scope (may fail with Connection auth)

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
