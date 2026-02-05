import React, { useState, useMemo, useEffect } from 'react';
import { ScrollText, Download, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  exportEditorManuscript,
  previewSanitization,
  type TexteExportEditor,
  type EditorExportOptions,
  type SanitizationReport,
} from '@/utils/editorExportUtils';

interface EditorExportPanelProps {
  textes: TexteExportEditor[];
  defaultTitle?: string;
  defaultAuthor?: string;
}

const EditorExportPanel: React.FC<EditorExportPanelProps> = ({
  textes,
  defaultTitle = 'Fréquences de la rivière Dordogne',
  defaultAuthor = 'Gaspard Boréal',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  
  // Metadata state
  const [title, setTitle] = useState(defaultTitle);
  
  // Sync title with filter changes
  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);
  const [subtitle, setSubtitle] = useState('Carnet de remontée poétique');
  const [author, setAuthor] = useState(defaultAuthor);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showContactOnCover, setShowContactOnCover] = useState(true);
  
  // Content options
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [showLocationDate, setShowLocationDate] = useState(false);
  const [pageBreakBetweenTexts, setPageBreakBetweenTexts] = useState(true);
  
  // Typography options
  const [disableHyphenation, setDisableHyphenation] = useState(true);
  const [fixPunctuationSpacing, setFixPunctuationSpacing] = useState(true);
  const [normalizeQuotes, setNormalizeQuotes] = useState(true);
  const [normalizeApostrophes, setNormalizeApostrophes] = useState(true);
  const [protectProperNouns, setProtectProperNouns] = useState(true);
  const [removeInvisibleChars, setRemoveInvisibleChars] = useState(true);
  
  // Preview sanitization report
  const previewReport = useMemo<SanitizationReport>(() => {
    return previewSanitization(textes, {
      disableHyphenation,
      fixPunctuationSpacing,
      normalizeQuotes,
      normalizeApostrophes,
      protectProperNouns,
      removeInvisibleChars,
    });
  }, [textes, disableHyphenation, fixPunctuationSpacing, normalizeQuotes, normalizeApostrophes, protectProperNouns, removeInvisibleChars]);
  
  const handleExport = async () => {
    if (textes.length === 0) {
      toast.error('Aucun texte à exporter');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const options: EditorExportOptions = {
        title,
        subtitle: subtitle || undefined,
        author,
        email: email || undefined,
        phone: phone || undefined,
        showContactOnCover,
        includeCoverPage,
        includeTableOfContents,
        showLocationDate,
        pageBreakBetweenTexts,
        disableHyphenation,
        fixPunctuationSpacing,
        normalizeQuotes,
        normalizeApostrophes,
        protectProperNouns,
        removeInvisibleChars,
      };
      
      const report = await exportEditorManuscript(textes, options);
      
      // Build success message with corrections count
      const corrections = [
        report.punctuationSpacesFixed > 0 && `${report.punctuationSpacesFixed} espaces corrigés`,
        report.quotesNormalized > 0 && `${report.quotesNormalized} guillemets normalisés`,
        report.invisibleCharsRemoved > 0 && `${report.invisibleCharsRemoved} caractères invisibles supprimés`,
        report.softHyphensRemoved > 0 && `${report.softHyphensRemoved} césures supprimées`,
      ].filter(Boolean);
      
      if (corrections.length > 0) {
        toast.success(`Manuscrit exporté avec ${corrections.length} types de corrections`, {
          description: corrections.join(', '),
        });
      } else {
        toast.success('Manuscrit exporté avec succès');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export du manuscrit');
    } finally {
      setIsExporting(false);
    }
  };
  
  const totalCorrections = 
    previewReport.punctuationSpacesFixed +
    previewReport.quotesNormalized +
    previewReport.apostrophesNormalized +
    previewReport.invisibleCharsRemoved +
    previewReport.softHyphensRemoved;
  
  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              <strong>Format manuscrit sobre</strong> : Times New Roman 12pt, interligne 1.5, 
              marges uniformes, alignement à gauche. Aucun design, aucune maquette.
            </p>
            <p>
              <strong>Éditeurs cibles</strong> : Cheyne, Gallimard, Bruno Doucey, Le Castor Astral, 
              Lanskine, Tarabuste, Wildproject, La rumeur libre.
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge className="gap-1 bg-slate-700 text-white">
          <ScrollText className="h-3 w-3" />
          {textes.length} textes
        </Badge>
        {totalCorrections > 0 && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {totalCorrections} corrections prévues
          </Badge>
        )}
      </div>
      
      <Separator />
      
      {/* Metadata section */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
          Métadonnées du manuscrit
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">Titre du manuscrit</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre principal"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-slate-700 dark:text-slate-300">Sous-titre (optionnel)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Sous-titre ou mention complémentaire"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author" className="text-slate-700 dark:text-slate-300">Nom de l'auteur</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Prénom Nom"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email de contact</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 00 00 00 00"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="showContact"
              checked={showContactOnCover}
              onCheckedChange={(checked) => setShowContactOnCover(!!checked)}
            />
            <Label htmlFor="showContact" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Afficher les coordonnées sur la page de titre
            </Label>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Content options */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
          Options de contenu
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="coverPage"
              checked={includeCoverPage}
              onCheckedChange={(checked) => setIncludeCoverPage(!!checked)}
            />
            <Label htmlFor="coverPage" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Page de titre sobre
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="toc"
              checked={includeTableOfContents}
              onCheckedChange={(checked) => setIncludeTableOfContents(!!checked)}
            />
            <Label htmlFor="toc" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Table des matières simple
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="locationDate"
              checked={showLocationDate}
              onCheckedChange={(checked) => setShowLocationDate(!!checked)}
            />
            <Label htmlFor="locationDate" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Mentions de lieu/date sous les titres
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pageBreak"
              checked={pageBreakBetweenTexts}
              onCheckedChange={(checked) => setPageBreakBetweenTexts(!!checked)}
            />
            <Label htmlFor="pageBreak" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Saut de page entre chaque texte
            </Label>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Typography cleaning options */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
          Nettoyage typographique automatique
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hyphenation"
              checked={disableHyphenation}
              onCheckedChange={(checked) => setDisableHyphenation(!!checked)}
            />
            <Label htmlFor="hyphenation" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Désactiver toutes les césures
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="punctuation"
              checked={fixPunctuationSpacing}
              onCheckedChange={(checked) => setFixPunctuationSpacing(!!checked)}
            />
            <Label htmlFor="punctuation" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Corriger les espaces avant ponctuation
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quotes"
              checked={normalizeQuotes}
              onCheckedChange={(checked) => setNormalizeQuotes(!!checked)}
            />
            <Label htmlFor="quotes" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Normaliser les guillemets français
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apostrophes"
              checked={normalizeApostrophes}
              onCheckedChange={(checked) => setNormalizeApostrophes(!!checked)}
            />
            <Label htmlFor="apostrophes" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Normaliser les apostrophes
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="properNouns"
              checked={protectProperNouns}
              onCheckedChange={(checked) => setProtectProperNouns(!!checked)}
            />
            <Label htmlFor="properNouns" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Protéger les noms propres (Dordogne, Acipenser...)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="invisibleChars"
              checked={removeInvisibleChars}
              onCheckedChange={(checked) => setRemoveInvisibleChars(!!checked)}
            />
            <Label htmlFor="invisibleChars" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
              Supprimer les caractères invisibles
            </Label>
          </div>
        </div>
      </div>
      
      {/* Preview report */}
      {totalCorrections > 0 && (
        <>
          <Separator />
          
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
            <h4 className="font-medium text-sm text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Rapport de pré-vol
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {previewReport.punctuationSpacesFixed > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewReport.punctuationSpacesFixed} espaces
                </div>
              )}
              {previewReport.quotesNormalized > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewReport.quotesNormalized} guillemets
                </div>
              )}
              {previewReport.apostrophesNormalized > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewReport.apostrophesNormalized} apostrophes
                </div>
              )}
              {previewReport.invisibleCharsRemoved > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewReport.invisibleCharsRemoved} invisibles
                </div>
              )}
              {previewReport.softHyphensRemoved > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewReport.softHyphensRemoved} césures
                </div>
              )}
              {previewReport.properNounsProtected > 0 && (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewReport.properNounsProtected} noms protégés
                </div>
              )}
            </div>
            
            {previewReport.warnings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-900">
                {previewReport.warnings.map((warning, i) => (
                  <div key={i} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <AlertTriangle className="h-3 w-3" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      <Separator />
      
      {/* Export button */}
      <Button
        onClick={handleExport}
        disabled={isExporting || textes.length === 0 || !title || !author}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white"
        size="lg"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Génération en cours...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le manuscrit .docx
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Le fichier sera nommé : MANUSCRIT_{title.substring(0, 20).replace(/\s/g, '_')}_{new Date().toISOString().split('T')[0]}.docx
      </p>
    </div>
  );
};

export default EditorExportPanel;
