import { Options } from 'swagger-jsdoc';

// ─── Reusable Schema Components ───────────────────────────────────────────────

const UUIDSchema = {
  type: 'string',
  format: 'uuid',
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

const TimestampSchema = {
  type: 'string',
  format: 'date-time',
  example: '2026-06-15T08:00:00.000Z',
};

const SuccessEnvelope = (dataSchema: object, description = 'Success') => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: dataSchema,
        },
      },
    },
  },
});

const ErrorResponse = (statusCode: number, description: string, exampleMessage: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: exampleMessage },
        },
      },
    },
  },
});

const BearerAuth = { bearerAuth: [] };

// ─── Component Schemas ────────────────────────────────────────────────────────

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your access token from POST /api/v1/auth/verify',
    },
  },
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: UUIDSchema,
        phone: { type: 'string', example: '9876543210' },
        name: { type: 'string', nullable: true, example: 'Ravi Shah' },
        avatarUrl: { type: 'string', nullable: true, example: null },
        role: { type: 'string', enum: ['driver', 'passenger', 'both'], example: 'driver' },
        isActive: { type: 'boolean', example: true },
        createdAt: TimestampSchema,
        updatedAt: TimestampSchema,
        vehicle: {
          nullable: true,
          oneOf: [{ $ref: '#/components/schemas/Vehicle' }, { type: 'null' }],
        },
      },
    },
    PublicUser: {
      type: 'object',
      properties: {
        id: UUIDSchema,
        name: { type: 'string', nullable: true },
        avatarUrl: { type: 'string', nullable: true },
        role: { type: 'string', enum: ['driver', 'passenger', 'both'] },
        vehicle: {
          nullable: true,
          oneOf: [{ $ref: '#/components/schemas/Vehicle' }, { type: 'null' }],
        },
      },
    },
    Vehicle: {
      type: 'object',
      properties: {
        id: UUIDSchema,
        make: { type: 'string', example: 'Maruti' },
        model: { type: 'string', example: 'Swift' },
        year: { type: 'integer', example: 2022 },
        color: { type: 'string', example: 'White' },
        plateNumber: { type: 'string', example: 'GJ01AB1234' },
        totalSeats: { type: 'integer', example: 4 },
      },
    },
    Ride: {
      type: 'object',
      properties: {
        id: UUIDSchema,
        originCity: { type: 'string', example: 'Ahmedabad' },
        destinationCity: { type: 'string', example: 'Surat' },
        departureTime: TimestampSchema,
        pricePerSeat: { type: 'number', example: 350 },
        totalSeats: { type: 'integer', example: 3 },
        availableSeats: { type: 'integer', example: 3 },
        status: { type: 'string', enum: ['active', 'cancelled', 'completed'] },
        notes: { type: 'string', nullable: true, example: 'No smoking' },
        createdAt: TimestampSchema,
      },
    },
    RideWithDriver: {
      allOf: [
        { $ref: '#/components/schemas/Ride' },
        {
          type: 'object',
          properties: {
            driver: {
              type: 'object',
              properties: {
                id: UUIDSchema,
                name: { type: 'string', nullable: true },
                avatarUrl: { type: 'string', nullable: true },
                vehicle: {
                  nullable: true,
                  oneOf: [{ $ref: '#/components/schemas/Vehicle' }, { type: 'null' }],
                },
              },
            },
          },
        },
      ],
    },
    Booking: {
      type: 'object',
      properties: {
        id: UUIDSchema,
        rideId: UUIDSchema,
        seats: { type: 'integer', example: 2 },
        status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
        createdAt: TimestampSchema,
        updatedAt: TimestampSchema,
        ride: {
          type: 'object',
          properties: {
            id: UUIDSchema,
            originCity: { type: 'string', example: 'Ahmedabad' },
            destinationCity: { type: 'string', example: 'Surat' },
            departureTime: TimestampSchema,
            pricePerSeat: { type: 'number', example: 350 },
          },
        },
        passenger: {
          nullable: true,
          type: 'object',
          properties: {
            id: UUIDSchema,
            name: { type: 'string', nullable: true },
            phone: { type: 'string', example: '9876543210' },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
    Rating: {
      type: 'object',
      properties: {
        id: UUIDSchema,
        rideId: UUIDSchema,
        raterId: UUIDSchema,
        rateeId: UUIDSchema,
        score: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        comment: { type: 'string', nullable: true, example: 'Very smooth ride!' },
        createdAt: TimestampSchema,
        rater: {
          nullable: true,
          type: 'object',
          properties: {
            id: UUIDSchema,
            name: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
    AuthTokens: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        isNewUser: { type: 'boolean', example: false },
        user: { $ref: '#/components/schemas/User' },
      },
    },
  },
};

// ─── API Paths ────────────────────────────────────────────────────────────────

const paths = {
  // ── AUTH ──────────────────────────────────────────────────────────────────

  '/api/v1/auth/verify': {
    post: {
      tags: ['Auth'],
      summary: 'Exchange Firebase ID token for SaathiRide JWT',
      description:
        'Mobile app sends Firebase ID token after OTP verification. Backend verifies it, upserts the user, and returns access + refresh tokens.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['firebase_token'],
              properties: {
                firebase_token: {
                  type: 'string',
                  description: 'Firebase ID token from Firebase Phone Auth on device',
                  example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ii...',
                },
              },
            },
          },
        },
      },
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/AuthTokens' }, 'Login successful'),
        201: SuccessEnvelope({ $ref: '#/components/schemas/AuthTokens' }, 'Account created (new user)'),
        400: ErrorResponse(400, 'Validation error', 'firebase_token is required'),
        401: ErrorResponse(401, 'Invalid Firebase token', 'Invalid or expired Firebase token'),
      },
    },
  },

  '/api/v1/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Get a new access token using a refresh token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refresh_token'],
              properties: {
                refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              },
            },
          },
        },
      },
      responses: {
        200: SuccessEnvelope(
          {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
          'Token refreshed',
        ),
        401: ErrorResponse(401, 'Invalid refresh token', 'Invalid or expired refresh token'),
      },
    },
  },

  '/api/v1/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Revoke refresh token and log out',
      security: [BearerAuth],
      responses: {
        200: SuccessEnvelope({ type: 'null', nullable: true }, 'Logged out successfully'),
        401: ErrorResponse(401, 'Unauthorized', 'Invalid or missing token'),
      },
    },
  },

  // ── USERS ─────────────────────────────────────────────────────────────────

  '/api/v1/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get own full profile',
      security: [BearerAuth],
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/User' }, 'Profile fetched'),
        401: ErrorResponse(401, 'Unauthorized', 'Invalid or missing token'),
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update own profile (name, avatarUrl, role)',
      security: [BearerAuth],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              minProperties: 1,
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 100, example: 'Ravi Shah' },
                avatar_url: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
                role: { type: 'string', enum: ['driver', 'passenger', 'both'] },
              },
            },
          },
        },
      },
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/User' }, 'Profile updated'),
        400: ErrorResponse(400, 'Validation error', 'At least one field must be provided'),
        401: ErrorResponse(401, 'Unauthorized', 'Invalid or missing token'),
      },
    },
  },

  '/api/v1/users/me/vehicle': {
    put: {
      tags: ['Users'],
      summary: 'Add or update vehicle details',
      description:
        'User must have role driver or both. One vehicle per user — calling again updates existing record.',
      security: [BearerAuth],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['make', 'model', 'year', 'color', 'plate_number', 'total_seats'],
              properties: {
                make: { type: 'string', example: 'Maruti' },
                model: { type: 'string', example: 'Swift' },
                year: { type: 'integer', minimum: 1990, example: 2022 },
                color: { type: 'string', example: 'White' },
                plate_number: {
                  type: 'string',
                  example: 'GJ01AB1234',
                  description: 'Stored uppercase',
                },
                total_seats: { type: 'integer', minimum: 1, maximum: 6, example: 4 },
              },
            },
          },
        },
      },
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/Vehicle' }, 'Vehicle saved'),
        400: ErrorResponse(400, 'Role error', 'Only drivers can register a vehicle'),
        401: ErrorResponse(401, 'Unauthorized', 'Invalid or missing token'),
      },
    },
  },

  '/api/v1/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get public profile of any user',
      security: [BearerAuth],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User ID',
        },
      ],
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/PublicUser' }, 'User profile fetched'),
        404: ErrorResponse(404, 'Not found', 'User not found'),
      },
    },
  },

  // ── RIDES ─────────────────────────────────────────────────────────────────

  '/api/v1/rides': {
    post: {
      tags: ['Rides'],
      summary: 'Post a new ride',
      description:
        'Requires role driver or both, and a registered vehicle. Departure must be at least 1 hour from now.',
      security: [BearerAuth],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['origin_city', 'destination_city', 'departure_time', 'price_per_seat', 'total_seats'],
              properties: {
                origin_city: { type: 'string', example: 'Ahmedabad' },
                destination_city: { type: 'string', example: 'Surat' },
                departure_time: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-06-15T08:00:00+05:30',
                  description: 'ISO 8601 with timezone',
                },
                price_per_seat: { type: 'number', minimum: 10, maximum: 10000, example: 350 },
                total_seats: { type: 'integer', minimum: 1, maximum: 6, example: 3 },
                notes: {
                  type: 'string',
                  maxLength: 500,
                  example: 'No smoking. Stop at Vadodara.',
                  nullable: true,
                },
              },
            },
          },
        },
      },
      responses: {
        201: SuccessEnvelope({ $ref: '#/components/schemas/Ride' }, 'Ride posted successfully'),
        400: ErrorResponse(400, 'Validation / business rule error', 'Please register your vehicle before posting a ride'),
        403: ErrorResponse(403, 'Role error', 'Only drivers can post rides'),
      },
    },
  },

  '/api/v1/rides/search': {
    get: {
      tags: ['Rides'],
      summary: 'Search available rides by route and date',
      security: [BearerAuth],
      parameters: [
        {
          name: 'origin',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          example: 'Ahmedabad',
          description: 'Case-insensitive city match',
        },
        {
          name: 'destination',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          example: 'Surat',
        },
        {
          name: 'date',
          in: 'query',
          required: true,
          schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          example: '2026-06-15',
          description: 'Date in YYYY-MM-DD (IST)',
        },
        {
          name: 'seats',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 6, default: 1 },
          description: 'Minimum seats needed',
        },
      ],
      responses: {
        200: SuccessEnvelope(
          {
            type: 'array',
            items: { $ref: '#/components/schemas/RideWithDriver' },
          },
          'N ride(s) found',
        ),
        400: ErrorResponse(400, 'Validation error', 'origin is required'),
      },
    },
  },

  '/api/v1/rides/my': {
    get: {
      tags: ['Rides'],
      summary: "Get authenticated driver's posted rides",
      security: [BearerAuth],
      responses: {
        200: SuccessEnvelope(
          {
            type: 'array',
            items: { $ref: '#/components/schemas/Ride' },
          },
          'Your rides fetched',
        ),
      },
    },
  },

  '/api/v1/rides/{id}': {
    get: {
      tags: ['Rides'],
      summary: 'Get ride detail with driver and vehicle info',
      security: [BearerAuth],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/RideWithDriver' }, 'Ride fetched'),
        404: ErrorResponse(404, 'Not found', 'Ride not found'),
      },
    },
    delete: {
      tags: ['Rides'],
      summary: 'Cancel a ride',
      description:
        'Driver cancels their own ride. Blocked if confirmed bookings exist. Cancels all pending bookings automatically.',
      security: [BearerAuth],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: SuccessEnvelope({ type: 'null', nullable: true }, 'Ride cancelled successfully'),
        400: ErrorResponse(400, 'Business rule', 'This ride has confirmed bookings'),
        403: ErrorResponse(403, 'Forbidden', 'You can only cancel your own rides'),
        404: ErrorResponse(404, 'Not found', 'Ride not found'),
      },
    },
  },

  // ── BOOKINGS ──────────────────────────────────────────────────────────────

  '/api/v1/bookings': {
    post: {
      tags: ['Bookings'],
      summary: 'Request a seat on a ride',
      security: [BearerAuth],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ride_id', 'seats'],
              properties: {
                ride_id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
                seats: { type: 'integer', minimum: 1, maximum: 6, example: 2 },
              },
            },
          },
        },
      },
      responses: {
        201: SuccessEnvelope({ $ref: '#/components/schemas/Booking' }, 'Booking request sent'),
        400: ErrorResponse(400, 'Business rule', 'Only 1 seat(s) available, you requested 2'),
        409: ErrorResponse(409, 'Duplicate booking', 'You already have a booking for this ride'),
      },
    },
  },

  '/api/v1/bookings/my': {
    get: {
      tags: ['Bookings'],
      summary: "Get authenticated passenger's bookings",
      security: [BearerAuth],
      responses: {
        200: SuccessEnvelope(
          {
            type: 'array',
            items: { $ref: '#/components/schemas/Booking' },
          },
          'Bookings fetched',
        ),
      },
    },
  },

  '/api/v1/bookings/ride/{rideId}': {
    get: {
      tags: ['Bookings'],
      summary: "Get all booking requests for a driver's ride",
      description: 'Only the driver who owns the ride can call this. Returns passenger contact info.',
      security: [BearerAuth],
      parameters: [
        { name: 'rideId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: SuccessEnvelope(
          {
            type: 'array',
            items: { $ref: '#/components/schemas/Booking' },
          },
          'Ride bookings fetched',
        ),
        403: ErrorResponse(403, 'Forbidden', 'You can only view bookings for your own rides'),
      },
    },
  },

  '/api/v1/bookings/{id}/accept': {
    patch: {
      tags: ['Bookings'],
      summary: 'Accept a booking request',
      description: 'Driver accepts a pending booking. Seat count decremented atomically.',
      security: [BearerAuth],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: SuccessEnvelope({ $ref: '#/components/schemas/Booking' }, 'Booking accepted'),
        400: ErrorResponse(400, 'Invalid status', "Cannot accept a booking with status 'confirmed'"),
        403: ErrorResponse(403, 'Forbidden', 'You can only accept bookings for your own rides'),
      },
    },
  },

  '/api/v1/bookings/{id}/decline': {
    patch: {
      tags: ['Bookings'],
      summary: 'Decline a booking request',
      security: [BearerAuth],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: SuccessEnvelope({ type: 'null', nullable: true }, 'Booking declined'),
        400: ErrorResponse(400, 'Invalid status', "Cannot decline a booking with status 'confirmed'"),
        403: ErrorResponse(403, 'Forbidden', 'You can only decline bookings for your own rides'),
      },
    },
  },

  '/api/v1/bookings/{id}/cancel': {
    patch: {
      tags: ['Bookings'],
      summary: 'Passenger cancels their own booking',
      description: 'If booking was confirmed, available_seats is restored on the ride.',
      security: [BearerAuth],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: SuccessEnvelope({ type: 'null', nullable: true }, 'Booking cancelled'),
        400: ErrorResponse(400, 'Invalid status', "Cannot cancel a booking with status 'completed'"),
        403: ErrorResponse(403, 'Forbidden', 'You can only cancel your own bookings'),
      },
    },
  },

  // ── RATINGS ───────────────────────────────────────────────────────────────

  '/api/v1/ratings': {
    post: {
      tags: ['Ratings'],
      summary: 'Submit a post-ride rating',
      description:
        'Rater must have participated in the ride. Ride departure must have passed. One rating per rater per ride.',
      security: [BearerAuth],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ride_id', 'ratee_id', 'score'],
              properties: {
                ride_id: { type: 'string', format: 'uuid' },
                ratee_id: { type: 'string', format: 'uuid', description: 'The user being rated' },
                score: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                comment: { type: 'string', maxLength: 500, example: 'Great driver!', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        201: SuccessEnvelope({ $ref: '#/components/schemas/Rating' }, 'Rating submitted'),
        400: ErrorResponse(400, 'Business rule', 'You can only rate after the ride has departed'),
        403: ErrorResponse(403, 'Not a participant', 'You can only rate rides you participated in'),
        409: ErrorResponse(409, 'Duplicate', 'You have already rated this ride'),
      },
    },
  },

  '/api/v1/ratings/user/{userId}': {
    get: {
      tags: ['Ratings'],
      summary: 'Get ratings received by a user with average score',
      security: [BearerAuth],
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: SuccessEnvelope(
          {
            type: 'object',
            properties: {
              averageScore: {
                type: 'number',
                nullable: true,
                example: 4.75,
                description: 'null if no ratings yet',
              },
              totalCount: { type: 'integer', example: 12 },
              ratings: { type: 'array', items: { $ref: '#/components/schemas/Rating' } },
            },
          },
          'Ratings fetched',
        ),
        404: ErrorResponse(404, 'Not found', 'User not found'),
      },
    },
  },

  // ── DEVICES ───────────────────────────────────────────────────────────────

  '/api/v1/devices': {
    post: {
      tags: ['Devices'],
      summary: 'Register or refresh FCM push token',
      description:
        'Call on every login and when FCM token refreshes. Upserts — calling again updates the existing token.',
      security: [BearerAuth],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fcm_token', 'platform'],
              properties: {
                fcm_token: { type: 'string', example: 'dXPx3fAfz8...' },
                platform: { type: 'string', enum: ['ios', 'android'] },
              },
            },
          },
        },
      },
      responses: {
        200: SuccessEnvelope({ type: 'null', nullable: true }, 'Device registered'),
        401: ErrorResponse(401, 'Unauthorized', 'Invalid or missing token'),
      },
    },
    delete: {
      tags: ['Devices'],
      summary: 'Remove FCM token on logout',
      description: 'User will stop receiving push notifications until they log in and re-register.',
      security: [BearerAuth],
      responses: {
        200: SuccessEnvelope({ type: 'null', nullable: true }, 'Device removed'),
        401: ErrorResponse(401, 'Unauthorized', 'Invalid or missing token'),
      },
    },
  },
};

