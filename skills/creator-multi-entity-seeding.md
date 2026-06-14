# Seed Multiple Related Entities via Parallel CSV Import

Use this when: you need to populate 3+ interdependent Creator forms (Project ↔ Task ↔ Resource ↔ Time_Log, etc.) and want to avoid manual field-by-field setup.

## Why
Seven related entities with ~50 rows total would take hours to create by hand in the form builder. CSV import creates all forms + reports + rows in ~3 minutes (one CSV per form, ~30s each).

## Prerequisites
Before step 1, confirm:
1. Workspace and app exist (e.g., atlas app in achyutmenont0_zohotest).
2. Seven CSVs are ready in `seed/` directory with correct structure.
3. FKs use stable code columns (e.g., `Project_Code`, `Member_ID` as text), NOT auto-increment IDs (those change on import, breaking links).

## Steps

1. **Order CSVs by dependency** (no auto-foreign-key enforcement in Creator, but logical order helps):
   - Parent first: `Project.csv`
   - Leaf entities: `Resource.csv`, `Milestone.csv`, `Tag.csv`
   - Junction/dependent: `Time_Log.csv`, `Allocation.csv`
   - Polymorphic: `Comment.csv`, `Attachment.csv`

2. **For each CSV, follow creator-csv-import-schema.md Step 1–6.**
   - Import with data → Local storage → select CSV → fix field types → Create.
   - Key: set all `*_ID`, `*_Code` columns to **Single Line** in the preview (prevents precision loss).

3. **Verify cross-references after all forms exist:**
   - Open `Project_Report` → check `Project_Code` values match seed (ATL-001, ATL-002).
   - Open `Time_Log_Report` → check `Task_ID` and `Member_ID` are valid text tokens (RES001, etc.), not numbers.
   - Spot-check 2–3 relationships per entity.

4. **Test widget hydration:**
   - Refresh the Atlas widget page.
   - Open console: `window.Atlas.S.timeLogs.length` should show row count.
   - Check an index: `window.Atlas.S.resourceById['RES001']` should return the Resource record.

## CSV Structure Template (per form)

```
Field_Name_1,Field_Name_2,FK_Field_ID,Date_Field,Numeric_Field
"value1","value2","RES001","01-Jun-2026",8.5
"value2","value3","RES002","02-Jun-2026",4.0
```

- Headers = exact field link_names (case-sensitive, no spaces except in values).
- FKs = text tokens matching parent form's code column (e.g., `RES001` links to Resource with `Member_ID=RES001`).
- Dates = `dd-MMM-yyyy` format (non-negotiable; other formats silent-fail).
- Numbers = plain digits (no $ or % symbols).

## If You See X → Do Y

- **18-digit ID truncates to ~15 digits on import:** Set that column to Single Line in step 2 preview, re-import.
- **Date column shows as text after import:** Check CSV format was `dd-MMM-yyyy`; if correct, fix field type in form builder after import.
- **Widget doesn't find Time_Log records:** Check `Time_Log_Report` exists (creator.zoho.com/appbuilder/.../atlas/), and Task_ID values are valid Task IDs (not Task codes).
- **Circular FK references (A → B, B → A):** CSV import skips the integrity check; both columns will be text IDs, joined client-side. Widget must handle gracefully (it does via secondary indexes).

## Success Criteria

✓ All 7+ forms + list reports exist in Creator app builder.
✓ All seed rows show in each report.
✓ Widget console: `window.Atlas.S` contains all 7 arrays (resources, timeLogs, allocations, milestones, tags, comments, attachments) with correct row counts.
✓ Cross-entity lookup in widget (e.g., `window.Atlas.S.timeLogByTask[taskID]`) returns expected records.
