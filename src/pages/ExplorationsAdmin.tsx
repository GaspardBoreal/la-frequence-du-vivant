import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, Download, Settings } from 'lucide-react';
import { useExplorations } from '@/hooks/useExplorations';
import SEOHead from '@/components/SEOHead';

const ExplorationsAdmin = () => {
  const { data: explorations, isLoading } = useExplorations();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExplorations = explorations?.filter(exploration =>
    exploration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exploration.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEOHead 
        title="Administration des Explorations - La Fréquence du Vivant"
        description="Interface d'administration pour gérer les explorations thématiques"
        keywords="admin, explorations, gestion"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-sage-800 mb-2">
              Administration des Explorations
            </h1>
            <p className="text-sage-600">
              Gérez les explorations thématiques et leurs paysages narratifs
            </p>
          </div>

          {/* Actions Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Rechercher une exploration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <Button className="bg-sage-600 hover:bg-sage-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Exploration
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-sage-600">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sage-800">
                  {explorations?.length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-sage-600">Publiées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {explorations?.filter(e => e.published).length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-sage-600">Brouillons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {explorations?.filter(e => !e.published).length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-sage-600">Cette semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {explorations?.filter(e => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(e.created_at) > weekAgo;
                  }).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explorations List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-sage-600">Chargement des explorations...</p>
              </div>
            ) : filteredExplorations?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-sage-600 mb-4">
                    {searchTerm ? 'Aucune exploration trouvée' : 'Aucune exploration créée'}
                  </p>
                  <Button className="bg-sage-600 hover:bg-sage-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer la première exploration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredExplorations?.map((exploration) => (
                <Card key={exploration.id} className="bg-white/80 backdrop-blur-sm border-sage-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl text-sage-800">
                            {exploration.name}
                          </CardTitle>
                          <Badge variant={exploration.published ? "default" : "secondary"}>
                            {exploration.published ? "Publié" : "Brouillon"}
                          </Badge>
                        </div>
                        
                        {exploration.description && (
                          <CardDescription className="text-sage-600 line-clamp-2 mb-3">
                            {exploration.description}
                          </CardDescription>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {exploration.meta_keywords.slice(0, 5).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-sm text-sage-500">
                          Créée le {new Date(exploration.created_at).toLocaleDateString('fr-FR')}
                          {exploration.updated_at !== exploration.created_at && (
                            <span> • Modifiée le {new Date(exploration.updated_at).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {exploration.published && (
                          <Button variant="outline" size="sm" title="Voir en ligne">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm" title="Gérer les marches et paysages">
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm" title="Exporter en JSON">
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm" title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm" title="Supprimer" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExplorationsAdmin;