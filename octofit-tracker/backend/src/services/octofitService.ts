import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw httpError(400, 'Invalid activity input');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || !Types.ObjectId.isValid(userId)
    || !Types.ObjectId.isValid(teamId)
    || typeof type !== 'string'
    || type.trim().length === 0
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
  ) {
    throw httpError(400, 'Invalid activity input');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!user) {
    throw httpError(404, 'User not found');
  }
  if (!team) {
    throw httpError(404, 'Team not found');
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw httpError(400, 'Invalid team input');
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw httpError(400, 'Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw httpError(400, 'Team mascot is required');
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw httpError(400, 'Invalid team members');
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  if (uniqueMemberIds.length > 0) {
    const existingMemberCount = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
    if (existingMemberCount !== uniqueMemberIds.length) {
      throw httpError(404, 'One or more team members were not found');
    }
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: uniqueMemberIds,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teams = await Team.find({
    _id: { $in: totals.map((entry) => entry._id) },
  }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .filter((entry) => teamNames.has(entry._id.toString()))
    .map((entry, index) => ({
      teamName: teamNames.get(entry._id.toString()) as string,
      totalPoints: entry.totalPoints,
      rank: index + 1,
    }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
    throw httpError(404, 'User not found');
  }

  const user = await User.findOne({ email: userEmail.trim() }).lean();
  if (!user) {
    throw httpError(404, 'User not found');
  }

  const [workouts, recentActivity] = await Promise.all([
    Workout.find().lean(),
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
  ]);

  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : '';
  const activityType = typeof recentActivity?.type === 'string' ? recentActivity.type.toLowerCase() : '';

  let focus = goal;
  let reason = `Recommended for your ${goal} goal`;
  if (!workouts.some((workout) => workout.focus.toLowerCase() === focus)) {
    focus = activityType;
    reason = `Recommended based on your recent ${activityType} activity`;
  }

  const matching = workouts.filter((workout) => {
    const workoutFocus = workout.focus.toLowerCase();
    return workoutFocus === focus;
  });
  const selected = matching.length > 0 ? matching : workouts;

  if (selected.length === 0) {
    return [];
  }

  if (matching.length === 0) {
    reason = goal
      ? `Recommended for your ${goal} goal and activity pattern`
      : 'Recommended based on your activity pattern';
  }

  return selected.map((workout) => ({
    ...workout,
    reason,
  }));
}

export { User };
