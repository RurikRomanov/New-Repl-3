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
  'mining.networkHashrate': {
    en: 'Network Hashrate',
    ru: 'Хешрейт сети'
  },
  'mining.estimatedHashrate': {
    en: 'Estimated Hashrate',
    ru: 'Расчетный хешрейт'
  },
  'mining.estimatedMiningTime': {
    en: 'Est. Mining Time',
    ru: 'Расч. время майнинга'
  },
  'mining.peerProgress': {
    en: 'Peer Progress',
    ru: 'Прогресс пиров'
  },
  'mining.miningStarted': {
    en: 'Mining Started',
    ru: 'Майнинг запущен'
  },
  'mining.miningStartedDesc': {
    en: 'Mining process has begun',
    ru: 'Процесс майнинга начат'
  },
  'mining.miningStopped': {
    en: 'Mining Stopped',
    ru: 'Майнинг остановлен'
  },
  'mining.miningStoppedDesc': {
    en: 'Mining process has been stopped',
    ru: 'Процесс майнинга остановлен'
  },
  'settings.title': {
    en: 'Mining Settings',
    ru: 'Настройки майнинга'
  },
  'settings.haptics': {
    en: 'Haptic Feedback',
    ru: 'Тактильный отклик'
  },
  'settings.hapticsDesc': {
    en: 'Vibrate on important events',
    ru: 'Вибрация при важных событиях'
  },
  'settings.notifications': {
    en: 'Notifications',
    ru: 'Уведомления'
  },
  'settings.notificationsDesc': {
    en: 'Show mining progress notifications',
    ru: 'Показывать уведомления о прогрессе'
  },
  'settings.background': {
    en: 'Background Mining',
    ru: 'Фоновый майнинг'
  },
  'settings.backgroundDesc': {
    en: 'Continue mining when app is in background',
    ru: 'Продолжать майнинг в фоновом режиме'
  },
  'settings.language': {
    en: 'Language',
    ru: 'Язык интерфейса'
  },
  'settings.theme': {
    en: 'Theme',
    ru: 'Тема оформления'
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
  'settings.savedDesc': {
    en: 'Your settings have been applied successfully',
    ru: 'Ваши настройки были успешно применены'
  },
  'mining.noActivePeers': {
    en: 'No active peers',
    ru: 'Нет активных пиров'
  },
  'mining.peerHashrate': {
    en: 'H/s',
    ru: 'х/с'
  },
  'mining.notEstimatedYet': {
    en: 'Not estimated yet',
    ru: 'Еще не рассчитано'
  },
  'settings.light': {
    en: 'Light',
    ru: 'Светлая'
  },
  'settings.dark': {
    en: 'Dark',
    ru: 'Тёмная'
  },
  'settings.chooseLanguage': {
    en: 'Choose interface language',
    ru: 'Выберите язык интерфейса'
  },
  'settings.chooseTheme': {
    en: 'Choose interface theme',
    ru: 'Выберите тему интерфейса'
  }
};

export function useTranslation(language: 'en' | 'ru') {
  return (key: string) => translations[key]?.[language] || key;
}