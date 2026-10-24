export function encodeWav(chunks: Float32Array[], sourceRate: number, targetRate=16000) {
  const total=chunks.reduce((n,c)=>n+c.length,0), merged=new Float32Array(total);let cursor=0;for(const chunk of chunks){merged.set(chunk,cursor);cursor+=chunk.length;}
  const count=Math.min(Math.floor(total*targetRate/sourceRate),targetRate*20), buffer=new ArrayBuffer(44+count*2),view=new DataView(buffer);
  function text(offset:number,value:string){for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));}
  text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,targetRate,true);view.setUint32(28,targetRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
  for(let i=0;i<count;i++){const from=Math.floor(i*sourceRate/targetRate),to=Math.max(from+1,Math.floor((i+1)*sourceRate/targetRate));let sum=0;for(let j=from;j<Math.min(to,total);j++)sum+=merged[j];const sample=Math.max(-1,Math.min(1,sum/Math.max(1,Math.min(to,total)-from)));view.setInt16(44+i*2,sample<0?sample*32768:sample*32767,true);}
  return buffer;
}
