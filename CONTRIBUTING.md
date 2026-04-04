# Contributing to Zoho Creator Skills

Welcome! This repository is a **living knowledge base** for Zoho Creator automation skills. As Zoho Creator MCP tools evolve and new developers join, this repo grows richer and more useful.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Developer Setup](#developer-setup)
3. [Git Identity Requirements](#git-identity-requirements)
4. [How to Contribute](#how-to-contribute)
5. [Adding New Skills](#adding-new-skills)
6. [Updating Existing Skills](#updating-existing-skills)
7. [MCP Tool Evolution](#mcp-tool-evolution)
8. [Code Review Checklist](#code-review-checklist)
9. [Best Practices](#best-practices)

---

## Getting Started

This repository contains:
- **Agent Skills**: Step-by-step guides for automating Zoho Creator
- **Documentation**: End-to-end workflows and troubleshooting guides
- **Best Practices**: Patterns learned from real automation tasks

### Who Should Contribute?
- Zoho Creator developers
- Automation engineers
- Anyone who discovers new patterns or improves existing workflows

---

## Developer Setup

### 1. Clone the Repository
```bash
git clone https://github.com/aathira-r-19635/zoho-creator-skills.git
cd zoho-creator-skills
```

### 2. Configure Your Git Identity
**IMPORTANT**: This repository requires all commits to use your **corporate Zoho identity**. Personal GitHub accounts should NOT be used.

```bash
git config --local user.name "your-github-username"
git config --local user.email "your.email@zohocorp.com"
```

### 3. Verify Setup
```bash
# Check git config
git config user.name
git config user.email

# Check remote
git remote -v

# Check GitHub CLI (if installed)
gh auth status
```

### 4. Session Persistence (Optional)
If you use Playwright MCP for browser automation:
- Browser sessions are stored in `.playwright-mcp/` (gitignored)
- Login cookies persist between sessions
- No need to re-login every time

---

## Git Identity Requirements

### Rule
**Only use your corporate Zoho GitHub account** for commits in this repository.

### Verification
Before making commits:
```bash
git config user.name   # Your GitHub username
git config user.email  # Your @zohocorp.com email
```

### If Wrong Identity is Detected
1. Stop immediately
2. Fix git config:
   ```bash
   git config --local user.name "your-github-username"
   git config --local user.email "your.email@zohocorp.com"
   ```
3. Re-do any commits made with wrong identity

See `skills/github-identity-enforcement.md` for detailed procedures.

---

## How to Contribute

### 1. Create a Feature Branch
```bash
git checkout -b feature/add-new-skill
```

### 2. Make Your Changes
- Add new skill files in `skills/`
- Update documentation in `docs/`
- Update `AGENTS.md` if patterns change

### 3. Test Your Skills
- Verify the workflow works end-to-end
- Include complete, working examples
- Test edge cases and error scenarios

### 4. Commit with Clear Messages
```bash
git commit -m "Add skill: handling Zoho Creator approval workflows

- Document approval API usage patterns
- Include troubleshooting for common errors
- Add examples for bulk approval operations"
```

### 5. Push and Create PR
```bash
git push origin feature/add-new-skill
# Create PR via GitHub UI or:
gh pr create --title "Add approval workflow skills" --body "Description of changes"
```

---

## Adding New Skills

### Skill File Template
Create a new file in `skills/` with this structure:

```markdown
# Skill: [Descriptive Name]

## Purpose
What this skill accomplishes

## When to Use
Situations where this skill applies

## Prerequisites
- Required tools (Zoho MCP, Playwright MCP, etc.)
- Required setup or configuration

## Steps

### Step 1: [Description]
\`\`\`
[Code or commands]
\`\`\`

### Step 2: [Description]
\`\`\`
[Code or commands]
\`\`\`

## Key Refs/IDs to Find
- Elements to identify before proceeding
- How to find them

## Complete Working Example
Full, tested example that can be copied and used

## Troubleshooting
### Issue: [Description]
**Cause:** [Why this happens]
**Fix:** [How to resolve]

## Tips
- Best practices
- Gotchas to avoid
- Performance optimizations

## Related Skills
- Links to related skill files
```

### Skill Naming
- Use lowercase with hyphens: `zoho-mcp-approval-workflows.md`
- Be descriptive: what does this skill do?
- Group related skills with prefixes:
  - `playwright-*` - Browser automation
  - `zoho-mcp-*` - Data operations
  - `github-*` - Git/development workflows

---

## Updating Existing Skills

### When to Update
- Discovered a better/more reliable pattern
- Zoho Creator UI or API changed
- Found edge cases not covered
- New MCP tools make old steps obsolete

### How to Update
1. Read the existing skill completely
2. Make targeted, clear changes
3. Update any related documentation
4. Note what changed and why in commit message

### Deprecation
If a skill is no longer needed:
1. Add deprecation notice at top:
   ```markdown
   > **DEPRECATED**: This skill is no longer needed as of [date].
   > Use [new approach/tool] instead. See [link to new skill].
   > This file is kept for reference only.
   ```
2. Update `AGENTS.md` to point to new approach
3. File will be removed in future cleanup

---

## MCP Tool Evolution

### Zoho Creator MCP is Growing
New tools are added regularly. As the MCP ecosystem grows:
- Some manual browser automation (Playwright) may become unnecessary
- Data operations become simpler
- New capabilities emerge

### How to Handle Evolution
1. **When new MCP tools are released:**
   - Test them against existing skills
   - Identify which skills can be simplified
   - Document the new approach

2. **When Playwright steps become obsolete:**
   - Update the skill to use new MCP tool
   - Keep Playwright method as "fallback" if needed
   - Mark old approach as deprecated

3. **Track MCP Changes:**
   - Note MCP version/tool availability in docs
   - Include date when skill was last verified
   - Link to MCP changelog if available

### Example Transition
```markdown
## Approach 1: Using Zoho MCP (Recommended - as of April 2026)
[New MCP-based steps]

## Approach 2: Using Playwright MCP (Legacy)
[Old browser automation steps]
> Note: This approach is still valid but requires more steps.
```

---

## Code Review Checklist

Before approving a PR, verify:

### Content Quality
- [ ] Skill has clear purpose and description
- [ ] Steps are complete and reproducible
- [ ] Examples are tested and working
- [ ] Troubleshooting covers common issues

### Documentation Standards
- [ ] Follows skill file template
- [ ] Code blocks have proper syntax highlighting
- [ ] Links to related skills/docs are included
- [ ] Consistent formatting and style

### Git & Identity
- [ ] Commits use correct corporate identity
- [ ] Commit messages are clear and descriptive
- [ ] No sensitive data (tokens, passwords) committed
- [ ] `.gitignore` is respected (no session data, logs, etc.)

### Integration
- [ ] Related skills are updated if needed
- [ ] `AGENTS.md` references new/changed skills
- [ ] No duplicate or conflicting information

---

## Best Practices

### Writing Skills
1. **Be Specific**: Include exact steps, not vague descriptions
2. **Test Everything**: Every example should be tested end-to-end
3. **Anticipate Errors**: Document what can go wrong and how to fix it
4. **Keep It Current**: Update skills when tools or UI changes
5. **Cross-Reference**: Link to related skills for context

### Working with Multiple Developers
1. **Communicate Changes**: Use PRs, not direct pushes to main
2. **Review Thoroughly**: Catch errors before they propagate
3. **Respect Conventions**: Follow existing patterns and style
4. **Document Decisions**: Explain why, not just what
5. **Keep Main Stable**: Never break working skills on main

### Repo Hygiene
1. **Regular Cleanups**: Remove deprecated skills when appropriate
2. **Update TOC**: Keep table of contents in sync
3. **Verify Links**: Check that internal links work
4. **Test Examples**: Periodically re-test all skill examples
5. **Monitor MCP Changes**: Stay updated on new Zoho Creator MCP tools

---

## Questions?

- **Skill-specific issues**: Check related docs and troubleshooting section
- **General questions**: Open an issue in the repo
- **Urgent blockers**: Reach out to repo maintainers

---

## License & Usage

This repository is maintained by Zoho Creator developers for Zoho Creator developers. Feel free to use, modify, and contribute!

**Happy automating! 🚀**
