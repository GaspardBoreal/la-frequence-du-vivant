import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sparkles, Search, Download, FileJson, FileSpreadsheet, Bot, Loader2, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  type PartnerAiSimulation,
  formatDate,
  simulationToMarkdown,
  simulationsToMarkdown,
  simulationsToCsv,
  downloadFile,
} from '@/lib/partnerAiSimulations';

const horodatage = () => new Date().toISOString().slice(0, 10);

const CrmIa: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState<PartnerAiSimulation | null>(null);
  const [copie, setCopie] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-ai-simulations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_ai_simulations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as PartnerAiSimulation[];
    },
  });

  const rows = React.useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) =>
      [s.nom, s.type_structure, s.territoire, s.productions, s.projet, s.difficulte, s.source_page]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, search]);

  const copierIa = async () => {
    await navigator.clipboard.writeText(simulationsToMarkdown(rows));
    setCopie(true);
    toast.success('Export IA copié — collez-le dans l’assistant de votre choix.');
    setTimeout(() => setCopie(false), 2500);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[hsl(var(--crm-text))] tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[hsl(var(--crm-accent))]" />
            Simulations & plans IA
          </h1>
          <p className="text-sm crm-muted mt-1">
            Chaque projet décrit sur les pages partenaires, le plan généré et le fil des questions-réponses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={copierIa} disabled={!rows.length}>
            {copie ? <Check className="h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
            Copier pour une autre IA
          </Button>
          <Button size="sm" variant="outline" disabled={!rows.length}
            onClick={() => downloadFile(`simulations-lfdv-${horodatage()}.md`, simulationsToMarkdown(rows), 'text/markdown')}>
            <Download className="h-4 w-4 mr-2" />Markdown
          </Button>
          <Button size="sm" variant="outline" disabled={!rows.length}
            onClick={() => downloadFile(`simulations-lfdv-${horodatage()}.json`, JSON.stringify(rows, null, 2), 'application/json')}>
            <FileJson className="h-4 w-4 mr-2" />JSON
          </Button>
          <Button size="sm" variant="outline" disabled={!rows.length}
            onClick={() => downloadFile(`simulations-lfdv-${horodatage()}.csv`, simulationsToCsv(rows), 'text/csv')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Structure, territoire, production, difficulté…" className="pl-9" />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 crm-muted text-sm py-10">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement des simulations…
        </div>
      )}

      {error && (
        <div className="crm-surface rounded-xl p-6 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
          Impossible de lire les simulations. Cet écran est réservé aux administrateurs.
        </div>
      )}

      {!isLoading && !error && !rows.length && (
        <div className="crm-surface rounded-xl p-10 text-center text-sm crm-muted">
          Aucune simulation enregistrée pour le moment.
        </div>
      )}

      {!!rows.length && (
        <div className="crm-surface rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left crm-muted border-b border-[hsl(var(--crm-border))]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Structure</th>
                  <th className="px-4 py-3 font-medium">Territoire</th>
                  <th className="px-4 py-3 font-medium">Projet</th>
                  <th className="px-4 py-3 font-medium text-right">Sites</th>
                  <th className="px-4 py-3 font-medium text-right">Échanges</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} onClick={() => setOpen(s)}
                    className="border-b border-[hsl(var(--crm-border))] last:border-0 cursor-pointer hover:bg-[hsl(var(--crm-surface-2))]">
                    <td className="px-4 py-3 whitespace-nowrap crm-muted">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-[hsl(var(--crm-text))]">{s.nom || '—'}</td>
                    <td className="px-4 py-3 crm-muted">{s.territoire || '—'}</td>
                    <td className="px-4 py-3 crm-muted max-w-sm truncate">{s.projet || '—'}</td>
                    <td className="px-4 py-3 text-right crm-muted">{String((s.form_payload as any)?.sites ?? '—')}</td>
                    <td className="px-4 py-3 text-right crm-muted">{s.precisions?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${s.status === 'done' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {s.status === 'done' ? 'Plan généré' : 'Repli'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{open?.nom || 'Simulation'}</SheetTitle>
          </SheetHeader>
          {open && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  await navigator.clipboard.writeText(simulationToMarkdown(open));
                  toast.success('Simulation copiée.');
                }}>
                  <Copy className="h-4 w-4 mr-2" />Copier cette simulation
                </Button>
                <Button size="sm" variant="outline" onClick={() =>
                  downloadFile(`simulation-${open.id.slice(0, 8)}.json`, JSON.stringify(open, null, 2), 'application/json')}>
                  <FileJson className="h-4 w-4 mr-2" />JSON
                </Button>
              </div>
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs leading-relaxed">
                {simulationToMarkdown(open)}
              </pre>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CrmIa;
