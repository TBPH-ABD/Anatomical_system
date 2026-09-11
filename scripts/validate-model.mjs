import fs from 'node:fs';
import assert from 'node:assert/strict';
const filename=process.argv[2]??'model.json';
const base=new URL('../public/models/',import.meta.url),model=JSON.parse(fs.readFileSync(new URL(filename,base)));
assert.equal(model.parts.length,2234);assert.equal(model.concepts.length,3432);
const ids=new Set(model.parts.map(p=>p.id));assert.equal(ids.size,2234);
const files=model.chunks.map(c=>{const b=fs.readFileSync(new URL(c.url.split('/').pop(),base));assert.equal(b.length,c.bytes);return b;});
let tris=0;
for(const p of model.parts){assert.ok(p.name.trim()&&p.name!=='-'&&!p.name.includes('Bounds('));assert.ok(p.conceptId!=='-');assert.ok(p.system);const b=files[p.chunk];assert.ok(p.indices+p.indexCount*4<=b.length);const pos=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);assert.ok(indices.length>=3);for(const i of indices)assert.ok(i<p.vertexCount,`${p.id}: invalid vertex`);for(const value of pos)assert.ok(Number.isFinite(value));tris+=p.indexCount/3;}
for(const c of model.concepts){assert.ok(c.elements.length);for(const id of c.elements)assert.ok(ids.has(id),`${c.id}: missing ${id}`);}
assert.equal(tris,model.triangles);
console.log(`Verified ${ids.size} individually indexed meshes, ${model.concepts.length} complete concept mappings, ${tris.toLocaleString()} triangles, and every binary buffer.`);
