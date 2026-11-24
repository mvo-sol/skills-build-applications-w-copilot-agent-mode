# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components responsible for presentation and UI state; use the shared API client for relative `/api` requests. Render accessible loading, empty, success, and error states.
- Logic tier decision: Keep HTTP validation and response mapping in Express routes, with business behavior in explicit service functions. Return deliberate 4xx responses for invalid or unknown input rather than allowing cast errors to become 500s.
- Data tier decision: Use Mongoose models for required fields, defaults, and references. Keep persistence in the data layer and seed stable demo records with upserts without deleting unrelated user data.
- Activity tracking approach: Validate `userId` and `teamId` shape and existence, accept `type` and `minutes`, and persist the referenced user/team with computed points and an occurrence date.
- Team management approach: Require a team name, preserve the submitted name and mascot, default members to an empty array, and expose members consistently when listing and creating teams.
- Leaderboard approach: Sum activity points by team, sort totals descending, and return each team name, total, and 1-based rank.
- Workout suggestions approach: Find the user by email, select suggestions based on their fitness goal or recent activity, and include a concise reason; return a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — currently 4 failures and 1 pass. Failures indicate missing required model validation for users, teams, activities, or workouts; the seed/idempotency contract currently passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` — currently 4 failures. They indicate invalid activity/team input is not deliberately rejected, leaderboard totals/ranks are not returned, and suggestions do not match the user's goal or activity pattern.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — currently 15 failures. They indicate missing API-backed overview content and user-specific suggestion requests, plus missing loading, meaningful empty, or accessible error states on the four routes.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks TypeScript compilation; failures indicate backend type errors.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks TypeScript compilation and Vite bundling; failures indicate frontend type or production-build errors.
