import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Local to the new module; preserve the legacy BrowserRouter rather than changing all routes.
export default function useBookingDraftGuard(dirty, pending) {
  const state = useRef({ dirty, pending });
  const location = useLocation();
  const index = useRef(0);
  const returning = useRef(false);
  useEffect(() => { state.current = { dirty, pending }; }, [dirty, pending]);
  useEffect(() => { index.current = window.history.state?.idx ?? 0; }, [location]);
  useEffect(() => {
    const allowed = () => !state.current.pending && (!state.current.dirty || window.confirm('Có thay đổi đặt vé chưa lưu. Rời màn hình và bỏ thay đổi?'));
    const beforeUnload = (event) => {
      if (state.current.dirty || state.current.pending) { event.preventDefault(); event.returnValue = ''; }
    };
    const click = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0) return;
      if ((state.current.dirty || state.current.pending) && !allowed()) { event.preventDefault(); event.stopPropagation(); }
    };
    const pop = (event) => {
      if (returning.current) { returning.current = false; return; }
      if (!state.current.dirty && !state.current.pending) return;
      if (!allowed()) {
        event.stopImmediatePropagation();
        const delta = index.current - (window.history.state?.idx ?? index.current);
        if (delta) { returning.current = true; window.history.go(delta); }
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);
    window.addEventListener('popstate', pop, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', click, true);
      window.removeEventListener('popstate', pop, true);
    };
  }, []);
}
