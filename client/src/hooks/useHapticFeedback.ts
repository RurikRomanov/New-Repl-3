import { useCallback } from 'react';

export function useHapticFeedback() {
  const impactOccurred = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    window.Telegram?.WebApp.HapticFeedback.impactOccurred(style);
  }, []);

  const notificationOccurred = useCallback((type: 'error' | 'success' | 'warning') => {
    window.Telegram?.WebApp.HapticFeedback.notificationOccurred(type);
  }, []);

  const selectionChanged = useCallback(() => {
    window.Telegram?.WebApp.HapticFeedback.selectionChanged();
  }, []);

  return {
    impactOccurred,
    notificationOccurred,
    selectionChanged
  };
}
