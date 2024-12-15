const calculateHash = async (blockHash: string, nonce: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(blockHash + nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

self.onmessage = async (e: MessageEvent) => {
  const { blockHash, difficulty, energy } = e.data;
  const target = "0".repeat(difficulty);
  
  let nonce = 0;
  let energyLeft = energy;
  
  while (energyLeft > 0) {
    const nonceStr = nonce.toString(16).padStart(8, '0');
    const hash = await calculateHash(blockHash, nonceStr);
    
    if (hash.startsWith(target)) {
      self.postMessage({ type: 'solution', nonce: nonceStr });
      break;
    }
    
    nonce++;
    
    // Каждые 100 хешей тратим 1 единицу энергии
    if (nonce % 100 === 0) {
      energyLeft--;
      self.postMessage({ type: 'energy', remaining: energyLeft });
    }
    
    // Every 1000 iterations, check if we should stop
    if (nonce % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  if (energyLeft <= 0) {
    self.postMessage({ type: 'no_energy' });
  }
};

export {};
