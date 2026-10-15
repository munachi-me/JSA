# JSA v0.2.73 — Data-preparation workflow improvements

## Added

- Up/down controls for reordering cleaning pipeline steps.
- Clear disabled states at the top and bottom of the pipeline.
- Before/after row counts for successful steps that change the number of rows.
- Pipeline-ordering tests covering immutable reordering, invalid/boundary moves, and changed results when the order of filtering and deduplication changes.

## Behavior notes

- The pipeline still replays from the original imported dataset; the source data is not mutated.
- Reordering can change the result because each step receives the previous step's output.
- Full test and production build results must be verified in the release environment; do not assume they passed unless run successfully.
