# Phase 6 — Milestone 23: Insights Workspace UI

## Scope
Refresh the Insights page presentation and correct the Analysis shortcut icon on Clean Data without changing analytics behavior.

## Delivered
- Compact DATA WORKSPACE / INSIGHTS heading following Dataset Explorer and Clean Data.
- Active dataset name, dataset picker, Dataset Explorer link, and Analysis link.
- Summary cards for new, saved, dismissed, and quality findings.
- Organized insight status tabs, type filter, optional dashboard selector, and numeric measure settings.
- Responsive empty state, findings list, skipped-check details, and action controls.
- Calculator icon for the Analysis shortcut on Clean Data to distinguish it from Charts.

## Preserved behavior
- Existing rule-based insight generation and threshold behavior.
- Numeric sum/mean preferences.
- Save, unsave, dismiss, restore, save-as-chart, and add-to-dashboard actions.
- Existing dataset, chart, and dashboard persistence.

## Local verification
Run `npm install`, `npm test`, and `npm run build`. `node_modules` is excluded from release archives.
