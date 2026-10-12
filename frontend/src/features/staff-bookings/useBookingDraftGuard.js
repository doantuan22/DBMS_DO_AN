import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const draftNavigationAllowed = (state, destination, { isSafeDestination, confirm }) =>
  !state.pending && (!state.dirty || Boolean(isSafeDestination?.(destination)) || confirm());

// Keep the existing BrowserRouter. Manager can define a scope in which drafts survive.
export default function useBookingDraftGuard(dirty, pending, { isSafeDestination, readState, message } = {}) {
  const state = useRef({ dirty, pending });
  const location = useLocation();
  const index = useRef(0);
  const returning = useRef(false);
  useEffect(() => { state.current = { dirty, pending }; }, [dirty, pending]);
  useEffect(() => { index.current = window.history.state?.idx ?? 0; }, [location]);
  useEffect(() => {
    const currentState = () => readState?.() ?? state.current;
    const allowed = (destination) => {
      return draftNavigationAllowed(currentState(), destination, { isSafeDestination,
        confirm: () => window.confirm(message ?? 'Có thay đổi đặt vé chưa lưu. Rời màn hình và bỏ thay đổi?') });
    };
    const beforeUnload = (event) => {
      const current = currentState();
      if (current.dirty || current.pending) { event.preventDefault(); event.returnValue = ''; }
    };
    const click = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0) return;
      const current = currentState();
      if ((current.dirty || current.pending) && !allowed(link.href)) { event.preventDefault(); event.stopPropagation(); }
    };
    const pop = (event) => {
      if (returning.current) { returning.current = false; return; }
      const current = currentState();
      if (!current.dirty && !current.pending) return;
      if (!allowed(window.location.href)) {
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
  }, [isSafeDestination, readState, message]);
}
