/* eslint-disable no-console */
/**
 * Demo data for CampusOps (synthetic, fictional people only).
 *
 *   npm run db:seed        (or: npx prisma db seed)
 *
 * The seed wipes the database and recreates a realistic campus: buildings, users of every role,
 * lockers with subscriptions and cash payments, assets, preventive schedules, inventory,
 * and ~40 service requests in every stage of their lifecycle.
 * All dates are relative to "now", so the demo always looks current.
 */
import {
  LockerSize,
  MaterialStatus,
  MovementType,
  PaymentMethod,
  Prisma,
  PrismaClient,
  ProcurementStatus,
  RequestStatus,
  Role,
  SubscriptionStatus,
  TaskStatus,
  TaskType,
  WorkOrderStatus,
  WorkOrderType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DateOnly } from '../../src/common/utils/date-only';
import { SubscriptionPeriod } from '../../src/modules/lockers/domain/subscription-period';
import { quotePrice } from '../../src/modules/lockers/domain/locker-pricing';
import { calculatePriority } from '../../src/modules/sla/domain/priority-matrix';
import { DEFAULT_SLA_POLICIES } from '../../src/modules/sla/domain/default-sla-policies';
import { buildTaskPlan } from '../../src/modules/work-orders/domain/task-plan';
import {
  ASSETS,
  BUILDINGS,
  DEMO_PASSWORD,
  FEEDBACK_COMMENTS,
  INVENTORY,
  LOCKER_BANKS,
  LOCKER_FEES,
  MANAGERS,
  REPAIR_NOTES,
  REQUEST_TEMPLATES,
  ROOMS,
  SCHEDULES,
  STAFF,
  TECHNICIANS,
  studentNames,
} from './catalog';
import { SeededRandom } from './random';

const prisma = new PrismaClient();
const random = new SeededRandom(20261107);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = new Date();
const TODAY = DateOnly.today('Asia/Amman', NOW);

const counters = { SR: 0, WO: 0, RCPT: 0, PR: 0 };
const nextCode = (prefix: keyof typeof counters) => `${prefix}-${String(++counters[prefix]).padStart(6, '0')}`;
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * HOUR);
const minDate = (a: Date, b: Date) => (a < b ? a : b);

type Ids = Record<string, string>;

async function main(): Promise<void> {
  console.log('Resetting database ...');
  await resetDatabase();

  console.log('Seeding SLA policies, buildings and users ...');
  await seedSlaPolicies();
  const buildings = await seedBuildings();
  const rooms = await seedRooms(buildings);
  const users = await seedUsers(buildings);

  console.log('Seeding lockers and subscriptions ...');
  await seedLockers(buildings, users);

  console.log('Seeding assets, schedules and inventory ...');
  const assets = await seedAssets(buildings, rooms);
  await seedSchedules(assets, users);
  const items = await seedInventory(users.admin);

  console.log('Seeding service requests and work orders ...');
  await seedRequestsAndWorkOrders(buildings, rooms, assets, items, users);
  await seedPreventiveHistory(assets, users);
  await seedProcurements(items, users);

  await reconcileOpeningStock();
  await saveSequences();
  await seedWelcomeNotifications(users);
  console.log('Done. Demo accounts use the password:', DEMO_PASSWORD);
}

// ---------------------------------------------------------------------------

async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
}

async function seedSlaPolicies(): Promise<void> {
  for (const [priority, targets] of Object.entries(DEFAULT_SLA_POLICIES)) {
    await prisma.slaPolicy.create({ data: { priority: priority as keyof typeof DEFAULT_SLA_POLICIES, ...targets } });
  }
}

async function seedBuildings(): Promise<Ids> {
  const ids: Ids = {};
  for (const building of BUILDINGS) {
    ids[building.code] = (await prisma.building.create({ data: { ...building } })).id;
  }
  return ids;
}

async function seedRooms(buildings: Ids): Promise<Ids> {
  const ids: Ids = {};
  for (const [building, rooms] of Object.entries(ROOMS)) {
    for (const room of rooms) {
      ids[`${building}/${room.code}`] = (await prisma.room.create({ data: { ...room, buildingId: buildings[building] } })).id;
    }
  }
  return ids;
}

interface SeededUsers {
  admin: string;
  managers: string[];
  technicians: Record<string, { id: string; name: string; skills: string[] }>;
  students: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  demoStudent: string;
}

