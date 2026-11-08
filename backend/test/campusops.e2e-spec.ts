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

  describe('security', () => {
    it('sends security headers', async () => {
      const response = await request(http).get('/api/health').expect(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    });

    it('rejects a token after logout (server-side session revocation)', async () => {
      const token = await login('staff2@campusops.edu');
      await request(http).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
      await request(http).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
      const response = await request(http).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
      expect(response.body.message).toContain('session has ended');
    });

    it('locks out a deactivated user immediately, even with a valid token', async () => {
      const admin = await login('admin@campusops.edu');
      const staffToken = await login('staff3@campusops.edu');
      const users = await request(http).get('/api/users?search=staff3@campusops.edu').set('Authorization', `Bearer ${admin}`).expect(200);
      const staffId = users.body.content[0].id as string;

      await request(http).patch(`/api/users/${staffId}/status`).set('Authorization', `Bearer ${admin}`).send({ isActive: false }).expect(200);
      await request(http).get('/api/auth/me').set('Authorization', `Bearer ${staffToken}`).expect(401);
      await request(http).patch(`/api/users/${staffId}/status`).set('Authorization', `Bearer ${admin}`).send({ isActive: true }).expect(200);
    });

    it('limits repeated login attempts for the same account', async () => {
      const attempt = () => request(http).post('/api/auth/login').send({ email: 'nobody@campusops.edu', password: 'wrong-password' });
      for (let i = 0; i < 5; i++) {
        await attempt().expect(401);
      }
      const blocked = await attempt().expect(429);
      expect(blocked.body.code).toBe('TOO_MANY_REQUESTS');
      // other accounts from the same address are not affected
      await login('tech2@campusops.edu');
    });
  });

  describe('sign-up', () => {
    const unique = Date.now();
    const valid = {
      accountType: 'STUDENT',
      fullName: 'New Student',
      email: `new.student.${unique}@campusops.edu`,
      universityId: `9${String(unique).slice(-6)}`,
      password: 'Campus#2026x',
      confirmPassword: 'Campus#2026x',
    };

    it('creates a student account and logs the user in immediately', async () => {
      const response = await request(http).post('/api/auth/register').send(valid).expect(201);
      expect(response.body.user.role).toBe('STUDENT');
      await request(http).get('/api/auth/me').set('Authorization', `Bearer ${response.body.accessToken}`).expect(200);
      await request(http).post('/api/auth/login').send({ email: valid.email, password: valid.password }).expect(200);
    });

    it('rejects a duplicate e-mail', async () => {
      const response = await request(http).post('/api/auth/register').send({ ...valid, universityId: '8888888' }).expect(409);
      expect(response.body.code).toBe('EMAIL_TAKEN');
    });

    it('rejects a weak password and lists the broken rules', async () => {
      const response = await request(http)
        .post('/api/auth/register')
        .send({ ...valid, email: `weak.${unique}@campusops.edu`, universityId: '7777771', password: 'password', confirmPassword: 'password' })
        .expect(422);
      expect(response.body.code).toBe('WEAK_PASSWORD');
      expect((response.body.details.problems as string[]).length).toBeGreaterThanOrEqual(3);
    });

    it('rejects passwords that do not match', async () => {
      const response = await request(http).post('/api/auth/register').send({ ...valid, email: `mismatch.${unique}@campusops.edu`, universityId: '7777772', confirmPassword: 'Campus#2026y' }).expect(422);
      expect(response.body.code).toBe('PASSWORD_MISMATCH');
    });

    it('lets a teacher sign up and use his own teacher profile at once', async () => {
      const response = await request(http)
        .post('/api/auth/register')
        .send({ ...valid, accountType: 'TEACHER', email: `teacher.${unique}@campusops.edu`, universityId: undefined, department: 'Mathematics' })
        .expect(201);
      expect(response.body.user.role).toBe('TEACHER');
      const profile = await request(http).get('/api/teachers/me').set('Authorization', `Bearer ${response.body.accessToken}`).expect(200);
      expect(profile.body.department).toBe('Mathematics');
    });

    it('does not allow choosing a privileged role', async () => {
      for (const accountType of ['ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN']) {
        await request(http).post('/api/auth/register').send({ ...valid, email: `${accountType}.${unique}@campusops.edu`, accountType }).expect(400);
      }
    });
  });

  describe('changing a user type', () => {
    it('is reserved to the administrator', async () => {
      const admin = await login('admin@campusops.edu');
      const users = await request(http).get('/api/users?search=staff4@campusops.edu').set('Authorization', `Bearer ${admin}`).expect(200);
      const staffId = users.body.content[0].id as string;

      for (const email of ['manager@campusops.edu', 'teacher@campusops.edu', 'staff4@campusops.edu']) {
        const token = await login(email);
        await request(http).patch(`/api/users/${staffId}`).set('Authorization', `Bearer ${token}`).send({ role: 'ADMIN' }).expect(403);
      }

      const changed = await request(http).patch(`/api/users/${staffId}`).set('Authorization', `Bearer ${admin}`).send({ role: 'TEACHER' }).expect(200);
      expect(changed.body.role).toBe('TEACHER');
      await request(http).patch(`/api/users/${staffId}`).set('Authorization', `Bearer ${admin}`).send({ role: 'STAFF' }).expect(200);
    });
  });

  describe('teachers directory', () => {
    it('lets a teacher toggle his own status, and everyone see it', async () => {
      const teacher = await login('teacher@campusops.edu');
      const asTeacher = { Authorization: `Bearer ${teacher}` };
      const mine = await request(http).get('/api/teachers/me').set(asTeacher).expect(200);
      const next = mine.body.status === 'FREE' ? 'BUSY' : 'FREE';

      await request(http).put('/api/teachers/me/status').set(asTeacher).send({ status: next }).expect(200);

      const student = await login('student@campusops.edu');
      const found = await request(http).get('/api/teachers?search=Qudah').set('Authorization', `Bearer ${student}`).expect(200);
      expect(found.body.content[0].status).toBe(next);
      await request(http).put('/api/teachers/me/status').set(asTeacher).send({ status: mine.body.status }).expect(200);
    });

    it('does not let anyone else change a teacher status (not even an admin)', async () => {
      const student = await login('student@campusops.edu');
      const admin = await login('admin@campusops.edu');
      await request(http).put('/api/teachers/me/status').set('Authorization', `Bearer ${student}`).send({ status: 'BUSY' }).expect(403);
      await request(http).put('/api/teachers/me/status').set('Authorization', `Bearer ${admin}`).send({ status: 'BUSY' }).expect(403);
    });

    it('rejects an overlapping timetable', async () => {
      const teacher = await login('teacher6@campusops.edu');
      const response = await request(http)
        .put('/api/teachers/me/schedule')
        .set('Authorization', `Bearer ${teacher}`)
        .send({
          entries: [
            { type: 'LECTURE', weekday: 'SUNDAY', startTime: '10:00', endTime: '11:30', title: 'A' },
            { type: 'OFFICE_HOUR', weekday: 'SUNDAY', startTime: '11:00', endTime: '12:00', title: 'Office hours' },
          ],
        })
        .expect(422);
      expect(response.body.code).toBe('TIMETABLE_OVERLAP');
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
