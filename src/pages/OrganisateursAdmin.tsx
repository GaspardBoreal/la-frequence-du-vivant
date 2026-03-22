import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Organisateur {
  id: string;
  nom: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  pays: string | null;
  email: string | null;
  telephone: string | null;
  site_web: string | null;
  description: string | null;
  type_structure: string | null;
  domaines: string[] | null;
  created_at: string;
}

const TYPES_STRUCTURE = ['individu', 'association', 'entreprise', 'collectif'];
const DOMAINES_OPTIONS = [
  'poesie', 'bioacoustique', 'agroecologie', 'data', 'transhumance',
  'theatre', 'narration', 'evenementiel', 'education', 'exploration_sonore',
  'mondes_hybrides', 'pastoralisme'
];

const OrganisateursAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: '', adresse: '', code_postal: '', ville: '', pays: 'France',
    email: '', telephone: '', site_web: '', description: '', type_structure: 'association',
    domaines: [] as string[]
  });

  const { data: organisateurs = [], isLoading } = useQuery({
    queryKey: ['organisateurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_organisateurs')
        .select('*')
        .order('nom');
      if (error) throw error;
      return data as Organisateur[];
    }
  });

  const { data: marchesCount = {} } = useQuery({
    queryKey: ['marches-per-organisateur'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marches')
        .select('organisateur_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((m: any) => {
        if (m.organisateur_id) {
          counts[m.organisateur_id] = (counts[m.organisateur_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = {
        nom: data.nom,
        adresse: data.adresse || null,
        code_postal: data.code_postal || null,
        ville: data.ville || null,
        pays: data.pays || 'France',
        email: data.email || null,
        telephone: data.telephone || null,
        site_web: data.site_web || null,
        description: data.description || null,
        type_structure: data.type_structure || 'association',
        domaines: data.domaines.length > 0 ? data.domaines : []
      };
      if (data.id) {
        const { error } = await supabase.from('marche_organisateurs').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('marche_organisateurs').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisateurs'] });
      toast.success(editingId ? 'Organisateur mis à jour' : 'Organisateur créé');
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marche_organisateurs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisateurs'] });
      toast.success('Organisateur supprimé');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const resetForm = () => {
    setForm({ nom: '', adresse: '', code_postal: '', ville: '', pays: 'France', email: '', telephone: '', site_web: '', description: '', type_structure: 'association', domaines: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (org: Organisateur) => {
    setForm({
      nom: org.nom, adresse: org.adresse || '', code_postal: org.code_postal || '',
      ville: org.ville || '', pays: org.pays || 'France', email: org.email || '',
      telephone: org.telephone || '', site_web: org.site_web || '',
      description: org.description || '', type_structure: org.type_structure || 'association',
      domaines: org.domaines || []
    });
    setEditingId(org.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { toast.error('Le nom est requis'); return; }
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };

  const toggleDomaine = (d: string) => {
    setForm(prev => ({
      ...prev,
      domaines: prev.domaines.includes(d) ? prev.domaines.filter(x => x !== d) : [...prev.domaines, d]
    }));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6" /> Organisateurs
          </h1>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />Nouvel organisateur
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold">{editingId ? 'Modifier' : 'Créer'} un organisateur</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
                <div>
                  <Label>Type de structure</Label>
                  <Select value={form.type_structure} onValueChange={v => setForm(p => ({ ...p, type_structure: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES_STRUCTURE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Adresse</Label><Input value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Code postal</Label><Input value={form.code_postal} onChange={e => setForm(p => ({ ...p, code_postal: e.target.value }))} /></div>
                  <div><Label>Ville</Label><Input value={form.ville} onChange={e => setForm(p => ({ ...p, ville: e.target.value }))} /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} /></div>
                <div><Label>Site web</Label><Input value={form.site_web} onChange={e => setForm(p => ({ ...p, site_web: e.target.value }))} /></div>
                <div><Label>Pays</Label><Input value={form.pays} onChange={e => setForm(p => ({ ...p, pays: e.target.value }))} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div>
                <Label>Domaines</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DOMAINES_OPTIONS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDomaine(d)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${form.domaines.includes(d) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-1" />Annuler</Button>
                <Button type="submit" disabled={saveMutation.isPending}><Save className="h-4 w-4 mr-1" />Sauvegarder</Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Domaines</TableHead>
                <TableHead>Marches</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organisateurs.map(org => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.nom}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded-full bg-muted text-xs">{org.type_structure}</span></TableCell>
                  <TableCell>{org.ville} {org.code_postal && `(${org.code_postal})`}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {org.domaines?.slice(0, 3).map(d => (
                        <span key={d} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{d}</span>
                      ))}
                      {(org.domaines?.length || 0) > 3 && <span className="text-xs text-muted-foreground">+{(org.domaines?.length || 0) - 3}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{marchesCount[org.id] || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(org)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                        if (confirm(`Supprimer "${org.nom}" ?`)) deleteMutation.mutate(org.id);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default OrganisateursAdmin;
