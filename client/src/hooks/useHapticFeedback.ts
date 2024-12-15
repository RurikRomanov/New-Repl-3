import { useCallback } from 'react';

/**
 * Hook для работы с тактильной обратной связью в Telegram Web App
 */
export function useHapticFeedback() {
  const impactOccurred = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  }, []);

  const notificationOccurred = useCallback((type: 'error' | 'success' | 'warning') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  }, []);

  const selectionChanged = useCallback(() => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  }, []);

  const tabSelected = useCallback(() => {
    impactOccurred('light');
    selectionChanged();
  }, [impactOccurred, selectionChanged]);

  return {
    impactOccurred,
    notificationOccurred,
    selectionChanged,
    tabSelected
  };
}
