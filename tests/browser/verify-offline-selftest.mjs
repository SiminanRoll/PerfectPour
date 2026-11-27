#!/usr/bin/env node
/** Regression cases for the release verifier. Parses fixtures; never runs game JS. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here=dirname(fileURLToPath(import.meta.url));
const wasm=(await readFile(resolve(here,'../../engine/perfect_pour_engine.wasm'))).toString('base64');
const fixtures=[
  ['English help text','const copy="You can import a backup.";',true],
  ['Quoted import calls',String.raw`const a="import('./fake.js')"; const b='import("./fake.js")';`,true],
  ['Line and block comments','// import("./fake.js")\n/* import("./fake.js") */\nconst ok=true;',true],
  ['Template text','const copy=`You can import("./fake.js") a backup.`;',true],
  ['Regexp literal',String.raw`const matcher=/\bimport\s*\(/;`,true],
  ['Regexp named group',String.raw`const matcher=/(?<import>x)\k<import>/;`,true],
  ['Import method name','({import(){return 1;}}).import();',true],
  ['Dynamic import','void import("./dependency.js");',false],
  ['Dynamic import with comments','void import /* a comment */ ("./dependency.js");',false],
  ['Template expression import','const text=`Result: ${import("./dependency.js")}`;',false],
  ['Unreachable dynamic import','if(false) import("./dependency.js");',false],
  ['Static module import','import dependency from "./dependency.js";',false],
  ['Network fetch','fetch("https://example.invalid/asset");',false],
  ['External worker','new Worker("./worker.js");',false]
];
const directory=await mkdtemp(join(here,'.offline-verifier-'));
try {
  for(let index=0;index<fixtures.length;index++){
    const [label,source,expectedPass]=fixtures[index];
    const file=join(directory,`${index}.html`);
    await writeFile(file,`<!doctype html><meta name="viewport" content="width=device-width"><script>const embeddedWasm="${wasm}";\n${source}</script>`);
    const result=spawnSync(process.execPath,[join(here,'verify_offline.mjs'),file],{encoding:'utf8'});
    assert.equal(result.status===0,expectedPass,`${label}:\n${result.stdout}\n${result.stderr}`);
  }
  console.log(`OFFLINE VERIFIER REGRESSIONS: PASS (${fixtures.length} lexical, dependency, and network cases)`);
}finally{
  await rm(directory,{recursive:true,force:true});
}
