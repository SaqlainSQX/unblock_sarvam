// Explicit, resumable integration check. Only the application dispatch ledger authorizes paid work.
import { spawn } from 'node:child_process';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
type MediaResult={id:string;status:string;text:string;error:string|null;provenance?:string};
type Evidence={cookie?:string;asr?:MediaResult;vision?:MediaResult;issue?:{id:string;helpState:string;processingState:string;processingError?:string;deliveries:{answer:{id:string;faqId?:string}}[]};tts?:{audioIds:string[];provenance:string};failures:Record<string,string>;finishedAt?:string};
const evidencePath=resolve('.evidence/live-smoke.json');
const origin='http://127.0.0.1:3200';
async function main(){
  assert(process.argv.includes('--confirm-live'),'Paid calls disabled: use npm run test:live -- --confirm-live only after all offline checks pass.');
  assert(process.env.SARVAM_API_KEY,'Set SARVAM_API_KEY privately in .env.local before this final integration gate.');
  const configuredLimit=Number(process.env.LIVE_MAX_DISPATCHES||'6');assert(configuredLimit<=6&&configuredLimit>0,'Validation cap must be between one and six.');
  await mkdir('.evidence',{recursive:true});
  let evidence:Evidence={failures:{}};try{evidence=JSON.parse(await readFile(evidencePath,'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const save=()=>writeFile(evidencePath,JSON.stringify(evidence,null,2),{mode:0o600});
  const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3200'],{stdio:'ignore',env:{...process.env,ALLOW_LIVE_API:'true',DATA_DIR:'.data/live-validation',DISPATCH_LEDGER_PATH:process.env.DISPATCH_LEDGER_PATH||'.data/dispatch-ledger.json',PROVIDER_CACHE_DIR:process.env.PROVIDER_CACHE_DIR||'.data/provider-cache'}});
  try{
    let ready=false;for(let i=0;i<60;i++){try{if((await fetch(`${origin}/api/health`)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert(ready,'Production smoke server did not start. Build the app first.');
    async function request<T>(path:string,body?:unknown,method='POST'):Promise<T>{const response=await fetch(`${origin}/api/${path}`,{...(body===undefined?{}:{method}),headers:{...(evidence.cookie?{Cookie:evidence.cookie}:{}),Origin:origin,'Idempotency-Key':randomUUID(),...(body===undefined||body instanceof FormData?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:body instanceof FormData?body:JSON.stringify(body)})});const cookie=response.headers.get('set-cookie');if(cookie){evidence.cookie=cookie.split(';')[0];await save();}const result=await response.json();if(!response.ok)throw new Error(result.error||`HTTP ${response.status}`);return result as T;}
    try{await request('me');}catch{await request('session',{});}
    async function upload(path:string,mime:string){const form=new FormData();form.append('file',new Blob([new Uint8Array(await readFile(path))],{type:mime}),path.split('/').at(-1)!);return request<MediaResult>('media',form);}
    if(!evidence.asr&&!evidence.failures.asr){try{const media=await upload('fixtures/media/question-en.wav','audio/wav');evidence.asr=await request<MediaResult>(`media/${media.id}/process`,{language:'en-IN'});assert(evidence.asr.status==='complete',evidence.asr.error||'ASR did not complete');assert(evidence.asr.text.trim(),'Empty transcription');console.log('ASR: live application route passed.');await save();}catch(error){evidence.failures.asr=error instanceof Error?error.message:'ASR failed';await save();throw error;}}
    if(!evidence.vision&&!evidence.failures.vision){try{const media=await upload('fixtures/media/question-card.png','image/png');evidence.vision=await request<MediaResult>(`media/${media.id}/process`,{language:'en-IN'});await save();}catch(error){evidence.failures.vision=error instanceof Error?error.message:'Vision failed';await save();}}
    if(evidence.vision?.status==='processing'){for(let i=0;i<20&&evidence.vision.status==='processing';i++){await new Promise(r=>setTimeout(r,5000));evidence.vision=await request<MediaResult>(`media/${evidence.vision.id}/status`);await save();}}
    if(evidence.vision?.status==='complete')console.log('Vision: live application route passed.');else if(evidence.vision){evidence.failures.vision=evidence.vision.error||'Vision still processing; resume the existing job rather than resubmitting.';await save();}
    if(!evidence.issue&&!evidence.failures.chat){
      try{const transcript=evidence.asr?.status==='complete'?evidence.asr.text:'How can I edit selected text in Kivi?';evidence.issue=await request<NonNullable<Evidence['issue']>>('issues',{reviewedText:transcript,transcript,ocrText:evidence.vision?.status==='complete'?evidence.vision.text:'',context:{os:'macos',distribution:'public',version:null},mediaIds:[evidence.asr?.id,evidence.vision?.id].filter(Boolean)});await save();assert(evidence.issue.helpState==='answer_available'&&evidence.issue.deliveries.at(-1)?.answer.faqId==='kivi-selected-text',evidence.issue.processingError||'Chat did not select the supported FAQ');console.log('Chat: live grounded classification passed.');}catch(error){evidence.failures.chat=error instanceof Error?error.message:'Chat failed';await save();}
    }
    if(!evidence.tts&&!evidence.failures.tts){const answerId=evidence.issue?.deliveries.at(-1)?.answer.id;if(answerId){try{evidence.tts=await request(`answers/${answerId}/audio`,{language:'en-IN'});for(const id of evidence.tts!.audioIds){const response=await fetch(`${origin}/api/media/${id}/content`,{headers:{Cookie:evidence.cookie!}});assert(response.ok);const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.toString('ascii',0,4)==='RIFF');await writeFile(resolve('.evidence',`live-tts-${id}.wav`),bytes,{mode:0o600});}console.log('TTS: live application route returned valid WAV audio.');await save();}catch(error){evidence.failures.tts=error instanceof Error?error.message:'TTS failed';await save();}}}
    evidence.finishedAt=new Date().toISOString();await save();
    const ledger=JSON.parse(await readFile(process.env.DISPATCH_LEDGER_PATH||'.data/dispatch-ledger.json','utf8'));console.log(`Implementation inference dispatches used: ${ledger.entries.length}/${configuredLimit}.`);
    if(Object.keys(evidence.failures).length){for(const [capability,error] of Object.entries(evidence.failures))console.log(`${capability}: ${error}`);process.exitCode=1;}else assert(evidence.asr&&evidence.vision?.status==='complete'&&evidence.issue&&evidence.tts,'Incomplete live integration.');
  }finally{server.kill();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Integration check failed');process.exitCode=1;});
