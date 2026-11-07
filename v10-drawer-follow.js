/* Keep the original form and explicit-save flow; only reorganize its presentation. */
const v10FollowArrangements=new WeakMap();
function v10FollowPlanTime(form){
 const original=v10FollowArrangements.get(form);
 return original?.date&&form.querySelector('#nextdate').value.trim()===original.date&&form.querySelector('#nextaction').value.trim()===original.action?original.time:'';
}
function v10FollowPlanHint(form){
 const original=v10FollowArrangements.get(form),hint=form.querySelector('.v10-follow-legacy');if(!hint)return;
 hint.hidden=!original?.date||!original.time;
 if(original?.date&&original.time)hint.textContent=v10FollowPlanTime(form)===original.time?`旧计划仍按 ${original.time} 执行；修改日期或行动后，将按全天保存。`:'本次重新安排将按全天保存，原联系时刻会清除。';
}
function v10FollowSection(title, icon, content, extra = '') {
 const section=document.createElement('section');section.className='v10-follow-section';
 section.innerHTML=`<div class="v10-follow-section-head"><h3>${I(icon)}${title}</h3>${extra}</div>`;
 if(typeof content==='string')section.insertAdjacentHTML('beforeend',content);else section.append(content);
 return section;
}
function v10FollowDateKey(raw){
 const match=String(raw||'').match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](?:(上午|下午))?(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/);
 if(!match)return null;
 const day=`${match[1]}-${match[2]}-${match[3]}`;let hour=Number(match[5]||0);
 if(!C.validDate(day)||hour>23||Number(match[6]||0)>59||Number(match[7]||0)>59)return null;
 if(match[4]){if(hour<1||hour>12)return null;hour=hour%12+(match[4]==='下午'?12:0)}
 const zone=match[9]||'+08:00';if(zone!=='Z'&&(Number(zone.slice(1,3))>23||Number(zone.slice(4))>59))return null;
 const time=Date.parse(`${day}T${String(hour).padStart(2,'0')}:${match[6]||'00'}:${match[7]||'00'}.${(match[8]||'0').padEnd(3,'0')}${zone}`);
 return Number.isFinite(time)?time:null;
}
function v10FollowAuthor(log){
 for(const author of [log.author,log.recordedBy]){
  if(typeof author==='string'&&author.trim())return author;
  if(author&&typeof author==='object')for(const key of ['name','display'])if(typeof author[key]==='string'&&author[key].trim())return author[key];
 }
 return '';
}
function v10FollowHistory(logs){
 const rows=(logs||[]).map((log,index)=>({log,index,key:v10FollowDateKey(log.date)})).sort((a,b)=>Number(b.key!==null)-Number(a.key!==null)||(a.key!==null&&b.key!==null?b.key-a.key:0)||a.index-b.index);
 return rows.length?`<ol class="v10-follow-timeline">${rows.map(({log})=>{const author=v10FollowAuthor(log);return `<li><div class="v10-follow-event-meta"><time>${esc(log.date||'日期未知')}</time>${author?`<span>${esc(author)}</span>`:''}</div><p>${esc(log.text||'')}</p></li>`}).join('')}</ol>`:'<p class="v10-follow-empty">暂无沟通记录</p>';
}
function enhanceV10Follow(drawer,k){
 const body=drawer.querySelector('.drawerbody'),form=body?.querySelector('#followform');
 if(!form||form.classList.contains('v10-follow-form'))return;
 const communication=form.querySelector('#followtext').closest('.field');
 const date=form.querySelector('#nextdate').closest('.field');
 const action=form.querySelector('#nextaction').closest('.field');
 v10FollowArrangements.set(form,{date:date.querySelector('input').value.trim(),action:action.querySelector('input').value.trim(),time:k.time||''});
 form.querySelector('#nexttime')?.closest('.field').remove();
 date.querySelector('label').textContent='下一次联系日期';
 const submit=form.querySelector('[type="submit"]');
 const scroll=document.createElement('div');scroll.className='v10-follow-scroll';scroll.tabIndex=0;scroll.setAttribute('aria-label','跟进记录内容');
 const next=document.createElement('div');next.className='v10-follow-next';next.append(date,action);
 const hint=document.createElement('p');hint.className='v10-follow-legacy';hint.setAttribute('role','note');next.append(hint);
 if(k.handoffPendingAction===true){const handoffHint=document.createElement('p');handoffHint.className='sectionnote';handoffHint.setAttribute('role','note');handoffHint.textContent='交接时已保留下次联系日期，请重新确认并填写下一步行动。';next.append(handoffHint);}
 form.className='v10-follow-form';submit.className='btn primary';submit.textContent='保存跟进与下一步';
 communication.querySelector('textarea').placeholder='记录本次沟通内容、合作意向或需要确认的问题…';
 scroll.append(v10FollowSection('记录本次沟通','chat',communication),v10FollowSection('下一步安排','clock',next));
 const tasks=taskItems().filter(t=>t.kolId===k.id&&!t.done);
 scroll.append(v10FollowSection('相关待办','calendar',tasks.length?`<div class="v10-follow-tasks">${tasks.map(t=>`<article class="v10-follow-task"><div><strong>${esc(t.title)}</strong><small>${esc(t.due||'日期未安排')}${t.time?' '+esc(t.time):' · 全天'}</small></div><div class="v10-follow-row-actions"><button type="button" class="textbtn" data-v10-task-edit="${esc(t.id)}">编辑</button><button type="button" class="btn small" data-v10-task-complete="${esc(t.id)}">完成</button></div></article>`).join('')}</div>`:'<p class="v10-follow-empty">暂无待办</p>','<button type="button" class="textbtn" data-v10-task-add>＋ 新增待办</button>'));
 const fees=feesAll().filter(f=>f.kolId===k.id);
 scroll.append(v10FollowSection('合作稿费申请','money',fees.length?`<div class="v10-follow-fees">${fees.map(f=>`<article class="v10-follow-fee"><div><strong>${esc(f.title||'未命名草稿')}</strong><small>${esc(f.number||'申请单号未记录')}${f.amount!==''&&f.amount!=null?' · '+esc(f.currency||'币种未知')+' '+esc(f.amount):''}</small></div><span class="fee-status fee-status-${esc(f.status)}">${esc(feeStatus[f.status]||'状态待核对')}</span><button type="button" class="textbtn" data-v10-follow-fee="${esc(f.id)}">查看详情 ${I('external')}</button></article>`).join('')}</div>`:'<p class="v10-follow-empty">暂无稿费申请</p>'));
 scroll.append(v10FollowSection('历史跟进记录','clock',v10FollowHistory(k.logs)));
 const footer=document.createElement('div');footer.className='v10-follow-footer';footer.innerHTML='<div class="v10-follow-feedback"><span id="v10-follow-status" role="status" aria-live="polite" data-state="clean">填写后请保存</span><p id="v10-follow-error" role="alert"></p></div>';footer.append(submit);
 form.replaceChildren(scroll,footer);body.replaceChildren(form);
 v10FollowPlanHint(form);
 for(const input of [date.querySelector('input'),action.querySelector('input')])for(const event of ['input','change'])input.addEventListener(event,()=>v10FollowPlanHint(form));
 form.addEventListener('input',()=>{if(v10FollowPending?.form===form||followSession?.blocked)return;v10FollowFeedback(form,followDirty()?'有未保存的修改':'填写后请保存',followDirty()?'pending':'clean')});
 scroll.querySelector('[data-v10-task-add]').onclick=()=>taskDialog(null,k.id);
 scroll.querySelectorAll('[data-v10-task-edit]').forEach(b=>b.onclick=()=>taskDialog(b.dataset.v10TaskEdit));
 scroll.querySelectorAll('[data-v10-task-complete]').forEach(b=>b.onclick=()=>completeTask(b.dataset.v10TaskComplete));
 scroll.querySelectorAll('[data-v10-follow-fee]').forEach(b=>b.onclick=()=>openFee(b.dataset.v10FollowFee));
 if(followSession?.id===k.id)followSession.snapshot=formSnapshot(form);
}
