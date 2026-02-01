import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Euro,
  Users,
  GripVertical,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CrmOpportunity } from '@/types/crm';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OpportunityCardProps {
  opportunity: CrmOpportunity;
  onEdit?: (opportunity: CrmOpportunity) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onEdit,
  onDelete,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return null;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(budget);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-card hover:shadow-md transition-shadow cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div 
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(opportunity)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(opportunity.id)}
              className="text-destructive"
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2" onClick={() => onEdit?.(opportunity)}>
        {/* Name & Company */}
        <div>
          <h4 className="font-semibold text-sm text-foreground">
            {opportunity.prenom} {opportunity.nom}
          </h4>
          {opportunity.entreprise && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{opportunity.entreprise}</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {opportunity.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{opportunity.email}</span>
            </div>
          )}
          {opportunity.telephone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{opportunity.telephone}</span>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="flex flex-wrap gap-1">
          {opportunity.experience_souhaitee && (
            <Badge variant="secondary" className="text-xs">
              {opportunity.experience_souhaitee}
            </Badge>
          )}
          {opportunity.format_souhaite && (
            <Badge variant="outline" className="text-xs">
              {opportunity.format_souhaite}
            </Badge>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {opportunity.date_souhaitee && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(opportunity.date_souhaitee)}</span>
            </div>
          )}
          {opportunity.lieu_prefere && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{opportunity.lieu_prefere}</span>
            </div>
          )}
          {opportunity.nombre_participants && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{opportunity.nombre_participants}</span>
            </div>
          )}
          {opportunity.budget_estime && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <Euro className="h-3 w-3" />
              <span>{formatBudget(opportunity.budget_estime)}</span>
            </div>
          )}
        </div>

        {/* Source */}
        {opportunity.source && (
          <div className="text-xs text-muted-foreground italic">
            via {opportunity.source}
          </div>
        )}
      </div>
    </Card>
  );
};
