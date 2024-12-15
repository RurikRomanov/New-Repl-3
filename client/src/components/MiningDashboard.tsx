import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMining } from "../hooks/useMining";

interface MiningDashboardProps {
  userId: string;
}

export function MiningDashboard({ userId }: MiningDashboardProps) {
  const { mining, currentBlock, startMining, stopMining } = useMining(userId);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Mining Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Block</span>
            <span className="text-sm text-muted-foreground">
              {currentBlock?.hash.slice(0, 10)}...
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Difficulty</span>
            <span className="text-sm text-muted-foreground">
              {currentBlock?.difficulty || 0}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Energy</span>
            <Progress value={energy} max={100} />
            <span className="text-xs text-muted-foreground">{energy}/100</span>
          </div>

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
