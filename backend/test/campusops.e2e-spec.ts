/**
 * End-to-end API tests. They run against the database in DATABASE_URL, which must be
 * migrated and seeded first:  npm run db:seed && npm run test:e2e
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApp } from '../src/bootstrap';
import { DateOnly } from '../src/common/utils/date-only';

describe('CampusOps API (e2e)', () => {
  let app: INestApplication;
  let http: App;
  const today = DateOnly.format(DateOnly.today('Asia/Amman'));

  const login = async (email: string): Promise<string> => {
    const response = await request(http).post('/api/auth/login').send({ email, password: 'Password123!' }).expect(200);
    return response.body.accessToken as string;
  };

  beforeAll(async () => {
    app = await createApp();
    http = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('authentication', () => {
    it('rejects a wrong password', async () => {
      const response = await request(http).post('/api/auth/login').send({ email: 'admin@campusops.edu', password: 'wrong' }).expect(401);
      expect(response.body.code).toBe('AUTHENTICATION_FAILED');
    });

    it('requires a token for protected endpoints', async () => {
      await request(http).get('/api/lockers').expect(401);
    });

    it('forbids students from the lockers administration', async () => {
      const token = await login('student@campusops.edu');
      await request(http).get('/api/lockers').set('Authorization', `Bearer ${token}`).expect(403);
    });
  });

  describe('locker subscriptions', () => {
    it('starts, rejects an overlap, extends and ends a subscription', async () => {
      const manager = await login('manager@campusops.edu');
      const auth = { Authorization: `Bearer ${manager}` };

      const lockers = await request(http).get('/api/lockers?status=AVAILABLE&size=1').set(auth).expect(200);
      const lockerId = lockers.body.content[0].id as string;
      const students = await request(http).get('/api/users?role=STUDENT&isActive=true&size=1').set(auth).expect(200);
      const studentId = students.body.content[0].id as string;

      const started = await request(http).post('/api/locker-subscriptions').set(auth).send({ lockerId, studentId, startDate: today, durationMonths: 2 }).expect(201);
      expect(started.body.state).toBe('ACTIVE');
      expect(started.body.payments).toHaveLength(1);

      const overlap = await request(http).post('/api/locker-subscriptions').set(auth).send({ lockerId, studentId, startDate: today, durationMonths: 1 }).expect(409);
      expect(overlap.body.code).toBe('LOCKER_ALREADY_SUBSCRIBED');

      const extended = await request(http).post(`/api/locker-subscriptions/${started.body.id}/extend`).set(auth).send({ durationMonths: 1 }).expect(200);
      expect(extended.body.payments).toHaveLength(2);

      const ended = await request(http).post(`/api/locker-subscriptions/${started.body.id}/end`).set(auth).send({ reason: 'e2e test' }).expect(200);
      expect(ended.body.status).toBe('ENDED');

      const locker = await request(http).get(`/api/lockers/${lockerId}`).set(auth).expect(200);
      expect(locker.body.locker.status).toBe('AVAILABLE');
    });
  });

  describe('service request lifecycle', () => {
    it('goes from SUBMITTED to VERIFIED through a work order', async () => {
      const student = await login('student@campusops.edu');
      const manager = await login('manager@campusops.edu');
      const technician = await login('tech@campusops.edu');

      const buildings = await request(http).get('/api/buildings').set('Authorization', `Bearer ${student}`).expect(200);
      const buildingId = buildings.body.find((b: { code: string }) => b.code === 'ENG').id as string;

      const created = await request(http)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${student}`)
        .send({ title: 'E2E broken light', description: 'Light is broken in the corridor (e2e).', category: 'ELECTRICAL', severity: 'LOW', urgency: 'LOW', buildingId })
        .expect(201);
      expect(created.body.priority).toBe('P4');

      const techs = await request(http).get(`/api/technicians/suggestions?category=ELECTRICAL&buildingId=${buildingId}`).set('Authorization', `Bearer ${manager}`).expect(200);
      const technicianId = techs.body.find((t: { fullName: string }) => t.fullName === 'Yousef Saleh').userId as string;

      const workOrder = await request(http).post('/api/work-orders').set('Authorization', `Bearer ${manager}`).send({ requestId: created.body.id, technicianId }).expect(201);
      const task = (type: string) => workOrder.body.tasks.find((t: { type: string }) => t.type === type).id as string;
      const asTech = { Authorization: `Bearer ${technician}` };

      await request(http).post(`/api/work-orders/${workOrder.body.id}/tasks/${task('REPAIR')}/start`).set(asTech).expect(422);
      await request(http).post(`/api/work-orders/${workOrder.body.id}/tasks/${task('INSPECTION')}/complete`).set(asTech).send({ notes: 'Checked' }).expect(200);
      const repaired = await request(http).post(`/api/work-orders/${workOrder.body.id}/tasks/${task('REPAIR')}/complete`).set(asTech).send({ notes: 'Replaced the tube' }).expect(200);
      expect(repaired.body.status).toBe('COMPLETED');

      const confirmed = await request(http).post(`/api/service-requests/${created.body.id}/confirm`).set('Authorization', `Bearer ${student}`).send({ rating: 4 }).expect(200);
      expect(confirmed.body.status).toBe('VERIFIED');
      expect(confirmed.body.workOrders[0].status).toBe('VERIFIED');
    });
  });
});
