import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason: string };
const userEmail = 'mona@example.com';

async function loadWorkoutSuggestions() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const { suggestions } = await getJson<{ suggestions: WorkoutSuggestion[] }>(path);
  return suggestions;
}

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions yet."
      loadItems={loadWorkoutSuggestions}
      renderItem={(suggestion) => `${suggestion.title}: ${suggestion.reason}`}
    />
  );
}
