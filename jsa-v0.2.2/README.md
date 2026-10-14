# JSA — JavaScript Analytics (v0.2.2)

Status: Phase 1–3. This release adds charting capabilities to the earlier import, cleaning, and KPI workflows.

## Project overview

This version continues the Vite-based JSA application and expands it with chart-definition support. The README describes chart specifications, chart dataset preparation, and a broader analytical flow.

## Features verified in this version

- CSV and JSON import
- Typed dataset handling and inference
- Descriptive statistics and grouping
- Cleaning pipeline
- Filters and KPI engine
- Saved analysis definitions
- Chart specification and rendering-data preparation
- Multiple chart types as described in the project documentation

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

Then import a dataset, clean it, create or review analyses, and use the charting features available in the UI.

## Build & test verification

The project owner reports that for v0.2.2 the code was built and the test suite was executed locally and passed successfully. This statement is provided by the project owner and recorded here for documentation purposes. It does not imply that any CI pipeline was executed.

## Notes

- The README for this version still describes the app as in-memory and early-stage.
- It is appropriate to treat this release as a chart-enabled prototype rather than a finalized end-user product.

## License

This repository includes a license file in the project directory. Confirm the project license used in the release before redistribution.
