# JSA — JavaScript Analytics (v0.2.3)

Status: Phase 1–4 (prototype).

This release continues the Vite + React application and expands Phase 1 and Phase 2 work with more dashboard foundations documented for Phase 4. Treat this version as an in-repo milestone rather than a production release.

Project overview

JSA v0.2.3 is a browser-focused analytics prototype. It provides dataset import (CSV/JSON), a typed columnar model, basic cleaning and transforms, a KPI engine, saved analysis definitions, and the foundations of a chart specification and dashboard schema.

Verified features (based on repository files in this directory)

- CSV and JSON import with delimiter handling and quoted fields
- Typed columnar dataset model with stable column ids
- Type inference with user override
- Descriptive statistics and group-by operations
- Cleaning/transforms (core/transforms) described in docs
- Filters (eq/ne/range/between/contains/missing)
- KPI engine and saved analyses (as JSON definitions)
- Chart specification (core/visualization) described as Phase 3 work
- Dashboard schema foundations noted in docs

Not implemented or intentionally disabled

The in-directory README and code indicate that some UI elements or export/storage features may still be disabled in the UI for this milestone.

Requirements

- Node.js (LTS recommended)
- npm

Installation

```bash
npm install
```

Available scripts (from package.json)

```bash
npm run dev     # start Vite development server
npm run build   # build a production bundle
npm run preview # preview the production build locally
npm test        # run tests with vitest (if configured)
```

Usage

1. npm run dev
2. Open the local Vite URL shown in the terminal (usually http://localhost:5173)
3. Use the UI to import a CSV/JSON file, inspect columns, clean data, and explore analyses

Notes

- This README summarizes the release-state documented in the repository; confirm implementation details by inspecting the core/ and src/ folders for specific modules.
- The project is browser-first and stores datasets in memory until an explicit persistence layer is implemented in later phases.

License

MIT. See LICENSE in the repository root.
