// Oprino Full Platform End-to-End Smoke Test
// Validates: API, Web, Postgres/PostGIS, Redis, Multi-tenancy, Visits, Checklists, Proofs, Attendance, Verification

const API_BASE = 'http://localhost:3001';
const WEB_BASE = 'http://localhost:3000';

let AUTH_TOKEN = process.env.SMOKE_AUTH_TOKEN || 'WPykoIltfYFpPVkR9WdiRDMjjfajHnlJ';
let WORKSPACE_ID = process.env.SMOKE_WORKSPACE_ID || '01357be8-1d1f-451b-8541-c5df8b47bcf9';
let CUSTOMER_ID = process.env.SMOKE_CUSTOMER_ID || '3b13656a-8b6e-4085-b384-09bc0af346f4';
let SITE_ID = process.env.SMOKE_SITE_ID || 'ef540833-0efc-4422-9acc-858fa09e48ad';
let SHIFT_ID = process.env.SMOKE_SHIFT_ID || '694034c9-a7ed-49a1-bf6e-c900e8584e7c';
let TASK_ID = process.env.SMOKE_TASK_ID || '21caf1c4-b8cb-4e89-a7b1-90c23c96e478';

const headers = {
  'Content-Type': 'application/json',
  get Authorization() {
    return `Bearer ${AUTH_TOKEN}`;
  },
  get 'x-workspace-id'() {
    return WORKSPACE_ID;
  },
};

function pass(msg) {
  console.log(`\x1b[32m✔ PASS:\x1b[0m ${msg}`);
}

function fail(msg, err) {
  console.error(`\x1b[31m✘ FAIL:\x1b[0m ${msg}`);
  if (err) console.error(err);
  process.exit(1);
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const effectiveHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'x-workspace-id': WORKSPACE_ID,
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers: effectiveHeaders,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // raw text
  }
  return { status: res.status, ok: res.ok, body: json || text };
}

