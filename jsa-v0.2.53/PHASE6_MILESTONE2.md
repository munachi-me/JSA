# JSA Phase 6 — Milestone 2: Data Workflow Verification

## Scope

This milestone checks the data path across import, transformation, aggregation, profiling, insight generation, dashboard configuration export/import, and browser persistence. The existing UI has not been redesigned.

## Changes

- Added `src/tests/phase6-workflow.test.js` with cross-module workflow tests.
- Hardened `createIndexedDBAdapter` schema initialization so it checks for existing object stores before creating them.

## Verification status

- JavaScript syntax checks passed for the new workflow test and IndexedDB adapter.
- The Vitest suite could not be executed in this environment because `vitest` is not present in the available `node_modules`; `npm test -- --reporter=dot` exits with `vitest: not found`.
- The test results are therefore **not yet verified**. Run `npm ci` and then `npm test` in an environment with package-registry access.

## Test coverage added

1. Source data remains unchanged after applying a filter pipeline.
2. Aggregation uses the transformed dataset and reconciles expected totals.
3. Profiling and insight generation execute on the transformed dataset.
4. Dashboard configuration export/import preserves component content without embedding row data.
5. IndexedDB persistence saves, restores, and removes source data and metadata.

## Next milestone

After the tests run successfully, inspect and verify the UI-level flow: import → clean → analyze → insights → visualization → dashboard → save/reopen. Any issues should be fixed against reproducible test failures rather than assumed.
