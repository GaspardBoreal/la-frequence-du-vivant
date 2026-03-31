import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Map, HelpCircle } from 'lucide-react';

const OUTILS = [
  {
    titre: 'Ma Fréquence du jour',
    description: 'Citation journalière d\'auteurs engagés dans la biodiversité, bioacoustique, géopoétique.',
    icon: Sparkles,
    to: '/admin/outils/frequences',
    active: true,
  },
  {
    titre: 'Zones',
    description: 'Cartographie des zones de marches.',
    icon: Map,
    to: '/admin/outils/zones',
    active: false,
  },
  {
    titre: 'Quizz',
    description: 'Testez vos connaissances sur le vivant.',
    icon: HelpCircle,
    to: '/admin/outils/quizz',
    active: false,
  },
];

const AdminOutilsHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Admin
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Outils</h1>
          <p className="text-muted-foreground">Instruments pédagogiques et pratiques</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {OUTILS.map((outil) => (
            <Card key={outil.titre} className={`p-6 hover:shadow-lg transition-shadow ${!outil.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center mb-4">
                <outil.icon className="h-8 w-8 text-accent mr-3" />
                <h2 className="text-xl font-semibold text-foreground">{outil.titre}</h2>
              </div>
              <p className="text-muted-foreground mb-4 min-h-[3rem] text-sm">{outil.description}</p>
              {outil.active ? (
                <Link to={outil.to}>
                  <Button variant="outline" className="w-full">Accéder</Button>
                </Link>
              ) : (
                <Button variant="outline" className="w-full" disabled>À venir</Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOutilsHub;
