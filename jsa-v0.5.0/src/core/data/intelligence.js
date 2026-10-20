import { isMissing, isNumericType, parseNumber, parseDate } from './dataTypes.js';
import { countDuplicateRows } from './profile.js';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const quantile = (sorted, p) => {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * p;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

function numericProfile(values) {
  const nums = values.map(parseNumber).filter((v) => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const q1 = quantile(nums, 0.25), median = quantile(nums, 0.5), q3 = quantile(nums, 0.75);
  const iqr = q3 - q1;
  const outliers = iqr === 0 ? 0 : nums.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
  return { count: nums.length, min: nums[0], max: nums[nums.length - 1], mean: nums.reduce((a, b) => a + b, 0) / nums.length, median, q1, q3, outliers, distinct: new Set(nums).size };
}

/** Evidence-based overview of completeness, duplication, column shape, and possible follow-up actions. */
export function analyzeDataset(ds) {
  const rows = Math.max(0, Number(ds?.rowCount) || 0);
  const cols = ds?.columns || [];
  const cellCount = rows * cols.length;
  let missingCells = 0;
  const columnProfiles = cols.map((column) => {
    const values = ds.data?.[column.id] || [];
    const missing = values.filter(isMissing).length;
    const present = values.filter((v) => !isMissing(v));
    const distinct = new Set(present.map((v) => typeof v === 'object' ? JSON.stringify(v) : String(v))).size;
    const missingRate = values.length ? missing / values.length : 0;
    missingCells += missing;
    const profile = { id: column.id, name: column.name, type: column.type, count: values.length, present: present.length, missing, missingRate, distinct, uniqueRate: present.length ? distinct / present.length : 0 };
    if (isNumericType(column.type)) profile.numeric = numericProfile(present);
    if (column.type === 'date' || column.type === 'datetime') {
      const dates = present.map(parseDate).filter(Boolean).map((d) => d.getTime()).sort((a, b) => a - b);
      if (dates.length) profile.dateRange = { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString(), valid: dates.length };
    }
    profile.constant = present.length > 1 && distinct === 1;
    profile.likelyIdentifier = present.length > 0 && distinct === present.length && /(\bid\b|uuid|identifier|record.?key|^key$)/i.test(column.name);
    return profile;
  });

  const duplicateRows = rows ? countDuplicateRows(ds) : 0;
  const missingRate = cellCount ? missingCells / cellCount : 0;
  const duplicateRate = rows ? duplicateRows / rows : 0;
  const constantColumns = columnProfiles.filter((c) => c.constant);
  const highMissingColumns = columnProfiles.filter((c) => c.count > 0 && c.missingRate >= 0.2);
  const outlierColumns = columnProfiles.filter((c) => c.numeric && c.numeric.outliers > 0);
  const highCardinalityColumns = columnProfiles.filter((c) => ['categorical', 'text'].includes(c.type) && c.present >= 10 && c.distinct / Math.max(1, c.present) > 0.8 && !c.likelyIdentifier);

  const recommendations = [];
  if (missingCells) recommendations.push({ id: 'missing', severity: highMissingColumns.length ? 'high' : 'medium', title: 'Review missing values', detail: `${missingCells.toLocaleString()} missing cell${missingCells === 1 ? '' : 's'} across ${columnProfiles.filter((c) => c.missing).length} column(s). ${highMissingColumns.length ? `${highMissingColumns.length} column(s) are at least 20% missing.` : 'Check whether blanks should be filled, standardized, or left as missing.'}`, action: 'clean', actionLabel: 'Open cleaning' });
  if (duplicateRows) recommendations.push({ id: 'duplicates', severity: duplicateRate >= 0.05 ? 'high' : 'medium', title: 'Check duplicate records', detail: `${duplicateRows.toLocaleString()} exact duplicate row(s) detected (${(duplicateRate * 100).toFixed(1)}% of rows). Confirm whether they represent repeated events or accidental duplicates.`, action: 'clean', actionLabel: 'Review cleaning' });
  if (constantColumns.length) recommendations.push({ id: 'constant', severity: 'low', title: 'Review constant columns', detail: `${constantColumns.length} column(s) contain only one distinct non-missing value. They may not add analytical value.`, columns: constantColumns.map((c) => c.name), action: 'dataset', actionLabel: 'Inspect columns' });
  if (outlierColumns.length) {
    const totalOutliers = outlierColumns.reduce((sum, c) => sum + c.numeric.outliers, 0);
    recommendations.push({ id: 'outliers', severity: 'medium', title: 'Investigate possible numeric outliers', detail: `${totalOutliers.toLocaleString()} value(s) fall outside the 1.5×IQR fences in ${outlierColumns.length} numeric column(s). These are candidates for review, not necessarily errors.`, columns: outlierColumns.map((c) => c.name), action: 'analysis', actionLabel: 'Open analysis' });
  }
  if (highCardinalityColumns.length) recommendations.push({ id: 'cardinality', severity: 'low', title: 'Check high-cardinality text fields', detail: `${highCardinalityColumns.length} text/categorical column(s) have many distinct values. They may work better as identifiers or detail fields than chart groupings.`, columns: highCardinalityColumns.map((c) => c.name), action: 'dataset', actionLabel: 'Inspect columns' });
  if (!recommendations.length) recommendations.push({ id: 'healthy', severity: 'good', title: 'No common data-quality flags detected', detail: 'No missing cells or exact duplicate rows were found, and no constant columns or IQR outliers were flagged by these checks. This does not guarantee the dataset is error-free.', action: 'analysis', actionLabel: 'Continue to analysis' });

  // Score is an at-a-glance quality indicator, not a statistical guarantee.
  const missingPenalty = missingRate * 45;
  const duplicatePenalty = clamp(duplicateRate * 100, 0, 100) * 0.25;
  const constantPenalty = cols.length ? (constantColumns.length / cols.length) * 15 : 0;
  const score = Math.round(clamp(100 - missingPenalty - duplicatePenalty - constantPenalty, 0, 100));
  const numericColumns = columnProfiles.filter((c) => c.numeric);
  const dateColumns = columnProfiles.filter((c) => c.dateRange);
  return {
    score, scoreLabel: score >= 90 ? 'Strong' : score >= 75 ? 'Fair' : score >= 55 ? 'Needs attention' : 'Review recommended',
    summary: { rows, columns: cols.length, missingCells, missingRate, duplicateRows, duplicateRate, constantColumns: constantColumns.length, numericColumns: numericColumns.length, dateColumns: dateColumns.length, outlierColumns: outlierColumns.length },
    columnProfiles, recommendations,
    methodology: 'Score uses missing-cell rate, exact duplicate-row rate, and constant-column share. Outliers use the 1.5×IQR rule and are reported separately because unusual values are not necessarily errors and may be valid.'
  };
}
