import React from 'react';
import TelemetryControl from '@/components/iot/TelemetryControl';
import SensorsMapTab from '@/components/iot/SensorsMapTab';
import IotChatBotMount from '@/components/iot/chatbot/IotChatBotMount';
import { useIotConsole } from './IotConsoleContext';

export type IotConsoleView = 'controle' | 'carte';

/**
 * Panneau unique de la console des sondes, réutilisé tel quel par le poste de
 * commandement admin, les pages partenaires et (demain) l'Atelier du jardin.
 * Seul le périmètre change — cf. `IotConsoleProvider`.
 */
export const IotConsolePanel: React.FC<{ view: IotConsoleView }> = ({ view }) =>
  view === 'carte' ? <SensorsMapTab /> : <TelemetryControl />;

/** IA de Jardin cadrée sur le périmètre de la console (si le droit est ouvert). */
export const IotConsoleAi: React.FC = () => {
  const { capabilities } = useIotConsole();
  if (!capabilities.ai) return null;
  return <IotChatBotMount />;
};

export default IotConsolePanel;
