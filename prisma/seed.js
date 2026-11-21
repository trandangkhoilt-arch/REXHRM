const { PrismaClient, RoleType, UserStatus, Gender, ContractType, EmploymentStatus, WorkMode, ShiftType, ScheduleStatus, AttendanceStatus, PresenceStatus, EventType, VerificationMethod, GeofenceStatus, EventStatus, RiskType, RiskSeverity, RiskStatus, RequestType, RequestStatus, TimesheetStatus, PayrollStatus, NotificationType } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting NexHRM enterprise database seed...");

  // Clean existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.timesheetAdjustment.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendanceRiskFlag.deleteMany();
  await prisma.presenceVerification.deleteMany();
  await prisma.presenceChallenge.deleteMany();
  await prisma.attendanceEvidence.deleteMany();
  await prisma.attendanceEvent.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.scheduleAssignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.qRStation.deleteMany();
  await prisma.workLocation.deleteMany();
  await prisma.employeeContract.deleteMany();
  await prisma.registeredAuthenticator.deleteMany();
  await prisma.deviceRegistration.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.holidayCalendar.deleteMany();
  await prisma.organizationSetting.deleteMany();
  await prisma.organization.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("123456", 10);
  const securePasswordHash = await bcrypt.hash("NexHRM@2026", 10);

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: "Tổng Công Ty Công Nghệ & Dịch Vụ NexHRM Việt Nam",
      code: "NEXHRM_VN",
      taxCode: "0109887766",
      address: "Tầng 18, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội",
      phone: "024-3998-8888",
      email: "contact@nexhrm.vn",
      logoUrl: "/logo.png",
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  // 2. Branches
  const branchHN = await prisma.branch.create({
    data: {
      orgId: org.id,
      name: "Trụ sở chính Hà Nội",
      code: "HN_HQ",
      address: "Tòa nhà Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội",
      phone: "024-3998-8888",
      email: "hanoi@nexhrm.vn",
      latitude: 21.016934,
      longitude: 105.784111,
      radiusMeters: 200.0,
      minAccuracyMeters: 100.0,
      isActive: true,
    },
  });

  const branchHCM = await prisma.branch.create({
    data: {
      orgId: org.id,
      name: "Chi nhánh TP. Hồ Chí Minh",
      code: "HCM_BR",
      address: "Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP. HCM",
      phone: "028-3888-9999",
      email: "hcm@nexhrm.vn",
      latitude: 10.771971,
      longitude: 106.704386,
      radiusMeters: 200.0,
      minAccuracyMeters: 100.0,
      isActive: true,
    },
  });

  // Work locations
  await prisma.workLocation.createMany({
    data: [
      {
        branchId: branchHN.id,
        name: "Sảnh Lễ Tân Tầng 1 - Keangnam",
        address: "Tầng 1 Keangnam Landmark 72",
        latitude: 21.016934,
        longitude: 105.784111,
        radiusMeters: 80.0,
      },
      {
        branchId: branchHN.id,
        name: "Khu Văn Phòng Tầng 18 - Keangnam",
        address: "Tầng 18 Keangnam Landmark 72",
        latitude: 21.016934,
        longitude: 105.784111,
        radiusMeters: 150.0,
      },
      {
        branchId: branchHCM.id,
        name: "Văn phòng Tầng 25 Bitexco",
        address: "Tầng 25 Bitexco, Q1, TP.HCM",
        latitude: 10.771971,
        longitude: 106.704386,
        radiusMeters: 120.0,
      },
    ],
  });

  // 3. Departments
  const deptBGD = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHN.id, name: "Ban Giám Đốc", code: "BGD" },
  });
  const deptHCNS = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHN.id, name: "Hành chính – Nhân sự", code: "HCNS" },
  });
  const deptKTTC = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHN.id, name: "Kế toán – Tài chính", code: "KTTC" },
  });
  const deptCNTT = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHN.id, name: "Kỹ thuật & Công nghệ", code: "CNTT" },
  });
  const deptKD = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHN.id, name: "Kinh doanh & Phát triển thị trường", code: "KD" },
  });
  const deptMKT = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHN.id, name: "Marketing & Truyền thông", code: "MKT" },
  });
  const deptVH = await prisma.department.create({
    data: { orgId: org.id, branchId: branchHCM.id, name: "Vận hành & Dịch vụ khách hàng", code: "VH" },
  });

  // 4. Positions
  const posCEO = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptBGD.id, title: "Tổng Giám Đốc (CEO)", code: "CEO", baseSalaryMin: 80000000, baseSalaryMax: 150000000 },
  });
  const posHRMgr = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptHCNS.id, title: "Trưởng phòng Nhân sự", code: "HR_MGR", baseSalaryMin: 25000000, baseSalaryMax: 45000000 },
  });
  const posHRExec = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptHCNS.id, title: "Chuyên viên Tuyển dụng & Đào tạo", code: "HR_EXEC", baseSalaryMin: 12000000, baseSalaryMax: 20000000 },
  });
  const posPayroll = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptHCNS.id, title: "Chuyên viên C&B (Tính lương)", code: "CB_SPEC", baseSalaryMin: 15000000, baseSalaryMax: 25000000 },
  });
  const posTechLead = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptCNTT.id, title: "Trưởng phòng Kỹ thuật (Tech Lead)", code: "TECH_LEAD", baseSalaryMin: 35000000, baseSalaryMax: 60000000 },
  });
  const posSrDev = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptCNTT.id, title: "Kỹ sư phần mềm cao cấp (Senior)", code: "SR_DEV", baseSalaryMin: 28000000, baseSalaryMax: 45000000 },
  });
  const posDev = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptCNTT.id, title: "Kỹ sư phần mềm (Software Engineer)", code: "DEV", baseSalaryMin: 15000000, baseSalaryMax: 26000000 },
  });
  const posQA = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptCNTT.id, title: "Kỹ sư Đảm bảo chất lượng (QA/QC)", code: "QA_ENG", baseSalaryMin: 14000000, baseSalaryMax: 22000000 },
  });
  const posSalesMgr = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptKD.id, title: "Trưởng phòng Kinh doanh", code: "SALES_MGR", baseSalaryMin: 25000000, baseSalaryMax: 50000000 },
  });
  const posSalesExec = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptKD.id, title: "Chuyên viên Kinh doanh", code: "SALES_EXEC", baseSalaryMin: 10000000, baseSalaryMax: 22000000 },
  });
  const posMktExec = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptMKT.id, title: "Chuyên viên Marketing", code: "MKT_EXEC", baseSalaryMin: 12000000, baseSalaryMax: 20000000 },
  });
  const posAcct = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptKTTC.id, title: "Kế toán viên tổng hợp", code: "ACCT_GEN", baseSalaryMin: 14000000, baseSalaryMax: 24000000 },
  });
  const posAuditor = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptKTTC.id, title: "Chuyên viên Kiểm toán nội bộ", code: "AUDITOR", baseSalaryMin: 18000000, baseSalaryMax: 30000000 },
  });
  const posOpsMgr = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptVH.id, title: "Trưởng phòng Vận hành", code: "OPS_MGR", baseSalaryMin: 25000000, baseSalaryMax: 40000000 },
  });
  const posCS = await prisma.position.create({
    data: { orgId: org.id, departmentId: deptVH.id, title: "Chuyên viên Chăm sóc khách hàng", code: "CS_SPEC", baseSalaryMin: 10000000, baseSalaryMax: 18000000 },
  });

  // 5. Shifts
  const shiftHC = await prisma.shift.create({
    data: {
      orgId: org.id,
      code: "CA_HC",
      name: "Ca Hành Chính Chuẩn",
      type: ShiftType.ADMINISTRATIVE,
      startTime: "08:30",
      endTime: "17:30",
      breakStart: "12:00",
      breakEnd: "13:00",
      standardWorkHours: 8.0,
      earlyCheckInToleranceMinutes: 45,
      lateCheckInToleranceMinutes: 15,
      earlyCheckOutToleranceMinutes: 15,
      isOvernight: false,
      requireGps: true,
      requireQr: false,
      requireFace: false,
    },
  });

  const shiftSang = await prisma.shift.create({
    data: {
      orgId: org.id,
      code: "CA_SANG",
      name: "Ca Sáng Sớm",
      type: ShiftType.MORNING,
      startTime: "06:00",
      endTime: "14:00",
      breakStart: "10:00",
      breakEnd: "10:30",
      standardWorkHours: 7.5,
      earlyCheckInToleranceMinutes: 30,
      lateCheckInToleranceMinutes: 10,
      earlyCheckOutToleranceMinutes: 10,
      isOvernight: false,
      requireGps: true,
      requireQr: false,
    },
  });

  const shiftChieu = await prisma.shift.create({
    data: {
      orgId: org.id,
      code: "CA_CHIEU",
      name: "Ca Chiều Tối",
      type: ShiftType.AFTERNOON,
      startTime: "14:00",
      endTime: "22:00",
      breakStart: "18:00",
      breakEnd: "18:30",
      standardWorkHours: 7.5,
      earlyCheckInToleranceMinutes: 30,
      lateCheckInToleranceMinutes: 10,
      earlyCheckOutToleranceMinutes: 10,
      isOvernight: false,
      requireGps: true,
      requireQr: false,
    },
  });

  const shiftDem = await prisma.shift.create({
    data: {
      orgId: org.id,
      code: "CA_DEM",
      name: "Ca Đêm Vận Hành (Qua Đêm)",
      type: ShiftType.NIGHT,
      startTime: "22:00",
      endTime: "06:00",
      breakStart: "02:00",
      breakEnd: "02:45",
      standardWorkHours: 7.25,
      earlyCheckInToleranceMinutes: 30,
      lateCheckInToleranceMinutes: 10,
      earlyCheckOutToleranceMinutes: 15,
      isOvernight: true,
      requireGps: true,
      requireQr: false,
    },
  });

  const shiftRemote = await prisma.shift.create({
    data: {
      orgId: org.id,
      code: "CA_REMOTE",
      name: "Ca Làm Việc Từ Xa (Remote/WFH)",
      type: ShiftType.REMOTE,
      startTime: "08:30",
      endTime: "17:30",
      breakStart: "12:00",
      breakEnd: "13:00",
      standardWorkHours: 8.0,
      earlyCheckInToleranceMinutes: 60,
      lateCheckInToleranceMinutes: 30,
      earlyCheckOutToleranceMinutes: 30,
      isOvernight: false,
      requireGps: false,
      requireQr: false,
      allowFlexibleLocation: true,
    },
  });

  // 6. QR Stations
  await prisma.qRStation.createMany({
    data: [
      {
        orgId: org.id,
        branchId: branchHN.id,
        stationCode: "ST_HN_GATE_01",
        stationName: "Kiosk Check-in Sảnh Tầng 1 - Keangnam HN",
        locationDescription: "Cạnh cửa xoay lễ tân tòa tháp Landmark",
        secretSeed: "secret-qr-seed-hanoi-gate-01-2026",
        refreshIntervalSeconds: 30,
        isActive: true,
      },
      {
        orgId: org.id,
        branchId: branchHN.id,
        stationCode: "ST_HN_FLOOR_18",
        stationName: "Trạm Check-in Cửa Văn Phòng Tầng 18 HN",
        locationDescription: "Cửa vào sảnh văn phòng tầng 18",
        secretSeed: "secret-qr-seed-hanoi-f18-2026",
        refreshIntervalSeconds: 30,
        isActive: true,
      },
      {
        orgId: org.id,
        branchId: branchHCM.id,
        stationCode: "ST_HCM_F25_01",
        stationName: "Kiosk Check-in Sảnh Văn Phòng Bitexco HCM",
        locationDescription: "Tầng 25 Bitexco Tower",
        secretSeed: "secret-qr-seed-hcm-f25-2026",
        refreshIntervalSeconds: 30,
        isActive: true,
      },
    ],
  });

  // 7. Leave types
  const ltAnnual = await prisma.leaveType.create({
    data: { orgId: org.id, code: "ANNUAL", name: "Nghỉ phép năm", isPaid: true, defaultDaysPerYear: 12.0 },
  });
  const ltSick = await prisma.leaveType.create({
    data: { orgId: org.id, code: "SICK", name: "Nghỉ ốm hưởng BHXH", isPaid: true, defaultDaysPerYear: 5.0, requiresAttachment: true },
  });
  const ltUnpaid = await prisma.leaveType.create({
    data: { orgId: org.id, code: "UNPAID", name: "Nghỉ không hưởng lương", isPaid: false, defaultDaysPerYear: 10.0 },
  });
  const ltSpecial = await prisma.leaveType.create({
    data: { orgId: org.id, code: "SPECIAL", name: "Nghỉ hiếu hỷ / việc riêng", isPaid: true, defaultDaysPerYear: 3.0 },
  });

  // 8. Core Users & Employees setup
  console.log("👤 Creating core system demo users (Admin, HR, Manager, Employee, Payroll, Auditor)...");

  // User 1: Super Admin (Nguyễn Văn An)
  const uAdmin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "admin@nexhrm.vn",
      passwordHash: securePasswordHash,
      role: RoleType.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  const empAdmin = await prisma.employee.create({
    data: {
      orgId: org.id,
      userId: uAdmin.id,
      branchId: branchHN.id,
      departmentId: deptBGD.id,
      positionId: posCEO.id,
      employeeCode: "NEX-001",
      firstName: "An",
      lastName: "Nguyễn Văn",
      fullName: "Nguyễn Văn An",
      gender: Gender.MALE,
      dateOfBirth: new Date("1985-05-15"),
      phone: "0901234567",
      email: "admin@nexhrm.vn",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      joinDate: new Date("2020-01-01"),
      contractType: ContractType.OFFICIAL,
      employmentStatus: EmploymentStatus.ACTIVE,
      workMode: WorkMode.OFFICE,
      baseSalary: 120000000,
    },
  });

  // User 2: HR Admin (Trần Thị Bích)
  const uHR = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "hr@nexhrm.vn",
      passwordHash: securePasswordHash,
      role: RoleType.HR_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  const empHR = await prisma.employee.create({
    data: {
      orgId: org.id,
      userId: uHR.id,
      branchId: branchHN.id,
      departmentId: deptHCNS.id,
      positionId: posHRMgr.id,
      managerId: empAdmin.id,
      employeeCode: "NEX-002",
      firstName: "Bích",
      lastName: "Trần Thị",
      fullName: "Trần Thị Bích",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1990-08-20"),
      phone: "0902345678",
      email: "hr@nexhrm.vn",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      joinDate: new Date("2021-03-01"),
      contractType: ContractType.OFFICIAL,
      employmentStatus: EmploymentStatus.ACTIVE,
      workMode: WorkMode.OFFICE,
      baseSalary: 35000000,
    },
  });
  await prisma.department.update({ where: { id: deptHCNS.id }, data: { managerId: empHR.id } });

  // User 3: Manager / Tech Lead (Lê Hoàng Nam)
  const uManager = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "manager@nexhrm.vn",
      passwordHash: securePasswordHash,
      role: RoleType.MANAGER,
      status: UserStatus.ACTIVE,
    },
  });
  const empManager = await prisma.employee.create({
    data: {
      orgId: org.id,
      userId: uManager.id,
      branchId: branchHN.id,
      departmentId: deptCNTT.id,
      positionId: posTechLead.id,
      managerId: empAdmin.id,
      employeeCode: "NEX-003",
      firstName: "Nam",
      lastName: "Lê Hoàng",
      fullName: "Lê Hoàng Nam",
      gender: Gender.MALE,
      dateOfBirth: new Date("1988-11-12"),
      phone: "0903456789",
      email: "manager@nexhrm.vn",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      joinDate: new Date("2021-06-15"),
      contractType: ContractType.OFFICIAL,
      employmentStatus: EmploymentStatus.ACTIVE,
      workMode: WorkMode.HYBRID,
      baseSalary: 45000000,
    },
  });
  await prisma.department.update({ where: { id: deptCNTT.id }, data: { managerId: empManager.id } });

  // User 4: Regular Employee (Phạm Minh Đức)
  const uEmp = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "employee@nexhrm.vn",
      passwordHash: securePasswordHash,
      role: RoleType.EMPLOYEE,
      status: UserStatus.ACTIVE,
    },
  });
  const empEmp = await prisma.employee.create({
    data: {
      orgId: org.id,
      userId: uEmp.id,
      branchId: branchHN.id,
      departmentId: deptCNTT.id,
      positionId: posDev.id,
      managerId: empManager.id,
      employeeCode: "NEX-004",
      firstName: "Đức",
      lastName: "Phạm Minh",
      fullName: "Phạm Minh Đức",
      gender: Gender.MALE,
      dateOfBirth: new Date("1996-03-25"),
      phone: "0904567890",
      email: "employee@nexhrm.vn",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      joinDate: new Date("2022-09-01"),
      contractType: ContractType.OFFICIAL,
      employmentStatus: EmploymentStatus.ACTIVE,
      workMode: WorkMode.OFFICE,
      baseSalary: 22000000,
    },
  });

  // User 5: Payroll Specialist (Đỗ Phương Thảo)
  const uPayroll = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "payroll@nexhrm.vn",
      passwordHash: securePasswordHash,
      role: RoleType.PAYROLL,
      status: UserStatus.ACTIVE,
    },
  });
  const empPayroll = await prisma.employee.create({
    data: {
      orgId: org.id,
      userId: uPayroll.id,
      branchId: branchHN.id,
      departmentId: deptHCNS.id,
      positionId: posPayroll.id,
      managerId: empHR.id,
      employeeCode: "NEX-005",
      firstName: "Thảo",
      lastName: "Đỗ Phương",
      fullName: "Đỗ Phương Thảo",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1993-07-08"),
      phone: "0905678901",
      email: "payroll@nexhrm.vn",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      joinDate: new Date("2022-02-15"),
      contractType: ContractType.OFFICIAL,
      employmentStatus: EmploymentStatus.ACTIVE,
      workMode: WorkMode.OFFICE,
      baseSalary: 20000000,
    },
  });

  // User 6: Auditor (Vũ Quốc Khánh)
  const uAuditor = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "auditor@nexhrm.vn",
      passwordHash: securePasswordHash,
      role: RoleType.AUDITOR,
      status: UserStatus.ACTIVE,
    },
  });
  const empAuditor = await prisma.employee.create({
    data: {
      orgId: org.id,
      userId: uAuditor.id,
      branchId: branchHN.id,
      departmentId: deptKTTC.id,
      positionId: posAuditor.id,
      managerId: empAdmin.id,
      employeeCode: "NEX-006",
      firstName: "Khánh",
      lastName: "Vũ Quốc",
      fullName: "Vũ Quốc Khánh",
      gender: Gender.MALE,
      dateOfBirth: new Date("1991-12-05"),
      phone: "0906789012",
      email: "auditor@nexhrm.vn",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
      joinDate: new Date("2022-05-10"),
      contractType: ContractType.OFFICIAL,
      employmentStatus: EmploymentStatus.ACTIVE,
      workMode: WorkMode.OFFICE,
      baseSalary: 24000000,
    },
  });

  // 9. Generate realistic employees to total 61 as requested
  console.log("👥 Generating 55 additional employees across departments for full 61 staff demo...");
  const firstNamesM = ["Hùng", "Cường", "Tuấn", "Dũng", "Thành", "Kiên", "Tùng", "Sơn", "Vinh", "Bình", "Hải", "Long", "Trung", "Hiếu", "Quân", "Đạt", "Thắng"];
  const firstNamesF = ["Linh", "Trang", "Mai", "Hương", "Hà", "Lan", "Vy", "Huyền", "Quỳnh", "Thảo", "Nhung", "Yến", "Ngọc", "Thu", "Tâm", "Hạnh", "Ánh"];
  const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
  const middleNamesM = ["Văn", "Hồng", "Đình", "Minh", "Hải", "Tuấn", "Quang", "Đức", "Thành", "Khắc"];
  const middleNamesF = ["Thị", "Thu", "Ngọc", "Thanh", "Mai", "Phương", "Diệu", "Ánh", "Bảo", "Kim"];

  const depts = [deptHCNS, deptKTTC, deptCNTT, deptKD, deptMKT, deptVH];
  const deptPositions = {
    [deptHCNS.id]: [posHRExec, posPayroll],
    [deptKTTC.id]: [posAcct, posAuditor],
    [deptCNTT.id]: [posSrDev, posDev, posQA],
    [deptKD.id]: [posSalesMgr, posSalesExec],
    [deptMKT.id]: [posMktExec],
    [deptVH.id]: [posOpsMgr, posCS],
  };

  const allEmployees = [empAdmin, empHR, empManager, empEmp, empPayroll, empAuditor];

  for (let i = 7; i <= 61; i++) {
    const isFemale = i % 2 === 0;
    const gender = isFemale ? Gender.FEMALE : Gender.MALE;
    const fn = isFemale ? firstNamesF[i % firstNamesF.length] : firstNamesM[i % firstNamesM.length];
    const mn = isFemale ? middleNamesF[i % middleNamesF.length] : middleNamesM[i % middleNamesM.length];
    const ln = lastNames[i % lastNames.length];
    const fullName = `${ln} ${mn} ${fn}`;
    const code = `NEX-${String(i).padStart(3, "0")}`;
    const email = `nhanvien${i}@nexhrm.vn`;

    // Department & Position distribution
    const d = depts[i % depts.length];
    const availablePos = deptPositions[d.id] || [posDev];
    const pos = availablePos[i % availablePos.length];
    const branch = i % 4 === 0 ? branchHCM : branchHN;

    // Status distribution
    let status = EmploymentStatus.ACTIVE;
    if (i === 15 || i === 45) status = EmploymentStatus.ON_LEAVE;
    if (i === 58 || i === 59) status = EmploymentStatus.PROBATION;

    // Contract type
    const contractType = (status === EmploymentStatus.PROBATION || i > 55) ? ContractType.PROBATION : ContractType.OFFICIAL;
    const baseSal = Math.round((pos.baseSalaryMin || 15000000) + ((i * 1234567) % 8000000));

    const user = await prisma.user.create({
      data: {
        orgId: org.id,
        email,
        passwordHash: defaultPasswordHash,
        role: RoleType.EMPLOYEE,
        status: UserStatus.ACTIVE,
      },
    });

    const emp = await prisma.employee.create({
      data: {
        orgId: org.id,
        userId: user.id,
        branchId: branch.id,
        departmentId: d.id,
        positionId: pos.id,
        managerId: d.id === deptCNTT.id ? empManager.id : empHR.id,
        employeeCode: code,
        firstName: fn,
        lastName: `${ln} ${mn}`,
        fullName,
        gender,
        dateOfBirth: new Date(1990 + (i % 12), (i % 12), (i % 28) + 1),
        phone: `09${String(10000000 + i * 17923).slice(0, 8)}`,
        email,
        avatarUrl: `https://i.pravatar.cc/150?u=${code}`,
        joinDate: new Date(2022, (i % 12), 1),
        contractType,
        employmentStatus: status,
        workMode: (i % 5 === 0) ? WorkMode.HYBRID : WorkMode.OFFICE,
        baseSalary: baseSal,
      },
    });

    allEmployees.push(emp);
  }

  console.log(`✅ Total ${allEmployees.length} employees created successfully!`);

  // 10. Leave Balances for all employees
  console.log("🏖️ Initializing leave balances...");
  for (const emp of allEmployees) {
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: emp.id, leaveTypeId: ltAnnual.id, year: 2026, totalDays: 12.0, usedDays: 2.0, remainingDays: 10.0 },
        { employeeId: emp.id, leaveTypeId: ltSick.id, year: 2026, totalDays: 5.0, usedDays: 0.0, remainingDays: 5.0 },
      ],
    });
  }

  // 11. Work Schedules & Assignments for November 2026
  console.log("📅 Generating work schedules and assignments for the current period...");
  const targetYear = 2026;
  const targetMonth = 11; // November
  const workDaysInNov = [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 30];

  // Assign shifts to key employees for November
  for (const day of [16, 17, 18, 19, 20, 21]) {
    const workDate = new Date(Date.UTC(targetYear, targetMonth - 1, day));
    for (const emp of allEmployees.slice(0, 15)) {
      const shiftToAssign = (emp.departmentId === deptVH.id && day % 2 === 0) ? shiftSang : shiftHC;
      await prisma.scheduleAssignment.upsert({
        where: {
          employeeId_workDate: {
            employeeId: emp.id,
            workDate: workDate,
          },
        },
        create: {
          employeeId: emp.id,
          shiftId: shiftToAssign.id,
          workDate: workDate,
          status: ScheduleStatus.SCHEDULED,
        },
        update: {},
      });
    }
  }

  // 12. Realistic Attendance Sessions & Events for demo employees
  console.log("⏱️ Creating realistic attendance sessions (On-time, Late, Early Leave, Incomplete, Fraud Flag)...");
  
  // Date: 2026-11-20 (Yesterday)
  const d20 = new Date(Date.UTC(2026, 10, 20));

  // Employee 1 (empAdmin): On time
  const sAdmin = await prisma.attendanceSession.create({
    data: {
      employeeId: empAdmin.id,
      date: d20,
      status: AttendanceStatus.COMPLETED,
      checkInTime: new Date("2026-11-20T08:24:00Z"),
      checkOutTime: new Date("2026-11-20T17:35:00Z"),
      durationMinutes: 551,
      workHours: 8.0,
      standardHours: 8.0,
      isLate: false,
      lateMinutes: 0,
      isEarlyLeave: false,
      presenceStatus: PresenceStatus.VERIFIED,
      riskScore: 0,
    },
  });

  // Employee 4 (empEmp): Late check-in
  const sEmpLate = await prisma.attendanceSession.create({
    data: {
      employeeId: empEmp.id,
      date: d20,
      status: AttendanceStatus.COMPLETED,
      checkInTime: new Date("2026-11-20T08:52:00Z"), // 22 minutes late
      checkOutTime: new Date("2026-11-20T17:45:00Z"),
      durationMinutes: 533,
      workHours: 7.6,
      standardHours: 8.0,
      isLate: true,
      lateMinutes: 22,
      isEarlyLeave: false,
      presenceStatus: PresenceStatus.VERIFIED,
      riskScore: 10,
    },
  });

  // Events for empEmp
  const evIn = await prisma.attendanceEvent.create({
    data: {
      sessionId: sEmpLate.id,
      employeeId: empEmp.id,
      eventType: EventType.CHECK_IN,
      eventTime: new Date("2026-11-20T08:52:00Z"),
      clientTime: new Date("2026-11-20T08:52:00Z"),
      latitude: 21.016934,
      longitude: 105.784111,
      accuracyMeters: 14.5,
      geofenceStatus: GeofenceStatus.INSIDE,
      verificationMethod: VerificationMethod.GPS_QR,
      status: EventStatus.VALID,
    },
  });

  await prisma.attendanceEvidence.create({
    data: {
      eventId: evIn.id,
      evidenceType: "GEO_COORDINATE",
      rawPayload: JSON.stringify({ lat: 21.016934, lng: 105.784111, accuracy: 14.5, distanceToCenter: 24.2 }),
      isVerified: true,
      verificationScore: 1.0,
    },
  });

  // Employee 3 (empManager): Missing Check-out demo
  const sMissingOut = await prisma.attendanceSession.create({
    data: {
      employeeId: empManager.id,
      date: d20,
      status: AttendanceStatus.INCOMPLETE,
      checkInTime: new Date("2026-11-20T08:29:00Z"),
      checkOutTime: null,
      durationMinutes: 0,
      workHours: 4.0,
      standardHours: 8.0,
      isLate: false,
      lateMinutes: 0,
      isEarlyLeave: false,
      presenceStatus: PresenceStatus.PARTIAL,
      riskScore: 40,
      notes: "Hệ thống phát hiện thiếu lượt chấm công ra cuối ca.",
    },
  });

  // 13. Presence Challenge & Random Probe Demo
  const challenge1 = await prisma.presenceChallenge.create({
    data: {
      sessionId: sMissingOut.id,
      employeeId: empManager.id,
      challengeType: "RANDOM",
      challengeToken: "probe-token-random-manager-001",
      issuedAt: new Date("2026-11-20T14:15:00Z"),
      expiresAt: new Date("2026-11-20T14:30:00Z"),
      status: "MISSED",
      notes: "Nhân viên không phản hồi xác minh hiện diện ngẫu nhiên trong 15 phút.",
    },
  });

  // 14. Fraud Risk Flag Demo
  await prisma.attendanceRiskFlag.create({
    data: {
      orgId: org.id,
      employeeId: empManager.id,
      sessionId: sMissingOut.id,
      riskType: RiskType.MISSED_PRESENCE,
      severity: RiskSeverity.MEDIUM,
      riskScore: 55,
      description: "Nhân viên check-in vào ca lúc 08:29 nhưng bỏ lỡ xác minh hiện diện lúc 14:15 và không có check-out.",
      evidence: JSON.stringify({
        checkIn: "2026-11-20T08:29:00Z",
        missedChallengeId: challenge1.id,
        missingCheckOut: true,
      }),
      status: RiskStatus.OPEN,
    },
  });

  // Employee 8: Suspicious off-location check-in attempt demo
  const emp8 = allEmployees[7];
  await prisma.attendanceRiskFlag.create({
    data: {
      orgId: org.id,
      employeeId: emp8.id,
      riskType: RiskType.OFF_LOCATION,
      severity: RiskSeverity.HIGH,
      riskScore: 75,
      description: "Nỗ lực check-in cách văn phòng Keangnam 2.4km (ngoài bán kính cho phép 200m).",
      evidence: JSON.stringify({
        attemptedLat: 21.038,
        attemptedLng: 105.75,
        officeLat: 21.016934,
        officeLng: 105.784111,
        calculatedDistanceMeters: 2410,
        toleranceRadius: 200,
      }),
      status: RiskStatus.INVESTIGATING,
    },
  });

  // 15. Leave Requests Demo
  console.log("📝 Generating leave requests demo...");
  await prisma.leaveRequest.create({
    data: {
      employeeId: empEmp.id,
      leaveTypeId: ltAnnual.id,
      requestType: RequestType.ANNUAL_LEAVE,
      startDate: new Date("2026-11-25"),
      endDate: new Date("2026-11-26"),
      durationDays: 2.0,
      reason: "Giải quyết việc cá nhân gia đình tại quê nhà.",
      status: RequestStatus.PENDING,
      currentStep: 1,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: empManager.id,
      leaveTypeId: ltAnnual.id,
      requestType: RequestType.ANNUAL_LEAVE,
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-11-10"),
      durationDays: 1.0,
      reason: "Nghỉ phép cá nhân.",
      status: RequestStatus.APPROVED,
      reviewedBy: empAdmin.fullName,
      reviewNotes: "Đã duyệt đơn nghỉ phép.",
    },
  });

  // 16. Timesheet Demo (October 2026 & November 2026)
  console.log("📊 Creating Timesheet records...");
  for (const emp of allEmployees.slice(0, 10)) {
    await prisma.timesheet.create({
      data: {
        orgId: org.id,
        employeeId: emp.id,
        month: 10,
        year: 2026,
        standardDays: 22.0,
        actualDays: 21.5,
        lateCount: 1,
        lateMinutes: 15,
        earlyLeaveCount: 0,
        earlyLeaveMinutes: 0,
        absentDays: 0,
        paidLeaveDays: 0.5,
        unpaidLeaveDays: 0,
        overtimeHours: 4.0,
        totalWorkHours: 176.0,
        status: TimesheetStatus.CONFIRMED,
        confirmedBy: "Trần Thị Bích (HR)",
        confirmedAt: new Date("2026-11-02"),
      },
    });

    await prisma.timesheet.create({
      data: {
        orgId: org.id,
        employeeId: emp.id,
        month: 11,
        year: 2026,
        standardDays: 22.0,
        actualDays: 14.5,
        lateCount: emp.id === empEmp.id ? 2 : 0,
        lateMinutes: emp.id === empEmp.id ? 35 : 0,
        earlyLeaveCount: 0,
        earlyLeaveMinutes: 0,
        absentDays: 0,
        paidLeaveDays: 1.0,
        unpaidLeaveDays: 0,
        overtimeHours: 2.0,
        totalWorkHours: 116.0,
        status: TimesheetStatus.DRAFT,
      },
    });
  }

  // 17. Payroll Period & Items Demo (October 2026)
  console.log("💰 Creating Payroll period & items for October 2026...");
  const payrollPeriod = await prisma.payrollPeriod.create({
    data: {
      orgId: org.id,
      month: 10,
      year: 2026,
      periodName: "Bảng Lương Tháng 10/2026",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      standardWorkDays: 22.0,
      status: PayrollStatus.APPROVED,
      totalGrossSalary: 312000000,
      totalNetSalary: 275450000,
      approvedBy: "Nguyễn Văn An (CEO)",
    },
  });

  for (const emp of allEmployees.slice(0, 10)) {
    const base = emp.baseSalary;
    const actualSalary = (base / 22.0) * 21.5;
    const allowances = 1500000;
    const bonus = 2000000;
    const ot = (base / (22 * 8)) * 1.5 * 4;
    const si = base * 0.08;
    const hi = base * 0.015;
    const ui = base * 0.01;
    const deductions = si + hi + ui;
    const gross = actualSalary + allowances + bonus + ot;
    const pit = Math.max(0, (gross - 11000000 - deductions) * 0.1);
    const net = gross - deductions - pit;

    await prisma.payrollItem.create({
      data: {
        payrollPeriodId: payrollPeriod.id,
        employeeId: emp.id,
        baseSalary: base,
        actualWorkDays: 21.5,
        standardWorkDays: 22.0,
        actualWorkSalary: Math.round(actualSalary),
        overtimePay: Math.round(ot),
        allowances: allowances,
        bonuses: bonus,
        deductions: 0,
        socialInsurance: Math.round(si),
        healthInsurance: Math.round(hi),
        unemploymentInsurance: Math.round(ui),
        personalIncomeTax: Math.round(pit),
        netSalary: Math.round(net),
        status: PayrollStatus.APPROVED,
        releasedToEmployee: true,
      },
    });
  }

  // 18. Notifications
  console.log("🔔 Creating sample system notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: uAdmin.id,
        title: "Cảnh báo chấm công bất thường",
        message: "Phát hiện 2 trường hợp chấm công ngoài bán kính hoặc thiếu kiểm tra hiện diện.",
        type: NotificationType.FRAUD_ALERT,
        linkUrl: "/fraud-detection",
        isRead: false,
      },
      {
        userId: uEmp.id,
        title: "Phiếu lương tháng 10/2026 đã sẵn sàng",
        message: "Phiếu lương kỳ tháng 10/2026 của bạn đã được phê duyệt. Vui lòng kiểm tra chi tiết.",
        type: NotificationType.PAYSLIP_READY,
        linkUrl: "/payroll",
        isRead: false,
      },
      {
        userId: uManager.id,
        title: "Đơn xin nghỉ phép mới cần duyệt",
        message: "Nhân viên Phạm Minh Đức vừa gửi đơn xin nghỉ phép năm 2 ngày.",
        type: NotificationType.REQUEST_PENDING,
        linkUrl: "/requests",
        isRead: false,
      },
    ],
  });

  // 19. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        orgId: org.id,
        userId: uAdmin.id,
        action: "INITIALIZE_SYSTEM",
        entity: "Organization",
        entityId: org.id,
        details: JSON.stringify({ message: "Khởi tạo hệ thống NexHRM thành công với cấu hình bảo mật đa tầng." }),
      },
      {
        orgId: org.id,
        userId: uHR.id,
        action: "CONFIRM_TIMESHEET",
        entity: "Timesheet",
        entityId: "10-2026",
        details: JSON.stringify({ month: 10, year: 2026, count: 10 }),
      },
    ],
  });

  console.log("✨ Seed completed successfully! All demo data loaded.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
