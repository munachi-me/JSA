#!/usr/bin/env node
import { JSA } from "./jsa.js";

const [command, filePath] = process.argv.slice(2);

async function main() {
  if (command === "inspect") {
    if (!filePath) throw new Error("Usage: node src/cli.js inspect <data.csv|data.json>");
    const app = await JSA.create({ name: "Dataset Inspection", data: filePath });
    console.log(`Rows: ${app.data.rowCount}`);
    console.log(`Columns: ${app.data.columns.join(", ")}`);
    console.log("\nColumn summary:");
    console.table(app.data.describe());
    console.log("\nPreview:");
    console.table(app.data.head(5));
    return;
  }

  if (command === "help" || !command) {
    console.log([
      "JSA Analytics 0.1.0",
      "",
      "Commands:",
      "  node src/cli.js inspect <data.csv|data.json>",
      "",
      "Project scaffolding and interactive dashboard commands are planned, not yet implemented."
    ].join("\n"));
    return;
  }

  throw new Error(`Unknown command "${command}". Run "node src/cli.js help".`);
}

main().catch((error) => {
  console.error(`JSA: ${error.message}`);
  process.exitCode = 1;
});
