import { JSA } from "../src/index.js";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(new URL("./sales.csv", import.meta.url));
const app = await JSA.create({ name: "Sales Analytics", data: dataPath });

app
  .metric("Total Revenue", { calculate: (data) => data.sum("Revenue"), format: "currency" })
  .metric("Total Profit", { calculate: (data) => data.sum("Profit"), format: "currency" })
  .metric("Average Order Value", { calculate: (data) => data.mean("OrderValue"), format: "currency" })
  .chart("Revenue by Region", { type: "bar", x: "Region", y: "Revenue" })
  .dashboard({ title: "Sales Analytics", template: "executive", theme: "dark" });

console.log("KPIs:");
console.table(app.getMetrics());
console.log("Chart definitions:");
console.table(app.getCharts());

const result = await app.build("./jsa-output");
console.log(`Build artifact written to: ${result.outputDirectory}`);
