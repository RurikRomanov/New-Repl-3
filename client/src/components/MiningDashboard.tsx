import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { useMining } from "../hooks/useMining";
import { useState, useEffect } from "react";

interface MiningDashboardProps {
  userId: string;
}

export function MiningDashboard({ userId }: MiningDashboardProps) {
  const { mining, currentBlock, startMining, stopMining } = useMining(userId);
  const [progress, setProgress] = useState(0);
  const [onlineMiners, setOnlineMiners] = useState(1);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}`);
    
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
  
  useEffect(() => {
    if (mining) {
      const interval = setInterval(() => {
        setProgress(p => (p + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [mining]);

  return (
    <Card className="w-full max-w-md mx-auto bg-black/60 backdrop-blur-sm border-slate-800">
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
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button
            className="w-full"
            onClick={mining ? stopMining : startMining}
            variant={mining ? "destructive" : "default"}
          >
            {mining ? "Stop Mining" : "Start Mining"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
