# Knowledge Reflection Workflow (Repeatable)

## Use This When
Use this when the user says: "reflect into skills", "turn this into agent assets", "capture learnings", "make this repeatable", "capture this knowledge", "update the repo" — or at session closure. Turns one session's learnings into reusable repo assets (skills, agents, indexes), each written for the LEAST capable model that will use it.
Do NOT use when: the user only wants a code change with no intent to capture reusable knowledge.

## Core Principle — Write for the Least Capable Model
Every asset (skill or agent) must be followable by a weak "mini" model with ZERO guesswork. See the Step 4b rubric below; apply it to every file you write.

## Prerequisites
Before Step 1, confirm ALL of these:
1. Repo is cloned and you know the layout: `skills/`, `.claude/agents/`, `AGENTS.md`, `docs/skills-index.md`.
2. Read `CONTRIBUTING.md` for the skill template.

## Steps

### Step 1 — Enumerate learnings
1. List every new pattern, exact selector/element id, URL pattern, SDK/API call shape, gotcha, and error+fix from this session.
2. Mark each item **VERIFIED** (you personally saw it work) or **UNVERIFIED**.

### Step 2 — Classify each learning to the right asset
Apply these rules in order; pick the FIRST that matches:
1. Granular reusable how-to or reference → `skills/*.md` (lowercase-hyphen name; domain prefix `creator-` / `playwright-` / `zoho-mcp-`).
2. A repeatable multi-skill ROLE/persona an agent plays → Custom Agent at `.claude/agents/<name>.md` (focused, single-responsibility; references skills by path).
3. A cross-cutting decision tree / index / workflow change → edit `AGENTS.md`.
4. External resource pointer or project/session state → personal agent memory, NOT the repo.
5. Credentials/tokens → NEVER in the repo. Store in agent memory only.

### Step 3 — Prefer UPDATE over duplicate
1. Grep for an existing file before creating a new one:
   ```bash
   grep -ril "<keyword>" /Users/aathira-19635/Source/zoho-creator-skills/skills/
   ```
2. If a match exists → update that file. If none → create new.
3. If the updated file would exceed 100 lines → split per Step 4.

### Step 4 — Apply granularity rules (skills)
1. ONE concept per skill file.
2. HARD max 100 lines (run `wc -l <file>`; if > 100, split or trim).
3. Include only copy-pasteable exact examples.
4. Document the gotcha AND its fix together.
5. Date-stamp verified facts, e.g. `(verified 2026-06-13)`. UNVERIFIED facts: label in-file; never date-stamp as verified.

### Step 4b — Write for weak models (apply to EVERY skill and agent)
Rewrite the asset's body so a mini model needs zero guesswork. Checklist:
1. Lead with a one-line "Use this when…" trigger (add "Do NOT use when…" if relevant).
2. Convert prose to NUMBERED, imperative steps — ONE concrete action per step (e.g. "1. Run `…`", "2. Click `#id`").
3. Give EXACT copy-pasteable commands, full URLs, and element selectors/ids. Never write "go to settings" — give the exact URL/selector.
4. Show payload shapes literally (full JSON/object).
5. Add explicit DECISION RULES, e.g. "If response code === 3000 → success; else → reject and show the error."
6. For every known failure add an "If you see X → do Y" line.
7. State preconditions ("Before step 1, confirm …") and how to verify success ("Verify: …").
8. BAN vague verbs (handle / manage / deal with), implicit knowledge, and "etc.".
Constraints to keep: skills stay ≤100 lines; agents KEEP their YAML frontmatter and must NOT include a `tools:` allowlist.

### Step 5 — Update the indexes
1. Edit `AGENTS.md`: Skills Index table + Custom Agents section + any decision-tree branch.
2. Edit `docs/skills-index.md`: add a row under the correct category.
3. Cross-link related skills.
4. Verify every link resolves to a real file:
   ```bash
   for f in $(grep -oE '[a-z0-9-]+\.md' docs/skills-index.md); do
     test -e skills/$f || echo "BROKEN LINK: $f"
   done
   ```
   Verify: the loop prints nothing (no `BROKEN LINK:` lines).

### Step 6 — Hand off to session closure
Run `skills/session-closure-workflow.md` for git identity check, commit, and push.

## Troubleshooting
- If new skill duplicates an existing one (Step 3 grep skipped) → merge into the existing file; delete the duplicate.
- If index links 404 (filename typo or wrong category row) → run the Step 5 link check; correct the filename.
- If a skill exceeds 100 lines (multiple concepts in one file) → split per Step 4 (one concept each); cross-link them.
- If credentials leaked into repo (misclassified session state as a skill) → remove them, rotate the secret, store in agent memory.
- If an asset reads as vague prose → re-run the Step 4b checklist; replace every vague verb with a numbered exact action.

## Tips
- Classify BEFORE writing — most rework comes from putting a learning in the wrong asset type.
- This process can run as a multi-agent workflow: one author per file, then an integrate pass, then adversarial QA critics — faster and more consistent.

## Related Skills
- [session-closure-workflow.md](session-closure-workflow.md)
- [github-identity-enforcement.md](github-identity-enforcement.md)
