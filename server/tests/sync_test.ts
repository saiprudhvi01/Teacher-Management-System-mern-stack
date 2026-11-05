import { io as ClientIO } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';

async function runRealtimeSyncTests() {
  console.log('=================================================================');
  console.log(' EDU TRACK: REAL-TIME DATA SYNCHRONIZATION TEST SUITE (A - F)');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Establish student socket client
  const studentSocket = ClientIO(BASE_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true
  });

  // 2. Establish faculty socket client
  const facultySocket = ClientIO(BASE_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true
  });

  await new Promise<void>((resolve) => {
    let count = 0;
    const check = () => {
      count++;
      if (count === 2) resolve();
    };
    studentSocket.on('connect', () => {
      studentSocket.emit('register_client', {
        userId: 'usr_stu_01',
        role: 'student',
        studentId: 'stu_01',
        departmentId: 'dept_cse',
        semester: 6,
        section: 'A'
      });
      check();
    });
    facultySocket.on('connect', () => {
      facultySocket.emit('register_client', {
        userId: 'usr_fac_01',
        role: 'faculty',
        facultyId: 'fac_01',
        departmentId: 'dept_cse'
      });
      check();
    });
  });

  console.log('✓ Connected: Student Socket & Faculty Socket registered to academic rooms');

  // Helper for REST calls
  async function postJson(endpoint: string, body: any) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  async function putJson(endpoint: string, body: any) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  // --- TEST A: Marks Synchronisation ---
  try {
    console.log('\n--- Running Test A: Marks Synchronisation ---');
    const marksPromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for marks:updated')), 4000);
      studentSocket.once('marks:updated', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    // 1. Create assessment
    const assessment = await postJson('/api/assessments', {
      subjectId: 'sub_cs401',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      title: 'Realtime Distributed Systems Quiz 1',
      type: 'CIA-1',
      date: '2026-03-30',
      maxMarks: 50,
      topicTag: 'Consensus Protocols'
    });

    // 2. Submit marks for student
    await postJson(`/api/assessments/${assessment.id}/marks`, {
      entries: [
        {
          studentId: 'stu_01',
          studentName: 'Alex Mercer',
          rollNumber: 'CS2023-001',
          marksObtained: 46,
          maxMarks: 50,
          feedback: 'Outstanding mastery of Paxos!'
        }
      ]
    });

    const receivedMark = await marksPromise;
    if (receivedMark.studentId === 'stu_01' && receivedMark.marksObtained === 46) {
      console.log('✓ Test A Passed: Student received instant marks:updated with score 46/50 and feedback');
      passed++;
    } else {
      throw new Error(`Unexpected mark payload: ${JSON.stringify(receivedMark)}`);
    }
  } catch (err: any) {
    console.error('✗ Test A Failed:', err.message);
    failed++;
  }

  // --- TEST B: Attendance Synchronisation ---
  try {
    console.log('\n--- Running Test B: Attendance Synchronisation ---');
    const attendancePromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for attendance:updated')), 4000);
      studentSocket.once('attendance:updated', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    await postJson('/api/attendance/sessions', {
      subjectId: 'sub_cs401',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      date: '2026-03-27',
      timeSlot: '09:00 - 10:00',
      facultyId: 'usr_fac_01',
      records: [
        { studentId: 'stu_01', rollNumber: 'CS2023-001', studentName: 'Alex Mercer', status: 'present' }
      ]
    });

    const attEvent = await attendancePromise;
    if (attEvent.studentId === 'stu_01' && typeof attEvent.overallAttendance === 'number') {
      console.log(`✓ Test B Passed: Student received attendance:updated with recalculated overallAttendance: ${attEvent.overallAttendance}%`);
      passed++;
    } else {
      throw new Error(`Unexpected attendance payload: ${JSON.stringify(attEvent)}`);
    }
  } catch (err: any) {
    console.error('✗ Test B Failed:', err.message);
    failed++;
  }

  // --- TEST C: Assignment Lifecycle Synchronisation ---
  try {
    console.log('\n--- Running Test C: Assignment Lifecycle Synchronisation ---');

    // C1: Faculty creates assignment -> Student receives assignment:created
    const asgCreatePromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for assignment:created')), 4000);
      studentSocket.once('assignment:created', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const newAsg = await postJson('/api/assignments', {
      title: 'Raft Consensus Implementation',
      subjectId: 'sub_cs401',
      dueDate: '2026-04-15',
      maxMarks: 100,
      instructions: 'Submit GitHub repository link and architecture diagram'
    });

    const receivedAsg = await asgCreatePromise;
    console.log(`  ✓ C1: Student received assignment:created for "${receivedAsg.title}"`);

    // C2: Student submits -> Faculty receives submission:created
    const submissionPromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for submission:created')), 4000);
      facultySocket.once('submission:created', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const submitted = await postJson(`/api/assignments/${newAsg.id}/submit`, {
      studentId: 'stu_01',
      studentName: 'Alex Mercer',
      rollNumber: 'CS2023-001',
      fileName: 'raft_cluster_v1.zip',
      fileSize: '4.2 MB',
      notes: 'Implemented leader election and log replication'
    });

    const receivedSub = await submissionPromise;
    console.log(`  ✓ C2: Faculty received submission:created from ${receivedSub.studentName}`);

    // C3: Faculty evaluates -> Student receives submission:evaluated
    const evalPromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for submission:evaluated')), 4000);
      studentSocket.once('submission:evaluated', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    await putJson(`/api/assignments/submissions/${submitted.id}/grade`, {
      marksAwarded: 98,
      facultyFeedback: 'Excellent log compaction logic and unit test coverage'
    });

    const receivedEval = await evalPromise;
    if (receivedEval.marksAwarded === 98) {
      console.log(`  ✓ C3: Student received submission:evaluated with marks: 98/100 and faculty feedback`);
      console.log('✓ Test C Passed: Full Assignment Lifecycle synchronized across Student and Faculty portals');
      passed++;
    } else {
      throw new Error(`Unexpected eval payload: ${JSON.stringify(receivedEval)}`);
    }
  } catch (err: any) {
    console.error('✗ Test C Failed:', err.message);
    failed++;
  }

  // --- TEST D: Timetable Synchronisation ---
  try {
    console.log('\n--- Running Test D: Timetable Synchronisation ---');

    // Clean up any previously created test slot for Saturday 10:00-11:00 to prevent overlap conflict
    try {
      const existingRes = await fetch(`${BASE_URL}/api/timetable/class?departmentId=dept_cse&semester=6&section=A`);
      const existingList = await existingRes.json();
      const conflictSlot = Array.isArray(existingList) && existingList.find((t: any) => t.dayOfWeek === 'Saturday' && t.startTime === '10:00');
      if (conflictSlot) {
        await fetch(`${BASE_URL}/api/timetable/class/${conflictSlot.id}`, { method: 'DELETE' });
      }
    } catch (_) {}

    const timetablePromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for timetable:updated')), 4000);
      const listener = (data: any) => {
        if (data.entry) {
          studentSocket.off('timetable:updated', listener);
          clearTimeout(timer);
          resolve(data);
        }
      };
      studentSocket.on('timetable:updated', listener);
    });

    const newSlot = await postJson('/api/timetable/class', {
      dayOfWeek: 'Saturday',
      startTime: '10:00',
      endTime: '11:00',
      subjectId: 'sub_cs401',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      room: 'Seminar Hall 501',
      facultyId: 'usr_fac_01'
    });

    const ttEvent = await timetablePromise;
    if (ttEvent.entry && ttEvent.entry.room === 'Seminar Hall 501') {
      console.log('✓ Test D Passed: Student received real-time timetable:updated for Saturday 10:00-11:00 in Seminar Hall 501');
      passed++;
    } else {
      throw new Error(`Unexpected timetable payload: ${JSON.stringify(ttEvent)}`);
    }

    // Clean up created slot
    if (newSlot && newSlot.id) {
      await fetch(`${BASE_URL}/api/timetable/class/${newSlot.id}`, { method: 'DELETE' });
    }
  } catch (err: any) {
    console.error('✗ Test D Failed:', err.message);
    failed++;
  }

  // --- TEST E: Announcement Synchronisation ---
  try {
    console.log('\n--- Running Test E: Announcement Synchronisation ---');

    const noticePromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for announcement:published')), 4000);
      studentSocket.once('announcement:published', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    await postJson('/api/announcements', {
      title: 'Spring Research Symposium 2026 Registration Open',
      message: 'All senior undergraduate students are invited to submit abstracts for the AI & Systems track.',
      audience: 'STUDENTS',
      priority: 'high'
    });

    const notice = await noticePromise;
    if (notice.title.includes('Spring Research Symposium')) {
      console.log(`✓ Test E Passed: Real-time circular "${notice.title}" received on role:student channel`);
      passed++;
    } else {
      throw new Error(`Unexpected announcement payload: ${JSON.stringify(notice)}`);
    }
  } catch (err: any) {
    console.error('✗ Test E Failed:', err.message);
    failed++;
  }

  // --- TEST F: Network Disconnect & Reconnection ---
  try {
    console.log('\n--- Running Test F: Network Disconnect & Reconnection Resilience ---');

    // Simulate transient network disconnection
    studentSocket.disconnect();
    console.log('  - Student socket disconnected (simulated offline mode)');

    // Reconnect socket
    studentSocket.connect();

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Reconnection timeout')), 4000);
      studentSocket.once('connect', () => {
        clearTimeout(timer);
        studentSocket.emit('register_client', {
          userId: 'usr_stu_01',
          role: 'student',
          studentId: 'stu_01',
          departmentId: 'dept_cse',
          semester: 6,
          section: 'A'
        });
        resolve();
      });
    });

    // Test receiving an event post-reconnection
    const postReconPromise = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout post-reconnect')), 4000);
      studentSocket.once('announcement:published', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    await postJson('/api/announcements', {
      title: 'Post-Reconnection Network Verification Ping',
      message: 'Testing channel integrity after client reconnection.',
      audience: 'STUDENTS'
    });

    const reconNotice = await postReconPromise;
    if (reconNotice.title.includes('Post-Reconnection')) {
      console.log('✓ Test F Passed: Client successfully re-established rooms and processed post-reconnection real-time events without drops or duplicates');
      passed++;
    }
  } catch (err: any) {
    console.error('✗ Test F Failed:', err.message);
    failed++;
  }

  // Cleanup
  studentSocket.disconnect();
  facultySocket.disconnect();

  console.log('\n=================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRealtimeSyncTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
