import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, Trees, MapPin, Building2, Users, CalendarDays, Star,
} from 'lucide-react';
import { toast } from 'sonner';

type Propriete = {
  id: string;
  nom: string;
  slug: string | null;
  description: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  departement: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  surface_hectares: number | null;
  photo_hero_url: string | null;
  owner_company_id: string | null;
  main_walker_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type MarcheurLite = { id: string; prenom: string | null; nom: string | null; ville: string | null };
type CompanyLite = { id: string; denomination: string | null; nom_complet: string | null; ville: string | null };
type MarcheEventLite = { id: string; title: string | null; date_marche: string | null };
type LinkedMarcheur = { id: string; community_profile_id: string; role: 'proprietaire' | 'prestataire' | 'marcheur_historique'; is_main: boolean };
type LinkedCompany = { id: string; company_id: string; role: 'gestionnaire' | 'prestataire' | 'lecture' };
type LinkedEvent = { id: string; marche_event_id: string };

const sb = supabase as any;

const EMPTY_FORM: Partial<Propriete> = {
  nom: '', description: '', adresse: '', ville: '', code_postal: '',
  departement: '', region: '', latitude: null, longitude: null,
  surface_hectares: null, photo_hero_url: '', owner_company_id: null,
  main_walker_id: null, is_active: true,
};

const AdminProprietes: React.FC = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Propriete | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Propriete>>(EMPTY_FORM);

  const { data: proprietes = [], isLoading } = useQuery({
    queryKey: ['admin-proprietes'],
    queryFn: async () => {
      const { data, error } = await sb.from('proprietes').select('*').order('nom');
      if (error) throw error;
      return data as Propriete[];
    },
  });

  const { data: marcheurs = [] } = useQuery({
    queryKey: ['admin-proprietes-marcheurs'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('community_profiles')
        .select('id, prenom, nom, ville')
        .not('user_id', 'is', null)
        .order('prenom', { ascending: true })
        .limit(2000);
      if (error) throw error;
      return data as MarcheurLite[];
    },
  });

  const [marcheurSearch, setMarcheurSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const { data: companies = [] } = useQuery({
    queryKey: ['admin-proprietes-companies'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('crm_companies')
        .select('id, denomination, nom_complet, ville')
        .order('denomination')
        .limit(2000);
      if (error) throw error;
      return data as CompanyLite[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-proprietes-events'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('marche_events')
        .select('id, title, date_marche')
        .order('date_marche', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as MarcheEventLite[];
    },
  });

  const [eventSearch, setEventSearch] = useState('');

  const activeId = editing?.id;

  const { data: linkedMarcheurs = [] } = useQuery({
    queryKey: ['propriete-marcheurs', activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_marcheurs')
        .select('id, community_profile_id, role, is_main')
        .eq('propriete_id', activeId);
      if (error) throw error;
      return data as LinkedMarcheur[];
    },
  });

  const { data: linkedCompanies = [] } = useQuery({
    queryKey: ['propriete-companies', activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_companies')
        .select('id, company_id, role')
        .eq('propriete_id', activeId);
      if (error) throw error;
      return data as LinkedCompany[];
    },
  });

  const { data: linkedEvents = [] } = useQuery({
    queryKey: ['propriete-events', activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_marche_events')
        .select('id, marche_event_id')
        .eq('propriete_id', activeId);
      if (error) throw error;
      return data as LinkedEvent[];
    },
  });

  const marcheurById = useMemo(() => Object.fromEntries(marcheurs.map(m => [m.id, m])), [marcheurs]);
  const companyById = useMemo(() => Object.fromEntries(companies.map(c => [c.id, c])), [companies]);
  const eventById = useMemo(() => Object.fromEntries(events.map(e => [e.id, e])), [events]);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setCreating(true);
  };

  const startEdit = (p: Propriete) => {
    setForm(p);
    setEditing(p);
    setCreating(false);
  };

  const closeSheet = () => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_FORM);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nom?.trim()) throw new Error('Le nom est obligatoire');
      const payload: any = {
        nom: form.nom?.trim(),
        description: form.description || null,
        adresse: form.adresse || null,
        ville: form.ville || null,
        code_postal: form.code_postal || null,
        departement: form.departement || null,
        region: form.region || null,
        latitude: form.latitude ?? null,
        longitude: form.longitude ?? null,
        surface_hectares: form.surface_hectares ?? null,
        photo_hero_url: form.photo_hero_url || null,
        owner_company_id: form.owner_company_id || null,
        main_walker_id: form.main_walker_id || null,
        is_active: form.is_active ?? true,
      };
      if (editing?.id) {
        const { data, error } = await sb.from('proprietes').update(payload).eq('id', editing.id).select().single();
        if (error) throw error;
        return data as Propriete;
      } else {
        const { data, error } = await sb.from('proprietes').insert(payload).select().single();
        if (error) throw error;
        return data as Propriete;
      }
    },
    onSuccess: (data) => {
      toast.success(editing ? 'Propriété mise à jour' : 'Propriété créée');
      qc.invalidateQueries({ queryKey: ['admin-proprietes'] });
      qc.invalidateQueries({ queryKey: ['propriete-marcheurs', data.id] });
      setEditing(data);
      setCreating(false);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec de la sauvegarde'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('proprietes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Propriété supprimée');
      qc.invalidateQueries({ queryKey: ['admin-proprietes'] });
      closeSheet();
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec de la suppression'),
  });

  // Marcheurs liés
  const addMarcheur = useMutation({
    mutationFn: async ({ community_profile_id, role }: { community_profile_id: string; role: LinkedMarcheur['role'] }) => {
      const { error } = await sb.from('propriete_marcheurs').insert({
        propriete_id: activeId, community_profile_id, role, is_main: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-marcheurs', activeId] }),
    onError: (e: any) => toast.error(e?.message ?? 'Échec ajout marcheur'),
  });
  const removeMarcheur = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('propriete_marcheurs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-marcheurs', activeId] }),
  });
  const setMainMarcheur = useMutation({
    mutationFn: async (link: LinkedMarcheur) => {
      // clear previous main for this marcheur
      await sb.from('propriete_marcheurs')
        .update({ is_main: false })
        .eq('community_profile_id', link.community_profile_id);
      const { error } = await sb.from('propriete_marcheurs').update({ is_main: true }).eq('id', link.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Propriété principale définie');
      qc.invalidateQueries({ queryKey: ['propriete-marcheurs', activeId] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec'),
  });

  // Entreprises liées
  const addCompany = useMutation({
    mutationFn: async ({ company_id, role }: { company_id: string; role: LinkedCompany['role'] }) => {
      const { error } = await sb.from('propriete_companies').insert({
        propriete_id: activeId, company_id, role,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-companies', activeId] }),
    onError: (e: any) => toast.error(e?.message ?? 'Échec ajout entreprise'),
  });
  const removeCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('propriete_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-companies', activeId] }),
  });

  // Événements liés
  const addEvent = useMutation({
    mutationFn: async (marche_event_id: string) => {
      const { error } = await sb.from('propriete_marche_events').insert({
        propriete_id: activeId, marche_event_id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-events', activeId] }),
    onError: (e: any) => toast.error(e?.message ?? 'Échec ajout événement'),
  });
  const removeEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('propriete_marche_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-events', activeId] }),
  });

  const [marcheurToAdd, setMarcheurToAdd] = useState<string>('');
  const [marcheurRoleToAdd, setMarcheurRoleToAdd] = useState<LinkedMarcheur['role']>('proprietaire');
  const [companyToAdd, setCompanyToAdd] = useState<string>('');
  const [companyRoleToAdd, setCompanyRoleToAdd] = useState<LinkedCompany['role']>('gestionnaire');
  const [eventToAdd, setEventToAdd] = useState<string>('');

  const sheetOpen = !!editing || creating;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Retour Admin</Button>
          </Link>
          <Button onClick={startCreate}><Plus className="h-4 w-4 mr-2" />Nouvelle propriété</Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Trees className="h-8 w-8 text-emerald-600" />
            Propriétés
          </h1>
          <p className="text-muted-foreground mt-2 text-center">
            Jardins, Vignobles, Exploitations regroupant plusieurs événements Marches du Vivant
          </p>
        </div>

        <Card className="p-4">
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Chargement…</p>
          ) : proprietes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Trees className="h-12 w-12 mx-auto mb-3 opacity-40" />
              Aucune propriété. Créez la première.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Surface</TableHead>
                  <TableHead>Entreprise propriétaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {proprietes.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => startEdit(p)}>
                    <TableCell className="font-medium">{p.nom}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[p.ville, p.code_postal].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="text-sm">{p.surface_hectares ? `${p.surface_hectares} ha` : '—'}</TableCell>
                    <TableCell className="text-sm">{p.owner_company_id ? (companyById[p.owner_company_id]?.denomination ?? '—') : '—'}</TableCell>
                    <TableCell>
                      {p.is_active
                        ? <Badge variant="outline" className="border-emerald-500 text-emerald-700">Active</Badge>
                        : <Badge variant="outline">Archivée</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); startEdit(p); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Trees className="h-5 w-5 text-emerald-600" />
              {editing ? editing.nom : 'Nouvelle propriété'}
            </SheetTitle>
            <SheetDescription>
              {editing?.slug ? <span className="font-mono text-xs">/{editing.slug}</span> : 'Renseignez les informations essentielles du lieu.'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Identité */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identité</h3>
              <div>
                <Label>Nom *</Label>
                <Input value={form.nom ?? ''} onChange={(e) => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={form.description ?? ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Photo hero (URL)</Label>
                <Input value={form.photo_hero_url ?? ''} onChange={(e) => setForm(f => ({ ...f, photo_hero_url: e.target.value }))} placeholder="https://…" />
              </div>
            </section>

            {/* Localisation */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />Localisation
              </h3>
              <div>
                <Label>Adresse</Label>
                <Input value={form.adresse ?? ''} onChange={(e) => setForm(f => ({ ...f, adresse: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code postal</Label><Input value={form.code_postal ?? ''} onChange={(e) => setForm(f => ({ ...f, code_postal: e.target.value }))} /></div>
                <div><Label>Ville</Label><Input value={form.ville ?? ''} onChange={(e) => setForm(f => ({ ...f, ville: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Département</Label><Input value={form.departement ?? ''} onChange={(e) => setForm(f => ({ ...f, departement: e.target.value }))} /></div>
                <div><Label>Région</Label><Input value={form.region ?? ''} onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="0.000001" value={form.latitude ?? ''} onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="0.000001" value={form.longitude ?? ''} onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Surface (ha)</Label>
                  <Input type="number" step="0.001" value={form.surface_hectares ?? ''} onChange={(e) => setForm(f => ({ ...f, surface_hectares: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
              </div>
            </section>

            {/* Rattachements clés */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Rattachements principaux</h3>
              <div>
                <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" />Entreprise propriétaire</Label>
                <Select
                  value={form.owner_company_id ?? '__none__'}
                  onValueChange={(v) => setForm(f => ({ ...f, owner_company_id: v === '__none__' ? null : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                      <Input
                        autoFocus
                        placeholder="Rechercher…"
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                    <SelectItem value="__none__">— aucune —</SelectItem>
                    {companies
                      .filter(c => {
                        if (!companySearch.trim()) return true;
                        const q = norm(companySearch);
                        return norm(`${c.denomination ?? ''} ${c.nom_complet ?? ''} ${c.ville ?? ''}`).includes(q);
                      })
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.denomination ?? c.nom_complet ?? '(sans nom)'}{c.ville ? ` · ${c.ville}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Marcheur référent</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Le marcheur référent obtient automatiquement l’accès à l’espace Propriété et peut le choisir après connexion.
                </p>
                <Select
                  value={form.main_walker_id ?? '__none__'}
                  onValueChange={(v) => setForm(f => ({ ...f, main_walker_id: v === '__none__' ? null : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                      <Input
                        autoFocus
                        placeholder="Rechercher…"
                        value={marcheurSearch}
                        onChange={(e) => setMarcheurSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                    <SelectItem value="__none__">— aucun —</SelectItem>
                    {marcheurs
                      .filter(m => {
                        if (!marcheurSearch.trim()) return true;
                        const q = norm(marcheurSearch);
                        return norm(`${m.prenom ?? ''} ${m.nom ?? ''} ${m.ville ?? ''}`).includes(q);
                      })
                      .map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.prenom ?? ''} {m.nom ?? ''}{m.ville ? ` · ${m.ville}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {editing ? 'Enregistrer' : 'Créer la propriété'}
              </Button>
              {editing && (
                <Button variant="destructive" onClick={() => {
                  if (confirm(`Supprimer la propriété "${editing.nom}" ?`)) deleteMutation.mutate(editing.id);
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                </Button>
              )}
            </div>

            {/* Sections liaisons — visibles seulement après création */}
            {editing && (
              <>
                {/* Marcheurs rattachés */}
                <section className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />Marcheurs rattachés
                  </h3>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs">Marcheur</Label>
                      <Select value={marcheurToAdd} onValueChange={setMarcheurToAdd}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                        <SelectContent className="max-h-80">
                          <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                            <Input
                              autoFocus
                              placeholder="Rechercher…"
                              value={marcheurSearch}
                              onChange={(e) => setMarcheurSearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-8"
                            />
                          </div>
                          {marcheurs
                            .filter(m => !linkedMarcheurs.some(l => l.community_profile_id === m.id))
                            .filter(m => {
                              if (!marcheurSearch.trim()) return true;
                              const q = norm(marcheurSearch);
                              return norm(`${m.prenom ?? ''} ${m.nom ?? ''} ${m.ville ?? ''}`).includes(q);
                            })
                            .map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.prenom ?? ''} {m.nom ?? ''}{m.ville ? ` · ${m.ville}` : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Rôle</Label>
                      <Select value={marcheurRoleToAdd} onValueChange={(v) => setMarcheurRoleToAdd(v as any)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proprietaire">Propriétaire</SelectItem>
                          <SelectItem value="prestataire">Prestataire</SelectItem>
                          <SelectItem value="marcheur_historique">Marcheur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" disabled={!marcheurToAdd} onClick={() => {
                      addMarcheur.mutate({ community_profile_id: marcheurToAdd, role: marcheurRoleToAdd });
                      setMarcheurToAdd('');
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <ul className="divide-y border rounded-md">
                    {linkedMarcheurs.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun marcheur rattaché.</li>}
                    {linkedMarcheurs.map(l => {
                      const m = marcheurById[l.community_profile_id];
                      return (
                        <li key={l.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                          <div className="flex items-center gap-2">
                            {l.is_main && <Star className="h-4 w-4 text-amber-500 fill-amber-400" />}
                            <span>{m ? `${m.prenom ?? ''} ${m.nom ?? ''}`.trim() : '(inconnu)'}</span>
                            <Badge variant="outline" className="text-xs">{l.role}</Badge>
                          </div>
                          <div className="flex gap-1">
                            {!l.is_main && (
                              <Button size="sm" variant="ghost" onClick={() => setMainMarcheur.mutate(l)} title="Définir comme propriété principale de ce marcheur">
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => removeMarcheur.mutate(l.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* Entreprises rattachées */}
                <section className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />Entreprises rattachées
                  </h3>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-xs">Entreprise</Label>
                      <Select value={companyToAdd} onValueChange={setCompanyToAdd}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                        <SelectContent className="max-h-80">
                          <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                            <Input
                              autoFocus
                              placeholder="Rechercher…"
                              value={companySearch}
                              onChange={(e) => setCompanySearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-8"
                            />
                          </div>
                          {companies
                            .filter(c => !linkedCompanies.some(l => l.company_id === c.id))
                            .filter(c => {
                              if (!companySearch.trim()) return true;
                              const q = norm(companySearch);
                              return norm(`${c.denomination ?? ''} ${c.nom_complet ?? ''} ${c.ville ?? ''}`).includes(q);
                            })
                            .map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.denomination ?? c.nom_complet ?? '(sans nom)'}{c.ville ? ` · ${c.ville}` : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Rôle</Label>
                      <Select value={companyRoleToAdd} onValueChange={(v) => setCompanyRoleToAdd(v as any)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
                          <SelectItem value="prestataire">Prestataire</SelectItem>
                          <SelectItem value="lecture">Lecture seule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" disabled={!companyToAdd} onClick={() => {
                      addCompany.mutate({ company_id: companyToAdd, role: companyRoleToAdd });
                      setCompanyToAdd('');
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <ul className="divide-y border rounded-md">
                    {linkedCompanies.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucune entreprise rattachée.</li>}
                    {linkedCompanies.map(l => {
                      const c = companyById[l.company_id];
                      return (
                        <li key={l.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span>{c?.denomination ?? c?.nom_complet ?? '(inconnu)'}</span>
                            <Badge variant="outline" className="text-xs">{l.role}</Badge>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => removeCompany.mutate(l.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* Événements rattachés */}
                <section className="space-y-3 pt-4 border-t pb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />Événements Marches du Vivant
                  </h3>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[220px]">
                      <Select value={eventToAdd} onValueChange={setEventToAdd}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un événement…" /></SelectTrigger>
                        <SelectContent className="max-h-80">
                          <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                            <Input
                              autoFocus
                              placeholder="Rechercher…"
                              value={eventSearch}
                              onChange={(e) => setEventSearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-8"
                            />
                          </div>
                          {events
                            .filter(e => !linkedEvents.some(l => l.marche_event_id === e.id))
                            .filter(e => {
                              if (!eventSearch.trim()) return true;
                              return norm(e.title ?? '').includes(norm(eventSearch));
                            })
                            .map(e => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.title ?? '(sans titre)'}{e.date_marche ? ` · ${new Date(e.date_marche).toLocaleDateString('fr-FR')}` : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" disabled={!eventToAdd} onClick={() => {
                      addEvent.mutate(eventToAdd);
                      setEventToAdd('');
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <ul className="divide-y border rounded-md">
                    {linkedEvents.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun événement rattaché.</li>}
                    {linkedEvents.map(l => {
                      const e = eventById[l.marche_event_id];
                      return (
                        <li key={l.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                          <span>{e?.title ?? '(inconnu)'}{e?.date_marche ? ` · ${new Date(e.date_marche).toLocaleDateString('fr-FR')}` : ''}</span>
                          <Button size="sm" variant="ghost" onClick={() => removeEvent.mutate(l.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminProprietes;
