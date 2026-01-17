import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';

interface MarcheurFilterPillsProps {
  marcheurs: ExplorationMarcheur[];
  selectedMarcheurIds: string[];
  onSelectionChange: (ids: string[]) => void;
  totalSpeciesCount?: number;
  className?: string;
}

export function MarcheurFilterPills({
  marcheurs,
  selectedMarcheurIds,
  onSelectionChange,
  totalSpeciesCount = 0,
  className,
}: MarcheurFilterPillsProps) {
  const isAllSelected = selectedMarcheurIds.length === 0;

  const handlePillClick = (marcheurId: string | null) => {
    if (marcheurId === null) {
      // "Tous" selected
      onSelectionChange([]);
    } else {
      if (selectedMarcheurIds.includes(marcheurId)) {
        // Deselect this marcheur
        const newSelection = selectedMarcheurIds.filter(id => id !== marcheurId);
        onSelectionChange(newSelection);
      } else {
        // Add this marcheur (multi-select)
        onSelectionChange([...selectedMarcheurIds, marcheurId]);
      }
    }
  };

  const getInitials = (marcheur: ExplorationMarcheur) => {
    return `${marcheur.prenom.charAt(0)}${marcheur.nom.charAt(0)}`.toUpperCase();
  };

  const formatShortName = (marcheur: ExplorationMarcheur) => {
    return `${marcheur.prenom} ${marcheur.nom.charAt(0)}.`;
  };

  if (marcheurs.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Users className="w-4 h-4" />
        <span>Observations par</span>
      </div>

      {/* Pills container */}
      <div className="flex flex-wrap gap-2">
        {/* "Tous" pill */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePillClick(null)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200",
                  isAllSelected
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Tous</div>
                  <div className="text-xs opacity-70">{totalSpeciesCount.toLocaleString('fr-FR')} esp.</div>
                </div>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toutes les observations (sources multiples)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Individual marcheur pills */}
        {marcheurs.map((marcheur) => {
          const isSelected = selectedMarcheurIds.includes(marcheur.id);
          
          return (
            <TooltipProvider key={marcheur.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePillClick(marcheur.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200",
                      isSelected
                        ? "border-opacity-50 text-white"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                    )}
                    style={isSelected ? {
                      backgroundColor: `${marcheur.couleur}20`,
                      borderColor: `${marcheur.couleur}80`,
                    } : undefined}
                  >
                    {/* Avatar with initials */}
                    <div 
                      className="relative w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: marcheur.couleur }}
                    >
                      {marcheur.avatarUrl ? (
                        <img 
                          src={marcheur.avatarUrl} 
                          alt={marcheur.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(marcheur)
                      )}
                      
                      {/* Principal badge */}
                      {marcheur.isPrincipal && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-slate-900" />
                      )}
                      
                      {/* Active pulse animation */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ backgroundColor: marcheur.couleur }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    {/* Name and count */}
                    <div className="text-left">
                      <div className="text-sm font-medium" style={isSelected ? { color: marcheur.couleur } : undefined}>
                        {formatShortName(marcheur)}
                      </div>
                      <div className="text-xs opacity-70">
                        {marcheur.observationsCount.toLocaleString('fr-FR')} esp.
                      </div>
                    </div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{marcheur.fullName}</p>
                    {marcheur.bioCoute && (
                      <p className="text-xs text-slate-400">{marcheur.bioCoute}</p>
                    )}
                    <p className="text-xs text-emerald-400">
                      {marcheur.observationsCount} espèces observées
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
