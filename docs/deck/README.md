# عرض النظام (PowerPoint)

`docs/anatomy-system-overview.pptx` — عرض تعريفي عربي من 20 شريحة، كل شريحة تحمل لقطة حقيقية من النظام مع مؤشرات مرقّمة على العناصر التي يشرحها النص.

## إعادة بنائه بعد تغيير الواجهة

```sh
npm run dev                       # في نافذة طرفية
npm i -D playwright-core pptxgenjs
node docs/deck/capture.mjs        # يلتقط الشاشات ويسجل إحداثيات كل عنصر
node docs/deck/build.mjs docs/anatomy-system-overview.pptx
```

`capture.mjs` يفتح الموقع في Chromium (من ذاكرة Playwright المحلية) ويحفظ اللقطات و`deck.json` داخل `deck/` بجانب السكربت، ثم `build.mjs` يبني الشرائح من نفس الملف: اللقطة على اليسار، والشرح المرقّم على اليمين، والمؤشرات فوق العناصر بالإحداثيات المسجلة.

شريحة الشرح بالذكاء الاصطناعي تستخدم نصاً نموذجياً محدداً داخل `capture.mjs`، حتى يمكن بناء العرض على جهاز بلا `ANTHROPIC_API_KEY`.
