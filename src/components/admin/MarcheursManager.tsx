import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationMarcheurs, ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Users, Eye, Leaf } from 'lucide-react';
import MarcheurObservationsManager from './MarcheurObservationsManager';

interface MarcheursManagerProps {
  explorationId: string;
}

interface MarcheurFormData {
  prenom: string;
  nom: string;
  role: 'principal' | 'invité' | 'scientifique' | 'marcheur';
  bio_courte: string;
  couleur: string;
  is_principal: boolean;
  avatar_url: string;
}

const defaultFormData: MarcheurFormData = {
  prenom: '',
  nom: '',
  role: 'marcheur',
  bio_courte: '',
  couleur: '#10b981',
  is_principal: false,
  avatar_url: '',
};

const roleLabels: Record<string, string> = {
  principal: 'Principal',
  invité: 'Invité',
  scientifique: 'Scientifique',
  marcheur: 'Marcheur',
};

const roleColors: Record<string, string> = {
  principal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  invité: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  scientifique: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  marcheur: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function MarcheursManager({ explorationId }: MarcheursManagerProps) {
  const queryClient = useQueryClient();
  const { data: marcheurs, isLoading } = useExplorationMarcheurs(explorationId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [observationsDialogOpen, setObservationsDialogOpen] = useState(false);
  const [editingMarcheur, setEditingMarcheur] = useState<ExplorationMarcheur | null>(null);
  const [selectedMarcheur, setSelectedMarcheur] = useState<ExplorationMarcheur | null>(null);
  const [formData, setFormData] = useState<MarcheurFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingMarcheur(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (marcheur: ExplorationMarcheur) => {
    setEditingMarcheur(marcheur);
    setFormData({
      prenom: marcheur.prenom,
      nom: marcheur.nom,
      role: marcheur.role,
      bio_courte: marcheur.bioCoute || '',
      couleur: marcheur.couleur,
      is_principal: marcheur.isPrincipal,
      avatar_url: marcheur.avatarUrl || '',
    });
    setDialogOpen(true);
  };

  const handleOpenObservations = (marcheur: ExplorationMarcheur) => {
    setSelectedMarcheur(marcheur);
    setObservationsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.prenom.trim() || !formData.nom.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }

    setSaving(true);
    try {
      if (editingMarcheur) {
        // Update
        const { error } = await supabase
          .from('exploration_marcheurs')
          .update({
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim(),
            role: formData.role,
            bio_courte: formData.bio_courte.trim() || null,
            couleur: formData.couleur,
            is_principal: formData.is_principal,
            avatar_url: formData.avatar_url.trim() || null,
          })
          .eq('id', editingMarcheur.id);

        if (error) throw error;
        toast.success('Marcheur mis à jour');
      } else {
        // Create - get max ordre
        const maxOrdre = marcheurs?.reduce((max, m) => Math.max(max, m.ordre), 0) || 0;
        
        const { error } = await supabase
          .from('exploration_marcheurs')
          .insert({
            exploration_id: explorationId,
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim(),
            role: formData.role,
            bio_courte: formData.bio_courte.trim() || null,
            couleur: formData.couleur,
            is_principal: formData.is_principal,
            avatar_url: formData.avatar_url.trim() || null,
            ordre: maxOrdre + 1,
          });

        if (error) throw error;
        toast.success('Marcheur ajouté');
      }

      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving marcheur:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (marcheurId: string) => {
    if (!confirm('Supprimer ce marcheur et toutes ses observations ?')) return;
    
    setDeleting(marcheurId);
    try {
      // Delete observations first
      await supabase
        .from('marcheur_observations')
        .delete()
        .eq('marcheur_id', marcheurId);

      // Delete marcheur
      const { error } = await supabase
        .from('exploration_marcheurs')
        .delete()
        .eq('id', marcheurId);

      if (error) throw error;
      toast.success('Marcheur supprimé');
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });
    } catch (error: any) {
      console.error('Error deleting marcheur:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/3"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Équipage & Marcheurs</h3>
            <p className="text-sm text-muted-foreground">
              {marcheurs?.length || 0} marcheur{(marcheurs?.length || 0) > 1 ? 's' : ''} dans l'exploration
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un marcheur
        </Button>
      </div>

      {/* Marcheurs Grid */}
      {marcheurs && marcheurs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marcheurs.map((marcheur) => (
            <Card key={marcheur.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                      style={{ backgroundColor: marcheur.couleur }}
                    >
                      {marcheur.prenom[0]}{marcheur.nom[0]}
                    </div>
                    <div>
                      <CardTitle className="text-base">{marcheur.fullName}</CardTitle>
                      <Badge variant="outline" className={`mt-1 text-xs ${roleColors[marcheur.role]}`}>
                        {roleLabels[marcheur.role]}
                      </Badge>
                    </div>
                  </div>
                  {marcheur.isPrincipal && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      ★ Principal
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {marcheur.bioCoute && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {marcheur.bioCoute}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">
                    {marcheur.observationsCount} espèce{marcheur.observationsCount > 1 ? 's' : ''} observée{marcheur.observationsCount > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleOpenObservations(marcheur)}
                  >
                    <Eye className="h-3 w-3" />
                    Observations
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(marcheur)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(marcheur.id)}
                    disabled={deleting === marcheur.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            Aucun marcheur dans cette exploration
          </p>
          <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter le premier marcheur
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMarcheur ? 'Modifier le marcheur' : 'Ajouter un marcheur'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Gaspard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Boréal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: MarcheurFormData['role']) => 
                    setFormData(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="invité">Invité</SelectItem>
                    <SelectItem value="scientifique">Scientifique</SelectItem>
                    <SelectItem value="marcheur">Marcheur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="couleur">Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="couleur"
                    value={formData.couleur}
                    onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.couleur}
                    onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
                    className="flex-1"
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio courte</Label>
              <Textarea
                id="bio"
                value={formData.bio_courte}
                onChange={(e) => setFormData(prev => ({ ...prev, bio_courte: e.target.value }))}
                placeholder="Marcheur-narrateur, explorateur du vivant..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">URL Avatar (optionnel)</Label>
              <Input
                id="avatar"
                value={formData.avatar_url}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_principal"
                checked={formData.is_principal}
                onChange={(e) => setFormData(prev => ({ ...prev, is_principal: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="is_principal" className="cursor-pointer">
                Marcheur principal de l'exploration
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : editingMarcheur ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Observations Dialog - Now unified for all marcheurs */}
      {selectedMarcheur && (
        <Dialog open={observationsDialogOpen} onOpenChange={setObservationsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: selectedMarcheur.couleur }}
                >
                  {selectedMarcheur.prenom[0]}{selectedMarcheur.nom[0]}
                </div>
                Observations de {selectedMarcheur.fullName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <MarcheurObservationsManager
                marcheur={selectedMarcheur}
                explorationId={explorationId}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
