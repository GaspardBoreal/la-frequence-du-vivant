import React from 'react';
import { ExternalLink } from 'lucide-react';

const SITE = 'https://la-frequence-du-vivant.com';

/** Rend absolue une URL interne (pour JSON-LD). */
export const absUrl = (url: string) => (url.startsWith('http') ? url : `${SITE}${url}`);

/** Lien source : toujours dans une nouvelle fenêtre, même en interne. */
export const FjSourceLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ href, children, className, onClick }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className={
      className ??
      'inline-flex items-center gap-1 text-[hsl(var(--ds-forest))] underline underline-offset-4 hover:text-[hsl(var(--ds-forest-deep))]'
    }
  >
    {children}
    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
    <span className="sr-only"> (nouvelle fenêtre)</span>
  </a>
);
