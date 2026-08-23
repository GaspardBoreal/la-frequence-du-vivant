/**
 * Sous-menu « Type » de l'onglet Exemples : la vue historique,
 * une carte par type de jardin avec ses exemples dans l'ordre de position.
 */
import React from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { GardenExample, GardenType } from '@/hooks/onboarding/useOnboardingConfig';

interface Props {
  types: GardenType[];
  examples: GardenExample[];
  onAdd: (type: GardenType, nextPosition: number) => void;
  onEdit: (example: GardenExample) => void;
  onDelete: (example: GardenExample) => void;
  onSetCover: (type: GardenType, example: GardenExample) => void;
}

const ExamplesTypeView: React.FC<Props> = ({ types, examples, onAdd, onEdit, onDelete, onSetCover }) => (
  <div className="space-y-6">
    {[...types]
      .sort((a, b) => a.position - b.position)
      .map((t) => {
        const items = examples.filter((e) => e.type_id === t.id).sort((a, b) => a.position - b.position);
        return (
          <Card key={t.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.titre}</p>
                <p className="text-sm text-muted-foreground">{items.length} exemple(s)</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onAdd(t, items.length)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((e) => (
                <div key={e.id} className="flex gap-3 rounded-xl border border-border/60 p-3">
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {e.image_url && <img src={e.image_url} alt={e.titre} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.titre}
                      {!e.publie && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          masqué
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{e.sous_titre}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onDelete(e)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                      {e.image_url && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onSetCover(t, e)}>
                          Couverture
                        </Button>
                      )}
                      {e.source_url && (
                        <a href={e.source_url} target="_blank" rel="noreferrer" className="text-muted-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
  </div>
);

export default ExamplesTypeView;
