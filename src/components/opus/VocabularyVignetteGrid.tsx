import React from 'react';
import { InteractiveVignette } from './InteractiveVignette';
import { Book, Waves, Wrench } from 'lucide-react';

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

const VocabularyVignetteGrid: React.FC<VocabularyVignetteGridProps> = ({
  vocabularyData,
  className = '',
  importSources
}) => {
  // Traiter et catégoriser les données
  const processVocabularyByCategory = React.useMemo(() => {
    if (!vocabularyData) return { termesLocaux: [], phenomenes: [], pratiques: [] };

    const result = {
      termesLocaux: [] as VocabularyItem[],
      phenomenes: [] as VocabularyItem[],
      pratiques: [] as VocabularyItem[]
    };

    // Si les données sont déjà structurées par catégories
    if (vocabularyData.termes_locaux || vocabularyData.phenomenes || vocabularyData.pratiques) {
      if (vocabularyData.termes_locaux) {
        result.termesLocaux = Array.isArray(vocabularyData.termes_locaux) 
          ? vocabularyData.termes_locaux 
          : Object.entries(vocabularyData.termes_locaux).map(([key, value]: [string, any]) => ({
              titre: value?.nom || value?.titre || key,
              description: value?.description || value?.definition || '',
              source_ids: value?.source_ids || [],
              metadata: { ...value, source_ids: value?.source_ids }
            }));
      }

      if (vocabularyData.phenomenes) {
        result.phenomenes = Array.isArray(vocabularyData.phenomenes) 
          ? vocabularyData.phenomenes 
          : Object.entries(vocabularyData.phenomenes).map(([key, value]: [string, any]) => ({
              titre: value?.nom || value?.titre || key,
              description: value?.description || value?.definition || '',
              source_ids: value?.source_ids || [],
              metadata: { ...value, source_ids: value?.source_ids }
            }));
      }

      if (vocabularyData.pratiques) {
        result.pratiques = Array.isArray(vocabularyData.pratiques) 
          ? vocabularyData.pratiques 
          : Object.entries(vocabularyData.pratiques).map(([key, value]: [string, any]) => ({
              titre: value?.nom || value?.titre || key,
              description: value?.description || value?.definition || '',
              source_ids: value?.source_ids || [],
              metadata: { ...value, source_ids: value?.source_ids }
            }));
      }
    } else {
      // Logique de classification automatique basée sur les noms/types existants
      Object.entries(vocabularyData).forEach(([key, value]: [string, any]) => {
        if (key === 'source_ids' || key === 'sources') return;

        const item: VocabularyItem = {
          titre: value?.nom || value?.titre || key,
          description: value?.description || value?.definition || (typeof value === 'string' ? value : ''),
          source_ids: value?.source_ids || [],
          metadata: { ...value, source_ids: value?.source_ids }
        };

        // Classification par nom/type
        const itemName = item.titre.toLowerCase();
        const itemType = value?.type?.toLowerCase() || '';

        if (['boucs', 'créa', 'gatte', 'palus', 'pibale'].some(term => itemName.includes(term)) ||
            itemType.includes('terme') || itemType.includes('local')) {
          result.termesLocaux.push(item);
        } else if (itemName.includes('crue') || itemName.includes('étiage') || itemName.includes('sécheresse') ||
                  itemName.includes('inondation') || itemName.includes('marée') || itemName.includes('tempête') ||
                  itemType.includes('phénomène') || itemType.includes('météo')) {
          result.phenomenes.push(item);
        } else if (itemName.includes('pêche') || itemName.includes('agriculture') || itemName.includes('élevage') ||
                  itemName.includes('navigation') || itemType.includes('pratique') || itemType.includes('activité')) {
          result.pratiques.push(item);
        } else {
          // Par défaut, classer comme terme local
          result.termesLocaux.push(item);
        }
      });
    }

    // Trier alphabétiquement chaque catégorie
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