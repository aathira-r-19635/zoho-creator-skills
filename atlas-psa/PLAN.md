# Atlas PSA — Master Build Plan

> One coherent, de-duplicated build plan for **Atlas**, a Professional Services Automation (PSA) workspace that runs entirely as a Creator **JS SDK v1** custom widget. Every SDK call in this document is checked against the verified v1 contract (`skills/creator-widget-js-sdk.md`). Anything beyond that contract is flagged **(VERIFY Phase 0)** and gated behind Phase 0.

---

## 1. Executive Summary

**What Atlas is.** Atlas is a full PSA tool — portfolio/project management, Kanban board, Gantt with dependencies and critical path, calendar, resource-workload heatmap, time tracking, "My Work", a virtualized data table, and global search — delivered as **one single-page HTML widget** embedded on one Creator page. It manages Projects, Tasks (with subtasks), task-to-task Dependencies, Time Logs, Resources, Allocations, Milestones, Tags, polymorphic Comments and Attachments.

**Why it is ultra-hard.** The Creator JS SDK v1 gives Atlas exactly five record primitives — `getAllRecords` (≤200/page, **no server-side join, no aggregation/GROUP BY, no reliable server filter**), `addRecord`, `updateRecord`, `deleteRecord` — plus a handful of `UTIL` helpers, and **no transactions, no triggers, no realtime push, no server compute**. Every feature a real PSA tool gets from its database — referential integrity, cascade delete, rollups (% complete, utilization, budget burn), critical path, recurrence expansion, search, undo — must be **reimplemented in browser JavaScript** over an eventually-consistent, last-write-wins data layer assembled from flat per-report reads.

**Headline SDK-stress points.**
- **No server join → hydrate-once, join-in-memory.** All entity reports are paged into ID-keyed `Map`s and joined client-side via secondary indexes rebuilt on load and patched on every write.
- **No aggregation → all rollups in JS.** Project %, resource utilization, budget burn, Kanban column counts, burndown — every KPI is a client-side `SUM`/`GROUP BY` over the in-memory store, memoized and invalidated narrowly.
- **No graph ops → client-side CPM.** Critical path = topological sort + forward/backward pass over the dependency DAG; cycle detection runs as a **pre-write guard** before any dependency edge is saved.
- **No transactions → optimistic saga + last-write-wins.** Multi-record actions (cascade delete, cascade reschedule, duplicate-project, recurrence expansion, import) are N independent writes routed through a **pool-of-6 + exponential-backoff** writer; partial failure is surfaced for retry, never silently dropped.
- **No realtime → poll + manual refresh.** A "last synced HH:MM" stamp, manual Refresh (disabled while writes are in flight), and optional scoped polling stand in for push.
- **200/page ceiling × many reports → tiered, scoped loads.** Eager-load small entities; scope/lazy-load the large ones (Tasks, Dependencies, TimeLogs, Comments, Attachments).

The build is strictly incremental across **8 phases (0–7)**, each ending at a live-verified gate. **Phase 0 burns down every UNVERIFIED contract assumption before any product code is committed** — that is the linchpin of the whole plan.

---

## 2. Goals & Non-Goals

### Goals
- Ship a usable multi-view PSA workspace on the verified v1 SDK, reusing the proven `stm-task-widget` spine for the board.
- Keep **100% of SDK traffic inside the 10 verified calls** (5 record ops + 5 UTIL helpers). No feature may require an 11th call.
- Resolve every cross-entity relationship and every rollup **client-side**, correctly and performantly, to the documented scale targets.
- Stay responsive at PSA scale (target: 50 projects / 5k tasks / 20k time logs) via windowing, debounce, event delegation, tiered loading, and the pool-6 throttle.
- De-risk all UNVERIFIED contract facts in **Phase 0** and replan the affected phases *before* building them.

### Non-Goals (explicitly accepted v1 limitations)
- **No realtime collaboration** — manual refresh + optional scoped polling only (last-write-wins on conflict).
- **No atomic multi-record transactions** — optimistic sagas with retry/compensation; a hard crash mid-saga can leave inconsistency, repaired by a boot-time integrity sweep.
- **No guaranteed integrity at rest** — the widget is the only enforcement point and is bypassable (MCP/API/other widgets can write); integrity is *repaired*, not *guaranteed*.
- **No infinite recurrence** — recurring items are materialized to a bounded horizon, re-materialized when the user reopens the series near the horizon.
- **Attachments may be URL links, not binary uploads** — pending the Phase 0 file-upload probe.
- **Undo is session-scoped** — LWW-guarded, lost on reload; "undo a delete" re-creates the row with a *new* ID and re-points dependent FKs.
- **No server-side notifications/email** — @mentions surface only inside Atlas as a client-computed "@you" inbox.
- **Hard practical ceiling** of a few thousand tasks per loaded workspace before server-criteria + load-on-demand becomes mandatory (gated on the Phase 0 `criteria` result).

---

## 3. The Plan

### 3.1 Data Model & Relationship Graph

Atlas resolves every relationship **client-side** against in-memory stores; the SDK has no server joins, aggregation, or push. This subsection defines forms, fields, reports, the relational graph, and the join/denormalization strategy.

#### Naming conventions

| Concept | Convention | Example |
|---|---|---|
| Form `link_name` (write target) | `Singular_PascalCase` | `Task`, `Time_Log` |
| List report `link_name` (read source) | `All_<Plural>` | `All_Tasks` |
| Specialized report | `<Plural>_<Purpose>` | `Tasks_Kanban` |
| Field `link_name` | `PascalCase_With_Underscores` | `Task_Name`, `Project_ID` |
| Built-in id | `ID` (flat string on every read row — verified in `stm-task-widget/app/widget.html`) | `"4537000000123456"` |

**Verified record shape** (from the STM widget): `getAllRecords` returns `res.data` as a flat array; each row has a top-level `ID` plus each field keyed by its exact `link_name`. Writes use the double wrap `data:{ data:{ Field: val } }`.

> **Consistency note (read/write surface):** **writes use `formName`** (e.g. `formName:'Task'`); **read/update/delete use `reportName`** (e.g. `reportName:'All_Tasks'`). Earlier draft sections used three different name sets (`Projects`/`Projects_Report`/`All_Projects`). **This plan standardizes on:** form = `Singular_PascalCase`, report = `All_<Plural>`. The canonical entity → form/report map is **Table A** in §3.3; all sections refer to it.

#### Foreign-key strategy (the single most important data-model decision)

Creator **lookup** fields return a nested object on read whose exact shape is **(VERIFY Phase 0)**. To keep client joins trivial and avoid depending on the unverified nested shape:

- **Default rule:** every relationship is stored as a **plain text/number FK field holding the parent's `ID` string** (`*_ID`), **not** a native lookup. The widget owns referential integrity (it writes the parent `ID` it already holds in memory), making `byId` + secondary-index joins pure string-key lookups.
- **Two tolerated native-lookup exceptions** *(gated on Phase 0)*: `Time_Log.Member` and `Allocation.Member` / `Allocation.Project` keep a native lookup so Creator's own form view stays usable for admins, **and** mirror the same id into a parallel `*_ID` text field the widget reads. **(VERIFY Phase 0: can we write a native lookup by ID AND a parallel text FK in one double-wrapped payload? If awkward, drop the lookups and keep only the text FKs — this is the de-risking default.)**
- **No subforms for cross-entity relationships** — subforms nest under one parent and cannot be joined/queried independently. Tasks↔Dependencies, Project↔Member, Task↔TimeLog are all separate forms with FK fields, each independently paginated. The **one** justified subform is `Checklist_Item` inside `Task` (items have no life outside their task), included below but flagged.

#### Forms (fields + Creator field types)

**1. `Project`**

| Field | Type | Notes |
|---|---|---|
| `Project_Name` | Single Line | required |
| `Project_Code` | Single Line | unique key shown in UI (e.g. `ATL-001`); uniqueness enforced client-side (VERIFY Phase 0: unique-constraint error code) |
| `Status` | Dropdown | `Planning / Active / On Hold / Completed / Cancelled` |
| `Description` | Multi Line | |
| `Start_Date` | Date | |
| `Due_Date` | Date | |
| `Health` | Dropdown | `On Track / At Risk / Off Track` (manual or client-computed) |
| `Budget_Hours` | Decimal | denominator for budget burn |
| `Owner_ID` | Single Line (FK) | → `Resource.ID` |
| `Color` | Single Line | hex swatch |
| `Task_Count` | Decimal | client-maintained rollup (drives sharded paging if `criteria` fails — see §3.5) |
| `Is_Archived` | Decimal (0/1) | soft-delete flag |

**2. `Resource`** (team member)

| Field | Type | Notes |
|---|---|---|
| `Member_Name` | Single Line | required |
| `Email` | Email | matched to `getInitParams().user` for "My Work" |
| `Role` | Dropdown | `PM / Engineer / Designer / QA / Analyst` |
| `Capacity_Hours_Per_Week` | Decimal | utilization denominator |
| `Cost_Rate` | Decimal | $/hr for budget burn |
| `Is_Active` | Decimal (0/1) | |
| `Avatar_Color` | Single Line | hex avatar chip |

**3. `Task`** (self-referential)

| Field | Type | Notes |
|---|---|---|
| `Task_Name` | Single Line | required |
| `Project_ID` | Single Line (FK) | → `Project.ID` (required) |
| `Parent_Task_ID` | Single Line (FK) | → `Task.ID`; empty = top-level, non-empty = subtask |
| `Status` | Dropdown | `Backlog / To Do / In Progress / In Review / Done / Blocked` |
| `Priority` | Dropdown | `Low / Medium / High / Urgent` |
| `Assignee_ID` | Single Line (FK) | → `Resource.ID` |
| `Start_Date` | Date | |
| `Due_Date` | Date | |
| `Estimate_Hours` | Decimal | |
| `Percent_Complete` | Number | 0–100 |
| `Sort_Order` | Decimal | fractional rank for drag-reorder without renumbering siblings |
| `Milestone_ID` | Single Line (FK) | → `Milestone.ID` (optional) |
| `Tag_IDs` | Multi Line | CSV of `Tag.ID` (denormalized M:N — see Tags note) |
| `Checklist` | **Subform** (`Checklist_Item`) | the only justified subform (VERIFY Phase 0 round-trip) |
| `Is_Archived` | Decimal (0/1) | |

`Checklist_Item` subform fields: `Item_Text` (Single Line), `Is_Done` (Decimal 0/1), `Item_Order` (Decimal).

**4. `Task_Dependency`** (join, Task *—* Task)

| Field | Type | Notes |
|---|---|---|
| `Predecessor_ID` | Single Line (FK) | → `Task.ID` (must finish first) |
| `Successor_ID` | Single Line (FK) | → `Task.ID` (waits) |
| `Dep_Type` | Dropdown | `FS / SS / FF / SF` (FS default) |
| `Lag_Days` | Number | optional lead/lag |
| `Project_ID` | Single Line (FK) | → `Project.ID` (denormalized so deps load per-project without a Task join) |

**5. `Allocation`** (join, Project *—* Resource capacity)

| Field | Type | Notes |
|---|---|---|
| `Project_ID` | Single Line (FK, mirror) | → `Project.ID` |
| `Member_ID` | Single Line (FK, mirror) | → `Resource.ID` |
| `Project` | **Lookup** → `Project` | native UX (VERIFY Phase 0) |
| `Member` | **Lookup** → `Resource` | native UX (VERIFY Phase 0) |
| `Allocation_Pct` | Decimal | % of member capacity |
| `Week_Start` | Date | weekly buckets |
| `Billable` | Decimal (0/1) | |

