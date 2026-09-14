import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse, send } from '../src/lib/contact.ts';
const valid = { name: 'Erik', email: 'visitor@example.com', message: 'Hello' };
test('rejects over-limit fields instead of silently truncating the message or reply address', () => {
  for (const [field, value] of [['name', 'x'.repeat(101)], ['email', 'x'.repeat(200) + '@example.com'], ['message', 'x'.repeat(5001)]]) {
    assert.equal(parse({ ...valid, [field]: value }).ok, false);
  }
  assert.equal(parse({ ...valid, message: 'x'.repeat(5000) }).value.message.length, 5000);
  assert.deepEqual(parse({ email: ' visitor@example.com ', message: ' Hello ' }).value, { name: '', email: 'visitor@example.com', message: 'Hello' });
});
test('passes a stable idempotency key to Resend so retries cannot send duplicates', async (t) => {
  const saved = { ...process.env };
  t.after(() => { process.env = saved; });
  process.env.RESEND_API_KEY = 're_test';
  process.env.PUBLIC_EMAIL = 'sender@example.com';
  process.env.FORWARD_TO = 'inbox@example.com';
  const keys = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    keys.push(new Headers(init.headers).get('idempotency-key'));
    return Response.json({ id: 'same-delivery' });
  });
  assert.equal((await send(valid, 'same-submission')).ok, true);
  assert.equal((await send(valid, 'same-submission')).ok, true);
  assert.deepEqual(keys, ['contact/same-submission', 'contact/same-submission']);
});
