const calculateHash = async (blockHash: string, nonce: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(blockHash + nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Рассчитываем максимальное количество попыток на основе сложности
const calculateMaxAttempts = (difficulty: number): number => {
  // 2^difficulty дает нам количество попыток для нахождения хэша с нужным количеством нулей
  return Math.pow(2, difficulty);
};

self.onmessage = async (e: MessageEvent) => {
  const { type, block, difficulty } = e.data;
  
  if (!block?.hash) {
    self.postMessage({ type: 'error', message: 'Invalid block data' });
    return;
  }
  const blockHash = block.hash;
  const target = "0".repeat(difficulty);
  const maxAttempts = calculateMaxAttempts(difficulty);
  
  let nonce = Math.floor(Math.random() * 1000000); // Случайное начальное значение
  let hashCount = 0;
  let startTime = Date.now();
  let lastProgressUpdate = startTime;
  const progressUpdateInterval = 100; // Интервал обновления прогресса в мс
  
  const batchSize = 1000; // Количество хэшей в одном батче
  
  while (true) {
    // Обрабатываем батч хэшей
    for (let i = 0; i < batchSize; i++) {
      const nonceStr = (nonce + i).toString(16).padStart(8, '0');
      const hash = await calculateHash(blockHash, nonceStr);
      
      if (hash.startsWith(target)) {
        // Нашли решение
        const timeTaken = (Date.now() - startTime) / 1000;
        const finalHashrate = hashCount / timeTaken;
        
        self.postMessage({ 
          type: 'solution', 
          nonce: nonceStr,
          hash,
          hashCount,
          timeTaken,
          hashrate: finalHashrate
        });
        return;
      }
    }
    
    nonce += batchSize;
    hashCount += batchSize;
    
    // Обновляем прогресс
    const now = Date.now();
    if (now - lastProgressUpdate > progressUpdateInterval) {
      const timePassed = (now - startTime) / 1000;
      const currentHashrate = hashCount / timePassed;
      
      // Оцениваем прогресс на основе вероятности нахождения решения
      const probabilityFound = 1 - Math.pow(1 - 1/maxAttempts, hashCount);
      const progress = Math.min(99.9, probabilityFound * 100); // Никогда не показываем 100% до нахождения решения
      
      self.postMessage({ 
        type: 'progress', 
        progress,
        hashCount,
        currentHashrate,
        estimatedTimeRemaining: (maxAttempts / currentHashrate) * (1 - probabilityFound)
      });
      
      lastProgressUpdate = now;
      
      // Добавляем небольшую задержку для снижения нагрузки на CPU
      await new Promise(resolve => setTimeout(resolve, Math.max(5, 20 / 1))); //Assuming onlineMiners defaults to 1 if not provided
    }
  }
};

export {};