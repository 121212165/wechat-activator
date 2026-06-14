# Reconstruction Plan

## Core Problem
Stay informed about specific topics from WeChat public accounts without manual scanning.

## Current State: 6 Pages
1. Home - article feed (essential)
2. Login - auth (essential)
3. Config - keywords + accounts management
4. Profile - user info + logout + link to push-settings
5. Push Settings - push toggle + time picker
6. Data Source - sogou vs third-party API selection

## Target State: 2 Pages + Login
1. **Home** - article feed (unchanged)
2. **Settings** - unified: profile, keywords, accounts, push config, data source, logout
3. **Login** - auth (unchanged, not a tab)

## What Gets Folded Into Settings
- Profile: username display, role, logout button
- Config: keyword CRUD, account CRUD, quick initialize
- Push Settings: toggle, time picker
- Data Source: sogou/third-party selection

## Dead Code Deleted
- `src/utils/upload.ts` (251 lines, never imported by any page)
- `src/hooks/useTabBarPageClass.ts` (29 lines, template boilerplate)
- `src/store/README.md` (54 lines, no actual store code)
- `src/db/README.md` (38 lines, doc theater)
- Phone auth methods in AuthContext (~40 lines, never called)

## Doc Theater Deleted (18 files)
DEPLOY_GUIDE.md, EDIT_DEMO.md, EDIT_FEATURE.md, FIX_REPORT.md,
QUICK_START.md, QUICK_TEST_GUIDE.md, REAL_API_GUIDE.md,
TEST_CHECKLIST.md, TEST_EXECUTION.md, TEST_REPORT_ROUND1.md,
TEST_REPORT_ROUND2.md, TEST_SUITE.md, TEST_SUMMARY.md,
USER_GUIDE.md, docs/prd.md, FIRST-PRINCIPLES-RECONSTRUCTION.md,
src/store/README.md, src/db/README.md

## Execution Order
1. Create `src/pages/settings/` (unified page)
2. Update `src/app.config.ts` (pages + tabBar)
3. Clean `src/contexts/AuthContext.tsx` (remove phone auth)
4. Update `src/app.tsx` (remove useTabBarPageClass)
5. Delete dead pages: profile/, push-settings/, data-source/, config/
6. Delete dead code: upload.ts, useTabBarPageClass.ts
7. Delete 18 doc theater files
8. Git commit
