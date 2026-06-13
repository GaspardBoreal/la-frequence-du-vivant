import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, UserCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/community/ThemeToggle';
import ShareButton from '@/components/share/ShareButton';

export type PublicTopBarTone = 'light' | 'dark' | 'glass' | 'auto';

interface PublicTopBarProps {
  tone?: PublicTopBarTone;
  leftSlot?: React.ReactNode;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
  shareMode?: 'native' | 'drawer';
}

const LINKEDIN_URL = 'https://www.linkedin.com/company/la-fr%C3%A9quence-du-vivant/';

/**
 * Bandeau public unifié — 4 actions (Thème, Connexion/Mon espace, Partager, LinkedIn).
 * S'adapte au fond clair Papier Crème, au fond sombre Forêt Émeraude, ou aux hero immersifs (glass).
 * Préserve l'art-direction des pages : ne touche pas au contenu en dessous, juste un sticky-top.
 */
const PublicTopBar: React.FC<PublicTopBarProps> = ({
  tone = 'auto',
  leftSlot,
  sticky = true,
  transparent = false,
  className = '',
  shareMode = 'native',
}) => {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  const resolvedTone: Exclude<PublicTopBarTone, 'auto'> =
    tone === 'auto' ? (resolvedTheme === 'dark' ? 'dark' : 'light') : tone;

  // Tone-specific styles
  const tones = {
    light: {
      wrapper: transparent
        ? 'bg-transparent'
        : 'bg-[rgba(254,253,251,0.92)] backdrop-blur-md border-b border-stone-200/50',
      iconBtn:
        'text-stone-500 hover:text-stone-800 hover:bg-stone-100/80',
      connect: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50',
      linkedin:
        'bg-emerald-50/70 ring-1 ring-emerald-200/60 text-emerald-700 hover:text-[#0A66C2] hover:bg-emerald-100 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-stone-50',
    },
    dark: {
      wrapper: transparent
        ? 'bg-transparent'
        : 'bg-[rgba(10,31,26,0.6)] backdrop-blur-xl border-b border-emerald-500/15',
      iconBtn:
        'text-emerald-100/70 hover:text-emerald-50 hover:bg-emerald-500/10',
      connect:
        'text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/15',
      linkedin:
        'bg-emerald-500/10 ring-1 ring-emerald-400/30 text-emerald-200 hover:text-[#79b8ff] hover:bg-emerald-500/20 focus-visible:ring-emerald-300/60 focus-visible:ring-offset-emerald-950',
    },
    glass: {
      wrapper: transparent
        ? 'bg-transparent'
        : 'bg-white/5 backdrop-blur-xl border-b border-white/10',
      iconBtn: 'text-white/80 hover:text-white hover:bg-white/10',
      connect: 'text-white/90 hover:text-white hover:bg-white/15',
      linkedin:
        'bg-white/10 ring-1 ring-white/20 text-white/90 hover:text-[#79b8ff] hover:bg-white/20 focus-visible:ring-white/60 focus-visible:ring-offset-transparent',
    },
  }[resolvedTone];

  const baseIcon =
    'p-2.5 rounded-xl transition-colors';
  const linkedinBase =
    'group inline-flex items-center justify-center w-9 h-9 rounded-full hover:shadow-sm hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const connectHref = user
    ? '/marches-du-vivant/mon-espace'
    : '/marches-du-vivant/connexion';
  const connectTitle = user ? 'Mon espace' : 'Connexion / Mon espace';

  return (
    <nav
      className={[
        sticky ? 'sticky top-0' : '',
        'z-50 print:hidden w-full',
        tones.wrapper,
        className,
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center">
          {leftSlot}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <Link
            to={connectHref}
            title={connectTitle}
            aria-label={connectTitle}
            className={`${baseIcon} ${tones.connect} relative`}
          >
            <UserCircle className="w-4 h-4" />
            {user && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-current/0" />
            )}
          </Link>
          <ShareButton
            mode={shareMode}
            className={`${baseIcon} ${tones.iconBtn}`}
            iconClassName="w-4 h-4"
          />
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Suivre La Fréquence du Vivant sur LinkedIn"
            title="Suivre sur LinkedIn"
            className={`${linkedinBase} ${tones.linkedin}`}
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default PublicTopBar;
