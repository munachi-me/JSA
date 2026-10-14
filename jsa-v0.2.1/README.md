# JSA — JavaScript Analytics (v0.2.1)

Status: Phase 1–2. This release adds a cleaning pipeline and analysis features, while still maintaining a browser-only in-memory model.

## Project overview

This version continues the Vite + React JSA app introduced in earlier releases. It expands the Phase 1 foundation with the cleaning and transform workflow described in the project README.

## Features verified in this version

- CSV and JSON import
- Typed dataset model with stable IDs
- Type inference with override
- Descriptive statistics
- Group-by analysis
- Cleaning pipeline for rows and values
- Filter support for comparison and missing-value checks
- KPI engine with aggregate/ratio behavior and formatting options
- Saved analyses definition and re-run behavior
- Browser-only in-memory dataset flow

## Key limitations

The project README explicitly states that datasets, pipelines, analyses, and KPIs reset on reload until persistence is implemented.

## Requirements

- Node.js and npm

## Installation

```bash
npm install
```

## Available scripts

```bash
npm run dev
npm run build
npm run preview
npm test
```

## Usage

```bash
npm run dev
```

Use the app to import data, clean it, run filters, and review the saved analysis and KPI engine workflows.

## Notes

- This release is still a Phase 1–2 implementation and should not be treated as production-ready.
- The README states that persistence and full dashboard/export features are not yet present in this version.

## License

This repository includes a license file in the project directory. Confirm the project license used in the release before redistribution.
