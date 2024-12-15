import { useCallback } from 'react';

export function useHapticFeedback() {
  const impactOccurred = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    try {
      window.Telegram?.WebApp.HapticFeedback.impactOccurred(style);
    } catch (error) {
      console.warn('Haptic feedback not supported');
    }
  }, []);

  const notificationOccurred = useCallback((type: 'error' | 'success' | 'warning') => {
    try {
      window.Telegram?.WebApp.HapticFeedback.notificationOccurred(type);
    } catch (error) {
      console.warn('Haptic feedback not supported');
    }
  }, []);

  const selectionChanged = useCallback(() => {
    try {
      window.Telegram?.WebApp.HapticFeedback.selectionChanged();
    } catch (error) {
      console.warn('Haptic feedback not supported');
    }
  }, []);

  const tabSelected = useCallback(() => {
    try {
      impactOccurred('light');
      selectionChanged();
    } catch (error) {
      console.warn('Haptic feedback not supported');
    }
  }, [impactOccurred, selectionChanged]);

  return {
    impactOccurred,
    notificationOccurred,
    selectionChanged,
    tabSelected
  };
}
