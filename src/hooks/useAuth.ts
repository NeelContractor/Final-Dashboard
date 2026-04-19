// src/hooks/useAuth.ts
//
// Drop-in replacement for the repeated "verify token + redirect" pattern
// that currently lives in Home, Inventory, and every other protected page.
//
// Usage (replaces the entire useEffect + useState in each page):
//
//   const { isVerifying } = useAuth();
//   if (isVerifying) return <Spinner />;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

interface UseAuthOptions {
    /** Redirect to this path if not authenticated. Default: '/signin' */
    redirectTo?: string;
    /** Redirect here if authenticated but has no stores. Default: '/store/create-store' */
    noStoreRedirect?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
    const { redirectTo = '/signin', noStoreRedirect = '/store/create-store' } = options;
    const navigate    = useNavigate();
    const { authStatus, bootstrap } = useAppStore();

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
        const result = await bootstrap();
        if (cancelled) return;

        if (result === 'no-token' || result === 'unauthorized') {
            navigate(redirectTo, { replace: true });
        } else if (result === 'no-store') {
            navigate(noStoreRedirect, { replace: true });
        }
        // 'ok' or 'error' → stay on page
        };

        run();
        return () => { cancelled = true; };
    // bootstrap is stable (Zustand action ref never changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        /** True while the first auth check is in flight */
        isVerifying: authStatus === 'idle' || authStatus === 'loading',
        isAuthenticated: authStatus === 'authenticated',
        authStatus,
    };
}