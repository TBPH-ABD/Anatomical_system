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

const MODEL = 'claude-opus-5';

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

/** Calls Claude for a short teaching explanation of one structure.
 * Returns a status plus body so the Vercel function and the dev middleware can
 * share exactly the same behaviour. */
export async function explainStructure(input: ExplainRequest): Promise<ExplainResult> {
  const english = typeof input.en === 'string' ? input.en.trim() : '';
  if (!english) return {status: 400, body: {error: 'missing_structure'}};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {status: 503, body: {error: 'not_configured'}};

  const arabic = input.locale !== 'en';
  const client = new Anthropic({apiKey});
  const names = [
    `English name: ${english}`,
    input.ar ? `Arabic name: ${input.ar}` : '',
    input.la ? `Latin name: ${input.la}` : '',
    input.system ? `Body system: ${input.system}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1400,
      // Low effort keeps a short teaching answer fast and cheap; the task is
      // recall and phrasing, not reasoning.
      output_config: {effort: 'low'},
      system: arabic ? SYSTEM_AR : SYSTEM_EN,
      messages: [{role: 'user', content: `${names}\n\nاشرح هذه البنية التشريحية.`}],
    });
    if (response.stop_reason === 'refusal') return {status: 502, body: {error: 'refused'}};
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    if (!text) return {status: 502, body: {error: 'empty'}};
    return {status: 200, body: {text}};
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return {status: 503, body: {error: 'not_configured'}};
    if (error instanceof Anthropic.RateLimitError) return {status: 429, body: {error: 'rate_limited'}};
    return {status: 502, body: {error: 'upstream'}};
  }
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
