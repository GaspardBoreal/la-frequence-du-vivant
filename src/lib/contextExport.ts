/**
 * Export des contextes IA — engagement de transparence.
 *
 * Tout ce que l'IA reçoit doit pouvoir être lu, copié, emporté. Ce module
 * sérialise un contexte unitaire ou l'ensemble de la sélection (« Bordereau du
 * vivant ») en quatre formats : Markdown, JSON, CSV, et le texte brut
 * réellement transmis au modèle.
 */
import type { ContextProvider } from '@/hooks/useChatPageContext';
import { estimateTokens, formatBytes, formatTokens, ecoVerdict } from '@/lib/chatContextCost';

export type ExportFormat = 'markdown' | 'json' | 'csv' | 'raw';

export const EXPORT_FORMATS: Array<{ id: ExportFormat; label: string; hint: string; ext: string; mime: string }> = [
  { id: 'markdown', label: 'Lisible', hint: 'Markdown', ext: 'md', mime: 'text/markdown;charset=utf-8' },
  { id: 'json', label: 'Données', hint: 'JSON', ext: 'json', mime: 'application/json;charset=utf-8' },
  { id: 'csv', label: 'Tableur', hint: 'CSV', ext: 'csv', mime: 'text/csv;charset=utf-8' },
  { id: 'raw', label: 'Brut', hint: 'texte transmis à l’IA', ext: 'txt', mime: 'text/plain;charset=utf-8' },
];

export interface ExportFile {
  filename: string;
  mime: string;
  content: string;
}

