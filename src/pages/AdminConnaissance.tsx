import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import KbCartographie from '@/components/admin/connaissance/KbCartographie';
import KbFiches from '@/components/admin/connaissance/KbFiches';
import KbQuestions from '@/components/admin/connaissance/KbQuestions';
import KbCouverture from '@/components/admin/connaissance/KbCouverture';

const AdminConnaissance: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin/outils">
          <ArrowLeft className="mr-2 h-4 w-4" /> Outils
        </Link>
      </Button>

      <header className="mb-6 flex items-start gap-3">
        <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Base de connaissance Fréquence Jardin</h1>
          <p className="text-sm text-muted-foreground">
            Les réponses de référence aux questions des jardiniers, des visiteurs et des paysagistes — chacune avec sa
            source, son relecteur et sa date.
          </p>
        </div>
      </header>

      <Tabs defaultValue="cartographie">
        <TabsList className="mb-5 flex-wrap">
          <TabsTrigger value="cartographie">Cartographie</TabsTrigger>
          <TabsTrigger value="fiches">Fiches</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="couverture">Couverture</TabsTrigger>
        </TabsList>
        <TabsContent value="cartographie"><KbCartographie /></TabsContent>
        <TabsContent value="fiches"><KbFiches /></TabsContent>
        <TabsContent value="questions"><KbQuestions /></TabsContent>
        <TabsContent value="couverture"><KbCouverture /></TabsContent>
      </Tabs>
    </div>
  </div>
);

export default AdminConnaissance;