**6. `Time_Log`** (Task 1—* TimeLog)

| Field | Type | Notes |
|---|---|---|
| `Task_ID` | Single Line (FK) | → `Task.ID` (required) |
| `Project_ID` | Single Line (FK) | → `Project.ID` (denormalized; skips a Task→Project hop on rollups) |
| `Member_ID` | Single Line (FK, mirror) | → `Resource.ID` |
| `Member` | **Lookup** → `Resource` | native UX (VERIFY Phase 0) |
| `Log_Date` | Date | |
| `Hours` | Decimal | required |
| `Billable` | Decimal (0/1) | |
| `Notes` | Multi Line | |

**7. `Milestone`** (Project 1—* Milestone)

| Field | Type | Notes |
|---|---|---|
| `Milestone_Name` | Single Line | |
| `Project_ID` | Single Line (FK) | → `Project.ID` |
| `Target_Date` | Date | |
| `Status` | Dropdown | `Upcoming / Achieved / Missed` |
| `Description` | Multi Line | |

**8. `Tag`**

| Field | Type | Notes |
|---|---|---|
| `Tag_Name` | Single Line | |
| `Color` | Single Line | hex |
| `Scope` | Dropdown | `Global / Project` |
| `Project_ID` | Single Line (FK) | → `Project.ID` (blank when Global) |

> Task↔Tag M:N is denormalized as `Task.Tag_IDs` CSV (read-heavy, low cardinality per task; chips render on every card). **Alternative considered & deferred:** a `Task_Tag` join form — adopt it only if Phase 0 shows the CSV truncates or if tags must be reused across non-Task entities. **(VERIFY Phase 0: confirm a large Multi Line CSV round-trips without truncation; pick a max tag count per task.)**

**9. `Comment`** (polymorphic)

| Field | Type | Notes |
|---|---|---|
| `Parent_Type` | Dropdown | `Task / Project / Milestone` |
| `Parent_ID` | Single Line (FK) | → parent row `ID` (type-qualified by `Parent_Type`) |
| `Author_ID` | Single Line (FK) | → `Resource.ID` |
| `Body` | Multi Line | |
| `Parent_Comment_ID` | Single Line (FK) | → `Comment.ID` for threaded replies (self-ref) |
| `Created_At` | Date-Time | client-stamped (VERIFY Phase 0: accepted date-time write format) |
| `Mentions` | Multi Line | CSV of `Resource.ID` for @-mentions |

**10. `Attachment`** (polymorphic)

| Field | Type | Notes |
|---|---|---|
| `Parent_Type` | Dropdown | `Task / Project / Comment` |
| `Parent_ID` | Single Line (FK) | → parent `ID` |
| `File` | File Upload | (VERIFY Phase 0: can the JS SDK upload file content, or only metadata? May be image-only via `setImageData`) |
| `File_Name` | Single Line | |
| `File_URL` | URL | external-link fallback if SDK upload is blocked (the likely v1 default) |
| `Uploaded_By_ID` | Single Line (FK) | → `Resource.ID` |

**Polymorphic pattern:** Comments & Attachments use `(Parent_Type, Parent_ID)`. The client index key is the string `Parent_Type + ':' + Parent_ID`. **(Open question, §4: one polymorphic form vs per-parent child forms.)**

#### Relational graph

```
Resource ──1──*── Allocation ──*──1── Project
   │ (Owner_ID)                          │
   │                          ┌──────────┼───────────┬─────────────┐
   │                       1──*       1──*         1──*           1──*
   │                      Task     Milestone     Tag(Project)   (Comment/Attachment via poly)
   │                       │ ▲
   │ (Assignee_ID)         │ └── Parent_Task_ID (self 1──*, subtasks)
   └───────────────────────┘
                           │
        Task ──1──*── Time_Log ──*──1── Resource
        Task *──* Task  via  Task_Dependency (Predecessor_ID / Successor_ID)
        Task 1──* Checklist_Item (SUBFORM, inline only)

   Comment    *──1 (Parent_Type, Parent_ID) → Task | Project | Milestone   (threaded via Parent_Comment_ID)
   Attachment *──1 (Parent_Type, Parent_ID) → Task | Project | Comment
```

| Relationship | Cardinality | Mechanism |
|---|---|---|
| Project → Task | 1—* | `Task.Project_ID` |
| Task → Subtask | 1—* self | `Task.Parent_Task_ID` |
| Task ↔ Task (dependency) | *—* | `Task_Dependency(Predecessor_ID, Successor_ID)` |
| Project ↔ Resource | *—* time-phased | `Allocation(Project_ID, Member_ID, Week_Start)` |
| Task → Time_Log | 1—* | `Time_Log.Task_ID` |
| Project → Milestone | 1—* | `Milestone.Project_ID` |
| Task → Milestone | *—1 | `Task.Milestone_ID` |
| Task ↔ Tag | *—* | `Task.Tag_IDs` CSV |
| {Task,Project,Milestone} → Comment | 1—* poly | `(Parent_Type, Parent_ID)` |
| {Task,Project,Comment} → Attachment | 1—* poly | `(Parent_Type, Parent_ID)` |

#### Client-side join / denormalization strategy

**1. Primary stores** — one `Map` keyed by `ID` per form, hydrated by paginating each `All_*` report (stop on a short page < 200):
```js
var db = {
  projects:new Map(), resources:new Map(), tasks:new Map(), deps:new Map(),
  allocations:new Map(), timeLogs:new Map(), milestones:new Map(),
  tags:new Map(), comments:new Map(), attachments:new Map()
};
```

**2. Secondary indexes** — rebuilt once after each full load, patched incrementally on every optimistic CRUD (never re-scan all rows on a single edit). Indexes are mutated **only** through three choke-point functions: `Store.upsert(entity, rec)`, `Store.remove(entity, id)`, `Store.reindex(entity)`. `upsert` diffs old vs new FK values and moves the id between buckets so indexes stay correct under optimistic writes *and* rollbacks.
```js
var idx = {
  tasksByProject:new Map(), subtasksByParent:new Map(), tasksByAssignee:new Map(),
  tasksByMilestone:new Map(), depsBySuccessor:new Map(), depsByPredecessor:new Map(),
  timeLogsByTask:new Map(), timeLogsByProject:new Map(), timeLogsByMember:new Map(),
  allocByProject:new Map(), allocByMember:new Map(), milestonesByProj:new Map(),
  childrenByParent:new Map()   // "Type:ID" -> {comments:[...], attachments:[...]}
};
```

**3. Normalizer.** Every record passes through `normalize(entity, raw)` on the way in — from `getAllRecords` *and* from the echo of a successful `addRecord`/`updateRecord` — coercing FK fields to plain string IDs and parsing dates/numbers once. This isolates the UNVERIFIED lookup/subform shape to one function. **(VERIFY Phase 0: does a successful write echo back the full saved record, or only code+id? If only code+id, the settle path re-fetches the single row.)**

**4. Joins** are array maps over an index then a store lookup — O(children), not O(all):
- Tasks of a project: `idx.tasksByProject.get(pid).map(id => db.tasks.get(id))`
- A task's predecessors: `idx.depsBySuccessor.get(tid).map(d => db.deps.get(d).Predecessor_ID).map(id => db.tasks.get(id))`
- Assignee name on a card: `db.resources.get(t.Assignee_ID)?.Member_Name` (denormalize into the view-model at render, never into storage).

**5. Rollups** (replace the missing server GROUP BY) — computed in memory, memoized, recomputed lazily on dirty:

| Rollup | Client-side formula |
|---|---|
| Project logged hours | sum `Hours` over `timeLogsByProject.get(pid)` |
| Project % complete | estimate-weighted avg of child `Percent_Complete` over `tasksByProject` |
| Task rolled-up hours | own Time_Log sum + recursive sum over `subtasksByParent` (DFS, depth-guarded) |
| Member utilization | logged hours (`timeLogsByMember`) ÷ `Capacity_Hours_Per_Week` per `Week_Start` |
| Project budget burn | Σ(`Time_Log.Hours` × member `Cost_Rate`) ÷ `Budget_Hours` |

Memoization uses a **monotonic per-entity version counter** (`Store.ver.Task++` on any Task upsert/remove). Each memo records the versions it was computed under; recompute only if a dependency version moved.

**6. Polymorphic child resolution:** `idx.childrenByParent.get(type + ':' + id)` → `{comments, attachments}`. Built once post-load, patched on add/delete.

**7. Referential integrity & cascade** (client-owned — no DB FKs): deletes are **soft** by default (`Is_Archived = 1`). A hard delete cascades in the widget — deleting a Task → delete its Time_Logs, Task_Dependencies (both directions), polymorphic Comments/Attachments, and re-parent or delete subtasks. Cascades are bulk writes → routed through the pool-6 + backoff writer. (See §3.5 §8 for the per-target pre-checks and §3.7 R1/R2 for the saga semantics.)

**8. Dependency graph ops** (pure client algorithms over the dep indexes): cycle detection as a pre-write guard, CPM critical path, blocked-status propagation. Detailed in §3.5 §9 and §3.4 §5 (Gantt).

---

### 3.2 View / UX Catalog

All views are rendered by the single JS-SDK v1 widget — no Deluge, no v2 DATA/META. **The SDK gives paginated CRUD and nothing else**, so every KPI, rollup, cross-entity link, and "critical path" is computed client-side after reads. That makes a handful of views genuinely hard (Gantt, heatmap, portfolio KPIs) and a handful genuinely easy (flat Table, My Work).

#### Shared shell & cross-cutting mechanics (all views)

| Concern | Decision | Source |
|---|---|---|
| App shape | ONE widget, client-side hash router (`#portfolio`, `#proj/<id>/<tab>`, `#mywork`, `#table`, `#search`); menu trimmed to one entry | `creator-single-page-app.md` |
| Data load | Tiered/scoped (§3.5 §2), not "read everything"; small entities eager, large scoped/lazy | `creator-widget-js-sdk.md` step 3 |
| Re-read cost | 545 records ≈ 3 reads, sub-second; reads are NOT the bottleneck — render is | `creator-widget-scalability.md` |
| Render scaling | One `render()` per view; debounce search/filter at **120 ms**; **event delegation wired once**; **50-item windowing** (`PAGE_RENDER=50`) + infinite scroll | `creator-widget-scalability.md` |
| Scroll gotcha | Scroll container is `.board-wrap` (`= board.parentNode`), NOT the column/body; attach the infinite-scroll listener there; snapshot/restore `scrollTop` across `render()` | `creator-widget-scalability.md` steps 4–6 |
| Writes | Optimistic CRUD: monotonic temp-id, per-item `_pending` lock, last-write-wins rollback (revert only if current value still equals what we set), disable Refresh while `pendingOps>0` | `creator-widget-js-sdk.md` Tips |
| Bulk writes | Any multi-write action routes through the **pool-6 + exponential-backoff** writer, max 4 attempts/item; never >6 concurrent | `creator-bulk-write-throttling.md` |
| Theme/env | `UTIL.getInitParams()` (feature-detected) → `themeBrandColor` accent, `env` DEV/STAGE badge, `user` identity | `creator-widget-js-sdk.md` step 7 |
| No realtime | "last synced HH:MM" stamp + manual Refresh; optional scoped polling (§3.5 §5) | verified contract |

