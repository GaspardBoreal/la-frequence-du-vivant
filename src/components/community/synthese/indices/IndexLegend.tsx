import React from 'react';
import { Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface IndexLegendProps {
  formula: string;
  description: React.ReactNode;
  whyItMatters?: React.ReactNode;
}

export const IndexLegend: React.FC<IndexLegendProps> = ({
  formula,
  description,
  whyItMatters,
}) => (
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="legend" className="border border-border/60 rounded-xl bg-muted/30 backdrop-blur px-4">
      <AccordionTrigger className="text-sm hover:no-underline">
        <span className="inline-flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          Comprendre l'indicateur
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <div className="rounded-lg bg-background/60 border border-border/40 px-3 py-2 font-mono text-foreground text-[13px]">
          {formula}
        </div>
        <div>{description}</div>
        {whyItMatters && (
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs uppercase tracking-wider text-foreground/70 mb-1">
              Pourquoi c'est utile sur le terrain
            </p>
            {whyItMatters}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default IndexLegend;
