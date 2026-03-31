import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ArrowLeft, Search, Plus, Pencil, Trash2, ExternalLink, Save, X, Sparkles, Check, XCircle, CheckCheck, Loader2, ArrowUpDown, Eye, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

type Citation = {
  id: string;
  texte: string;
  auteur: string;
  oeuvre: string;
  url: string;
  active: boolean;
  shown_count: number;
  viewed_count: number;
};

type SuggestedCitation = {
  texte: string;
  auteur: string;
  oeuvre: string;
  url: string;
};

type ShownFilter = 'all' | 'shown' | 'not_shown';
type SortBy = 'viewed_desc' | 'viewed_asc';

const EMPTY_CITATION = { texte: '', auteur: '', oeuvre: '', url: '' };

const AdminFrequences: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_CITATION);
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_CITATION);

  // Filters & sort
  const [shownFilter, setShownFilter] = useState<ShownFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('viewed_desc');

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<SuggestedCitation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: citations = [], isLoading } = useQuery({
    queryKey: ['frequence-citations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frequence_citations')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Citation[];
    },
  });

  const filtered = useMemo(() => {
    let result = citations.filter((c) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (
          !c.texte.toLowerCase().includes(q) &&
          !c.auteur.toLowerCase().includes(q) &&
          !c.oeuvre.toLowerCase().includes(q) &&
          !(c.url || '').toLowerCase().includes(q)
        ) return false;
      }
      if (shownFilter === 'shown' && c.shown_count === 0) return false;
      if (shownFilter === 'not_shown' && c.shown_count > 0) return false;
      return true;
    });

    result.sort((a, b) =>
      sortBy === 'viewed_desc'
        ? b.viewed_count - a.viewed_count
        : a.viewed_count - b.viewed_count
    );

    return result;
  }, [citations, debouncedSearch, shownFilter, sortBy]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('frequence_citations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequence-citations'] });
      toast.success('Citation supprimée');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; texte: string; auteur: string; oeuvre: string; url: string }) => {
      const { error } = await supabase.from('frequence_citations').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequence-citations'] });
      setEditingId(null);
      toast.success('Citation mise à jour');
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_CITATION) => {
      const { error } = await supabase.from('frequence_citations').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequence-citations'] });
      setIsAdding(false);
      setNewForm(EMPTY_CITATION);
      toast.success('Citation ajoutée');
    },
  });

  const startEdit = (c: Citation) => {
    setEditingId(c.id);
    setEditForm({ texte: c.texte, auteur: c.auteur, oeuvre: c.oeuvre, url: c.url || '' });
  };

  // AI suggestion handlers
  const handleSuggest = async () => {
    setIsGenerating(true);
    setSuggestions([]);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        setIsGenerating(false);
        return;
      }

      const existingCitations = citations.map(c => ({ auteur: c.auteur, texte: c.texte }));

      const { data, error } = await supabase.functions.invoke('suggest-citations', {
        body: { existingCitations },
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('non-2xx')) {
          toast.error('Session expirée ou accès refusé. Reconnectez-vous.');
        } else {
          toast.error(msg || 'Erreur lors de la génération');
        }
        return;
      }
      if (data?.citations?.length) {
        setSuggestions(data.citations);
        toast.success(`${data.citations.length} suggestions générées`);
      } else {
        toast.info('Aucune suggestion retournée');
      }
    } catch (err: any) {
      console.error('Suggest error:', err);
      toast.error(err.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptSuggestion = async (index: number) => {
    const s = suggestions[index];
    try {
      const { error } = await supabase.from('frequence_citations').insert({
        texte: s.texte, auteur: s.auteur, oeuvre: s.oeuvre, url: s.url,
      });
      if (error) throw error;
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      queryClient.invalidateQueries({ queryKey: ['frequence-citations'] });
      toast.success(`Citation de ${s.auteur} ajoutée`);
    } catch {
      toast.error('Erreur lors de l\'insertion');
    }
  };

  const rejectSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const acceptAll = async () => {
    try {
      const rows = suggestions.map(s => ({
        texte: s.texte, auteur: s.auteur, oeuvre: s.oeuvre, url: s.url,
      }));
      const { error } = await supabase.from('frequence_citations').insert(rows);
      if (error) throw error;
      const count = suggestions.length;
      setSuggestions([]);
      queryClient.invalidateQueries({ queryKey: ['frequence-citations'] });
      toast.success(`${count} citations ajoutées`);
    } catch {
      toast.error('Erreur lors de l\'insertion groupée');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/admin/outils">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Outils
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Ma Fréquence du jour</h1>
          <p className="text-muted-foreground text-sm">Gestion des citations journalières</p>
        </div>

        {/* Header: count + search + add + AI */}
        <Card className="p-4 mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {filtered.length} citation{filtered.length !== 1 ? 's' : ''}
                  {(debouncedSearch || shownFilter !== 'all') && ` / ${citations.length} total`}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Mot contenant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSuggest}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Suggérer par IA
                </Button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Déjà montré :</span>
                <ToggleGroup
                  type="single"
                  value={shownFilter}
                  onValueChange={(v) => v && setShownFilter(v as ShownFilter)}
                  size="sm"
                >
                  <ToggleGroupItem value="all" className="text-xs h-7 px-2.5">Tous</ToggleGroupItem>
                  <ToggleGroupItem value="shown" className="text-xs h-7 px-2.5">Oui</ToggleGroupItem>
                  <ToggleGroupItem value="not_shown" className="text-xs h-7 px-2.5">Non</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Vues :</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setSortBy(prev => prev === 'viewed_desc' ? 'viewed_asc' : 'viewed_desc')}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortBy === 'viewed_desc' ? 'Décroissant' : 'Croissant'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Suggestions panel */}
        {suggestions.length > 0 && (
          <Card className="p-4 mb-4 border-amber-500/40 bg-amber-50/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-foreground">
                  {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} IA
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={acceptAll}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Tout accepter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestions([])}>
                  <X className="h-4 w-4 mr-1" />
                  Tout rejeter
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-background border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground mb-1">« {s.texte} »</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="font-medium">{s.auteur}</span>
                      <span>{s.oeuvre}</span>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                          Vérifier <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => acceptSuggestion(i)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => rejectSuggestion(i)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Add form */}
        {isAdding && (
          <Card className="p-4 mb-4 border-primary/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Auteur" value={newForm.auteur} onChange={(e) => setNewForm({ ...newForm, auteur: e.target.value })} />
              <Input placeholder="Œuvre" value={newForm.oeuvre} onChange={(e) => setNewForm({ ...newForm, oeuvre: e.target.value })} />
              <Input placeholder="URL" value={newForm.url} onChange={(e) => setNewForm({ ...newForm, url: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => insertMutation.mutate(newForm)} disabled={!newForm.texte || !newForm.auteur}>
                  <Save className="h-4 w-4 mr-1" />
                  Sauver
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewForm(EMPTY_CITATION); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input placeholder="Texte de la citation" value={newForm.texte} onChange={(e) => setNewForm({ ...newForm, texte: e.target.value })} className="mt-3" />
          </Card>
        )}

        {/* Table */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Chargement…</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Auteur</TableHead>
                  <TableHead className="w-[180px]">Œuvre</TableHead>
                  <TableHead className="w-[50px]">Lien</TableHead>
                  <TableHead>Texte</TableHead>
                  <TableHead className="w-[65px] text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Radio className="h-3 w-3" />
                      <span>Montré</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[55px] text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>Vues</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[90px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    {editingId === c.id ? (
                      <>
                        <TableCell>
                          <Input value={editForm.auteur} onChange={(e) => setEditForm({ ...editForm, auteur: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input value={editForm.oeuvre} onChange={(e) => setEditForm({ ...editForm, oeuvre: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input value={editForm.texte} onChange={(e) => setEditForm({ ...editForm, texte: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateMutation.mutate({ id: c.id, ...editForm })}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-xs font-medium">{c.auteur}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.oeuvre}</TableCell>
                        <TableCell>
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-[300px] truncate">{c.texte}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              c.shown_count > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {c.shown_count}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[28px] justify-center">
                            {c.viewed_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucune citation trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminFrequences;
