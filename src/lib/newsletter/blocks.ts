/** Blocs de composition d'une newsletter + rendu HTML compatible clients mail. */

export type NewsletterUnivers = 'tous' | 'marches' | 'jardin' | 'vignoble';

export interface UniversTheme {
  key: NewsletterUnivers;
  label: string;
  accent: string;
  bg: string;
  text: string;
  muted: string;
  signature: string;
}

export const UNIVERS_THEMES: Record<NewsletterUnivers, UniversTheme> = {
  tous: {
    key: 'tous',
    label: 'Tous les univers',
    accent: '#0D6B58',
    bg: '#FAF8F3',
    text: '#1B2420',
    muted: '#6B7772',
    signature: 'La Fréquence du Vivant',
  },
  marches: {
    key: 'marches',
    label: 'Les Marches du Vivant',
    accent: '#0E7C66',
    bg: '#F6F4EE',
    text: '#17231F',
    muted: '#68746F',
    signature: 'Les Marches du Vivant',
  },
  jardin: {
    key: 'jardin',
    label: 'Fréquence Jardin',
    accent: '#3F7D20',
    bg: '#F7F9F2',
    text: '#1E2A16',
    muted: '#6C7A63',
    signature: 'Fréquence Jardin',
  },
  vignoble: {
    key: 'vignoble',
    label: 'Fréquence Vignoble',
    accent: '#6D2846',
    bg: '#FBF5F7',
    text: '#2A1721',
    muted: '#7C6470',
    signature: 'Fréquence Vignoble',
  },
};

export const UNIVERS_LIST: NewsletterUnivers[] = ['tous', 'marches', 'jardin', 'vignoble'];

export type NewsletterBlock =
  | { id: string; type: 'heading'; text: string; level?: 1 | 2 }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; url: string; alt?: string; href?: string }
  | { id: string; type: 'button'; label: string; href: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'quote'; text: string; author?: string }
  | {
      id: string;
      type: 'card';
      title: string;
      text?: string;
      imageUrl?: string;
      href?: string;
      cta?: string;
    }
  | { id: string; type: 'footer'; text: string };

export type BlockType = NewsletterBlock['type'];

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Titre',
  text: 'Paragraphe',
  image: 'Image',
  button: "Bouton d'action",
  divider: 'Séparateur',
  quote: 'Citation',
  card: 'Carte (marche, article…)',
  footer: 'Pied de page',
};

export function newBlock(type: BlockType): NewsletterBlock {
  const id = `b_${Math.random().toString(36).slice(2, 10)}`;
  switch (type) {
    case 'heading':
      return { id, type, text: 'Un titre qui donne envie', level: 1 };
    case 'text':
      return { id, type, text: 'Écrivez ici votre message…' };
    case 'image':
      return { id, type, url: '', alt: '' };
    case 'button':
      return { id, type, label: 'Découvrir', href: 'https://la-frequence-du-vivant.com' };
    case 'divider':
      return { id, type };
    case 'quote':
      return { id, type, text: 'Une phrase inspirante.', author: '' };
    case 'card':
      return { id, type, title: 'Une marche à venir', text: '', imageUrl: '', href: '', cta: 'En savoir plus' };
    case 'footer':
      return { id, type, text: 'Vous recevez ce message car vous êtes inscrit·e à La Fréquence du Vivant.' };
  }
}

export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br />');
}

