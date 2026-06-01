import { Document, Page, Text, View, StyleSheet, Svg, Rect, pdf } from '@react-pdf/renderer';
import type { AuditRunFull } from '@/hooks/useAuditRuns';

const COLORS = {
  bg: '#fefdfb',
  ink: '#1a1a18',
  body: '#374151',
  muted: '#6b7280',
  line: '#e5e7eb',
  lineSoft: '#f0ebe1',
  primary: '#047857',
  primarySoft: '#ecfdf5',
  accent: '#0d9488',
  gold: '#c9a84c',
  red: '#b91c1c',
  redSoft: '#fef2f2',
  orange: '#c2410c',
  orangeSoft: '#fff7ed',
  yellow: '#a16207',
  yellowSoft: '#fefce8',
  blue: '#1d4ed8',
  blueSoft: '#eff6ff',
};

const s = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
    lineHeight: 1.5,
  },
  headerBar: {
    position: 'absolute',
    top: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 6 },
  headerTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase' },
  headerScope: { fontSize: 8, color: COLORS.muted, maxWidth: 280, textAlign: 'right' },
  footerBar: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: COLORS.muted,
  },

  // Cover
  cover: { flex: 1, justifyContent: 'space-between', paddingTop: 40, paddingBottom: 20 },
  coverEyebrow: { fontSize: 9, color: COLORS.primary, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  coverTitle: { fontSize: 36, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 12, lineHeight: 1.15 },
  coverScope: { fontSize: 18, color: COLORS.body, marginTop: 8 },
  coverRule: { height: 2, width: 80, backgroundColor: COLORS.primary, marginTop: 24, marginBottom: 24 },
  coverScoreWrap: { alignItems: 'center', marginVertical: 32 },
  coverScore: { fontSize: 120, fontFamily: 'Helvetica-Bold', color: COLORS.primary, lineHeight: 1 },
  coverScoreSub: { fontSize: 12, color: COLORS.muted, marginTop: -8 },
  coverBadge: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.primary, color: COLORS.primary, fontSize: 12, fontFamily: 'Helvetica-Bold' },
  coverMetaBlock: { borderTopWidth: 0.5, borderTopColor: COLORS.line, paddingTop: 16, marginTop: 24 },
  coverMetaRow: { flexDirection: 'row', marginBottom: 6 },
  coverMetaKey: { width: 90, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  coverMetaVal: { flex: 1, fontSize: 10, color: COLORS.ink },
  coverFooter: { fontSize: 8, color: COLORS.muted, textAlign: 'center' },

  // Sections
  sectionTag: { fontSize: 8, color: COLORS.primary, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  h1: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 16 },
  h2: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 18, marginBottom: 8 },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 4 },
  lead: { fontSize: 11, color: COLORS.body, lineHeight: 1.7 },

  card: { borderWidth: 0.5, borderColor: COLORS.line, borderRadius: 4, padding: 12, marginBottom: 8, backgroundColor: '#ffffff' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 },
  cardTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: COLORS.ink, flex: 1 },
  cardBody: { fontSize: 9.5, color: COLORS.body, lineHeight: 1.6 },

  badge: { fontSize: 7.5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, backgroundColor: COLORS.lineSoft, color: COLORS.body, fontFamily: 'Helvetica-Bold' },
  badgeRow: { flexDirection: 'row', gap: 4 },

  // Domain card
  domainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  domainCard: { width: '48%', borderWidth: 0.5, borderColor: COLORS.line, borderRadius: 4, padding: 10, backgroundColor: '#ffffff' },
  domainLabel: { fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  domainScore: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.ink },
  domainScoreMax: { fontSize: 11, color: COLORS.muted, fontFamily: 'Helvetica' },

  // Table
  tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.line, paddingVertical: 6 },
  tHead: { backgroundColor: COLORS.primarySoft, paddingVertical: 6, paddingHorizontal: 6, fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  tCell: { fontSize: 9, color: COLORS.body, paddingHorizontal: 6 },

  // Prompt
  promptBox: { backgroundColor: '#f8f7f3', borderWidth: 0.5, borderColor: COLORS.line, borderRadius: 4, padding: 12 },
  promptText: { fontFamily: 'Courier', fontSize: 7.5, color: COLORS.body, lineHeight: 1.55 },

  // Disclaimer
  disclaimer: { borderLeftWidth: 2, borderLeftColor: COLORS.primary, paddingLeft: 12, paddingVertical: 4, fontSize: 9, color: COLORS.body, lineHeight: 1.6 },
});

