# Session Closure: Be Ready to Close

## Purpose
Complete checklist of ALL steps required when user says "close session", "be ready", "wrap up", or similar.

## Trigger Words
- "close session"
- "be ready to close session"
- "wrap up"
- "save learnings"
- "push to main"
- "done for today"

## Mandatory Checklist (ALL Steps Required)

### Step 1: Identify and Document Learnings
- [ ] Review the full session conversation
- [ ] List all new discoveries: patterns, fixes, URLs, IDs, error solutions
- [ ] Identify which existing skills need updates

### Step 2: Update Skill Files
- [ ] Update relevant `playwright-*.md` files with new patterns
- [ ] Update relevant `zoho-mcp-*.md` files if MCP tools changed
- [ ] Create new skill files if a new topic emerged (max 100 lines each)
- [ ] Update `skills/zoho-mcp-session-closure.md` if the closure workflow itself changed

### Step 3: Update Documentation
- [ ] Update `AGENTS.md` - Add new patterns, flows, troubleshooting
- [ ] Update `docs/skills-index.md` - Add new skill entries or update descriptions
- [ ] Update `docs/zoho-creator-automation.md` - Update end-to-end workflows
- [ ] Update `README.md` if overview changed

### Step 4: Verify .gitignore
- [ ] Check `.gitignore` covers all sensitive/temp files:
  - Browser session: `.playwright-mcp/`
  - OAuth tokens: `mcp-oauth-tokens.json`, `oauth_creds.json`
  - Debug screenshots: `*.png`
  - Debug logs: `*.log`, `snapshot.md`
  - OS files: `.DS_Store`, `Thumbs.db`
  - IDE configs: `.vscode/`, `.idea/`
  - Node modules: `node_modules/`
- [ ] Add missing patterns if needed

### Step 5: Close Browser Session
- [ ] Close the Playwright browser: `browser_close`
- [ ] Confirm browser is closed (no open tabs)
- [ ] Note: session cookies persist in `.playwright-mcp/`

### Step 6: Verify Git Identity
- [ ] Run: `git config user.name` (must be corporate account)
- [ ] Run: `git config user.email` (must be @zohocorp.com)
- [ ] Run: `git remote -v` (must be your fork)
- [ ] Run: `gh auth status` (must show your account)
- [ ] Fix identity if wrong (see `skills/github-identity-enforcement.md`)

### Step 7: Review Changes
- [ ] Run: `git status` - review all modified files
- [ ] Run: `git diff HEAD` - review all changes
- [ ] Ensure no sensitive files are staged

### Step 8: Commit
- [ ] Run: `git add -A`
- [ ] Write descriptive commit message covering:
  - What was learned
  - Which skills/docs were updated
  - New patterns added
- [ ] Run: `git commit -m "<message>"`

### Step 9: Push to Main
- [ ] Run: `git push origin main`
- [ ] Verify push succeeded

### Step 10: Final Verification
- [ ] Run: `git status` - confirm "nothing to commit, working tree clean"
- [ ] Run: `git log -1 --oneline` - confirm latest commit is yours
- [ ] Report completion to user

## Quick Reference Script

```bash
# Step 5: Close browser
browser_close

# Step 6: Verify identity
git config user.name
git config user.email
git remote -v
gh auth status

# Step 7: Review
git status
git diff HEAD

# Step 8-9: Commit and push
git add -A
git commit -m "docs: <what was learned and updated>"
git push origin main

# Step 10: Final check
git status
git log -1 --oneline
```

## Important Notes
- **DO NOT skip any step** - every session closure must be complete
- **DO NOT commit sensitive files** - verify .gitignore before staging
- **DO NOT push without reviewing changes** - always read the diff
- **Identity must be verified** before every commit
- **Browser must be closed** before committing session learnings
- **All modified files must be reviewed** - skills, docs, AGENTS.md