> **(VERIFY Phase 0)** Lookup/subform read shape gates almost every view's join code. **(VERIFY Phase 0)** Whether `getAllRecords` accepts a server-side `criteria` filter gates the load strategy of Table, Search, Calendar, and per-project Detail loads.

#### View catalog

**1. Portfolio Dashboard `#portfolio` — HARDEST READ-SIDE VIEW.** KPI tiles (Active Projects, Tasks Open/Overdue, Logged Hrs this week, Budget vs Actual, Utilization %), charts (Projects-by-Status donut, burndown line, Hours-by-project bar, At-risk list). Feeds: `All_Projects`, `All_Tasks`, `All_Time_Logs`, `All_Milestones`, `All_Allocations`. Every KPI is a `GROUP BY`/`SUM` the SDK cannot do server-side → aggregate in JS, cache derived aggregates, recompute only on date-range change or an invalidating write. Charts render via inline SVG or one bundled lib **(VERIFY Phase 0: a bundled charting lib must be whitelisted in `plugin-manifest.json` `connect-src`; confirm permitted origins — default is no external CDN, hand-roll SVG)**.

**2. Project List `#projects` — Mild.** Card/row per project: owner avatar, status chip, % complete bar (rolled up from tasks), next-milestone date, member count, open-vs-done sparkline. Feeds `All_Projects` + `All_Tasks` (rollup) + `All_Allocations` (member count). Inline-edit Status/Owner; "New Project" → `addRecord`; debounced text filter.

**3. Project Detail (tabbed) `#proj/<id>/<tab>`.** Header (name, status, owner, dates, % done, budget bar); tabs share one project-scoped task slice; tab state in the hash for deep-linking.

| Tab | Shows | Feeds | Hard? |
|---|---|---|---|
| **Board** (default) | Kanban of project's tasks (§view 4) | `All_Tasks` (scoped) | No |
| **Gantt / Timeline** | Bars + dependency arrows + critical path (§view 5) | `All_Tasks` + `All_Task_Dependencies` + `All_Milestones` | **Yes** |
| **Calendar** | Tasks/milestones day/week/month (§view 6) | `All_Tasks` + `All_Milestones` | Medium |
| **Files** | Attachment grid | `All_Attachments` (filtered) | No (VERIFY Phase 0 upload path) |
| **Activity** | Reverse-chron comments + this session's tracked changes | `All_Comments` + local change log | No (no server audit log) |

**4. Kanban Board `#proj/<id>/board` — EASY (proven path).** Columns = Status; cards show title, assignee avatar, priority flag, due chip, tag dots, subtask badge, comment count; column badge shows the **true total**, not the capped render count. Drag card → optimistic `updateRecord` Status (per-item `_pending` lock); inline title edit; quick-add; bulk select → bulk move/assign via pool-6; collapse swimlanes by assignee. 50-card window per column, infinite scroll on `.board-wrap`, scroll position preserved, new/pending cards `unshift`ed to the front. **Reuse `stm-task-widget/app/widget.html` verbatim as the spine** (verified live at 545 records).

**5. Gantt / Timeline `#proj/<id>/gantt` — HARDEST INTERACTIVE VIEW.** Left: collapsible task tree (parent→subtasks). Right: time-grid bars, milestone diamonds, dependency arrows, critical-path highlight, "today" line. Drag bar → reschedule (`updateRecord` Start/Due); drag edge → resize; drag bar-to-bar → create `Task_Dependency` (`addRecord`); zoom day/week/month. A reschedule that violates a dependency triggers a **cascade**: recompute downstream dates client-side, then write the changed tasks via the **pool-6 throttled writer**. Hard because: (1) tree + dep graph assembled in JS from 3 reports; (2) **critical path = topo-sort + longest-path** recomputed client-side on date change; (3) cascade = throttled multi-write; (4) no transactions → partial failure rolls back only items whose value still equals what we set; (5) **cycle detection runs as a pre-write guard** before any edge save.

**6. Calendar `#proj/<id>/calendar` / global `#calendar` — Medium.** Month/week/day grids; tasks by Due (or spanning Start→Due), milestones as all-day pills, "+N more" overflow. Drag task to another day → optimistic date update; click empty day → quick-add; filter by assignee/tag. Placement math is client-side but bounded; only the visible range renders (natural date-window windowing).

**7. Resource-Workload Heatmap `#resources` — HARD.** Matrix: rows = Resources, columns = weeks (next 8–12); each cell = committed hours vs `Capacity_Hours_Per_Week`, color-scaled; row header = utilization %. Feeds `All_Resources`, `All_Allocations`, `All_Tasks`, optionally `All_Time_Logs`, all cross-joined and summed in JS. Hover → breakdown popover; drag an allocation to a lighter cell → `updateRecord`. This is a 2-D `SUM(hours) GROUP BY member, week` the SDK can't do server-side → build the member×week matrix in memory, cache it, invalidate narrowly on allocation/estimate writes. Render only visible rows × visible week columns.

**8. "My Work" `#mywork` — EASY.** Current user's tasks (`Assignee_ID` matched to `getInitParams().user`), grouped Overdue / Today / This Week / Later / Done; "my hours this week" mini-tracker; upcoming milestones. Inline status flip, check-done, quick log-time, local reorder. A simple in-memory filter on one identity — easiest "real PSA" view to ship.

**9. Virtualized Table `#table` — EASY mechanically, SCALE STRESS TEST.** Dense grid of tasks (or any entity via switcher): sortable/filterable columns (Title, Project, Assignee, Status, Priority, Start, Due, Est, %Done, Tags), resizable columns, frozen first column, multi-column sort. Inline-edit any cell → `updateRecord`; column sort/filter chips; bulk select → bulk edit/delete via pool-6. **Vertical row virtualization** (~50 visible + buffer, recycled on scroll); 120 ms debounced filter. In-memory sort/filter is fine to ~2k rows; beyond that, push filtering to `getAllRecords` `criteria` **(VERIFY Phase 0)** + load-on-demand.

**10. Time-Tracking `#time` — EASY.** Weekly timesheet grid (rows = tasks I touched, columns Mon–Sun, cells = hours), live start/stop timer, totals row, billable toggle, submit-week. Type hours → `addRecord`/`updateRecord` a Time_Log; stop timer → write a log; copy-last-week → bulk `addRecord` via pool-6. Weekly totals summed in JS (small set).

**11. Global Search `#search?q=` (⌘K overlay) — EASY in memory.** Unified results grouped by entity, deep-linking to the right view+tab. Searches the in-memory store; debounced 120 ms type-ahead, arrow-nav, recent searches. If `criteria` works **(VERIFY Phase 0)**, push search per-report server-side and skip holding everything in memory.

#### Difficulty summary

| View | Hard? | Root cause (SDK limit) |
|---|---|---|
| Gantt + critical path | **Hardest** | No graph ops/joins; client topo-sort longest-path; cascade = throttled multi-write; no transaction |
| Portfolio dashboard | **Hard** | No server GROUP BY/SUM; aggregate 5 full reports in memory |
| Resource heatmap | **Hard** | 2-D member×week aggregation entirely client-side |
| Calendar | Medium | Client placement/spanning math; date-range windowing |
| Table (>2k rows) | Medium | In-memory sort/filter ceiling; needs `criteria` (VERIFY) + on-demand paging |
| Kanban / Board | Easy | Proven path — reuse `stm-task-widget` spine |
| My Work / Project List / Time / Search / Files / Activity | Easy | Single-entity filtered CRUD |

**Universal hard constraints baked into every view:** (a) no realtime → manual refresh + "last synced"; (b) no server aggregation/join → all rollups in JS; (c) no transactions → every multi-record action is N optimistic pool-6 writes with LWW rollback; (d) `.board-wrap` scroll + 50-item windowing applies to Board, Table, Calendar overflow, and heatmap.

---

### 3.3 SDK Capability + Limits Matrix

This is the contract spine. Every feature reduces to the ten verified v1 calls below; anything that can't is a *limit* with a named workaround (or it is cut).

#### Table A — Canonical entity → form/report map (single source of truth for all sections)

Each entity = one **form** (`formName`, writes) + one **list report** (`reportName`, reads).

| Entity | Form (`formName`) | List report (`reportName`) | Key fields the widget touches |
|---|---|---|---|
| Project | `Project` | `All_Projects` | `Project_Name`, `Status`, `Start_Date`, `Due_Date`, `Owner_ID`, `Budget_Hours`, `Task_Count` |
| Resource | `Resource` | `All_Resources` | `Member_Name`, `Email`, `Role`, `Capacity_Hours_Per_Week`, `Cost_Rate` |
| Task | `Task` | `All_Tasks` | `Task_Name`, `Status`, `Project_ID`, `Parent_Task_ID`, `Assignee_ID`, `Due_Date`, `Estimate_Hours`, `Sort_Order` |
| Dependency | `Task_Dependency` | `All_Task_Dependencies` | `Predecessor_ID`, `Successor_ID`, `Dep_Type`, `Lag_Days`, `Project_ID` |
| Time Log | `Time_Log` | `All_Time_Logs` | `Task_ID`, `Project_ID`, `Member_ID`, `Log_Date`, `Hours`, `Billable` |
| Allocation | `Allocation` | `All_Allocations` | `Project_ID`, `Member_ID`, `Week_Start`, `Allocation_Pct` |
| Milestone | `Milestone` | `All_Milestones` | `Project_ID`, `Milestone_Name`, `Target_Date`, `Status` |
| Comment | `Comment` | `All_Comments` | `Parent_Type`, `Parent_ID`, `Author_ID`, `Body`, `Created_At` |
| Attachment | `Attachment` | `All_Attachments` | `Parent_Type`, `Parent_ID`, `File`/`File_URL`, `File_Name`, `Uploaded_By_ID` |
| Tag | `Tag` | `All_Tags` | `Tag_Name`, `Color`, `Scope`, `Project_ID` |

> Optional native fallback `Tasks_Kanban` (type 4) may exist as a component but **the widget reads `All_Tasks`, not it**. Never delete the read report / write form the widget depends on (`creator-delete-components.md` Step 0; App Menu Builder only hides menu entries, it does not delete the backing report per `creator-single-page-app.md`).

#### Table B — Capability Matrix (each v1 call → where Atlas exercises it)

