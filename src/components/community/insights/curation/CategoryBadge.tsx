import React from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { getCatStyle, getCatLabel, getCatIcon } from './curationCategories';

export interface CategoryBadgeProps {
  category: string | null | undefined;
  /** Visual hierarchy : `primary` = pleine, `secondary` = bordure dashed + opacité réduite */
  variant?: 'primary' | 'secondary';
  size?: 'xs' | 'sm';
  /** Affiche une petite icône Info quand des évidences existent */
  hasEvidence?: boolean;
  /** Pastille ambre clignotante quand la classification est à réviser */
  needsReview?: boolean;
  /** Affiche l'emoji catégorie en plus du label */
  showIcon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  /** Forcer un libellé personnalisé (ex: "+2") */
  labelOverride?: string;
  title?: string;
}

const SIZE_CLS: Record<NonNullable<CategoryBadgeProps['size']>, string> = {
  xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
  sm: 'text-[10px] px-2 py-0.5 gap-1',
};

/**
 * Badge pastille catégorie — clic optionnel pour ouvrir la sheet d'évidences.
 * Utilisé partout où l'on affiche la classification d'une espèce
 * (carte privée, page publique, dossier vivant).
 */
const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  variant = 'primary',
  size = 'sm',
  hasEvidence,
  needsReview,
  showIcon,
  onClick,
  className,
  labelOverride,
  title,
}) => {
  if (!category && !labelOverride) return null;

  const baseStyle = getCatStyle(category);
  const label = labelOverride ?? getCatLabel(category);
  const icon = getCatIcon(category);

  const isInteractive = !!onClick;

  return (
    <span
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick(e);
      }}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as any);
              }
            }
          : undefined
      }
      title={title ?? (label ? `${label}${hasEvidence ? ' — voir les sources' : ''}` : undefined)}
      className={[
        'relative inline-flex items-center rounded-md border font-medium leading-none',
        'transition select-none whitespace-nowrap',
        SIZE_CLS[size],
        baseStyle,
        variant === 'secondary' ? 'opacity-70 border-dashed' : '',
        isInteractive ? 'cursor-pointer hover:opacity-100 hover:ring-1 hover:ring-current/30' : '',
        className ?? '',
      ].join(' ')}
    >
      {showIcon && icon && <span aria-hidden>{icon}</span>}
      <span>{label}</span>
      {hasEvidence && <Info className="w-2.5 h-2.5 opacity-70" aria-hidden />}
      {needsReview && (
        <span
          aria-label="Classification à réviser"
          className="absolute -top-0.5 -right-0.5 inline-flex h-1.5 w-1.5"
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
        </span>
      )}
    </span>
  );
};

export default CategoryBadge;

/**
 * Petit composant utilitaire pour afficher un cluster :
 * 1 badge principal + jusqu'à N secondaires + "+N" overflow.
 */
export const CategoryBadgeCluster: React.FC<{
  primary: string | null | undefined;
  secondary?: string[];
  maxSecondary?: number;
  hasEvidence?: boolean;
  needsReview?: boolean;
  onOpen?: () => void;
}> = ({ primary, secondary = [], maxSecondary = 2, hasEvidence, needsReview, onOpen }) => {
  if (!primary && secondary.length === 0 && !needsReview) return null;
  const visible = secondary.slice(0, maxSecondary);
  const overflow = Math.max(0, secondary.length - visible.length);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {primary && (
        <CategoryBadge
          category={primary}
          variant="primary"
          size="sm"
          hasEvidence={hasEvidence}
          needsReview={needsReview}
          onClick={onOpen}
        />
      )}
      {visible.map((s) => (
        <CategoryBadge
          key={s}
          category={s}
          variant="secondary"
          size="xs"
          onClick={onOpen}
        />
      ))}
      {overflow > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
          className="text-[9px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        >
          +{overflow}
        </button>
      )}
      {needsReview && !primary && (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-3 h-3" /> à réviser
        </span>
      )}
    </div>
  );
};
