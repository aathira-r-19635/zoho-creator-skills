# GitHub Identity Enforcement

## Purpose
Ensure all git operations (commits, pushes, PRs) in this repository use the correct GitHub account.

## Rule
**This repository MUST ONLY use the GitHub account: `https://github.com/aathira-r-19635`**

## Configuration

### Git Identity (Local to this machine)
```bash
# Set in .git/config (local, not source controlled)
git config --local user.name "aathira-r-19635"
git config --local user.email "aathira.r@zohocorp.com"
```

### Remote Configuration
```bash
# Verify remote points to correct repo
git remote -v
# Should show: https://github.com/aathira-r-19635/zoho-creator-skills.git
```

### GitHub CLI (gh) Authentication
```bash
# Verify gh CLI is using correct account
gh auth status
# Should show: "Logged in to github.com account aathira-r-19635"
```

## Verification Steps

### Before Making Commits
1. Check git identity:
   ```bash
   git config user.name   # Should be: aathira-r-19635
   git config user.email  # Should be: aathira.r@zohocorp.com
   ```
2. Verify remote:
   ```bash
   git remote -v
   ```
3. Verify gh auth:
   ```bash
   gh auth status
   ```

### After Making Commits
1. Check commit author:
   ```bash
   git log -1 --format="%an <%ae>"
   ```
2. Should show: `aathira-r-19635 <aathira.r@zohocorp.com>`

## Enforcement

### If Wrong Identity is Detected
1. Stop any pending operations
2. Reset git config:
   ```bash
   git config --local user.name "aathira-r-19635"
   git config --local user.email "aathira.r@zohocorp.com"
   ```
3. Verify gh auth:
   ```bash
   gh auth login --hostname github.com
   ```
4. Re-do any commits made with wrong identity

### Correcting Historical Commits
If commits were made with wrong identity, use `git filter-branch` to rewrite history:
```bash
git filter-branch -f --env-filter '
export GIT_AUTHOR_NAME="aathira-r-19635"
export GIT_AUTHOR_EMAIL="aathira.r@zohocorp.com"
export GIT_COMMITTER_NAME="aathira-r-19635"
export GIT_COMMITTER_EMAIL="aathira.r@zohocorp.com"
' -- --all

# Clean up old refs
git for-each-ref --format="%(refname)" refs/original/ | while read ref; do git update-ref -d "$ref"; done
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (if already pushed)
git push origin main --force-with-lease
```

## Important Notes
- This is a **machine-specific** configuration
- Other developers will have their own setups
- **DO NOT source control** `.git/config` or `gh` auth tokens
- The identity enforcement is local to this machine/user
- Always use `--local` flag for git config (not `--global`)