export const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'contexte';

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const cell = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const csvCell = (v: unknown): string => {
  const s = cell(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const objectRows = (raw: unknown): Array<Record<string, unknown>> | null => {
  if (Array.isArray(raw) && raw.length > 0 && raw.every(isPlainObject)) {
    return raw as Array<Record<string, unknown>>;
  }
  if (isPlainObject(raw)) {
    for (const v of Object.values(raw)) {
      if (Array.isArray(v) && v.length > 0 && v.every(isPlainObject)) {
        return v as Array<Record<string, unknown>>;
      }
    }
  }
  return null;
};

const columnsOf = (rows: Array<Record<string, unknown>>): string[] => {
  const cols: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  return cols;
};

const toMarkdownTable = (rows: Array<Record<string, unknown>>): string => {
  const cols = columnsOf(rows);
  const head = `| ${cols.join(' | ')} |`;
  const sep = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${cols.map((c) => cell(r[c]).replace(/\|/g, '\\|')).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
};

const toCsvTable = (rows: Array<Record<string, unknown>>): string => {
  const cols = columnsOf(rows);
  return [cols.map(csvCell).join(';'), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(';'))].join('\n');
};

const keyValueList = (obj: Record<string, unknown>): string =>
  Object.entries(obj)
    .filter(([, v]) => !(Array.isArray(v) && v.length > 0 && v.every(isPlainObject)))
    .map(([k, v]) => `- **${k}** : ${cell(v)}`)
    .join('\n');

/** Le texte exact transmis au modèle pour ce contexte. */
export const rawPayload = (p: ContextProvider): string => {
  const v = p.payload;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

/** Corps d'un contexte, sans en-tête, dans le format demandé. */
export const serializeProviderBody = (p: ContextProvider, format: ExportFormat): string => {
  if (format === 'raw' || format === 'json') return rawPayload(p);

  const rows = objectRows(p.payload);
  if (format === 'csv') {
    if (rows) return toCsvTable(rows);
    if (isPlainObject(p.payload)) {
      return ['clé;valeur', ...Object.entries(p.payload).map(([k, v]) => `${csvCell(k)};${csvCell(v)}`)].join('\n');
    }
    return csvCell(rawPayload(p));
  }

  // markdown
  if (typeof p.payload === 'string') return p.payload;
  const parts: string[] = [];
  if (isPlainObject(p.payload)) {
    const kv = keyValueList(p.payload);
    if (kv) parts.push(kv);
  }
  if (rows) parts.push(toMarkdownTable(rows));
  if (parts.length === 0) parts.push('```json\n' + rawPayload(p) + '\n```');
  return parts.join('\n\n');
};

/** Un contexte isolé, prêt à copier / télécharger. */
export const serializeProvider = (p: ContextProvider, format: ExportFormat): ExportFile => {
  const fmt = EXPORT_FORMATS.find((f) => f.id === format)!;
  const body = serializeProviderBody(p, format);
  const content =
    format === 'markdown'
      ? `## ${p.emoji} ${p.label}\n\n${p.hint ? `_${p.hint}_\n\n` : ''}> Poids transmis : ${formatBytes(p.bytes)} · ${formatTokens(
          estimateTokens(p.bytes),
        )}\n\n${body}\n`
      : body;
  return { filename: `contexte-${slugify(p.label)}.${fmt.ext}`, mime: fmt.mime, content };
};

export interface BordereauMeta {
  /** Titre de la console, ex. « Contextes de la propriété ». */
  title: string;
  /** Nom de la fiche / propriété si connu. */
  subject?: string | null;
  /** Poids additionnel (pièces jointes déjà attachées). */
  baseBytes?: number;
}

const stamp = () =>
  new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

/** Le « Bordereau du vivant » : tout ce qui part vers l'IA, en un document. */
export const buildBordereau = (
  providers: ContextProvider[],
  meta: BordereauMeta,
  format: ExportFormat,
): ExportFile => {
  const fmt = EXPORT_FORMATS.find((f) => f.id === format)!;
  const total = (meta.baseBytes ?? 0) + providers.reduce((s, p) => s + p.bytes, 0);
  const verdict = ecoVerdict(total);
  const base = `bordereau-${slugify(meta.subject || meta.title)}`;

  if (format === 'json') {
    const content = JSON.stringify(
      {
        bordereau: meta.title,
        sujet: meta.subject ?? null,
        edite_le: new Date().toISOString(),
        contextes: providers.length,
        octets: total,
        tokens_estimes: estimateTokens(total),
        eco_score: verdict.label,
        blocs: providers.map((p) => ({
          id: p.id,
          groupe: p.group,
          libelle: p.label,
          octets: p.bytes,
          contenu: p.payload,
        })),
      },
      null,
      2,
    );
    return { filename: `${base}.json`, mime: fmt.mime, content };
  }

  if (format === 'csv') {
    const blocks = providers.map(
      (p) => `# ${p.group} — ${p.label} (${formatBytes(p.bytes)})\n${serializeProviderBody(p, 'csv')}`,
    );
    return {
      filename: `${base}.csv`,
      mime: fmt.mime,
      content: [`# ${meta.title} — ${stamp()}`, ...blocks].join('\n\n'),
    };
  }

  if (format === 'raw') {
    const blocks = providers.map((p) => `<<< ${p.id} | ${p.label} | ${formatBytes(p.bytes)} >>>\n${rawPayload(p)}`);
    return {
      filename: `${base}.txt`,
      mime: fmt.mime,
      content: [
        `# ${meta.title} — texte transmis au modèle`,
        `# ${stamp()} · ${providers.length} contexte(s) · ${formatBytes(total)} · ${formatTokens(estimateTokens(total))}`,
        '',
        ...blocks,
      ].join('\n\n'),
    };
  }

  // markdown
  const toc = providers
    .map((p) => {
      const share = total > 0 ? Math.round((p.bytes / total) * 100) : 0;
      return `- ${p.emoji} **${p.label}** — ${formatBytes(p.bytes)} (${share} %) · _${p.group}_`;
    })
    .join('\n');

  const body = providers.map((p) => serializeProvider(p, 'markdown').content).join('\n\n---\n\n');

  const content = [
    `# ${meta.title}`,
    meta.subject ? `**${meta.subject}**` : '',
    '',
    `Bordereau édité le ${stamp()}.`,
    '',
    `| Contextes | Poids transmis | Tokens estimés | Éco-score |`,
    `| --- | --- | --- | --- |`,
    `| ${providers.length} | ${formatBytes(total)} | ${formatTokens(estimateTokens(total))} | ${verdict.label} |`,
    '',
    '## Ce qui est transmis',
    '',
    toc || '_Aucun contexte activé._',
    '',
    '---',
    '',
    body,
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  return { filename: `${base}.md`, mime: fmt.mime, content };
};

/** Copie presse-papier avec repli legacy. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* repli ci-dessous */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

export const downloadFile = (file: ExportFile) => {
  const blob = new Blob([file.content], { type: file.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
