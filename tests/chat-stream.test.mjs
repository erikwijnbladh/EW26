import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readChatStream, createAnswerStream } from '../src/lib/chat-stream.ts';
const stream = (chunks) => new ReadableStream({ start(c) { for (const chunk of chunks) c.enqueue(chunk); c.close(); } });
const bytes = (s) => new TextEncoder().encode(s);
test('decodes UTF-8 across arbitrary byte boundaries and accepts a final done without newline', async () => {
  const input = bytes('{"type":"delta","text":"Hej 👋"}\n{"type":"done"}');
  const events = [];
  await readChatStream(stream([...input].map((b) => Uint8Array.of(b))), (e) => events.push(e));
  assert.equal(events[0].text, 'Hej 👋');
});
test('EOF without done and malformed data fail visibly', async () => {
  await assert.rejects(readChatStream(stream([bytes('{"type":"delta","text":"half"}\n')]), () => {}), /interrupted/);
  await assert.rejects(readChatStream(stream([bytes('broken\n')]), () => {}));
});
test('successful generation emits media and completion', async () => {
  const events = [];
  await readChatStream(createAnswerStream(async () => (async function* () { yield 'hello'; })(), new AbortController().signal, true), (e) => events.push(e));
  assert.deepEqual(events.map((e) => e.type), ['delta', 'media']);
});
test('reader cancellation aborts generation without writing into a closed stream', async () => {
  let upstream;
  const body = createAnswerStream(async (signal) => {
    upstream = signal;
    return (async function* () { yield 'hello'; await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true })); signal.throwIfAborted(); })();
  }, new AbortController().signal, false);
  const reader = body.getReader();
  await reader.read(); await reader.cancel();
  assert.equal(upstream.aborted, true);
});
test('timeout emits a recoverable error', async () => {
  const events = [];
  const body = createAnswerStream(async (signal) => (async function* () {
    await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }));
    signal.throwIfAborted(); yield '';
  })(), new AbortController().signal, false, 10);
  await assert.rejects(readChatStream(body, (e) => events.push(e)), /interrupted/);
  assert.match(events[0].message, /too long/);
});
