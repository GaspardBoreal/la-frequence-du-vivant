import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { 
  PdfExportOptions, 
  TexteExport, 
  sanitizeContentForPdf, 
  isHaiku, 
  isFable,
  formatPageNumber,
  generateColophonText,
  getPageDimensions,
  mmToPoints,
} from './pdfExportUtils';
import { generatePdfStyles, PdfStylesRaw, registerFonts } from './pdfStyleGenerator';

// ============================================================================
// TYPES
// ============================================================================

export interface PartieData {
  id: string;
  numeroRomain: string;
  titre: string;
  sousTitre?: string;
  ordre: number;
}

export interface MarcheData {
  id: string;
  nom: string;
  ville: string;
  region?: string;
  date?: string;
  ordre: number;
}

export interface TocEntry {
  type: 'partie' | 'marche' | 'texte';
  title: string;
  pageNumber: number;
  partieNumero?: string;
  indent?: number;
  ville?: string;
}

// Helper to merge styles
const mergeStyles = (...styles: (Style | undefined)[]): Style => {
  return styles.filter(Boolean).reduce((acc, style) => ({ ...acc, ...style }), {}) as Style;
};

// ============================================================================
// COVER PAGE
// ============================================================================

interface CoverPageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const CoverPage: React.FC<CoverPageProps> = ({ options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={styles.coverPage as Style}>
      <View style={styles.coverContent as Style}>
        <View style={styles.coverDecoration as Style} />
        <Text style={styles.coverTitle as Style}>{options.title}</Text>
        {options.subtitle && (
          <Text style={styles.coverSubtitle as Style}>{options.subtitle}</Text>
        )}
        <View style={styles.coverDecoration as Style} />
        <Text style={styles.coverAuthor as Style}>{options.author}</Text>
        {options.publisher && (
          <Text style={styles.coverPublisher as Style}>{options.publisher}</Text>
        )}
      </View>
    </Page>
  );
};

// ============================================================================
// FAUX-TITRE PAGE
// ============================================================================

interface FauxTitrePageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const FauxTitrePage: React.FC<FauxTitrePageProps> = ({ options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)}>
      <View style={styles.fauxTitrePage as Style}>
        <View style={styles.fauxTitreContent as Style}>
          <Text style={styles.fauxTitreTitle as Style}>{options.title}</Text>
          <Text style={styles.fauxTitreAuthor as Style}>{options.author}</Text>
        </View>
      </View>
    </Page>
  );
};

// ============================================================================
// TABLE OF CONTENTS PAGE
// ============================================================================

interface TocPageProps {
  entries: TocEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
}

