import type { Season } from './CarnetTerrainFilters';

export function getSeasonFromDate(dateStr: string | null): Season {
  if (!dateStr) return 'printemps'; // default
  const month = new Date(dateStr).getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'ete';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

export function getKigoSuggestions(ville: string, season: Season): { titre: string; matin: string; soir: string }[] {
  const kigosBySeasonAndLandscape: Record<Season, { titre: string; matin: string; soir: string }[]> = {
    printemps: [
      { titre: 'Première alouette au-dessus des labours', matin: 'alouette aiguë, terre ouverte, ciel lavé', soir: 'alouette absente, champ sombre, vent ras' },
      { titre: 'Ronce en fleur au bord du chemin', matin: 'ronce neuve, bourdons pressés, doigts piqués', soir: 'ronce tiède, parfum épais, ombre lente' },
      { titre: 'Eau invisible des fossés', matin: 'filet d\'eau, moustique en suspens, joncs droits', soir: 'eau noire, grenouille rare, odeur de terre' },
      { titre: 'Mousse sur les pierres du gué', matin: 'mousse fraîche, pas glissants, reflets verts', soir: 'mousse sombre, crapaud tapi, silence humide' },
      { titre: 'Bourgeons éclatés du noisetier', matin: 'chatons dorés, pollen en suspens, lumière neuve', soir: 'branches nues encore, étoile basse, sève en marche' },
    ],
    ete: [
      { titre: 'Cigale dans le chêne', matin: 'cigale prudente, chêne en ombre, chaleur qui monte', soir: 'cigale éteinte, écorce chaude, nuit épaisse' },
      { titre: 'Herbe sèche des chemins', matin: 'herbe craquante, lézard furtif, terre blonde', soir: 'herbe tiède, grillon patient, voie lactée' },
      { titre: 'Libellule sur l\'étang', matin: 'libellule bleue, nénuphar ouvert, reflet de ciel', soir: 'libellule absente, surface lisse, brume basse' },
      { titre: 'Figue mûre au mur', matin: 'figue chaude, guêpe en cercle, pierre blanche', soir: 'figue tombée, fourmi en file, ombre fraîche' },
      { titre: 'Orage lointain sur les collines', matin: 'cumulus haut, air immobile, attente', soir: 'éclair muet, pluie au loin, odeur de terre' },
    ],
    automne: [
      { titre: 'Brume de vallée sur les vignes', matin: 'brume basse, rangs muets, pas feutrés', soir: 'brume qui remonte, dernière grive, cuivre froid' },
      { titre: 'Gland tombé sur le sentier', matin: 'gland frais, geai criard, feuilles rousses', soir: 'gland roulé, mulot pressé, obscurité précoce' },
      { titre: 'Champignon au pied du hêtre', matin: 'cèpe discret, feuille humide, odeur de sous-bois', soir: 'mycélium secret, nuit tombée, mousse phosphorescente' },
      { titre: 'Migration au-dessus de la rivière', matin: 'V lointain, cris aigus, lumière rasante', soir: 'ciel vide, courant noir, étoile du berger' },
      { titre: 'Dernière pomme à la branche', matin: 'pomme froide, rosée tardive, merle en bas', soir: 'pomme noire, vent d\'ouest, branche nue' },
    ],
    hiver: [
      { titre: 'Givre sur la haie', matin: 'épines blanches, herbe qui craque, souffle court', soir: 'givre refigé, silence dur, lune nette' },
      { titre: 'Rouge-gorge sur le piquet', matin: 'rouge-gorge seul, piquet gelé, chant bref', soir: 'piquet vide, givre bleu, étoile basse' },
      { titre: 'Fumée au-dessus du hameau', matin: 'fumée droite, toit blanc, pas dans la neige', soir: 'fumée couchée, fenêtre jaune, chien qui aboie' },
      { titre: 'Source qui ne gèle pas', matin: 'source claire, cresson vert, buée légère', soir: 'source noire, glace autour, murmure seul' },
      { titre: 'Buse en vol plané', matin: 'buse haute, champ nu, ombre glissante', soir: 'buse rentrée, peuplier noir, dernier cri' },
    ],
    all: [],
  };

  return kigosBySeasonAndLandscape[season] || kigosBySeasonAndLandscape.printemps;
}
