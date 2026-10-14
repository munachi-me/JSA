# JSA Analytics (v0.1.0)

Status: experimental foundation / pre-alpha.

This release is a lightweight JavaScript toolkit for importing data, calculating basic statistics, registering KPIs, and producing a manifest. It is not presented as a production-ready platform in the project files.

## Project overview

The JSA v0.1.0 project centers on a JavaScript API for working with tabular data. The project files include a CLI entry point and a basic example script; the README describes CSV and JSON loading, KPI registration, chart definitions, and dashboard validation.

## Features verified in this version

- CSV and JSON data loading
- Basic coercion of numeric strings and booleans
- Column preview and missing-value inspection
- Row filtering and column selection
- Summary statistics: sum, mean, minimum, maximum, count, and group-by operations
- KPI registration and evaluation
- Chart definition and dashboard-option validation
- JSON manifest generation
- CLI inspection command via `src/cli.js`

## Requirements

- Node.js 20 or newer
- npm

## Installation

```bash
npm install
```

## Available scripts

The scripts in `package.json` are:

```bash
npm test
npm run check
npm start
```

## Usage

The README includes the following example pattern:

```js
import { JSA } from './src/index.js';

const app = await JSA.create({
  name: 'Sales Analytics',
  data: './examples/sales.csv'
});

app
  .metric('Total Revenue', {
    calculate: (data) => data.sum('Revenue'),
    format: 'currency'
  })
  .metric('Total Profit', {
    calculate: (data) => data.sum('Profit'),
    format: 'currency'
  })
  .chart('Revenue by Region', {
    type: 'bar',
    x: 'Region',
    y: 'Revenue'
  })
  .dashboard({
    title: 'Sales Analytics',
    template: 'executive',
    theme: 'dark'
  });

console.table(app.getMetrics());
await app.build('./jsa-output');
```

## CLI example

```bash
node src/cli.js inspect examples/sales.csv
```

## Notes

- This version is intentionally early-stage and does not present itself as a complete end-user analytics application.
- The project README describes a roadmap that includes richer analytics, a real React app, interactive charts, filters, templates, and deployment workflows.
- The README claims a CLI and manifest output; those are consistent with the project files that exist in this release.

## License

MIT. See `LICENSE`.
