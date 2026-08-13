import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { fiche, FICHE_URL } from '@/content/frequenceJardinFiche';

const C = {
  ink: '#14201b',
  soft: '#4b5b54',
  line: '#d8e0da',
  accent: '#0d6b58',
  paper: '#fbfaf6',
};

const s = StyleSheet.create({
  page: { padding: 44, paddingBottom: 62, backgroundColor: C.paper, fontFamily: 'Helvetica', fontSize: 10, color: C.ink },
  cover: { padding: 54, backgroundColor: C.paper, fontFamily: 'Helvetica', color: C.ink },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: C.accent, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  coverTitle: { fontSize: 38, fontFamily: 'Helvetica-Bold', color: C.ink, marginTop: 18, marginBottom: 10 },
  coverBaseline: { fontSize: 13, color: C.accent, lineHeight: 1.5, marginBottom: 22 },
  coverSummary: { fontSize: 10.5, color: C.soft, lineHeight: 1.7, marginBottom: 26 },
  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 16 },
  metaRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.line },
  metaLabel: { width: 90, fontSize: 8.5, color: C.accent, fontFamily: 'Helvetica-Bold' },
  metaValue: { flex: 1, fontSize: 9, color: C.soft, lineHeight: 1.5 },
  h2: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 4 },
  h2num: { fontSize: 8, color: C.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, marginBottom: 3 },
  sectionHead: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  intro: { fontSize: 9.5, color: C.soft, lineHeight: 1.6, marginBottom: 10 },
  bullet: { flexDirection: 'row', marginBottom: 6 },
  dot: { width: 10, fontSize: 9.5, color: C.accent },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.55, color: C.ink },
  item: { marginBottom: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: C.accent },
  itemName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 3 },
  itemDesc: { fontSize: 9.5, lineHeight: 1.55, color: C.soft },
  section: { marginBottom: 20 },
  footer: {
    position: 'absolute', bottom: 26, left: 44, right: 44,
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 7.5, color: '#8a978f',
  },
});

const Bullet = ({ children }: { children: string }) => (
  <View style={s.bullet} wrap={false}>
    <Text style={s.dot}>—</Text>
    <Text style={s.bulletText}>{children}</Text>
  </View>
);

const FicheDoc = () => (
  <Document title={`${fiche.name} — fiche application`} author="La Frequence du Vivant">
    <Page size="A4" style={s.cover}>
      <Text style={s.eyebrow}>Fiche application</Text>
      <Text style={s.coverTitle}>{fiche.name}</Text>
      <Text style={s.coverBaseline}>{fiche.baseline}</Text>
      <Text style={s.coverSummary}>{fiche.summary}</Text>
      <View style={s.rule} />
      {fiche.meta.map((m) => (
        <View key={m.label} style={s.metaRow}>
          <Text style={s.metaLabel}>{m.label}</Text>
          <Text style={s.metaValue}>{m.value}</Text>
        </View>
      ))}
    </Page>

    <Page size="A4" style={s.page}>
      {fiche.sections.map((sec, i) => (
        <View key={sec.id} style={s.section} wrap>
          <View style={s.sectionHead} minPresenceAhead={90}>
            <Text style={s.h2num}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={s.h2}>{sec.title}</Text>
          </View>
          {sec.intro ? <Text style={s.intro}>{sec.intro}</Text> : null}
          {sec.bullets?.map((b, k) => <Bullet key={k}>{b}</Bullet>)}
          {sec.items?.map((it) => (
            <View key={it.name} style={s.item} wrap={false}>
              <Text style={s.itemName}>{it.name}</Text>
              <Text style={s.itemDesc}>{it.desc}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={s.footer} fixed>
        <Text>{fiche.name} — La Frequence du Vivant</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

/** Génère et télécharge la fiche au format PDF. */
export async function downloadFichePdf() {
  const blob = await pdf(<FicheDoc />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'frequence-jardin-fiche-application.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export { FICHE_URL };
export default FicheDoc;
