import React from 'react';
import { InteractiveVignette } from './InteractiveVignette';
import { Book, Waves, Wrench } from 'lucide-react';
import { processVocabularyData } from '@/utils/vocabularyDataUtils';

interface VocabularyVignetteGridProps {
  vocabularyData: any;
  className?: string;
  importSources: any[];
}

interface VocabularyItem {
  titre: string;
  nom?: string;
  description?: string;
  definition?: string;
  type?: string;
  source_ids?: string[];
  metadata?: any;
}

const EXCLUDED_TECH_KEYS = new Set(['description', 'donnees', 'metadata', 'source_ids', 'sources']);

const VocabularyVignetteGrid: React.FC<VocabularyVignetteGridProps> = ({
  vocabularyData,
  className = '',
  importSources
}) => {
  // Traiter et catégoriser les données
  const processVocabularyByCategory = React.useMemo(() => {
    const dataToProcess = vocabularyData?.donnees || vocabularyData;
    if (!dataToProcess) return { termesLocaux: [], phenomenes: [], pratiques: [] };

    const result = {
      termesLocaux: [] as VocabularyItem[],
      phenomenes: [] as VocabularyItem[],
      pratiques: [] as VocabularyItem[]
    };

    // Gestion directe des formats déjà catégorisés
    if (dataToProcess.termes_locaux || dataToProcess.phenomenes || dataToProcess.pratiques) {
      // Format déjà organisé
      const processSection = (items: any[], targetCategory: 'termesLocaux' | 'phenomenes' | 'pratiques') => {
        items?.forEach((item: any) => {
          result[targetCategory].push({
            titre: item.nom || item.terme || item.titre || item.expression || '',
            description: item.description || item.definition || item.details || '',
            source_ids: item.source_ids || item.metadata?.source_ids || [],
            metadata: item.metadata || item
          });
        });
      };

      processSection(dataToProcess.termes_locaux, 'termesLocaux');
      processSection(dataToProcess.phenomenes, 'phenomenes');
      processSection(dataToProcess.pratiques, 'pratiques');
    } else {
      // Traitement avec catégorisation automatique basée sur les clés
      Object.entries(dataToProcess).forEach(([key, items]) => {
        if (!Array.isArray(items) || key === 'source_ids' || key === 'sources') return;

        const keyLower = key.toLowerCase();
        let targetCategory: 'termesLocaux' | 'phenomenes' | 'pratiques' = 'termesLocaux';

        // Déterminer la catégorie basée sur la clé de section
        if (keyLower.includes('phenomen') || keyLower.includes('phénom') || 
            keyLower.includes('naturel') || keyLower.includes('climat') || keyLower.includes('meteo')) {
          targetCategory = 'phenomenes';
        } else if (keyLower.includes('pratique') || keyLower.includes('activit') || 
                   keyLower.includes('usage') || keyLower.includes('agr') || keyLower.includes('tradition')) {
          targetCategory = 'pratiques';
        } else if (keyLower.includes('terme') || keyLower.includes('hydrologique') || keyLower.includes('vocabulaire')) {
          targetCategory = 'termesLocaux';
        }

        items.forEach((item: any) => {
          // Fallback sur le type de l'item si pas de catégorisation claire par clé
          const itemType = (item.type || '').toLowerCase();
          let finalCategory = targetCategory;
          
          if (itemType.includes('phenomen') || itemType.includes('phénom')) {
            finalCategory = 'phenomenes';
          } else if (itemType.includes('pratique') || itemType.includes('activit')) {
            finalCategory = 'pratiques';
          } else if (itemType.includes('terme')) {
            finalCategory = 'termesLocaux';
          }

          result[finalCategory].push({
            titre: item.nom || item.terme || item.titre || item.expression || '',
            description: item.description || item.definition || item.details || item.phenomene || '',
            source_ids: item.source_ids || item.metadata?.source_ids || [],
            metadata: { ...item, originalKey: key }
          });
        });
      });

      // Traitement avec l'utilitaire existant en fallback
      const normalized = processVocabularyData(dataToProcess);
      if (result.termesLocaux.length === 0 && result.phenomenes.length === 0 && result.pratiques.length === 0) {
        const terms = (normalized as any)?.termes || [];
        terms.forEach((t: any) => {
          const type = (t.type || '').toLowerCase();
          const category = (t.category || '').toLowerCase();
          const meta = t.metadata || {};
          const item: VocabularyItem = {
            titre: t.titre,
            description: t.description_courte || t.details || '',
            source_ids: meta.source_ids || meta.sources || meta.sources_ids || [],
            metadata: meta
          };

          const typecat = `${type} ${category}`;
          if (typecat.includes('phenomen') || typecat.includes('phénom') || typecat.includes('meteo') || typecat.includes('climat')) {
            result.phenomenes.push(item);
          } else if (
            typecat.includes('pratique') || typecat.includes('activité') || typecat.includes('agri') ||
            typecat.includes('pêche') || typecat.includes('navigation') || typecat.includes('usage')
          ) {
            result.pratiques.push(item);
          } else {
            result.termesLocaux.push(item);
          }
        });
      }
    }

    // Fallback: si aucune catégorie secondaire n'a été détectée, tout afficher en termes locaux
    const total = result.termesLocaux.length + result.phenomenes.length + result.pratiques.length;
    if (total === 0) {
      // Utiliser processVocabularyData comme dernier recours
      const normalized = processVocabularyData(dataToProcess);
      const terms = (normalized as any)?.termes || [];
      if (terms.length > 0) {
        result.termesLocaux = terms.map((t: any) => ({
          titre: t.titre,
          description: t.description_courte || t.details || '',
          source_ids: (t.metadata?.source_ids || t.metadata?.sources || t.metadata?.sources_ids || []),
          metadata: t.metadata || {}
        }));
      }
    }

    // Trier alphabétiquement
    result.termesLocaux.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
    result.phenomenes.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));
    result.pratiques.sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }));

    return result;
  }, [vocabularyData]);

  const renderVocabularySection = (
    title: string,
    items: VocabularyItem[],
    icon: React.ReactNode,
    color: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/30">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {items.length} élément{items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <InteractiveVignette
              key={`${title}-${index}`}
              data={{
                titre: item.titre,
                description_courte: item.description || '',
                type: 'vocabulaire',
                details: item.description || '',
                category: title.toLowerCase().replace(' ', '_'),
                metadata: item.metadata
              }}
              variant="vocabulary"
              importSources={importSources}
            />
          ))}
        </div>
      </div>
    );
  };

  const totalItems = processVocabularyByCategory.termesLocaux.length + 
                    processVocabularyByCategory.phenomenes.length + 
                    processVocabularyByCategory.pratiques.length;

  if (totalItems === 0) {
    return (
      <div className={`p-8 text-center border-2 border-dashed border-border/50 rounded-lg ${className}`}>
        <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Aucun vocabulaire local
        </h3>
        <p className="text-muted-foreground">
          Aucun terme, phénomène ou pratique n'a été identifié pour ce territoire.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Vocabulaire local
        </h2>
        <p className="text-muted-foreground">
          {totalItems} éléments identifiés, organisés par catégorie
        </p>
      </div>

      {/* Rupture 1 : Termes locaux */}
      {renderVocabularySection(
        'Termes locaux',
        processVocabularyByCategory.termesLocaux,
        <Book className="h-5 w-5 text-blue-600" />,
        'bg-blue-100 text-blue-600'
      )}

      {/* Rupture 2 : Phénomènes */}
      {renderVocabularySection(
        'Phénomènes',
        processVocabularyByCategory.phenomenes,
        <Waves className="h-5 w-5 text-cyan-600" />,
        'bg-cyan-100 text-cyan-600'
      )}

      {/* Rupture 3 : Pratiques */}
      {renderVocabularySection(
        'Pratiques',
        processVocabularyByCategory.pratiques,
        <Wrench className="h-5 w-5 text-green-600" />,
        'bg-green-100 text-green-600'
      )}
    </div>
  );
};

export default VocabularyVignetteGrid;