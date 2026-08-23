export type Brand = 'fj' | 'lfdv';
export type BrandSource = 'metadata' | 'redirect_marker' | 'redirect_to' | 'default';

const DEFAULT_FJ_DOMAINS = ['frequence-jardin.lovable.app'];

function getFjDomains(extraDomains = ''): string[] {
  return [
    ...DEFAULT_FJ_DOMAINS,
    ...extraDomains
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean),
  ];
}

function hostMatchesFj(host: string, domains: string[]): boolean {
  const normalizedHost = host.toLowerCase();
  return domains.some(
    (domain) =>
      normalizedHost === domain ||
      normalizedHost.endsWith(`.${domain}`) ||
      (normalizedHost.endsWith('.lovable.app') &&
        normalizedHost.includes('frequence-jardin'))
  );
}

export function safeUrlHost(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolveBrand(
  userMetadata: Record<string, unknown>,
  redirectTo: string,
  extraDomains = ''
): { brand: Brand; brandSource: BrandSource } {
  if (userMetadata.app === 'frequence-jardin') {
    return { brand: 'fj', brandSource: 'metadata' };
  }

  try {
    const redirectUrl = new URL(redirectTo);
    const isFjHost = hostMatchesFj(redirectUrl.hostname, getFjDomains(extraDomains));
    if (isFjHost && redirectUrl.searchParams.get('auth_brand') === 'fj') {
      return { brand: 'fj', brandSource: 'redirect_marker' };
    }
    if (isFjHost) {
      return { brand: 'fj', brandSource: 'redirect_to' };
    }
  } catch {
    // An absent or invalid redirect deliberately falls back to LFDV.
  }

  return { brand: 'lfdv', brandSource: 'default' };
}