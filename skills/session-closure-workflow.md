# Session Closure Workflow

## Trigger
User says: "close session", "be ready", "wrap up", "push to main"

## Mandatory Steps (ALL Required)

### 1. Document Learnings
- Review session, list new discoveries (patterns, fixes, URLs, error solutions)
- Identify which skills need updates

### 2. Update Skill Files
- Update relevant `*.md` files in `skills/`
- Create new skills if a new topic emerged (max 100 lines)
- Remove obsolete skills

### 3. Update Documentation
- Update `AGENTS.md` — new patterns, flows, troubleshooting
- Update `docs/skills-index.md` — add/remove skill entries
- Update `README.md` if overview changed

### 4. Verify .gitignore
Ensure coverage for:
- `.playwright-mcp/` (browser sessions)
- `*.png` (debug screenshots)
- `*.log` (debug logs)
- `.DS_Store`

### 5. Close Browser
- `browser_close`
- Confirm no open tabs

### 6. Verify Git Identity
```bash
git config user.name   # Corporate account
git config user.email  # @zohocorp.com
git remote -v          # Your fork
gh auth status         # Your account
```

### 7. Review & Commit
```bash
git status
git diff HEAD
git add -A
git commit -m "docs: <what was learned and updated>"
```

### 8. Push
```bash
git push origin main
git status   # Confirm clean
git log -1   # Confirm latest commit
```

## Quick Reference
```bash
browser_close
git config user.name && git config user.email && git remote -v && gh auth status
git status && git diff HEAD
git add -A && git commit -m "docs: <summary>" && git push origin main
git status && git log -1
```
