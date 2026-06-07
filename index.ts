import 'module-alias/register';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { testConnection } from '@/infrastructure/database';
import { initFirebase } from '@/config/firebase';
import { registerJobs } from '@/jobs';
import { logger } from '@/utils/logger';

async function bootstrap(): Promise<void> {
  try {
    // Initialise infrastructure
    await testConnection();
    initFirebase();
    registerJobs();

    // Start server
    const app = createApp();
    const port = env.PORT;

    app.listen(port, () => {
      logger.info(`🚀 SaathiRide API running`, {
        port,
        env: env.NODE_ENV,
        version: env.API_VERSION,
        url: `http://localhost:${port}/api/${env.API_VERSION}`,
      });
    });
  } catch (err: any) {
    logger.error('❌ Failed to start server', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
