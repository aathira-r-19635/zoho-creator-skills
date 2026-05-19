# Open Creator App

## Purpose
Full workflow to open any Zoho Creator app via MCP (data) and Playwright (browser) in one session.

## Trigger
User says: "open the creator app", "open [app name]", "launch creator", "open app in browser"

## Account Details
- **Email:** aathira.r+j1@zohotest.com
- **Password:** stored in local memory (do not commit to repo)
- **Workspace:** `achyutmenont0_zohotest`
- **Default App:** CMD (`link_name: cmd`)

## Step 1 — Discover Apps via MCP
```
ZohoCreator_getApplications { complete: false }
→ Returns list of apps with link_name, application_name, workspace_name
→ Ask user which app to open if not specified
```

## Step 2 — Get App Contents via MCP (parallel)
```
ZohoCreator_getForms    { account_owner_name, app_link_name }
ZohoCreator_getReports  { account_owner_name, app_link_name }
→ Run both in parallel to get forms + reports
```

## Step 3 — Open in Browser via Playwright
```
browser_navigate: https://creatorapp.zoho.com/{account_owner_name}/{app_link_name}
```

## Step 4 — Handle Login (if redirected to accounts.zoho.com)
```
browser_fill_form: #login_id → aathira.r+j1@zohotest.com
browser_click: #nextbtn
browser_fill_form: #password → [from memory]
browser_click: #nextbtn
```

## Step 5 — Handle Account Review Prompt (if shown)
```
browser_snapshot → look for link[ref=eXX] "Confirm"
browser_click: link "Confirm"   (or use /announcement/profile-review/next?status=2)
→ Redirects to the app
```

## Step 6 — Verify App Loaded
```
browser_take_screenshot → confirm app title and sidebar visible
→ Report app name and default page shown
```

## URL Patterns
| Type | URL |
|------|-----|
| Live app | `https://creatorapp.zoho.com/{account}/{app}` |
| Specific page | `https://creatorapp.zoho.com/{account}/{app}/#Page:{page}` |
| Form builder | `https://creator.zoho.com/appbuilder/{account}/{app}/formbuilder/{form}/edit` |
| Page builder | `https://creator.zoho.com/appbuilder/{account}/{app}/pagebuilder/{page}/edit` |

## Known Quirks
- Login redirects to `accounts.zoho.com` — use `#nextbtn` for both email and password submit
- After password, a **"Review your account details"** prompt may appear — click **Confirm** (`/announcement/profile-review/next?status=2`)
- Session cookies persist in `.playwright-mcp/` — re-login only needed when session expires
- App lands on last-visited page (e.g. `Machine_Route_Planning` for CMD)

## CMD App Quick Reference
- **App link name:** `cmd`
- **Key forms:** Job Card, Cylinder Register, Machine Master, Inventory Shelf
- **Key reports:** All Job Cards, All Cylinder Registers, Cylinder Routing Report
- **Default landing page:** Machine Route Planning
