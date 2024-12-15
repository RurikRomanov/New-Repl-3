import { useState, useEffect, useCallback } from 'react';
import { getCurrentBlock, submitSolution } from '../lib/api';
import { useToast } from './use-toast';

export function useMining(userId: string) {
  const [mining, setMining] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<any>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const { toast } = useToast();

  const startMining = useCallback(() => {
    if (!currentBlock || mining) return;

    const miningWorker = new Worker(
      new URL('../workers/miningWorker.ts', import.meta.url),
      { type: 'module' }
    );

    miningWorker.onmessage = async (e) => {
      const { nonce } = e.data;
      try {
        await submitSolution(currentBlock.id, nonce, userId);
        toast({
          title: "Block Mined!",
          description: "You successfully mined a block"
        });
      } catch (error) {
        console.error('Mining error:', error);
      }
      setMining(false);
      miningWorker.terminate();
    };

    miningWorker.postMessage({
      blockHash: currentBlock.hash,
      difficulty: currentBlock.difficulty
    });

    setWorker(miningWorker);
    setMining(true);
  }, [currentBlock, mining, userId]);

  const stopMining = useCallback(() => {
    if (worker) {
      worker.terminate();
      setWorker(null);
    }
    setMining(false);
  }, [worker]);

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        const { data } = await getCurrentBlock();
        setCurrentBlock(data);
      } catch (error) {
        console.error('Failed to fetch block:', error);
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    mining,
    currentBlock,
    startMining,
    stopMining
  };
}