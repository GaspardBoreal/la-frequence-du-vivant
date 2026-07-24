import React from 'react';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';

interface Props {
  proprieteNom: string;
  proprieteVille?: string | null;
  proprieteId?: string;
  bio?: PropertyBiodiversity;
}

export const TabSynthesize: React.FC<Props> = ({ proprieteNom, proprieteVille, proprieteId, bio }) => {
  const enjeux = (() => {
    try {
      return JSON.parse(localStorage.getItem(`propriete-ds-identify:${proprieteId ?? 'default'}`) ?? '[]');
    } catch {
      return [] as string[];
    }
  })();

  const exportPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Diagnostic Vivant — ${proprieteNom}`, 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text(
        `${proprieteVille ?? ''} · ${new Date().toLocaleDateString('fr-FR')}`,
        14,
        28,
      );
      doc.setTextColor(0);

      doc.setFontSize(13);
      doc.text('Synthèse biodiversité', 14, 42);
      autoTable(doc, {
        startY: 46,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Espèces observées', String(bio?.speciesTotal ?? 0)],
          ['Marches réalisées', String(bio?.events.length ?? 0)],
          ['Règnes présents', String(Object.keys(bio?.kingdoms ?? {}).length)],
          [
            'Dernière observation',
            bio?.lastEventDate
              ? new Date(bio.lastEventDate).toLocaleDateString('fr-FR')
              : '—',
          ],
        ],
        theme: 'striped',
      });

      if (enjeux.length) {
        const y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(13);
        doc.text('Enjeux identifiés', 14, y);
        autoTable(doc, {
          startY: y + 4,
          body: enjeux.map((e: string) => [e]),
          theme: 'plain',
        });
      }

      if (bio?.topSpecies?.length) {
        const y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(13);
        doc.text('Espèces principales', 14, y);
        autoTable(doc, {
          startY: y + 4,
          head: [['Nom', 'Scientifique', 'Occurrences']],
          body: bio.topSpecies.map((s) => [s.common ?? '—', s.scientific, String(s.count)]),
          theme: 'striped',
        });
      }

      doc.save(`diagnostic-${proprieteNom.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('Synthèse PDF téléchargée');
    } catch (e: any) {
      toast.error(`Erreur PDF : ${e.message}`);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
          <FileText className="w-3.5 h-3.5" /> Étape 4 · Je synthétise
        </div>
        <h2 className="text-xl font-semibold mt-1">Synthèse partageable</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Un document unique regroupant observations, analyses et enjeux du lieu.
        </p>
      </header>

      <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
        <div className="text-sm">
          <strong>{proprieteNom}</strong>
          {proprieteVille ? ` · ${proprieteVille}` : ''}
        </div>
        <div className="text-xs text-muted-foreground">
          {bio?.speciesTotal ?? 0} espèces recensées sur {bio?.events.length ?? 0} Marche(s) du Vivant.{' '}
          {enjeux.length
            ? `${enjeux.length} enjeu(x) identifié(s).`
            : 'Aucun enjeu identifié pour l\'instant (onglet précédent).'}
        </div>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Download className="w-4 h-4" />
          Télécharger la synthèse PDF
        </button>
      </div>
    </div>
  );
};
