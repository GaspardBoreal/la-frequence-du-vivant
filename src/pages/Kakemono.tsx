import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Kakemono = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Kakemonos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Kakemono 1 */}
          <Card className="h-96 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/80">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white text-center">ÉVÉNEMENT 2025</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Festival de Musique</h2>
                <p className="text-lg mb-2">15-17 Août 2025</p>
                <p className="text-sm">Parc de la Ville</p>
                <div className="mt-4 text-xs">
                  <p>Billets disponibles</p>
                  <p>www.festival2025.fr</p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Kakemono 2 */}
          <Card className="h-96 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-secondary/80">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white text-center">EXPOSITION</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Art Contemporain</h2>
                <p className="text-lg mb-2">1er Sept - 30 Oct</p>
                <p className="text-sm">Galerie Moderne</p>
                <div className="mt-4 text-xs">
                  <p>Entrée libre</p>
                  <p>Mardi - Dimanche</p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Kakemono 3 */}
          <Card className="h-96 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-accent/80">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white text-center">CONFÉRENCE</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Innovation Tech</h2>
                <p className="text-lg mb-2">20 Septembre 2025</p>
                <p className="text-sm">Centre de Congrès</p>
                <div className="mt-4 text-xs">
                  <p>Inscription obligatoire</p>
                  <p>contact@tech-innovation.fr</p>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Kakemono;