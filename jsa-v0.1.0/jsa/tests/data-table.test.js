import test from "node:test";
import assert from "node:assert/strict";
import { DataTable } from "../src/data-table.js";

test("coerces numeric strings and calculates sums", () => {
  const table = new DataTable([
    { Region: "North", Revenue: "100" },
    { Region: "South", Revenue: "250" },
    { Region: "North", Revenue: "50" }
  ]);
  assert.equal(table.sum("Revenue"), 400);
  assert.equal(table.mean("Revenue"), 400 / 3);
});

test("groups rows by a column", () => {
  const table = new DataTable([
    { Region: "North", Revenue: 100 },
    { Region: "South", Revenue: 250 },
    { Region: "North", Revenue: 50 }
  ]);
  const groups = table.groupBy("Region");
  assert.equal(groups.get("North").count(), 2);
  assert.equal(groups.get("South").count(), 1);
});

test("reports columns, row count, and missing values", () => {
  const table = new DataTable([{ Region: "North", Revenue: "100" }, { Region: "South", Revenue: "" }]);
  assert.deepEqual(table.columns, ["Region", "Revenue"]);
  assert.equal(table.rowCount, 2);
  assert.equal(table.describe().find((item) => item.column === "Revenue").missing, 1);
});

test("throws for unknown columns", () => {
  const table = new DataTable([{ Revenue: 100 }]);
  assert.throws(() => table.sum("Profit"), /Unknown column/);
});

test("select and filter return new DataTable instances", () => {
  const table = new DataTable([{ Region: "North", Revenue: 100 }, { Region: "South", Revenue: 250 }]);
  assert.equal(table.select("Revenue").columns.length, 1);
  assert.equal(table.filter((row) => row.Revenue > 100).rowCount, 1);
  assert.equal(table.rowCount, 2);
});
