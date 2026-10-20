# Phase 6 — Milestone 20: Adaptive Home and Reliable Global Export Menu

This revision keeps the application at v0.3.0 while correcting two UI issues before continuing the UI redesign.

## Changes
- Home checks the workspace restoration state before choosing the first-visit or returning-user experience.
- First-time users see concise onboarding and subtle feature discovery; users with saved datasets see a quieter dashboard with their work and workflow actions prioritized.
- Storage persistence/session status and storage-load errors are surfaced on Home.
- Export & Publish renders through a portal attached to `document.body`, preventing the dropdown from being clipped by navbar overflow.
- Dropdown position and height adapt to viewport dimensions, including mobile screens; outside-click and Escape handling remain supported.
- The render test now expects the returning-user Home heading when a dataset is supplied.

## Manual verification
1. Run `npm install`, `npm test`, and `npm run build`.
2. Open JSA with no saved datasets and confirm onboarding appears after storage initialization.
3. Import a dataset, reload, and confirm Home prioritizes the saved workspace and shows the dataset list.
4. Open Export & Publish on desktop and mobile; confirm the complete popup is visible and can scroll independently.
5. Test outside-click, Escape, dataset exports, and page-specific export shortcuts.

`node_modules` is not included in the ZIP.
