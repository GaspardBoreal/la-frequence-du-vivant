// Rendu HTML des newsletters (miroir Deno de src/lib/newsletter/blocks.ts).

export type NewsletterUnivers = 'tous' | 'marches' | 'jardin' | 'vignoble';

interface Theme {
  accent: string;
  bg: string;
  text: string;
  muted: string;
  signature: string;
}

export const UNIVERS_THEMES: Record<NewsletterUnivers, Theme> = {
  tous: { accent: '#0D6B58', bg: '#FAF8F3', text: '#1B2420', muted: '#6B7772', signature: 'La Fréquence du Vivant' },
  marches: { accent: '#0E7C66', bg: '#F6F4EE', text: '#17231F', muted: '#68746F', signature: 'Les Marches du Vivant' },
  jardin: { accent: '#3F7D20', bg: '#F7F9F2', text: '#1E2A16', muted: '#6C7A63', signature: 'Fréquence Jardin' },
  vignoble: { accent: '#6D2846', bg: '#FBF5F7', text: '#2A1721', muted: '#7C6470', signature: 'Fréquence Vignoble' },
};

// deno-lint-ignore no-explicit-any
export type NewsletterBlock = any;

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const nl2br = (s: unknown) => escapeHtml(s).replace(/\n/g, '<br />');

function renderBlock(block: NewsletterBlock, theme: Theme, link: (u: string) => string): string {
  const pad = 'padding:0 28px;';
  switch (block?.type) {
    case 'heading': {
      const lvl = block.level === 2 ? 2 : 1;
      const size = lvl === 2 ? 20 : 26;
      return `<tr><td style="${pad}padding-top:24px;"><h${lvl} style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:${size}px;line-height:1.25;color:${theme.text};font-weight:600;">${escapeHtml(block.text)}</h${lvl}></td></tr>`;
    }
    case 'text':
      return `<tr><td style="${pad}padding-top:14px;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${theme.text};">${nl2br(block.text)}</p></td></tr>`;
    case 'image': {
      if (!block.url) return '';
      const img = `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt ?? '')}" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:12px;border:0;" />`;
      const inner = block.href ? `<a href="${escapeHtml(link(block.href))}" target="_blank">${img}</a>` : img;
      return `<tr><td style="${pad}padding-top:20px;">${inner}</td></tr>`;
    }
    case 'button':
      if (!block.href) return '';
      return `<tr><td style="${pad}padding-top:22px;"><a href="${escapeHtml(link(block.href))}" target="_blank" style="display:inline-block;background:${theme.accent};color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:13px 26px;border-radius:999px;">${escapeHtml(block.label)}</a></td></tr>`;
    case 'divider':
      return `<tr><td style="${pad}padding-top:24px;"><div style="height:1px;background:${theme.muted}33;"></div></td></tr>`;
    case 'quote':
      return `<tr><td style="${pad}padding-top:22px;"><blockquote style="margin:0;border-left:3px solid ${theme.accent};padding:4px 0 4px 16px;font-family:Georgia,serif;font-size:17px;line-height:1.6;color:${theme.text};font-style:italic;">${nl2br(block.text)}${block.author ? `<br /><span style="font-style:normal;font-size:13px;color:${theme.muted};">— ${escapeHtml(block.author)}</span>` : ''}</blockquote></td></tr>`;
    case 'card': {
      const img = block.imageUrl
        ? `<img src="${escapeHtml(block.imageUrl)}" alt="" width="544" style="display:block;width:100%;height:auto;border-radius:12px 12px 0 0;border:0;" />`
        : '';
      const cta = block.href
        ? `<p style="margin:12px 0 0;"><a href="${escapeHtml(link(block.href))}" target="_blank" style="color:${theme.accent};font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(block.cta || 'En savoir plus')} →</a></p>`
        : '';
      return `<tr><td style="${pad}padding-top:22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${theme.muted}33;border-radius:12px;overflow:hidden;background:#ffffff;"><tr><td>${img}</td></tr><tr><td style="padding:16px 18px;"><h3 style="margin:0;font-family:Georgia,serif;font-size:18px;color:${theme.text};">${escapeHtml(block.title)}</h3>${block.text ? `<p style="margin:8px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:${theme.muted};">${nl2br(block.text)}</p>` : ''}${cta}</td></tr></table></td></tr>`;
    }
    case 'footer':
      return `<tr><td style="${pad}padding-top:26px;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${theme.muted};">${nl2br(block.text)}</p></td></tr>`;
    default:
      return '';
  }
}

export function renderNewsletterHtml(opts: {
  blocks: NewsletterBlock[];
  univers: string;
  preheader?: string | null;
  unsubscribeUrl?: string | null;
  linkHref?: (url: string) => string;
}): string {
  const theme = UNIVERS_THEMES[(opts.univers as NewsletterUnivers)] ?? UNIVERS_THEMES.tous;
  const link = opts.linkHref ?? ((u: string) => u);
  const body = (opts.blocks ?? []).map((b) => renderBlock(b, theme, link)).join('');
  const unsub = opts.unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${theme.muted};"><a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${theme.muted};">Se désinscrire de ces envois</a></p>`
    : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${theme.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader ?? '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
<tr><td style="height:6px;background:${theme.accent};"></td></tr>
<tr><td style="padding:22px 28px 0;"><span style="font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${theme.accent};font-weight:700;">${escapeHtml(theme.signature)}</span></td></tr>
${body}
<tr><td style="padding:28px;">
<div style="height:1px;background:${theme.muted}33;"></div>
<p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${theme.muted};">${escapeHtml(theme.signature)} — <a href="https://la-frequence-du-vivant.com" style="color:${theme.accent};">la-frequence-du-vivant.com</a></p>
${unsub}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function renderNewsletterText(blocks: NewsletterBlock[], unsubscribeUrl?: string | null): string {
  const lines: string[] = [];
  for (const b of blocks ?? []) {
    switch (b?.type) {
      case 'heading': lines.push(String(b.text ?? '').toUpperCase(), ''); break;
      case 'text': lines.push(String(b.text ?? ''), ''); break;
      case 'quote': lines.push(`« ${b.text} »${b.author ? ` — ${b.author}` : ''}`, ''); break;
      case 'button': lines.push(`${b.label} : ${b.href}`, ''); break;
      case 'image': if (b.href) lines.push(String(b.href), ''); break;
      case 'card': lines.push(String(b.title ?? ''), String(b.text ?? ''), String(b.href ?? ''), ''); break;
      case 'footer': lines.push(String(b.text ?? ''), ''); break;
      default: break;
    }
  }
  if (unsubscribeUrl) lines.push('Se désinscrire : ' + unsubscribeUrl);
  return lines.join('\n').trim();
}
