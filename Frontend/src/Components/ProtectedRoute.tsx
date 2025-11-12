import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

/**
 * ProtectedRoute wraps pages that require an authenticated Supabase session.
 * If no session, redirects to /auth and preserves the original location in state.
 */
const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Initial session fetch
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // While checking session, render a minimal placeholder
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-green-200 via-amber-100 to-amber-300">
        <div className="rounded-xl bg-white/90 backdrop-blur px-6 py-4 shadow">Checking authentication...</div>
      </div>
    );
  }

  // Not authenticated: redirect to /auth with original location for post-login return
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Authenticated: render child page
  return <>{children}</>;
};

export default ProtectedRoute;
