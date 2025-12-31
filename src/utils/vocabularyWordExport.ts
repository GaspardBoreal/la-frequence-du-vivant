import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

// Interfaces pour structurer les données
interface VocabularyTerm {
  terme: string;
  definition?: string;
  source?: string;
  usage?: string;
  contexte?: string;
}

interface MarcheVocabulary {
  marche_id: string;
  marche_nom: string;
  marche_ville: string;
  marche_region?: string;
  termes_locaux: VocabularyTerm[];
  phenomenes: VocabularyTerm[];
  pratiques: VocabularyTerm[];
}

/**
 * Récupère les données de vocabulaire depuis Supabase
 * Utilise deux requêtes séparées pour éviter l'erreur de clé étrangère
 */
export const fetchVocabularyData = async (): Promise<MarcheVocabulary[]> => {
  // 1. Récupérer les contextes avec vocabulaire
  const { data: contextes, error: contextesError } = await supabase
    .from('marche_contextes_hybrids')
    .select('id, marche_id, vocabulaire_local')
    .not('vocabulaire_local', 'is', null);

  if (contextesError) {
    console.error('Erreur récupération contextes:', contextesError);
    throw contextesError;
  }

  if (!contextes || contextes.length === 0) return [];

  // 2. Récupérer les IDs de marchés concernés
  const marcheIds = contextes
    .map(c => c.marche_id)
    .filter((id): id is string => Boolean(id));

  if (marcheIds.length === 0) return [];

  // 3. Récupérer les infos des marchés
  const { data: marches, error: marchesError } = await supabase
    .from('marches')
    .select('id, nom_marche, ville, region')
    .in('id', marcheIds);

  if (marchesError) {
    console.error('Erreur récupération marchés:', marchesError);
    throw marchesError;
  }

  // 4. Créer un map des marchés pour lookup rapide
  const marchesMap = new Map(
    (marches || []).map(m => [m.id, m])
  );

  // 5. Transformer et combiner les données
  // IMPORTANT: Fusionner toutes les structures possibles de vocabulaire
  // - Racine: vocab.termes_locaux, vocab.phenomenes, vocab.pratiques
  // - Donnees: vocab.donnees.termes_locaux, vocab.donnees.phenomenes, vocab.donnees.pratiques
  // - Format import: vocab.donnees.termes_hydrologiques, vocab.donnees.phenomenes_naturels, vocab.donnees.pratiques_traditionnelles
  return contextes
    .filter((item) => {
      const vocab = item.vocabulaire_local as any;
      if (!vocab) return false;
      
      const donnees = vocab.donnees || {};
      
      // Compter tous les termes de toutes les structures possibles
      const allTermesCount = (vocab.termes_locaux?.length || 0) + 
                             (donnees.termes_locaux?.length || 0) + 
                             (donnees.termes_hydrologiques?.length || 0);
      const allPhenomenesCount = (vocab.phenomenes?.length || 0) + 
                                  (donnees.phenomenes?.length || 0) + 
                                  (donnees.phenomenes_naturels?.length || 0);
      const allPratiquesCount = (vocab.pratiques?.length || 0) + 
                                 (donnees.pratiques?.length || 0) + 
                                 (donnees.pratiques_traditionnelles?.length || 0);
      
      return allTermesCount > 0 || allPhenomenesCount > 0 || allPratiquesCount > 0;
    })
    .map((item) => {
      const vocab = item.vocabulaire_local as any;
      const marche = marchesMap.get(item.marche_id);
      const donnees = vocab.donnees || {};
      
      // Fusionner toutes les sources possibles pour chaque catégorie
      const allTermesLocaux = [
        ...(vocab.termes_locaux || []),           // racine
        ...(donnees.termes_locaux || []),         // donnees.termes_locaux
        ...(donnees.termes_hydrologiques || [])   // donnees.termes_hydrologiques (format import)
      ];
      
      const allPhenomenes = [
        ...(vocab.phenomenes || []),              // racine
        ...(donnees.phenomenes || []),            // donnees.phenomenes
        ...(donnees.phenomenes_naturels || [])    // donnees.phenomenes_naturels (format import)
      ];
      
      const allPratiques = [
        ...(vocab.pratiques || []),               // racine
        ...(donnees.pratiques || []),             // donnees.pratiques
        ...(donnees.pratiques_traditionnelles || []) // donnees.pratiques_traditionnelles (format import)
      ];

      // Helper pour normaliser les termes avec différents noms de champs
      const normalizeTerm = (t: any) => ({
        terme: t.terme || t.nom || t.expression || '',
        definition: t.definition || t.description || t.phenomene_designe || '',
        source: t.source || t.source_etymologique || '',
        usage: t.usage || t.contexte_usage || t.contexte_cultural || t.savoir_faire || '',
        contexte: t.contexte || t.geolocalisation || t.periode_occurrence || t.periode_historique || '',
      });
      
      return {
        marche_id: item.marche_id,
        marche_nom: marche?.nom_marche || marche?.ville || 'Lieu inconnu',
        marche_ville: marche?.ville || '',
        marche_region: marche?.region || '',
        termes_locaux: allTermesLocaux.map(normalizeTerm),
        phenomenes: allPhenomenes.map(normalizeTerm),
        pratiques: allPratiques.map(normalizeTerm),
      };
    });
};

/**
 * Crée la page de couverture du document
 */
