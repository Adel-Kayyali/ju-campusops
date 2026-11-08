import { AssetType, IntervalUnit, LockerSize, Priority, RequestCategory, RoomType, Severity, Urgency } from '@prisma/client';

/**
 * Static demo catalogue. ALL PEOPLE ARE FICTIONAL (synthetic data).
 * No real student or staff data is used.
 */

export const DEMO_PASSWORD = 'Password123!';

export const BUILDINGS = [
  { code: 'ENG', name: 'Faculty of Engineering', floors: 5 },
  { code: 'ITC', name: 'School of Information Technology', floors: 4 },
  { code: 'SCI', name: 'Faculty of Science', floors: 4 },
  { code: 'LIB', name: 'Main Library', floors: 3 },
  { code: 'MED', name: 'Faculty of Medicine', floors: 5 },
  { code: 'ADM', name: 'Administration Building', floors: 3 },
] as const;

export const ROOMS: Record<string, { code: string; name: string; floor: number; type: RoomType }[]> = {
  ENG: [
    { code: 'G01', name: 'Main Lecture Hall', floor: 0, type: RoomType.LECTURE_HALL },
    { code: '101', name: 'Electrical Circuits Lab', floor: 1, type: RoomType.LAB },
    { code: '104', name: 'Classroom 104', floor: 1, type: RoomType.CLASSROOM },
    { code: '210', name: 'Mechanics Lab', floor: 2, type: RoomType.LAB },
    { code: '215', name: 'Classroom 215', floor: 2, type: RoomType.CLASSROOM },
    { code: 'R1', name: 'Ground Floor Restrooms', floor: 0, type: RoomType.RESTROOM },
  ],
  ITC: [
    { code: 'L1', name: 'Computer Lab 1', floor: 1, type: RoomType.LAB },
    { code: 'L2', name: 'Computer Lab 2', floor: 1, type: RoomType.LAB },
    { code: '201', name: 'Classroom 201', floor: 2, type: RoomType.CLASSROOM },
    { code: '305', name: 'Faculty Offices Wing', floor: 3, type: RoomType.OFFICE },
    { code: 'SRV', name: 'Server Room', floor: 0, type: RoomType.STORAGE },
  ],
  SCI: [
    { code: 'CH1', name: 'Chemistry Lab', floor: 1, type: RoomType.LAB },
    { code: 'BIO', name: 'Biology Lab', floor: 2, type: RoomType.LAB },
    { code: 'A10', name: 'Auditorium A10', floor: 0, type: RoomType.LECTURE_HALL },
    { code: '120', name: 'Classroom 120', floor: 1, type: RoomType.CLASSROOM },
  ],
  LIB: [
    { code: 'RR1', name: 'Reading Room 1', floor: 1, type: RoomType.OTHER },
    { code: 'RR2', name: 'Reading Room 2', floor: 2, type: RoomType.OTHER },
    { code: 'G00', name: 'Entrance Hall', floor: 0, type: RoomType.CORRIDOR },
  ],
  MED: [
    { code: 'AN1', name: 'Anatomy Lab', floor: 1, type: RoomType.LAB },
    { code: 'H01', name: 'Medical Lecture Hall', floor: 0, type: RoomType.LECTURE_HALL },
    { code: '330', name: 'Simulation Center', floor: 3, type: RoomType.LAB },
  ],
  ADM: [
    { code: '100', name: 'Registration Office', floor: 1, type: RoomType.OFFICE },
    { code: '200', name: 'Finance Office', floor: 2, type: RoomType.OFFICE },
  ],
};

export const MANAGERS = [
  { email: 'manager@campusops.edu', fullName: 'Lina Haddad', phone: '0790000101' },
  { email: 'manager2@campusops.edu', fullName: 'Omar Khalil', phone: '0790000102' },
];

