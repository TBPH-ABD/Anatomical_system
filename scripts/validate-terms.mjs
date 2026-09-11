/** Checks the Arabic terminology against the model it describes:
 * every key must name a real concept or mesh, every Arabic term must be Arabic
 * script, and the published copy must match the source. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = new URL('../', import.meta.url);
const read = (path) => JSON.parse(fs.readFileSync(new URL(path, base)));
const model = read('public/models/model.json');
const terms = read('data/anatomy-terms-ar.json');
const published = fs.readFileSync(new URL('public/data/anatomy-terms-ar.json', base), 'utf8');

assert.equal(published, fs.readFileSync(new URL('data/anatomy-terms-ar.json', base), 'utf8'), 'public/data copy is stale; run npm run build:terms');

const ids = new Set([...model.concepts.map((c) => c.id), ...model.parts.map((p) => p.id)]);
const names = new Map([...model.concepts.map((c) => [c.id, c.name]), ...model.parts.map((p) => [p.id, p.name])]);
const arabic = /[؀-ۿ]/;
const latin = /[A-Za-z]/;

let translated = 0;
for (const [id, entry] of Object.entries(terms)) {
  assert.ok(ids.has(id), `${id}: not an model identifier`);
  assert.equal(entry.en, names.get(id), `${id}: English name drifted from the model`);
  if (entry.ar) {
    assert.ok(arabic.test(entry.ar), `${id}: Arabic term is not Arabic script`);
    assert.ok(entry.ar.trim().length > 1, `${id}: Arabic term is empty`);
    // Latin letters may only survive as identifiers such as VIII, never as an
    // untranslated English word.
    for (const word of entry.ar.split(/\s+/)) assert.ok(!latin.test(word) || /^[IVX]+$/.test(word), `${id}: untranslated fragment "${word}"`);
    translated++;
  }
  if (entry.la) assert.ok(latin.test(entry.la), `${id}: Latin term is missing Latin script`);
}

const conceptCoverage = model.concepts.filter((c) => terms[c.id]?.ar).length / model.concepts.length;
assert.ok(conceptCoverage > 0.95, `Arabic concept coverage fell to ${(conceptCoverage * 100).toFixed(1)}%`);

// Locale parity is enforced by the Translation<Messages> type at build time.

console.log(
  `anatomy-terms-ar.json: ${translated.toLocaleString()} Arabic terms verified against the model, ${(conceptCoverage * 100).toFixed(1)}% of concepts covered.`,
);
