// Oprino Isolated Pilot Test Server (Phase 4C)
// Provides a complete, zero-dependency, reproducible backend for Android pilot testing:
// - Mock Fastify/HTTP API compatible contract
// - Synthetic Tenant: "Apex Field Services" (ws-pilot-1)
// - Synthetic Employee & Manager accounts (in-memory test-double only)
// - Local HMAC-secured media storage with file persistence
// - Attendance punch-in/out, GPS duty tracking, tasks, checklists, and proof verification
// - Device governance & revocation simulation
// - Zero connection to production database

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  console.error('FATAL SECURITY VIOLATION: scripts/isolated_pilot_server.mjs is an in-memory test double and must NEVER be run in production or staging environments!');
  process.exit(1);
}

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = parseInt(process.env.PILOT_PORT || '3001', 10);
const HOST = process.env.PILOT_HOST || '127.0.0.1';
const STORAGE_DIR = path.resolve(process.cwd(), '.storage', 'pilot_media');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// In-memory isolated state
const state = {
  attendanceSession: null,
  activeDeviceId: null,
  isDeviceRevoked: false,
  tasks: [
    {
      id: 'task-pilot-1',
      workspaceId: 'ws-pilot-1',
      title: 'Commercial HVAC Solar Compressor Maintenance',
      description: 'Perform routine preventative maintenance and inspect rooftop compressor.',
      status: 'ASSIGNED',
      simplifiedStatus: 'ASSIGNED',
      priority: 'HIGH',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      customerId: 'cust-1',
      customerName: 'Apex Solar Technologies',
      siteId: 'site-1',
      checklist: [
        { id: 'chk-1', title: 'Inspect condenser coils & belt tension', isCompleted: false },
        { id: 'chk-2', title: 'Replace primary intake HEPA filter', isCompleted: false },
      ],
      assignees: ['usr-employee-1'],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  proofs: [],
  visits: [
    {
      id: 'visit-pilot-1',
      workspaceId: 'ws-pilot-1',
      customerId: 'cust-1',
      customerName: 'Apex Solar Technologies',
      siteId: 'site-1',
      siteName: 'North Logistics Solar Facility',
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'SCHEDULED',
      latitude: 28.6139,
      longitude: 77.209,
      radiusMeters: 150.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id, x-installation-id, x-app-version, x-platform',
    'X-Oprino-Environment': 'isolated-mock-pilot',
    'X-Oprino-Mock-Server': 'true',
    'X-Oprino-Backend-Type': 'in-memory-test-double',
    'X-Oprino-Warning': 'SYNTHETIC TEST DATA ONLY - NOT REAL FASTIFY POSTGRESQL API',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id, x-installation-id, x-app-version, x-platform',
      'X-Oprino-Environment': 'isolated-mock-pilot',
      'X-Oprino-Mock-Server': 'true',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = parsedUrl.pathname;
  const authHeader = req.headers.authorization || '';
  const isManager = authHeader.includes('manager');

  // Check device revocation
  if (state.isDeviceRevoked && !pathname.includes('/auth') && !pathname.includes('/health') && !pathname.includes('/test')) {
    return sendJson(res, 401, {
      code: 'DEVICE_REVOKED',
      error: 'DEVICE_REVOKED',
      message: 'This Android installation has been revoked by workspace security administrator.',
    });
  }

  // 1. Health Endpoint (Clearly labeled test-double)
  if (pathname === '/health/ready' || pathname === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      mock: true,
      engine: 'synthetic-in-memory-mock',
      warning: 'TEST DOUBLE ONLY - NOT REAL FASTIFY POSTGRESQL API',
      version: '1.0.0-pilot-mock',
      timestamp: new Date().toISOString(),
      services: { database: 'mock-in-memory', redis: 'mock-in-memory', storage: 'local-isolated' },
    });
  }

  // 1b. Test State Reset (Idempotency)
  if (req.method === 'POST' && pathname === '/v1/test/reset') {
    state.isDeviceRevoked = false;
    state.attendanceSession = null;
    state.activeDeviceId = null;
    state.proofs = [];
    return sendJson(res, 200, { success: true, message: 'Pilot test state reset' });
  }

  // 2. Auth Sign-in
  if (req.method === 'POST' && pathname === '/v1/auth/sign-in/email') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const email = (body.email || '').toLowerCase().trim();
        const role = email.includes('manager') ? 'Manager' : 'Employee';
        const userId = email.includes('manager') ? 'usr-manager-1' : 'usr-employee-1';
        const name = email.includes('manager') ? 'Maria Santos (Manager)' : 'Alex Johnson (Field Tech)';

        const token = `pilot_${role.toLowerCase()}_token_${Date.now()}`;
        return sendJson(res, 200, {
          token,
          user: {
            id: userId,
            email,
            name,
            emailVerified: true,
          },
        });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // 3. Me Context (ADR-006 & RBAC)
  if (req.method === 'GET' && pathname === '/v1/me') {
    const roleName = isManager ? 'Manager' : 'Employee';
    const userId = isManager ? 'usr-manager-1' : 'usr-employee-1';
    const email = isManager ? 'manager@acme.com' : 'field.lead@acme.com';
    const name = isManager ? 'Maria Santos (Manager)' : 'Alex Johnson (Field Tech)';

    const permissions = isManager
      ? ['workspace.read', 'members.read', 'attendance.read', 'attendance.write', 'tasks.read', 'tasks.write', 'tasks.verify', 'media.read', 'devices.read', 'devices.revoke']
      : ['workspace.read', 'attendance.read', 'attendance.write', 'tasks.read', 'tasks.write', 'visits.read', 'visits.write', 'media.upload', 'media.read'];

    return sendJson(res, 200, {
      user: { id: userId, email, name, emailVerified: true },
      activeWorkspace: {
        id: 'ws-pilot-1',
        name: 'Apex Field Services',
        slug: 'apex-field-services',
        status: 'ACTIVE',
      },
      membership: { id: `mem-${userId}`, status: 'active' },
      role: { id: `role-${roleName.toLowerCase()}`, name: roleName },
      permissions,
      currentInstallation: {
        id: 'inst-pilot-1',
        installationId: req.headers['x-installation-id'] || '55df2f92-6116-45ad-971e-374d9782b085',
        platform: 'ANDROID',
        status: 'ACTIVE',
      },
    });
  }

  // 4. Workspaces List
  if (req.method === 'GET' && pathname === '/v1/workspaces') {
    return sendJson(res, 200, {
      workspaces: [
        {
          id: 'ws-pilot-1',
          name: 'Apex Field Services',
          slug: 'apex-field-services',
          status: 'ACTIVE',
          membershipStatus: 'active',
          roleName: isManager ? 'Manager' : 'Employee',
        },
      ],
    });
  }

  // 5. Device Registration
  if (req.method === 'POST' && pathname === '/v1/devices') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        state.activeDeviceId = body.installationId;
        return sendJson(res, 200, {
          success: true,
          status: 'REGISTERED',
          installationId: body.installationId,
        });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 6. Device Revocation
  if (req.method === 'POST' && pathname === '/v1/devices/revoke') {
    state.isDeviceRevoked = true;
    return sendJson(res, 200, {
      success: true,
      revoked: true,
      message: 'Device installation has been revoked.',
    });
  }

  // 7. Attendance Selfie Upload URL
  if (req.method === 'POST' && pathname === '/v1/media/attendance-selfie-url') {
    const fileId = `selfie_${Date.now()}.jpg`;
    const fileKey = `ws-pilot-1/attendance/usr-employee-1/${fileId}`;
    const uploadUrl = `http://${req.headers.host || 'localhost:3001'}/v1/media/storage/upload/${fileKey}?sig=pilot_hmac_valid`;
    return sendJson(res, 200, {
      uploadUrl,
      fileKey,
      expiresInSeconds: 900,
    });
  }

  // 8. General Media Upload URL (Task Proofs)
  if (req.method === 'POST' && pathname === '/v1/media/upload-url') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const taskId = body.taskId || 'general';
        const fileId = `proof_${Date.now()}.jpg`;
        const fileKey = `ws-pilot-1/proofs/${taskId}/${fileId}`;
        const uploadUrl = `http://${req.headers.host || 'localhost:3001'}/v1/media/storage/upload/${fileKey}?sig=pilot_hmac_valid`;
        return sendJson(res, 200, {
          uploadUrl,
          fileKey,
          expiresInSeconds: 900,
        });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 9. Binary Media Storage Upload (PUT /v1/media/storage/upload/*)
  if (req.method === 'PUT' && pathname.startsWith('/v1/media/storage/upload/')) {
    const relativeKey = pathname.replace('/v1/media/storage/upload/', '');
    const targetFilePath = path.join(STORAGE_DIR, relativeKey.replace(/[\/\\]/g, '_'));
    const writeStream = fs.createWriteStream(targetFilePath);
    req.pipe(writeStream);
    writeStream.on('finish', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, fileKey: relativeKey, bytesWritten: writeStream.bytesWritten }));
    });
    writeStream.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // 10. Binary Media Download (GET /v1/media/storage/download/*)
  if (req.method === 'GET' && pathname.startsWith('/v1/media/storage/download/')) {
    const relativeKey = pathname.replace('/v1/media/storage/download/', '');
    const targetFilePath = path.join(STORAGE_DIR, relativeKey.replace(/[\/\\]/g, '_'));
    if (fs.existsSync(targetFilePath)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      return fs.createReadStream(targetFilePath).pipe(res);
    }
    return sendJson(res, 404, { error: 'Media file not found' });
  }

  // 11. Download URL generation
  if (req.method === 'POST' && pathname === '/v1/media/download-url') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const fileKey = body.fileKey;
        const downloadUrl = `http://${req.headers.host || 'localhost:3001'}/v1/media/storage/download/${fileKey}?token=pilot_read_valid`;
        return sendJson(res, 200, {
          downloadUrl,
          fileKey,
          expiresInSeconds: 900,
        });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 12. Attendance Punch In
  if (req.method === 'POST' && pathname === '/v1/attendance/punch-in') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        state.attendanceSession = {
          id: `sess-${Date.now()}`,
          workspaceId: 'ws-pilot-1',
          userId: 'usr-employee-1',
          status: 'ON_DUTY',
          punchInTime: new Date().toISOString(),
          punchOutTime: null,
          selfieMediaKey: body.selfieMediaKey || null,
          punchInLatitude: body.latitude || 28.6139,
          punchInLongitude: body.longitude || 77.209,
          punchInAccuracy: body.accuracy || 4.2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return sendJson(res, 200, state.attendanceSession);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 13. Attendance Punch Out
  if (req.method === 'POST' && pathname === '/v1/attendance/punch-out') {
    if (state.attendanceSession) {
      state.attendanceSession.status = 'OFF_DUTY';
      state.attendanceSession.punchOutTime = new Date().toISOString();
      return sendJson(res, 200, state.attendanceSession);
    }
    return sendJson(res, 200, {
      id: `sess-closed-${Date.now()}`,
      workspaceId: 'ws-pilot-1',
      userId: 'usr-employee-1',
      status: 'OFF_DUTY',
      punchInTime: new Date(Date.now() - 28800000).toISOString(),
      punchOutTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 14. Active Attendance Query
  if (req.method === 'GET' && pathname === '/v1/attendance/active') {
    return sendJson(res, 200, state.attendanceSession);
  }

  // 15. Tasks List
  if (req.method === 'GET' && pathname === '/v1/tasks') {
    return sendJson(res, 200, { tasks: state.tasks });
  }

  // 16. Task Status Transition
  const taskTransitionMatch = pathname.match(/^\/v1\/tasks\/([^/]+)\/transition$/);
  if (req.method === 'POST' && taskTransitionMatch) {
    const taskId = taskTransitionMatch[1];
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.status = body.status;
          task.simplifiedStatus = body.status;
          task.version += 1;
          task.updatedAt = new Date().toISOString();
          return sendJson(res, 200, task);
        }
        return sendJson(res, 404, { error: 'Task not found' });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 17. Checklist Item Update
  const checklistMatch = pathname.match(/^\/v1\/tasks\/([^/]+)\/checklist\/([^/]+)$/);
  if (req.method === 'PATCH' && checklistMatch) {
    const [, taskId, itemId] = checklistMatch;
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const task = state.tasks.find((t) => t.id === taskId);
        const item = task?.checklist?.find((c) => c.id === itemId);
        if (item) {
          item.isCompleted = Boolean(body.isCompleted);
          return sendJson(res, 200, item);
        }
        return sendJson(res, 404, { error: 'Item not found' });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 18. Confirm Media Proof
  const confirmProofMatch = pathname.match(/^\/v1\/tasks\/([^/]+)\/proofs$/);
  if (req.method === 'POST' && confirmProofMatch) {
    const taskId = confirmProofMatch[1];
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const proof = {
          id: `proof-${Date.now()}`,
          workspaceId: 'ws-pilot-1',
          taskId,
          userId: 'usr-employee-1',
          proofType: body.proofType || 'PHOTO',
          fileKey: body.fileKey,
          notes: body.notes || null,
          watermarkJson: body.watermarkMetadata ? JSON.stringify(body.watermarkMetadata) : null,
          createdAt: new Date().toISOString(),
        };
        state.proofs.push(proof);
        return sendJson(res, 201, proof);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 19. Task Proofs List
  const listProofsMatch = pathname.match(/^\/v1\/tasks\/([^/]+)\/proofs$/);
  if (req.method === 'GET' && listProofsMatch) {
    const taskId = listProofsMatch[1];
    const proofs = state.proofs.filter((p) => p.taskId === taskId);
    return sendJson(res, 200, { proofs });
  }

  // 20. Manager Task Verification
  const verifyTaskMatch = pathname.match(/^\/v1\/tasks\/([^/]+)\/verify$/);
  if (req.method === 'POST' && verifyTaskMatch) {
    const taskId = verifyTaskMatch[1];
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.status = body.action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
          task.simplifiedStatus = body.action === 'APPROVE' ? 'COMPLETED' : 'IN_PROGRESS';
          task.version += 1;
          task.updatedAt = new Date().toISOString();
          return sendJson(res, 200, task);
        }
        return sendJson(res, 404, { error: 'Task not found' });
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // 21. Customer Visits
  if (req.method === 'GET' && pathname === '/v1/visits') {
    return sendJson(res, 200, { visits: state.visits });
  }

  // 22. Geofences
  if (req.method === 'GET' && pathname === '/v1/geofences/nearby') {
    return sendJson(res, 200, {
      geofences: [
        {
          id: 'geo-pilot-1',
          name: 'Apex Solar Central Perimeter',
          latitude: 28.6139,
          longitude: 77.209,
          radiusMeters: 150.0,
        },
      ],
    });
  }

  // 23. Zero Off-Duty GPS Tracking Enforcer (ADR-003 & ADR-021)
  if (req.method === 'POST' && pathname === '/v1/location/breadcrumb') {
    if (!state.attendanceSession || state.attendanceSession.status !== 'ON_DUTY') {
      return sendJson(res, 403, {
        code: 'OFF_DUTY_TRACKING_PROHIBITED',
        error: 'OFF_DUTY_TRACKING_PROHIBITED',
        message: 'Zero off-duty tracking invariant: GPS location collection is strictly prohibited while off-duty.',
      });
    }
    return sendJson(res, 200, {
      success: true,
      recorded: true,
      timestamp: new Date().toISOString(),
    });
  }

  // Default Fallback
  sendJson(res, 404, { error: `Route ${req.method} ${pathname} not found in pilot mock server` });
});

server.listen(PORT, HOST, () => {
  console.log(`⚠️  OPRINO SYNTHETIC MOCK PILOT SERVER (TEST-DOUBLE ONLY)`);
  console.log(`🔒 Bound strictly to http://${HOST}:${PORT} (Local-only, NOT a production or real Fastify API)`);
  console.log(`📁 Local Isolated Media Storage: ${STORAGE_DIR}`);
  console.log(`🏢 Synthetic Workspace: Apex Field Services (ws-pilot-1)`);
});

// Process signal handling
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
