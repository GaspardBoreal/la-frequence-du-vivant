import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Palette, 
  Image as ImageIcon, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Download,
  Loader2,
  Sparkles,
  Type,
  Layout,
  RefreshCw,
  Wand2,
  RotateCcw,
  Lightbulb,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  EPUB_PRESETS, 
  getDefaultEpubOptions, 
  downloadEpub,
  type EpubExportOptions,
  type TexteExport,
  type EpubColorScheme,
  type EpubTypography
} from '@/utils/epubExportUtils';
import { 
  generateContextualMetadata, 
  buildAIPayload,
  type EpubMetadataSuggestion 
} from '@/utils/epubMetadataGenerator';
import { 
  publishExport, 
  fetchPublishedExports, 
  deletePublishedExport,
  type PublishedExport 
} from '@/utils/publicExportUtils';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EpubPreview from './EpubPreview';
import CoverEditor from './CoverEditor';

interface EpubExportPanelProps {
  textes: TexteExport[];
  explorationCoverUrl?: string;
  explorationName?: string;
  explorationId?: string;
  onRefresh?: () => void;
}

const EpubExportPanel: React.FC<EpubExportPanelProps> = ({
  textes,
  explorationCoverUrl,
  explorationName,
  explorationId,
  onRefresh,
}) => {
  // State for export options
  const [options, setOptions] = useState<EpubExportOptions>(() => {
    const defaults = getDefaultEpubOptions('classique');
    return {
      ...defaults,
      title: explorationName || 'Recueil Poétique',
      coverImageUrl: explorationCoverUrl,
    };
  });

  // Collapsible sections state
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [designOpen, setDesignOpen] = useState(true);
  const [coverOpen, setCoverOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  // Export and generation states
  const [exporting, setExporting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [metadataSource, setMetadataSource] = useState<'contextual' | 'ai' | 'manual'>('contextual');
  
  // Publishing states
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [lastPublishedUrl, setLastPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishedExports, setPublishedExports] = useState<PublishedExport[]>([]);
  const [publishHistoryOpen, setPublishHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Update a single option
  const updateOption = useCallback(<K extends keyof EpubExportOptions>(
    key: K,
    value: EpubExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update color scheme
  const updateColor = useCallback((colorKey: keyof EpubColorScheme, value: string) => {
    setOptions(prev => ({
      ...prev,
      colorScheme: { ...prev.colorScheme, [colorKey]: value },
    }));
  }, []);

  // Update typography
  const updateTypography = useCallback(<K extends keyof EpubTypography>(
    key: K,
    value: EpubTypography[K]
  ) => {
    setOptions(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = EPUB_PRESETS[presetId];
    if (preset) {
      setOptions(prev => ({
        ...prev,
        format: presetId as EpubExportOptions['format'],
        colorScheme: { ...preset.colorScheme },
        typography: { ...preset.typography },
      }));
      toast.success(`Preset "${preset.name}" appliqué`);
    }
  }, []);

  // Export handler
  const handleExport = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    setExporting(true);
    try {
      await downloadEpub(textes, options);
      toast.success('EPUB généré avec succès !');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de la génération de l\'EPUB');
    } finally {
      setExporting(false);
    }
  };

  // Publish and Share handler
  const handlePublishAndShare = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte à publier');
      return;
    }

    setPublishing(true);
    try {
      // Import exportToEpub to get the blob
      const { exportToEpub } = await import('@/utils/epubExportUtils');
      const { blob } = await exportToEpub(textes, options);
      
      const published = await publishExport({
        blob,
        title: options.title,
        subtitle: options.subtitle,
        description: options.description,
        author: options.author,
        coverUrl: options.coverImageUrl,
        artisticDirection: options.format,
        fileType: 'epub',
        explorationId,
      });
      
      setLastPublishedUrl(published.publicUrl);
      setShowPublishModal(true);
      toast.success('Publication réussie !');
      
      // Refresh history
      loadPublishHistory();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(`Erreur lors de la publication: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setPublishing(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    if (!lastPublishedUrl) return;
    try {
      await navigator.clipboard.writeText(lastPublishedUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  // Load publish history
  const loadPublishHistory = async () => {
    setLoadingHistory(true);
    try {
      const exports = await fetchPublishedExports();
      setPublishedExports(exports);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Delete published export
  const handleDeletePublished = async (slug: string) => {
    if (!confirm('Supprimer cette publication ? Le lien ne fonctionnera plus.')) return;
    try {
      await deletePublishedExport(slug);
      toast.success('Publication supprimée');
      loadPublishHistory();
    } catch (error) {
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Load history when section opens
  useEffect(() => {
    if (publishHistoryOpen && publishedExports.length === 0) {
      loadPublishHistory();
    }
  }, [publishHistoryOpen]);

  // Statistics
  // IMPORTANT: Use marche_ville only for counting unique locations to match metadata generator
  const stats = useMemo(() => {
    const totalChars = textes.reduce((sum, t) => sum + t.contenu.length, 0);
    const estimatedWords = Math.round(totalChars / 5);
    // Count only unique cities (marche_ville) to avoid doubling
    const lieuxSet = new Set<string>();
    textes.forEach(t => {
      if (t.marche_ville) lieuxSet.add(t.marche_ville);
    });
    const uniqueLieux = lieuxSet.size;
    const uniqueTypes = new Set(textes.map(t => t.type_texte)).size;
    return { totalChars, estimatedWords, uniqueLieux, uniqueTypes };
  }, [textes]);

  // === INTELLIGENT METADATA GENERATION ===
  
  // Auto-generate contextual metadata when textes change
  useEffect(() => {
    if (textes.length > 0 && metadataSource !== 'manual') {
      const suggestion = generateContextualMetadata(textes, explorationName);
      setOptions(prev => ({
        ...prev,
        title: suggestion.title,
        subtitle: suggestion.subtitle,
        description: suggestion.description,
      }));
      setMetadataSource('contextual');
    }
  }, [textes, explorationName]); // Don't include metadataSource to avoid loop

  // Regenerate contextual metadata
  const handleRegenerateContextual = useCallback(() => {
    const suggestion = generateContextualMetadata(textes, explorationName);
    setOptions(prev => ({
      ...prev,
      title: suggestion.title,
      subtitle: suggestion.subtitle,
      description: suggestion.description,
    }));
    setMetadataSource('contextual');
    toast.success('Métadonnées régénérées');
  }, [textes, explorationName]);

  // Generate AI-powered poetic metadata
  const handleGenerateAI = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte disponible');
      return;
    }

    setGeneratingAI(true);
    try {
      const payload = buildAIPayload(textes, explorationName);
      
      const { data, error } = await supabase.functions.invoke('generate-epub-metadata', {
        body: payload,
      });

      if (error) {
        console.error('AI generation error:', error);
        toast.error('Erreur lors de la génération IA');
        return;
      }

      if (data && data.title) {
        setOptions(prev => ({
          ...prev,
          title: data.title,
          subtitle: data.subtitle || '',
          description: data.description || '',
        }));
        setMetadataSource('ai');
        toast.success('✨ Métadonnées poétiques générées !');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Erreur lors de la génération IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Mark as manual when user edits
  const handleManualEdit = useCallback(<K extends keyof EpubExportOptions>(
    key: K,
    value: EpubExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    setMetadataSource('manual');
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" />
              Export EPUB Professionnel
            </CardTitle>
            <CardDescription>
              Créez un eBook haute qualité pour lecteurs et plateformes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics + Refresh */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{textes.length} textes</Badge>
              <Badge variant="secondary">{stats.uniqueLieux} lieux</Badge>
              <Badge variant="secondary">{stats.uniqueTypes} genres</Badge>
              <Badge variant="secondary">~{stats.estimatedWords.toLocaleString()} mots</Badge>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="ml-auto gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Rafraîchir
                </Button>
              )}
            </div>

            {/* Metadata Section */}
            <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Métadonnées éditoriales
                    {metadataSource === 'ai' && (
                      <Badge variant="default" className="ml-2 text-[10px] h-4 bg-gradient-to-r from-primary/80 to-primary">
                        ✨ IA
                      </Badge>
                    )}
                    {metadataSource === 'contextual' && (
                      <Badge variant="secondary" className="ml-2 text-[10px] h-4">
                        Auto
                      </Badge>
                    )}
                  </span>
                  {metadataOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {/* AI Generation Buttons */}
                <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg border border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={generatingAI || textes.length === 0}
                    className="gap-1.5 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30"
                  >
                    {generatingAI ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-medium">
                      Inspiration poétique
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateContextual}
                    disabled={textes.length === 0}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Regénérer
                  </Button>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-2 p-2 text-xs text-muted-foreground bg-muted/30 rounded-md">
                  <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                  <span>
                    Généré d'après {textes.length} textes • {stats.uniqueLieux} lieux.
                    Cliquez <span className="font-medium text-primary">Inspiration poétique</span> pour une version IA digne de Gaspard Boréal.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="title" className="text-xs">Titre</Label>
                    <Input
                      id="title"
                      value={options.title}
                      onChange={(e) => handleManualEdit('title', e.target.value)}
                      placeholder="Titre du recueil"
                      className="font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="author" className="text-xs">Auteur</Label>
                    <Input
                      id="author"
                      value={options.author}
                      onChange={(e) => updateOption('author', e.target.value)}
                      placeholder="Nom de l'auteur"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subtitle" className="text-xs">Sous-titre (optionnel)</Label>
                  <Input
                    id="subtitle"
                    value={options.subtitle}
                    onChange={(e) => handleManualEdit('subtitle', e.target.value)}
                    placeholder="Sous-titre ou accroche"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="publisher" className="text-xs">Éditeur</Label>
                    <Input
                      id="publisher"
                      value={options.publisher}
                      onChange={(e) => updateOption('publisher', e.target.value)}
                      placeholder="La Comédie des Mondes Hybrides"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isbn" className="text-xs">ISBN (optionnel)</Label>
                    <Input
                      id="isbn"
                      value={options.isbn}
                      onChange={(e) => updateOption('isbn', e.target.value)}
                      placeholder="978-..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Textarea
                    id="description"
                    value={options.description}
                    onChange={(e) => handleManualEdit('description', e.target.value)}
                    placeholder="Description pour les métadonnées EPUB..."
                    rows={3}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Design Section */}
            <Collapsible open={designOpen} onOpenChange={setDesignOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="flex items-center gap-2 font-medium">
                    <Palette className="h-4 w-4" />
                    Direction artistique
                  </span>
                  {designOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Presets */}
                <div>
                  <Label className="text-xs mb-2 block">Preset de style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(EPUB_PRESETS).map((preset) => (
                      <Button
                        key={preset.id}
                        variant={options.format === preset.id ? 'default' : 'outline'}
                        size="sm"
                        className="h-auto py-2 px-3 flex flex-col items-start text-left min-h-[60px]"
                        onClick={() => applyPreset(preset.id)}
                      >
                        <span className="font-medium text-xs leading-tight">{preset.name}</span>
                        <span className="text-[10px] opacity-70 font-normal leading-tight line-clamp-2 w-full">
                          {preset.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme */}
                <div>
                  <Label className="text-xs mb-2 block flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Palette de couleurs
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['primary', 'secondary', 'background', 'text', 'accent'] as const).map((colorKey) => (
                      <div key={colorKey} className="text-center">
                        <input
                          type="color"
                          value={options.colorScheme[colorKey]}
                          onChange={(e) => updateColor(colorKey, e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-border"
                          title={colorKey}
                        />
                        <p className="text-[9px] text-muted-foreground mt-1 capitalize">{colorKey}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-3">
                  <Label className="text-xs mb-2 block flex items-center gap-1">
                    <Type className="h-3 w-3" />
                    Typographie
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Police corps</Label>
                      <Select
                        value={options.typography.bodyFont}
                        onValueChange={(v) => updateTypography('bodyFont', v as EpubTypography['bodyFont'])}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Libre Baskerville">Libre Baskerville</SelectItem>
                          <SelectItem value="EB Garamond">EB Garamond</SelectItem>
                          <SelectItem value="Crimson Pro">Crimson Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Police titres</Label>
                      <Select
                        value={options.typography.headingFont}
                        onValueChange={(v) => updateTypography('headingFont', v as EpubTypography['headingFont'])}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          <SelectItem value="Cormorant Garamond">Cormorant Garamond</SelectItem>
                          <SelectItem value="Libre Baskerville">Libre Baskerville</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Taille ({options.typography.baseFontSize}rem)
                      </Label>
                      <Slider
                        value={[options.typography.baseFontSize]}
                        onValueChange={([v]) => updateTypography('baseFontSize', v)}
                        min={0.8}
                        max={1.4}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Interligne ({options.typography.lineHeight})
                      </Label>
                      <Slider
                        value={[options.typography.lineHeight]}
                        onValueChange={([v]) => updateTypography('lineHeight', v)}
                        min={1.4}
                        max={2.2}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Cover Section */}
            <Collapsible open={coverOpen} onOpenChange={setCoverOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="flex items-center gap-2 font-medium">
                    <ImageIcon className="h-4 w-4" />
                    Couverture
                  </span>
                  {coverOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <CoverEditor
                  coverImageUrl={options.coverImageUrl}
                  explorationCoverUrl={explorationCoverUrl}
                  onCoverChange={(url) => updateOption('coverImageUrl', url)}
                />
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Content Options Section */}
            <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="flex items-center gap-2 font-medium">
                    <Layout className="h-4 w-4" />
                    Options de contenu
                  </span>
                  {contentOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCover"
                      checked={options.includeCover}
                      onCheckedChange={(checked) => updateOption('includeCover', !!checked)}
                    />
                    <Label htmlFor="includeCover" className="text-sm font-normal cursor-pointer">
                      Inclure page de couverture
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeToc"
                      checked={options.includeTableOfContents}
                      onCheckedChange={(checked) => updateOption('includeTableOfContents', !!checked)}
                    />
                    <Label htmlFor="includeToc" className="text-sm font-normal cursor-pointer">
                      Inclure table des matières interactive
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeParties"
                      checked={options.includePartiePages}
                      onCheckedChange={(checked) => updateOption('includePartiePages', !!checked)}
                    />
                    <Label htmlFor="includeParties" className="text-sm font-normal cursor-pointer">
                      Inclure pages de mouvements (Parties)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeIllustrations"
                      checked={options.includeIllustrations}
                      onCheckedChange={(checked) => updateOption('includeIllustrations', !!checked)}
                    />
                    <Label htmlFor="includeIllustrations" className="text-sm font-normal cursor-pointer">
                      Inclure illustrations des marches
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeIndexes"
                      checked={options.includeIndexes}
                      onCheckedChange={(checked) => updateOption('includeIndexes', !!checked)}
                    />
                    <Label htmlFor="includeIndexes" className="text-sm font-normal cursor-pointer">
                      Inclure index (lieux + genres)
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Export Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleExport}
                disabled={exporting || publishing || textes.length === 0}
                className="w-full"
                size="lg"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger l'EPUB ({textes.length} textes)
                  </>
                )}
              </Button>

              <Button
                onClick={handlePublishAndShare}
                disabled={publishing || exporting || textes.length === 0}
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
                size="lg"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publication en cours...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Publier & Partager
                  </>
                )}
              </Button>
            </div>

            {/* Published Exports History */}
            <Collapsible open={publishHistoryOpen} onOpenChange={setPublishHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto text-muted-foreground">
                  <span className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    Publications partagées ({publishedExports.length})
                  </span>
                  {publishHistoryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : publishedExports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune publication pour l'instant
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {publishedExports.slice(0, 10).map((pub) => {
                      const pubDate = new Date(pub.published_at);
                      const formattedDate = pubDate.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '.');
                      const formattedTime = pubDate.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      return (
                        <div
                          key={pub.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{pub.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{formattedDate}</span>
                              <span className="opacity-50">•</span>
                              <span className="font-mono">{formattedTime}</span>
                              <span className="opacity-50">•</span>
                              <span>{pub.download_count} téléchargements</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => window.open(pub.publicUrl, '_blank')}
                              title="Ouvrir"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePublished(pub.slug)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <div className="sticky top-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Aperçu en temps réel
          </h3>
          <EpubPreview textes={textes} options={options} />
        </div>
      </div>

      {/* Publish Success Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Publication réussie !
            </DialogTitle>
            <DialogDescription>
              Votre ePUB est maintenant accessible publiquement. Partagez ce lien avec la communauté.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={lastPublishedUrl || ''}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPublishModal(false)}
              >
                Fermer
              </Button>
              <Button
                onClick={() => window.open(lastPublishedUrl || '', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EpubExportPanel;
