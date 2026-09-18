import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Sparkles, Link2 } from 'lucide-react';
import {
  useKbQuestions,
  useSaveKbQuestion,
  useDeleteKbQuestion,
  useAssistantQuestionSuggestions,
  useKbArticles,
  useLinkQuestionArticle,
} from '@/hooks/admin/useKnowledge';
import { AUDIENCES, AUDIENCE_LABEL, type KbAudience } from '@/lib/knowledge/seed';

const KbQuestions: React.FC = () => {
  const { data: questions = [], isLoading } = useKbQuestions();
  const { data: suggestions = [] } = useAssistantQuestionSuggestions();
  const { data: articles = [] } = useKbArticles();
  const save = useSaveKbQuestion();
  const remove = useDeleteKbQuestion();
  const link = useLinkQuestionArticle();

  const [label, setLabel] = React.useState('');
  const [audience, setAudience] = React.useState<KbAudience>('jardinier');
  const [linking, setLinking] = React.useState<string | null>(null);
  const [needle, setNeedle] = React.useState('');

  const ajouter = (l: string, a: KbAudience = 'jardinier', origin: 'fournie' | 'assistant' = 'fournie') => {
    if (!l.trim()) return;
    save.mutate({ label: l.trim(), audience: a, univers: 'jardin', origin, status: 'ouverte' } as any);
  };

  const matches = React.useMemo(() => {
    const n = needle.trim().toLowerCase();
    return articles.filter((a) => (n ? a.title.toLowerCase().includes(n) : true)).slice(0, 8);
  }, [articles, needle]);

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-4">
        <p className="text-sm font-medium">Ajouter une question réellement posée</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Quand dois-je arroser mes jeunes arbres ?" />
          <div className="flex gap-2">
            {AUDIENCES.map((a) => (
              <Badge key={a} variant={audience === a ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setAudience(a)}>
                {AUDIENCE_LABEL[a]}
              </Badge>
            ))}
          </div>
          <Button
            onClick={() => {
              ajouter(label, audience);
              setLabel('');
            }}
            disabled={!label.trim()}
          >
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </Card>

      {suggestions.length > 0 && (
        <Card className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Questions repérées dans les échanges avec l’Assistant</p>
          </div>
          <p className="text-xs text-muted-foreground">Rien n’est ajouté automatiquement : vous validez question par question.</p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-md bg-muted/40 p-2">
                <p className="flex-1 text-xs">{s.label}</p>
                <Badge variant="outline">{s.occurrences}×</Badge>
                <Button size="sm" variant="outline" onClick={() => ajouter(s.label, 'jardinier', 'assistant')}>
                  Retenir
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Chargement du registre…</p>}

      <div className="space-y-2">
        {questions.map((q) => {
          const liens = q.kb_question_articles ?? [];
          return (
            <Card key={q.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex-1 text-sm font-medium">{q.label}</span>
                <Badge variant="outline">{AUDIENCE_LABEL[q.audience] ?? q.audience}</Badge>
                <Badge variant={q.status === 'couverte' ? 'default' : 'secondary'}>
                  {q.status === 'couverte' ? 'Couverte' : q.status === 'ignoree' ? 'Écartée' : 'Ouverte'}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setLinking(linking === q.id ? null : q.id)}>
                  <Link2 className="mr-1 h-4 w-4" /> Rattacher
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => save.mutate({ id: q.id, status: q.status === 'ignoree' ? 'ouverte' : 'ignoree' } as any)}
                >
                  {q.status === 'ignoree' ? 'Rouvrir' : 'Écarter'}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {liens.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {liens.length} fiche(s) rattachée(s) :{' '}
                  {liens
                    .map((l) => articles.find((a) => a.id === l.article_id)?.title ?? '—')
                    .join(' · ')}
                </p>
              )}

              {linking === q.id && (
                <div className="mt-3 space-y-2 rounded-md border p-3">
                  <Input value={needle} onChange={(e) => setNeedle(e.target.value)} placeholder="Chercher une fiche…" />
                  {matches.map((a) => {
                    const already = liens.some((l) => l.article_id === a.id);
                    return (
                      <div key={a.id} className="flex items-center gap-2">
                        <span className="flex-1 text-xs">{a.title}</span>
                        <Button
                          size="sm"
                          variant={already ? 'secondary' : 'outline'}
                          onClick={() => link.mutate({ question_id: q.id, article_id: a.id, link: !already })}
                        >
                          {already ? 'Retirer' : 'Rattacher'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default KbQuestions;