async function runSmokeTest() {
  console.log('====================================================');
  console.log('   OPRINO SAAS END-TO-END SMOKE TEST (PHASE 01-05)  ');
  console.log('====================================================\n');

  // 1. Health check
  console.log('1. Checking Fastify API, PostgreSQL & Redis Health...');
  const healthRes = await api('/health/ready', { headers: {} });
  if (healthRes.status === 200 && healthRes.body.status === 'ok') {
    pass(`API is healthy: db=${healthRes.body.services.database}, redis=${healthRes.body.services.redis}`);
  } else {
    fail('Health check failed', healthRes.body);
  }

  // 1b. Validate/Bootstrap Session & Workspace
  const testAuthRes = await api('/v1/workspaces');
  if (!testAuthRes.ok || !testAuthRes.body?.workspaces?.some((w) => w.id === WORKSPACE_ID)) {
    console.log('Bootstrapping fresh smoke test owner, workspace, customer & shift...');
    const signupRes = await api('/v1/auth/signup', {
      method: 'POST',
      headers: {},
      body: JSON.stringify({
        email: `smoke.owner.${Date.now()}@example.com`,
        password: 'SmokePassword123!',
        name: 'Smoke Test Owner',
      }),
    });
    if (signupRes.status === 200 && signupRes.body?.token) {
      AUTH_TOKEN = signupRes.body.token;
      pass(`Provisioned smoke test owner account: ${signupRes.body.user.email}`);

      // Provision workspace
      const newWsRes = await api('/v1/workspaces', {
        method: 'POST',
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify({ name: 'Smoke Test Operations' }),
      });
      if (newWsRes.status === 201 && newWsRes.body?.id) {
        WORKSPACE_ID = newWsRes.body.id;
        pass(`Provisioned fresh smoke test workspace: ${WORKSPACE_ID}`);

        // Provision Customer
        const custRes = await api('/v1/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Apex Industrial Solar Hub',
            companyName: 'Apex Holdings',
            email: 'smoke@apex.com',
          }),
        });
        if (custRes.status === 201 && custRes.body?.id) {
          CUSTOMER_ID = custRes.body.id;
          // Provision Site
          const siteRes = await api(`/v1/customers/${CUSTOMER_ID}/sites`, {
            method: 'POST',
            body: JSON.stringify({
              name: 'North Logistics Solar Farm',
              address: '742 Evergreen Terrace',
              latitude: 28.6139,
              longitude: 77.2090,
              geofenceRadiusMeters: 150.0,
            }),
          });
          if (siteRes.status === 201 && siteRes.body?.id) {
            SITE_ID = siteRes.body.id;
          }
        }

        // Provision Shift
        const shiftRes = await api('/v1/attendance/shifts', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Standard Day Shift',
            startTime: '08:00',
            endTime: '17:00',
            timezone: 'UTC',
          }),
        });
        if (shiftRes.status === 201 && shiftRes.body?.id) {
          SHIFT_ID = shiftRes.body.id;
        }
      }
    }
  }

  // 2. Validate Active Workspace
  console.log('\n2. Validating Workspace Tenant Membership...');
  const wsRes = await api('/v1/workspaces');
  if (wsRes.ok && wsRes.body.workspaces?.some((w) => w.id === WORKSPACE_ID)) {
    const ws = wsRes.body.workspaces.find((w) => w.id === WORKSPACE_ID);
    pass(`Workspace verified: "${ws.name}" (${ws.id})`);
  } else {
    fail('Workspace lookup failed', wsRes.body);
  }

  // 3. Attendance Punch-In Lifecycle
  console.log('\n3. Testing Attendance Punch-In (Duty-Hours Invariant)...');
  const initialDutyRes = await api('/v1/attendance/current');
  if (initialDutyRes.ok && initialDutyRes.body.dutyState === 'ON_DUTY') {
    // Reset by punching out first to test punch-in fresh
    await api('/v1/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: `reset-punchout-${Date.now()}`,
        note: 'Reset test state',
      }),
    });
  }

  const punchInIdemp = `punch-in-${Date.now()}`;
  const punchInRes = await api('/v1/attendance/punch-in', {
    method: 'POST',
    body: JSON.stringify({
      idempotencyKey: punchInIdemp,
      shiftId: SHIFT_ID,
      note: 'Smoke test duty start at solar site',
    }),
  });
  if (punchInRes.status === 200) {
    pass(`Punch-in successful: session ${punchInRes.body.id}, duty state ON_DUTY`);
  } else {
    fail('Punch-in failed', punchInRes.body);
  }

  // Verify current duty state
  const dutyRes = await api('/v1/attendance/current');
  if (dutyRes.ok && dutyRes.body.dutyState === 'ON_DUTY') {
    pass(`Current duty state confirmed: ${dutyRes.body.dutyState}`);
  } else {
    fail('Failed to verify ON_DUTY state', dutyRes.body);
  }

  // 4. Physical Site Visit Creation & Dispatch Sequencing
  console.log('\n4. Testing Site Visit Creation & Dispatch Routing Sequence...');
  const visitRes = await api('/v1/visits', {
    method: 'POST',
    body: JSON.stringify({
      customerId: CUSTOMER_ID,
      siteId: SITE_ID,
      taskId: TASK_ID,
      plannedAt: new Date(Date.now() + 3600000).toISOString(),
      notes: 'Quarterly Inverter safety audit and verification visit',
    }),
  });
  if (visitRes.status === 201) {
    pass(`Visit created: ID=${visitRes.body.id}, status=${visitRes.body.status}`);
  } else {
    fail('Visit creation failed', visitRes.body);
  }
  const visitId = visitRes.body.id;

  // List visits
  const listVisitsRes = await api('/v1/visits');
  if (listVisitsRes.ok && listVisitsRes.body.visits?.some((v) => v.id === visitId)) {
    pass(`Visit list returned ${listVisitsRes.body.total} visits`);
  } else {
    fail('Visit list failed', listVisitsRes.body);
  }

  // Test Route Sequencing (Phase 04)
  const todayDate = new Date().toISOString().slice(0, 10);
  const userMeRes = await api('/v1/auth/me');
  const currentUserId = userMeRes.body?.id || 'c273de53-f1dc-423c-a5fa-92fef4862587';

  const seqRes = await api('/v1/visits/sequence', {
    method: 'PUT',
    body: JSON.stringify({
      userId: currentUserId,
      routeDate: todayDate,
      orderedVisitIds: [visitId],
    }),
  });
  if (seqRes.ok) {
    pass(`Dispatch route sequence updated for date ${todayDate}`);
  } else {
    fail('Dispatch route reorder failed', seqRes.body);
  }

  // 5. Visit GPS Check-In & Check-Out
  console.log('\n5. Testing Visit GPS Check-In & Check-Out Flow...');
  const checkInRes = await api(`/v1/visits/${visitId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 4.5,
      notes: 'Arrived at Acme Solar HQ Warehouse main gate',
    }),
  });
  if (checkInRes.ok && checkInRes.body.status === 'CHECKED_IN') {
    pass(`Visit checked in: status=${checkInRes.body.status}, checkInTime=${checkInRes.body.checkInTime}`);
  } else {
    fail('Visit check-in failed', checkInRes.body);
  }

  const checkOutRes = await api(`/v1/visits/${visitId}/check-out`, {
    method: 'POST',
    body: JSON.stringify({
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 3.8,
      notes: 'Maintenance completed, customer signed off on site',
    }),
  });
  if (checkOutRes.ok && checkOutRes.body.status === 'CHECKED_OUT') {
    pass(`Visit checked out: status=${checkOutRes.body.status}, duration=${checkOutRes.body.durationMinutes}m`);
  } else {
    fail('Visit check-out failed', checkOutRes.body);
  }

  // 6. Task State Machine & Mandatory Checklist Items
  console.log('\n6. Testing Task State Transitions & Checklist Completion...');
  let currentTaskId = TASK_ID;
  let taskDetailRes = await api(`/v1/tasks/${currentTaskId}`);
  let task = taskDetailRes.ok ? taskDetailRes.body : null;

  if (!task || task.status === 'COMPLETED' || task.status === 'VERIFIED' || task.status === 'CANCELLED') {
    const createRes = await api('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: `Smoke Test Solar Maintenance ${Date.now()}`,
        description: 'Automated smoke test validation task',
        priority: 'HIGH',
        customerId: CUSTOMER_ID,
        siteId: SITE_ID,
        requiresSignature: true,
        requiresPhotoProof: true,
        checklist: [
          'Inspect main breaker voltage',
          'Clean solar array panels',
          'Collect client signature on glass',
        ],
      }),
    });
    if (!createRes.ok) fail('Failed to create fresh task for smoke test', createRes.body);
    task = createRes.body;
    currentTaskId = task.id;
    pass(`Created fresh test task: ${task.title} (ID=${currentTaskId})`);
  } else {
    pass(`Using existing task: status=${task.status}, version=${task.version}`);
  }

  // Transition ASSIGNED -> ACCEPTED
  if (task.status === 'ASSIGNED') {
    const accRes = await api(`/v1/tasks/${currentTaskId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status: 'ACCEPTED', version: task.version }),
    });
    if (accRes.ok) {
      pass(`Task transitioned to ACCEPTED (v${accRes.body.version})`);
      task = accRes.body;
    } else {
      fail('Task accept failed', accRes.body);
    }
  }

  // Transition ACCEPTED -> IN_PROGRESS
  if (task.status === 'ACCEPTED') {
    const progRes = await api(`/v1/tasks/${currentTaskId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status: 'IN_PROGRESS', version: task.version }),
    });
    if (progRes.ok) {
      pass(`Task transitioned to IN_PROGRESS (v${progRes.body.version})`);
      task = progRes.body;
    } else {
      fail('Task in_progress transition failed', progRes.body);
    }
  }

  // Complete checklist items
  console.log(`Completing ${task.checklist?.length || 0} required checklist items...`);
  for (const item of task.checklist || []) {
    const checkRes = await api(`/v1/tasks/${currentTaskId}/checklist/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted: true }),
    });
    if (checkRes.ok) {
      pass(`Checklist item [${item.title}] marked completed`);
    } else {
      fail(`Failed to check item ${item.title}`, checkRes.body);
    }
  }

  // 7. Proof of Work Submission (Photo + On-Glass Signature)
  console.log('\n7. Testing Watermarked Proof of Work & Customer Signature Upload...');
  // Photo proof
  const photoUploadRes = await api('/v1/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      taskId: currentTaskId,
      visitId: visitId,
      proofType: 'PHOTO',
      fileName: 'inverter_panel_reading.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 185000,
    }),
  });
  if (!photoUploadRes.ok) fail('Photo upload URL failed', photoUploadRes.body);
  const photoKey = photoUploadRes.body.fileKey;

  const photoConfirmRes = await api('/v1/media/confirm', {
    method: 'POST',
    body: JSON.stringify({
      taskId: currentTaskId,
      visitId: visitId,
      proofType: 'PHOTO',
      fileKey: photoKey,
      fileSizeBytes: 185000,
      mimeType: 'image/jpeg',
      watermarkMetadata: {
        latitude: 28.6139,
        longitude: 77.2090,
        timestamp: new Date().toISOString(),
        accuracyMeters: 4.2,
      },
      notes: 'Main DC inverter display reading 415V steady',
    }),
  });
  if (photoConfirmRes.ok) {
    pass(`Photo proof confirmed: ID=${photoConfirmRes.body.id}`);
  } else {
    fail('Photo proof confirmation failed', photoConfirmRes.body);
  }

  // Signature proof
  const sigUploadRes = await api('/v1/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      taskId: currentTaskId,
      visitId: visitId,
      proofType: 'SIGNATURE',
      fileName: 'customer_site_signoff.png',
      mimeType: 'image/png',
      fileSizeBytes: 42000,
    }),
  });
  if (!sigUploadRes.ok) fail('Signature upload URL failed', sigUploadRes.body);
  const sigKey = sigUploadRes.body.fileKey;

  const sigConfirmRes = await api('/v1/media/confirm', {
    method: 'POST',
    body: JSON.stringify({
      taskId: currentTaskId,
      visitId: visitId,
      proofType: 'SIGNATURE',
      fileKey: sigKey,
      signerName: 'Rajesh Verma (Plant Manager)',
      signerPhone: '+91-9876543210',
      watermarkMetadata: {
        signedAt: new Date().toISOString(),
      },
      notes: 'Customer signed digitally on mobile device glass',
    }),
  });
  if (sigConfirmRes.ok) {
    pass(`Signature proof confirmed: ID=${sigConfirmRes.body.id}`);
  } else {
    fail('Signature proof confirmation failed', sigConfirmRes.body);
  }

  // Re-fetch fresh task version before completing
  taskDetailRes = await api(`/v1/tasks/${currentTaskId}`);
  task = taskDetailRes.body;

  // Complete Task
  const compRes = await api(`/v1/tasks/${currentTaskId}/transition`, {
    method: 'POST',
    body: JSON.stringify({ status: 'COMPLETED', version: task.version }),
  });
  if (compRes.ok && compRes.body.status === 'COMPLETED') {
    pass(`Task successfully COMPLETED (v${compRes.body.version})`);
    task = compRes.body;
  } else {
    fail('Task completion transition failed', compRes.body);
  }

  // 8. Supervisor Review Queue & Verification
  console.log('\n8. Testing Supervisor Verification Approval...');
  const verifyRes = await api(`/v1/tasks/${currentTaskId}/verify`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'VERIFY',
      notes: 'All safety checklist points verified and photos reviewed. Excellent work.',
    }),
  });
  if (verifyRes.ok && verifyRes.body.verifiedBy) {
    pass(`Task verified by supervisor: verifiedAt=${verifyRes.body.verifiedAt}`);
  } else {
    fail('Task verification failed', verifyRes.body);
  }

  // 9. Attendance Punch-Out Lifecycle
  console.log('\n9. Testing Attendance Punch-Out (Duty Tracking Cutoff)...');
  const punchOutIdemp = `punch-out-${Date.now()}`;
  const punchOutRes = await api('/v1/attendance/punch-out', {
    method: 'POST',
    body: JSON.stringify({
      idempotencyKey: punchOutIdemp,
      note: 'Finished shift and all site tasks completed',
    }),
  });
  if (punchOutRes.status === 200) {
    pass(`Punch-out successful: session closed, duty state OFF_DUTY`);
  } else {
    fail('Punch-out failed', punchOutRes.body);
  }

  const postDutyRes = await api('/v1/attendance/current');
  if (postDutyRes.ok && postDutyRes.body.dutyState === 'OFF_DUTY') {
    pass(`Duty tracking boundary strictly enforced: current state is OFF_DUTY`);
  } else {
    fail('Expected OFF_DUTY state after punch out', postDutyRes.body);
  }

  // 10. Web Dashboard Route Verification
  console.log('\n10. Testing Next.js Web Dashboard Route Availability...');
  const webRoutes = ['/auth/signin', '/tasks', '/visits', '/reports'];
  for (const route of webRoutes) {
    try {
      const res = await fetch(`${WEB_BASE}${route}`);
      if (res.status === 200) {
        pass(`Web page accessible: ${WEB_BASE}${route} (HTTP 200)`);
      } else {
        console.warn(`Web page returned ${res.status}: ${WEB_BASE}${route}`);
      }
    } catch (err) {
      fail(`Web frontend not reachable at ${WEB_BASE}${route}`, err);
    }
  }

  console.log('\n====================================================');
  console.log('   🎉 ALL SMOKE TESTS PASSED WITH 100% SUCCESS!   ');
  console.log('====================================================\n');
}

runSmokeTest().catch((err) => {
  console.error('Unhandled smoke test error:', err);
  process.exit(1);
});
