const BASE_URL = 'http://localhost:3000';

async function testFacultyPersistence() {
  console.log('=== TEST: FACULTY CREATION & PERSISTENCE ===\n');

  // 1. Check current faculty count
  const initialRes = await fetch(`${BASE_URL}/api/faculty`);
  const initialList = await initialRes.json();
  console.log(`Initial faculty count: ${initialList.length}`);

  // 2. Create new faculty
  const newEmpId = `FAC_TEST_${Date.now().toString().slice(-4)}`;
  const newEmail = `prof.test_${Date.now()}@edutrack.edu`;

  const createRes = await fetch(`${BASE_URL}/api/faculty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prof. Test Instructor',
      email: newEmail,
      employeeId: newEmpId,
      designation: 'Assistant Professor',
      departmentId: 'dept_cse',
      officeRoom: 'Room 303',
      assignedSections: ['CSE-A', 'CSE-B']
    })
  });

  const createdData = await createRes.json();
  if (!createRes.ok || !createdData.profile) {
    console.error('Failed to create faculty:', createdData);
    process.exit(1);
  }
  console.log(`✓ Faculty created: ${createdData.user.name} (${createdData.profile.employeeId})`);

  // 3. Re-query faculty list to verify persistence
  const verifyRes = await fetch(`${BASE_URL}/api/faculty`);
  const verifyList = await verifyRes.json();
  console.log(`Updated faculty count: ${verifyList.length}`);

  const found = verifyList.find((f: any) => f.employeeId === newEmpId);
  if (!found) {
    console.error('✗ Created faculty was NOT found in /api/faculty list!');
    process.exit(1);
  }
  console.log(`✓ Verified persistence: ${found.name} (${found.employeeId}) exists with email ${found.email}`);

  // 4. Clean up test faculty
  const { dbStore } = await import('../store/storage');
  const data = dbStore.getData();
  data.faculty = data.faculty.filter((f: any) => f.employeeId !== newEmpId);
  data.users = data.users.filter((u: any) => u.email !== newEmail);
  dbStore.save();
  console.log('✓ Cleaned up temporary test faculty.');

  console.log('\n=== ALL FACULTY PERSISTENCE TESTS PASSED ===');
}

testFacultyPersistence().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
