# JSA — JavaScript Analytics (v0.2.0)

Status: Phase 1 foundation.

This release is the first Vite-based JSA iteration in the repository. It is focused on importing and inspecting data rather than full dashboard workflows.

## Project overview

The project in this version is a browser-based JavaScript analytics app built with React and Vite. The initial README describes the project as a Phase 1 implementation with dataset import, type inference, descriptive statistics, and group-by logic.

## Features verified in this version

- CSV import with delimiter detection and quoted-field handling
- JSON import
- Typed columnar dataset model
- Stable column identifiers
- Type inference with user override
- Descriptive statistics and grouping operations
- Browser-based application shell with Vite

## Not implemented in this version

The README for this version explicitly lists the following as not built yet:

- cleaning pipeline
- Excel import
- saved analyses
- charts
- dashboards
- insights
- export
- storage

## Requirements

- Node.js and npm

## Installation

```bash
npm install
```

## Available scripts

The project scripts in `package.json` are:

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

Then open the local Vite app in a browser and use the UI to import CSV or JSON data, inspect dataset columns, and review descriptive statistics.

## Development notes

- This version is still described as in-memory only.
- The README calls out a 25 MB browser-file limit and notes the project is still early-stage.
- It is appropriate to treat this version as a Phase 1 foundation rather than a fully mature analytics platform.

## License

This repository includes a license file in the project directory. Confirm the project license used in the release before redistribution.