async function seedUsers(buildings: Ids): Promise<SeededUsers> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const create = (data: Omit<Prisma.UserCreateInput, 'passwordHash'>) => prisma.user.create({ data: { ...data, passwordHash } });

  const admin = await create({ email: 'admin@campusops.edu', fullName: 'System Administrator', role: Role.ADMIN, department: 'IT Services' });
  const managers = [];
  for (const manager of MANAGERS) {
    managers.push((await create({ ...manager, role: Role.FACILITY_MANAGER, department: 'Facilities Management' })).id);
  }

  const technicians: SeededUsers['technicians'] = {};
  for (const [index, tech] of TECHNICIANS.entries()) {
    const user = await create({
      email: tech.email,
      fullName: tech.fullName,
      role: Role.TECHNICIAN,
      phone: `07955000${10 + index}`,
      department: 'Maintenance',
      technicianProfile: {
        create: { skills: tech.skills, homeBuildingId: buildings[tech.home], maxOpenOrders: tech.maxOpenOrders, isAvailable: tech.isAvailable ?? true },
      },
    });
    technicians[tech.email] = { id: user.id, name: tech.fullName, skills: tech.skills };
  }

  const students = [];
  for (const [index, name] of studentNames(30).entries()) {
    const email = index === 0 ? 'student@campusops.edu' : `student${index + 1}@campusops.edu`;
    const user = await create({ email, fullName: name, role: Role.STUDENT, universityId: `022${String(1001 + index).padStart(4, '0')}`, department: random.pick(['Engineering', 'IT', 'Science', 'Medicine']) });
    students.push({ id: user.id, name });
  }
  // one deactivated student, to show account management
  await prisma.user.update({ where: { id: students[29].id }, data: { isActive: false } });

  const staff = [];
  for (const member of STAFF) {
    staff.push({ id: (await create({ ...member, role: Role.STAFF })).id, name: member.fullName });
  }
  return { admin: admin.id, managers, technicians, students, staff, demoStudent: students[0].id };
}

// ------------------------------------------------------------------ lockers

async function seedLockers(buildings: Ids, users: SeededUsers): Promise<void> {
  const sizes: LockerSize[] = [LockerSize.SMALL, LockerSize.MEDIUM, LockerSize.MEDIUM, LockerSize.LARGE];
  const lockers: { id: string; code: string; fee: number }[] = [];
  for (const bank of LOCKER_BANKS) {
    for (let n = 1; n <= bank.count; n++) {
      const size = sizes[n % sizes.length];
      const floor = bank.floors[n % bank.floors.length];
      const zone = bank.zones[Math.floor((n - 1) / Math.ceil(bank.count / bank.zones.length))];
      const code = `${bank.prefix}-${floor}${zone.charAt(0)}-${String(n).padStart(2, '0')}`;
      const locker = await prisma.locker.create({
        data: { code, buildingId: buildings[bank.building], floor, zone, size, monthlyFee: LOCKER_FEES[size] },
      });
      lockers.push({ id: locker.id, code, fee: LOCKER_FEES[size] });
    }
  }

  // Two broken lockers
  await prisma.locker.update({ where: { id: lockers[7].id }, data: { isOutOfService: true, outOfServiceNote: 'Door hinge broken - waiting for spare part' } });
  await prisma.locker.update({ where: { id: lockers[52].id }, data: { isOutOfService: true, outOfServiceNote: 'Lock jammed' } });

  const manager = users.managers[0];
  const students = users.students.slice(0, 29);
  let studentCursor = 1; // student 0 (demo account) gets hand-picked lockers below

  const subscribe = async (lockerIndex: number, studentId: string, start: Date, months: number, status: SubscriptionStatus = SubscriptionStatus.ACTIVE, endReason?: string) => {
    const locker = lockers[lockerIndex];
    const period = SubscriptionPeriod.ofMonths(start, months);
    const price = quotePrice(locker.fee, period);
    const created = new Date(Math.min(start.getTime() + 9 * HOUR, NOW.getTime() - HOUR));
    const subscription = await prisma.lockerSubscription.create({
      data: {
        lockerId: locker.id,
        studentId,
        startDate: period.start,
        endDate: period.end,
        status,
        createdById: manager,
        createdAt: created,
        endedAt: status === SubscriptionStatus.ACTIVE ? null : minDate(DateOnly.addDays(period.end, 1), NOW),
        endedById: status === SubscriptionStatus.ACTIVE ? null : manager,
        endReason: endReason ?? null,
      },
    });
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: price.amount,
        method: PaymentMethod.CASH,
        receiptNumber: nextCode('RCPT'),
        periodStart: period.start,
        periodEnd: period.end,
        receivedById: manager,
        receivedAt: created,
      },
    });
  };
  const startDaysAgo = (days: number) => DateOnly.addDays(TODAY, -days);

  // Demo student: one active locker, one expiring in 3 days, and one finished in the past
  await subscribe(0, users.demoStudent, startDaysAgo(20), 3);
  await subscribe(31, users.demoStudent, DateOnly.addDays(DateOnly.addMonths(startDaysAgo(0), -1), 3), 1);
  await subscribe(2, users.demoStudent, startDaysAgo(150), 2, SubscriptionStatus.ENDED, 'Subscription period finished');

  const plan: { count: number; make: (lockerIndex: number) => Promise<void> }[] = [
    // active subscriptions with various remaining time
    { count: 30, make: (i) => subscribe(i, students[studentCursor++ % students.length].id, startDaysAgo(random.int(1, 50)), random.pick([1, 2, 3, 4])) },
    // expiring within a week
    { count: 6, make: (i) => subscribe(i, students[studentCursor++ % students.length].id, DateOnly.addDays(DateOnly.addMonths(TODAY, -1), random.int(1, 6)), 1) },
    // expired but not released yet
    { count: 3, make: (i) => subscribe(i, students[studentCursor++ % students.length].id, DateOnly.addDays(DateOnly.addMonths(TODAY, -2), -random.int(2, 8)), 2) },
    // reserved (starting in the future)
    { count: 2, make: (i) => subscribe(i, students[studentCursor++ % students.length].id, DateOnly.addDays(TODAY, random.int(3, 12)), 2) },
  ];
  const freeIndexes = random.shuffle(lockers.map((_, i) => i).filter((i) => ![0, 2, 7, 31, 52].includes(i)));
  for (const step of plan) {
    for (let k = 0; k < step.count; k++) {
      await step.make(freeIndexes.pop()!);
    }
  }
  // history: finished / early-ended subscriptions on lockers that are free today
  for (let k = 0; k < 10; k++) {
    const index = freeIndexes[k];
    await subscribe(index, students[(k * 3) % students.length].id, startDaysAgo(random.int(120, 200)), random.pick([1, 2]), SubscriptionStatus.ENDED, random.pick(['Subscription period finished', 'Student graduated', 'Ended early at student request']));
  }
}

