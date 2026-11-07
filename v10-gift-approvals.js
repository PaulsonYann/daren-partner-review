/* Gift approvals use an explicitly authorized server projection, not fee roles. */
let v10GiftApprovalView=null;
function v10GiftApprovalState(){
 if(!v10GiftApprovalView||v10GiftApprovalView.user!==currentUser){if(v10GiftApprovalView?.editor)disposeV10GiftApproval(v10GiftApprovalView.editor);v10GiftApprovalView={user:currentUser,active:'fees',root:null,items:[],status:'idle',error:'',sequence:0,hasRole:false,filter:'submitted',editor:null,focusIntent:null};}
 return v10GiftApprovalView;
}
function v10GiftApprovalValid(state){return !!state&&state===v10GiftApprovalView&&state.user===currentUser&&page==='fees'&&state.active==='gifts'&&state.root?.isConnected;}
function v10GiftApprovalEditorValid(context){return !!context&&!context.finished&&v10GiftApprovalValid(context.state)&&context.state.editor===context&&(!context.form||context.form.isConnected);}
function v10GiftApprovalCategories(){return [['fees','稿费审批'],['gifts','产品赠送'],...(typeof mountV10GiftFulfillments==='function'?[['fulfillments','赠送发放']]:[])];}
function v10GiftApprovalTabs(state){return `<div class="v10-approval-categories" role="tablist" aria-label="审批分类">${v10GiftApprovalCategories().map(([id,label])=>`<button type="button" role="tab" data-approval-category="${id}" aria-selected="${state.active===id}" tabindex="${state.active===id?0:-1}">${label}</button>`).join('')}</div>`;}
function bindV10GiftApprovalTabs(state){
 document.querySelectorAll('[data-approval-category]').forEach(button=>{button.onclick=()=>{if(state!==v10GiftApprovalState()||state.user!==currentUser||page!=='fees'||state.active===button.dataset.approvalCategory)return;guardProfileLeave(()=>{if(state.user!==currentUser||page!=='fees')return;state.active=button.dataset.approvalCategory;renderContent();document.querySelector('[data-approval-category="'+state.active+'"]')?.focus({preventScroll:true});});};button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const ids=v10GiftApprovalCategories().map(value=>value[0]),index=ids.indexOf(state.active),id=event.key==='Home'?ids[0]:event.key==='End'?ids[ids.length-1]:ids[(index+(event.key==='ArrowRight'?1:ids.length-1))%ids.length];document.querySelector('[data-approval-category="'+id+'"]')?.click();};});
}
function v10GiftApprovalListHTML(state){
 const items=state.items.filter(item=>state.filter==='submitted'?item.status==='submitted':item.status!=='submitted');
 let body;if(state.status==='error')body='<div class="v10-gift-message error" role="alert"><p>'+esc(state.error)+'</p><button type="button" class="btn" data-gift-approval-retry>重新读取</button></div>';
 else if(state.status!=='ready')body='<div class="v10-gift-message" role="status">正在读取产品赠送审批…</div>';
 else if(!state.hasRole)body='<div class="v10-gift-empty">当前账号未获产品赠送审批授权；如需处理，请联系负责人配置。</div>';
 else body=`<div class="v10-gift-tablewrap"><table class="v10-gift-table"><thead><tr><th>关联 KOL</th><th>赠送内容</th><th>状态</th><th>操作</th></tr></thead><tbody>${items.map(item=>`<tr><td data-label="关联 KOL"><strong>${esc(item.kolName)}</strong></td><td data-label="赠送内容">${v10GiftContent(item)}</td><td data-label="状态"><span class="v10-gift-status ${item.status}">${V10_GIFT_STATUS[item.status]}</span></td><td data-label="操作"><button type="button" class="textbtn" data-gift-approval-open="${esc(item.id)}">查看</button></td></tr>`).join('')}</tbody></table>${items.length?'':'<div class="v10-gift-empty">暂无'+(state.filter==='submitted'?'待处理':'历史')+'赠送申请</div>'}</div>`;
 return `<section class="panel v10-gift-approval-list" aria-label="产品赠送审批"><div class="v10-gift-toolbar"><div class="v10-gift-approval-filters"><button type="button" class="textbtn ${state.filter==='submitted'?'active':''}" data-gift-approval-filter="submitted" aria-pressed="${state.filter==='submitted'}">待处理</button><button type="button" class="textbtn ${state.filter==='history'?'active':''}" data-gift-approval-filter="history" aria-pressed="${state.filter==='history'}">历史记录</button></div><span data-gift-approval-count>${state.status==='ready'?items.length+' 条记录 · 共 '+state.items.length+' 条':state.status==='error'?'记录未能读取':'正在读取记录'}</span></div>${body}</section>`;
}
function drawV10GiftApprovals(state){
 if(!v10GiftApprovalValid(state)||state.editor)return;
 const active=document.activeElement,inside=state.root.contains(active),focusedId=inside?active?.dataset?.giftApprovalOpen:null,focusedFilter=inside?active?.dataset?.giftApprovalFilter:null,focusedRetry=inside&&active?.hasAttribute('data-gift-approval-retry'),idleFocus=active===document.body||active===document.documentElement;
 state.root.innerHTML=v10GiftApprovalListHTML(state);
 state.root.querySelector('[data-gift-approval-retry]')?.addEventListener('click',()=>loadV10GiftApprovals(state));
 state.root.querySelectorAll('[data-gift-approval-open]').forEach(button=>button.onclick=()=>openV10GiftApproval(button.dataset.giftApprovalOpen));
 state.root.querySelectorAll('[data-gift-approval-filter]').forEach(button=>button.onclick=()=>{state.filter=button.dataset.giftApprovalFilter;drawV10GiftApprovals(state);state.root.querySelector('[data-gift-approval-filter="'+state.filter+'"]')?.focus({preventScroll:true});});
 const retained=focusedId?[...state.root.querySelectorAll('[data-gift-approval-open]')].find(button=>button.dataset.giftApprovalOpen===focusedId):focusedFilter?state.root.querySelector('[data-gift-approval-filter="'+focusedFilter+'"]'):focusedRetry?state.root.querySelector('[data-gift-approval-retry]'):null;
 if(retained)retained.focus({preventScroll:true});
 if(state.status!=='loading'&&state.focusIntent?.ticket===state.sequence){const intent=state.focusIntent;state.focusIntent=null;if(idleFocus&&!retained){const target=[...state.root.querySelectorAll('[data-gift-approval-open]')].find(button=>button.dataset.giftApprovalOpen===intent.id)||state.root.querySelector('[data-gift-approval-filter="'+state.filter+'"]');target?.focus({preventScroll:true});}}
}
async function loadV10GiftApprovals(state=v10GiftApprovalState()){
 if(!v10GiftApprovalValid(state)||state.status==='loading')return;const ticket=++state.sequence;state.status='loading';state.error='';drawV10GiftApprovals(state);
 try{const result=await api('/api/gift-approvals');if(!v10GiftApprovalValid(state)||ticket!==state.sequence)return;if(typeof result.hasApprovalRole!=='boolean'||!Array.isArray(result.items))throw Error('赠送审批列表返回异常');v10GiftCatalog(result.catalog);const items=result.items.map(v10GiftItem);if(items.some(item=>item.status==='draft')||!result.hasApprovalRole&&items.length||new Set(items.map(item=>item.id)).size!==items.length)throw Error('赠送审批列表返回异常');state.items=items;state.hasRole=result.hasApprovalRole;state.status='ready';}
 catch(error){if(!v10GiftApprovalValid(state)||ticket!==state.sequence)return;state.status='error';state.error=error.message||'赠送审批读取失败';}drawV10GiftApprovals(state);
}
function v10GiftApprovalFormHTML(context){
 const item=context.item,canAct=item.status==='submitted'&&['approve','return','reject'].some(action=>item.actions?.[action]);
 const rows=[['关联 KOL',item.kolName],['赠送内容',[item.productName,item.packageName,item.duration].filter(Boolean).join(' · ')],['接收邮箱',item.recipient],['关联合作',item.cooperationTitle||'不关联合作'],['赠送原因',item.reason],['重复申请补充原因',item.repeatReason||'未填写']];
 return `<form class="panel v10-gift-form v10-gift-approval-form" id="v10giftapprovalform"><header class="v10-gift-formhead"><div><h2>赠送审批</h2><span class="v10-gift-status ${item.status}">${V10_GIFT_STATUS[item.status]}</span></div><button type="button" class="iconbtn" data-gift-approval-back aria-label="返回赠送审批列表">${I('close')}</button></header>${item.status==='approved'?'<p class="v10-gift-catalog-note">审批通过，等待后续发放；尚未登记完成。</p>':''}${item.catalogChanged?'<p class="v10-gift-warning">提交后的目录已变更，不可直接批准；请退回申请人重新选择有效套餐。</p>':''}<dl class="v10-gift-summary">${rows.map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value||'未填写')+'</dd></div>').join('')}</dl><section class="v10-gift-formsection"><h3>同 KOL 同产品申请</h3>${item.duplicateHistory.length?item.duplicateHistory.map(record=>'<p class="v10-gift-catalog-note">'+esc([record.productName,record.packageName,V10_GIFT_STATUS[record.status]||'状态待核对'].filter(Boolean).join(' · '))+'</p>').join(''):'<p class="v10-gift-catalog-note">暂无其他已提交的同产品申请。</p>'}</section>${v10GiftHistoryHTML(item)}${canAct?v10GiftField('giftopinion','处理意见（退回 / 拒绝时必填）','<textarea id="giftopinion" maxlength="2000" rows="3" placeholder="填写处理意见"></textarea>'):''}<div class="v10-gift-save-feedback"><p data-gift-approval-error role="alert"></p><button type="button" class="textbtn" data-gift-approval-reload hidden>重新读取申请</button><p data-gift-approval-status role="status"></p></div><footer class="v10-gift-formactions"><button type="button" class="btn" data-gift-approval-back>返回列表</button>${canAct?['reject','return','approve'].filter(action=>item.actions?.[action]).map(action=>`<button type="button" class="btn ${action==='approve'?'primary':''}" data-gift-decision="${action}">${({approve:'通过 · 待发放',return:'退回补充',reject:'拒绝申请'})[action]}</button>`).join(''):''}<button type="button" class="btn primary" data-gift-decision-retry hidden>确认原处理结果</button></footer></form>`;
}
async function openV10GiftApproval(id){
 const state=v10GiftApprovalState();if(!v10GiftApprovalValid(state)||state.editor)return;state.focusIntent=null;const context={state,user:state.user,id,item:null,form:null,finished:false,busy:false,blocked:false,pending:null,composing:false};state.editor=context;
 state.root.innerHTML='<section class="panel"><div class="v10-gift-message" role="status">正在读取赠送申请…</div><button type="button" class="btn" data-gift-approval-back>返回列表</button></section>';state.root.querySelector('[data-gift-approval-back]').onclick=()=>closeV10GiftApproval(context);
 try{const result=await api('/api/gift-approvals?id='+encodeURIComponent(id));if(!v10GiftApprovalEditorValid(context))return;v10GiftCatalog(result.catalog);const item=v10GiftItem(result.item);if(item.id!==id||item.status==='draft'||result.hasApprovalRole!==true)throw Error('无法核对赠送审批身份');context.item=item;drawV10GiftApproval(context);}
 catch(error){if(!v10GiftApprovalEditorValid(context))return;state.root.innerHTML='<section class="panel"><div class="v10-gift-message error" role="alert"><p>'+esc(error.message||'申请读取失败')+'</p><button type="button" class="btn" data-gift-approval-detail-retry>重试</button><button type="button" class="btn" data-gift-approval-back>返回列表</button></div></section>';state.root.querySelector('[data-gift-approval-detail-retry]').onclick=()=>{disposeV10GiftApproval(context);openV10GiftApproval(id);};state.root.querySelector('[data-gift-approval-back]').onclick=()=>closeV10GiftApproval(context);}
}
function drawV10GiftApproval(context){
 if(!v10GiftApprovalEditorValid(context))return;context.state.root.innerHTML=v10GiftApprovalFormHTML(context);context.form=context.state.root.querySelector('#v10giftapprovalform');const form=context.form;
 form.onsubmit=event=>event.preventDefault();form.querySelectorAll('[data-gift-approval-back]').forEach(button=>button.onclick=()=>attemptV10GiftApprovalExit(context));
 form.querySelectorAll('[data-gift-decision]').forEach(button=>button.onclick=()=>decideV10Gift(context,button.dataset.giftDecision));form.querySelector('[data-gift-decision-retry]').onclick=()=>decideV10Gift(context,context.pending?.payload.action);
 form.querySelector('[data-gift-approval-reload]').onclick=()=>promptV10GiftApprovalLeave(context,()=>{const id=context.id;disposeV10GiftApproval(context);openV10GiftApproval(id);},true);
 form.addEventListener('compositionstart',()=>context.composing=true);form.addEventListener('compositionend',()=>context.composing=false);form.addEventListener('keydown',event=>{if(context.composing||event.isComposing||event.keyCode===229){if(['Enter','Escape'].includes(event.key))event.stopPropagation();return;}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();attemptV10GiftApprovalExit(context);}});form.querySelector('[data-gift-approval-back]')?.focus({preventScroll:true});
}
function syncV10GiftApproval(context){
 if(!v10GiftApprovalEditorValid(context)||!context.form)return;const form=context.form,pending=!!context.pending;
 form.querySelectorAll('[data-gift-decision]').forEach(button=>button.disabled=context.busy||context.blocked||pending||context.item.status!=='submitted'||!context.item.actions?.[button.dataset.giftDecision]);
 const opinion=form.querySelector('#giftopinion');if(opinion)opinion.disabled=context.busy||context.blocked||pending;
 const retry=form.querySelector('[data-gift-decision-retry]');retry.hidden=!pending;retry.disabled=context.busy||context.blocked;
}
async function decideV10Gift(context,action){
 if(!v10GiftApprovalEditorValid(context)||context.busy||context.blocked||context.composing||!['approve','return','reject'].includes(action))return false;
 if(!context.pending&&(context.item.status!=='submitted'||!context.item.actions?.[action]))return false;
 const form=context.form,opinion=(form.querySelector('#giftopinion')?.value||'').trim();
 if(!context.pending&&action!=='approve'&&!opinion.trim()){form.querySelector('[data-gift-approval-error]').textContent='退回或拒绝时请填写处理意见';form.querySelector('#giftopinion').focus();return false;}
 if(!form.reportValidity())return false;
 let pending=context.pending;if(!pending){pending={payload:{action,id:context.item.id,version:context.item.version,requestId:crypto.randomUUID(),opinion},baseline:structuredClone(context.item)};context.pending=pending;}
 const controls=[...form.querySelectorAll('input,select,textarea,button'),...(context.prompt?.isConnected?[...context.prompt.querySelectorAll('button')]:[])],disabled=controls.map(control=>control.disabled);context.busy=true;controls.forEach(control=>control.disabled=true);form.querySelector('[data-gift-approval-error]').textContent='';form.querySelector('[data-gift-approval-status]').textContent='正在处理申请…';
 try{
  let response;try{response=await api('/api/gifts',pending.payload);}catch(error){if(error.status===400)context.pending=null;throw error;}
  if(!v10GiftApprovalEditorValid(context))return false;const item=v10GiftItem(response?.item),transition=response.transition,status=({approve:'approved',return:'returned',reject:'rejected'})[pending.payload.action],version=pending.payload.version+1;
  if(typeof response.idempotent!=='boolean'||item.id!==context.id||!transition||transition.action!==pending.payload.action||transition.appliedVersion!==version||transition.status!==status||transition.round!==pending.baseline.round)throw Error('处理回执不完整，请用原请求确认结果');
  if(item.version!==version||item.status!==status||item.round!==pending.baseline.round||JSON.stringify(v10GiftData(item))!==JSON.stringify(v10GiftData(pending.baseline)))throw Object.assign(Error('原处理已找到，但申请随后有变化；当前意见已保留，请重新读取核对'),{status:409});
  if(opinion!==pending.payload.opinion)throw Object.assign(Error('原处理已完成，当前不同意见尚未提交；请重新读取核对'),{status:409});
  context.pending=null;context.item=item;context.state.sequence++;context.state.status='idle';context.state.items=[item,...context.state.items.filter(value=>value.id!==item.id)];closeV10GiftApproval(context);return true;
 }catch(error){if(!v10GiftApprovalEditorValid(context))return false;form.querySelector('[data-gift-approval-error]').textContent=error.message||'处理未完成，意见已保留';if([403,404,409].includes(error.status)){context.blocked=true;form.querySelector('[data-gift-approval-reload]').hidden=false;}return false;}
 finally{context.busy=false;controls.forEach((control,index)=>{if(control.isConnected)control.disabled=disabled[index];});if(v10GiftApprovalEditorValid(context)){form.querySelector('[data-gift-approval-status]').textContent=context.pending?'处理结果尚待确认，请确认原处理结果。':'';syncV10GiftApproval(context);}}
}
function disposeV10GiftApproval(context){if(!context||context.finished)return;context.finished=true;context.prompt?.remove();if(context.state.editor===context)context.state.editor=null;}
function closeV10GiftApproval(context,showList=true){if(!context||context.finished)return;const valid=v10GiftApprovalEditorValid(context),state=context.state,id=context.id;disposeV10GiftApproval(context);if(valid&&showList){state.sequence++;state.status='idle';state.error='';drawV10GiftApprovals(state);state.focusIntent={id,ticket:state.sequence+1};loadV10GiftApprovals(state);}}
function v10GiftApprovalDirty(context){return v10GiftApprovalEditorValid(context)&&!!context.form&&(!!context.pending||!!context.form.querySelector('#giftopinion')?.value);}
function promptV10GiftApprovalLeave(context,after=null,reload=false){
 if(!v10GiftApprovalEditorValid(context)||context.busy||document.querySelector('#leaveprompt'))return;const prompt=document.createElement('div');prompt.id='leaveprompt';prompt.className='leaveprompt v10-gift-leave';context.prompt=prompt;
 prompt.innerHTML='<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="处理意见尚未确认"><h2>'+ (reload?'重新读取申请':'处理意见尚未确认')+'</h2><p>'+ (context.pending?'原处理可能已生效；放弃本地意见不会撤销已处理结果。':'离开会放弃当前尚未提交的意见。')+'</p><div class="actions"><button type="button" class="btn" data-approval-continue>继续查看</button><button type="button" class="btn" data-approval-discard>'+ (reload?'放弃并重新读取':'放弃并离开')+'</button></div></section></div>';document.querySelector('#overlay').append(prompt);
 prompt.querySelector('[data-approval-continue]').onclick=()=>{if(context.busy)return;prompt.remove();(context.form?.querySelector('#giftopinion:not(:disabled)')||context.form?.querySelector('[data-gift-decision-retry]:not(:disabled)')||context.form?.querySelector('[data-gift-approval-back]'))?.focus({preventScroll:true});};prompt.querySelector('[data-approval-discard]').onclick=()=>{if(!v10GiftApprovalEditorValid(context)||context.busy)return;prompt.remove();if(reload){if(after)after();}else{closeV10GiftApproval(context,!after);if(after)after();}};prompt.querySelector('[data-approval-continue]').focus();
}
function attemptV10GiftApprovalExit(context,after=null){if(!v10GiftApprovalEditorValid(context))return;if(context.busy){toast('正在处理，请稍候');return;}if(v10GiftApprovalDirty(context)){promptV10GiftApprovalLeave(context,after);return;}closeV10GiftApproval(context,!after);if(after)after();}
const v10GiftApprovalPreviousRender=renderContent;
renderContent=function(){
 const state=v10GiftApprovalState();if(page!=='fees'){v10GiftApprovalPreviousRender();return;}
 if(state.active==='fees'){v10GiftApprovalPreviousRender();const content=document.querySelector('#content');if(!content.querySelector('[data-approval-category]'))content.insertAdjacentHTML('afterbegin',v10GiftApprovalTabs(state));bindV10GiftApprovalTabs(state);return;}
 const content=document.querySelector('#content');if(!state.root?.isConnected||state.root.parentElement!==content){renderWorkspaceContent(v10GiftApprovalTabs(state)+'<div class="v10-gifts v10-gift-approvals"></div>');state.root=content.querySelector('.v10-gift-approvals');state.editor=null;state.focusIntent=null;if(state.status==='loading')state.status='idle';drawV10GiftApprovals(state);loadV10GiftApprovals(state);}bindV10GiftApprovalTabs(state);
};
const v10GiftApprovalPreviousGuard=guardProfileLeave;
guardProfileLeave=function(action){const context=v10GiftApprovalState().editor;if(v10GiftApprovalEditorValid(context)){attemptV10GiftApprovalExit(context,()=>v10GiftApprovalPreviousGuard(action));return;}return v10GiftApprovalPreviousGuard(action);};
const v10GiftApprovalPreviousNav=nav;
nav=function(destination){const context=v10GiftApprovalState().editor;if(v10GiftApprovalEditorValid(context)){if(destination==='fees'){renderContent();return;}attemptV10GiftApprovalExit(context,()=>v10GiftApprovalPreviousNav(destination));return;}return v10GiftApprovalPreviousNav(destination);};
const v10GiftApprovalPreviousClose=closeDrawer;
closeDrawer=function(){const context=v10GiftApprovalState().editor;if(v10GiftApprovalEditorValid(context)){attemptV10GiftApprovalExit(context);return;}return v10GiftApprovalPreviousClose();};
const v10GiftApprovalPreviousForceClose=forceClose;
forceClose=function(){if(v10GiftApprovalView?.editor)disposeV10GiftApproval(v10GiftApprovalView.editor);return v10GiftApprovalPreviousForceClose();};
window.addEventListener('beforeunload',event=>{const context=v10GiftApprovalState().editor;if(v10GiftApprovalEditorValid(context)&&(context.busy||v10GiftApprovalDirty(context))){event.preventDefault();event.returnValue='';}});
