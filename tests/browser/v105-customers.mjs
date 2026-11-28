#!/usr/bin/env node
/** Actual photographic-cast API at its DOM boundary; this is not a browser test. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../web/customer-art.js', import.meta.url), 'utf8');
const preloaded = [];
class AssetImage {
  constructor() { preloaded.push(this); }
  decode() { this.decodeCalled = true; return Promise.resolve(); }
}
const scope = { window: {}, Image: AssetImage };
vm.runInNewContext(source, scope);
const art = scope.window.PourArt;
assert.equal(art.count, 8);
assert.equal(preloaded.length, 4, 'Each offline atlas is preloaded once');
assert.equal(new Set(preloaded.map(image => image.src)).size, 4);
assert.ok(preloaded.every(image => image.decodeCalled));

// These small nodes implement only the selectors and attribute writes used by
// setMood. They deliberately do not simulate CSS, loading, painting or timing.
const attributes = markup => Object.fromEntries(
  [...markup.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]])
);
class BoundaryNode {
  constructor(markup) { this.attrs = attributes(markup); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
}
class PortraitContainer {
  writes = 0;
  set innerHTML(markup) {
    this.writes++;
    this.markup = markup;
    const required = pattern => {
      const match = markup.match(pattern);
      assert.ok(match, `Production portrait contains ${pattern}`);
      return new BoundaryNode(match[0]);
    };
    this.root = required(/<svg\b[^>]*data-customer-index="\d+"[^>]*>/);
    this.arrival = required(/<g\b[^>]*class="pp-cast-arrival"[^>]*>/);
    this.body = required(/<g\b[^>]*class="pp-cast-body [^"]+"[^>]*>/);
    this.portrait = required(/<svg\b[^>]*data-portrait-window="true"[^>]*>/);
    this.image = required(/<image\b[^>]+>/);
    this.root.querySelector = selector => ({
      '[data-portrait-window]': this.portrait,
      '.pp-cast-body': this.body
    })[selector] ?? null;
  }
  querySelector(selector) {
    assert.equal(selector, 'svg[data-customer-index]');
    return this.root ?? null;
  }
}

const neutralCrops = new Set();
for (let index = 0; index < 8; index++) {
  const container = new PortraitContainer();
  assert.equal(art.setMood(container, index, 'neutral'), true);
  const original = {
    root: container.root, arrival: container.arrival, body: container.body,
    portrait: container.portrait, image: container.image,
    href: container.image.getAttribute('href')
  };
  assert.equal(container.root.getAttribute('viewBox'), '0 0 240 300');
  assert.equal(container.portrait.getAttribute('width'), '240');
  assert.equal(container.portrait.getAttribute('height'), '300');
  assert.equal(container.root.getAttribute('data-customer-index'), String(index));
  assert.equal(original.href, `data:image/webp;base64,__ASSET_CUSTOMER_${Math.floor(index / 2)}__`);
  neutralCrops.add(`${original.href}@${container.portrait.getAttribute('viewBox')}`);

  const phases = [
    ['pouring', 0], ['settling', 0], ['happy', 1],
    ['neutral', 0], ['disappointed', 2]
  ];
  for (const [mood, column] of phases) {
    assert.equal(art.setMood(container, index, mood), true);
    assert.equal(container.writes, 1, 'A reaction never rebuilds the customer');
    for (const key of ['root', 'arrival', 'body', 'portrait', 'image']) {
      assert.strictEqual(container[key], original[key], `${key} survives ${mood}`);
    }
    assert.equal(container.image.getAttribute('href'), original.href, 'A reaction never changes the image source');
    assert.equal(container.root.getAttribute('data-mood'), mood);
    assert.equal(container.body.getAttribute('class'), `pp-cast-body pp-cast-${mood}`);
    const [x, y, width, height] = container.portrait.getAttribute('viewBox').split(' ').map(Number);
    assert.equal(x, column * 512 + 51.2);
    assert.equal(y, (index % 2) * 512 + 3);
    assert.equal(width, 409.6);
    assert.equal(height, 509);
    assert.ok(x >= column * 512 && x + width <= (column + 1) * 512);
    assert.ok(y >= (index % 2) * 512 && y + height <= (index % 2 + 1) * 512,
      'A crop stays inside its own identity row');
    assert.equal(container.root.getAttribute('viewBox'), '0 0 240 300', 'Mood cannot change the outer portrait geometry');
  }
  assert.equal(art.setMood(container, index, 'disappointed'), false, 'The repeated mood is a no-op');
  assert.equal(container.writes, 1);

  assert.equal(art.setMood(container, (index + 1) % 8, 'neutral'), true);
  assert.equal(container.writes, 2, 'A new identity rebuilds once');
  assert.notStrictEqual(container.root, original.root);
  assert.equal(art.setMood(container, (index + 1) % 8, 'neutral'), false);
  assert.equal(container.writes, 2, 'Repeated new-order state does not rebuild again');
}
assert.equal(neutralCrops.size, 8, 'All eight identities have distinct atlas crops');

const fragment = art.image(7, 'happy', 12, 18, 64, 80);
assert.match(fragment, /<image href="data:image\/webp;base64,/,
  'Scene portraits use a literal offline data URL');
const fragmentRoot = new BoundaryNode(fragment.match(/^<svg\b[^>]+>/)[0]);
assert.equal(fragmentRoot.getAttribute('x'), '12');
assert.equal(fragmentRoot.getAttribute('y'), '18');
assert.equal(fragmentRoot.getAttribute('width'), '64');
assert.equal(fragmentRoot.getAttribute('height'), '80');
assert.match(fragmentRoot.getAttribute('style'), /overflow:hidden/,
  'Scene SVG rules cannot expose adjacent atlas cells');
assert.equal(art.setMood(null, 0, 'neutral'), false);
assert.match(art.customer(Infinity, 'unknown'), /data-customer-index="0" data-mood="neutral"/);
assert.match(art.customer(-9, 'happy'), /data-customer-index="1" data-mood="happy"/);

console.log('Photographic cast: 8 identities / 24 expression crops; stable root, arrival, image and source through all pour/result moods; no-op and new-customer behavior passed.');