// ------------------------------------------------------- assets & schedules

async function seedAssets(buildings: Ids, rooms: Ids): Promise<Ids> {
  const ids: Ids = {};
  for (const asset of ASSETS) {
    const created = await prisma.asset.create({
      data: {
        code: asset.code,
        name: asset.name,
        type: asset.type,
        buildingId: buildings[asset.building],
        roomId: asset.room ? rooms[`${asset.building}/${asset.room}`] : null,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serialNumber: `SN-${asset.code.replace(/-/g, '')}-${random.int(1000, 9999)}`,
        installDate: DateOnly.addMonths(TODAY, -asset.installYearsAgo * 12 - random.int(0, 6)),
        warrantyExpiry: asset.warrantyMonthsFromNow === null ? null : DateOnly.addDays(DateOnly.addMonths(TODAY, asset.warrantyMonthsFromNow), random.int(0, 20)),
      },
    });
    ids[asset.code] = created.id;
  }
  return ids;
}

async function seedSchedules(assets: Ids, users: SeededUsers): Promise<void> {
  for (const schedule of SCHEDULES) {
    await prisma.preventiveSchedule.create({
      data: {
        assetId: assets[schedule.asset],
        title: schedule.title,
        description: 'Follow the manufacturer checklist and record readings in the notes.',
        intervalValue: schedule.every,
        intervalUnit: schedule.unit,
        nextDueDate: DateOnly.addDays(TODAY, schedule.dueInDays),
        leadDays: schedule.leadDays,
        priority: schedule.priority,
        defaultTechnicianId: schedule.technician ? users.technicians[schedule.technician].id : null,
        lastGeneratedAt: hoursAgo(24 * random.int(20, 40)),
      },
    });
  }
}

async function seedInventory(adminId: string): Promise<Ids> {
  const ids: Ids = {};
  for (const item of INVENTORY) {
    const created = await prisma.inventoryItem.create({
      data: { sku: item.sku, name: item.name, category: item.category, unit: item.unit, quantityOnHand: item.onHand, reorderLevel: item.reorder, unitCost: item.cost, storageLocation: item.location },
    });
    ids[item.sku] = created.id;
    if (item.onHand > 0) {
      await prisma.stockMovement.create({ data: { itemId: created.id, type: MovementType.IN, quantity: item.onHand, note: 'Opening stock count', performedBy: adminId, createdAt: hoursAgo(24 * 60) } });
    }
  }
  return ids;
}

