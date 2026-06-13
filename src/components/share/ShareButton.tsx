import React, { useState, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ShareDrawer from './ShareDrawer';

interface ShareButtonProps {
  /** 'native' = Web Share API + copy fallback. 'drawer' = ouvre le Sheet riche (futurs reels). */
  mode?: 'native' | 'drawer';
  title?: string;
  url?: string;
  className?: string;
  iconClassName?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  mode = 'native',
  title,
  url,
  className = '',
  iconClassName = 'w-4 h-4',
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleClick = useCallback(async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = title || (typeof document !== 'undefined' ? document.title : 'La Fréquence du Vivant');

    if (mode === 'drawer') {
      setDrawerOpen(true);
      return;
    }

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lien copié dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  }, [mode, title, url]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Partager"
        aria-label="Partager cette page"
        className={className}
      >
        <Share2 className={iconClassName} />
      </button>
      {mode === 'drawer' && (
        <ShareDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          url={url || (typeof window !== 'undefined' ? window.location.href : '')}
          title={title}
        />
      )}
    </>
  );
};

export default ShareButton;
