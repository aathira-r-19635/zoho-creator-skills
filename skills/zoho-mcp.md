# Zoho MCP Tools

## Authentication
- Use **"Authorize via Connection"** mode at `https://creator-XXXXXXX.zohomcp.com` → Connection tab
- Avoids Code 2945 "invalid oauthscope" errors
- All tools pre-authorized server-side

## Workspace Discovery (CRITICAL)
- **DO NOT use** `ZohoCreator_getWorkspaces` — fails with Code 2945
- **USE** `ZohoCreator_getApplications` with `{complete: true}` instead
- Extract `workspace_name` (=`account_owner_name`) from response

## Quick Reference

### List & Discover
| Tool | Purpose |
|------|---------|
| `ZohoCreator_getApplications` | List all apps (use `complete: true`) |
| `ZohoCreator_getForms` | List forms in an app |
| `ZohoCreator_getReports` | List reports in an app |
| `ZohoCreator_getFormMetadata` | Get form fields + buttons |

### Records
| Tool | Purpose |
|------|---------|
| `ZohoCreator_getCreatorRecords` | Get records (up to 200, use `record_cursor` for pagination) |
| `ZohoCreator_getRecordByID` | Get single record |
| `ZohoCreator_addRecords` | Add records (up to 200) |
| `ZohoCreator_updateRecordByID` | Update single record by ID |
| `ZohoCreator_updateRecords` | Bulk update by criteria |
| `ZohoCreator_deleteRecordByID` | Delete single record |
| `ZohoCreator_deleteRecords` | Bulk delete by criteria |

### Lookup Field Data Format
- **Single-select:** `{"FieldName": "record_id"}`
- **Multi-select:** `{"FieldName": ["id1", "id2"]}`

### Criteria Syntax
```
ZohoCreator_getCreatorRecords:
  query_params:
    criteria: 'FieldLinkName == "Value"'  # string fields
    criteria: 'NumericField == 42'        # numeric fields
```

## Typical Workflow
```
1. ZohoCreator_getApplications {complete: true} → find workspace + app link_name
2. ZohoCreator_getForms → find form link_name
3. ZohoCreator_getReports → find report link_name
4. ZohoCreator_getFormMetadata → discover field link names
5. ZohoCreator_getCreatorRecords → fetch data
6. ZohoCreator_updateRecordByID → update records
```