// ------------------------------------------------------ requests & work orders

/** Final status of each seeded request (index-aligned with the timeline below). */
const STATUS_PLAN: RequestStatus[] = [
  ...Array<RequestStatus>(6).fill(RequestStatus.SUBMITTED),
  ...Array<RequestStatus>(4).fill(RequestStatus.ACKNOWLEDGED),
  ...Array<RequestStatus>(5).fill(RequestStatus.ASSIGNED),
  ...Array<RequestStatus>(6).fill(RequestStatus.IN_PROGRESS),
  ...Array<RequestStatus>(4).fill(RequestStatus.RESOLVED),
  ...Array<RequestStatus>(13).fill(RequestStatus.VERIFIED),
  ...Array<RequestStatus>(2).fill(RequestStatus.CLOSED),
  ...Array<RequestStatus>(2).fill(RequestStatus.REJECTED),
];

/** How old (in hours) a request in each final status typically is. */
const AGE_HOURS: Record<RequestStatus, [number, number]> = {
  SUBMITTED: [1, 30],
  ACKNOWLEDGED: [5, 60],
  ASSIGNED: [6, 70],
  IN_PROGRESS: [12, 120],
  RESOLVED: [30, 150],
  VERIFIED: [100, 1000],
  CLOSED: [200, 900],
  REJECTED: [48, 700],
};

