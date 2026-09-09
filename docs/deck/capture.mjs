/** Captures the real interface for the slide deck: one screenshot per topic
 * plus the on-screen box of every element a slide points at. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';

const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const OUT = new URL('./deck/', import.meta.url).pathname;
fs.mkdirSync(OUT, {recursive: true});

const SAMPLE_EXPLANATION = `## ما هي
الرئة اليسرى (left lung) عضو تنفسي إسفنجي داخل التجويف الصدري، أصغر قليلاً من اليمنى لأن القلب يشغل حيزاً من جهة اليسار.
تتكوّن من فصّين فقط: العلوي والسفلي، يفصل بينهما الشق المائل (oblique fissure).

## الموقع
في النصف الأيسر من القفص الصدري، فوق الحجاب الحاجز ووراء الأضلاع.
سطحها الإنسي ملاصق للقلب، وفيه انطباع القلب (cardiac impression) واللهاة اللسانية (lingula).

## الوظيفة
توصل الهواء عبر القصبة الرئيسية اليسرى إلى الأسناخ (alveoli)، حيث يتبادل الأكسجين وثاني أكسيد الكربون مع الدم.
تتمدد وتنكمش تبعاً لحركة الحجاب الحاجز والعضلات الوربية.

## علاقتها بما حولها
أمامها وخلفها جدار الصدر، وتحتها الحجاب الحاجز، وإنسياً القلب والأوعية الكبيرة.
يدخلها السرة الرئوية (hilum) الشريان الرئوي والقصبة، ويخرج منها الوريدان الرئويان.

## ملاحظة سريرية
انخماص الفص السفلي شائع بعد العمليات الجراحية بسبب قلة التنفس العميق.
هذا شرح تعليمي عام وليس مرجعاً سريرياً.`;

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=2'],
});
const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2});
page.setDefaultTimeout(60000);

// A sample answer stands in for the model so the deck can show the finished
// window on a machine without an API key.
await page.route('**/api/explain', (route) =>
  route.fulfill({status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({text: SAMPLE_EXPLANATION})}),
);

const slides = {};
const shoot = async (name, marks) => {
  await page.waitForTimeout(700);
  await page.screenshot({path: `${OUT}${name}.png`, timeout: 120000, animations: 'allow'});
  const boxes = [];
  for (const mark of marks ?? []) {
    const box = await page
      .locator(mark.selector)
      .first()
      .boundingBox()
      .catch(() => null);
    if (!box) {
      console.warn(`missing: ${name} -> ${mark.selector}`);
      continue;
    }
    boxes.push({...mark, box});
  }
  slides[name] = {image: `${name}.png`, marks: boxes};
};

const enter = async (url = 'http://localhost:3016/?lang=ar') => {
  await page.goto(url, {waitUntil: 'load'});
  await page.getByRole('button', {name: 'الدخول إلى النظام'}).click({timeout: 30000});
  await page.locator('.loading').waitFor({state: 'detached', timeout: 240000});
  await page.waitForTimeout(2500);
};

// 1. Opening screen
await page.goto('http://localhost:3016/?lang=ar', {waitUntil: 'load'});
await page.waitForTimeout(2500);
await shoot('splash', [
  {n: 1, selector: '.splash-card .credit-title'},
  {n: 2, selector: '.splash-card .primary-action'},
]);

// 2. Main screen
await enter();
await shoot('overview', [
  {n: 1, selector: '.credit-header'},
  {n: 2, selector: '.top-actions'},
  {n: 3, selector: '.layers-panel'},
  {n: 4, selector: '.view-controls'},
  {n: 5, selector: '.bottom-dock .explode-control'},
  {n: 6, selector: '.scene-caption'},
]);

// 3. Systems panel
await shoot('systems', [
  {n: 1, selector: '.layer-presets'},
  {n: 2, selector: '.system-list .system-row:nth-child(2) .system-name'},
  {n: 3, selector: '.system-list .system-row:nth-child(2) [data-slot=switch]'},
  {n: 4, selector: '.system-list .system-row:nth-child(2) .system-count'},
  {n: 5, selector: '.panel-foot'},
]);

// 4. Search
await page.locator('.top-actions button').first().click();
await page.waitForTimeout(500);
await page.locator('.search-panel input').first().fill('الرئة');
await page.waitForTimeout(900);
await shoot('search', [
  {n: 1, selector: '.search-panel input'},
  {n: 2, selector: '[data-slot=combobox-item] .search-result-name'},
  {n: 3, selector: '[data-slot=combobox-item] .small-number'},
]);

// 5. Detail panel
await page.locator('[data-slot=combobox-item]').first().click();
await page.waitForTimeout(1600);
await shoot('detail', [
  {n: 1, selector: '.structure-title'},
  {n: 2, selector: '.structure-alt'},
  {n: 3, selector: '.structure-description'},
  {n: 4, selector: '.structure-meta'},
  {n: 5, selector: '.explain-trigger'},
  {n: 6, selector: '.detail-actions .primary-action'},
  {n: 7, selector: '.detail-saves'},
]);

// 6. Explanation window
await page.locator('.explain-trigger').click();
await page.waitForTimeout(1400);
await shoot('explain', [
  {n: 1, selector: '.explain-window-head h3'},
  {n: 2, selector: '.explain-window-body .explain-section:nth-child(1) h4'},
  {n: 3, selector: '.explain-window-foot'},
]);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// 7. Isolation
await page.locator('.detail-actions .primary-action').click();
await page.waitForTimeout(2200);
await shoot('isolate', [{n: 1, selector: '.detail-actions .primary-action'}, {n: 2, selector: '.scene-caption'}]);
await page.locator('.detail-actions .primary-action').click();
await page.waitForTimeout(1200);