// ─── Full Swagger Options ─────────────────────────────────────────────────────

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SaathiRide API',
      version: '1.0.0',
      description: `
## SaathiRide Backend API

Intercity ride-sharing platform for India. Built with Node.js + Express + TypeScript + Supabase PostgreSQL.

### Authentication
All protected endpoints require a **Bearer JWT** in the Authorization header.
Get your token from **POST /api/v1/auth/verify**.

Click **Authorize** (🔒) at the top right, paste your token, and all
subsequent requests will include it automatically.

### Base URL
All endpoints are prefixed with \`/api/v1\`

### Response Format
All responses follow a consistent envelope:
\`\`\`json
{ "success": true, "message": "...", "data": { ... } }
\`\`\`

### Gujarat Pilot Routes
Initial routes: Ahmedabad ↔ Surat, Ahmedabad ↔ Vadodara,
Ahmedabad ↔ Rajkot, Surat ↔ Vadodara
      `,
      contact: {
        name: 'SaathiRide Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development',
      },
      {
        url: 'https://api.saathiride.in',
        description: 'Production (Mumbai)',
      },
    ],
    components,
    paths,
    tags: [
      { name: 'Auth', description: 'Firebase OTP verification and JWT management' },
      { name: 'Users', description: 'Profile management and vehicle registration' },
      { name: 'Rides', description: 'Post, search, and manage rides' },
      { name: 'Bookings', description: 'Seat booking request and status management' },
      { name: 'Ratings', description: 'Post-ride ratings and review system' },
      { name: 'Devices', description: 'FCM push notification token registration' },
    ],
  },
  apis: [],
};
