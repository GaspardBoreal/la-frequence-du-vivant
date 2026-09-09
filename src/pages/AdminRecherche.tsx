import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2, Search as SearchIcon, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  groupByUnivers, searchPages, UNIVERS_META, UNIVERS_ORDER,
  type SitePage, type SiteSearchRule, type UniversKey,
} from '@/lib/search/siteSearch';

const UNIVERS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Automatique (règles)' },
  ...UNIVERS_ORDER.map(u => ({ value: u, label: UNIVERS_META[u].label })),
];

function useCatalogue() {
  return useQuery({
    queryKey: ['admin-site-search'],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from('site_pages' as any).select('*').order('priority', { ascending: false }),
        supabase.from('site_search_rules' as any).select('*').order('position', { ascending: true }),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      return {
        pages: ((p.data ?? []) as any[]).map(x => ({ ...x, keywords: x.keywords ?? [] })) as SitePage[],
        rules: (r.data ?? []) as unknown as SiteSearchRule[],
      };
    },
  });
}

const AdminRecherche: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useCatalogue();
  const pages = data?.pages ?? [];
  const rules = data?.rules ?? [];
  const [test, setTest] = useState('');

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-site-search'] });
    qc.invalidateQueries({ queryKey: ['site-pages'] });
  };

  const savePage = async (page: SitePage) => {
    const { id, ...rest } = page;
    const payload = { ...rest, univers: rest.univers || null, subtitle: rest.subtitle || null };
    const { error } = id.startsWith('new-')
      ? await supabase.from('site_pages' as any).insert(payload as any)
      : await supabase.from('site_pages' as any).update(payload as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Page enregistrée');
    refresh();
  };

  const deletePage = async (id: string) => {
    if (id.startsWith('new-')) { refresh(); return; }
    const { error } = await supabase.from('site_pages' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Page retirée du catalogue');
    refresh();
  };

  const saveRule = async (rule: SiteSearchRule) => {
    const { id, ...rest } = rule;
    const { error } = id.startsWith('new-')
      ? await supabase.from('site_search_rules' as any).insert(rest as any)
      : await supabase.from('site_search_rules' as any).update(rest as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Règle enregistrée');
    refresh();
  };

  const deleteRule = async (id: string) => {
    if (id.startsWith('new-')) { refresh(); return; }
    const { error } = await supabase.from('site_search_rules' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Règle supprimée');
    refresh();
  };

  const preview = useMemo(
    () => groupByUnivers(searchPages(pages, rules, test)),
    [pages, rules, test],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin/outils"><ArrowLeft className="mr-1 h-4 w-4" /> Outils</Link>
        </Button>

        <h1 className="text-2xl font-semibold text-foreground">Moteur de recherche du site</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Le catalogue des pages publiques et les règles qui les classent dans les cinq univers.
          Chaque modification est visible immédiatement pour les visiteurs.
        </p>

        <Tabs defaultValue="pages" className="mt-6">
          <TabsList>
            <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
            <TabsTrigger value="regles">Règles ({rules.length})</TabsTrigger>
            <TabsTrigger value="apercu">Aperçu visiteur</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {pages.map(page => (
              <PageRow key={page.id} page={page} onSave={savePage} onDelete={deletePage} />
            ))}
            <PageRow
              key="new"
              page={{
                id: `new-${Date.now()}`, path: '', title: '', subtitle: '', univers: '',
                keywords: [], priority: 50, featured: false, is_active: true,
              }}
              isNew
              onSave={savePage}
              onDelete={deletePage}
            />
          </TabsContent>

          <TabsContent value="regles" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Les règles s'appliquent de haut en bas aux pages dont l'univers est « Automatique ».
              La première qui correspond gagne ; sinon la page rejoint « La Fréquence du Vivant ».
            </p>
            {rules.map(rule => (
              <RuleRow key={rule.id} rule={rule} onSave={saveRule} onDelete={deleteRule} />
            ))}
            <RuleRow
              key="new"
              rule={{
                id: `new-${Date.now()}`, position: (rules.at(-1)?.position ?? 0) + 10,
                match_type: 'keyword', pattern: '', univers: 'vivant', is_active: true, note: '',
              }}
              isNew
              onSave={saveRule}
              onDelete={deleteRule}
            />
          </TabsContent>

          <TabsContent value="apercu" className="mt-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input value={test} onChange={e => setTest(e.target.value)} placeholder="Tapez comme un visiteur…" />
              </div>
              <div className="mt-4 space-y-4">
                {preview.length === 0 && <p className="text-sm text-muted-foreground">Aucun résultat.</p>}
                {preview.map(g => (
                  <div key={g.univers}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {UNIVERS_META[g.univers].label}
                    </p>
                    <ul className="space-y-1">
                      {g.items.map(p => (
                        <li key={p.id} className="rounded-md border border-border px-3 py-2 text-sm">
                          <span className="font-medium text-foreground">{p.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{p.path}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const PageRow: React.FC<{
  page: SitePage; isNew?: boolean;
  onSave: (p: SitePage) => void; onDelete: (id: string) => void;
}> = ({ page, isNew, onSave, onDelete }) => {
  const [draft, setDraft] = useState<SitePage>(page);
  React.useEffect(() => setDraft(page), [page]);

  return (
    <Card className={isNew ? 'border-dashed p-4' : 'p-4'}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          Titre
          <Input className="mt-1" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <label className="text-xs text-muted-foreground">
          Adresse
          <Input className="mt-1" value={draft.path} placeholder="/marches-du-vivant" onChange={e => setDraft({ ...draft, path: e.target.value })} />
        </label>
        <label className="text-xs text-muted-foreground md:col-span-2">
          Sous-titre
          <Input className="mt-1" value={draft.subtitle ?? ''} onChange={e => setDraft({ ...draft, subtitle: e.target.value })} />
        </label>
        <label className="text-xs text-muted-foreground">
          Mots-clés (séparés par des virgules)
          <Input
            className="mt-1"
            value={draft.keywords.join(', ')}
            onChange={e => setDraft({ ...draft, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">
            Univers
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={draft.univers ?? ''}
              onChange={e => setDraft({ ...draft, univers: e.target.value })}
            >
              {UNIVERS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Priorité
            <Input
              className="mt-1" type="number" value={draft.priority}
              onChange={e => setDraft({ ...draft, priority: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={draft.featured} onCheckedChange={v => setDraft({ ...draft, featured: v })} /> Mise en avant
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={draft.is_active} onCheckedChange={v => setDraft({ ...draft, is_active: v })} /> Visible
        </label>
        <div className="ml-auto flex gap-2">
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(draft.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Retirer
            </Button>
          )}
          <Button size="sm" disabled={!draft.title || !draft.path} onClick={() => onSave(draft)}>
            {isNew ? <><Plus className="mr-1 h-4 w-4" /> Ajouter</> : <><Save className="mr-1 h-4 w-4" /> Enregistrer</>}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const RuleRow: React.FC<{
  rule: SiteSearchRule; isNew?: boolean;
  onSave: (r: SiteSearchRule) => void; onDelete: (id: string) => void;
}> = ({ rule, isNew, onSave, onDelete }) => {
  const [draft, setDraft] = useState<SiteSearchRule>(rule);
  React.useEffect(() => setDraft(rule), [rule]);

  return (
    <Card className={isNew ? 'border-dashed p-3' : 'p-3'}>
      <div className="flex flex-wrap items-end gap-3">
        <GripVertical className="mb-2 hidden h-4 w-4 text-muted-foreground md:block" />
        <label className="text-xs text-muted-foreground">
          Ordre
          <Input className="mt-1 w-20" type="number" value={draft.position}
            onChange={e => setDraft({ ...draft, position: Number(e.target.value) || 0 })} />
        </label>
        <label className="text-xs text-muted-foreground">
          Test
          <select
            className="mt-1 h-10 rounded-md border border-input bg-background px-2 text-sm"
            value={draft.match_type}
            onChange={e => setDraft({ ...draft, match_type: e.target.value })}
          >
            <option value="path_prefix">L'adresse commence par</option>
            <option value="keyword">Le texte contient</option>
          </select>
        </label>
        <label className="min-w-[180px] flex-1 text-xs text-muted-foreground">
          Motif
          <Input className="mt-1" value={draft.pattern} onChange={e => setDraft({ ...draft, pattern: e.target.value })} />
        </label>
        <label className="text-xs text-muted-foreground">
          Univers
          <select
            className="mt-1 h-10 rounded-md border border-input bg-background px-2 text-sm"
            value={draft.univers}
            onChange={e => setDraft({ ...draft, univers: e.target.value as UniversKey })}
          >
            {UNIVERS_ORDER.map(u => <option key={u} value={u}>{UNIVERS_META[u].label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
          <Switch checked={draft.is_active} onCheckedChange={v => setDraft({ ...draft, is_active: v })} /> Active
        </label>
        <div className="ml-auto flex gap-2 pb-1">
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(draft.id)}><Trash2 className="h-4 w-4" /></Button>
          )}
          <Button size="sm" disabled={!draft.pattern} onClick={() => onSave(draft)}>
            {isNew ? 'Ajouter' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AdminRecherche;
