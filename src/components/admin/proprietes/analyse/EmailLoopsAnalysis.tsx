import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import type { EmailLoop } from '@/lib/onboardingSegments';

/** 2. Les boucles d'emails, une séquence par persona. */
const EmailLoopsAnalysis: React.FC<{ loops: EmailLoop[] }> = ({ loops }) => (
  <div className="space-y-4">
    {loops.map((loop) => (
      <Card key={loop.personaKey} className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-2xl">{loop.emoji}</span>
          <h4 className="text-base font-semibold">{loop.personaNom}</h4>
          <Badge variant="secondary" className="font-normal">{loop.cadence}</Badge>
        </div>
        <ol className="relative space-y-4 border-l border-border pl-5">
          {loop.steps.map((s) => (
            <li key={s.moment} className="relative">
              <span className="absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/15">
                <Mail className="h-2.5 w-2.5 text-primary" />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.moment}</p>
              <p className="mt-0.5 text-sm font-semibold">« {s.objet} »</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.angle}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                <Badge variant="outline" className="font-normal">Déclencheur : {s.declencheur}</Badge>
                <Badge variant="outline" className="font-normal">Geste attendu : {s.geste}</Badge>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    ))}
  </div>
);

export default EmailLoopsAnalysis;
