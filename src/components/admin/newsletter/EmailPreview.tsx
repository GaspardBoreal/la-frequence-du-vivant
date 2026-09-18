import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderNewsletterHtml, type NewsletterBlock, type NewsletterUnivers } from '@/lib/newsletter/blocks';

interface Props {
  blocks: NewsletterBlock[];
  univers: NewsletterUnivers;
  preheader?: string | null;
}

/** Aperçu fidèle du message, en ordinateur ou en téléphone. */
export const EmailPreview: React.FC<Props> = ({ blocks, univers, preheader }) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');

  const html = React.useMemo(
    () =>
      renderNewsletterHtml({
        blocks,
        univers,
        preheader,
        unsubscribeUrl: '#',
      }),
    [blocks, univers, preheader],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant={device === 'desktop' ? 'default' : 'ghost'}
          onClick={() => setDevice('desktop')}
          className="h-8"
        >
          <Monitor className="mr-1.5 h-4 w-4" /> Ordinateur
        </Button>
        <Button
          type="button"
          size="sm"
          variant={device === 'mobile' ? 'default' : 'ghost'}
          onClick={() => setDevice('mobile')}
          className="h-8"
        >
          <Smartphone className="mr-1.5 h-4 w-4" /> Téléphone
        </Button>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border bg-muted/40 p-3">
        <iframe
          title="Aperçu de la newsletter"
          srcDoc={html}
          sandbox=""
          className="mx-auto h-[70vh] w-full rounded-lg border bg-white transition-all"
          style={{ maxWidth: device === 'mobile' ? 390 : 680 }}
        />
      </div>
    </div>
  );
};

export default EmailPreview;
