import { useCallback, useEffect, useRef } from 'react';
export default function useFormWriteLock() {
  const pending = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const begin = useCallback(() => {
    if (pending.current || !mounted.current) return false;
    pending.current = true;
    return true;
  }, []);
  const finish = useCallback(() => {
    pending.current = false;
  }, []);
  const active = useCallback(() => mounted.current, []);
  return { begin, finish, active };
}
