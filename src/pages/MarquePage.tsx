import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const MarquePage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Marque-Pages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Marque-page 1 */}
          <Card className="w-32 h-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary/60">
              <CardContent className="p-3 h-full flex flex-col justify-between text-white text-center">
                <div>
                  <h3 className="text-sm font-bold mb-2">BIBLIOTHÈQUE</h3>
                  <p className="text-xs">Municipale</p>
                </div>
                <div className="text-xs">
                  <p>Ouvert</p>
                  <p>Mar-Sam</p>
                  <p>9h-18h</p>
                </div>
                <div className="text-xs opacity-80">
                  <p>📚 www.biblio.fr</p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Marque-page 2 */}
          <Card className="w-32 h-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary to-secondary/60">
              <CardContent className="p-3 h-full flex flex-col justify-between text-white text-center">
                <div>
                  <h3 className="text-sm font-bold mb-2">LIBRAIRIE</h3>
                  <p className="text-xs">Le Livre d'Or</p>
                </div>
                <div className="text-xs">
                  <p>Lun-Sam</p>
                  <p>10h-19h</p>
                  <p>☕ Café littéraire</p>
                </div>
                <div className="text-xs opacity-80">
                  <p>📖 Place du Marché</p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Marque-page 3 */}
          <Card className="w-32 h-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-accent to-accent/60">
              <CardContent className="p-3 h-full flex flex-col justify-between text-white text-center">
                <div>
                  <h3 className="text-sm font-bold mb-2">FESTIVAL</h3>
                  <p className="text-xs">Lecture 2025</p>
                </div>
                <div className="text-xs">
                  <p>5-8 Juin</p>
                  <p>Parc Central</p>
                  <p>🎭 Spectacles</p>
                </div>
                <div className="text-xs opacity-80">
                  <p>🎪 Gratuit</p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Marque-page 4 */}
          <Card className="w-32 h-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-secondary/80">
              <CardContent className="p-3 h-full flex flex-col justify-between text-white text-center">
                <div>
                  <h3 className="text-sm font-bold mb-2">CLUB</h3>
                  <p className="text-xs">Lecture</p>
                </div>
                <div className="text-xs">
                  <p>Vendredi</p>
                  <p>18h30</p>
                  <p>🤝 Échanges</p>
                </div>
                <div className="text-xs opacity-80">
                  <p>📅 Mensuel</p>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarquePage;