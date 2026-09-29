# Project architecture rules

- Keep the property herbarium grouped by normalized scientific name and build its chronological photo gallery only from filtered observation waypoints with their own photos; this preserves the map's scope and prevents species reference photos from being misattributed to a dated observation.
- Scope herbarium-origin lightbox navigation to the selected species while retaining map-origin navigation across visible waypoints; these are distinct browsing contexts.
- Chantier scope = union of lot ouvrages and attached emplacements, widened by a per-chantier radius measured from the trace edge (scopeByRadius); keeps species, soil and ICG on one geometric perimeter.
- Let the Cortège vivant inspect one selected trace using the same edge-radius scope while keeping ICG, soil and reports on the full chantier union; this prevents a single emplacement from being mislabeled with whole-lot counts.
- Keep authorship, association-account activity, factual records, open-license sources, unattributed works, personal data, and database-producer investment separate in the data valuation note; a combined row-count ratio cannot establish ownership.
