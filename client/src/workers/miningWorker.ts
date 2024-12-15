const calculateHash = async (blockHash: string, nonce: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(blockHash + nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

self.onmessage = async (e: MessageEvent) => {
  const { blockHash, difficulty, onlineMiners = 1 } = e.data;
  const target = "0".repeat(difficulty);
  
  let nonce = 0;
  const baseDelay = 100; // Базовая задержка в мс
  const minDelay = 10; // Минимальная задержка
  
  while (true) {
    const nonceStr = nonce.toString(16).padStart(8, '0');
    const hash = await calculateHash(blockHash, nonceStr);
    
    if (hash.startsWith(target)) {
      self.postMessage({ type: 'solution', nonce: nonceStr });
      break;
    }
    
    nonce++;
    
    // Динамическая задержка на основе количества майнеров
    if (nonce % 100 === 0) {
      const delay = Math.max(minDelay, Math.floor(baseDelay / onlineMiners));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export {};
