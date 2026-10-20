# RELEASE_NOTES.md — JSA v0.2.2

| | |
| --- | --- |
| **Version** | `0.2.2` |
| **Stage** | Phase 3 · Phase 3 — Visualization |
| **Latest in repository** | No |

[Root README](../../README.md) · [Version history](../../README.md#version-history) · [README](README.md) · [Audit](AUDIT.md)

## Release purpose

Adds chart specifications, a chart registry, chart data building, and dependency-free SVG chart rendering with a Charts page.

## New features

- Chart specification model and chart registry.
- SVG cartesian and pie chart components.
- Charts page with chart type, dimension, and measure selection.

## Scope relative to the previous release

- Source modules added: `components/charts/Cartesian.jsx`, `components/charts/ChartRenderer.jsx`, `components/charts/PieChart.jsx`, `components/charts/palette.js`, `core/visualization/chartData.js`, `core/visualization/chartRegistry.js`, `core/visualization/chartSpec.js`, `core/visualization/scales.js`, `pages/VisualizationPage.jsx`.
- Routes added: `/charts`, `/charts/:id`.
- Application code: 1,480 → 2,168 lines (+688).

Compared against [v0.2.1](../jsa-v0.2.1/RELEASE_NOTES.md).

## Breaking changes

None recorded. No source module present in the previous release was removed, and no route was renamed or dropped, as verified by comparing the source trees.

## Compatibility and migration

Each version directory is an independent project with its own `package.json` and `package-lock.json`. To use this release, install its dependencies inside its own folder; installing at the repository root does not apply to any version.

## Verification status

| Check | Status |
| --- | --- |
| Test suite | **Executed and passed.** `npx vitest run` reported 5 passed and 56 passed. |
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
