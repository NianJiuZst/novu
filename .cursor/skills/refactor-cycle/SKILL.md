---
name: refactor-cycle
description: Cloud-first, random-sample refactor cycles with Safe Refactors (diff + handoff) and optional Design Proposals (no diff). Uses Smell + ICE and stops for approval.
---

# Refactor Cycle Skill (Random Sample + Cloud Fan-out)

## Objective
Continuously propose **small-to-medium, high-signal refactors** that improve readability, maintainability, and consistency.

**Default:** preserve behavior.  
**Never over-engineer.**  
**Never change behavior unless explicitly approved.**

---

## Allowed (Safe Lane)
Behavior-preserving refactors such as:
- Remove dead/duplicated/unreachable code; unused imports/vars.
- Simplify conditionals/control flow; reduce nesting; extract small helpers.
- Improve naming; clarify interfaces; add/adjust type hints.
- Replace magic numbers/strings with constants.
- Prefer standard-library utilities over redundant custom code.
- Lightweight perf wins that don’t affect outputs.
- Tests/docs adjustments strictly required by the refactor.

---

## Not Allowed Without Explicit Approval
- Public API changes, schema changes, migrations.
- New dependencies/frameworks.
- Large architecture shifts, broad file restructures, big renames.
- CI/build system changes.
- Refactors that may change runtime behavior.
- Ignore refactorings of `await` return and redundant awaits in general.
- Ignore build folders and generated outputs (`dist`, `build`, `.next`, `coverage`, etc.).

---

## Two-Lane Output

### Lane A — Safe Refactors (default)
**Must be behavior-preserving** and **low risk**.  
Output includes **diff + handoff task**.

### Lane B — Design Proposals (optional)
Structural improvements that likely cause churn (re-org, module boundaries, big reshapes).  
Output includes **options + migration plan**, **NO diff**.  
Only include if **Impact = High**. Max **2** per cycle.

---

## Proposal Gate (Smell + ICE)

Each item MUST include:

### Smell tags (at least one)
- duplicate logic
- long function / deep nesting
- magic constants / primitive obsession
- type hole (`any`, casts), suppressions (`ts-ignore`, `eslint-disable`)
- unclear interface / mixed responsibilities
- error-handling smell (swallowed errors, ambiguous fallbacks)
- shotgun surgery risk (same change repeated in multiple places)

### ICE
- **Impact:** High | Med | Low
- **Confidence (behavior preserved):** High | Med | Low
- **Effort:** S | M | L

#### Lane A (Safe Refactor) passes only if:
- Confidence = **High**
- Effort ∈ **{S, M}**
- Impact ∈ **{High, Med}**

#### Lane B (Design Proposal) allowed if:
- Impact = **High**
- Effort ∈ **{M, L}**
- Confidence ∈ **{Med, High}**
- Must include options + migration plan; NO diff

---

## Process (MUST follow exactly)

### 1) Randomly sample files for inspection (MUST run commands; no simulation)
You MUST generate a candidate file pool by executing shell commands that randomly sample across apps + packages + libs (including `dashboard`, `api`, `worker`, and shared libs/packages). Do not limit sampling to just one app.

Run at least these commands (skip missing folders and explicitly note “skipped (not found)”):

- API candidates (8):
`find apps/api/src -type f -name "*.ts" ! -name "*.spec.ts" | sort -R | head -8`

- Dashboard candidates (8):
`find apps/dashboard/src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.spec.ts" ! -name "*.test.ts" | sort -R | head -8`

- Worker candidates (8) (if folder exists):
`find apps/worker/src -type f -name "*.ts" ! -name "*.spec.ts" ! -name "*.test.ts" | sort -R | head -8`

- Packages candidates (8) (if folder exists):
`find packages -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.spec.ts" ! -name "*.test.ts" | sort -R | head -8`

- Libs candidates (8) (if folder exists):
`find libs -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.spec.ts" ! -name "*.test.ts" | sort -R | head -8`

Then:
- Combine outputs into a single pool (dedupe).
- Select **3–7 distinct files**.
- Prefer diversity across areas.

Hard rules:
- Do NOT default to previously opened files.
- Inspect and propose refactors primarily within the selected files.
- Only touch additional files if required for correctness/typing/tests; keep expansion minimal.
- Do NOT create tracking/log files.

Before analysis, output:
- exact commands (including skipped ones)
- raw outputs from each command
- final chosen 3–7 file list

### 2) Inspect only that slice and propose candidates
- Prefer clear payoff and low blast radius.
- Avoid churn: no reformat-only diffs, no broad renames, no broad rewrites.

### 3) Produce output
- Lane A: **up to 5** Safe Refactors that pass the gate.
- Lane B: **0–2** Design Proposals if truly high-impact.

Quota rule: Do NOT invent proposals.
- If <3 Lane A proposals qualify, you MUST re-sample a NEW slice and repeat.
- After 3 rounds, if still <3 qualify, report “sample looks healthy” and include at most 1–2 optional notes (no diffs).

### 4) Stop for approval
Do NOT apply changes unless explicitly approved.

---

## Output Formats (STRICT)

### Lane A — Safe Refactor
~~~markdown
## Proposal <A/B/C>: <Short Title>

**Lane:** Safe Refactor  
**Smell tags:** <...>  
**ICE:** Impact=<High/Med>, Confidence=High, Effort=<S/M>

**Scope files:**
- path/to/file1.ts
- path/to/file2.ts

**Rationale:** <why this helps>
**Constraints:** Behavior-preserving; no new deps; minimal diff; follow existing repo style.
**Risk:** Low | Medium
**Blast radius:** <functions/modules touched + why>
**Plan:**
- <Step 1>
- <Step 2>

**Verification:**
- <command/check 1>
- <command/check 2>

**Diff:**
~~~diff
--- a/path/to/file.ext
+++ b/path/to/file.ext
@@
- <before lines>
+ <after lines>
~~~

**Handoff task (copy/paste to implementer prompt):**
~~~text
Goal: <1 sentence objective>

Files to edit:
- path/to/file1.ts
- path/to/file2.ts

Steps:
- <short checklist item>
- <short checklist item>

Do not:
- <avoid scope creep constraint>
- <avoid behavior changes constraint>
- <no new deps>

Done when:
- <acceptance criterion>
- <acceptance criterion>

Verify by:
- <command>
- <command>
~~~
~~~

### Lane B — Design Proposal
~~~markdown
## Design Proposal <D/E>: <Short Title>

**Lane:** Design Proposal  
**Smell tags:** <...>  
**ICE:** Impact=High, Confidence=<Med/High>, Effort=<M/L>

**Problem:** <what pain this causes + where you saw it>
**Proposed direction:** <what better structure looks like>

**Options (2–3):**
- Option 1: ...
  - Pros:
  - Cons:
  - Migration steps:
- Option 2: ...
  - Pros:
  - Cons:
  - Migration steps:

**Risk / churn:** <what could break + what will be noisy>
**Success criteria:** <how we’ll know it’s better>
**If approved:** implement in phases (Phase 1/2/3) with checks after each.
~~~
