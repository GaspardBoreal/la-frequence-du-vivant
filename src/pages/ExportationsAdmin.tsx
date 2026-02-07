import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, FileText, Table, Download, Filter, Loader2, ChevronDown, ChevronRight, MapPin, BookOpen, AlertTriangle, AlertCircle, ExternalLink, BarChart3, Sparkles, Plus, X, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportTextesToWord, exportTextesToCSV, KEYWORD_CATEGORIES } from '@/utils/wordExportUtils';
import { exportVocabularyToWord } from '@/utils/vocabularyWordExport';
import { exportMarchesStatsToWord } from '@/utils/marchesStatsExport';
import WordExportPreview from '@/components/admin/WordExportPreview';
import EpubExportPanel from '@/components/admin/EpubExportPanel';
import PdfExportPanel from '@/components/admin/PdfExportPanel';
import EditorExportPanel from '@/components/admin/EditorExportPanel';
import { Input } from '@/components/ui/input';
interface Exploration {
  id: string;
  name: string;
  slug: string;
}

interface Marche {
  id: string;
  nom_marche: string | null;
  ville: string;
  region: string | null;
  date: string | null;
}

interface TexteWithDetails {
  id: string;
  titre: string;
  contenu: string;
  type_texte: string;
  marche_id: string;
  ordre: number | null;
  created_at: string;
  marche_nom?: string;
  marche_ville?: string;
  marche_region?: string;
  marche_date?: string;
  partie_id?: string;
  partie_numero_romain?: string;
  partie_titre?: string;
  partie_sous_titre?: string;
  partie_ordre?: number;
}

interface ExplorationMarcheLink {
  exploration_id: string;
  marche_id: string;
}

const TEXT_TYPES = [
  { id: 'haiku', label: 'Haïku' },
  { id: 'senryu', label: 'Senryū' },
  { id: 'poeme', label: 'Poème' },
  { id: 'haibun', label: 'Haïbun' },
  { id: 'texte-libre', label: 'Texte libre' },
  { id: 'fable', label: 'Fable' },
  { id: 'fragment', label: 'Fragment' },
  { id: 'essai-bref', label: 'Essai bref' },
  { id: 'dialogue-polyphonique', label: 'Dialogue polyphonique' },
  { id: 'carte-poetique', label: 'Carte poétique' },
  { id: 'prose', label: 'Prose' },
  { id: 'carnet', label: 'Carnet de terrain' },
  { id: 'correspondance', label: 'Correspondance' },
  { id: 'manifeste', label: 'Manifeste' },
  { id: 'glossaire', label: 'Glossaire poétique' },
  { id: 'protocole', label: 'Protocole hybride' },
  { id: 'synthese', label: 'Synthèse IA-Humain' },
  { id: 'recit-donnees', label: 'Récit-données' },
  { id: 'recit', label: 'Récit' },
];

const REGIONS = [
  'NOUVELLE-AQUITAINE',
  'OCCITANIE',
  'AUVERGNE-RHÔNE-ALPES',
  'ÎLE-DE-FRANCE',
  'BRETAGNE',
  'PROVENCE-ALPES-CÔTE D\'AZUR',
  'CORSE',
];

