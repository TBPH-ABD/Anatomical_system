/** Exercises the explain endpoint against a stub provider that reproduces what
 * OpenRouter actually returns, including its failure shapes, and runs the same
 * request through the Vercel function so the deployed path is covered too.
 *
 *   node scripts/test-explain.mjs
 */
import http from 'node:http';

const PORT = 8791;

/** Each case names what the stub provider does and what the endpoint must
 * return for it. */
const CASES = [
  {
    name: 'a normal answer',
    reply: (res) =>
      json(res, 200, {
        choices: [{message: {content: '## ما هي\n**الرئة** اليسرى عضو تنفسي.\n\n## الموقع\n- في الصدر.'}}],
      }),
    // Markdown is passed through untouched; the panel strips it when rendering.
    expect: {status: 200, contains: '**الرئة** اليسرى عضو تنفسي'},
  },
  {
    name: 'a reasoning model that leaks its scratchpad',
    reply: (res) =>
      json(res, 200, {choices: [{message: {content: '<think>let me recall the lungs</think>\n## ما هي\nالرئة اليسرى.'}}]}),
    expect: {status: 200, notContains: 'let me recall'},
  },
  {
    name: 'an error returned with HTTP 200',
    reply: (res) => json(res, 200, {error: {code: 402, message: 'insufficient credits'}}),
    expect: {status: 503, error: 'bad_model'},
  },
  {name: 'a rejected key', reply: (res) => json(res, 401, {error: 'no auth'}), expect: {status: 503, error: 'not_configured'}},
  {name: 'a rate limit', reply: (res) => json(res, 429, {error: 'slow down'}), expect: {status: 429, error: 'rate_limited'}},
  {name: 'an unknown model', reply: (res) => json(res, 404, {error: 'no such model'}), expect: {status: 503, error: 'bad_model'}},
  {name: 'an empty answer', reply: (res) => json(res, 200, {choices: [{message: {content: '   '}}]}), expect: {status: 502, error: 'empty'}},
  {
    name: 'a provider that fails once then succeeds',
    reply: (res, state) => (state.hits === 1 ? json(res, 500, {error: 'boom'}) : json(res, 200, {choices: [{message: {content: '## ما هي\nالقلب.'}}]})),
    expect: {status: 200, contains: 'القلب'},
  },
];

function json(res, status, body) {
  res.writeHead(status, {'content-type': 'application/json'});
  res.end(JSON.stringify(body));
}

const state = {hits: 0, headers: null, body: null};
let current = CASES[0];
const provider = http.createServer((req, res) => {
  state.hits += 1;
  state.headers = req.headers;
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    state.body = JSON.parse(raw || '{}');
    current.reply(res, state);
  });
});
await new Promise((resolve) => provider.listen(PORT, resolve));

process.env.EXPLAIN_BASE_URL = `http://127.0.0.1:${PORT}/v1`;
process.env.EXPLAIN_API_KEY = 'test-key';
process.env.EXPLAIN_MODEL = 'test/model:free';
process.env.EXPLAIN_TIMEOUT_MS = '8000';

const {explainStructure} = await import('../server/explain.ts');
const {default: handler} = await import('../api/explain.ts');

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : `  <- ${detail}`}`);
  if (!ok) failures += 1;
};

for (const testCase of CASES) {
  current = testCase;
  state.hits = 0;
  const result = await explainStructure({en: 'left lung', ar: 'الرئة اليسرى', locale: 'ar'});
  const text = result.body.text ?? '';
  let ok = result.status === testCase.expect.status;
  if (ok && testCase.expect.error) ok = result.body.error === testCase.expect.error;
  if (ok && testCase.expect.contains) ok = text.includes(testCase.expect.contains);
  if (ok && testCase.expect.notContains) ok = !text.includes(testCase.expect.notContains);
  check(testCase.name, ok, JSON.stringify(result).slice(0, 160));
}

// The request itself must carry what a provider needs.
current = CASES[0];
state.hits = 0;
await explainStructure({en: 'heart', ar: 'القلب', la: 'cor', system: 'القلب', locale: 'ar'});
check('sends the bearer token', state.headers.authorization === 'Bearer test-key', state.headers.authorization);
check('sends the configured model', state.body.model === 'test/model:free', state.body.model);
check('sends an Arabic system prompt', state.body.messages[0].content.includes('مدرّس تشريح'), 'system prompt');
check('sends every name it has', state.body.messages[1].content.includes('cor') && state.body.messages[1].content.includes('القلب'), state.body.messages[1].content);

state.hits = 0;
await explainStructure({en: 'heart', locale: 'en'});
check('switches to the English prompt', state.body.messages[0].content.includes('anatomy tutor'), 'system prompt');

// Nothing configured must not reach a provider at all.
delete process.env.EXPLAIN_BASE_URL;
delete process.env.EXPLAIN_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
state.hits = 0;
const unset = await explainStructure({en: 'heart', locale: 'ar'});
check('reports an unconfigured server', unset.status === 503 && unset.body.error === 'not_configured' && state.hits === 0, JSON.stringify(unset));
check('rejects a request with no structure', (await explainStructure({en: '  '})).status === 400, 'missing_structure');

// The Vercel function: the code that actually runs once deployed.
process.env.EXPLAIN_BASE_URL = `http://127.0.0.1:${PORT}/v1`;
process.env.EXPLAIN_API_KEY = 'test-key';
current = CASES[0];

async function callHandler(method, payload) {
  const request = Object.assign(
    (async function* () {
      if (payload !== undefined) yield Buffer.from(payload);
    })(),
    {method},
  );
  return new Promise((resolve) => {
    const chunks = [];
    const response = {
      writeHead(status, headers) {
        this.statusCode = status;
        this.headers = headers;
      },
      end(chunk) {
        if (chunk) chunks.push(chunk);
        resolve({status: this.statusCode, headers: this.headers, body: chunks.join('')});
      },
    };
    handler(request, response);
  });
}

const posted = await callHandler('POST', JSON.stringify({en: 'left lung', ar: 'الرئة اليسرى', locale: 'ar'}));
check('the Vercel function answers a POST', posted.status === 200 && JSON.parse(posted.body).text.includes('الرئة'), posted.body?.slice(0, 120));
check('the Vercel function sends UTF-8 JSON', /application\/json; charset=utf-8/.test(posted.headers['content-type']), posted.headers['content-type']);
check('the Vercel function forbids caching', posted.headers['cache-control'] === 'no-store', posted.headers['cache-control']);
const gotten = await callHandler('GET');
check('the Vercel function refuses a GET', gotten.status === 405, String(gotten.status));
const broken = await callHandler('POST', '{not json');
check('the Vercel function refuses a broken body', broken.status === 400, String(broken.status));

provider.close();
console.log(failures ? `\n${failures} failing check(s)` : '\nExplain endpoint verified: provider handling, prompts, and the deployed function path.');
process.exit(failures ? 1 : 0);
