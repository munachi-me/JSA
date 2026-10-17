import { toCsv } from './reporting.js';

/** Convert a columnar JSA dataset to row objects keyed by the visible column names. */
export function datasetToObjects(dataset) {
  if (!dataset || !Array.isArray(dataset.columns) || !dataset.data || !Number.isInteger(dataset.rowCount)) {
    throw new Error('A valid dataset is required for export.');
  }
  return Array.from({ length: dataset.rowCount }, (_, rowIndex) => Object.fromEntries(
    dataset.columns.map((column) => [column.name, dataset.data[column.id]?.[rowIndex] ?? null]),
  ));
}

/** Export a JSA dataset as a spreadsheet-safe CSV with visible column names. */
export function datasetToCsv(dataset) {
  if (!dataset || !Array.isArray(dataset.columns) || !dataset.data || !Number.isInteger(dataset.rowCount)) {
    throw new Error('A valid dataset is required for export.');
  }
  const ids = dataset.columns.map((column) => column.id);
  const rows = Array.from({ length: dataset.rowCount }, (_, rowIndex) => Object.fromEntries(
    ids.map((id) => [id, dataset.data[id]?.[rowIndex] ?? null]),
  ));
  return toCsv(ids, rows, Object.fromEntries(dataset.columns.map((column) => [column.id, column.name])));
}

/** Export as a plain array of objects so the JSON can be imported into JSA again. */
export function datasetToJson(dataset) {
  return JSON.stringify(datasetToObjects(dataset), null, 2);
}

export function safeExportName(name) {
  return String(name || 'dataset').normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'dataset';
}

/** Flatten the current chart's plotted values into a downloadable CSV table. */
export function chartDataToCsv(chartData) {
  if (!chartData || typeof chartData.kind !== 'string') throw new Error('A valid chart preview is required for export.');
  let columns;
  let rows;
  let labels = {};
  if (chartData.kind === 'category') {
    columns = ['label', 'value'];
    labels = { label: chartData.dimensionLabel || 'Category', value: chartData.measureLabel || 'Value' };
    rows = (chartData.points || []).map((point) => ({ label: point.label, value: point.value }));
  } else if (chartData.kind === 'multi') {
    columns = ['category', ...(chartData.series || []).map((series, index) => `series_${index}`)];
    labels = { category: chartData.dimensionLabel || 'Category' };
    (chartData.series || []).forEach((series, index) => { labels[`series_${index}`] = series.name; });
    rows = (chartData.categories || []).map((category, rowIndex) => Object.fromEntries([
      ['category', category], ...(chartData.series || []).map((series, index) => [`series_${index}`, series.values[rowIndex] ?? null]),
    ]));
  } else if (chartData.kind === 'scatter') {
    columns = ['x', 'y']; labels = { x: chartData.xLabel || 'X', y: chartData.yLabel || 'Y' };
    rows = (chartData.points || []).map(({ x, y }) => ({ x, y }));
  } else if (chartData.kind === 'histogram') {
    columns = ['start', 'end', 'count']; labels = { start: 'Bin start', end: 'Bin end', count: 'Count' };
    rows = (chartData.bins || []).map((bin) => ({ start: bin.x0, end: bin.x1, count: bin.count }));
  } else if (chartData.kind === 'table') {
    const sourceColumns = chartData.columns || [];
    columns = sourceColumns.map((column, index) => `c${index}`);
    labels = Object.fromEntries(sourceColumns.map((column, index) => [`c${index}`, column.name]));
    rows = (chartData.rows || []).map((values) => Object.fromEntries(columns.map((key, index) => [key, values[index] ?? null])));
  } else if (chartData.kind === 'kpi') {
    columns = ['name', 'value']; labels = { name: 'KPI', value: 'Value' };
    rows = [{ name: chartData.name || 'KPI', value: chartData.value ?? chartData.formatted ?? null }];
  } else {
    throw new Error(`Export is not supported for chart data type “${chartData.kind}”.`);
  }
  return toCsv(columns, rows, labels);
}
