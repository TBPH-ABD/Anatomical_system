/** Static hosts may serve .gz as a compressed response or as a gzip file.
 * Fetch already decodes Content-Encoding; inspect the payload to avoid decoding twice.
 */
export async function decodeModelResponse(
  response: Response,
  expectedBytes: number,
  compressed: boolean,
  onBytes?: (received: number) => void,
): Promise<ArrayBuffer> {
  if (!response.ok) throw new Error('errors.chunk');
  const payload = onBytes && response.body ? await readStream(response.body, onBytes) : await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const gzip = compressed && signature[0] === 0x1f && signature[1] === 0x8b;
  const buffer = gzip
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : payload;
  if (buffer.byteLength !== expectedBytes) throw new Error('errors.incomplete');
  return buffer;
}

/** Reading the body in pieces is what turns the 33 MB download into a progress
 * bar that actually moves while the model arrives. */
async function readStream(body: ReadableStream<Uint8Array>, onBytes: (received: number) => void): Promise<ArrayBuffer> {
  const reader = body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    parts.push(value);
    total += value.byteLength;
    onBytes(total);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.byteLength;
  }
  return merged.buffer;
}