| # | SDK call (v1) | Exact shape Atlas uses | Features that exercise it | Stress / notes |
|---|---|---|---|---|
| C1 | `ZOHO.CREATOR.init()` | `init().then(boot)` — once, before any API call | App boot; nothing renders until it resolves | Single gate; on reject → fatal screen. |
| C2 | `API.getAllRecords({appName, reportName, page, pageSize:200})` | Paged loop; stop when `res.data.length < 200` | Tiered hydrate of all reports; manual Refresh; scoped/lazy re-reads | Hottest call. See L7 (page ceiling), L8 (server filter UNVERIFIED). Reads are the higher quota. |
| C3 | `API.addRecord({appName, formName, data:{data:{…}}})` | **Double-wrapped**; success `code===3000` | New Project/Task/Subtask; log time; add Comment; create Dependency edge; new Tag; new Allocation | Optimistic insert with **monotonic temp-id**. Bulk variants (import, duplicate-tree, recurrence expand) route through the **pool-6 + backoff** writer. |
| C4 | `API.updateRecord({appName, reportName, id, data:{data:{…}}})` | `id` String; **double-wrapped** | Drag task status; reschedule (Gantt); inline edits; reorder (`Sort_Order`); mark milestone; edit allocation | Per-item `_pending` lock + **last-write-wins** rollback. 5 concurrent moves verified to land. |
| C5 | `API.deleteRecord({appName, reportName, criteria:'ID == '+id})` | `criteria` string, **never** `id` | Delete task (+cascade, L4); remove Dependency; delete Comment/Attachment/Tag; remove Allocation | Passing `id` → `Invalid Configuration`. Cascade = many deletes → pool-6. **(VERIFY Phase 0: does delete share the ~429 write quota; does a multi-condition `criteria` bulk-delete work, or one-ID-per-call?)** |
| C6 | `UTIL.getInitParams()` | Feature-detected; never throw if absent | DEV/STAGE badge; `themeBrandColor` accent; `user` → "my tasks" + comment authorship | **(VERIFY Phase 0: exact `user` shape — email/name/id?)** |
| C7 | `UTIL.getQueryParams()` | Read on boot | Deep-link to a project/task (`?project=123`); shareable URLs | **(VERIFY Phase 0: return shape — object vs string?)** Defensive parse. |
| C8 | `UTIL.getWidgetParams()` | Read on boot | Per-embed default view config | **(VERIFY Phase 0: settable at embed time? shape?)** Falls back to Board. |
| C9 | `UTIL.navigateParentURL(url)` | On "open native record" / external links | Escape hatch to native Creator record (e.g. to attach a file natively) | **(VERIFY Phase 0: allowed URL forms / same-origin constraint?)** |
| C10 | `UTIL.setImageData(...)` | On avatar / image-thumbnail set | Resource avatars; inline image-attachment thumbnails | **(VERIFY Phase 0: exact signature — which arg is field vs base64/blob vs record id; arbitrary record or only embedding one?)** The only image-write path. |

**Coverage check:** all 10 verified calls are exercised; no feature requires an 11th. A single wrapper `call(p)` (resolve only on `code===3000`, else reject the code) is the chokepoint every C2–C5 call passes through, so error handling, the `_pending` lock, and the pool-6 throttle live in exactly one place.

#### Table C — Limits Matrix (each SDK limit → workaround → boundary test)

| # | Limit (v1 cannot do) | Where it bites | Client-side workaround | Boundary test / honesty note |
|---|---|---|---|---|
| L1 | **No server JOIN** | Every cross-entity view | Fetch each report into ID-keyed `Map`s, hash-join in JS; M:N Tags via CSV (or `Task_Tag` join if needed) | Test: a task FK pointing at a missing/late-page parent → graceful "(unknown)", no crash. Cost: all datasets resident. |
| L2 | **No aggregation / GROUP BY** | % complete, budget burn, utilization, column counts, burndown | Compute all rollups in JS post-hydrate; patch incrementally on each CRUD; badge = true total | Test: 545+ tasks, 5k+ logs — rollup recompute <16 ms/frame. Rollups are eventually consistent until next Refresh. |
| L3 | **No transactions** | Duplicate-project, cascade delete, dependency reschedule | **Saga with compensating log** in memory; on partial failure show "N of M saved — retry failed"; per-item `_pending` prevents double-submit | Test: kill network mid-duplicate → no silent loss; retry resumes only failed items. A crash mid-saga can orphan → boot integrity sweep (R3) repairs. |
| L4 | **No cascade / referential integrity** | Deleting any parent | Gather dependents from indexes, enqueue deletes through pool-6, then prune stores; subtasks recursed in JS | Test: delete a task with 30 subtasks + 12 deps + 80 logs → 0 orphans on re-hydrate, no 429. |
| L5 | **File-upload story unclear** | Attachments | **Fallback ladder:** (a) URL/link attachments via plain `addRecord` (fully supported); (b) images via `setImageData` once its signature is verified; (c) binary upload deferred to native record via `navigateParentURL` | **(VERIFY Phase 0) — biggest open risk.** Ship rung (a) for v1 if binary upload fails. Do not promise drag-drop upload until proven. |
| L6 | **No realtime / push** | Multi-user editing | Manual Refresh (disabled while `pendingOps>0`) + optional scoped poll (§3.5 §5); LWW on conflict; re-resolve by ID before applying a write | Test: two tabs edit same task → last writer wins, other tab reconciles on poll without clobbering its own unsaved edit. Stale reads expected; show "data may be N min old". |
| L7 | **`pageSize` ≤ 200; page client-side** | Thousands of tasks/logs | Page loop, stop on short page; render-side windowing (`PAGE_RENDER=50`, `.board-wrap` scroll, scrollTop snapshot/restore) | Verified: 545 = 3 reads sub-second; DOM 6,558→1,821 windowed. Beyond ~2k → L8. |
| L8 | **Server-side `criteria` on `getAllRecords` UNVERIFIED** | Search/filter, "my tasks", date-range, project scope | **v1 ships in-memory filtering** (debounce 120 ms, `resetLimits()` on search). If `criteria` works, add a server-filter path for >2k + fetch-on-demand | **(VERIFY Phase 0)** Test `criteria:'Status=="Open"'` returns filtered rows code 3000. **A yes changes the whole search/filter/scale design.** Until verified, assume NO server filter. |
| L9 | **Write rate limit (~429)** | Bulk import, duplicate-tree, cascade delete, "move all" | Single **pool-6 + backoff** (`250·2^a`+jitter, max 4 tries) for all bulk paths; single user writes bypass the pool | Verified: pool-6+retry did 140 writes 0 fails; pool-12 throttled after ~400. Test duplicate-project (8–200 writes) → 0 fails. |
| L10 | **No server computed/derived fields** | Manual ordering, Kanban position, critical path | `Sort_Order` as a JS-managed value via `updateRecord` (renumber only shifted rows, batched through pool-6); critical path in JS | Test: reorder 1 card among 500 → minimal `updateRecord` calls. Concurrent reorders interleave → LWW, occasional reshuffle on refresh. |

#### Design rules that fall out of the matrix
1. **One wrapper, one throttle, one lock.** All C2–C5 traffic goes through `call()` + (for bulk) the pool-6 writer + the `_pending` LWW lock. No feature calls the SDK raw.
2. **Hydrate-once (tiered), join-in-memory.** Every cross-entity view is a pure function of the ID-keyed Maps.
3. **Optimistic everywhere, reconcile on poll.** Atlas is optimistic-first and eventually-consistent; we never claim atomic or realtime.
4. **Phase-0 verification gates the relational + file features** before the data model is committed.

---

### 3.4 Front-End Architecture & State Management

#### Topology: ONE SPA widget + hash router (decided)

| Option | Meaning | Verdict |
|---|---|---|
| **A. Single SPA widget + hash router** | One widget on one page; views swap via `location.hash`; one shared in-memory Store | **CHOSEN** |
| B. Multiple widgets across pages | One widget per page; switch via `navigateParentURL` | Rejected |

**Why ONE SPA wins:** (1) **the Store is the whole point** — derived data (project %, cross-project utilization, critical path) needs Tasks + Dependencies + TimeLogs + Allocations resident *together*; a multi-widget design re-fetches and re-derives the entire graph on every page hop (each widget is a fresh cross-origin iframe). (2) **No cross-widget messaging primitive** — `navigateParentURL` does a full parent navigation → iframe teardown → cold boot → `init()` again. (3) **Optimistic-queue continuity** — in-flight writes + per-item locks survive view switches in an in-iframe router. (4) **Proven single-file precedent** — `stm-task-widget/app/widget.html` runs a full board in ~665 lines.

