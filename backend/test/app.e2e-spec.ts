import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';

describe('Task Management Full Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    firstName: 'E2E',
    lastName: 'Tester',
    email: `e2e.${Date.now()}@example.com`,
    emailConfirmation: `e2e.${Date.now()}@example.com`,
    password: 'Password123!',
    passwordConfirmation: 'Password123!',
  };

  let accessToken = '';
  let createdListId = '';
  let createdTaskId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test user and cascade relations
    if (testUser.email && prisma) {
      await prisma.user
        .deleteMany({ where: { email: testUser.email } })
        .catch(() => {});
    }
    await app.close();
  });

  it('1. should register a new user successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('2. should login with credentials and return double JWT tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    accessToken = response.body.accessToken;
    expect(accessToken).toBeTruthy();
  });

  it('3. should access protected route /api/auth/me with Bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.email).toBe(testUser.email);
  });

  it('4. should create a new task list', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'E2E Testing Roadmap' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('E2E Testing Roadmap');
    createdListId = response.body.id;
  });

  it('5. should create a task in the newly created list', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/lists/${createdListId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        shortDesc: 'Automated E2E Verification',
        longDesc: 'Complete flow from auth to task destruction',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.shortDesc).toBe('Automated E2E Verification');
    expect(response.body.isCompleted).toBe(false);
    createdTaskId = response.body.id;
  });

  it('6. should update task status to completed', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isCompleted: true })
      .expect(200);

    expect(response.body.isCompleted).toBe(true);
  });

  it('7. should delete the created task', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.taskId).toBe(createdTaskId);
  });

  it('8. should delete the list and cascade remove remaining items', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/lists/${createdListId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.listId).toBe(createdListId);
  });
});
