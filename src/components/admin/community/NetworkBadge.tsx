import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NETWORK_META, type ScienceNetwork } from '@/types/scienceAccounts';

interface Props {
  network: ScienceNetwork;
  username?: string;
  url?: string | null;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
  asLink?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-[11px]',
  lg: 'h-9 w-9 text-xs',
};

export const NetworkBadge: React.FC<Props> = ({
  network, username, url, verified, size = 'md', withLabel = false, asLink = true, className,
}) => {
  const meta = NETWORK_META[network];
  const Icon = meta.icon;

  const dot = (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-bold ring-1 transition-transform',
        meta.badgeBg, meta.badgeRing, meta.badgeText, SIZE[size],
        asLink && url && 'hover:scale-110 hover:ring-2',
        className,
      )}
      aria-label={meta.label}
    >
      <Icon className="h-3 w-3 absolute opacity-30" />
      <span className="relative">{meta.initials}</span>
      {verified && (
        <CheckCircle2 className="absolute -bottom-1 -right-1 h-3 w-3 text-emerald-500 bg-background rounded-full" />
      )}
    </span>
  );

  const content = withLabel ? (
    <span className="inline-flex items-center gap-1.5">
      {dot}
      <span className="text-xs font-medium">{meta.short}</span>
    </span>
  ) : dot;

  const wrapped = asLink && url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex"
    >
      {content}
    </a>
  ) : content;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{meta.label}</span>
            {username && <span className="opacity-70">@{username}</span>}
            {url && <ExternalLink className="h-3 w-3 opacity-60" />}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NetworkBadge;