async function seedRequestsAndWorkOrders(buildings: Ids, rooms: Ids, assets: Ids, items: Ids, users: SeededUsers): Promise<void> {
  const assetRows = await prisma.asset.findMany({ select: { id: true, buildingId: true, roomId: true } });
  const requesters = [...users.students.slice(0, 12).map((s) => s.id), ...users.staff.map((s) => s.id)];
  const managerId = users.managers[0];

  for (const [index, finalStatus] of STATUS_PLAN.entries()) {
    const template = REQUEST_TEMPLATES[index % REQUEST_TEMPLATES.length];
    const asset = template.asset ? assetRows.find((a) => a.id === assets[template.asset!])! : null;
    const buildingId = asset ? asset.buildingId : buildings[template.building!];
    const roomId = asset ? asset.roomId : template.room ? rooms[`${template.building}/${template.room}`] : null;
    // the demo student and demo staff each own a few requests in different stages
    const requesterId = index % 9 === 0 ? users.demoStudent : index % 9 === 4 ? users.staff[0].id : random.pick(requesters);

    const isSafety = template.safety ?? false;
    const priority = calculatePriority(template.severity, template.urgency, isSafety);
    const sla = DEFAULT_SLA_POLICIES[priority];
    const [minAge, maxAge] = AGE_HOURS[finalStatus];
    // make two SUBMITTED requests clearly overdue so escalation can be demonstrated
    const isOpenStatus = ([RequestStatus.SUBMITTED, RequestStatus.ACKNOWLEDGED, RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS] as RequestStatus[]).includes(finalStatus);
    // Open requests are aged relative to their SLA: most are on track, about one in five is overdue.
    const ageHours =
      finalStatus === RequestStatus.SUBMITTED && index < 2
        ? sla.resolutionHours + random.int(5, 20)
        : isOpenStatus
          ? sla.resolutionHours * (random.chance(0.2) ? random.float(1.1, 1.8) : random.float(0.1, 0.85))
          : random.float(minAge, maxAge);
    const createdAt = hoursAgo(ageHours);
    const responseDueAt = new Date(createdAt.getTime() + sla.responseHours * HOUR);
    const resolutionDueAt = new Date(createdAt.getTime() + sla.resolutionHours * HOUR);

    // ---- build the lifecycle timeline (every step strictly before "now") ----
    const steps: { to: RequestStatus; at: Date; by: string; note: string | null }[] = [{ to: RequestStatus.SUBMITTED, at: createdAt, by: requesterId, note: 'Request submitted' }];
    const span = NOW.getTime() - createdAt.getTime();
    const at = (fraction: number) => new Date(createdAt.getTime() + span * fraction);
    const order: RequestStatus[] = [RequestStatus.ACKNOWLEDGED, RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED];
    const targetIndex = order.indexOf(finalStatus);
    const goesThrough = (status: RequestStatus) =>
      targetIndex >= order.indexOf(status) || ([RequestStatus.VERIFIED, RequestStatus.CLOSED] as RequestStatus[]).includes(finalStatus);
    // most finished requests are resolved within their SLA, a few miss it
    const resolvedFraction = Math.min(0.85, ((sla.resolutionHours * (random.chance(0.8) ? random.float(0.3, 0.9) : random.float(1.1, 1.6))) * HOUR) / span);

    const technician = pickTechnician(template.category, users);
    if (finalStatus === RequestStatus.REJECTED) {
      steps.push({ to: RequestStatus.REJECTED, at: at(0.05), by: managerId, note: 'Duplicate of an existing request - already being handled' });
    } else {
      if (goesThrough(RequestStatus.ACKNOWLEDGED)) steps.push({ to: RequestStatus.ACKNOWLEDGED, at: at(Math.min(0.08, resolvedFraction * 0.1)), by: managerId, note: 'Request reviewed' });
      if (goesThrough(RequestStatus.ASSIGNED)) steps.push({ to: RequestStatus.ASSIGNED, at: at(Math.min(0.15, resolvedFraction * 0.2)), by: managerId, note: `Assigned to ${technician.name}` });
      if (goesThrough(RequestStatus.IN_PROGRESS)) steps.push({ to: RequestStatus.IN_PROGRESS, at: at(Math.min(0.3, resolvedFraction * 0.4)), by: technician.id, note: 'Technician started the work' });
      if (goesThrough(RequestStatus.RESOLVED)) steps.push({ to: RequestStatus.RESOLVED, at: at(finalStatus === RequestStatus.RESOLVED ? 0.6 : resolvedFraction), by: technician.id, note: random.pick(REPAIR_NOTES[template.category] ?? ['Repair completed.']) });
      if (finalStatus === RequestStatus.VERIFIED) steps.push({ to: RequestStatus.VERIFIED, at: at(Math.min(0.97, resolvedFraction + 0.08)), by: requesterId, note: 'Confirmed by requester' });
      if (finalStatus === RequestStatus.CLOSED) steps.push({ to: RequestStatus.CLOSED, at: at(Math.min(0.97, resolvedFraction + 0.15)), by: managerId, note: 'No answer from requester for 3 days - closed' });
    }

    const stepAt = (status: RequestStatus) => steps.find((s) => s.to === status)?.at ?? null;
    const resolvedAt = stepAt(RequestStatus.RESOLVED);

    const request = await prisma.serviceRequest.create({
      data: {
        code: nextCode('SR'),
        title: template.title,
        description: template.description,
        category: template.category,
        severity: template.severity,
        urgency: template.urgency,
        priority,
        isSafetyRelated: isSafety,
        status: finalStatus,
        buildingId,
        roomId,
        assetId: asset?.id ?? null,
        preferredContact: random.pick(['IN_APP', 'EMAIL', 'PHONE'] as const),
        contactDetail: random.chance(0.5) ? `07${random.int(70000000, 99999999)}` : null,
        requesterId,
        createdAt,
        responseDueAt,
        resolutionDueAt,
        acknowledgedAt: stepAt(RequestStatus.ACKNOWLEDGED) ?? stepAt(RequestStatus.ASSIGNED),
        resolvedAt,
        closedAt: stepAt(RequestStatus.VERIFIED) ?? stepAt(RequestStatus.CLOSED) ?? stepAt(RequestStatus.REJECTED),
        rejectionReason: finalStatus === RequestStatus.REJECTED ? steps[steps.length - 1].note : null,
        escalatedAt: isOpenStatus && resolutionDueAt < NOW ? new Date(resolutionDueAt.getTime() + 2 * HOUR) : null,
        updatedAt: steps[steps.length - 1].at,
      },
    });
    let previous: RequestStatus | null = null;
    for (const step of steps) {
      await prisma.requestStatusHistory.create({ data: { requestId: request.id, fromStatus: previous, toStatus: step.to, note: step.note, changedById: step.by, changedAt: step.at } });
      previous = step.to;
    }
    if (finalStatus === RequestStatus.VERIFIED) {
      await prisma.requestFeedback.create({
        data: { requestId: request.id, rating: random.pick([5, 5, 4, 4, 4, 3, 5, 2]), comment: random.pick(FEEDBACK_COMMENTS), submittedBy: requesterId, createdAt: stepAt(RequestStatus.VERIFIED)! },
      });
    }

    // ---- work order (for every request that reached the "assigned" stage) ----
    if (!stepAt(RequestStatus.ASSIGNED)) continue;
    const workOrderStatus: WorkOrderStatus =
      finalStatus === RequestStatus.ASSIGNED
        ? WorkOrderStatus.OPEN
        : finalStatus === RequestStatus.IN_PROGRESS
          ? WorkOrderStatus.IN_PROGRESS
          : finalStatus === RequestStatus.RESOLVED
            ? WorkOrderStatus.COMPLETED
            : WorkOrderStatus.VERIFIED;
    const needsApproval = index % 3 === 0;
    const repairNotes = steps.find((s) => s.to === RequestStatus.RESOLVED)?.note ?? null;

    const workOrder = await prisma.workOrder.create({
      data: {
        code: nextCode('WO'),
        type: WorkOrderType.CORRECTIVE,
        title: template.title,
        description: template.description,
        priority,
        status: workOrderStatus,
        requestId: request.id,
        assetId: asset?.id ?? null,
        technicianId: technician.id,
        createdById: managerId,
        dueAt: resolutionDueAt,
        createdAt: stepAt(RequestStatus.ASSIGNED)!,
        startedAt: stepAt(RequestStatus.IN_PROGRESS),
        completedAt: resolvedAt,
        verifiedAt: stepAt(RequestStatus.VERIFIED) ?? stepAt(RequestStatus.CLOSED),
        repairNotes,
      },
    });
    const inProgressStage = finalStatus === RequestStatus.IN_PROGRESS ? random.int(0, 2) : -1;
    await createTasks(workOrder.id, needsApproval, true, (type) => {
      switch (workOrderStatus) {
        case WorkOrderStatus.OPEN:
          return TaskStatus.PENDING;
        case WorkOrderStatus.IN_PROGRESS:
          if (type === TaskType.INSPECTION) return inProgressStage === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
          if (type === TaskType.MATERIAL_APPROVAL) return inProgressStage >= 1 ? TaskStatus.DONE : TaskStatus.PENDING;
          if (type === TaskType.REPAIR) return inProgressStage === 2 ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING;
          return TaskStatus.PENDING;
        case WorkOrderStatus.COMPLETED:
          return type === TaskType.REQUESTER_CONFIRMATION ? TaskStatus.PENDING : TaskStatus.DONE;
        default:
          return type === TaskType.REQUESTER_CONFIRMATION && finalStatus === RequestStatus.CLOSED ? TaskStatus.SKIPPED : TaskStatus.DONE;
      }
    }, technician.id, repairNotes, resolvedAt ?? stepAt(RequestStatus.IN_PROGRESS) ?? NOW, WorkOrderType.CORRECTIVE, managerId);

    if (asset && workOrderStatus === WorkOrderStatus.IN_PROGRESS) {
      await prisma.asset.update({ where: { id: asset.id }, data: { status: 'UNDER_MAINTENANCE' } });
    }

    // ---- spare parts ----
    const part = partFor(template.category);
    if (part && workOrderStatus !== WorkOrderStatus.OPEN) {
      const consumed = workOrderStatus !== WorkOrderStatus.IN_PROGRESS;
      await prisma.materialRequirement.create({ data: { workOrderId: workOrder.id, itemId: items[part], quantity: 1, status: consumed ? MaterialStatus.CONSUMED : MaterialStatus.RESERVED, createdAt: workOrder.createdAt } });
      if (consumed) {
        await prisma.stockMovement.create({ data: { itemId: items[part], type: MovementType.OUT, quantity: -1, note: `Used for ${workOrder.code}`, workOrderId: workOrder.id, performedBy: technician.id, createdAt: resolvedAt ?? NOW } });
      }
    }
  }

  // A work order blocked by a missing part (elevator door sensor is out of stock)
  const notRepairing = { status: WorkOrderStatus.IN_PROGRESS, tasks: { some: { type: TaskType.REPAIR, status: TaskStatus.PENDING } } };
  const blocked =
    (await prisma.workOrder.findFirst({ where: { ...notRepairing, asset: { type: 'ELEVATOR' } } })) ?? (await prisma.workOrder.findFirst({ where: notRepairing }));
  if (blocked) {
    await prisma.materialRequirement.create({ data: { workOrderId: blocked.id, itemId: items['EV-DOORSEN'], quantity: 1, status: MaterialStatus.SHORTAGE } });
    await prisma.procurementRequest.create({
      data: {
        code: nextCode('PR'),
        itemId: items['EV-DOORSEN'],
        quantity: 2,
        reason: `Shortage for ${blocked.code}: 1 pcs needed, 0 available`,
        workOrderId: blocked.id,
        requestedById: blocked.technicianId ?? users.admin,
        status: ProcurementStatus.PENDING_APPROVAL,
        createdAt: hoursAgo(20),
      },
    });
  }
}

