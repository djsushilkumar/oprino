import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import { eq, and } from 'drizzle-orm';
import * as schema from '@oprino/database/schema';

describe('Phase 03: Field Operations, Customer Sites, Visits & Proof of Work Integration Tests', () => {
  const { app, dbClient } = buildServer({
    env: { NODE_ENV: 'test' },
    logger: false,
  });
  const db = dbClient.db;

  const ownerAEmail = `owner.field.a.${Date.now()}@example.com`;
  const employeeAEmail = `employee.field.a.${Date.now()}@example.com`;
  const ownerBEmail = `owner.field.b.${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  let tokenOwnerA: string;
  let userOwnerAId: string;
  let workspaceAId: string;

  let tokenEmployeeA: string;
  let userEmployeeAId: string;

  let tokenOwnerB: string;
  let workspaceBId: string;

  let customer1Id: string;
  let site1Id: string;
  let task1Id: string;
  let visit1Id: string;

  before(async () => {
    await app.ready();

    // 1. Sign up Owner A & Create Workspace A
    const resA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: ownerAEmail, password, name: 'Owner Alpha' },
    });
    const bodyA = resA.json();
    tokenOwnerA = bodyA.token;
    userOwnerAId = bodyA.user.id;

    const wsResA = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerA}` },
      payload: { name: 'Alpha Field Services' },
    });
    workspaceAId = wsResA.json().id;

    // 2. Sign up Employee A & Add to Workspace A
    const resEmpA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: employeeAEmail, password, name: 'Tech Jane' },
    });
    const bodyEmpA = resEmpA.json();
    tokenEmployeeA = bodyEmpA.token;
    userEmployeeAId = bodyEmpA.user.id;

    const [empRoleA] = await db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.workspaceId, workspaceAId), eq(schema.roles.name, 'Employee')));

    await db.insert(schema.workspaceMemberships).values({
      workspaceId: workspaceAId,
      userId: userEmployeeAId,
      roleId: empRoleA.id,
      status: 'active',
    });

    // 3. Sign up Owner B & Create Workspace B
    const resB = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: ownerBEmail, password, name: 'Owner Beta' },
    });
    const bodyB = resB.json();
    tokenOwnerB = bodyB.token;

    const wsResB = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerB}` },
      payload: { name: 'Beta Competitor Corp' },
    });
    workspaceBId = wsResB.json().id;
  });

  after(async () => {
    await app.close();
  });

  describe('1. Customers & Customer Sites Domain', () => {
    test('Owner A creates customer and physical site in Workspace A', async () => {
      // Create Customer
      const resCust = await app.inject({
        method: 'POST',
        url: '/v1/customers',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          name: 'Apex Industrial Hub',
          companyName: 'Apex Holdings',
          email: 'facilities@apex.com',
          phone: '+1-555-0101',
          notes: 'Premier HVAC maintenance client',
        },
      });

      assert.equal(resCust.statusCode, 201);
      const cust = resCust.json();
      assert.equal(cust.name, 'Apex Industrial Hub');
      assert.equal(cust.workspaceId, workspaceAId);
      customer1Id = cust.id;

      // Create Site for Customer
      const resSite = await app.inject({
        method: 'POST',
        url: `/v1/customers/${customer1Id}/sites`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          name: 'North Logistics Depot',
          address: '742 Evergreen Terrace, Springfield',
          latitude: 28.6139,
          longitude: 77.209,
          geofenceRadiusMeters: 150.0,
          contactName: 'Site Foreman',
          contactPhone: '+1-555-0102',
        },
      });

      assert.equal(resSite.statusCode, 201);
      const site = resSite.json();
      assert.equal(site.name, 'North Logistics Depot');
      assert.equal(site.customerId, customer1Id);
      assert.equal(site.geofenceRadiusMeters, 150.0);
      site1Id = site.id;
    });

    test('Owner A lists customers and sites with correct data', async () => {
      const resListCust = await app.inject({
        method: 'GET',
        url: '/v1/customers',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      assert.equal(resListCust.statusCode, 200);
      const custList = resListCust.json();
      assert.equal(custList.total, 1);
      assert.equal(custList.customers[0].id, customer1Id);

      const resListSites = await app.inject({
        method: 'GET',
        url: `/v1/customers/${customer1Id}/sites`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      assert.equal(resListSites.statusCode, 200);
      const siteList = resListSites.json();
      assert.equal(siteList.total, 1);
      assert.equal(siteList.sites[0].id, site1Id);
    });

    test('Cross-tenant isolation: Workspace B cannot view Workspace A customers or sites', async () => {
      // Workspace B lists customers
      const resB = await app.inject({
        method: 'GET',
        url: '/v1/customers',
        headers: {
          authorization: `Bearer ${tokenOwnerB}`,
          'x-workspace-id': workspaceBId,
        },
      });
      assert.equal(resB.statusCode, 200);
      assert.equal(resB.json().total, 0);

      // Workspace B tries to GET Workspace A customer
      const resGetA = await app.inject({
        method: 'GET',
        url: `/v1/customers/${customer1Id}`,
        headers: {
          authorization: `Bearer ${tokenOwnerB}`,
          'x-workspace-id': workspaceBId,
        },
      });
      assert.equal(resGetA.statusCode, 404);

      // Workspace B tries to GET Workspace A customer sites
      const resGetSitesA = await app.inject({
        method: 'GET',
        url: `/v1/customers/${customer1Id}/sites`,
        headers: {
          authorization: `Bearer ${tokenOwnerB}`,
          'x-workspace-id': workspaceBId,
        },
      });
      assert.equal(resGetSitesA.statusCode, 404);
    });
  });

  describe('2. Field Visits & GPS Check-In/Out Lifecycle', () => {
    test('Owner A creates a visit linked to Customer, Site, and Tech Jane', async () => {
      // First create a task in Workspace A with requiresPhotoProof & requiresSignature
      const resTask = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          title: 'Quarterly Chiller Servicing',
          description: 'Full inspection, oil change, and filter replacement',
          customerId: customer1Id,
          siteId: site1Id,
          requiresPhotoProof: true,
          requiresSignature: true,
          assigneeIds: [userEmployeeAId],
          checklist: [
            'Lockout electrical breaker',
            'Inspect compressor pressure',
            'Replace intake filters',
          ],
        },
      });
      assert.equal(resTask.statusCode, 201);
      task1Id = resTask.json().id;

      // Create Visit
      const resVisit = await app.inject({
        method: 'POST',
        url: '/v1/visits',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          customerId: customer1Id,
          siteId: site1Id,
          taskId: task1Id,
          userId: userEmployeeAId,
          plannedAt: new Date(Date.now() + 3600000).toISOString(),
          notes: 'Call reception upon arrival',
        },
      });

      assert.equal(resVisit.statusCode, 201);
      const visit = resVisit.json();
      assert.equal(visit.status, 'PLANNED');
      assert.equal(visit.customerId, customer1Id);
      assert.equal(visit.siteId, site1Id);
      assert.equal(visit.taskId, task1Id);
      assert.equal(visit.userId, userEmployeeAId);
      visit1Id = visit.id;
    });

    test('Employee A checks in with GPS coordinates', async () => {
      const resCheckIn = await app.inject({
        method: 'POST',
        url: `/v1/visits/${visit1Id}/check-in`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 5.0,
          notes: 'Checked in at security desk',
        },
      });

      assert.equal(resCheckIn.statusCode, 200);
      const visit = resCheckIn.json();
      assert.equal(visit.status, 'CHECKED_IN');
      assert.ok(visit.checkInTime);
      assert.equal(visit.checkInLatitude, 28.6139);
      assert.equal(visit.checkInLongitude, 77.209);
    });

    test('Employee A checks out with GPS coordinates and calculates duration', async () => {
      const resCheckOut = await app.inject({
        method: 'POST',
        url: `/v1/visits/${visit1Id}/check-out`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          latitude: 28.614,
          longitude: 77.2091,
          accuracy: 4.5,
          notes: 'Job completed on site',
        },
      });

      assert.equal(resCheckOut.statusCode, 200);
      const visit = resCheckOut.json();
      assert.equal(visit.status, 'CHECKED_OUT');
      assert.ok(visit.checkOutTime);
      assert.equal(visit.checkOutLatitude, 28.614);
      assert.equal(visit.checkOutLongitude, 77.2091);
      assert.ok(visit.durationMinutes >= 0);
    });
  });

  describe('3. Proof of Work & ADR-012 Pre-Signed Direct Upload', () => {
    let photoKey: string;
    let signatureKey: string;

    test('Request pre-signed upload URL enforces workspace prefix partitioning', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/media/upload-url',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          taskId: task1Id,
          visitId: visit1Id,
          proofType: 'PHOTO',
          fileName: 'compressor_pressure.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 245000,
        },
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.ok(body.uploadUrl);
      assert.ok(body.fileKey.startsWith(`${workspaceAId}/proofs/${task1Id}/`));
      photoKey = body.fileKey;
    });

    test('Security barrier: cross-tenant fileKey confirmation rejected with 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/media/confirm',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          taskId: task1Id,
          proofType: 'PHOTO',
          fileKey: `${workspaceBId}/proofs/other-task/malicious.jpg`, // Spoofed workspace prefix!
        },
      });

      assert.equal(res.statusCode, 403);
    });

    test('Confirm photo proof and signature proof successfully recorded', async () => {
      // Upload photo binary to storage
      await app.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(photoKey)}`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from('fake-jpeg-photo-bytes-for-test'),
      });

      // 1. Confirm Photo Proof
      const resPhoto = await app.inject({
        method: 'POST',
        url: '/v1/media/confirm',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          taskId: task1Id,
          visitId: visit1Id,
          proofType: 'PHOTO',
          fileKey: photoKey,
          fileSizeBytes: 245000,
          mimeType: 'image/jpeg',
          watermarkMetadata: {
            latitude: 28.6139,
            longitude: 77.209,
            timestamp: new Date().toISOString(),
            accuracyMeters: 5.0,
          },
          notes: 'Pressure gauge at 45 PSI within operational limits',
        },
      });

      assert.equal(resPhoto.statusCode, 201);
      const photoProof = resPhoto.json();
      assert.equal(photoProof.proofType, 'PHOTO');
      assert.equal(photoProof.taskId, task1Id);
      assert.ok(photoProof.fileUrl);

      // 2. Request & Confirm Signature Proof
      const resSigUrl = await app.inject({
        method: 'POST',
        url: '/v1/media/upload-url',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          taskId: task1Id,
          visitId: visit1Id,
          proofType: 'SIGNATURE',
          fileName: 'customer_signature.png',
          mimeType: 'image/png',
        },
      });
      signatureKey = resSigUrl.json().fileKey;

      // Upload signature binary to storage
      await app.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(signatureKey)}`,
        headers: { 'content-type': 'image/png' },
        payload: Buffer.from('fake-png-signature-bytes-for-test'),
      });

      const resSig = await app.inject({
        method: 'POST',
        url: '/v1/media/confirm',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          taskId: task1Id,
          visitId: visit1Id,
          proofType: 'SIGNATURE',
          fileKey: signatureKey,
          signerName: 'Alice Customer Lead',
          signerPhone: '+1-555-0101',
          watermarkMetadata: {
            signedAt: new Date().toISOString(),
          },
          notes: 'Customer signed digitally on mobile glass',
        },
      });

      assert.equal(resSig.statusCode, 201);
      const sigProof = resSig.json();
      assert.equal(sigProof.proofType, 'SIGNATURE');
      assert.equal(sigProof.signerName, 'Alice Customer Lead');

      // 3. Query proofs for task
      const resProofs = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${task1Id}/proofs`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
      });

      assert.equal(resProofs.statusCode, 200);
      assert.equal(resProofs.json().proofs.length, 2);
    });
  });

  describe('4. Mandatory Completion Invariants & Verification Workflow', () => {
    test('Attempting to complete task with incomplete checklist fails with 400', async () => {
      // First advance task status to IN_PROGRESS
      // ASSIGNED -> ACCEPTED
      const resAcc = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/transition`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'ACCEPTED', version: 1 },
      });
      assert.equal(resAcc.statusCode, 200);

      // ACCEPTED -> IN_PROGRESS
      const resProg = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/transition`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'IN_PROGRESS', version: 2 },
      });
      assert.equal(resProg.statusCode, 200);

      // Attempt IN_PROGRESS -> COMPLETED without completing checklist
      const resFailComp = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/transition`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'COMPLETED', version: 3 },
      });

      assert.equal(resFailComp.statusCode, 400);
      assert.match(resFailComp.json().message, /checklist/i);
    });

    test('Completing all checklist items allows transition to COMPLETED', async () => {
      // Fetch task to get checklist item IDs
      const taskRes = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${task1Id}`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      const currentTask = taskRes.json();

      // Check off each item
      for (const item of currentTask.checklist) {
        const checkRes = await app.inject({
          method: 'PATCH',
          url: `/v1/tasks/${task1Id}/checklist/${item.id}`,
          headers: {
            authorization: `Bearer ${tokenEmployeeA}`,
            'x-workspace-id': workspaceAId,
          },
          payload: { isCompleted: true },
        });
        assert.equal(checkRes.statusCode, 200);
      }

      // Re-fetch current version
      const freshTaskRes = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${task1Id}`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      const freshTask = freshTaskRes.json();

      // Now IN_PROGRESS -> COMPLETED succeeds (proofs already confirmed!)
      const resComp = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/transition`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'COMPLETED', version: freshTask.version },
      });

      assert.equal(resComp.statusCode, 200);
      assert.equal(resComp.json().status, 'COMPLETED');
    });

    test('Manager verification queue: rejection reverts to IN_PROGRESS, verification completes lifecycle', async () => {
      // 1. Employee cannot verify (403)
      const resEmpVerify = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/verify`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { action: 'VERIFY', notes: 'Looks good' },
      });
      assert.equal(resEmpVerify.statusCode, 403);

      // 2. Manager rejects task: reverts to IN_PROGRESS
      const resReject = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/verify`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { action: 'REJECT', notes: 'Please provide clearer photo of the relief valve' },
      });
      assert.equal(resReject.statusCode, 200);
      const rejectedTask = resReject.json();
      assert.equal(rejectedTask.status, 'IN_PROGRESS');
      assert.equal(
        rejectedTask.verificationNotes,
        'Please provide clearer photo of the relief valve',
      );

      // 3. Employee completes task again
      const resReComplete = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/transition`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'COMPLETED', version: rejectedTask.version },
      });
      assert.equal(resReComplete.statusCode, 200);
      assert.equal(resReComplete.json().status, 'COMPLETED');

      // 4. Manager verifies task: transitions to VERIFIED
      const resVerify = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task1Id}/verify`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { action: 'VERIFY', notes: 'Relief valve photo verified, signature confirmed.' },
      });
      assert.equal(resVerify.statusCode, 200);
      const verifiedTask = resVerify.json();
      assert.equal(verifiedTask.status, 'VERIFIED');
      assert.equal(verifiedTask.verifiedBy, userOwnerAId);
      assert.equal(verifiedTask.verifierName, 'Owner Alpha');
      assert.ok(verifiedTask.verifiedAt);
      assert.equal(
        verifiedTask.verificationNotes,
        'Relief valve photo verified, signature confirmed.',
      );
    });
  });
});
