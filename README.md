# Zoho Creator Automation Skills

A living knowledge base of granular agent skills for automating Zoho Creator using Playwright MCP and Zoho MCP tools. Built by Zoho Creator developers, for Zoho Creator developers.

## 🎯 What This Repo Solves

Zoho MCP provides excellent tools for **data operations** (records, forms, reports) but NOT for **UI/page customization**. These skills bridge that gap by showing agents how to use Playwright MCP to automate the Zoho Creator page builder and make visual changes.

## 🚀 Quick Start

### I Want to...

#### ...Set Up MCP in Zoho Code IDE
→ Read `skills/zoho-code-mcp-setup.md`  
→ Configure `.zcode/ai/mcp.json`, activate MCP extension, reload IDE

#### ...Automate Data Operations
→ Read `skills/zoho-mcp-basics.md` and `skills/zoho-mcp-data-operations.md`  
→ Use Zoho MCP tools directly (no browser automation needed)

#### ...Change Page Layout or UI
→ Read `skills/playwright-zoho-login.md`  
→ Follow the skill dependency chain → page builder → code editor → save

#### ...Edit HTML Snippets
→ Read `skills/playwright-code-editor.md` for CodeMirror editing patterns  
→ Includes complete find-and-replace workflow

#### ...Contribute New Skills
→ Read `CONTRIBUTING.md` for the complete contributor guide

## 📚 Skills Overview

### Zoho MCP Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `zoho-code-mcp-setup` | Configure MCP in Zoho Code IDE | First-time IDE setup |
| `zoho-mcp-basics` | List apps, forms, reports, pages | Getting app metadata |
| `zoho-mcp-data-operations` | Add, update, query, delete records | Working with data |

### Playwright MCP Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `playwright-zoho-login` | Navigate to Zoho Creator & handle login | Starting any browser automation |
| `playwright-zoho-page-builder` | Access HTML snippet editor | Editing page layouts |
| `playwright-code-editor` | Edit CodeMirror content programmatically | Making HTML/CSS/JS changes |
| `playwright-zoho-save` | Save changes & verify on live page | Completing UI changes |
| `playwright-network-monitoring` | Capture Zoho API calls | Debugging and learning |

### Development Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `github-identity-enforcement` | Ensure correct Git identity for commits | Before making any commits |

## 🔑 Key Learnings

### Session Persistence
- Playwright MCP **automatically persists** browser sessions in `.playwright-mcp/`
- Login cookies (including `zccpn` token) are saved between sessions
- Future agents automatically inherit active sessions - no re-login needed
- Session data is gitignored for security

### CodeMirror Editing
- HTML content lives in the **3rd CodeMirror instance** (index 2) in frame 0
- Use `cm.setSelection()` + `cm.replaceSelection()` for precise edits
- UI line numbers are 1-based; CodeMirror uses 0-based indexing
- Always call `cm.focus()` before making selections

### Save Flow (CRITICAL)
1. Edit content in CodeMirror
2. Click Save button in code editor popup
3. Wait 2 seconds
4. Press Escape to close popup
5. Wait 1 second
6. Click Done to exit page builder
7. Navigate to live page to verify changes

