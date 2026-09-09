import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

/**
 * Questions/réponses factuelles de la page « étude de sol ».
 * Chaque réponse est formulée pour être citée telle quelle par les moteurs
 * et les IA. Les repères chiffrés proviennent de `etudeDeSolMethodes.ts`.
 */
export const ETUDE_SOL_FAQ: { q: string; a: string }[] = [
  {
    q: 'Comment analyser le sol de son jardin sans laboratoire ?',
    a: "On mesure quatre choses sur le terrain : la structure (test de la bêche), la texture (test du boudin, confirmé au bocal), l'acidité (bandelette ou pHmètre) et la vie biologique (comptage des vers de terre). Il faut une bêche, un bocal, de l'eau déminéralisée et une demi-journée.",
  },
  {
    q: 'Comment connaître la texture de sa terre : le test du boudin',
    a: "On roule de la terre humidifiée en un boudin d'environ 1 cm de diamètre, puis on le courbe entre les doigts. Un boudin qui ne tient pas indique environ 10 % d'argile (sol sableux) ; courbé en lune, 10 à 30 % d'argile ; refermé en cercle sans casser, plus de 30 % d'argile (sol argileux).",
  },
  {
    q: 'Comment fonctionne le test de sédimentation au bocal ?',
    a: "On remplit un bocal transparent au tiers de terre, on complète d'eau claire, on agite énergiquement et on laisse reposer 24 heures. Les particules se déposent par taille : le sable au fond, le limon au milieu, l'argile au-dessus. L'épaisseur relative des strates donne la classe de texture.",
  },
  {
    q: 'Comment mesurer le pH de son sol sans laboratoire ?',
    a: "On mélange une cuillère de terre humide à deux volumes d'eau déminéralisée, on laisse reposer dix minutes, puis on trempe une bandelette pH dans le liquide clarifié et on compare immédiatement la teinte au nuancier. L'eau du robinet, souvent calcaire, fausse le résultat et ne doit jamais être utilisée.",
  },
  {
    q: 'Combien de prélèvements faut-il faire ?',
    a: "Un seul point ne représente jamais un jardin entier. Trois à cinq points suffisent pour un jardin de particulier, davantage dès qu'il existe des zones d'usage différentes. Chaque mesure reste attachée à son point de prélèvement plutôt que d'être moyennée.",
  },
  {
    q: 'À quelle saison faire les tests ?',
    a: "Sur un sol frais, ni sec ni détrempé : le printemps et l'automne sont les meilleures périodes. Un sol gelé ou desséché fausse le test de la bêche et le comptage des vers de terre.",
  },
  {
    q: 'Faut-il tout de même une analyse de laboratoire ?',
    a: "Pas pour choisir des plantes, comprendre la circulation de l'eau ou évaluer la vie du sol. Une analyse de laboratoire reste utile pour doser précisément les éléments nutritifs ou rechercher des polluants, ce que les tests de terrain ne font pas.",
  },
  {
    q: 'Que faire quand la flore spontanée contredit les tests de sol ?',
    a: "On affiche l'écart au lieu de le lisser. Une divergence signale souvent un changement récent : apport de terre, amendement, drainage, ou modification de l'usage de la zone.",
  },
];

export const FaqEtudeSol: React.FC = () => (
  <section id="questions" className="px-5 py-16 sm:px-8 lg:py-24">
    <div className="mx-auto max-w-3xl">
      <p className="text-[12px] uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]">
        Questions fréquentes
      </p>
      <h2 className="mt-3 text-[26px] leading-tight text-[hsl(var(--ds-forest-deep))] sm:text-[32px]">
        Ce que l’on demande le plus souvent
      </h2>

      <dl className="mt-10 space-y-8">
        {ETUDE_SOL_FAQ.map((item) => (
          <div key={item.q} className="border-l-2 border-[hsl(var(--ds-forest-soft))] pl-5">
            <dt className="text-[17px] font-medium text-[hsl(var(--ds-forest-deep))]">{item.q}</dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-[hsl(var(--ds-ink-soft))]">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/frequence-jardin"
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-line))] px-5 py-2.5 text-[14px] text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest-soft))]"
        >
          <Leaf className="h-4 w-4" aria-hidden />
          Découvrir Fréquence Jardin
        </Link>
        <Link
          to="/frequence-jardin/tableau-plantes-bio-indicatrices"
          className="inline-flex items-center rounded-full border border-[hsl(var(--ds-line))] px-5 py-2.5 text-[14px] text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest-soft))]"
        >
          Tableau des plantes bio-indicatrices
        </Link>
      </div>
    </div>
  </section>
);
