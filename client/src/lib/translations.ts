interface Translations {
  [key: string]: {
    en: string;
    ru: string;
  };
}

export const translations: Translations = {
  'mining.dashboard': {
    en: 'Mining Dashboard',
    ru: 'Панель майнинга'
  },
  'mining.currentBlock': {
    en: 'Current Block',
    ru: 'Текущий блок'
  },
  'mining.difficulty': {
    en: 'Difficulty',
    ru: 'Сложность'
  },
  'mining.networkProgress': {
    en: 'Network Progress',
    ru: 'Прогресс сети'
  },
  'mining.networkBoost': {
    en: 'Network Boost',
    ru: 'Сетевой буст'
  },
  'mining.startMining': {
    en: 'Start Mining',
    ru: 'Начать майнинг'
  },
  'mining.stopMining': {
    en: 'Stop Mining',
    ru: 'Остановить майнинг'
  },
  'mining.hashrate': {
    en: 'Current Hashrate',
    ru: 'Текущий хешрейт'
  },
  'mining.estimatedTime': {
    en: 'Est. Time',
    ru: 'Расч. время'
  },
  'mining.online': {
    en: 'online',
    ru: 'онлайн'
  },
  'mining.peers': {
    en: 'P2P peers',
    ru: 'P2P пиры'
  },
  'mining.noPeers': {
    en: 'No active peers',
    ru: 'Нет активных пиров'
  },
  'settings.title': {
    en: 'Settings',
    ru: 'Настройки'
  },
  'settings.haptics': {
    en: 'Haptic Feedback',
    ru: 'Тактильный отклик'
  },
  'settings.hapticsDescription': {
    en: 'Vibrate on important events',
    ru: 'Вибрация при важных событиях'
  },
  'settings.notifications': {
    en: 'Notifications',
    ru: 'Уведомления'
  },
  'settings.notificationsDescription': {
    en: 'Show mining progress notifications',
    ru: 'Показывать уведомления о прогрессе'
  },
  'settings.background': {
    en: 'Background Mining',
    ru: 'Фоновый майнинг'
  },
  'settings.backgroundDescription': {
    en: 'Continue mining when app is in background',
    ru: 'Продолжать майнинг в фоновом режиме'
  },
  'settings.language': {
    en: 'Language',
    ru: 'Язык'
  },
  'settings.languageDescription': {
    en: 'Choose interface language',
    ru: 'Выберите язык интерфейса'
  },
  'settings.theme': {
    en: 'Theme',
    ru: 'Тема'
  },
  'settings.themeDescription': {
    en: 'Choose interface theme',
    ru: 'Выберите тему интерфейса'
  },
  'settings.light': {
    en: 'Light',
    ru: 'Светлая'
  },
  'settings.dark': {
    en: 'Dark',
    ru: 'Тёмная'
  },
  'settings.apply': {
    en: 'Apply Settings',
    ru: 'Применить настройки'
  },
  'settings.cancel': {
    en: 'Cancel',
    ru: 'Отмена'
  },
  'settings.saved': {
    en: 'Settings Saved',
    ru: 'Настройки сохранены'
  },
  'settings.savedDescription': {
    en: 'Your settings have been applied successfully',
    ru: 'Ваши настройки были успешно применены'
  }
};

export function useTranslation(language: 'en' | 'ru') {
  return (key: string) => translations[key]?.[language] || key;
}
