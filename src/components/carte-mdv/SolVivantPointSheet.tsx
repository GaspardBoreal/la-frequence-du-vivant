import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Navigation,
  ExternalLink,
  Sprout,
  User,
  Calendar,
} from 'lucide-react';
import { useSolVivantPointDetail } from '@/hooks/useCarteMdV';
import {
  getSvContact,
  getSvCategories,
  getSvImages,
  getSvFarmFields,
  getSvPropositions,
  getSvExternalUrl,
} from '@/lib/solVivantRaw';

interface Props {
  pointId: string | null;
  onOpenChange: (open: boolean) => void;
}

export const SolVivantPointSheet: React.FC<Props> = ({ pointId, onOpenChange }) => {
  const { data, isLoading } = useSolVivantPointDetail(pointId);
  const open = !!pointId;

  const raw = data?.raw;
  const contact = getSvContact(raw);
  const categories = getSvCategories(raw);
  const images = getSvImages(raw);
  const farmFields = getSvFarmFields(raw);
  const propositions = getSvPropositions(raw);
  const externalUrl = data
    ? getSvExternalUrl(raw, data.name, Number(data.latitude), Number(data.longitude))
    : null;
  const mapsUrl = data
    ? `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        {isLoading || !data ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            {/* Bandeau lime = code couleur "Partenaire Sol Vivant" */}
            <div className="bg-lime-500 text-white px-6 py-5">
              <SheetHeader className="text-left space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                  Partenaire Sol Vivant
                </div>
                <SheetTitle className="text-white text-xl leading-tight">
                  {data.name}
                </SheetTitle>
                {data.street_address && (
                  <SheetDescription className="text-white/90 text-sm flex items-start gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{data.street_address}</span>
                  </SheetDescription>
                )}
              </SheetHeader>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Catégories */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c, i) => (
                    <Badge key={i} variant="secondary" className="bg-lime-50 text-lime-800 border border-lime-200">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions rapides */}
              <div className="grid grid-cols-2 gap-2">
                {mapsUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="w-3.5 h-3.5 mr-1.5" /> Itinéraire
                    </a>
                  </Button>
                )}
                {externalUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Fiche originale
                    </a>
                  </Button>
                )}
              </div>

              {/* Contact */}
              {(contact.personName || contact.phone || contact.email || contact.website) && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contact
                  </h3>
                  <div className="space-y-1.5">
                    {contact.personName && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{contact.personName}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone.replace(/\s/g, '')}`}
                         className="flex items-center gap-2 hover:text-primary">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`}
                         className="flex items-center gap-2 hover:text-primary break-all">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{contact.email}</span>
                      </a>
                    )}
                    {contact.website && (
                      <a href={contact.website} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 hover:text-primary break-all">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{contact.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Propositions (accueil, stagiaire, bénévole…) */}
              {propositions.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Proposition
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {propositions.map((p, i) => (
                      <Badge key={i} variant="outline" className="border-lime-300 text-lime-800">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Images */}
              {images.length > 0 && (
                <section className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {images.slice(0, 4).map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video overflow-hidden rounded-md border border-border"
                      >
                        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Ferme / infos agro */}
              {farmFields.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5" /> Ferme & pratiques
                  </h3>
                  <dl className="space-y-2">
                    {farmFields.map((f) => (
                      <div key={f.key} className="border-l-2 border-lime-200 pl-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {f.label}
                        </dt>
                        <dd className="text-sm whitespace-pre-line">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Pied — source */}
              <footer className="pt-3 border-t border-border text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Données synchronisées le{' '}
                    {data.synced_at
                      ? format(new Date(data.synced_at), 'd MMMM yyyy', { locale: fr })
                      : '—'}
                  </span>
                </div>
                <p>
                  Source :{' '}
                  <a
                    href="https://cartesolvivant.gogocarto.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    Carte Sol Vivant (GoGoCarto, ODbL)
                  </a>
                </p>
              </footer>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SolVivantPointSheet;