// 8. Labels - the detail sheet is closed first so the model is unobstructed
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
await page.keyboard.press('n');
await page.waitForTimeout(2200);
await shoot('labels', [
  {n: 1, selector: '.top-actions button[aria-label="إظهار العلامات"]'},
  {n: 2, selector: '.structure-label'},
]);
await page.keyboard.press('n');
await page.waitForTimeout(600);

// 9. Quiz
await page.keyboard.press('Escape');
await page.keyboard.press('q');
await page.waitForTimeout(1800);
await shoot('quiz', [
  {n: 1, selector: '.quiz-scope'},
  {n: 2, selector: '.quiz-question'},
  {n: 3, selector: '.quiz-feedback'},
  {n: 4, selector: '.quiz-actions'},
  {n: 5, selector: '.quiz-score'},
]);
await page.keyboard.press('q');
await page.waitForTimeout(600);

// 10. Flashcards - add two cards first
for (const term of ['القلب', 'الكبد']) {
  await page.locator('.top-actions button').first().click();
  await page.waitForTimeout(400);
  await page.locator('.search-panel input').first().fill(term);
  await page.waitForTimeout(900);
  await page.locator('[data-slot=combobox-item]').first().click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', {name: /إضافة بطاقة/}).click().catch(() => {});
  await page.getByRole('button', {name: /إضافة للمفضلة/}).click().catch(() => {});
  await page.waitForTimeout(400);
}
await page.keyboard.press('Escape');
await page.locator('.top-actions button[aria-label="البطاقات"]').click();
await page.waitForTimeout(900);
await shoot('cards', [
  {n: 1, selector: '.card-question'},
  {n: 2, selector: '.card-controls .primary-action'},
  {n: 3, selector: '.card-exports'},
]);

// 11. Favourites
await page.locator('.top-actions button[aria-label="المفضلة"]').click();
await page.waitForTimeout(700);
await page.locator('.list-create input').fill('امتحان الأطراف العلوية');
await page.locator('.list-create button').click();
await page.waitForTimeout(700);
await shoot('favorites', [
  {n: 1, selector: '.list-tabs'},
  {n: 2, selector: '.list-create'},
  {n: 3, selector: '.favorite-list li:first-child .favorite-name'},
]);
await page.keyboard.press('Escape');

// 12. Explode
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
// Drag the explode slider to its end of the track (RTL: the left edge).
{
  const track = await page.locator('.explode-control [data-slot=slider]').first().boundingBox();
  if (track) {
    await page.mouse.move(track.x + track.width / 2, track.y + track.height / 2);
    await page.mouse.down();
    await page.mouse.move(track.x + 2, track.y + track.height / 2, {steps: 12});
    await page.mouse.up();
  }
  await page.waitForTimeout(6000);
}
await shoot('explode', [{n: 1, selector: '.explode-control'}, {n: 2, selector: '.scene-caption'}]);
await page.keyboard.press('0');
await page.waitForTimeout(2500);

// 13. Share + shortcuts
await page.locator('.top-actions button[aria-label="مشاركة العرض"]').click();
await page.waitForTimeout(700);
await shoot('share', [
  {n: 1, selector: '.top-actions button[aria-label="مشاركة العرض"]'},
  {n: 2, selector: '.toast'},
]);
await page.waitForTimeout(2400);
await page.locator('.top-actions button[aria-label="اختصارات لوحة المفاتيح"]').click();
await page.waitForTimeout(900);
await shoot('shortcuts', [{n: 1, selector: '.shortcut-list'}]);
await page.keyboard.press('Escape');

// 14. English mode
await page.locator('.top-actions button[aria-label="تغيير اللغة"]').click();
await page.waitForTimeout(1400);
await shoot('english', [{n: 1, selector: '.credit-header'}, {n: 2, selector: '.layers-panel'}]);
await page.locator('.top-actions button[aria-label="Switch language"]').click();
await page.waitForTimeout(900);

// 15. About sheet (source and licence)
await page.keyboard.press('a');
await page.waitForTimeout(1200);
await shoot('about', [{n: 1, selector: '.about-copy h3'}, {n: 2, selector: '.about-copy a'}]);
await page.keyboard.press('Escape');

await browser.close();

// 16. Mobile
const mobileBrowser = await chromium.launch({
  executablePath: EXEC,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const mobile = await mobileBrowser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
mobile.setDefaultTimeout(60000);
await mobile.goto('http://localhost:3016/?lang=ar', {waitUntil: 'load'});
await mobile.getByRole('button', {name: 'الدخول إلى النظام'}).click({timeout: 30000});
await mobile.locator('.loading').waitFor({state: 'detached', timeout: 240000});
await mobile.waitForTimeout(2500);
await mobile.screenshot({path: `${OUT}mobile.png`, timeout: 120000, animations: 'allow'});
const mobileMarks = [];
for (const mark of [
  {n: 1, selector: '.top-actions'},
  {n: 2, selector: '.view-controls'},
  {n: 3, selector: '.bottom-dock'},
]) {
  const box = await mobile.locator(mark.selector).first().boundingBox();
  if (box) mobileMarks.push({...mark, box});
}
slides.mobile = {image: 'mobile.png', marks: mobileMarks, viewport: {width: 390, height: 844}};
await mobileBrowser.close();

for (const [name, slide] of Object.entries(slides)) slide.viewport ??= {width: 1440, height: 900};
fs.writeFileSync(`${OUT}deck.json`, JSON.stringify(slides, null, 2));
console.log(`captured ${Object.keys(slides).length} screens`);