Cost accepted: one big `widget.html`, mitigated by the IIFE-module layout below + lazy *view* rendering (Store shared; only the active view's DOM exists). Trim the Creator menu to the single Atlas page via App Menu Builder (`creator-single-page-app.md`), keeping all backing forms/reports as components.

**Router:** `hashchange` → parse `#/<view>/<id?>/<sub?>` → resolve from Store (no fetch) → mount one View module into `#app-root`. Unknown hash → `portfolio`. **(VERIFY Phase 0: does the Creator SPA shell preserve the widget-iframe hash across its own navigation/reload? If it strips it, fall back to an in-memory `currentRoute` — no functional loss, just no deep-linking.)**

#### The Store

A single module-level `Store`: each entity = `Map<ID, record>` (cache) + secondary indexes rebuilt on load and patched on every write (mutated only through `upsert`/`remove`/`reindex`; see §3.1). `meta:{loadedAt, fullyLoaded}` and `derived:{}` memo caches with per-entity `ver` counters. The `normalize(entity, raw)` function isolates the UNVERIFIED lookup/subform shape to one place.

#### Load & refresh

Reads are cheap/high-quota; writes are the bottleneck. Boot sequence: (1) `init().then(...)`, feature-detect `UTIL.getInitParams` for env badge + accent; (2) parallel-fetch the small graph-critical entities (Projects, Resources, Allocations, Milestones, Tags) **pooled at 6** (reuse the throttle pool as cheap insurance against a cold-boot thundering herd); (3) paginate the large entities (Tasks, Dependencies, TimeLogs) per the tiered/scoped plan in §3.5 §2 — page loop, `pageSize:200`, stop on short page, never let a mid-loop error wipe a populated cache; (4) `reindex` per entity, render the routed view.

| Refresh trigger | Scope | Rule |
|---|---|---|
| Manual Refresh button | Full re-fetch + reindex | **Disabled while `pendingOps>0`** |
| View enter | None (Store-resident) | Router reads cache; background stale check only if `loadedAt > 5 min` |
| After a write settles | Targeted | Reconcile the echoed record (or re-fetch the single row if no echo); no full refresh |
| Polling | None by default | See §3.5 §5 (optional, scoped, adaptive) |

#### Derived data — compute & memoize

All derived values are pure functions of Store state, cached in `Store.derived`, invalidated by the per-entity `ver` counter. Critical-path notes: topo-sort + two passes is **O(V+E)**, fast per project, but **must not run on the full portfolio every frame** — memoize per project, recompute only when that project's Task/Dependency version moves. Cycle detection runs as a **pre-write guard** in the Dependency add path; a new edge that closes a cycle is rejected optimistically and never enqueued.

#### Module structure (one maintainable `widget.html`)

Single self-contained `widget.html` (inline `<style>` + `<script>`, SDK tag in `<head>`, Index File `/widget.html`) per `creator-widget-build-register.md`. Inside one `<script>`, an IIFE-per-module layout: `SDK` (init + `call()` gate + error reader) · `Config` (APP, form/report link-name maps from Table A, status/type enums hardcoded — no META) · `Net` (pagination loop + add/update/delete wrappers) · `Throttle` (pool-6 + backoff) · `Store` (Maps + indexes + upsert/remove/reindex + ver + normalize) · `Derived` (rollups, CPM, cycle-check, memoized) · `Queue` (optimistic queue, per-item locks, LWW rollback, dirty set) · `Router` · `Views/*` · `UI` (modal/toast/aria-live/confirm/theme) · `Boot`. Rules: one render entry per view; the router unmounts the prior view's DOM before mounting the next; **event delegation per view** (wired once on the static view root, `e.target.closest('.card')`); modules talk only through the Store API and a tiny `emit('store:changed',{entity})` bus.

#### Optimistic-write queue + per-item locks + LWW (hardened)

Extends the STM-proven model: monotonic temp ids (never array length); per-item `_pending` lock (a second edit queues behind the first, per-item-serialized but globally pooled); LWW rollback re-resolves the record by ID and reverts **only if the current value still equals what we set**; `Store.dirty` is a `Set<"entity:id">` (`pendingOps = dirty.size`); Refresh disabled while `pendingOps>0` and `beforeunload` warns if dirty. **Bulk paths use the pool; single user actions do not.** Cross-entity invariants (dependency cycles, allocation > capacity) are enforced as client-side pre-write guards in `Derived`.

#### Scale & rendering

Reuse `creator-widget-scalability.md` verbatim: debounce 120 ms; event delegation once per view root; windowing at `PAGE_RENDER=50` (always render `_pending` items; true-total badges); `.board-wrap` scroll listener + `scrollTop` snapshot/restore. Gantt/timeline virtualizes rows the same way and reads the memoized `Derived.criticalPath` (never recompute per scroll frame). The "beyond ~2k items" path is the growth lever, gated on the Phase 0 `criteria` result.

---

### 3.5 Scale, Performance & Concurrency Strategy

Governs responsiveness at PSA scale (50 projects, 5k tasks, 20k time logs) inside the v1 contract.

#### Target volumes & per-report read budget

| Report (list, type 1) | Target rows | Pages @200 | Read calls | Hot on boot? |
|---|---|---|---|---|
| `All_Projects` | 50 | 1 | 1 | Yes |
| `All_Resources` | 80 | 1 | 1 | Yes |
| `All_Tags` | 150 | 1 | 1 | Yes |
| `All_Milestones` | 300 | 2 | 2 | Yes |
| `All_Allocations` | 500 | 3 | 3 | Yes |
| `All_Tasks` | 5,000 | 25 | 25 | **Scoped, not full** |
| `All_Task_Dependencies` | 8,000 | 40 | 40 | **Scoped, not full** |
| `All_Time_Logs` | 20,000 | 100 | 100 | **Never full** |
| `All_Comments` | 12,000 | 60 | 60 | **On-open only** |
| `All_Attachments` | 6,000 | 30 | 30 | **On-open only** |

Pagination rule (verified): `getAllRecords({appName, reportName, page, pageSize:200})`; start `page=1`; **stop when `res.data.length < 200`**. Reads are a higher/separate quota than writes and are not the bottleneck (545 records = 3 reads, sub-second).

#### Tiered initial load (never "read everything" — ~263 full calls is unacceptable)

| Tier | What loads | Calls | When |
|---|---|---|---|
| **T0 — shell** | `getInitParams`, `All_Projects`, `All_Resources`, `All_Tags` | 3 | Before first paint |
| **T1 — active workspace** | `All_Milestones` (2) + `All_Allocations` (3) + `All_Tasks` **scoped to selected project** + that project's `All_Task_Dependencies` | ~7–10 | On project select (default = last-used) |
| **T2 — lazy** | `All_Time_Logs`, `All_Comments`, `All_Attachments`, other projects' tasks | as needed | On panel open / scroll / tab |

The load model forks on the `criteria` question:
- **If `criteria` works** → T1 fetches `criteria: 'Project_ID == "' + pid + '" && Status != "Archived"'` → a 200-task project = 1 page, 1 call. **Design target.**
- **If `criteria` does NOT work** → **per-project sharded read** using the client-maintained `Project.Task_Count` rollup (written on every task add/delete) so each project pulls ≤ `ceil(count/200)` pages and we never read the global 5k. **(VERIFY Phase 0: criteria support + exact operator syntax for FK/lookup fields; and whether the client-maintained `Task_Count` is race-safe enough under concurrent users / LWW.)**

Boot cost (criteria path): T0+T1 ≈ 10–13 reads, well under 1 s.

#### In-memory model & indexes
Normalized `Map`s + the secondary indexes from §3.1, built in a single O(n) pass per report after load (a few ms for 5k tasks; never per render). These replace every server join and GROUP BY.

#### Per-view virtualization (cite `creator-widget-scalability.md`)

| View | Strategy |
|---|---|
| Task list / WBS tree | `PAGE_RENDER=50` per group; infinite-scroll +50 on `.board-wrap`; scroll listener on `.board-wrap` (NOT `.col`/`.col-body`); snapshot/restore `scrollTop` |
| Kanban | Per-column cap 50; badge = true total; new/moved cards `unshift`ed |
| Gantt | Virtualize on the time axis: render only bars intersecting the visible window ± a buffer; recompute on horizontal scroll (debounced 120 ms) |
| Resource grid | Render only visible rows × visible week columns |
| Time logs / comments / attachments | Lazy page-by-page (T2); never materialize all 20k logs |

Cross-cutting (all verified): debounce search/filter 120 ms (73.8 ms → 0.2 ms blocking; ~10 renders → 1); event delegation bound once (`~2,725/render → 6`); in-memory search until ~2k visible rows, then push to `criteria` (gated on Phase 0).

#### Polling / refresh (collaboration feel without realtime)

v1 has no push. Tiered adaptive polling via scoped `getAllRecords`:

| Data | Interval | Scope |
|---|---|---|
| Active project Tasks + Dependencies | 20 s (tab visible) | scoped to project (or its shard) |
| Active project Allocations / Milestones | 60 s | scoped |
| Open detail panel Comments | 15 s | `criteria 'Task_ID == ...'` (VERIFY Phase 0) |
| Time_Logs / other projects | on open only | — |

Adaptive rules: pause when `document.hidden`, resume + immediate fetch on focus; back off on idle (20→40→80 s, cap 5 min); **suppress self-echo** (never overwrite a row with `_pending`); **diff don't rebuild** (compare polled rows to `byId` by `ID` + a modified marker; show a subtle "N updates" toast); never poll a full unscoped 5k/20k report on a timer. **(VERIFY Phase 0: confirm there is genuinely no push affordance, that `getAllRecords` returns a modified-time field for diffing, and that reads have headroom under a per-minute cap for many concurrent pollers.)**

#### Cross-entity optimistic CRUD + conflict handling
Optimistic everywhere (monotonic temp ids; per-item `_pending`; LWW rollback re-resolving by ID). Verified payload shapes: ADD double-wrapped + `formName`; UPDATE `reportName`+`id`+double-wrap; DELETE `criteria` never `id`. No transactions → a logical "create task + 2 tags + 1 dependency + initial allocation" writes the parent first, gets its real `ID`, then writes children; a child failing after 4 attempts marks the parent `_partial` with a "finish setup" affordance — never silent dangling children. Reparent a subtask = single `updateRecord(Parent_Task_ID)` with a cycle-prevention check *before* the write.

#### Bulk writes — pool 6 + backoff (cite `creator-bulk-write-throttling.md`)
User single writes never throttle. Genuine bulk ops (bulk-reassign, shift-all-by-N-days, template instantiation, seed/import, recurrence expansion) route through the pool: **POOL=6**, backoff `250·2^a ms + jitter` (250/500/1000/2000), max 4 attempts, retry only transient/429, **never retry deterministic `2945`** (fix the payload). Degrade to POOL 3 / base 500 ms if 429s persist. Show a determinate progress bar with ok/fail counts and keep the queue draining past failures.

#### Referential integrity on delete (client-side; no cascade)

| Delete target | Pre-check over indexes | Action |
|---|---|---|
| **Project** | tasks, milestones, allocations, comments/attachments | Block with counts; offer **Cascade** (pool-6 bulk delete) or **Archive** (preferred default — single `Is_Archived` update; preserves time-log history) |
| **Task** | subtasks, dep edges (both directions), time logs | Block if subtasks exist (reparent/delete first); on cascade delete edges → logs → task |
| **Resource** | allocations, tasks where `Assignee_ID == id` | Block; require reassignment |
| Dependency / Tag / Comment | leaf | Safe single delete |

Sequencing rule: **delete edges/children before parents** so a mid-cascade failure never leaves an edge pointing at a deleted node. Re-resolve counts from a fresh scoped read right before a cascade. Pairs with `creator-delete-components.md` Step-0 discipline at the schema level (never delete the report/form the widget reads/writes through).

#### Client-side critical-path / scheduling (CPM)
Computed in-browser over `depsByPredecessor`/`depsBySuccessor` (FS DAG):
```
1. Topological sort (Kahn) over depsIn. If a cycle (queue drains before all nodes) →
   flag offending edges, ABORT scheduling, show "circular dependency". Also run this
   check BEFORE adding any edge or reparenting, to PREVENT cycles.
2. Forward pass (topo order):  ES = max(EF of preds) (0 if none);  EF = ES + duration.
3. Backward pass (reverse):     LF = min(LS of succs) (= project end if none);  LS = LF - duration.
4. Slack = LS - ES.  Critical path = tasks where Slack == 0.
```
O(V+E); runs on the scoped project DAG (~200 tasks), single-digit ms. Recompute on dependency add/remove, duration/date edit, reparent (debounced 120 ms). **(VERIFY Phase 0: at what task count does a synchronous CPM pass exceed ~16 ms and block the main thread? If a mega-project DAG exceeds the measured threshold, move CPM to a Web Worker.)** Allocation/capacity over-allocation flags reuse the same indexes (sum allocated hours per member×week vs capacity) as a render-time badge.

#### Performance budget

| Metric | Target | Measured via |
|---|---|---|
| Cold boot to first paint (T0) | < 1.5 s | `performance.now()` in iframe |
| Project switch (T1) | < 1 s | same |
| Single scoped-board render | < 50 ms | `performance.now()` + MutationObserver |
| Keystroke burst → renders | 1 (debounced) | MutationObserver on `#board` |
| Bulk 200-write op | 0 failures | pool ok/fail counts |
| DOM nodes (windowed) | < 2k | `getElementsByTagName('*').length` |

Measure with element-scoped cross-origin `browser_evaluate` (`creator-widget-iframe-testing.md`), since the widget runs in `iframe[name="embedded-preview"]` / `zappsusercontent.com` and `contentDocument` is null from the parent.

---

### 3.6 Risks & SDK-Gap Analysis (Adversarial)

Severity: **S1 = breaks correctness / data loss · S2 = degrades a core workflow · S3 = annoyance/polish.**

**Why this is hard, in one line:** the SDK gives five record primitives + UTIL and **no transactions, triggers, realtime, or server compute** — every database guarantee must be reimplemented in browser JS over an eventually-consistent, LWW layer.

| # | Risk / gap | Sev | Root cause | Mitigation (or ACCEPT) |
|---|---|---|---|---|
| R1 | Cross-entity referential integrity (delete a Project/Task with children → orphans) | S1 | No FK/cascade/triggers; single-criteria non-transactional delete | App-enforced cascade/restrict in JS before delete (see §3.5 table); FKs as plain ID fields so cleanup criteria are simple strings |
| R2 | Partial-failure on multi-record writes (write 7 of 12 fails) | S1 | No transactions; independent calls; LWW | **Saga + compensating log** (in memory + an optional `Op_Log` form); "N of M saved — retry/undo"; ACCEPT a crash mid-saga can orphan → repaired by R3 |
| R3 | No integrity at rest (orphan tasks, dangling edges, allocations to removed members) | S1 | No server validation; multiple writers | **Boot-time integrity sweep**: after load, run orphan-FK / dangling-edge / self-cycle validators; render an "Integrity" tray; mark orphans visibly, never hide |
| R4 | Dependency cycle detection & critical path | S2 | No server graph ops | Client-side DFS cycle-check on every edge add (reject before write) + topo-sort/CPM longest path; bounded by memory (R6) and freshness (R5) |
| R5 | No realtime / push | S2 | No websocket/SSE | ACCEPT realtime impossible; optimistic + per-item lock + LWW; manual Refresh (disabled while `pendingOps>0`) + optional scoped poll; re-resolve by ID before applying, show "changed by someone else — reload" on mismatch |
| R6 | Large client-side joins & memory ceiling | S2 | Flat per-report rows; no join/GROUP BY | Load once, index by ID, join in JS; render-side windowing/delegation/debounce; ACCEPT a few-thousand-task practical ceiling, then server-criteria + load-on-demand (R8) |
| R7 | 200/page ceiling × many entities (read fan-out) | S2 | Hard 200 cap; sequential pages | **Tiered/scoped lazy load** (§3.5 §2); never eager-load everything; gate a company-wide TimeLog export behind a progress bar. **(VERIFY Phase 0: read rate at high page counts.)** |
| R8 | Full-text / cross-entity search | S2 | `criteria` UNVERIFIED | Two-tier: if `criteria` works → server-side scoped search (also fixes R6/R7); else in-memory over loaded data with a "load more to widen" affordance |
| R9 | File uploads / attachments | S1 | Only `setImageData` (image-ish); no documented file-field write | **(VERIFY Phase 0) — highest-uncertainty gap.** Fallback ladder L5; ship URL-link attachments if binary upload fails; never promise binary upload until proven |
| R10 | Computed / rollup / aggregation fields | S2 | No server SUM/AVG/COUNT/formula | Derive in JS from the joined store; never persist as source of truth (optionally cache a denormalized "as of last sync" value for fast cold display) |
| R11 | Resource over-allocation & capacity math | S2 | No server aggregation; allocations in a separate report | Client join Allocations→Resources, bucket by member×week vs capacity; load all allocations for the team in view (bounded "team capacity" scope) |
| R12 | Recurring tasks/milestones + time-zone math | S2 | No server scheduler/cron/date fns | **Materialize, don't compute-on-read**: expand a recurrence into N concrete records via pool-6 `addRecord` up to a bounded horizon; re-materialize near the horizon; store dates as UTC ISO, render in viewer zone. **(VERIFY Phase 0: exact date/datetime write+read format.)** |
| R13 | Undo / redo | S2 | No transactions/history; LWW | Client command stack with inverses; undo re-runs the inverse through the optimistic path after re-resolving by ID; ACCEPT session-scoped, can't undo others' edits, undeleting re-creates a row with a NEW ID (re-point FKs) |
| R14 | Write rate limits during bulk ops | S2 | ~429 after ~400 rapid / ~12 concurrent | All programmatic multi-writes through pool-6 + backoff (max 4 tries, retry only transient/429, never `2945`); progress bar; partial failure → R2 retry |
| R15 | Optimistic-write hazards (temp ids, rollback after array swap, double-submit) | S2 | LWW; arrays replaced on refresh | Monotonic temp-id; re-resolve by ID before rollback; per-item `_pending`; disable Refresh while `pendingOps>0`; reconcile temp→real id on code 3000 |
| R16 | Native lookups / subforms shape UNVERIFIED | S2 | Read shape unconfirmed | **De-risk: prefer flat ID fields over native lookups/subforms** for all relationships; subtasks as `Parent_Task_ID`, not a subform; use native lookups only where Phase 0 confirms a usable shape **(VERIFY Phase 0)** |
| R17 | No server validation / business rules | S2 | No Deluge/workflow; widget bypassable | Enforce rules in JS as UX guards, not security; ACCEPT bypass via MCP/API/other widgets → R3 sweep is the safety net; store nothing that must be tamper-proof |
| R18 | Comment threading & @mentions | S3 | No server notifications/email | Threading via `Parent_Comment_ID` self-ref; ACCEPT no push notification; surface mentions as a client-computed "@you" inbox |
| R19 | Concurrent edits to the same dependency graph (two edges that individually pass but together form a cycle) | S2 | Cycle-check on a stale local graph; no server constraint | ACCEPT the race; re-run full cycle-check against freshly loaded edges at boot/refresh (R3) and flag any cycle that slipped in |
| R20 | Cross-origin testing & deploy friction | S3 | Cross-origin iframe + manual re-pack/re-upload | Test via element-scoped `browser_evaluate` inside the iframe; seed via the widget's SDK with pool-6; accept the re-pack/re-upload loop (re-attach the zip on every Edit; Index File stays `/widget.html`) |

**What Atlas explicitly ACCEPTS as a v1 limitation:** see §2 Non-Goals (consolidated there to avoid duplication).

---

### 3.7 Phased Build Roadmap

Atlas ships incrementally: every phase produces one shippable, live-verifiable deliverable behind a **verification gate**, and Phase 0 burns down every UNVERIFIED assumption *before* any of it is committed.

#### Guiding rules (every phase)

| Rule | Source |
|---|---|
| One widget per build pass; re-deploy via `zet pack` + re-attach the zip on Edit (field clears every time) | `creator-widget-build-register.md` §6 |
| Index File = `/widget.html` exactly (never `/app/widget.html`) | build-register §3.5 |
| Init once, all API in `.then`; success = `code===3000`; read `res.data || []`; paginate till short page | `creator-widget-js-sdk.md` §1–3 |
| ADD double-wraps `data:{data:{}}` + `formName`; UPDATE uses `reportName`+`id`; DELETE uses `criteria:'ID == '+id` | js-sdk §4–6 |
| Optimistic CRUD: monotonic temp-id, re-resolve by ID before rollback, per-item `_pending`, LWW, disable Refresh while `pendingOps>0` | js-sdk Tips |
| Bulk/parallel writes: pool 6 + 4-try backoff (250/500/1000/2000 ms + jitter); retry only transient/429, never `2945` | `creator-bulk-write-throttling.md` |
| Verify live THROUGH the cross-origin iframe (element-scoped `browser_evaluate`); never trust the screenshot or `contentDocument` | `creator-widget-iframe-testing.md` |

#### Driver map (agent + skill per phase)

| Phase | Primary agent | Driving skill(s) |
|---|---|---|
| 0 Probes | creator-widget-developer + creator-qa-tester | js-sdk, iframe-testing |
| 1 Skeleton + data layer | creator-app-builder (schema), creator-widget-developer (shell) | build-register, single-page-app, js-sdk |
| 2 Core CRUD + board | creator-widget-developer | js-sdk, scalability |
| 3 Relations + dependencies | creator-widget-developer | js-sdk |
| 4 Gantt / calendar / heatmap | creator-widget-developer | scalability |
| 5 Scale / lazy-load | creator-widget-developer + creator-qa-tester | scalability, iframe-testing |
| 6 Bulk ops | creator-widget-developer + creator-qa-tester | bulk-write-throttling, iframe-testing |
| 7 Polish / a11y | creator-widget-developer + creator-qa-tester | scalability, iframe-testing |

#### Phase 0 — De-risk the UNVERIFIED contract (tiny throwaway probes, NO product code)
Prove or disprove every assumption the design leans on, against a minimal seeded schema (a `Project` form with a Members subform + an Owner lookup + a File-upload field + a Date-Time field). **Nothing downstream is committed until this gate passes.**

| Probe | Question | What to log |
|---|---|---|
| P0-A Subform/lookup read shape | What does `getAllRecords` return for a native subform + a lookup field (nested array? `{ID,display_value}`? flat id)? | Exact JSON of one real `All_Tasks` row with a populated lookup + subform. Decides §3.1 relation strategy. |
| P0-B `getAllRecords` server `criteria` filter | Does the JS SDK accept a `criteria` string and return filtered rows code 3000? Exact operator syntax for FK/lookup fields? | YES → server-side search + scoped/sharded loads (L8/§3.5). NO → in-memory filter + windowing + practical ceiling. |
| P0-C File upload | Can a widget write file content (binary via `addRecord`/`updateRecord` base64; `setImageData` for non-image blobs)? What shape does a file field read back as? | Whether Attachments is full-CRUD or URL-link only (L5/R9). |
| P0-D Multi-report read budget | At ~10 reports, are parallel page-1 `getAllRecords` calls within read quota? Read rate at high page counts? | Confirms the parallel/tiered boot plan (§3.5). |
| P0-E UTIL signatures | `getInitParams.user` shape; `getQueryParams`/`getWidgetParams` shapes + embed-time settability; `navigateParentURL` URL constraints; `setImageData` exact signature | Gates deep-linking, per-embed config, avatars, the native-record escape hatch (C6–C10). |
| P0-F Write/echo & codes | Lookup+text-FK in one payload; date-time write format; unique-constraint error code; empty-vs-error read codes (3100/9280); does a successful write echo the full record or only code+id; does delete share the ~429 quota / accept multi-condition `criteria` | Gates the mirror-FK decision, recurrence/date rendering, integrity, optimistic-settle path, cascade-delete pooling |

**Gate 0:** every probe returns a recorded, reproducible answer (PASS even if "no") AND the P0-A record shape is pasted into the design doc. Any "no" rewrites the affected phase before P1.

#### Phase 1 — Skeleton + data layer
The full Creator schema (Table A forms → `All_*` reports) exists; an empty Atlas shell boots, reads every report, renders an empty state. creator-app-builder builds the schema in the builder via Playwright (creation has NO MCP API — MCP is introspect/verify only; confirm no `link_name` collisions); creator-widget-developer scaffolds the 3-file `zet` project mirroring `stm-task-widget/`, init-once, `getInitParams` feature-detected, a generic paginated `loadAll(reportName)`, an in-memory store keyed by `link_name`. Single-page via App Menu Builder (keep all backing forms/reports as components; unlist their menu entries).
**Gate 1:** load app base → `#Page:Atlas`, confirm the NEW build renders THROUGH the iframe; each of the ~10 reports returns code 3000 (empty `data:[]` is success); `getInitParams` either themes the UI or is cleanly skipped (no throw).

#### Phase 2 — Core CRUD + Kanban board
Tasks and Projects fully CRUD-able with a scalable board. Task board grouped by Status; create/edit/move/delete a Task; create/edit a Project; quick-add. From day one: event delegation wired once in `wireBoard()` on static `#board`, 120 ms debounce, optimistic CRUD with `_pending` + LWW. Status move = `updateRecord`; new task = `addRecord` (double-wrap, monotonic temp-id, `unshift` to front).
**Gate 2:** full create→read→update(move)→delete cycle verified THROUGH the iframe with the returned record `id`; 5 concurrent drags all land; the UI-says-saved-but-XHR-failed and XHR-ok-but-UI-error checks pass; QA writes `QA-`-prefixed records and deletes them at run end.

#### Phase 3 — Relations + dependencies (read strategy dictated by P0-A)
Subtasks (self-ref `Parent_Task_ID` tree; reparent = `updateRecord`); Dependencies (FS/SS/FF/SF; **client-side cycle detection before writing an edge**; predecessor/successor chips); polymorphic Comments; Tags (CSV or `Task_Tag` join per P0-A); Attachments (real if P0-C passed, else URL-link). All cross-entity joins client-side, matched on the lookup-id shape proven in P0-A.
**Gate 3:** reparent persists and re-renders; a dependency cycle is **blocked before any write**; deleting a task with dependents is handled (edges cleaned or blocked, never dangling); a comment/tag round-trips and reloads attached to the correct entity.

#### Phase 4 — Gantt / calendar / resource heatmap (read-derived)

| View | Built from | Client-side compute |
|---|---|---|
| Gantt | Tasks (Start/Due) + Dependencies | timeline bars + dependency arrows; critical path |
| Calendar | Tasks + Milestones (dates) | month/week grid |
| Resource heatmap | Allocations + Resources.Capacity + TimeLogs | per-resource per-week utilization % (summed in JS) |

Each view is a SPA tab re-rendering from the in-memory store (no re-fetch); reuse debounce + delegation so re-renders coalesce.
**Gate 4:** seed a known fixture (e.g. 2 resources, 1 over-allocated week) and assert heatmap cell math; Gantt bars land on correct dates and arrows match `All_Task_Dependencies`; editing a task date on the board updates the Gantt without a full reload.

#### Phase 5 — Scale / lazy-load
Stay fast at 500–2000+ records. Apply the shipped windowing pattern (`PAGE_RENDER=50` per column, always render `_pending`, true badges, `.board-wrap` scroll, `scrollTop` snapshot/restore, `resetLimits()` on search/load). **If P0-B said `criteria` works**, push search/filter server-side + add load-more pagination; else keep in-memory filter + windowing.
**Gate 5:** seed N≈600 via the iframe pool-6 loop; DOM node count drops from all-rendered to ~150 cards; scroll grows 150→300→450 with `scrollTop` preserved; a 10-keystroke burst coalesces to ~1 render and stays sub-millisecond.

#### Phase 6 — Bulk operations
Multi-select bulk edits (reassign, re-status, bulk-tag, "move all", CSV-style import/seed) — the one place many parallel writes fire. MUST use the throttle: pool 6, max 4 attempts/item, exponential backoff + jitter, retry only transient/429, **never** retry deterministic `2945`. Progress (ok/fail), keep the queue moving past failures.
**Gate 6:** bulk-update ≈140 records completes with **0 failures** at pool 6 (verified reference); a deliberately malformed payload surfaces as a non-retried `2945` failure; partial-failure run reports accurate ok/fail and leaves no half-written corrupt rows.

#### Phase 7 — Polish / accessibility
Keyboard nav + focus management for board/Gantt; ARIA roles on cards/columns/dialogs; visible focus rings; color contrast on tags/status using `themeBrandColor`; disable Refresh while `pendingOps>0`; empty/error/loading states; consistent toast on `code!==3000`.
**Gate 7:** keyboard-only create→move→delete works; screen-reader labels present; contrast passes; an injected `code!==3000` shows a user-facing error AND rolls back the optimistic change (re-resolve by ID, revert only if value unchanged) — no silent failure.

#### Cross-phase rollback / replan triggers

| If a gate reveals… | Then… |
|---|---|
| P0-A: subform/lookup shape unusable for joins | restructure relations as flat ID fields + client join; revisit P3 schema before building |
| P0-B: no server `criteria` filter | drop server-side search from P5; in-memory filter + windowing; cap + document a practical dataset size |
| P0-C: no widget file upload | downgrade Attachments to URL-link references (P1 schema + P3 UI both change) |
| P2: concurrent moves stuck/lost | tighten LWW (revert only if current==set value); re-test before P3 |
| P5/P6: ~429 at pool 6 | lower POOL to 3 and/or raise base delay 250→500 |

---

## 4. Open Questions to Resolve in Phase 0

Consolidated, de-duplicated backlog, **ordered by blast radius**. Each is a hard PASS/FAIL probe in Phase 0; a "no" triggers the matching §3.7 replan trigger.

1. **Server-side `criteria` filter on `getAllRecords` (P0-B) — highest leverage.** Does the v1 JS SDK accept a `criteria` string and return filtered rows with code 3000? If yes: confirm exact operator syntax for FK/lookup fields (e.g. `Project_ID == "<id>"`, `Status != "Archived"`). A yes collapses much of the memory (R6), read-fan-out (R7), and search (R8) risk by pushing filtering server-side and enabling scoped/sharded loads; a no caps Atlas to in-memory filtering + windowing with a documented record ceiling. **Gates the load strategy of Table, Search, Calendar, and per-project Detail.**
2. **Lookup & subform read shape (P0-A).** Exact JSON `getAllRecords` returns for a native lookup and a subform — flat id string, `{ID, display_value}` object, or nested array — pinned from one real `All_Tasks` row with a populated lookup + subform. Gates the `normalize()` function and the flat-FK-vs-native-lookup decision (R16); the entire P3 relations design waits on this.
3. **Lookup + mirror text-FK write in one payload (P0-F).** Can a single double-wrapped `addRecord` set a native lookup (by ID) **and** a parallel `*_ID` text field, or does the lookup reject a raw id / require `display_value`? If awkward, drop the two tolerated lookups (`Time_Log.Member`, `Allocation.Member`/`Project`) and keep only text FKs.
4. **File upload path (P0-C, R9, L5).** Can a widget write real file content — (a) `setImageData` with a non-image blob, (b) `addRecord`/`updateRecord` populating a native File field from base64 in the double-wrapped `data`, (c) what shape does a file field read back as? If all fail, ship URL-link attachments only.
5. **Multi-report read budget & read rate at high page counts (P0-D, R7).** Are ~10 parallel page-1 `getAllRecords` calls within read quota on cold boot? Is there a per-minute read cap that hundreds of TimeLog pages or many concurrent 20 s pollers could trip?
6. **`UTIL` signatures & shapes (P0-E, C6–C10).** `getInitParams.user` (email/name/id?); `getQueryParams`/`getWidgetParams` (object vs string, settable at embed time?); `navigateParentURL` allowed URL forms / same-origin constraint; `setImageData` exact signature (field vs base64/blob vs record id; arbitrary record or only the embedding one?).
7. **Date-Time write/read format (P0-F, R12).** What string format does a Date-Time field (e.g. `Comment.Created_At`) accept and return in the double-wrapped payload (epoch ms / ISO / Creator `dd-MMM-yyyy HH:mm:ss`)? Gates recurrence expansion and time-zone rendering.
8. **Successful-write echo (P0-F).** Does `addRecord`/`updateRecord` echo the full saved record (server ID + computed/lookup fields), or only code+id? Decides whether the optimistic-settle path reconciles from the echo or re-fetches the single row.
9. **Empty-vs-error read codes (P0-F, R3/R15).** Are `3100`/`9280` real "empty" codes or errors? Confirm so a transient error never wipes a populated in-memory store (only tolerate "empty" on page 1 when the board is already empty).
10. **Unique-constraint enforcement (P0-F).** Does a field-level `unique` violation (e.g. `Project_Code`) return a distinct, surfaceable error code, or must uniqueness be fully client-checked before write?
11. **Multi Line CSV round-trip (P0-A adjacent).** Confirm a large `Task.Tag_IDs` / `Comment.Mentions` CSV round-trips without truncation; pick a max tag count per task before switching to a `Task_Tag` join form.
12. **Pagination total count.** Does `getAllRecords` expose a total record count anywhere (for "X of N" badges and pre-sizing index Maps), or must totals be derived only after fully paginating?
13. **Delete quota & multi-condition `criteria` (P0-F, R1/L4).** Does `deleteRecord` share the ~429 write quota (so cascade delete uses the same pool-6)? Does a multi-condition `criteria` string support a single bulk cascade delete, or must cascade be one-ID-per-call through the pool?
14. **Hash preservation across the Creator SPA shell (§3.4).** Does the parent shell preserve the widget-iframe `location.hash` across its own navigation/reload, so `#/proj/123/board` deep-links survive? If stripped, fall back to an in-memory `currentRoute` (no functional loss, no deep-linking).
15. **Per-iframe memory ceiling (R6).** Real measurement of holding the full PSA graph resident (5k tasks / 20k logs) in Maps — to set the eager-vs-lazy threshold for TimeLogs.
16. **CPM main-thread threshold (§3.5).** At what task count does a synchronous CPM forward/backward pass exceed ~16 ms and require a Web Worker?
17. **`Project.Task_Count` race-safety (§3.5).** If `criteria` fails, is a client-maintained `Task_Count` rollup (written on every task add/delete) race-safe enough under concurrent users / LWW to drive per-project shard pagination?
18. **No-push confirmation & modified-time field (R5, §3.5).** Confirm there is genuinely no push/websocket/long-poll affordance in v1, and that `getAllRecords` returns a modified-time/last-updated field needed to diff polled rows and suppress self-echo.
19. **Charting library / CSP (Portfolio view).** Can the widget bundle/host a charting library, or must charts be hand-rolled in SVG? If a CDN lib is used, what external origins are allowed in `plugin-manifest.json` `connect-src`?
20. **Read-side audit/change feed (Activity tab).** Is there any read-side change feed, or is "Activity" limited to `Comment` rows plus this session's locally-tracked writes?

**Design-decision questions (resolve alongside Phase 0, not pure SDK probes):**
- **Comments/Attachments modeling:** one polymorphic form (`Parent_Type` + `Parent_ID`) vs per-parent child forms (more forms, simpler reads). Default: single polymorphic form.
- **Tags M:N:** `Task.Tag_IDs` CSV vs a `Task_Tag` join form — depends on P0-A subform shape and CSV round-trip (Q11) and whether tags are reused beyond Tasks.
- **One mega-widget vs a small set of widgets:** decided as ONE SPA (§3.4); revisit only if per-iframe memory (Q15) forces a split.
- **Critical path in v1 or deferred:** in-scope for v1 (Phase 4), gated on the CPM threshold (Q16).
- **Polling cadence:** default off; opt-in scoped 20/60/15 s adaptive (§3.5) if read quota (Q5) allows.

---

## 5. At-a-Glance

| Dimension | Value |
|---|---|
| **Entities (forms)** | 10 — Project, Resource, Task, Task_Dependency, Allocation, Time_Log, Milestone, Tag, Comment, Attachment (+ `Checklist_Item` subform inside Task) |
| **Read reports** | 10 `All_*` list reports (1:1 with forms); optional `Tasks_Kanban` native fallback component |
| **Views / screens** | 11 — Portfolio, Project List, Project Detail (5 tabs), Kanban Board, Gantt/Timeline, Calendar, Resource Heatmap, My Work, Virtualized Table, Time-Tracking, Global Search |
| **SDK features exercised** | All 10 verified v1 calls — `init`, `getAllRecords`, `addRecord`, `updateRecord`, `deleteRecord`, `getInitParams`, `getQueryParams`, `getWidgetParams`, `navigateParentURL`, `setImageData` (no 11th call permitted) |
| **SDK limits engineered around** | 10 (L1–L10): no join, no aggregation, no transactions, no cascade, file-upload unclear, no realtime, 200/page, criteria UNVERIFIED, ~429 write limit, no server-computed fields |
| **Target volumes** | 50 projects · 80 resources · 5,000 tasks · 8,000 dependencies · 20,000 time logs · 12,000 comments · 6,000 attachments |
| **Concurrency model** | Optimistic CRUD + monotonic temp-id + per-item `_pending` lock + last-write-wins; bulk via pool-6 + backoff (max 4 tries) |
| **Topology** | ONE single-page `widget.html`, hash router, shared in-memory Store; Index File `/widget.html` |
| **Phases** | 8 (Phase 0 de-risk → Phase 7 polish), each with a live verification gate THROUGH the cross-origin iframe |
| **Phase-0 open questions** | 20 SDK probes + 5 design decisions (§4); `criteria` support is the single highest-leverage unknown |
| **Reused repo skills** | js-sdk · scalability · bulk-write-throttling · iframe-testing · build-register · single-page-app · delete-components |

---

*Source of truth: `skills/creator-widget-js-sdk.md`. Reused: `creator-widget-scalability.md`, `creator-bulk-write-throttling.md`, `creator-widget-iframe-testing.md`, `creator-widget-build-register.md`, `creator-single-page-app.md`, `creator-delete-components.md`. Worked spine: `stm-task-widget/app/widget.html`. Custom agents: creator-app-builder, creator-widget-developer, creator-qa-tester.*

---

## 6. Critique Resolutions & Ultra-Hard Hardening (v1.1)

> Adversarial review found the §1–§5 design **genuinely hard on relational depth / views / algorithms, but secretly MEDIUM on scale and concurrency** because the hardest paths were scoped-away or "accepted". Since the goal is *genuinely ultra-hard*, this section makes those paths **REQUIRED, gated, and tested**, fixes one correctness bug, and closes the capability gaps. **Where v1.1 conflicts with §1–§5, v1.1 wins.**

### 6.0 Correctness fix (carry into Phase 0)
- **`getInitParams()` is treated as Promise-returning and the env field is `envUrlFragment`** (per the verified `stm-task-widget` spine), NOT a synchronous `u.env`. §3.3 C6 and the boot sequence are corrected; the source skill `creator-widget-js-sdk.md` is fixed to match. **P0-E** must probe the exact shape (sync vs Promise; `env` vs `envUrlFragment`; the `user` key path) and the boot must handle whatever it finds via a catch-guard. **Gate 1 depends on this.**

### 6.1 Make SCALE required (was 5/10 → target ≥8)
- **New REQUIRED view — "Capacity & Forecast" (portfolio-wide):** sums **ALL 20k Time_Logs × ALL Allocations × ALL 50 Projects simultaneously** to show per-resource utilization and budget burn across the whole portfolio. It **cannot be per-project scoped** — it forces the full graph resident and a full-store aggregation every recompute.
- **Hard scale gate (Gate 5):** seed **5,000 tasks + 20,000 time logs + 8,000 deps** via the pool-6 loop (`creator-bulk-write-throttling.md`), then assert THROUGH the iframe: **boot-to-interactive < 2.5 s**, **Capacity recompute < 16 ms/frame** (else Web Worker), and a **measured per-iframe memory ceiling** (Q15) is a **blocking** probe. No more "545 dressed as 25k".
- **The no-`criteria` world is the REQUIRED path, not a fallback:** the sharded/tiered loader (per-project reads driven by client-maintained `Task_Count`) must be built and tested at full volume regardless of the P0-B result; a positive `criteria` result is an *optimization*, not a prerequisite.

### 6.2 Make CONCURRENCY required (was 5/10 → target ≥8)
- **Version/etag compare-and-swap on write** (gated on the P0 modified-time probe): each record carries `Modified_Time`; an update reads-compares-writes so concurrent edits to **different fields of the same record both survive** (field-level merge), instead of blanket last-write-wins.
- **Live multi-writer gate (Gate 6):** **two iframes** edit the same project's task/dependency graph at once; assert (a) the loser reconciles **without clobbering its own unsaved edit**, and (b) a dependency cycle **jointly formed by two writers is detected and surfaced live**, not at next boot.
- **Adversarial contention test:** 6 pollers + 3 writers hammer one project's dep graph; assert **zero orphaned edges** and **bounded staleness**. "Eventually consistent" becomes a *tested guarantee*, not an excuse.

### 6.3 Make ALGORITHMS required-hard (was 6/10 → target ≥8)
- **Portfolio-scale CPM:** critical path over the FULL 8k-edge / 5k-task graph; the O(V+E) pass must run in a **mandatory Web Worker** (not an optional contingency) with **incremental recompute** (only the affected subgraph on an edge change), gated by a perf assertion.
- **RCPSP resource-leveling (NP-hard, real PSA feature):** when two critical-path tasks need the same over-allocated resource in the same week, auto-shift one (heuristic) and re-run CPM. This is the marquee "can a browser-only SDK app do hard CS" stress.
- **Deterministic CPM fixture in Gate 4:** a small DAG with hand-calculated critical set + per-task slack; assert computed == expected, plus a cycle-rejection assertion. CPM correctness is verified separately from dependency-arrow rendering.

### 6.4 Keep one un-flattenable relational construct (was 8/10 → target ≥9)
- **Real `Task_Tag` M:N join form** (replaces the `Tag_IDs` CSV): a third many-to-many that must be **independently paginated and hash-joined** — a real relational join, not a string split.
- **Bitemporal `Allocation`:** effective-dated rows so *"who was allocated to X as-of last month"* is answerable → forces **interval-overlap joins**, not point lookups.
- **Cross-entity invariant:** on every Allocation write, enforce **Σ(a member's Allocation_Pct across overlapping weeks/projects) ≤ 100%** — a multi-entity guard with zero SDK support, computed client-side before the write.

### 6.5 View/UX push (was 9/10; optional polish)
- **Gantt with bidirectional virtualization** (time-axis AND task-tree windowed) where **dependency arrows anchor correctly to off-screen/virtualized rows** — breaks the proven flat `.board-wrap` windowing and is genuinely new.

### 6.6 Close the capability gaps (completeness)
- **Auth/permissions → explicit Non-Goal + probe:** Atlas has **no app-level authorization** (a client widget can't enforce at-rest access; financial fields like `Cost_Rate` are visible to anyone who can open the page). **P0 probe:** does Creator enforce **report-level sharing** the widget inherits, and does `getInitParams` expose the viewer's role? Document the answer; do not pretend to gate access in JS.
- **Export/Reporting → new feature:** client-side **CSV export** of timesheets/billable hours/project status from the in-memory store (billable + `Cost_Rate` imply invoicing); PDF via `skills/app-documentation-pdf.md` is the candidate for a status report.
- **Notifications → in-app only (Non-Goal for push):** due-date/assignment/milestone alerts surface as **client-computed in-app badges + an "@you" inbox**; no server cron/email in v1 (one-line probe on whether the repo's scheduled-tasks/cron tooling is reachable from the widget — expected: no).
- **Saved views / preferences → `Preference` form (11th form), keyed by user ID:** persists filters, sort, column widths, Gantt zoom, last-used project. (iframe `localStorage` is partitioned/unreliable — **P0 probe** whether it survives reload; default to the `Preference` form.)

### 6.7 Phase-0 & gate hardening
- **Split the bundled P0-F** into separately pass/failed sub-probes: lookup+text-FK payload · date-time format · unique-constraint code · empty-vs-error read codes (3100/9280) · write echo (pre-filled: `res.data.ID` is known) · delete quota · multi-condition `criteria` delete.
- **Add missing P0 probe rows** (Gate-0 requires an answer for each): charting **CSP/`connect-src`** (manifest `connect-src` is empty → hand-rolled SVG if blocked) · **modified-time field + sustained-poll read-rate + max page-depth** read ceiling · **iframe hash preservation** across the Creator SPA shell · **per-iframe memory ceiling** · **subform round-trip on the real `Task.Checklist`** (pre-commit a separate `Checklist` form + `Task_ID` FK as the fallback so a subform "no" strands nothing).
- **File upload:** **URL-link attachments are the v1 default**; the native `File` field is a **P0-C-conditional add-on excluded from the committed Phase-1 schema** (so a "no" is not a migration). Files-tab degraded design (paste-a-link form + link grid, no drag-drop) is **specified**, not implicit.
- **Saga demoted** to a **best-effort in-session retry queue + the boot-time integrity sweep** (no durable `Op_Log`, no cross-reload undo — stated in Non-Goals). Undo stays session-scoped.
- **New rollback trigger:** if the memory-ceiling probe shows the full graph isn't resident-able → keep Time_Logs/Comments/Attachments strictly lazy, lower the task ceiling, and **re-evaluate the single-SPA decision** (the one architecture bet the plan stakes everything on).

### 6.8 Revised "ultra-hard" scorecard (post-hardening targets)
| Axis | Was | Target | Lever |
|---|---|---|---|
| Relational depth | 8 | 9 | real `Task_Tag` join · bitemporal Allocation · cross-entity invariant |
| View/UX | 9 | 9 | bidirectional Gantt virtualization (optional polish) |
| Scale | 5 | 8+ | required Capacity view · 25k-record seeded gate · sharded path required |
| Concurrency | 5 | 8+ | version-CAS · 2-iframe live gate · 6×3 contention test |
| Algorithms | 6 | 8+ | portfolio CPM in Worker · RCPSP leveling · incremental recompute |

---

## 7. Phase 0 results — Probe Set A (verified 2026-06-13/14, live against the SDK)

Run via the iframe-eval technique against the live `simple-task-manager` SDK (no new forms needed). **Set A is a decisive GO and the SDK is MORE capable than §1–§6 assumed.**

| # | Probe | Result | Impact on plan |
|---|---|---|---|
| A1 | **`getAllRecords` server-side `criteria`** | **WORKS** — `code 3000`, correctly filtered; operators `==` `!=` `&&` `||` `.contains()` `.startsWith()` all verified | **Biggest de-risk.** L8/"no reliable server filter" is FALSE. Search, Table/Calendar/Detail scoped loads, and per-project sharding all become **server-side queries**. The "few-thousand-task ceiling" non-goal is **lifted** — pull only what a view needs by criteria + page. |
| A2 | **`deleteRecord` is criteria-based** | Returns `{ result:[{code:3000,data:{ID}}], code:3000 }` — a single call can match MANY rows | **Cascade delete in ONE call** (e.g. `Project_ID == "<pid>"`), not N calls. Simplifies R-cascade and the bulk-delete quota story. |
| A3 | **`getInitParams()` shape** | **SYNCHRONOUS** object: `{ scope, envUrlFragment, appLinkName, loginUser, themeBrandColor }` | Corrects §3.3 C6 + the js-sdk skill (was "Promise"). Read it directly (no `.then`). "My Work" matches **`loginUser`** (email), not `user`. `envUrlFragment==""` = production. Resolves Gate-1 blocker. |
| A4 | **`addRecord` echo** | `{ code:3000, data:{ID}, message }` — ID only, not the full row | Optimistic-settle keeps in-memory values + patches the new `ID` (already the STM pattern). |
| A5 | **Read response shape** | `{ code, data }` only — **no total-count field** | "X of N" badges need a separate count-by-criteria query (or show loaded count). Pre-sizing Maps can't use a server count. |

**Replanned decisions from Set A:** (1) adopt **server-side `criteria`** as the primary load/search/filter mechanism across Table, Search, Calendar, Project Detail, and per-project task sharding — the client-side-only fallback becomes a true fallback, not the default; (2) **lift the few-thousand-task ceiling** non-goal; (3) cascade-delete via one criteria call; (4) boot reads `getInitParams()` synchronously for theme/env/identity.

**Still to probe — Set B (needs a small probe form with those field types; next step):** subform read/write shape · native lookup read/write shape · binary file upload (`setImageData` / base64 file field) · Date field read/write format · empty-vs-error read codes (3100/9280) · unique-constraint error code. These gate the FK-vs-lookup detail, the Files tab, recurrence/TZ, and the Checklist subform — none block starting Phase 1's app + flat-FK schema.
