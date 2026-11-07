/* V10 4C workbench. Projections are read-only; actions reuse existing guarded flows. */
let v10HomeView={user:null,expanded:new Set(),actionable:false};
function v10HomeViewState(){
 const user=typeof currentUser==='undefined'?null:currentUser;
 if(v10HomeView.user!==user)v10HomeView={user,expanded:new Set(),actionable:false};
 return v10HomeView;
}
function v10HomeTaskNav(tab){
 guardProfileLeave(()=>{taskTab=tab;taskPriority='';taskOrder='asc';query='';nav('tasks')});
}
function v10HomeIcon(name){
 if(name==='approval')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5M9 12h7M9 16h5"/></svg>';
 if(name==='publication')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 18-7-6 18-4-7-8-4ZM11 14 21 3"/></svg>';
 if(name==='book')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v16"/></svg>';
 if(name==='alert')return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>';
 return I(name);
}
function v10HomeStat(kind,label,count,icon,description){
 return `<button type="button" class="v10-home-stat ${kind}" data-home-stat="${kind}" aria-label="${esc(label)} ${count===null?'暂未取得':count}"><span class="v10-home-stat-icon">${v10HomeIcon(icon)}</span><span class="v10-home-stat-copy"><span>${esc(label)}</span><strong data-home-count="${kind}">${count===null?'—':count}</strong><small>${esc(description)}</small></span>${I('arrow')}</button>`;
}
function v10HomeTaskRow(task,group){
 const k=task.k,personal=!k,meta=k?[k.platforms?.join(' · '),C.fansDisplay(C.primaryFans(k))].filter(Boolean).join(' · '):'';
 const due=task.due===dateCN()?'今天':task.due;
 return `<article class="v10-home-task" data-home-task="${esc(task.id)}"><button type="button" class="v10-home-check" data-home-complete="${esc(task.id)}" data-complete="${esc(task.id)}" aria-label="上传截图并完成：${esc(task.title)}" title="上传截图并完成"></button><div class="v10-home-task-owner">${personal?`<span class="avatar v10-home-personal">${I('check')}</span>`:avatar(k)}<div>${personal?'<strong>个人待办</strong>':`<button type="button" class="textbtn" data-open="${esc(k.id)}" title="${esc(k.name)}">${esc(k.name)}</button>`}${meta?`<small>${esc(meta)}</small>`:''}</div></div><div class="v10-home-task-copy"><strong title="${esc(task.title)}">${esc(task.title)}</strong><time datetime="${esc(task.due)}${task.time?'T'+esc(task.time)+'+08:00':''}" class="${group==='late'?'late':''}">${group==='late'?'<span>逾期</span> ':''}${esc(due)} ${esc(task.time||'全天')}</time></div><button type="button" class="btn small" data-home-taskedit="${esc(task.id)}" data-edittask="${esc(task.id)}">去处理</button></article>`;
}
function v10HomeTaskGroup(kind,tasks){
 const state=v10HomeViewState(),expanded=state.expanded.has(kind),shown=expanded?tasks:tasks.slice(0,4),title=kind==='late'?'逾期任务':'今日任务';
 return `<section class="v10-home-taskgroup ${kind}" data-home-taskgroup="${kind}" aria-labelledby="v10-home-${kind}"><header><h3 id="v10-home-${kind}" tabindex="-1">${title}<span>${tasks.length}</span></h3>${kind==='late'&&tasks.length?'<small>以下任务已逾期，请尽快处理</small>':''}</header>${shown.map(task=>v10HomeTaskRow(task,kind)).join('')||`<p class="v10-home-empty">${kind==='late'?'暂无逾期任务':'今天暂无待办'}</p>`}${tasks.length>4?`<button type="button" class="textbtn v10-home-more" data-home-expand="${kind}" aria-expanded="${expanded}">${expanded?'收起':`展开其余 ${tasks.length-4} 项`}${I('arrow')}</button>`:''}</section>`;
}
function v10HomeFeeRow(entry){
 const f=entry.fee,k=own().find(item=>String(item.id)===String(f.kolId)),reasons=entry.reasons||[];
 return `<article class="v10-home-fee" data-home-fee="${esc(entry.id)}"><div class="v10-home-fee-identity">${k?avatar(k):`<span class="avatar v10-home-personal">${esc(String(f.kolName||'合').slice(0,1))}</span>`}<div><strong title="${esc(f.kolName||'KOL名称未填写')}">${esc(f.kolName||'KOL名称未填写')}</strong><span title="${esc(f.title||f.number||'未命名申请')}">${esc(f.title||f.number||'未命名申请')}</span></div></div><ul class="v10-home-reasons">${reasons.map(reason=>`<li data-home-reason="${esc(reason.type)}" data-mode="${esc(reason.mode)}" class="${reason.overdue?'late':''}">${esc(reason.label)}${reason.count>1?` · ${reason.count} 项交付`:''}</li>`).join('')}</ul><button type="button" class="btn small" data-home-feeopen="${esc(entry.id)}" aria-label="查看申请：${esc(f.title||f.number||f.kolName)}">查看</button></article>`;
}
function v10HomeFeeGroup(kind,title,icon,items,status){
 const key='fee-'+kind,expanded=v10HomeViewState().expanded.has(key),shown=expanded?items:items.slice(0,2);
 return `<section class="v10-home-feegroup" data-home-feegroup="${kind}" aria-labelledby="v10-home-fee-${kind}"><header><h3 id="v10-home-fee-${kind}" tabindex="-1">${v10HomeIcon(icon)}${title}<span>${status==='ready'?items.length:'—'}</span></h3>${items.length>2?`<button type="button" class="textbtn" data-home-expand="${key}" aria-expanded="${expanded}">${expanded?'收起':'查看全部'}${I('arrow')}</button>`:''}</header>${shown.map(v10HomeFeeRow).join('')||`<p class="v10-home-empty">${status==='ready'?'暂无需要本人处理的事项':'合作事项尚未确认'}</p>`}</section>`;
}
function v10HomeProgress(title,key,items,status){
 return `<details class="v10-home-progress" data-home-progress="${key}"><summary>${title}<span>${status==='ready'?items.length:'—'}</span>${I('arrow')}</summary><div>${items.map(v10HomeFeeRow).join('')||`<p class="v10-home-empty">${status==='ready'?'暂无相关进度':'进度尚未确认'}</p>`}</div></details>`;
}
home=function(){
 const model=v10HomeModel(),{tasks,fees}=model,state=v10HomeViewState(),ready=fees.status==='ready';
 const status=fees.status==='error'?`<p class="v10-home-feedback error" role="alert">${esc(fees.error||'合作事项加载失败')}；${fees.hasData?'以下为上次成功读取的记录，待处理数量暂未确认。':'请重试后查看，当前数量暂未确认。'}</p>`:fees.status==='loading'?`<p class="v10-home-feedback" role="status">正在读取合作事项${fees.hasData?'，以下保留上次记录':''}…</p>`:'';
 return `<div class="v10-home"><header class="v10-home-heading"><div><h1>首页工作台</h1><time datetime="${dateCN()}">${new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'long'}).format(new Date())} · 北京时间</time></div><div><button type="button" class="btn" data-addtask>${I('plus')}新增待办</button><button type="button" class="btn primary" data-new>${I('plus')}新增 KOL</button></div></header><div class="v10-home-stats">${v10HomeStat('today','今天待办',tasks.today.length,'calendar','今天尚待处理的任务')}${v10HomeStat('late','逾期待处理',tasks.late.length,'alert','优先处理已到期任务')}${v10HomeStat('actionable','等待处理',fees.actionCount,'clock','需要本人处理的独立申请')}</div><div class="v10-home-grid"><section class="panel v10-home-tasks" aria-labelledby="v10-home-tasks-title"><header class="v10-home-sectionhead"><h2 id="v10-home-tasks-title">今天要做</h2><button type="button" class="textbtn" data-home-tasknav="all">查看全部待办 ${I('arrow')}</button></header>${v10HomeTaskGroup('late',tasks.late)}${v10HomeTaskGroup('today',tasks.today)}</section><aside class="panel v10-home-cooperation" aria-labelledby="v10-home-cooperation-title"><header class="v10-home-sectionhead"><h2 id="v10-home-cooperation-title" tabindex="-1">合作待处理</h2><button type="button" class="textbtn" data-home-refresh ${fees.status==='loading'?'disabled':''}>${fees.status==='loading'?'读取中…':'刷新'}</button></header>${status}<p class="v10-home-scope">仅统计本人有权处理的申请，同一申请只计一次。</p><section class="v10-home-actionable" data-home-actionable ${state.actionable?'':'hidden'} aria-labelledby="v10-home-actionable-title"><h3 id="v10-home-actionable-title" tabindex="-1">本人待处理 <span>${ready?fees.actionable.length:'—'}</span></h3>${fees.actionable.map(v10HomeFeeRow).join('')||`<p class="v10-home-empty">${ready?'暂无需要本人处理的申请':'读取成功后显示本人待处理申请'}</p>`}</section>${v10HomeFeeGroup('approval','待审批','approval',fees.groups.approval,fees.status)}${v10HomeFeeGroup('publication','待发布','publication',fees.groups.publication,fees.status)}${v10HomeFeeGroup('review','待核验','shield',fees.groups.review,fees.status)}<div class="v10-home-progress-area"><p>其他进度 · 不计入本人待处理</p>${v10HomeProgress('等待他人处理','waiting',fees.waiting,fees.status)}${v10HomeProgress('待分配上级','unassigned',fees.unassigned,fees.status)}</div></aside></div><div class="v10-home-shortcuts"><button type="button" class="panel" data-home-tasknav="week"><span class="v10-home-shortcut-icon">${I('calendar')}</span><span><strong>本周安排</strong><small>${tasks.week.length} 项待办 · 查看本周跟进与关键事项</small></span><span class="v10-home-shortcut-link">查看本周安排 ${I('arrow')}</span></button><button type="button" class="panel" data-page="business"><span class="v10-home-shortcut-icon">${v10HomeIcon('book')}</span><span><strong>商务中心</strong><small>学习方法、提成制度与商务资料</small></span><span class="v10-home-shortcut-link">进入商务中心 ${I('arrow')}</span></button></div></div>`;
};
function v10HomeFocus(selector){const element=document.querySelector(selector);element?.focus({preventScroll:true});element?.scrollIntoView({block:'nearest',behavior:'auto'})}
const v10HomePreviousBind=bindContent;
bindContent=function(){
 v10HomePreviousBind();if(page!=='home')return;
 document.querySelectorAll('[data-home-tasknav]').forEach(button=>{button.onclick=()=>v10HomeTaskNav(button.dataset.homeTasknav)});
 document.querySelectorAll('[data-home-feeopen]').forEach(button=>{button.onclick=()=>openFee(button.dataset.homeFeeopen)});
 document.querySelectorAll('[data-home-expand]').forEach(button=>{button.onclick=()=>{const key=button.dataset.homeExpand,state=v10HomeViewState();state.expanded.has(key)?state.expanded.delete(key):state.expanded.add(key);renderContent();v10HomeFocus(`[data-home-expand="${key}"]`)}});
 document.querySelectorAll('[data-home-stat]').forEach(button=>{button.onclick=()=>{const kind=button.dataset.homeStat,state=v10HomeViewState();if(kind==='actionable')state.actionable=true;else state.expanded.add(kind);renderContent();v10HomeFocus(kind==='actionable'?'#v10-home-actionable-title':'#v10-home-'+kind)}});
 document.querySelector('[data-home-refresh]')?.addEventListener('click',()=>loadFeesState());
};
const v10HomePreviousRender=renderContent;
renderContent=function(){
 if(page!=='home')return v10HomePreviousRender();
 renderWorkspaceContent(home());bindContent();
 const fees=v10HomeFeesState();if(fees.status==='loading'&&!fees.hasData)loadFeesState();
};
const v10HomePreviousNav=nav;
nav=function(destination){
 const entering=destination==='home'&&page!=='home';
 v10HomePreviousNav(destination);
 if(entering&&page==='home')loadFeesState();
};
