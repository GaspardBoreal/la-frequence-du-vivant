import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import type { BrandKit } from '@/lib/brandKits/types';
import '@/styles/brand-kit.css';

const BrandKitCtx = createContext<BrandKit | null>(null);
export const useBrandKit = () => useContext(BrandKitCtx);

interface Props {
  kit: BrandKit | null;
  children: React.ReactNode;
}

/**
 * Injecte les tokens du kit sous forme de variables CSS scopées à un wrapper
 * `[data-brand-kit]`, charge dynamiquement les fontes Google, et expose le kit
 * via le contexte pour les sous-composants brandés (Hero, Badges, Footer...).
 *
 * Sans kit actif, rend `children` tel quel — zéro impact.
 */
export const BrandKitProvider: React.FC<Props> = ({ kit, children }) => {
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (!kit) return;
    // Charge Google Fonts (une seule fois par montage).
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = kit.fonts.googleFontsHref;
    link.setAttribute('data-brand-kit-fonts', kit.slug);
    document.head.appendChild(link);
    linkRef.current = link;
    return () => {
      if (linkRef.current && linkRef.current.parentNode) {
        linkRef.current.parentNode.removeChild(linkRef.current);
      }
    };
  }, [kit]);

  const style = useMemo<React.CSSProperties | undefined>(() => {
    if (!kit) return undefined;
    return {
      // Vars scopées au wrapper — impossible de fuiter.
      ['--bk-bg' as any]: kit.palette.background,
      ['--bk-fg' as any]: kit.palette.foreground,
      ['--bk-accent' as any]: kit.palette.accent,
      ['--bk-accent-fg' as any]: kit.palette.accentForeground,
      ['--bk-surface' as any]: kit.palette.surface,
      ['--bk-surface-fg' as any]: kit.palette.surfaceForeground,
      ['--bk-grad-a' as any]: kit.palette.signatureGradient[0],
      ['--bk-grad-b' as any]: kit.palette.signatureGradient[1],
      ['--bk-font-logotype' as any]: `'${kit.fonts.logotype}'`,
      ['--bk-font-display' as any]: `'${kit.fonts.display}'`,
      ['--bk-font-body' as any]: `'${kit.fonts.body}'`,
    };
  }, [kit]);

  if (!kit) return <>{children}</>;

  return (
    <BrandKitCtx.Provider value={kit}>
      {kit.meta?.themeColor && (
        <Helmet>
          <meta name="theme-color" content={kit.meta.themeColor} />
          {kit.meta.ogImage && <meta property="og:image" content={kit.meta.ogImage} />}
        </Helmet>
      )}
      <div data-brand-kit={kit.slug} data-cta-shape={kit.ctaShape} style={style}>
        {children}
      </div>
    </BrandKitCtx.Provider>
  );
};
