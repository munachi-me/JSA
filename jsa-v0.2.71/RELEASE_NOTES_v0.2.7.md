# JSA v0.2.7 release notes

## Added
- Rename columns from the Dataset page or as a cleaning pipeline step.
- Delete columns as a reversible pipeline step; the final remaining column is protected.
- Dataset switcher on the Dataset page.
- Responsive UI refinements for mobile navigation, forms, conditional rules, and column actions.

## Fixed
- Conditional transformation actions now validate before adding a pipeline step and show actionable feedback instead of silently creating a failed step.
- Conditional rule controls have clearer accessible labels and more predictable default column selection when adding conditions.

## Preserved
- Conditional calculated columns, split columns, and combine columns from v0.2.66.
- Original imported data remains unchanged; column edits are represented as replayable transformation steps.

## Verification
- Regression tests were added for rename/delete transformations and invalid inputs.
- Run `npm test` and `npm run build` to verify the complete release in your environment.
