# JSA v0.2.71 Release Notes

## Fixes

- Fixed the **Remove condition** button in the IF-rule editor so it can remove the final condition as well as earlier conditions.
- Added an empty-state message when an IF rule has no conditions.
- Users can add a condition again after removing all conditions.
- Applying a conditional-column transformation still requires each IF rule to contain at least one condition; existing validation enforces this.

## Retained behavior

- This is a focused bug-fix release based on v0.2.7.
- Column rename/delete, dataset selection, responsive styling, and the conditional-column/split/combine features are retained.

## Verification note

The release archive and version metadata were checked. The full automated test suite and production build have not been run in this environment; verify them in your local setup before publishing.
