# JSA v0.2.8 — Advanced Data Preparation

## Added
- Custom branded alert, confirmation, and prompt dialogs; replaced native browser popups in dataset deletion, column rename/delete, dashboard deletion, and cleaning-pipeline reset flows.
- Trim whitespace from text columns; whitespace-only values become missing values.
- Normalize whitespace by trimming and collapsing repeated whitespace.
- Convert configurable text markers to actual missing values, with case-insensitive matching and surrounding-space tolerance. Text imports now preserve surrounding whitespace so the new cleaning operations can work on original values; recognized missing markers are still detected during import.
- Mobile-responsive dialog styling, close controls, Escape handling, and clearer confirmation actions.
- Regression tests for the new data-preparation operations.

## Data safety
- New preparation operations are regular cleaning-pipeline steps.
- The source import remains unchanged; remove a step or reset the pipeline to undo it.
- Preview a transformation before adding it to the pipeline.

## Validation status
- Run `npm test` and `npm run build` after installing dependencies. Do not treat this release note as evidence that the complete suite/build passed in the packaging environment.
