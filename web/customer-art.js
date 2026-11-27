/* Original vector cast for Perfect Pour. No external assets or dependencies. */
(function () {
  'use strict';

  const ink = '#173e43';
  const people = [
    { skin: '#d99d73', shade: '#c88966', hair: '#43352c', top: '#4a9e99', accent: '#fff2d3', kind: 'cap' },
    { skin: '#89583f', shade: '#744735', hair: '#302d2e', top: '#e97970', accent: '#fff0ce', kind: 'curls' },
    { skin: '#f0c5a4', shade: '#e0ab8e', hair: '#253e49', top: '#8ebca9', accent: '#f8e4aa', kind: 'bob' },
    { skin: '#b87d59', shade: '#a76c4c', hair: '#c9d4c9', top: '#e5b449', accent: '#f7efd7', kind: 'silver' },
    { skin: '#e4b18c', shade: '#cd9575', hair: '#584037', top: '#e78f79', accent: '#367e80', kind: 'beanie' },
    { skin: '#704b3c', shade: '#5f3b31', hair: '#2e2e33', top: '#eac35c', accent: '#f8f0d9', kind: 'buns' },
    { skin: '#f3c7a6', shade: '#e2ad90', hair: '#b96a3c', top: '#497d89', accent: '#f7edda', kind: 'shag' },
    { skin: '#d8a47b', shade: '#c28e69', hair: '#283840', top: '#87bca8', accent: '#e8ba56', kind: 'knot' }
  ];

  function backHair(p) {
    switch (p.kind) {
      case 'bob': return `<path d="M62 159C48 112 60 62 99 55c33-8 71 5 81 43 10 32 7 76 10 117-18 12-36 10-48 5H76c-14 0-26-7-27-15 8-9 15-24 13-46Z" fill="${p.hair}"/>`;
      case 'curls': return `<path d="M60 151c-18-9-20-28-11-40-16-14-7-36 9-40-5-20 12-32 29-27 9-18 29-22 43-9 17-14 37-5 40 12 21-1 34 17 25 35 14 15 9 35-4 44 4 17-5 29-18 35Z" fill="${p.hair}"/>`;
      case 'buns': return `<path d="M65 143C44 117 49 75 83 59c23-13 63-10 84 11 22 23 22 53 7 77Z" fill="${p.hair}"/><path d="M72 74C48 82 32 61 43 42c10-17 38-18 49-1 9 14-2 29-20 33ZM165 73c-23-5-27-24-16-38 13-16 39-10 43 7 5 18-10 34-27 31Z" fill="${p.hair}"/>`;
      case 'knot': return `<path d="M155 74c8-27 30-26 36-10 10 25-7 49-9 77-1 22 7 38 12 48-22-2-36-20-34-42Z" fill="${p.hair}"/><path d="M60 141c-12-29-9-53 7-72 25-29 76-32 101-3 20 21 23 49 9 80Z" fill="${p.hair}"/>`;
      default: return `<path d="M62 144c-12-29-9-57 8-74 26-26 67-25 92-2 21 20 24 49 11 78Z" fill="${p.hair}"/>`;
    }
  }

  function frontHair(p) {
    switch (p.kind) {
      case 'cap': return `<path d="M64 110c-4-28 7-49 34-57 31-8 61 5 70 36l-10 17c-9-9-12-16-13-23-17 10-45 15-69 14l-4 17Z" fill="${p.hair}"/><path d="M56 87c0-30 24-49 57-49 30 0 55 21 57 49l-37 7-77-7Z" fill="#f5e7c6"/><path d="M117 40c-6 9-7 26-5 42" fill="none" stroke="#c2b38e" stroke-width="3"/><path d="M53 86c40-10 80-10 124 3 10 3 13 9 4 13-19 9-59 3-89-2L56 97c-11-1-13-7-3-11Z" fill="#e98256"/><path d="M65 94c35-4 74-3 107 5" fill="none" stroke="#ba6848" stroke-width="2.5"/><path d="M131 60l9 10-12 5-8-10Z" fill="#4a9e99" stroke="none"/>`;
      case 'curls': return `<path d="M62 111c-12-12-7-28 6-33-2-16 14-25 26-18 7-13 25-15 34-4 13-11 30-3 32 10 18 0 28 16 17 32-7 9-16 7-23 2-7-7-8-17-8-21-10 14-23 19-39 14-11 11-28 12-36 6l-3 18Z" fill="${p.hair}"/><path d="M84 65c9 0 13 5 12 11m26-14c7 1 12 7 10 14m27 1c6 3 9 8 7 14" fill="none" stroke="#4d4140" stroke-width="3"/>`;
      case 'bob': return `<path d="M60 113c-8-33 8-54 39-59 29-6 56 8 69 35l-8 20c-4-16-10-28-17-33-13 15-34 24-68 27l-6 20Z" fill="${p.hair}"/><path d="M76 85c15-3 31-10 44-20" stroke="#4b6772" stroke-width="3" fill="none"/><path d="M70 158c1 21 2 40-1 55m100-55c-1 21 2 40 6 52" stroke="#4b6772" stroke-width="3" fill="none"/>`;
      case 'silver': return `<path d="M61 112c-11-13-12-35 0-48 2 10 10 13 17 12-2-20 14-37 33-38-3 8-1 12 4 16 19-15 46-9 57 9 15 17 15 35 2 53l-11-9c-4-18-14-24-23-29-20 15-41 18-66 17l-4 20Z" fill="${p.hair}"/><path d="M82 81c20-3 34-8 44-18m22 4c10 4 16 11 18 20" fill="none" stroke="#9aaea8" stroke-width="3"/>`;
      case 'beanie': return `<path d="M62 108c0-34 20-57 53-57 36 0 56 23 58 56l-13 7c-4-17-9-24-12-27-13 13-36 17-69 14l-6 14Z" fill="${p.hair}"/><path d="M58 85c-1-36 21-58 57-58 35 0 60 24 59 58Z" fill="#4b9290"/><path d="M75 73c2-19 9-29 18-35m19 34 1-33m24 35c-1-16-6-27-11-36m31 39c-2-11-5-18-10-25" stroke="#306b70" stroke-width="3" fill="none"/><path d="M55 79c36-6 80-5 121 1l1 29c-41-8-83-8-121-2Z" fill="#79b2a6"/><path d="M64 88v12m15-14v12m15-14v12m15-13v12m15-12v12m15-11v12m15-10v12m15-10v12" stroke="#548c84" stroke-width="2.5"/>`;
      case 'buns': return `<path d="M60 112c-11-27 0-53 27-60 28-13 63-7 79 14 10 12 15 29 9 46l-13-4c-4-14-8-26-17-32-16 14-39 21-68 20l-6 20Z" fill="${p.hair}"/><path d="M87 66c11-5 21-6 32-5m16 1c8 1 14 5 20 11" stroke="#4c4140" stroke-width="3" fill="none"/><path d="M47 72c9 6 21 5 29-1m84-6c7 5 17 6 24 2" fill="none" stroke="#dfad55" stroke-width="5"/>`;
      case 'shag': return `<path d="M62 114c-17-11-18-28-8-41l15-6c-3-11 2-24 14-30l11 13c17-22 47-20 61-2l15-3c1 11 0 17-1 21 18 10 20 33 6 52l-14-10c-3-12-6-20-12-27-5 10-13 16-25 19l1-15c-13 13-28 16-47 13l-6 18Z" fill="${p.hair}"/><path d="M78 71c10-8 20-12 30-13m24 4c9 0 16 5 21 13" stroke="#da915b" stroke-width="3" fill="none"/>`;
      case 'knot': return `<path d="M70 110c-16-13-17-34-4-48 21-24 64-30 90-9 19 17 26 40 15 61l-12-10c-3-16-7-26-16-33-18 15-37 24-64 27Z" fill="${p.hair}"/><path d="M92 68c16-11 35-13 50-9" stroke="#54646b" stroke-width="3" fill="none"/><path d="M151 65c17-12 22-25 14-35-8-12-31-11-38 2-6 11 2 25 24 33Z" fill="${p.hair}"/><path d="m144 59 12 8" stroke="#e8ba56" stroke-width="6"/>`;
    }
  }

  function clothes(p) {
    let detail = '';
    if (p.kind === 'cap') detail = `<path d="m92 231 25 20-21 16-17-30m66-6-25 20 21 16 17-30" fill="${p.accent}"/><path d="M119 253v47" fill="none"/><circle cx="127" cy="279" r="2.2" fill="${ink}" stroke="none"/>`;
    else if (p.kind === 'beanie') detail = `<path d="M82 228c-14 12-20 25-12 41l28-12 21 12 23-12 28 12c6-18-1-32-13-41l-38 9Z" fill="#f2b39b"/><path d="M101 253v27m35-27v29" fill="none" stroke="#fff0d1" stroke-width="3"/><circle cx="101" cy="282" r="3" fill="#fff0d1" stroke="none"/><circle cx="135" cy="284" r="3" fill="#fff0d1" stroke="none"/>`;
    else if (p.kind === 'shag') detail = `<path d="M39 266h161v13H32m-5 15h187v6H27" fill="${p.accent}" stroke="none"/><path d="M88 230c6 23 52 24 62-1" fill="none" stroke="${p.accent}" stroke-width="9"/>`;
    else if (p.kind === 'silver') detail = `<path d="m83 231 36 29 35-30" fill="none" stroke="${p.accent}" stroke-width="10"/><path d="M79 260v40m82-40v40" fill="none" stroke="#c99435" stroke-width="2"/>`;
    else if (p.kind === 'bob') detail = `<path d="m85 232 34 39 36-39" fill="${p.accent}"/><path d="m76 236 25 64m60-64-26 64" stroke="#5e9a8a" fill="none" stroke-width="4"/>`;
    else if (p.kind === 'curls') detail = `<path d="m83 232 36 23-23 20-20-34m79-9-36 23 24 20 19-34" fill="${p.accent}"/><path d="M119 257v43" fill="none" stroke-width="2.5"/>`;
    else if (p.kind === 'buns') detail = `<path d="M86 232c8 24 57 24 67-1" fill="none" stroke="${p.accent}" stroke-width="10"/><path d="M57 273h17m100 0h14m-89 8h16m22 0h16" stroke="#ce9e3e" stroke-width="3" fill="none"/>`;
    else detail = `<path d="m85 232 34 24 36-24-3 28-34 15-33-16Z" fill="${p.accent}"/><path d="M119 276v24" fill="none" stroke-width="2.5"/>`;
    return `<path d="M24 300c0-29 9-50 29-59l35-13h62l36 14c20 8 30 29 31 58Z" fill="${p.top}"/><path d="M54 270v30m132-30v30" fill="none" stroke-width="3"/>${detail}`;
  }

  function customer(index, mood) {
    const n = Number.isFinite(Number(index)) ? Math.abs(Math.trunc(Number(index))) % people.length : 0;
    const p = people[n];
    const expression = mood === 'happy' || mood === 'disappointed' ? mood : 'neutral';
    const smile = expression === 'happy'
      ? `<path d="M101 178c9 6 28 7 38-1-2 16-11 23-21 22-10-1-15-9-17-21Z" fill="#7e4842"/><path d="M104 179c10 4 23 4 32-1l-2 7c-10 4-20 3-28 0Z" fill="#fff4dc" stroke="none"/>`
      : expression === 'disappointed'
        ? `<path d="M105 187c8-8 19-8 29-1" fill="none" stroke-width="3.5"/>`
        : `<path d="M104 181c8 8 20 9 31 0" fill="none" stroke-width="3.5"/>`;
    const brows = expression === 'disappointed'
      ? `<path d="m84 128 17-6m37 0 17 6" stroke="${p.hair}" stroke-width="4" fill="none"/>`
      : `<path d="M84 125c5-3 11-3 16-1m38 0c6-3 12-2 17 1" stroke="${p.hair}" stroke-width="4" fill="none"/>`;
    const eyes = expression === 'happy'
      ? `<path d="M86 142c4-5 9-5 13 0m39 0c4-5 9-5 13 0" stroke-width="3.5" fill="none"/>`
      : `<ellipse cx="93" cy="141" rx="3.5" ry="5" fill="${ink}" stroke="none"/><ellipse cx="145" cy="141" rx="3.5" ry="5" fill="${ink}" stroke="none"/>`;
    const glasses = p.kind === 'bob'
      ? `<path d="M76 135h30v12c-1 10-28 11-30-1v-11Zm57 0h30v12c-2 10-28 10-30-1v-11Zm-27 4c9-5 18-5 27 0m-57-3-10-3m97 3 10-3" fill="none" stroke="#b47c35" stroke-width="3.5"/>`
      : p.kind === 'silver'
        ? `<ellipse cx="92" cy="143" rx="18" ry="15" fill="none" stroke="#3e6267" stroke-width="3"/><ellipse cx="146" cy="143" rx="18" ry="15" fill="none" stroke="#3e6267" stroke-width="3"/><path d="M110 139c6-3 12-3 18 0m-54 0-9-5m99 5 10-6" fill="none" stroke="#3e6267" stroke-width="3"/>`
        : '';
    const freckles = p.kind === 'shag'
      ? `<g fill="#bf7d57" stroke="none"><circle cx="80" cy="160" r="1.8"/><circle cx="88" cy="163" r="1.8"/><circle cx="95" cy="160" r="1.8"/><circle cx="145" cy="160" r="1.8"/><circle cx="153" cy="163" r="1.8"/><circle cx="160" cy="160" r="1.8"/></g>` : '';
    const jewelry = p.kind === 'buns' || p.kind === 'bob'
      ? `<path d="M59 157c-8 0-9 13-1 14 6 1 8-7 4-11m118-3c8 0 9 13 1 14-6 1-8-7-4-11" fill="none" stroke="#e3b752" stroke-width="3.5"/>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" aria-hidden="true" focusable="false"><g stroke="${ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${backHair(p)}${clothes(p)}<path d="M94 197v35c6 14 40 17 50 0v-37Z" fill="${p.skin}"/><path d="M97 204c15 12 30 12 44 2v15c-15 10-31 8-44-3Z" fill="${p.shade}" stroke="none"/><path d="M67 130c-15-12-22 0-17 15 2 10 10 17 18 13m103-28c15-12 22 0 17 15-2 10-10 17-18 13" fill="${p.skin}"/><path d="M56 138c5-3 8 3 7 10m118-10c-5-3-8 3-7 10" fill="none" stroke="${p.shade}" stroke-width="3"/><path d="M68 103c1-31 23-47 51-47 31 0 52 19 53 48l-3 59c-1 28-22 51-49 53-28-2-49-24-51-52Z" fill="${p.skin}"/><path d="M156 104c9 49 8 78-16 102 18-7 28-23 29-43l3-59-5-21Z" fill="${p.shade}" stroke="none"/>${brows}${eyes}<path d="m118 143-5 20c3 4 8 5 13 2" fill="none" stroke="${p.shade}" stroke-width="3.5"/><ellipse cx="84" cy="165" rx="10" ry="5.5" fill="#e8957b" opacity=".28" stroke="none"/><ellipse cx="151" cy="165" rx="10" ry="5.5" fill="#e8957b" opacity=".28" stroke="none"/>${freckles}${smile}${frontHair(p)}${glasses}${jewelry}</g></svg>`;
  }

  window.PourArt = Object.freeze({ customer });
}());
