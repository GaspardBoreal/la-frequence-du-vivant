
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Leaf, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LexiconParcelData } from '../../types/lexicon';

interface LexiconDataDisplayProps {
  data: LexiconParcelData;
  coordinates: { latitude: number; longitude: number };
}

const LexiconDataDisplay: React.FC<LexiconDataDisplayProps> = ({ data, coordinates }) => {
  const formatSurface = (surface?: number) => {
    if (!surface) return 'Non renseigné';
    return surface < 1 ? `${(surface * 10000).toFixed(0)} m²` : `${surface.toFixed(2)} ha`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Non renseignée';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Coordonnées GPS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <MapPin className="h-5 w-5" />
              Localisation analysée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Latitude: <span className="font-mono font-medium">{coordinates.latitude}</span> | 
              Longitude: <span className="font-mono font-medium">{coordinates.longitude}</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informations de la parcelle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.commune && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <MapPin className="h-4 w-4" />
                  Commune
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-800">{data.commune}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.surface_ha && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Leaf className="h-4 w-4" />
                  Surface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-800">{formatSurface(data.surface_ha)}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.culture_type && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Leaf className="h-4 w-4" />
                  Type de culture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-800">{data.culture_type}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.certification_bio !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  {data.certification_bio ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  Certification Bio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`font-medium ${data.certification_bio ? 'text-green-600' : 'text-gray-600'}`}>
                  {data.certification_bio ? 'Certifié biologique' : 'Non certifié bio'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.proprietaire && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <User className="h-4 w-4" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-800">{data.proprietaire}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.exploitant && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <User className="h-4 w-4" />
                  Exploitant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-800">{data.exploitant}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.derniere_declaration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Calendar className="h-4 w-4" />
                  Dernière déclaration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-800">{formatDate(data.derniere_declaration)}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LexiconDataDisplay;
