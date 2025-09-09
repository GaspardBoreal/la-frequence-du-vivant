import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Zap
} from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { supabase } from '@/integrations/supabase/client';

interface ImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  avgCompleteness: number;
  avgQuality: number;
  recentActivity: ImportActivity[];
}

interface ImportActivity {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  marcheName: string;
  completenessScore: number;
  message: string;
}

interface ImportMonitoringPanelProps {
  explorationId: string;
  refreshTrigger?: number;
}

export const ImportMonitoringPanel: React.FC<ImportMonitoringPanelProps> = ({
  explorationId,
  refreshTrigger
}) => {
  const [stats, setStats] = useState<ImportStats>({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    avgCompleteness: 0,
    avgQuality: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Animated counters for real-time effect
  const animatedTotal = useAnimatedCounter(stats.totalImports, 1000);
  const animatedSuccess = useAnimatedCounter(stats.successfulImports, 1200);
  const animatedFailed = useAnimatedCounter(stats.failedImports, 1400);
  const animatedCompleteness = useAnimatedCounter(stats.avgCompleteness, 1600);
  const animatedQuality = useAnimatedCounter(stats.avgQuality, 1800);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // Load import runs
      const { data: importRuns } = await supabase
        .from('opus_import_runs')
        .select('*')
        .eq('opus_id', explorationId)
        .order('created_at', { ascending: false });

      // Load context data
      const { data: contexts } = await supabase
        .from('marche_contextes_hybrids')
        .select('*')
        .eq('opus_id', explorationId);

      // Load marches for names
      const { data: marches } = await supabase
        .from('marches')
        .select('id, nom_marche, ville');

      const marchesMap = new Map(marches?.map(m => [m.id, m]) || []);

      if (importRuns) {
        const totalImports = importRuns.length;
        const successfulImports = importRuns.filter(r => r.status === 'success').length;
        const failedImports = importRuns.filter(r => r.status === 'error').length;
        
        const completenessScores = contexts?.map(c => c.completude_score || 0) || [];
        const avgCompleteness = completenessScores.length > 0 
          ? Math.round(completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length)
          : 0;

        const qualityScores = importRuns
          .filter(r => r.completude_score)
          .map(r => r.completude_score || 0);
        const avgQuality = qualityScores.length > 0
          ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
          : 0;

        // Recent activity
        const recentActivity: ImportActivity[] = importRuns.slice(0, 5).map(run => {
          const marche = marchesMap.get(run.marche_id);
          return {
            id: run.id,
            timestamp: run.created_at,
            status: run.status as 'success' | 'error' | 'warning',
            marcheName: marche?.nom_marche || 'Marché inconnu',
            completenessScore: run.completude_score || 0,
            message: run.error_message || (run.status === 'success' ? 'Import réussi' : 'Import traité')
          };
        });

        setStats({
          totalImports,
          successfulImports,
          failedImports,
          avgCompleteness,
          avgQuality,
          recentActivity
        });
      }
    } catch (error) {
      console.error('Erreur monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, [explorationId, refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Succès</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      case 'warning':
        return <Badge variant="secondary">Attention</Badge>;
      default:
        return <Badge variant="outline">En cours</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const successRate = stats.totalImports > 0 
    ? Math.round((stats.successfulImports / stats.totalImports) * 100)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Monitoring en temps réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Imports</p>
                <p className="text-2xl font-bold text-primary">{animatedTotal}</p>
              </div>
              <Database className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réussis</p>
                <p className="text-2xl font-bold text-green-600">{animatedSuccess}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{animatedFailed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complétude</p>
                <p className="text-2xl font-bold text-blue-600">{animatedCompleteness}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={animatedCompleteness} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualité</p>
                <p className="text-2xl font-bold text-purple-600">{animatedQuality}%</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={animatedQuality} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Taux de réussite global */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Système
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={loadMonitoringData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de réussite global</span>
              <Badge variant={successRate >= 80 ? "default" : successRate >= 60 ? "secondary" : "destructive"}>
                {successRate}%
              </Badge>
            </div>
            <Progress value={successRate} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {stats.successfulImports} succès sur {stats.totalImports} imports au total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(activity.status)}
                    <div>
                      <p className="font-medium text-sm">{activity.marcheName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)} • Complétude: {activity.completenessScore}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};