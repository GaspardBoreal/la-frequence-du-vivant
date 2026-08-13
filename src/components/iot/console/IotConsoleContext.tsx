import React from 'react';

/**
 * Périmètre et droits d'une console des sondes.
 *
 * Un seul socle de code sert trois lectures : le poste de commandement admin
 * (parc entier), la page partenaire (un fournisseur), et demain l'Atelier du
 * jardin (une propriété). Le périmètre n'est qu'un confort d'affichage :
 * la vérité d'accès reste dans les policies RLS côté base.
 */
export interface IotConsoleScope {
  /** Fournisseurs (identifiants `iot_fournisseurs`). `null` = tous. */
  fournisseurIds?: string[] | null;
  /** Noms tels qu'ils apparaissent dans le journal des livraisons (« brad »). */
  fournisseurKeys?: string[] | null;
  proprieteIds?: string[] | null;
  capteurIds?: string[] | null;
}

export interface IotCapabilities {
  /** Bouton « Trame de test ». */
  testDelivery: boolean;
  /** Dépliage du payload brut dans le journal. */
  rawPayload: boolean;
  /** Onglet catalogue fournisseurs / types. */
  catalogue: boolean;
  /** Liens vers l'espace jardin d'une propriété. */
  proprieteLinks: boolean;
  /** IA de Jardin. */
  ai: boolean;
}

export type IotChrome = 'admin' | 'partenaire' | 'jardin';

export interface IotConsoleValue {
  scope: IotConsoleScope;
  capabilities: IotCapabilities;
  chrome: IotChrome;
  /** Libellé du périmètre affiché à l'utilisateur. */
  label: string;
  /** Clé stable du périmètre, utilisée dans les clés de cache React Query. */
  scopeKey: string;
}

const FULL_CAPS: IotCapabilities = {
  testDelivery: true,
  rawPayload: true,
  catalogue: true,
  proprieteLinks: true,
  ai: true,
};

export const DEFAULT_IOT_CONSOLE: IotConsoleValue = {
  scope: {},
  capabilities: FULL_CAPS,
  chrome: 'admin',
  label: 'Parc entier',
  scopeKey: 'parc',
};

const IotConsoleContext = React.createContext<IotConsoleValue>(DEFAULT_IOT_CONSOLE);

const norm = (v?: string[] | null) => (v && v.length ? [...v].sort() : null);

export const IotConsoleProvider: React.FC<{
  scope?: IotConsoleScope;
  capabilities?: Partial<IotCapabilities>;
  chrome?: IotChrome;
  label?: string;
  children: React.ReactNode;
}> = ({ scope = {}, capabilities, chrome = 'admin', label, children }) => {
  const value = React.useMemo<IotConsoleValue>(() => {
    const normalized: IotConsoleScope = {
      fournisseurIds: norm(scope.fournisseurIds),
      fournisseurKeys: norm(scope.fournisseurKeys),
      proprieteIds: norm(scope.proprieteIds),
      capteurIds: norm(scope.capteurIds),
    };
    const scopeKey =
      [
        normalized.fournisseurIds?.join('|'),
        normalized.proprieteIds?.join('|'),
        normalized.capteurIds?.join('|'),
      ]
        .filter(Boolean)
        .join('::') || 'parc';
    return {
      scope: normalized,
      capabilities: { ...FULL_CAPS, ...capabilities },
      chrome,
      label: label ?? 'Parc entier',
      scopeKey,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scope.fournisseurIds?.join('|'),
    scope.fournisseurKeys?.join('|'),
    scope.proprieteIds?.join('|'),
    scope.capteurIds?.join('|'),
    chrome,
    label,
    capabilities?.testDelivery,
    capabilities?.rawPayload,
    capabilities?.catalogue,
    capabilities?.proprieteLinks,
    capabilities?.ai,
  ]);

  return <IotConsoleContext.Provider value={value}>{children}</IotConsoleContext.Provider>;
};

/** Périmètre et droits de la console courante (parc entier par défaut). */
export function useIotConsole(): IotConsoleValue {
  return React.useContext(IotConsoleContext);
}

/** Un capteur entre-t-il dans le périmètre courant ? */
export function capteurInScope(c: any, scope: IotConsoleScope): boolean {
  if (!c) return false;
  if (scope.capteurIds && !scope.capteurIds.includes(c.id)) return false;
  if (scope.proprieteIds && !scope.proprieteIds.includes(c.propriete_id)) return false;
  if (scope.fournisseurIds) {
    const fid = c.type?.fournisseur_id ?? c.type?.fournisseur?.id ?? null;
    if (!fid || !scope.fournisseurIds.includes(fid)) return false;
  }
  return true;
}
