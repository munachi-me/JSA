# JSA Phase 6 — Milestone 3: Application Workflow Reliability

## Change made

The application now waits for saved IndexedDB work to finish loading before mounting the interactive page routes. Previously, the loading message was shown in a banner while the pages remained interactive. If a user imported a dataset before the initial IndexedDB read completed, the restore operation could replace the newly imported in-memory state.

## Expected behavior

- While saved work is loading, JSA displays a status message and does not mount interactive pages.
- Once the initial restore succeeds, the routes mount with the restored datasets and project metadata.
- If the initial storage read fails, JSA displays the storage error and allows the app to continue with available in-memory state.
- The existing UI design and analytics logic are otherwise unchanged.

## Verification

The prior core/workflow test suite was reported as passing by the project owner. This change was reviewed against `DatasetProvider`'s `ready` state and `App.jsx` route mounting. A full test/build rerun was not completed in this environment because dependency installation timed out. Please rerun `npm test` and `npm run build` locally to verify this change in the full application.

## Next check

Exercise persistence in the browser: import a dataset, apply a cleaning step, save a dashboard, reload the page, and confirm the dataset, steps, and dashboard restore correctly. Then delete the dataset and reload to confirm it stays deleted.
