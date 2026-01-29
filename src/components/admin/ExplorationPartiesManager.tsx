import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Plus,
  Layers,
  Footprints,
  AlertCircle,
  ArrowRight,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useExplorationPartiesWithMarches,
  useUnassignedMarches,
  useCreateExplorationPartie,
  useUpdateExplorationPartie,
  useDeleteExplorationPartie,
  useReorderParties,
  useAssignMarcheToPartie,
} from '@/hooks/useExplorationParties';
import PartieCard from './PartieCard';
import PartieFormModal from './PartieFormModal';
import type { ExplorationPartie } from '@/types/exploration';

interface ExplorationPartiesManagerProps {
  explorationId: string;
}

const ExplorationPartiesManager: React.FC<ExplorationPartiesManagerProps> = ({
  explorationId,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartie, setEditingPartie] = useState<ExplorationPartie | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({});

  // Queries
  const { data: parties = [], isLoading: isLoadingParties } = useExplorationPartiesWithMarches(explorationId);
  const { data: unassignedMarches = [], isLoading: isLoadingUnassigned } = useUnassignedMarches(explorationId);

  // Mutations
  const createMutation = useCreateExplorationPartie();
  const updateMutation = useUpdateExplorationPartie();
  const deleteMutation = useDeleteExplorationPartie();
  const reorderMutation = useReorderParties();
  const assignMutation = useAssignMarcheToPartie();

  // Check if all parties are expanded/collapsed
  const allExpanded = useMemo(() => {
    if (parties.length === 0) return false;
    return parties.every((p) => expandedParties[p.id] === true);
  }, [parties, expandedParties]);

  const toggleAllParties = () => {
    const newState: Record<string, boolean> = {};
    const newValue = !allExpanded;
    parties.forEach((p) => {
      newState[p.id] = newValue;
    });
    setExpandedParties(newState);
  };

  const togglePartie = (partieId: string) => {
    setExpandedParties((prev) => ({
      ...prev,
      [partieId]: !prev[partieId],
    }));
  };

  const handleCreateOrUpdate = (data: {
    titre: string;
    sousTitre?: string;
    numeroRomain: string;
    couleur: string;
    description?: string;
  }) => {
    if (editingPartie) {
      updateMutation.mutate(
        {
          partieId: editingPartie.id,
          explorationId,
          titre: data.titre,
          sousTitre: data.sousTitre,
          numeroRomain: data.numeroRomain,
          couleur: data.couleur,
          description: data.description,
        },
        {
          onSuccess: () => {
            toast.success('Partie modifiée');
            setIsFormOpen(false);
            setEditingPartie(null);
          },
          onError: () => toast.error('Erreur lors de la modification'),
        }
      );
    } else {
      createMutation.mutate(
        {
          explorationId,
          titre: data.titre,
          sousTitre: data.sousTitre,
          numeroRomain: data.numeroRomain,
          couleur: data.couleur,
          description: data.description,
        },
        {
          onSuccess: () => {
            toast.success('Partie créée');
            setIsFormOpen(false);
          },
          onError: () => toast.error('Erreur lors de la création'),
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;

    deleteMutation.mutate(
      { partieId: deleteConfirmId, explorationId },
      {
        onSuccess: () => {
          toast.success('Partie supprimée');
          setDeleteConfirmId(null);
        },
        onError: () => toast.error('Erreur lors de la suppression'),
      }
    );
  };

  const handleMovePartie = (partieId: string, direction: 'up' | 'down') => {
    const currentIndex = parties.findIndex((p) => p.id === partieId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= parties.length) return;

    const newOrder = parties.map((p, i) => {
      if (i === currentIndex) return { partieId: p.id, ordre: newIndex + 1 };
      if (i === newIndex) return { partieId: p.id, ordre: currentIndex + 1 };
      return { partieId: p.id, ordre: i + 1 };
    });

    reorderMutation.mutate({ explorationId, partieOrders: newOrder });
  };

  const handleRemoveMarcheFromPartie = (explorationMarcheId: string) => {
    assignMutation.mutate(
      { explorationMarcheId, partieId: null, explorationId },
      {
        onSuccess: () => toast.success('Marche retirée de la partie'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleAssignMarcheToPartie = (explorationMarcheId: string, partieId: string) => {
    assignMutation.mutate(
      { explorationMarcheId, partieId, explorationId },
      {
        onSuccess: () => toast.success('Marche assignée'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const isLoading = isLoadingParties || isLoadingUnassigned;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-gaspard-accent" />
          <h2 className="text-xl font-semibold text-gaspard-primary">
            Structurer en Parties
          </h2>
          {parties.length > 0 && (
            <Badge variant="secondary" className="bg-gaspard-accent/10 text-gaspard-accent">
              {parties.length} mouvement{parties.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {parties.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllParties}
              className="border-gaspard-primary/20 text-gaspard-muted hover:text-gaspard-primary hover:bg-gaspard-primary/5"
            >
              {allExpanded ? (
                <>
                  <ChevronsDownUp className="h-4 w-4 mr-2" />
                  Tout réduire
                </>
              ) : (
                <>
                  <ChevronsUpDown className="h-4 w-4 mr-2" />
                  Tout déplier
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingPartie(null);
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-r from-gaspard-primary to-gaspard-secondary hover:from-gaspard-primary/90 hover:to-gaspard-secondary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle partie
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}

      {/* Parties list */}
      {!isLoading && parties.length > 0 && (
        <div className="space-y-4">
          {parties.map((partie, index) => (
            <PartieCard
              key={partie.id}
              partie={partie}
              isFirst={index === 0}
              isLast={index === parties.length - 1}
              isExpanded={expandedParties[partie.id] === true}
              onToggleExpand={() => togglePartie(partie.id)}
              onEdit={() => {
                setEditingPartie(partie);
                setIsFormOpen(true);
              }}
              onDelete={() => setDeleteConfirmId(partie.id)}
              onMoveUp={() => handleMovePartie(partie.id, 'up')}
              onMoveDown={() => handleMovePartie(partie.id, 'down')}
              onRemoveMarche={handleRemoveMarcheFromPartie}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && parties.length === 0 && (
        <Card className="border-dashed border-2 border-gaspard-primary/20 bg-gaspard-card/30">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-gaspard-muted/40 mb-4" />
            <h3 className="text-lg font-medium text-gaspard-primary mb-2">
              Aucune partie définie
            </h3>
            <p className="text-gaspard-muted max-w-md mx-auto mb-6">
              Structurez votre recueil en mouvements littéraires pour les éditeurs.
              Ex: I. LE CONTRE-COURANT, II. LE POINT DE BASCULE, III. LE NOUVEAU PACTE
            </p>
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="outline"
              className="border-gaspard-primary/30 hover:bg-gaspard-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer la première partie
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Unassigned marches */}
      {!isLoading && unassignedMarches.length > 0 && (
        <Card className="border-gaspard-accent/30 bg-gaspard-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-gaspard-accent flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Marches non assignées ({unassignedMarches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedMarches.map((marche) => (
                <div
                  key={marche.id}
                  className="flex items-center justify-between p-3 bg-gaspard-background/70 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <Footprints className="h-4 w-4 text-gaspard-muted" />
                    <span className="text-gaspard-text">
                      {marche.marche?.nom_marche || marche.marche?.ville || 'Marche'}
                    </span>
                  </div>

                  {parties.length > 0 && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gaspard-muted">Assigner à :</span>
                      {parties.slice(0, 3).map((partie) => (
                        <Button
                          key={partie.id}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          style={{ borderColor: partie.couleur, color: partie.couleur }}
                          onClick={() => handleAssignMarcheToPartie(marche.id, partie.id)}
                        >
                          {partie.numero_romain}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form modal */}
      <PartieFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPartie(null);
        }}
        partie={editingPartie}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette partie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les marches assignées à cette partie seront replacées dans "Non assignées".
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExplorationPartiesManager;
