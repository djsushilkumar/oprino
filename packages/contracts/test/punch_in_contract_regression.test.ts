import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PunchInRequestSchema, AttendanceSessionResponseSchema } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

test('Attendance Contract & Dart Client Synchronization Regression Test', async (t) => {
  await t.test('PunchInRequestSchema defines all required and optional attendance fields', () => {
    const shape = PunchInRequestSchema.shape;
    assert.ok(shape.idempotencyKey, 'idempotencyKey must be present in PunchInRequestSchema');
    assert.ok(shape.shiftId, 'shiftId must be present in PunchInRequestSchema');
    assert.ok(shape.note, 'note must be present in PunchInRequestSchema');
    assert.ok(shape.selfieMediaKey, 'selfieMediaKey must be present in PunchInRequestSchema');
    assert.ok(shape.latitude, 'latitude must be present in PunchInRequestSchema');
    assert.ok(shape.longitude, 'longitude must be present in PunchInRequestSchema');
    assert.ok(shape.accuracy, 'accuracy must be present in PunchInRequestSchema');
  });

  await t.test(
    'AttendanceSessionResponseSchema contains selfie and GPS location attributes',
    () => {
      const shape = AttendanceSessionResponseSchema.shape;
      assert.ok(
        shape.selfieMediaKey,
        'selfieMediaKey must be present in AttendanceSessionResponseSchema',
      );
      assert.ok(
        shape.punchInLatitude,
        'punchInLatitude must be present in AttendanceSessionResponseSchema',
      );
      assert.ok(
        shape.punchInLongitude,
        'punchInLongitude must be present in AttendanceSessionResponseSchema',
      );
      assert.ok(
        shape.punchInAccuracy,
        'punchInAccuracy must be present in AttendanceSessionResponseSchema',
      );
    },
  );

  await t.test('Generated api_client.dart punchIn signature and body match contract fields', () => {
    const apiClientPath = path.resolve(rootDir, 'generated/dart-api/lib/src/api_client.dart');
    assert.ok(fs.existsSync(apiClientPath), `api_client.dart must exist at ${apiClientPath}`);

    const apiClientContent = fs.readFileSync(apiClientPath, 'utf-8');

    // Verify method signature contains all expected parameters
    const expectedParams = [
      'required String idempotencyKey',
      'String? shiftId',
      'String? note',
      'String? selfieMediaKey',
      'double? latitude',
      'double? longitude',
      'double? accuracy',
    ];

    for (const param of expectedParams) {
      assert.ok(
        apiClientContent.includes(param),
        `api_client.dart punchIn signature must contain parameter: "${param}"`,
      );
    }

    // Verify serialization payload contains all expected keys
    const expectedPayloadKeys = [
      "'idempotencyKey': idempotencyKey",
      "if (shiftId != null) 'shiftId': shiftId",
      "if (note != null) 'note': note",
      "if (selfieMediaKey != null) 'selfieMediaKey': selfieMediaKey",
      "if (latitude != null) 'latitude': latitude",
      "if (longitude != null) 'longitude': longitude",
      "if (accuracy != null) 'accuracy': accuracy",
    ];

    for (const key of expectedPayloadKeys) {
      assert.ok(
        apiClientContent.includes(key),
        `api_client.dart punchIn payload must serialize key: "${key}"`,
      );
    }
  });

  await t.test(
    'Mobile SyncService punchIn call parameters are fully defined in Dart API client',
    () => {
      const syncServicePath = path.resolve(rootDir, 'apps/mobile/lib/core/sync/sync_service.dart');
      assert.ok(
        fs.existsSync(syncServicePath),
        `sync_service.dart must exist at ${syncServicePath}`,
      );

      const syncServiceContent = fs.readFileSync(syncServicePath, 'utf-8');
      const apiClientContent = fs.readFileSync(
        path.resolve(rootDir, 'generated/dart-api/lib/src/api_client.dart'),
        'utf-8',
      );

      // Extract the client.punchIn call block from sync_service.dart
      const punchInMatch = syncServiceContent.match(/await\s+client\.punchIn\s*\(([\s\S]*?)\);/);
      assert.ok(punchInMatch, 'sync_service.dart must contain a call to client.punchIn(...)');

      const callBody = punchInMatch[1];
      // Extract parameter names: e.g. "idempotencyKey:", "selfieMediaKey:"
      const argNames = [...callBody.matchAll(/([a-zA-Z0-9_]+)\s*:/g)].map((m) => m[1]);

      // Extract punchIn method definition from api_client.dart
      const methodDefMatch = apiClientContent.match(
        /Future<AttendanceSessionResponse>\s+punchIn\s*\(\{([\s\S]*?)\}\)\s*async/,
      );
      assert.ok(methodDefMatch, 'api_client.dart must declare punchIn method');

      const methodDef = methodDefMatch[1];

      for (const arg of argNames) {
        const regex = new RegExp(`\\b${arg}\\b`);
        assert.ok(
          regex.test(methodDef),
          `Named argument "${arg}" used in sync_service.dart is NOT defined in api_client.dart punchIn method!`,
        );
      }
    },
  );
});
