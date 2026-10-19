import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPORT_APPEARANCE, exportAppearanceCss, normalizeExportAppearance } from '../core/dashboard/exportAppearance.js';
import { createStaticDashboardHtml } from '../core/dashboard/staticExport.js';
import { createInteractiveDashboardHtml } from '../core/dashboard/interactiveExport.js';

describe('HTML export appearance', () => {
  it('normalizes supported styles and safely falls back from invalid colors', () => {
    const appearance = normalizeExportAppearance({ preset: 'midnight', accent: 'red', font: 'georgia', radius: 'rounded', spacing: 'spacious', brandLabel: 'My Report' });
    expect(appearance.accent).toBe('#7C6CFF');
    expect(appearance.background).toBe('#0B1020');
    expect(exportAppearanceCss(appearance).fontStack).toContain('Georgia');
    expect(exportAppearanceCss(appearance).padding).toBe('24px');
  });

  it('applies a custom appearance to both static and interactive HTML exports', () => {
    const ds = { id: 'ds', name: 'Sales', rowCount: 0, columns: [], data: {}, visualizations: [], kpis: [], insights: [], analyses: [] };
    const dashboard = { id: 'dash', title: 'Sales overview', description: 'Monthly report', components: [] };
    const appearance = { ...DEFAULT_EXPORT_APPEARANCE, preset: 'custom', accent: '#123456', background: '#101010', panel: '#202020', text: '#F0F0F0', muted: '#AAAAAA', brandLabel: 'Northstar Analytics', showFooter: false };
    const stat = createStaticDashboardHtml(ds, dashboard, { appearance });
    const interactive = createInteractiveDashboardHtml(ds, dashboard, { columns: [], appearance });
    for (const html of [stat, interactive]) {
      expect(html).toContain('--accent:#123456');
      expect(html).toContain('--bg:#101010');
      expect(html).toContain('Northstar Analytics');
      expect(html).not.toContain('Exported from Northstar Analytics.');
    }
  });

  it('embeds chronological month parsing in interactive export and respects explicit sort choices', () => {
    const ds = { id: 'ds', name: 'Sales', rowCount: 0, columns: [], data: {}, visualizations: [], kpis: [], insights: [], analyses: [] };
    const dashboard = { id: 'dash', title: 'Sales overview', components: [] };
    const html = createInteractiveDashboardHtml(ds, dashboard, { columns: [] });
    expect(html).toContain('const monthParts=label=>');
    expect(html).toContain("else if(namedMonths&&sortBy==='auto')combined.sort(compareMonths)");
    expect(html).toContain("if(sortBy==='label')combined.sort");
  });
});
