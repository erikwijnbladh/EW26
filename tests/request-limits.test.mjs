import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readJson, readText } from '../src/lib/request-body.ts';
import { createRateLimit } from '../src/lib/rate-limit.ts';
const request = (body, headers = {}) => new Request('https://example.com', { method: 'POST', body, headers, duplex: 'half' });
test('rejects oversized bodies even without Content-Length, counting UTF-8 bytes', async () => {
  await assert.rejects(readText(request('ééé'), 5), { status: 413 });
  assert.equal(await readText(request('éé'), 4), 'éé');
});
test('rejects a lying content length and cancels chunked bodies at the cap', async () => {
  let cancelled = false;
  const body = new ReadableStream({ pull(c) { c.enqueue(new TextEncoder().encode('1234')); }, cancel() { cancelled = true; } });
  await assert.rejects(readText(request(body, { 'content-length': '1' }), 5), { status: 413 });
  assert.equal(cancelled, true);
});
test('requires JSON and reports malformed input', async () => {
  await assert.rejects(readJson(request('{}'), 10), { status: 415 });
  await assert.rejects(readJson(request('{', { 'content-type': 'application/json' }), 10), { status: 400 });
  assert.deepEqual(await readJson(request('{}', { 'content-type': 'application/json; charset=utf-8' }), 10), {});
});
test('bounded rate limiter preserves active budgets and expires them', () => {
  let now = 0;
  const allowed = createRateLimit(2, 100, { maxClients: 2, now: () => now });
  const r = (ip) => new Request('https://example.com', { headers: { 'x-forwarded-for': ip } });
  assert.equal(allowed(r('a')), true); assert.equal(allowed(r('a')), true);
  assert.equal(allowed(r('a')), false); assert.equal(allowed(r('b')), true);
  assert.equal(allowed(r('c')), false); assert.equal(allowed(r('a')), false);
  now = 100;
  assert.equal(allowed(r('c')), true); assert.equal(allowed(r('a')), true);
});
