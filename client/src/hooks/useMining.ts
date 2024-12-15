import { useState, useEffect, useCallback } from 'react';
import { getCurrentBlock, submitSolution } from '../lib/api';
import { useToast } from './use-toast';

export function useMining(userId: string) {
  const [mining, setMining] = useState(false);
  const [onlineMiners, setOnlineMiners] = useState(1);
  const [currentBlock, setCurrentBlock] = useState<any>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const { toast } = useToast();
  const { broadcast, peers } = useWebRTC(userId, (data) => {
    // Handle WebRTC messages here
    console.log('Received WebRTC message:', data);
  });

  const startMining = useCallback(() => {
    if (!currentBlock || mining) return;

    const miningWorker = new Worker(
      new URL('../workers/miningWorker.ts', import.meta.url),
      { type: 'module' }
    );

    miningWorker.onmessage = async (e) => {
      const { type, nonce } = e.data;
      
      if (type === 'solution') {
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
      }
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
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', minerId: userId }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'onlineMiners') {
        setOnlineMiners(data.count);
      }
    };
    
    return () => ws.close();
  }, [userId]);

  return {
    mining,
    currentBlock,
    startMining,
    stopMining,
    onlineMiners,
    peers,
    broadcast
  };
}