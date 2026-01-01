
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Map, Sparkles, ArrowLeft, FileDown, Zap } from 'lucide-react';

const AdminAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Accès Administration
          </h1>
          <p className="text-muted-foreground">
            Panel d'administration pour la gestion du site
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="gaspard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Map className="h-8 w-8 text-accent mr-3" />
              <h2 className="text-xl font-semibold text-foreground">Gestion des Marches</h2>
            </div>
            <p className="mb-4 text-muted-foreground font-light text-base">
              Créer, modifier et supprimer les marches techno-sensibles. 
              Gérer les médias, photos et fichiers audio.
            </p>
            <Link to="/admin/marches">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Accéder aux Marches
              </Button>
            </Link>
          </Card>

          <Card className="gaspard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Sparkles className="h-8 w-8 text-accent mr-3" />
              <h2 className="text-xl font-semibold text-foreground">Gestion des Explorations</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Créer, modifier et publier les explorations poétiques.
              Gérer les contenus multimédias et narratifs.
            </p>
            <Link to="/admin/explorations">
              <Button variant="outline" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Accéder aux Explorations
              </Button>
            </Link>
          </Card>

          <Card className="gaspard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <FileDown className="h-8 w-8 text-accent mr-3" />
              <h2 className="text-xl font-semibold text-foreground">Exportations & Rapports</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Exporter les textes littéraires au format Word, JSON ou CSV.
              Générer des rapports de contenus.
            </p>
            <Link to="/admin/exportations">
              <Button variant="outline" className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Accéder aux Exportations
              </Button>
            </Link>
          </Card>

          <Card className="gaspard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <Zap className="h-8 w-8 text-accent mr-3" />
              <h2 className="text-xl font-semibold text-foreground">Automations & Intégrations</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Gérer les connexions externes : Google Calendar, n8n workflows.
              Tester et monitorer les synchronisations.
            </p>
            <Link to="/admin/automations">
              <Button variant="outline" className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Accéder aux Automations
              </Button>
            </Link>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Page d'accès restreint - Gaspard Boréal © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;
