/* Perfect Pour V1.06 · A tactile soda counter. Simulation and saves are Rust/Wasm. */
(() => {
  'use strict';
  const WASM_BASE64 = '__WASM_BASE64__';
  const $ = id => document.getElementById(id);
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const dollars = cents => '$' + (cents / 100).toFixed(2);
  const compactNumber = value => {
    const units=['','K','M','B','T'];let unit=0,amount=Math.abs(value);
    while(amount>=1000&&unit<units.length-1){amount/=1000;unit++;}
    amount=Math.round(amount*10)/10;
    if(amount>=1000&&unit<units.length-1){amount/=1000;unit++;}
    return(value<0?'−':'')+amount+units[unit];
  };
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

  const F={cash:20,hardcore:21,attempted:22,holding:23,day:24,goal:25,streak:26,bestStreak:27,combo:28,comboBonus:29,milestone:30,perfectTip:31,serviceTip:32,lifetime:33,owned:34,cost:40,canBuy:46,spendable:47,reserve:48,staffSales:49,wages:50,helperActive:51,specialistActive:52,customers:53,basePay:54,modePay:55,signPay:56,foamScale:57,good:58,net:59,lifetimePerfect:60,bestShift:61,businessLevel:62,previousRating:63,beverageMl:64,pressure:65,waste:66,cleanupSeconds:67,patience:68,patienceLimit:69,menuPrice:70,ingredientCost:71,cleanupCost:72,refund:73,lastNet:74,ingredientTotal:75,cleanupTotal:76,refundTotal:77,signTotal:78,serviceTotal:79,staffOrders:80,staffCapacity:81,demand:82,missed:83,interior:84,catering:85,interiorCost:86,cateringCost:87,nextStreak:88,nextReward:89,hardcoreBest:90,easyBest:91,cleanupSaved:92,training:93,trainingCost:94,tier:95,canPressure:96,speedTip:97,orderedCherries:98,orderedLime:99,orderedSyrup:100,orderedBlend:101,selectedSoda:102,selectedCherries:103,selectedLime:104,selectedSyrup:105,selectedBlend:106,recipeAccuracy:107,recipeLocked:108,canRecipe:109,hasCitrus:110,hasSyrup:111,hasMixer:112,citrusCost:113,syrupCost:114,mixerCost:115,recipePremium:116,selectedAddinCost:117,prepStarted:118,recipeFizz:119,fillStars:120,recipeMistakes:121,prepAllowance:122,orderIsCustom:123,orderedSecondSoda:124,firstShare:125,pourPart:126,partAttempted:127,activeSoda:128,activeTarget:129,firstBeverageMl:130,mixAccuracy:131,mixStars:132,isMix:133,selectedIce:134,iceFizzMultiplier:135};
  // The review build never reads or overwrites a live business automatically.
  // Existing businesses can be explicitly imported through Business tools.
  const SAVE_KEY='perfect-pour-business-v106',LEGACY_SAVE_KEYS=['perfect-pour-business-v104','perfect-pour-business-v103','perfect-pour-business-v102','perfect-pour-business-v101'];
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
  const sodaNames=['Orange','Cherry','Lime','Cola'];
  const targetText=fraction=>String(Math.round(fraction*10000)/100);
  const pressureNames=['Gentle','Classic','Rush'];
  const pressureNotes=['Steady flow · more time to aim','Balanced flow · lively foam','Fast flow · bigger foam risk'];
  const text=(id,value)=>{const el=$(id);if(el&&el.textContent!==String(value))el.textContent=value;};
  const signedMoney=value=>(value<0?'−':'')+dollars(Math.abs(value));
  const scoreText=(value,stars)=>{const next=[0,50,72,88,96][stars];return(Math.floor(Math.min(value,next===undefined?100:next-.01)*10)/10).toFixed(1);};
  const levelValues=()=>[...Array.from(state.slice(F.owned,F.owned+6)),state[F.interior],state[F.catering],state[F.training],state[F.hasCitrus],state[F.hasSyrup],state[F.hasMixer]].map(Math.round);
  const costValues=()=>[...Array.from(state.slice(F.cost,F.cost+6)),state[F.interiorCost],state[F.cateringCost],state[F.trainingCost],state[F.citrusCost],state[F.syrupCost],state[F.mixerCost]];
  let engine,state,mode='intro',returnMode='playing',storeReturn='playing',pauseReturn='preparing',lastFrame=0,simulationClock=0,visualTime=0,lastUi=0;
  let inputOwner=null,activePointer=null,keyHeld=false,settlingSpaceHeld=false,pouring=false,ready=false,lastSpill=0,spillFlash=0,storageAvailable=true,loadedCareer=false,toastTimer;
  let settlingElapsed=0,finishElapsed=0,lastAutosave=0,sceneDirty=true,lastFeedback='',lastSceneKey='',lastSavedRaw=null,externalSave=false;
  let easyPress=null,primaryPress=null,suppressPrimaryClick=false,recipeUiKey='',iconDownloading=false;
  let upgradePage=0,upgradePageSize=1;
  let careerActive=false,menuActivationKey='';
  const blendNames=['Light','Regular','Bold'];
  const activePlayMode=()=>state[F.attempted]===1?'playing':'preparing';
  let settings={sound:true,music:true,musicVolume:1,soundVolume:1};
  try{const raw=JSON.parse(localStorage.getItem('perfect-pour-v1-settings')||'null');if(raw){for(const key of ['sound','music'])if(typeof raw[key]==='boolean')settings[key]=raw[key];for(const key of ['musicVolume','soundVolume'])if(Number.isFinite(raw[key]))settings[key]=clamp(raw[key],0,1);}}catch(_){}
  const overlays=['intro','welcome','result','summary','pause','help','restart'];
  const audio={context:null};
  const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function announce(text){$('announcer').textContent=text;}
  function refreshState(){state=new Float32Array(engine.memory.buffer,engine.state_ptr(),engine.state_len());}
  function randomSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch(_){return(Date.now()^(Math.random()*0xffffffff))>>>0;}}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);announce(message);}
  function setMode(next,focusId){
    if(next!==mode){easyPress=null;primaryPress=null;}
    mode=next;simulationClock=performance.now();sceneDirty=true;
    if(next!=='settling')settlingElapsed=0;
    document.querySelector('.game-shell').inert=overlays.includes(next);
    overlays.forEach(name=>$(name+'-overlay').hidden=name!==next);
    document.querySelector('.game-shell').classList.toggle('is-paused',next==='pause');
    document.body.dataset.gameMode=next;
    if(next==='store'||['preparing','playing','settling','finished','result','summary','intro','welcome','pause'].includes(next)){
      const store=next==='store';document.body.dataset.view=store?'store':'counter';
      $('storefront-view').hidden=!store;$('playfield').hidden=store;$('counter-controls').hidden=store;
      $('counter-tab').classList.toggle('active',!store);$('store-tab').classList.toggle('active',store);
      $('counter-tab').setAttribute('aria-pressed',String(!store));$('store-tab').setAttribute('aria-pressed',String(store));
    }
    const primaryHost=$(next==='summary'?'summary-action-slot':'counter-action-slot');
    if($('pour-button').parentElement!==primaryHost)primaryHost.prepend($('pour-button'));
    if(ready){updateHud();if(next==='store')syncViewportLayout();}
    syncMusic();
    if(focusId)requestAnimationFrame(()=>$(focusId).focus({preventScroll:true}));
  }
  function captureSave(){
    const ptr=engine.save_ptr(),len=engine.save_len();
    const values=Array.from(new Float64Array(engine.memory.buffer,ptr,len));
    return{format:'perfect-pour-business',version:values[0],engine:values};
  }
  function applySave(data){
    const expected=data?.version===101?80:[102,103,104,106].includes(data?.version)?120:0;
    if(!data||data.format!=='perfect-pour-business'||!expected||!Array.isArray(data.engine)||data.engine.length!==expected||data.engine[0]!==data.version||!data.engine.every(Number.isFinite))throw new Error('Choose a Perfect Pour V1.01–V1.06 business save.');
    const ptr=engine.save_ptr(),buffer=new Float64Array(engine.memory.buffer,ptr,engine.save_len());buffer.fill(0);buffer.set(data.engine);
    if(engine.restore_save()!==1)throw new Error('The save data is damaged or contains invalid values.');
    refreshState();
  }
  function saveCareer(){
    if(!ready||!careerActive||externalSave)return;
    try{
      const current=localStorage.getItem(SAVE_KEY);
      if(current!==lastSavedRaw){handleExternalSave();return;}
      const raw=JSON.stringify(captureSave());localStorage.setItem(SAVE_KEY,raw);lastSavedRaw=raw;storageAvailable=true;
    }catch(_){storageAvailable=false;}
    text('save-status',storageAvailable?'Autosaved':'Saving unavailable · export a backup');
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
    a.href=url;a.download=`Perfect_Pour_V106_Day_${Math.round(state[F.day])}_Save.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Business save exported. Keep it somewhere safe.');
  }
  async function importSave(event){
    const file=event.target.files&&event.target.files[0];event.target.value='';if(!file)return;
    try{
      if(file.size>100000)throw new Error('This file is too large to be a game save.');
      const data=JSON.parse(await file.text());
      if(!confirm('Import this business? It will replace the business currently open on this device.'))return;
      let currentRaw=null;try{currentRaw=localStorage.getItem(SAVE_KEY);}catch(_){}applySave(data);lastSavedRaw=currentRaw;externalSave=false;careerActive=true;loadedCareer=true;text('pause-title','Paused');text('pause-description','Your shop can wait.');text('resume-button','RESUME');$('pause-restart').disabled=false;clearInput();saveCareer();if(externalSave)return;renderOrder();storeReturn=state[0]===2?'summary':state[0]===1?'finished':activePlayMode();renderStore();setMode('store','store-back');toast('Business restored. Your cash, upgrades, and records are ready.');
    }catch(error){toast(error instanceof SyntaxError?'That file is not a valid JSON save.':error.message||'The save could not be imported.');}
  }
  function updateModeUi(){
    const hard=state[F.hardcore]===1,locked=state[F.attempted]===1&&state[0]===0||['settling','finished'].includes(mode),mix=state[F.isMix]===1;
    for(const id of ['hardcore-mode','easy-mode']){
      const button=$(id),selected=id.includes('hardcore')===hard;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));button.disabled=locked;
      button.title=locked?'Finish this customer first.':id.includes('hardcore')?'One hold per soda. Final release serves. +15% base pay.':'Pause, top up, then serve.';
    }
    const flow=window.PourFlow.resolve({mode,hardcore:hard,attempted:state[F.attempted]===1,holding:pouring,selectedSoda:state[F.selectedSoda],recipeLocked:state[F.recipeLocked]===1,lastCustomer:state[1]===state[F.goal],isMix:mix,pourPart:state[F.pourPart],partAttempted:state[F.partAttempted]===1,activeName:sodaNames[state[F.activeSoda]],nextName:sodaNames[state[F.orderedSecondSoda]]});
    const action=$('pour-button');action.dataset.action=flow.action;action.disabled=flow.disabled;
    text('primary-label',flow.label);text('primary-hint',flow.hint);
    action.setAttribute('aria-label',flow.label+'. '+flow.hint);
    action.classList.toggle('is-waiting',flow.action==='wait');
    document.body.dataset.difficulty=hard?'hardcore':'easy';
    $('easy-action').hidden=!flow.showEasyAction;$('easy-action').disabled=flow.easyDisabled;
    text('easy-action-label',flow.easyLabel);
    $('easy-action').setAttribute('aria-label',flow.easyLabel+'. Enter or tap');
    $('finish-review').hidden=!['finished','result'].includes(mode);
    $('order-bubble').hidden=['finished','result'].includes(mode);
    document.body.dataset.controlStage=flow.stage;
    $('recipe-workbench').hidden=false;
    $('recipe-workbench').classList.toggle('is-locked',!flow.showRecipe);
    $('pressure-controls').hidden=true;
    document.querySelector('.mode-switch').hidden=!flow.showMode;
    $('mixed-recipe').hidden=flow.showRecipe||state[F.selectedSoda]>3;
    $('edit-recipe').hidden=mode!=='playing'||state[F.attempted]===1;
    const tip=mode==='preparing'?'<strong>Match the order.</strong>':mode==='settling'?'<strong>Let it settle.</strong>':mode==='finished'?'<strong>Made by you.</strong>':hard?'<strong>One hold'+(mix?' per soda.':'. One pour.')+'</strong>':'<strong>Pour at your pace.</strong>';
    if($('tip-text').innerHTML!==tip)$('tip-text').innerHTML=tip;
    for(let i=0;i<3;i++){
      const button=$(['pressure-gentle','pressure-classic','pressure-rush'][i]);
      button.classList.toggle('active',state[F.pressure]===i);button.setAttribute('aria-pressed',String(state[F.pressure]===i));button.disabled=state[F.canPressure]!==1||mode!=='preparing';
    }
    text('pressure-note',pressureNotes[state[F.pressure]]);text('pressure-summary',pressureNames[state[F.pressure]]);
    const dial=$('pressure-dial');
    if(dial){
      dial.value=String(state[F.pressure]);
      dial.disabled=state[F.canPressure]!==1||mode!=='preparing';
      dial.setAttribute('aria-valuetext',pressureNames[state[F.pressure]]+' pressure. '+pressureNotes[state[F.pressure]]);
      dial.closest('.pressure-knob')?.style.setProperty('--pressure-angle',((state[F.pressure]-1)*62)+'deg');
      text('pressure-readout',pressureNames[state[F.pressure]]);
    }
  }
  function changePressure(value){
    if(!ready||mode!=='preparing'||engine.set_pressure(value)!==1)return;
    refreshState();saveCareer();if(externalSave)return;updateHud();sceneDirty=true;$('pressure-controls').open=false;openAudio();playCue('knob');announce(pressureNames[value]+' pressure. '+pressureNotes[value]+'.');
  }
  function changeIce(value){
    if(!ready||externalSave||mode!=='preparing'||state[F.canRecipe]!==1||state[F.selectedSoda]>3||engine.set_ice(value)!==1)return;
    refreshState();saveCareer();if(externalSave)return;updateHud();sceneDirty=true;
    announce(value?value+' '+(value===1?'scoop':'scoops')+' of ice. Extra fizz when you pour.':'No ice.');
  }
  function changeDifficulty(hard){
    if(!ready||pouring)return;
    if(engine.set_mode(hard?1:0)!==1){toast('Finish this pour before changing the mode.');return;}
    refreshState();saveCareer();if(externalSave)return;updateHud();if(mode==='store')renderStore();
    if(mode==='playing')$('pour-button').focus({preventScroll:true});
    if(mode!=='welcome')toast(hard?'Hardcore: one hold per soda. Final release serves. +15% base pay.':'Easy: stop, settle, top up, then serve.');
  }
  function clearInput(){easyPress=null;primaryPress=null;inputOwner=null;activePointer=null;pouring=false;$('pour-button').classList.remove('pressed');document.querySelector('.tap-machine').classList.remove('pouring');stopPourSound();}
  function beginInput(source){
    if(!ready||externalSave||!['preparing','playing'].includes(mode)||inputOwner!==null||state[0]!==0||state[F.selectedSoda]>3)return false;
    advanceSimulation(performance.now());if(engine.begin_pour()!==1)return false;
    refreshState();inputOwner=source;pouring=true;easyPress=null;
    if(mode==='preparing'){$('pressure-controls').open=false;setMode('playing');}
    saveCareer();if(externalSave)return false;setCustomerMood('pouring');$('pour-button').classList.add('pressed');document.querySelector('.tap-machine').classList.add('pouring');openAudio();startPourSound();updateHud();return true;
  }
  function releaseInput(source){
    if(inputOwner!==source)return;
    advanceSimulation(performance.now());const part=state[F.pourPart];clearInput();engine.end_pour();refreshState();
    if(state[0]===1)showCommittedPour();else{setCustomerMood('neutral');saveCareer();if(externalSave)return;updateHud();if(state[F.pourPart]!==part)announceNextPart();}
  }
  function announceNextPart(){
    announce('Part 2: '+sodas[state[F.activeSoda]].name+'. Hold for the final line at '+targetText(state[4])+' percent.');
  }
  function interruptPour(){easyPress=null;if(inputOwner!==null)releaseInput(inputOwner);}
  function startupSaveCurrent(){
    if(externalSave)return false;
    try{if(localStorage.getItem(SAVE_KEY)!==lastSavedRaw){handleExternalSave();return false;}}catch(_){storageAvailable=false;}
    return true;
  }
  function updateMainMenu(){
    $('welcome-overlay').dataset.hasSave=String(loadedCareer);
    $('start-button').disabled=!loadedCareer;
    text('menu-save-info',loadedCareer?`Day ${state[F.day]} · ${dollars(state[F.cash])}`:'');
    $('menu-store-art').innerHTML=window.PourStoreArt.render(shopState());
  }
  function showMainMenu(){
    if(!ready||mode!=='intro'||externalSave)return;
    openAudio();updateMainMenu();setMode('welcome',loadedCareer?'start-button':'new-game-button');
  }
  function newGame(){
    if(!ready||mode!=='welcome'||!startupSaveCurrent())return;
    if(loadedCareer){requestRestart();return;}
    resetBusiness();
  }
  function openShop(){
    if(!ready||mode!=='welcome'||!loadedCareer||!startupSaveCurrent())return;
    careerActive=true;openAudio();saveCareer();if(externalSave)return;
    if(state[0]===1){if(state[7]/state[5]>VISIBLE_FOAM)showCommittedPour();else showFinishedCup(false);return;}if(state[0]===2){showSummary(false);return;}
    renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');saveCareer();if(externalSave)return;playCue('day');announce('Shop open. '+(state[F.isMix]===1?'Two sodas, in order. ':'Match the recipe, then hold Space or the pour button. ')+(state[F.hardcore]?'One hold per soda.':'Easy allows top-ups; use the separate action when ready.'));
  }
  function openNextDay(){
    if(!ready||state[0]!==2)return;
    clearInput();engine.next_day(randomSeed());refreshState();saveCareer();if(externalSave)return;renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');playCue('day');announce(`Day ${state[F.day]}. ${state[F.goal]} customers are coming to your soda bar.`);
  }
  function resetBusiness(){
    if(!ready||!['welcome','restart'].includes(mode)||!startupSaveCurrent())return;
    if(mode==='welcome'&&loadedCareer){requestRestart();return;}
    clearInput();engine.reset(randomSeed());refreshState();careerActive=true;loadedCareer=true;openAudio();saveCareer();if(externalSave)return;renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');playCue('day');announce('Shop open. Match the recipe, then hold Space or the pour button.');
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
    const next=levels[0]===0?'Your first sign':levels[5]===0?'A second station':levels[6]===0?'Your soda lounge':levels[7]===0?'Take it on the road':built<total?'Keep growing':'Your soda empire';
    text('business-goal',next);if($('business-progress'))$('business-progress').style.width=(built/total*100)+'%';
    const staff=state[F.specialistActive]?`${state[F.staffOrders]}/${state[F.staffCapacity]} staff orders · ${dollars(state[F.staffSales])}`:levels[5]?'Specialist starts next day':'Solo counter';
    text('staff-activity',staff);
    text('staff-strip',state[F.specialistActive]?`${state[F.helperActive]?'½ cleanup · ':''}${state[F.staffOrders]}/${state[F.staffCapacity]} staff orders`:state[F.helperActive]?'Helper on duty · ½ cleanup cost':levels[4]?'Helper starts next day':'Solo counter');
  }
  function recipeTokens(ordered=false){
    const values=ordered?[state[F.orderedCherries],state[F.orderedLime],state[F.orderedSyrup],state[F.orderedBlend]]:[state[F.selectedCherries],state[F.selectedLime],state[F.selectedSyrup],state[F.selectedBlend]];
    const tokens=[],labels=['Cherry','Lime','Syrup'],kinds=['cherry','lime','syrup'];
    values.slice(0,3).forEach((n,i)=>{if(n)tokens.push(`<span class="recipe-chip">${window.PourRecipeArt.icon(kinds[i])}<b>×${n}</b><span class="sr-only">${labels[i]}</span></span>`);});
    if(!tokens.length)tokens.push('<span class="recipe-chip plain-chip">Plain</span>');
    if(state[F.hasMixer]&&state[F.isMix]!==1||values[3]!==1)tokens.push(`<span class="recipe-chip blend-chip">${window.PourRecipeArt.icon('water',{blend:values[3]})}<b>${blendNames[values[3]]}</b></span>`);
    return tokens.join('');
  }
  function recipeDescription(){
    const bits=state[F.isMix]===1?[targetText(state[F.firstShare])+' percent '+sodas[state[2]].name+' then '+targetText(1-state[F.firstShare])+' percent '+sodas[state[F.orderedSecondSoda]].name]:[sodas[state[2]].name];
    if(state[F.orderedCherries])bits.push(state[F.orderedCherries]+' '+(state[F.orderedCherries]===1?'cherry':'cherries'));
    if(state[F.orderedLime])bits.push('a lime wedge');
    if(state[F.orderedSyrup])bits.push(state[F.orderedSyrup]+' cherry syrup '+(state[F.orderedSyrup]===1?'pump':'pumps'));
    if(state[F.hasMixer]&&state[F.isMix]!==1||state[F.orderedBlend]!==1)bits.push(state[F.orderedBlend]===0?'extra soda water':state[F.orderedBlend]===2?'bold blend':'regular blend');
    return bits.join(', ')+'. Fill to '+percent(state[4])+' percent.';
  }
  function renderRecipe(){
    const mix=state[F.isMix]===1,part=state[F.pourPart]||0;
    const key=[...Array.from(state.slice(98,107)),state[F.selectedIce],state[F.hasCitrus],state[F.hasSyrup],state[F.hasMixer],state[F.recipeLocked],state[0],state[F.orderedSecondSoda],state[F.firstShare],part,mix].join(':');
    if(key===recipeUiKey)return;recipeUiKey=key;
    if(!$('base-options').children.length){
      $('base-options').innerHTML=['Orange','Cherry','Lime','Cola'].map((name,i)=>`<button id="base-${i}" data-base="${i}" class="base-option" aria-label="${name} soda base" title="${name} soda" aria-pressed="false">${window.PourRecipeArt.icon('base',{soda:i})}<strong>${name}</strong></button>`).join('');
      $('ingredient-options').innerHTML=[['cherries','cherry','Cherries'],['ice','ice','Ice'],['lime','lime','Limes'],['syrup','syrup','Syrup']].map(([field,kind,name])=>`<button data-ingredient="${field}" class="ingredient-option"><span class="ingredient-picture"><span class="station-art">${window.PourRecipeArt.station(kind,0,{available:true})}</span><b id="${field}-count">0</b></span><strong>${name}</strong><small id="${field}-availability" class="ingredient-availability"></small></button>`).join('');
      $('blend-options').innerHTML=blendNames.map((name,i)=>`<button data-blend="${i}" aria-pressed="false">${window.PourRecipeArt.icon('water',{blend:i})}<strong>${name}</strong></button>`).join('');
    }
    $('base-options').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(state[F.selectedSoda]===i));b.disabled=state[F.canRecipe]!==1;});
    $('base-options').hidden=mix;
    const pair=mix?window.PourRecipeArt.renderRatioOrder({first:state[2],second:state[F.orderedSecondSoda],share:state[F.firstShare],part,complete:state[0]!==0}):'';
    $('mix-prep-sequence').hidden=!mix;
    if(mix)$('mix-prep-sequence').innerHTML=pair;
    [['cherries',F.selectedCherries,true,5],['ice',F.selectedIce,true,5],['lime',F.selectedLime,state[F.hasCitrus]===1,5],['syrup',F.selectedSyrup,state[F.hasSyrup]===1,5]].forEach(([name,field,available,max])=>{
      const button=$('ingredient-options').querySelector(`[data-ingredient="${name}"]`),n=state[field],atLimit=n>=max;
      button.hidden=!available;
      text(name+'-count',available?n:'');text(name+'-availability',atLimit?'MAX 5':name==='ice'&&n>0?'Extra fizz':available?'':'Locked');
      const station=button.querySelector('.station-art'),kind=name==='cherries'?'cherry':name;
      if(station)station.innerHTML=window.PourRecipeArt.station(kind,n,{available});
      button.disabled=atLimit||!available||state[F.canRecipe]!==1||state[F.selectedSoda]>3;button.classList.toggle('selected',n>0);button.classList.toggle('at-limit',atLimit);button.classList.toggle('locked',!available);button.setAttribute('aria-pressed',String(n>0));button.setAttribute('aria-label',available?`${name}: ${n} of ${max}. ${atLimit?'Maximum reached.':'Tap to add one.'}`:`${name} locked. Unlock in Build.`);button.title=atLimit?`${name}: 5 of 5 · full`:available?`${name}: ${n} of ${max}. Tap to add.`:'Unlock in Build';
    });
    $('ingredient-options').hidden=false;
    $('blend-controls').hidden=state[F.hasMixer]!==1||mix||state[F.selectedSoda]>3;
    $('blend-options').querySelectorAll('button').forEach((button,i)=>{button.setAttribute('aria-pressed',String(state[F.selectedBlend]===i));button.disabled=state[F.canRecipe]!==1;});
    text('recipe-cost',dollars(state[F.selectedAddinCost]));
    text('prep-heading',state[F.selectedSoda]>3?'CHOOSE SODA':'RECIPE');
    text('prep-target',mix?'1/2 · '+targetText(state[F.activeTarget])+'%':percent(state[4])+'% target');
    $('order-line').classList.toggle('has-ratio',mix);
    if(mix)$('order-line').innerHTML=pair+'<strong>'+percent(state[4])+'%</strong>';
    $('order-recipe').innerHTML=recipeTokens(true);$('order-recipe').setAttribute('aria-label',recipeDescription());
    $('mixed-recipe').innerHTML=(mix?pair:state[F.selectedSoda]<4?'<span class="recipe-chip">'+window.PourRecipeArt.icon('base',{soda:state[F.selectedSoda]})+'<b>'+sodaNames[state[F.selectedSoda]]+'</b></span>':'')+recipeTokens(false);
    const selected=mix?state[F.activeSoda]:state[F.selectedSoda]<4?state[F.selectedSoda]:state[2],soda=sodas[selected];
    document.documentElement.style.setProperty('--soda',window.PourRecipeArt.tint(soda.color,state[F.selectedBlend],state[F.selectedSyrup]));
    text('tap-name',state[F.selectedSoda]<4?soda.name.toUpperCase():'CHOOSE YOUR BASE');text('drink-name',mix?sodaNames[state[2]]+' + '+sodaNames[state[F.orderedSecondSoda]]:sodas[state[2]].name);text('drink-flavor',mix?'Two sodas. Your perfect mix.':sodas[state[2]].flavor);
    text('fizz-label',soda.fizz);text('fizz-note',state[F.selectedBlend]===0?'Light blend · a little more fizz':state[F.selectedBlend]===2?'Bold blend · richer color':soda.note);
    $('fizz-meter').setAttribute('aria-label',soda.fizz.toLowerCase()+' fizz, '+blendNames[state[F.selectedBlend]].toLowerCase()+' blend');
    [...$('fizz-meter').children].forEach((dot,i)=>dot.classList.toggle('on',i<=selected));
    const activeTarget=mix?state[F.activeTarget]:state[4];
    text('target-label',mix?(part===0?'1/2':'2/2'):'TARGET');
    $('target-percent').innerHTML=targetText(activeTarget)+'<small>%</small>';
    text('station-target',(mix?'TOTAL ':'')+percent(state[4])+'%');
    const finalGuide=$('target-track'),firstGuide=$('mix-target-track');
    finalGuide.style.left=(state[4]*100)+'%';finalGuide.classList.toggle('is-active',!mix||part===1);
    finalGuide.style.setProperty('--target-color',mix?sodas[state[F.orderedSecondSoda]].color:'#174b49');
    finalGuide.dataset.step=mix?'2':'';firstGuide.hidden=!mix;
    if(mix){firstGuide.style.left=(state[4]*state[F.firstShare]*100)+'%';firstGuide.style.setProperty('--target-color',sodas[state[2]].color);firstGuide.classList.toggle('is-active',part===0);firstGuide.dataset.step='1';}
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
    const choice=kind==='base'?$('base-'+value)?.querySelector('svg'):kind==='blend'?$('blend-options').querySelector(`[data-blend="${value}"] svg`):$(kind+'-count');
    if(!reducedMotion)choice?.animate?.([{transform:'scale(.84)'},{transform:'scale(1.12)',offset:.55},{transform:'scale(1)'}],{duration:210,easing:'ease-out'});
    if(kind==='base')announce(sodas[value].name+' selected.');
    else if(kind==='blend')announce(blendNames[value]+' blend selected.');
    else announce(value+' '+kind+' selected.');
  }
  function focusPourAfterPointer(event){
    if(event.detail>0&&mode==='preparing'&&state[F.selectedSoda]<4&&!externalSave)$('pour-button').focus({preventScroll:true});
  }
  function editRecipe(){if(mode==='playing'&&state[F.attempted]!==1){setMode('preparing','pour-button');announce('Adjust your recipe before the first pour.');}}
  function renderOrder(){
    const soda=sodas[state[2]],cup=cups[state[3]],order=Math.round(state[1]),target=percent(state[4]);
    document.documentElement.style.setProperty('--soda',soda.color);
    text('customer-name',names[personIndex()]);text('customer-number','GUEST '+String(order).padStart(2,'0'));
    $('order-line').innerHTML=soda.name+'<strong>'+target+'%</strong>';
    text('customer-aside',soda.aside);recipeUiKey='';setCustomerMood('neutral');text('customer-status','YOUR NEXT POUR');
    text('tap-name',soda.name.toUpperCase());text('drink-name',soda.name);text('drink-flavor',soda.flavor);
    text('fizz-label',soda.fizz);text('fizz-note',soda.note);$('fizz-meter').setAttribute('aria-label',soda.fizz.toLowerCase()+' fizz');
    [...$('fizz-meter').children].forEach((dot,i)=>dot.classList.toggle('on',i<=state[2]));
    text('cup-name',cup.name);text('cup-capacity',Math.round(state[5])+' mL');
    $('target-percent').innerHTML=target+'<small>%</small>';text('station-target',target+'%');$('target-track').style.left=target+'%';
    text('payout-multiplier',state[14].toFixed(2)+'×');lastSpill=state[8];spillFlash=0;lastFeedback='';sceneDirty=true;updateHud();
  }
  function comboMessage(){
    const left=Math.max(1,Math.round(state[F.nextStreak]-state[F.streak]));return`${left} to +${dollars(state[F.nextReward])}`;
  }
  function updateMeter(){
    if(!state)return;
    const fill=clamp(state[6]/state[5],0,1),foam=clamp(state[7]/state[5],0,1);
    $('liquid-track').style.width=(fill*100)+'%';$('foam-track').style.left=(fill*100)+'%';$('foam-track').style.width=(Math.min(foam,1-fill)*100)+'%';
    if(state[F.isMix]===1){
      const first=state[F.selectedSoda]<4?state[F.selectedSoda]:state[2],share=state[F.beverageMl]>0?clamp(state[F.firstBeverageMl]/state[F.beverageMl],0,1):1;
      $('liquid-track').style.background=window.PourRecipeArt.mixColor(window.PourRecipeArt.tint(sodas[first].color,state[F.selectedBlend],state[F.selectedSyrup]),window.PourRecipeArt.tint(sodas[state[F.orderedSecondSoda]].color,state[F.selectedBlend],state[F.selectedSyrup]),share);
    }else $('liquid-track').style.background='';
    if($('patience-track'))$('patience-track').style.width=(clamp(state[F.patience],0,1)*100)+'%';
  }
  function updateLiveFeedback(){
    const fill=state[6]/state[5],foam=state[7]/state[5],hard=state[F.hardcore]===1,mix=state[F.isMix]===1,target=mix?state[F.activeTarget]:state[4];
    text('liquid-percent',percent(fill)+'%');text('foam-percent',foam>VISIBLE_FOAM&&foam<.005?'<1%':percent(foam)+'%');
    const remaining=Math.max(0,state[F.patience]*state[F.patienceLimit]);
    text('patience-label',state[0]===1?'Served':state[F.prepStarted]||state[F.attempted]?remaining.toFixed(1)+'s':state[F.patienceLimit].toFixed(0)+'s');
    if($('patience-track'))$('patience-track').classList.toggle('low',state[F.patience]<.25);
    let message=mode==='preparing'?(mix?'Two sodas · in order':'Match their mix'):mix?(state[F.pourPart]+1)+'/2 · '+sodaNames[state[F.activeSoda]]:hard?'One hold · one pour':'Top up or serve',kind='';
    if(state[8]>1){message=`Spill · ${Math.round(state[F.waste])} mL lost`;kind='warning';}
    else if(fill>target+.025){message='Above the line';kind='warning';}
    else if(Math.abs(fill-target)<.025&&fill>.1){message='At the line · still fizzy';kind='ready';}
    else if(foam>.12)message='Leave room for fizz';
    else if(fill>target-.08)message='Almost there…';
    if((state[F.prepStarted]||state[F.attempted])&&state[F.patience]<.12&&state[0]===0){message=state[F.patience]<=0?'Too slow · price falling':'Hurry · tip fading';kind='warning';}
    if(state[0]===1){message=mode==='settling'?'Settling…':state[12]===5?'✦ Perfect pour':`${percent(state[F.beverageMl]/state[5])}% poured · ${percent(state[4])}% ordered`;kind=state[12]===5&&mode!=='settling'?'ready':'';}
    text('live-message',message);$('live-message').className='live-message'+(kind?' '+kind:'');
    if(kind==='warning'&&lastFeedback!==message&&pouring&&lastFeedback!=='warning')announce(message);
    lastFeedback=kind;
    canvas.setAttribute('aria-label',`Cup: ${percent(fill)} percent soda, ${foam>VISIBLE_FOAM&&foam<.005?'less than1':percent(foam)} percent foam. ${mix?'Part '+(state[F.pourPart]+1)+': '+sodas[state[F.activeSoda]].name+'. Active line '+targetText(target)+' percent. Final line ': 'Target '}${percent(state[4])} percent. Soda waste ${Math.round(state[F.waste])} milliliters.`);
  }
  function updateHud(){
    if(!state)return;
    const served=Math.round(state[16]),order=Math.round(state[1]),goal=Math.round(state[F.goal]),hard=state[F.hardcore]===1;
    const fullCash=dollars(state[F.cash]),fullDay=Math.round(state[F.day]);
    text('money',Math.abs(state[F.cash])<100000?fullCash:'$'+compactNumber(state[F.cash]/100));
    $('money-stat').setAttribute('aria-label','Cash '+fullCash);$('money-stat').title='Cash '+fullCash;
    text('rating',state[9].toFixed(1));text('day-label','DAY '+(fullDay<1000?String(fullDay).padStart(2,'0'):compactNumber(fullDay)));
    $('day-label').setAttribute('aria-label','Day '+fullDay);$('day-label').title='Day '+fullDay;
    const count=String(Math.min(order,goal)).padStart(2,'0')+' <small>/ '+goal+'</small>';if($('customer-count').innerHTML!==count)$('customer-count').innerHTML=count;
    text('progress-label',served+' / '+goal);
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
    if(!ready||externalSave||mode!=='playing'||state[F.hardcore]===1||pouring||inputOwner!==null||state[F.holding]===1||state[F.partAttempted]!==1)return;
    advanceSimulation(performance.now());const part=state[F.pourPart];if(engine.serve()!==1)return;refreshState();
    if(state[0]===1)showCommittedPour();else{saveCareer();if(externalSave)return;updateHud();$('pour-button').focus({preventScroll:true});if(state[F.pourPart]!==part)announceNextPart();}
  }
  function showCommittedPour(){
    saveCareer();if(externalSave)return;settlingElapsed=0;finishElapsed=0;
    setCustomerMood('settling');text('customer-status','WATCHING THE FIZZ');
    setMode('settling');announce('Pour committed. Watch it settle. Your cup will stay on screen.');
  }
  function showFinishedCup(celebrate){
    if(celebrate)finishElapsed=0;
    const perfect=state[12]===5;
    setCustomerMood(state[12]>=4?'happy':state[12]<=2?'disappointed':'neutral');
    text('customer-status',perfect?'✦ YOU NAILED IT':state[12]>=4?'ONE HAPPY GUEST':'A POUR TO LEARN FROM');
    renderReview();
    setMode('finished','pour-button');
    announce(`Cup settled. ${Math.round(state[12])} out of 5 stars. ${scoreText(state[11],state[F.fillStars])} percent fill accuracy.${state[F.isMix]===1?' '+Math.floor(state[F.mixAccuracy])+' percent mix accuracy.':''} Net ${signedMoney(state[F.lastNet])}. ${state[1]===state[F.goal]?'Close the day':'Next customer'} when ready.`);
    if(celebrate&&!document.hidden&&document.hasFocus()){
      openAudio();playCue(perfect?'perfect':state[12]>=4?'good':'bad');
      if(state[F.milestone]>0){playCue('streak',{streak:state[F.streak]});confetti();}
    }
  }
  function viewReview(){if(mode==='finished')presentResult(false);}
  function ledgerRow(label,value,extra=''){
    return'<div class="bonus-row '+extra+'"><span>'+label+'</span><strong>'+signedMoney(value)+'</strong></div>';
  }
  function renderReview(){
    const stars=Math.round(state[12]),accuracy=scoreText(state[11],state[F.fillStars]),order=Math.round(state[1]),streak=Math.round(state[F.streak]);
    setCustomerMood(stars>=4?'happy':stars<=2?'disappointed':'neutral');
    const starMarkup='★'.repeat(stars)+'<span class="empty">'+'★'.repeat(5-stars)+'</span>';
    for(const id of ['review-stars','finish-stars']){$(id).innerHTML=starMarkup;$(id).setAttribute('aria-label',stars+' out of 5 stars');}
    const title=['','Try the next cup.','Keep practicing.','Getting there.','Lovely pour!','Perfect pour!'][stars];
    text('result-title',title);text('finish-title',title);text('finish-earned',signedMoney(state[F.lastNet]));text('finish-fill',accuracy+'%');
    const choices=reviewLines[stars],fillError=state[F.beverageMl]/state[5]-state[4],mix=state[F.isMix]===1,actualShare=state[F.beverageMl]>0?clamp(state[F.firstBeverageMl]/state[F.beverageMl],0,1):0;
    text('review-quote',state[F.recipeMistakes]?'“Check my recipe next time!”':mix&&state[F.mixStars]<5?'“A little more '+sodaNames[actualShare>state[F.firstShare]?state[F.orderedSecondSoda]:state[2]]+' next time!”':stars<=2?(fillError<0?'“I was hoping for a fuller cup.”':'“That’s more soda than I ordered.”'):choices[(order+state[F.day]-2)%choices.length]);
    text('result-eyebrow',state[F.refund]>0&&state[F.basePay]===0?'ORDER REFUNDED':'GUEST REVIEW');
    text('result-recipe-label',mix?'RECIPE + MIX':'RECIPE');
    text('finish-recipe-label',mix?'Recipe + mix':'Recipe');text('finish-recipe',Math.floor(mix?Math.min(state[F.recipeAccuracy],state[F.mixAccuracy]):state[F.recipeAccuracy])+'%');
    $('result-recipe').innerHTML=Math.floor(mix?Math.min(state[F.recipeAccuracy],state[F.mixAccuracy]):state[F.recipeAccuracy])+'<small>%</small>';
    $('result-accuracy').innerHTML=accuracy+'<small>%</small>';text('result-earned',signedMoney(state[F.lastNet]));
    $('result-details').innerHTML=mix?`<span>◉ ${percent(state[F.beverageMl]/state[5])}% / ${percent(state[4])}% fill</span><span>Mix ${percent(actualShare)}/${100-percent(actualShare)} · goal ${percent(state[F.firstShare])}/${100-percent(state[F.firstShare])}</span>`+(state[F.waste]>.5?`<span>◒ ${Math.round(state[F.waste])} mL wasted</span>`:''):`<span>◎ ${percent(state[4])}% target</span><span>◉ ${percent(state[F.beverageMl]/state[5])}% poured</span><span>◒ ${Math.round(state[F.waste])} mL wasted</span>`;
    const missing=[];const mask=state[F.recipeMistakes];
    if(mask&1)missing.push('Base: '+sodas[state[2]].name);if(mask&2)missing.push('Cherries: '+state[F.orderedCherries]);if(mask&4)missing.push('Lime: '+state[F.orderedLime]);if(mask&8)missing.push('Syrup: '+state[F.orderedSyrup]);if(mask&16)missing.push('Blend: '+blendNames[state[F.orderedBlend]]);
    $('result-details').innerHTML+=(missing.length?'<span class="recipe-error">Requested '+missing.join(' · ')+'</span>':'<span class="recipe-exact">✓ '+(mix?'Ingredients matched':'Recipe exact')+'</span>');
    document.querySelector('.receipt-details').open=false;
    text('result-combo',streak>0?(state[F.milestone]>0?`✦ ${streak} in a row · +${dollars(state[F.milestone])}`:`${streak} good ${streak===1?'pour':'pours'} · ${state[F.combo].toFixed(2)}×`):'Next cup, new streak.');
    const rows=[['Soda sale',state[F.basePay]],['Streak',state[F.comboBonus]],['Milestone',state[F.milestone]],['Perfect tip',state[F.perfectTip]],['Service tips',state[F.serviceTip]],['Ingredients',-state[F.ingredientCost]],['Cleanup',-state[F.cleanupCost]]];
    $('bonus-breakdown').innerHTML=rows.filter((r,i)=>i===0||r[1]!==0).map(([label,value])=>ledgerRow(label,value)).join('')+(state[F.refund]>0?'<p class="ledger-note">'+dollars(state[F.refund])+(state[F.basePay]===0?' sale voided · no charge to the guest.':' quality/service discount · already reflected above.')+'</p>':'');
    text('old-rating',state[F.previousRating].toFixed(1));text('new-rating',state[9].toFixed(1));
    const delta=state[9]-state[F.previousRating];
    text('next-price-note',order===state[F.goal]?'Day complete':delta>.025?'Better reputation · better prices':delta<-.025?'Reputation down':'Reputation steady');
  }
  function presentResult(celebrate){
    clearInput();refreshState();renderReview();
    const stars=Math.round(state[12]),accuracy=scoreText(state[11],state[F.fillStars]),streak=Math.round(state[F.streak]);
    saveCareer();if(externalSave)return;setMode('result','close-result');
    if(celebrate)playCue(stars===5?'perfect':stars>=4?'good':'bad');
    announce(`${stars} ${stars===1?'star':'stars'}. ${accuracy} percent fill accuracy.${state[F.isMix]===1?' '+Math.floor(state[F.mixAccuracy])+' percent mix accuracy.':''} Net ${signedMoney(state[F.lastNet])}. ${streak} good ${streak===1?'pour':'pours'} in a row.`);
  }
  function nextOrder(){
    if(mode!=='finished')return;clearInput();engine.next_order();refreshState();saveCareer();if(externalSave)return;
    if(state[0]===2){showSummary(true);return;}
    renderOrder();setMode(activePlayMode(),state[F.selectedSoda]<4?'pour-button':'base-0');announce(recipeDescription()+(state[F.isMix]===1?' Pour the highlighted soda first.':''));
  }
  function showSummary(celebrate){
    const rating=state[9],goal=state[F.goal];
    $('day-ledger').open=false;
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
  function upgradeCapacity(){
    return window.innerWidth>=1100&&window.innerHeight>=850?4:window.innerWidth>=900&&window.innerHeight>=680?2:1;
  }
  function renderUpgradePage(){
    const size=upgradeCapacity(),previousFirst=upgradePage*upgradePageSize;
    upgradePage=Math.min(Math.ceil(upgrades.length/size)-1,Math.floor(previousFirst/size));upgradePageSize=size;
    const first=upgradePage*size,last=Math.min(upgrades.length,first+size),pages=Math.ceil(upgrades.length/size),levels=levelValues(),costs=costValues();
    $('upgrade-grid').dataset.pageSize=String(size);
    $('upgrade-grid').innerHTML=upgrades.slice(first,first+size).map((item,offset)=>{
      const i=first+offset;
      const level=levels[i],maxed=level>=item.max,cost=costs[i],affordable=state[F.spendable]>=cost;
      const prerequisite=i===7&&(!levels[6]||!levels[5])?'Needs lounge + specialist':i===8&&!levels[5]?'Needs a specialist':'';
      const canBuy=state[F.canBuy]===1&&!maxed&&affordable&&!prerequisite;
      const status=maxed?(i===4||i===5?(state[i===4?F.helperActive:F.specialistActive]?'ON DUTY':'STARTS TOMORROW'):'FULLY BUILT'):prerequisite||(!affordable?`${dollars(Math.max(0,cost-state[F.spendable]))} to go`:state[F.canBuy]!==1?'Finish your cup first':'READY');
      const icon=window.PourStoreArt.upgradeIcon?window.PourStoreArt.upgradeIcon(i,level):'✦';
      const timing=!maxed?([4,5].includes(i)?'Starts next day':[1,6,7,8].includes(i)?'Capacity next day':''):'';
      return `<article class="upgrade-card${maxed?' maxed':''}${prerequisite?' locked':''}"><div class="upgrade-icon" aria-hidden="true">${icon}</div><div class="upgrade-copy"><span class="upgrade-level">${item.unit} · ${level}/${item.max}</span><h3>${item.name}</h3><div class="upgrade-effect">${maxed?item.owned(level):item.effect(level)}</div>${timing?'<span class="upgrade-timing">'+timing+'</span>':''}</div><button class="buy-button" data-item="${i}" ${canBuy?'':'disabled'} aria-label="${maxed?item.name+' fully owned':(i===4||i===5?'Hire ':'Build ')+item.name+' for '+dollars(cost)}">${maxed?'✓ OWNED':`${i===4||i===5?'HIRE':'BUILD'} <strong>${dollars(cost)}</strong>`}</button><span class="upgrade-status">${status}</span><details class="upgrade-info" name="upgrade-info"><summary aria-label="About ${item.name}" title="About ${item.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/></svg></summary><div class="upgrade-info-panel"><strong>${item.name}</strong><p>${item.description}</p><p>${level?'Current: '+item.owned(level):'Next: '+item.effect(level)}</p></div></details></article>`;
    }).join('');
    text('upgrade-page',(upgradePage+1)+' / '+pages);
    $('upgrade-page').setAttribute('aria-label',`Page ${upgradePage+1} of ${pages}. Upgrades ${first+1} to ${last} of ${upgrades.length}.`);
    $('upgrade-page').title=`Upgrades ${first+1}–${last} of ${upgrades.length}`;
    $('upgrade-prev').disabled=upgradePage===0;$('upgrade-next').disabled=upgradePage===pages-1;
  }
  function changeUpgradePage(direction){
    if(!ready||mode!=='store')return;
    upgradePage=clamp(upgradePage+direction,0,Math.ceil(upgrades.length/upgradePageSize)-1);
    renderUpgradePage();
  }
  function renderStore(){
    refreshState();const levels=levelValues();
    $('store-art').innerHTML=window.PourStoreArt.render(shopState());
    $('store-art').setAttribute('aria-label',`Your soda bar: sign level ${levels[0]}, patio ${levels[1]}, awning ${levels[2]}, tap ${levels[3]}, ${levels[4]+levels[5]} employees, lounge ${levels[6]}, catering ${levels[7]}, training ${levels[8]}.`);
    text('store-spendable',dollars(state[F.spendable]));text('store-reserve',dollars(state[F.reserve]));text('store-lifetime',dollars(state[F.lifetime]));
    text('store-description',`Day ${state[F.day]} · ${state[9].toFixed(1)} ★ · ${state[F.customers]} guests`);
    text('store-rule',state[F.canBuy]!==1?'Finish this cup to build':'Staff & seats: next day');
    renderUpgradePage();
    text('store-back',state[0]===2?'OPEN DAY '+(state[F.day]+1):'BACK TO POUR');
    updateHud();
  }
  function enterStore(){
    if(!ready||externalSave||['intro','welcome','settling','restart','help'].includes(mode))return;
    interruptPour();
    // Releasing Hardcore may commit a cup. Never hide that physical handoff.
    if(mode==='settling')return;
    storeReturn=mode==='finished'?'finished':state[0]===2?'summary':state[0]===1?'result':mode==='playing'?'playing':'preparing';
    renderStore();setMode('store','store-back');
  }
  function leaveStore(){
    if(mode!=='store')return;
    if(state[0]===2){openNextDay();return;}
    if(state[0]===1){if(state[7]/state[5]>VISIBLE_FOAM)showCommittedPour();else showFinishedCup(false);return;}
    renderOrder();setMode(state[F.attempted]?'playing':storeReturn==='playing'?'playing':'preparing',state[F.selectedSoda]<4?'pour-button':'base-0');
  }
  function buyUpgrade(index){
    if(mode!=='store'||!Number.isInteger(index)||index<0||index>=upgrades.length)return;
    if(engine.buy(index)!==1){toast('That upgrade needs more cash or another building first.');return;}
    refreshState();saveCareer();if(externalSave)return;renderStore();playCue('purchase');
    if(!reducedMotion)$('store-art').animate?.([{filter:'brightness(1)'},{filter:'brightness(1.12)',offset:.35},{filter:'brightness(1)'}],{duration:500,easing:'ease-out'});
    toast((index===4||index===5)?`${upgrades[index].name} joins tomorrow.`:[1,6,7,8].includes(index)?`${upgrades[index].name} built. New capacity starts tomorrow.`:`${upgrades[index].name} upgraded.`);
    const replacement=$('upgrade-grid').querySelector(`[data-item="${index}"]`);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});else $('store-back').focus({preventScroll:true});
  }
  function pause(){
    if(mode==='store')return;
    if(!['playing','preparing'].includes(mode))return;pauseReturn=mode;interruptPour();if(!['playing','preparing'].includes(mode))return;setMode('pause','resume-button');announce('Game paused.');
  }
  function resume(){if(mode==='pause'){if(externalSave){window.location.reload();return;}openAudio();setMode(state[F.attempted]?'playing':pauseReturn,'pour-button');}}
  function showHelp(){
    if(!ready||!['preparing','playing','pause','store','intro','welcome','settling','finished','result','summary'].includes(mode))return;
    interruptPour();returnMode=mode;setMode('help','close-help');
  }
  function closeHelp(){if(mode==='help')setMode(returnMode,returnMode==='intro'?'intro-start':returnMode==='welcome'?'menu-settings':returnMode==='pause'?'resume-button':returnMode==='store'?'store-back':returnMode==='result'?'close-result':returnMode==='settling'?'help-button':'pour-button');}
  function requestRestart(){if(!['store','welcome'].includes(mode))return;returnMode=mode;setMode('restart','cancel-restart');}
  function cancelRestart(){if(mode==='restart')setMode(returnMode,returnMode==='welcome'?'new-game-button':'store-back');}
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
  function startPourSound(){if(settings.sound&&audio.context)window.PerfectPourSounds?.startPour(state?state[F.activeSoda]??(state[F.selectedSoda]<4?state[F.selectedSoda]:0):0,state?.[F.selectedIce]||0,state?.[F.pressure]??1);}
  function stopPourSound(){window.PerfectPourSounds?.stopPour();}
  function soundToggle(){
    settings.sound=!settings.sound;saveSettings();updateSoundButton();window.PerfectPourSounds?.setEnabled(settings.sound);
    if(settings.sound){openAudio();if(pouring)startPourSound();}else window.PerfectPourSounds?.suspend();
  }
  function updateSoundButton(){const b=$('sound-button');b.classList.toggle('muted',!settings.sound);b.setAttribute('aria-label',settings.sound?'Turn sound effects off':'Turn sound effects on');b.setAttribute('aria-pressed',String(settings.sound));b.title=settings.sound?'Sound effects on':'Sound effects off';}
  function syncMusic(){
    if(!window.PourMusic)return;
    const allowed=settings.music&&audio.context&&!document.hidden&&document.hasFocus()&&['welcome','preparing','playing','settling','finished','result','summary','store'].includes(mode);
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
    const original=cups[index],cup={...original,height:original.height*1.2,top:original.top*1.2,bottom:original.bottom*1.2,curve:original.curve*1.2},bottom=380,top=bottom-cup.height,n=240,volume=[0];let sum=0;
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
  function draw(dt=0){
    if(!ctx)return;
    const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),pixelW=Math.round(r.width*dpr),pixelH=Math.round(r.height*dpr);
    if(canvas.width!==pixelW||canvas.height!==pixelH){canvas.width=pixelW;canvas.height=pixelH;}
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,pixelW,pixelH);
    const scale=Math.min(pixelW/520,pixelH/430);
    ctx.setTransform(scale,0,0,scale,(pixelW-520*scale)/2,(pixelH-430*scale)/2);
    const s=state||[0,1,0,0,.65,280,0,0,0],mix=s[F.isMix]===1,firstIndex=s[F.selectedSoda]<4?s[F.selectedSoda]:s[2],rawSoda=sodas[mix?s[F.activeSoda]:firstIndex],soda={...rawSoda,color:window.PourRecipeArt.tint(rawSoda.color,s[F.selectedBlend]??1,s[F.selectedSyrup]||0),light:window.PourRecipeArt.tint(rawSoda.light,s[F.selectedBlend]??1,s[F.selectedSyrup]||0)},g=cupGeometry(s[3]),t=visualTime;
    let drink=soda;
    if(mix){
      const share=s[F.beverageMl]>0?clamp(s[F.firstBeverageMl]/s[F.beverageMl],0,1):1,first=sodas[firstIndex],second=sodas[s[F.orderedSecondSoda]],tint=color=>window.PourRecipeArt.tint(color,s[F.selectedBlend],s[F.selectedSyrup]);
      drink={color:window.PourRecipeArt.mixColor(tint(first.color),tint(second.color),share),light:window.PourRecipeArt.mixColor(tint(first.light),tint(second.light),share)};
    }
    const fill=clamp(s[6]/s[5],0,1),foam=clamp(s[7]/s[5],0,1),liquidY=g.level(fill),foamY=g.level(fill+foam),targetY=g.level(s[4]);
    window.BarLiquid.draw(ctx,{
      g,cupIndex:s[3],fill,foam,soda,drink,pouring,mode,time:t,dt,reducedMotion,
      pressure:s[F.pressure]||0,cherries:s[F.selectedCherries]||0,
      lime:s[F.selectedLime]||0,syrup:s[F.selectedSyrup]||0,ice:s[F.selectedIce]||0,fizzMultiplier:s[F.iceFizzMultiplier]||1,
      spillMl:s[8]||0,customerKey:[s[F.day]||1,s[1]||1,s[3]].join(':'),stars:s[12]||0
    });
    // Dashed requested level, mapped from volume (not a naïve cup-height percent).
    const currentTarget=mix?s[F.activeTarget]:s[4],currentY=g.level(currentTarget);
    const guide=(y,color,active)=>{ctx.save();ctx.setLineDash(active?[6,4]:[3,5]);ctx.strokeStyle=color;ctx.globalAlpha=active?1:.6;ctx.lineWidth=active?2.5:1.5;ctx.beginPath();ctx.moveTo(260-g.cup.top/2-24,y);ctx.lineTo(260+g.cup.top/2+27,y);ctx.stroke();ctx.restore();};
    if(mix){
      const firstY=g.level(s[4]*s[F.firstShare]),firstActive=s[F.pourPart]===0;
      guide(firstY,sodas[s[2]].color,firstActive);guide(targetY,sodas[s[F.orderedSecondSoda]].color,!firstActive);
      const quietY=firstActive?targetY:firstY,quietWidth=firstActive?67:27,quietX=260-g.cup.top/2-25-quietWidth;
      roundedRect(quietX,quietY-12,quietWidth,24,7);ctx.fillStyle='#fffaf0e8';ctx.fill();ctx.strokeStyle=firstActive?sodas[s[F.orderedSecondSoda]].color:sodas[s[2]].color;ctx.lineWidth=1.5;ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#174b49';ctx.font='bold 13px Trebuchet MS';ctx.fillText(firstActive?'2 · '+percent(s[4])+'%':'1',quietX+quietWidth/2,quietY+4);
    }else{ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='#174b49c4';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(260-g.cup.top/2-24,targetY);ctx.lineTo(260+g.cup.top/2+27,targetY);ctx.stroke();ctx.restore();}
    const tagX=260+g.cup.top/2+24,targetLabel=targetText(currentTarget)+'%';roundedRect(tagX,currentY-18,61,36,10);ctx.fillStyle='#fffaf0';ctx.fill();ctx.strokeStyle=mix?soda.color:'#174b49';ctx.lineWidth=mix?2.5:1.5;ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#174b49';ctx.font='bold '+(targetLabel.length>5?20:23)+'px Trebuchet MS';ctx.fillText(targetLabel,tagX+30.5,currentY+.5);
    if(mode==='finished'&&s[12]===5&&window.PourFinish)window.PourFinish.draw(ctx,{top:g.top,bottom:g.bottom,widthAt:g.width,centerX:260,time:finishElapsed,reducedMotion});
  }

  // Flush elapsed time on input transitions as well as frames. The Rust engine
  // owns whether a pour is active, whether an attempt is spent, and its payout.
  function advanceSimulation(now){
    const elapsed=simulationClock?clamp((now-simulationClock)/1000,0,3):0;simulationClock=now;
    if(ready&&!document.hidden&&((['preparing','playing'].includes(mode)&&state[0]===0)||(['settling','finished','result'].includes(mode)&&state[0]===1))){
      let remaining=elapsed;while(remaining>.000001){const step=Math.min(remaining,.1);engine.step(step,0);remaining-=step;}refreshState();
      if(state[8]>lastSpill+.03){spillFlash=1.2;if(lastSpill<.1)playCue('spill');}
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
      const barActive=['preparing','playing','settling','finished'].includes(mode)&&!reducedMotion;
      if(barActive)visualTime+=dt;
      const serving=['preparing','playing'].includes(mode)&&(state[F.prepStarted]||state[F.attempted]);
      if(physical||serving){updateMeter();if(now-lastUi>120){updateLiveFeedback();lastUi=now;}}
      if((pouring||serving)&&now-lastAutosave>500){saveCareer();if(externalSave)return;lastAutosave=now;}
      const fizzAudible=document.hasFocus()&&(mode==='settling'||mode==='playing');
      window.PerfectPourSounds?.updateFoam(state[7]/state[5],state[F.activeSoda]??(state[F.selectedSoda]<4?state[F.selectedSoda]:state[2]),fizzAudible);
      if(mode!=='store'&&(sceneDirty||physical||shine||barActive)){draw(barActive?dt:0);sceneDirty=false;}
    }else if(sceneDirty&&!document.hidden){draw();sceneDirty=false;}
    requestAnimationFrame(frame);
  }
  function syncViewportLayout(){
    sceneDirty=true;
    if(ready&&mode==='store'&&upgradeCapacity()!==upgradePageSize)renderUpgradePage();
  }
  window.addEventListener('resize',syncViewportLayout);
  if(window.ResizeObserver){
    const viewportObserver=new ResizeObserver(syncViewportLayout);
    viewportObserver.observe(canvas);viewportObserver.observe(document.documentElement);
  }
  function primaryAction(){
    if(!ready||externalSave||$('pour-button').disabled)return;
    const action=$('pour-button').dataset.action;
    if(action==='next')nextOrder();
    else if(action==='nextDay')openNextDay();
    else if(action==='pour')announce('Hold Space or hold the button to pour.');
  }
  function primaryPointerDown(event){
    if(event.button!==0||event.isPrimary===false)return;
    if(inputOwner!==null){primaryPress=null;suppressPrimaryClick=true;event.preventDefault();return;}
    suppressPrimaryClick=false;
    primaryPress={id:event.pointerId,action:$('pour-button').dataset.action,mode,released:false};
    if($('pour-button').disabled||mode==='settling'){suppressPrimaryClick=true;event.preventDefault();return;}
    if(!['preparing','playing'].includes(mode))return;
    const action=$('pour-button').dataset.action;
    if(action!=='pour')return;
    event.preventDefault();suppressPrimaryClick=true;
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch(_){}
    if(beginInput('pointer'))activePointer=event.pointerId;
  }
  function releasePointer(event){
    if(primaryPress&&primaryPress.id===event.pointerId)primaryPress.released=true;
    if(inputOwner==='pointer'&&(activePointer===null||event.pointerId===activePointer))releaseInput('pointer');
  }
  function releasePrimaryCapture(event){
    // Touch and pen release their implicit capture after pointerup, before click.
    // Keep that completed tap; capture lost before release still cancels it.
    if(primaryPress&&primaryPress.id===event.pointerId&&primaryPress.released)return;
    cancelPrimaryPointer(event);
  }
  function cancelPrimaryPointer(event){
    if(easyPress&&easyPress.id===event.pointerId)easyPress=null;
    if(primaryPress&&primaryPress.id===event.pointerId)primaryPress=null;
    if(inputOwner==='pointer'&&(activePointer===null||event.pointerId===activePointer))releaseInput('pointer');
  }
  function easyPointerDown(event){
    if(event.button!==0||event.isPrimary===false)return;
    const valid=ready&&!externalSave&&mode==='playing'&&state[F.hardcore]!==1&&!pouring&&inputOwner===null&&state[F.holding]!==1&&state[F.partAttempted]===1;
    easyPress={id:event.pointerId,part:state[F.pourPart],valid};
    if(!valid)event.preventDefault();
  }
  function easyAction(event){
    if(event&&event.detail>0){
      const press=easyPress;easyPress=null;
      if(!press||!press.valid||press.part!==state[F.pourPart])return;
    }
    serveDrink();
  }
  function primaryClick(event){
    const press=primaryPress;primaryPress=null;
    if(event.detail!==0&&(suppressPrimaryClick||!press||press.action!==$('pour-button').dataset.action||press.mode!==mode)){suppressPrimaryClick=false;event.preventDefault();return;}
    suppressPrimaryClick=false;primaryAction();
  }
  $('pour-button').addEventListener('pointerdown',primaryPointerDown);
  window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',cancelPrimaryPointer);
  $('pour-button').addEventListener('lostpointercapture',releasePrimaryCapture);
  $('pour-button').addEventListener('contextmenu',event=>event.preventDefault());
  $('pour-button').addEventListener('click',primaryClick);
  $('easy-action').addEventListener('pointerdown',easyPointerDown);$('easy-action').addEventListener('click',easyAction);
  $('finish-details').addEventListener('click',viewReview);$('close-result').addEventListener('click',()=>{if(mode==='result')showFinishedCup(false);});
  $('intro-start').addEventListener('click',showMainMenu);$('new-game-button').addEventListener('click',newGame);$('menu-settings').addEventListener('click',showHelp);
  $('start-button').addEventListener('click',openShop);$('edit-recipe').addEventListener('click',editRecipe);
  $('base-options').addEventListener('click',event=>{const button=event.target.closest('button[data-base]');if(button&&!button.disabled){changeRecipe('base',Number(button.dataset.base));focusPourAfterPointer(event);}});
  $('ingredient-options').addEventListener('click',event=>{
    const button=event.target.closest('button[data-ingredient]');if(!button||button.disabled)return;
    const kind=button.dataset.ingredient,field={cherries:F.selectedCherries,lime:F.selectedLime,syrup:F.selectedSyrup,ice:F.selectedIce}[kind],max=5;
    if(field===undefined)return;
    const next=Math.min(max,state[field]+1);
    if(kind==='ice')changeIce(next);else changeRecipe(kind,next);
    openAudio();playCue('ingredient',{kind:kind==='cherries'?'cherry':kind});focusPourAfterPointer(event);
  });
  $('blend-options').addEventListener('click',event=>{const button=event.target.closest('button[data-blend]');if(button&&!button.disabled){changeRecipe('blend',Number(button.dataset.blend));focusPourAfterPointer(event);}});
  $('sound-button').addEventListener('click',soundToggle);$('music-button').addEventListener('click',musicToggle);$('pause-button').addEventListener('click',pause);$('resume-button').addEventListener('click',resume);$('help-button').addEventListener('click',showHelp);$('close-help').addEventListener('click',closeHelp);
  for(const id of ['store-tab','restart-button','pause-restart','result-store','summary-store'])$(id).addEventListener('click',enterStore);
  $('store-back').addEventListener('click',leaveStore);$('counter-tab').addEventListener('click',()=>{if(mode==='store')leaveStore();});
  $('brand-home').addEventListener('click',event=>{event.preventDefault();enterStore();});
  $('hardcore-mode').addEventListener('click',event=>{changeDifficulty(true);focusPourAfterPointer(event);});
  $('easy-mode').addEventListener('click',event=>{changeDifficulty(false);focusPourAfterPointer(event);});
  ['pressure-gentle','pressure-classic','pressure-rush'].forEach((id,index)=>$(id)?.addEventListener('click',event=>{changePressure(index);focusPourAfterPointer(event);}));
  $('pressure-dial')?.addEventListener('input',event=>changePressure(Math.round(Number(event.target.value))));
  // Return pointer users to the primary control only after the knob gesture
  // finishes; arrow-key edits retain focus on the native accessible range.
  $('pressure-dial')?.addEventListener('click',focusPourAfterPointer);
  for(const [id,key,module] of [['music-volume','musicVolume','PourMusic'],['sound-volume','soundVolume','PerfectPourSounds']]){const slider=$(id);if(slider){slider.value=settings[key]*100;slider.addEventListener('input',()=>{settings[key]=clamp(Number(slider.value)/100,0,1);window[module]?.setVolume(settings[key]);saveSettings();});}}
  $('upgrade-grid').addEventListener('click',event=>{const button=event.target.closest('button[data-item]');if(button&&!button.disabled)buyUpgrade(Number(button.dataset.item));});
  $('upgrade-prev').addEventListener('click',()=>changeUpgradePage(-1));$('upgrade-next').addEventListener('click',()=>changeUpgradePage(1));
  $('export-save').addEventListener('click',exportSave);$('import-save').addEventListener('click',()=>$('import-file').click());$('import-file').addEventListener('change',importSave);
  $('reset-business').addEventListener('click',requestRestart);$('confirm-restart').addEventListener('click',resetBusiness);$('cancel-restart').addEventListener('click',cancelRestart);
  const leaveWindow=()=>{interruptPour();keyHeld=false;settlingSpaceHeld=false;menuActivationKey='';if(['playing','preparing'].includes(mode))pause();saveCareer();if(externalSave)return;window.PourMusic?.stop();window.PerfectPourSounds?.suspend();};window.addEventListener('blur',leaveWindow);window.addEventListener('focus',syncMusic);document.addEventListener('visibilitychange',()=>{if(document.hidden)leaveWindow();else syncMusic();});
  function nativeActivation(target){const control=target instanceof Element?target.closest('button,a,input,textarea,select,summary,[contenteditable="true"]'):null;return control&&control.id!=='pour-button';}
  function keyDown(event){
    // Discrete activation belongs to its original control until keyup, even
    // when serving or closing a menu changes focus underneath a held Enter.
    if(menuActivationKey===event.code){event.preventDefault();return;}
    if(['intro','welcome'].includes(mode)&&['Enter','Space'].includes(event.code)){
      if(event.repeat){event.preventDefault();return;}
      menuActivationKey=event.code;
      if(!nativeActivation(event.target)){event.preventDefault();if(mode==='intro')showMainMenu();}
      return;
    }
    if(event.code==='Enter'){
      if(event.repeat){event.preventDefault();return;}
      menuActivationKey=event.code;
    }
    // A Space pressed before pouring is ready cannot turn into a different
    // action when the primary button changes its role while that key is held.
    if(event.code==='Space'&&(((mode==='settling'||mode==='preparing'&&state[F.selectedSoda]>3)&&!nativeActivation(event.target))||settlingSpaceHeld)){
      event.preventDefault();settlingSpaceHeld=true;
      if(mode==='preparing'&&!event.repeat)announce('Choose a soda base, then hold Space to pour.');
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
        if(['preparing','playing'].includes(mode))beginInput('key');
        else if(['finished','summary'].includes(mode))primaryAction();
      }
      return;
    }
    if(event.repeat)return;
    if(event.code==='Enter'&&['preparing','playing','finished','summary'].includes(mode)){
      event.preventDefault();
      if(mode==='playing'&&state[F.hardcore]!==1&&state[F.partAttempted]===1)easyAction();else primaryAction();
      return;
    }
    if(event.code==='KeyP'||event.code==='Escape'){
      if(['playing','preparing'].includes(mode)){event.preventDefault();pause();}else if(mode==='pause'){event.preventDefault();resume();}else if(mode==='help'){event.preventDefault();closeHelp();}else if(mode==='restart'){event.preventDefault();cancelRestart();}else if(mode==='store'&&event.code==='Escape'){event.preventDefault();leaveStore();}
    }
  }
  function keyUp(event){
    if(menuActivationKey===event.code){menuActivationKey='';return;}
    if(event.code==='Space'){
      if(keyHeld||settlingSpaceHeld)event.preventDefault();
      const consumed=settlingSpaceHeld;keyHeld=false;settlingSpaceHeld=false;
      if(!consumed)releaseInput('key');
    }
  }
  document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);
  function cancelZoomGesture(event){if(event.cancelable)event.preventDefault();}
  function cancelMultiTouchZoom(event){if(event.touches.length>1)cancelZoomGesture(event);}
  for(const name of ['gesturestart','gesturechange'])document.addEventListener(name,cancelZoomGesture,{passive:false});
  document.addEventListener('touchstart',cancelMultiTouchZoom,{passive:false});
  document.addEventListener('touchmove',cancelMultiTouchZoom,{passive:false});
  document.addEventListener('wheel',event=>{if(event.ctrlKey)cancelZoomGesture(event);},{passive:false});
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
  updateSoundButton();updateMusicButton();setMode('intro');$('intro-start').disabled=true;$('start-button').disabled=true;requestAnimationFrame(frame);
  (async()=>{
    try{
      const bytes=Uint8Array.from(atob(WASM_BASE64),ch=>ch.charCodeAt(0));const result=await WebAssembly.instantiate(bytes,{});engine=result.instance.exports;engine.reset(randomSeed());refreshState();ready=true;
      try{lastSavedRaw=localStorage.getItem(SAVE_KEY);const saved=lastSavedRaw||LEGACY_SAVE_KEYS.map(key=>localStorage.getItem(key)).find(Boolean);if(saved){applySave(JSON.parse(saved));loadedCareer=true;}}catch(_){toast('Your previous save could not be loaded. A fresh shop is ready; you can import a backup.');}
      renderOrder();updateHud();updateMainMenu();$('intro-start').disabled=false;
      $('intro-start').focus({preventScroll:true});
    }catch(error){console.error('Perfect Pour could not start:',error);$('boot-error').hidden=false;$('boot-error').textContent='The game couldn’t start. Open this HTML file in a recent version of Chrome, Edge, Firefox, or Safari with JavaScript enabled.';$('intro-start').disabled=true;}
  })();
})();
