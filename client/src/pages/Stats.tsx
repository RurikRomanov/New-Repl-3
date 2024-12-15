import { useTelegram } from "../hooks/useTelegram";
import { UserStats } from "../components/UserStats";
import { BlockHistory } from "../components/BlockHistory";

export function Stats() {
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
      <UserStats userId={user.id.toString()} />
      <BlockHistory />
    </div>
  );
}
