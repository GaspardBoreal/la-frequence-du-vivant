import React from 'react';
import { Copy, Check, Table2, FileSpreadsheet, Download, Clapperboard } from 'lucide-react';
import {
  openScenographe,
  useScenographeAvailable,
} from '@/components/propriete/scenographe/scenographeStore';
import { useProprieteChatFocus } from '@/components/propriete/chatbot/proprieteChatFocus';
import { parseSpeciesTable, looksLikeSpeciesTable } from '@/lib/chatSpeciesTable';


/**
 * Tableau de synthèse du chat : rendu éditorial + actions d'export.
 *
 * Le TSV/CSV est reconstruit depuis le DOM du tableau rendu (et non depuis le
 * markdown brut) : robuste au streaming partiel et strictement fidèle à ce que
 * l'utilisateur voit.
 */

type Copied = null | 'md' | 'tsv' | 'csv';

const readMatrix = (table: HTMLTableElement | null): string[][] => {
  if (!table) return [];
  return Array.from(table.rows).map((row) =>
    Array.from(row.cells).map((cell) => (cell.innerText || '').replace(/\s+/g, ' ').trim()),
  );
};

const toMarkdown = (m: string[][]) => {
  if (m.length === 0) return '';
  const [head, ...body] = m;
  const sep = head.map(() => '---');
  return [head, sep, ...body].map((r) => `| ${r.join(' | ')} |`).join('\n');
};

const toTsv = (m: string[][]) => m.map((r) => r.map((c) => c.replace(/\t/g, ' ')).join('\t')).join('\n');

const toCsv = (m: string[][]) =>
  '\uFEFF' +
  m.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');

export function ChatTableBlock({ children }: { children?: React.ReactNode }) {
  const ref = React.useRef<HTMLTableElement>(null);
  const [copied, setCopied] = React.useState<Copied>(null);

  const flash = (k: Copied) => {
    setCopied(k);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const write = async (text: string, k: Copied) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    flash(k);
  };

  const download = () => {
    const csv = toCsv(readMatrix(ref.current));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthese-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Action = ({
    onClick,
    icon: Icon,
    label,
    active,
  }: {
    onClick: () => void;
    icon: typeof Copy;
    label: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 rounded-full border px-2 py-[3px] text-[10px] transition-colors ${
        active
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'
      }`}
    >
      {active ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      <span>{active ? 'Copié' : label}</span>
    </button>
  );

  const [rows, setRows] = React.useState(0);
  const [isPalette, setIsPalette] = React.useState(false);
  React.useEffect(() => {
    setRows(Math.max(0, (ref.current?.rows.length ?? 1) - 1));
    setIsPalette(looksLikeSpeciesTable(readMatrix(ref.current)));
  }, [children]);

  /** Passerelle vers le Scénographe : n'apparaît que dans un espace propriété
   *  avec un ouvrage cadré et un tableau qui ressemble à une palette. */
  const scenoReady = useScenographeAvailable();
  const focus = useProprieteChatFocus();
  const targetObjetId = focus.objetId ?? focus.selectedObjetIds[0] ?? null;
  const canStage = scenoReady && isPalette && !!targetObjetId;

  return (
    <div className="group/table my-3 overflow-hidden rounded-xl border border-border/70 bg-background/40 not-prose">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 bg-muted/40 px-2 py-1.5">
        <span className="mr-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Table2 className="h-3 w-3" /> Synthèse à exporter
          {rows > 0 && <span className="text-primary/80">· {rows} ligne{rows > 1 ? 's' : ''}</span>}
        </span>

        {canStage && (
          <button
            type="button"
            onClick={() => {
              const parsed = parseSpeciesTable(readMatrix(ref.current));
              if (!parsed.length) {
                toast.error("Aucune espèce exploitable dans ce tableau");
                return;
              }
              openScenographe(targetObjetId!, parsed);
              toast.success(`Palette envoyée au Scénographe · ${parsed.length} espèce${parsed.length > 1 ? 's' : ''}`);
            }}

            title="Composer cette palette sur le plan de l’ouvrage"
            className="flex items-center gap-1 rounded-full border border-[#c8a24a]/60 bg-[#c8a24a]/15 px-2 py-[3px] text-[10px] font-medium text-[#c8a24a] transition-colors hover:bg-[#c8a24a]/25"
          >
            <Clapperboard className="h-3 w-3" />
            <span>Scénographe</span>
          </button>
        )}

        <Action
          onClick={() => write(toMarkdown(readMatrix(ref.current)), 'md')}
          icon={Copy}
          label="Markdown"
          active={copied === 'md'}
        />
        <Action
          onClick={() => write(toTsv(readMatrix(ref.current)), 'tsv')}
          icon={FileSpreadsheet}
          label="Tableur"
          active={copied === 'tsv'}
        />
        <Action
          onClick={() => write(toCsv(readMatrix(ref.current)), 'csv')}
          icon={Copy}
          label="CSV"
          active={copied === 'csv'}
        />
        <Action onClick={download} icon={Download} label=".csv" />
      </div>

      <div className="overflow-x-auto">
        <table
          ref={ref}
          className="w-full border-collapse text-[11.5px] [&_td]:border-t [&_td]:border-border/40 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.1em] [&_th]:text-primary [&_thead]:bg-muted/60 [&_tbody_tr:nth-child(even)]:bg-muted/20"
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export default ChatTableBlock;