export const TECHNICIANS: { email: string; fullName: string; skills: RequestCategory[]; home: string; maxOpenOrders: number; isAvailable?: boolean }[] = [
  { email: 'tech@campusops.edu', fullName: 'Yousef Saleh', skills: [RequestCategory.ELECTRICAL, RequestCategory.IT_NETWORK], home: 'ENG', maxOpenOrders: 6 },
  { email: 'tech2@campusops.edu', fullName: 'Hasan Odeh', skills: [RequestCategory.PLUMBING, RequestCategory.CLEANING], home: 'SCI', maxOpenOrders: 5 },
  { email: 'tech3@campusops.edu', fullName: 'Khaled Mansour', skills: [RequestCategory.HVAC, RequestCategory.ELECTRICAL], home: 'MED', maxOpenOrders: 5 },
  { email: 'tech4@campusops.edu', fullName: 'Rami Qasem', skills: [RequestCategory.ELEVATOR, RequestCategory.SAFETY], home: 'ITC', maxOpenOrders: 4 },
  { email: 'tech5@campusops.edu', fullName: 'Majd Shami', skills: [RequestCategory.IT_NETWORK], home: 'ITC', maxOpenOrders: 6 },
  { email: 'tech6@campusops.edu', fullName: 'Tareq Hamdan', skills: [RequestCategory.FURNITURE, RequestCategory.STRUCTURAL, RequestCategory.OTHER], home: 'LIB', maxOpenOrders: 5, isAvailable: false },
];

const FIRST_NAMES = ['Sara', 'Ahmad', 'Noor', 'Mohammad', 'Leen', 'Zaid', 'Rand', 'Hamza', 'Dana', 'Faris', 'Tala', 'Kareem', 'Jana', 'Ali', 'Rawan', 'Bashar', 'Haya', 'Yazan', 'Maya', 'Laith', 'Aya', 'Mahmoud', 'Lana', 'Osama', 'Salma', 'Anas', 'Rahaf', 'Saif', 'Dima', 'Qais'];
const LAST_NAMES = ['Nasser', 'Abbadi', 'Haddad', 'Zoubi', 'Khatib', 'Masri', 'Jaber', 'Shehadeh', 'Tamimi', 'Rousan', 'Awad', 'Hijazi', 'Saleh', 'Barakat', 'Daoud'];

