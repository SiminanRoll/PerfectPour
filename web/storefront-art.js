/* Perfect Pour V1.05 · State-driven architecture, local materials and photographic guests. */
(function () {
  'use strict';
  const ink = '#174b49';
  const cream = '#fff4d9';
  let sceneSerial=0;
  const photo=(index,mood,x,y,w,h)=>window.PourArt?.image?window.PourArt.image(index,mood,x,y,w,h):'';
  const feature=(key,art)=>'<g data-upgrade-part="'+key+'">'+art+'</g>';

  function level(value, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.trunc(n))) : 0;
  }
  function safeNumber(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function materialize(svg) {
    const id='pp-store-'+(++sceneSerial);
    const surfaces={
      wall:['#b5d8c1','#a9cfb7','#c4d9b2','#cbd7a4','#c0d7b6'],
      metal:['#83b6a9','#8eac9a','#8ab7a5','#acc8c0','#8bb7a5'],
      gold:['#e6be67','#d7b16b','#d5a65a','#e3b65c','#d8b877','#e7c985','#efd08b'],
      wood:['#bc986b','#b7875e','#b39364','#b39667','#d6b17c','#b18556','#d9ae7f'],
      glass:['#bfd9c0','#c5ddd0','#bed8c0','#dce4c8','#cfdfc4'],
      paint:['#3e7c70','#49877a','#4b8270','#4f8072','#5b9c91','#417870','#367b67'],
      stone:['#eee2c8','#d5cfb6','#e7e9cf']
    };
    const defs=`<defs>
      <linearGradient id="${id}-wall" x2="1" y2="1"><stop stop-color="#d9dbc0"/><stop offset=".43" stop-color="#bbc6a8"/><stop offset="1" stop-color="#8caa8f"/></linearGradient>
      <linearGradient id="${id}-metal"><stop stop-color="#3b5544"/><stop offset=".15" stop-color="#d6dfc2"/><stop offset=".34" stop-color="#a1b69a"/><stop offset=".7" stop-color="#536e58"/><stop offset=".88" stop-color="#c0cdb0"/><stop offset="1" stop-color="#405d47"/></linearGradient>
      <linearGradient id="${id}-gold"><stop stop-color="#8e733d"/><stop offset=".22" stop-color="#dfc58b"/><stop offset=".48" stop-color="#b69b5d"/><stop offset=".72" stop-color="#e8d8a4"/><stop offset="1" stop-color="#927943"/></linearGradient>
      <linearGradient id="${id}-wood" x2=".08" y2="1"><stop stop-color="#c4a46c"/><stop offset=".2" stop-color="#ac8b56"/><stop offset=".7" stop-color="#947444"/><stop offset="1" stop-color="#705333"/></linearGradient>
      <linearGradient id="${id}-glass" x2=".6" y2="1"><stop stop-color="#304e3b"/><stop offset=".43" stop-color="#617e59"/><stop offset="1" stop-color="#b6b783"/></linearGradient>
      <linearGradient id="${id}-paint" x2=".8" y2="1"><stop stop-color="#567b59"/><stop offset=".35" stop-color="#3d6547"/><stop offset="1" stop-color="#264d35"/></linearGradient>
      <linearGradient id="${id}-stone" x2="0" y2="1"><stop stop-color="#e9e4c8"/><stop offset=".2" stop-color="#d5cfaf"/><stop offset="1" stop-color="#b8baa0"/></linearGradient>
    </defs>`;
    for(const [material,colors] of Object.entries(surfaces))for(const color of colors)svg=svg.split('fill="'+color+'"').join('fill="url(#'+id+'-'+material+')"');
    // Keep architectural edges fine, while the photographic silhouettes keep their alpha.
    svg=svg.replace(/stroke-width="([\d.]+)"/g,(_,n)=>'stroke-width="'+Math.max(.65,Number(n)*.68).toFixed(2)+'"');
    svg=svg.replace(/stroke="#174b49"/g,'stroke="#456049"');
    return svg.replace(/(<svg[^>]*>)/,'$1'+defs);
  }
  function plant(x, y, scale, coral) {
    return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-18-31h36l-4 32h-28Z" fill="${coral ? '#df967e' : '#d8ad73'}" stroke="${ink}" stroke-width="3"/><path d="M-21-32h42v8h-42Z" fill="${coral ? '#efb099' : '#ebc591'}" stroke="${ink}" stroke-width="3"/><path d="M0-32v-49m-2 37c-21 0-29-13-25-23 17-1 26 10 27 23Zm2-11c23-1 30-15 24-26-17 2-25 13-24 26Zm-1-12c-13-15-9-32 1-36 13 12 12 25-1 36Z" fill="#74a98a" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-13-18v12" stroke="#fff4d955" stroke-width="3" stroke-linecap="round"/></g>`;
  }

  function person(x,y,scale,variant,sitting) {
    const w=104*scale,h=143*scale;
    return photo(variant,'neutral',x-w/2,y-43*scale,w,h);
  }
  function staff(x,y,role) {
    return feature(role,photo(role==='helper'?1:6,'neutral',x-35,y-48,70,118));
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
    if(sign===3) detail=`<rect x="232" y="165" width="458" height="77" rx="9" fill="none" stroke="#ed9d9c" stroke-width="8" opacity=".14"/><rect x="232" y="165" width="458" height="77" rx="9" fill="none" stroke="#efb1a5" stroke-width="2"/><text x="460" y="210" fill="none" stroke="#e99b9b" stroke-width="10" opacity=".15" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="500" letter-spacing="4">PERFECT POUR</text>`;
    return `<g stroke="${ink}" stroke-linejoin="round"><rect x="216" y="154" width="490" height="101" rx="8" fill="${frame}" stroke-width="3.5"/><rect x="226" y="162" width="470" height="84" rx="4" fill="${back}" stroke-width="2"/>${detail}<text x="460" y="209" fill="${letters}" stroke="none" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="500" letter-spacing="4">PERFECT POUR</text><text x="460" y="233" fill="${sign===0?'#637866':'#f9e9c5'}" stroke="none" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="5">SODA POP BAR</text></g>`;
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

  function ingredientShelf(options, x, y, scale) {
    const o=options||{};
    const jar='<path d="M0-33h26v31H0Z" fill="#eadbc088" stroke-width="1.7"/><path d="M-2-38h30v7H-2Z" fill="#b5c9a0" stroke-width="1.7"/><g fill="#c66b78" stroke-width="1.1"><circle cx="7" cy="-12" r="5"/><circle cx="18" cy="-11" r="5"/><circle cx="12" cy="-22" r="5"/></g><path d="m7-17 4-4m7 5-3-5m-3-6 4-3" fill="none" stroke="#6f9a65" stroke-width="1.3"/><path d="M4-28v15" stroke="#fff8df" stroke-width="1.6" opacity=".7"/>';
    const lime=o.hasCitrus?'<g transform="translate(38 0)"><path d="M-2-7h38l-5 7H3Z" fill="#e6c18c" stroke-width="1.5"/><path d="M1-22a15 15 0 0 0 27 13Z" fill="#76a85d" stroke-width="1.5"/><path d="M6-19a10 10 0 0 0 18 9Z" fill="#d8e9a2" stroke-width="1"/><path d="m7-18 15 8m-8-4-2 7" fill="none" stroke="#91b96a" stroke-width="1"/></g>':'';
    const syrup=o.hasSyrup?'<g transform="translate(87 0)"><path d="M0-30h22v29H0Z" fill="#cf7b88" stroke-width="1.6"/><path d="M4-35h14v7H4Z" fill="#e9c988" stroke-width="1.3"/><path d="M11-35v-9h17v6" fill="none" stroke-width="2.5"/><path d="M4-20h14v13H4Z" fill="#fff0d2" stroke-width="1"/><circle cx="11" cy="-13" r="3" fill="#c96c7f" stroke-width=".8"/></g>':'';
    const mixer=o.hasMixer?'<g transform="translate(127 0)"><rect x="-1" y="-40" width="37" height="40" rx="4" fill="#82aaa0" stroke-width="1.7"/><rect x="4" y="-34" width="10" height="18" rx="2" fill="#bde2d4" stroke-width="1.2"/><rect x="21" y="-34" width="10" height="18" rx="2" fill="#e5ab83" stroke-width="1.2"/><path d="M9-15v5h17v-5m-9 5v5" fill="none" stroke-width="1.7"/><circle cx="17" cy="-4" r="2" fill="#f1ca76" stroke-width="1"/></g>':'';
    return `<g class="recipe-station-art" transform="translate(${x} ${y}) scale(${scale})" stroke="${ink}" stroke-linejoin="round" stroke-linecap="round">${jar}${feature('citrus',lime)}${feature('syrup',syrup)}${feature('mixer',mixer)}<path d="M-5 2h174v5H-5Z" fill="#d6b17c" stroke-width="1.6"/></g>`;
  }

  function render(options) {
    const o=options && typeof options==='object'?options:{};
    const sign=level(o.sign,3),seating=level(o.seating,2),a=level(o.awning,2),tap=level(o.tap,2);
    const helper=!!o.helperActive,specialist=!!o.specialistActive;
    const interior=level(o.interior,3),catering=level(o.catering,3),training=level(o.training,3);
    const rating=safeNumber(o.rating,3.5,1,5).toFixed(1),day=Math.floor(safeNumber(o.day,1,1,9999));
    const sky=['#d9ede4','#e0eee2','#e4ece0'][(day-1)%3];
    const facade=sign>=2?'#a9cfb7':'#b5d8c1';
    const welcome=seating===2&&!catering?person(813,442,.56,3,true):'';
    return materialize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" aria-hidden="true" focusable="false"><title>Your Perfect Pour soda bar</title>
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
      ${ingredientShelf(o,245,428,.67)}<g class="staff-scene">${helper?'<g class="staff-motion">'+staff(361,389,'helper')+'</g>':''}${specialist?'<g class="staff-motion">'+staff(662,390,'specialist')+'</g>':''}</g>${feature('tap',taps(tap))}
      <path d="M230 436h187v18H230Zm308 0h152v18H538Z" fill="#b7875e" stroke-width="2"/><path d="M227 435h193v7H227Zm308 0h158v7H535Z" fill="#e6bd85" stroke-width="2"/>
      <path d="M231 331l83-1-77 104h-6Zm63-1h29l-77 104h-18Z" fill="#fff9df" opacity=".16" stroke="none"/><path d="M541 331h30l-30 41Zm73 0h21l-82 105h-15Z" fill="#fff9df" opacity=".16" stroke="none"/>
      <path d="M433 313h89v176h-89Z" fill="#49877a" stroke-width="4"/><path d="M442 324h71v108h-71Z" fill="#c5ddd0" stroke-width="2.5"/><path d="m445 327 28 0-28 48m27-48h16l-44 68" fill="#fff9df" opacity=".22" stroke="none"/><path d="M443 444h69v29h-69Z" fill="#81b09b" stroke-width="2"/><path d="M505 401v18" stroke="#f4d58a" stroke-width="5" stroke-linecap="round"/><path d="M432 486h92l10 9H423Z" fill="#6e9180" stroke-width="2"/>
      <path d="m462 357 16-14 17 14" fill="none" stroke-width="1.2"/><rect x="453" y="357" width="50" height="25" rx="3" fill="#fff2d4" stroke-width="1.8"/><text x="478" y="374" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="12" font-weight="900" letter-spacing="1.4" fill="${ink}" stroke="none">OPEN</text>
      <rect x="459" y="393" width="37" height="18" rx="3" fill="#f0cf83" stroke-width="1.3"/><text x="477.5" y="406" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="9" font-weight="700" fill="${ink}" stroke="none">★ ${rating}</text>
      <path d="M218 304v128m485-128v128" stroke="#d8ead0" stroke-width="3"/>
      </g>
      ${interior?feature('interior',expansion(interior)):''}${feature('sign',signboard(sign))}${feature('awning',awning(a))}${training?feature('training',trainingBadge(training)):''}
      <g stroke="${ink}" stroke-width="2.5" stroke-linecap="round"><path d="M219 170h-14v54m-6 1h13" fill="none"/><path d="M196 216h20l6 14h-32Z" fill="#d8b877"/><path d="M216 230q-10 15-20 0" fill="#fae7a9" opacity=".7"/><path d="M705 170h15v54m-6 1h13" fill="none"/><path d="M711 216h20l6 14h-32Z" fill="#d8b877"/><path d="M731 230q-10 15-20 0" fill="#fae7a9" opacity=".7"/></g>
      ${plant(220,501,.75,true)}${plant(706,501,.73,false)}
      <g stroke="${ink}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m345 471-10 66m64-66 10 66" fill="none"/><path d="M341 469h61l-4 58h-54Z" fill="#4a7569"/><path d="M347 475h49l-3 45h-43Z" fill="#284f4b" stroke="none"/><text x="371" y="490" font-family="Trebuchet MS,Arial,sans-serif" font-size="8" letter-spacing="1.2" fill="#f6edce" stroke="none" text-anchor="middle">SODA +</text><text x="371" y="503" font-family="Trebuchet MS,Arial,sans-serif" font-size="8" letter-spacing="1.2" fill="#f6edce" stroke="none" text-anchor="middle">SMILES</text><path d="M357 511h28" stroke="#c0d1af" stroke-width="1"/></g>
      <g class="patio-social">${seating>0?person(86,436,.54,1,true):''}</g>${seating>0?feature('seating',patio(130,501,false)):''}<g class="patio-social">${welcome}</g>${seating>1&&!catering?feature('seating',patio(767,510,true)):''}${catering?feature('catering',cateringCart(catering)):''}

      <g stroke="${ink}" stroke-width="3" stroke-linecap="round"><path d="M60 462v44m-16-4h32" fill="none"/><path d="M59 455c-34-4-50-30-35-54-12-32 15-57 40-42 26-12 49 11 40 37 20 29-6 62-45 59Z" fill="#7da98a"/><path d="M60 442v-52m0 26-18-14m18 29 21-17" fill="none" stroke="#51806a" stroke-width="2"/></g>
      <g fill="#697e70" font-family="Trebuchet MS,Arial,sans-serif" font-size="10" letter-spacing="2" font-weight="700"><text x="450" y="609" text-anchor="middle">${interior?'THE NEIGHBORHOOD HAS FOUND ITS HAPPY PLACE':'YOUR LITTLE CORNER OF THE NEIGHBORHOOD'}</text></g>
    </svg>`);
  }
  function expansion(tier) {
    const x=tier===1?295:tier===2?238:204,w=tier===1?372:tier===2?452:518,top=tier===3?27:46;
    const count=tier===1?3:tier===2?4:5,unit=(w-28)/count;
    const windows=Array.from({length:count},(_,i)=>`<g><rect x="${x+14+i*unit}" y="${top+18}" width="${unit-9}" height="${105-top}" rx="2" fill="#bed8c0" stroke="${ink}" stroke-width="2"/><path d="M${x+18+i*unit} ${top+22}h${unit-17}v7H${x+18+i*unit}Z" fill="#ddcca1" stroke="none"/><path d="M${x+14+i*unit+(unit-9)/2} ${top+28}v${88-top}" stroke="#90ab83" stroke-width="2"/><path d="m${x+19+i*unit} ${top+32} 19 0-19 24" fill="#fff8df" opacity=".28" stroke="none"/></g>`).join('');
    return `<g stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"><path d="M${x+4} ${top+5}h${w}v${128-top}H${x+4}Z" fill="#173d3022" stroke="none"/><rect x="${x}" y="${top}" width="${w}" height="${128-top}" rx="3" fill="#c4d9b2"/><path d="M${x-9} ${top-7}h${w+18}v13H${x-9}Z" fill="#4b8270"/><path d="M${x-8} ${top-8}h${w+16}" stroke="#c3a572" stroke-width="3"/>${windows}${tier===3?`<path d="M${x+7} 119h${w-14}v9H${x+7}Z" fill="#d5a65a" stroke="none"/><path d="M${x+7} ${top+5}h${w-14}" stroke="#dfc78d" stroke-width="4"/><path d="M${x+22} 122v-13m15 13v-13m${w-88} 13v-13m15 13v-13" stroke="#7e9d76" stroke-width="6"/>`:''}</g>`;
  }
  function trainingBadge(tier) {
    const frames=Array.from({length:tier},(_,i)=>{const x=368+(i-(tier-1)/2)*23;return `<rect x="${x}" y="366" width="20" height="27" rx="1" fill="#efd08b"/><rect x="${x+3}" y="369" width="14" height="21" fill="#f5efd6"/><circle cx="${x+10}" cy="377" r="3" fill="#b8974d"/><path d="M${x+6} 384h8m-8 3h8" stroke="#92a783" stroke-width=".7"/>`;}).join('');
    return `<g stroke="${ink}" stroke-width="1.3">${frames}${tier>1?'<path d="M371 413h23m-12-15v15m-7-33h14l-1 10q-5 12-11 0Zm0 3h-6v4q0 7 8 7m12-11h6v4q0 7-8 7" fill="#efd08b" stroke="#a38843" stroke-width="1"/>':''}${tier===3?'<path d="m371 414-3 7h27l-3-7Z" fill="#315f45"/><path d="M365 422h33" stroke="#d9bb76" stroke-width="3"/>':''}</g>`;
  }
  function cateringCart(tier) {
    const trailer=tier===3;
    if(trailer)return `<g transform="translate(734 467)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><ellipse cx="60" cy="78" rx="86" ry="9" fill="#173d3025" stroke="none"/><path d="M-7 13Q-7-14 21-14h87q28 0 28 27v51H-7Z" fill="#acc8c0"/><rect x="3" y="1" width="116" height="34" rx="3" fill="#315c43"/><path d="M7 5h108v25H7Z" fill="#bed8c0" stroke="none"/><path d="M-6 44h141m-141 6h141m-141 6h141" stroke="#789a7f" stroke-width="1"/><path d="M136 49h14l11 10" fill="none" stroke-width="3"/><path d="M-7-13h143l13 18H-20Z" fill="#e9d5a1"/><path d="m8-13 7 18m16-18 7 18m16-18 7 18m16-18 7 18m16-18 7 18m16-18 7 18" stroke="#4b7e5b" stroke-width="11"/><path d="M-20 5h169v6H-20Z" fill="#456c48"/><circle cx="17" cy="66" r="12" fill="#31483b"/><circle cx="17" cy="66" r="5" fill="#c0d0b4"/><circle cx="109" cy="66" r="12" fill="#31483b"/><circle cx="109" cy="66" r="5" fill="#c0d0b4"/><path d="M15 20h12v11H15Zm22-2h12v13H37Zm23 3h12v10H60Z" fill="#d5a65a" stroke-width="1"/></g>`;
    return `<g transform="translate(756 479)" stroke="${ink}" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="49" cy="71" rx="82" ry="9" fill="#174b4918" stroke="none"/><path d="M-10-5h${tier===1?110:124}v60H-10Z" fill="${tier>1?'#e6ba63':'#81b2a0'}" stroke-width="2"/><path d="M-7 14h${tier===1?104:118}v36H-7Z" fill="#e6ddbc" stroke-width="1"/><path d="M-18-12h${tier===1?126:140}v13H-18Z" fill="#d5a65a" stroke-width="2"/><path d="M-8-12v-31h${tier===1?107:121}v31" fill="none" stroke-width="2"/><path d="m-20-43 17-23h${tier===1?94:108}l22 23Z" fill="#e6dac0" stroke-width="2"/>${tier>1?'<path d="m5-66 11 23h17l-5-23m24 0v23h18l-5-23m27 0 12 23h18l-17-23" fill="#ae8056" stroke="none"/>':''}<path d="M-20-43h${tier===1?133:147}v8H-20Z" fill="${tier===1?'#72916c':'#ba9569'}" stroke-width="1.3"/><circle cx="9" cy="58" r="12" fill="#425f46" stroke-width="2"/><circle cx="9" cy="58" r="5" fill="#cfdbba" stroke-width="1"/><circle cx="${tier===1?80:94}" cy="58" r="12" fill="#425f46" stroke-width="2"/><circle cx="${tier===1?80:94}" cy="58" r="5" fill="#cfdbba" stroke-width="1"/><text x="${tier===1?44:52}" y="35" font-family="Georgia,serif" font-size="11" fill="${ink}" stroke="none" text-anchor="middle" letter-spacing="1">SODA SOCIAL</text><path d="M15-24h16l-2 15H17Z" fill="#b8884d" stroke-width="1"/><path d="M40-24h16l-2 15H42Z" fill="#91ab64" stroke-width="1"/><path d="M65-24h16l-2 15H67Z" fill="#b87772" stroke-width="1"/><path d="M24-25v-10h5m20 10v-10h5m20 10v-10h5" fill="none" stroke-width="1"/></g>`;
  }
  function upgradeIcon(item, currentLevel) {
    const n=level(item,11),lv=level(currentLevel,3);
    const motifs=[
      `<path d="M22 17v65m56-65v65" stroke-width="4"/><rect x="12" y="25" width="76" height="44" rx="7" fill="${lv?'#367b67':'#e6bd73'}"/><path d="M20 36h60M28 47h44M36 57h28" stroke="${lv?'#f9df9b':ink}" stroke-width="4"/><path d="m49 7 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#f3ce6e" stroke-width="1.5"/>`,
      '<path d="M50 42v42m-18 0h36M12 50v29m18-29v29m40-29v29m18-29v29" stroke-width="4"/><path d="M9 47h25v14H9Zm57 0h25v14H66Z" fill="#85b49b"/><ellipse cx="50" cy="45" rx="32" ry="9" fill="#e7b77b"/><path d="M50 44V16m-31 9 31-15 31 15Z" fill="#e19a77"/><path d="M19 25h62" stroke-width="2"/><path d="M43 30h12l-2 13h-8Z" fill="#f8f1d4" stroke-width="1.5"/>',
      '<path d="M17 30h66v51H17Z" fill="#b4d1b2"/><path d="M25 46h23v35H25Zm31 0h19v20H56Z" fill="#ecedce"/><path d="m11 33 9-16h60l9 16v7q-6 8-13 0-6 8-13 0-6 8-13 0-6 8-13 0-6 8-13 0-6 8-13 0Z" fill="#f0c980"/><path d="M33 17 30 33v8m20-24v23m17-23 3 16v8" stroke="#da9678" stroke-width="12"/><path d="M11 33h78" stroke-width="2"/><path d="M13 84h74" stroke-width="4"/>',
      `<rect x="22" y="22" width="54" height="60" rx="8" fill="${lv>1?'#e5be6d':'#8ab7a5'}"/><rect x="28" y="28" width="42" height="31" rx="4" fill="#d6e5c9"/><path d="M50 23V11m-8-1h16M50 46v16h11v8" fill="none" stroke-width="5"/><circle cx="50" cy="39" r="8" fill="#e8a067"/><path d="M30 76h36" stroke="#f7e8b9" stroke-width="3"/><path d="m42 65 15 0-2 13H44Z" fill="#fff6db" stroke-width="1.5"/>`,
      `<g transform="translate(50 48) scale(.61)">${staff(0,0,'helper')}</g>`,
      `<g transform="translate(47 47) scale(.61)">${staff(0,0,'specialist')}</g>`,
      '<path d="M12 84h76V35l-38-22-38 22Z" fill="#bad2ac"/><path d="m7 36 43-27 43 27" fill="none" stroke-width="5"/><path d="M22 47h22v37H22Zm34 0h22v23H56Z" fill="#fff0c9"/><path d="M55 59h24M67 47v23M27 31h45" fill="none" stroke="#79a383" stroke-width="2"/><path d="M33 58v8" stroke="#b9914b" stroke-width="3"/>',
      '<path d="M17 45h67v33H17Z" fill="#84b2a0"/><path d="M17 60h67v18H17Z" fill="#f5e5bd"/><path d="M14 43h74v7H14ZM20 42V25m63 17V25" fill="#e5bc73"/><path d="m12 26 10-14h59l10 14v7q-6 7-13 0-6 7-13 0-6 7-13 0-6 7-13 0-6 7-13 0-6 7-14 0Z" fill="#e59b77"/><path d="m37 12-4 14m26-14 4 14" stroke="#fff0cb" stroke-width="10"/><circle cx="28" cy="81" r="9" fill="#537b68"/><circle cx="73" cy="81" r="9" fill="#537b68"/><path d="M34 63h32" stroke-width="3"/>',
      '<path d="M21 19h58v66H21Z" fill="#e5bb6a"/><path d="M28 26h44v50H28Z" fill="#fff3d4"/><path d="m50 32 5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2Z" fill="#e9bd57" stroke-width="2"/><path d="M36 70h28" stroke="#7aa080" stroke-width="3"/><path d="m39 84-3 11 14-5 14 5-3-11" fill="#d89072"/>'
    ];
    motifs.push(
      '<path d="M9 69h82l-10 17H20Z" fill="#e4bd86"/><path d="M13 37a27 27 0 0 0 48 23Z" fill="#81ae60"/><path d="M20 42a19 19 0 0 0 33 16Z" fill="#dfecb0" stroke="#a9c97b" stroke-width="1.4"/><path d="m22 43 29 14m-14-7-5 15m5-15 9 16" fill="none" stroke="#91b465" stroke-width="1.6"/><path d="M51 30a24 24 0 0 0 36 30Z" fill="#659d54"/><path d="M56 36a17 17 0 0 0 25 21Z" fill="#d8eaa1" stroke-width="1.3"/><path d="m59 39 20 16m-10-8-6 12" stroke="#94b568" stroke-width="1.6"/>',
      '<path d="M19 38h24v45H19Zm39-8h24v53H58Z" fill="#cb7c8b"/><path d="M24 32h14v8H24Zm39-8h14v8H63Z" fill="#e5be75"/><path d="M31 32V17h17v7m22 0V10h17v7" fill="none" stroke-width="4"/><path d="M22 51h18v20H22Zm39-9h18v25H61Z" fill="#fff1d3" stroke-width="1.5"/><circle cx="30" cy="62" r="5" fill="#c66b7d" stroke-width="1.3"/><path d="m30 57 5-5" stroke="#769863" stroke-width="2"/><circle cx="69" cy="55" r="5" fill="#c66b7d" stroke-width="1.3"/><path d="m69 50 4-5" stroke="#769863" stroke-width="2"/><path d="M12 87h77" stroke="#b99a6c" stroke-width="5"/>',
      '<rect x="16" y="17" width="68" height="70" rx="9" fill="#8bb7a5"/><rect x="23" y="25" width="20" height="31" rx="4" fill="#b9ddcf"/><rect x="57" y="25" width="20" height="31" rx="4" fill="#dfa789"/><path d="M33 57v9h34v-9M50 65v11" fill="none" stroke-width="4"/><circle cx="50" cy="77" r="4" fill="#eac478" stroke-width="1.8"/><path d="M28 30v17m34-17v17" stroke="#fff3d68a" stroke-width="3"/><path d="M29 10h12m18 0h12" stroke-width="5"/>'
    );
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><ellipse cx="50" cy="88" rx="37" ry="5" fill="#174b490d"/><g fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${motifs[n]}</g></svg>`;
  }
  function counter(options) {
    const o=options&&typeof options==='object'?options:{};
    const tap=level(o.tap,2),training=level(o.training,3),interior=level(o.interior,3),catering=level(o.catering,3),sign=level(o.sign,3),a=level(o.awning,2);
    const badge=feature('sign',`<rect x="68" y="116" width="209" height="66" rx="3" fill="${sign?'#d5a65a':'#b39364'}"/><rect x="73" y="121" width="199" height="56" rx="1" fill="#284e3c"/><text x="172" y="146" text-anchor="middle" fill="${sign>1?'#e4ce8f':'#b8c9a4'}" font-family="Georgia,serif" font-size="15" letter-spacing="2">PERFECT POUR</text><text x="172" y="165" text-anchor="middle" fill="#c2c9a4" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">SODA POP BAR</text>${sign>1?'<path d="M80 126h186M80 172h186" stroke="#d8bd78" stroke-width="1.3"/>':''}`);
    const hired=(o.helperActive?feature('helper',photo(1,'neutral',385,321,84,107)):'')+(o.specialistActive?feature('specialist',photo(6,'neutral',744,321,83,107)):'');
    return materialize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><g stroke="${ink}" stroke-linecap="round" stroke-linejoin="round">${badge}
      ${a?feature('awning',`<path d="M55 75h236v25H55Z" fill="#d9cba6"/><path d="M66 75v25m36-25v25m36-25v25m36-25v25m36-25v25m36-25v25" stroke="${a>1?'#729671':'#b59069'}" stroke-width="18"/>`):''}
      ${ingredientShelf(o,852,233,1.15)}
      ${training?feature('training',`<rect x="347" y="215" width="${training>1?66:49}" height="62" rx="2" fill="#e7c985"/><rect x="353" y="221" width="${training>1?54:37}" height="50" fill="#e9e5c8"/><circle cx="372" cy="239" r="8" fill="#c3aa64" stroke="none"/><path d="M360 257h26m-26 5h26" stroke="#91a17e" stroke-width="1"/>${training===3?'<path d="M395 267v17m-9 0h18m-17-34h17l-2 9q-6 11-13 0Z" fill="#d5a65a" stroke-width="1"/>':''}`):''}
      ${interior?feature('interior',`<rect x="1025" y="279" width="${interior===3?113:77}" height="129" rx="1" fill="#3e7c70"/><rect x="1032" y="286" width="${interior===3?99:63}" height="115" fill="#bed8c0"/><path d="M1035 289h34l-34 45" fill="#e5edd0" opacity=".18" stroke="none"/>${interior>1?'<path d="M1035 356h46m-23-11v43" stroke="#c2af78" stroke-width="3"/>':''}`):''}
      ${tap?feature('tap',`<g transform="translate(795 387)"><rect x="-22" y="-43" width="48" height="52" rx="4" fill="${tap>1?'#d7b16b':'#8eac9a'}" stroke-width="1.2"/><rect x="-17" y="-37" width="38" height="30" rx="2" fill="#385e44" stroke-width="1"/><path d="M0-43v22h8v9" fill="none" stroke="#c2cdb0" stroke-width="3"/><path d="M0-50v8" stroke="#b79358" stroke-width="6"/></g>`):''}
      ${catering?feature('catering',`<rect x="1105" y="328" width="78" height="63" rx="2" fill="${catering===3?'#acc8c0':'#b39364'}" stroke-width="1.2"/><path d="M1110 335h68v14h-68Z" fill="#e1d5ab"/><path d="M1117 362h13v20h-13Zm22 0h13v20h-13Zm22 0h13v20h-13Z" fill="#789a61" stroke-width="1"/>`):''}
      </g>${hired}</svg>`);
  }
  window.PourStoreArt=Object.freeze({render,upgradeIcon,counter});
}());
