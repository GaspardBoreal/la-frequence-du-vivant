import React from 'react';

export const DemoFrame: React.FC<{ kicker: string; titre: string; texte: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ kicker, titre, texte, children, footer }) => (
  <figure className="rounded-xl border border-border bg-card overflow-hidden break-inside-avoid">
    <div className="p-5 pb-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary">{kicker}</p>
      <h3 className="font-serif text-xl mt-1">{titre}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{texte}</p>
    </div>
    <div className="relative">{children}</div>
    {footer && <figcaption className="px-5 py-3 border-t border-border text-sm">{footer}</figcaption>}
  </figure>
);

export const DEMO_CSS = `
.cad-anim{animation-play-state:paused}
.cad-on .cad-anim{animation-play-state:running}
@keyframes cad-bat{0%{offset-distance:0%}100%{offset-distance:100%}}
@keyframes cad-ring{0%{r:2;opacity:.8}100%{r:34;opacity:0}}
@keyframes cad-prey{0%,40%{opacity:1}55%,100%{opacity:0}}
@keyframes cad-rain{0%{transform:translateY(-20px);opacity:0}20%{opacity:.9}100%{transform:translateY(90px);opacity:0}}
@keyframes cad-bee{0%{offset-distance:0%}100%{offset-distance:100%}}
@keyframes cad-alert{0%,100%{opacity:.35}50%{opacity:.95}}
@keyframes cad-flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4)}}
@media (prefers-reduced-motion:reduce){.cad-anim{animation:none!important}}
@media print{.cad-anim{animation:none!important}.cad-hide-print{display:none!important}}
`;

export const Legende: React.FC = () => (
  <span className="text-xs text-muted-foreground italic">Valeurs d’illustration, pas des mesures réelles.</span>
);