export const TocPage: React.FC<TocPageProps> = ({ entries, options, styles, pageNumber }) => {
  const dimensions = getPageDimensions(options);
  const isOdd = pageNumber % 2 === 1;
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)} wrap>
      <View style={styles.tocPage as Style}>
        <Text style={styles.tocTitle as Style}>
          {options.language === 'fr' ? 'Table des Matières' : 'Table of Contents'}
        </Text>
        
        {entries.map((entry, index) => (
          <View key={index} style={styles.tocEntry as Style} wrap={false}>
            {entry.type === 'partie' && (
              <Text style={styles.tocPartie as Style}>
                {entry.partieNumero && `${entry.partieNumero} · `}{entry.title}
              </Text>
            )}
            {entry.type === 'marche' && (
              <View style={{ flexDirection: 'row', alignItems: 'center' } as Style}>
                <Text style={styles.tocMarche as Style}>
                  {entry.title}{entry.ville ? ` (${entry.ville})` : ''}
                </Text>
                <View style={styles.tocDotLeader as Style} />
                <Text style={styles.tocPageNumber as Style}>{entry.pageNumber}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      
      <Text style={mergeStyles(styles.pageNumber, isOdd ? styles.pageNumberOdd : styles.pageNumberEven)} fixed>
        {formatPageNumber(pageNumber, options.pageNumberStyle, true)}
      </Text>
    </Page>
  );
};

// ============================================================================
// PARTIE (MOVEMENT) PAGE
// ============================================================================

interface PartiePageProps {
  partie: PartieData;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
}

export const PartiePage: React.FC<PartiePageProps> = ({ partie, options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageOdd)}>
      <View style={styles.partiePage as Style}>
        <View style={styles.partieContent as Style}>
          <Text style={styles.partieNumeral as Style}>{partie.numeroRomain}</Text>
          <Text style={styles.partieTitre as Style}>{partie.titre}</Text>
          {partie.sousTitre && (
            <Text style={styles.partieSousTitre as Style}>{partie.sousTitre}</Text>
          )}
          <Text style={styles.partieSeparator as Style}>───────────────────</Text>
        </View>
      </View>
    </Page>
  );
};

// ============================================================================
// MARCHE HEADER COMPONENT
// ============================================================================

interface MarcheHeaderProps {
  marche: MarcheData;
  styles: PdfStylesRaw;
}

export const MarcheHeader: React.FC<MarcheHeaderProps> = ({ marche, styles }) => (
  <View style={styles.marcheHeader as Style}>
    <Text style={styles.marcheTitre as Style}>{marche.nom || marche.ville}</Text>
    {marche.region && (
      <Text style={styles.marcheLocation as Style}>{marche.ville}, {marche.region}</Text>
    )}
    {marche.date && (
      <Text style={styles.marcheDate as Style}>{marche.date}</Text>
    )}
  </View>
);

// ============================================================================
// HAIKU PAGE - CENTERED LAYOUT
// ============================================================================

interface HaikuPageProps {
  texte: TexteExport;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
  content: string;
}

// Haiku/Senryu rendered inline (not as separate page) for space efficiency
export const HaikuBlock: React.FC<{ texte: TexteExport; styles: PdfStylesRaw; content: string }> = ({ texte, styles, content }) => {
  // Split haiku content into individual lines for proper centering
  const lines = content
    .split(/\r?\n+/)
    .map(line => line.trim())
    .filter(Boolean);
  
  return (
    <View style={styles.haikuBlock as Style} wrap={false}>
      <Text style={styles.haikuTitle as Style}>{texte.titre}</Text>
      <View style={styles.haikuSeparator as Style} />
      <View style={{ alignItems: 'center', marginTop: mmToPoints(4) } as Style}>
        {lines.map((line, idx) => (
          <Text key={idx} style={styles.haikuLine as Style}>{line}</Text>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// FABLE PAGE - FRAMED LAYOUT
// ============================================================================

interface FablePageProps {
  texte: TexteExport;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
  content: string;
}

export const FablePage: React.FC<FablePageProps> = ({ texte, options, styles, pageNumber, content }) => {
  const dimensions = getPageDimensions(options);
  const isOdd = pageNumber % 2 === 1;
  
  // Detect and extract moral from content (common patterns: "Morale :", "MORALE", "La morale")
  const extractMoral = (text: string): { main: string; moral: string | null } => {
    const moralPatterns = [
      /\n\s*(Morale\s*:\s*.+)$/i,
      /\n\s*(MORALE\s*:\s*.+)$/i,
      /\n\s*(La morale\s*:\s*.+)$/i,
    ];
    
    for (const pattern of moralPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          main: text.replace(match[0], '').trim(),
          moral: match[1].trim(),
        };
      }
    }
    return { main: text, moral: null };
  };
  
  const { main: mainContent, moral } = extractMoral(content);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)} wrap>
      <View style={styles.fableContainer as Style}>
        {/* Header with ornament and title */}
        <View style={styles.fableHeader as Style}>
          <Text style={styles.fableHeaderLabel as Style}>❦ FABLE ❦</Text>
          <Text style={styles.fableTitle as Style}>{texte.titre}</Text>
        </View>
        
        {/* Main content in roman (not italic) */}
        <Text style={styles.fableContent as Style}>{mainContent}</Text>
        
        {/* Moral section if detected */}
        {moral && (
          <Text style={styles.fableMoral as Style}>{moral}</Text>
        )}
      </View>
      
      <Text style={mergeStyles(styles.pageNumber, isOdd ? styles.pageNumberOdd : styles.pageNumberEven)}>
        {formatPageNumber(pageNumber, options.pageNumberStyle)}
      </Text>
    </Page>
  );
};

// ============================================================================
// TEXTE PAGE - STANDARD
// ============================================================================

interface TextePageProps {
  texte: TexteExport;
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
  showMarcheHeader?: boolean;
  marche?: MarcheData;
}

export const TextePage: React.FC<TextePageProps> = ({ 
  texte, 
  options, 
  styles, 
  pageNumber,
  showMarcheHeader,
  marche,
}) => {
  const dimensions = getPageDimensions(options);
  const isOdd = pageNumber % 2 === 1;
  const content = sanitizeContentForPdf(texte.contenu);
  
  const isHaikuText = isHaiku(texte);
  const isFableText = isFable(texte);
  
  // Haikus are rendered inline (not as separate centered page)
  if (isHaikuText) {
    return (
      <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)}>
        <View style={styles.textePage as Style}>
          {showMarcheHeader && marche && (
            <MarcheHeader marche={marche} styles={styles} />
          )}
          <HaikuBlock texte={texte} styles={styles} content={content} />
        </View>
        
        <Text style={mergeStyles(styles.pageNumber, isOdd ? styles.pageNumberOdd : styles.pageNumberEven)}>
          {formatPageNumber(pageNumber, options.pageNumberStyle)}
        </Text>
      </Page>
    );
  }
  
  if (isFableText) {
    return (
      <FablePage 
        texte={texte} 
        options={options} 
        styles={styles} 
        pageNumber={pageNumber}
        content={content}
      />
    );
  }
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)}>
      <View style={styles.textePage as Style}>
        {showMarcheHeader && marche && (
          <MarcheHeader marche={marche} styles={styles} />
        )}
        
        <View style={styles.texteContainer as Style}>
          <Text style={styles.texteTitle as Style}>{texte.titre}</Text>
          <Text style={styles.texteContent as Style}>{content}</Text>
          
          {options.includeMetadata && texte.type_texte && (
            <Text style={styles.texteMetadata as Style}>
              {texte.type_texte}
              {texte.marche_ville && ` · ${texte.marche_ville}`}
            </Text>
          )}
        </View>
      </View>
      
      <Text style={mergeStyles(styles.pageNumber, isOdd ? styles.pageNumberOdd : styles.pageNumberEven)}>
        {formatPageNumber(pageNumber, options.pageNumberStyle)}
      </Text>
    </Page>
  );
};

