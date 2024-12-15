import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { useMining } from "../hooks/useMining";
import { useState, useEffect } from "react";
import { useHapticFeedback } from "../hooks/useHapticFeedback";

interface MiningDashboardProps {
  userId: string;
}

export function MiningDashboard({ userId }: MiningDashboardProps) {
  const { mining, currentBlock, startMining, stopMining, onlineMiners } = useMining(userId);
  const { broadcast, peers } = useWebRTC(userId);
  const { impactOccurred, notificationOccurred } = useHapticFeedback();
  const [progress, setProgress] = useState(0);
  const [peerProgress, setPeerProgress] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (mining) {
      const speedMultiplier = Math.max(1, onlineMiners / 2); // Ускорение от количества майнеров
      const interval = setInterval(() => {
        setProgress(p => {
          const increment = speedMultiplier * (Math.random() * 2 + 1); // Случайное увеличение для анимации
          return p + increment > 100 ? 0 : p + increment;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [mining, onlineMiners]);

  return (
    <Card className="w-full max-w-md mx-auto bg-background/80 backdrop-blur border-muted">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mining Dashboard</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>{onlineMiners} online</span>
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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mining Progress</span>
                <span className="text-sm text-muted-foreground">
                  Boost: x{onlineMiners}
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
          )}

          <Button
            className="w-full"
            onClick={() => {
              impactOccurred('medium');
              if (mining) {
                notificationOccurred('warning');
                stopMining();
              } else {
                notificationOccurred('success');
                startMining();
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
