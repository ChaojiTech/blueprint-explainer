import { spawnSync } from 'node:child_process';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = dirname(fileURLToPath(import.meta.url));
function run(cmd, args, capture=false) {
  const r = spawnSync(cmd,args,{cwd,env:{...process.env,HYPERFRAMES_SKIP_SKILLS:'1'},encoding:'utf8',stdio:capture?'pipe':'inherit'});
  if (r.error || r.status !== 0) throw new Error(`${cmd} failed (${r.status}): ${r.error?.message || r.stderr || 'see output above'}`);
  return r.stdout;
}
try {
  const video = resolve(cwd,'video.mp4');
  try { await stat(video); throw new Error('video.mp4 already exists. Keep this version and use a new project folder.'); }
  catch(e) { if(e.code !== 'ENOENT') throw e; }
  run('npx',['--yes','hyperframes@0.8.181','render',cwd,'--quality','delivery','--fps','30','--output',video]);
  const metadata = JSON.parse(run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',video],true));
  const stream = metadata.streams.find(s=>s.codec_type==='video');
  if (stream?.width !== 1080 || stream?.height !== 1920 || !Number.isFinite(Number(metadata.format?.duration))) throw new Error('Unexpected output dimensions or duration.');
  run('ffmpeg',['-v','error','-i',video,'-f','null','-']);
  run('ffmpeg',['-v','error','-n','-ss','2.5','-i',video,'-frames:v','1','-q:v','2',resolve(cwd,'cover.jpg')]);
  const report = {createdAt:new Date().toISOString(),hyperframes:'0.8.181',sha256:createHash('sha256').update(await readFile(video)).digest('hex'),width:stream.width,height:stream.height,duration:Number(metadata.format.duration),hasAudio:metadata.streams.some(s=>s.codec_type==='audio'),decode:'passed',visualReview:'not recorded by this script',listeningReview:'not recorded by this script'};
  await writeFile(resolve(cwd,'render-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(report);
} catch(e) { console.error(e.message); process.exitCode=1; }
