/* Perfect Pour V1.01 · Original state-driven storefront illustration.
   No images, fonts, network resources, SVG IDs, or external dependencies. */
(function () {
  'use strict';
  const ink = '#174b49';
  const cream = '#fff4d9';

  function level(value, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.trunc(n))) : 0;
  }
  function safeNumber(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function plant(x, y, scale, coral) {
    return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-18-31h36l-4 32h-28Z" fill="${coral ? '#df967e' : '#d8ad73'}" stroke="${ink}" stroke-width="3"/><path d="M-21-32h42v8h-42Z" fill="${coral ? '#efb099' : '#ebc591'}" stroke="${ink}" stroke-width="3"/><path d="M0-32v-49m-2 37c-21 0-29-13-25-23 17-1 26 10 27 23Zm2-11c23-1 30-15 24-26-17 2-25 13-24 26Zm-1-12c-13-15-9-32 1-36 13 12 12 25-1 36Z" fill="#74a98a" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-13-18v12" stroke="#fff4d955" stroke-width="3" stroke-linecap="round"/></g>`;
  }

  function person(x, y, scale, variant, sitting) {
    const palettes = [
      {skin:'#d99d73',hair:'#49382e',shirt:'#eb9a79',pants:'#427675'},
      {skin:'#8d5a42',hair:'#302f32',shirt:'#edc96c',pants:'#557d7a'},
      {skin:'#edc3a1',hair:'#566b64',shirt:'#77aaa0',pants:'#355f66'},
      {skin:'#b67a56',hair:'#493638',shirt:'#e1877c',pants:'#456e73'}
    ];
    const p=palettes[variant%palettes.length];
    const legs=sitting
      ? `<path d="M-15 76v26h32l8 31m-12-53v16l22 13 6 26" fill="none" stroke="${p.pants}" stroke-width="12"/><path d="m19 135 17 1m-2 1 17 1" stroke="${ink}" stroke-width="6"/>`
      : `<path d="m-12 78-5 55m27-55 8 55" stroke="${p.pants}" stroke-width="15"/><path d="m-23 137 16 0m20 0h17" stroke="${ink}" stroke-width="6"/>`;
    return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${legs}<path d="M-24 34c-10 8-15 23-18 44m65-44c8 7 13 21 15 37" fill="none" stroke="${p.skin}" stroke-width="12"/><path d="M-28 32c10-8 45-8 55 0l-3 47h-49Z" fill="${p.shirt}"/><path d="M-8 18v13c4 6 12 6 17 0V18" fill="${p.skin}"/><ellipse cy="-2" rx="22" ry="28" fill="${p.skin}"/><path d="M-23-7c-7-22 9-34 26-31 19 0 27 15 21 29l-9-10c-8 9-20 11-30 7l-5 11Z" fill="${p.hair}"/><path d="M-10 0v2m20-2v2" stroke-width="3.6"/><path d="M-6 13q7 6 13 0" fill="none" stroke-width="2.2"/><path d="m34 56-1 19m-4-18 14-1-2 22h-10Z" fill="${cream}" stroke-width="2"/><path d="m35 56 3-11h7" fill="none" stroke="#e59061" stroke-width="2.3"/>${variant%4===2?'<path d="M-20-1h16v10h-16Zm24 0h16v10H4ZM-4 3h8" fill="none" stroke-width="1.8"/>':''}</g>`;
  }

  function staff(x, y, role) {
    const helper=role==='helper';
    const skin=helper?'#976345':'#ecc29d';
    const hair=helper?'#383330':'#925b3c';
    return `<g transform="translate(${x} ${y})" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M-32 46c1-22 13-33 32-33s31 12 32 33v26h-64Z" fill="${helper?'#f3c867':'#e1907c'}"/><path d="m-17 22 3 46h28l3-46" fill="#f9efda"/><path d="M-12 52h24v13h-24Z" fill="#9ec6b4" stroke-width="1.5"/><path d="M-7 7v14c5 6 10 6 14 0V7" fill="${skin}"/><ellipse cy="-8" rx="21" ry="26" fill="${skin}"/><path d="M-21-12c-7-19 5-32 22-31 19 0 27 13 21 29l-8-8c-11 9-22 10-30 4Z" fill="${hair}"/>${helper?`<path d="M-23-24c0-15 9-25 24-25 14 0 25 10 25 25Z" fill="#79b5aa"/><path d="M-27-24q28-6 56 2l-2 7q-29-6-54-2Z" fill="#f0c665"/>`:`<path d="M-25-25q25-8 48 0v7q-25-7-48 0Z" fill="#b2cbb6"/>`}<path d="M-8-6v2m16-2v2" stroke-width="3.3"/><path d="M-7 5q7 6 14 0" fill="none" stroke-width="2"/>${helper?'<path d="M-26 35-41 42m65-7 17 7" fill="none" stroke-width="8"/>':`<path d="m28 40 10-21" stroke="${skin}" stroke-width="8"/><path d="m32 6 15-1-2 25h-11Z" fill="#b4cf82"/><path d="m37 5 4-11h8" fill="none" stroke="#edbd5c"/>`}</g>`;
  }

  function patio(x, y, second) {
    return `<g transform="translate(${x} ${y})" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="0" cy="62" rx="92" ry="12" fill="#174b4915" stroke="none"/><path d="M-74-4v48m25-46v43m-30-15h38m-34-10h30" stroke="#4e8e83" stroke-width="5"/><path d="M-78-4h33v16h-33Z" fill="#a7cabb"/><path d="M50-4v48m25-46v43m-32-15h38m-34-10h30" stroke="#4e8e83" stroke-width="5"/><path d="M46-4h33v16H46Z" fill="#a7cabb"/><path d="M0-8v67m-24 4 24-8 24 8" fill="none" stroke="#56776b" stroke-width="4"/><ellipse cy="-9" rx="48" ry="12" fill="${second?'#edc36f':'#e6b592'}"/><path d="M-47-7v6q47 22 94 0v-6" fill="${second?'#dba74d':'#c9956e'}"/><ellipse cy="-10" rx="48" ry="11" fill="${second?'#f2d18b':'#efd0ab'}"/><path d="m-11-31 13-1-2 22h-9Z" fill="#fff4db" stroke-width="2"/><path d="m-6-32 4-9h7" fill="none" stroke="#e28d69" stroke-width="2"/><path d="M19-23h10l-1 14h-8Z" fill="#d88f6d" stroke-width="1.5"/><path d="M24-23v-10m0 4-6-5m6 3 6-5" stroke="#709b78" stroke-width="2"/></g>`;
  }

  function signboard(sign) {
    const frame=sign===0?'#d3b187':sign===1?'#e3b65c':sign===2?'#8ab6a1':'#d5a65a';
    const back=sign===0?'#eed8b5':sign===1?'#24675e':sign===2?'#244d50':'#173d43';
    const letters=sign===0?ink:sign===1?'#fff3d5':sign===2?'#f5cb76':'#ffc2b2';
    let detail='';
    if(sign===0) detail=`<path d="M237 182h450m-450 41h450" stroke="#bf9b702b" stroke-width="2"/><path d="M255 166h18m381 71h17" stroke="#ba9068" stroke-width="2"/>`;
    if(sign===2) for(let i=0;i<13;i++) detail+=`<circle cx="${246+i*35}" cy="164" r="3.1" fill="#ffe8a6"/><circle cx="${246+i*35}" cy="242" r="3.1" fill="#ffe8a6"/>`;
    if(sign===3) detail=`<rect x="232" y="165" width="458" height="77" rx="9" fill="none" stroke="#ed9d9c" stroke-width="8" opacity=".14"/><rect x="232" y="165" width="458" height="77" rx="9" fill="none" stroke="#efb1a5" stroke-width="2"/><text x="460" y="210" fill="none" stroke="#e99b9b" stroke-width="10" opacity=".15" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="37" font-weight="900" letter-spacing="4">PERFECT POUR</text>`;
    return `<g stroke="${ink}" stroke-linejoin="round"><rect x="216" y="154" width="490" height="101" rx="8" fill="${frame}" stroke-width="3.5"/><rect x="226" y="162" width="470" height="84" rx="4" fill="${back}" stroke-width="2"/>${detail}<text x="460" y="209" fill="${letters}" stroke="none" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="37" font-weight="900" letter-spacing="4">PERFECT POUR</text><text x="460" y="233" fill="${sign===0?'#637866':'#f9e9c5'}" stroke="none" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="5">SODA POP BAR</text></g>`;
  }

  function awning(level) {
    if(level===0)return `<g stroke="${ink}" stroke-width="3"><path d="M211 271h500l9 16H202Z" fill="#7caa97"/><path d="M202 287h518v8H202Z" fill="#4f8072"/></g>`;
    const c=level===2?'#377a73':'#e69774',pale=level===2?'#f5d28b':'#fff0d3';
    let stripes='';
    const left=193,topLeft=215,width=536;
    for(let i=0;i<12;i++){
      const x=left+i*width/12,tx=topLeft+i*492/12;
      stripes+=`<path d="M${tx.toFixed(2)} 266h41l${(x+width/12-(tx+41)).toFixed(2)} 42H${x.toFixed(2)}Z" fill="${i%2===0?c:pale}" stroke="none"/>`;
      stripes+=`<path d="M${x.toFixed(2)} 308h${(width/12).toFixed(2)}v9q-${(width/24).toFixed(2)} 17-${(width/12).toFixed(2)} 0Z" fill="${i%2===0?c:pale}" stroke="${ink}" stroke-width="2"/>`;
    }
    return `<g stroke="${ink}" stroke-width="3" stroke-linejoin="round"><path d="M215 266h492l22 42H193Z" fill="${pale}"/>${stripes}<path d="M215 266h492l22 42H193Z" fill="none"/><path d="M193 309h536" stroke-width="2"/>${level===2?'<path d="M211 261h500" stroke="#d2a44e" stroke-width="6" stroke-linecap="round"/>':''}</g>`;
  }

  function taps(level) {
    const face=level===2?'#e6be67':level===1?'#acc8c0':'#5b9c91';
    const body=level===2?'#ae8650':level===1?'#769c94':'#417870';
    let handles='';
    const count=level+1;
    for(let i=0;i<count;i++){
      const x=608+(i-(count-1)/2)*20;
      handles+=`<path d="M${x} 386v21h7v7" fill="none" stroke="${ink}" stroke-width="4"/><path d="M${x} 375v12" stroke="#eb9872" stroke-width="7"/><circle cx="${x}" cy="374" r="5" fill="${['#f2be62','#e6909c','#a8c17a'][i]}" stroke="${ink}" stroke-width="1.5"/>`;
    }
    return `<g stroke="${ink}" stroke-linejoin="round"><rect x="569" y="374" width="78" height="62" rx="5" fill="${body}" stroke-width="2.5"/><rect x="575" y="378" width="66" height="43" rx="3" fill="${face}" stroke-width="1.5"/>${handles}<path d="M573 435h72" stroke="#cedad0" stroke-width="3"/><path d="M584 429h48" stroke="#174b4970" stroke-width="2"/><path d="m586 416 11 0-2 13h-7Z" fill="#fff0d2" stroke-width="1.4"/>${level===2?'<path d="m638 392 4 7 7 1-5 5 1 7-7-4-6 3 2-7-5-5 7-1Z" fill="#fff4bc" stroke-width="1.1"/>':''}</g>`;
  }

  function render(options) {
    const o=options && typeof options==='object'?options:{};
    const sign=level(o.sign,3),seating=level(o.seating,2),a=level(o.awning,2),tap=level(o.tap,2);
    const helper=level(o.helper,1),specialist=level(o.specialist,1);
    const rating=safeNumber(o.rating,3.5,1,5).toFixed(1),day=Math.floor(safeNumber(o.day,1,1,9999));
    const sky=['#d9ede4','#e0eee2','#e4ece0'][(day-1)%3];
    const facade=sign>=2?'#a9cfb7':'#b5d8c1';
    const welcome=seating===2?person(813,442,.56,3,true):'';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" aria-hidden="true" focusable="false"><title>Your Perfect Pour soda bar</title>
      <rect width="900" height="620" rx="18" fill="${sky}"/>
      <circle cx="766" cy="76" r="40" fill="#f4d795"/><circle cx="766" cy="76" r="54" fill="none" stroke="#f4d795" stroke-width="2" opacity=".35"/>
      <g fill="#fff8e9" opacity=".8"><path d="M62 94c-4-18 8-31 26-29 9-23 41-25 54-3 18-6 38 7 36 26 14-1 23 7 24 17H63c-8-1-10-7-1-11Z"/><path d="M560 80c-2-15 10-22 22-19 9-21 35-21 46-2 16-4 30 5 30 19 11-1 20 5 20 14H561c-8-1-8-8-1-12Z"/></g>
      <g stroke="#648c80" stroke-width="2" stroke-linejoin="round"><path d="M0 237h147v255H0Z" fill="#c8d3b8"/><path d="M16 223h145v25H0v-12Z" fill="#a5bba3"/><path d="M21 272h45v65H21Zm75 0h33v65H96Z" fill="#e7e9cf"/><path d="M21 365h45v72H21Zm75 0h33v72H96Z" fill="#e7e9cf"/><path d="M19 302h48m-24-29v62m50-33h37m-18-29v62M19 401h48m-24-35v69m50-34h37m-18-35v69" stroke="#afbea6"/><path d="M766 212h134v280H766Z" fill="#d9c9ad"/><path d="M758 205h142v23H758Z" fill="#b6b99e"/><path d="M788 255h37v66h-37Zm57 0h37v66h-37Zm-57 99h37v70h-37Zm57 0h37v70h-37Z" fill="#e8e6ce"/><path d="M786 288h41m-21-32v63m37-31h41m-19-32v63m-79 68h41m-21-32v63m37-31h41m-19-32v63" stroke="#c0c4aa"/></g>
      <g fill="#91b89c" opacity=".7"><path d="M111 292c-28-28-13-63 7-72-10-39 22-69 52-57 26-18 60 1 59 32 34 10 38 51 10 72 2 27-28 45-51 34-32 24-58 12-77-9Z"/><path d="M751 333c-20-17-16-48 6-59-1-26 25-41 45-29 27-8 45 10 43 35 27 18 19 48-7 53-13 25-45 27-60 7Z"/></g>
      <path d="M0 485h900v135H0Z" fill="#d5cfb6"/><path d="M0 494h900v83H0Z" fill="#eee2c8"/><path d="M0 577h900v14H0Z" fill="#b9c5ae"/><path d="M0 591h900v29H0Z" fill="#9eafa3"/>
      <g stroke="#bdb9a029" stroke-width="2"><path d="M0 532h900M84 494l-24 83m125-83-14 83m138-83-6 83m143-83v83m143-83 8 83m127-83 15 83m124-83 25 83"/></g>
      <path d="M196 492h537l35 20H160Z" fill="#174b4914"/>
      <g stroke="${ink}" stroke-linejoin="round"><rect x="208" y="142" width="506" height="345" rx="5" fill="${facade}" stroke-width="4"/><path d="M208 433h506v54H208Z" fill="#d9ae7f" stroke-width="3"/><path d="M211 451h500m-499 19h499M248 435v16m58-16v16m58-16v16m58-16v16m58-16v16m58-16v16m58-16v16m58-16v16m-426 1v17m58-17v17m58-17v17m58-17v17m58-17v17m58-17v17m58-17v17m58-17v17m-426 1v13m58-13v13m58-13v13m58-13v13m58-13v13m58-13v13m58-13v13m58-13v13" stroke="#b98c61" stroke-width="1.1"/><path d="M197 126h528v22H197Z" fill="#3e7c70" stroke-width="3.5"/><path d="M206 119h510v9H206Z" fill="#7fae98" stroke-width="2.5"/><path d="M210 145h502" stroke="#d8ecce" stroke-width="2"/>
      <path d="M227 325h193v132H227Z" fill="#83b6a9" stroke-width="4"/><path d="M535 325h158v132H535Z" fill="#83b6a9" stroke-width="4"/><path d="M231 328h185v126H231Z" fill="#bfd9c0" stroke="none"/><path d="M539 328h150v126H539Z" fill="#bfd9c0" stroke="none"/>
      <path d="M239 346h166v10H239Z" fill="#bc986b" stroke-width="2"/>
      <g stroke-width="1.5"><path d="M247 328h10v17h-10Zm18-5h10v22h-10Zm18 3h10v19h-10Zm18 1h10v18h-10Zm18-5h10v23h-10Zm18 4h10v19h-10Z" fill="#e6b469"/><path d="M265 329h10v12h-10m35-10h10v10h-10" fill="#d78b91" stroke="none"/><path d="M283 330h10v11h-10m35-9h10v9h-10" fill="#a7bb7e" stroke="none"/><path d="M252 328v-5m18 0v-5m18 8v-5m17 6v-5m19 0v-4m18 8v-5" fill="none" stroke-width="3"/></g>
      <path d="M242 380h63v38h-63Z" fill="#f2e7cb" stroke-width="1.7"/><text x="273" y="395" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="8" font-weight="700" fill="${ink}" stroke="none" letter-spacing="1">FRESH FIZZ</text><path d="M253 403h41m-33 6h26" stroke="#b6b89b" stroke-width="1.3"/>
      ${helper?staff(361,389,'helper'):''}${specialist?staff(662,390,'specialist'):''}${taps(tap)}
      <path d="M230 436h187v18H230Zm308 0h152v18H538Z" fill="#b7875e" stroke-width="2"/><path d="M227 435h193v7H227Zm308 0h158v7H535Z" fill="#e6bd85" stroke-width="2"/>
      <path d="M231 331l83-1-77 104h-6Zm63-1h29l-77 104h-18Z" fill="#fff9df" opacity=".16" stroke="none"/><path d="M541 331h30l-30 41Zm73 0h21l-82 105h-15Z" fill="#fff9df" opacity=".16" stroke="none"/>
      <path d="M433 313h89v176h-89Z" fill="#49877a" stroke-width="4"/><path d="M442 324h71v108h-71Z" fill="#c5ddd0" stroke-width="2.5"/><path d="m445 327 28 0-28 48m27-48h16l-44 68" fill="#fff9df" opacity=".22" stroke="none"/><path d="M443 444h69v29h-69Z" fill="#81b09b" stroke-width="2"/><path d="M505 401v18" stroke="#f4d58a" stroke-width="5" stroke-linecap="round"/><path d="M432 486h92l10 9H423Z" fill="#6e9180" stroke-width="2"/>
      <path d="m462 357 16-14 17 14" fill="none" stroke-width="1.2"/><rect x="453" y="357" width="50" height="25" rx="3" fill="#fff2d4" stroke-width="1.8"/><text x="478" y="374" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="12" font-weight="900" letter-spacing="1.4" fill="${ink}" stroke="none">OPEN</text>
      <rect x="459" y="393" width="37" height="18" rx="3" fill="#f0cf83" stroke-width="1.3"/><text x="477.5" y="406" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="9" font-weight="700" fill="${ink}" stroke="none">★ ${rating}</text>
      <path d="M218 304v128m485-128v128" stroke="#d8ead0" stroke-width="3"/>
      </g>
      ${signboard(sign)}${awning(a)}
      <g stroke="${ink}" stroke-width="2.5" stroke-linecap="round"><path d="M219 170h-14v54m-6 1h13" fill="none"/><path d="M196 216h20l6 14h-32Z" fill="#d8b877"/><path d="M216 230q-10 15-20 0" fill="#fae7a9" opacity=".7"/><path d="M705 170h15v54m-6 1h13" fill="none"/><path d="M711 216h20l6 14h-32Z" fill="#d8b877"/><path d="M731 230q-10 15-20 0" fill="#fae7a9" opacity=".7"/></g>
      ${plant(220,501,.75,true)}${plant(706,501,.73,false)}
      <g stroke="${ink}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m345 471-10 66m64-66 10 66" fill="none"/><path d="M341 469h61l-4 58h-54Z" fill="#4a7569"/><path d="M347 475h49l-3 45h-43Z" fill="#284f4b" stroke="none"/><text x="371" y="490" font-family="Trebuchet MS,Arial,sans-serif" font-size="8" letter-spacing="1.2" fill="#f6edce" stroke="none" text-anchor="middle">SODA +</text><text x="371" y="503" font-family="Trebuchet MS,Arial,sans-serif" font-size="8" letter-spacing="1.2" fill="#f6edce" stroke="none" text-anchor="middle">SMILES</text><path d="M357 511h28" stroke="#c0d1af" stroke-width="1"/></g>
      ${seating>0?person(86,436,.54,1,true):''}${seating>0?patio(130,501,false):''}${welcome}${seating>1?patio(767,510,true):''}
      ${person(569,440,.68,0,false)}
      <g stroke="${ink}" stroke-width="3" stroke-linecap="round"><path d="M60 462v44m-16-4h32" fill="none"/><path d="M59 455c-34-4-50-30-35-54-12-32 15-57 40-42 26-12 49 11 40 37 20 29-6 62-45 59Z" fill="#7da98a"/><path d="M60 442v-52m0 26-18-14m18 29 21-17" fill="none" stroke="#51806a" stroke-width="2"/></g>
      <g fill="#697e70" font-family="Trebuchet MS,Arial,sans-serif" font-size="10" letter-spacing="2" font-weight="700"><text x="450" y="609" text-anchor="middle">YOUR LITTLE CORNER OF THE NEIGHBORHOOD</text></g>
    </svg>`;
  }
  window.PourStoreArt=Object.freeze({render});
}());
