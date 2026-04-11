# Zoho MCP Basics

## Purpose
List and explore Zoho Creator applications, forms, reports, and pages using the Zoho MCP tools.

## Authentication Setup (IMPORTANT - Apr 2026)
- Use **"Authorize via Connection"** mode in Zoho MCP console
- Config at: `https://creator-XXXXXXX.zohomcp.com` → Connection tab
- Avoids client-side OAuth scope errors (Code 2945)
- All tools pre-authorized server-side

## Available Tools
- `ZohoCreator_getApplications` - List all apps (use `complete: true`)
- `ZohoCreator_getForms` - List forms in an app
- `ZohoCreator_getReports` - List reports in an app
- `ZohoCreator_getPages` - List pages in an app
- `ZohoCreator_getSections` - List sections in an app
- `ZohoCreator_getFields` - Get form field metadata

## Usage Pattern
```
1. Call ZohoCreator_getApplications with {complete: true}
2. Find your app's link_name
3. Use ZohoCreator_getForms/Reports/Pages with:
   - account_owner_name: your workspace name
   - app_link_name: your app's link_name
```

## Key Fields
- `link_name` - The internal identifier used in all API calls
- `account_owner_name` - Your Zoho workspace name (e.g., `achyutmenont0_zohotest`)

## Workspace Discovery (IMPORTANT - Apr 2026)
- `ZohoCreator_getWorkspaces` **FAILS with Code 2945** ("invalid oauthscope") — do NOT use this tool
- This is a known Zoho MCP server-side issue; the tool lacks proper OAuth scopes
- **Correct approach:** Use `ZohoCreator_getApplications` with `{complete: true}`
  - Each application includes `workspace_name` in its response
  - Extract unique workspace names from the list
  - The response also includes `is_super_admin` and `default_workspace` fields
  - Example extraction:
    ```javascript
    // From getApplications response:
    const workspaces = [...new Set(apps.map(a => a.workspace_name))];
    // Returns: ["achyutmenont0_zohotest"]
    ```
- Use the `default_workspace` value as your `account_owner_name` in all subsequent API calls

## IDE-Specific Setup
- **Zoho Code IDE**: Configure in `.zcode/ai/mcp.json` — see `zoho-code-mcp-setup.md`
- **Qwen/other**: Configure in `~/.qwen/settings.json`

## Limitations
- Zoho MCP does NOT support page layout/UI customization
- Use Playwright MCP for visual/page builder changes (see `playwright-zoho-page-builder`)
