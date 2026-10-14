// Metadata for each supported chart type. Rendering lives elsewhere, so the spec and data
// builders stay independent of any chart library.
export const CHART_TYPES = [
  { id: 'bar', label: 'Bar chart', family: 'category' },
  { id: 'hbar', label: 'Horizontal bar chart', family: 'category' },
  { id: 'line', label: 'Line chart', family: 'category', series: true },
  { id: 'area', label: 'Area chart', family: 'category' },
  { id: 'pie', label: 'Pie chart', family: 'category' },
  { id: 'donut', label: 'Donut chart', family: 'category' },
  { id: 'stacked', label: 'Stacked bar chart', family: 'category', series: true, needsSeries: true },
  { id: 'grouped', label: 'Grouped bar chart', family: 'category', series: true, needsSeries: true },
  { id: 'scatter', label: 'Scatter plot', family: 'scatter' },
  { id: 'histogram', label: 'Histogram', family: 'histogram' },
  { id: 'table', label: 'Table', family: 'table' },
  { id: 'kpi', label: 'KPI card', family: 'kpi' },
];
export const typeInfo = (id) => CHART_TYPES.find((t) => t.id === id);
export const CATEGORY_TYPES = CHART_TYPES.filter((t) => t.family === 'category').map((t) => t.id);
export const SERIES_TYPES = CHART_TYPES.filter((t) => t.series).map((t) => t.id);
export const LIMITED_TYPES = ['bar', 'hbar', 'pie', 'donut', 'stacked', 'grouped'];
