/** Builds the Arabic PowerPoint walkthrough from the captured screenshots.
 * Every slide shows a real screen; numbered pins sit on the exact elements the
 * bullet list explains, using the boxes recorded at capture time. */
import PptxGenJS from 'pptxgenjs';
import fs from 'node:fs';

const DIR = new URL('./deck/', import.meta.url).pathname;
const shots = JSON.parse(fs.readFileSync(`${DIR}deck.json`, 'utf8'));

const W = 13.333;
const H = 7.5;
const INK = '20303C';
const MUTED = '6B7783';
const ACCENT = '2B5C6B';
const PIN = 'C0453A';
const BG = 'F4F6F7';
const FONT = 'Arial';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.rtlMode = true;
pptx.author = 'د. سمية عبد الله عبد';
pptx.company = 'جامعة العلوم والتكنولوجيا';
pptx.title = 'نظام تشريح ثلاثي الأبعاد';

const rtl = {rtlMode: true, align: 'right', fontFace: FONT};

/** Places a screenshot inside a box and returns the mapping needed to put pins
 * back on top of it at the right spot. */
function placeImage(slide, key, area) {
  const shot = shots[key];
  const {width: vw, height: vh} = shot.viewport;
  // A box captured outside the viewport would pin outside the slide; drop it.
  const marks = shot.marks.filter((mark) => {
    const inside = mark.box.x >= 0 && mark.box.y >= 0 && mark.box.x + mark.box.width <= vw + 4 && mark.box.y + mark.box.height <= vh + 4;
    if (!inside) console.warn(`skipped off-screen pin ${key}#${mark.n}`);
    return inside;
  });
  const scale = Math.min(area.w / vw, area.h / vh);
  const w = vw * scale;
  const h = vh * scale;
  const x = area.x + (area.w - w) / 2;
  const y = area.y + (area.h - h) / 2;
  slide.addImage({path: `${DIR}${shot.image}`, x, y, w, h, rounding: false});
  slide.addShape(pptx.ShapeType.rect, {x, y, w, h, fill: {type: 'none'}, line: {color: 'D3DADF', width: 0.75}});
  return {x, y, scale, marks};
}

/** Draws a numbered pin over the element it belongs to. */
function addPins(slide, placed, only) {
  const size = 0.34;
  for (const mark of placed.marks) {
    if (only && !only.includes(mark.n)) continue;
    const cx = placed.x + (mark.box.x + mark.box.width / 2) * placed.scale;
    const cy = placed.y + (mark.box.y + mark.box.height / 2) * placed.scale;
    slide.addShape(pptx.ShapeType.rect, {
      x: placed.x + mark.box.x * placed.scale,
      y: placed.y + mark.box.y * placed.scale,
      w: Math.max(0.12, mark.box.width * placed.scale),
      h: Math.max(0.12, mark.box.height * placed.scale),
      fill: {type: 'none'},
      line: {color: PIN, width: 1.25, dashType: 'dash'},
      rectRadius: 0.03,
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: cx - size / 2,
      y: cy - size / 2,
      w: size,
      h: size,
      fill: {color: PIN},
      line: {color: 'FFFFFF', width: 1},
    });
    slide.addText(String(mark.n), {
      x: cx - size / 2,
      y: cy - size / 2,
      w: size,
      h: size,
      align: 'center',
      valign: 'middle',
      fontSize: 12,
      bold: true,
      color: 'FFFFFF',
      fontFace: FONT,
    });
  }
}

function header(slide, title, subtitle) {
  slide.background = {color: BG};
  slide.addText(title, {...rtl, x: 0.45, y: 0.3, w: W - 0.9, h: 0.55, fontSize: 28, bold: true, color: INK});
  if (subtitle) {
    slide.addText(subtitle, {...rtl, x: 0.45, y: 0.85, w: W - 0.9, h: 0.4, fontSize: 14, color: MUTED});
  }
}

