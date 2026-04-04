# Zoho MCP Basics

## Purpose
List and explore Zoho Creator applications, forms, reports, and pages using the Zoho MCP tools.

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

## Limitations
- Zoho MCP does NOT support page layout/UI customization
- Use Playwright MCP for visual/page builder changes (see `playwright-zoho-page-builder`)
