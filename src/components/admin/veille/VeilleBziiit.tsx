import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, ExternalLink, Loader2, Mail, Search, ShoppingBasket, Sparkles, Check, X, Trees, Footprints } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '@/components/admin/veille/SearchableSelect';
import { useNewsletterMutations } from '@/hooks/admin/useNewsletter';
import {
  NewsArticle, VeilleTarget, articleDate, matchArticle, norm, tagLabel,
  useDecideLink, useNewsLinks, useTogglePublish, useVeilleNews, useVeilleTargets,
} from '@/hooks/admin/useVeilleNews';

const DAY = 86_400_000;
const uid = () => Math.random().toString(36).slice(2, 10);

function countTags(rows: NewsArticle[], key: keyof NonNullable<NewsArticle['metadata']>) {
  const m = new Map<string, number>();
  rows.forEach((r) => ((r.metadata?.[key] as string[] | undefined) ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Kpi({ label, value, hint, alert }: { label: string; value: string | number; hint?: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 bg-card ${alert ? 'border-destructive/50' : 'border-border'}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function TagRanking({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = rows[0]?.[1] ?? 1;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {rows.slice(0, 6).map(([t, n]) => (
          <li key={t} className="text-xs">
            <div className="flex justify-between text-foreground"><span className="capitalize">{tagLabel(t)}</span><span className="text-muted-foreground">{n}</span></div>
            <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div>
          </li>
        ))}
        {!rows.length && <li className="text-xs text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}

function ArticleCard({ a, selected, onToggle, extra }: { a: NewsArticle; selected: boolean; onToggle: () => void; extra?: React.ReactNode }) {
  const m = a.metadata ?? {};
  const tags = [...(m.tagsThemes ?? []), ...(m.tagsMilieux ?? []), ...(m.tagsTerritoires ?? [])].slice(0, 6);
  return (
    <li className={`rounded-xl border bg-card p-3 ${selected ? 'border-primary ring-1 ring-primary/40' : 'border-border'}`}>
      <div className="flex gap-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 h-4 w-4 accent-primary" aria-label="Ajouter au panier" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{m.source}</span><span>·</span><span>{articleDate(a)}</span>
            {m.score != null && <Badge variant="outline" className="text-[10px]">score {m.score}</Badge>}
            {a.published ? <Badge className="text-[10px]">publié</Badge> : <Badge variant="secondary" className="text-[10px]">à valider</Badge>}
          </div>
          <h4 className="font-medium text-foreground leading-snug mt-0.5">{a.title}</h4>
          {a.description && <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{a.description}</p>}
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{tagLabel(t)}</span>)}
          </div>
          {extra}
        </div>
        {a.external_link && (
          <a href={a.external_link} target="_blank" rel="noreferrer" className="text-primary shrink-0" aria-label="Ouvrir l'article"><ExternalLink className="w-4 h-4" /></a>
        )}
      </div>
    </li>
  );
}

export default function VeilleBziiit() {
  const [params, setParams] = useSearchParams();
  const sub = params.get('vue') || 'tdb';
  const setSub = (v: string) => { params.set('vue', v); setParams(params, { replace: true }); };
  const { data: news = [], isLoading } = useVeilleNews();
  const [cart, setCart] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setCart((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const navigate = useNavigate();
  const { create } = useNewsletterMutations();

  const createLetter = async (ids: string[], nom: string, univers: 'tous' | 'jardin' | 'marches' = 'tous', intro?: string) => {
    const arts = news.filter((a) => ids.includes(a.id));
    if (!arts.length) return toast.info('Sélectionnez au moins un article.');
    const blocks = [
      { id: uid(), type: 'heading', text: nom, level: 1 },
      { id: uid(), type: 'text', text: intro || 'Notre sélection d\u2019actualités du vivant, choisie pour vous.' },
      ...arts.map((a) => ({ id: uid(), type: 'card', title: a.title, text: (a.description ?? '').slice(0, 280), href: a.external_link ?? undefined, cta: `Lire sur ${a.metadata?.source ?? 'la source'}` })),
    ];
    const c = await create.mutateAsync({ nom, objet: nom, univers, blocks: blocks as any, from_name: 'La Fréquence du Vivant', statut: 'brouillon' } as any);
    toast.success('Brouillon créé dans le Studio Newsletter');
    navigate(`/admin/outils/newsletter/${c.id}`);
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tdb" className="flex-1">TdB</TabsTrigger>
          <TabsTrigger value="liste" className="flex-1">Liste</TabsTrigger>
          <TabsTrigger value="relier" className="flex-1">Relier</TabsTrigger>
        </TabsList>
        <TabsContent value="tdb"><Dashboard news={news} onLetter={createLetter} /></TabsContent>
        <TabsContent value="liste"><ListView news={news} cart={cart} toggle={toggle} /></TabsContent>
        <TabsContent value="relier"><Relier news={news} cart={cart} toggle={toggle} onLetter={createLetter} /></TabsContent>
      </Tabs>

      {cart.size > 0 && (
        <div className="sticky bottom-3 z-20 flex items-center gap-2 rounded-full border border-primary/40 bg-card/95 backdrop-blur px-4 py-2 shadow-lg">
          <ShoppingBasket className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground flex-1">{cart.size} article{cart.size > 1 ? 's' : ''} dans le panier</span>
          <Button size="sm" variant="ghost" onClick={() => setCart(new Set())}>Vider</Button>
          <Button size="sm" disabled={create.isPending} onClick={() => createLetter([...cart], 'La veille du vivant')}>
            <Mail className="w-4 h-4 mr-1" /> Créer une lettre
          </Button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ news, onLetter }: { news: NewsArticle[]; onLetter: (ids: string[], nom: string, u?: any, intro?: string) => void }) {
  const now = Date.now();
  const age = (a: NewsArticle) => now - new Date(articleDate(a)).getTime();
  const last7 = news.filter((a) => age(a) < 7 * DAY);
  const last30 = news.filter((a) => age(a) < 30 * DAY);
  const scores = news.map((a) => a.metadata?.score).filter((s): s is number => typeof s === 'number');
  const avg = scores.length ? (scores.reduce((s, x) => s + x, 0) / scores.length).toFixed(1) : '—';
  const rss = news.filter((a) => a.metadata?.origine === 'rss').length;
  const lastAt = news[0] ? new Date(news[0].created_at) : null;
  const stale = !lastAt || now - lastAt.getTime() > 26 * 3600_000;

  const days = Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * DAY).toISOString().slice(0, 10));
  const perDay = days.map((d) => {
    const rows = news.filter((a) => articleDate(a) === d);
    return { d, hi: rows.filter((a) => (a.metadata?.score ?? 0) >= 8).length, lo: rows.filter((a) => (a.metadata?.score ?? 0) < 8).length };
  });
  const maxDay = Math.max(1, ...perDay.map((p) => p.hi + p.lo));
  const pepites = [...last7].sort((a, b) => (b.metadata?.score ?? 0) - (a.metadata?.score ?? 0)).slice(0, 5);
  const jardin = last30.filter((a) => (a.metadata?.tagsThemes ?? []).includes('sol_et_jardin'))
    .sort((a, b) => (b.metadata?.score ?? 0) - (a.metadata?.score ?? 0)).slice(0, 6);

  return (
    <div className="space-y-4 mt-3">
      {stale && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4" /> Aucun article reçu depuis plus de 26 h : vérifier l'envoi bziiit.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Kpi label="Articles" value={news.length} />
        <Kpi label="7 derniers jours" value={last7.length} />
        <Kpi label="30 derniers jours" value={last30.length} />
        <Kpi label="À valider / publiés" value={`${news.filter((a) => !a.published).length} / ${news.filter((a) => a.published).length}`} />
        <Kpi label="Score moyen" value={avg} hint="sur 10" />
        <Kpi label="Dernière collecte" value={lastAt ? lastAt.toLocaleDateString('fr-FR') : '—'} hint={`RSS ${rss} · Tavily ${news.length - rss}`} alert={stale} />
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="text-sm font-medium text-foreground mb-2">Arrivées par jour (30 j) <span className="text-xs text-muted-foreground">· foncé = score ≥ 8</span></h3>
        <div className="flex items-end gap-[3px] h-28">
          {perDay.map((p) => (
            <div key={p.d} className="flex-1 flex flex-col justify-end" title={`${p.d} : ${p.hi + p.lo}`}>
              <div className="bg-primary/35 rounded-t-sm" style={{ height: `${(p.lo / maxDay) * 100}%` }} />
              <div className="bg-primary" style={{ height: `${(p.hi / maxDay) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TagRanking title="Thèmes" rows={countTags(news, 'tagsThemes')} />
        <TagRanking title="Milieux" rows={countTags(news, 'tagsMilieux')} />
        <TagRanking title="Territoires" rows={countTags(news, 'tagsTerritoires')} />
        <TagRanking title="Groupes d'espèces" rows={countTags(news, 'tagsEspeces')} />
        <TagRanking title="Sources" rows={(() => { const m = new Map<string, number>(); news.forEach((a) => a.metadata?.source && m.set(a.metadata.source, (m.get(a.metadata.source) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]); })()} />
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1"><Sparkles className="w-4 h-4 text-primary" /> Pépites de la semaine</h3>
        <ol className="space-y-1 text-sm list-decimal pl-5">
          {pepites.map((a) => <li key={a.id}><a href={a.external_link ?? '#'} target="_blank" rel="noreferrer" className="text-foreground hover:underline">{a.title}</a> <span className="text-xs text-muted-foreground">· {a.metadata?.score}</span></li>)}
        </ol>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="text-sm font-medium text-foreground mb-2">Lettres prêtes à l'emploi</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="justify-start h-auto py-2 whitespace-normal text-left" disabled={!pepites.length}
            onClick={() => onLetter(pepites.map((a) => a.id), 'Revue de la semaine', 'tous', 'Les cinq actualités du vivant les plus marquantes de la semaine.')}>
            <Mail className="w-4 h-4 mr-2 shrink-0" /> Revue de la semaine · {pepites.length} articles
          </Button>
          <Button variant="outline" className="justify-start h-auto py-2 whitespace-normal text-left" disabled={!jardin.length}
            onClick={() => onLetter(jardin.map((a) => a.id), 'Spécial sol et jardin', 'jardin', 'Ce que la recherche et le terrain nous apprennent ce mois-ci sur les sols vivants et les jardins.')}>
            <Trees className="w-4 h-4 mr-2 shrink-0" /> Spécial sol et jardin → propriétaires · {jardin.length} articles
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListView({ news, cart, toggle }: { news: NewsArticle[]; cart: Set<string>; toggle: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('tous');
  const [minScore, setMinScore] = useState('0');
  const [theme, setTheme] = useState('tous');
  const [periode, setPeriode] = useState('tout');
  const pub = useTogglePublish();
  const themes = useMemo(() => countTags(news, 'tagsThemes').map(([t]) => t), [news]);
  const rows = useMemo(() => {
    const nq = norm(q.trim());
    const lim = periode === 'tout' ? Infinity : Number(periode) * DAY;
    return news.filter((a) =>
      (!nq || norm(`${a.title} ${a.description ?? ''}`).includes(nq)) &&
      (statut === 'tous' || (statut === 'publie') === a.published) &&
      (a.metadata?.score ?? 0) >= Number(minScore) &&
      (theme === 'tous' || (a.metadata?.tagsThemes ?? []).includes(theme)) &&
      Date.now() - new Date(articleDate(a)).getTime() < lim);
  }, [news, q, statut, minScore, theme, periode]);
  const selectedInView = rows.filter((r) => cart.has(r.id)).map((r) => r.id);

  return (
    <div className="space-y-3 mt-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Contient… (titre et contenu)" className="pl-9" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Select value={periode} onValueChange={setPeriode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="tout">Toute période</SelectItem><SelectItem value="7">7 jours</SelectItem><SelectItem value="30">30 jours</SelectItem><SelectItem value="90">90 jours</SelectItem>
        </SelectContent></Select>
        <Select value={statut} onValueChange={setStatut}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="tous">Tous statuts</SelectItem><SelectItem value="avalider">À valider</SelectItem><SelectItem value="publie">Publiés</SelectItem>
        </SelectContent></Select>
        <Select value={minScore} onValueChange={setMinScore}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          {['0', '6', '7', '8', '9'].map((s) => <SelectItem key={s} value={s}>{s === '0' ? 'Tout score' : `Score ≥ ${s}`}</SelectItem>)}
        </SelectContent></Select>
        <Select value={theme} onValueChange={setTheme}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="tous">Tous thèmes</SelectItem>
          {themes.map((t) => <SelectItem key={t} value={t} className="capitalize">{tagLabel(t)}</SelectItem>)}
        </SelectContent></Select>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{rows.length} article{rows.length > 1 ? 's' : ''}</span>
        {selectedInView.length > 0 && (
          <span className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => pub.mutate({ ids: selectedInView, published: true })}>Publier la sélection</Button>
            <Button size="sm" variant="ghost" onClick={() => pub.mutate({ ids: selectedInView, published: false })}>Dépublier</Button>
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {rows.slice(0, 200).map((a) => (
          <ArticleCard key={a.id} a={a} selected={cart.has(a.id)} onToggle={() => toggle(a.id)} extra={
            <button className="text-[11px] text-primary underline mt-2" onClick={() => pub.mutate({ ids: [a.id], published: !a.published })}>
              {a.published ? 'Dépublier' : 'Publier'}
            </button>} />
        ))}
      </ul>
    </div>
  );
}

function Relier({ news, cart, toggle, onLetter }: { news: NewsArticle[]; cart: Set<string>; toggle: (id: string) => void; onLetter: (ids: string[], nom: string, u?: any, intro?: string) => void }) {
  const { data: targets = [], isLoading } = useVeilleTargets();
  const { data: links = [] } = useNewsLinks();
  const decide = useDecideLink();
  const [mode, setMode] = useState<'destination' | 'article'>('destination');
  const [targetId, setTargetId] = useState<string>('');
  const [articleId, setArticleId] = useState<string>('');
  const recent = useMemo(() => news.filter((a) => Date.now() - new Date(articleDate(a)).getTime() < 60 * DAY), [news]);
  const status = (n: string, t: VeilleTarget) => links.find((l) => l.news_id === n && l.target_id === t.id)?.statut;

  const Decision = ({ a, t, score, raisons }: { a: NewsArticle; t: VeilleTarget; score: number; raisons: string[] }) => {
    const s = status(a.id, t);
    const send = (statut: 'valide' | 'ecarte') => decide.mutate({ news_id: a.id, target_type: t.type, target_id: t.id, score, raisons, statut });
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <Badge variant="outline" className="text-[10px]">pertinence {score}</Badge>
        {raisons.map((r) => <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{r}</span>)}
        <span className="flex-1" />
        <Button size="sm" variant={s === 'valide' ? 'default' : 'outline'} className="h-7 px-2" onClick={() => send('valide')}><Check className="w-3 h-3 mr-1" />Lier</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => send('ecarte')}><X className="w-3 h-3 mr-1" />Écarter</Button>
      </div>
    );
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-3" />;
  const target = targets.find((t) => t.id === targetId);
  const article = news.find((a) => a.id === articleId);

  const forTarget = target ? recent.map((a) => ({ a, ...matchArticle(a, target) }))
    .filter((x) => x.score >= 20 && status(x.a.id, target) !== 'ecarte').sort((x, y) => y.score - x.score).slice(0, 15) : [];
  const forArticle = article ? targets.map((t) => ({ t, ...matchArticle(article, t) }))
    .filter((x) => x.score >= 20 && status(article.id, x.t) !== 'ecarte').sort((x, y) => y.score - x.score).slice(0, 20) : [];

  return (
    <div className="space-y-3 mt-3">
      <p className="text-xs text-muted-foreground">Rapprochement par territoire, ville citée, thèmes et milieux, pondéré par le score de veille. Chaque lien est expliqué ; validez ou écartez-le (mémorisé).</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={mode === 'destination' ? 'default' : 'outline'} onClick={() => setMode('destination')}>Par jardin / exploration</Button>
        <Button variant={mode === 'article' ? 'default' : 'outline'} onClick={() => setMode('article')}>Par article</Button>
      </div>

      {mode === 'destination' ? (
        <>
          <SearchableSelect
            options={targets.map((t) => ({
              id: t.id, label: t.nom, sub: t.sousTitre,
              icon: t.type === 'propriete' ? <Trees className="w-4 h-4 text-primary" /> : <Footprints className="w-4 h-4 text-primary" />,
            }))}
            value={targetId}
            onChange={setTargetId}
            placeholder="Choisir un jardin ou une exploration"
            searchPlaceholder="Nom ou commune…"
            emptyLabel="Aucun jardin ni exploration"
            title="Jardin ou exploration"
          />
          {target && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">La revue de presse de « {target.nom} » · {forTarget.length}</h3>
                <Button size="sm" variant="outline" disabled={!forTarget.length}
                  onClick={() => onLetter(forTarget.slice(0, 5).map((x) => x.a.id), `Les nouvelles du vivant autour de ${target.nom}`,
                    target.type === 'propriete' ? 'jardin' : 'marches', `Une sélection d'actualités qui concernent directement ${target.nom} et son territoire.`)}>
                  <Mail className="w-4 h-4 mr-1" /> Lettre dédiée
                </Button>
              </div>
              {!forTarget.length && <p className="text-sm text-muted-foreground">Aucun article pertinent sur les 60 derniers jours.</p>}
              <ul className="space-y-2">
                {forTarget.map((x) => (
                  <ArticleCard key={x.a.id} a={x.a} selected={cart.has(x.a.id)} onToggle={() => toggle(x.a.id)}
                    extra={<Decision a={x.a} t={target} score={x.score} raisons={x.raisons} />} />
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <>
          <SearchableSelect
            options={recent.map((a) => ({ id: a.id, label: a.title, sub: `${a.metadata?.source ?? ''} · ${articleDate(a)}` }))}
            value={articleId}
            onChange={setArticleId}
            placeholder="Choisir un article récent"
            searchPlaceholder="Le titre contient…"
            emptyLabel="Aucun article récent"
            title="Article récent"
          />
          {article && (
            <>
              <h3 className="text-sm font-medium text-foreground">
                Cet article concerne {forArticle.filter((x) => x.t.type === 'propriete').length} jardin(s) et {forArticle.filter((x) => x.t.type === 'exploration').length} exploration(s)
              </h3>
              <ul className="space-y-2">
                {forArticle.map((x) => (
                  <li key={x.t.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      {x.t.type === 'propriete' ? <Trees className="w-4 h-4 text-primary" /> : <Footprints className="w-4 h-4 text-primary" />}
                      <span className="font-medium">{x.t.nom}</span><span className="text-xs text-muted-foreground">{x.t.sousTitre}</span>
                    </div>
                    <Decision a={article} t={x.t} score={x.score} raisons={x.raisons} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
