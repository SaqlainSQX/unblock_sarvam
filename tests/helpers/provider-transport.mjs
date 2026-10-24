// Test-only transport interception, preloaded by the browser harness. Never imported by src.
import { readFileSync } from 'node:fs';
const nativeFetch=globalThis.fetch;
const reply=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
globalThis.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(url.hostname==='api.sarvam.ai'){
    if(url.pathname==='/speech-to-text')return reply({transcript:'How can I edit selected text in Kivi?',language_code:'en-IN',request_id:'offline-asr'});
    if(url.pathname==='/text-to-speech'){const body=JSON.parse(init.body);if(!body.text||body.target_language_code)throw new Error('Invalid TTS serialization');return reply({audios:[readFileSync('fixtures/media/question-en.wav').toString('base64')],request_id:'offline-tts'});}
    if(url.pathname==='/doc-ai/v1/job/extract')return reply({job_id:'offline-job',status:'pending'});
    if(url.pathname.endsWith('/status'))return reply({status:'completed'});
    if(url.pathname.endsWith('/results'))return reply({result:{visible_text:'How can I edit selected text in Kivi?',error_code:''}});
    if(url.pathname==='/v1/chat/completions'){
      const body=JSON.parse(init.body),issue=JSON.parse(body.messages[1].content);const known=/edit selected text/i.test(issue.reviewedText)&&issue.context.os==='macos'&&issue.context.distribution==='public';
      const proposal={intent:known?'faq':'mentor',faqId:known?'kivi-selected-text':null,groupId:null,evidence:known?[{field:'reviewedText',quote:'edit selected text'}]:[],needsClarification:false,clarification:null,reasonCode:known?'supported_faq':'no_supported_answer'};
      return reply({choices:[{message:{content:JSON.stringify(proposal)},finish_reason:'stop'}],usage:{total_tokens:1}});
    }
    throw new Error(`Unmocked inference path denied: ${url.pathname}`);
  }
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error(`External network blocked by offline test harness: ${url.hostname}`);
  return nativeFetch(input,init);
};
