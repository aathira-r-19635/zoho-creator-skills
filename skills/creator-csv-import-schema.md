# Create a Form's Schema + Seed Data via CSV Import (fast)

Use this when: you need to stand up Creator form(s) with many fields quickly — importing a CSV
auto-creates every field from the header row AND seeds the rows, far faster than dragging fields.
Do NOT use when: a column needs an exact type the importer won't infer — set it in the import mapping
(step 4) or fix it after.

## Why
Dragging 10+ fields per form in the form builder is slow and brittle. CSV import creates all fields
from headers in ONE step and seeds data. (Verified 2026-06-14 building the Atlas app: Project = 9 fields
+ 3 rows and Task = 13 fields + 15 rows, each in seconds.)

## Steps (per form)
1. Generate a CSV: header row = the exact field link_names you want (NO spaces, e.g. `Project_Code`,
   `Start_Date`) + N data rows. Codes/IDs as text tokens (`ATL-001`), dates as `dd-MMM-yyyy`, numbers plain.
2. App builder → `Create New Form` (or `+` → Form) → on "How would you like to create your form?" click
   `Import with data` (`.zc-dem-integration-card-title` → "Import with data").
3. In the file panel (inside the `#zc-sheetapp-frames` iframe) click `Local storage` → choose the CSV
   (handle the OS file chooser).
4. Review the preview grid; confirm inferred column types. Set any column that MUST stay text (18-digit
   ID / FK / code) to Single Line so it is not imported as Number (precision loss). Skip "Restructure Table".
5. Click `Create` — the button is INSIDE the iframe:
   `page.locator('#zc-sheetapp-frames').contentFrame().getByRole('button',{name:'Create'}).click()`.
6. "Form created successfully" → the form + a `<Form> Report` list report + the rows now exist.

## What the importer produces (verified 2026-06-14)
- Text → Single Line (`type 1`); numeric → Number (`type 5`); `dd-MMM-yyyy` → Date (`type 10`).
- A column with repeated values becomes a CHOICE field (Dropdown `type 13` / Radio `type 12`) with
  **`allow_other_choice: true`** — so the JS SDK can later write values NOT in the seeded choice list
  (e.g. a status the seed didn't contain). Confirm via `getFormMetadata`.
- Report `date_format` = `dd-MMM-yyyy`; write/read dates in that format.

## If you see X → do Y
- An ID/FK column came in as Number (precision loss) → set it to Single Line in step 4 and re-import.
- Relational links can't reference real record IDs pre-import (IDs assigned on insert) → join by a stable
  business code column (e.g. `Project_Code`) client-side, or backfill links via the SDK after import.
- Name collision with an existing empty form → delete the empty form first (form builder `More` ⋮ →
  Delete `a#zc-del-comp`, confirm `input#proceedBtn`), then import.

## Phase 1+ Learnings (verified 2026-06-14)

**Multiple-entity seeding via parallel CSVs:**
- Created 7 CSVs (Resource, Time_Log, Allocation, Milestone, Tag, Comment, Attachment); each imports independently in ~30s.
- CSV order does NOT matter (FKs are text links, not auto-numeric relations).
- Cross-entity references use stable code columns (e.g. `Project_Code` = ATL-001, `Member_ID` = RES001) to avoid ID churn on import.
- After all CSVs imported, secondary indexes are built client-side in the widget (no post-import schema/db work needed).

**Known Gotcha: ID/FK Precision Loss**
- If you have an 18-digit ID (e.g. `4537000000123456`), the importer infers it as Number and truncates to ~15 digits.
- **Fix:** In step 4 (import preview), set any `*_ID` or `*_Code` column to **Single Line** before clicking Create.
- Catch this early — re-importing the same CSV is tedious.

**Date Format Strict**
- Widget parser expects `dd-MMM-yyyy` (e.g., "01-Jun-2026"). Other formats silently fail or parse as wrong date.
- Verified: "01-Jun-2026" → Date type ✓, "2026-06-01" → text string ✗, "1/6/2026" → wrong date ✗

## Related Skills
- `creator-widget-build-register.md` — register + embed the widget that reads this schema.
- `playwright-zoho-form-builder.md` — the manual field-by-field alternative.
- `creator-widget-js-sdk.md` — SDK calls (server `criteria`, choice writes via `allow_other_choice`).
