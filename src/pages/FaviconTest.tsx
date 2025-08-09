import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FaviconTest = () => {
  const [currentFavicon, setCurrentFavicon] = useState('/favicon.png');

  const handleFaviconChange = (faviconUrl: string) => {
    setCurrentFavicon(faviconUrl);
    // Update the favicon in the document head
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    }
  };

  const faviconOptions = [
    { name: 'Défaut', url: '/favicon.png' },
    { name: 'Test 1', url: '/test-favicons/favicon-alt-1.png' },
    { name: 'Test 2', url: '/test-favicons/favicon-alt-2.png' },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test de Favicon</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Sélecteur de Favicon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {faviconOptions.map((option) => (
                <div key={option.name} className="text-center">
                  <img 
                    src={option.url} 
                    alt={option.name}
                    className="w-16 h-16 mx-auto mb-2 border rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/favicon.png';
                    }}
                  />
                  <Button 
                    onClick={() => handleFaviconChange(option.url)}
                    variant={currentFavicon === option.url ? "default" : "outline"}
                    size="sm"
                  >
                    {option.name}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded">
              <p className="text-sm">
                <strong>Favicon actuel:</strong> {currentFavicon}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FaviconTest;