import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validate, composition, create } from './scripts/project.mjs';

const example = new URL('./examples/queue.json',import.meta.url);
const queue = JSON.parse(await readFile(example,'utf8'));
test('a complete project preserves sources and timing and refuses to overwrite',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'blueprint-test-'));
  try {
    const input=join(temp,'input.json'),out=join(temp,'film');
    await writeFile(input,JSON.stringify(queue));
    const result=await create(input,out);
    assert.equal(result.duration,36);
    const srt=await readFile(join(out,'captions.srt'),'utf8');
    assert.match(srt,/00:00:29,000 --> 00:00:36,000/);
    assert.match(await readFile(join(out,'sources.md'),'utf8'),/deterministic example/);
    await assert.rejects(create(input,out),/EEXIST/);
  } finally {await rm(temp,{recursive:true,force:true});}
});
test('rejects unsupported inputs and escapes text rather than executing markup',()=>{
  for(const change of [
    q=>q.scenes[0].duration=100,
    q=>q.scenes[0].visual.items[0].amount=-1,
    q=>q.scenes[0].audio='https://example.com/a.mp3',
    q=>q.sources[0].url='javascript:alert(1)',
    q=>q.scenes[0].visual.type='arbitrary-code'
  ]) {const q=structuredClone(queue);change(q);assert.throws(()=>validate(q));}
  const q=structuredClone(queue);q.scenes[0].headline='<img src=x onerror=alert(1)>';
  const html=composition(q);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x'));
});
