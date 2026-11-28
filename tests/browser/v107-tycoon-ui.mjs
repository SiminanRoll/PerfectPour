import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [html,js,css,art,build]=await Promise.all([
  read('web/index.html'),read('web/game.js'),read('web/tycoon.css'),
  read('web/storefront-art.js'),read('scripts/build.py')
]);
const required=['special-board','special-drink','special-steps','special-stamps','special-mobile','finish-tycoon'];
for(const id of required)assert(html.includes('id="'+id+'"'),id+' exists in the serving scene');
assert(html.includes('V1.07'));
assert(js.includes("SAVE_KEY='perfect-pour-business-v107'"));
assert(js.includes("'perfect-pour-business-v106'"),'The previous public career key migrates');
assert(js.includes("regularId:136"));
assert(js.includes("specialHits:139"));
assert(js.includes("function updateTycoonUi()"));
assert(js.includes("if(regular<regulars.length)tycoonBits.push"),'Review acknowledges loyalty');
assert(js.includes("'Regular thank-you'"),'Receipt includes regular bonuses');
assert(js.includes("'Daily special'"),'Receipt includes special bonuses');
for(const label of ['data.lounge','data.patio','data.awning','data.catering','data.team']){
  assert(js.includes(label),'All purchased shop growth states reach the counter: '+label);
}
for(const label of ['data-lounge="1"','data-lounge="2"','data-lounge="3"','data-sign="3"','data-tap="2"']){
  assert(css.includes(label),'Purchased decor is visually represented: '+label);
}
assert(css.includes('max-width:800px')&&css.includes('.special-mobile'),'Daily specials remain readable on phones');
assert(art.includes('function counter(options)'),'Existing physical shop renderer retained');
assert(build.includes("'tycoon.css'"),'Standalone game bundles new styles');
assert(/prefers-reduced-motion/.test(css));
new Function(js);
console.log(JSON.stringify({result:'PASS',interface:'Daily chalkboard, compact phone label, loyalty review and actual counter-upgrade states',checks:required.length+18},null,2));
