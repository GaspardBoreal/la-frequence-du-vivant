import React from 'react';
import { useBrandKit } from './BrandKitProvider';

/** Signature de bas de page : logotype partenaire + mention + réseaux sociaux. */
export const BrandFooterSignature: React.FC = () => {
  const kit = useBrandKit();
  if (!kit) return null;
  const socials = kit.socials ?? {};
  return (
    <footer className="bk-footer-signature">
      <div className="bk-partner">{kit.partner}</div>
      {kit.footerSignature && (
        <p className="mt-2 text-sm max-w-2xl mx-auto opacity-80">{kit.footerSignature}</p>
      )}
      <div className="bk-socials">
        {socials.website && <a href={socials.website} target="_blank" rel="noopener noreferrer">Site officiel</a>}
        {socials.instagram && <a href={socials.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
        {socials.facebook && <a href={socials.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
        {socials.tripadvisor && <a href={socials.tripadvisor} target="_blank" rel="noopener noreferrer">TripAdvisor</a>}
      </div>
    </footer>
  );
};
