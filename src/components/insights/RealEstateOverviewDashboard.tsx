import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, TrendingUp, MapPin, Calendar, Database, AlertCircle, Play } from 'lucide-react';

export const RealEstateOverviewDashboard: React.FC = () => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Status Card */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertCircle className="w-5 h-5" />
            Module Immobilier en Attente
          </CardTitle>
          <CardDescription>
            Les données immobilières ne sont pas encore collectées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Le module de collecte des données immobilières est configuré mais aucune collecte n'a encore été effectuée.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  0 collectes
                </Badge>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  0 transactions
                </Badge>
              </div>
            </div>
            <Button className="gap-2" variant="default">
              <Play className="w-4 h-4" />
              Lancer la collecte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Cards - What will be available */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 opacity-60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix Moyen m²</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  --
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500">
                  En attente de données
                </p>
              </div>
              <Home className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 opacity-60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  --
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Total collectées
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 opacity-60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  --
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  Valeur marches
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 opacity-60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zones Couvertes</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  --
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-500">
                  Marches analysées
                </p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution des Prix
            </CardTitle>
            <CardDescription>
              Tendances temporelles des prix immobiliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center space-y-2">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Graphique d'évolution des prix
                </p>
                <p className="text-xs text-muted-foreground">
                  Disponible après collecte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Répartition Géographique
            </CardTitle>
            <CardDescription>
              Heatmap des prix par zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center space-y-2">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Carte de répartition des prix
                </p>
                <p className="text-xs text-muted-foreground">
                  Disponible après collecte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            À Venir : Analyse Immobilière Complète
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Une fois les données immobilières collectées, ce module proposera :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">📊 Analyses de Prix</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Prix moyen et médian au m²</li>
                  <li>• Évolution temporelle</li>
                  <li>• Comparaisons régionales</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">🗺️ Visualisations Spatiales</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Heatmaps des prix</li>
                  <li>• Zones de valorisation</li>
                  <li>• Corrélations géographiques</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};