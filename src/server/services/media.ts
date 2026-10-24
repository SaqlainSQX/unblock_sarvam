import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { AppError, requireValue } from '@/domain/errors';
import type { Media, Session } from '@/domain/types';
import { hash } from '../auth';
import { getStore, serialized, type Store } from '../store';
import { readExtraction, speak, submitExtraction, transcribe } from '../providers';
import { WorkshopService } from './workshop';
export function validateWav(bytes: Buffer) {
  if (bytes.length < 44 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WAVE') throw new AppError(400,'Upload a genuine PCM WAV recording.');
  let rate=0,channels=0,bits=0,data=0,format=0,byteRate=0;
  for(let offset=12; offset+8<=bytes.length;) { const size=bytes.readUInt32LE(offset+4),type=bytes.toString('ascii',offset,offset+4); if(offset+8+size>bytes.length) throw new AppError(400,'The WAV recording is incomplete.'); if(type==='fmt ' && size>=16){format=bytes.readUInt16LE(offset+8);channels=bytes.readUInt16LE(offset+10);rate=bytes.readUInt32LE(offset+12);byteRate=bytes.readUInt32LE(offset+16);bits=bytes.readUInt16LE(offset+22);} if(type==='data') data+=size;offset+=8+size+(size%2); }
  if(format!==1 || channels!==1 || bits!==16 || rate<8000 || rate>48000 || byteRate!==rate*2 || data===0 || data/byteRate>20.1) throw new AppError(400,'Use a mono 16-bit PCM WAV recording up to 20 seconds long.');
  return data/byteRate;
}
export async function validateMedia(bytes: Buffer,mime: string): Promise<'image'|'audio'> {
  if(!bytes.length || bytes.length>5*1024*1024) throw new AppError(413,'Use one image or recording up to 5 MB.');
  if(['audio/wav','audio/wave','audio/x-wav'].includes(mime)) {validateWav(bytes);return 'audio';}
  const png=mime==='image/png' && bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a';
  const jpg=mime==='image/jpeg' && bytes.subarray(0,3).toString('hex')==='ffd8ff';
  if(!png && !jpg) throw new AppError(400,'Use a valid PNG/JPEG image or PCM WAV recording.');
  try { const image=sharp(bytes,{limitInputPixels:16_000_000}); const metadata=await image.metadata(); if(!metadata.width || !metadata.height || metadata.width>6000 || metadata.height>6000 || (metadata.pages || 1)>1) throw new Error('Dimensions'); await image.resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).toBuffer(); } catch {throw new AppError(400,'This image is invalid or too large to process.');}
  return 'image';
}
export class MediaService {
  constructor(readonly store: Store=getStore()) {}
  async upload(actor:Session,bytes:Buffer,mime:string,key:string) {
    const kind=await validateMedia(bytes,mime); const fingerprint=hash(bytes); const service=new WorkshopService(this.store);
    return service.mutate(actor,'media:upload',key,{fingerprint,mime},state=>{
      const id=randomUUID(),path=resolve(resolve(this.store.path,'..'),'uploads',id);
      const media:Media={id,ownerSessionId:actor.id,mime:kind==='audio'?'audio/wav':mime,bytes:bytes.length,hash:fingerprint,path,kind,status:'idle',text:'',error:null,jobId:null,createdAt:new Date().toISOString()};
      state.media.push(media);return media;
    }).then(async media=>{await mkdir(resolve(media.path,'..'),{recursive:true});await writeFile(media.path,bytes,{mode:0o600});return this.safe(media);});
  }
  safe(media:Media){return {id:media.id,kind:media.kind,mime:media.mime,status:media.status,text:media.text,error:media.error,provenance:media.provenance};}
  async owned(actor:Session,id:string){return requireValue((await this.store.read()).media.find(m=>m.id===id && (m.ownerSessionId===actor.id || actor.role==='mentor')));}
  async process(actor:Session,id:string,language='en-IN') {
    return serialized(`${this.store.path}:media:${id}`,async()=>{
      const media=await this.owned(actor,id); if(media.status==='complete')return this.safe(media);
      if(media.kind==='image' && media.jobId)return this.status(actor,id,true);
      if(media.status==='processing')throw new AppError(409,'This attachment is already being processed.');
      await this.store.transaction(state=>{const m=requireValue(state.media.find(m=>m.id===id));m.status='processing';m.error=null;});
      try {
        const bytes=await readFile(media.path);
        if(media.kind==='audio') {const result=await transcribe(media.ownerSessionId,bytes,media.mime);await this.store.transaction(state=>{const m=requireValue(state.media.find(m=>m.id===id));m.status='complete';m.text=result.value.text;m.provenance=result.meta.provenance;});}
        else {const result=await submitExtraction(media.ownerSessionId,bytes,media.mime,language);await this.store.transaction(state=>{const m=requireValue(state.media.find(m=>m.id===id));m.jobId=result.value.jobId;m.provenance=result.meta.provenance;});}
      } catch(error){await this.fail(id,error);}
      return this.safe(await this.owned(actor,id));
    });
  }
  async fail(id:string,error:unknown){await this.store.transaction(state=>{const m=requireValue(state.media.find(m=>m.id===id));m.status='failed';m.error=error instanceof AppError?error.message:'We could not read this attachment. Enter the text manually.';});}
  async status(actor:Session,id:string,resume=false){
    const media=await this.owned(actor,id);if(media.kind!=='image'||!media.jobId||media.status==='complete')return this.safe(media);
    if(media.status==='failed'&&!resume)return this.safe(media);
    try {const result=await readExtraction(media.jobId);await this.store.transaction(state=>{const m=requireValue(state.media.find(m=>m.id===id));m.status=result.status==='completed'?'complete':'processing';m.text=result.text;m.error=null;});}catch(error){await this.fail(id,error);}
    return this.safe(await this.owned(actor,id));
  }
  async audio(actor:Session,answerId:string,language:string){
    const state=await this.store.read();const answer=requireValue(state.answers.find(a=>a.id===answerId));
    if(actor.role!=='mentor'&&!state.deliveries.some(d=>d.answerId===answerId&&state.issues.some(i=>i.id===d.issueId&&i.ownerSessionId===actor.id)))throw new AppError(404,'Answer not found.');
    const faq=state.faqs.find(f=>f.id===answer.faqId||f.answerId===answerId);
    if(faq&&(faq.withdrawnAt||(answer.faqRevision?faq.revision!==answer.faqRevision:faq.revision>1)))throw new AppError(409,'This answer changed. Ask for current guidance before playing it.');
    const text=language==='hi-IN'?answer.bodyHi:answer.bodyEn;if(!text)throw new AppError(400,'A reviewed answer in that language is not available.');
    const result=await speak(actor.id,answer.id,text.slice(0,450),language,`${faq?.revision||answer.version}`);
    const audioIds:string[]=[];
    for(const encoded of result.value.audios){const bytes=Buffer.from(encoded,'base64'),id=randomUUID(),path=resolve(resolve(this.store.path,'..'),'uploads',id);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,bytes,{mode:0o600});await this.store.transaction(state=>{state.media.push({id,ownerSessionId:actor.id,mime:'audio/wav',bytes:bytes.length,hash:hash(bytes),path,kind:'audio',status:'complete',text:'',error:null,jobId:null,provenance:result.meta.provenance,createdAt:new Date().toISOString()});});audioIds.push(id);}
    return {audioIds,provenance:result.meta.provenance,excerpt:text.length>450};
  }
}
