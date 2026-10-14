import fs from "node:fs/promises";
import Papa from "papaparse";

function coerceValue(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;
  return trimmed;
}

export class DataTable {
  constructor(rows = []) {
    if (!Array.isArray(rows)) throw new TypeError("DataTable expects an array of row objects.");
    this.rows = rows.map((row, index) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        throw new TypeError(`Row ${index + 1} must be an object.`);
      }
      return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, coerceValue(value)]));
    });
  }

  static async fromCSV(filePath) {
    const contents = await fs.readFile(filePath, "utf8");
    const parsed = Papa.parse(contents, { header: true, skipEmptyLines: "greedy", dynamicTyping: false });
    if (parsed.errors.length) {
      throw new Error(`Could not parse CSV: ${parsed.errors[0]?.message || "unknown parsing error"}`);
    }
    return new DataTable(parsed.data);
  }

  static async fromJSON(filePath) {
    const contents = await fs.readFile(filePath, "utf8");
    let parsed;
    try {
      parsed = JSON.parse(contents);
    } catch (error) {
      throw new Error(`Could not parse JSON: ${error.message}`);
    }
    if (!Array.isArray(parsed) || !parsed.every(
      (item) => item !== null && typeof item === "object" && !Array.isArray(item)
    )) {
      throw new Error("JSON data must be an array of objects.");
    }
    return new DataTable(parsed);
  }

  get rowCount() { return this.rows.length; }

  get columns() {
    const names = new Set();
    for (const row of this.rows) for (const key of Object.keys(row)) names.add(key);
    return [...names];
  }

  head(count = 5) {
    if (!Number.isInteger(count) || count < 0) throw new RangeError("Count must be a non-negative integer.");
    return this.rows.slice(0, count).map((row) => ({ ...row }));
  }

  select(...columns) {
    if (!columns.length) throw new Error("Select at least one column.");
    this.#assertColumns(columns);
    return new DataTable(this.rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]]))));
  }

  filter(predicate) {
    if (typeof predicate !== "function") throw new TypeError("filter() expects a predicate function.");
    return new DataTable(this.rows.filter((row) => predicate({ ...row })));
  }

  sum(column) {
    return this.#numericValues(column).reduce((total, value) => total + value, 0);
  }

  mean(column) {
    const values = this.#numericValues(column);
    return values.length ? values.reduce((total, value) => total + value, 0) / values.length : Number.NaN;
  }

  min(column) {
    const values = this.#numericValues(column);
    return values.length ? Math.min(...values) : Number.NaN;
  }

  max(column) {
    const values = this.#numericValues(column);
    return values.length ? Math.max(...values) : Number.NaN;
  }

  count() { return this.rows.length; }

  groupBy(column) {
    this.#assertColumns([column]);
    const groups = new Map();
    for (const row of this.rows) {
      const key = String(row[column] ?? "(missing)");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return new Map([...groups].map(([key, rows]) => [key, new DataTable(rows)]));
  }

  describe() {
    return this.columns.map((column) => {
      const values = this.rows.map((row) => row[column]);
      const nonNull = values.filter((value) => value !== null && value !== undefined);
      return {
        column,
        nonNull: nonNull.length,
        missing: values.length - nonNull.length,
        type: nonNull.length ? typeof nonNull[0] : "unknown"
      };
    });
  }

  toJSON() { return this.rows.map((row) => ({ ...row })); }

  #numericValues(column) {
    this.#assertColumns([column]);
    return this.rows.map((row) => row[column]).filter(
      (value) => typeof value === "number" && Number.isFinite(value)
    );
  }

  #assertColumns(columns) {
    const available = new Set(this.columns);
    const missing = columns.filter((column) => !available.has(column));
    if (missing.length) {
      throw new Error(`Unknown column(s): ${missing.join(", ")}. Available columns: ${this.columns.join(", ") || "(none)"}`);
    }
  }
}
