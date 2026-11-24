import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

async function loadLeaderboard() {
  const { leaderboard } = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
  return leaderboard;
}

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard rankings yet."
      loadItems={loadLeaderboard}
      renderItem={(entry) => `${entry.rank}. ${entry.teamName}: ${entry.totalPoints} points`}
    />
  );
}
