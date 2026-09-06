import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { ProprieteTour, TourAction, TourVolet } from '@/hooks/propriete/useProprieteTours';
import { SCHEMA_LABELS, type SchemaKey } from '../GardenSchema';

/**
 * Carnet de terrain : une fiche sobre, imprimable, pensée pour être annotée
 * au crayon pendant le tour de jardin. Pas d'emoji ni de caractère hors
 * Latin-1 : les polices intégrées de @react-pdf ne les couvrent pas.
 */

export interface CarnetOptions {
  format: 'A5' | 'A4';
  includeContexte: boolean;
  includeNotes: boolean;
}

const VERT = '#0d6b58';
const ENCRE = '#1f2421';
const GRIS = '#6b7280';
const TRAIT = '#d8dbd6';

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 34, paddingHorizontal: 28, fontFamily: 'Helvetica', fontSize: 9, color: ENCRE, backgroundColor: '#ffffff' },
  eyebrow: { fontSize: 7, letterSpacing: 1.4, color: VERT, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: ENCRE, marginTop: 3 },
  meta: { fontSize: 8, color: GRIS, marginTop: 3 },
  identityRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 6 },
  identityLabel: { fontSize: 8, color: GRIS },
  identityLine: { flexGrow: 1, borderBottomWidth: 0.7, borderBottomColor: TRAIT, borderBottomStyle: 'dashed', height: 11 },
  rule: { borderBottomWidth: 1, borderBottomColor: VERT, marginTop: 10, marginBottom: 12 },

  contexteRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  contexteCol: { flex: 1 },
  contexteTitle: { fontSize: 7, letterSpacing: 1, fontFamily: 'Helvetica-Bold', color: VERT, marginBottom: 3 },
  contexteItem: { fontSize: 8, color: GRIS, marginBottom: 2, lineHeight: 1.35 },

  voletTitle: { fontSize: 8, letterSpacing: 1.2, fontFamily: 'Helvetica-Bold', color: VERT, marginTop: 6, marginBottom: 5 },

  action: { borderWidth: 0.7, borderColor: TRAIT, borderRadius: 4, padding: 7, marginBottom: 7 },
  actionHead: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  box: { width: 11, height: 11, borderWidth: 1, borderColor: VERT, borderRadius: 2, marginTop: 0.5 },
  actionTitle: { flex: 1, fontSize: 9.5, fontFamily: 'Helvetica-Bold', lineHeight: 1.3 },
  dots: { flexDirection: 'row', gap: 2, marginTop: 3.5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  detail: { fontSize: 8, color: GRIS, lineHeight: 1.4, marginTop: 4, marginLeft: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5, marginLeft: 17 },
  chip: { fontSize: 6.5, color: VERT, borderWidth: 0.6, borderColor: VERT, borderRadius: 6, paddingVertical: 1.5, paddingHorizontal: 4 },
  faitRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 7, marginLeft: 17 },
  faitLabel: { fontSize: 7.5, color: GRIS },
  faitLine: { width: 78, borderBottomWidth: 0.7, borderBottomColor: TRAIT, height: 10 },
  noteLine: { borderBottomWidth: 0.6, borderBottomColor: TRAIT, borderBottomStyle: 'dashed', height: 13, marginLeft: 17, marginTop: 3 },

  notesBlock: { marginTop: 10 },
  notesTitle: { fontSize: 7.5, letterSpacing: 1, fontFamily: 'Helvetica-Bold', color: VERT, marginBottom: 4 },

  urlNote: { marginTop: 10, fontSize: 6.5, color: GRIS },
  footer: { position: 'absolute', bottom: 16, left: 28, right: 28, borderTopWidth: 0.7, borderTopColor: TRAIT, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  footerText: { width: '74%', fontSize: 6.5, color: GRIS },
  footerPage: { width: '26%', fontSize: 6.5, color: GRIS, textAlign: 'right' },
});

const VOLET_LABEL: Record<TourVolet, string> = {
  observer: 'OBSERVER',
  biodiversite: 'DEVELOPPER LA BIODIVERSITE',
  resilience: 'RENFORCER LA RESILIENCE',
};
const VOLET_ORDER: TourVolet[] = ['observer', 'biodiversite', 'resilience'];

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d.length <= 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

/** Helvetica ne couvre pas tous les signes : on ramène le texte au Latin-1. */
const clean = (s: string) =>
  (s || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u0153/g, 'oe')
    .replace(/\u0152/g, 'OE')
    .replace(/\u00e6/g, 'ae')
    .replace(/\u00c6/g, 'AE')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\u0000-\u00ff]/g, '')
    .trim();

export interface DocProps {
  tour: ProprieteTour;
  actions: TourAction[];
  proprieteNom: string;
  options: CarnetOptions;
  pageUrl?: string;
}

