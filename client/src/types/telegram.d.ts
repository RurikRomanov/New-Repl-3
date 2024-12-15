interface TelegramWebApp {
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
    HapticFeedback: {
      impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
      notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
      selectionChanged: () => void;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    themeParams: {
      bg_color: string;
      text_color: string;
      hint_color: string;
      link_color: string;
      button_color: string;
      button_text_color: string;
    };
    onEvent: (eventName: 'viewportChanged', callback: () => void) => void;
    offEvent: (eventName: 'viewportChanged', callback: () => void) => void;
  };
}

interface Window {
  Telegram?: TelegramWebApp;
}