// ============================================================================
// INDEX PAGE
// ============================================================================

interface IndexEntry {
  title: string;
  pages: number[];
}

interface IndexPageProps {
  title: string;
  entries: IndexEntry[];
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  pageNumber: number;
}

export const IndexPage: React.FC<IndexPageProps> = ({ title, entries, options, styles, pageNumber }) => {
  const dimensions = getPageDimensions(options);
  const isOdd = pageNumber % 2 === 1;
  
  const midpoint = Math.ceil(entries.length / 2);
  const leftColumn = entries.slice(0, midpoint);
  const rightColumn = entries.slice(midpoint);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)}>
      <View style={styles.indexPage as Style}>
        <Text style={styles.indexTitle as Style}>{title}</Text>
        
        <View style={styles.indexColumns as Style}>
          <View style={styles.indexColumn as Style}>
            {leftColumn.map((entry, index) => (
              <View key={index} style={styles.indexEntry as Style}>
                <Text style={styles.indexEntryTitle as Style}>{entry.title}</Text>
                <Text style={styles.indexEntryPage as Style}>
                  {entry.pages.join(', ')}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.indexColumn as Style}>
            {rightColumn.map((entry, index) => (
              <View key={index} style={styles.indexEntry as Style}>
                <Text style={styles.indexEntryTitle as Style}>{entry.title}</Text>
                <Text style={styles.indexEntryPage as Style}>
                  {entry.pages.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <Text style={mergeStyles(styles.pageNumber, isOdd ? styles.pageNumberOdd : styles.pageNumberEven)}>
        {formatPageNumber(pageNumber, options.pageNumberStyle)}
      </Text>
    </Page>
  );
};

// ============================================================================
// COLOPHON PAGE
// ============================================================================

interface ColophonPageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
  texteCount: number;
  pageNumber: number;
}

export const ColophonPage: React.FC<ColophonPageProps> = ({ options, styles, texteCount, pageNumber }) => {
  const dimensions = getPageDimensions(options);
  const isOdd = pageNumber % 2 === 1;
  const colophonText = generateColophonText(options, texteCount);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, isOdd ? styles.pageOdd : styles.pageEven)}>
      <View style={styles.colophonPage as Style}>
        <View style={styles.colophonContent as Style}>
          <View style={styles.separator as Style} />
          <Text style={styles.colophonText as Style}>{colophonText}</Text>
        </View>
      </View>
    </Page>
  );
};

