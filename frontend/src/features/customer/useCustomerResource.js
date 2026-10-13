import { useCallback, useEffect, useRef, useState } from 'react';
// Existing customer REST clients do not expose abort options; generations own every result.
export default function useCustomerResource(loader) {
  const [resource, setResource] = useState({ status: 'loading' });
  const generation = useRef(0), mounted = useRef(false);
  const load = useCallback(async () => {
    const owner = ++generation.current;
    if (!mounted.current) return;
    setResource({ status: 'loading' });
    try { const data = await loader(); if (mounted.current && owner === generation.current) setResource({ status: 'success', data }); }
    catch (error) { if (mounted.current && owner === generation.current) setResource({ status: 'error', error }); }
  }, [loader]);
  useEffect(() => { mounted.current = true; void Promise.resolve().then(load); const request = generation; return () => { mounted.current = false; request.current++; }; }, [load]);
  return { resource, load };
}
