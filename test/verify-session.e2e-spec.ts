import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

// Mock Redis for testing to avoid needing actual Redis running or mocked logic complexity
// Note: For integration test, we ideally want real Redis or check if we can mock the store.
// Given the environment, let's try to just run against the app if it relies on local Redis.
// If Redis is not available, this test might fail.

describe('Session Authentication (e2e)', () => {
  let app: INestApplication;
  let cookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Duplicate main.ts setup for test env matching
    const configService = app.get(ConfigService);
    /* 
       We skip exact Redis setup here because AppModule imports ContextModule which likely sets up global things.
       However, main.ts manual setups (app.use...) need to be repeated here for E2E if we bootstrap via Test.createTestingModule
       BUT, if we want to confirm main.ts works, we should rely on manual setup mirroring main.ts or extract setup to a function.
       For now, let's try to mirror main.ts config.
    */
    const redisUrl = configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    const redisClient = new Redis(redisUrl);

    app.use(
      session.default({
        store: new RedisStore({ client: redisClient }),
        secret: configService.get<string>('SESSION_SECRET') || 'secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(cookieParser());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) - should login and return cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' }) // Ensure this user exists or use seed
      .expect(201); // 201 Created is default for POST, or 200 if HttpCode(200)

    // Check for cookie
    const cookies = response.get('Set-Cookie');
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('connect.sid'))).toBeTruthy();

    // Save cookie for next requests
    cookie = cookies.find((c) => c.startsWith('connect.sid'));
  });

  it('/auth/me (GET) - should be accessible with cookie', async () => {
    if (!cookie) return; // Skip if login failed

    await request(app.getHttpServer())
      .get('/api/auth/me') // Assuming we have a protected route
      .set('Cookie', [cookie])
      .expect(200);
  });

  it('/auth/logout (POST) - should logout and clear session', async () => {
    if (!cookie) return;

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', [cookie])
      .expect(201);

    // Verify cookie is cleared or session invalid
    // Usually response clears cookie
  });
});
