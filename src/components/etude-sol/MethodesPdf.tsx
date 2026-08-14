import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import {
  METHOD_CATEGORIES,
  METHOD_GUARANTEES,
  METHODES_DOC,
  PUBLIC_METHODS,
  STRUCTURE_CLASSES,
  TEXTURE_CLASSES,
  PH_CLASSES_PUBLIC,
  LIFE_SIGNS_PUBLIC,
  LIFE_CLASSES_PUBLIC,
  SYNTHESE_AXES,
} from '@/content/etudeDeSolMethodes';

const C = {
  ink: '#14201b',
  soft: '#4b5b54',
  line: '#d8e0da',
  accent: '#0d6b58',
  paper: '#fbfaf6',
};

const s = StyleSheet.create({
  page: { padding: 44, paddingBottom: 78, backgroundColor: C.paper, fontFamily: 'Helvetica', fontSize: 10, color: C.ink },
  cover: { padding: 54, paddingBottom: 78, backgroundColor: C.paper, fontFamily: 'Helvetica', color: C.ink },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: C.accent, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  coverTitle: { fontSize: 34, fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 10 },
  coverBaseline: { fontSize: 13, color: C.accent, lineHeight: 1.5, marginBottom: 18 },
  coverMeta: { fontSize: 9.5, color: C.soft, lineHeight: 1.6 },
  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 16 },
  h2: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  h2num: { fontSize: 8, color: C.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, marginBottom: 3 },
  sectionHead: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  section: { marginBottom: 10 },
  h3: { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: C.accent, marginTop: 10, marginBottom: 6 },
  card: { marginBottom: 12, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: C.accent },
  cardName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  cardSummary: { fontSize: 9.5, color: C.soft, lineHeight: 1.5, marginBottom: 5 },
  metaLine: { fontSize: 8.5, color: C.soft, lineHeight: 1.5, marginBottom: 4 },
  metaLabel: { fontFamily: 'Helvetica-Bold', color: C.accent },
  step: { flexDirection: 'row', marginBottom: 3 },
  stepNum: { width: 13, fontSize: 8.5, color: C.accent, fontFamily: 'Helvetica-Bold' },
  stepText: { flex: 1, fontSize: 9, lineHeight: 1.5 },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  dot: { width: 10, fontSize: 9, color: C.accent },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.5 },
  deliver: { marginTop: 4, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  optional: { fontSize: 7.5, color: C.soft, fontFamily: 'Helvetica-Oblique' },
  footer: {
    position: 'absolute', bottom: 26, left: 44, right: 44,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    fontSize: 7.5, color: '#8a978f',
  },
});

/** Helvetica ne dispose pas de → ni de × : on les translittère pour le PDF. */
const safe = (t: string) => t.replace(/→/g, '>').replace(/×/g, 'x').replace(/≈/g, '~');

