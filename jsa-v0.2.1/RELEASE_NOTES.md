# RELEASE_NOTES.md — JSA v0.2.1

| | |
| --- | --- |
| **Version** | `0.2.1` |
| **Stage** | Phase 2 · Phase 2 — Cleaning and analysis |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Adds the replayable cleaning pipeline, grouped analyses, and KPI definitions. The transformation step registry is introduced.

## New features

- Replayable, immutable transformation pipeline with 13 initial steps.
- Clean data page with a generic step form driven by step metadata.
- Grouped analyses with saved definitions.
- KPI definitions built from numerator/denominator parts.

## Scope relative to the previous release

- Source modules added: `components/data/DatasetPicker.jsx`, `components/data/FilterEditor.jsx`, `components/data/PartEditor.jsx`, `components/data/StepForm.jsx`, `core/analytics/analyses.js`, `core/analytics/kpis.js`, `core/transforms/expression.js`, `core/transforms/filters.js`, `core/transforms/pipeline.js`, `core/transforms/rows.js`, `core/transforms/sorting.js`, `core/transforms/stepRegistry.js`, `pages/AnalysisPage.jsx`, `pages/CleanPage.jsx`.
- Pipeline steps added: `filterRows`, `dropMissing`, `fillMissing`, `dedupe`, `changeCase`, `replaceText`, `convertType`, `round`, `calcColumn`, `extractDate`, `flagOutliers`, `sort`.
- Routes added: `/clean`, `/clean/:id`, `/analysis`, `/analysis/:id`.
- Application code: 612 → 1,480 lines (+868).

Compared against [v0.2.0](../jsa-v0.2.0/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Not executed** in this documentation pass. |
| Production build | **Not executed** in this documentation pass. |
| Browser behaviour | **Not verified** — no browser session was driven during documentation. |
| Coverage | **Not measured.** No coverage figure is claimed. |

"Executed and passed" above means the command was run against this exact folder in the documentation environment and exited successfully. It does not mean every feature was exercised, and it does not constitute a browser or security verification.

## Historical provenance

This release note was reconstructed from:

- The git commit that introduced this folder: *Added JSA Versions*.
- A direct source diff against the adjacent version folders.

Milestone documents from this folder have been consolidated into `README.md`, `AUDIT.md`, and this file, and then removed from the version directory to reduce documentation clutter. The source tree, tests, and configuration files were not modified.

## License

MIT. See [LICENSE](LICENSE) in this folder and the repository-root [LICENSE](../../LICENSE).
