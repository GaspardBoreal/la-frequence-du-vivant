import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/** Identifiant d'ancre stable dérivé du texte d'un titre (accents supprimés). */
const headingId = (children: React.ReactNode): string | undefined => {
  const text = React.Children.toArray(children)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
    .join('')
    .trim();
  if (!text) return undefined;
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 70) || undefined
  );
};

/**
 * Rendu éditorial partagé d'un audit partenaire (Markdown GFM).
 * Utilisé dans le CRM (drawer) et sur la page publique /partenaires/:slug.
 */
export const PartnerAuditContent: React.FC<{
  content: string;
  className?: string;
  variant?: 'screen' | 'print';
}> = ({ content, className, variant = 'screen' }) => (
  <div
    className={cn(
      'space-y-4 text-[15px] leading-relaxed',
      variant === 'print' && 'pa-print-prose',
      className,
    )}
  >

    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2
            id={headingId(children)}
            className="mt-8 scroll-mt-24 border-b border-border/60 pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-8 text-lg font-semibold text-primary">{children}</h3>
        ),
        p: ({ children }) => <p className="text-foreground/85">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
        ul: ({ children }) => (
          <ul className="ml-1 list-disc space-y-1.5 pl-4 text-foreground/85 marker:text-primary/60">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="ml-1 list-decimal space-y-1.5 pl-4 text-foreground/85">{children}</ol>
        ),
        hr: () => <hr className="my-8 border-border/50" />,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-5 overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
        th: ({ children }) => (
          <th className="border-b border-border/70 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border/40 px-3 py-2 align-top text-foreground/85">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default PartnerAuditContent;
