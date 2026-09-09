import Anthropic from '@anthropic-ai/sdk';

/** What the viewer knows about the structure the student selected. */
export interface ExplainRequest {
  en: string;
  ar?: string;
  la?: string;
  system?: string;
  locale?: 'ar' | 'en';
}

export interface ExplainResult {
  status: number;
  body: {text?: string; error?: string};
}

const ANTHROPIC_MODEL = process.env.EXPLAIN_MODEL || 'claude-opus-5';
/** Any OpenAI-compatible endpoint works here — OpenRouter's free open-source
 * models by default, but equally a local model served by Ollama. */
const OPENAI_BASE = process.env.EXPLAIN_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENAI_MODEL = process.env.EXPLAIN_MODEL || 'google/gemma-4-31b-it:free';
/** OpenRouter attributes traffic with these; other providers ignore them. */
const REFERER = process.env.EXPLAIN_REFERER || 'https://human-atlas-seven.vercel.app';
const APP_TITLE = 'Anatomy System';

const SYSTEM_AR = `أنت مدرّس تشريح تشرح لطالب طب بشري في السنوات الأولى.
اشرح البنية التشريحية المطلوبة بالعربية الفصحى البسيطة، بكلام واضح ومباشر.
اتبع هذا الترتيب بالضبط، وكل عنوان في سطر مستقل يبدأ بـ "## ":
## ما هي
## الموقع
## الوظيفة
## علاقتها بما حولها
## ملاحظة سريرية
اكتب تحت كل عنوان سطرين إلى أربعة أسطر فقط.
أبقِ المصطلحات الإنجليزية واللاتينية بين قوسين بعد المصطلح العربي عند أول ذكر، لأن الامتحانات بالإنجليزية.
لا تخترع معلومة: إذا لم تكن واثقاً من تفصيل، قل ذلك بوضوح.
اختم بسطر واحد: "هذا شرح تعليمي عام وليس مرجعاً سريرياً."`;

const SYSTEM_EN = `You are an anatomy tutor teaching a first-year medical student.
Explain the requested structure in plain, direct English.
Follow this order exactly, each heading on its own line starting with "## ":
## What it is
## Location
## Function
## Relations
## Clinical note
Write two to four lines under each heading.
Do not invent detail: if you are unsure of something, say so plainly.
End with one line: "This is general educational context, not a clinical reference."`;

function prompt(input: ExplainRequest, arabic: boolean) {
  const names = [
    `English name: ${input.en}`,
    input.ar ? `Arabic name: ${input.ar}` : '',
    input.la ? `Latin name: ${input.la}` : '',
    input.system ? `Body system: ${input.system}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    system: arabic ? SYSTEM_AR : SYSTEM_EN,
    user: `${names}\n\n${arabic ? 'اشرح هذه البنية التشريحية.' : 'Explain this anatomical structure.'}`,
  };
}

/** Claude, when an Anthropic key is configured. */
async function viaAnthropic(apiKey: string, input: ExplainRequest, arabic: boolean): Promise<ExplainResult> {
  const client = new Anthropic({apiKey});
  const {system, user} = prompt(input, arabic);
  try {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1400,
      // Low effort keeps a short teaching answer fast and cheap; the task is
      // recall and phrasing, not reasoning.
      output_config: {effort: 'low'},
      system,
      messages: [{role: 'user', content: user}],
    });
    if (response.stop_reason === 'refusal') return {status: 502, body: {error: 'refused'}};
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return text ? {status: 200, body: {text}} : {status: 502, body: {error: 'empty'}};
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return {status: 503, body: {error: 'not_configured'}};
    if (error instanceof Anthropic.RateLimitError) return {status: 429, body: {error: 'rate_limited'}};
    return {status: 502, body: {error: 'upstream'}};
  }
}

/** Any OpenAI-compatible chat endpoint: free hosted providers, or a local
 * model. Only the base URL and the model name change. */
async function viaOpenAICompatible(base: string, apiKey: string | undefined, input: ExplainRequest, arabic: boolean): Promise<ExplainResult> {
  const {system, user} = prompt(input, arabic);
  const endpoint = `${base.replace(/\/+$/, '')}/chat/completions`;
  // A model running on the same machine answers in tens of seconds, not the
  // couple of seconds a hosted one takes.
  const timeout = AbortSignal.timeout(Number(process.env.EXPLAIN_TIMEOUT_MS) || 180_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: timeout,
      headers: {
        'content-type': 'application/json',
        'http-referer': REFERER,
        'x-title': APP_TITLE,
        ...(apiKey ? {authorization: `Bearer ${apiKey}`} : {}),
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 1400,
        temperature: 0.3,
        messages: [
          {role: 'system', content: system},
          {role: 'user', content: user},
        ],
      }),
    });
    if (response.status === 401 || response.status === 403) return {status: 503, body: {error: 'not_configured'}};
    if (response.status === 429) return {status: 429, body: {error: 'rate_limited'}};
    if (!response.ok) return {status: 502, body: {error: 'upstream'}};
    const data = (await response.json()) as {choices?: {message?: {content?: string}}[]};
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? {status: 200, body: {text}} : {status: 502, body: {error: 'empty'}};
  } catch {
    return {status: 502, body: {error: 'upstream'}};
  }
}

/** Asks the configured model for a short teaching explanation of one structure.
 * Returns a status plus body so the Vercel function and the dev middleware can
 * share exactly the same behaviour. */
export async function explainStructure(input: ExplainRequest): Promise<ExplainResult> {
  const english = typeof input.en === 'string' ? input.en.trim() : '';
  if (!english) return {status: 400, body: {error: 'missing_structure'}};
  const arabic = input.locale !== 'en';

  // An OpenAI-compatible key wins when set, so a free provider can be used
  // without touching the Anthropic path.
  const openaiKey = process.env.EXPLAIN_API_KEY;
  if (openaiKey || process.env.EXPLAIN_BASE_URL) {
    return viaOpenAICompatible(OPENAI_BASE, openaiKey, {...input, en: english}, arabic);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return viaAnthropic(anthropicKey, {...input, en: english}, arabic);

  return {status: 503, body: {error: 'not_configured'}};
}

/** Reads and size-limits a JSON request body from a Node-style stream. */
export async function readJsonBody(stream: AsyncIterable<Uint8Array>): Promise<unknown> {
  const parts: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.byteLength;
    if (size > 8_000) throw new Error('payload_too_large');
    parts.push(chunk);
  }
  if (!size) return {};
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
