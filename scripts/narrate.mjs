import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validate } from './project.mjs';

try {
  const [inputPath,flag,output]=process.argv.slice(2);
  if(!inputPath || flag!=='--out' || !output) throw new Error('Usage: narrate.mjs input.json --out NEW_DIRECTORY');
  const input=JSON.parse(await readFile(inputPath,'utf8'));validate(input);
  if(input.scenes.some(s=>!s.narration || s.audio)) throw new Error('Every scene needs narration and must not already have audio.');
  await mkdir(resolve(output));
  for(const [i,scene] of input.scenes.entries()){
    const audio=`scene-${i}.wav`;
    const r=spawnSync('npx',['--yes','hyperframes@0.8.181','tts',scene.narration,'--voice','af_heart','--speed','1.05','--output',resolve(output,audio)],{stdio:'inherit',env:{...process.env,HYPERFRAMES_SKIP_SKILLS:'1'}});
    if(r.error || r.status!==0) throw new Error(`Narration failed in scene ${i+1}; completed files remain in ${output}.`);
    const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',resolve(output,audio)],{encoding:'utf8'});
    const seconds=Number(probe.stdout);
    if(probe.error || probe.status!==0 || !Number.isFinite(seconds) || seconds<=0) throw new Error(`Cannot measure scene ${i+1} audio.`);
    scene.duration=Math.max(scene.duration,Math.ceil((seconds+.6)*10)/10);
    scene.audio=audio;
  }
  await writeFile(resolve(output,'input.json'),JSON.stringify(input,null,2)+'\n');
  validate(input);
  console.log(`Local narration ready: ${resolve(output,'input.json')}`);
} catch(error){console.error(error.message);process.exitCode=1;}
