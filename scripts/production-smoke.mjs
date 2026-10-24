import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
const before=JSON.parse(await readFile('.data/dispatch-ledger.json','utf8')).entries.length;
const browser=await chromium.launch({headless:true});
try{
  const participant=await browser.newContext({viewport:{width:1440,height:1000}}),page=await participant.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/w/kivi');await page.getByRole('button',{name:'Find my next step'}).waitFor();
  await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Find my next step'))?.disabled);
  assert(await page.getByRole('button',{name:'Edit selected text on Mac',exact:false}).isVisible());
  await mkdir('.evidence',{recursive:true});await page.screenshot({path:'.evidence/release-participant.png',fullPage:true});
  const mentor=await browser.newContext(),mp=await mentor.newPage();await mp.goto('http://127.0.0.1:3000/mentor');await mp.getByLabel('Mentor passcode').fill(process.env.MENTOR_PASSCODE);await mp.getByRole('button',{name:'Open mentor desk'}).click();await mp.getByRole('button',{name:'Reviewed guidance',exact:true}).waitFor();
  const board=await (await mentor.request.get('http://127.0.0.1:3000/api/mentor/board')).json();assert.equal(board.issues.length,0,'Release workspace must start without synthetic issues');assert.equal(board.health.used,before);assert.equal(board.health.enabled,true);assert(board.health.remaining>0);
  await mp.screenshot({path:'.evidence/release-mentor.png',fullPage:true});assert.equal(errors.length,0);
  const after=JSON.parse(await readFile('.data/dispatch-ledger.json','utf8')).entries.length;assert.equal(after,before,'Startup/navigation must not dispatch inference');
  await writeFile('.evidence/production-smoke-result.json',JSON.stringify({passed:true,at:new Date().toISOString(),freshReleaseIssues:board.issues.length,dispatchesBefore:before,dispatchesAfter:after,remaining:board.health.remaining,browserErrors:errors},null,2));
  console.log(`PASS: release participant and mentor pages, private login, empty real queue, zero new inference, ${board.health.remaining} demo submissions remaining.`);
}finally{await browser.close();}
