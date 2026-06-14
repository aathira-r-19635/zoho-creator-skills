# Atlas PSA — Phase 1 Completion Guide

**Status:** Forms scaffolded, widget extended, seed CSVs ready. Import CSVs to populate the app.

---

## Step 1: Import CSVs into Creator App (via UI)

Each CSV creates a form + list report + seeds data in one step.

**For each CSV file in `atlas-psa/seed/`:**

1. Open https://creator.zoho.com/appbuilder/achyutmenont0_zohotest/atlas/
2. Click `Create New Form` (or `+` → Form)
3. On "How would you like to create your form?" → click the **`Import with data`** card
   - Inside the modal, the card has class `.zc-dem-integration-card-title`
4. Click `Local storage` → select the CSV file from your machine:
   - `Resource.csv` → creates `Resource` form
   - `Time_Log.csv` → creates `Time_Log` form
   - `Allocation.csv` → creates `Allocation` form
   - `Milestone.csv` → creates `Milestone` form
   - `Tag.csv` → creates `Tag` form
   - `Comment.csv` → creates `Comment` form
   - `Attachment.csv` → creates `Attachment` form
5. **In the import preview:**
   - Verify column types (see notes below)
   - Set any ID/FK columns to `Single Line` (important for preventing precision loss)
   - Skip "Restructure Table"
6. Click `Create` — **inside the iframe**: `#zc-sheetapp-frames iframe → button[name="Create"]`
7. Wait for "Form created successfully" → the form, report, and rows now exist

**Key mappings created:**
- CSV header → Field link_name (exact match)
- Data row → Record
- List report → Auto-named `All_<FormName>`

---

## Step 2: Verify Field Types (Phase 0 VERIFY findings)

The importer infers types from CSV content. **Critical fixes:**

| Entity | Field | Must Fix | Reason |
|---|---|---|---|
| All | `*_ID`, `*_Code` | Set to Single Line | Prevents 18-digit ID truncation as Number |
| Resource | `Avatar_Color`, `Role` | Already text ✓ | |
| Time_Log | `Member_ID`, `Task_ID`, `Project_ID` | Set to Single Line | FKs, don't lose precision |
| Allocation | `Project_ID`, `Member_ID` | Set to Single Line | FKs |
| Comment | `Author_ID`, `Parent_ID`, `Parent_Comment_ID` | Set to Single Line | FKs |
| Attachment | `Parent_ID` | Set to Single Line | FK |

**If you notice a field came in as Number:**
1. Delete the import (form builder → More ⋮ → Delete)
2. Re-import and set the column to Single Line in step 5
3. Or fix after import via form builder (field properties)

---

## Step 3: Verify Relationship FK Linkage

After all 7 forms are created, verify seed data relationships:

**Check these spot-checks in Creator:**
- Open `Project_Report` → confirm `Project_Code` values match seed (ATL-001, ATL-002, etc.)
- Open `Task_Report` → confirm `Project_Code` (FK) values match projects
- Open `Time_Log_Report` → confirm `Task_ID` and `Member_ID` reference valid rows
- Open `Allocation_Report` → confirm `Project_ID` and `Member_ID` link to valid rows

All are flat FKs (text ID fields, not native lookups) except:
- `Time_Log.Member` and `Allocation.Member` / `Allocation.Project` (optional native lookups for admin UX)

---

## Step 4: Widget Auto-Discovery

Once forms are created, the widget auto-discovers them on load:
1. Widget calls `fetchAll` for each report
2. If a report doesn't exist (code 3100/9280), it's silently skipped
3. If a report exists, it's populated into the Store

**No widget changes needed** — just refresh the app after importing CSVs.

---

## Expected Result After Phase 1

**Creator App:**
- 10 forms: `Project`, `Task`, `Resource`, `Time_Log`, `Allocation`, `Milestone`, `Tag`, `Comment`, `Attachment`
- 10 list reports: `Project_Report`, `Task_Report`, `All_Resources`, `All_Time_Logs`, `All_Allocations`, `All_Milestones`, `All_Tags`, `All_Comments`, `All_Attachments`
- Seed data (~40 rows across all entities)

**Atlas Widget:**
- Existing views (Portfolio, Board, Gantt, Table, Projects) unchanged
- **NEW:** Time Logs view (6th nav item) — lists all time logs by date, shows task + member + hours
- All 7 entities hydrated into the Store on boot
- Secondary indexes maintained for efficient joins

---

## Phase 0 VERIFY Probes Still Pending

These were flagged in the PLAN but not yet tested (will probe during this Phase 1 creation):

1. **Subform round-trip** (`Task.Checklist_Item` subform) — when you create the Task form, try adding a subform field. Does it round-trip on read? If awkward, switch to a separate `Checklist_Item` form linked by FK.
2. **Native lookup field shape** (`Time_Log.Member`, `Allocation.Member` / `Allocation.Project`) — if you add these as lookups AND parallel text FK fields, do they both round-trip cleanly on write? Or does Creator reject the double-write?
3. **Date-time write format** (`Comment.Created_At`) — verify the format Creator accepts for date-time writes. If non-standard, defer to client-side timestamp only.

**How to probe:** Create a test row in each form via Creator UI, check the widget Store (`window.Atlas.S`) to see what shape came back.

---

## Commands to Verify

```javascript
// In the widget console (F12 → Atlas tab or Workspace page):
window.Atlas.S.resources       // Array of 5 resources
window.Atlas.S.timeLogs        // Array of 10 time logs
window.Atlas.S.resourceById    // Map: ID -> resource
window.Atlas.S.timeLogByTask   // Map: Task_ID -> [logs]

// Test a join:
var task = window.Atlas.S.tasks[0];
var logs = window.Atlas.S.timeLogByTask[task.ID] || [];
logs.length;  // Should be > 0 if that task has time logs
```

---

## Next: Phase 2 Continuation

Once Phase 1 is complete and verified:
- Resource heatmap (utilization by week)
- Calendar (milestones + deadlines)
- "My Work" (personalized task board for `loginUser`)
- Allocation detail view
- Comment threads (full CRUD)

Each gated by live verification against real data.
