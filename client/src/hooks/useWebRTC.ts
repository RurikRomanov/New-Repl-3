import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

export function useWebRTC(userId: string, onMessage?: (data: any) => void) {
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [autoConnect, setAutoConnect] = useState(true);
  const [usedHashes, setUsedHashes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Автоматическое создание P2P соединений
  useEffect(() => {
    if (autoConnect) {
      fetch('/api/miners/active')
        .then(res => res.json())
        .then(miners => {
          miners.forEach((minerId: string) => {
            if (minerId !== userId && !peers.has(minerId)) {
              connectToPeer(minerId);
            }
          });
        })
        .catch(console.error);
    }
  }, [autoConnect, userId]);
  
  const createPeerConnection = useCallback(async (targetId: string, isInitiator: boolean) => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(config);
    let dataChannel: RTCDataChannel;
    
    if (isInitiator) {
      dataChannel = pc.createDataChannel('mining');
      setupDataChannel(dataChannel);
    } else {
      pc.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel(dataChannel);
      };
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Отправляем ICE кандидата через сигнальный сервер
        fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ice',
            from: userId,
            to: targetId,
            candidate: event.candidate
          })
        });
      }
    };
    
    setPeers(prev => {
      const newPeers = new Map(prev);
      newPeers.set(targetId, { connection: pc, dataChannel });
      return newPeers;
    });
    
    return pc;
  }, [userId]);
  
  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      toast({
        title: "Peer Connected",
        description: "Successfully connected to peer miner"
      });
    };
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          switch (data.type) {
            case 'progress':
              if (typeof data.value === 'number') {
                onMessage(data);
              }
              break;
            case 'hashrate':
              if (typeof data.value === 'number') {
                onMessage(data);
              }
              break;
            case 'solution_found':
              if (data.blockId && data.nonce) {
                onMessage(data);
              }
              break;
            case 'status':
              if (data.mining !== undefined) {
                onMessage(data);
              }
              break;
            case 'used_hash':
              if (data.hash) {
                setUsedHashes(prev => new Set(prev).add(data.hash));
              }
              break;
          }
        }
      } catch (error) {
        console.error('Failed to parse P2P message:', error);
      }
    };
    
    channel.onerror = (error) => {
      console.error('DataChannel error:', error);
      toast({
        title: "Connection Error",
        description: "Error in peer connection",
        variant: "destructive"
      });
    };
    
    channel.onclose = () => {
      console.log('DataChannel closed, attempting to reconnect...');
      // Попытка переподключения к потерянному пиру
      const peerId = Array.from(peers.entries())
        .find(([_, p]) => p.dataChannel === channel)?.[0];
      
      if (peerId) {
        setTimeout(() => {
          connectToPeer(peerId);
        }, 5000);
      }
    };
  };
  
  const connectToPeer = useCallback(async (targetId: string) => {
    const pc = await createPeerConnection(targetId, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Отправляем оффер через сигнальный сервер
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'offer',
        from: userId,
        to: targetId,
        offer
      })
    });
  }, [userId, createPeerConnection]);
  
  const handlePeerSignal = useCallback(async (data: any) => {
    if (data.type === 'offer') {
      const pc = await createPeerConnection(data.from, false);
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'answer',
          from: userId,
          to: data.from,
          answer
        })
      });
    } else if (data.type === 'answer') {
      const peer = peers.get(data.from);
      if (peer) {
        await peer.connection.setRemoteDescription(data.answer);
      }
    } else if (data.type === 'ice') {
      const peer = peers.get(data.from);
      if (peer) {
        await peer.connection.addIceCandidate(data.candidate);
      }
    }
  }, [peers, userId, createPeerConnection]);
  
  const broadcast = useCallback((message: any) => {
    const messageStr = JSON.stringify(message);
    peers.forEach((peer) => {
      if (peer.dataChannel.readyState === 'open') {
        peer.dataChannel.send(messageStr);
      }
    });
  }, [peers]);
  
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/signal`);
      
      ws.onopen = () => {
        console.log('Signal server connected');
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'peer-joined') {
            connectToPeer(data.peerId);
          } else {
            handlePeerSignal(data);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('Signal server disconnected, attempting to reconnect...');
        // Очищаем текущие соединения
        peers.forEach((peer) => {
          peer.connection.close();
        });
        setPeers(new Map());
        // Попытка переподключения через 5 секунд
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws?.close();
      };
    };

    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
        clearTimeout(reconnectTimer);
      }
      peers.forEach((peer) => {
        peer.connection.close();
      });
    };
  }, [userId, connectToPeer, handlePeerSignal]);
  
  return {
    broadcast,
    peers: Array.from(peers.keys()),
    usedHashes
  };
}
