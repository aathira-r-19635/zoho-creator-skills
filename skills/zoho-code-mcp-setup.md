# Zoho Code IDE — MCP Setup

## Purpose
Configure the Zoho Creator MCP server connection inside Zoho Code IDE so agents can use `ZohoCreator_*` tools.

## Prerequisites
- A Zoho Creator MCP endpoint URL (from `https://creator-XXXXXXX.zohomcp.com`)
- The **MCP Manager and Workflow AI Agent** extension activated in the IDE

## Setup Steps

### 1. Create MCP Config File
**Path:** `.zcode/ai/mcp.json` (in project root)

```json
{
  "mcpServers": {
    "ZohoCreator": {
      "type": "sse",
      "url": "https://creator-XXXXXXX.zohomcp.com/mcp/<AUTH_TOKEN>/message"
    }
  }
}
```

- **`type`**: Must be `"sse"` (Server-Sent Events) — this is the transport Zoho MCP uses
- **`url`**: Your full MCP endpoint including the auth token path segment

### 2. Gitignore the Config (CRITICAL)
The MCP URL contains an embedded auth token. **Never commit it.**

Add to `.gitignore`:
```
.zcode/ai/mcp.json
```

Verify with:
```bash
git check-ignore -v .zcode/ai/mcp.json
# Should output: .gitignore:X:.zcode/ai/mcp.json
```

### 3. Activate the MCP Extension
The **MCP Manager and Workflow AI Agent** (`nicepkg.aide-mcp-manager`) must be active.

- Check via IDE Extensions panel
- Or activate programmatically: `activateExtension("nicepkg.aide-mcp-manager")`
- After activation, **reload the IDE window** for the MCP server to connect

### 4. Verify Connection
After reload, test with:
```
ZohoCreator_getApplications({ "complete": true })
```

If tools aren't available, check:
- MCP config JSON is valid
- Extension is active
- URL is correct and accessible

## Config File Location
| IDE | MCP Config Path |
|-----|----------------|
| Zoho Code IDE | `.zcode/ai/mcp.json` (project-level) |
| Qwen/other | `~/.qwen/settings.json` (user-level) |

## Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
| MCP tools not available | Extension not active | Activate `nicepkg.aide-mcp-manager`, reload IDE |
| Connection refused | Wrong URL or token expired | Regenerate token at MCP console |
| Code 2945 | OAuth scope issue | Use "Authorize via Connection" mode at MCP console |

## Security Notes
- The MCP URL embeds an auth token (e.g., `/mcp/6037df.../message`)
- This token grants full access to your Creator data — treat it like a password
- Always gitignore `.zcode/ai/mcp.json`
- Rotate tokens periodically at the MCP console
