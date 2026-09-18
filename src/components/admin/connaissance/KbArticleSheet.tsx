import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import {
  useAddKbSource,
  useDeleteKbSource,
  useSaveKbArticle,
  type KbArticle,
  type KbStatus,
} from '@/hooks/admin/useKnowledge';
import { AUDIENCES, AUDIENCE_LABEL, type KbAudience } from '@/lib/knowledge/seed';

interface Props {
  article: KbArticle | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const STATUTS: Array<{ v: KbStatus; label: string }> = [
  { v: 'brouillon', label: 'Brouillon' },
  { v: 'relecture', label: 'À relire' },
  { v: 'publiee', label: 'Publiée' },
];

const KbArticleSheet: React.FC<Props> = ({ article, open, onOpenChange }) => {
  const save = useSaveKbArticle();
  const addSource = useAddKbSource();
  const delSource = useDeleteKbSource();

  const [form, setForm] = React.useState({
    title: '',
    question_principale: '',
    short_answer: '',
    body_md: '',
    topic: '',
    audiences: ['jardinier'] as KbAudience[],
    status: 'brouillon' as KbStatus,
    is_public: false,
  });
  const [srcName, setSrcName] = React.useState('');
  const [srcUrl, setSrcUrl] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setForm({
      title: article?.title ?? '',
      question_principale: article?.question_principale ?? '',
      short_answer: article?.short_answer ?? '',
      body_md: article?.body_md ?? '',
      topic: article?.topic ?? '',
      audiences: (article?.audiences as KbAudience[]) ?? ['jardinier'],
      status: article?.status ?? 'brouillon',
      is_public: article?.is_public ?? false,
    });
    setSrcName('');
    setSrcUrl('');
  }, [open, article]);

  const sources = article?.kb_article_sources ?? [];
  const canPublish = sources.length > 0 && form.short_answer.trim().length > 0;

  const toggleAudience = (a: KbAudience) =>
    setForm((f) => ({
      ...f,
      audiences: f.audiences.includes(a) ? f.audiences.filter((x) => x !== a) : [...f.audiences, a],
    }));

  const submit = async () => {
    if (!form.title.trim()) return;
    await save.mutateAsync({ id: article?.id, univers: 'jardin', ...form } as any);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="z-[1200] flex w-full max-w-2xl flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{article ? 'Modifier la fiche' : 'Nouvelle fiche'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Question couverte</Label>
            <Input
              value={form.question_principale}
              onChange={(e) => setForm({ ...form, question_principale: e.target.value })}
              placeholder="Comment savoir si mon sol est argileux ?"
            />
          </div>

          <div className="space-y-2">
            <Label>Réponse courte — celle que cite l’Assistant</Label>
            <Textarea
              rows={3}
              value={form.short_answer}
              onChange={(e) => setForm({ ...form, short_answer: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Réponse détaillée</Label>
            <Textarea
              rows={10}
              value={form.body_md}
              onChange={(e) => setForm({ ...form, body_md: e.target.value })}
              className="font-mono text-xs"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Thème</Label>
              <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex flex-wrap gap-2">
                {STATUTS.map((s) => (
                  <Button
                    key={s.v}
                    type="button"
                    size="sm"
                    variant={form.status === s.v ? 'default' : 'outline'}
                    disabled={s.v === 'publiee' && !canPublish}
                    onClick={() => setForm({ ...form, status: s.v })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              {!canPublish && (
                <p className="text-xs text-muted-foreground">
                  Publication possible seulement avec une source citée et une réponse courte.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Publics visés</Label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <Badge
                  key={a}
                  onClick={() => toggleAudience(a)}
                  variant={form.audiences.includes(a) ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {AUDIENCE_LABEL[a]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Visible par les visiteurs</p>
              <p className="text-xs text-muted-foreground">Une fois publiée, la fiche pourra être affichée en public.</p>
            </div>
            <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
          </div>

          {article && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Sources citées ({sources.length})</p>
              {sources.map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-md bg-muted/40 p-2">
                  <div className="flex-1">
                    <p className="text-xs">{s.name}</p>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary">
                        {s.url} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <p className="text-[11px] text-muted-foreground">Consultée le {new Date(s.consulted_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => delSource.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input placeholder="Nom de la source" value={srcName} onChange={(e) => setSrcName(e.target.value)} />
                <Input placeholder="Lien (facultatif)" value={srcUrl} onChange={(e) => setSrcUrl(e.target.value)} />
                <Button
                  variant="outline"
                  disabled={!srcName.trim()}
                  onClick={() => {
                    addSource.mutate({ article_id: article.id, name: srcName.trim(), url: srcUrl.trim() || undefined });
                    setSrcName('');
                    setSrcUrl('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {!article && (
            <p className="text-xs text-muted-foreground">
              Enregistrez la fiche pour pouvoir lui ajouter ses sources.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t bg-background p-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={submit} disabled={save.isPending || !form.title.trim()}>
            {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KbArticleSheet;
