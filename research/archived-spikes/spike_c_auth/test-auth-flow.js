import { createAuthService } from './server.js';
import assert from 'node:assert/strict';

async function runValidation() {
  console.log('=== STARTING SPIKE C: BETTER AUTH & FLUTTER CREDENTIAL VALIDATION ===');
  const { app, db, auth } = createAuthService();

  const address = await app.listen({ port: 3088, host: '127.0.0.1' });
  console.log(`Test auth server running at ${address}`);

  const baseUrl = 'http://127.0.0.1:3088';

  // Emulate Flutter Secure Storage with Namespacing
  const secureStorage = {
    authSession: new Map(), // Namespace: oprino_auth_session
    installation: new Map(), // Namespace: oprino_installation

    setSessionToken(token) {
      this.authSession.set('session_token', token);
    },
    getSessionToken() {
      return this.authSession.get('session_token');
    },
    clearSession() {
      this.authSession.clear();
    },

    setInstallationId(id) {
      this.installation.set('installation_id', id);
    },
    getInstallationId() {
      return this.installation.get('installation_id');
    },
  };

  try {
    // 1. Sign Up & Sign In via Better Auth
    console.log('\n--- 1. User Sign Up ---');
    const signupRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'technician.rajesh@acme.com',
        password: 'securePassword123!',
        name: 'Rajesh Sharma',
      }),
    });
    assert.strictEqual(signupRes.status, 200, 'Sign up should succeed with HTTP 200');
    const signupData = await signupRes.json();
    console.log(`[PASS] User created: ${signupData.user.id} (${signupData.user.email})`);

    // 2. Sign In and Obtain Better Auth Bearer Token
    console.log('\n--- 2. Sign In & Obtain Bearer Credential ---');
    const signinRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'technician.rajesh@acme.com',
        password: 'securePassword123!',
      }),
    });
    assert.strictEqual(signinRes.status, 200, 'Sign in should succeed');
    const signinData = await signinRes.json();
    const bearerToken = signinData.token;
    assert.ok(bearerToken, 'Bearer token must be returned in response');
    console.log(`[PASS] Opaque Bearer token received: ${bearerToken.substring(0, 16)}...`);

    // 3. Persist to Secure Storage (Separate Namespaces)
    console.log('\n--- 3. Secure Storage Persistence ---');
    secureStorage.setSessionToken(bearerToken);
    const installationId1 = 'inst_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    secureStorage.setInstallationId(installationId1);

    assert.strictEqual(secureStorage.getSessionToken(), bearerToken);
    assert.strictEqual(secureStorage.getInstallationId(), installationId1);
    console.log('[PASS] Session token and Installation ID isolated across namespaces');

    // 4. Device Registration with Oprino Backend
    console.log('\n--- 4. Device Installation Registration ---');
    const regRes = await fetch(`${baseUrl}/v1/devices/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secureStorage.getSessionToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installationId: secureStorage.getInstallationId(),
        workspaceId: 'ws_acme_corp',
        deviceModel: 'Samsung Galaxy A15',
        osVersion: 'Android 14 (API 34)',
      }),
    });
    assert.strictEqual(regRes.status, 200, 'Device registration must return 200');
    const regData = await regRes.json();
    assert.strictEqual(regData.status, 'APPROVED');
    console.log(`[PASS] Installation ${installationId1} approved for workspace ws_acme_corp`);

    // 5. Authenticated Domain Request with Bearer and X-Installation-Id
    console.log('\n--- 5. Authenticated Resource Access ---');
    const meRes = await fetch(`${baseUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${secureStorage.getSessionToken()}`,
        'X-Installation-Id': secureStorage.getInstallationId(),
      },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, 'technician.rajesh@acme.com');
    assert.strictEqual(meData.session.activeWorkspaceId, 'ws_acme_corp');
    console.log(`[PASS] Authenticated request verified: ${meData.user.name} on workspace ${meData.session.activeWorkspaceId}`);

    // 6. Workspace Switching
    console.log('\n--- 6. Workspace Switch ---');
    const switchRes = await fetch(`${baseUrl}/v1/workspaces/switch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secureStorage.getSessionToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetWorkspaceId: 'ws_apex_logistics' }),
    });
    assert.strictEqual(switchRes.status, 200);
    const switchData = await switchRes.json();
    assert.strictEqual(switchData.activeWorkspaceId, 'ws_apex_logistics');

    const meAfterSwitch = await (await fetch(`${baseUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${secureStorage.getSessionToken()}`,
        'X-Installation-Id': secureStorage.getInstallationId(),
      },
    })).json();
    assert.strictEqual(meAfterSwitch.session.activeWorkspaceId, 'ws_apex_logistics');
    console.log('[PASS] Workspace switched dynamically to ws_apex_logistics');

    // 7. Expired Session Validation
    console.log('\n--- 7. Expired Session Handling ---');
    // Artificially expire the session in the database
    db.prepare('UPDATE session SET expiresAt = ? WHERE token = ?').run(Date.now() - 1000, bearerToken);
    const expiredRes = await fetch(`${baseUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'X-Installation-Id': secureStorage.getInstallationId(),
      },
    });
    assert.strictEqual(expiredRes.status, 401, 'Expired session must return HTTP 401');
    console.log('[PASS] Expired session rejected with HTTP 401');

    // Restore session expiration for remaining tests
    db.prepare('UPDATE session SET expiresAt = ? WHERE token = ?').run(Date.now() + 86400000, bearerToken);

    // 8. Administrative Device Revocation (Lost Phone Scenario)
    console.log('\n--- 8. Administrator Device Revocation ---');
    const adminRevokeRes = await fetch(`${baseUrl}/v1/admin/devices/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installationId: installationId1 }),
    });
    assert.strictEqual(adminRevokeRes.status, 200);

    const revokedDeviceRes = await fetch(`${baseUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'X-Installation-Id': installationId1,
      },
    });
    assert.strictEqual(revokedDeviceRes.status, 401, 'Revoked installation session must be purged/rejected with HTTP 401');
    console.log('[PASS] Revoked installation immediately blocked from accessing protected APIs');

    // 9. Reinstall Behavior / New Installation ID
    console.log('\n--- 9. App Reinstall with New Installation ID ---');
    // Technician acquires new phone or reinstalls app -> Secure storage reset -> new Installation ID
    const installationId2 = 'inst_f47ac10b-58cc-4372-a567-0e02b2c3d479';
    secureStorage.clearSession();
    secureStorage.setInstallationId(installationId2);

    // Sign in afresh
    const reSigninRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'technician.rajesh@acme.com',
        password: 'securePassword123!',
      }),
    });
    const newSessionToken = (await reSigninRes.json()).token;
    secureStorage.setSessionToken(newSessionToken);

    const regNewDeviceRes = await fetch(`${baseUrl}/v1/devices/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${newSessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installationId: installationId2,
        workspaceId: 'ws_acme_corp',
        deviceModel: 'Xiaomi Redmi Note 13',
        osVersion: 'Android 14',
      }),
    });
    assert.strictEqual(regNewDeviceRes.status, 200);
    console.log(`[PASS] Reinstall produced new installation ${installationId2}, registered without conflict`);

    // 10. Sign Out
    console.log('\n--- 10. Sign Out Handling ---');
    const signoutRes = await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${newSessionToken}`,
      },
    });
    assert.strictEqual(signoutRes.status, 200);
    secureStorage.clearSession();
    console.log('[PASS] Signed out successfully, client credentials cleared');

    // 11. Session Replay Protection
    console.log('\n--- 11. Replay Protection ---');
    const replayRes = await fetch(`${baseUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${newSessionToken}`,
        'X-Installation-Id': installationId2,
      },
    });
    assert.strictEqual(replayRes.status, 401, 'Replaying signed-out token must be rejected with HTTP 401');
    console.log('[PASS] Replay of signed-out session rejected with HTTP 401');

    console.log('\n=== SPIKE C VALIDATION COMPLETE: ALL 11 TESTS PASSED ===');
  } finally {
    await app.close();
  }
}

runValidation().catch((err) => {
  console.error('\n[FAIL] Spike C failed:', err);
  process.exit(1);
});
