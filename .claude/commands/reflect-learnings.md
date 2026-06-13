---
description: Reflect this session's Zoho Creator learnings into repo skills, custom agents, and AGENTS.md
---

Execute `skills/knowledge-reflection-workflow.md` end-to-end for the CURRENT session. Read that
skill first and follow its steps exactly; this command is the trigger, the skill is the procedure.

## What to do

1. **Enumerate learnings (Step 1).** List every new pattern, exact selector/element id, URL
   pattern, SDK/API call shape, gotcha, and error+fix discovered this session. Mark each as
   **VERIFIED** (you saw it work) or **UNVERIFIED**. Never date-stamp an unverified fact as verified.

2. **Classify each learning (Step 2).** Route every item to exactly one asset type:
   - Granular reusable how-to / reference → a `skills/*.md` file (lowercase-hyphen, domain prefix
     `creator-` / `playwright-` / `zoho-mcp-`).
   - A repeatable multi-skill ROLE/persona → a focused, single-responsibility Custom Agent at
     `.claude/agents/<name>.md` that references skills by path.
   - A cross-cutting decision tree / index / workflow change → edit `AGENTS.md`.
   - External resource pointer or project/session state → personal agent memory, NOT the repo.

3. **Prefer UPDATE over duplicate (Step 3).** Grep `skills/` first; extend an existing skill
   instead of creating a near-duplicate. Split content if a file would exceed the line cap.

4. **Apply granularity rules (Step 4).** ONE concept per skill, HARD max **100 lines**, follow the
   skill template in `CONTRIBUTING.md`, copy-pasteable exact examples only, document each gotcha AND
   its fix, date-stamp verified facts e.g. `(verified 2026-06-13)`.

5. **Update both indexes and cross-link (Step 5).** Add/adjust rows in `AGENTS.md` (Skills Index
   table + Custom Agents section + any decision-tree branch) and in `docs/skills-index.md` under the
   right category. Cross-link related skills and verify every link resolves to a real file.

6. **Hand off to session closure (Step 6).** Run `skills/session-closure-workflow.md` for the git
   identity check, commit, and push.

## Notes

- This can be parallelised as a workflow: **author** (one writer per file) → **integrate** (merge,
  index, cross-link) → **QA** (adversarial critics check the 100-line cap, broken links, and
  correct classification). Faster and more consistent than doing it serially.
- Keep secrets/credentials/tokens OUT of the repo — misclassified session state goes to personal
  agent memory, never a skill or agent file.
