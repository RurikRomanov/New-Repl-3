import { useTelegram } from "../hooks/useTelegram";
import { MiningDashboard } from "../components/MiningDashboard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChartBar, Trophy } from "lucide-react";

export function Home() {
  const { user } = useTelegram();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please open this app in Telegram</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <MiningDashboard userId={user.id.toString()} />
      
      <div className="grid grid-cols-2 gap-4">
        <Link href="/stats">
          <Button variant="outline" className="w-full">
            <ChartBar className="mr-2 h-4 w-4" />
            Statistics
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="outline" className="w-full">
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
