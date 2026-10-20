import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = message => { throw new Error(message); };
const text = (value, name, max) => typeof value === 'string' && value.trim() && value.length <= max
  ? value : fail(`${name} must contain 1–${max} characters.`);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function validate(input) {
  if (!input || typeof input !== 'object') fail('Input must be an object.');
  text(input.title, 'title', 70); text(input.summary, 'summary', 240);
  if (!Array.isArray(input.sources) || input.sources.length < 1 || input.sources.length > 8) fail('Provide 1–8 sources.');
  for (const source of input.sources) {
    text(source.title, 'source title', 120); text(source.note, 'source note', 600);
    if (!/^https:\/\//.test(text(source.url, 'source URL', 600))) fail('Source URLs must use HTTPS.');
    new URL(source.url);
  }
  if (!Array.isArray(input.scenes) || input.scenes.length < 4 || input.scenes.length > 6) fail('Provide 4–6 scenes.');
  for (const [i, scene] of input.scenes.entries()) {
    text(scene.tag, `scene ${i + 1} tag`, 28);
    text(scene.headline, 'headline', 52); text(scene.caption, 'caption', 110);
    if (scene.narration !== undefined) text(scene.narration, 'narration', 400);
    if (!Number.isFinite(scene.duration) || scene.duration < 4 || scene.duration > 12) fail('Scene duration must be 4–12 seconds.');
    if (scene.audio !== undefined && (typeof scene.audio !== 'string' || !scene.audio || /^[a-z]+:/i.test(scene.audio))) fail('audio must be a local file path.');
    const v = scene.visual;
    if (!v || !['flow', 'bars', 'equation'].includes(v.type)) fail('Unknown visual type.');
    text(v.note, 'visual note', 70);
    if (!Array.isArray(v.items) || v.items.length < 2 || v.items.length > 4) fail('Visuals need 2–4 items.');
    if (v.type === 'equation' && v.items.length !== 3) fail('Equation needs exactly 3 items.');
    for (const item of v.items) {
      text(item.label, 'item label', 22); text(item.value, 'item value', 16);
      if (!Number.isInteger(item.amount) || item.amount < 0 || item.amount > 12) fail('amount must be an integer from 0 to 12.');
      if (item.tone && !['cyan', 'amber'].includes(item.tone)) fail('Unknown tone.');
    }
  }
  const duration = input.scenes.reduce((n, s) => n + s.duration, 0);
  if (duration < 30 || duration > 45) fail('Total duration must be 30–45 seconds.');
  return duration;
}

export function composition(input) {
  const duration = validate(input);
  let start = 0;
  const scenes = input.scenes.map((scene, i) => {
    const begin = start; start += scene.duration;
    const v = scene.visual;
    const items = v.items.map((item, j) => {
      const tone = item.tone === 'amber' ? 'amber' : 'cyan';
      const units = Array.from({length: item.amount}, (_, k) => `<i class="unit" data-delay="${(j * .65 + k * .18).toFixed(2)}"></i>`).join('');
      if (v.type === 'bars') return `<div class="bar-row ${tone}" data-reveal="${j * .6}"><div class="row-top"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div><div class="units">${units}</div></div>`;
      const operator = v.type === 'equation' && j > 0 ? `<span class="operator">${j === 1 ? '+' : '='}</span>` : '';
      return `${operator}<div class="node ${tone}" data-reveal="${j * .65}"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong>${v.type === 'equation' && item.amount ? `<div class="equation-units">${units}</div>` : ''}</div>`;
    }).join(v.type === 'flow' ? '<div class="connector" aria-hidden="true"><b>→</b><i class="signal"></i></div>' : '');
    return `<section id="scene-${i}" class="clip scene" data-start="${begin}" data-duration="${scene.duration}" data-track-index="1">
      <div class="content">
        <p class="tag" data-reveal="0">${esc(scene.tag)}</p>
        <h1 data-reveal=".12">${esc(scene.headline)}</h1>
        <div class="diagram ${v.type}">${items}</div>
        <p class="note" data-reveal="1.8">${esc(v.note)}</p>
        <p class="caption" data-reveal=".3">${esc(scene.caption)}</p>
      </div>
      <div class="progress"><i></i></div>
    </section>${scene.audio ? `<audio id="voice-${i}" src="${esc(scene.audio)}" data-start="${begin + .15}" data-duration="${scene.duration - .3}" data-track-index="2"></audio>` : ''}`;
  }).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><title>${esc(input.title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#071c2c;color:#e8f5f9;font-family:sans-serif}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#071c2c}
.ground{position:absolute;inset:0;background-image:linear-gradient(#23607828 1px,transparent 1px),linear-gradient(90deg,#23607828 1px,transparent 1px);background-size:54px 54px}
.orbital{position:absolute;width:1000px;height:1000px;border:2px solid #43cfde26;border-radius:50%;left:30px;top:1070px}
.orbital:after{content:"";position:absolute;inset:110px;border:1px dashed #43cfde38;border-radius:50%}
.cross{position:absolute;width:36px;height:36px;border-top:2px solid #73dce3;border-left:2px solid #73dce3;opacity:.5}
.cross.a{top:240px;left:70px}.cross.b{top:1280px;left:890px;transform:rotate(180deg)}
.brand{position:absolute;left:85px;top:205px;font:24px monospace;letter-spacing:5px;color:#8fb9cb}
.scene{position:absolute;inset:0}.content{position:absolute;left:85px;top:295px;width:810px}
.tag{margin:0;color:#80e4e8;font:24px monospace;letter-spacing:2px}
h1{font-size:68px;line-height:1.1;letter-spacing:-2px;max-width:800px;height:164px;margin:36px 0 28px;font-weight:750}
.diagram{height:320px;width:810px;display:flex;align-items:center;gap:12px}
.node{min-width:0;flex:1;min-height:180px;border:2px solid currentColor;background:#0b2638;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 10px;border-radius:5px}
.cyan{color:#80e4e8}.amber{color:#ffd18d}.node span{font:19px monospace;line-height:1.4;text-align:center;min-height:53px;display:flex;align-items:center}.node strong{font-size:42px;line-height:1.25;white-space:nowrap}
.connector{width:28px;position:relative;color:#92b7c4;font-size:28px}.signal{position:absolute;width:10px;height:10px;border-radius:50%;background:#80e4e8;top:36px;left:0}
.bars{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:24px}
.bar-row{width:100%}.row-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}.row-top span{font:23px monospace}.row-top strong{font-size:34px}.units{display:flex;gap:10px;height:24px}.unit{display:block;width:48px;height:24px;border:1px solid currentColor;background:currentColor;box-shadow:0 0 15px #80e4e818}
.equation .node{border:0;background:transparent;padding:8px}.equation strong{font-size:68px}.operator{font-size:46px;color:#9abcc8}
.equation-units{display:flex;gap:6px;flex-wrap:wrap;width:170px;margin-top:20px}.equation-units .unit{width:27px;height:18px}
.note{font:23px/1.4 monospace;color:#a5c3cf;margin:20px 0 0;min-height:66px}
.caption{font-size:36px;line-height:1.35;font-weight:500;color:#eef8fa;border-top:1px solid #4c7c8a;padding-top:26px;margin:26px 0 0;max-width:805px}
.progress{position:absolute;left:85px;top:1215px;width:810px;height:3px;background:#1d4051}.progress i{display:block;height:100%;width:100%;background:#80e4e8;transform-origin:left}
</style></head><body>
<div id="root" data-composition-id="blueprint" data-no-timeline data-start="0" data-width="1080" data-height="1920" data-duration="${duration}">
<div class="ground" aria-hidden="true"></div><div class="orbital" aria-hidden="true" data-layout-allow-overflow></div><div class="cross a" aria-hidden="true"></div><div class="cross b" aria-hidden="true"></div>
<div class="brand">FEEDSKILLS / BLUEPRINT LAB</div>${scenes}
</div>
<script>
function motion(el, frames, duration, delay, easing='cubic-bezier(.22,.8,.25,1)') {
  const a=el.animate(frames,{duration:duration*1000,delay:delay*1000,fill:'both',iterations:1,easing});a.pause();
}
document.querySelectorAll('.scene').forEach(scene=>{
 const start=Number(scene.dataset.start),duration=Number(scene.dataset.duration);
 scene.querySelectorAll('[data-reveal]').forEach(el=>motion(el,[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],.7,start+Number(el.dataset.reveal)));
 scene.querySelectorAll('.unit').forEach(el=>motion(el,[{opacity:.08,transform:'scaleY(.15)'},{opacity:1,transform:'scaleY(1)'}],.4,start+1.1+Number(el.dataset.delay)));
 scene.querySelectorAll('.signal').forEach((el,i)=>motion(el,[{transform:'translateX(-8px)',opacity:0},{opacity:1,offset:.2},{transform:'translateX(25px)',opacity:0}],Math.max(2,duration-2),start+1+i*.4,'linear'));
 motion(scene.querySelector('.progress i'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],duration,start,'linear');
});
</script></body></html>`;
}

function run(command, args) {
  const result = spawnSync(command, args, {encoding:'utf8'});
  if (result.error || result.status !== 0) fail(`${command} failed: ${result.error?.message || result.stderr}`);
  return result.stdout.trim();
}

export async function create(inputPath, output) {
  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  const duration = validate(input);
  // Validate every source before reserving the destination; never overwrite a project.
  const audios = [];
  for (const [i, scene] of input.scenes.entries()) if (scene.audio) {
    const source = resolve(dirname(inputPath), scene.audio);
    const ext = extname(source).toLowerCase();
    if (!['.wav','.mp3','.m4a'].includes(ext)) fail('Audio must be WAV, MP3 or M4A.');
    const metadata = JSON.parse(run('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_type','-of','json',source]));
    const length = Number(metadata.format?.duration);
    if (!metadata.streams?.some(s => s.codec_type === 'audio') || !Number.isFinite(length) || length <= 0 || length > scene.duration - .3) fail(`Scene ${i+1} audio does not fit (${length}s). Adjust scene duration or audio.`);
    audios.push({source, target:`audio-${i}${ext}`});
    scene.audio = `audio-${i}${ext}`;
  }
  await mkdir(output);
  for (const audio of audios) await copyFile(audio.source, resolve(output, audio.target));
  const version = '0.8.181';
  const hf = `HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@${version}`;
  const packageJson = {name:'blueprint-video',private:true,type:'module',scripts:{check:`${hf} check`,preview:`${hf} preview --background`,render:'node render.mjs'}};
  let t = 0;
  const stamp = seconds => new Date(Math.round(seconds*1000)).toISOString().slice(11,23).replace('.',',');
  const srt = input.scenes.map((s,i)=>{const begin=t;t+=s.duration;return `${i+1}\n${stamp(begin)} --> ${stamp(t)}\n${s.caption}\n`;}).join('\n');
  const files = {
    'index.html': composition(input),
    'input.json': JSON.stringify(input,null,2)+'\n',
    'package.json': JSON.stringify(packageJson,null,2)+'\n',
    'hyperframes.json': JSON.stringify({paths:{assets:'assets'},media:{autoProxy:true}},null,2)+'\n',
    'captions.srt': srt,
    'sources.md': input.sources.map(s=>`- [${s.title}](${s.url})\n  ${s.note}`).join('\n')+'\n',
    'publish.md': `${input.title}\n\n${input.summary}\n\nMade with FeedSkills Blueprint Lab.\nhttps://feedskills.com/skills/blueprint-explainer/\n`,
    'BRIEF.md': `---\nworkflow: faceless-explainer\nflow: automation\nstoryboard: no\naspect: "9:16"\nlanguage: en\nlength: ${duration}\n---\n\n${input.title}\n\n${input.summary}\n\nBlueprint Lab: original navy grid, cyan signals, amber bottlenecks. ${audios.length ? 'Local user-supplied scene audio.' : 'Silent export; no narration has been generated.'}\n`,
  };
  for (const [name, body] of Object.entries(files)) await writeFile(resolve(output,name),body);
  await copyFile(resolve(skill,'scripts/render.mjs'),resolve(output,'render.mjs'));
  await writeFile(resolve(output,'README.md'),`# ${input.title}\n\nRun npm run check, then npm run preview. Review the film, then npm run render.\n\n${duration}s · 1080×1920 · 30fps · ${audios.length}/${input.scenes.length} scenes have supplied audio.\n\nEdit input.json and create a new project to change content. Direct HTML changes are also supported; keep that project instead of regenerating over it.\n`);
  return {output, duration, audioScenes:audios.length};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command,input,flag,out] = process.argv.slice(2);
    if (command === 'doctor') {
      if (Number(process.versions.node.split('.')[0]) < 22) fail('Install Node.js 22 or newer.');
      console.log({node:process.versions.node,ffmpeg:run('ffmpeg',['-version']).split('\n')[0],ffprobe:run('ffprobe',['-version']).split('\n')[0]});
    } else if (command === 'create' && input && flag === '--out' && out) {
      console.log(await create(resolve(input),resolve(out)));
    } else fail('Usage: project.mjs doctor | create input.json --out NEW_DIRECTORY');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