async function createTasks(
  workOrderId: string,
  requiresMaterialApproval: boolean,
  hasRequester: boolean,
  statusOf: (type: TaskType) => TaskStatus,
  technicianId: string,
  repairNotes: string | null,
  completedAt: Date,
  type: WorkOrderType = WorkOrderType.CORRECTIVE,
  approverId: string = technicianId,
): Promise<void> {
  const plan = buildTaskPlan({ type, requiresMaterialApproval, hasRequester });
  const ids = new Map<number, string>();
  for (const blueprint of plan) {
    const status = statusOf(blueprint.type);
    const finished = status === TaskStatus.DONE || status === TaskStatus.SKIPPED;
    const task = await prisma.workOrderTask.create({
      data: {
        workOrderId,
        sequence: blueprint.sequence,
        type: blueprint.type,
        title: blueprint.title,
        status,
        notes: finished && (blueprint.type === TaskType.REPAIR || blueprint.type === TaskType.PREVENTIVE_CHECK) ? repairNotes : finished && blueprint.type === TaskType.MATERIAL_APPROVAL ? 'Approved' : null,
        completedAt: finished ? completedAt : null,
        completedById: finished ? (blueprint.type === TaskType.MATERIAL_APPROVAL ? approverId : technicianId) : null,
      },
    });
    ids.set(blueprint.sequence, task.id);
  }
  for (const blueprint of plan.filter((b) => b.dependsOn.length > 0)) {
    await prisma.workOrderTask.update({ where: { id: ids.get(blueprint.sequence)! }, data: { dependsOn: { connect: blueprint.dependsOn.map((s) => ({ id: ids.get(s)! })) } } });
  }
}

