import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '@/config/env';
import { swaggerOptions } from '@/docs/swagger';
import { requestLogger } from '@/middleware/requestLogger';
import { errorHandler } from '@/middleware/errorHandler';
import { apiLimiter } from '@/middleware/rateLimiter';
import { ApiError } from '@/utils/ApiError';

// Route imports (modules built in subsequent prompts)
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import ridesRoutes from '@/modules/rides/rides.routes';
import bookingsRoutes from '@/modules/bookings/bookings.routes';
import ratingsRoutes from '@/modules/ratings/ratings.routes';
import devicesRoutes from '@/modules/devices/devices.routes';

export function createApp(): Application {
  const app = express();

  // ── Security ───────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? ['https://saathiride.in'] : '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    }),
  );

  // ── Parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(compression());

  // ── Logging ────────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Swagger Docs (dev + staging only) ─────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'SaathiRide API Docs',
        customCss: `
        .swagger-ui .topbar { background-color: #4B3CC7; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #4B3CC7; }
      `,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2,
          docExpansion: 'none',
          filter: true,
          tagsSorter: 'alpha',
        },
      }),
    );

    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    console.log(`📚 Swagger UI: http://localhost:${env.PORT}/api-docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${env.PORT}/api-docs.json`);
  }

  // ── Rate limiting ──────────────────────────────────────────────────────
  app.use(`/api/${env.API_VERSION}`, apiLimiter);

  // ── Health check (no auth, no rate limit) ──────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'saathiridebackend',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── API Routes ─────────────────────────────────────────────────────────
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', usersRoutes);
  apiRouter.use('/rides', ridesRoutes);
  apiRouter.use('/bookings', bookingsRoutes);
  apiRouter.use('/ratings', ratingsRoutes);
  apiRouter.use('/devices', devicesRoutes);

  app.use(`/api/${env.API_VERSION}`, apiRouter);

  // ── 404 handler ────────────────────────────────────────────────────────
  app.use((_req, _res, next) => {
    next(ApiError.notFound('Endpoint'));
  });

  // ── Global error handler (must be last) ────────────────────────────────
  app.use(errorHandler);

  return app;
}
