---
ticket: T017
phase: review
status: done
created: 2026-07-01
requires:
  - aes/tickets/T017-name.md
  - aes/tickets/T017-plan.md
  - aes/tickets/T017-build.md
  - aes/tickets/T017-verify.md
produces:
  - aes/tickets/T017-review.md
verdict: approved-with-conditions
---

# T017 — Review

## Decision: APPROVED WITH CONDITIONS

## Summary
The source changes are correct and safe — 7 files modified across 3 bugs, all non-invasive single-purpose fixes. No never-do violations (no EE license validation, no `ENTERPRISE_LICENSE_KEY`, no EE code reuse, no license gates). 3 of 6 hotfixes are deployed and confirmed working in the running container. However, an i18n missing key (`ai_smart_tools`) will surface after rebuild, and the enterprise page title still says "Enterprise License" despite the plan specifying it should be changed. Three hotfixes (teams, sidebar, pending-downgrade-banner) remain undeployed to compiled chunks.

## Problems Found

### Blocking
*None*

### Important
1. **Missing i18n key `ai_smart_tools`** — `workspace.settings.enterprise.ai_smart_tools` does not exist in any locale file. When the source enterprise page is rebuilt (not hot-patched), this feature will render the raw key string instead of a translated name. The hot-patch in the running container bypasses this (uses hardcoded English), but a future `pnpm build` will expose it.
   - Fix: Add `"ai_smart_tools": "AI Translation"` to the `workspace.settings.enterprise` namespace in all locale JSON files.
   - File: `apps/web/locales/*.json` (all 15 locales)

2. **Enterprise page title not updated per spec** — The plan (§115) specifies title "Recursos" or "AGPL Open Source". The implementation uses `t("common.enterprise_license")` which renders "Enterprise License" (en-US) / "Licença Enterprise" (pt-PT). This contradicts the intent to remove enterprise-license terminology.
   - Fix: Use `t("common.agpl_resources")` or a hardcoded title in both `page.tsx` and `loading.tsx`. If using a translation key, add it to all locale files.
   - Files: `enterprise/page.tsx:31`, `enterprise/loading.tsx:12`

3. **3 of 6 hotfixes not deployed to running container** — Teams page, sidebar label, and pending-downgrade-banner source changes are written but the compiled chunks (`[root-of-the-server]__0hgn.74._.js`, `apps_web_096jbhk._.js`, `_0x33tt8._.js`) were not hot-patched. These will only take effect after a full Docker rebuild.
   - Severity: depends on whether a rebuild is imminent. If the container runs unchanged for weeks, teams page renders "No teams found." and sidebar shows "Enterprise License".

### Suggestions
4. **Hardcoded "AGPL Resources" in sidebar** — `SettingsSidebarContent.tsx:365` uses a hardcoded English string instead of `t()`. The surrounding sidebar items all use i18n keys. If the deployment is Portuguese (pt-PT), this string stays English.
   - Fix: Add a `t("common.agpl_resources")` key to locale files and use it here.

5. **`loading.tsx` skeleton shape** — The loading skeleton (1 x h-16 + 1 x h-48) doesn't match the actual page layout (rounded-xl + grid). Low impact since loading state is transient, but visually inaccurate.

6. **`as any` cast on i18n key** — `t(`workspace.settings.enterprise.${feature}` as any)` (`page.tsx:43`) suppresses TypeScript checking. All 14 keys currently exist (except `ai_smart_tools`), but future refactors won't catch broken keys.

## Highlights
- **Feedback-directories hotfix was non-trivial**: The sed approach to inject `a.i(187924).jsx` was an effective workaround. It succeeded because `a.i()` resolves from the global Turbopack module registry (loaded via `R.c()` before the page chunk evaluates), not just the chunk's own scope. This insight is worth documenting.
- **Enterprise page hot-patch is clean**: The Python replacement of module 286024 in `[root-of-the-server]__0t3~5_y._.js` completely eliminates license UI. The rendered HTML confirms all 14 features with green checkmarks, no "Verificar licença novamente" button, and the AGPL description text.
- **Zero scope creep**: Only the 3 bugs identified in the reconnaissance were addressed. The Prisma `getWorkspacePermissionByUserId` bug (unrelated, pre-existing) was explicitly scoped out.
- **No critical files modified**: None of the CLAUDE.md-listed critical files (`modules/ee/license-check/`, `modules/ee/audit-logs/`, etc.) were touched.

## Backlog Tickets Created
| ID | Title | Priority |
|----|-------|----------|
| T018 | Add missing `ai_smart_tools` i18n key across all locale files | medium |
| T019 | Update enterprise page title from "Enterprise License" to AGPL-neutral text | low |
| T020 | Hot-patch remaining 3 compiled chunks (teams, sidebar, pending-downgrade-banner) | high |

## Context for Learn
- **Hardcoded English vs i18n trade-off**: The plan explicitly chose hardcoded English for AGPL-specific text ("simpler; impact minimal for PT deployment"). This is a pragmatic choice for a single-language deploy but creates maintenance burden if multi-language support is needed later.
- **Hot-patching compiled chunks in Turbopack**: The module system uses `module.exports=[id,fn,id,fn,...]` where `a.i()` resolves from the global registry. Injecting a `jsx()` call via sed worked because the `jsx` module is loaded by the app-page template before the page chunk evaluates. This approach is fragile — any chunk hash change breaks the patch.
- **Missing i18n key `ai_smart_tools`**: The key used in the `FEATURES` array doesn't exist in any locale file. The pre-existing keys are `ai_smart_tools_enabled` and `ai_smart_tools_disabled` (for the AI settings page). The enterprise page should either reuse these or add a dedicated display key.
- **Incomplete deployment pipeline**: The infrastructure (3.8 GB / 2 CPU, Docker-only) cannot run `pnpm build`. The AES process needs to account for this constraint — perhaps by adding an explicit "deployability gate" in the plan phase, or by documenting hot-patching procedures as a standard fallback.