/** A screenshot on the left, the numbered explanation on the right. */
function featureSlide({title, subtitle, shot, points, only, note}) {
  const slide = pptx.addSlide();
  header(slide, title, subtitle);
  const placed = placeImage(slide, shot, {x: 0.45, y: 1.35, w: 7.7, h: 5.5});
  addPins(slide, placed, only);
  slide.addText(
    points.map((point) => ({
      text: point,
      options: {bullet: {type: 'number', style: 'arabicPeriod'}, breakLine: true, paraSpaceAfter: 10},
    })),
    {...rtl, x: 8.35, y: 1.35, w: 4.55, h: note ? 4.55 : 5.5, fontSize: 15, color: INK, lineSpacingMultiple: 1.25, valign: 'top', fit: 'shrink'},
  );
  if (note) {
    slide.addShape(pptx.ShapeType.roundRect, {x: 8.35, y: 6.05, w: 4.55, h: 0.85, fill: {color: 'E9F0F2'}, line: {color: 'CBDDE2'}, rectRadius: 0.08});
    slide.addText(note, {...rtl, x: 8.5, y: 6.1, w: 4.25, h: 0.75, fontSize: 12, color: ACCENT, valign: 'middle', fit: 'shrink'});
  }
  slide.addText(`${title}`, {...rtl, x: 0.45, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: 'A4AEB6'});
  return slide;
}

// ---------------------------------------------------------------- title slide
{
  const slide = pptx.addSlide();
  slide.background = {color: '1E2C36'};
  slide.addText('نظام تشريح ثلاثي الأبعاد', {...rtl, align: 'center', x: 0.8, y: 1.9, w: W - 1.6, h: 0.9, fontSize: 46, bold: true, color: 'FFFFFF'});
  slide.addText('مساعد لطلاب الطب البشري في جامعة العلوم والتكنولوجيا', {
    ...rtl,
    align: 'center',
    x: 0.8,
    y: 2.85,
    w: W - 1.6,
    h: 0.5,
    fontSize: 20,
    color: 'C7D3DA',
  });
  slide.addShape(pptx.ShapeType.line, {x: 5.2, y: 3.65, w: 2.9, h: 0, line: {color: '4A6472', width: 1.5}});
  slide.addText('مقدم من د. سمية عبد الله عبد', {...rtl, align: 'center', x: 0.8, y: 3.95, w: W - 1.6, h: 0.4, fontSize: 18, bold: true, color: 'FFFFFF'});
  slide.addText('بمساعدة أخيها المهندس صلاح عبد الله عبد', {...rtl, align: 'center', x: 0.8, y: 4.4, w: W - 1.6, h: 0.4, fontSize: 18, bold: true, color: 'FFFFFF'});
  slide.addText('عرض تعريفي بالنظام وطريقة استخدامه', {...rtl, align: 'center', x: 0.8, y: 5.35, w: W - 1.6, h: 0.4, fontSize: 14, color: '93A5AF'});
}

// ------------------------------------------------------------------- overview
{
  const slide = pptx.addSlide();
  header(slide, 'ما هو النظام؟', 'أطلس تشريحي تفاعلي يعمل داخل المتصفح، بواجهة عربية كاملة');
  const cards = [
    ['2,219', 'قطعة مجسمة يمكن تحديدها بالنقر'],
    ['15', 'جهازاً تشريحياً يمكن إظهاره وإخفاؤه'],
    ['5,574', 'مصطلحاً تشريحياً بالعربية مع مقابله الإنجليزي'],
    ['بلا تثبيت', 'يفتح من أي متصفح على الحاسوب أو الجوال'],
  ];
  cards.forEach(([big, small], index) => {
    const x = 0.55 + index * 3.12;
    pptx.addSlide;
    slide.addShape(pptx.ShapeType.roundRect, {x, y: 1.5, w: 2.9, h: 1.6, fill: {color: 'FFFFFF'}, line: {color: 'DDE4E8'}, rectRadius: 0.12});
    slide.addText(big, {...rtl, align: 'center', x, y: 1.65, w: 2.9, h: 0.6, fontSize: 26, bold: true, color: ACCENT});
    slide.addText(small, {...rtl, align: 'center', x: x + 0.15, y: 2.25, w: 2.6, h: 0.7, fontSize: 12, color: MUTED});
  });
  slide.addText(
    [
      'يعرض جسم إنسان بالغ بشكل ثلاثي الأبعاد، يمكن تدويره وتقريبه والنقر على أي بنية لمعرفة اسمها.',
      'كل اسم يظهر بالعربية ومعه الاسم الإنجليزي، لأن الامتحانات تُكتب بالإنجليزية.',
      'يحتوي أدوات مذاكرة: اختبار، بطاقات مراجعة، مفضلة وقوائم، وعلامات على النموذج.',
      'يعمل بلا إنترنت بعد فتحه أول مرة، ما عدا زر الشرح بالذكاء الاصطناعي.',
    ].map((text) => ({text, options: {bullet: {code: '2022'}, breakLine: true, paraSpaceAfter: 12}})),
    {...rtl, x: 0.55, y: 3.4, w: 12.2, h: 3.2, fontSize: 17, color: INK, lineSpacingMultiple: 1.3},
  );
}

