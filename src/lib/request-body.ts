/** Bound bytes before decoding or parsing; Content-Length alone is untrusted. */
export class BodyError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function readText(req: Request, maxBytes: number): Promise<string> {
  const length = req.headers.get("content-length");
  if (length && Number(length) > maxBytes) {
    throw new BodyError("Request body is too large.", 413);
  }
  if (!req.body) return "";

  const reader = req.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  const deadline = AbortSignal.timeout(10_000);
  const signal = AbortSignal.any([req.signal, deadline]);
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    for (;;) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new BodyError("Request body is too large.", 413);
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (cause) {
    cancel();
    if (cause instanceof BodyError) throw cause;
    if (signal.aborted) throw new BodyError("Request body timed out.", 408);
    throw new BodyError("Invalid request body.", 400);
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}

export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new BodyError("Expected application/json.", 415);
  }
  const text = await readText(req, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new BodyError("Expected JSON.", 400);
  }
}

export function bodyErrorResponse(cause: unknown) {
  return Response.json(
    { error: cause instanceof BodyError ? cause.message : "Invalid request body." },
    { status: cause instanceof BodyError ? cause.status : 400 },
  );
}
