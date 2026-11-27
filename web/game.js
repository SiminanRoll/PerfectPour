/* Perfect Pour V1.03 · Presentation and input. Simulation, business, saves, and rules are Rust/Wasm. */
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

  const F={cash:20,hardcore:21,attempted:22,holding:23,day:24,goal:25,streak:26,bestStreak:27,combo:28,comboBonus:29,milestone:30,perfectTip:31,serviceTip:32,lifetime:33,owned:34,cost:40,canBuy:46,spendable:47,reserve:48,staffSales:49,wages:50,helperActive:51,specialistActive:52,customers:53,basePay:54,modePay:55,signPay:56,foamScale:57,good:58,net:59,lifetimePerfect:60,bestShift:61,businessLevel:62,previousRating:63,beverageMl:64,pressure:65,waste:66,cleanupSeconds:67,patience:68,patienceLimit:69,menuPrice:70,ingredientCost:71,cleanupCost:72,refund:73,lastNet:74,ingredientTotal:75,cleanupTotal:76,refundTotal:77,signTotal:78,serviceTotal:79,staffOrders:80,staffCapacity:81,demand:82,missed:83,interior:84,catering:85,interiorCost:86,cateringCost:87,nextStreak:88,nextReward:89,hardcoreBest:90,easyBest:91,cleanupSaved:92,training:93,trainingCost:94,tier:95,canPressure:96,speedTip:97,orderedCherries:98,orderedLime:99,orderedSyrup:100,orderedBlend:101,selectedSoda:102,selectedCherries:103,selectedLime:104,selectedSyrup:105,selectedBlend:106,recipeAccuracy:107,recipeLocked:108,canRecipe:109,hasCitrus:110,hasSyrup:111,hasMixer:112,citrusCost:113,syrupCost:114,mixerCost:115,recipePremium:116,selectedAddinCost:117,prepStarted:118,recipeFizz:119,fillStars:120,recipeMistakes:121,prepAllowance:122,orderIsCustom:123};
  const SAVE_KEY='perfect-pour-business-v103',LEGACY_SAVE_KEYS=['perfect-pour-business-v102','perfect-pour-business-v101'];
  const upgrades=[
    {name:'Neon identity',max:3,unit:'SIGN',description:'Better prices. More visitors.',effect:l=>`Prices +${l*8}% → +${(l+1)*8}%`,owned:l=>`+${l*8}% prices · +${l*2} daily demand`},
    {name:'Patio seats',max:2,unit:'PATIO',description:'Room for your specialist’s queue.',effect:l=>`Staff capacity +${l*2} → +${(l+1)*2}`,owned:l=>`+${l*2} capacity · +${l*3} demand · +${l}s patience`},
    {name:'Cozy awning',max:2,unit:'AWNING',description:'Patient guests. Welcome tips.',effect:l=>`Patience +${l*2}s → +${(l+1)*2}s`,owned:l=>`+${l*2}s patience · +${dollars(l*10)} good-pour tip`},
    {name:'Precision tap',max:2,unit:'EQUIPMENT',description:'Less foam gas. Cleaner pours.',effect:l=>`Gas reduction ${l*20}% → ${(l+1)*20}%`,owned:l=>`${l*20}% less gas · ${l*15}% less cleanup cost`},
    {name:'Counter helper',max:1,unit:'TEAM',description:'Half the cleanup. Happier guests.',effect:()=>'+$0.30 service tip · $1.50/day',owned:()=> '½ cleanup · +$0.30 tip · $1.50/day'},
    {name:'Soda specialist',max:1,unit:'TEAM',description:'A second station earns with you.',effect:()=> 'Serves the side queue · $2.50/day',owned:()=> 'Your own second station · $2.50/day'},
    {name:'Soda lounge',max:3,unit:'EXPANSION',description:'Grow from a bar to a destination.',effect:l=>`Staff capacity +${l*4} → +${(l+1)*4}`,owned:l=>`+${l*4} staff capacity & daily demand`},
    {name:'Catering cart',max:3,unit:'CATERING',description:'Bigger orders beyond the counter.',effect:l=>`Staff prices +${l*12}% → +${(l+1)*12}%`,owned:l=>`+${l*12}% staff prices · +${l*8} demand`},
    {name:'Team training',max:3,unit:'TRAINING',description:'A quicker, more capable team.',effect:l=>`Staff capacity +${l*2} → +${(l+1)*2}`,owned:l=>`+${l*2} capacity · +${l*6}% staff prices`},
    {name:'Citrus tray',max:1,unit:'RECIPES',description:'A little lime. A fresh request.',effect:()=> 'Unlock lime garnish orders',owned:()=> 'Lime wedges available'},
    {name:'Cherry syrup rack',max:1,unit:'RECIPES',description:'Give your sodas a cherry swirl.',effect:()=> 'Unlock syrup pump orders',owned:()=> 'Cherry syrup available'},
    {name:'Mixing dispenser',max:1,unit:'RECIPES',description:'Light, regular, or boldly yours.',effect:()=> 'Unlock soda-water blend orders',owned:()=> 'Three recipe blends available'}
  ];
  const pressureNames=['Gentle','Classic','Rush'];
  const pressureNotes=['Steady flow · more time to aim','Balanced flow · lively foam','Fast flow · bigger foam risk'];
  const text=(id,value)=>{const el=$(id);if(el&&el.textContent!==String(value))el.textContent=value;};
  const signedMoney=value=>(value<0?'−':'')+dollars(Math.abs(value));
  const scoreText=(value,stars)=>{const next=[0,50,72,88,96][stars];return(Math.floor(Math.min(value,next===undefined?100:next-.01)*10)/10).toFixed(1);};
  const levelValues=()=>[...Array.from(state.slice(F.owned,F.owned+6)),state[F.interior],state[F.catering],state[F.training],state[F.hasCitrus],state[F.hasSyrup],state[F.hasMixer]].map(Math.round);
  const costValues=()=>[...Array.from(state.slice(F.cost,F.cost+6)),state[F.interiorCost],state[F.cateringCost],state[F.trainingCost],state[F.citrusCost],state[F.syrupCost],state[F.mixerCost]];
  let engine,state,mode='welcome',returnMode='playing',storeReturn='playing',pauseReturn='preparing',lastFrame=0,simulationClock=0,visualTime=0,lastUi=0;
  let inputOwner=null,activePointer=null,keyHeld=false,settlingSpaceHeld=false,pouring=false,ready=false,lastSpill=0,spillFlash=0,storageAvailable=true,loadedCareer=false,toastTimer;
  let settlingElapsed=0,finishElapsed=0,lastAutosave=0,sceneDirty=true,lastFeedback='',lastSceneKey='',lastSavedRaw=null,externalSave=false;
  let pendingPointer=null,suppressPrimaryClick=false,recipeUiKey='',iconDownloading=false;
  const blendNames=['Light','Regular','Bold'];
  const activePlayMode=()=>state[F.attempted]===1?'playing':'preparing';
  let settings={sound:true,music:true,musicVolume:1,soundVolume:1};
  try{const raw=JSON.parse(localStorage.getItem('perfect-pour-v1-settings')||'null');if(raw){for(const key of ['sound','music'])if(typeof raw[key]==='boolean')settings[key]=raw[key];for(const key of ['musicVolume','soundVolume'])if(Number.isFinite(raw[key]))settings[key]=clamp(raw[key],0,1);}}catch(_){}
  const overlays=['welcome','result','summary','pause','help','restart'];
  const audio={context:null};
  const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function announce(text){$('announcer').textContent=text;}
  function refreshState(){state=new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());}
  function randomSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch(_){return(Date.now()^(Math.random()*0xffffffff))>>>0;}}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);announce(message);}
  function setMode(next,focusId){
    if(next!==mode)cancelPendingPointer();
    mode=next;simulationClock=performance.now();sceneDirty=true;
    if(next!=='settling')settlingElapsed=0;
    document.querySelector('.game-shell').inert=overlays.includes(next);
    overlays.forEach(name=>$(name+'-overlay').hidden=name!==next);
    document.querySelector('.game-shell').classList.toggle('is-paused',next==='pause');
    document.body.dataset.gameMode=next;
    if(next==='store'||['preparing','playing','settling','finished','result','summary','welcome','pause'].includes(next)){
      const store=next==='store';document.body.dataset.view=store?'store':'counter';
      $('storefront-view').hidden=!store;$('playfield').hidden=store;$('counter-controls').hidden=store;
      $('counter-tab').classList.toggle('active',!store);$('store-tab').classList.toggle('active',store);
      $('counter-tab').setAttribute('aria-pressed',String(!store));$('store-tab').setAttribute('aria-pressed',String(store));
    }
    const primaryHost=$(next==='result'?'result-action-slot':next==='summary'?'summary-action-slot':'counter-action-slot');
    if($('pour-button').parentElement!==primaryHost)primaryHost.prepend($('pour-button'));
    if(ready)updateHud();
    syncMusic();
    if(focusId)requestAnimationFrame(()=>$(focusId).focus({preventScroll:true}));
  }
  function captureSave(){
    const ptr=engine.save_ptr(),len=engine.save_len();
    return{format:'perfect-pour-business',version:103,engine:Array.from(new Float64Array(engine.memory.buffer,ptr,len))};
  }
  function applySave(data){
    const expected=data?.version===101?80:[102,103].includes(data?.version)?120:0;
    if(!data||data.format!=='perfect-pour-business'||!expected||!Array.isArray(data.engine)||data.engine.length!==expected||data.engine[0]!==data.version||!data.engine.every(Number.isFinite))throw new Error('Choose a Perfect Pour V1.01, V1.02, or V1.03 business save.');
    const ptr=engine.save_ptr(),buffer=new Float64Array(engine.memory.buffer,ptr,engine.save_len());buffer.fill(0);buffer.set(data.engine);
    if(engine.restore_save()!==1)throw new Error('The save data is damaged or contains invalid values.');
    refreshState();
  }
  function saveCareer(){
    if(!ready||externalSave)return;
    try{
      const current=localStorage.getItem(SAVE_KEY);
      if(current!==lastSavedRaw){handleExternalSave();return;}
      const raw=JSON.stringify(captureSave());localStorage.setItem(SAVE_KEY,raw);lastSavedRaw=raw;storageAvailable=true;
    }catch(_){storageAvailable=false;}
    text('save-status',storageAvailable?'Saved on this device · Export a backup anytime.':'Saving unavailable · Export a backup before closing.');
  }
  function handleExternalSave(){
    if(!ready||externalSave)return;
    externalSave=true;clearInput();keyHeld=false;settlingSpaceHeld=false;
    setMode('pause','resume-button');text('pause-title','Your business moved on.');
    text('pause-description','Another tab updated this business. Load its latest save to continue here.');
    text('resume-button','LOAD LATEST SAVE');$('pause-restart').disabled=true;
    announce('Business updated in another tab. This counter is paused to protect your progress.');
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
      let currentRaw=null;try{currentRaw=localStorage.getItem(SAVE_KEY);}catch(_){}applySave(data);lastSavedRaw=currentRaw;externalSave=false;text('pause-title','On a little break.');text('pause-description','Take your time. The shop is paused.');text('resume-button','BACK TO POURING');$('pause-restart').disabled=false;clearInput();saveCareer();if(externalSave)return;renderOrder();storeReturn=state[0]===2?'summary':state[0]===1?'finished':activePlayMode();renderStore();setMode('store','store-back');toast('Business restored. Your cash, upgrades, and records are ready.');
    }catch(error){toast(error instanceof SyntaxError?'That file is not a valid JSON save.':error.message||'The save could not be imported.');}
  }
  function updateModeUi(){
    const hard=state[F.hardcore]===1,locked=state[F.attempted]===1&&state[0]===0||['settling','finished'].includes(mode);
    for(const id of ['hardcore-mode','welcome-hardcore','easy-mode','welcome-easy']){
      const button=$(id),selected=id.includes('hardcore')===hard;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));button.disabled=locked;
      button.title=locked?'Finish this customer first.':id.includes('hardcore')?'One hold. Release serves. +15% base pay.':'Pause, top up, then serve.';
    }
    text('welcome-mode-copy',hard?'Craft it. Ready it. One hold; release serves.':'Craft it. Pour at your pace; top up or serve.');
    const flow=window.PourFlow.resolve({mode,hardcore:hard,attempted:state[F.attempted]===1,holding:pouring,selectedSoda:state[F.selectedSoda],recipeLocked:state[F.recipeLocked]===1,lastCustomer:state[1]===state[F.goal]});
    const action=$('pour-button');action.dataset.action=flow.action;action.disabled=flow.disabled;
    text('primary-label',flow.label);text('primary-hint',flow.hint);
    action.setAttribute('aria-label',flow.label+'. '+flow.hint);
    action.classList.toggle('is-waiting',flow.action==='wait');
    document.body.dataset.controlStage=flow.stage;
    $('recipe-workbench').hidden=!flow.showRecipe;$('pressure-controls').hidden=!flow.showPressure;
    document.querySelector('.mode-switch').hidden=!flow.showMode;
    $('mixed-recipe').hidden=flow.showRecipe||state[F.selectedSoda]>3;
    $('edit-recipe').hidden=mode!=='playing'||state[F.attempted]===1;
    const tip=mode==='preparing'?'<strong>Make their kind of soda.</strong><span>Match the icons on their order.</span>':mode==='settling'?'<strong>Let the fizz settle.</strong><span>Your cup stays until you’re ready.</span>':mode==='finished'?'<strong>Made by you.</strong><span>Take a look, then open the review.</span>':hard?'<strong>One hold. One pour.</strong><span>Release to serve.</span>':'<strong>Pour at your pace.</strong><span>Tap to serve. Hold to top up.</span>';
    if($('tip-text').innerHTML!==tip)$('tip-text').innerHTML=tip;
    for(let i=0;i<3;i++){
      const button=$(['pressure-gentle','pressure-classic','pressure-rush'][i]);
      button.classList.toggle('active',state[F.pressure]===i);button.setAttribute('aria-pressed',String(state[F.pressure]===i));button.disabled=state[F.canPressure]!==1||mode!=='preparing';
    }
    text('pressure-note',pressureNotes[state[F.pressure]]);text('pressure-summary',pressureNames[state[F.pressure]]);
  }
  function changePressure(value){
    if(!ready||mode!=='preparing'||engine.set_pressure(value)!==1)return;
    refreshState();saveCareer();if(externalSave)return;updateHud();sceneDirty=true;$('pressure-controls').open=false;announce(pressureNames[value]+' pressure. '+pressureNotes[value]+'.');
  }
  function changeDifficulty(hard){
    if(!ready||pouring)return;
    if(engine.set_mode(hard?1:0)!==1){toast('Finish this pour before changing the mode.');return;}
    refreshState();saveCareer();if(externalSave)return;updateHud();if(mode==='store')renderStore();
    if(mode==='playing')$('pour-button').focus({preventScroll:true});
    if(mode!=='welcome')toast(hard?'Hardcore: one hold, release to serve. +15% base pay.':'Easy: stop, settle, top up, then serve.');
  }
  function clearInput(){cancelPendingPointer();inputOwner=null;activePointer=null;pouring=false;$('pour-button').classList.remove('pressed');document.querySelector('.tap-machine').classList.remove('pouring');stopPourSound();}
  function beginInput(source){
    if(!ready||externalSave||mode!=='playing'||inputOwner!==null||state[0]!==0)return false;
    if(source==='key')cancelPendingPointer();
    advanceSimulation(performance.now());if(engine.begin_pour()!==1)return false;
    refreshState();inputOwner=source;pouring=true;saveCareer();if(externalSave)return;setCustomerMood('pouring');$('pour-button').classList.add('pressed');document.querySelector('.tap-machine').classList.add('pouring');openAudio();startPourSound();updateHud();return true;
  }
  function releaseInput(source){
    if(inputOwner!==source)return;
    advanceSimulation(performance.now());clearInput();engine.end_pour();refreshState();
    if(state[0]===1)showCommittedPour();else{setCustomerMood('neutral');saveCareer();if(externalSave)return;updateHud();}
  }
  function interruptPour(){cancelPendingPointer();if(inputOwner!==null)releaseInput(inputOwner);}
  function openShop(){
    if(!ready)return;openAudio();
    if(state[0]===1){if(state[7]/state[5]>VISIBLE_FOAM)showCommittedPour();else showFinishedCup(false);return;}if(state[0]===2){showSummary(false);return;}
    renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');saveCareer();if(externalSave)return;playCue('day');announce('Shop open. Match the recipe, then choose Ready to pour. '+(state[F.hardcore]?'Hardcore gives you one hold.':'Easy allows top-ups.'));
  }
  function openNextDay(){
    if(!ready||state[0]!==2)return;
    clearInput();engine.next_day(randomSeed());refreshState();saveCareer();if(externalSave)return;renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');playCue('day');announce(`Day ${state[F.day]}. ${state[F.goal]} customers are coming to your soda bar.`);
  }
  function resetBusiness(){
    clearInput();engine.reset(randomSeed());refreshState();saveCareer();if(externalSave)return;renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');toast('A fresh start. Welcome to Day 1.');
  }
  function personIndex(){return(Math.round(state[1])-1+(state[F.day]-1)*3)%names.length;}
  function setCustomerMood(mood){
    const art=$('customer-art');if(!art||!state)return;
    const key=personIndex()+':'+mood;if(art.dataset.moodKey===key)return;
    art.dataset.moodKey=key;window.PourArt.setMood(art,personIndex()%8,mood);
  }
  function shopState(){
    const levels=levelValues();return{sign:levels[0],seating:levels[1],awning:levels[2],tap:levels[3],helper:levels[4],specialist:levels[5],interior:levels[6],catering:levels[7],training:levels[8],hasCitrus:levels[9],hasSyrup:levels[10],hasMixer:levels[11],rating:state[9],day:state[F.day],helperActive:state[F.helperActive],specialistActive:state[F.specialistActive],staffOrders:state[F.staffOrders],staffCapacity:state[F.staffCapacity],businessTier:state[F.tier]};
  }
  function updateBusinessVisuals(){
    const shop=shopState(),key=JSON.stringify(shop);
    document.body.dataset.tap=shop.tap;document.body.dataset.sign=shop.sign;
    if(key!==lastSceneKey){
      lastSceneKey=key;
      if($('counter-scenery')&&window.PourStoreArt.counter)$('counter-scenery').innerHTML=window.PourStoreArt.counter(shop);
    }
    const levels=levelValues(),built=levels.reduce((a,b)=>a+b,0),total=upgrades.reduce((a,b)=>a+b.max,0);
    const next=levels[0]===0?'Light up your first sign':levels[5]===0?'Open a second station':levels[6]===0?'Build your soda lounge':levels[7]===0?'Take your bar on the road':built<total?'Grow your neighborhood favorite':'Your soda empire · chase a new record';
    text('business-goal',next);if($('business-progress'))$('business-progress').style.width=(built/total*100)+'%';
    const staff=state[F.specialistActive]?`${state[F.staffOrders]}/${state[F.staffCapacity]} staff orders · ${dollars(state[F.staffSales])}`:levels[5]?'Specialist starts next day':'Your second station is waiting';
    text('staff-activity',staff);
    text('staff-strip',state[F.specialistActive]?`${state[F.helperActive]?'½ cleanup · ':''}${state[F.staffOrders]}/${state[F.staffCapacity]} staff orders`:state[F.helperActive]?'Helper on duty · ½ cleanup cost':levels[4]?'Helper starts next day':'One little counter. A big future.');
  }
  function recipeTokens(ordered=false){
    const values=ordered?[state[F.orderedCherries],state[F.orderedLime],state[F.orderedSyrup],state[F.orderedBlend]]:[state[F.selectedCherries],state[F.selectedLime],state[F.selectedSyrup],state[F.selectedBlend]];
    const tokens=[],labels=['Cherry','Lime','Syrup'],kinds=['cherry','lime','syrup'];
    values.slice(0,3).forEach((n,i)=>{if(n)tokens.push(`<span class="recipe-chip">${window.PourRecipeArt.icon(kinds[i])}<b>×${n}</b><span class="sr-only">${labels[i]}</span></span>`);});
    if(!tokens.length)tokens.push('<span class="recipe-chip plain-chip">Plain</span>');
    if(state[F.hasMixer]||values[3]!==1)tokens.push(`<span class="recipe-chip blend-chip">${window.PourRecipeArt.icon('water',{blend:values[3]})}<b>${blendNames[values[3]]}</b></span>`);
    return tokens.join('');
  }
  function recipeDescription(){
    const bits=[sodas[state[2]].name];
    if(state[F.orderedCherries])bits.push(state[F.orderedCherries]+' '+(state[F.orderedCherries]===1?'cherry':'cherries'));
    if(state[F.orderedLime])bits.push('a lime wedge');
    if(state[F.orderedSyrup])bits.push(state[F.orderedSyrup]+' cherry syrup '+(state[F.orderedSyrup]===1?'pump':'pumps'));
    if(state[F.hasMixer]||state[F.orderedBlend]!==1)bits.push(state[F.orderedBlend]===0?'extra soda water':state[F.orderedBlend]===2?'bold blend':'regular blend');
    return bits.join(', ')+'. Fill to '+percent(state[4])+' percent.';
  }
  function renderRecipe(){
    const key=[...Array.from(state.slice(98,107)),state[F.hasCitrus],state[F.hasSyrup],state[F.hasMixer],state[F.recipeLocked],state[0]].join(':');
    if(key===recipeUiKey)return;recipeUiKey=key;
    if(!$('base-options').children.length){
      $('base-options').innerHTML=['Orange','Cherry','Lime','Cola'].map((name,i)=>`<button id="base-${i}" data-base="${i}" class="base-option" aria-label="${name} soda base" aria-pressed="false">${window.PourRecipeArt.icon('base',{soda:i})}<strong>${name}</strong></button>`).join('');
      $('ingredient-options').innerHTML=[['cherries','cherry','Cherries'],['lime','lime','Lime'],['syrup','syrup','Syrup']].map(([field,kind,name])=>`<button data-ingredient="${field}" class="ingredient-option"><span class="ingredient-picture">${window.PourRecipeArt.icon(kind)}<b id="${field}-count">0</b></span><strong>${name}</strong><small id="${field}-availability">Tap to add</small></button>`).join('');
      $('blend-options').innerHTML=blendNames.map((name,i)=>`<button data-blend="${i}" aria-pressed="false">${window.PourRecipeArt.icon('water',{blend:i})}<strong>${name}</strong></button>`).join('');
    }
    $('base-options').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(state[F.selectedSoda]===i));b.disabled=state[F.canRecipe]!==1;});
    [['cherries',F.selectedCherries,true,2],['lime',F.selectedLime,state[F.hasCitrus]===1,1],['syrup',F.selectedSyrup,state[F.hasSyrup]===1,2]].forEach(([name,field,available,max])=>{
      const button=$('ingredient-options').querySelector(`[data-ingredient="${name}"]`),n=state[field];
      text(name+'-count',available?n:'');text(name+'-availability',available?(n?'Tap to change':'Tap to add'):'Build to unlock');
      button.disabled=!available||state[F.canRecipe]!==1;button.classList.toggle('selected',n>0);button.classList.toggle('locked',!available);button.setAttribute('aria-label',available?`${name}: ${n}. Tap to cycle zero to ${max}.`:`${name} locked. Unlock in Build.`);
    });
    $('blend-controls').hidden=state[F.hasMixer]!==1;
    $('blend-options').querySelectorAll('button').forEach((button,i)=>{button.setAttribute('aria-pressed',String(state[F.selectedBlend]===i));button.disabled=state[F.canRecipe]!==1;});
    text('recipe-cost',state[F.selectedAddinCost]?'Add-ins '+dollars(state[F.selectedAddinCost]):'Starter cherry jar');
    $('order-recipe').innerHTML=recipeTokens(true);$('order-recipe').setAttribute('aria-label',recipeDescription());
    $('mixed-recipe').innerHTML='<span class="mixed-label">YOUR MIX</span>'+(state[F.selectedSoda]<4?'<span class="recipe-chip">'+window.PourRecipeArt.icon('base',{soda:state[F.selectedSoda]})+'<b>'+['Orange','Cherry','Lime','Cola'][state[F.selectedSoda]]+'</b></span>':'')+recipeTokens(false);
    const selected=state[F.selectedSoda]<4?state[F.selectedSoda]:state[2],soda=sodas[selected];
    document.documentElement.style.setProperty('--soda',window.PourRecipeArt.tint(soda.color,state[F.selectedBlend],state[F.selectedSyrup]));
    text('tap-name',state[F.selectedSoda]<4?soda.name.toUpperCase():'CHOOSE YOUR BASE');text('drink-name',sodas[state[2]].name);text('drink-flavor',sodas[state[2]].flavor);
    text('fizz-label',soda.fizz);text('fizz-note',state[F.selectedBlend]===0?'Light blend · a little more fizz':state[F.selectedBlend]===2?'Bold blend · richer color':soda.note);
    $('fizz-meter').setAttribute('aria-label',soda.fizz.toLowerCase()+' fizz, '+blendNames[state[F.selectedBlend]].toLowerCase()+' blend');
    [...$('fizz-meter').children].forEach((dot,i)=>dot.classList.toggle('on',i<=selected));
    sceneDirty=true;
  }
  function changeRecipe(kind,value){
    if(!ready||externalSave||mode!=='preparing'||state[F.canRecipe]!==1)return;
    advanceSimulation(performance.now());
    const recipe=[state[F.selectedSoda],state[F.selectedCherries],state[F.selectedLime],state[F.selectedSyrup],state[F.selectedBlend]];
    const index={base:0,cherries:1,lime:2,syrup:3,blend:4}[kind];if(index===undefined)return;
    recipe[index]=value;
    if(engine.set_recipe(...recipe)!==1)return;
    refreshState();saveCareer();if(externalSave)return;updateHud();
    if(kind==='base')announce(sodas[value].name+' selected.');
    else if(kind==='blend')announce(blendNames[value]+' blend selected.');
    else announce(value+' '+kind+' selected.');
  }
  function readyToPour(){
    if(mode!=='preparing'||state[F.selectedSoda]>3)return;
    $('pressure-controls').open=false;setMode('playing','pour-button');saveCareer();
    if(!externalSave)announce(state[F.hardcore]?'Recipe ready. Hold Space once. Release commits your drink.':'Recipe ready. Hold to pour; after release, tap to serve or hold again to top up.');
  }
  function editRecipe(){if(mode==='playing'&&state[F.attempted]!==1){setMode('preparing','pour-button');announce('Adjust your recipe before the first pour.');}}
  function renderOrder(){
    const soda=sodas[state[2]],cup=cups[state[3]],order=Math.round(state[1]),target=percent(state[4]);
    document.documentElement.style.setProperty('--soda',soda.color);
    text('customer-name',names[personIndex()]);text('customer-number','GUEST '+String(order).padStart(2,'0'));
    $('order-line').innerHTML=soda.name+'<strong>'+target+'% please!</strong>';
    text('customer-aside',soda.aside);recipeUiKey='';setCustomerMood('neutral');text('customer-status','YOUR NEXT POUR');
    text('tap-name',soda.name.toUpperCase());text('drink-name',soda.name);text('drink-flavor',soda.flavor);
    text('fizz-label',soda.fizz);text('fizz-note',soda.note);$('fizz-meter').setAttribute('aria-label',soda.fizz.toLowerCase()+' fizz');
    [...$('fizz-meter').children].forEach((dot,i)=>dot.classList.toggle('on',i<=state[2]));
    text('cup-name',cup.name);text('cup-capacity',Math.round(state[5])+' mL');
    $('target-percent').innerHTML=target+'<small>%</small>';text('station-target',target+'%');$('target-track').style.left=target+'%';
    text('payout-multiplier',state[14].toFixed(2)+'×');lastSpill=state[8];spillFlash=0;lastFeedback='';sceneDirty=true;updateHud();
  }
  function comboMessage(){
    const left=Math.max(1,Math.round(state[F.nextStreak]-state[F.streak]));return`${left} good ${left===1?'pour':'pours'} → +${dollars(state[F.nextReward])}`;
  }
  function updateMeter(){
    if(!state)return;
    const fill=clamp(state[6]/state[5],0,1),foam=clamp(state[7]/state[5],0,1);
    $('liquid-track').style.width=(fill*100)+'%';$('foam-track').style.left=(fill*100)+'%';$('foam-track').style.width=(Math.min(foam,1-fill)*100)+'%';
    if($('patience-track'))$('patience-track').style.width=(clamp(state[F.patience],0,1)*100)+'%';
  }
  function updateLiveFeedback(){
    const fill=state[6]/state[5],foam=state[7]/state[5],hard=state[F.hardcore]===1;
    text('liquid-percent',percent(fill)+'%');text('foam-percent',foam>VISIBLE_FOAM&&foam<.005?'<1%':percent(foam)+'%');
    const remaining=Math.max(0,state[F.patience]*state[F.patienceLimit]);
    text('patience-label',state[0]===1?'Served':state[F.prepStarted]||state[F.attempted]?remaining.toFixed(1)+'s':state[F.patienceLimit].toFixed(0)+'s service');
    if($('patience-track'))$('patience-track').classList.toggle('low',state[F.patience]<.25);
    let message=mode==='preparing'?'Build the recipe above':hard?'Hold once · release to serve':'Tap to serve · hold to top up',kind='';
    if(state[8]>1){message=`Foam spill · ${Math.round(state[F.waste])} mL soda lost`;kind='warning';}
    else if(fill>state[4]+.025){message='Above the line';kind='warning';}
    else if(Math.abs(fill-state[4])<.025&&fill>.1){message='At the line · foam adds soda';kind='ready';}
    else if(foam>.12)message='Watch the foam cloud';
    else if(fill>state[4]-.08)message='Almost there…';
    if((state[F.prepStarted]||state[F.attempted])&&state[F.patience]<.12&&state[0]===0){message=state[F.patience]<=0?'Guest waiting · price falling':'Guest waiting · speed tip fading';kind='warning';}
    if(state[0]===1){message=mode==='settling'?'Watch the last bubbles':state[12]===5?'✦ Your perfect pour':`${percent(state[F.beverageMl]/state[5])}% poured · ${percent(state[4])}% ordered`;kind=state[12]===5&&mode!=='settling'?'ready':'';}
    text('live-message',message);$('live-message').className='live-message'+(kind?' '+kind:'');
    if(kind==='warning'&&lastFeedback!==message&&pouring&&lastFeedback!=='warning')announce(message);
    lastFeedback=kind;
    canvas.setAttribute('aria-label',`Cup: ${percent(fill)} percent soda, ${foam>VISIBLE_FOAM&&foam<.005?'less than1':percent(foam)} percent foam. Target ${percent(state[4])} percent. Soda waste ${Math.round(state[F.waste])} milliliters.`);
  }
  function updateHud(){
    if(!state)return;
    const served=Math.round(state[16]),order=Math.round(state[1]),goal=Math.round(state[F.goal]),hard=state[F.hardcore]===1;
    text('money',dollars(state[F.cash]));text('rating',state[9].toFixed(1));text('day-label','DAY '+String(state[F.day]).padStart(2,'0'));
    const count=String(Math.min(order,goal)).padStart(2,'0')+' <small>/ '+goal+'</small>';if($('customer-count').innerHTML!==count)$('customer-count').innerHTML=count;
    text('progress-label',served+' / '+goal+' served');
    if($('progress-dots').children.length!==goal)$('progress-dots').innerHTML='<i></i>'.repeat(goal);
    [...$('progress-dots').children].forEach((dot,i)=>{dot.classList.toggle('done',i<served);dot.classList.toggle('current',i===served&&served<goal);});
    $('pause-button').disabled=!['playing','preparing'].includes(mode);
    $('store-tab').disabled=['settling'].includes(mode)||pouring;
    text('combo-label',state[F.streak]>0?`${state[F.streak]} streak · ${state[F.combo].toFixed(2)}×`:'Start a streak');text('combo-next',comboMessage());
    text('order-price',dollars(Math.round(state[F.menuPrice]*state[14]*state[F.signPay]*state[F.modePay])));
    const milestoneVisible=state[F.milestone]>0&&['finished','result'].includes(mode);
    text('milestone-badge',milestoneVisible?'✦ +'+dollars(state[F.milestone]):'');
    if($('milestone-badge'))$('milestone-badge').hidden=!milestoneVisible;
    renderRecipe();updateModeUi();updateMeter();updateLiveFeedback();updateBusinessVisuals();
  }
  function serveDrink(){
    if(!ready||mode!=='playing'||state[F.hardcore]===1)return;
    interruptPour();engine.serve();refreshState();if(state[0]===1)showCommittedPour();
  }
  function showCommittedPour(){
    saveCareer();if(externalSave)return;settlingElapsed=0;finishElapsed=0;
    setCustomerMood('settling');text('customer-status','WATCHING THE FIZZ');
    setMode('settling');announce('Pour committed. Watch it settle. Your cup will stay on screen.');
  }
  function showFinishedCup(celebrate){
    finishElapsed=0;
    const perfect=state[12]===5;
    setCustomerMood(state[12]>=4?'happy':state[12]<=2?'disappointed':'neutral');
    text('customer-status',perfect?'✦ YOU NAILED IT':state[12]>=4?'ONE HAPPY GUEST':'A POUR TO LEARN FROM');
    setMode('finished','pour-button');
    announce(`Cup settled. ${scoreText(state[11],state[F.fillStars])} percent accuracy. Final fill ${percent(state[F.beverageMl]/state[5])} percent. Choose See review when ready.`);
    if(celebrate&&!document.hidden&&document.hasFocus()){
      openAudio();playCue(perfect?'perfect':state[12]>=4?'good':'bad');
      if(state[F.milestone]>0){playCue('streak',{streak:state[F.streak]});confetti();}
    }
  }
  function viewReview(){if(mode==='finished')presentResult(false);}
  function ledgerRow(label,value,extra=''){
    return'<div class="bonus-row '+extra+'"><span>'+label+'</span><strong>'+signedMoney(value)+'</strong></div>';
  }
  function presentResult(celebrate){
    clearInput();refreshState();
    const stars=Math.round(state[12]),accuracy=scoreText(state[11],state[F.fillStars]),order=Math.round(state[1]),streak=Math.round(state[F.streak]);
    setCustomerMood(stars>=4?'happy':stars<=2?'disappointed':'neutral');
    $('review-stars').innerHTML='★'.repeat(stars)+'<span class="empty">'+'★'.repeat(5-stars)+'</span>';$('review-stars').setAttribute('aria-label',stars+' out of5 stars');
    text('result-title',['','A fresh start next cup.','Keep finding your rhythm.','Getting the hang of it.','A lovely pour.','That’s the perfect pour.'][stars]);
    const choices=reviewLines[stars],fillError=state[F.beverageMl]/state[5]-state[4];
    text('review-quote',state[F.recipeMistakes]?'“The pour is only half the recipe. Check my order!”':stars<=2?(fillError<0?'“I was hoping for a fuller cup.”':'“That’s more soda than I ordered.”'):choices[(order+state[F.day]-2)%choices.length]);
    text('result-eyebrow',state[F.refund]>0&&state[F.basePay]===0?'ORDER REFUNDED':'GUEST REVIEW');
    $('result-recipe').innerHTML=Math.round(state[F.recipeAccuracy])+'<small>%</small>';
    $('result-accuracy').innerHTML=accuracy+'<small>%</small>';text('result-earned',signedMoney(state[F.lastNet]));
    $('result-details').innerHTML=`<span>◎ ${percent(state[4])}% target</span><span>◉ ${percent(state[F.beverageMl]/state[5])}% poured</span><span>◒ ${Math.round(state[F.waste])} mL wasted</span>`;
    const missing=[];const mask=state[F.recipeMistakes];
    if(mask&1)missing.push('Base: '+sodas[state[2]].name);if(mask&2)missing.push('Cherries: '+state[F.orderedCherries]);if(mask&4)missing.push('Lime: '+state[F.orderedLime]);if(mask&8)missing.push('Syrup: '+state[F.orderedSyrup]);if(mask&16)missing.push('Blend: '+blendNames[state[F.orderedBlend]]);
    $('result-details').innerHTML+=(missing.length?'<span class="recipe-error">Requested '+missing.join(' · ')+'</span>':'<span class="recipe-exact">✓ Recipe exact</span>');
    document.querySelector('.receipt-details').open=false;
    text('result-combo',streak>0?(state[F.milestone]>0?`✦ ${streak} in a row · +${dollars(state[F.milestone])}`:`${streak} good ${streak===1?'pour':'pours'} · ${state[F.combo].toFixed(2)}×`):'Next cup, new streak.');
    const rows=[['Soda sale',state[F.basePay]],['Streak',state[F.comboBonus]],['Milestone',state[F.milestone]],['Perfect tip',state[F.perfectTip]],['Service tips',state[F.serviceTip]],['Ingredients',-state[F.ingredientCost]],['Cleanup',-state[F.cleanupCost]]];
    $('bonus-breakdown').innerHTML=rows.filter((r,i)=>i===0||r[1]!==0).map(([label,value])=>ledgerRow(label,value)).join('')+(state[F.refund]>0?'<p class="ledger-note">'+dollars(state[F.refund])+(state[F.basePay]===0?' sale voided · no charge to the guest.':' quality/service discount · already reflected above.')+'</p>':'');
    text('old-rating',state[F.previousRating].toFixed(1));text('new-rating',state[9].toFixed(1));
    const delta=state[9]-state[F.previousRating];
    text('next-price-note',order===state[F.goal]?'Last guest. Time to count today’s profit.':delta>.025?'Reputation up · better prices next pour':delta<-.025?'Reputation down · rebuild it one good pour at a time':'A steady reputation · keep the good pours coming');
    saveCareer();if(externalSave)return;setMode('result','pour-button');
    if(celebrate)playCue(stars===5?'perfect':stars>=4?'good':'bad');
    announce(`${stars} ${stars===1?'star':'stars'}. ${accuracy} percent accuracy. Net ${signedMoney(state[F.lastNet])}. ${streak} good ${streak===1?'pour':'pours'} in a row.`);
  }
  function nextOrder(){
    if(mode!=='result')return;clearInput();engine.next_order();refreshState();saveCareer();if(externalSave)return;
    if(state[0]===2){showSummary(true);return;}
    renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');announce(`${sodas[state[2]].name}, filled to ${percent(state[4])} percent. ${sodas[state[2]].fizz} fizz.`);
  }
  function showSummary(celebrate){
    const rating=state[9],goal=state[F.goal];
    text('summary-money',signedMoney(state[F.net]));text('summary-rating',rating.toFixed(1)+' ★');text('summary-accuracy',scoreText(state[17])+'%');text('summary-perfect',state[18]+' / '+goal);
    text('summary-title',rating>=4.5?'The talk of the block.':rating>=3?'That’s a wrap.':'Tomorrow’s a fresh pour.');
    text('summary-message',`Day ${state[F.day]} · ${goal} guests · ${state[F.staffOrders]} staff orders`);
    $('shift-ledger').innerHTML=[['Counter sales',state[10]-state[F.staffSales]],['Staff sales',state[F.staffSales]],['Ingredients',-state[F.ingredientTotal]],['Cleanup',-state[F.cleanupTotal]],['Wages',-state[F.wages]],['Profit',state[F.net]]].filter((r,i)=>i===0||i===5||r[1]!==0).map(([label,value],i)=>ledgerRow(label,value,label==='Profit'?'ledger-total':'')).join('')+
      `<p class="ledger-note">Included above: ${dollars(state[F.signTotal])} from your sign · ${dollars(state[F.serviceTotal])} service tips.</p>`+
      (state[F.refundTotal]>0?`<p class="ledger-note">${dollars(state[F.refundTotal])} discounts & refunds · already excluded.</p>`:'')+
      (state[F.missed]>0?`<p class="ledger-note">${state[F.missed]} side-queue guests left. Grow capacity or speed up service.</p>`:'');
    text('personal-best',`Best sales ${dollars(state[F.bestShift])} · Hardcore streak ${state[F.hardcoreBest]} · Easy streak ${state[F.easyBest]}`);
    saveCareer();if(externalSave)return;setMode('summary','pour-button');
    if(celebrate){if(rating>=4)confetti();playCue('day');}announce(`Day complete. Profit ${signedMoney(state[F.net])}. Business cash ${dollars(state[F.cash])}.`);
  }
  function renderStore(){
    refreshState();const levels=levelValues(),costs=costValues();
    $('store-art').innerHTML=window.PourStoreArt.render(shopState());
    $('store-art').setAttribute('aria-label',`Your soda bar: sign level ${levels[0]}, patio ${levels[1]}, awning ${levels[2]}, tap ${levels[3]}, ${levels[4]+levels[5]} employees, lounge ${levels[6]}, catering ${levels[7]}, training ${levels[8]}.`);
    text('store-spendable',dollars(state[F.spendable]));text('store-reserve',dollars(state[F.reserve]));text('store-lifetime',dollars(state[F.lifetime]));
    text('store-description',`Day ${state[F.day]} · ${state[9].toFixed(1)} ★ · ${state[F.customers]} happy-hour moments`);
    text('store-rule',state[F.canBuy]!==1?'Finish this cup to build.':state[F.reserve]>0?`${dollars(state[F.reserve])} protected for wages · seats & new staff start tomorrow`:'Build between pours · seats & new staff start tomorrow');
    $('upgrade-grid').innerHTML=upgrades.map((item,i)=>{
      const level=levels[i],maxed=level>=item.max,cost=costs[i],affordable=state[F.spendable]>=cost;
      const prerequisite=i===7&&(!levels[6]||!levels[5])?'Needs lounge + specialist':i===8&&!levels[5]?'Needs a specialist':'';
      const canBuy=state[F.canBuy]===1&&!maxed&&affordable&&!prerequisite;
      const status=maxed?(i===4||i===5?(state[i===4?F.helperActive:F.specialistActive]?'ON DUTY':'STARTS TOMORROW'):'FULLY BUILT'):prerequisite||(!affordable?`${dollars(Math.max(0,cost-state[F.spendable]))} to go`:state[F.canBuy]!==1?'Finish your cup first':'READY TO BUILD');
      const icon=window.PourStoreArt.upgradeIcon?window.PourStoreArt.upgradeIcon(i,level):'✦';
      return `<article class="upgrade-card${maxed?' maxed':''}${prerequisite?' locked':''}"><div class="upgrade-icon" aria-hidden="true">${icon}</div><div class="upgrade-copy"><span class="upgrade-level">${item.unit} · ${level}/${item.max}</span><h3>${item.name}</h3><p>${item.description}</p><div class="upgrade-effect">${maxed?item.owned(level):item.effect(level)}</div><span class="upgrade-current">${level&&!maxed?'Now: '+item.owned(level):''}</span></div><button class="buy-button" data-item="${i}" ${canBuy?'':'disabled'} aria-label="${maxed?item.name+' fully owned':(i===4||i===5?'Hire ':'Build ')+item.name+' for '+dollars(cost)}">${maxed?'✓ OWNED':`${i===4||i===5?'HIRE':'BUILD'} <strong>${dollars(cost)}</strong>`}</button><span class="upgrade-status">${status}</span></article>`;
    }).join('');
    text('store-back',state[0]===2?'OPEN DAY '+(state[F.day]+1):state[0]===1?'BACK TO YOUR POUR':'BACK TO THE COUNTER');
    updateHud();
  }
  function enterStore(){
    if(!ready||externalSave||mode==='welcome'||mode==='settling'||mode==='restart'||mode==='help')return;
    interruptPour();
    // Releasing Hardcore may commit a cup. Never hide that physical handoff.
    if(mode==='settling')return;
    storeReturn=mode==='finished'?'finished':state[0]===2?'summary':state[0]===1?'result':mode==='playing'?'playing':'preparing';
    renderStore();setMode('store','store-back');
  }
  function leaveStore(){
    if(mode!=='store')return;
    if(state[0]===2){openNextDay();return;}
    if(state[0]===1){if(state[7]/state[5]>VISIBLE_FOAM)showCommittedPour();else if(storeReturn==='finished')showFinishedCup(false);else presentResult(false);return;}
    renderOrder();setMode(state[F.attempted]?'playing':storeReturn==='playing'?'playing':'preparing',state[F.selectedSoda]<4?'pour-button':'base-0');
  }
  function buyUpgrade(index){
    if(mode!=='store'||!Number.isInteger(index)||index<0||index>=upgrades.length)return;
    if(engine.buy(index)!==1){toast('That upgrade needs more cash or another building first.');return;}
    refreshState();saveCareer();if(externalSave)return;renderStore();playCue('purchase');
    toast((index===4||index===5)?`${upgrades[index].name} joins tomorrow.`:[1,6,7,8].includes(index)?`${upgrades[index].name} built. New capacity starts tomorrow.`:`${upgrades[index].name} upgraded.`);
    const replacement=$('upgrade-grid').querySelector(`[data-item="${index}"]`);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});else $('store-back').focus({preventScroll:true});
  }
  function pause(){
    if(mode==='store')return;
    if(!['playing','preparing'].includes(mode))return;pauseReturn=mode;interruptPour();if(!['playing','preparing'].includes(mode))return;setMode('pause','resume-button');announce('Game paused.');
  }
  function resume(){if(mode==='pause'){if(externalSave){window.location.reload();return;}openAudio();setMode(state[F.attempted]?'playing':pauseReturn,'pour-button');}}
  function showHelp(){
    if(!ready||!['preparing','playing','pause','store','welcome','settling','finished','result','summary'].includes(mode))return;
    interruptPour();returnMode=mode;setMode('help','close-help');
  }
  function closeHelp(){if(mode==='help')setMode(returnMode,returnMode==='welcome'?'start-button':returnMode==='pause'?'resume-button':returnMode==='store'?'store-back':returnMode==='finished'?'pour-button':returnMode==='result'?'pour-button':returnMode==='summary'?'pour-button':returnMode==='settling'?'help-button':'pour-button');}
  function requestRestart(){if(mode!=='store')return;returnMode='store';setMode('restart','cancel-restart');}
  function cancelRestart(){if(mode==='restart')setMode(returnMode,'store-back');}
  function saveSettings(){try{localStorage.setItem('perfect-pour-v1-settings',JSON.stringify(settings));}catch(_){}}
  function openAudio(){
    if(!settings.sound&&!settings.music)return;
    try{
      if(!audio.context){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audio.context=new Ctx();}
      window.PerfectPourSounds?.attach(audio.context);window.PerfectPourSounds?.setEnabled(settings.sound);window.PerfectPourSounds?.setVolume(settings.soundVolume);
      window.PourMusic?.setVolume(settings.musicVolume);
      if(audio.context.state==='suspended')audio.context.resume().then(()=>{syncMusic();if(pouring)startPourSound();}).catch(()=>{});else syncMusic();
    }catch(_){}
  }
  function playCue(name,options){if(settings.sound&&audio.context&&!document.hidden&&document.hasFocus())window.PerfectPourSounds?.cue(name,options);}
  function startPourSound(){if(settings.sound&&audio.context)window.PerfectPourSounds?.startPour(state&&state[F.selectedSoda]<4?state[F.selectedSoda]:0);}
  function stopPourSound(){window.PerfectPourSounds?.stopPour();}
  function soundToggle(){
    settings.sound=!settings.sound;saveSettings();updateSoundButton();window.PerfectPourSounds?.setEnabled(settings.sound);
    if(settings.sound){openAudio();if(pouring)startPourSound();}else window.PerfectPourSounds?.suspend();
  }
  function updateSoundButton(){const b=$('sound-button');b.classList.toggle('muted',!settings.sound);b.setAttribute('aria-label',settings.sound?'Turn sound effects off':'Turn sound effects on');b.setAttribute('aria-pressed',String(settings.sound));b.title=settings.sound?'Sound effects on':'Sound effects off';}
  function syncMusic(){
    if(!window.PourMusic)return;
    const allowed=settings.music&&audio.context&&!document.hidden&&document.hasFocus()&&['preparing','playing','settling','finished','result','summary','store'].includes(mode);
    window.PourMusic.setVolume(settings.musicVolume);
    if(allowed)window.PourMusic.start(audio.context);else window.PourMusic.stop();
  }
  function musicToggle(){settings.music=!settings.music;saveSettings();updateMusicButton();if(settings.music)openAudio();syncMusic();}
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
    const original=cups[index],cup={...original,height:original.height*1.1,top:original.top*1.1,bottom:original.bottom*1.1,curve:original.curve*1.1},bottom=393,top=bottom-cup.height,n=240,volume=[0];let sum=0;
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
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,pixelW,pixelH);
    const scale=Math.min(pixelW/420,pixelH/440);
    ctx.setTransform(scale,0,0,scale,(pixelW-420*scale)/2-50*scale,(pixelH-440*scale)/2);
    const s=state||[0,1,0,0,.65,280,0,0,0],rawSoda=sodas[s[F.selectedSoda]<4?s[F.selectedSoda]:s[2]],soda={...rawSoda,color:window.PourRecipeArt.tint(rawSoda.color,s[F.selectedBlend]??1,s[F.selectedSyrup]||0),light:window.PourRecipeArt.tint(rawSoda.light,s[F.selectedBlend]??1,s[F.selectedSyrup]||0)},g=cupGeometry(s[3]),t=visualTime;
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
    window.PourRecipeArt.drawInside(ctx,{geometry:g,liquidY,cherries:s[F.selectedCherries]||0,lime:s[F.selectedLime]||0,syrup:s[F.selectedSyrup]||0,blend:s[F.selectedBlend]??1,time:t,reducedMotion});
    // Glass highlights remain visible above and below the liquid.
    ctx.strokeStyle='#ffffff64';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(260-g.width(.86)/2+10,g.bottom-g.cup.height*.86);ctx.lineTo(260-g.width(.18)/2+10,g.bottom-g.cup.height*.18);ctx.stroke();
    ctx.strokeStyle='#ffffff39';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(260+g.width(.88)/2-9,g.bottom-g.cup.height*.88);ctx.lineTo(260+g.width(.16)/2-9,g.bottom-g.cup.height*.16);ctx.stroke();
    // The same smiling cup brand mark as the header, without any lettering.
    const badgeY=g.bottom-52;ctx.fillStyle='#fff5dcbb';ctx.strokeStyle='#174b4970';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(260,badgeY,22,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.save();ctx.translate(260-26*.64,badgeY-30*.64);ctx.scale(.64,.64);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#174b49';ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(10,18);ctx.lineTo(42,18);ctx.lineTo(37,52);ctx.lineTo(15,52);ctx.closePath();ctx.fillStyle='#ffcb68';ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,18);ctx.lineTo(44,18);ctx.moveTo(16,27);ctx.lineTo(36,27);ctx.moveTo(29,18);ctx.lineTo(35,5);ctx.lineTo(45,5);ctx.stroke();
    ctx.fillStyle='#174b49';ctx.beginPath();ctx.arc(23,34,2,0,Math.PI*2);ctx.arc(31,39,2,0,Math.PI*2);ctx.fill();ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(21,44);ctx.quadraticCurveTo(26,49,31,44);ctx.stroke();ctx.restore();
    ctx.restore();
    // Cup outline and rolled rim.
    cupPath(g);ctx.strokeStyle='#174b49';ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.ellipse(260,g.top,g.cup.top/2,5,0,0,Math.PI*2);ctx.strokeStyle='#174b49';ctx.lineWidth=2.3;ctx.stroke();
    window.PourRecipeArt.drawRim(ctx,{geometry:g,lime:s[F.selectedLime]||0,time:t,reducedMotion});
    // Dashed requested level, mapped from volume (not a naïve cup-height percent).
    ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='#174b49c4';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(260-g.cup.top/2-24,targetY);ctx.lineTo(260+g.cup.top/2+27,targetY);ctx.stroke();ctx.restore();
    const tagX=260+g.cup.top/2+24;roundedRect(tagX,targetY-18,61,36,10);ctx.fillStyle='#fffaf0';ctx.fill();ctx.strokeStyle='#174b49';ctx.lineWidth=1.5;ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#174b49';ctx.font='bold 19px Trebuchet MS';ctx.fillText(percent(s[4])+'%',tagX+30.5,targetY+.5);
    // The stream falls to the visible surface, with small fizzy flecks.
    if(pouring&&mode==='playing'){
      const surface=fill+foam>0?foamY:g.bottom-5;ctx.beginPath();ctx.moveTo(254,25);for(let y=25;y<=surface;y+=9)ctx.lineTo(254+Math.sin(y*.1+t*22)*1.4,y);ctx.lineTo(266,surface);for(let y=surface;y>=25;y-=9)ctx.lineTo(266+Math.sin(y*.09+t*24)*1.4,y);ctx.closePath();ctx.fillStyle=soda.color;ctx.globalAlpha=.85;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=soda.light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(258,29);ctx.lineTo(258,surface-2);ctx.stroke();
      for(let i=0;i<7;i++){const q=(t*2+i*.147)%1,x=260+Math.sin(i*7.3)*q*22,y=surface-Math.sin(q*Math.PI)*14;ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fillStyle=soda.light;ctx.fill();}
    }
    if(spillFlash>0&&!reducedMotion){for(let i=0;i<5;i++){const side=i%2?-1:1,x=260+side*(g.cup.top/2+5+i%2*3),y=g.top+((t*130+i*43)%(g.cup.height+5));ctx.strokeStyle=i%2?'#fff5df':soda.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*4,y+13);ctx.stroke();}}
    if(mode==='finished'&&s[12]===5&&window.PourFinish)window.PourFinish.draw(ctx,{top:g.top,bottom:g.bottom,widthAt:g.width,centerX:260,time:finishElapsed,reducedMotion});
  }

  // Flush elapsed time on input transitions as well as frames. The Rust engine
  // owns whether a pour is active, whether an attempt is spent, and its payout.
  function advanceSimulation(now){
    const elapsed=simulationClock?clamp((now-simulationClock)/1000,0,3):0;simulationClock=now;
    if(ready&&!document.hidden&&((['preparing','playing'].includes(mode)&&state[0]===0)||(['settling','finished','result'].includes(mode)&&state[0]===1))){
      let remaining=elapsed;while(remaining>.000001){const step=Math.min(remaining,.1);engine.step(step,0);remaining-=step;}refreshState();
      if(state[8]>lastSpill+.03){spillFlash=1.2;if(lastSpill<.1){if(!reducedMotion){document.querySelector('.pour-area').classList.add('spilling');setTimeout(()=>document.querySelector('.pour-area').classList.remove('spilling'),350);}playCue('spill');}}
      lastSpill=state[8];spillFlash=Math.max(0,spillFlash-elapsed);
    }
  }
  function frame(now){
    const dt=lastFrame?clamp((now-lastFrame)/1000,0,.25):0;lastFrame=now;advanceSimulation(now);
    if(ready&&!document.hidden){
      if(mode==='settling'){settlingElapsed+=dt;if(settlingElapsed>=.8&&state[7]/state[5]<=VISIBLE_FOAM)showFinishedCup(true);}
      if(mode==='finished')finishElapsed+=dt;
      const physical=mode==='playing'&&(pouring||state[7]/state[5]>VISIBLE_FOAM)||mode==='settling';
      const shine=mode==='finished'&&state[12]===5&&!reducedMotion&&finishElapsed<6;
      if((physical||shine)&&!reducedMotion)visualTime+=dt;
      const serving=['preparing','playing'].includes(mode)&&(state[F.prepStarted]||state[F.attempted]);
      if(physical||serving){updateMeter();if(now-lastUi>120){updateLiveFeedback();lastUi=now;}}
      if((pouring||serving)&&now-lastAutosave>500){saveCareer();if(externalSave)return;lastAutosave=now;}
      const fizzAudible=document.hasFocus()&&(mode==='settling'||mode==='playing'&&!pouring);
      window.PerfectPourSounds?.updateFoam(state[7]/state[5],state[F.selectedSoda]<4?state[F.selectedSoda]:state[2],fizzAudible);
      if(mode!=='store'&&(sceneDirty||physical||shine)){draw();sceneDirty=false;}
    }else if(sceneDirty&&!document.hidden){draw();sceneDirty=false;}
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize',()=>{sceneDirty=true;});
  if(window.ResizeObserver)new ResizeObserver(()=>{sceneDirty=true;}).observe(canvas);
  function cancelPendingPointer(){
    if(pendingPointer){clearTimeout(pendingPointer.timer);pendingPointer=null;}
  }
  function primaryAction(){
    if(!ready||externalSave||$('pour-button').disabled)return;
    const action=$('pour-button').dataset.action;
    if(action==='ready')readyToPour();
    else if(action==='easyServe')serveDrink();
    else if(action==='review')viewReview();
    else if(action==='next')nextOrder();
    else if(action==='nextDay')openNextDay();
    else if(action==='pour')announce('Hold Space or hold the button to pour.');
  }
  function primaryPointerDown(event){
    if(event.button!==0||event.isPrimary===false||pendingPointer||inputOwner!==null)return;
    suppressPrimaryClick=false;
    if($('pour-button').disabled||mode==='settling'){suppressPrimaryClick=true;event.preventDefault();return;}
    if(mode!=='playing')return;
    const action=$('pour-button').dataset.action;
    if(action!=='pour'&&action!=='easyServe')return;
    event.preventDefault();suppressPrimaryClick=true;
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch(_){}
    if(action==='pour'){
      if(beginInput('pointer'))activePointer=event.pointerId;
      return;
    }
    const pending={id:event.pointerId,held:false,timer:null};pendingPointer=pending;
    pending.timer=setTimeout(()=>{
      if(pendingPointer!==pending||mode!=='playing'||externalSave||inputOwner!==null)return;
      pending.held=true;
      if(beginInput('pointer'))activePointer=pending.id;
    },160);
  }
  function releasePointer(event){
    if(inputOwner==='pointer'&&(activePointer===null||event.pointerId===activePointer)){
      releaseInput('pointer');return;
    }
    if(pendingPointer&&pendingPointer.id===event.pointerId){
      const shouldServe=!pendingPointer.held;cancelPendingPointer();
      if(shouldServe&&mode==='playing'&&inputOwner===null)serveDrink();
    }
  }
  function cancelPrimaryPointer(event){
    if(pendingPointer&&pendingPointer.id===event.pointerId)cancelPendingPointer();
    if(inputOwner==='pointer'&&(activePointer===null||event.pointerId===activePointer))releaseInput('pointer');
  }
  function primaryClick(event){
    if(suppressPrimaryClick&&event.detail!==0){suppressPrimaryClick=false;event.preventDefault();return;}
    suppressPrimaryClick=false;primaryAction();
  }
  $('pour-button').addEventListener('pointerdown',primaryPointerDown);
  window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',cancelPrimaryPointer);
  $('pour-button').addEventListener('lostpointercapture',cancelPrimaryPointer);
  $('pour-button').addEventListener('contextmenu',event=>event.preventDefault());
  $('pour-button').addEventListener('click',primaryClick);
  $('start-button').addEventListener('click',openShop);$('edit-recipe').addEventListener('click',editRecipe);
  $('base-options').addEventListener('click',event=>{const button=event.target.closest('button[data-base]');if(button&&!button.disabled)changeRecipe('base',Number(button.dataset.base));});
  $('ingredient-options').addEventListener('click',event=>{
    const button=event.target.closest('button[data-ingredient]');if(!button||button.disabled)return;
    const kind=button.dataset.ingredient,field={cherries:F.selectedCherries,lime:F.selectedLime,syrup:F.selectedSyrup}[kind],max=kind==='lime'?1:2;
    changeRecipe(kind,(state[field]+1)%(max+1));openAudio();playCue('ingredient',{kind:kind==='cherries'?'cherry':kind});
  });
  $('blend-options').addEventListener('click',event=>{const button=event.target.closest('button[data-blend]');if(button&&!button.disabled)changeRecipe('blend',Number(button.dataset.blend));});
  $('sound-button').addEventListener('click',soundToggle);$('music-button').addEventListener('click',musicToggle);$('pause-button').addEventListener('click',pause);$('resume-button').addEventListener('click',resume);$('help-button').addEventListener('click',showHelp);$('close-help').addEventListener('click',closeHelp);
  for(const id of ['store-tab','restart-button','pause-restart','result-store','summary-store'])$(id).addEventListener('click',enterStore);
  $('store-back').addEventListener('click',leaveStore);$('counter-tab').addEventListener('click',()=>{if(mode==='store')leaveStore();});
  $('brand-home').addEventListener('click',event=>{event.preventDefault();enterStore();});
  for(const id of ['hardcore-mode','welcome-hardcore'])$(id).addEventListener('click',()=>changeDifficulty(true));
  for(const id of ['easy-mode','welcome-easy'])$(id).addEventListener('click',()=>changeDifficulty(false));
  ['pressure-gentle','pressure-classic','pressure-rush'].forEach((id,index)=>$(id)?.addEventListener('click',()=>changePressure(index)));
  for(const [id,key,module] of [['music-volume','musicVolume','PourMusic'],['sound-volume','soundVolume','PerfectPourSounds']]){const slider=$(id);if(slider){slider.value=settings[key]*100;slider.addEventListener('input',()=>{settings[key]=clamp(Number(slider.value)/100,0,1);window[module]?.setVolume(settings[key]);saveSettings();});}}
  $('upgrade-grid').addEventListener('click',event=>{const button=event.target.closest('button[data-item]');if(button&&!button.disabled)buyUpgrade(Number(button.dataset.item));});
  $('export-save').addEventListener('click',exportSave);$('import-save').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',importSave);
  $('reset-business').addEventListener('click',requestRestart);$('confirm-restart').addEventListener('click',resetBusiness);$('cancel-restart').addEventListener('click',cancelRestart);
  const leaveWindow=()=>{interruptPour();keyHeld=false;settlingSpaceHeld=false;if(['playing','preparing'].includes(mode))pause();saveCareer();if(externalSave)return;window.PourMusic?.stop();window.PerfectPourSounds?.suspend();};window.addEventListener('blur',leaveWindow);window.addEventListener('focus',syncMusic);document.addEventListener('visibilitychange',()=>{if(document.hidden)leaveWindow();else syncMusic();});
  function nativeActivation(target){const control=target instanceof Element?target.closest('button,a,input,textarea,select,summary,[contenteditable="true"]'):null;return control&&control.id!=='pour-button';}
  function keyDown(event){
    // A Space pressed before pouring is ready cannot turn into a different
    // action when the primary button changes its role while that key is held.
    if(event.code==='Space'&&((['settling','preparing'].includes(mode)&&!nativeActivation(event.target))||settlingSpaceHeld)){
      event.preventDefault();settlingSpaceHeld=true;
      if(mode==='preparing'&&!event.repeat)announce('Finish your recipe, then choose Ready to pour with Enter or a tap.');
      return;
    }
    if(event.code==='Tab'&&overlays.includes(mode)){
      const panel=document.querySelector('.overlay:not([hidden])');if(panel){const items=[...document.querySelectorAll('.global-utility button:not(:disabled)'),...panel.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),summary')].filter(el=>!el.hidden&&el.getClientRects().length);if(items.length){const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
    }
    if((event.code==='Space'||event.code==='Enter')&&nativeActivation(event.target))return;
    if(event.code==='Space'){
      event.preventDefault();
      if(!event.repeat&&!keyHeld){
        keyHeld=true;
        if(mode==='playing'){cancelPendingPointer();beginInput('key');}
        else if(['finished','result','summary'].includes(mode))primaryAction();
      }
      return;
    }
    if(event.repeat)return;
    if(event.code==='Enter'&&['preparing','playing','finished','result','summary'].includes(mode)){event.preventDefault();cancelPendingPointer();primaryAction();return;}
    if(event.code==='KeyP'||event.code==='Escape'){
      if(['playing','preparing'].includes(mode)){event.preventDefault();pause();}else if(mode==='pause'){event.preventDefault();resume();}else if(mode==='help'){event.preventDefault();closeHelp();}else if(mode==='restart'){event.preventDefault();cancelRestart();}else if(mode==='store'&&event.code==='Escape'){event.preventDefault();leaveStore();}
    }
  }
  function keyUp(event){
    if(event.code==='Space'){
      if(keyHeld||settlingSpaceHeld)event.preventDefault();
      const consumed=settlingSpaceHeld;keyHeld=false;settlingSpaceHeld=false;
      if(!consumed)releaseInput('key');
    }
  }
  document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);
  function downloadAppIcon(){
    if(iconDownloading)return;iconDownloading=true;$('download-icon').disabled=true;
    const image=new Image();
    const finish=()=>{iconDownloading=false;$('download-icon').disabled=false;};
    image.onload=()=>{
      try{
        const iconCanvas=document.createElement('canvas');iconCanvas.width=512;iconCanvas.height=512;
        iconCanvas.getContext('2d').drawImage(image,0,0,512,512);
        iconCanvas.toBlob(blob=>{
          if(!blob){finish();toast('The icon could not be created. Please try again.');return;}
          const url=URL.createObjectURL(blob),link=document.createElement('a');
          link.href=url;link.download='Perfect_Pour_App_Icon.png';document.body.appendChild(link);link.click();link.remove();
          setTimeout(()=>URL.revokeObjectURL(url),5000);finish();toast('App icon downloaded as a 512 × 512 PNG.');
        },'image/png');
      }catch(_){finish();toast('The icon could not be created. Please try again.');}
    };
    image.onerror=()=>{finish();toast('The icon could not be loaded.');};
    image.src=document.querySelector('link[rel="icon"]').href;
  }
  $('app-icon-preview').src=document.querySelector('link[rel="icon"]').href;
  $('download-icon').addEventListener('click',downloadAppIcon);
  window.addEventListener('pagehide',leaveWindow);
  window.addEventListener('storage',event=>{if(event.key!==SAVE_KEY&&event.key!==null)return;try{if(localStorage.getItem(SAVE_KEY)!==lastSavedRaw)handleExternalSave();}catch(_){storageAvailable=false;}});
  updateSoundButton();updateMusicButton();document.querySelector('.game-shell').inert=true;$('start-button').disabled=true;$('start-button').textContent='WARMING UP THE FIZZ…';requestAnimationFrame(frame);
  (async()=>{
    try{
      const bytes=Uint8Array.from(atob(WASM_BASE64),ch=>ch.charCodeAt(0));const result=await WebAssembly.instantiate(bytes,{});engine=result.instance.exports;engine.reset(randomSeed());refreshState();ready=true;
      try{lastSavedRaw=localStorage.getItem(SAVE_KEY);const saved=lastSavedRaw||LEGACY_SAVE_KEYS.map(key=>localStorage.getItem(key)).find(Boolean);if(saved){applySave(JSON.parse(saved));loadedCareer=true;}}catch(_){toast('Your previous save could not be loaded. A fresh shop is ready; you can import a backup.');}
      if(loadedCareer){saveCareer();if(externalSave)return;}
      renderOrder();updateHud();$('start-button').disabled=false;$('start-button').textContent=loadedCareer?(state[F.attempted]&&state[0]===0?'RESUME MY POUR':'BACK TO MY BUSINESS'):'OPEN THE SHOP';
      if(loadedCareer)$('welcome-description').textContent=`Day ${state[F.day]} · ${dollars(state[F.cash])} · ${state[9].toFixed(1)} ★. Your counter is waiting.`;
      $('start-button').focus({preventScroll:true});
    }catch(error){console.error('Perfect Pour could not start:',error);$('boot-error').hidden=false;$('boot-error').textContent='The game couldn’t start. Open this HTML file in a recent version of Chrome, Edge, Firefox, or Safari with JavaScript enabled.';$('start-button').textContent='UNABLE TO OPEN';}
  })();
})();
