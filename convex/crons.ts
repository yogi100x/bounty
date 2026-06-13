// Cron registry. Time-based notification nudges are driven by a single
// every-15-minutes interval; the target action fans out due pushes for users
// whose LOCAL time falls inside a nudge window (computed per-user from their
// IANA timezone). We use `crons.interval` only (per Convex guidelines — no
// hourly/daily/weekly helpers).

import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Run the due-notification sweep every 15 minutes. The 15-minute cadence
// matches the nudge "last 15 minutes" matching window in `dueNudgeTargets`.
crons.interval(
  'due-notifications',
  { minutes: 15 },
  internal.notifications.runDueNudges,
  {},
);

export default crons;
