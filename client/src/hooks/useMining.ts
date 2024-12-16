import { useState, useEffect, useCallback } from 'react';
import { getCurrentBlock, submitSolution } from '../lib/api';
import { useToast } from './use-toast';
import { useWebRTC } from './useWebRTC';

export function useMining(userId: string) {
  const [mining, setMining] = useState(false);
  const [onlineMiners, setOnlineMiners] = useState(1);
  const [progress, setProgress] = useState(0);
  const [peerProgress, setPeerProgress] = useState<Record<string, number>>({});
  const [peerHashrates, setPeerHashrates] = useState<Record<string, number>>({});
  const [currentBlock, setCurrentBlock] = useState<any>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [currentHashrate, setCurrentHashrate] = useState(0); // Added state for current hashrate
  const [lastProgress, setLastProgress] = useState<number>(0);
  const [totalNetworkProgress, setTotalNetworkProgress] = useState<number>(0);
  const { toast } = useToast();
  const { broadcast, peers } = useWebRTC(userId, (data) => {
    if (!data) return;

    switch (data.type) {
      case 'progress':
        // Handle progress updates from peers
        break;
      case 'hashrate':
        // Handle hashrate updates from peers
        break;
      case 'solution_found':
        // Handle when a peer finds a solution
        if (mining) {
          stopMining();
          toast({
            title: "Block Mined",
            description: "Another miner found the solution"
          });
        }
        break;
    }
  });

  const startMining = useCallback(() => {
    if (!currentBlock || mining) return;

    const miningWorker = new Worker(
      new URL('../workers/miningWorker.ts', import.meta.url),
      { type: 'module' }
    );

    setWorker(miningWorker);
    setMining(true);
  }, [currentBlock, mining]);

  const stopMining = useCallback(() => {
    if (worker) {
      worker.terminate();
      setWorker(null);
    }
    setMining(false);
    setCurrentHashrate(0); // Reset hashrate on stop
  }, [worker]);

  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = async (e: MessageEvent) => {
      const { type, nonce, progress: workerProgress, currentHashrate, hashCount, hash, timeTaken, estimatedTimeRemaining } = e.data;

      if (!currentBlock) return; // Added check for currentBlock

      switch (type) {
        case 'solution':
          try {
            await submitSolution(currentBlock.id, nonce, userId);
            const hashRate = hashCount / timeTaken;
            toast({
              title: "Block Mined! 🎉",
              description: `Successfully mined with ${(hashRate/1000000).toFixed(2)} MH/s`
            });

            // Оповещаем других майнеров о найденном решении
            broadcast({
              type: 'solution_found',
              blockId: currentBlock.id,
              minerId: userId,
              hash,
              nonce,
              hashRate,
              totalProgress: totalNetworkProgress // Отправляем общий прогресс сети
            });

            // Сохраняем прогресс перед остановкой
            setLastProgress(workerProgress);
          } catch (error) {
            console.error('Mining error:', error);
            toast({
              title: "Mining Error",
              description: "Failed to submit solution",
              variant: "destructive"
            });
          }
          setMining(false);
          worker.terminate();
          break;

        case 'progress':
          // Обновляем прогресс текущего майнера
          setProgress(workerProgress);
          setLastProgress(workerProgress);
          setCurrentHashrate(currentHashrate / 1000000);

          // Рассчитываем общий прогресс сети
          const activeMiners = Object.keys(peerProgress).length + 1;
          const totalProgress = (Object.values(peerProgress).reduce((sum, p) => sum + p, 0) + workerProgress) / activeMiners;
          setTotalNetworkProgress(totalProgress);

          // Отправляем обновление прогресса и хэшрейта другим майнерам
          broadcast({
            type: 'progress',
            progress: workerProgress,
            peerId: userId,
            hashrate: currentHashrate,
            estimatedTimeRemaining,
            lastProgress: workerProgress // Отправляем текущий прогресс как последний сохраненный
          });
          break;
      }
    };

    worker.onmessage = handleWorkerMessage;
    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
    };
  }, [worker, totalNetworkProgress]);


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

  const estimateHashrate = async () => {
    const iterations = 10000;
    const testData = "test_block_data";
    const startTime = performance.now();
    const encoder = new TextEncoder();

    const promises = Array.from({ length: iterations }, (_, i) =>
      crypto.subtle.digest('SHA-256', encoder.encode(testData + i))
    );

    await Promise.all(promises);
    const endTime = performance.now();
    const timeInSeconds = (endTime - startTime) / 1000;
    const hashrate = iterations / timeInSeconds / 1000000; // Convert to MH/s
    return Math.min(hashrate, 100); // Cap at 100 MH/s for realistic display
  };

  const updateHashrate = useCallback(async () => {
    if (mining) {
      const rate = await estimateHashrate();
      setCurrentHashrate(rate);
      broadcast({ type: 'hashrate', value: rate, peerId: userId });
    }
  }, [mining, broadcast, userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mining) {
      updateHashrate();
      interval = setInterval(updateHashrate, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mining, updateHashrate]);

  useEffect(() => {
    const wsConnect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}`);

        ws.onopen = () => {
          console.log('WebSocket connected');
          ws.send(JSON.stringify({ type: 'register', minerId: userId }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'onlineMiners') {
            setOnlineMiners(data.count);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setTimeout(wsConnect, 5000); // Попытка переподключения через 5 секунд
        };

        return ws;
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setTimeout(wsConnect, 5000);
        return null;
      }
    };

    const ws = wsConnect();

    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'onlineMiners':
            setOnlineMiners(data.count);
            break;
          case 'peer-joined':
            console.log('New peer joined:', data.peerId);
            break;
          case 'hashrate':
            if (data.peerId !== userId) {
              setPeerHashrates(prev => ({
                ...prev,
                [data.peerId]: data.value
              }));
            }
            break;
          case 'progress':
            if (data.peerId !== userId) {
              setPeerProgress(prev => ({
                ...prev,
                [data.peerId]: data.value
              }));
            }
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ type: 'register', minerId: userId }));
    };

    ws.onmessage = handleSocketMessage;
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTimeout(wsConnect, 5000);
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId]);

  useEffect(() => {
    if (worker) {
      worker.postMessage({
        blockHash: currentBlock.hash,
        difficulty: currentBlock.difficulty
      });
    }
  }, [worker, currentBlock]);


  return {
    mining,
    currentBlock,
    startMining,
    stopMining,
    onlineMiners,
    peers,
    broadcast,
    currentHashrate, // Added currentHashrate to the returned object
    progress,
    lastProgress,
    totalNetworkProgress
  };
}