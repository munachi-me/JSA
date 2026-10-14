import fs from "node:fs/promises";
import path from "node:path";
import { DataTable } from "./data-table.js";

const CHART_TYPES = new Set(["bar", "line", "pie", "scatter", "area"]);
const TEMPLATES = new Set(["executive", "minimal", "analytics"]);
const THEMES = new Set(["light", "dark"]);

export class JSA {
  constructor(name, data) {
    this.name = name;
    this.data = data;
    this.metrics = new Map();
    this.charts = [];
    this.dashboardOptions = { title: name, template: "executive", theme: "light" };
  }

  static async create(options) {
    if (!options || typeof options !== "object") throw new TypeError("JSA.create() expects an options object.");
    if (typeof options.name !== "string" || !options.name.trim()) throw new Error('Provide a non-empty project "name".');
    if (typeof options.data !== "string" || !options.data.trim()) throw new Error('Provide a data file path in "data".');

    const extension = path.extname(options.data).toLowerCase();
    let data;
    if (extension === ".csv") data = await DataTable.fromCSV(options.data);
    else if (extension === ".json") data = await DataTable.fromJSON(options.data);
    else throw new Error(`Unsupported data format "${extension}". Use .csv or .json.`);
    return new JSA(options.name.trim(), data);
  }

  metric(label, definition) {
    if (typeof label !== "string" || !label.trim()) throw new Error("Metric label must be a non-empty string.");
    if (!definition || typeof definition.calculate !== "function") {
      throw new TypeError(`Metric "${label}" needs a calculate(data) function.`);
    }
    if (this.metrics.has(label)) throw new Error(`A metric named "${label}" already exists.`);
    this.metrics.set(label, {
      label: label.trim(),
      calculate: definition.calculate,
      ...(definition.format ? { format: definition.format } : {})
    });
    return this;
  }

  chart(title, definition) {
    if (typeof title !== "string" || !title.trim()) throw new Error("Chart title must be a non-empty string.");
    if (!definition || !CHART_TYPES.has(definition.type)) {
      throw new Error(`Chart type must be one of: ${[...CHART_TYPES].join(", ")}.`);
    }
    for (const field of ["x", "y"]) {
      if (typeof definition[field] !== "string" || !definition[field]) throw new Error(`Chart definition needs a "${field}" column name.`);
      if (!this.data.columns.includes(definition[field])) {
        throw new Error(`Unknown chart ${field}-column "${definition[field]}". Available columns: ${this.data.columns.join(", ")}`);
      }
    }
    this.charts.push({ title: title.trim(), type: definition.type, x: definition.x, y: definition.y });
    return this;
  }

  dashboard(options = {}) {
    if (!options || typeof options !== "object") throw new TypeError("dashboard() expects an options object.");
    const title = options.title ?? this.name;
    const template = options.template ?? "executive";
    const theme = options.theme ?? "light";
    if (typeof title !== "string" || !title.trim()) throw new Error("Dashboard title must be a non-empty string.");
    if (!TEMPLATES.has(template)) throw new Error(`Unknown template "${template}". Use: ${[...TEMPLATES].join(", ")}.`);
    if (!THEMES.has(theme)) throw new Error(`Unknown theme "${theme}". Use: ${[...THEMES].join(", ")}.`);
    this.dashboardOptions = { title: title.trim(), template, theme };
    return this;
  }

  getMetrics() {
    return [...this.metrics.values()].map((metric) => {
      const value = metric.calculate(this.data);
      if (typeof value !== "number") throw new TypeError(`Metric "${metric.label}" must return a number; received ${typeof value}.`);
      return { label: metric.label, value, ...(metric.format ? { format: metric.format } : {}) };
    });
  }

  getCharts() { return this.charts.map((chart) => ({ ...chart })); }
  getDashboardOptions() { return { ...this.dashboardOptions }; }

  async build(outputDirectory = "jsa-output") {
    if (typeof outputDirectory !== "string" || !outputDirectory.trim()) throw new Error("Output directory must be a non-empty path.");
    const destination = path.resolve(outputDirectory);
    await fs.mkdir(destination, { recursive: true });

    const manifest = {
      generator: "jsa-analytics",
      version: "0.1.0",
      name: this.name,
      dashboard: this.getDashboardOptions(),
      rowCount: this.data.rowCount,
      columns: this.data.columns,
      metrics: this.getMetrics(),
      charts: this.getCharts(),
      data: this.data.toJSON()
    };

    await fs.writeFile(path.join(destination, "jsa-dashboard.json"), JSON.stringify(manifest, null, 2), "utf8");
    await fs.writeFile(path.join(destination, "README.txt"), [
      this.dashboardOptions.title,
      "=".repeat(this.dashboardOptions.title.length),
      "",
      "JSA Analytics early build artifact",
      "",
      "Contains data, KPI values, chart definitions, and dashboard settings.",
      "It does not yet contain a runnable interactive dashboard; the renderer is planned for a later milestone.",
      "",
      `Rows: ${this.data.rowCount}`,
      `Columns: ${this.data.columns.join(", ")}`,
      `KPIs: ${this.metrics.size}`,
      `Charts: ${this.charts.length}`
    ].join("\n"), "utf8");

    return { outputDirectory: destination };
  }
}
