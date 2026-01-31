import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Palette, 
  ChevronDown, 
  ChevronRight,
  Download,
  Loader2,
  Printer,
  Bug,
} from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { 
  PDF_PRESETS, 
  getDefaultPdfOptions,
  type PdfExportOptions,
  type TexteExport,
} from '@/utils/pdfExportUtils';
import { PdfDocument, registerFonts, type PartieData } from '@/utils/pdfPageComponents';
import { generateContextualMetadata } from '@/utils/epubMetadataGenerator';

interface PdfExportPanelProps {
  textes: TexteExport[];
  parties?: PartieData[];
  explorationCoverUrl?: string;
  explorationName?: string;
  onRefresh?: () => void;
}

const PdfExportPanel: React.FC<PdfExportPanelProps> = ({
  textes,
  parties,
  explorationName,
}) => {
  const [options, setOptions] = useState<PdfExportOptions>(() => {
    return getDefaultPdfOptions('edition_nationale');
  });
  const [metadataSource, setMetadataSource] = useState<'contextual' | 'manual'>('contextual');

  const [metadataOpen, setMetadataOpen] = useState(true);
  const [designOpen, setDesignOpen] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugProgress, setDebugProgress] = useState<string | null>(null);

  // Synchronize metadata with exploration and textes changes
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
  }, [textes, explorationName]);

  const updateOption = useCallback(<K extends keyof PdfExportOptions>(
    key: K,
    value: PdfExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    // Mark as manual when user edits metadata fields
    if (['title', 'subtitle', 'description'].includes(key as string)) {
      setMetadataSource('manual');
    }
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = PDF_PRESETS[presetId];
    if (preset) {
      setOptions(prev => ({
        ...prev,
        format: presetId as PdfExportOptions['format'],
        colorScheme: { ...preset.colorScheme },
        typography: { ...preset.typography },
        pageSize: preset.pageSize,
        marginInner: preset.marginInner,
        marginOuter: preset.marginOuter,
        marginTop: preset.marginTop,
        marginBottom: preset.marginBottom,
        includeFauxTitre: preset.includeFauxTitre,
        includeColophon: preset.includeColophon,
      }));
      toast.success(`Preset "${preset.name}" appliqué`);
    }
  }, []);

  // En mode d'organisation "marche", PdfDocument s'appuie sur une liste de "parties".
  // Les textes sont déjà enrichis (partie_id / partie_titre / partie_ordre...),
  // donc on reconstruit la liste si elle n'est pas fournie.
  const effectiveParties = useMemo<PartieData[]>(() => {
    if (parties && parties.length > 0) return parties;

    const map = new Map<string, PartieData>();
    for (const t of textes) {
      if (!t.partie_id) continue;
      if (map.has(t.partie_id)) continue;

      map.set(t.partie_id, {
        id: t.partie_id,
        numeroRomain: t.partie_numero_romain || '',
        titre: t.partie_titre || 'Mouvement',
        sousTitre: t.partie_sous_titre || undefined,
        ordre: t.partie_ordre ?? 999,
      });
    }

    return Array.from(map.values()).sort((a, b) => a.ordre - b.ordre);
  }, [parties, textes]);

  const handleExport = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    setExporting(true);
    try {
      await registerFonts(options);
      const doc = <PdfDocument textes={textes} options={options} parties={effectiveParties} />;
      const blob = await pdf(doc).toBlob();
      const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      saveAs(blob, filename);
      toast.success('PDF généré avec succès !');
    } catch (error: unknown) {
      console.error('PDF Export error:', error);
      
      // Provide detailed error message for layout crashes
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('unsupported number')) {
        console.error('Layout crash detected (Yoga engine overflow). This usually indicates an element that cannot fit on a page.');
        toast.error('Erreur de mise en page PDF (layout overflow). Vérifiez les index ou contenus trop longs.');
      } else {
        toast.error(`Erreur PDF: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setExporting(false);
    }
  };

  // DEBUG MODE: Step-by-step export to isolate the crash source
  // If "Contenu seul" crashes, uses binary search to identify the problematic text
  const handleDebugExport = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    setExporting(true);
    setDebugProgress(null);
    
    const minimalOpts = { 
      includeTableOfContents: false, 
      includeIndexLieux: false, 
      includeIndexGenres: false, 
      includeIndexKeywords: false, 
      includeColophon: false,
      includeCover: false,
      includeFauxTitre: false,
      includePartiePages: false,
    };

    try {
      await registerFonts(options);
      
      // STEP 0: Test with ZERO textes (just structure pages)
      setDebugProgress('Test 0: Structure seule (sans textes)...');
      console.info('[PDF DEBUG] Step 0: Testing structure only (no textes)...');
      try {
        const testOptions = { ...options, ...minimalOpts, includeCover: true, includeFauxTitre: true };
        const doc = <PdfDocument textes={[]} options={testOptions} parties={[]} />;
        await pdf(doc).toBlob();
        console.info('[PDF DEBUG] Step 0: ✅ Structure OK');
      } catch {
        toast.error('Crash dans la structure de base (couverture/faux-titre)');
        setDebugProgress('❌ Crash dans la structure de base');
        setExporting(false);
        return;
      }
      
      // STEP 1: Test "Contenu seul" with all textes
      setDebugProgress('Test 1: Contenu seul (tous les textes)...');
      console.info('[PDF DEBUG] Step 1: Testing all textes...');
      try {
        const testOptions = { ...options, ...minimalOpts };
        const doc = <PdfDocument textes={textes} options={testOptions} parties={effectiveParties} />;
        await pdf(doc).toBlob();
        console.info('[PDF DEBUG] Step 1: ✅ Contenu OK');
      } catch (contentError) {
        console.error('[PDF DEBUG] Step 1: ❌ CRASH dans "Contenu seul" - launching binary search', contentError);
        setDebugProgress('❌ Crash dans contenu - recherche du texte fautif...');
        
        // Binary search to find the problematic text
        const problematicTexte = await binarySearchProblematicText(textes, options, minimalOpts);
        
        if (problematicTexte) {
          const msg = `Texte fautif trouvé: "${problematicTexte.titre}" (${problematicTexte.id.slice(0, 8)})`;
          console.error('[PDF DEBUG] ' + msg, problematicTexte);
          toast.error(msg);
          setDebugProgress(`❌ ${msg}`);
        } else {
          toast.error('Crash dans le contenu mais texte fautif non identifié');
          setDebugProgress('❌ Crash dans le contenu (texte non identifié)');
        }
        setExporting(false);
        return;
      }
      
      // STEP 2-5: Test with TOC and indexes
      const steps = [
        { name: 'Contenu + TOC', opts: { ...minimalOpts, includeTableOfContents: true } },
        { name: 'Contenu + TOC + Index Lieux', opts: { ...minimalOpts, includeTableOfContents: true, includeIndexLieux: true } },
        { name: 'Contenu + TOC + Index Lieux + Index Œuvres', opts: { ...minimalOpts, includeTableOfContents: true, includeIndexLieux: true, includeIndexGenres: true } },
        { name: 'Export complet', opts: { includeTableOfContents: true, includeIndexLieux: true, includeIndexGenres: true, includeIndexKeywords: true, includeColophon: true } },
      ];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setDebugProgress(`Test ${i + 2}/${steps.length + 1}: ${step.name}...`);
        console.info(`[PDF DEBUG] Step ${i + 2}: ${step.name}...`);
        
        try {
          const testOptions = { ...options, ...step.opts };
          const doc = <PdfDocument textes={textes} options={testOptions} parties={effectiveParties} />;
          await pdf(doc).toBlob();
          console.info(`[PDF DEBUG] Step ${i + 2}: ✅ OK`);
        } catch (stepError) {
          console.error(`[PDF DEBUG] Step ${i + 2}: ❌ CRASH dans "${step.name}"`, stepError);
          toast.error(`Crash identifié dans : ${step.name}`);
          setDebugProgress(`❌ Crash dans : ${step.name}`);
          setExporting(false);
          return;
        }
      }
      
      // All steps passed - generate final PDF
      setDebugProgress('✅ Tous les tests passés ! Génération du PDF...');
      const doc = <PdfDocument textes={textes} options={options} parties={effectiveParties} />;
      const blob = await pdf(doc).toBlob();
      const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_debug.pdf`;
      saveAs(blob, filename);
      toast.success('PDF généré avec succès ! Aucun crash détecté.');
      setDebugProgress('✅ PDF généré avec succès !');
    } catch (error) {
      console.error('Debug export error:', error);
      toast.error('Erreur pendant le debug');
    } finally {
      setExporting(false);
    }
  };
  
  // Binary search helper to find the exact problematic text
  const binarySearchProblematicText = async (
    allTextes: TexteExport[],
    opts: PdfExportOptions,
    minimalOpts: Record<string, boolean>
  ): Promise<TexteExport | null> => {
    // Quick test: if single text crashes, that's our culprit
    if (allTextes.length === 1) {
      return allTextes[0];
    }
    
    // Test first half
    const mid = Math.floor(allTextes.length / 2);
    const firstHalf = allTextes.slice(0, mid);
    const secondHalf = allTextes.slice(mid);
    
    console.info(`[PDF DEBUG] Binary search: testing first ${firstHalf.length} textes...`);
    setDebugProgress(`Recherche binaire: test ${firstHalf.length} textes...`);
    
    try {
      const testOptions = { ...opts, ...minimalOpts };
      const doc = <PdfDocument textes={firstHalf} options={testOptions} parties={effectiveParties} />;
      await pdf(doc).toBlob();
      console.info('[PDF DEBUG] First half OK, problem is in second half');
      
      // First half OK, problem is in second half
      if (secondHalf.length === 1) {
        return secondHalf[0];
      }
      return binarySearchProblematicText(secondHalf, opts, minimalOpts);
    } catch {
      console.info('[PDF DEBUG] First half crashed, problem is in first half');
      // First half crashed
      if (firstHalf.length === 1) {
        return firstHalf[0];
      }
      return binarySearchProblematicText(firstHalf, opts, minimalOpts);
    }
  };

  const stats = useMemo(() => {
    const totalChars = textes.reduce((sum, t) => sum + t.contenu.length, 0);
    const estimatedWords = Math.round(totalChars / 5);
    const lieuxSet = new Set<string>();
    textes.forEach(t => {
      if (t.marche_ville) lieuxSet.add(t.marche_ville);
    });
    return { estimatedWords, uniqueLieux: lieuxSet.size };
  }, [textes]);

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Export PDF Professionnel
          </CardTitle>
          <CardDescription>
            Créez un PDF ultra-design pour éditeurs et lecteurs partenaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{textes.length} textes</Badge>
            <Badge variant="secondary">{stats.uniqueLieux} lieux</Badge>
            <Badge variant="secondary">~{stats.estimatedWords.toLocaleString()} mots</Badge>
          </div>

          {/* Metadata Section */}
          <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  Métadonnées éditoriales
                </span>
                {metadataOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pdf-title" className="text-xs">Titre</Label>
                  <Input
                    id="pdf-title"
                    value={options.title}
                    onChange={(e) => updateOption('title', e.target.value)}
                    placeholder="Titre du recueil"
                    className="font-medium"
                  />
                </div>
                <div>
                  <Label htmlFor="pdf-author" className="text-xs">Auteur</Label>
                  <Input
                    id="pdf-author"
                    value={options.author}
                    onChange={(e) => updateOption('author', e.target.value)}
                    placeholder="Nom de l'auteur"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pdf-publisher" className="text-xs">Éditeur</Label>
                  <Input
                    id="pdf-publisher"
                    value={options.publisher}
                    onChange={(e) => updateOption('publisher', e.target.value)}
                    placeholder="La Comédie des Mondes Hybrides"
                  />
                </div>
                <div>
                  <Label htmlFor="pdf-isbn" className="text-xs">ISBN</Label>
                  <Input
                    id="pdf-isbn"
                    value={options.isbn}
                    onChange={(e) => updateOption('isbn', e.target.value)}
                    placeholder="978-..."
                  />
                </div>
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
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(PDF_PRESETS).map((preset) => (
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
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Print Settings Section */}
          <Collapsible open={printOpen} onOpenChange={setPrintOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 font-medium">
                  <Printer className="h-4 w-4" />
                  Options d'impression
                </span>
                {printOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Format de page</Label>
                  <Select
                    value={options.pageSize}
                    onValueChange={(value) => updateOption('pageSize', value as PdfExportOptions['pageSize'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                      <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                      <SelectItem value="Letter">Letter (US)</SelectItem>
                      <SelectItem value="Custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Numérotation</Label>
                  <Select
                    value={options.pageNumberStyle}
                    onValueChange={(value) => updateOption('pageNumberStyle', value as PdfExportOptions['pageNumberStyle'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arabic">Chiffres arabes</SelectItem>
                      <SelectItem value="roman-preface">Romains (préface)</SelectItem>
                      <SelectItem value="none">Sans numérotation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-faux-titre"
                    checked={options.includeFauxTitre}
                    onCheckedChange={(checked) => updateOption('includeFauxTitre', !!checked)}
                  />
                  <Label htmlFor="pdf-faux-titre" className="text-sm">Page de faux-titre</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-toc"
                    checked={options.includeTableOfContents}
                    onCheckedChange={(checked) => updateOption('includeTableOfContents', !!checked)}
                  />
                  <Label htmlFor="pdf-toc" className="text-sm">Table des matières</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-colophon"
                    checked={options.includeColophon}
                    onCheckedChange={(checked) => updateOption('includeColophon', !!checked)}
                  />
                  <Label htmlFor="pdf-colophon" className="text-sm">Colophon (achevé d'imprimer)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-bleed"
                    checked={options.bleed}
                    onCheckedChange={(checked) => updateOption('bleed', !!checked)}
                  />
                  <Label htmlFor="pdf-bleed" className="text-sm">Fond perdu (3mm)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-crops"
                    checked={options.cropMarks}
                    onCheckedChange={(checked) => updateOption('cropMarks', !!checked)}
                  />
                  <Label htmlFor="pdf-crops" className="text-sm">Traits de coupe</Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Debug Section */}
          <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 font-medium text-orange-600">
                  <Bug className="h-4 w-4" />
                  Mode Debug (crash PDF)
                </span>
                {debugOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Ce mode teste l'export par étapes pour identifier la section qui cause le crash (TOC, Index, etc.)
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-debug-toc"
                    checked={options.includeTableOfContents}
                    onCheckedChange={(checked) => updateOption('includeTableOfContents', !!checked)}
                  />
                  <Label htmlFor="pdf-debug-toc" className="text-sm">Inclure TOC</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-debug-index-lieux"
                    checked={options.includeIndexLieux}
                    onCheckedChange={(checked) => updateOption('includeIndexLieux', !!checked)}
                  />
                  <Label htmlFor="pdf-debug-index-lieux" className="text-sm">Inclure Index Lieux</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-debug-index-genres"
                    checked={options.includeIndexGenres}
                    onCheckedChange={(checked) => updateOption('includeIndexGenres', !!checked)}
                  />
                  <Label htmlFor="pdf-debug-index-genres" className="text-sm">Inclure Index Œuvres</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pdf-debug-index-keywords"
                    checked={options.includeIndexKeywords}
                    onCheckedChange={(checked) => updateOption('includeIndexKeywords', !!checked)}
                  />
                  <Label htmlFor="pdf-debug-index-keywords" className="text-sm">Inclure Index Thématique</Label>
                </div>
              </div>
              
              {debugProgress && (
                <div className="p-2 bg-muted rounded text-xs font-mono">
                  {debugProgress}
                </div>
              )}
              
              <Button
                variant="outline"
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={handleDebugExport}
                disabled={exporting || textes.length === 0}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Debug en cours...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4 mr-2" />
                    Lancer export debug (étape par étape)
                  </>
                )}
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Export Button */}
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
            size="lg"
            onClick={handleExport}
            disabled={exporting || textes.length === 0}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le PDF ({textes.length} textes)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PdfExportPanel;
