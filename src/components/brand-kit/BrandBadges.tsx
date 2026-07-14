import React from 'react';
import { useBrandKit } from './BrandKitProvider';

/** Cartouche des certifications / labels partenaire. */
export const BrandBadges: React.FC<{ className?: string }> = ({ className }) => {
  const kit = useBrandKit();
  if (!kit?.badges?.length) return null;
  return (
    <div className={`bk-badges ${className ?? ''}`}>
      {kit.badges.map((b) => (
        <span key={b.label} className="bk-badges__item" title={b.label}>
          {b.imageUrl && <img src={b.imageUrl} alt="" aria-hidden />}
          <span>{b.label}</span>
        </span>
      ))}
    </div>
  );
};
