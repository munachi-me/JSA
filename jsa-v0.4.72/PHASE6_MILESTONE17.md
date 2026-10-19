# Phase 6 — Milestone 17: Import Reliability & Workflow Feedback

This milestone hardens the import entry point before the upcoming UI redesign.

## Changes
- Catch file read failures and surface an in-app error.
- Catch failed sample-data HTTP responses and fetch exceptions.
- Avoid acting on an empty file selection.
- Disable import buttons during processing and announce the processing state to assistive technology.

## Manual verification
1. Import a valid CSV and a valid JSON file.
2. Try an unsupported extension and a file over the documented 25 MB limit.
3. Open the sample dataset while online.
4. Simulate an unavailable sample-data request and confirm an error appears without a crash.
5. Tap import repeatedly during processing and confirm only one import starts.

Run `npm install`, `npm test`, and `npm run build` locally. Dependencies are not bundled in the ZIP.
