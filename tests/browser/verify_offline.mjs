#!/usr/bin/env node
/** Static portability check for the actual single-file release, not gameplay QA. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const file = resolve(process.argv[2] || 'dist/index.html');
const html = await readFile(file, 'utf8');
const failures = [];
const checks = [];
const fail = message => failures.push(message);
const check = message => checks.push(message);
const attrs = tag => {
  const found = new Map();
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    found.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4]);
  }
  return found;
};
const selfContained = value => !value || /^(?:data:|blob:|#)/i.test(value.trim());

// Let the JavaScript parser distinguish executable import expressions from
// strings, comments, regular expressions, and literal portions of templates.
// Replacing import with the reserved word default is valid in those lexical
// contexts and as a property name, but invalid where import(...) is an actual
// expression. Compare the parser's exact diagnostic so a renamed regexp named
// group/backreference is not mistaken for an executable import. No code runs.
let importProbeDiagnostic;
try { new vm.Script('default("probe")'); }
catch (error) { importProbeDiagnostic = error.message; }
const hasDynamicImport = source => {
  for (const match of source.matchAll(/\bimport\b/g)) {
    const probe = source.slice(0, match.index) + 'default' + source.slice(match.index + match[0].length);
    try { new vm.Script(probe); }
    catch (error) { if (error.message === importProbeDiagnostic) return true; }
  }
  return false;
};

if (!/<!doctype\s+html/i.test(html)) fail('Missing HTML5 doctype.');
if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) fail('Missing mobile viewport metadata.');

// Resource-bearing tags only: an ordinary external hyperlink is not a runtime
// dependency, and SVG xmlns attributes are declarations rather than requests.
for (const tag of html.match(/<(?:script|img|audio|video|source|iframe|object|embed|image|use|link)\b[^>]*>/gi) || []) {
  const a = attrs(tag);
  const name = tag.match(/^<([a-z]+)/i)[1].toLowerCase();
  const resourceAttrs = ['src', 'srcset', 'poster', 'data', 'xlink:href'];
  if (['image', 'use'].includes(name)) resourceAttrs.push('href');
  if (name === 'link' && /\b(?:stylesheet|preload|modulepreload|prefetch|icon|manifest)\b/i.test(a.get('rel') || '')) {
    resourceAttrs.push('href');
  }
  for (const attr of resourceAttrs) {
    if (a.has(attr) && !selfContained(a.get(attr))) fail(`External or relative resource: ${name}[${attr}]=${a.get(attr)}`);
  }
}
check('Resource tags do not require a server or companion files.');

const cssBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(m => m[1]);
for (const css of cssBlocks) {
  if (/@import\b/i.test(css)) fail('CSS @import is not self-contained.');
  for (const m of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    if (!selfContained(m[2])) fail(`External or relative CSS resource: ${m[2]}`);
  }
}
check('Styles do not import network fonts, images, or other stylesheets.');

let scriptCount = 0;
let wasmCount = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
  const a = attrs(match[1]);
  const type = (a.get('type') || '').toLowerCase();
  if (a.has('src')) continue;
  if (type && !['text/javascript', 'application/javascript', 'module'].includes(type)) continue;
  scriptCount++;
  const source = match[2];
  if (type === 'module') fail('Module scripts are unsuitable for this file:// release; bundle into a classic inline script.');
  try { new vm.Script(source, { filename: `release-inline-${scriptCount}.js` }); }
  catch (error) { fail(`Inline JavaScript syntax: ${error.message}`); }
  if (/\b(?:fetch|importScripts)\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker)\s*\(|\bnavigator\.serviceWorker\b/.test(source)) {
    fail('Review network/worker use: release must instantiate embedded bytes and work directly from file://.');
  }
  if (hasDynamicImport(source)) fail('An unbundled JavaScript import remains.');

  // A standard Wasm binary begins with \0asm and version 1. Detect its base64
  // form independently of the renderer's chosen constant name.
  for (const m of source.matchAll(/(["'`])(AGFzbQE[A-Za-z0-9+/=]*)\1/g)) {
    const bytes = Buffer.from(m[2], 'base64');
    if (!WebAssembly.validate(bytes)) fail('Embedded WebAssembly does not validate.');
    else {
      const module = new WebAssembly.Module(bytes);
      const exports = WebAssembly.Module.exports(module).map(entry => entry.name);
      const imports = WebAssembly.Module.imports(module);
      if (imports.length) fail(`Embedded Wasm has ${imports.length} unresolved import(s); review its offline adapter.`);
      if (!exports.includes('memory')) fail('Embedded Wasm does not export memory for the state snapshot.');
      wasmCount++;
    }
  }
}
if (!scriptCount) fail('No executable inline game script found.');
check(`${scriptCount} inline script(s) parsed successfully.`);
if (!wasmCount) fail('No valid embedded WebAssembly payload found; do not describe this release as Rust-powered.');
else check(`${wasmCount} embedded WebAssembly payload(s) validate without imports.`);

if (failures.length) {
  console.error(`OFFLINE PACKAGE: FAIL (${file})`);
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`OFFLINE PACKAGE: PASS (${file})`);
  for (const message of checks) console.log(`- ${message}`);
  console.log('This verifies packaging and syntax, not browser interaction or gameplay.');
}