export function studentNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`);
}

export const STAFF = [
  { email: 'staff@campusops.edu', fullName: 'Reem Abu Ghazaleh', department: 'Registration Office' },
  { email: 'staff2@campusops.edu', fullName: 'Nabil Farouk', department: 'Department of Computer Science' },
  { email: 'staff3@campusops.edu', fullName: 'Huda Salem', department: 'Main Library' },
  { email: 'staff4@campusops.edu', fullName: 'Ibrahim Taha', department: 'Faculty of Medicine' },
  { email: 'staff5@campusops.edu', fullName: 'Samar Yaseen', department: 'Chemistry Department' },
  { email: 'staff6@campusops.edu', fullName: 'Walid Azzam', department: 'Finance Office' },
];

export const LOCKER_BANKS: { building: string; prefix: string; count: number; floors: number[]; zones: string[] }[] = [
  { building: 'ENG', prefix: 'ENG', count: 30, floors: [0, 1, 2], zones: ['A', 'B'] },
  { building: 'ITC', prefix: 'ITC', count: 20, floors: [0, 1], zones: ['A', 'B'] },
  { building: 'SCI', prefix: 'SCI', count: 20, floors: [0, 1], zones: ['North', 'South'] },
  { building: 'LIB', prefix: 'LIB', count: 15, floors: [0], zones: ['Entrance'] },
];

export const LOCKER_FEES: Record<LockerSize, number> = { SMALL: 5, MEDIUM: 7.5, LARGE: 10 };

export const ASSETS: { code: string; name: string; type: AssetType; building: string; room?: string; manufacturer: string; model: string; installYearsAgo: number; warrantyMonthsFromNow: number | null }[] = [
  { code: 'ELV-ENG-01', name: 'Main Elevator (Engineering)', type: AssetType.ELEVATOR, building: 'ENG', manufacturer: 'Otis', model: 'Gen2 Comfort', installYearsAgo: 8, warrantyMonthsFromNow: -36 },
  { code: 'ELV-ITC-01', name: 'IT School Elevator', type: AssetType.ELEVATOR, building: 'ITC', manufacturer: 'KONE', model: 'MonoSpace 500', installYearsAgo: 3, warrantyMonthsFromNow: 1 },
  { code: 'ELV-MED-01', name: 'Medicine Elevator A', type: AssetType.ELEVATOR, building: 'MED', manufacturer: 'Schindler', model: '3300', installYearsAgo: 5, warrantyMonthsFromNow: -6 },
  { code: 'ELV-LIB-01', name: 'Library Elevator', type: AssetType.ELEVATOR, building: 'LIB', manufacturer: 'Otis', model: 'Gen2 Life', installYearsAgo: 2, warrantyMonthsFromNow: 14 },
  { code: 'HVAC-ENG-01', name: 'Rooftop Air Handling Unit', type: AssetType.HVAC_UNIT, building: 'ENG', manufacturer: 'Carrier', model: '39HQ', installYearsAgo: 6, warrantyMonthsFromNow: -12 },
  { code: 'HVAC-ITC-L1', name: 'Computer Lab 1 Split AC', type: AssetType.HVAC_UNIT, building: 'ITC', room: 'L1', manufacturer: 'LG', model: 'Dual Inverter', installYearsAgo: 2, warrantyMonthsFromNow: 10 },
  { code: 'HVAC-MED-01', name: 'Simulation Center Chiller', type: AssetType.HVAC_UNIT, building: 'MED', room: '330', manufacturer: 'Trane', model: 'CGAM', installYearsAgo: 4, warrantyMonthsFromNow: 2 },
  { code: 'HVAC-LIB-01', name: 'Library Central AC', type: AssetType.HVAC_UNIT, building: 'LIB', manufacturer: 'Daikin', model: 'VRV IV', installYearsAgo: 7, warrantyMonthsFromNow: null },
  { code: 'GEN-ENG-01', name: 'Backup Diesel Generator', type: AssetType.GENERATOR, building: 'ENG', manufacturer: 'Caterpillar', model: 'C15', installYearsAgo: 10, warrantyMonthsFromNow: -60 },
  { code: 'GEN-MED-01', name: 'Medicine Backup Generator', type: AssetType.GENERATOR, building: 'MED', manufacturer: 'Cummins', model: 'C550', installYearsAgo: 4, warrantyMonthsFromNow: 8 },
  { code: 'PRJ-ENG-G01', name: 'Lecture Hall Projector', type: AssetType.PROJECTOR, building: 'ENG', room: 'G01', manufacturer: 'Epson', model: 'EB-L630U', installYearsAgo: 2, warrantyMonthsFromNow: 1 },
  { code: 'PRJ-SCI-A10', name: 'Auditorium Projector', type: AssetType.PROJECTOR, building: 'SCI', room: 'A10', manufacturer: 'BenQ', model: 'LU935', installYearsAgo: 3, warrantyMonthsFromNow: -2 },
  { code: 'PRJ-MED-H01', name: 'Medical Hall Projector', type: AssetType.PROJECTOR, building: 'MED', room: 'H01', manufacturer: 'Sony', model: 'VPL-PHZ61', installYearsAgo: 1, warrantyMonthsFromNow: 22 },
  { code: 'LAB-SCI-FH1', name: 'Fume Hood #1', type: AssetType.LAB_EQUIPMENT, building: 'SCI', room: 'CH1', manufacturer: 'Labconco', model: 'Protector XStream', installYearsAgo: 6, warrantyMonthsFromNow: null },
  { code: 'LAB-SCI-CEN', name: 'Refrigerated Centrifuge', type: AssetType.LAB_EQUIPMENT, building: 'SCI', room: 'BIO', manufacturer: 'Eppendorf', model: '5810 R', installYearsAgo: 3, warrantyMonthsFromNow: 5 },
  { code: 'LAB-ENG-OSC', name: 'Oscilloscope Bench (x10)', type: AssetType.LAB_EQUIPMENT, building: 'ENG', room: '101', manufacturer: 'Keysight', model: 'DSOX1204G', installYearsAgo: 2, warrantyMonthsFromNow: 12 },
  { code: 'LAB-MED-SIM', name: 'Patient Simulator Manikin', type: AssetType.LAB_EQUIPMENT, building: 'MED', room: '330', manufacturer: 'Laerdal', model: 'SimMan 3G', installYearsAgo: 2, warrantyMonthsFromNow: 6 },
  { code: 'FIRE-ENG-01', name: 'Fire Alarm Control Panel', type: AssetType.FIRE_SAFETY, building: 'ENG', manufacturer: 'Honeywell', model: 'Notifier NFS2', installYearsAgo: 9, warrantyMonthsFromNow: null },
  { code: 'FIRE-LIB-01', name: 'Library Sprinkler System', type: AssetType.FIRE_SAFETY, building: 'LIB', manufacturer: 'Viking', model: 'VK-200', installYearsAgo: 7, warrantyMonthsFromNow: null },
  { code: 'NET-ITC-SW1', name: 'Core Network Switch', type: AssetType.NETWORK_DEVICE, building: 'ITC', room: 'SRV', manufacturer: 'Cisco', model: 'Catalyst 9300', installYearsAgo: 3, warrantyMonthsFromNow: 15 },
  { code: 'NET-LIB-AP', name: 'Library Wi-Fi Access Points', type: AssetType.NETWORK_DEVICE, building: 'LIB', manufacturer: 'Aruba', model: 'AP-515', installYearsAgo: 2, warrantyMonthsFromNow: 9 },
  { code: 'PLB-ENG-WH', name: 'Water Heater (Engineering)', type: AssetType.PLUMBING_FIXTURE, building: 'ENG', room: 'R1', manufacturer: 'Ariston', model: 'Pro1 Eco', installYearsAgo: 5, warrantyMonthsFromNow: -24 },
  { code: 'PLB-SCI-DI', name: 'Deionized Water System', type: AssetType.PLUMBING_FIXTURE, building: 'SCI', room: 'CH1', manufacturer: 'Millipore', model: 'Elix 10', installYearsAgo: 4, warrantyMonthsFromNow: 1 },
];

export const SCHEDULES: { asset: string; title: string; every: number; unit: IntervalUnit; dueInDays: number; leadDays: number; priority: Priority; technician?: string }[] = [
  { asset: 'ELV-ENG-01', title: 'Monthly elevator safety inspection', every: 1, unit: IntervalUnit.MONTHS, dueInDays: 4, leadDays: 7, priority: Priority.P2, technician: 'tech4@campusops.edu' },
  { asset: 'ELV-ITC-01', title: 'Monthly elevator safety inspection', every: 1, unit: IntervalUnit.MONTHS, dueInDays: 12, leadDays: 7, priority: Priority.P2, technician: 'tech4@campusops.edu' },
  { asset: 'ELV-MED-01', title: 'Monthly elevator safety inspection', every: 1, unit: IntervalUnit.MONTHS, dueInDays: 2, leadDays: 7, priority: Priority.P2 },
  { asset: 'ELV-LIB-01', title: 'Monthly elevator safety inspection', every: 1, unit: IntervalUnit.MONTHS, dueInDays: 20, leadDays: 7, priority: Priority.P2, technician: 'tech4@campusops.edu' },
  { asset: 'HVAC-ENG-01', title: 'Quarterly filter replacement & coil cleaning', every: 3, unit: IntervalUnit.MONTHS, dueInDays: 6, leadDays: 10, priority: Priority.P3, technician: 'tech3@campusops.edu' },
  { asset: 'HVAC-MED-01', title: 'Quarterly chiller service', every: 3, unit: IntervalUnit.MONTHS, dueInDays: 30, leadDays: 10, priority: Priority.P3, technician: 'tech3@campusops.edu' },
  { asset: 'GEN-ENG-01', title: 'Generator load test', every: 1, unit: IntervalUnit.MONTHS, dueInDays: 9, leadDays: 5, priority: Priority.P2, technician: 'tech@campusops.edu' },
  { asset: 'FIRE-ENG-01', title: 'Semi-annual fire alarm test', every: 6, unit: IntervalUnit.MONTHS, dueInDays: 45, leadDays: 14, priority: Priority.P1 },
  { asset: 'FIRE-LIB-01', title: 'Annual sprinkler inspection', every: 12, unit: IntervalUnit.MONTHS, dueInDays: 75, leadDays: 14, priority: Priority.P2 },
  { asset: 'LAB-SCI-FH1', title: 'Fume hood airflow certification', every: 6, unit: IntervalUnit.MONTHS, dueInDays: 25, leadDays: 14, priority: Priority.P3, technician: 'tech3@campusops.edu' },
  { asset: 'NET-ITC-SW1', title: 'Firmware update & port audit', every: 2, unit: IntervalUnit.WEEKS, dueInDays: 3, leadDays: 2, priority: Priority.P4, technician: 'tech5@campusops.edu' },
];

export const INVENTORY: { sku: string; name: string; category: string; unit: string; onHand: number; reorder: number; cost: number; location: string }[] = [
  { sku: 'EL-LED-T8', name: 'LED tube T8 18W', category: 'Electrical', unit: 'pcs', onHand: 64, reorder: 20, cost: 3.5, location: 'Store A - Shelf 1' },
  { sku: 'EL-CB-16A', name: 'Circuit breaker 16A', category: 'Electrical', unit: 'pcs', onHand: 9, reorder: 10, cost: 6, location: 'Store A - Shelf 2' },
  { sku: 'EL-SOCKET', name: 'Wall socket (double)', category: 'Electrical', unit: 'pcs', onHand: 25, reorder: 8, cost: 4.25, location: 'Store A - Shelf 2' },
  { sku: 'EL-FUSE-10', name: 'Fuse 10A (box of 10)', category: 'Electrical', unit: 'box', onHand: 12, reorder: 4, cost: 2.5, location: 'Store A - Shelf 3' },
  { sku: 'PL-VALVE-12', name: 'Ball valve 1/2"', category: 'Plumbing', unit: 'pcs', onHand: 14, reorder: 5, cost: 7.8, location: 'Store B - Shelf 1' },
  { sku: 'PL-CART', name: 'Faucet cartridge', category: 'Plumbing', unit: 'pcs', onHand: 3, reorder: 6, cost: 9.5, location: 'Store B - Shelf 1' },
  { sku: 'PL-FLUSH', name: 'Toilet flush valve kit', category: 'Plumbing', unit: 'pcs', onHand: 7, reorder: 4, cost: 12, location: 'Store B - Shelf 2' },
  { sku: 'PL-PVC-50', name: 'PVC pipe 50mm (3m)', category: 'Plumbing', unit: 'pcs', onHand: 18, reorder: 6, cost: 5.4, location: 'Store B - Rack' },
  { sku: 'HV-FILT-24', name: 'HVAC filter 24x24"', category: 'HVAC', unit: 'pcs', onHand: 22, reorder: 12, cost: 8, location: 'Store C - Shelf 1' },
  { sku: 'HV-R410A', name: 'Refrigerant R410A (11kg)', category: 'HVAC', unit: 'cyl', onHand: 2, reorder: 2, cost: 95, location: 'Store C - Cage' },
  { sku: 'HV-THERMO', name: 'Digital thermostat', category: 'HVAC', unit: 'pcs', onHand: 5, reorder: 3, cost: 38, location: 'Store C - Shelf 2' },
  { sku: 'EV-DOORSEN', name: 'Elevator door light curtain', category: 'Elevator', unit: 'pcs', onHand: 0, reorder: 1, cost: 240, location: 'Store D - Cage' },
  { sku: 'EV-BTN', name: 'Elevator call button assembly', category: 'Elevator', unit: 'pcs', onHand: 4, reorder: 2, cost: 45, location: 'Store D - Shelf 1' },
  { sku: 'IT-CAT6-305', name: 'Cat6 cable (305m box)', category: 'IT & Network', unit: 'box', onHand: 3, reorder: 1, cost: 120, location: 'Store E - Floor' },
  { sku: 'IT-RJ45', name: 'RJ45 connectors (100)', category: 'IT & Network', unit: 'bag', onHand: 6, reorder: 2, cost: 15, location: 'Store E - Shelf 1' },
  { sku: 'IT-PRJ-LAMP', name: 'Projector replacement lamp', category: 'IT & Network', unit: 'pcs', onHand: 1, reorder: 2, cost: 85, location: 'Store E - Shelf 2' },
  { sku: 'FN-CASTER', name: 'Office chair caster (set of 5)', category: 'Furniture', unit: 'set', onHand: 15, reorder: 5, cost: 11, location: 'Store F - Shelf 1' },
  { sku: 'FN-HINGE', name: 'Heavy-duty door hinge', category: 'Furniture', unit: 'pcs', onHand: 30, reorder: 10, cost: 3.2, location: 'Store F - Shelf 2' },
  { sku: 'FN-LOCK', name: 'Locker cam lock + 2 keys', category: 'Furniture', unit: 'pcs', onHand: 8, reorder: 10, cost: 6.5, location: 'Store F - Shelf 2' },
  { sku: 'CL-DISINF', name: 'Disinfectant (5L)', category: 'Cleaning', unit: 'can', onHand: 20, reorder: 8, cost: 7, location: 'Store G' },
];

/** Templates of realistic service requests. */
export const REQUEST_TEMPLATES: { title: string; description: string; category: RequestCategory; severity: Severity; urgency: Urgency; safety?: boolean; asset?: string; building?: string; room?: string }[] = [
  { title: 'Elevator stops between floors', description: 'The main elevator stopped between the 2nd and 3rd floor this morning and the doors opened only after several minutes. Students were stuck inside.', category: RequestCategory.ELEVATOR, severity: Severity.CRITICAL, urgency: Urgency.HIGH, safety: true, asset: 'ELV-ENG-01' },
  { title: 'Elevator doors close too fast', description: 'The elevator doors close very quickly and hit people entering. The door sensor seems not to work.', category: RequestCategory.ELEVATOR, severity: Severity.HIGH, urgency: Urgency.HIGH, safety: true, asset: 'ELV-ENG-01' },
  { title: 'Strange noise from elevator motor', description: 'Loud grinding noise every time the elevator starts moving from the ground floor.', category: RequestCategory.ELEVATOR, severity: Severity.MEDIUM, urgency: Urgency.MEDIUM, asset: 'ELV-ENG-01' },
  { title: 'Air conditioning not cooling in Computer Lab 1', description: 'The split AC in Computer Lab 1 runs but blows warm air. The room reaches 30 degrees during afternoon sessions.', category: RequestCategory.HVAC, severity: Severity.HIGH, urgency: Urgency.MEDIUM, asset: 'HVAC-ITC-L1' },
  { title: 'AC leaking water on computers', description: 'Water is dripping from the AC unit onto two workstations near the window.', category: RequestCategory.HVAC, severity: Severity.HIGH, urgency: Urgency.HIGH, asset: 'HVAC-ITC-L1' },
  { title: 'Projector shows yellow image', description: 'The lecture hall projector displays a yellow tint and dims after 10 minutes. Probably the lamp.', category: RequestCategory.IT_NETWORK, severity: Severity.MEDIUM, urgency: Urgency.MEDIUM, asset: 'PRJ-ENG-G01' },
  { title: 'Auditorium projector does not turn on', description: 'The projector in auditorium A10 does not power on. Lectures are affected.', category: RequestCategory.IT_NETWORK, severity: Severity.HIGH, urgency: Urgency.HIGH, asset: 'PRJ-SCI-A10' },
  { title: 'Flickering lights in classroom 104', description: 'Three ceiling lights are flickering constantly, making it hard to read the whiteboard.', category: RequestCategory.ELECTRICAL, severity: Severity.LOW, urgency: Urgency.MEDIUM, building: 'ENG', room: '104' },
  { title: 'Power socket sparking', description: 'The power socket near the teacher desk sparks when a plug is inserted. We stopped using it.', category: RequestCategory.ELECTRICAL, severity: Severity.CRITICAL, urgency: Urgency.HIGH, safety: true, building: 'ENG', room: '215' },
  { title: 'Circuit breaker trips in Electrical Lab', description: 'The breaker for bench row 3 trips whenever more than four stations are used.', category: RequestCategory.ELECTRICAL, severity: Severity.MEDIUM, urgency: Urgency.MEDIUM, building: 'ENG', room: '101' },
  { title: 'Leaking faucet in restroom', description: 'The second faucet in the ground floor restroom keeps leaking even when closed.', category: RequestCategory.PLUMBING, severity: Severity.LOW, urgency: Urgency.LOW, building: 'ENG', room: 'R1' },
  { title: 'No hot water in restrooms', description: 'There has been no hot water in the engineering restrooms for two days.', category: RequestCategory.PLUMBING, severity: Severity.MEDIUM, urgency: Urgency.MEDIUM, asset: 'PLB-ENG-WH' },
  { title: 'Blocked sink in Chemistry Lab', description: 'The sink at station 4 is completely blocked and chemical residue is accumulating.', category: RequestCategory.PLUMBING, severity: Severity.HIGH, urgency: Urgency.MEDIUM, building: 'SCI', room: 'CH1' },
  { title: 'Fume hood alarm keeps beeping', description: 'The low-airflow alarm of fume hood #1 beeps continuously. Students cannot work safely.', category: RequestCategory.SAFETY, severity: Severity.HIGH, urgency: Urgency.HIGH, safety: true, asset: 'LAB-SCI-FH1' },
  { title: 'Wi-Fi very slow in Reading Room 2', description: 'The wireless network keeps disconnecting on the second floor of the library.', category: RequestCategory.IT_NETWORK, severity: Severity.MEDIUM, urgency: Urgency.LOW, asset: 'NET-LIB-AP' },
  { title: 'Network ports dead in Computer Lab 2', description: 'Eight network ports in Lab 2 do not provide connectivity.', category: RequestCategory.IT_NETWORK, severity: Severity.MEDIUM, urgency: Urgency.HIGH, building: 'ITC', room: 'L2' },
  { title: 'Broken chairs in classroom 201', description: 'Several chairs have broken wheels and one has a cracked backrest.', category: RequestCategory.FURNITURE, severity: Severity.LOW, urgency: Urgency.LOW, building: 'ITC', room: '201' },
  { title: 'Door of Reading Room 1 does not close', description: 'The door hinge is loose, and the door bangs loudly in the quiet area.', category: RequestCategory.FURNITURE, severity: Severity.LOW, urgency: Urgency.MEDIUM, building: 'LIB', room: 'RR1' },
  { title: 'Spill cleaning needed in Entrance Hall', description: 'Large coffee spill near the library entrance; the floor is slippery.', category: RequestCategory.CLEANING, severity: Severity.MEDIUM, urgency: Urgency.HIGH, safety: true, building: 'LIB', room: 'G00' },
  { title: 'Ceiling tile fell in Anatomy Lab', description: 'A ceiling tile fell this morning and there are visible water stains around it.', category: RequestCategory.STRUCTURAL, severity: Severity.HIGH, urgency: Urgency.MEDIUM, safety: true, building: 'MED', room: 'AN1' },
  { title: 'Simulation Center too hot', description: 'The simulation center temperature is above 28 degrees and the manikins overheat.', category: RequestCategory.HVAC, severity: Severity.HIGH, urgency: Urgency.MEDIUM, asset: 'HVAC-MED-01' },
  { title: 'Centrifuge makes vibration noise', description: 'The refrigerated centrifuge vibrates heavily at high speed.', category: RequestCategory.OTHER, severity: Severity.MEDIUM, urgency: Urgency.MEDIUM, asset: 'LAB-SCI-CEN' },
  { title: 'Locker door broken (ENG)', description: 'My locker door does not lock anymore; the cam lock spins freely.', category: RequestCategory.FURNITURE, severity: Severity.LOW, urgency: Urgency.MEDIUM, building: 'ENG' },
  { title: 'Office AC remote missing', description: 'The AC remote control in the finance office is missing and the unit is stuck on 18 degrees.', category: RequestCategory.HVAC, severity: Severity.LOW, urgency: Urgency.LOW, building: 'ADM', room: '200' },
  { title: 'Lights out in medical lecture hall', description: 'Half of the lights in the medical lecture hall are off.', category: RequestCategory.ELECTRICAL, severity: Severity.MEDIUM, urgency: Urgency.HIGH, building: 'MED', room: 'H01' },
];

export const REPAIR_NOTES: Partial<Record<RequestCategory, string[]>> = {
  ELEVATOR: ['Replaced the door light curtain and recalibrated the door operator.', 'Adjusted the brake and re-levelled the car at all floors.', 'Lubricated guide rails and replaced worn rollers.'],
  HVAC: ['Cleaned the coils, replaced the filter and recharged refrigerant.', 'Cleared the condensate drain line and fixed the drain pan.', 'Replaced the faulty thermostat and tested cooling for 30 minutes.'],
  IT_NETWORK: ['Replaced the projector lamp and reset the lamp hours counter.', 'Re-terminated the patch panel ports and tested each with a cable tester.', 'Re-positioned the access point and updated its firmware.'],
  ELECTRICAL: ['Replaced the damaged socket and checked the circuit insulation.', 'Replaced the starters and LED tubes of the affected fixtures.', 'Split the bench circuit and replaced the 16A breaker.'],
  PLUMBING: ['Replaced the faucet cartridge; no more leakage.', 'Unblocked the drain using a snake and flushed the line.', 'Replaced the heating element of the water heater.'],
  FURNITURE: ['Replaced casters on 6 chairs and removed one damaged chair.', 'Tightened and replaced the door hinges; door closes smoothly.', 'Replaced the locker cam lock and issued new keys.'],
  CLEANING: ['Area cleaned and disinfected; warning sign removed.'],
  STRUCTURAL: ['Replaced the ceiling tile and fixed the minor pipe leak above it.'],
  SAFETY: ['Cleaned the airflow sensor and recalibrated the alarm threshold.'],
  OTHER: ['Re-balanced the rotor and replaced the anti-vibration feet.'],
};

export const FEEDBACK_COMMENTS = [
  'Fixed quickly, thank you!',
  'Good job, the technician was very professional.',
  'Took a bit long but works fine now.',
  'Excellent service.',
  'Problem solved, but please inform us before coming.',
  null,
  null,
];

type Slot = [day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY', start: string, end: string, title: string, location: string];

/** Fictional teachers. Lectures follow the usual Sun/Tue/Thu and Mon/Wed patterns. */
export const TEACHERS: {
  email: string;
  fullName: string;
  title: string;
  department: string;
  office: string;
  phone: string;
  status: 'FREE' | 'BUSY';
  lectures: Slot[];
  officeHours: Slot[];
}[] = [
  {
    email: 'teacher@campusops.edu', fullName: 'Hana Qudah', title: 'Dr.', department: 'Software Engineering', office: 'ITC 305-A', phone: '0796100201', status: 'FREE',
    lectures: [
      ['SUNDAY', '08:30', '10:00', 'Software Engineering (Section 1)', 'ITC 201'], ['TUESDAY', '08:30', '10:00', 'Software Engineering (Section 1)', 'ITC 201'], ['THURSDAY', '08:30', '10:00', 'Software Engineering (Section 1)', 'ITC 201'],
      ['MONDAY', '11:30', '13:00', 'Software Requirements', 'ITC L2'], ['WEDNESDAY', '11:30', '13:00', 'Software Requirements', 'ITC L2'],
    ],
    officeHours: [['SUNDAY', '11:00', '12:30', 'Office hours', 'ITC 305-A'], ['TUESDAY', '11:00', '12:30', 'Office hours', 'ITC 305-A'], ['WEDNESDAY', '13:30', '14:30', 'Office hours', 'ITC 305-A']],
  },
  {
    email: 'teacher2@campusops.edu', fullName: 'Sami Haddadin', title: 'Prof.', department: 'Computer Science', office: 'ITC 312', phone: '0796100202', status: 'BUSY',
    lectures: [
      ['MONDAY', '08:30', '10:00', 'Data Structures', 'ITC 201'], ['WEDNESDAY', '08:30', '10:00', 'Data Structures', 'ITC 201'],
      ['SUNDAY', '13:00', '14:00', 'Algorithms', 'ITC L1'], ['TUESDAY', '13:00', '14:00', 'Algorithms', 'ITC L1'], ['THURSDAY', '13:00', '14:00', 'Algorithms', 'ITC L1'],
    ],
    officeHours: [['MONDAY', '10:30', '12:00', 'Office hours', 'ITC 312'], ['THURSDAY', '10:00', '11:30', 'Office hours', 'ITC 312']],
  },
  {
    email: 'teacher3@campusops.edu', fullName: 'Rasha Alqaisi', title: 'Dr.', department: 'Electrical Engineering', office: 'ENG 214', phone: '0796100203', status: 'FREE',
    lectures: [
      ['SUNDAY', '10:00', '11:30', 'Electric Circuits I', 'ENG 104'], ['TUESDAY', '10:00', '11:30', 'Electric Circuits I', 'ENG 104'], ['THURSDAY', '10:00', '11:30', 'Electric Circuits I', 'ENG 104'],
      ['MONDAY', '13:00', '16:00', 'Circuits Lab', 'ENG 101'],
    ],
    officeHours: [['SUNDAY', '12:00', '13:30', 'Office hours', 'ENG 214'], ['WEDNESDAY', '10:00', '12:00', 'Office hours', 'ENG 214']],
  },
  {
    email: 'teacher4@campusops.edu', fullName: 'Ziad Obeidat', title: 'Dr.', department: 'Chemistry', office: 'SCI 118', phone: '0796100204', status: 'FREE',
    lectures: [['MONDAY', '10:00', '11:30', 'General Chemistry', 'SCI A10'], ['WEDNESDAY', '10:00', '11:30', 'General Chemistry', 'SCI A10'], ['TUESDAY', '12:00', '15:00', 'Organic Chemistry Lab', 'SCI CH1']],
    officeHours: [['SUNDAY', '09:00', '11:00', 'Office hours', 'SCI 118'], ['THURSDAY', '11:00', '12:00', 'Office hours', 'SCI 118']],
  },
  {
    email: 'teacher5@campusops.edu', fullName: 'Nadia Rawashdeh', title: 'Prof.', department: 'Medicine', office: 'MED 402', phone: '0796100205', status: 'BUSY',
    lectures: [['SUNDAY', '08:00', '10:00', 'Human Anatomy', 'MED H01'], ['TUESDAY', '08:00', '10:00', 'Human Anatomy', 'MED H01'], ['WEDNESDAY', '12:00', '15:00', 'Anatomy Lab', 'MED AN1']],
    officeHours: [['MONDAY', '12:00', '13:30', 'Office hours', 'MED 402']],
  },
  {
    email: 'teacher6@campusops.edu', fullName: 'Fadi Shdeifat', title: 'Eng.', department: 'Software Engineering', office: 'ITC 309', phone: '0796100206', status: 'FREE',
    lectures: [['SUNDAY', '14:30', '16:00', 'Web Programming', 'ITC L1'], ['TUESDAY', '14:30', '16:00', 'Web Programming', 'ITC L1'], ['THURSDAY', '14:30', '16:00', 'Web Programming', 'ITC L1']],
    officeHours: [['MONDAY', '09:00', '10:30', 'Office hours', 'ITC 309'], ['WEDNESDAY', '09:00', '10:30', 'Office hours', 'ITC 309']],
  },
];
