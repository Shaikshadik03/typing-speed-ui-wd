'use strict';
const byId = id => document.getElementById(id);
const level=byId('level'),duration=byId('duration'),typing=byId('typing'),start=byId('start'),reset=byId('reset'),passage=byId('passage');
const time=byId('time'),wpm=byId('wpm'),accuracy=byId('accuracy'),status=byId('status');
let best=KS.data.best, rounds=KS.data.rounds, mode='practice', target='', submittedText='', timer=0, startedAt=0, deadline=0;
let testMistakes={}, testState='ready', roundDate='', testDuration=30, testTextMode='everyday', passageIndex=0;
const today=KS.date;
function showBest(){byId('best').textContent=best?'Best '+best+' WPM':'Best —';}
function showProgress(){
  const completed=rounds.some(r=>r.mode==='daily'&&r.date===today());
  byId('unlock').textContent=mode==='daily' ? (completed?'Daily challenge completed. Replay any time. ':'')+'A shared passage for '+today()+'. 60 seconds, Everyday Text. Dates follow your local calendar.' : 'Choose your focus and duration. Every mode is available from the start.';
  byId('emptyHistory').hidden=rounds.length>0;
  byId('history').replaceChildren(...rounds.slice(0,5).map(r=>{
    const row=document.createElement('li'),label=document.createElement('span'),score=document.createElement('strong');
    label.textContent=(r.mode==='daily'?'Daily challenge':modeLabels[r.textMode]||r.level)+' · '+r.date;
    score.textContent=r.score+' WPM · '+r.percent+'%';row.append(label,score);return row;
  }));
}
function renderPassage(){
  const offset=Math.floor(submittedText.length/180)*180, end=Math.min(target.length,offset+360);
  const fragment=document.createDocumentFragment();
  for(let i=offset;i<end;i++){
    const span=document.createElement('span');span.textContent=target[i];
    span.className=i<submittedText.length ? submittedText[i]===target[i]?'correct':'incorrect' : i===submittedText.length?'current':'';
    if(i===submittedText.length)span.setAttribute('aria-current','true');fragment.append(span);
  }
  passage.replaceChildren(fragment);
}
function scoreTest(now=performance.now()){
  let correct=0;for(let i=0;i<submittedText.length;i++)if(submittedText[i]===target[i])correct++;
  const elapsed=Math.max(1000,Math.min(now,deadline)-startedAt);
  return {score:Math.round(correct*12000/elapsed),percent:submittedText.length?Math.round(correct/submittedText.length*100):0,errors:submittedText.length-correct,correct,elapsed};
}
let practiceOptions = { textMode: level.value, duration: duration.value };
function switchMode(next){
  if (next === 'daily' && mode !== 'daily') { practiceOptions = { textMode: level.value, duration: duration.value }; level.value = 'everyday'; duration.value = '60'; }
  if (next === 'practice' && mode === 'daily') { level.value = practiceOptions.textMode; duration.value = practiceOptions.duration; }
  mode=next;
  for(const name of ['practice','daily']){byId(name).classList.toggle('selected',name===mode);byId(name).setAttribute('aria-pressed',String(name===mode));}
  clearRound();showProgress();
}
function clearRound(){
  clearInterval(timer);timer=0;testState='ready';
  roundDate=today();testTextMode=mode==='daily'?'everyday':level.value;testDuration=mode==='daily'?60:Number(duration.value);
  target=makePassage(testTextMode,mode==='daily'?roundDate:Date.now()+'-'+passageIndex++);
  submittedText='';testMistakes={};typing.value='';typing.disabled=true;typing.placeholder='Press Start to begin';
  level.disabled=duration.disabled=mode==='daily';start.disabled=false;byId('practice').disabled=byId('daily').disabled=false;
  start.textContent='Start test';time.textContent=testDuration+'s';wpm.textContent=accuracy.textContent='—';status.textContent='Ready when you are. The clock starts when you press Start.';
  byId('testResult').hidden=true;byId('testMistakeDrill').hidden=true;byId('progress').value=0;renderPassage();
}
function finish(now=performance.now()){
  if(testState!=='running')return;
  clearInterval(timer);timer=0;testState='finished';
  const result=scoreTest(now), previous=rounds.find(r=>r.mode===mode&&r.textMode===testTextMode&&r.duration===testDuration);
  typing.disabled=true;level.disabled=duration.disabled=mode==='daily';start.disabled=false;byId('practice').disabled=byId('daily').disabled=false;start.textContent='Retry test';
  time.textContent='0s';byId('progress').value=1;wpm.textContent=result.score;accuracy.textContent=result.percent+'%';
  const box=byId('testResult');box.replaceChildren();box.hidden=false;
  const title=document.createElement('strong');title.textContent='Test complete · '+result.score+' WPM';
  const detail=document.createElement('p');detail.textContent=result.percent+'% accuracy · '+result.errors+' errors in final entry · '+testDuration+' seconds';
  const comparison=document.createElement('p');
  const delta=(value,suffix)=>`${value>0?'+':''}${value}${suffix}`;
  comparison.textContent=!submittedText?'No input this time. Nothing was saved. Start again when you are ready.':previous?'Since your previous comparable test: '+delta(result.score-previous.score,' WPM')+', '+delta(result.percent-previous.percent,' percentage points accuracy')+'.':'Your first result for this mode and duration. This is your new baseline.';
  box.append(title,detail,comparison);
  if(submittedText.length){
    const saved={id:Date.now()+'-'+Math.random().toString(36).slice(2,8),date:today(),challengeDate:mode==='daily'?roundDate:null,mode,textMode:testTextMode,level:modeLabels[testTextMode],duration:testDuration,...result,mistakes:{...testMistakes}};
    rounds.unshift(saved);best=Math.max(best,result.score);KS.data.best=best;KS.addMistakes(testMistakes);KS.markDay();
    status.textContent='Result saved in this browser.';
  }else status.textContent='No input. This round was not saved.';
  const tricky=Object.entries(testMistakes).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
  byId('testMistakeDrill').hidden=!tricky.length;
  if(tricky.length){const note=document.createElement('p');note.textContent='Keys to revisit: '+tricky.map(k=>k===' '?'Space':k).join(', ');box.append(note);}
  showBest();showProgress();renderPassage();
}
function tick(){
  if(testState!=='running')return;
  const now=performance.now(),remaining=Math.max(0,deadline-now);time.textContent=Math.ceil(remaining/1000)+'s';byId('progress').value=1-remaining/(testDuration*1000);
  if(!remaining){finish(now);return;}
  if(submittedText){const result=scoreTest(now);wpm.textContent=result.score;accuracy.textContent=result.percent+'%';}
}
start.onclick=()=>{
  clearRound();startedAt=performance.now();deadline=startedAt+testDuration*1000;testState='running';timer=setInterval(tick,100);
  typing.disabled=false;typing.placeholder='Type the passage exactly as shown';level.disabled=duration.disabled=start.disabled=byId('practice').disabled=byId('daily').disabled=true;
  status.textContent='Test running. Keep your eyes on the passage.';renderPassage();typing.focus();
};
function acceptTestInput(){
  if(testState!=='running')return;
  if(performance.now()>=deadline){typing.value=submittedText;tick();return;}
  const value=typing.value;
  for(let i=0;i<value.length;i++)if(value[i]!==submittedText[i]&&value[i]!==target[i]&&target[i])testMistakes[target[i]]=(testMistakes[target[i]]||0)+1;
  submittedText=value;
  if(submittedText.length>=target.length-360)target+=' '+makePassage(testTextMode,roundDate);
  renderPassage();const result=scoreTest();wpm.textContent=result.score;accuracy.textContent=result.percent+'%';
}
typing.addEventListener('input',e=>{if(!e.isComposing)acceptTestInput();});
typing.addEventListener('compositionend',acceptTestInput);
for(const event of ['paste','drop'])typing.addEventListener(event,e=>e.preventDefault());
reset.onclick=clearRound;level.onchange=clearRound;duration.onchange=clearRound;
byId('practice').onclick=()=>switchMode('practice');byId('daily').onclick=()=>switchMode('daily');
byId('testMistakeDrill').onclick=()=>startMistakeDrill(Object.entries(testMistakes).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k));
showBest();clearRound();showProgress();