featureSlide({
  title: 'شاشة البداية',
  subtitle: 'أول ما يظهر عند فتح الرابط',
  shot: 'splash',
  points: [
    'اسم النظام والجهة المقدِّمة: نظام تشريح ثلاثي الأبعاد، مقدم من د. سمية عبد الله عبد، بمساعدة المهندس صلاح عبد الله عبد.',
    'زر «الدخول إلى النظام» يبقى معطّلاً حتى يجهز النموذج، ثم يفتح الأطلس. خلفه يظهر النموذج وهو يُحمَّل.',
  ],
  note: 'التحميل أول مرة يستغرق دقيقة تقريباً حسب سرعة الإنترنت، ثم يصبح أسرع.',
});

featureSlide({
  title: 'الشاشة الرئيسية',
  subtitle: 'كل عنصر في الواجهة ووظيفته',
  shot: 'overview',
  points: [
    'ترويسة النظام: اسم النظام والجهة المقدِّمة، وعدد القطع ومصدر البيانات.',
    'شريط الأدوات: البحث، الاختبار، البطاقات، المفضلة، العلامات، المشاركة، الاختصارات، وتغيير اللغة.',
    'لوحة الأجهزة: تشغيل وإطفاء أي جهاز من أجهزة الجسم الخمسة عشر.',
    'أزرار الكاميرا: عرض أمامي (أ)، جانبي (ج)، خلفي (خ)، ثلاثة أرباع (¾)، مع التدوير التلقائي وإعادة الضبط.',
    'شريط التفكيك: يفصل الجسم تدريجياً حتى تصبح كل قطعة مستقلة.',
    'شريط الحالة: يخبرك بما يعرضه المشهد الآن.',
  ],
});

featureSlide({
  title: 'لوحة الأجهزة',
  subtitle: 'التحكم بما يظهر من الجسم',
  shot: 'systems',
  points: [
    'أزرار سريعة: «الكل» لإظهار كل شيء، «الهيكل» للعظام وحدها، «الأعضاء» للأعضاء الداخلية.',
    'الضغط على اسم الجهاز يُظهر هذا الجهاز وحده ويخفي الباقي — أسرع طريقة لعزل جهاز كامل.',
    'المفتاح بجانب كل جهاز يشغّله أو يخفيه دون التأثير على بقية الأجهزة.',
    'الرقم يبيّن كم قطعة يحتوي هذا الجهاز.',
    'أسفل اللوحة: عدد القطع الظاهرة الآن، وزر «إخفاء الكل» للبدء من شاشة فارغة.',
  ],
  note: 'اختصار لوحة المفاتيح: حرف L يفتح ويغلق لوحة الأجهزة.',
});

featureSlide({
  title: 'البحث عن بنية',
  subtitle: 'بالعربية أو الإنجليزية أو اللاتينية',
  shot: 'search',
  points: [
    'اكتب أي جزء من الاسم. البحث يتجاهل الهمزات والتاء المربوطة والتشكيل، فـ «الرئه» تجد «الرئة».',
    'كل نتيجة تعرض الاسم العربي وتحته الاسم الإنجليزي كما هو في المصدر.',
    'الرقم يوضح عدد القطع التي يتكوّن منها هذا المفهوم التشريحي.',
  ],
  note: 'اختصار: مفتاح / يفتح البحث مباشرة من أي مكان.',
});

featureSlide({
  title: 'لوحة التفاصيل',
  subtitle: 'تظهر عند النقر على أي بنية في النموذج',
  shot: 'detail',
  points: [
    'الاسم العربي المعتمد للبنية.',
    'الاسم الإنجليزي الأصلي أسفله مباشرة — وهو المطلوب في الامتحانات.',
    'شرح مختصر للبنية أو للجهاز الذي تنتمي إليه.',
    'عدد القطع المحددة، والجهاز التشريحي التابعة له.',
    'زر «اشرح لي هذه البنية»: شرح موسّع بالذكاء الاصطناعي.',
    'زر «عزل البنية»: يخفي كل ما حولها ويقرّب الكاميرا عليها.',
    'إضافة البنية إلى المفضلة، أو حفظها كبطاقة مراجعة.',
  ],
});

