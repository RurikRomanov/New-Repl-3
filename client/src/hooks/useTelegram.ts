import { useEffect, useState } from 'react';
import { verifyUser } from '../lib/api';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
          enable: () => void;
          disable: () => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        setHeaderColor: (color: string) => void;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: string;
          hash?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
      };
    };
  }
}

const mockUser = {
  id: 12345,
  first_name: "Test User",
  username: "testuser"
};

export function useTelegram() {
  const [user, setUser] = useState<{
    id: number;
    username?: string;
    first_name: string;
  } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    const tg = window.Telegram?.WebApp;
    setIsTelegramWebApp(!!tg);
    
    if (tg) {
      // Сообщаем Telegram что приложение готово
      tg.ready();
      
      // Расширяем окно на весь экран
      tg.expand();

      // Устанавливаем начальную тему
      setTheme(tg.colorScheme);

      // Получаем данные пользователя
      const user = tg.initDataUnsafe.user;
      if (user) {
        setUser(user);
        // Верифицируем пользователя на сервере
        verifyUser(JSON.stringify(tg.initDataUnsafe))
          .catch(console.error);
      }

      // Подписываемся на изменение темы
      const handleThemeChange = () => {
        setTheme(tg.colorScheme);
      };
      tg.onEvent('themeChanged', handleThemeChange);

      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Для тестирования вне Telegram используем мок-данные
      setUser(mockUser);
    }
  }, []);

  return { 
    user, 
    theme,
    isTelegramWebApp
  };
}
