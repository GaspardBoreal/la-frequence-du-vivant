import VdtpConfigurateurView from '@/components/partners/vdtp/VdtpConfigurateurView';
import { CATALOG_2026_09_18 } from '@/content/vdtp/configurateur-2026-09-18';

/** Configurateur figé : présentation officielle du 18 septembre 2026. */
const VdtpConfigurateurOfficiel = () => (
  <VdtpConfigurateurView mode="officiel" catalog={CATALOG_2026_09_18} />
);
export default VdtpConfigurateurOfficiel;
