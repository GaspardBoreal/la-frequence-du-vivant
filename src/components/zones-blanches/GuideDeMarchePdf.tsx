import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { ChatMessage } from '@/hooks/useGuideDeMarche';
import { DetectionResult } from '@/hooks/useDetecteurZonesBlanches';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a18',
    backgroundColor: '#fefdfb',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#047857',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#6b7280',
  },
  messageBlock: {
    marginBottom: 12,
  },
  userLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#047857',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  assistantLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0d9488',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  userContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a18',
    fontFamily: 'Helvetica-Bold',
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    marginVertical: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
  },
});

interface PdfDocProps {
  messages: ChatMessage[];
  zonesContext: DetectionResult;
}

const GuideDeMarchePdfDocument = ({ messages, zonesContext }: PdfDocProps) => {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const blankCount = zonesContext.blank_count;
  const totalScanned = zonesContext.total_scanned;

  // Split messages into chunks for pagination
  const MSGS_PER_PAGE = 4;
  const chunks: ChatMessage[][] = [];
  for (let i = 0; i < messages.length; i += MSGS_PER_PAGE) {
    chunks.push(messages.slice(i, i + MSGS_PER_PAGE));
  }

  return (
    <Document>
      {chunks.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {pageIdx === 0 && (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>🌿 Guide de Marche — Les Marches du Vivant</Text>
              <Text style={styles.headerSubtitle}>
                {date} · {totalScanned} zones scannées · {blankCount} zone{blankCount > 1 ? 's' : ''} blanche{blankCount > 1 ? 's' : ''} · Centre : {zonesContext.center.lat.toFixed(4)}, {zonesContext.center.lng.toFixed(4)}
              </Text>
            </View>
          )}

          {chunk.map((msg, idx) => (
            <View key={idx} style={styles.messageBlock}>
              <Text style={msg.role === 'user' ? styles.userLabel : styles.assistantLabel}>
                {msg.role === 'user' ? '👤 Ambassadeur' : '🌿 Guide'}
              </Text>
              <Text style={msg.role === 'user' ? styles.userContent : styles.messageContent}>
                {msg.content}
              </Text>
              {idx < chunk.length - 1 && <View style={styles.separator} />}
            </View>
          ))}

          <View style={styles.footer} fixed>
            <Text>Les Marches du Vivant — Guide de Marche IA</Text>
            <Text>{pageIdx + 1} / {chunks.length}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export async function exportGuidePdf(messages: ChatMessage[], zonesContext: DetectionResult) {
  const blob = await pdf(<GuideDeMarchePdfDocument messages={messages} zonesContext={zonesContext} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guide-marche-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default GuideDeMarchePdfDocument;
