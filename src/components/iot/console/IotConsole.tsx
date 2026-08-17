import React from 'react';
import TelemetryControl from '@/components/iot/TelemetryControl';
import SensorsMapTab from '@/components/iot/SensorsMapTab';
import AnalysesTab from '@/components/iot/analyses/AnalysesTab';
import IotChatBotMount from '@/components/iot/chatbot/IotChatBotMount';
import { useIotAiCredit } from '@/hooks/iot/useIotAiCredit';
import { useIotConsole } from './IotConsoleContext';

export type IotConsoleView = 'controle' | 'carte' | 'analyses';

/**
 * Panneau unique de la console des sondes, réutilisé tel quel par le poste de
 * commandement admin, les pages partenaires et (demain) l'Atelier du jardin.
 * Seul le périmètre change — cf. `IotConsoleProvider`.
 */
export const IotConsolePanel: React.FC<{ view: IotConsoleView }> = ({ view }) =>
  view === 'analyses' ? <AnalysesTab /> : view === 'carte' ? <SensorsMapTab /> : <TelemetryControl />;

/**
 * IA de Jardin cadrée sur le périmètre de la console.
 * Sur une console partenaire, elle n'apparaît que si des crédits de messages
 * lui ont été accordés depuis sa fiche marcheur.
 */
export const IotConsoleAi: React.FC = () => {
  const { capabilities, scope } = useIotConsole();
  const fournisseurId = scope.fournisseurIds?.[0] ?? null;
  const { data: credit } = useIotAiCredit(fournisseurId);

  if (!capabilities.ai) return null;
  // Console admin (aucun fabricant cadré) : comportement historique.
  if (!fournisseurId) return <IotChatBotMount />;
  if (!credit || (!credit.admin && !credit.enabled)) return null;

  return <IotChatBotMount fournisseurId={fournisseurId} credit={credit} />;
};

export default IotConsolePanel;
