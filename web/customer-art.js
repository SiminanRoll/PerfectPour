/* Perfect Pour V1.05 · Original generated photographic cast. Offline atlas assets. */
(function () {
  'use strict';

  // Replaced with local WebP data URLs by scripts/build.py. Every expression for
  // a person lives in the same decoded image, so changing mood cannot blank it.
  const atlases = [
    '__ASSET_CUSTOMER_0__', '__ASSET_CUSTOMER_1__',
    '__ASSET_CUSTOMER_2__', '__ASSET_CUSTOMER_3__'
  ];
  const atlasBytes = atlases.map(source => source.slice(source.indexOf(',') + 1));
  const count = 8;
  const normalIndex = index => Number.isFinite(Number(index)) ? Math.abs(Math.trunc(Number(index))) % count : 0;
  const normalMood = mood => ['happy', 'disappointed', 'pouring', 'settling'].includes(mood) ? mood : 'neutral';
  const expressionColumn = mood => mood === 'happy' ? 1 : mood === 'disappointed' ? 2 : 0;
  const crop = (index, mood) => `${expressionColumn(mood) * 512 + 51.2} ${(index % 2) * 512 + 3} 409.6 509`;
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  // Predecode once while the intro is visible. No per-customer network request,
  // and no source change between neutral, pouring, settling and paid reactions.
  const preload = [];
  if (typeof Image === 'function') {
    for (const source of atlases) {
      const image = new Image();
      image.decoding = 'async';
      image.src = source;
      if (typeof image.decode === 'function') image.decode().catch(() => {});
      preload.push(image);
    }
  }

  const motion = `<style>
    .pp-cast-arrival{animation:pp-photo-arrive .3s ease-out both}
    .pp-cast-body{transform-origin:120px 300px;opacity:1}
    .pp-cast-body.pp-cast-happy{animation:pp-photo-pleased .42s ease-out both}
    .pp-cast-body.pp-cast-disappointed{animation:pp-photo-disappointed .4s ease-out both}
    @keyframes pp-photo-arrive{from{transform:translateY(5px)}to{transform:translateY(0)}}
    @keyframes pp-photo-pleased{0%{transform:translateY(0)}40%{transform:translateY(-2px)}100%{transform:translateY(0)}}
    @keyframes pp-photo-disappointed{0%{transform:translateY(0)}45%{transform:translateY(1.5px)}100%{transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.pp-cast-arrival,.pp-cast-body.pp-cast-happy,.pp-cast-body.pp-cast-disappointed{animation:none}}
  </style>`;

  /** A photographic SVG fragment for the shop scene and staff stations. */
  function image(index, mood, x = 0, y = 0, width = 240, height = 300) {
    const n = normalIndex(index), expression = normalMood(mood);
    const bounds = [finite(x, 0), finite(y, 0), Math.max(1, finite(width, 240)), Math.max(1, finite(height, 300))];
    return `<svg x="${bounds[0]}" y="${bounds[1]}" width="${bounds[2]}" height="${bounds[3]}" viewBox="${crop(n, expression)}" preserveAspectRatio="xMidYMax meet" style="overflow:hidden;width:${bounds[2]}px;height:${bounds[3]}px" data-portrait-window="true" aria-hidden="true"><image href="data:image/webp;base64,${atlasBytes[Math.floor(n / 2)]}" x="0" y="0" width="1536" height="1024" preserveAspectRatio="none"/></svg>`;
  }

  function customer(index, mood) {
    const n = normalIndex(index), expression = normalMood(mood);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" data-customer-index="${n}" data-mood="${expression}" aria-hidden="true" focusable="false">${motion}<g class="pp-cast-arrival"><g class="pp-cast-body pp-cast-${expression}">${image(n, expression)}</g></g></svg>`;
  }

  // Keep the same outer SVG, image node, image URL and arrival wrapper for the
  // entire order. A mood update only selects another crop from the resident
  // atlas. In particular, releasing a pour never reruns an opacity entrance.
  function setMood(container, index, mood) {
    if (!container) return false;
    const n = normalIndex(index), expression = normalMood(mood);
    const svg = container.querySelector('svg[data-customer-index]');
    if (!svg || svg.getAttribute('data-customer-index') !== String(n)) {
      container.innerHTML = customer(n, expression);
      return true;
    }
    if (svg.getAttribute('data-mood') === expression) return false;
    const portrait = svg.querySelector('[data-portrait-window]');
    if (portrait) portrait.setAttribute('viewBox', crop(n, expression));
    const body = svg.querySelector('.pp-cast-body');
    if (body) body.setAttribute('class', 'pp-cast-body pp-cast-' + expression);
    svg.setAttribute('data-mood', expression);
    return true;
  }

  window.PourArt = Object.freeze({ customer, setMood, image, count });
}());