### Zoho Save API
When you save an HTML snippet, Zoho makes this API call:
```
POST /appbuilder/{account}/{app}/storeFunction
Body: appLinkName=&text={encoded HTML}&zohoruntime=&zccpn=&parentPageId=&htmlviewid=&linkName=&scripttype=htmlpagemodify
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Zoho Creator                         │
├──────────────────┬──────────────────────────────────────┤
│  Zoho MCP Tools  │     Playwright MCP Tools             │
│  (Data Only)     │     (UI Automation)                  │
├──────────────────┼──────────────────────────────────────┤
│ • Get Apps       │ • Navigate to page builder           │
│ • Get Forms      │ • Click HTML Snippet                 │
│ • Get Reports    │ • Open CodeMirror editor             │
│ • Add Records    │ • Edit code via CodeMirror API       │
│ • Update Records │ • Save via button click or API       │
│ • Delete Records │ • Verify on live page                │
│ • Get Fields     │                                      │
│ • Approvals      │                                      │
└──────────────────┴──────────────────────────────────────┘
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `AGENTS.md` | Quick reference for AI agents - read this first |
| `CONTRIBUTING.md` | Complete contributor guide for developers |
| `docs/zoho-creator-automation.md` | End-to-end automation workflows |
| `skills/*.md` | Individual granular skills |

## 🤝 Contributing

This is a **living repository** that grows with the Zoho Creator ecosystem. As Zoho Creator MCP adds new tools, skills are updated and new ones are added.

### How to Contribute
1. Read `CONTRIBUTING.md` for the complete guide
2. Create a feature branch for your changes
3. Add or update skill files with tested, working examples
4. Submit a PR for review

### What We Need
- ✅ New automation patterns and workflows
- ✅ Updates when Zoho Creator UI changes
- ✅ Simplifications when new MCP tools are released
- ✅ Troubleshooting guides for common issues
- ✅ Best practices and performance optimizations

## 🔄 MCP Evolution

Zoho Creator MCP is growing rapidly. As new tools are added:
- Some Playwright browser automation steps may become unnecessary
- Data operations become simpler
- New capabilities emerge

**We actively maintain this repo to:**
- Simplify skills when better tools are available
- Deprecate obsolete approaches
- Document transitions from old to new methods
- Keep everything current and tested

## ⚙️ Developer Setup

```bash
# Clone the repo
git clone https://github.com/aathira-r-19635/zoho-creator-skills.git
cd zoho-creator-skills

# Configure your corporate Git identity
git config --local user.name "your-github-username"
git config --local user.email "your.email@zohocorp.com"

# Verify setup
git config user.name
git config user.email
git remote -v
```

**IMPORTANT**: Only use your corporate Zoho GitHub account for commits. Personal accounts should not be used.

## 📊 Repo Structure

```
zoho-creator-skills/
├── AGENTS.md                    # Agent quick reference
├── CONTRIBUTING.md              # Contributor guide
├── README.md                    # This file
├── docs/
│   └── zoho-creator-automation.md  # End-to-end workflows
└── skills/
    ├── playwright-zoho-login.md      # Login & session management
    ├── playwright-zoho-page-builder.md  # Page builder navigation
    ├── playwright-code-editor.md     # CodeMirror editing
    ├── playwright-zoho-save.md       # Save & verify
    ├── playwright-network-monitoring.md  # API monitoring
    ├── zoho-code-mcp-setup.md        # Zoho Code IDE MCP configuration
    ├── zoho-mcp-basics.md            # Zoho MCP overview
    ├── zoho-mcp-data-operations.md   # Record operations
    └── github-identity-enforcement.md  # Git identity rules
```

## 💡 Tips for Success

1. **Start with AGENTS.md** - It has the quickest path to getting productive
2. **Read skills in order** - They build on each other
3. **Test everything** - Don't assume, verify each step
4. **Document what you learn** - Future developers (and agents) will thank you
5. **Keep it current** - Update skills when tools or UI changes

## 🆘 Troubleshooting

Having issues? Check these common solutions:

| Problem | Solution |
|---------|----------|
| Redirected to login | Session expired - login manually, then it persists |
| CodeMirror content empty | Wrong instance - use index 2 (3rd editor) |
| Click blocked by overlay | Remove `.zc-freezer` elements via JavaScript |
| Changes don't persist | Make sure Save was clicked before Escape |
| Can't find element | Capture fresh `browser_snapshot` |

For detailed troubleshooting, see `docs/zoho-creator-automation.md`.

## 📝 License & Usage

This repository is maintained by Zoho Creator developers for Zoho Creator developers. Use it, learn from it, and contribute back!

**Happy automating! 🚀**
