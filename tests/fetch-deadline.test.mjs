import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { fetchWithDeadline } from '../src/lib/fetch-with-deadline.ts';
test('bounds both delayed headers and a stalled response body', async (t) => {
  const server = createServer((req, res) => {
    if (req.url === '/body') { res.writeHead(200); res.write('partial'); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  await assert.rejects(fetchWithDeadline(base, {}, 40));
  const response = await fetchWithDeadline(`${base}/body`, {}, 100);
  await assert.rejects(response.text());
});
test('honors caller cancellation as well as the deadline', async () => {
  const caller = new AbortController(); caller.abort();
  await assert.rejects(fetchWithDeadline('http://127.0.0.1:1', { signal: caller.signal }, 1000));
});
