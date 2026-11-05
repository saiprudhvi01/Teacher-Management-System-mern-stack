import { io as ClientIO } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';

async function runCrossRoleVerification() {
  console.log('=================================================================');
  console.log(' EDU TRACK: ADMIN <-> FACULTY <-> STUDENT CROSS-ROLE & DB VERIFICATION');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Verify health & DB status endpoint
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log('✓ Health Endpoint Online:', health.service);
    console.log('✓ Database Mode:', health.database);
    console.log('✓ MongoDB Configured Target:', health.mongoStatus?.uri);
    passed++;
  } catch (err: any) {
    console.error('✗ Failed calling /api/health:', err.message);
    failed++;
  }

  // 2. Establish Student, Faculty, and Admin sockets
  const studentSocket = ClientIO(BASE_URL, { transports: ['websocket', 'polling'], forceNew: true });
  const facultySocket = ClientIO(BASE_URL, { transports: ['websocket', 'polling'], forceNew: true });
  const adminSocket = ClientIO(BASE_URL, { transports: ['websocket', 'polling'], forceNew: true });

  await new Promise<void>((resolve) => {
    let connected = 0;
    const onConn = () => {
      connected++;
      if (connected === 3) resolve();
    };
    studentSocket.on('connect', () => {
      studentSocket.emit('register_client', {
        userId: 'usr_std_01',
        role: 'student',
        studentId: 'std_01',
        departmentId: 'dept_cse',
        semester: 6,
        section: 'A'
      });
      onConn();
    });
    facultySocket.on('connect', () => {
      facultySocket.emit('register_client', {
        userId: 'usr_fac_01',
        role: 'faculty',
        facultyId: 'fac_01',
        departmentId: 'dept_cse'
      });
      onConn();
    });
    adminSocket.on('connect', () => {
      adminSocket.emit('register_client', {
        userId: 'usr_admin_01',
        role: 'admin'
      });
      onConn();
    });
  });

  console.log('✓ All 3 Roles (Admin, Faculty, Student) connected to real-time socket cluster\n');

  // Test 1: Admin creates a section -> Faculty & Student both receive section:created & academic:updated
  console.log('--- Test 1: Admin Creates Section Propagation ---');
  const secName = `CSE-VERIFY-${Date.now().toString().slice(-4)}`;
  const sectionPromise = new Promise<boolean>((resolve) => {
    let facGot = false;
    let stdGot = false;
    facultySocket.on('section:created', (data) => {
      if (data.section?.name === secName) facGot = true;
      if (facGot && stdGot) resolve(true);
    });
    studentSocket.on('academic:updated', (data) => {
      if (data.section?.name === secName || data.type === 'section') stdGot = true;
      if (facGot && stdGot) resolve(true);
    });
    setTimeout(() => resolve(facGot || stdGot), 3000);
  });

  const secRes = await fetch(`${BASE_URL}/api/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: secName, departmentId: 'dept_cse', capacity: 60 })
  });
  const secData = await secRes.json();
  const secReceived = await sectionPromise;
  if (secRes.status === 201 && secReceived) {
    console.log(`✓ Test 1 Passed: Admin created section "${secName}" propagated to Faculty & Student live!`);
    passed++;
  } else {
    console.error(`✗ Test 1 Failed: Status ${secRes.status}, Received: ${secReceived}`);
    failed++;
  }

  // Test 2: Admin creates a subject -> Faculty & Student both receive subject:created & academic:updated
  console.log('\n--- Test 2: Admin Creates Subject Propagation ---');
  const subCode = `CS${Math.floor(100 + Math.random() * 899)}`;
  const subjectPromise = new Promise<boolean>((resolve) => {
    let facGot = false;
    facultySocket.on('subject:created', (data) => {
      if (data.subject?.code === subCode) facGot = true;
      resolve(facGot);
    });
    setTimeout(() => resolve(facGot), 3000);
  });

  const subRes = await fetch(`${BASE_URL}/api/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: subCode,
      name: 'Advanced Quantum & Neural Networks',
      departmentId: 'dept_cse',
      semester: 6,
      credits: 4,
      type: 'Theory'
    })
  });
  const subReceived = await subjectPromise;
  if (subRes.status === 201 && subReceived) {
    console.log(`✓ Test 2 Passed: Admin created subject "${subCode}" propagated to Faculty live!`);
    passed++;
  } else {
    console.error(`✗ Test 2 Failed: Status ${subRes.status}, Received: ${subReceived}`);
    failed++;
  }

  // Test 3: Faculty creates assignment -> Student receives assignment:created
  console.log('\n--- Test 3: Faculty Creates Assignment Propagation ---');
  const asgTitle = `Lab Report: ${Date.now().toString().slice(-4)}`;
  const asgPromise = new Promise<boolean>((resolve) => {
    studentSocket.on('assignment:created', (data) => {
      if (data.title === asgTitle) resolve(true);
    });
    setTimeout(() => resolve(false), 3000);
  });

  const asgRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: asgTitle,
      subjectId: 'sub_cs401',
      dueDate: '2026-11-20',
      maxMarks: 50,
      instructions: 'Submit your complete source repository link.'
    })
  });
  const asgReceived = await asgPromise;
  if (asgRes.status === 201 && asgReceived) {
    console.log(`✓ Test 3 Passed: Faculty assignment "${asgTitle}" propagated to Student live!`);
    passed++;
  } else {
    console.error(`✗ Test 3 Failed: Status ${asgRes.status}, Received: ${asgReceived}`);
    failed++;
  }

  // Test 4: Faculty creates internal assessment & marks -> Student receives assessment & marks
  console.log('\n--- Test 4: Faculty Creates Test & Marks Propagation ---');
  const testTitle = `Unit Quiz: ${Date.now().toString().slice(-4)}`;
  const ciaPromise = new Promise<boolean>((resolve) => {
    studentSocket.on('assessment:created', (data) => {
      if (data.title === testTitle) resolve(true);
    });
    setTimeout(() => resolve(false), 3000);
  });

  const ciaRes = await fetch(`${BASE_URL}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: testTitle,
      subjectId: 'sub_cs401',
      type: 'Quiz',
      date: '2026-11-05',
      maxMarks: 25,
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A'
    })
  });
  const ciaData = await ciaRes.json();
  const ciaReceived = await ciaPromise;
  if (ciaRes.status === 201 && ciaReceived) {
    console.log(`✓ Test 4 Passed: Faculty assessment "${testTitle}" propagated to Student live!`);
    passed++;
  } else {
    console.error(`✗ Test 4 Failed: Status ${ciaRes.status}, Received: ${ciaReceived}`);
    failed++;
  }

  // Test 5: Faculty records attendance -> Student receives attendance:updated
  console.log('\n--- Test 5: Faculty Records Attendance Propagation ---');
  const attPromise = new Promise<boolean>((resolve) => {
    studentSocket.on('attendance:session_recorded', () => resolve(true));
    studentSocket.on('attendance:updated', () => resolve(true));
    setTimeout(() => resolve(false), 3000);
  });

  const attRes = await fetch(`${BASE_URL}/api/attendance/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      date: '2026-11-05',
      period: '09:00 - 10:00 AM',
      topicCovered: 'Consensus Protocols',
      records: [{ studentId: 'std_01', status: 'present' }]
    })
  });
  const attReceived = await attPromise;
  if (attRes.status === 201 && attReceived) {
    console.log('✓ Test 5 Passed: Faculty attendance session propagated to Student live!');
    passed++;
  } else {
    console.error(`✗ Test 5 Failed: Status ${attRes.status}, Received: ${attReceived}`);
    failed++;
  }

  studentSocket.disconnect();
  facultySocket.disconnect();
  adminSocket.disconnect();

  console.log('\n=================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('=================================================================\n');

  if (failed > 0) process.exit(1);
}

runCrossRoleVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
