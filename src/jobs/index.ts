import cron from 'node-cron';
import { logger } from '@/utils/logger';
import { completeRidesJob } from './completeRides.job';
import { rideReminderJob }  from './rideReminder.job';
import { ratingPromptJob }  from './ratingPrompt.job';

/**
 * registerJobs
 *
 * Call this once in index.ts after the DB connection is verified.
 * All jobs run in the same process as the Express server.
 */
export function registerJobs(): void {
  cron.schedule('*/15 * * * *', async () => {
    logger.debug('Running job: completeRides');
    await completeRidesJob();
  });

  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running job: rideReminder');
    await rideReminderJob();
  });

  cron.schedule('*/30 * * * *', async () => {
    logger.debug('Running job: ratingPrompt');
    await ratingPromptJob();
  });

  logger.info('✅ Cron jobs registered', {
    jobs: ['completeRides (*/15)', 'rideReminder (*/5)', 'ratingPrompt (*/30)'],
  });
}
