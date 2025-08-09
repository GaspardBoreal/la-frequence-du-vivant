import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CartesVisite = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cartes de Visite</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="w-full max-w-sm">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-lg">Modèle Classique</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Jean Dupont</h3>
                <p className="text-sm text-muted-foreground">Développeur Web</p>
                <div className="text-xs space-y-1">
                  <p>📧 jean.dupont@email.com</p>
                  <p>📱 +33 6 12 34 56 78</p>
                  <p>🌐 www.jeandupont.fr</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm">
            <CardHeader className="bg-secondary text-secondary-foreground">
              <CardTitle className="text-lg">Modèle Moderne</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Marie Martin</h3>
                <p className="text-sm text-muted-foreground">Designer UX/UI</p>
                <div className="text-xs space-y-1">
                  <p>📧 marie.martin@studio.com</p>
                  <p>📱 +33 6 98 76 54 32</p>
                  <p>💼 LinkedIn: /marie-martin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm">
            <CardHeader className="bg-accent text-accent-foreground">
              <CardTitle className="text-lg">Modèle Créatif</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Pierre Leroux</h3>
                <p className="text-sm text-muted-foreground">Artiste Numérique</p>
                <div className="text-xs space-y-1">
                  <p>🎨 pierre@art-digital.fr</p>
                  <p>📸 Instagram: @pierreart</p>
                  <p>🖼️ Portfolio: art-pierre.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartesVisite;