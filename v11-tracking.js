/* V11: server-owned promotion nodes. Never write these through workspace.tasks. */
let v11TrackingState=null,v11TrackingEditor=null;
const v11TrackingDays=[15,30,60,90],v11TrackingLabels={upcoming:'未到期',due:'待回填',overdue:'逾期未回填',completed:'已回填',unknown:'已结束 · 含未知数据',paused:'暂停核对',unassigned:'待指派'};
Object.assign(logLabels,{promotion_tracking_recorded:'推广节点回填',promotion_tracking_corrected:'更正推广节点回填'});
function v11TrackingAllowed(){return !!currentUser&&['bd','admin'].includes(currentUser.role)&&currentUser.passwordChangeRequired!==true&&currentUser.promotionTracking===true}
function v11TrackingWorkspace(){return v11TrackingAllowed()&&page!=='admin'&&!/^\/admin(?:\/|$)/.test(location.pathname)}
function v11TrackingReset(){
 if(v11TrackingState)v11TrackingState.sequence++;
 v11TrackingState=null;
 const context=v11TrackingEditor;if(context)v11TrackingFinish(context,false);
}
function v11TrackingSync(){
 if(v11TrackingState?.user!==currentUser){v11TrackingReset();v11TrackingState={user:currentUser,items:[],status:'idle',error:'',sequence:0,promise:null,businessDate:''};}
 return v11TrackingState;
}
function v11TrackingCurrent(context,form){return v11TrackingEditor===context&&currentUser===context.user&&v11TrackingAllowed()&&page===context.page&&context.panel.isConnected&&(!form||context.form===form&&form.isConnected)}
function v11TrackingTaskCurrent(state){return v11TrackingState===state&&state.user===currentUser&&v11TrackingWorkspace()}
function v11TrackingDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))}
function v11TrackingValidateTrack(item,key){
 if(!item||typeof item.key!=='string'||key&&item.key!==key||!Array.isArray(item.nodes)||item.nodes.length!==4||!v11TrackingDays.every(day=>item.nodes.filter(node=>node.day===day&&typeof node.key==='string'&&v11TrackingDate(node.dueDate)&&Number.isSafeInteger(node.version)&&node.version>=0).length===1))throw Error('推广跟踪资料返回不完整，请重试');
 return item;
}
async function v11TrackingLoadTasks(force=false){
 if(!v11TrackingWorkspace())return false;const state=v11TrackingSync();
 if(state.promise&&!force)return state.promise;
 const sequence=++state.sequence;state.status='loading';state.error='';
 const current=()=>v11TrackingTaskCurrent(state)&&sequence===state.sequence;
 const pending=(async()=>{try{
  const rows=[],seen=new Set();let total=null,businessDate='',pageNumber=1;
  do{
   const result=await api('/api/promotion-tracking/tasks?scope=mine&page='+pageNumber+'&pageSize=50');if(!current())return false;
   if(!Array.isArray(result.items)||!Number.isSafeInteger(result.total)||result.total<0||result.page!==pageNumber||result.pageSize!==50||!v11TrackingDate(result.businessDate)||total!==null&&(total!==result.total||businessDate!==result.businessDate))throw Error('推广待办分页已变化，请重新读取');
   total=result.total;businessDate=result.businessDate;
   for(const node of result.items){if(typeof node.key!=='string'||!node.trackingKey||!v11TrackingDays.includes(node.day)||!v11TrackingDate(node.dueDate)||node.latest||seen.has(node.key))throw Error('推广待办返回异常，请重试');seen.add(node.key);rows.push(node);}
   if(rows.length>total||!result.items.length&&rows.length<total)throw Error('推广待办分页不完整，请重试');
   pageNumber++;
  }while(rows.length<total);
  state.items=rows;state.businessDate=businessDate;state.status='ready';state.error='';return true;
 }catch(error){if(!current())return false;state.status='error';state.error=error.message||'推广回填提醒读取失败';return false;}
 finally{if(current()){state.promise=null;if(['home','tasks'].includes(page)&&!document.querySelector('#overlay [role="dialog"]'))renderContent();}}
 })();state.promise=pending;return pending;
}
const v11TrackingBaseTasks=taskItems;
taskItems=function(){
 const original=v11TrackingBaseTasks();if(!v11TrackingWorkspace())return original;
 const state=v11TrackingSync();return original.concat(state.items.map(node=>({...node,id:node.key,kind:'tracking',title:'第'+node.day+'天推广回填 · '+(node.title||'未命名发布'),due:node.dueDate,time:'',done:false,kolId:node.kolId,k:own().find(k=>String(k.id)===String(node.kolId))})));
};
function v11TrackingTaskRow(task,home=false){
 const label=v11TrackingLabels[task.status]||'待核对',button=`<button type="button" class="btn small" data-tracking-open="${esc(task.trackingKey)}" data-tracking-day="${task.day}">${task.canWrite===true?'去回填':'查看跟踪'}</button>`;
 return `<article class="${home?'v10-home-task':'v9task'} v11-tracking-task"><span class="v11-tracking-task-icon" aria-hidden="true">${I('calendar')}</span><div class="v11-tracking-task-copy"><strong>${esc(task.title)}</strong><small>${esc(task.kolName||task.k?.name||'关联KOL')} · ${esc(label)}</small></div>${home?'':'<span class="v9priority-dot v11-tracking-priority" aria-hidden="true"></span>'}<time ${home?'':'class="v9due"'} datetime="${esc(task.due)}">${esc(task.due)}<small>全天 · 北京时间</small></time>${home?button:'<div class="v9task-actions">'+button+'</div>'}</article>`;
}
const v11TrackingBaseTaskRow=taskRowV9;taskRowV9=function(task){return task.kind==='tracking'?v11TrackingTaskRow(task):v11TrackingBaseTaskRow(task)};
const v11TrackingBaseHomeRow=v10HomeTaskRow;v10HomeTaskRow=function(task,group){return task.kind==='tracking'?v11TrackingTaskRow(task,true):v11TrackingBaseHomeRow(task,group)};
function v11TrackingOrdinaryAction(id){const node=v11TrackingState?.user===currentUser&&v11TrackingState.items.find(item=>item.key===id);if(node){v11TrackingOpen({key:node.trackingKey,day:node.day});return true}if(String(id||'').startsWith('tracking:')){toast('推广节点请从四节点跟踪记录处理');return true}return false;}
const v11TrackingBaseComplete=completeTask;completeTask=function(id){if(v11TrackingOrdinaryAction(id))return;return v11TrackingBaseComplete(id)};
const v11TrackingBaseTaskDialog=taskDialog;taskDialog=function(id,...args){if(v11TrackingOrdinaryAction(id))return;return v11TrackingBaseTaskDialog(id,...args)};
const v11TrackingBaseReopen=reopenTask;reopenTask=function(id){if(v11TrackingOrdinaryAction(id))return;return v11TrackingBaseReopen(id)};
function v11TrackingBindOpens(root=document){root.querySelectorAll('[data-tracking-open]').forEach(button=>button.onclick=()=>v11TrackingOpen({key:button.dataset.trackingOpen,day:Number(button.dataset.trackingDay)||undefined}))}
function v11TrackingDecorate(){
 if(!v11TrackingWorkspace())return;const state=v11TrackingSync();
 if(['home','tasks'].includes(page)){
  const root=document.querySelector(page==='home'?'.v10-home-tasks':'.v9tasks');
  if(root&&!root.querySelector('[data-tracking-task-status]')){
   const box=document.createElement('div');box.className='v11-tracking-feedback';box.tabIndex=-1;box.setAttribute('data-tracking-task-status','');box.setAttribute('role',state.status==='error'?'alert':'status');
   box.innerHTML=state.status==='ready'?`推广回填提醒：${state.items.length} 项未结束节点 · ${esc(state.businessDate)}（北京时间）。已保存记录可在推广跟踪四节点查看。 <button type="button" class="textbtn" data-tracking-tasks-retry>刷新</button>`:`${state.status==='error'?esc(state.error)+'；当前推广待办数量未知。':'正在读取推广回填提醒，当前数量待确认…'}${state.status==='error'?'<button type="button" class="btn small" data-tracking-tasks-retry>重试</button>':''}`;
   root.prepend(box);box.querySelector('[data-tracking-tasks-retry]')?.addEventListener('click',()=>{v11TrackingLoadTasks(true);renderContent()});
  }
  if(state.status!=='ready'){
   const selectors=page==='home'?['[data-home-count="today"]','[data-home-count="late"]']:['[data-v9taskstat="open"] strong','[data-v9taskstat="today"] strong','[data-v9taskstat="late"] strong'];
   selectors.forEach(selector=>{const node=document.querySelector(selector);if(node){node.textContent='—';node.setAttribute('title','推广待办数量尚未确认')}});
  }
  if(state.status==='idle')v11TrackingLoadTasks();
 }
 v11TrackingBindOpens();
}
const v11TrackingBaseRender=renderContent;renderContent=function(){if(v11TrackingEditor&&!v11TrackingCurrent(v11TrackingEditor))v11TrackingReset();if(v11TrackingState&&!v11TrackingWorkspace()){v11TrackingState.sequence++;v11TrackingState=null;}v11TrackingBaseRender();v11TrackingDecorate()};
function v11TrackingCapture(){return [...new Set([document.scrollingElement,document.querySelector('#content'),...document.querySelectorAll('[data-promo-table-scroll],.v10-promo-detail-body,.v10-detail-scroll,[data-cooperation-list],.v11-admin-detail-body')])].filter(Boolean).map(node=>({node,top:node.scrollTop,left:node.scrollLeft}))}
function v11TrackingFinish(context,restore=true){
 if(v11TrackingEditor!==context)return;const valid=currentUser===context.user&&page===context.page;
 context.sequence++;context.finished=true;v11TrackingEditor=null;context.panel.parentElement?.remove();
 context.parents.forEach(([node,inert,hidden])=>{if(node.isConnected){node.inert=inert;if(hidden===null)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden',hidden)}});
 document.body.style.overflow=context.overflow;
 if(restore&&valid){if(['home','tasks'].includes(page))renderContent();context.scroll.forEach(({node,top,left})=>{if(node.isConnected){node.scrollTop=top;node.scrollLeft=left}});const focus=context.focus?.isConnected&&context.focus!==document.body?context.focus:document.querySelector('[data-tracking-task-status]');focus?.focus({preventScroll:true});}
}
function v11TrackingDirty(context){return !!context.form&&v11TrackingCurrent(context,context.form)&&v7Snapshot(context.form)!==context.snapshot}
function v11TrackingLeave(action){
 const context=v11TrackingEditor;if(!context||!v11TrackingCurrent(context))return action();
 if(context.busy){toast('正在保存，请稍候');return;}
 if(context.composing){v11TrackingError(context,'请先完成当前输入');return;}
 if(!v11TrackingDirty(context)){action();return;}
 if(context.panel.querySelector('.v11-tracking-leave'))return;
 const box=document.createElement('div');box.className='v11-tracking-leave';box.innerHTML='<section role="dialog" aria-modal="true" aria-label="未保存的推广回填"><h3>回填尚未保存</h3><p>请选择保存后离开，或继续编辑。</p><p class="inlinecheck error" role="alert" data-tracking-leave-error></p><div class="actions"><button type="button" class="btn" data-tracking-keep>继续编辑</button><button type="button" class="btn" data-tracking-discard>放弃修改</button><button type="button" class="btn primary" data-tracking-save-leave>保存并离开</button></div></section>';
 context.panel.append(box);box.querySelector('[data-tracking-keep]').onclick=()=>{box.remove();context.form?.querySelector('input:not([disabled]),textarea:not([disabled])')?.focus()};
 box.querySelector('[data-tracking-discard]').onclick=()=>{if(!context.busy&&v11TrackingCurrent(context)){box.remove();action()}};
 box.querySelector('[data-tracking-save-leave]').onclick=async()=>{if(context.busy)return;const saved=await v11TrackingSave(context);if(saved&&v11TrackingCurrent(context)){box.remove();action()}else if(box.isConnected)box.querySelector('[data-tracking-leave-error]').textContent=context.error||'保存未完成，输入已保留'};
 box.querySelector('[data-tracking-keep]').focus();
}
function v11TrackingClose(){const context=v11TrackingEditor;if(context)v11TrackingLeave(()=>v11TrackingFinish(context))}
function v11TrackingOpen(reference){
 if(!v11TrackingAllowed()||reference.scope==='all'&&currentUser.role!=='admin')return;
 const user=currentUser,originPage=page;
 const open=()=>{
  if(currentUser!==user||page!==originPage||!v11TrackingAllowed())return;
  if(v11TrackingEditor)v11TrackingFinish(v11TrackingEditor,false);
  const overlay=document.querySelector('#overlay'),parents=[...overlay.children].map(node=>[node,node.inert,node.getAttribute('aria-hidden')]);parents.forEach(([node])=>{node.inert=true;node.setAttribute('aria-hidden','true')});
  const backdrop=document.createElement('div');backdrop.className='v11-tracking-backdrop';backdrop.innerHTML='<section class="v11-tracking" role="dialog" aria-modal="true" aria-labelledby="v11-tracking-title"><header><div><small>推广数据跟踪</small><h2 id="v11-tracking-title">发布回填</h2></div><button type="button" class="btn" data-tracking-close>返回</button></header><div class="v11-tracking-body" data-tracking-body></div></section>';overlay.append(backdrop);
  const context={user,page:originPage,reference:{...reference},scope:reference.scope==='all'?'all':'mine',panel:backdrop.firstElementChild,parents,overflow:document.body.style.overflow,focus:document.activeElement,scroll:v11TrackingCapture(),sequence:0,status:'loading',data:null,businessDate:'',selected:reference.day||null,form:null,snapshot:'',busy:false,composing:false,error:'',conflicted:false,pending:null};
  v11TrackingEditor=context;document.body.style.overflow='hidden';context.panel.querySelector('[data-tracking-close]').onclick=v11TrackingClose;backdrop.onclick=event=>{if(event.target===backdrop)v11TrackingClose()};v11TrackingRead(context);context.panel.querySelector('[data-tracking-close]').focus();
 };
 // Opening a child of a read-only cooperation detail must keep that parent mounted.
 // The ordinary leave guard deliberately disposes a cooperation when navigating away.
 const parent=v10CooperationsState().context;
 if(!v11TrackingEditor&&v10CooperationValid(parent)&&parent.kind==='detail'&&!v10CooperationBusinessChild){if(parent.operationBusy){toast('正在读取或保存，请稍候');return;}open();}else guardProfileLeave(open);
}
async function v11TrackingAccess(context,error){
 if(error.status!==403)return false;
 const state=v11TrackingState;if(state?.user===context.user){state.sequence++;state.items=[];state.status='error';state.error='推广跟踪访问权限已变化';}
 context.data=null;context.form=null;context.snapshot='';context.pending=null;context.busy=false;context.status='forbidden';context.error=error.message||'当前无权查看此推广跟踪';v11TrackingDraw(context);
 try{const result=await api('/api/me');if(!v11TrackingCurrent(context))return true;if(!result.user||result.user.id!==context.user.id||result.user.passwordChangeRequired===true||result.user.promotionTracking!==true||context.scope==='all'&&result.user.role!=='admin'){currentUser=result.user||null;v11TrackingReset();forceClose();if(currentUser?.passwordChangeRequired)firstPasswordScreen();else if(!currentUser)loginScreen(false);else render();}}catch{}
 return true;
}
async function v11TrackingRead(context,preserve=false){
 if(!v11TrackingCurrent(context)||context.busy||context.composing)return false;const sequence=++context.sequence,form=context.form;
 if(!preserve){context.status='loading';context.data=null;context.form=null;v11TrackingDraw(context)}
 try{
  let key=context.reference.key;
  if(!key){const result=await api('/api/promotion-tracking?scope='+context.scope+'&kolId='+encodeURIComponent(context.reference.kolId)+'&publicationId='+encodeURIComponent(context.reference.publicationId)+'&page=1&pageSize=50');if(!v11TrackingCurrent(context)||sequence!==context.sequence)return false;if(!Array.isArray(result.items)||result.total!==result.items.length||result.total>1)throw Error('发布跟踪关联返回异常');if(!result.total){context.status='empty';context.data=null;v11TrackingDraw(context);return true}key=result.items[0].key;}
  const result=await api('/api/promotion-tracking/detail?scope='+context.scope+'&key='+encodeURIComponent(key));if(!v11TrackingCurrent(context)||sequence!==context.sequence||preserve&&(!form?.isConnected||context.form!==form))return false;
  const item=v11TrackingValidateTrack(result.item,key);if(!v11TrackingDate(result.businessDate))throw Error('业务日期返回异常');context.reference.key=key;context.data=item;context.businessDate=result.businessDate;context.status='ready';context.conflicted=false;context.pending=null;
  if(preserve){
   const node=item.nodes.find(n=>n.day===context.selected),cutoff=form.querySelector('#tracking-cutoff');cutoff.min=node.dueDate;cutoff.max=result.businessDate;
   form.querySelector('[data-tracking-latest-check]')?.remove();const summary=document.createElement('section');summary.className='v11-tracking-latest';summary.setAttribute('data-tracking-latest-check','');summary.setAttribute('role','status');summary.innerHTML=`<h3>最新记录核对</h3><p>实际发布 ${esc(item.actualPublishedDate)} · 第${node.day}天 ${esc(node.dueDate)} · 版本 ${esc(node.version)} · ${esc(v11TrackingLabels[node.status]||'待核对')}</p>${item.sourceMessage?`<p>${esc(item.sourceMessage)}</p>`:''}${node.latest?v11TrackingRecordHTML(node.latest):'<p>此节点尚无已保存记录。</p>'}`;form.prepend(summary);
   v11TrackingError(context,'已读取最新版本，当前输入保留；请核对上述记录后再次保存。');v11TrackingFormState(context);
  }else v11TrackingDraw(context);return true;
 }catch(error){if(!v11TrackingCurrent(context)||sequence!==context.sequence)return false;if(await v11TrackingAccess(context,error))return false;if(preserve){v11TrackingError(context,error.message+'；当前输入已保留');return false}context.status='error';context.error=error.message||'推广跟踪读取失败';v11TrackingDraw(context);return false;}
}
function v11TrackingRecordHTML(record){
 const metric=value=>value?.known===true?String(value.value):'未知：'+(record.privateDetailsHidden?'说明受权限限制':value?.reason||'未记录原因');
 return `<dl class="v11-tracking-record"><div><dt>累计新增注册人数</dt><dd>${esc(metric(record.registered))}</dd></div><div><dt>累计订单数</dt><dd>${esc(metric(record.orders))}</dd></div><div><dt>统计截至</dt><dd>${esc(record.cutoffDate||'未记录')}</dd></div><div><dt>实际填写</dt><dd>${esc(record.filledAt?new Date(record.filledAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):'未记录')} · ${esc(record.filledBy?.name||'未记录')}</dd></div>${record.privateDetailsHidden?'<div class="full"><dt>历史说明</dt><dd>说明受权限限制</dd></div>':record.correctionReason?`<div class="full"><dt>更正原因</dt><dd>${esc(record.correctionReason)}</dd></div>`:''}</dl>`;
}
function v11TrackingMetricHTML(name,label,metric){
 const unknown=metric?.known===false;
 return `<fieldset class="v11-tracking-metric"><legend>${label}</legend><label class="v11-tracking-unknown"><input type="checkbox" id="tracking-${name}-unknown" ${unknown?'checked':''}> 数据无法获取</label><div data-tracking-known="${name}" ${unknown?'hidden':''}><label for="tracking-${name}" class="sr-only">${label}</label><input id="tracking-${name}" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="明确为0时请填写0" value="${esc(metric?.known===true?metric.value:'')}" ${unknown?'disabled':''}></div><div class="field" data-tracking-unknown="${name}" ${unknown?'':'hidden'}><label for="tracking-${name}-reason">未知原因 *</label><textarea id="tracking-${name}-reason" maxlength="2000" rows="2" ${unknown?'':'disabled'}>${esc(unknown?metric.reason:'')}</textarea></div></fieldset>`;
}
function v11TrackingDraw(context){
 if(!v11TrackingCurrent(context))return;const root=context.panel.querySelector('[data-tracking-body]');
 if(context.status!=='ready'){
  context.form=null;const text=context.status==='loading'?'正在读取发布及四节点记录…':context.status==='empty'?'该发布尚无有效的付费跟踪计划；请先核对实际发布日期和稿费交付关联。':context.status==='forbidden'?context.error:context.error||'推广跟踪暂时无法读取';
  root.innerHTML=`<div class="v11-tracking-message ${['error','forbidden'].includes(context.status)?'error':''}" role="${context.status==='loading'?'status':'alert'}">${esc(text)}${context.status==='error'?'<button type="button" class="btn" data-tracking-retry>重试</button>':''}</div>`;root.querySelector('[data-tracking-retry]')?.addEventListener('click',()=>v11TrackingRead(context));return;
 }
 const item=context.data,nodes=item.nodes.slice().sort((a,b)=>a.day-b.day);
 if(!nodes.some(node=>node.day===context.selected))context.selected=nodes.find(node=>!node.latest&&node.dueDate<=context.businessDate)?.day||15;
 const node=nodes.find(node=>node.day===context.selected),write=context.scope==='mine'&&item.canWrite===true&&node.canWrite===true&&node.dueDate<=context.businessDate,latest=node.latest,sourceURL=v11AdminSafeURL(item.url);
 context.panel.querySelector('#v11-tracking-title').textContent=item.title||'发布回填';
 root.innerHTML=`<div class="v11-tracking-source"><strong>${esc(item.kolName||'关联KOL')}</strong><span>${esc(item.platform||'平台未记录')} · 实际发布 ${esc(item.actualPublishedDate||'未记录')}</span>${sourceURL?`<a class="v11-tracking-source-link" href="${esc(sourceURL)}" target="_blank" rel="noopener noreferrer" title="${esc(sourceURL)}">${esc(sourceURL)}</a>`:''}<small>负责人：${esc(item.owner?.name||'待指派')} · ${context.scope==='all'?'管理员只读查看':'当前负责人回填'}</small></div>${item.sourceMessage?`<p class="notice" role="status">${esc(item.sourceMessage||v11TrackingLabels[item.sourceStatus]||'来源暂停核对')}</p>`:''}<p class="v11-tracking-note">每条发布独立保留四次累计快照，不将四次数据相加。未知与已确认的0分别记录。</p><div class="v11-tracking-nodes" role="tablist" aria-label="四个跟踪节点">${nodes.map(n=>`<button type="button" role="tab" id="tracking-node-${n.day}" aria-controls="tracking-node-panel" tabindex="${n.day===node.day?0:-1}" aria-selected="${n.day===node.day}" data-tracking-node="${n.day}"><strong>第${n.day}天</strong><time>${esc(n.dueDate)}</time><span>${esc(v11TrackingLabels[n.status]||'待核对')}</span></button>`).join('')}</div><section class="v11-tracking-node" id="tracking-node-panel" role="tabpanel" aria-labelledby="tracking-node-${node.day}"><h3>第${node.day}天 · ${esc(v11TrackingLabels[node.status]||'待核对')}</h3>${latest?`<div class="v11-tracking-latest"><small>当前记录 · 第${esc(latest.revision)}版</small>${v11TrackingRecordHTML(latest)}</div>`:''}${write?`<form id="v11-tracking-form" novalidate><h3>${latest?'更正本节点':'回填本节点'}</h3><div class="v11-tracking-metrics">${v11TrackingMetricHTML('registered','累计新增注册人数',latest?.registered)}${v11TrackingMetricHTML('orders','累计订单数',latest?.orders)}</div><div class="field"><label for="tracking-cutoff">统计截至日期 *</label><input type="date" id="tracking-cutoff" min="${esc(node.dueDate)}" max="${esc(context.businessDate)}" value="${esc(latest?.cutoffDate||context.businessDate)}"><small>节点日 ${esc(node.dueDate)} 至今天 ${esc(context.businessDate)}；晚填按真实统计截止日记录。</small></div><div class="field" data-tracking-correction ${latest?'':'hidden'}><label for="tracking-correction">更正原因 *</label><textarea id="tracking-correction" maxlength="2000" rows="2"></textarea></div><p class="inlinecheck error" role="alert" id="tracking-error"></p><p class="v11-tracking-note">保存成功后结束本节点；含未知数据会保留独立状态。无需上传截图。</p><div class="actions"><button type="button" class="btn" data-tracking-refresh hidden>读取最新版本并保留草稿</button><button type="submit" class="btn primary" data-tracking-save>${latest?'保存更正':'保存回填'}</button></div></form>`:`<p class="v11-tracking-readonly">${node.dueDate>context.businessDate?'节点尚未到期，可查看计划；到期后由当前负责人回填。':context.scope==='all'?'管理员全局只读；回填与更正由当前负责人处理。':'当前仅可查看；请核对来源及负责人。'}</p>`}<details class="v11-tracking-history"><summary>版本历史（${(node.history||[]).length}）</summary>${(node.history||[]).slice().reverse().map(record=>`<article><h4>第${esc(record.revision)}版</h4>${v11TrackingRecordHTML(record)}</article>`).join('')||'<p>暂无已保存记录</p>'}</details></section>`;
 root.querySelectorAll('[data-tracking-node]').forEach(button=>{button.onclick=()=>v11TrackingLeave(()=>{context.selected=Number(button.dataset.trackingNode);context.pending=null;context.conflicted=false;v11TrackingDraw(context);context.panel.querySelector(`[data-tracking-node="${context.selected}"]`)?.focus()});button.onkeydown=event=>{const index=v11TrackingDays.indexOf(Number(button.dataset.trackingNode));let next;if(event.key==='ArrowRight')next=v11TrackingDays[(index+1)%4];else if(event.key==='ArrowLeft')next=v11TrackingDays[(index+3)%4];else if(event.key==='Home')next=15;else if(event.key==='End')next=90;else return;event.preventDefault();root.querySelector(`[data-tracking-node="${next}"]`)?.click()};});
 context.form=root.querySelector('#v11-tracking-form');context.composing=false;context.snapshot=context.form?v7Snapshot(context.form):'';context.error='';
 if(context.form){const form=context.form;form.onsubmit=event=>{event.preventDefault();v11TrackingSave(context)};form.addEventListener('compositionstart',()=>{context.composing=true});form.addEventListener('compositionend',()=>{context.composing=false});form.addEventListener('keydown',event=>{if((context.composing||event.isComposing||event.keyCode===229)&&['Enter','Escape'].includes(event.key)){event.stopPropagation();if(event.key==='Enter')event.preventDefault()}});
  for(const name of ['registered','orders'])form.querySelector('#tracking-'+name+'-unknown').onchange=()=>{const unknown=form.querySelector('#tracking-'+name+'-unknown').checked;form.querySelector(`[data-tracking-known="${name}"]`).hidden=unknown;form.querySelector('#tracking-'+name).disabled=unknown;form.querySelector(`[data-tracking-unknown="${name}"]`).hidden=!unknown;form.querySelector('#tracking-'+name+'-reason').disabled=!unknown;};
  form.querySelector('[data-tracking-refresh]').onclick=()=>v11TrackingRead(context,true);
 }
}
function v11TrackingError(context,message){if(!v11TrackingCurrent(context))return;context.error=message;const box=context.form?.querySelector('#tracking-error');if(box)box.textContent=message;}
function v11TrackingFormState(context){if(!v11TrackingCurrent(context,context.form))return;const node=context.data.nodes.find(n=>n.day===context.selected),write=context.scope==='mine'&&context.data.canWrite===true&&node?.canWrite===true;context.form.querySelector('[data-tracking-save]').disabled=context.busy||context.conflicted||!write;context.form.querySelector('[data-tracking-refresh]').hidden=!context.conflicted&&write;context.form.querySelector('[data-tracking-correction]').hidden=!node?.latest;}
function v11TrackingPayload(context){
 const form=context.form,get=id=>form.querySelector('#'+id),node=context.data.nodes.find(n=>n.day===context.selected),payload={key:context.data.key,node:node.day,version:node.version,cutoffDate:get('tracking-cutoff').value,correctionReason:get('tracking-correction').value.trim()};
 for(const name of ['registered','orders']){const unknown=get('tracking-'+name+'-unknown').checked,value=get('tracking-'+name).value.trim(),reason=get('tracking-'+name+'-reason').value.trim();if(unknown){if(!reason)throw {message:'请填写'+(name==='registered'?'注册人数':'订单数')+'的未知原因',field:get('tracking-'+name+'-reason')};payload[name]={known:false,value:null,reason};}else{if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value)))throw {message:'请明确填写非负整数；已确认无结果时填写0',field:get('tracking-'+name)};payload[name]={known:true,value:Number(value),reason:''};}}
 if(!v11TrackingDate(payload.cutoffDate)||payload.cutoffDate<node.dueDate||payload.cutoffDate>context.businessDate)throw {message:'统计截止日须在节点日至今天之间',field:get('tracking-cutoff')};
 if(node.latest&&!payload.correctionReason)throw {message:'更正已有记录须填写原因',field:get('tracking-correction')};if(!node.latest)payload.correctionReason='';return payload;
}
async function v11TrackingSave(context=v11TrackingEditor){
 if(!context||!v11TrackingCurrent(context,context.form)||context.busy||context.composing||context.conflicted)return false;const form=context.form,node=context.data.nodes.find(n=>n.day===context.selected);
 if(context.scope!=='mine'||context.data.canWrite!==true||node.canWrite!==true||node.dueDate>context.businessDate)return false;
 let payload;try{payload=v11TrackingPayload(context)}catch(error){v11TrackingError(context,error.message);error.field?.focus();return false}
 const signature=JSON.stringify(payload);if(context.pending?.signature!==signature)context.pending={signature,body:{...payload,requestId:crypto.randomUUID()}};
 const request=context.pending,sequence=++context.sequence,controls=[...form.elements].map(control=>[control,control.disabled]);context.busy=true;v11TrackingError(context,'');controls.forEach(([control])=>control.disabled=true);form.setAttribute('aria-busy','true');
 try{
  const result=await api('/api/promotion-tracking/save',request.body);if(!v11TrackingCurrent(context,form)||context.sequence!==sequence)return false;
  const item=v11TrackingValidateTrack(result.item,payload.key),savedNode=item.nodes.find(n=>n.day===payload.node);
  if(result.ok!==true||result.record?.requestId!==request.body.requestId||!savedNode.latest||!['completed','unknown'].includes(savedNode.status))throw Error('保存回执不完整，结果尚未确认；请保留输入后重试');
  context.data=item;context.pending=null;context.busy=false;context.snapshot=v7Snapshot(form);context.conflicted=false;
  const state=v11TrackingSync();state.items=state.items.filter(n=>n.key!==node.key);state.status='idle';if(v11TrackingWorkspace())v11TrackingLoadTasks(true);
  v11TrackingDraw(context);const notice=document.createElement('p');notice.className='v11-tracking-success';notice.setAttribute('role','status');notice.textContent=(result.warnings||[]).length?'回填已确认保存；'+result.warnings.map(w=>typeof w==='string'?w:w.message||'累计值下降，请核对').join('；'):'回填已确认保存，本节点已结束。';context.panel.querySelector('.v11-tracking-node').prepend(notice);return true;
 }catch(error){if(!v11TrackingCurrent(context,form)||context.sequence!==sequence)return false;if(await v11TrackingAccess(context,error))return false;
  context.conflicted=error.status===409;v11TrackingError(context,error.message+(context.conflicted?'；输入已保留，请读取最新版本后核对。':'；输入已保留，可重试。'));return false;
 }finally{if(v11TrackingCurrent(context,form)){context.busy=false;controls.forEach(([control,disabled])=>control.disabled=disabled);form.removeAttribute('aria-busy');v11TrackingFormState(context);}}
}
const v11TrackingBaseGuard=guardProfileLeave;guardProfileLeave=function(action){const context=v11TrackingEditor;if(context&&v11TrackingCurrent(context))return v11TrackingLeave(()=>{v11TrackingFinish(context,false);v11TrackingBaseGuard(action)});return v11TrackingBaseGuard(action)};
const v11TrackingBaseClose=closeDrawer;closeDrawer=function(){if(v11TrackingEditor&&v11TrackingCurrent(v11TrackingEditor))return v11TrackingClose();return v11TrackingBaseClose()};
const v11TrackingBaseForce=forceClose;forceClose=function(){if(v11TrackingEditor)v11TrackingFinish(v11TrackingEditor,false);if(v11TrackingState&&(!v11TrackingAllowed()||v11TrackingState.user!==currentUser)){v11TrackingState.sequence++;v11TrackingState=null;}return v11TrackingBaseForce()};
const v11TrackingBasePromo=v10PromoDetailHTML;v10PromoDetailHTML=function(entry){const html=v11TrackingBasePromo(entry);if(!html||!v11TrackingWorkspace())return html;return html.replace('</div><footer class="v10-promo-detail-footer">',`<section class="v11-tracking-entry"><h3>推广数据跟踪</h3><button type="button" class="btn small" data-tracking-publication data-tracking-kol="${esc(entry.k.id)}" data-tracking-publication-id="${esc(entry.record.id)}">查看四节点跟踪</button></section></div><footer class="v10-promo-detail-footer">`)};
function v11TrackingBindPublication(root){root?.querySelectorAll('[data-tracking-publication]').forEach(button=>button.onclick=()=>v11TrackingOpen({kolId:button.dataset.trackingKol,publicationId:button.dataset.trackingPublicationId}))}
const v11TrackingBasePromoBind=bindV10PromotionDetail;bindV10PromotionDetail=function(root){v11TrackingBasePromoBind(root);v11TrackingBindPublication(root)};
const v11TrackingBaseCooperation=v10CooperationDetailDraw;v10CooperationDetailDraw=function(context){v11TrackingBaseCooperation(context);if(!v11TrackingWorkspace()||!v10CooperationValid(context)||context.status!=='ready'||context.data?.item?.historical===true)return;context.element.querySelectorAll('.v10-detail-publication').forEach((element,index)=>{const publication=context.data.publications[index];if(!publication)return;const button=document.createElement('button');button.type='button';button.className='btn small';button.textContent='查看推广跟踪';button.setAttribute('data-tracking-publication','');button.dataset.trackingKol=String(context.data.item.kolId);button.dataset.trackingPublicationId=String(publication.id);element.append(button)});v11TrackingBindPublication(context.element)};
const v11TrackingBaseAdmin=v11AdminPaintDetail;v11AdminPaintDetail=function(context,detail){v11TrackingBaseAdmin(context,detail);if(!v11TrackingAllowed()||currentUser.role!=='admin'||!v11AdminDetailCurrent(context,detail)||detail.status!=='ready'||!detail.data?.trackingRef?.key)return;const button=document.createElement('button');button.type='button';button.className='btn small';button.setAttribute('data-tracking-admin-view','');button.textContent='查看推广跟踪（只读）';button.onclick=()=>v11TrackingOpen({key:detail.data.trackingRef.key,scope:'all'});detail.panel.querySelector('[data-admin-detail-body]').append(button)};
document.addEventListener('keydown',event=>{const context=v11TrackingEditor;if(!context||!v11TrackingCurrent(context)||event.key!=='Escape')return;event.stopImmediatePropagation();if(event.isComposing||event.keyCode===229||context.composing)return;event.preventDefault();const prompt=context.panel.querySelector('.v11-tracking-leave');if(prompt){prompt.querySelector('[data-tracking-keep]').click();return}v11TrackingClose()},true);
window.addEventListener('beforeunload',event=>{const context=v11TrackingEditor;if(context&&v11TrackingCurrent(context)&&(context.busy||v11TrackingDirty(context))){event.preventDefault();event.returnValue='';}});
window.addEventListener('pagehide',v11TrackingReset);
setInterval(()=>{if(v11TrackingWorkspace()&&['home','tasks'].includes(page)&&!document.hidden&&!document.querySelector('#overlay [role="dialog"]'))v11TrackingLoadTasks()},30000);
window.addEventListener('focus',()=>{if(v11TrackingWorkspace()&&['home','tasks'].includes(page)&&!document.querySelector('#overlay [role="dialog"]'))v11TrackingLoadTasks()});