const DOMAIN_NAMES: Record<string, string> = {
  domain1: '1 — Pertinence & Gouvernance',
  domain2: '2 — Modèle & Algorithme',
  domain3: '3 — Données',
  domain4: '4 — Infrastructure & Ressources',
};

const BUCKET_META: Record<string, { label: string; color: string; soft: string }> = {
  critical: { label: 'Critiques', color: COLORS.red, soft: COLORS.redSoft },
  important: { label: 'Importantes', color: COLORS.orange, soft: COLORS.orangeSoft },
  desirable: { label: 'Souhaitables', color: COLORS.yellow, soft: COLORS.yellowSoft },
  long_term: { label: 'Long terme', color: COLORS.blue, soft: COLORS.blueSoft },
};

const PageChrome = ({ scopeLabel }: { scopeLabel: string }) => (
  <>
    <View style={s.headerBar} fixed>
      <View style={s.headerLeft}>
        <View style={s.headerDot} />
        <Text style={s.headerTitle}>Audit IA Frugale · AFNOR SPEC 2314</Text>
      </View>
      <Text style={s.headerScope}>{scopeLabel}</Text>
    </View>
    <View style={s.footerBar} fixed>
      <Text>Les Marches du Vivant · la-frequence-du-vivant.com</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  </>
);

const ProgressBar = ({ pct }: { pct: number }) => (
  <Svg height={4} width={220} style={{ marginTop: 6 }}>
    <Rect x={0} y={0} width={220} height={4} rx={2} ry={2} fill={COLORS.lineSoft} />
    <Rect x={0} y={0} width={Math.max(0, Math.min(220, (pct / 100) * 220))} height={4} rx={2} ry={2} fill={COLORS.primary} />
  </Svg>
);

interface DocProps {
  report: any;
  scopeLabel: string;
  launchedAt: string;
  modelUsed?: string | null;
  templateName?: string | null;
  templateVersion?: number | null;
  promptSnapshot: string;
}

