/* Perfect Pour V1.01 · Presentation and input. Simulation, business, saves, and rules are Rust/Wasm. */
(() => {
  'use strict';
  const WASM_BASE64 = '__WASM_BASE64__';
  const $ = id => document.getElementById(id);
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const dollars = cents => '$' + (cents / 100).toFixed(2);
  const percent = fraction => Math.round(fraction * 100);
  const VISIBLE_FOAM = .001;
  const sodas = [
    {name:'Sunset Orange',color:'#f49132',light:'#ffd483',flavor:'Bright, citrusy & mellow',fizz:'MILD',note:'A gentle fizz. A lovely place to start.',aside:'A little sunshine in a cup.'},
    {name:'Cherry Pop',color:'#d95d75',light:'#ffa6b2',flavor:'Sweet cherry, cheeky bubbles',fizz:'BUBBLY',note:'A bubbly personality. Leave a little room for fizz.',aside:'Make it cherry. Make it happy.'},
    {name:'Lime Lift',color:'#83b559',light:'#ceeb96',flavor:'Fresh lime with a lively lift',fizz:'FIZZY',note:'Lively bubbles. Give the foam a moment.',aside:'Something fresh and a little fizzy.'},
    {name:'Midnight Cola',color:'#8f573a',light:'#d0a16a',flavor:'Classic cola, extra sparkle',fizz:'EXTRA',note:'Our foamiest pour. Watch the cream-colored foam.',aside:'Classic cola. Extra sparkle, please.'}
  ];
  const cups = [
    {name:'THE CLASSIC',height:230,top:144,bottom:96,curve:0},
    {name:'THE SHORT STACK',height:174,top:194,bottom:174,curve:3},
    {name:'THE TALL TALE',height:273,top:126,bottom:103,curve:0},
    {name:'THE WILD CARD',height:219,top:178,bottom:95,curve:-27}
  ];
  const names = ['Jamie','Cleo','Max','Ruth','Finn','Maya','Ollie','Sasha','Ellis','Juniper','Theo','Sunny'];
  const reviewLines = {
    5:['“That’s exactly my kind of pour!”','“You’ve got the magic touch.”','“Five stars. Every last little bubble.”','“A perfectly fizzy little moment.”'],
    4:['“Lovely! Just a tiny bit off the mark.”','“Pretty close. I’ll be back!”','“A very good little soda.”'],
    3:['“Not quite my order, but not bad.”','“A little more practice and you’ll get it.”','“The soda’s good. Watch that fill line.”'],
    2:['“The level’s quite a bit off today.”','“Maybe a slower pour next time?”','“Easy on the tap, friend.”'],
    1:['“Oops. That’s not the pour I ordered.”','“Let’s give that another try next time.”','“The bubbles got the better of this one.”']
  };

  const F={cash:20,hardcore:21,attempted:22,holding:23,day:24,goal:25,streak:26,bestStreak:27,combo:28,comboBonus:29,milestone:30,perfectTip:31,serviceTip:32,lifetime:33,owned:34,cost:40,canBuy:46,spendable:47,reserve:48,staffSales:49,wages:50,helperActive:51,specialistActive:52,customers:53,basePay:54,modePay:55,signPay:56,foamScale:57,good:58,net:59,lifetimePerfect:60,bestShift:61,businessLevel:62,previousRating:63,beverageMl:64};
  const SAVE_KEY='perfect-pour-business-v101';
  const upgrades=[
    {name:'A sign with personality',icon:'✦',max:3,unit:'SIGN',description:'From hand-painted charm to a glowing neighborhood landmark.',effect:level=>`+${5*(level+1)}% customer prices in total.`,owned:level=>`Customer prices +${5*level}%.`,button:'UPGRADE SIGN'},
    {name:'A little patio',icon:'☀',max:2,unit:'PATIO',description:'Make room for more good company out front.',effect:level=>`+${2*(level+1)} customers per day in total, starting next day.`,owned:level=>`+${2*level} customers per day. Seating changes start next day.`,button:'ADD SEATING'},
    {name:'All-weather welcome',icon:'⌂',max:2,unit:'AWNING',description:'A cozy entrance makes the whole visit feel special.',effect:level=>`+${dollars(15*(level+1))} per 4- or 5-star pour in total.`,owned:level=>`${dollars(15*level)} welcome tip on every good pour.`,button:'UPGRADE AWNING'},
    {name:'A smoother tap',icon:'♧',max:2,unit:'TAP',description:'Better equipment means fewer runaway bubbles.',effect:level=>`${20*(level+1)}% less foam in total.`,owned:level=>`${20*level}% less foam. Same pouring speed.`,button:'UPGRADE TAP'},
    {name:'Counter helper',icon:'☺',max:1,unit:'TEAM',description:'A friendly face keeps customers feeling looked after.',effect:()=>'+$0.35 on 3–5 star pours. Wage $1.50/day. Starts next day.',owned:()=>'+$0.35 on 3–5 star pours · $1.50/day wage.',button:'HIRE HELPER'},
    {name:'Soda specialist',icon:'♜',max:1,unit:'TEAM',description:'A second pair of hands brings in sales of their own.',effect:()=> '2 extra sales at closing, priced by your rating. Wage $2.50/day. Starts next day.',owned:()=> '2 extra sales at closing · $2.50/day wage.',button:'HIRE SPECIALIST'}
  ];
  let engine,state,mode='welcome',returnMode='playing',storeReturn='playing',lastFrame=0,simulationClock=0,visualTime=0,lastUi=0;
  let inputOwner=null,activePointer=null,keyHeld=false,settlingSpaceHeld=false,pouring=false,ready=false,lastSpill=0,spillFlash=0,storageAvailable=true,loadedCareer=false,toastTimer;
  let settlingElapsed=0,finishElapsed=0;
  let settings={sound:true,music:true};
  try{const raw=JSON.parse(localStorage.getItem('perfect-pour-v1-settings')||'null');if(raw){if(typeof raw.sound==='boolean')settings.sound=raw.sound;if(typeof raw.music==='boolean')settings.music=raw.music;}}catch(_){}
  const overlays=['welcome','result','summary','pause','help','restart'];
  const audio={context:null,gain:null,source:null,buffer:null,pourGain:null};
  const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function announce(text){$('announcer').textContent=text;}
  function refreshState(){state=new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());}
  function randomSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch(_){return(Date.now()^(Math.random()*0xffffffff))>>>0;}}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);announce(message);}
  function setMode(next,focusId){
    mode=next;simulationClock=performance.now();
    if(next!=='settling')settlingElapsed=0;
    document.querySelector('.game-shell').inert=!['playing','store','finished'].includes(next);
    overlays.forEach(name=>$(name+'-overlay').hidden=name!==next);
    document.querySelector('.game-shell').classList.toggle('is-paused',next==='pause');
    document.body.dataset.gameMode=next;
    if(next==='store'||['playing','settling','finished','result','summary','welcome','pause'].includes(next)){
      const store=next==='store';document.body.dataset.view=store?'store':'counter';
      $('storefront-view').hidden=!store;$('playfield').hidden=store;$('counter-controls').hidden=store;
      $('counter-tab').classList.toggle('active',!store);$('store-tab').classList.toggle('active',store);
      $('counter-tab').setAttribute('aria-pressed',String(!store));$('store-tab').setAttribute('aria-pressed',String(store));
    }
    if(ready)updateHud();
    syncMusic();
    if(focusId)requestAnimationFrame(()=>$(focusId).focus({preventScroll:true}));
  }
  function captureSave(){
    const ptr=engine.save_ptr(),len=engine.save_len();
    return{format:'perfect-pour-business',version:101,engine:Array.from(new Float64Array(engine.memory.buffer,ptr,len))};
  }
  function applySave(data){
    if(!data||data.format!=='perfect-pour-business'||data.version!==101||!Array.isArray(data.engine)||data.engine.length!==engine.save_len()||!data.engine.every(Number.isFinite))throw new Error('This is not a compatible Perfect Pour V1.01 save.');
    const ptr=engine.save_ptr();new Float64Array(engine.memory.buffer,ptr,engine.save_len()).set(data.engine);
    if(engine.restore_save()!==1)throw new Error('The save data is damaged or contains invalid values.');
    refreshState();
  }
  function saveCareer(){
    if(!ready)return;
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(captureSave()));storageAvailable=true;}catch(_){storageAvailable=false;}
    $('save-status').textContent=storageAvailable?'Your business saves on this device after each customer and purchase. Export a save to take it with you.':'This browser could not save your business. Use Export save before closing the game.';
  }
  function exportSave(){
    if(!ready)return;
    const data=captureSave();data.exportedAt=new Date().toISOString();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`Perfect_Pour_Day_${Math.round(state[F.day])}_Save.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Business save exported. Keep it somewhere safe.');
  }
  async function importSave(event){
    const file=event.target.files&&event.target.files[0];event.target.value='';if(!file)return;
    try{
      if(file.size>100000)throw new Error('This file is too large to be a game save.');
      const data=JSON.parse(await file.text());
      if(!confirm('Import this business? It will replace the business currently open on this device.'))return;
      applySave(data);clearInput();saveCareer();renderOrder();storeReturn=state[0]===2?'summary':state[0]===1?'result':'playing';renderStore();setMode('store','store-back');toast('Business imported. Hardcore is selected for your next pour.');
    }catch(error){toast(error instanceof SyntaxError?'That file is not a valid JSON save.':error.message||'The save could not be imported.');}
  }
  function updateModeUi(){
    const hard=state[F.hardcore]===1,showingCup=['settling','finished'].includes(mode),locked=(state[0]===0&&state[F.attempted]===1)||showingCup;
    for(const id of ['hardcore-mode','welcome-hardcore','easy-mode','welcome-easy']){
      const button=$(id),selected=id.includes('hardcore')===hard;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));button.disabled=locked;
      button.title=locked?'Finish this customer before changing mode.':id.includes('hardcore')?'One hold. Release serves. +15% base pay.':'Top up and serve when ready.';
    }
    $('welcome-mode-copy').textContent=hard?'Hold Space or the pour button. Release once and the drink is served. Hardcore is the default.':'Hold to pour, release to stop, and top up as often as you like. Press Enter or Serve Drink when ready.';
    $('serve-button').hidden=hard||showingCup;$('auto-serve-note').hidden=!hard&&!showingCup;
    $('pour-button').hidden=showingCup;$('review-button').hidden=!showingCup;$('review-button').disabled=mode!=='finished';
    $('review-button-label').textContent=mode==='settling'?'SETTLING…':'SEE CUSTOMER REVIEW';
    $('review-button-hint').textContent=mode==='settling'?'Watch the cup':'or press Enter';
    $('pour-status-heading').textContent=mode==='settling'?'POUR COMMITTED':mode==='finished'?(state[12]===5?'✦ PERFECT POUR':Math.round(state[11])+'% ACCURACY'):'RELEASE TO SERVE';
    $('pour-status-detail').textContent=mode==='settling'?'Let the bubbles settle.':mode==='finished'?`Final ${percent(state[F.beverageMl]/state[5])}% · Target ${percent(state[4])}%`:'One hold. That’s your pour.';
    $('tip-text').innerHTML=mode==='settling'?'<strong>Watch the fizz settle.</strong><span>Your pour is committed. Let the soda find its level.</span>':mode==='finished'?'<strong>Your finished pour.</strong><span>Open the review whenever you’re ready.</span>':hard?'<strong>One pour. Make it count.</strong><span>Release commits the cup. The fizz keeps settling.</span>':'<strong>Find your fill.</strong><span>Let the foam settle, then top it up.</span>';
  }
  function changeDifficulty(hard){
    if(!ready||pouring)return;
    if(engine.set_mode(hard?1:0)!==1){toast('Finish this pour before changing the mode.');return;}
    refreshState();saveCareer();updateHud();if(mode==='store')renderStore();
    if(mode!=='welcome')toast(hard?'Hardcore: one hold, release to serve. +15% base pay.':'Easy: stop, settle, top up, then serve.');
  }
  function clearInput(){inputOwner=null;activePointer=null;pouring=false;$('pour-button').classList.remove('pressed');document.querySelector('.tap-machine').classList.remove('pouring');stopPourSound();}
  function beginInput(source){
    if(!ready||mode!=='playing'||inputOwner!==null||state[0]!==0)return false;
    advanceSimulation(performance.now());if(engine.begin_pour()!==1)return false;
    refreshState();inputOwner=source;pouring=true;$('pour-button').classList.add('pressed');document.querySelector('.tap-machine').classList.add('pouring');openAudio();startPourSound();updateHud();return true;
  }
  function releaseInput(source){
    if(inputOwner!==source)return;
    advanceSimulation(performance.now());clearInput();engine.end_pour();refreshState();
    if(state[0]===1)showCommittedPour();else updateHud();
  }
  function interruptPour(){if(inputOwner!==null)releaseInput(inputOwner);}
  function openShop(){
    if(!ready)return;openAudio();
    if(state[0]===1){showFinishedCup(false);return;}if(state[0]===2){showSummary(false);return;}
    renderOrder();setMode('playing','pour-button');saveCareer();tone(440,.13);tone(660,.15,.12);announce('Shop open. '+(state[F.hardcore]?'Hardcore. Hold Space once, then release to serve.':'Easy mode. Hold to pour, and serve when ready.'));
  }
  function openNextDay(){
    if(!ready||state[0]!==2)return;
    clearInput();engine.next_day(randomSeed());refreshState();saveCareer();renderOrder();setMode('playing','pour-button');tone(440,.13);tone(660,.15,.12);announce(`Day ${state[F.day]}. ${state[F.goal]} customers are coming to your soda bar.`);
  }
  function resetBusiness(){
    clearInput();engine.reset(randomSeed());refreshState();saveCareer();renderOrder();setMode('playing','pour-button');toast('A fresh start. Welcome to Day 1.');
  }
  function renderOrder(){
    const soda=sodas[state[2]],cup=cups[state[3]],order=Math.round(state[1]),target=percent(state[4]),person=(order-1+(state[F.day]-1)*3)%names.length;
    document.documentElement.style.setProperty('--soda',soda.color);
    $('customer-name').textContent=names[person];$('customer-number').textContent='CUSTOMER '+String(order).padStart(2,'0');
    $('order-line').innerHTML='“A '+soda.name+', please.<br><strong>Fill it to '+target+'%!</strong>”';
    $('customer-aside').textContent=soda.aside;$('customer-art').innerHTML=window.PourArt.customer(person%8,'neutral');
    $('customer-status').textContent='READY FOR A LITTLE FIZZ';
    $('tap-name').textContent=soda.name.toUpperCase();$('drink-name').textContent=soda.name;$('drink-flavor').textContent=soda.flavor;
    $('fizz-label').textContent=soda.fizz;$('fizz-note').textContent=soda.note;$('fizz-meter').setAttribute('aria-label',soda.fizz.toLowerCase()+' fizz');
    [...$('fizz-meter').children].forEach((dot,i)=>dot.classList.toggle('on',i<=state[2]));
    $('cup-name').textContent=cup.name;$('cup-capacity').textContent=Math.round(state[5])+' mL';
    $('target-percent').innerHTML=target+'<small>%</small>';$('target-track').style.left=target+'%';
    $('payout-multiplier').textContent=state[14].toFixed(2)+'×';lastSpill=state[8];spillFlash=0;updateHud();
  }
  function comboMessage(){
    const streak=Math.round(state[F.streak]);
    if(streak===0)return'Two good pours unlock a 1.10× combo.';
    if(streak<3)return`${3-streak} more good ${streak===2?'pour':'pours'} for a $1.00 milestone.`;
    if(streak<5)return`${5-streak} more good ${streak===4?'pour':'pours'} for a $2.00 milestone.`;
    if(streak<8)return`${8-streak} more good ${streak===7?'pour':'pours'} for a $4.00 milestone.`;
    return'Keep your 4- and 5-star pours coming. Your combo is at full strength.';
  }
  function updateHud(){
    if(!state)return;
    const served=Math.round(state[16]),order=Math.round(state[1]),goal=Math.round(state[F.goal]),hard=state[F.hardcore]===1;
    $('money').textContent=dollars(state[F.cash]);$('rating').textContent=state[9].toFixed(1);$('day-label').textContent='DAY '+String(state[F.day]).padStart(2,'0');
    $('customer-count').innerHTML=String(Math.min(order,goal)).padStart(2,'0')+' <small>/ '+goal+'</small>';
    $('progress-label').textContent=served+' / '+goal+' served';
    if($('progress-dots').children.length!==goal)$('progress-dots').innerHTML='<i></i>'.repeat(goal);
    [...$('progress-dots').children].forEach((dot,i)=>{dot.classList.toggle('done',i<served);dot.classList.toggle('current',i===served&&served<goal);});
    const fill=state[6]/state[5],foam=state[7]/state[5];
    $('liquid-percent').textContent=percent(fill)+'%';$('foam-percent').textContent=percent(foam)+'%';$('liquid-track').style.width=clamp(fill*100,0,100)+'%';
    $('foam-track').style.left=clamp(fill*100,0,100)+'%';$('foam-track').style.width=clamp(foam*100,0,100-clamp(fill*100,0,100))+'%';
    $('serve-button').disabled=mode!=='playing'||hard||state[6]+state[7]<.5;
    $('pour-button').disabled=mode!=='playing'||state[0]!==0||(hard&&state[F.attempted]===1&&!pouring);
    $('pause-button').disabled=mode!=='playing';
    $('game-canvas').setAttribute('aria-label',`Cup: ${percent(fill)} percent soda, ${percent(foam)} percent foam. Target ${percent(state[4])} percent. Spilled ${Math.round(state[8])} milliliters.`);
    $('combo-label').textContent=state[F.streak]>0?`${state[F.streak]} GOOD POURS · ${state[F.combo].toFixed(2)}× COMBO`:'A FRESH STREAK';$('combo-next').textContent=comboMessage();
    updateModeUi();
    let text=hard?'One hold. Release to serve. Aim a little below the line.':'Follow the dotted line. Mind the foam.',kind='';
    if(spillFlash>0||state[8]>1){text='Oops, a spill! '+Math.round(state[8])+' mL lost.';kind='warning';}
    else if(fill>state[4]+.025){text=hard?'Past the line. Release to serve.':'A little above the line. Ready to serve?';kind='warning';}
    else if(Math.abs(fill-state[4])<.025&&fill>.1){text=hard?'At the line. Foam will add more soda.':'Looking lovely. Let the last bubbles settle.';kind='ready';}
    else if(foam>.12){text=hard?'Watch the foam. Release before it reaches the rim.':'Quite a cloud of foam. Give it a moment.';}
    else if(fill>state[4]-.08){text=hard?'Getting close. A little soda is still in the foam.':'Getting close. Pause, settle, then top up.';}
    if(state[0]===1){text=mode==='settling'?'Pour committed. Watch the fizz settle.':mode==='finished'?(state[12]===5?'A perfect pour. Enjoy that little shine.':'Your finished pour. Take a moment.'):'Served. Ready for the next customer.';kind='';}
    $('live-message').textContent=text;$('live-message').className='live-message'+(kind?' '+kind:'');
  }
  function serveDrink(){
    if(!ready||mode!=='playing'||state[F.hardcore]===1||state[6]+state[7]<.5)return;
    interruptPour();engine.serve();refreshState();if(state[0]===1)showCommittedPour();
  }
  function showCommittedPour(){
    // The Rust engine has already locked and paid this pour. Keep the actual
    // cup on screen until the foam is visually settled, then wait for the player.
    saveCareer();settlingElapsed=0;finishElapsed=0;
    $('customer-status').textContent='POUR COMMITTED · FIZZ SETTLING';
    setMode('settling');announce('Pour committed. Watch the fizz settle. Your cup will stay on screen.');
  }
  function showFinishedCup(celebrate){
    finishElapsed=0;
    const perfect=state[12]===5,person=(Math.round(state[1])-1+(state[F.day]-1)*3)%names.length;
    $('customer-art').innerHTML=window.PourArt.customer(person%8,state[12]>=4?'happy':state[12]<=2?'disappointed':'neutral');
    $('customer-status').textContent=perfect?'✦ A PERFECT LITTLE POUR':'YOUR FINISHED POUR';
    setMode('finished','review-button');
    announce(`Cup settled. ${Math.round(state[11])} percent accuracy. Final fill ${percent(state[F.beverageMl]/state[5])} percent. Choose See customer review when you are ready.`);
    if(celebrate&&!document.hidden&&document.hasFocus()){
      openAudio();if(state[12]>=4){tone(523,.14);tone(659,.16,.12);tone(784,.23,.24);}else{tone(330,.18);tone(294,.22,.16);}
    }
  }
  function viewReview(){if(mode==='finished')presentResult(false);}
  function presentResult(celebrate){
    clearInput();refreshState();
    const stars=Math.round(state[12]),accuracy=Math.round(state[11]),order=Math.round(state[1]),person=(order-1+(state[F.day]-1)*3)%names.length;
    $('customer-art').innerHTML=window.PourArt.customer(person%8,stars>=4?'happy':stars<=2?'disappointed':'neutral');$('customer-status').textContent=stars>=4?'ONE HAPPY CUSTOMER':'ANOTHER CHANCE NEXT TIME';
    $('review-stars').innerHTML='★'.repeat(stars)+'<span class="empty">'+'★'.repeat(5-stars)+'</span>';$('review-stars').setAttribute('aria-label',stars+' out of 5 stars');
    $('result-title').textContent=['','A bubbly little mishap.','Room for a little practice.','A pretty decent pour.','So close to perfect.','A perfect little pour.'][stars];
    const choices=reviewLines[stars];$('review-quote').textContent=choices[(order+state[F.day]-2)%choices.length];
    $('result-eyebrow').textContent='A REVIEW JUST CAME IN';
    $('result-accuracy').innerHTML=accuracy+'<small>%</small>';$('result-earned').textContent=dollars(state[13]);
    $('result-details').textContent=`Requested ${percent(state[4])}% · Settled fill ${percent(state[F.beverageMl]/state[5])}%`+(state[8]>=.5?` · Spilled ${Math.round(state[8])} mL`:' · No spills');
    const streak=Math.round(state[F.streak]);
    $('result-combo').textContent=streak>0?(state[F.milestone]>0?`✦ ${streak}-pour milestone! +${dollars(state[F.milestone])}`:streak>=2?`${['You’re finding your rhythm.','The neighborhood is talking.','Keep that good fizz going.'][streak%3]} ${streak} good pours · ${state[F.combo].toFixed(2)}×`:'A good pour starts a good streak.'): 'A fresh streak starts with your next good pour.';
    const rows=[['Pour pay',state[F.basePay]],['Streak combo',state[F.comboBonus]],['Milestone reward',state[F.milestone]],['Perfect-pour tip',state[F.perfectTip]],['Welcome & service tips',state[F.serviceTip]]];
    $('bonus-breakdown').innerHTML=rows.filter((r,i)=>i===0||r[1]>0).map(([label,value])=>'<div class="bonus-row"><span>'+label+'</span><strong>'+dollars(value)+'</strong></div>').join('');
    $('old-rating').textContent=state[F.previousRating].toFixed(1);$('new-rating').textContent=state[9].toFixed(1);
    const nextPrice=(.6+state[9]*.2).toFixed(2);
    $('next-price-note').textContent=order===state[F.goal]?'Last customer served. Close the day to pay wages and count your profits.':`Your next customer’s reputation multiplier: ${nextPrice}×. Good word travels.`;
    $('next-button').textContent=order===state[F.goal]?'CLOSE THE DAY':'NEXT CUSTOMER';saveCareer();setMode('result','next-button');
    if(celebrate){openAudio();if(stars>=4){tone(523,.14);tone(659,.16,.12);tone(784,.23,.24);}else{tone(330,.18);tone(294,.22,.16);}if(stars===5)confetti();}
    announce(`${stars} stars. ${accuracy} percent accuracy. Earned ${dollars(state[13])}. ${streak} good pours in a row.`);
  }
  function nextOrder(){
    if(mode!=='result')return;clearInput();engine.next_order();refreshState();saveCareer();
    if(state[0]===2){showSummary(true);return;}
    renderOrder();setMode('playing','pour-button');tone(523,.08);announce(`${sodas[state[2]].name}, filled to ${percent(state[4])} percent. ${sodas[state[2]].fizz} fizz.`);
  }
  function showSummary(celebrate){
    const rating=state[9],goal=state[F.goal];
    $('summary-money').textContent=dollars(state[10]-state[F.staffSales]);$('summary-rating').textContent=rating.toFixed(1)+' ★';$('summary-accuracy').textContent=Math.round(state[17])+'%';$('summary-perfect').textContent=state[18]+' / '+goal;
    $('summary-title').textContent=rating>=4.5?'The talk of the block.':rating>=3?'One sweet shift.':'Practice makes the pour.';
    $('summary-message').textContent=`Day ${state[F.day]} is in the books. ${goal} customers served. Your business keeps growing.`;
    $('shift-ledger').innerHTML=[['Employee sales',state[F.staffSales]],['Wages paid',-state[F.wages]],['Sales after wages',state[F.net]],['Cash in your business',state[F.cash]]].map(([label,value])=>'<div class="bonus-row"><span>'+label+'</span><strong>'+(value<0?'−'+dollars(-value):dollars(value))+'</strong></div>').join('');
    $('personal-best').textContent=`Best shift: ${dollars(state[F.bestShift])} · Best streak: ${state[F.bestStreak]} good pours`;
    $('again-button').textContent='OPEN DAY '+(state[F.day]+1);saveCareer();setMode('summary','summary-store');
    if(celebrate){if(rating>=4)confetti();tone(523,.2);tone(659,.2,.18);tone(784,.4,.36);}announce(`Day complete. Profit ${dollars(state[F.net])}. Business cash ${dollars(state[F.cash])}.`);
  }
  function renderStore(){
    refreshState();const levels=Array.from(state.slice(F.owned,F.owned+6)).map(Math.round);
    $('store-art').innerHTML=window.PourStoreArt.render({sign:levels[0],seating:levels[1],awning:levels[2],tap:levels[3],helper:levels[4],specialist:levels[5],rating:state[9],day:state[F.day]});
    $('store-art').setAttribute('aria-label',`Your soda bar: sign level ${levels[0]}, ${levels[1]} patio upgrades, awning level ${levels[2]}, tap level ${levels[3]}, ${levels[4]+levels[5]} employees.`);
    $('store-spendable').textContent=dollars(state[F.spendable]);$('store-reserve').textContent=dollars(state[F.reserve]);$('store-lifetime').textContent=dollars(state[F.lifetime]);
    $('store-description').textContent=`Day ${state[F.day]} · ${state[9].toFixed(1)}-star neighborhood reputation · ${state[F.customers]} customers served. A little shop with a big future.`;
    $('store-rule').textContent=state[F.canBuy]!==1?'Finish the current cup before buying upgrades. Your pour is paused while you look around.':state[F.reserve]>0?`${dollars(state[F.reserve])} is set aside for today’s staff wages. Seating and new hires start next day; other upgrades apply to the next untouched order.`:'Buy between pours. Seating and new hires start next day; other upgrades apply to the next untouched order.';
    $('upgrade-grid').innerHTML=upgrades.map((item,i)=>{
      const level=levels[i],maxed=level>=item.max,cost=state[F.cost+i],affordable=state[F.spendable]>=cost,canBuy=state[F.canBuy]===1&&!maxed&&affordable;
      let status=maxed?(i>=4?(state[i===4?F.helperActive:F.specialistActive]?'On duty this day':'Joins next day'):'Fully upgraded'):!affordable?`${dollars(Math.max(0,cost-state[F.spendable]))} more to go`:state[F.canBuy]!==1?'Finish this cup first':'Ready when you are';
      return `<article class="upgrade-card${maxed?' maxed':''}"><div class="upgrade-icon" aria-hidden="true">${item.icon}</div><div class="upgrade-copy"><span class="upgrade-level">${item.unit} · ${i<4?'LEVEL '+level+' / '+item.max:level?'HIRED':'OPEN POSITION'}</span><h3>${item.name}</h3><p>${item.description}</p><div class="upgrade-effect">${maxed?item.owned(level):item.effect(level)}</div></div><button class="buy-button" data-item="${i}" ${canBuy?'':'disabled'} aria-label="${maxed?item.name+' fully owned':item.button+' for '+dollars(cost)}">${maxed?(i>=4?'ON THE TEAM':'LOOKING GOOD'):`${item.button} <strong>${dollars(cost)}</strong>`}</button><span class="upgrade-status">${status}</span></article>`;
    }).join('');
    $('store-back').textContent=state[0]===2?'OPEN DAY '+(state[F.day]+1):state[0]===1?'BACK TO THE REVIEW':'BACK TO THE COUNTER';
    updateHud();
  }
  function enterStore(){
    if(!ready||mode==='welcome')return;
    interruptPour();storeReturn=state[0]===2?'summary':state[0]===1?'result':'playing';renderStore();setMode('store','store-back');
  }
  function leaveStore(){
    if(mode!=='store')return;
    if(state[0]===2){openNextDay();return;}if(state[0]===1){presentResult(false);return;}
    renderOrder();setMode('playing','pour-button');
  }
  function buyUpgrade(index){
    if(mode!=='store'||!Number.isInteger(index)||index<0||index>5)return;
    if(engine.buy(index)!==1){toast('That upgrade is not available yet.');return;}
    refreshState();saveCareer();renderStore();tone(523,.1);tone(784,.18,.12);toast(index>=4?`${upgrades[index].name} hired. Their first day is tomorrow.`:index===1?'Patio seating added. More customers arrive next day.':`${upgrades[index].name} upgraded!`);
    const replacement=$('upgrade-grid').querySelector(`[data-item="${index}"]`);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});else $('store-back').focus({preventScroll:true});
  }
  function pause(){
    if(mode==='store')return;
    if(mode!=='playing')return;interruptPour();if(mode!=='playing')return;setMode('pause','resume-button');announce('Game paused.');
  }
  function resume(){if(mode==='pause'){openAudio();setMode('playing','pour-button');}}
  function showHelp(){
    if(!ready||!['playing','pause','store','welcome','finished'].includes(mode))return;
    interruptPour();if(mode==='result'||mode==='settling')return;returnMode=mode;setMode('help','close-help');
  }
  function closeHelp(){if(mode==='help')setMode(returnMode,returnMode==='welcome'?'start-button':returnMode==='pause'?'resume-button':returnMode==='store'?'store-back':returnMode==='finished'?'review-button':'pour-button');}
  function requestRestart(){if(mode!=='store')return;returnMode='store';setMode('restart','cancel-restart');}
  function cancelRestart(){if(mode==='restart')setMode(returnMode,'store-back');}
  function openAudio(){
    if(!settings.sound&&!settings.music) return;
    try {
      if(!audio.context){
        const Ctx=window.AudioContext||window.webkitAudioContext;
        if(!Ctx) return;
        audio.context=new Ctx(); audio.gain=audio.context.createGain(); audio.gain.gain.value=.25; audio.gain.connect(audio.context.destination);
        audio.buffer=audio.context.createBuffer(1,audio.context.sampleRate*2,audio.context.sampleRate);
        const data=audio.buffer.getChannelData(0);let previous=0;
        for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.16-.08)/1.06;data[i]=previous*2;}
      }
      if(audio.context.state==='suspended') audio.context.resume().then(syncMusic).catch(()=>{});
      else syncMusic();
    } catch(_) {}
  }
  function tone(frequency,duration=.12,delay=0,volume=.16){
    if(!settings.sound || !audio.context) return;
    try {const t=audio.context.currentTime+delay,osc=audio.context.createOscillator(),gain=audio.context.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(audio.gain);osc.start(t);osc.stop(t+duration+.02);} catch(_){}
  }
  function startPourSound(){
    if(!settings.sound || !audio.context || audio.source) return;
    try {const src=audio.context.createBufferSource(),filter=audio.context.createBiquadFilter(),gain=audio.context.createGain();src.buffer=audio.buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=1400;gain.gain.value=.45;src.connect(filter);filter.connect(gain);gain.connect(audio.gain);src.start();audio.source=src;audio.pourGain=gain;}catch(_){}
  }
  function stopPourSound(){if(audio.source){try{audio.source.stop();}catch(_){}audio.source=null;}}
  function soundToggle(){
    settings.sound=!settings.sound;
    try{localStorage.setItem('perfect-pour-v1-settings',JSON.stringify(settings));}catch(_){}
    updateSoundButton();
    if(settings.sound){openAudio();tone(660,.1);if(pouring)startPourSound();}else stopPourSound();
  }
  function updateSoundButton(){const b=$('sound-button');b.classList.toggle('muted',!settings.sound);b.setAttribute('aria-label',settings.sound?'Turn sound effects off':'Turn sound effects on');b.setAttribute('aria-pressed',String(settings.sound));b.title=settings.sound?'Sound effects on':'Sound effects off';}
  function syncMusic(){
    if(!window.PourMusic)return;
    const allowed=settings.music&&audio.context&&!document.hidden&&document.hasFocus()&&['playing','settling','finished','result','summary','store'].includes(mode);
    if(allowed)window.PourMusic.start(audio.context);else window.PourMusic.stop();
  }
  function musicToggle(){
    settings.music=!settings.music;
    try{localStorage.setItem('perfect-pour-v1-settings',JSON.stringify(settings));}catch(_){}
    updateMusicButton();if(settings.music)openAudio();syncMusic();
  }
  function updateMusicButton(){const b=$('music-button');b.classList.toggle('muted',!settings.music);b.setAttribute('aria-label',settings.music?'Turn music off':'Turn music on');b.setAttribute('aria-pressed',String(settings.music));b.title=settings.music?'Music on':'Music off';}
  function confetti(){
    if(reducedMotion)return;
    for(let i=0;i<25;i++){const el=document.createElement('i');el.className='confetti';el.style.left=(18+Math.random()*64)+'%';el.style.background=['#ffcc6c','#e58f78','#a9d8c9','#fff8e8'][i%4];el.style.setProperty('--drift',(Math.random()*180-90)+'px');el.style.animationDelay=(Math.random()*.25)+'s';el.style.transform=`rotate(${i*37}deg)`;document.body.appendChild(el);setTimeout(()=>el.remove(),2300);}
  }

  // The drawn fill line uses the same volume-to-height lookup as the soda.
  // This makes wide, tall, and curved cups honest even when their size is deceptive.
  let cachedCup=-1,geometry=null;
  function cupGeometry(index){
    if(cachedCup===index)return geometry;
    const cup=cups[index],bottom=393,top=bottom-cup.height,n=240,volume=[0];let sum=0;
    const width=y=>cup.bottom+(cup.top-cup.bottom)*y+cup.curve*Math.sin(Math.PI*y);
    for(let i=1;i<=n;i++){const w=width((i-.5)/n);sum+=w*w;volume.push(sum);}
    for(let i=1;i<=n;i++)volume[i]/=sum;
    const level=f=>{f=clamp(f,0,1);if(f===0)return bottom;if(f===1)return top;let lo=0,hi=n;while(hi-lo>1){const m=(lo+hi)>>1;if(volume[m]<f)lo=m;else hi=m;}const a=(f-volume[lo])/(volume[hi]-volume[lo]);return bottom-(lo+a)/n*cup.height;};
    geometry={cup,bottom,top,width,level};cachedCup=index;return geometry;
  }
  function cupPath(g){
    const x=260;ctx.beginPath();ctx.moveTo(x-g.width(1)/2,g.top);
    for(let i=19;i>=0;i--){const v=i/20;ctx.lineTo(x-g.width(v)/2,g.bottom-v*g.cup.height);}
    ctx.quadraticCurveTo(x,g.bottom+9,x+g.width(0)/2,g.bottom);
    for(let i=1;i<=20;i++){const v=i/20;ctx.lineTo(x+g.width(v)/2,g.bottom-v*g.cup.height);}
    ctx.closePath();
  }
  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function draw(){
    if(!ctx)return;
    const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),pixelW=Math.round(r.width*dpr),pixelH=Math.round(r.height*dpr);
    if(canvas.width!==pixelW||canvas.height!==pixelH){canvas.width=pixelW;canvas.height=pixelH;}
    ctx.setTransform(pixelW/520,0,0,pixelH/440,0,0);ctx.clearRect(0,0,520,440);
    const s=state||[0,1,0,0,.65,280,0,0,0],soda=sodas[s[2]],g=cupGeometry(s[3]),t=visualTime;
    const fill=clamp(s[6]/s[5],0,1),foam=clamp(s[7]/s[5],0,1),liquidY=g.level(fill),foamY=g.level(fill+foam),targetY=g.level(s[4]);
    // Counter shadow and the little paper coaster.
    ctx.fillStyle='#174b491b';ctx.beginPath();ctx.ellipse(260,405,g.cup.top*.7,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f6e7c8';ctx.strokeStyle='#174b4955';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(260,400,g.cup.top*.62,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(s[8]>.2){ctx.save();ctx.globalAlpha=.38;ctx.fillStyle=soda.color;ctx.beginPath();ctx.ellipse(260,402,Math.min(118,35+s[8]*.45),6+Math.min(4,s[8]*.03),0,0,Math.PI*2);ctx.fill();ctx.restore();}
    cupPath(g);ctx.fillStyle='#fffdf44d';ctx.fill();ctx.save();ctx.clip();
    // Liquid, a very small animated meniscus, and rising bubbles.
    if(fill>0){
      const gradient=ctx.createLinearGradient(0,liquidY,0,g.bottom);gradient.addColorStop(0,soda.light);gradient.addColorStop(.14,soda.color);gradient.addColorStop(1,soda.color);ctx.fillStyle=gradient;
      ctx.beginPath();ctx.moveTo(130,g.bottom+12);ctx.lineTo(130,liquidY);for(let x=130;x<=390;x+=5)ctx.lineTo(x,liquidY+Math.sin(x*.045+t*3)*(pouring?1.8:.55));ctx.lineTo(390,g.bottom+12);ctx.closePath();ctx.fill();
      ctx.save();ctx.beginPath();ctx.rect(120,liquidY+4,280,g.bottom-liquidY);ctx.clip();
      for(let i=0;i<22;i++){const lane=((i*67)%100)/100,x=260+(lane-.5)*g.cup.top*.75,range=Math.max(1,g.bottom-liquidY),yy=g.bottom-((i*33+t*(15+s[2]*5))%range),rad=1.3+(i%3)*.55;ctx.beginPath();ctx.arc(x,yy,rad,0,Math.PI*2);ctx.fillStyle='#fff8d968';ctx.fill();}
      ctx.restore();
    }
    if(foam>VISIBLE_FOAM){
      ctx.fillStyle='#fff8e6';ctx.beginPath();ctx.moveTo(120,liquidY+2);ctx.lineTo(120,foamY);for(let x=120;x<=400;x+=4)ctx.lineTo(x,foamY+Math.sin(x*.15+t*.65)*1.8);ctx.lineTo(400,liquidY+3);ctx.closePath();ctx.fill();
      ctx.save();ctx.beginPath();ctx.rect(120,foamY+1,280,liquidY-foamY-1);ctx.clip();
      for(let i=0;i<38;i++){const x=168+(i*37%187),y=foamY+3+(i*19%Math.max(3,Math.floor(liquidY-foamY))),rad=1.3+(i%4)*.8;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.strokeStyle='#e3cba363';ctx.lineWidth=.8;ctx.stroke();}ctx.restore();
    }
    // Glass highlights remain visible above and below the liquid.
    ctx.strokeStyle='#ffffff64';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(260-g.width(.86)/2+10,g.bottom-g.cup.height*.86);ctx.lineTo(260-g.width(.18)/2+10,g.bottom-g.cup.height*.18);ctx.stroke();
    ctx.strokeStyle='#ffffff39';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(260+g.width(.88)/2-9,g.bottom-g.cup.height*.88);ctx.lineTo(260+g.width(.16)/2-9,g.bottom-g.cup.height*.16);ctx.stroke();
    // A small shop stamp, printed on every cup.
    const badgeY=g.bottom-52;ctx.fillStyle='#fff5dcbb';ctx.strokeStyle='#174b4970';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(260,badgeY,22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#174b49';ctx.font='bold 16px Trebuchet MS';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('pp.',260,badgeY-2);ctx.font='7px Trebuchet MS';ctx.fillText('GOOD FIZZ',260,badgeY+11);
    ctx.restore();
    // Cup outline and rolled rim.
    cupPath(g);ctx.strokeStyle='#174b49';ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.ellipse(260,g.top,g.cup.top/2,5,0,0,Math.PI*2);ctx.strokeStyle='#174b49';ctx.lineWidth=2.3;ctx.stroke();
    // Dashed requested level, mapped from volume (not a naïve cup-height percent).
    ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='#174b49c4';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(260-g.cup.top/2-24,targetY);ctx.lineTo(260+g.cup.top/2+27,targetY);ctx.stroke();ctx.restore();
    const tagX=260+g.cup.top/2+29;roundedRect(tagX,targetY-17,61,34,9);ctx.fillStyle='#fffaf0';ctx.fill();ctx.strokeStyle='#174b49';ctx.lineWidth=1.5;ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#174b49';ctx.font='bold 17px Trebuchet MS';ctx.fillText(percent(s[4])+'%',tagX+30.5,targetY+.5);
    ctx.font='9px Trebuchet MS';ctx.fillStyle='#3b6b61';ctx.fillText('FILL LINE',tagX+30,targetY+28);
    // The stream falls to the visible surface, with small fizzy flecks.
    if(pouring&&mode==='playing'){
      const surface=fill+foam>0?foamY:g.bottom-5;ctx.beginPath();ctx.moveTo(254,25);for(let y=25;y<=surface;y+=9)ctx.lineTo(254+Math.sin(y*.1+t*22)*1.4,y);ctx.lineTo(266,surface);for(let y=surface;y>=25;y-=9)ctx.lineTo(266+Math.sin(y*.09+t*24)*1.4,y);ctx.closePath();ctx.fillStyle=soda.color;ctx.globalAlpha=.85;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=soda.light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(258,29);ctx.lineTo(258,surface-2);ctx.stroke();
      for(let i=0;i<7;i++){const q=(t*2+i*.147)%1,x=260+Math.sin(i*7.3)*q*22,y=surface-Math.sin(q*Math.PI)*14;ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fillStyle=soda.light;ctx.fill();}
    }
    if(spillFlash>0){for(let i=0;i<5;i++){const side=i%2?-1:1,x=260+side*(g.cup.top/2+5+i%2*3),y=g.top+((t*130+i*43)%(g.cup.height+5));ctx.strokeStyle=i%2?'#fff5df':soda.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*4,y+13);ctx.stroke();}}
    if(mode==='finished'&&s[12]===5&&window.PourFinish)window.PourFinish.draw(ctx,{top:g.top,bottom:g.bottom,widthAt:g.width,centerX:260,time:finishElapsed,reducedMotion});
  }

  // Flush elapsed time on input transitions as well as frames. The Rust engine
  // owns whether a pour is active, whether an attempt is spent, and its payout.
  function advanceSimulation(now){
    const elapsed=simulationClock?clamp((now-simulationClock)/1000,0,3):0;simulationClock=now;
    if(ready&&((mode==='playing'&&state[0]===0)||(['settling','finished','result'].includes(mode)&&state[0]===1))){
      let remaining=elapsed;while(remaining>.000001){const step=Math.min(remaining,.1);engine.step(step,0);remaining-=step;}refreshState();
      if(state[8]>lastSpill+.03){spillFlash=1.2;if(lastSpill<.1){document.querySelector('.pour-area').classList.add('spilling');setTimeout(()=>document.querySelector('.pour-area').classList.remove('spilling'),350);tone(180,.15);}}
      lastSpill=state[8];spillFlash=Math.max(0,spillFlash-elapsed);
    }
  }
  function frame(now){
    const dt=lastFrame?clamp((now-lastFrame)/1000,0,.25):0;lastFrame=now;advanceSimulation(now);
    if(mode==='settling'){settlingElapsed+=dt;if(settlingElapsed>=.8&&state[7]/state[5]<=VISIBLE_FOAM)showFinishedCup(true);}
    if(mode==='finished')finishElapsed+=dt;
    if(['playing','settling','finished','result'].includes(mode)&&!reducedMotion)visualTime+=dt;if(now-lastUi>80){updateHud();lastUi=now;}
    if(mode!=='store')draw();requestAnimationFrame(frame);
  }
  $('pour-button').addEventListener('pointerdown',event=>{
    if(event.button!==0||event.isPrimary===false)return;event.preventDefault();
    if(beginInput('pointer')){activePointer=event.pointerId;try{event.currentTarget.setPointerCapture(event.pointerId);}catch(_){}}
  });
  const releasePointer=event=>{if(inputOwner==='pointer'&&(activePointer===null||event.pointerId===activePointer))releaseInput('pointer');};
  window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);$('pour-button').addEventListener('lostpointercapture',releasePointer);
  $('pour-button').addEventListener('contextmenu',event=>event.preventDefault());
  $('serve-button').addEventListener('click',serveDrink);$('review-button').addEventListener('click',viewReview);$('start-button').addEventListener('click',openShop);$('next-button').addEventListener('click',nextOrder);$('again-button').addEventListener('click',openNextDay);
  $('sound-button').addEventListener('click',soundToggle);$('music-button').addEventListener('click',musicToggle);$('pause-button').addEventListener('click',pause);$('resume-button').addEventListener('click',resume);$('help-button').addEventListener('click',showHelp);$('close-help').addEventListener('click',closeHelp);
  for(const id of ['store-tab','restart-button','pause-restart','result-store','summary-store'])$(id).addEventListener('click',enterStore);
  $('store-back').addEventListener('click',leaveStore);$('counter-tab').addEventListener('click',()=>{if(mode==='store')leaveStore();});
  $('brand-home').addEventListener('click',event=>{event.preventDefault();enterStore();});
  for(const id of ['hardcore-mode','welcome-hardcore'])$(id).addEventListener('click',()=>changeDifficulty(true));
  for(const id of ['easy-mode','welcome-easy'])$(id).addEventListener('click',()=>changeDifficulty(false));
  $('upgrade-grid').addEventListener('click',event=>{const button=event.target.closest('button[data-item]');if(button&&!button.disabled)buyUpgrade(Number(button.dataset.item));});
  $('export-save').addEventListener('click',exportSave);$('import-save').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',importSave);
  $('reset-business').addEventListener('click',requestRestart);$('confirm-restart').addEventListener('click',resetBusiness);$('cancel-restart').addEventListener('click',cancelRestart);
  const leaveWindow=()=>{interruptPour();keyHeld=false;settlingSpaceHeld=false;if(mode==='playing')pause();if(window.PourMusic)window.PourMusic.stop();};window.addEventListener('blur',leaveWindow);window.addEventListener('focus',syncMusic);document.addEventListener('visibilitychange',()=>{if(document.hidden)leaveWindow();else syncMusic();});
  function nativeActivation(target){const control=target instanceof Element?target.closest('button,a,input,textarea,select,[contenteditable="true"]'):null;return control&&control.id!=='pour-button';}
  document.addEventListener('keydown',event=>{
    // Consume a Space press begun during handoff through its eventual keyup,
    // even if the finished cup focuses its review button while the key is held.
    if(event.code==='Space'&&(mode==='settling'||settlingSpaceHeld)){event.preventDefault();settlingSpaceHeld=true;return;}
    if(event.code==='Tab'&&!['playing','store','finished'].includes(mode)){
      const panel=document.querySelector('.overlay:not([hidden])');if(panel){const items=[...panel.querySelectorAll('button:not(:disabled),a[href]')].filter(el=>!el.hidden);if(items.length){const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
    }
    if((event.code==='Space'||event.code==='Enter')&&nativeActivation(event.target))return;
    if(event.code==='Space'){if(mode==='playing'){event.preventDefault();if(!event.repeat&&!keyHeld){keyHeld=true;beginInput('key');}}return;}
    if(event.repeat)return;
    if(event.code==='Enter'&&mode==='finished'){event.preventDefault();viewReview();return;}
    if(event.code==='Enter'&&mode==='playing'){event.preventDefault();serveDrink();}
    if(event.code==='KeyP'||event.code==='Escape'){
      if(mode==='playing'){event.preventDefault();pause();}else if(mode==='pause'){event.preventDefault();resume();}else if(mode==='help'){event.preventDefault();closeHelp();}else if(mode==='restart'){event.preventDefault();cancelRestart();}else if(mode==='store'&&event.code==='Escape'){event.preventDefault();leaveStore();}
    }
  });
  document.addEventListener('keyup',event=>{if(event.code==='Space'){if(keyHeld||settlingSpaceHeld)event.preventDefault();const consumed=settlingSpaceHeld;keyHeld=false;settlingSpaceHeld=false;if(!consumed)releaseInput('key');}});
  updateSoundButton();updateMusicButton();document.querySelector('.game-shell').inert=true;$('start-button').disabled=true;$('start-button').textContent='WARMING UP THE FIZZ…';requestAnimationFrame(frame);
  (async()=>{
    try{
      const bytes=Uint8Array.from(atob(WASM_BASE64),ch=>ch.charCodeAt(0));const result=await WebAssembly.instantiate(bytes,{});engine=result.instance.exports;engine.reset(randomSeed());refreshState();ready=true;
      try{const saved=localStorage.getItem(SAVE_KEY);if(saved){applySave(JSON.parse(saved));loadedCareer=true;}}catch(_){toast('Your previous save could not be loaded. A fresh shop is ready; you can import a backup.');}
      renderOrder();updateHud();$('start-button').disabled=false;$('start-button').textContent=loadedCareer?'BACK TO MY BUSINESS':'OPEN THE SHOP';
      if(loadedCareer)$('welcome-description').textContent=`Welcome back. Day ${state[F.day]}, ${dollars(state[F.cash])} in the business, and a ${state[9].toFixed(1)}-star reputation. Your shop is right where you left it.`;
      $('start-button').focus({preventScroll:true});
    }catch(error){console.error('Perfect Pour could not start:',error);$('boot-error').hidden=false;$('boot-error').textContent='The game couldn’t start. Open this HTML file in a recent version of Chrome, Edge, Firefox, or Safari with JavaScript enabled.';$('start-button').textContent='UNABLE TO OPEN';}
  })();
})();
