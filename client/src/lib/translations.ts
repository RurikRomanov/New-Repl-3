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
  'settings.title': {
    en: 'Settings',
    ru: 'Настройки'
  },
  'settings.haptics': {
    en: 'Haptic Feedback',
    ru: 'Тактильный отклик'
  },
  'settings.notifications': {
    en: 'Notifications',
    ru: 'Уведомления'
  },
  'settings.background': {
    en: 'Background Mining',
    ru: 'Фоновый майнинг'
  },
  'settings.language': {
    en: 'Language',
    ru: 'Язык'
  },
  'settings.theme': {
    en: 'Theme',
    ru: 'Тема'
  },
  'settings.apply': {
    en: 'Apply Settings',
    ru: 'Применить настройки'
  },
  'settings.cancel': {
    en: 'Cancel',
    ru: 'Отмена'
  }
};

export function useTranslation(language: 'en' | 'ru') {
  return (key: string) => translations[key]?.[language] || key;
}
