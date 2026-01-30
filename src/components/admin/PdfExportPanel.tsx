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
import { PdfDocument, registerFonts } from '@/utils/pdfPageComponents';
import { generateContextualMetadata } from '@/utils/epubMetadataGenerator';

interface PdfExportPanelProps {
  textes: TexteExport[];
  explorationCoverUrl?: string;
  explorationName?: string;
  onRefresh?: () => void;
}

const PdfExportPanel: React.FC<PdfExportPanelProps> = ({
  textes,
  explorationName,
}) => {
  const [options, setOptions] = useState<PdfExportOptions>(() => {
    return getDefaultPdfOptions('edition_nationale');
  });
  const [metadataSource, setMetadataSource] = useState<'contextual' | 'manual'>('contextual');

  const [metadataOpen, setMetadataOpen] = useState(true);
  const [designOpen, setDesignOpen] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }

    setExporting(true);
    try {
      await registerFonts(options);
      const doc = <PdfDocument textes={textes} options={options} />;
      const blob = await pdf(doc).toBlob();
      const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      saveAs(blob, filename);
      toast.success('PDF généré avec succès !');
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setExporting(false);
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
                    placeholder="Auto-édition"
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
