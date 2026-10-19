const PRESETS = {
  midnight: { accent: '#7C6CFF', background: '#0B1020', panel: '#151C30', text: '#F3F5FF', muted: '#A8B2CC' },
  executive: { accent: '#2457D6', background: '#F3F6FB', panel: '#FFFFFF', text: '#18202B', muted: '#64748B' },
  minimal: { accent: '#0F766E', background: '#FFFFFF', panel: '#FFFFFF', text: '#20252D', muted: '#667085' },
  custom: { accent: '#6366F1', background: '#F5F7FB', panel: '#FFFFFF', text: '#18202B', muted: '#64748B' },
};
export const DEFAULT_EXPORT_APPEARANCE = Object.freeze({ preset: 'executive', ...PRESETS.executive, font: 'system', radius: 'comfortable', spacing: 'comfortable', brandLabel: 'JSA', showFooter: true });
const HEX = /^#[0-9a-f]{6}$/i;
export function normalizeExportAppearance(input = {}) {
  const preset = Object.hasOwn(PRESETS, input.preset) ? input.preset : DEFAULT_EXPORT_APPEARANCE.preset;
  const base = PRESETS[preset];
  const safeColor = (value, fallback) => HEX.test(value || '') ? value : fallback;
  return {
    preset,
    accent: safeColor(input.accent, base.accent),
    background: safeColor(input.background, base.background),
    panel: safeColor(input.panel, base.panel),
    text: safeColor(input.text, base.text),
    muted: safeColor(input.muted, base.muted),
    font: ['system', 'arial', 'georgia'].includes(input.font) ? input.font : 'system',
    radius: ['compact', 'comfortable', 'rounded'].includes(input.radius) ? input.radius : 'comfortable',
    spacing: ['compact', 'comfortable', 'spacious'].includes(input.spacing) ? input.spacing : 'comfortable',
    brandLabel: String(input.brandLabel || 'JSA').replace(/[<>\r\n]/g, '').slice(0, 60) || 'JSA',
    showFooter: input.showFooter !== false,
  };
}
export function exportAppearanceCss(input = {}) {
  const a = normalizeExportAppearance(input);
  const radius = { compact: '8px', comfortable: '14px', rounded: '22px' }[a.radius];
  const spacing = { compact: '10px', comfortable: '16px', spacious: '24px' }[a.spacing];
  const padding = { compact: '12px', comfortable: '18px', spacious: '24px' }[a.spacing];
  const font = { system: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', arial: 'Arial,Helvetica,sans-serif', georgia: 'Georgia,"Times New Roman",serif' }[a.font];
  return { ...a, radius, spacing, padding, fontStack: font };
}
