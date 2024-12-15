import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { useMining } from "../hooks/useMining";
import { useState, useEffect, useRef } from "react";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useWebRTC } from "../hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";

interface MiningDashboardProps {
  userId: string;
}

export function MiningDashboard({ userId }: MiningDashboardProps) {
  const { mining, currentBlock, startMining, stopMining, onlineMiners } = useMining(userId);
  const [peerHashrates, setPeerHashrates] = useState<Record<string, number>>({});
  const [peerStatus, setPeerStatus] = useState<Record<string, boolean>>({});
  
  const { broadcast, peers } = useWebRTC(userId, (message: any) => {
    switch (message.type) {
      case 'progress':
        setPeerProgress(prev => ({
          ...prev,
          [message.peerId]: message.value
        }));
        break;
      case 'hashrate':
        setPeerHashrates(prev => ({
          ...prev,
          [message.peerId]: message.value
        }));
        break;
      case 'status':
        setPeerStatus(prev => ({
          ...prev,
          [message.peerId]: message.mining
        }));
        break;
      case 'solution_found':
        notificationOccurred('success');
        impactOccurred('heavy');
        toast({
          title: "Solution Found!",
          description: `Peer ${message.peerId.slice(0, 8)}... found a solution!`
        });
        break;
    }
  });
  const { impactOccurred, notificationOccurred } = useHapticFeedback();
  const [progress, setProgress] = useState(0);
  const [peerProgress, setPeerProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const intervalId = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    
    if (mining) {
      // Начальное состояние майнинга
      const startMining = () => {
        const activePeers = Object.entries(peerStatus).filter(([_, status]) => status).length;
        const speedMultiplier = Math.max(1, activePeers + 1);
        
        // Dispatch event about active miners count change
        window.dispatchEvent(new CustomEvent('miners-count-changed', { 
          detail: { count: activePeers + 1 } // +1 for current miner
        }));

        intervalId.current = setInterval(() => {
          setProgress(p => {
            const increment = speedMultiplier * (Math.random() * 2 + 1);
            const newProgress = p + increment > 100 ? 0 : p + increment;
            
            try {
              // Отправляем обновление прогресса другим майнерам
              broadcast({ type: 'progress', value: newProgress, peerId: userId });
            } catch (error) {
              console.error('Failed to broadcast progress:', error);
            }
            
            return newProgress;
          });
        }, 50);
      };

      startMining();

      return () => {
        if (intervalId.current) clearInterval(intervalId.current);
      };
    } else {
      setProgress(0);
      setPeerProgress({});
      if (intervalId.current) clearInterval(intervalId.current);
    }
  }, [mining, onlineMiners, broadcast, userId]);

  return (
    <Card className="w-full max-w-md mx-auto bg-background/80 backdrop-blur border-muted">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mining Dashboard</CardTitle>
          <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{onlineMiners} online</span>
              </div>
              <div className="flex items-center gap-2 relative group">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full opacity-20 animate-ping" />
                </div>
                <span>{peers.length} P2P peers</span>
                
                {/* Tooltip со списком пиров */}
                <div className="absolute hidden group-hover:block top-full left-0 mt-2 p-2 bg-black/80 backdrop-blur-sm rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="text-xs space-y-1">
                    {peers.map((peerId) => (
                      <div key={peerId} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${peerStatus[peerId] ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="font-mono">{peerId.slice(0, 8)}...</span>
                          {peerHashrates[peerId] && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(peerHashrates[peerId])} H/s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {peers.length === 0 && (
                      <div className="text-muted-foreground">No active peers</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Block</span>
            <span className="text-sm text-muted-foreground font-mono">
              {currentBlock?.hash.slice(0, 10)}...
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Difficulty</span>
            <span className="text-sm text-muted-foreground">
              {currentBlock?.difficulty || 0}
            </span>
          </div>

          {mining && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Your Progress</span>
                  <span className="text-sm text-muted-foreground">
                    Boost: x{Object.entries(peerStatus).filter(([_, status]) => status).length + 1}
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2 relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"
                    style={{
                      width: `${progress}%`,
                      transition: 'width 0.1s ease-out'
                    }}
                  />
                </Progress>
              </div>
              
              {Object.entries(peerProgress).length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Peer Progress</span>
                  {Object.entries(peerProgress).map(([peerId, value]) => (
                    <div key={peerId} className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Peer {peerId.slice(0, 8)}...</span>
                        <span>{Math.round(value)}%</span>
                      </div>
                      <Progress 
                        value={value} 
                        className="h-1.5 relative overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600"
                          style={{
                            width: `${value}%`,
                            transition: 'width 0.1s ease-out'
                          }}
                        />
                      </Progress>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => {
              impactOccurred('medium');
              if (mining) {
                notificationOccurred('warning');
                stopMining();
                window.dispatchEvent(new CustomEvent('mining-state-changed', { 
                  detail: { mining: false } 
                }));
              } else {
                notificationOccurred('success');
                startMining();
                window.dispatchEvent(new CustomEvent('mining-state-changed', { 
                  detail: { mining: true } 
                }));
              }
            }}
            variant={mining ? "destructive" : "default"}
          >
            {mining ? "Stop Mining" : "Start Mining"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}