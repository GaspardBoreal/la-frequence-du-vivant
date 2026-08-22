import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, CalendarDays, Loader2, MapPin, Plus, Save, Star,
  Trash2, Trees, Users, LocateFixed,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ImageUploadField } from '@/components/onboarding/ImageUploadField';
import { geocodeAddress } from '@/utils/geocoding';
import ProprietePositionPicker from '@/components/admin/proprietes/ProprietePositionPicker';
import DeleteProprieteDialog from '@/components/admin/proprietes/DeleteProprieteDialog';
import { cn } from '@/lib/utils';

const sb = supabase as any;

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
  geofence_buffer_m: number | null;
  surface_hectares: number | null;
  photo_hero_url: string | null;
  owner_company_id: string | null;
  main_walker_id: string | null;
  is_active: boolean;
};

type MarcheurLite = { id: string; prenom: string | null; nom: string | null; ville: string | null };
type CompanyLite = { id: string; denomination: string | null; nom_complet: string | null; ville: string | null };
type MarcheEventLite = { id: string; title: string | null; date_marche: string | null };
type LinkedMarcheur = { id: string; community_profile_id: string; role: 'proprietaire' | 'prestataire' | 'marcheur_historique'; is_main: boolean };
type LinkedCompany = { id: string; company_id: string; role: 'gestionnaire' | 'prestataire' | 'lecture' };
type LinkedEvent = { id: string; marche_event_id: string };

const EMPTY_FORM: Partial<Propriete> = {
  nom: '', description: '', adresse: '', ville: '', code_postal: '',
  departement: '', region: '', latitude: null, longitude: null,
  geofence_buffer_m: null, surface_hectares: null, photo_hero_url: '',
  owner_company_id: null, main_walker_id: null, is_active: true,
};

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const SECTIONS = [
  { id: 'sec-identite', label: 'Identité' },
  { id: 'sec-localisation', label: 'Localisation' },
  { id: 'sec-rattachements', label: 'Rattachements' },
  { id: 'sec-marcheurs', label: 'Marcheurs', editOnly: true },
  { id: 'sec-entreprises', label: 'Entreprises', editOnly: true },
  { id: 'sec-evenements', label: 'Événements', editOnly: true },
] as const;

const SectionTitle: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    {icon}
    {children}
  </h3>
);

