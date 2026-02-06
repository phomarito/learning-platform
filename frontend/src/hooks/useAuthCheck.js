// frontend/src/hooks/useAuthCheck.js
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthCheck = () => {
  const { checkAuth, isLoading } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!hasChecked.current && !isLoading) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth, isLoading]);

  return isLoading;
};