// ============================================================================
// BLANK PAGE (for verso pages)
// ============================================================================

interface BlankPageProps {
  options: PdfExportOptions;
  styles: PdfStylesRaw;
}

export const BlankPage: React.FC<BlankPageProps> = ({ options, styles }) => {
  const dimensions = getPageDimensions(options);
  
  return (
    <Page size={[dimensions.width, dimensions.height]} style={mergeStyles(styles.page, styles.pageEven)}>
      <View />
    </Page>
  );
};

// ============================================================================
// MAIN PDF DOCUMENT COMPONENT
// ============================================================================

interface PdfDocumentProps {
  textes: TexteExport[];
  options: PdfExportOptions;
  parties?: PartieData[];
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({ textes, options, parties = [] }) => {
  const styles = generatePdfStyles(options);
  
  const groupedContent = groupTextesByStructure(textes, parties, options);
  const tocEntries = buildTocEntries(groupedContent, options);
  
  let currentPage = 1;
  
  return (
    <Document
      title={options.title}
      author={options.author}
      subject={options.description}
      language={options.language}
      creator="La Fréquence du Vivant - Export PDF Pro"
    >
      {options.includeCover && (
        <CoverPage options={options} styles={styles} />
      )}
      
      {options.includeFauxTitre && (
        <FauxTitrePage options={options} styles={styles} />
      )}
      
      {options.includeTableOfContents && tocEntries.length > 0 && (
        <TocPage 
          entries={tocEntries} 
          options={options} 
          styles={styles} 
          pageNumber={currentPage++}
        />
      )}
      
      {groupedContent.map((item, index) => {
        if (item.type === 'partie' && item.partie) {
          return (
            <PartiePage 
              key={`partie-${item.partie.id}`}
              partie={item.partie}
              options={options}
              styles={styles}
              pageNumber={currentPage++}
            />
          );
        }
        
        if (item.type === 'texte' && item.texte) {
          return (
            <TextePage
              key={`texte-${item.texte.id}`}
              texte={item.texte}
              options={options}
              styles={styles}
              pageNumber={currentPage++}
              showMarcheHeader={item.isFirstInMarche}
              marche={item.marche}
            />
          );
        }
        
        return null;
      })}
      
      {options.includeColophon && (
        <ColophonPage 
          options={options} 
          styles={styles} 
          texteCount={textes.length}
          pageNumber={currentPage++}
        />
      )}
    </Document>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface GroupedItem {
  type: 'partie' | 'texte';
  partie?: PartieData;
  texte?: TexteExport;
  marche?: MarcheData;
  isFirstInMarche?: boolean;
}

function groupTextesByStructure(
  textes: TexteExport[], 
  parties: PartieData[],
  options: PdfExportOptions
): GroupedItem[] {
  const result: GroupedItem[] = [];
  
  if (options.organizationMode === 'marche') {
    const partiesMap = new Map<string, TexteExport[]>();
    
    textes.forEach(texte => {
      const partieId = texte.partie_id || 'no-partie';
      if (!partiesMap.has(partieId)) {
        partiesMap.set(partieId, []);
      }
      partiesMap.get(partieId)!.push(texte);
    });
    
    const sortedParties = [...parties].sort((a, b) => a.ordre - b.ordre);
    
    sortedParties.forEach(partie => {
      if (options.includePartiePages) {
        result.push({ type: 'partie', partie });
      }
      
      const partieTextes = partiesMap.get(partie.id) || [];
      
      const marcheGroups = new Map<string, { textes: TexteExport[]; marcheOrdre: number }>();
      partieTextes.forEach(texte => {
        const marcheKey = texte.marche_nom || texte.marche_ville || 'no-marche';
        if (!marcheGroups.has(marcheKey)) {
          marcheGroups.set(marcheKey, { textes: [], marcheOrdre: texte.marche_ordre || 999 });
        }
        marcheGroups.get(marcheKey)!.textes.push(texte);
      });
      
      // Sort marches by marche_ordre (like Word export)
      const sortedMarcheEntries = Array.from(marcheGroups.entries())
        .sort((a, b) => a[1].marcheOrdre - b[1].marcheOrdre);
      
      sortedMarcheEntries.forEach(([marcheName, marcheData]) => {
        // Sort textes within marche by ordre
        const sortedTextes = marcheData.textes.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        
        sortedTextes.forEach((texte, index) => {
          const marche: MarcheData = {
            id: texte.marche_nom || marcheName,
            nom: texte.marche_nom || marcheName,
            ville: texte.marche_ville || '',
            region: texte.marche_region,
            date: texte.marche_date,
            ordre: texte.marche_ordre || 0,
          };
          
          result.push({
            type: 'texte',
            texte,
            marche,
            isFirstInMarche: index === 0,
          });
        });
      });
    });
    
    const noPartieTextes = partiesMap.get('no-partie') || [];
    if (noPartieTextes.length > 0) {
      noPartieTextes.forEach((texte, index) => {
        result.push({
          type: 'texte',
          texte,
          isFirstInMarche: index === 0,
        });
      });
    }
  } else {
    const typeGroups = new Map<string, TexteExport[]>();
    textes.forEach(texte => {
      const type = texte.type_texte || 'Autre';
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(texte);
    });
    
    typeGroups.forEach((typeTextes) => {
      typeTextes.forEach((texte, index) => {
        result.push({
          type: 'texte',
          texte,
          isFirstInMarche: index === 0,
        });
      });
    });
  }
  
  return result;
}

function buildTocEntries(groupedContent: GroupedItem[], options: PdfExportOptions): TocEntry[] {
  const entries: TocEntry[] = [];
  let pageNumber = options.startPageNumber;
  
  // Simplified page counting: cover + faux-titre are single pages now (no blanks)
  if (options.includeCover) pageNumber += 1;
  if (options.includeFauxTitre) pageNumber += 1;
  if (options.includeTableOfContents) pageNumber += 1;
  
  // Track which marches we've already added to ToC
  const seenMarches = new Set<string>();
  
  groupedContent.forEach(item => {
    if (item.type === 'partie' && item.partie) {
      entries.push({
        type: 'partie',
        title: item.partie.titre,
        pageNumber,
        partieNumero: item.partie.numeroRomain,
      });
    }
    
    // Only add marche entry for first text in that marche
    if (item.type === 'texte' && item.texte && item.isFirstInMarche && item.marche) {
      const marcheKey = item.marche.nom || item.marche.ville;
      if (!seenMarches.has(marcheKey)) {
        seenMarches.add(marcheKey);
        entries.push({
          type: 'marche',
          title: marcheKey,
          pageNumber,
          indent: 1,
          ville: item.marche.ville || undefined, // Add ville for display in ToC
        });
      }
    }
    
    pageNumber++;
  });
  
  return entries;
}

// ============================================================================
// EXPORT FUNCTION
// ============================================================================

export { registerFonts };