/** Past preventive work (maintenance history) + one open and one awaiting verification. */
async function seedPreventiveHistory(assets: Ids, users: SeededUsers): Promise<void> {
  const schedules = await prisma.preventiveSchedule.findMany({ include: { asset: true } });
  for (const schedule of schedules) {
    for (let cycle = 1; cycle <= 2; cycle++) {
      const doneAt = hoursAgo(24 * (30 * cycle + random.int(0, 10)));
      const technicianId = schedule.defaultTechnicianId ?? users.technicians['tech4@campusops.edu'].id;
      const notes = 'Checklist completed. All readings within the normal range.';
      const workOrder = await prisma.workOrder.create({
        data: {
          code: nextCode('WO'),
          type: WorkOrderType.PREVENTIVE,
          title: `${schedule.title} - ${schedule.asset.code}`,
          priority: schedule.priority,
          status: WorkOrderStatus.VERIFIED,
          assetId: schedule.assetId,
          scheduleId: schedule.id,
          technicianId,
          dueAt: new Date(doneAt.getTime() + 2 * DAY),
          createdAt: new Date(doneAt.getTime() - 5 * DAY),
          startedAt: new Date(doneAt.getTime() - 3 * HOUR),
          completedAt: doneAt,
          verifiedAt: new Date(doneAt.getTime() + 20 * HOUR),
          repairNotes: notes,
        },
      });
      await createTasks(workOrder.id, false, false, () => TaskStatus.DONE, technicianId, notes, doneAt, WorkOrderType.PREVENTIVE);
    }
  }

  // An open preventive job (already generated for the network switch schedule)
  const network = schedules.find((s) => s.asset.code === 'NET-ITC-SW1')!;
  const open = await prisma.workOrder.create({
    data: {
      code: nextCode('WO'),
      type: WorkOrderType.PREVENTIVE,
      title: `${network.title} - ${network.asset.code}`,
      priority: network.priority,
      status: WorkOrderStatus.OPEN,
      assetId: network.assetId,
      scheduleId: network.id,
      technicianId: network.defaultTechnicianId,
      dueAt: new Date(DateOnly.addDays(network.nextDueDate, 1).getTime() - 1),
      createdAt: hoursAgo(10),
    },
  });
  await createTasks(open.id, false, false, () => TaskStatus.PENDING, network.defaultTechnicianId!, null, NOW, WorkOrderType.PREVENTIVE);

  // A standalone corrective job on an asset, completed and waiting for the manager's verification
  const generator = assets['GEN-ENG-01'];
  const technicianId = users.technicians['tech@campusops.edu'].id;
  const notes = 'Replaced the starter battery and cleaned the terminals. Load test passed.';
  const awaiting = await prisma.workOrder.create({
    data: {
      code: nextCode('WO'),
      type: WorkOrderType.CORRECTIVE,
      title: 'Generator failed to auto-start during monthly test',
      priority: 'P2',
      status: WorkOrderStatus.COMPLETED,
      assetId: generator,
      technicianId,
      createdById: users.managers[1],
      dueAt: hoursAgo(-20),
      createdAt: hoursAgo(30),
      startedAt: hoursAgo(26),
      completedAt: hoursAgo(4),
      repairNotes: notes,
    },
  });
  await createTasks(awaiting.id, false, false, () => TaskStatus.DONE, technicianId, notes, hoursAgo(4));
}