const AuditReportPdfDocument = ({ report, scopeLabel, launchedAt, modelUsed, templateName, templateVersion, promptSnapshot }: DocProps) => {
  const dateStr = new Date(launchedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date(launchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const buckets = ['critical', 'important', 'desirable', 'long_term'] as const;
  const phases = [
    { key: 'phase1_quick', label: 'Phase 1 — Rapide (0–4 semaines)' },
    { key: 'phase2_short', label: 'Phase 2 — Court terme (1–3 mois)' },
    { key: 'phase3_medium', label: 'Phase 3 — Moyen terme (3–6 mois)' },
  ] as const;

  return (
    <Document title={`Audit IA Frugale — ${scopeLabel}`} author="Les Marches du Vivant">
      {/* COVER */}
      <Page size="A4" style={s.page}>
        <PageChrome scopeLabel={scopeLabel} />
        <View style={s.cover}>
          <View>
            <Text style={s.coverEyebrow}>Rapport d'audit</Text>
            <Text style={s.coverTitle}>Audit IA Frugale</Text>
            <Text style={s.coverScope}>{scopeLabel}</Text>
            <View style={s.coverRule} />
            <Text style={{ fontSize: 10, color: COLORS.muted, maxWidth: 380, lineHeight: 1.6 }}>
              Évaluation référentielle conforme à l'AFNOR SPEC 2314 — Frugalité des systèmes d'intelligence artificielle. Document complet incluant scores, recommandations, plan d'action et prompt d'évaluation.
            </Text>
          </View>

          <View style={s.coverScoreWrap}>
            <Text style={s.coverScore}>{report.global_score ?? '—'}</Text>
            <Text style={s.coverScoreSub}>/ 100</Text>
            {report.maturity_label && <Text style={s.coverBadge}>{report.maturity_label}</Text>}
          </View>

          <View>
            <View style={s.coverMetaBlock}>
              <View style={s.coverMetaRow}>
                <Text style={s.coverMetaKey}>Édité le</Text>
                <Text style={s.coverMetaVal}>{dateStr} à {timeStr}</Text>
              </View>
              {modelUsed && (
                <View style={s.coverMetaRow}>
                  <Text style={s.coverMetaKey}>Modèle</Text>
                  <Text style={s.coverMetaVal}>{modelUsed}</Text>
                </View>
              )}
              {templateName && (
                <View style={s.coverMetaRow}>
                  <Text style={s.coverMetaKey}>Template</Text>
                  <Text style={s.coverMetaVal}>{templateName} · version {templateVersion}</Text>
                </View>
              )}
              <View style={s.coverMetaRow}>
                <Text style={s.coverMetaKey}>Référentiel</Text>
                <Text style={s.coverMetaVal}>AFNOR SPEC 2314 — Frugalité IA</Text>
              </View>
            </View>
            <Text style={[s.coverFooter, { marginTop: 18 }]}>Les Marches du Vivant — la-frequence-du-vivant.com</Text>
          </View>
        </View>
      </Page>

      {/* CONTENT */}
      <Page size="A4" style={s.page} wrap>
        <PageChrome scopeLabel={scopeLabel} />

        {/* Résumé exécutif */}
        <Text style={s.sectionTag}>I. Synthèse</Text>
        <Text style={s.h1}>Résumé exécutif</Text>
        <Text style={s.lead}>{report.executive_summary ?? '—'}</Text>

        {/* Scores domaines */}
        <Text style={[s.sectionTag, { marginTop: 28 }]} break>II. Évaluation</Text>
        <Text style={s.h1}>Scores par domaine</Text>
        <View style={s.domainGrid}>
          {(['domain1', 'domain2', 'domain3', 'domain4'] as const).map((k) => {
            const d = report.domain_scores?.[k];
            if (!d) return null;
            const pct = d.max ? (d.score / d.max) * 100 : 0;
            return (
              <View key={k} style={s.domainCard}>
                <Text style={s.domainLabel}>{DOMAIN_NAMES[k]}</Text>
                <Text style={s.domainScore}>
                  {d.score}
                  <Text style={s.domainScoreMax}> / {d.max}</Text>
                </Text>
                <ProgressBar pct={pct} />
                {d.comment && <Text style={[s.cardBody, { marginTop: 6 }]}>{d.comment}</Text>}
              </View>
            );
          })}
        </View>

        {/* Points forts */}
        <Text style={[s.sectionTag, { marginTop: 16 }]} break>III. Forces identifiées</Text>
        <Text style={s.h1}>Points forts</Text>
        {(['domain1', 'domain2', 'domain3', 'domain4'] as const).map((k) => {
          const idx = parseInt(k.replace('domain', ''), 10);
          const sps = (report.strong_points ?? []).filter((sp: any) => sp.domain === idx);
          if (sps.length === 0) return null;
          return (
            <View key={k} wrap={false}>
              <Text style={s.h2}>{DOMAIN_NAMES[k]}</Text>
              {sps.map((sp: any, i: number) => (
                <View key={i} style={s.card} wrap={false}>
                  <View style={s.cardRow}>
                    <Text style={s.cardTitle}>{sp.title}</Text>
                    {sp.afnor_reference && <Text style={s.badge}>{sp.afnor_reference}</Text>}
                  </View>
                  <Text style={s.cardBody}>{sp.justification}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Améliorations */}
        <Text style={[s.sectionTag, { marginTop: 16 }]} break>IV. Recommandations</Text>
        <Text style={s.h1}>Améliorations recommandées</Text>
        {buckets.map((b) => {
          const items = report.improvements?.[b] ?? [];
          if (items.length === 0) return null;
          const meta = BUCKET_META[b];
          return (
            <View key={b}>
              <View wrap={false}>
                <Text style={[s.h2, { color: meta.color }]}>{meta.label} ({items.length})</Text>
              </View>
              {items.map((imp: any, i: number) => (
                <View key={i} style={[s.card, { borderLeftWidth: 2, borderLeftColor: meta.color, backgroundColor: meta.soft }]} wrap={false}>
                  <View style={s.cardRow}>
                    <Text style={s.cardTitle}>{imp.problem}</Text>
                    <View style={s.badgeRow}>
                      {imp.afnor_reference && <Text style={s.badge}>{imp.afnor_reference}</Text>}
                      {imp.estimated_impact && <Text style={[s.badge, { backgroundColor: meta.color, color: '#fff' }]}>{imp.estimated_impact}</Text>}
                    </View>
                  </View>
                  <Text style={s.cardBody}>{imp.recommended_action}</Text>
                  {imp.domain && <Text style={[s.cardBody, { marginTop: 4, color: COLORS.muted, fontSize: 8 }]}>Domaine {imp.domain} · {DOMAIN_NAMES[`domain${imp.domain}`]}</Text>}
                </View>
              ))}
            </View>
          );
        })}

        {/* Indicateurs env. */}
        {Array.isArray(report.env_indicators) && report.env_indicators.length > 0 && (
          <>
            <Text style={[s.sectionTag, { marginTop: 16 }]} break>V. Mesure</Text>
            <Text style={s.h1}>Indicateurs environnementaux</Text>
            <View>
              <View style={[s.tRow, { borderBottomWidth: 0 }]}>
                <Text style={[s.tHead, { flex: 3 }]}>Indicateur</Text>
                <Text style={[s.tHead, { flex: 1.5 }]}>Unité</Text>
                <Text style={[s.tHead, { flex: 1 }]}>Priorité</Text>
                <Text style={[s.tHead, { flex: 1 }]}>Mesuré</Text>
              </View>
              {report.env_indicators.map((ind: any, i: number) => (
                <View key={i} style={s.tRow} wrap={false}>
                  <Text style={[s.tCell, { flex: 3, color: COLORS.ink, fontFamily: 'Helvetica-Bold' }]}>{ind.name}</Text>
                  <Text style={[s.tCell, { flex: 1.5 }]}>{ind.unit ?? '—'}</Text>
                  <Text style={[s.tCell, { flex: 1, color: ind.priority === 'haute' ? COLORS.red : COLORS.body }]}>{ind.priority ?? '—'}</Text>
                  <Text style={[s.tCell, { flex: 1, color: ind.currently_measured ? COLORS.primary : COLORS.muted }]}>{ind.currently_measured ? 'Oui' : 'Non'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Plan d'action */}
        {report.action_plan && (
          <>
            <Text style={[s.sectionTag, { marginTop: 16 }]} break>VI. Trajectoire</Text>
            <Text style={s.h1}>Plan d'action</Text>
            {phases.map(({ key, label }) => {
              const actions = report.action_plan?.[key] ?? [];
              if (actions.length === 0) return null;
              return (
                <View key={key}>
                  <View wrap={false}>
                    <Text style={s.h2}>{label}</Text>
                  </View>
                  {actions.map((a: any, i: number) => (
                    <View key={i} style={s.card} wrap={false}>
                      <View style={s.cardRow}>
                        <Text style={[s.cardBody, { flex: 1, color: COLORS.ink }]}>{a.action}</Text>
                        <View style={s.badgeRow}>
                          {a.afnor_reference && <Text style={s.badge}>{a.afnor_reference}</Text>}
                          {a.impact && <Text style={[s.badge, { backgroundColor: COLORS.primarySoft, color: COLORS.primary }]}>{a.impact}</Text>}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}

        {/* Avertissement */}
        <View style={{ marginTop: 24 }} wrap={false}>
          <Text style={s.sectionTag}>VII. Avertissement</Text>
          <Text style={s.h1}>Portée de l'évaluation</Text>
          <Text style={s.disclaimer}>
            Cet audit est basé sur une analyse statique de l'architecture et du contexte fourni au modèle. Une évaluation quantitative complète (Analyse de Cycle de Vie, mesure réelle de consommation) nécessiterait des outils dédiés (CodeCarbon, EcoLogits, Green Algorithms) et une campagne de mesure en conditions réelles, conformément à la section 2.1.4 de l'AFNOR SPEC 2314.
          </Text>
        </View>

        {/* Annexe prompt */}
        {promptSnapshot && (
          <>
            <Text style={[s.sectionTag, { marginTop: 24 }]} break>Annexe</Text>
            <Text style={s.h1}>Prompt d'évaluation (snapshot figé)</Text>
            <Text style={[s.cardBody, { marginBottom: 8 }]}>
              Le prompt ci-dessous est la version exacte ayant servi à générer ce rapport. Il est figé et opposable.
            </Text>
            <View style={s.promptBox}>
              <Text style={s.promptText}>{promptSnapshot}</Text>
            </View>
          </>
        )}
      </Page>
    </Document>
  );
};

export async function exportAuditReportPdf(run: AuditRunFull): Promise<void> {
  const blob = await pdf(
    <AuditReportPdfDocument
      report={run.report_json}
      scopeLabel={run.scope_label}
      launchedAt={run.launched_at}
      modelUsed={run.model_used}
      templateName={run.template_name}
      templateVersion={run.template_version}
      promptSnapshot={run.prompt_snapshot ?? ''}
    />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-frugal-${run.slug}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default AuditReportPdfDocument;
