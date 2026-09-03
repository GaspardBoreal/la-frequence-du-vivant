import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

export interface EditableStep {
  id: string;
  name: string;
  ville: string;
  description?: string;
  lat: number;
  lng: number;
  selected: boolean;
}

interface StepsEditorTableProps {
  steps: EditableStep[];
  onChange: (steps: EditableStep[]) => void;
}

const StepsEditorTable: React.FC<StepsEditorTableProps> = ({ steps, onChange }) => {
  const patch = (id: string, values: Partial<EditableStep>) =>
    onChange(steps.map((s) => (s.id === id ? { ...s, ...values } : s)));

  const allSelected = steps.length > 0 && steps.every((s) => s.selected);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => onChange(steps.map((s) => ({ ...s, selected: !!v })))}
            aria-label="Tout sélectionner"
          />
          <span className="text-sm font-medium">
            {steps.filter((s) => s.selected).length} / {steps.length} étapes retenues
          </span>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`grid grid-cols-[auto_1.6fr_1fr_auto] gap-3 items-center px-4 py-2.5 ${
              s.selected ? '' : 'opacity-45'
            }`}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={s.selected}
                onCheckedChange={(v) => patch(s.id, { selected: !!v })}
                aria-label={`Retenir l'étape ${i + 1}`}
              />
              <span className="text-xs tabular-nums text-muted-foreground w-5">{i + 1}</span>
            </div>
            <Input
              value={s.name}
              onChange={(e) => patch(s.id, { name: e.target.value })}
              placeholder="Nom de l'étape"
              className="h-8 text-sm"
            />
            <Input
              value={s.ville}
              onChange={(e) => patch(s.id, { ville: e.target.value })}
              placeholder="Ville"
              className="h-8 text-sm"
            />
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground whitespace-nowrap">
              {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StepsEditorTable;
