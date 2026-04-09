# Zoho MCP Session Closure

## When to Use
User says "close session", "wrap up", "save learnings", "push to main"

## Mandatory Workflow
→ **Follow `session-closure-workflow.md` completely**
→ ALL steps must be completed

## Zoho MCP Auth (Apr 2026)
- Use **"Authorize via Connection"** at `https://creator-XXXXXXX.zohomcp.com`
- Avoids Code 2945 "invalid oauthscope" errors
- **DO NOT use** `ZohoCreator_getWorkspaces` — fails with scope errors
- **USE** `ZohoCreator_getApplications` with `{complete: true}` to find workspace

## Skill Standards
- Max 100 lines per skill file
- Clear purpose statement
- One skill = one focused topic
- Use tables for tool/field references
- Include code examples and common error fixes

## Config Files (NOT source controlled)
- OAuth tokens: `~/.qwen/mcp-oauth-tokens.json`
- MCP config: `~/.qwen/settings.json`
