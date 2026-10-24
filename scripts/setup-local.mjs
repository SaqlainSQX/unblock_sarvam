import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const path='.env.local';let content=existsSync(path)?readFileSync(path,'utf8'):readFileSync('.env.example','utf8');
if(!/^MENTOR_PASSCODE=.{8,}$/m.test(content)){content=content.replace(/^MENTOR_PASSCODE=.*$/m,`MENTOR_PASSCODE=${randomBytes(12).toString('base64url')}`);writeFileSync(path,content,{mode:0o600});}
console.log('Private .env.local prepared. The mentor passcode is stored there; no secret values were printed.');