/** Rendu d'un bloc. `linkHref` permet d'envelopper les liens dans un lien de suivi. */
export function renderBlock(
  block: NewsletterBlock,
  theme: UniversTheme,
  linkHref: (url: string) => string = (u) => u,
): string {
  const pad = 'padding:0 28px;';
  switch (block.type) {
    case 'heading': {
      const size = block.level === 2 ? 20 : 26;
      return `<tr><td style="${pad}padding-top:24px;"><h${block.level ?? 1} style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:${size}px;line-height:1.25;color:${theme.text};font-weight:600;">${escapeHtml(block.text)}</h${block.level ?? 1}></td></tr>`;
    }
    case 'text':
      return `<tr><td style="${pad}padding-top:14px;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${theme.text};">${nl2br(block.text)}</p></td></tr>`;
    case 'image': {
      if (!block.url) return '';
      const img = `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt ?? '')}" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:12px;border:0;" />`;
      const inner = block.href ? `<a href="${escapeHtml(linkHref(block.href))}" target="_blank">${img}</a>` : img;
      return `<tr><td style="${pad}padding-top:20px;">${inner}</td></tr>`;
    }
    case 'button':
      if (!block.href) return '';
      return `<tr><td style="${pad}padding-top:22px;"><a href="${escapeHtml(linkHref(block.href))}" target="_blank" style="display:inline-block;background:${theme.accent};color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;padding:13px 26px;border-radius:999px;">${escapeHtml(block.label)}</a></td></tr>`;
    case 'divider':
      return `<tr><td style="${pad}padding-top:24px;"><div style="height:1px;background:${theme.muted}33;"></div></td></tr>`;
    case 'quote':
      return `<tr><td style="${pad}padding-top:22px;"><blockquote style="margin:0;border-left:3px solid ${theme.accent};padding:4px 0 4px 16px;font-family:Georgia,serif;font-size:17px;line-height:1.6;color:${theme.text};font-style:italic;">${nl2br(block.text)}${block.author ? `<br /><span style="font-style:normal;font-size:13px;color:${theme.muted};">— ${escapeHtml(block.author)}</span>` : ''}</blockquote></td></tr>`;
    case 'card': {
      const img = block.imageUrl
        ? `<img src="${escapeHtml(block.imageUrl)}" alt="" width="544" style="display:block;width:100%;height:auto;border-radius:12px 12px 0 0;border:0;" />`
        : '';
      const cta = block.href
        ? `<p style="margin:12px 0 0;"><a href="${escapeHtml(linkHref(block.href))}" target="_blank" style="color:${theme.accent};font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(block.cta || 'En savoir plus')} →</a></p>`
        : '';
      return `<tr><td style="${pad}padding-top:22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${theme.muted}33;border-radius:12px;overflow:hidden;background:#ffffff;"><tr><td>${img}</td></tr><tr><td style="padding:16px 18px;"><h3 style="margin:0;font-family:Georgia,serif;font-size:18px;color:${theme.text};">${escapeHtml(block.title)}</h3>${block.text ? `<p style="margin:8px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:${theme.muted};">${nl2br(block.text)}</p>` : ''}${cta}</td></tr></table></td></tr>`;
    }
    case 'footer':
      return `<tr><td style="${pad}padding-top:26px;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${theme.muted};">${nl2br(block.text)}</p></td></tr>`;
    default:
      return '';
  }
}

export interface RenderOptions {
  blocks: NewsletterBlock[];
  univers: NewsletterUnivers;
  preheader?: string | null;
  unsubscribeUrl?: string | null;
  linkHref?: (url: string) => string;
}

export function renderNewsletterHtml(opts: RenderOptions): string {
  const theme = UNIVERS_THEMES[opts.univers] ?? UNIVERS_THEMES.tous;
  const link = opts.linkHref ?? ((u: string) => u);
  const body = opts.blocks.map((b) => renderBlock(b, theme, link)).join('');
  const unsub = opts.unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${theme.muted};"><a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${theme.muted};">Se désinscrire de ces envois</a></p>`
    : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${theme.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader ?? '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.bg};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
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
  for (const b of blocks) {
    switch (b.type) {
      case 'heading':
        lines.push(b.text.toUpperCase(), '');
        break;
      case 'text':
        lines.push(b.text, '');
        break;
      case 'quote':
        lines.push(`« ${b.text} »${b.author ? ` — ${b.author}` : ''}`, '');
        break;
      case 'button':
        lines.push(`${b.label} : ${b.href}`, '');
        break;
      case 'image':
        if (b.href) lines.push(b.href, '');
        break;
      case 'card':
        lines.push(b.title, b.text ?? '', b.href ?? '', '');
        break;
      case 'footer':
        lines.push(b.text, '');
        break;
      default:
        break;
    }
  }
  if (unsubscribeUrl) lines.push('Se désinscrire : ' + unsubscribeUrl);
  return lines.join('\n').trim();
}
