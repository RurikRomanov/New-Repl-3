const calculateHash = async (blockHash: string, nonce: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(blockHash + nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Рассчитываем максимальное количество попыток на основе сложности
const calculateMaxAttempts = (difficulty: number): number => {
  // 2^(difficulty * 4) дает примерное количество попыток для нахождения хэша
  // Умножаем на 4, так как каждый символ - это 4 бита
  return Math.pow(2, difficulty * 4);
};

self.onmessage = async (e: MessageEvent) => {
  const { blockHash, difficulty, onlineMiners = 1 } = e.data;
  const target = "0".repeat(difficulty);
  const maxAttempts = calculateMaxAttempts(difficulty);
  
  let nonce = 0;
  let lastProgressUpdate = Date.now();
  const progressUpdateInterval = 100; // Интервал обновления прогресса в мс
  
  while (true) {
    const nonceStr = nonce.toString(16).padStart(8, '0');
    const hash = await calculateHash(blockHash, nonceStr);
    
    if (hash.startsWith(target)) {
      self.postMessage({ 
        type: 'solution', 
        nonce: nonceStr,
        progress: 100 
      });
      break;
    }
    
    nonce++;
    
    // Отправляем обновления прогресса с определенным интервалом
    const now = Date.now();
    if (now - lastProgressUpdate > progressUpdateInterval) {
      // Рассчитываем прогресс как процент от предполагаемого количества попыток
      const progress = Math.min(100, (nonce / maxAttempts) * 100);
      
      self.postMessage({ 
        type: 'progress', 
        progress,
        currentHashrate: nonce / ((now - lastProgressUpdate) / 1000) // Хэшей в секунду
      });
      
      lastProgressUpdate = now;
      
      // Добавляем небольшую задержку для снижения нагрузки на CPU
      await new Promise(resolve => setTimeout(resolve, Math.max(10, 50 / onlineMiners)));
    }
  }
};

export {};
