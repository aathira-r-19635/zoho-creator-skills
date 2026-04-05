# Zoho MCP Data Operations

## Purpose
Add, update, and retrieve records in Zoho Creator forms and reports.

## Finding Your Workspace Name (IMPORTANT)
- Do NOT use `ZohoCreator_getWorkspaces` — it fails with Code 2945
- Use `ZohoCreator_getApplications` with `{complete: true}` to find your `workspace_name`
- The `default_workspace` field in the response is your `account_owner_name`

## Add Records
```
ZohoCreator_addRecords:
  path_variables:
    account_owner_name: "workspace_name"
    app_link_name: "app_link_name"
    form_link_name: "form_link_name"
  body:
    data:
      - FieldName: "Value"
    result:
      message: true
```

## Get Records
```
ZohoCreator_getCreatorRecords:
  path_variables:
    account_owner_name: "workspace_name"
    app_link_name: "app_link_name"
    report_link_name: "report_link_name"
  query_params:
    criteria: 'FieldName == "Value"'  # Optional filter
```

## Update Records
```
ZohoCreator_updateRecords:
  path_variables:
    account_owner_name: "workspace_name"
    app_link_name: "app_link_name"
    report_link_name: "report_link_name"
  query_params:
    process_until_limit: false
  body:
    criteria: 'ID == "123"'
    data:
      FieldName: "New Value"
```

## Get Record by ID
```
ZohoCreator_getRecordByID:
  path_variables:
    record_ID: "record_id"
    report_link_name: "report_link_name"
```

## Tips
- Use `ZohoCreator_getFields` to discover field link names before adding records
- Criteria uses format: `"FieldLinkName == \"value\""`
