/* Original, dependency-free ingredients for Perfect Pour V1.04. */
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

  window.PourRecipeArt=Object.freeze({icon,tint,mixColor,renderRatioOrder,drawInside,drawRim});
})();
