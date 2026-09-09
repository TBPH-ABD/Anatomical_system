/** Builds data/anatomy-terms-ar.json from the curated lexicon.
 *
 * Entries are keyed by the atlas concept identifier (and by mesh identifier when
 * a mesh carries a different name from its concept), never by English text, so
 * upstream wording changes cannot silently break the mapping.
 *
 * A name is translated only when every word in it is covered by the lexicon.
 * Anything else is left out on purpose: the viewer then shows the English or
 * Latin name rather than a guessed Arabic one.
 *
 *   node scripts/build-anatomy-terms.mjs [--report]
 */
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {ADJ, LATIN, NOUNS, ORDINALS, PHRASES} from './anatomy-lexicon.mjs';

const ROMAN = /^(?:i{1,3}|iv|vi{0,3}|ix|xi{0,2}|x)$/;
const DIGITS = /^\d+$/;

const normalize = (name) => name.toLowerCase().replace(/\s+/g, ' ').trim();
const bare = (entry) => entry.b ?? entry.d.replace(/^ال/, '');
/** Attach the possessive lām: الشريان -> للشريان, إصبع -> لإصبع. */
const lam = (text) => (text.startsWith('ال') ? `لل${text.slice(2)}` : `ل${text}`);

/** Build one "of"-free segment. Returns null when a word is not in the lexicon. */
function composeSegment(segment) {
  let tokens = segment.split(' ').filter(Boolean);
  if (!tokens.length) return null;

  // Roman numerals and digits are identifiers, not words: keep them verbatim at
  // the end of the Arabic phrase (الفقرة الصدرية VIII).
  const trailing = [];
  while (tokens.length > 1 && (ROMAN.test(tokens[tokens.length - 1]) || DIGITS.test(tokens[tokens.length - 1]))) {
    trailing.unshift(tokens[tokens.length - 1].toUpperCase());
    tokens = tokens.slice(0, -1);
  }

  // English also trails a few adjectives behind the noun ("hepatic artery
  // proper"); those keep their position in Arabic too.
  const following = [];
  let head = null;
  let modifiers = [];
  while (tokens.length) {
    // Longest phrase suffix wins, so "left flexor digitorum longus" keeps its
    // curated muscle name and only "left" is composed around it.
    for (let start = 0; start < tokens.length; start++) {
      const candidate = PHRASES[tokens.slice(start).join(' ')];
      if (candidate) {
        head = candidate;
        modifiers = tokens.slice(0, start);
        break;
      }
    }
    if (!head && NOUNS[tokens[tokens.length - 1]]) {
      head = NOUNS[tokens[tokens.length - 1]];
      modifiers = tokens.slice(0, -1);
    }
    if (head) break;
    const last = tokens[tokens.length - 1];
    if (tokens.length === 1 || !ADJ[last]) return null;
    following.unshift(ADJ[last]);
    tokens = tokens.slice(0, -1);
  }
  if (!head) return null;

  const adjectives = [];
  for (const token of modifiers) {
    const ordinal = ORDINALS[token] ?? ADJ[token];
    if (!ordinal) return null;
    adjectives.push(ordinal);
  }

  const gender = head.g === 'f' ? 1 : 0;
  const inflect = (forms) => forms[gender];
  // English stacks modifiers before the noun; Arabic trails them in the mirror
  // order, which also puts laterality last where a reader expects it.
  const words = [head.d, ...adjectives.reverse().map(inflect), ...following.map(inflect), ...trailing];
  return {text: words.join(' '), head, modifierCount: adjectives.length + following.length + trailing.length};
}

/** Build a full name, including any "of" chain and a trailing "with" clause. */
export function composeArabic(rawName) {
  const name = normalize(rawName);
  const whole = PHRASES[name];
  if (whole) return whole.d;

  const [subject, ...companions] = name.split(/ (?:with|to) /);
  if (companions.length > 1) return null;
  const connector = / to /.test(name.slice(subject.length)) ? 'إلى' : 'مع';

  const segments = subject.split(' of ');
  if (segments.length > 3) return null;

  const built = segments.map(composeSegment);
  if (built.some((segment) => !segment)) return null;

  let text = built[built.length - 1].text;
  for (let i = built.length - 2; i >= 0; i--) {
    const segment = built[i];
    // A bare head reads as a genitive construct (جسم القص); once the head
    // carries adjectives the lām form keeps the phrase grammatical.
    const construct = segment.modifierCount === 0 && !bare(segment.head).includes(' ');
    text = construct ? `${bare(segment.head)} ${text}` : `${segment.text} ${lam(text)}`;
  }

  if (companions.length === 1) {
    const companion = composeArabic(companions[0]);
    if (!companion) return null;
    text = `${text} ${connector} ${companion}`;
  }
  return text;
}

export const latinFor = (name) => LATIN[normalize(name)] ?? null;

function main() {
  const atlasPath = new URL('../public/models/atlas.json', import.meta.url);
  const atlas = JSON.parse(fs.readFileSync(atlasPath));
  const terms = {};
  const missing = new Map();

  const add = (id, name) => {
    if (terms[id]) return;
    const arabic = composeArabic(name);
    const latin = latinFor(name);
    if (!arabic && !latin) {
      missing.set(name, (missing.get(name) ?? 0) + 1);
      return;
    }
    terms[id] = arabic ? {ar: arabic, en: name} : {en: name};
    if (latin) terms[id].la = latin;
  };

  for (const concept of atlas.concepts) add(concept.id, concept.name);
  const byConcept = new Map(atlas.concepts.map((c) => [c.id, c.name]));
  for (const part of atlas.parts) {
    // A mesh only needs its own row when its name differs from its concept's.
    if (byConcept.get(part.conceptId) === part.name) continue;
    add(part.id, part.name);
  }

  const total = atlas.concepts.length + atlas.parts.length;
  const output = new URL('../data/anatomy-terms-ar.json', import.meta.url);
  fs.mkdirSync(new URL('../data/', import.meta.url), {recursive: true});
  fs.writeFileSync(output, `${JSON.stringify(terms, null, 0)}\n`);

  const covered = Object.values(terms).filter((entry) => entry.ar).length;
  console.log(
    `anatomy-terms-ar.json: ${covered.toLocaleString()} Arabic terms across ${Object.keys(terms).length.toLocaleString()} entries (${total.toLocaleString()} names seen).`,
  );
  if (process.argv.includes('--report')) {
    const ranked = [...missing.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`\nUntranslated names (${ranked.length}); these fall back to English:`);
    for (const [name, count] of ranked.slice(0, 80)) console.log(`  ${count}× ${name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
