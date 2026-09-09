import type {IncomingMessage, ServerResponse} from 'node:http';
import {explainStructure, readJsonBody, type ExplainRequest} from '../server/explain.ts';

/** POST /api/explain — the viewer's "explain this structure" button.
 * The API key stays on the server; the browser only ever sends the names of
 * the selected structure. */
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.writeHead(405, {'content-type': 'application/json', allow: 'POST'});
    response.end(JSON.stringify({error: 'method_not_allowed'}));
    return;
  }
  let payload: ExplainRequest;
  try {
    payload = (await readJsonBody(request)) as ExplainRequest;
  } catch {
    response.writeHead(400, {'content-type': 'application/json'});
    response.end(JSON.stringify({error: 'bad_request'}));
    return;
  }
  const result = await explainStructure(payload);
  response.writeHead(result.status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
  response.end(JSON.stringify(result.body));
}
