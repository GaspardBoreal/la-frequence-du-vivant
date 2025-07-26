
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Map, Database, ArrowLeft } from 'lucide-react';

const AdminAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au site
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accès Administration
          </h1>
          <p className="text-gray-600">
            Panel d'administration pour la gestion du site
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Map className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold">Gestion des Marches</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Créer, modifier et supprimer les marches techno-sensibles. 
              Gérer les médias, photos et fichiers audio.
            </p>
            <Link to="/admin/marches">
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Accéder aux Marches
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Database className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold">Migration des Données</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Importer et synchroniser les données depuis Google Sheets
              et Google Drive.
            </p>
            <Link to="/admin/migration">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Accéder à la Migration
              </Button>
            </Link>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Page d'accès restreint - Gaspard Boréal © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;