async function seedProcurements(items: Ids, users: SeededUsers): Promise<void> {
  const manager = users.managers[0];
  await prisma.procurementRequest.create({
    data: { code: nextCode('PR'), itemId: items['PL-CART'], quantity: 10, reason: 'Stock below reorder level', requestedById: users.technicians['tech2@campusops.edu'].id, status: ProcurementStatus.PENDING_APPROVAL, createdAt: hoursAgo(30) },
  });
  await prisma.procurementRequest.create({
    data: { code: nextCode('PR'), itemId: items['IT-PRJ-LAMP'], quantity: 3, reason: 'Projector lamps are failing frequently this semester', requestedById: users.technicians['tech5@campusops.edu'].id, status: ProcurementStatus.APPROVED, decidedById: manager, decidedAt: hoursAgo(50), decisionNote: 'Approved - order from the usual supplier', createdAt: hoursAgo(72) },
  });
  const received = await prisma.procurementRequest.create({
    data: { code: nextCode('PR'), itemId: items['HV-FILT-24'], quantity: 12, reason: 'Quarterly HVAC maintenance', requestedById: users.technicians['tech3@campusops.edu'].id, status: ProcurementStatus.RECEIVED, decidedById: manager, decidedAt: hoursAgo(24 * 12), receivedAt: hoursAgo(24 * 8), createdAt: hoursAgo(24 * 14) },
  });
  await prisma.stockMovement.create({ data: { itemId: items['HV-FILT-24'], type: MovementType.IN, quantity: 12, note: `Received ${received.code}`, performedBy: manager, createdAt: hoursAgo(24 * 8) } });
  await prisma.procurementRequest.create({
    data: { code: nextCode('PR'), itemId: items['FN-CASTER'], quantity: 20, reason: 'Replace all chair casters in Lab 2', requestedById: users.technicians['tech6@campusops.edu'].id, status: ProcurementStatus.REJECTED, decidedById: manager, decidedAt: hoursAgo(24 * 5), decisionNote: 'Current stock is sufficient', createdAt: hoursAgo(24 * 6) },
  });
}

async function seedWelcomeNotifications(users: SeededUsers): Promise<void> {
  const all = [users.admin, ...users.managers, ...Object.values(users.technicians).map((t) => t.id), users.demoStudent, users.staff[0].id];
  await prisma.notification.createMany({
    data: all.map((userId) => ({ userId, title: 'Welcome to CampusOps', message: 'This is a demo environment with fictional data.', createdAt: hoursAgo(48) })),
  });
}

/** Makes each item's movement ledger add up exactly to its quantity on hand. */
async function reconcileOpeningStock(): Promise<void> {
  for (const item of await prisma.inventoryItem.findMany({ include: { movements: { orderBy: { createdAt: 'asc' } } } })) {
    const [opening, ...rest] = item.movements;
    const others = rest.reduce((sum, m) => sum + m.quantity, 0);
    const openingQuantity = item.quantityOnHand - others;
    if (opening && opening.note === 'Opening stock count') {
      await prisma.stockMovement.update({ where: { id: opening.id }, data: { quantity: openingQuantity } });
    } else if (openingQuantity !== 0) {
      await prisma.stockMovement.create({ data: { itemId: item.id, type: MovementType.ADJUSTMENT, quantity: openingQuantity, note: 'Opening stock count', performedBy: (await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } })).id, createdAt: hoursAgo(24 * 61) } });
    }
  }
}

async function saveSequences(): Promise<void> {
  for (const [name, value] of Object.entries(counters)) {
    await prisma.sequence.create({ data: { name, value } });
  }
}

// ------------------------------------------------------------------ helpers

function pickTechnician(category: string, users: SeededUsers): { id: string; name: string } {
  const skilled = Object.values(users.technicians).filter((t) => t.skills.includes(category));
  const pool = skilled.length > 0 ? skilled : Object.values(users.technicians);
  return random.pick(pool);
}

function partFor(category: string): string | null {
  const parts: Record<string, string> = {
    ELECTRICAL: 'EL-CB-16A',
    PLUMBING: 'PL-VALVE-12',
    HVAC: 'HV-FILT-24',
    IT_NETWORK: 'IT-RJ45',
    FURNITURE: 'FN-HINGE',
    ELEVATOR: 'EV-BTN',
  };
  return parts[category] ?? null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
