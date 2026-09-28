import VdtpConfigurateurView from '@/components/partners/vdtp/VdtpConfigurateurView';
import { CATALOG_ENRICHI } from '@/content/vdtp/configurateur';

/** Configurateur enrichi, évolutif : 18.09.2026 + briques livrées depuis. */
const VdtpConfigurateur = () => <VdtpConfigurateurView mode="enrichi" catalog={CATALOG_ENRICHI} />;
export default VdtpConfigurateur;
