/* Original, dependency-free recipe art and soda-counter objects. */
(() => {
  'use strict';
  const ink='#174b49', cream='#fff4d9';
  const colors=['#f49132','#d95d75','#83b559','#8f573a'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):a));
  const count=(n,max)=>Math.trunc(clamp(n,0,max));
  const cherryMark='<path d="M27 31c8-7 10-13 9-22m-1 4c5 7 9 11 10 20" fill="none" stroke="#557f4c" stroke-width="3"/><path d="M36 12c9-7 15-3 16 0-7 5-12 4-16 0Z" fill="#87b768" stroke-width="1.8"/><path d="M26 28c-10-3-16 6-13 15 4 14 19 14 23 1 3-10-2-18-10-16Z" fill="#d76875"/><path d="M45 29c-10-4-18 5-15 15 3 13 18 15 23 3 4-10 0-18-8-18Z" fill="#bf4f60"/><path d="M19 34c-3 3-3 6-2 8m20-7c-3 3-3 6-2 8" fill="none" stroke="#ffb1ad" stroke-width="3"/>';

  function icon(kind, options={}) {
    const o=typeof options==='number'?{soda:options}:options||{};
    let art='';
    if (kind==='base'||kind==='soda'||/^base-[0-3]$/.test(kind)) {
      const n=count(kind.startsWith('base-')?kind.slice(-1):o.soda??o.index,3);
      const badge=[
        '<circle cx="32" cy="41" r="8" fill="#ffc966"/><path d="m32 33 0 16m-8-8h16m-14-6 12 12m-12 0 12-12" stroke="#f2a650" stroke-width="1.2"/>',
        '<g transform="translate(20 28) scale(.37)">'+cherryMark+'</g>',
        '<path d="M23 35a12 12 0 0 0 18 14Z" fill="#cbeaa0"/><path d="m25 37 14 10m-7-5-3 8m3-8 9 0" fill="none" stroke="#6e9d50" stroke-width="1.3"/>',
        '<path d="m32 31 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z" fill="#f0ca7c" stroke-width="1.4"/>'
      ][n];
      art=`<path d="M25 11h14v10l7 9v26q-14 6-28 0V30l7-9Z" fill="${colors[n]}"/><path d="M24 8h16v7H24Z" fill="#7aa48a"/><path d="M20 31h24v22H20Z" fill="${cream}" stroke-width="1.5"/>${badge}<path d="M24 23l-3 7v23" fill="none" stroke="#fff4d969" stroke-width="2"/>`;
    } else if (kind==='cherry'||kind==='cherries') {
      art=cherryMark;
    } else if (kind==='lime'||kind==='citrus') {
      art='<g transform="translate(32 26) rotate(27)"><path d="M-24 0a24 24 0 0 0 48 0Z" fill="#75a956"/><path d="M-19 1a19 19 0 0 0 38 0Z" fill="#d5eca5" stroke="#b3d67e" stroke-width="2"/><path d="M0 2-14 13M0 2v18M0 2l14 11" fill="none" stroke="#87b464" stroke-width="1.6"/><path d="M-18 1h36" stroke="#f7f9d5" stroke-width="2.6"/></g>';
    } else if (kind==='syrup') {
      art='<path d="M23 25h18l5 7v25H18V32Z" fill="#cf6a7b"/><path d="M24 20h16v8H24Z" fill="#f0cf83"/><path d="M32 21V11h18v6" fill="none" stroke-width="4"/><path d="M20 35h24v17H20Z" fill="'+cream+'" stroke-width="1.5"/><g transform="translate(23 33) scale(.29)">'+cherryMark+'</g><path d="M22 31v22" stroke="#f4a2ae" stroke-width="2"/>';
    } else if (kind==='ice') {
      art='<path d="m12 21 17-7 17 7-3 23-17 8-15-8Z" fill="#c1e2dc"/><path d="m12 21 15 8 19-8M27 29l-1 23" fill="none" stroke="#f9fff1" stroke-width="2.6"/><path d="m29 31 12-5-2 14-10 5Z" fill="#8fc7c5" stroke="none"/><path d="m35 11 10-4 11 5-1 12-11 5-10-5Z" fill="#d7eee1"/><path d="m35 11 9 5 12-4m-12 4v13" stroke="#fffcef" stroke-width="1.5"/>';
    } else if (kind==='water'||kind==='blend') {
      const blend=count(o.blend??o.level??1,2);
      const color=['#bcd8ce','#9dbba1','#ba976c'][blend];
      art=`<path d="M15 22h31l-4 35H19Z" fill="#fff8e7"/><path d="M18 36h25l-2 18H20Z" fill="${color}" stroke="none"/><path d="M14 22h33" stroke-width="3"/><path d="M22 26l2 24" fill="none" stroke="#ffffff9a" stroke-width="2"/><path d="M45 5s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z" fill="#9ec9bb" stroke-width="2"/><path d="M42 18q0 3 3 3" fill="none" stroke="#fff8e7" stroke-width="1.8"/>`;
      if(blend===0)art+='<circle cx="26" cy="42" r="2" fill="#edf6dc" stroke="none"/><circle cx="35" cy="48" r="1.8" fill="#edf6dc" stroke="none"/>';
      if(blend===2)art+='<path d="M26 45h9" stroke="#8d6646" stroke-width="3"/>';
    } else if (kind==='check') {
      art='<circle cx="32" cy="32" r="22" fill="#c8e1b2"/><path d="m20 32 8 8 17-18" fill="none" stroke-width="4"/>';
    } else {
      art='<path d="M18 15h29l-4 41H22Z" fill="#f5ca74"/><path d="M17 15h31m-13 0 5-10h10" fill="none"/><circle cx="29" cy="34" r="2" fill="'+ink+'"/><circle cx="39" cy="34" r="2" fill="'+ink+'"/><path d="M29 43q5 5 10 0" fill="none"/>';
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g fill="none" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${art}</g></svg>`;
  }

  let stationSequence=0;

  // These are stocked counter objects, deliberately independent of the small
  // recipe symbols. A unique prefix keeps every inline SVG's materials local.
  function station(kind, amount=0, options={}) {
    kind=({cherries:'cherry',citrus:'lime'})[kind]||kind;
    if(!['cherry','lime','ice','syrup'].includes(kind))return icon(kind);
    const key=`pp-station-${kind}-${++stationSequence}`;
    const paint=name=>`url(#${key}-${name})`;
    const selected=count(amount,2)>0,available=options?.available!==false;
    const defs=`<defs>
      <linearGradient id="${key}-steel" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#7c9c93"/><stop offset=".12" stop-color="#dae6d9"/><stop offset=".26" stop-color="#f5f7e5"/><stop offset=".49" stop-color="#a6beb0"/><stop offset=".73" stop-color="#e3ead9"/><stop offset=".94" stop-color="#7f9e91"/><stop offset="1" stop-color="#65897b"/></linearGradient>
      <linearGradient id="${key}-rim" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#faffee"/><stop offset=".4" stop-color="#d4e3d1"/><stop offset=".55" stop-color="#77998c"/><stop offset="1" stop-color="#ecf0d9"/></linearGradient>
      <linearGradient id="${key}-well" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#315d54"/><stop offset="1" stop-color="#a5c5b5"/></linearGradient>
      <radialGradient id="${key}-cherry" cx=".3" cy=".2" r=".85"><stop stop-color="#f49a92"/><stop offset=".22" stop-color="#de6a77"/><stop offset=".68" stop-color="#b84158"/><stop offset="1" stop-color="#7b2e43"/></radialGradient>
      <linearGradient id="${key}-peel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a5c85e"/><stop offset=".45" stop-color="#6e9d44"/><stop offset="1" stop-color="#3c7246"/></linearGradient>
      <linearGradient id="${key}-flesh" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f4f5bc"/><stop offset="1" stop-color="#b8d788"/></linearGradient>
      <linearGradient id="${key}-ice" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#f4fff2" stop-opacity=".96"/><stop offset=".4" stop-color="#c7e8df" stop-opacity=".94"/><stop offset="1" stop-color="#89bdb9" stop-opacity=".98"/></linearGradient>
      <linearGradient id="${key}-syrup" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#8b3e47"/><stop offset=".14" stop-color="#e78b88"/><stop offset=".35" stop-color="#bd5364"/><stop offset=".68" stop-color="#a33b54"/><stop offset="1" stop-color="#703c45"/></linearGradient>
      <linearGradient id="${key}-label" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8da"/><stop offset="1" stop-color="#e6d7ac"/></linearGradient>
    </defs>`;
    const cherry=(x,y,r,turn=0)=>`<g transform="translate(${x} ${y}) rotate(${turn})"><path d="M0 ${-r*.6}q${r*.8} ${-r} ${r*.25} ${-r*1.5}" fill="none" stroke="#537b46" stroke-width="1.5"/><path d="M0 ${-r*.66}C${-r*.9} ${-r*1.3} ${-r*1.4} ${-r*.1} ${-r*.85} ${r*.65}C${-r*.5} ${r*1.22} ${r*.6} ${r*1.22} ${r*.97} ${r*.46}C${r*1.3} ${-r*.38} ${r*.56} ${-r*1.2} 0 ${-r*.66}Z" fill="${paint('cherry')}" stroke="#823e4b" stroke-width=".8"/><path d="M${-r*.53} ${-r*.23}q${-r*.15} ${r*.23} ${-r*.05} ${r*.46}" fill="none" stroke="#ffd0b6" stroke-opacity=".8" stroke-width="1.6"/><ellipse cx="${r*.12}" cy="${-r*.66}" rx="1.5" ry=".9" fill="#803d49"/></g>`;
    const wedge=(x,y,scale=1,turn=0)=>`<g transform="translate(${x} ${y}) rotate(${turn}) scale(${scale})"><path d="M-19-1Q0-7 19-1Q17 16 0 19Q-17 16-19-1Z" fill="${paint('peel')}" stroke="#456f43" stroke-width="1.1"/><path d="M-16 0Q0-4 16 0Q13 13 0 15Q-13 13-16 0Z" fill="${paint('flesh')}" stroke="#e5edb0" stroke-width="1.6"/><path d="M0 0-10 9M0 0v14M0 0l10 9" fill="none" stroke="#f7f6ce" stroke-width="1.5"/><path d="M-14 0Q0-3 14 0" fill="none" stroke="#ffffdf" stroke-width="1.6"/><path d="m-7 3 2 2m9-2-1 2" stroke="#accf7c" stroke-width="1"/><path d="M-16 9Q-11 16-2 18" fill="none" stroke="#a8cd68" stroke-width=".9"/></g>`;
    const cube=(x,y,s=1,turn=0)=>`<g transform="translate(${x} ${y}) rotate(${turn}) scale(${s})"><path d="m-12-9 15-4 10 7-1 17-15 5-10-7Z" fill="${paint('ice')}" stroke="#6caba4" stroke-width="1.1"/><path d="m-12-9 10 7 15-4M-2-2l-1 18" fill="none" stroke="#f9fff1" stroke-width="1.5"/><path d="m1 1 9-3-1 10-9 3Z" fill="#a9d6cf" fill-opacity=".6" stroke="none"/><path d="m-8-7 5 4m8-8 5 4" fill="none" stroke="#fffef2" stroke-width="1.9"/><path d="M-8 3v3" stroke="#ebfff2" stroke-width="1.5"/></g>`;
    let art='';
    if(kind==='cherry'){
      art=`<ellipse cx="65" cy="96" rx="43" ry="5.6" fill="#4e5638" opacity=".18"/>
        <g transform="rotate(28 102 45)"><ellipse cx="102" cy="40" rx="13" ry="24" fill="${paint('steel')}" stroke="#627f6b" stroke-width="1.6"/><ellipse cx="102" cy="40" rx="9.4" ry="19" fill="none" stroke="#f2f2d8" stroke-width="1.3"/><path d="M98 24q-4 16 0 31" fill="none" stroke="#ecf6e2" stroke-opacity=".7"/></g>
        <path d="M24 41h78l-3 45c-1 13-70 13-72 0Z" fill="${paint('steel')}" stroke="#537c68" stroke-width="1.8"/>
        <path d="M29 81q34 12 69 0m-69 6q34 11 68 0" fill="none" stroke="#6d8c71" stroke-opacity=".6" stroke-width="1.1"/><path d="M32 50v27" fill="none" stroke="#f6fae4" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="63" cy="41" rx="40.4" ry="17" fill="${paint('rim')}" stroke="#698a73" stroke-width="1.8"/>
        <ellipse cx="63" cy="41" rx="34.5" ry="12.3" fill="#7f3547" stroke="#a5b99a" stroke-width="1.3"/>
        ${cherry(39,36,8.7,-18)}${cherry(61,33,8.4,8)}${cherry(82,36,8.6,22)}${cherry(49,43,10,-8)}${cherry(73,44,9.7,18)}${cherry(90,43,6.7,25)}${cherry(33,43,6.5,-19)}
        <path d="M25 44q37 25 76 0" fill="none" stroke="#edf0d6" stroke-width="3.4" stroke-linecap="round"/><path d="M25 47q37 23 76 0" fill="none" stroke="#688d73" stroke-width="1.3"/>
        <path d="M46 64q16 5 33 0v16q-16 5-33 0Z" fill="#e4e9cd" fill-opacity=".75" stroke="#98ad8a" stroke-width=".8"/><g transform="translate(51 60) scale(.36)" stroke="#866e53" stroke-width="2" stroke-linejoin="round">${cherryMark}</g>
        <path d="M95 55v17" fill="none" stroke="#567e68" stroke-opacity=".4" stroke-width="1.2"/>`;
    }else if(kind==='lime'){
      art=`<ellipse cx="64" cy="94" rx="51" ry="5.5" fill="#4e5638" opacity=".18"/>
        <path d="M11 45q1-5 8-6l87-2q9 0 11 7l-6 35q-1 9-14 12H31q-12-2-14-11Z" fill="${paint('steel')}" stroke="#5c806b" stroke-width="1.7"/>
        <path d="M16 69q46 13 96-1m-92 12q45 10 89-1" fill="none" stroke="#779a7c" stroke-width="1.3" opacity=".7"/>
        <path d="M17 40q47-18 93 1l5 14q-50 24-102 0Z" fill="${paint('rim')}" stroke="#688c72" stroke-width="1.5"/>
        <path d="M22 43q41-14 82-1l5 10q-44 19-90 0Z" fill="${paint('well')}" stroke="#9db7a0" stroke-width="1"/>
        ${wedge(36,37,.79,-22)}${wedge(62,31,.86,8)}${wedge(86,35,.76,-25)}${wedge(98,45,.7,9)}${wedge(68,44,.96,-12)}${wedge(40,49,.9,11)}${wedge(87,53,.81,12)}
        <path d="M14 55q49 22 101-1" fill="none" stroke="#edf2d6" stroke-width="3.7" stroke-linecap="round"/><path d="M16 60q49 20 98-1" fill="none" stroke="#6d9176" stroke-width="1.2"/>
        <path d="M23 69v9q0 6 9 8" fill="none" stroke="#f0f5dc" stroke-width="2.4" stroke-linecap="round"/><path d="M97 72v7" fill="none" stroke="#5c816b" stroke-opacity=".5" stroke-width="1.5"/>
        <path d="M52 75h23v8H52Z" fill="#e4e9ce" fill-opacity=".55" stroke="#a5b699" stroke-width=".6"/><path d="m59 78 5 3 5-3" fill="none" stroke="#638b55" stroke-width="1.3"/>`;
    }else if(kind==='ice'){
      art=`<ellipse cx="63" cy="96" rx="50" ry="5.5" fill="#4e5638" opacity=".17"/>
        <path d="m13 39 79-5 24 16-8 37q-2 7-11 8H34q-12-1-16-11Z" fill="${paint('steel')}" stroke="#577e6f" stroke-width="1.7"/>
        <path d="m13 39 21 21v34Q21 91 18 83Z" fill="#8bad9d" fill-opacity=".6"/><path d="M34 60q40 4 82-10l-8 37q-3 6-11 7H35Z" fill="${paint('steel')}"/>
        <path d="m13 39 79-7q5-1 9 2l15 15q4 5-1 8L36 67q-6 1-10-3L10 46q-3-5 3-7Z" fill="${paint('rim')}" stroke="#628b7b" stroke-width="1.5"/>
        <path d="m19 42 72-6 18 16-74 10Z" fill="${paint('well')}" stroke="#799f8e" stroke-width="1"/>
        ${cube(32,39,.77,-12)}${cube(56,34,.79,8)}${cube(83,37,.84,-10)}${cube(49,50,.85,5)}${cube(76,50,.78,11)}${cube(98,50,.64,-13)}
        <path d="m13 47 17 17q3 2 7 1l78-10" fill="none" stroke="#f4f7df" stroke-width="3.3" stroke-linecap="round"/><path d="m34 70 76-11" fill="none" stroke="#547e6c" stroke-width="1"/>
        <path d="M42 73v14h15" fill="none" stroke="#f4f8e2" stroke-width="2.2" stroke-linecap="round"/><path d="M90 72v11" fill="none" stroke="#688c79" stroke-width="1.2"/><path d="m61 78 7-2 7 2-1 7-7 2-6-2Z" fill="#c8ded1" stroke="#8ead97" stroke-width=".7"/>
        <g transform="rotate(30 104 43)"><path d="M101 44V12q3-5 6 0v32Z" fill="${paint('steel')}" stroke="#4e7868" stroke-width="1.2"/><path d="M103 15v24" stroke="#ffffe5" stroke-width="1.5" stroke-linecap="round"/><path d="M95 40q9-6 18 0l-2 24q-7 6-14 0Z" fill="${paint('steel')}" stroke="#547e6d" stroke-width="1.4"/><ellipse cx="104" cy="42" rx="9" ry="4" fill="#5b897a" stroke="#f4f8df" stroke-width="1.3"/><path d="M99 49v11q3 3 5 2" fill="none" stroke="#f3f7df" stroke-width="1.7" stroke-linecap="round"/></g>`;
    }else{
      art=`<ellipse cx="64" cy="97" rx="31" ry="5" fill="#4e5638" opacity=".18"/>
        <path d="M51 24h25v13q0 4 7 8 4 3 4 10v32q0 10-23 10T41 87V55q0-7 4-10 6-4 6-8Z" fill="${paint('syrup')}" stroke="#674d47" stroke-width="1.7"/>
        <path d="M47 55q17 5 34 0v29q-17 5-34 0Z" fill="${paint('label')}" stroke="#eacfa1" stroke-width="1.3"/>
        <path d="M49 57q15 4 30 0m-30 25q15 4 30 0" fill="none" stroke="#c8a776" stroke-width=".8"/>
        <g transform="translate(50 56) scale(.42)" stroke="#6f5949" stroke-width="2.3" stroke-linejoin="round">${cherryMark}</g>
        <path d="M46 50q-1 2-1 8v24q0 6 7 7" fill="none" stroke="#ffcab2" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/><path d="M82 51v30" stroke="#662c42" stroke-opacity=".3" stroke-width="1.4"/>
        <path d="M50 24q13 3 27 0v9q-13 4-27 0Z" fill="${paint('steel')}" stroke="#648370" stroke-width="1.3"/><path d="M53 27v4m4-3v4m5-3v3m6-3v3m5-4v3" stroke="#769a7e" stroke-width="1"/>
        <path d="M60 25V15h7v10" fill="${paint('steel')}" stroke="#547a65" stroke-width="1.2"/>
        <path d="M51 10q0-3 4-3h31q6 0 6 5v9h-7v-7H55q-4 0-4-4Z" fill="${paint('steel')}" stroke="#557969" stroke-width="1.6"/><path d="M55 9h28q5 0 6 3" fill="none" stroke="#faffeb" stroke-width="1.5" stroke-linecap="round"/><path d="M85 21h7" stroke="#315d54" stroke-width="1.6"/>
        <ellipse cx="64" cy="90" rx="17" ry="2" fill="#e88789" opacity=".4"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 104" class="counter-object counter-object-${kind}${selected?' has-portion':''}${available?'':' is-unavailable'}" aria-hidden="true" focusable="false">${defs}<g stroke-linejoin="round" stroke-linecap="round">${art}</g></svg>`;
  }

  function tint(color, blend=1, syrup=0) {
    const raw=String(color).replace('#','');
    if(!/^[a-f\d]{6}$/i.test(raw))return color;
    let rgb=[0,2,4].map(p=>parseInt(raw.slice(p,p+2),16));
    const b=count(blend,2),s=count(syrup,2);
    const mix=(to,amount)=>{rgb=rgb.map((v,i)=>Math.round(v+(to[i]-v)*amount));};
    if(b===0)mix([238,240,210],.28);
    if(b===2)mix([102,57,43],.16);
    if(s)mix([195,65,92],s*.14);
    return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
  }

  // Keep the stream's current soda separate from the drink already in the cup.
  // A fraction of 1 is entirely the first soda; 0 is entirely the second.
  function mixColor(firstColor, secondColor, firstFraction=.5) {
    const parse=value=>{
      let raw=String(value??'').replace(/^#/,'');
      if(/^[a-f\d]{3}$/i.test(raw))raw=raw.split('').map(n=>n+n).join('');
      if(!/^[a-f\d]{6}$/i.test(raw))return null;
      return [0,2,4].map(p=>parseInt(raw.slice(p,p+2),16));
    };
    const first=parse(firstColor),second=parse(secondColor);
    if(!first)return second?String(secondColor):String(firstColor??cream);
    if(!second)return String(firstColor);
    const fraction=Number.isFinite(Number(firstFraction))?clamp(firstFraction,0,1):.5;
    return '#'+first.map((value,i)=>Math.round(value*fraction+second[i]*(1-fraction)).toString(16).padStart(2,'0')).join('');
  }

  // The same tiny sequence fits the request, the preparation tray, and the
  // prepared recipe. Completion records a spent pour, not its quality.
  function renderRatioOrder({first=0,second=4,share=.5,part=0,complete=false}={}) {
    const firstId=Number(first),secondId=Number(second);
    if(!Number.isInteger(firstId)||!Number.isInteger(secondId)||firstId<0||firstId>3||secondId<0||secondId>3)return '';
    const names=['Orange','Cherry','Lime','Cola'];
    const firstPercent=Math.round(clamp(share,.01,.99)*100),shares=[firstPercent,100-firstPercent];
    const current=count(part,1),finished=Boolean(complete);
    const chips=[firstId,secondId].map((soda,index)=>{
      const done=finished||index<current,active=!done&&index===current;
      const status=done?'complete':active?'current':'next';
      const label=`Part ${index+1}: ${names[soda]}, ${shares[index]} percent, ${status}.`;
      return `<span class="ratio-chip${active?' is-active':''}${done?' is-complete':''}" data-ratio-part="${index+1}" role="img" aria-label="${label}" title="${label}"${active?' aria-current="step"':''} style="--ratio-color:${colors[soda]};--ratio-wash:${mixColor(colors[soda],cream,.16)}"><i class="ratio-step" aria-hidden="true">${done?'✓':index+1}</i>${icon('base',{soda})}<span class="ratio-measure" aria-hidden="true"><span class="ratio-name">${names[soda]}</span><b>${shares[index]}<small>%</small></b></span></span>`;
    });
    return `<span class="ratio-order" role="group" aria-label="Two-soda mix: ${shares[0]} percent ${names[firstId]}, then ${shares[1]} percent ${names[secondId]}.">${chips[0]}<span class="ratio-arrow" aria-hidden="true">→</span>${chips[1]}</span>`;
  }

  function drawCherry(ctx,x,y,r,turn) {
    ctx.save();ctx.translate(x,y);ctx.rotate(turn);
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(0,-r*.6);ctx.quadraticCurveTo(r*.9,-r*1.7,r*.35,-r*2.2);ctx.strokeStyle='#597d48';ctx.lineWidth=2.3;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-r*.7);ctx.bezierCurveTo(-r*.65,-r*1.3,-r*1.3,-r*.2,-r*.95,r*.5);ctx.bezierCurveTo(-r*.4,r*1.35,r*.35,r*1.3,r*.95,r*.45);ctx.bezierCurveTo(r*1.3,-r*.25,r*.65,-r*1.3,0,-r*.7);ctx.fillStyle='#c95167';ctx.fill();ctx.strokeStyle='#753c49';ctx.lineWidth=1.4;ctx.stroke();
    ctx.beginPath();ctx.ellipse(-r*.42,-r*.22,r*.19,r*.35,.35,0,Math.PI*2);ctx.fillStyle='#ffb1af';ctx.fill();ctx.restore();
  }

  // Caller clips this layer to the same cup path used for liquid. Garnishes do
  // not change the engine's volume or target; their display is purely visual.
  function drawInside(ctx,options={}) {
    const g=options.geometry;if(!g||!ctx)return;
    const cherries=count(options.cherries,2),syrup=count(options.syrup,2);
    const liquidY=Number.isFinite(options.liquidY)?options.liquidY:g.bottom;
    const filled=liquidY<g.bottom-3;
    ctx.save();
    if(syrup){
      const floor=g.bottom-5;
      ctx.globalAlpha=filled?.29:.78;ctx.fillStyle='#b64d6c';
      ctx.beginPath();ctx.ellipse(260,floor,Math.min(g.width(.04)*.43,45),4+syrup,0,0,Math.PI*2);ctx.fill();
      if(filled){
        ctx.strokeStyle='#ad4565';ctx.lineWidth=4+syrup;ctx.lineCap='round';ctx.globalAlpha=.18;
        const span=Math.max(10,g.bottom-liquidY-12);
        for(let i=0;i<3;i++){
          const y=floor-span*(.2+i*.25),spread=21+i*5;
          ctx.beginPath();ctx.moveTo(260-spread,y+3);ctx.bezierCurveTo(254,y+13,281,y+7,260+spread,y-6);ctx.stroke();
        }
      }
      ctx.globalAlpha=1;
    }
    for(let i=0;i<cherries;i++){
      // Keep the fruit above the status pill and beside the printed cup mark.
      // Constrain the offset to the local glass width, including curved cups.
      const r=9.2,y=g.bottom-42-i*3;
      const height=g.cup?.height||g.bottom-g.top;
      const offset=Math.min(36,g.width((g.bottom-y)/height)/2-r*1.35-3);
      drawCherry(ctx,260+(i===0?-offset:offset),y,r,i===0?-.16:.2);
    }
    ctx.restore();
  }

  function drawRim(ctx,options={}) {
    const g=options.geometry;if(!g||!ctx||!count(options.lime,1))return;
    const x=260+g.width(1)*.43,y=g.top+2,r=20;
    ctx.save();ctx.translate(x,y);ctx.rotate(-.6);ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(-r,0);ctx.arc(0,0,r,Math.PI,0,false);ctx.closePath();ctx.fillStyle='#79ad57';ctx.strokeStyle='#376e45';ctx.lineWidth=2.2;ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r+4,-1);ctx.arc(0,-1,r-4,Math.PI,0,false);ctx.closePath();ctx.fillStyle='#d9ed9d';ctx.fill();
    ctx.strokeStyle='#98c06b';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(-11,-11);ctx.moveTo(0,-2);ctx.lineTo(0,-16);ctx.moveTo(0,-2);ctx.lineTo(11,-11);ctx.stroke();
    ctx.strokeStyle='#f2f5c4';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-15,-2);ctx.lineTo(15,-2);ctx.stroke();
    ctx.restore();
  }

  window.PourRecipeArt=Object.freeze({icon,station,tint,mixColor,renderRatioOrder,drawInside,drawRim});
})();
