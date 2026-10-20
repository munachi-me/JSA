import { isNumericType } from '../data/dataTypes.js';
import { analyzeDataset } from '../data/intelligence.js';
import { isDateType, makeSpec, normalizeSpec } from '../visualization/chartSpec.js';

const groupable = (column) => ['categorical', 'text', 'boolean', 'date', 'datetime', 'time'].includes(column?.type);
const hasKpi = (ds, name, op, column) => ds.kpis.some((k) => k.name === name && k.numerator?.op === op && (k.numerator?.column || '') === (column || ''));

/** Suggest practical, explainable KPI definitions from the dataset schema. Suggestions never save themselves. */
export function suggestKpis(ds) {
  if (!ds?.columns?.length) return [];
  const suggestions = [];
  const add = (name, description, numerator, format = 'number') => {
    if (!hasKpi(ds, name, numerator.op, numerator.column)) suggestions.push({ name, description, format, numerator, denominator: undefined, reason: description });
  };
  add('Total records', `Counts all ${ds.rowCount.toLocaleString()} rows in the current dataset.`, { op: 'count', filters: [] });
  for (const column of ds.columns.filter((c) => isNumericType(c.type)).slice(0, 4)) {
    add(`Total ${column.name}`, `Adds the non-missing values in ${column.name}.`, { op: 'sum', column: column.id, filters: [] }, 'number');
    add(`Average ${column.name}`, `Shows the mean of valid numeric values in ${column.name}.`, { op: 'avg', column: column.id, filters: [] }, 'number');
  }
  for (const column of ds.columns.filter((c) => groupable(c) && !isDateType(c)).slice(0, 3)) {
    add(`Unique ${column.name}`, `Counts the distinct non-missing values in ${column.name}.`, { op: 'distinct', column: column.id, filters: [] });
  }
  return suggestions.slice(0, 8);
}

/** Produce chart-builder configurations from available column types; users review before saving. */
export function suggestCharts(ds) {
  if (!ds?.columns?.length) return [];
  const numeric = ds.columns.filter((c) => isNumericType(c.type));
  const dimensions = ds.columns.filter(groupable);
  const date = dimensions.find(isDateType);
  const category = dimensions.find((c) => !isDateType(c));
  const suggestions = [];
  const add = (title, reason, spec) => suggestions.push({ title, reason, spec: normalizeSpec(ds, makeSpec(spec)) });
  if (date && numeric[0]) add(`${numeric[0].name} over time`, `A line chart can reveal changes and trends in ${numeric[0].name} across ${date.name}.`, { type: 'line', title: `${numeric[0].name} over time`, dimension: date.id, timeGrain: 'month', measures: [{ op: 'sum', column: numeric[0].id, as: '' }], sort: { by: 'auto', dir: 'asc' } });
  if (category && numeric[0]) add(`${numeric[0].name} by ${category.name}`, `Compare the total ${numeric[0].name} across ${category.name} categories.`, { type: 'bar', title: `${numeric[0].name} by ${category.name}`, dimension: category.id, measures: [{ op: 'sum', column: numeric[0].id, as: '' }], sort: { by: 'auto', dir: 'desc' } });
  if (numeric.length >= 2) add(`${numeric[0].name} vs ${numeric[1].name}`, `A scatter plot helps inspect whether ${numeric[0].name} and ${numeric[1].name} move together.`, { type: 'scatter', title: `${numeric[0].name} vs ${numeric[1].name}`, x: numeric[0].id, y: numeric[1].id });
  if (numeric[0]) add(`${numeric[0].name} distribution`, `A histogram shows how values of ${numeric[0].name} are distributed.`, { type: 'histogram', title: `${numeric[0].name} distribution`, column: numeric[0].id });
  if (category) add(`Records by ${category.name}`, `Count records in each ${category.name} category to see which groups are most common.`, { type: 'bar', title: `Records by ${category.name}`, dimension: category.id, measures: [{ op: 'count', column: '', as: '' }], sort: { by: 'auto', dir: 'desc' } });
  return suggestions.slice(0, 5);
}


/** Evidence-led analysis next steps. Definitions are suggestions only and are never saved automatically. */
export function suggestAnalyses(ds) {
  if (!ds?.columns?.length) return [];
  const suggestions = [];
  const numeric = ds.columns.filter((c) => isNumericType(c.type));
  const dimensions = ds.columns.filter((c) => groupable(c) && !isDateType(c));
  const dates = ds.columns.filter(isDateType);
  const report = analyzeDataset(ds);
  const add = (item) => suggestions.push(item);

  const qualityFindings = report.recommendations.filter((r) => r.id !== 'healthy');
  if (qualityFindings.length) {
    qualityFindings.slice(0, 3).forEach((finding) => add({
      id: `quality-${finding.id}`, category: 'Data quality', title: finding.title,
      reason: finding.detail, action: finding.action === 'clean' ? 'clean' : 'dataset',
      actionLabel: finding.action === 'clean' ? 'Review cleaning' : 'Inspect finding',
    }));
  } else {
    add({ id: 'quality-review', category: 'Data quality', title: 'Review dataset health',
      reason: 'Open the Dataset Explorer to review completeness, duplicates, column profiles, and potential outliers.',
      action: 'dataset', actionLabel: 'Review data quality' });
  }

  if (numeric.length >= 2) add({
    id: `relationship-${numeric[0].id}-${numeric[1].id}`, category: 'Investigation',
    title: `${numeric[0].name} vs ${numeric[1].name}`,
    reason: 'Check whether these numeric variables move together. Correlation shows association, not causation.',
    action: 'correlation', x: numeric[0].id, y: numeric[1].id, actionLabel: 'Investigate relationship',
  });
  if (dates.length && numeric.length) add({
    id: `trend-${dates[0].id}-${numeric[0].id}`, category: 'Investigation',
    title: `${numeric[0].name} over time`,
    reason: `Look for trends or changes in ${numeric[0].name} across ${dates[0].name}.`,
    action: 'chart', actionLabel: 'Build trend chart',
  });

  dimensions.slice(0, 3).forEach((dimension) => {
    const measure = numeric[0];
    const measureDef = measure
      ? { op: 'sum', column: measure.id, as: `Total ${measure.name}` }
      : { op: 'count', column: '', as: 'Record count' };
    add({
      id: `group-${dimension.id}`, category: 'Grouped analysis',
      title: measure ? `${measure.name} by ${dimension.name}` : `Records by ${dimension.name}`,
      reason: measure ? `Compare total ${measure.name} across ${dimension.name} groups.` : `Compare the number of records in each ${dimension.name} group.`,
      action: 'analysis', actionLabel: 'Run grouped analysis',
      definition: { name: measure ? `${measure.name} by ${dimension.name}` : `Records by ${dimension.name}`,
        filters: [], filterMode: 'all', groupBy: [dimension.id], measures: [measureDef],
        sortBy: measureDef.as, sortDir: 'desc', limit: 20 },
    });
  });

  return suggestions.slice(0, 8);
}
