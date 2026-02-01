import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { incrementDownloadCount } from '@/utils/publicExportUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  BookOpen, 
  User, 
  Calendar, 
  FileText, 
  Loader2,
  ArrowLeft,
  Sparkles,
  Eye
} from 'lucide-react';

interface PublishedExportData {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string;
  cover_url: string | null;
  file_url: string;
  file_size_bytes: number | null;
  file_type: string;
  artistic_direction: string | null;
  download_count: number;
  exploration_id: string | null;
  published_at: string;
}

const DIRECTION_LABELS: Record<string, { label: string; color: string }> = {
  classique: { label: 'Classique', color: 'bg-amber-600' },
  poesie_poche: { label: 'Poésie de Poche', color: 'bg-slate-600' },
  livre_art: { label: "Livre d'Art", color: 'bg-blue-600' },
  contemporain: { label: 'Contemporain', color: 'bg-gray-800' },
  galerie_fleuve: { label: 'Galerie Fleuve', color: 'bg-emerald-600' },
  frequence_vivant: { label: 'Fréquence du Vivant', color: 'bg-green-700' },
  dordonia: { label: 'Dordonia', color: 'bg-cyan-700' },
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Taille inconnue';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const PublicEpubDownload: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [exportData, setExportData] = useState<PublishedExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExport = async () => {
      if (!slug) {
        setError('Lien invalide');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('published_exports')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError || !data) {
        setError('Publication non trouvée');
        setLoading(false);
        return;
      }

      setExportData(data);
      setLoading(false);
    };

    fetchExport();
  }, [slug]);

  const handleDownload = async () => {
    if (!exportData) return;

    setDownloading(true);
    try {
      // Increment counter
      await incrementDownloadCount(exportData.slug);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = exportData.file_url;
      link.download = `${exportData.title}.${exportData.file_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update local count
      setExportData(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !exportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Publication non trouvée</h1>
          <p className="text-muted-foreground mb-6">
            Cette publication n'existe pas ou n'est plus disponible.
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const directionInfo = exportData.artistic_direction 
    ? DIRECTION_LABELS[exportData.artistic_direction] 
    : null;

  return (
    <>
      <Helmet>
        <title>{exportData.title} | Gaspard Boréal</title>
        <meta name="description" content={exportData.description || `Téléchargez "${exportData.title}" par ${exportData.author}`} />
        <meta property="og:title" content={exportData.title} />
        <meta property="og:description" content={exportData.description || `Téléchargez "${exportData.title}" par ${exportData.author}`} />
        {exportData.cover_url && <meta property="og:image" content={exportData.cover_url} />}
        <meta property="og:type" content="book" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">La Fréquence du Vivant</span>
            </Link>
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" />
              {exportData.download_count} téléchargements
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cover Image */}
            <div className="md:col-span-1">
              {exportData.cover_url ? (
                <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-xl border border-border/50">
                  <img
                    src={exportData.cover_url}
                    alt={`Couverture de ${exportData.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border/50 shadow-xl">
                  <BookOpen className="h-20 w-20 text-primary/40" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Title & Author */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-serif">
                  {exportData.title}
                </h1>
                {exportData.subtitle && (
                  <p className="text-xl text-muted-foreground italic">
                    {exportData.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{exportData.author}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {exportData.file_type.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {formatFileSize(exportData.file_size_bytes)}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(exportData.published_at)}
                </Badge>
                {directionInfo && (
                  <Badge className={`${directionInfo.color} text-white`}>
                    {directionInfo.label}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Description */}
              {exportData.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {exportData.description}
                  </p>
                </div>
              )}

              {/* Download Button */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {exportData.exploration_id && (
                      <Link to={`/epub/${exportData.slug}/lire`} className="block">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full text-lg py-6"
                        >
                          <BookOpen className="h-5 w-5 mr-2" />
                          Lire en ligne
                        </Button>
                      </Link>
                    )}
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    size="lg"
                    className="w-full text-lg py-6"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Télécharger l'{exportData.file_type.toUpperCase()}
                      </>
                    )}
                  </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Fichier {exportData.file_type.toUpperCase()} compatible avec tous les lecteurs
                  </p>
                  {exportData.exploration_id && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Lecture immersive (Livre Vivant)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-12 py-8 text-center text-muted-foreground text-sm">
          <p>
            Une publication de{' '}
            <Link to="/" className="text-primary hover:underline">
              La Fréquence du Vivant
            </Link>
            {' '}• Gaspard Boréal © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </>
  );
};

export default PublicEpubDownload;
