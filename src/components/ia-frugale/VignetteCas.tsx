interface Props {
  src: string;
  alt: string;
  legende: string;
}

/** Petite fenêtre de terrain posée à côté du résultat d'un simulateur. */
const VignetteCas = ({ src, alt, legende }: Props) => (
  <figure className="cc-cartouche overflow-hidden rounded-xl border border-[hsl(var(--accent-outil)/0.35)]">
    <img src={src} alt={alt} loading="lazy" className="h-28 w-full object-cover sm:h-32" />
    <figcaption className="bg-foreground/[0.04] px-3 py-2 text-[11px] leading-snug text-muted-foreground">
      {legende}
    </figcaption>
  </figure>
);

export default VignetteCas;