featureSlide({
  title: 'الشرح بالذكاء الاصطناعي',
  subtitle: 'شرح موسّع للبنية المحددة، بلغة الواجهة',
  shot: 'explain',
  points: [
    'عنوان النافذة يحمل اسم البنية التي طلبت شرحها.',
    'الشرح مقسّم إلى: ما هي، الموقع، الوظيفة، علاقتها بما حولها، وملاحظة سريرية — مع إبقاء المصطلح الإنجليزي بين قوسين.',
    'سطر تنبيه أسفل النافذة: الشرح مولّد بالذكاء الاصطناعي، للتعليم فقط وليس مرجعاً سريرياً.',
  ],
  note: 'إذا كان الجهاز غير متصل بالإنترنت يظهر تنبيه فقط ولا يُرسل أي شيء. الإغلاق بمفتاح Esc.',
});

featureSlide({
  title: 'عزل البنية',
  subtitle: 'دراسة بنية واحدة بمعزل عن الجسم',
  shot: 'isolate',
  points: [
    'زر «عزل البنية» يخفي بقية الجسم ويملأ الشاشة بالبنية المحددة، ويعود بالضغط عليه مرة أخرى.',
    'شريط الحالة يعرض اسم البنية المعزولة، ويمكن تدويرها وتقريبها بحرية.',
  ],
  note: 'اختصار: حرف I يعزل البنية المحددة ويلغي العزل.',
});

featureSlide({
  title: 'العلامات على النموذج',
  subtitle: 'أسماء البنى الظاهرة مباشرة على الجسم',
  shot: 'labels',
  points: [
    'زر العلامات في شريط الأدوات يشغّلها ويطفئها.',
    'تظهر أسماء أكبر البنى الظاهرة، وخطوط الإشارة مرتبة بحيث لا تتقاطع مهما كان عدد العلامات.',
  ],
  note: 'اختصار: حرف N. العلامات تتبع لغة الواجهة، فتظهر بالعربية أو الإنجليزية.',
});

featureSlide({
  title: 'وضع الاختبار',
  subtitle: 'أكبر فارق تعليمي في النظام',
  shot: 'quiz',
  points: [
    'اختر مصدر الأسئلة: الأجهزة الظاهرة فقط، أو المفضلة، أو الأطلس كامل.',
    'يظهر الجهاز وعدد القطع فقط — أما الاسم فمخفي، والمطلوب أن تحدد البنية على النموذج.',
    'بعد النقر يخبرك النظام مباشرة: إجابة صحيحة، أو يسمّي لك البنية التي نقرت عليها بالخطأ.',
    'يمكن إظهار الإجابة أو تخطي السؤال والانتقال إلى غيره.',
    'النتيجة وعدد الإجابات المتتالية الصحيحة تُحسب أثناء المذاكرة.',
  ],
  note: 'اختصار: حرف Q يشغّل وضع الاختبار وينهيه.',
});

featureSlide({
  title: 'بطاقات المراجعة',
  subtitle: 'حفظ الأسماء بأسلوب البطاقات',
  shot: 'cards',
  points: [
    'وجه البطاقة يعرض الاسم بلغة الواجهة، والوجه الآخر يعرض الاسم باللغة الثانية.',
    'زر «إظهار الإجابة» يقلب البطاقة، والأسهم تنقلك بين البطاقات.',
    'التصدير: ملف CSV لبرامج الجداول، وملف جاهز لبرنامج Anki للمراجعة المتباعدة.',
  ],
  note: 'البطاقات تُحفظ داخل متصفحك، وتبقى موجودة بعد إغلاق الصفحة.',
});

featureSlide({
  title: 'المفضلة والقوائم',
  subtitle: 'تجهيز قائمة مذاكرة لامتحان معيّن',
  shot: 'favorites',
  points: [
    'تبويب لكل قائمة، و«كل المفضلة» يجمعها كلها.',
    'أنشئ قائمة باسم يناسب امتحانك، مثل «امتحان الأطراف العلوية».',
    'النقر على أي بنية في القائمة يفتحها على النموذج مباشرة.',
  ],
  note: 'يمكن جعل أسئلة الاختبار تأتي من المفضلة فقط.',
});

featureSlide({
  title: 'تفكيك الجسم',
  subtitle: 'من جسم مجمّع إلى جرد كامل للقطع',
  shot: 'explode',
  points: [
    'حرّك الشريط تدريجياً: تبتعد القطع عن بعضها حسب الجهاز، ثم تنتظم كلها في جرد مسطّح.',
    'شريط الحالة يوضح المرحلة: مجمّع، بنى مفصولة، أو جرد تشريحي — وفي الجرد يمكن النقر على أي قطعة لمعرفة اسمها.',
  ],
});