const CarnetTerrainDocument = ({ tour, actions, proprieteNom, options, pageUrl }: DocProps) => {
  const editedOn = new Date().toLocaleDateString('fr-FR');
  const shortUrl = clean((pageUrl ?? '').replace(/^https?:\/\//, '')).slice(0, 70);
  const groups = VOLET_ORDER.map((v) => ({ volet: v, items: actions.filter((a) => a.volet === v) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <Document title={clean(`Carnet de terrain - ${tour.titre}`)}>
      <Page size={options.format} style={styles.page} wrap>
        {/* Bandeau */}
        <View>
          <Text style={styles.eyebrow}>CARNET DE TERRAIN - TOUR DE JARDIN</Text>
          <Text style={styles.title}>{clean(tour.titre)}</Text>
          <Text style={styles.meta}>
            {clean(proprieteNom)} · {fmtDate(tour.date_tour)}
            {tour.heure_tour ? ` a ${tour.heure_tour.slice(0, 5).replace(':', 'h')}` : ''}
            {tour.duree_min ? ` · ${tour.duree_min} min` : ''}
            {tour.saison ? ` · ${clean(tour.saison)}` : ''}
            {` · ${actions.length} action${actions.length > 1 ? 's' : ''}`}
          </Text>
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Marcheur :</Text>
            <View style={styles.identityLine} />
            <Text style={styles.identityLabel}>Météo / heure :</Text>
            <View style={styles.identityLine} />
          </View>
        </View>
        <View style={styles.rule} />

        {/* Contexte */}
        {options.includeContexte && (tour.points_forts.length > 0 || tour.potentiels.length > 0) && (
          <View style={styles.contexteRow}>
            <View style={styles.contexteCol}>
              <Text style={styles.contexteTitle}>CE QUI VA BIEN</Text>
              {tour.points_forts.slice(0, 5).map((p, i) => (
                <Text key={i} style={styles.contexteItem}>· {clean(p)}</Text>
              ))}
              {tour.points_forts.length === 0 && <Text style={styles.contexteItem}>-</Text>}
            </View>
            <View style={styles.contexteCol}>
              <Text style={styles.contexteTitle}>LE POTENTIEL</Text>
              {tour.potentiels.slice(0, 5).map((p, i) => (
                <Text key={i} style={styles.contexteItem}>· {clean(p)}</Text>
              ))}
              {tour.potentiels.length === 0 && <Text style={styles.contexteItem}>-</Text>}
            </View>
          </View>
        )}

        {/* Actions */}
        {groups.map((g) => (
          <View key={g.volet}>
            <Text style={styles.voletTitle}>{VOLET_LABEL[g.volet]}</Text>
            {g.items.map((a) => {
              const chips = [
                ...(a.schema_key ? [SCHEMA_LABELS[a.schema_key as SchemaKey] ?? a.schema_key] : []),
                ...(a.moment ? [a.moment] : []),
                ...((a.refs ?? []).map((r) => r.label) ?? []),
              ]
                .map(clean)
                .filter(Boolean)
                .slice(0, 6);

              return (
                <View key={a.id} style={styles.action}>
                  <View style={styles.actionHead} wrap={false}>
                    <View style={styles.box} />
                    <Text style={styles.actionTitle}>{clean(a.titre)}</Text>
                    <View style={styles.dots}>
                      {[1, 2, 3].map((n) => (
                        <View
                          key={n}
                          style={[styles.dot, { backgroundColor: n <= (a.difficulte || 1) ? VERT : TRAIT }]}
                        />
                      ))}
                    </View>
                  </View>

                  {a.detail && <Text style={styles.detail}>{clean(a.detail).slice(0, 320)}</Text>}

                  {chips.length > 0 && (
                    <View style={styles.chipRow}>
                      {chips.map((c, i) => (
                        <Text key={i} style={styles.chip}>{c}</Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.faitRow}>
                    <Text style={styles.faitLabel}>Fait le</Text>
                    <View style={styles.faitLine} />
                    <Text style={styles.faitLabel}>Note :</Text>
                    <View style={[styles.faitLine, { flexGrow: 1, width: 'auto' }]} />
                  </View>
                  {options.includeNotes && <View style={styles.noteLine} />}
                </View>
              );
            })}
          </View>
        ))}

        {options.includeNotes && (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesTitle}>CE QUE J'AI VU, ENTENDU, SENTI</Text>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.noteLine, { marginLeft: 0 }]} />
            ))}
          </View>
        )}

        {shortUrl ? <Text style={styles.urlNote}>{shortUrl}</Text> : null}

      <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            De retour : reportez vos dates dans l'espace Tour de Jardin.
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `Édité le ${editedOn} - ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

export function carnetFilename(props: DocProps) {
  return `carnet-tour-${props.tour.date_tour}.pdf`;
}

export async function buildCarnetPdfBlob(props: DocProps): Promise<Blob> {
  return await pdf(<CarnetTerrainDocument {...props} />).toBlob();
}

export async function exportCarnetPdf(props: DocProps) {
  const blob = await buildCarnetPdfBlob(props);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = carnetFilename(props);
  a.click();
  URL.revokeObjectURL(url);
}

export default CarnetTerrainDocument;
