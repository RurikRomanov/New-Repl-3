const calculateHash = (blockHash: string, nonce: string): string => {
  // In a real implementation, use WebCrypto API
  return blockHash + nonce;
};

self.onmessage = (e: MessageEvent) => {
  const { blockHash, difficulty } = e.data;
  const target = "0".repeat(difficulty);
  
  let nonce = 0;
  while (true) {
    const nonceStr = nonce.toString(16).padStart(8, '0');
    const hash = calculateHash(blockHash, nonceStr);
    
    if (hash.startsWith(target)) {
      self.postMessage({ nonce: nonceStr });
      break;
    }
    
    nonce++;
    
    // Every 1000 iterations, check if we should stop
    if (nonce % 1000 === 0) {
      // Allow other messages to be processed
      setTimeout(() => {}, 0);
    }
  }
};

export {};
