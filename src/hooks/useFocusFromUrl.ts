import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type FocusKind = 'species' | 'practice' | 'text' | 'testimony' | 'event';

export interface FocusDescriptor {
  kind: FocusKind;
  id: string;
  marcheId?: string | null;
  tab?: string | null;
  sensory?: string | null;
}

/**
 * Reads `?focus=<kind>:<id>&marcheId=&tab=&sensory=` from URL.
 * Returns a stable descriptor and a `consume()` helper that strips the params.
 */
export function useFocusFromUrl(): {
  focus: FocusDescriptor | null;
  consume: () => void;
} {
  const location = useLocation();
  const navigate = useNavigate();
  const [focus, setFocus] = useState<FocusDescriptor | null>(null);
  const consumedRef = useRef<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('focus');
    if (!raw) {
      setFocus(null);
      return;
    }
    const [kind, ...rest] = raw.split(':');
    const id = decodeURIComponent(rest.join(':'));
    if (!kind || !id) return;
    const allowed: FocusKind[] = ['species', 'practice', 'text', 'testimony', 'event'];
    if (!allowed.includes(kind as FocusKind)) return;
    setFocus({
      kind: kind as FocusKind,
      id,
      marcheId: params.get('marcheId'),
      tab: params.get('tab'),
      sensory: params.get('sensory'),
    });
  }, [location.search]);

  const consume = useMemo(() => () => {
    const key = `${location.pathname}${location.search}`;
    if (consumedRef.current === key) return;
    consumedRef.current = key;
    const params = new URLSearchParams(location.search);
    ['focus', 'marcheId', 'tab', 'sensory'].forEach(k => params.delete(k));
    const qs = params.toString();
    navigate(location.pathname + (qs ? `?${qs}` : ''), { replace: true });
  }, [location.pathname, location.search, navigate]);

  return { focus, consume };
}
