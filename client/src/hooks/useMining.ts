import { useState, useEffect, useCallback } from 'react';
import { getCurrentBlock, submitSolution } from '../lib/api';
import { useToast } from './use-toast';
import { useWebRTC } from './useWebRTC';

export function useMining(userId: string) {
  const [mining, setMining] = useState(false);
  const [onlineMiners, setOnlineMiners] = useState(1);
  const [currentBlock, setCurrentBlock] = useState<any>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [currentHashrate, setCurrentHashrate] = useState(0); // Added state for current hashrate
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
    setCurrentHashrate(0); // Reset hashrate on stop
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

  return {
    mining,
    currentBlock,
    startMining,
    stopMining,
    onlineMiners,
    peers,
    broadcast,
    currentHashrate // Added currentHashrate to the returned object
  };
}