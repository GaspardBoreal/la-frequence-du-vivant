import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const FinalCTA: React.FC = () => (
  <section className="border-t border-border bg-gradient-to-br from-primary/5 to-secondary/10">
    <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
      <Sparkles className="h-10 w-10 mx-auto text-primary" />
      <h2 className="mt-4 text-2xl sm:text-3xl font-serif">Envie de marcher avec nous ?</h2>
      <p className="mt-3 text-center text-muted-foreground">
        Rejoignez une communauté de marcheurs qui&nbsp;observent,&nbsp;écoutent,&nbsp;écrivent&nbsp;et prennent soin des territoires.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/marches-du-vivant/connexion">
            Créer mon compte marcheur
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/marches-du-vivant">En savoir plus</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default FinalCTA;