const Footer = () => (
  <View style={s.footer} fixed>
    <Text>{METHODES_DOC.imprint.association} · {METHODES_DOC.url}</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

const Head: React.FC<{ num: string; title: string }> = ({ num, title }) => (
  <View style={s.sectionHead}>
    <Text style={s.h2num}>{num}</Text>
    <Text style={s.h2}>{title}</Text>
  </View>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <View>
    {items.map((t, i) => (
      <View key={i} style={s.bullet}>
        <Text style={s.dot}>—</Text>
        <Text style={s.bulletText}>{safe(t)}</Text>
      </View>
    ))}
  </View>
);

const MethodesDoc = () => {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Document title={METHODES_DOC.title} author={METHODES_DOC.imprint.association}>
      {/* Couverture */}
      <Page size="A4" style={s.cover}>
        <Text style={s.eyebrow}>Fréquence Jardin · Protocole de terrain</Text>
        <Text style={s.coverTitle}>{METHODES_DOC.title}</Text>
        <Text style={s.coverBaseline}>{METHODES_DOC.baseline}</Text>
        <View style={s.rule} />
        <Text style={s.coverMeta}>Édition du {date}</Text>
        <Text style={s.coverMeta}>{METHODES_DOC.url}</Text>
        <View style={s.rule} />
        <Text style={s.h3}>Ce que le diagnostic fait</Text>
        <Bullets items={METHODES_DOC.cadre.sert} />
        <Text style={s.h3}>Ce qu’il ne fait pas</Text>
        <Bullets items={METHODES_DOC.cadre.pasSert} />
        <Footer />
      </Page>

      {/* Protocole */}
      <Page size="A4" style={s.page}>
        <Head num="01" title="Le protocole, geste par geste" />
        {METHOD_CATEGORIES.map((cat) => {
          const list = PUBLIC_METHODS.filter((m) => m.category === cat.id);
          if (!list.length) return null;
          return (
            <View key={cat.id} style={s.section}>
              {list.map((m, mi) => (
                <View key={m.id} wrap={false}>
                  {mi === 0 ? <Text style={s.h3}>{cat.label}</Text> : null}
                  <View style={s.card}>
                  <Text style={s.cardName}>
                    {m.name} {m.optional ? <Text style={s.optional}>(optionnel)</Text> : null}
                  </Text>
                  <Text style={s.cardSummary}>{safe(m.summary)}</Text>
                  {m.material ? (
                    <Text style={s.metaLine}>
                      <Text style={s.metaLabel}>Matériel · </Text>{safe(m.material)}
                    </Text>
                  ) : null}
                  {m.steps.map((st, i) => (
                    <View key={i} style={s.step}>
                      <Text style={s.stepNum}>{i + 1}.</Text>
                      <Text style={s.stepText}>{safe(st)}</Text>
                    </View>
                  ))}
                  {m.results?.length ? (
                    <Text style={s.metaLine}>
                      <Text style={s.metaLabel}>Résultats · </Text>{safe(m.results.join(' / '))}
                    </Text>
                  ) : null}
                  {m.benchmarks?.length ? (
                    <Text style={s.metaLine}>
                      <Text style={s.metaLabel}>Repères · </Text>{safe(m.benchmarks.join(' · '))}
                    </Text>
                  ) : null}
                  <Text style={s.deliver}>Livrable : {safe(m.deliverable)}</Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
        <Footer />
      </Page>

      {/* Tables de lecture + synthèse */}
      <Page size="A4" style={s.page}>
        <Head num="02" title="Les tables de lecture" />
        <Text style={s.h3}>Classes de structure</Text>
        <Bullets items={STRUCTURE_CLASSES.map((c) => `${c.label} — ${c.reading}`)} />
        <Text style={s.h3}>Classes de texture</Text>
        <Bullets items={TEXTURE_CLASSES.map((c) => `${c.label} — ${c.reading}`)} />
        <Text style={s.h3}>Classes de pH</Text>
        <Bullets items={PH_CLASSES_PUBLIC.map((c) => `${c.label} (${c.range}) — ${c.reading}`)} />
        <Text style={s.h3}>Indices de vie relevés</Text>
        <Bullets items={LIFE_SIGNS_PUBLIC} />
        <Text style={s.h3}>Classes de vie</Text>
        <Bullets items={LIFE_CLASSES_PUBLIC.map((c) => `${c.label} — ${c.reading}`)} />
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Head num="03" title="La synthèse et les garanties" />
        <Text style={s.h3}>Les quatre curseurs</Text>
        <Bullets items={SYNTHESE_AXES.map((a) => `${a.label} — ${a.question} · ${a.steps}`)} />
        <Text style={s.h3}>Garanties de qualité</Text>
        <Bullets items={METHOD_GUARANTEES.map((g) => `${g.title} — ${g.text}`)} />
        <View style={s.rule} />
        <Text style={s.metaLine}>
          {METHODES_DOC.imprint.association} · {METHODES_DOC.imprint.contact}
        </Text>
        <Text style={s.metaLine}>{safe(METHODES_DOC.imprint.note)}</Text>
        <Footer />
      </Page>
    </Document>
  );
};

/** Génère et télécharge la fiche PDF des méthodes d'analyse de sol. */
export async function downloadMethodesPdf(): Promise<void> {
  const blob = await pdf(<MethodesDoc />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'frequence-jardin-methodes-analyse-de-sol.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export default MethodesDoc;