const ExportationsAdmin: React.FC = () => {
  // Data state
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [marches, setMarches] = useState<Marche[]>([]);
  const [allTextes, setAllTextes] = useState<TexteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingVocabulary, setExportingVocabulary] = useState(false);
  const [exportingStats, setExportingStats] = useState(false);
  const [selectedStatsExploration, setSelectedStatsExploration] = useState<string>('');
  
  // Exploration ↔ Marche links
  const [explorationMarchesMap, setExplorationMarchesMap] = useState<Map<string, Set<string>>>(new Map());
  const [marcheExplorationsMap, setMarcheExplorationsMap] = useState<Map<string, Set<string>>>(new Map());

  // Filter state
  const [selectedExplorations, setSelectedExplorations] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(TEXT_TYPES.map(t => t.id)));
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set(REGIONS));
  const [selectedMarches, setSelectedMarches] = useState<Set<string>>(new Set());

  // Collapsible state
  const [explorationsOpen, setExplorationsOpen] = useState(true);
  const [marchesOpen, setMarchesOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(true);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [keywordIndexOpen, setKeywordIndexOpen] = useState(false);

  // Export options state
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [organizationMode, setOrganizationMode] = useState<'type' | 'marche'>('type');
  
  // Contact info state (for cover page)
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Keyword index state
  const [includeKeywordIndex, setIncludeKeywordIndex] = useState(true);
  const [selectedKeywordCategories, setSelectedKeywordCategories] = useState<Set<string>>(
    new Set(KEYWORD_CATEGORIES.map(c => c.id))
  );
  const [customKeywords, setCustomKeywords] = useState('');
  const [savedKeywords, setSavedKeywords] = useState<{ keyword: string; category: string }[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [suggestingKeywords, setSuggestingKeywords] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('faune');

  // Load data function - extracted to allow refresh
  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // Load explorations
      const { data: exploData } = await supabase
        .from('explorations')
        .select('id, name, slug')
        .order('name');
      
      // Load exploration_marches links with partie info AND marche ordre
      const { data: exploMarchesData } = await supabase
        .from('exploration_marches')
        .select(`
          exploration_id, 
          marche_id, 
          partie_id,
          ordre,
          exploration_parties (
            id,
            numero_romain,
            titre,
            sous_titre,
            ordre
          )
        `);

      // Build parties map: marche_id → partie info + marche ordre
      const marcheToPartie = new Map<string, {
        partie_id: string;
        numero_romain: string;
        titre: string;
        sous_titre: string | null;
        ordre: number;
        marche_ordre: number;
      }>();
      
      if (exploMarchesData) {
        exploMarchesData.forEach((link: any) => {
          if (link.partie_id && link.exploration_parties) {
            const partie = link.exploration_parties;
            marcheToPartie.set(link.marche_id, {
              partie_id: partie.id,
              numero_romain: partie.numero_romain,
              titre: partie.titre,
              sous_titre: partie.sous_titre,
              ordre: partie.ordre,
              marche_ordre: link.ordre ?? 999,
            });
          }
        });
      }

      // Build maps
      const expToMarches = new Map<string, Set<string>>();
      const marcheToExps = new Map<string, Set<string>>();
      
      if (exploMarchesData) {
        exploMarchesData.forEach((link: any) => {
          // Exploration → Marches
          if (!expToMarches.has(link.exploration_id)) {
            expToMarches.set(link.exploration_id, new Set());
          }
          expToMarches.get(link.exploration_id)!.add(link.marche_id);
          
          // Marche → Explorations
          if (!marcheToExps.has(link.marche_id)) {
            marcheToExps.set(link.marche_id, new Set());
          }
          marcheToExps.get(link.marche_id)!.add(link.exploration_id);
        });
      }
      
      setExplorationMarchesMap(expToMarches);
      setMarcheExplorationsMap(marcheToExps);
      
      if (exploData) {
        setExplorations(exploData);
        if (!isRefresh) {
          setSelectedExplorations(new Set(exploData.map(e => e.id)));
        }
      }

      // Load marches (sorted by date for chronological order)
      const { data: marchesData } = await supabase
        .from('marches')
        .select('id, nom_marche, ville, region, date')
        .order('date', { ascending: true });
      
      if (marchesData) {
        setMarches(marchesData);
        if (!isRefresh) {
          setSelectedMarches(new Set(marchesData.map(m => m.id)));
        }
      }

      // Load all textes with marche info
      const { data: textesData } = await supabase
        .from('marche_textes')
        .select(`
          id,
          titre,
          contenu,
          type_texte,
          marche_id,
          ordre,
          created_at
        `)
        .order('ordre', { ascending: true });

      if (textesData && marchesData) {
        const marchesMap = new Map(marchesData.map(m => [m.id, m]));
        const enrichedTextes = textesData.map(t => {
          const marche = marchesMap.get(t.marche_id);
          const partie = marcheToPartie.get(t.marche_id);
          return {
            ...t,
            marche_nom: marche?.nom_marche || undefined,
            marche_ville: marche?.ville,
            marche_region: marche?.region || undefined,
            marche_date: marche?.date || undefined,
            partie_id: partie?.partie_id,
            partie_numero_romain: partie?.numero_romain,
            partie_titre: partie?.titre,
            partie_sous_titre: partie?.sous_titre || undefined,
            partie_ordre: partie?.ordre,
            marche_ordre: partie?.marche_ordre,
          };
        });
        setAllTextes(enrichedTextes);
      }
      
      if (isRefresh) {
        toast.success('Données rafraîchies');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load saved keywords from database
  useEffect(() => {
    const loadSavedKeywords = async () => {
      setLoadingKeywords(true);
      try {
        const { data, error } = await supabase
          .from('export_keywords')
          .select('keyword, category')
          .order('category', { ascending: true })
          .order('keyword', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setSavedKeywords(data.map(k => ({ keyword: k.keyword, category: k.category })));
          // Pre-populate the custom keywords input with all saved keywords
          setCustomKeywords(data.map(k => k.keyword).join(', '));
        }
      } catch (error) {
        console.error('Error loading saved keywords:', error);
      } finally {
        setLoadingKeywords(false);
      }
    };

    loadSavedKeywords();
  }, []);

  // Get marches available based on selected explorations
  const availableMarches = useMemo(() => {
    if (selectedExplorations.size === 0) {
      return marches;
    }
    
    const availableMarcheIds = new Set<string>();
    selectedExplorations.forEach(expId => {
      explorationMarchesMap.get(expId)?.forEach(marcheId => {
        availableMarcheIds.add(marcheId);
      });
    });
    
    return marches.filter(m => availableMarcheIds.has(m.id));
  }, [marches, selectedExplorations, explorationMarchesMap]);

  // Count textes per marche
  const textesPerMarche = useMemo(() => {
    const counts = new Map<string, number>();
    allTextes.forEach(t => {
      counts.set(t.marche_id, (counts.get(t.marche_id) || 0) + 1);
    });
    return counts;
  }, [allTextes]);

  // Count textes per exploration
  const textesPerExploration = useMemo(() => {
    const counts = new Map<string, number>();
    explorations.forEach(exp => {
      const marcheIds = explorationMarchesMap.get(exp.id) || new Set();
      let count = 0;
      marcheIds.forEach(marcheId => {
        count += textesPerMarche.get(marcheId) || 0;
      });
      counts.set(exp.id, count);
    });
    return counts;
  }, [explorations, explorationMarchesMap, textesPerMarche]);

  // Filter textes based on selections
  const filteredTextes = useMemo(() => {
    return allTextes.filter(texte => {
      // Filter by marche (which includes exploration filter implicitly)
      if (!selectedMarches.has(texte.marche_id)) {
        return false;
      }
      
      // Check if marche belongs to a selected exploration (or is orphan when all selected)
      const marcheExplorations = marcheExplorationsMap.get(texte.marche_id);
      if (marcheExplorations && marcheExplorations.size > 0) {
        const hasSelectedExploration = Array.from(marcheExplorations).some(
          expId => selectedExplorations.has(expId)
        );
        if (!hasSelectedExploration) {
          return false;
        }
      }

      // Filter by type
      if (!selectedTypes.has(texte.type_texte.toLowerCase())) {
        return false;
      }

      // Filter by region
      if (texte.marche_region && !selectedRegions.has(texte.marche_region)) {
        return false;
      }

      return true;
    });
  }, [allTextes, selectedExplorations, selectedMarches, selectedTypes, selectedRegions, marcheExplorationsMap]);

  // Statistics
  const stats = useMemo(() => {
    const totalChars = filteredTextes.reduce((sum, t) => sum + t.contenu.length, 0);
    const estimatedWords = Math.round(totalChars / 5);
    const typeCount = new Map<string, number>();
    filteredTextes.forEach(t => {
      const type = t.type_texte.toLowerCase();
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    // Compter les marches uniques contenant des textes filtrés
    const uniqueMarcheIds = new Set(filteredTextes.map(t => t.marche_id));
    
    // Compter les explorations uniques contenant des textes filtrés
    const uniqueExplorationIds = new Set<string>();
    uniqueMarcheIds.forEach(marcheId => {
      const explorations = marcheExplorationsMap.get(marcheId);
      if (explorations) {
        explorations.forEach(expId => {
          if (selectedExplorations.has(expId)) {
            uniqueExplorationIds.add(expId);
          }
        });
      }
    });

    return {
      total: filteredTextes.length,
      chars: totalChars,
      words: estimatedWords,
      byType: typeCount,
      uniqueMarches: uniqueMarcheIds.size,
      uniqueExplorations: uniqueExplorationIds.size,
    };
  }, [filteredTextes, marcheExplorationsMap, selectedExplorations]);

  // Toggle handlers with intelligent sync
  const toggleExploration = (id: string) => {
    const newExploSet = new Set(selectedExplorations);
    const newMarcheSet = new Set(selectedMarches);
    
    if (newExploSet.has(id)) {
      newExploSet.delete(id);
      // Remove marches that only belong to this exploration
      explorationMarchesMap.get(id)?.forEach(marcheId => {
        const marcheExps = marcheExplorationsMap.get(marcheId);
        if (marcheExps) {
          const otherSelectedExps = Array.from(marcheExps).filter(
            expId => expId !== id && newExploSet.has(expId)
          );
          if (otherSelectedExps.length === 0) {
            newMarcheSet.delete(marcheId);
          }
        }
      });
    } else {
      newExploSet.add(id);
      // Add all marches from this exploration
      explorationMarchesMap.get(id)?.forEach(marcheId => {
        newMarcheSet.add(marcheId);
      });
    }
    
    setSelectedExplorations(newExploSet);
    setSelectedMarches(newMarcheSet);
  };

  const toggleMarche = (id: string) => {
    const newSet = new Set(selectedMarches);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMarches(newSet);
  };

  const toggleType = (id: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTypes(newSet);
  };

  const toggleRegion = (region: string) => {
    const newSet = new Set(selectedRegions);
    if (newSet.has(region)) {
      newSet.delete(region);
    } else {
      newSet.add(region);
    }
    setSelectedRegions(newSet);
  };

  // Select/Clear all handlers
  const selectAllExplorations = () => {
    setSelectedExplorations(new Set(explorations.map(e => e.id)));
    setSelectedMarches(new Set(marches.map(m => m.id)));
  };
  const clearAllExplorations = () => {
    setSelectedExplorations(new Set());
    setSelectedMarches(new Set());
  };

  const selectAllMarches = () => {
    setSelectedMarches(new Set(availableMarches.map(m => m.id)));
  };
  const clearAllMarches = () => {
    setSelectedMarches(new Set());
  };

  const selectAllTypes = () => setSelectedTypes(new Set(TEXT_TYPES.map(t => t.id)));
  const clearAllTypes = () => setSelectedTypes(new Set());
  
  const selectAllRegions = () => setSelectedRegions(new Set(REGIONS));
  const clearAllRegions = () => setSelectedRegions(new Set());

  // Keyword category toggle
  const toggleKeywordCategory = (categoryId: string) => {
    const newSet = new Set(selectedKeywordCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedKeywordCategories(newSet);
  };

  const selectAllKeywordCategories = () => {
    setSelectedKeywordCategories(new Set(KEYWORD_CATEGORIES.map(c => c.id)));
  };

  const clearAllKeywordCategories = () => {
    setSelectedKeywordCategories(new Set());
  };

  // Parse custom keywords from comma-separated string
  const getCustomKeywordsArray = useCallback((): string[] => {
    return customKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
  }, [customKeywords]);

  // Get all existing keywords (predefined + saved)
  const getAllExistingKeywords = useCallback((): string[] => {
    const predefinedKeywords = KEYWORD_CATEGORIES.flatMap(c => c.keywords);
    const savedKeywordStrings = savedKeywords.map(k => k.keyword);
    return [...predefinedKeywords, ...savedKeywordStrings, ...getCustomKeywordsArray()];
  }, [savedKeywords, getCustomKeywordsArray]);

  // Save a keyword to database with category
  const saveKeyword = async (keyword: string, category: string = selectedCategory) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword || savedKeywords.some(k => k.keyword === normalizedKeyword)) return;

    try {
      const { error } = await supabase
        .from('export_keywords')
        .insert({ keyword: normalizedKeyword, category });
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.info(`"${normalizedKeyword}" existe déjà`);
          return;
        }
        throw error;
      }
      
      const categoryLabel = KEYWORD_CATEGORIES.find(c => c.id === category)?.label || category;
      setSavedKeywords(prev => [...prev, { keyword: normalizedKeyword, category }]);
      setCustomKeywords(prev => prev ? `${prev}, ${normalizedKeyword}` : normalizedKeyword);
      toast.success(`"${normalizedKeyword}" ajouté à "${categoryLabel}"`);
    } catch (error) {
      console.error('Error saving keyword:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Delete a saved keyword
  const deleteKeyword = async (keyword: string) => {
    try {
      const { error } = await supabase
        .from('export_keywords')
        .delete()
        .eq('keyword', keyword);
      
      if (error) throw error;
      
      setSavedKeywords(prev => prev.filter(k => k.keyword !== keyword));
      setCustomKeywords(prev => 
        prev.split(',')
          .map(k => k.trim())
          .filter(k => k.toLowerCase() !== keyword.toLowerCase())
          .join(', ')
      );
      toast.success(`Mot-clé "${keyword}" supprimé`);
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Add new keyword from input
  const handleAddKeyword = () => {
    if (newKeywordInput.trim()) {
      saveKeyword(newKeywordInput);
      setNewKeywordInput('');
    }
  };

  // Accept a suggested keyword
  const acceptSuggestion = (keyword: string) => {
    saveKeyword(keyword);
    setSuggestedKeywords(prev => prev.filter(k => k !== keyword));
  };

  // Dismiss a suggestion
  const dismissSuggestion = (keyword: string) => {
    setSuggestedKeywords(prev => prev.filter(k => k !== keyword));
  };

  // Request AI suggestions
  const handleSuggestKeywords = async () => {
    if (filteredTextes.length === 0) {
      toast.error('Sélectionnez des textes pour obtenir des suggestions');
      return;
    }

    setSuggestingKeywords(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-keywords', {
        body: {
          textes: filteredTextes.slice(0, 50).map(t => ({
            titre: t.titre,
            contenu: t.contenu,
            type_texte: t.type_texte,
          })),
          existingKeywords: getAllExistingKeywords(),
        },
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestedKeywords(data.suggestions);
        if (data.suggestions.length === 0) {
          toast.info('Aucun nouveau mot-clé suggéré');
        } else {
          toast.success(`${data.suggestions.length} nouveaux mots-clés suggérés`);
        }
      }
    } catch (error) {
      console.error('Error suggesting keywords:', error);
      toast.error('Erreur lors de la suggestion IA');
    } finally {
      setSuggestingKeywords(false);
    }
  };

  // Export handlers
  const handleExportWord = async () => {
    if (filteredTextes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    setExporting(true);
    try {
      // Determine export title: use exploration name if exactly one is selected
      let exportTitle = 'Textes Littéraires - Gaspard Boréal';
      if (selectedExplorations.size === 1) {
        const selectedExpId = Array.from(selectedExplorations)[0];
        const selectedExp = explorations.find(e => e.id === selectedExpId);
        if (selectedExp) {
          exportTitle = selectedExp.name;
        }
      }

      await exportTextesToWord(filteredTextes, {
        title: exportTitle,
        includeCoverPage,
        includeTableOfContents,
        includeMetadata,
        organizationMode,
        includeKeywordIndex,
        selectedKeywordCategories: Array.from(selectedKeywordCategories),
        customKeywords: getCustomKeywordsArray(),
        categorizedCustomKeywords: savedKeywords,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });
      toast.success(`${filteredTextes.length} textes exportés au format Word`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredTextes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    try {
      exportTextesToCSV(filteredTextes);
      toast.success(`${filteredTextes.length} textes exportés au format CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleExportVocabulary = async () => {
    setExportingVocabulary(true);
    try {
      await exportVocabularyToWord();
      toast.success('Lexique patois exporté avec succès');
    } catch (error) {
      console.error('Vocabulary export error:', error);
      toast.error('Erreur lors de l\'export du lexique');
    } finally {
      setExportingVocabulary(false);
    }
  };

  const handleExportMarchesStats = async () => {
    if (!selectedStatsExploration) {
      toast.error('Veuillez sélectionner une exploration');
      return;
    }

    setExportingStats(true);
    try {
      await exportMarchesStatsToWord(selectedStatsExploration);
      const explorationName = explorations.find(e => e.id === selectedStatsExploration)?.name || 'Exploration';
      toast.success(`Statistiques de "${explorationName}" exportées avec succès`);
    } catch (error) {
      console.error('Stats export error:', error);
      toast.error('Erreur lors de l\'export des statistiques');
    } finally {
      setExportingStats(false);
    }
  };

  const formatMarcheDate = (date: string | null) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <FileDown className="h-8 w-8 text-accent" />
            Centre d'Exportation
          </h1>
          <p className="text-muted-foreground">
            Exportez vos contenus littéraires en différents formats
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Textes sélectionnés</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{stats.uniqueExplorations}/{explorations.length}</div>
              <div className="text-sm text-muted-foreground">Explorations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{stats.uniqueMarches}/{marches.length}</div>
              <div className="text-sm text-muted-foreground">Marches</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">~{stats.words.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Mots estimés</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Filters Column */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Explorations Filter */}
                <Collapsible open={explorationsOpen} onOpenChange={setExplorationsOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                      {explorationsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <BookOpen className="h-4 w-4" />
                      Explorations
                      <Badge variant="secondary" className="text-xs ml-1">
                        {selectedExplorations.size}/{explorations.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllExplorations}
                        className="text-xs text-primary hover:underline"
                      >
                        Toutes
                      </button>
                      <button 
                        onClick={clearAllExplorations}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Aucune
                      </button>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <ScrollArea className="h-[180px] pr-4">
                      <div className="space-y-2">
                        {explorations.map(exp => {
                          const count = textesPerExploration.get(exp.id) || 0;
                          const hasMarches = (explorationMarchesMap.get(exp.id)?.size || 0) > 0;
                          const isEmpty = count === 0;
                          return (
                            <div key={exp.id} className={`flex items-center gap-2 ${isEmpty ? 'opacity-60' : ''}`}>
                              <Checkbox
                                id={`exp-${exp.id}`}
                                checked={selectedExplorations.has(exp.id)}
                                onCheckedChange={() => toggleExploration(exp.id)}
                              />
                              <Label 
                                htmlFor={`exp-${exp.id}`} 
                                className="text-sm flex-1 cursor-pointer truncate"
                                title={exp.name}
                              >
                                {exp.name}
                              </Label>
                              {!hasMarches && (
                                <span title="Aucune marche associée">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                              <Badge 
                                variant={count > 0 ? "outline" : "secondary"} 
                                className={`text-xs shrink-0 ${count === 0 ? 'text-muted-foreground' : ''}`}
                              >
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Marches Filter */}
                <Collapsible open={marchesOpen} onOpenChange={setMarchesOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                      {marchesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <MapPin className="h-4 w-4" />
                      Marches
                      <Badge variant="secondary" className="text-xs ml-1">
                        {selectedMarches.size}/{availableMarches.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllMarches}
                        className="text-xs text-primary hover:underline"
                      >
                        Toutes
                      </button>
                      <button 
                        onClick={clearAllMarches}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Aucune
                      </button>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <ScrollArea className="h-[220px] pr-4">
                      <div className="space-y-2">
                        {availableMarches.map(marche => {
                          const count = textesPerMarche.get(marche.id) || 0;
                          const displayName = marche.nom_marche || marche.ville;
                          const dateStr = formatMarcheDate(marche.date);
                          const isEmpty = count === 0;
                          return (
                            <div key={marche.id} className={`flex items-start gap-2 ${isEmpty ? 'opacity-60' : ''}`}>
                              <Checkbox
                                id={`marche-${marche.id}`}
                                checked={selectedMarches.has(marche.id)}
                                onCheckedChange={() => toggleMarche(marche.id)}
                                className="mt-0.5"
                              />
                              <Label 
                                htmlFor={`marche-${marche.id}`} 
                                className="text-sm flex-1 cursor-pointer"
                              >
                                <span className="block truncate" title={displayName}>
                                  {displayName}
                                </span>
                                {dateStr && (
                                  <span className="text-xs text-muted-foreground">
                                    {dateStr}
                                  </span>
                                )}
                              </Label>
                              <Badge 
                                variant={count > 0 ? "outline" : "secondary"} 
                                className={`text-xs shrink-0 ${count === 0 ? 'text-muted-foreground' : ''}`}
                              >
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Types Filter */}
                <Collapsible open={typesOpen} onOpenChange={setTypesOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                      {typesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Types de texte
                      <Badge variant="secondary" className="text-xs ml-1">
                        {selectedTypes.size}/{TEXT_TYPES.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllTypes}
                        className="text-xs text-primary hover:underline"
                      >
                        Tous
                      </button>
                      <button 
                        onClick={clearAllTypes}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Aucun
                      </button>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <div className="space-y-2">
                      {TEXT_TYPES.map(type => {
                        const count = stats.byType.get(type.id) || 0;
                        return (
                          <div key={type.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`type-${type.id}`}
                              checked={selectedTypes.has(type.id)}
                              onCheckedChange={() => toggleType(type.id)}
                            />
                            <Label 
                              htmlFor={`type-${type.id}`} 
                              className="text-sm flex-1 cursor-pointer"
                            >
                              {type.label}
                            </Label>
                            {count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Regions Filter */}
                <Collapsible open={regionsOpen} onOpenChange={setRegionsOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                      {regionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Régions
                      <Badge variant="secondary" className="text-xs ml-1">
                        {selectedRegions.size}/{REGIONS.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllRegions}
                        className="text-xs text-primary hover:underline"
                      >
                        Toutes
                      </button>
                      <button 
                        onClick={clearAllRegions}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Aucune
                      </button>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <div className="space-y-2">
                      {REGIONS.map(region => (
                        <div key={region} className="flex items-center gap-2">
                          <Checkbox
                            id={`region-${region}`}
                            checked={selectedRegions.has(region)}
                            onCheckedChange={() => toggleRegion(region)}
                          />
                          <Label 
                            htmlFor={`region-${region}`} 
                            className="text-sm cursor-pointer"
                          >
                            {region}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>

          {/* Export Options Column */}
          <div className="md:col-span-2 space-y-4">
            {/* Word Export Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Export Word - ePUB - PDF
                </CardTitle>
                <CardDescription>
                  Générez des documents Word, ePUB et PDF formatés avec vos textes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Options */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Options de mise en forme</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cover-page"
                          checked={includeCoverPage}
                          onCheckedChange={(checked) => setIncludeCoverPage(checked === true)}
                        />
                        <Label htmlFor="cover-page" className="text-sm cursor-pointer">
                          Page de couverture
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="toc"
                          checked={includeTableOfContents}
                          onCheckedChange={(checked) => setIncludeTableOfContents(checked === true)}
                        />
                        <Label htmlFor="toc" className="text-sm cursor-pointer">
                          Table des matières
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="metadata"
                          checked={includeMetadata}
                          onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                        />
                        <Label htmlFor="metadata" className="text-sm cursor-pointer">
                          Métadonnées (lieu, date)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Organisation du document</Label>
                    <RadioGroup
                      value={organizationMode}
                      onValueChange={(v) => setOrganizationMode(v as 'type' | 'marche')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="type" id="org-type" />
                        <Label htmlFor="org-type" className="cursor-pointer">
                          Par type de texte
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="marche" id="org-marche" />
                        <Label htmlFor="org-marche" className="cursor-pointer">
                          Par marche / lieu
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Contact info for cover page */}
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Coordonnées de contact (couverture)</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Email de contact"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="text-sm"
                      type="email"
                    />
                    <Input
                      placeholder="Téléphone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="text-sm"
                      type="tel"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optionnel — affiché en bas de la page de couverture pour les éditeurs
                  </p>
                </div>

                {/* Keyword Index Section */}
                <Separator />
                
                <Collapsible open={keywordIndexOpen} onOpenChange={setKeywordIndexOpen}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="keyword-index"
                        checked={includeKeywordIndex}
                        onCheckedChange={(checked) => setIncludeKeywordIndex(checked === true)}
                      />
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                        {keywordIndexOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Index des Mots-Clés
                        <Badge variant="secondary" className="text-xs ml-1">
                          {selectedKeywordCategories.size}/{KEYWORD_CATEGORIES.length}
                        </Badge>
                      </CollapsibleTrigger>
                    </div>
                    {includeKeywordIndex && (
                      <div className="flex gap-2">
                        <button 
                          onClick={selectAllKeywordCategories}
                          className="text-xs text-primary hover:underline"
                        >
                          Toutes
                        </button>
                        <button 
                          onClick={clearAllKeywordCategories}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Aucune
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <CollapsibleContent className="mt-4 space-y-4">
                    {includeKeywordIndex && (
                      <>
                        {/* Categories checkboxes */}
                        <div className="grid grid-cols-2 gap-3">
                          {KEYWORD_CATEGORIES.map(category => (
                            <div key={category.id} className="flex items-start gap-2">
                              <Checkbox
                                id={`keyword-cat-${category.id}`}
                                checked={selectedKeywordCategories.has(category.id)}
                                onCheckedChange={() => toggleKeywordCategory(category.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <Label 
                                  htmlFor={`keyword-cat-${category.id}`} 
                                  className="text-sm cursor-pointer font-medium"
                                >
                                  {category.label}
                                </Label>
                                <p className="text-xs text-muted-foreground truncate" title={category.keywords.slice(0, 5).join(', ')}>
                                  {category.keywords.slice(0, 4).join(', ')}...
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Custom keywords section */}
                        <div className="space-y-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Mots-clés personnalisés
                              {loadingKeywords && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSuggestKeywords}
                              disabled={suggestingKeywords || filteredTextes.length === 0}
                              className="gap-1.5 text-xs"
                            >
                              {suggestingKeywords ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              Suggérer avec l'IA
                            </Button>
                          </div>

                          {/* Add new keyword input with category selection */}
                          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                            <Input
                              placeholder="Nouveau mot-clé..."
                              value={newKeywordInput}
                              onChange={(e) => setNewKeywordInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                              className="text-sm flex-1 min-w-[120px]"
                            />
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-[160px] text-xs">
                                <SelectValue placeholder="Catégorie" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-popover">
                                {KEYWORD_CATEGORIES.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                    {cat.label.split(' ')[0]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddKeyword}
                              disabled={!newKeywordInput.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* AI Suggestions */}
                          {suggestedKeywords.length > 0 && (
                            <div className="bg-accent/20 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground">
                                <Sparkles className="h-3 w-3" />
                                Suggestions IA
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {suggestedKeywords.map(keyword => (
                                  <Badge
                                    key={keyword}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors group"
                                  >
                                    <button
                                      onClick={() => acceptSuggestion(keyword)}
                                      className="flex items-center gap-1"
                                    >
                                      <Plus className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                                      {keyword}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dismissSuggestion(keyword);
                                      }}
                                      className="ml-1 opacity-40 hover:opacity-100"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Saved keywords list grouped by category */}
                          {savedKeywords.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-xs text-muted-foreground">
                                {savedKeywords.length} mot(s)-clé(s) personnalisé(s)
                              </div>
                              {KEYWORD_CATEGORIES.map(cat => {
                                const categoryKeywords = savedKeywords.filter(k => k.category === cat.id);
                                if (categoryKeywords.length === 0) return null;
                                return (
                                  <div key={cat.id} className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      {cat.label.split(' ')[0]}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {categoryKeywords.map(({ keyword }) => (
                                        <Badge
                                          key={keyword}
                                          variant="secondary"
                                          className="group"
                                        >
                                          {keyword}
                                          <button
                                            onClick={() => deleteKeyword(keyword)}
                                            className="ml-1 opacity-40 hover:opacity-100 hover:text-destructive"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Preview Summary */}
                {stats.total > 0 ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Prêt à exporter</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.total} textes • ~{stats.words.toLocaleString()} mots • {Math.round(stats.chars / 1000)}k caractères
                        </div>
                      </div>
                      <Button
                        onClick={handleExportWord}
                        disabled={exporting || stats.total === 0}
                        className="gap-2"
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Télécharger .docx
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Aucun texte littéraire pour cette sélection
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {(() => {
                            const selectedMarchesWithoutTexts = Array.from(selectedMarches)
                              .filter(id => (textesPerMarche.get(id) || 0) === 0)
                              .map(id => marches.find(m => m.id === id))
                              .filter(Boolean)
                              .slice(0, 5);
                            
                            if (selectedMarchesWithoutTexts.length > 0) {
                              return (
                                <>
                                  <span>Les marches sélectionnées n'ont pas de textes :</span>
                                  <ul className="mt-1 ml-4 list-disc text-xs">
                                    {selectedMarchesWithoutTexts.map(m => (
                                      <li key={m!.id}>{m!.nom_marche || m!.ville}</li>
                                    ))}
                                    {Array.from(selectedMarches).filter(id => (textesPerMarche.get(id) || 0) === 0).length > 5 && (
                                      <li className="text-muted-foreground/70">
                                        et {Array.from(selectedMarches).filter(id => (textesPerMarche.get(id) || 0) === 0).length - 5} autres...
                                      </li>
                                    )}
                                  </ul>
                                </>
                              );
                            }
                            return "Sélectionnez des explorations et marchés contenant des textes.";
                          })()}
                        </div>
                        <Link 
                          to="/access-admin-gb2025" 
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Gérer les contenus dans l'admin
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visual Preview */}
            <WordExportPreview
              textes={filteredTextes}
              organizationMode={organizationMode}
              includeMetadata={includeMetadata}
              includeCoverPage={includeCoverPage}
            />

            {/* CSV Export Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-green-500" />
                  Export CSV / Tableur
                </CardTitle>
                <CardDescription>
                  Export simplifié pour Excel ou Google Sheets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Colonnes : Titre, Type, Marche, Ville, Région, Contenu, Date
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={stats.total === 0}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger .csv
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vocabulary Export Card */}
            <Card className="border-dashed border-2 border-amber-800/30 bg-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-500" />
                  Export Word - Lexique Patois
                </CardTitle>
                <CardDescription>
                  Exportez le vocabulaire local et les termes régionaux collectés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Ce document inclut :
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Termes locaux et dialectaux</li>
                    <li>Phénomènes naturels régionaux</li>
                    <li>Pratiques traditionnelles</li>
                    <li>Sources et références</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleExportVocabulary}
                  disabled={exportingVocabulary}
                  className="w-full bg-amber-700 hover:bg-amber-600 text-white"
                >
                  {exportingVocabulary ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger le lexique .docx
                </Button>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            {stats.byType.size > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Distribution par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(stats.byType.entries()).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="gap-1">
                        {TEXT_TYPES.find(t => t.id === type)?.label || type}
                        <span className="text-muted-foreground">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* EPUB Export Card - Full Width */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Export EPUB Professionnel
            </CardTitle>
            <CardDescription>
              Créez un eBook ultra-design pour plateformes et éditeurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EpubExportPanel
              textes={filteredTextes}
              explorationCoverUrl={undefined}
              explorationName={explorations.find(e => selectedExplorations.has(e.id))?.name}
              explorationId={selectedExplorations.size === 1 
                ? Array.from(selectedExplorations)[0] 
                : undefined}
              onRefresh={() => loadData(true)}
            />
          </CardContent>
        </Card>

        {/* PDF Export Card - Full Width */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Export PDF Professionnel
            </CardTitle>
            <CardDescription>
              Créez un PDF ultra-design pour éditeurs et lecteurs partenaires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PdfExportPanel
              textes={filteredTextes}
              explorationName={explorations.find(e => selectedExplorations.has(e.id))?.name}
              onRefresh={() => loadData(true)}
            />
          </CardContent>
        </Card>

        {/* Editor Export Card - Full Width - RECOMMANDÉ */}
        <Card className="border-2 border-slate-400 bg-slate-50 dark:bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <ScrollText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                Export ÉDITEUR
              </CardTitle>
              <Badge className="bg-green-600 text-white hover:bg-green-600">
                RECOMMANDÉ
              </Badge>
            </div>
            <CardDescription>
              Format manuscrit sobre pour soumission aux éditeurs de poésie nationaux (Cheyne, Gallimard, Bruno Doucey, Le Castor Astral, Lanskine, Tarabuste, Wildproject)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditorExportPanel
              textes={filteredTextes}
              defaultTitle={explorations.find(e => selectedExplorations.has(e.id))?.name || 'Manuscrit poétique'}
              defaultAuthor="Gaspard Boréal"
            />
          </CardContent>
        </Card>

        {/* Marches Statistics Export Card - Full Width */}
        <Card className="border-dashed border-2 border-blue-800/30 bg-blue-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Export Word - Statistiques des Marches
            </CardTitle>
            <CardDescription>
              Exportez la liste des marches avec statistiques et tonalités
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Ce document inclut :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Liste chronologique des marches</li>
                <li>Région et département</li>
                <li>Nombre de photos, textes, audios</li>
                <li>Analyse de la tonalité littéraire</li>
                <li>Synthèse statistique globale</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sélectionner une exploration</Label>
              <Select 
                value={selectedStatsExploration} 
                onValueChange={setSelectedStatsExploration}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une exploration..." />
                </SelectTrigger>
                <SelectContent>
                  {explorations.map(expl => (
                    <SelectItem key={expl.id} value={expl.id}>
                      {expl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleExportMarchesStats}
              disabled={exportingStats || !selectedStatsExploration}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white"
            >
              {exportingStats ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Télécharger les statistiques .docx
            </Button>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Centre d'Exportation - Gaspard Boréal © 2025 - 2026</p>
        </div>
      </div>
    </div>
  );
};

export default ExportationsAdmin;
