# JSA Analytics

**JSA (JavaScript Analytics)** is an early-stage toolkit designed to help JavaScript developers load data, calculate KPIs, define charts, and ultimately generate interactive dashboards.

**Status:** experimental foundation / pre-alpha. This version loads and inspects CSV/JSON data, calculates basic statistics, registers KPIs and chart definitions, and writes a JSON manifest. It does **not** yet generate a runnable interactive dashboard.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npm run check
npm test
npm start
```

## Example

```js
import { JSA } from "./src/index.js";

const app = await JSA.create({
  name: "Sales Analytics",
  data: "./examples/sales.csv"
});

app
  .metric("Total Revenue", {
    calculate: (data) => data.sum("Revenue"),
    format: "currency"
  })
  .metric("Total Profit", {
    calculate: (data) => data.sum("Profit"),
    format: "currency"
  })
  .chart("Revenue by Region", {
    type: "bar",
    x: "Region",
    y: "Revenue"
  })
  .dashboard({
    title: "Sales Analytics",
    template: "executive",
    theme: "dark"
  });

console.table(app.getMetrics());
await app.build("./jsa-output");
```

## CLI

```bash
node src/cli.js inspect examples/sales.csv
```

## Current capabilities

- CSV and JSON array loading
- Basic coercion of numeric strings and booleans
- Column list, preview, and missing-value summary
- Column selection and row filtering
- Sum, mean, minimum, maximum, count, and group-by
- KPI registration and evaluation
- Chart-definition and dashboard-option validation
- JSON manifest generation

## Roadmap

1. Improve type handling and analytics.
2. Add richer metric and aggregation helpers.
3. Generate a real React dashboard app.
4. Add interactive charts, filters, and reusable templates/themes.
5. Add a full project scaffolder and local dev command.
6. Add deployment workflows and publish when the API is stable.

## License

MIT. See `LICENSE`.