const AdminProprieteFiche: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nouvelle';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<Partial<Propriete>>(EMPTY_FORM);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const initialRef = useRef<string>(JSON.stringify(EMPTY_FORM));

  // ---- Chargement de la propriété -----------------------------------------
  const { data: propriete, isLoading } = useQuery<Propriete | null>({
    queryKey: ['admin-propriete', id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await sb.from('proprietes').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Propriete;
    },
  });

  useEffect(() => {
    if (propriete) {
      setForm(propriete);
      initialRef.current = JSON.stringify(propriete);
    }
  }, [propriete]);

  const isDirty = useMemo(() => JSON.stringify(form) !== initialRef.current, [form]);

  // Avertit en cas de navigation avec modifications non enregistrées
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const goBack = () => {
    if (isDirty && !window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')) return;
    navigate('/admin/proprietes');
  };

  // ---- Référentiels ---------------------------------------------------------
  const [marcheurSearch, setMarcheurSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  const { data: marcheurs = [] } = useQuery<MarcheurLite[]>({
    queryKey: ['admin-proprietes-marcheurs'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('community_profiles')
        .select('id, prenom, nom, ville')
        .not('user_id', 'is', null)
        .order('prenom', { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as MarcheurLite[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery<CompanyLite[]>({
    queryKey: ['admin-proprietes-companies'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('crm_companies')
        .select('id, denomination, nom_complet, ville')
        .order('denomination')
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as CompanyLite[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: events = [] } = useQuery<MarcheEventLite[]>({
    queryKey: ['admin-proprietes-events'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('marche_events')
        .select('id, title, date_marche')
        .order('date_marche', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as MarcheEventLite[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeId = isNew ? undefined : id;

  // ---- Liaisons --------------------------------------------------------------
  const { data: linkedMarcheurs = [] } = useQuery<LinkedMarcheur[]>({
    queryKey: ['propriete-marcheurs', activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_marcheurs')
        .select('id, community_profile_id, role, is_main')
        .eq('propriete_id', activeId);
      if (error) throw error;
      return (data ?? []) as LinkedMarcheur[];
    },
  });

  const { data: linkedCompanies = [] } = useQuery<LinkedCompany[]>({
    queryKey: ['propriete-companies', activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_companies')
        .select('id, company_id, role')
        .eq('propriete_id', activeId);
      if (error) throw error;
      return (data ?? []) as LinkedCompany[];
    },
  });

  const { data: linkedEvents = [] } = useQuery<LinkedEvent[]>({
    queryKey: ['propriete-events', activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_marche_events')
        .select('id, marche_event_id')
        .eq('propriete_id', activeId);
      if (error) throw error;
      return (data ?? []) as LinkedEvent[];
    },
  });

  const marcheurById = useMemo(() => Object.fromEntries(marcheurs.map((m) => [m.id, m])), [marcheurs]);
  const companyById = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c])), [companies]);
  const eventById = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

  // ---- Mutations --------------------------------------------------------------
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
        geofence_buffer_m: form.geofence_buffer_m ?? null,
        surface_hectares: form.surface_hectares ?? null,
        photo_hero_url: form.photo_hero_url || null,
        owner_company_id: form.owner_company_id || null,
        main_walker_id: form.main_walker_id || null,
        is_active: form.is_active ?? true,
      };
      if (activeId) {
        const { data, error } = await sb.from('proprietes').update(payload).eq('id', activeId).select().single();
        if (error) throw error;
        return data as Propriete;
      }
      const { data, error } = await sb.from('proprietes').insert(payload).select().single();
      if (error) throw error;
      return data as Propriete;
    },
    onSuccess: (data: Propriete) => {
      toast.success(activeId ? 'Propriété mise à jour' : 'Propriété créée');
      qc.invalidateQueries({ queryKey: ['admin-proprietes'] });
      qc.invalidateQueries({ queryKey: ['admin-propriete', data.id] });
      initialRef.current = JSON.stringify(data);
      setForm(data);
      if (isNew) navigate(`/admin/proprietes/${data.id}`, { replace: true });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec de la sauvegarde'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await sb.from('proprietes').delete().eq('id', activeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Propriété supprimée');
      qc.invalidateQueries({ queryKey: ['admin-proprietes'] });
      initialRef.current = JSON.stringify(form); // neutralise le garde-fou avant de quitter
      navigate('/admin/proprietes');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec de la suppression'),
  });

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
    mutationFn: async (linkId: string) => {
      const { error } = await sb.from('propriete_marcheurs').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-marcheurs', activeId] }),
  });
  const setMainMarcheur = useMutation({
    mutationFn: async (link: LinkedMarcheur) => {
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
    mutationFn: async (linkId: string) => {
      const { error } = await sb.from('propriete_companies').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-companies', activeId] }),
  });

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
    mutationFn: async (linkId: string) => {
      const { error } = await sb.from('propriete_marche_events').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-events', activeId] }),
  });

  const [marcheurToAdd, setMarcheurToAdd] = useState<string>('');
  const [marcheurRoleToAdd, setMarcheurRoleToAdd] = useState<LinkedMarcheur['role']>('proprietaire');
  const [companyToAdd, setCompanyToAdd] = useState<string>('');
  const [companyRoleToAdd, setCompanyRoleToAdd] = useState<LinkedCompany['role']>('gestionnaire');
  const [eventToAdd, setEventToAdd] = useState<string>('');

  // ---- Géocodage -------------------------------------------------------------
  const geocode = async () => {
    const q = [form.adresse, form.code_postal, form.ville].filter(Boolean).join(' ');
    if (!q.trim()) {
      toast.error('Renseignez une adresse, un code postal ou une ville pour géocoder');
      return;
    }
    setGeocoding(true);
    try {
      const r = await geocodeAddress(q);
      setForm((f) => ({ ...f, latitude: r.coordinates[0], longitude: r.coordinates[1] }));
      toast.success('Position trouvée — ajustez le marqueur si besoin');
    } catch {
      toast.error('Adresse introuvable — placez le marqueur à la main');
    } finally {
      setGeocoding(false);
    }
  };

  const visibleSections = SECTIONS.filter((s) => !('editOnly' in s && s.editOnly) || !isNew);

  if (!isNew && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !propriete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <Trees className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Propriété introuvable.</p>
        <Link to="/admin/proprietes">
          <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ---- En-tête fixe -------------------------------------------------- */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Propriétés</span>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Trees className="h-4 w-4 shrink-0 text-emerald-600" />
              <h1 className="truncate text-base font-semibold sm:text-lg">
                {isNew ? 'Nouvelle propriété' : form.nom || '—'}
              </h1>
              {!isNew && (
                form.is_active
                  ? <Badge variant="outline" className="border-emerald-500 text-emerald-700">Active</Badge>
                  : <Badge variant="outline">Archivée</Badge>
              )}
            </div>
            {propriete?.slug && (
              <div className="truncate font-mono text-[11px] text-muted-foreground">/{propriete.slug}</div>
            )}
          </div>
          {isDirty && <span className="text-xs text-amber-600">Modifications non enregistrées</span>}
          {!isNew && (
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Supprimer</span>
            </Button>
          )}
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.nom?.trim()}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>

        {/* Sommaire mobile : pastilles défilantes */}
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden">
          {visibleSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
        {/* ---- Sommaire ancré desktop -------------------------------------- */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {visibleSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* ---- Sections ------------------------------------------------------ */}
        <div className="min-w-0 space-y-8 pb-16">
          {/* Identité */}
          <section id="sec-identite" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
            <SectionTitle>Identité</SectionTitle>
            <div>
              <Label>Nom *</Label>
              <Input value={form.nom ?? ''} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <ImageUploadField
              label="Photo hero"
              value={form.photo_hero_url}
              onChange={(url) => setForm((f) => ({ ...f, photo_hero_url: url }))}
              buildPath={(ext) => `proprietes/${activeId ?? 'brouillon'}/hero-${Date.now()}.${ext}`}
            />
            <div className="flex items-center gap-2 pt-1">
              <Label className="mb-0">Statut</Label>
              <Select
                value={form.is_active ? 'active' : 'archivee'}
                onValueChange={(v) => setForm((f) => ({ ...f, is_active: v === 'active' }))}
              >
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archivee">Archivée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Localisation */}
          <section id="sec-localisation" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
            <SectionTitle icon={<MapPin className="h-4 w-4" />}>Localisation</SectionTitle>
            <div>
              <Label>Adresse</Label>
              <Input value={form.adresse ?? ''} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code postal</Label><Input value={form.code_postal ?? ''} onChange={(e) => setForm((f) => ({ ...f, code_postal: e.target.value }))} /></div>
              <div><Label>Ville</Label><Input value={form.ville ?? ''} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Département</Label><Input value={form.departement ?? ''} onChange={(e) => setForm((f) => ({ ...f, departement: e.target.value }))} /></div>
              <div><Label>Région</Label><Input value={form.region ?? ''} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>Latitude</Label>
                <Input type="number" step="0.000001" value={form.latitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" step="0.000001" value={form.longitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Surface (ha)</Label>
                <Input type="number" step="0.001" value={form.surface_hectares ?? ''} onChange={(e) => setForm((f) => ({ ...f, surface_hectares: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
              <div>
                <Label title="Rayon de geofence">Geofence (m)</Label>
                <Input type="number" step="10" min={0} value={form.geofence_buffer_m ?? ''} onChange={(e) => setForm((f) => ({ ...f, geofence_buffer_m: e.target.value === '' ? null : Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={geocode} disabled={geocoding}>
                {geocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                Géocoder l'adresse
              </Button>
              <span className="text-xs text-muted-foreground">puis ajustez le marqueur à la souris ou au doigt</span>
            </div>
            <ProprietePositionPicker
              lat={form.latitude ?? null}
              lng={form.longitude ?? null}
              onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            />
          </section>

          {/* Rattachements principaux */}
          <section id="sec-rattachements" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
            <SectionTitle>Rattachements principaux</SectionTitle>
            <div>
              <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" />Entreprise propriétaire</Label>
              <Select
                value={form.owner_company_id ?? '__none__'}
                onValueChange={(v) => setForm((f) => ({ ...f, owner_company_id: v === '__none__' ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="sticky top-0 z-10 border-b bg-popover p-2">
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
                    .filter((c) => {
                      if (!companySearch.trim()) return true;
                      const q = norm(companySearch);
                      return norm(`${c.denomination ?? ''} ${c.nom_complet ?? ''} ${c.ville ?? ''}`).includes(q);
                    })
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.denomination ?? c.nom_complet ?? '(sans nom)'}{c.ville ? ` · ${c.ville}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Marcheur référent</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Le marcheur référent obtient automatiquement l'accès à l'espace Propriété et peut le choisir après connexion.
              </p>
              <Select
                value={form.main_walker_id ?? '__none__'}
                onValueChange={(v) => setForm((f) => ({ ...f, main_walker_id: v === '__none__' ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="sticky top-0 z-10 border-b bg-popover p-2">
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
                    .filter((m) => {
                      if (!marcheurSearch.trim()) return true;
                      const q = norm(marcheurSearch);
                      return norm(`${m.prenom ?? ''} ${m.nom ?? ''} ${m.ville ?? ''}`).includes(q);
                    })
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.prenom ?? ''} {m.nom ?? ''}{m.ville ? ` · ${m.ville}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Sections liaisons — après création uniquement */}
          {!isNew && (
            <>
              {/* Marcheurs rattachés */}
              <section id="sec-marcheurs" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
                <SectionTitle icon={<Users className="h-4 w-4" />}>Marcheurs rattachés</SectionTitle>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[180px] flex-1">
                    <Label className="text-xs">Marcheur</Label>
                    <Select value={marcheurToAdd} onValueChange={setMarcheurToAdd}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="sticky top-0 z-10 border-b bg-popover p-2">
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
                          .filter((m) => !linkedMarcheurs.some((l) => l.community_profile_id === m.id))
                          .filter((m) => {
                            if (!marcheurSearch.trim()) return true;
                            const q = norm(marcheurSearch);
                            return norm(`${m.prenom ?? ''} ${m.nom ?? ''} ${m.ville ?? ''}`).includes(q);
                          })
                          .map((m) => (
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
                <ul className="divide-y divide-border rounded-md border border-border">
                  {linkedMarcheurs.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun marcheur rattaché.</li>}
                  {linkedMarcheurs.map((l) => {
                    const m = marcheurById[l.community_profile_id];
                    return (
                      <li key={l.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                        <div className="flex items-center gap-2">
                          {l.is_main && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
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
              <section id="sec-entreprises" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
                <SectionTitle icon={<Building2 className="h-4 w-4" />}>Entreprises rattachées</SectionTitle>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[180px] flex-1">
                    <Label className="text-xs">Entreprise</Label>
                    <Select value={companyToAdd} onValueChange={setCompanyToAdd}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="sticky top-0 z-10 border-b bg-popover p-2">
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
                          .filter((c) => !linkedCompanies.some((l) => l.company_id === c.id))
                          .filter((c) => {
                            if (!companySearch.trim()) return true;
                            const q = norm(companySearch);
                            return norm(`${c.denomination ?? ''} ${c.nom_complet ?? ''} ${c.ville ?? ''}`).includes(q);
                          })
                          .map((c) => (
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
                <ul className="divide-y divide-border rounded-md border border-border">
                  {linkedCompanies.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucune entreprise rattachée.</li>}
                  {linkedCompanies.map((l) => {
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
              <section id="sec-evenements" className="scroll-mt-32 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
                <SectionTitle icon={<CalendarDays className="h-4 w-4" />}>Événements Marches du Vivant</SectionTitle>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[220px] flex-1">
                    <Select value={eventToAdd} onValueChange={setEventToAdd}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un événement…" /></SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="sticky top-0 z-10 border-b bg-popover p-2">
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
                          .filter((e) => !linkedEvents.some((l) => l.marche_event_id === e.id))
                          .filter((e) => {
                            if (!eventSearch.trim()) return true;
                            return norm(e.title ?? '').includes(norm(eventSearch));
                          })
                          .map((e) => (
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
                <ul className="divide-y divide-border rounded-md border border-border">
                  {linkedEvents.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun événement rattaché.</li>}
                  {linkedEvents.map((l) => {
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

          {isNew && (
            <p className={cn('rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground')}>
              Les rattachements de marcheurs, entreprises et événements seront disponibles après la création.
            </p>
          )}
        </div>
      </div>

      <DeleteProprieteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        propriete={propriete ? { id: propriete.id, nom: propriete.nom } : null}
        deleting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
};

export default AdminProprieteFiche;