const createCoverPage = (totalTerms: number, marchesCount: number): Paragraph[] => {
  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    new Paragraph({
      children: [],
      spacing: { before: 4000, after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'GASPARD BORÉAL',
          bold: true,
          size: 28,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Lexique du Vocabulaire Local',
          bold: true,
          size: 56,
          color: '1a1a1a',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Mots Patois & Expressions Régionales',
          italics: true,
          size: 32,
          color: '888888',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '───────────────',
          size: 24,
          color: 'cccccc',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${totalTerms} termes`,
          bold: true,
          size: 28,
          color: '2563eb',
        }),
        new TextRun({
          text: ` • ${marchesCount} marches`,
          size: 24,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Dordogne 2025',
          size: 24,
          color: '888888',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: today,
          size: 20,
          color: 'aaaaaa',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
};

/**
 * Crée l'en-tête d'une section (marché)
 */
const createMarcheHeader = (vocabulary: MarcheVocabulary): Paragraph[] => {
  const totalTerms = 
    vocabulary.termes_locaux.length + 
    vocabulary.phenomenes.length + 
    vocabulary.pratiques.length;

  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: vocabulary.marche_nom.toUpperCase(),
          bold: true,
          size: 36,
          color: '1a1a1a',
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 100 },
      border: {
        bottom: {
          color: '2563eb',
          style: BorderStyle.SINGLE,
          size: 12,
          space: 10,
        },
      },
    }),
  ];

  // Sous-titre avec ville/région si différent du nom
  if (vocabulary.marche_ville && vocabulary.marche_ville !== vocabulary.marche_nom) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${vocabulary.marche_ville}`,
            italics: true,
            size: 22,
            color: '666666',
          }),
          vocabulary.marche_region ? new TextRun({
            text: ` • ${vocabulary.marche_region}`,
            italics: true,
            size: 20,
            color: '888888',
          }) : new TextRun({ text: '' }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${totalTerms} terme${totalTerms > 1 ? 's' : ''}`,
          size: 20,
          color: '888888',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  return paragraphs;
};

/**
 * Crée l'en-tête d'une catégorie (Termes locaux, Phénomènes, Pratiques)
 */
const createCategoryHeader = (title: string, count: number): Paragraph => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${title} `,
        bold: true,
        size: 26,
        color: '374151',
      }),
      new TextRun({
        text: `(${count})`,
        size: 22,
        color: '888888',
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 200 },
  });
};

/**
 * Crée une entrée de terme
 */
const createTermEntry = (term: VocabularyTerm): Paragraph[] => {
  const paragraphs: Paragraph[] = [];

  // Nom du terme
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: term.terme,
          bold: true,
          size: 24,
          color: '1f2937',
        }),
      ],
      spacing: { before: 150, after: 50 },
    })
  );

  // Définition
  if (term.definition) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: term.definition,
            size: 22,
            color: '4b5563',
          }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  // Usage/contexte
  if (term.usage || term.contexte) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: term.usage || term.contexte || '',
            italics: true,
            size: 20,
            color: '6b7280',
          }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  // Source
  if (term.source) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Source : ',
            size: 18,
            color: '9ca3af',
          }),
          new TextRun({
            text: term.source,
            italics: true,
            size: 18,
            color: '9ca3af',
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  return paragraphs;
};

/**
 * Crée un séparateur entre les termes
 */
const createTermSeparator = (): Paragraph => {
  return new Paragraph({
    children: [
      new TextRun({
        text: '• • •',
        size: 16,
        color: 'cccccc',
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 150 },
  });
};

/**
 * Exporte le vocabulaire patois en fichier Word
 */
export const exportVocabularyToWord = async (): Promise<void> => {
  // Récupérer les données
  const vocabularyData = await fetchVocabularyData();

  if (vocabularyData.length === 0) {
    throw new Error('Aucun vocabulaire à exporter');
  }

  // Calculer les statistiques
  const totalTerms = vocabularyData.reduce(
    (acc, v) => acc + v.termes_locaux.length + v.phenomenes.length + v.pratiques.length,
    0
  );

  // Construire les sections du document
  const sections: Paragraph[] = [];

  // Page de couverture
  sections.push(...createCoverPage(totalTerms, vocabularyData.length));

  // Pour chaque marché
  for (let i = 0; i < vocabularyData.length; i++) {
    const vocabulary = vocabularyData[i];

    // En-tête du marché
    sections.push(...createMarcheHeader(vocabulary));

    // Termes locaux
    if (vocabulary.termes_locaux.length > 0) {
      sections.push(createCategoryHeader('Termes Locaux', vocabulary.termes_locaux.length));
      
      vocabulary.termes_locaux.forEach((term, idx) => {
        sections.push(...createTermEntry(term));
        if (idx < vocabulary.termes_locaux.length - 1) {
          sections.push(createTermSeparator());
        }
      });
    }

    // Phénomènes naturels
    if (vocabulary.phenomenes.length > 0) {
      sections.push(createCategoryHeader('Phénomènes Naturels', vocabulary.phenomenes.length));
      
      vocabulary.phenomenes.forEach((term, idx) => {
        sections.push(...createTermEntry(term));
        if (idx < vocabulary.phenomenes.length - 1) {
          sections.push(createTermSeparator());
        }
      });
    }

    // Pratiques traditionnelles
    if (vocabulary.pratiques.length > 0) {
      sections.push(createCategoryHeader('Pratiques Traditionnelles', vocabulary.pratiques.length));
      
      vocabulary.pratiques.forEach((term, idx) => {
        sections.push(...createTermEntry(term));
        if (idx < vocabulary.pratiques.length - 1) {
          sections.push(createTermSeparator());
        }
      });
    }

    // Saut de page entre les marchés (sauf pour le dernier)
    if (i < vocabularyData.length - 1) {
      sections.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  }

  // Créer le document
  const doc = new Document({
    creator: 'Gaspard Boréal',
    title: 'Lexique du Vocabulaire Local',
    description: 'Mots patois et expressions régionales de Dordogne',
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Générer et télécharger
  const buffer = await Packer.toBlob(doc);
  const filename = `lexique-vocabulaire-patois-${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(buffer, filename);
};
