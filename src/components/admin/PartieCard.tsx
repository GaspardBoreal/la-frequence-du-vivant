import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Footprints,
  X,
} from 'lucide-react';
import type { ExplorationPartieWithMarches } from '@/types/exploration';

interface PartieCardProps {
  partie: ExplorationPartieWithMarches;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveMarche: (explorationMarcheId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const PartieCard: React.FC<PartieCardProps> = ({
  partie,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRemoveMarche,
  dragHandleProps,
}) => {
  const marchesCount = partie.marches.length;
  const textesCount = partie.marches.reduce((acc, m) => acc + (m.textes_count || 0), 0);

  return (
    <Card 
      className="border-l-4 bg-gaspard-card/50 hover:bg-gaspard-card/70 transition-all duration-300"
      style={{ borderLeftColor: partie.couleur || '#6366f1' }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          {/* Drag handle + Titre */}
          <div className="flex items-start gap-3 flex-1">
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-gaspard-muted hover:text-gaspard-primary transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span 
                  className="text-2xl font-bold"
                  style={{ color: partie.couleur || '#6366f1' }}
                >
                  {partie.numero_romain}.
                </span>
                <h3 className="text-lg font-bold text-gaspard-primary uppercase tracking-wide">
                  {partie.titre}
                </h3>
              </div>
              
              {partie.sous_titre && (
                <p className="text-gaspard-muted italic text-sm ml-10">
                  {partie.sous_titre}
                </p>
              )}
            </div>
          </div>

          {/* Stats + Actions */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-gaspard-primary/10 text-gaspard-primary">
                {marchesCount} marche{marchesCount > 1 ? 's' : ''}
              </Badge>
              {textesCount > 0 && (
                <Badge variant="outline" className="text-gaspard-muted">
                  ~{textesCount} textes
                </Badge>
              )}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gaspard-muted hover:text-gaspard-primary"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onMoveUp} disabled={isFirst}>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Monter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMoveDown} disabled={isLast}>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Descendre
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {marchesCount === 0 ? (
          <div className="py-6 text-center border-2 border-dashed border-gaspard-primary/20 rounded-xl bg-gaspard-background/30">
            <Footprints className="h-8 w-8 mx-auto text-gaspard-muted/50 mb-2" />
            <p className="text-sm text-gaspard-muted">
              Glissez des marches ici depuis la zone "Non assignées"
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {partie.marches.map((marche, index) => (
              <div
                key={marche.id}
                className="flex items-center justify-between p-3 bg-gaspard-background/50 rounded-lg group hover:bg-gaspard-background/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gaspard-muted w-6 text-right">
                    {index + 1}.
                  </span>
                  <Footprints className="h-4 w-4 text-gaspard-accent" />
                  <span className="text-gaspard-text">
                    {marche.marche?.nom_marche || marche.marche?.ville || 'Marche'}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gaspard-muted hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveMarche(marche.id)}
                  title="Retirer de cette partie"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Notes internes (si présentes) */}
        {partie.description && (
          <div className="mt-4 p-3 bg-gaspard-primary/5 rounded-lg border border-gaspard-primary/10">
            <p className="text-xs text-gaspard-muted italic">
              📝 {partie.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartieCard;
