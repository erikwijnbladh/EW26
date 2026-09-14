/** The abort signal also bounds response-body reads after headers arrive. */
export function fetchWithDeadline(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 4_000,
): Promise<Response> {
  const deadline = AbortSignal.timeout(timeoutMs);
  return fetch(input, {
    ...init,
    signal: init.signal ? AbortSignal.any([init.signal, deadline]) : deadline,
  });
}
