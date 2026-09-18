import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Trash2, FileText } from 'lucide-react';
import { useKbArticles, useDeleteKbArticle, type KbArticle, type KbStatus } from '@/hooks/admin/useKnowledge';
import { AUDIENCE_LABEL, type KbAudience } from '@/lib/knowledge/seed';
import KbArticleSheet from './KbArticleSheet';

const STATUT_STYLE: Record<KbStatus, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-muted text-muted-foreground' },
  relecture: { label: 'À relire', cls: 'bg-amber-500/15 text-amber-700' },
  publiee: { label: 'Publiée', cls: 'bg-emerald-500/15 text-emerald-700' },
};

const KbFiches: React.FC = () => {
  const { data: articles = [], isLoading } = useKbArticles();
  const remove = useDeleteKbArticle();
  const [q, setQ] = React.useState('');
  const [statut, setStatut] = React.useState<'tous' | KbStatus>('tous');
  const [editing, setEditing] = React.useState<KbArticle | null>(null);
  const [open, setOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<KbArticle | null>(null);

  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtered = React.useMemo(() => {
    const needle = norm(q.trim());
    return articles.filter((a) => {
      if (statut !== 'tous' && a.status !== statut) return false;
      if (!needle) return true;
      return norm(`${a.title} ${a.question_principale ?? ''} ${a.short_answer} ${a.topic ?? ''}`).includes(needle);
    });
  }, [articles, q, statut]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une fiche, une question…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(['tous', 'brouillon', 'relecture', 'publiee'] as const).map((s) => (
            <Button key={s} size="sm" variant={statut === s ? 'default' : 'outline'} onClick={() => setStatut(s)}>
              {s === 'tous' ? 'Toutes' : STATUT_STYLE[s].label}
            </Button>
          ))}
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Nouvelle
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement des fiches…</p>}
      {!isLoading && filtered.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune fiche pour ce filtre. Commencez par importer les savoirs du site depuis l’onglet Cartographie.
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((a) => {
          const st = STATUT_STYLE[a.status];
          const nSources = a.kb_article_sources?.length ?? 0;
          return (
            <Card key={a.id} className="flex items-start gap-3 p-4">
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => {
                  setEditing(a);
                  setOpen(true);
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{a.title}</span>
                  <Badge className={st.cls} variant="secondary">{st.label}</Badge>
                  {a.topic && <Badge variant="outline">{a.topic}</Badge>}
                  {nSources === 0 && <Badge variant="outline" className="border-destructive/40 text-destructive">Sans source</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.short_answer}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {(a.audiences as KbAudience[]).map((x) => AUDIENCE_LABEL[x] ?? x).join(' · ')} — {nSources} source(s)
                </p>
              </button>
              <Button size="icon" variant="ghost" onClick={() => setToDelete(a)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>

      <KbArticleSheet article={editing} open={open} onOpenChange={setOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="z-[1200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette fiche ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.title} » sera retirée de la base de connaissance. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) remove.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KbFiches;
