import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getUserStats } from "../lib/api";

interface UserStatsProps {
  userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
  const { data: stats } = useQuery({
    queryKey: [`/api/stats/user/${userId}`],
  });

  if (!stats) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Your Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Rewards</span>
            <span className="text-sm text-muted-foreground">
              {stats.user.totalRewards}
            </span>
          </div>

          

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Blocks Mined</span>
            <span className="text-sm text-muted-foreground">
              {stats.rewards.filter((r: any) => r.type === "miner").length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
