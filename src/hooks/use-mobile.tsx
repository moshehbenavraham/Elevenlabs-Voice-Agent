import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  return React.useSyncExternalStore(subscribeToViewport, getSnapshot, getServerSnapshot);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

function subscribeToViewport(callback: () => void) {
  if (!window.matchMedia) {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  }

  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}
