interface Props {
  lignes: string[];
  titre?: string;
}

export const FormuleBloc = ({ lignes, titre = 'La formule, telle qu\'elle est publiée' }: Props) => (
  <div className="space-y-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {titre}
    </p>
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3">
      <ul className="space-y-1.5">
        {lignes.map((l) => (
          <li
            key={l}
            className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-foreground/85 sm:text-xs"
          >
            {l}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default FormuleBloc;
