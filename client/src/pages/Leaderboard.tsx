import { useTelegram } from "../hooks/useTelegram";
import { LeaderboardTable } from "../components/LeaderboardTable";

export function Leaderboard() {
  const { user } = useTelegram();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please open this app in Telegram</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <LeaderboardTable />
    </div>
  );
}
