import { useEffect } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export function useAppHaptics() {
  const { impactOccurred, notificationOccurred } = useHapticFeedback();

  useEffect(() => {
    // При монтировании компонента (открытии приложения)
    impactOccurred('medium');
    notificationOccurred('success');

    // Обработчик для web_app_expand
    const handleExpand = () => {
      impactOccurred('light');
    };

    // Добавляем слушатель для web_app_expand
    window.Telegram?.WebApp?.onEvent('viewportChanged', handleExpand);

    // При размонтировании компонента (закрытии приложения)
    return () => {
      impactOccurred('medium');
      notificationOccurred('warning');
      window.Telegram?.WebApp?.offEvent('viewportChanged', handleExpand);
    };
  }, [impactOccurred, notificationOccurred]);
}