featureSlide({
  title: 'المشاركة والاختصارات',
  subtitle: 'إرسال نفس المشهد لطالب آخر',
  shot: 'share',
  points: [
    'زر المشاركة ينسخ رابطاً يحفظ: الأجهزة الظاهرة، والبنية المحددة، ودرجة التفكيك، وزاوية الكاميرا، واللغة.',
    'تظهر رسالة «تم نسخ الرابط» عند نجاح النسخ، ويكفي لصق الرابط في أي محادثة.',
  ],
  note: 'من يفتح الرابط يرى نفس المشهد تماماً كما تركته.',
});

featureSlide({
  title: 'اختصارات لوحة المفاتيح',
  subtitle: 'للتنقل السريع أثناء المذاكرة',
  shot: 'shortcuts',
  points: ['القائمة الكاملة للاختصارات تظهر بالضغط على علامة الاستفهام ؟ أو من زر لوحة المفاتيح في شريط الأدوات.'],
  note: '/ بحث · L الأجهزة · N العلامات · Q اختبار · F مفضلة · I عزل · R تدوير · 0 إعادة ضبط · 1–4 زوايا العرض · A المصدر والحقوق',
});

featureSlide({
  title: 'اللغة الثانية',
  subtitle: 'التبديل الكامل بين العربية والإنجليزية',
  shot: 'english',
  points: [
    'زر اللغة يقلب الواجهة كاملة، ويعيد ترتيب العناصر من اليمين إلى اليسار أو العكس.',
    'أسماء الأجهزة والبنى والشرح كلها تتبع اللغة المختارة، والنموذج ثلاثي الأبعاد لا يتأثر.',
  ],
  note: 'اللغة تُحفظ في المتصفح، ويمكن فرضها في الرابط بإضافة lang=ar أو lang=en.',
});

featureSlide({
  title: 'على الجوال',
  subtitle: 'نفس النظام بواجهة مناسبة للشاشة الصغيرة',
  shot: 'mobile',
  points: [
    'شريط الأدوات يتحول إلى صف قابل للتمرير أسفل العنوان.',
    'أزرار الكاميرا تنتقل إلى أسفل الشاشة قرب الإبهام.',
    'شريط التفكيك وزر الأجهزة في الأسفل، بمساحات لمس مريحة.',
  ],
  note: 'ينصح باستخدام شبكة Wi-Fi عند فتح النظام أول مرة لأن حجم النموذج كبير.',
});

featureSlide({
  title: 'مصدر البيانات والحقوق',
  subtitle: 'من أين جاء النموذج وما حدود استخدامه',
  shot: 'about',
  points: [
    'البيانات التشريحية من قاعدة BodyParts3D التابعة لـ The Database Center for Life Science، برخصة CC BY 4.0.',
    'روابط الرخصة والبيانات الأصلية والبحث المنشور متاحة داخل النظام في نافذة «عن النظام» (مفتاح A).',
  ],
  note: 'النظام مرجع تعليمي، وليس أداة تشخيص أو جراحة.',
});

// ------------------------------------------------------------------- closing
{
  const slide = pptx.addSlide();
  slide.background = {color: '1E2C36'};
  slide.addText('كيف تبدأ؟', {...rtl, align: 'center', x: 0.8, y: 1.5, w: W - 1.6, h: 0.7, fontSize: 34, bold: true, color: 'FFFFFF'});
  slide.addText(
    [
      'افتح رابط النظام من المتصفح واضغط «الدخول إلى النظام».',
      'ابدأ بجهاز واحد من لوحة الأجهزة حتى لا تتشتت.',
      'انقر على أي بنية، اقرأ اسمها بالعربية والإنجليزية، ثم اطلب الشرح.',
      'أضف ما يهمك إلى المفضلة والبطاقات، وراجع نفسك بوضع الاختبار.',
    ].map((text) => ({text, options: {bullet: {type: 'number', style: 'arabicPeriod'}, breakLine: true, paraSpaceAfter: 14}})),
    {...rtl, x: 2.6, y: 2.5, w: 8.1, h: 2.8, fontSize: 18, color: 'D7E0E6', lineSpacingMultiple: 1.3},
  );
  slide.addShape(pptx.ShapeType.line, {x: 5.2, y: 5.5, w: 2.9, h: 0, line: {color: '4A6472', width: 1.5}});
  slide.addText('مقدم من د. سمية عبد الله عبد — بمساعدة أخيها المهندس صلاح عبد الله عبد', {
    ...rtl,
    align: 'center',
    x: 0.8,
    y: 5.8,
    w: W - 1.6,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF',
  });
}

const out = process.argv[2] ?? `${DIR}anatomy-system-overview.pptx`;
await pptx.writeFile({fileName: out});
console.log(`wrote ${out}`);
