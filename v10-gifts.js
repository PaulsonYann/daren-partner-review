/* V10-023: private gift applications. Approval and fulfilment are separate. */
const V10_GIFT_DATA_FIELDS=['kolId','cooperationId','recipient','reason','productId','packageId','repeatReason'];
const V10_GIFT_STATUS={draft:'草稿',submitted:'待审批',returned:'待补充',approved:'待发放',rejected:'已拒绝',completed:'已完成'};
if(typeof logLabels!=='undefined')Object.assign(logLabels,{gift_draft_saved:'保存赠送草稿',gift_submit:'提交赠送申请',gift_approve:'批准赠送申请',gift_return:'退回赠送申请',gift_reject:'拒绝赠送申请'});
if(typeof logLabels!=='undefined')Object.assign(logLabels,{gift_record_success:'登记赠送发放成功',gift_record_failure:'记录赠送发放失败'});
let v10GiftView=null;
function v10GiftState(){
 if(!v10GiftView||v10GiftView.user!==currentUser){
  if(v10GiftView?.editor)disposeV10GiftEditor(v10GiftView.editor);
  v10GiftView={user:currentUser,root:null,items:[],status:'idle',error:'',sequence:0,editor:null,focusIntent:null,catalog:{status:'pending',version:0,products:[]},canSubmit:false,submissionBlockedReason:'产品与套餐目录待配置，当前仅可保存草稿。',filter:''};
 }
 return v10GiftView;
}
function v10GiftValid(state){return !!state&&v10GiftView===state&&currentUser===state.user&&page==='business'&&v10BusinessState().active==='gifts'&&state.root?.isConnected;}
function v10GiftEditorValid(context){return !!context&&!context.finished&&v10GiftValid(context.state)&&context.state.editor===context&&currentUser===context.user&&(!context.form||context.form.isConnected);}
function v10GiftItem(value){
 if(!value||typeof value.id!=='string'||!value.id||!Number.isSafeInteger(value.kolId)||value.kolId<1||!Number.isInteger(value.version)||value.version<1||!Object.hasOwn(V10_GIFT_STATUS,value.status)||['kolName','cooperationId','cooperationTitle','recipient','reason','productId','packageId','createdAt','updatedAt'].some(key=>typeof value[key]!=='string')||!Number.isFinite(Date.parse(value.createdAt))||!Number.isFinite(Date.parse(value.updatedAt)))throw Error('赠送资料返回不完整，请重试核对');
 const result={repeatReason:'',productName:'',packageName:'',duration:'',round:0,history:[],duplicateHistory:[],submittedAt:'',attempts:[],approvedAt:'',completedAt:'',...value};
 if(['repeatReason','productName','packageName','duration','submittedAt'].some(key=>typeof result[key]!=='string')||!Number.isInteger(result.round)||result.round<0||!Array.isArray(result.history)||!Array.isArray(result.duplicateHistory))throw Error('赠送资料返回不完整，请重试核对');
 if(!Array.isArray(result.attempts)||result.attempts.some(attempt=>!attempt||typeof attempt.id!=='string'||!attempt.id||!Number.isInteger(attempt.number)||attempt.number<1||!['success','failed'].includes(attempt.result)||['date','proofUrl','note','recordedAt','operatorName'].some(key=>typeof attempt[key]!=='string')||!Number.isInteger(attempt.version)||attempt.version<1||!Number.isFinite(Date.parse(attempt.recordedAt)))||new Set(result.attempts.map(attempt=>attempt.id)).size!==result.attempts.length)throw Error('发放记录返回不完整，请重试核对');
 return result;
}
function v10GiftCatalog(value){
 if(!value||!['pending','ready','invalid'].includes(value.status)||!Array.isArray(value.products)||value.status!=='ready'&&value.products.length||value.status==='invalid'&&typeof value.error!=='string'||value.status==='ready'&&(!Number.isInteger(value.version)||value.version<1||!value.products.length))throw Error('赠送目录返回异常，请重试核对');
 const products=new Set();for(const product of value.products){if(!product||typeof product.id!=='string'||!product.id||products.has(product.id)||typeof product.name!=='string'||!Array.isArray(product.packages))throw Error('赠送目录返回异常，请重试核对');products.add(product.id);const packages=new Set();for(const pack of product.packages){if(!pack||typeof pack.id!=='string'||!pack.id||packages.has(pack.id)||typeof pack.name!=='string'||typeof pack.duration!=='string')throw Error('赠送目录返回异常，请重试核对');packages.add(pack.id);}}
 return {...value,version:value.version||0};
}
function v10GiftEnvelope(state,result){const catalog=v10GiftCatalog(result.catalog);state.catalog=catalog;state.canSubmit=catalog.status==='ready'&&result.canSubmit===true;state.submissionBlockedReason=catalog.status==='invalid'?catalog.error:typeof result.submissionBlockedReason==='string'?result.submissionBlockedReason:(catalog.status==='pending'?'产品与套餐目录待配置，当前仅可保存草稿。':'审批配置未就绪，当前仅可保存草稿。');}
function v10GiftData(item){return Object.fromEntries(V10_GIFT_DATA_FIELDS.map(key=>[key,key==='repeatReason'?item[key]||'':item[key]]));}
function v10GiftRead(context){
 const get=id=>context.form.querySelector('#'+id).value;
 return {kolId:Number(get('feekol'))||0,cooperationId:get('giftcooperation'),recipient:get('giftrecipient').trim(),reason:get('giftreason'),productId:get('giftproduct'),packageId:get('giftpackage'),repeatReason:get('giftrepeatreason')};
}
function v10GiftEditable(context){return !context.item||['draft','returned'].includes(context.item.status)&&context.item.actions?.saveDraft!==false;}
function v10GiftDirty(context){return v10GiftEditorValid(context)&&!!context.form&&(v10GiftEditable(context)&&JSON.stringify(v10GiftRead(context))!==JSON.stringify(context.savedData)||!!context.pending?.uncertain);}
function v10GiftContent(item){return item.productName?esc(item.productName)+(item.packageName?'<small>'+esc(item.packageName)+(item.duration?' · '+esc(item.duration):'')+'</small>':''):'<span class="muted">未填写</span>';}
function v10GiftHistoryHTML(item){return `<section class="v10-gift-formsection"><h3>处理记录${item.round?' · 第 '+item.round+' 轮':''}</h3><div class="v10-gift-history">${item.history.length?item.history.slice().reverse().map(event=>`<article><strong>${esc(({submit:'提交申请',approve:'审批通过 · 待发放',return:'退回补充',reject:'拒绝申请','record-success':'登记发放成功','record-failure':'记录发放失败'})[event.action]||'处理记录')}</strong><small>${esc(event.actorName||'操作者未记录')} · ${esc(event.time?new Date(event.time).toLocaleString('zh-CN'):'时间未记录')} · 第 ${esc(String(event.round||0))} 轮</small>${event.opinion?'<p>'+esc(event.opinion)+'</p>':''}${event.action==='submit'&&event.snapshot?v10GiftSnapshotHTML(event.snapshot):''}</article>`).join(''):'<p class="muted">暂无提交或审批记录</p>'}</div></section>${v10GiftAttemptsHTML(item)}`;}
function v10GiftSnapshotHTML(snapshot){const rows=[['赠送产品',snapshot.productName],['套餐 / 时长',[snapshot.packageName,snapshot.duration].filter(Boolean).join(' · ')],['接收邮箱',snapshot.recipient],['赠送原因',snapshot.reason],['重复申请补充原因',snapshot.repeatReason]];return '<details class="v10-gift-snapshot"><summary>查看本轮申请</summary><dl>'+rows.map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value||'未填写')+'</dd></div>').join('')+'</dl></details>';}
function v10GiftProofURL(value){try{if(typeof value!=='string'||!/^https?:\/\//i.test(value)||/[\\<>"\x00-\x20\x7f-\x9f]/.test(value)||/^https?:\/\/[^/?#]+:(?:[/?#]|$)/i.test(value))return null;const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&url.hostname&&!url.username&&!url.password?url.href:null;}catch{return null;}}
function v10GiftAttemptsHTML(item){
 if(!item.attempts.length&&!['approved','completed'].includes(item.status))return '';
 return '<section class="v10-gift-formsection"><h3>发放结果</h3><div class="v10-gift-history">'+(item.attempts.length?item.attempts.slice().reverse().map(attempt=>{const href=v10GiftProofURL(attempt.proofUrl);return '<article><strong>第 '+attempt.number+' 次 · '+(attempt.result==='success'?'发放成功':'发放失败 · 仍待发放')+'</strong><small>实际日期 '+esc(attempt.date)+' · '+esc(attempt.operatorName)+' · 登记于 '+esc(new Date(attempt.recordedAt).toLocaleString('zh-CN'))+'</small><p>'+esc(attempt.note)+'</p>'+(href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">查看发放凭证</a>':attempt.proofUrl?'<p>凭证链接无效，请核对原记录。</p>':'')+'</article>';}).join(''):'<p class="muted">暂无实际发放结果记录</p>')+'</div></section>';
}
function v10GiftListHTML(state){
 const rows=state.items.filter(item=>!state.filter||item.status===state.filter);
 const count=state.status==='ready'?rows.length+(state.items.every(item=>item.status==='draft')&&!state.filter?' 条草稿':' 条记录')+(state.filter?' · 共 '+state.items.length+' 条':''):state.status==='error'?'记录未能读取':'正在读取记录';
 let body;
 if(state.status==='error')body=`<div class="v10-gift-message error" role="alert"><p>${esc(state.error)}</p><button type="button" class="btn small" data-gift-retry>重新读取</button></div>`;
 else if(state.status!=='ready')body='<div class="v10-gift-message" role="status">正在读取赠送草稿…</div>';
 else body=`<div class="v10-gift-tablewrap"><table class="v10-gift-table"><thead><tr><th>关联 KOL</th><th>赠送内容</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map(item=>`<tr><td data-label="关联 KOL"><strong>${esc(item.kolName||'名称未记录')}</strong>${item.cooperationTitle?'<small>'+esc(item.cooperationTitle)+'</small>':''}</td><td data-label="赠送内容">${v10GiftContent(item)}</td><td data-label="状态"><span class="v10-gift-status ${item.status}">${V10_GIFT_STATUS[item.status]}</span></td><td data-label="操作"><button type="button" class="textbtn" data-gift-open="${esc(item.id)}" aria-label="查看${esc(item.kolName)}的赠送记录">查看</button></td></tr>`).join('')}</tbody></table>${rows.length?'':'<div class="v10-gift-empty">'+(state.items.length?'暂无符合筛选的记录。':'暂无赠送草稿，可先选择本人 KOL 保存意向。')+'</div>'}</div>`;
 return `<section class="panel v10-business-section v10-gift-list" aria-label="产品赠送"><div class="v10-gift-toolbar"><span data-gift-count>${count}</span><div class="v10-gift-listtools"><select data-gift-filter aria-label="赠送状态"><option value="">全部状态</option>${Object.entries(V10_GIFT_STATUS).map(([id,label])=>`<option value="${id}"${state.filter===id?' selected':''}>${label}</option>`).join('')}</select><button type="button" class="btn primary" data-gift-new>${I('plus')}新建草稿</button></div></div>${!state.canSubmit?'<p class="v10-gift-catalog-note">'+esc(state.submissionBlockedReason)+'</p>':''}${body}</section>`;
}
function drawV10GiftList(state){
 if(!v10GiftValid(state)||state.editor)return;
 const active=document.activeElement,inside=state.root.contains(active),focusedId=inside?active?.dataset?.giftOpen:null,focusedNew=inside&&active?.hasAttribute('data-gift-new'),focusedRetry=inside&&active?.hasAttribute('data-gift-retry'),idleFocus=active===document.body||active===document.documentElement;
 state.root.innerHTML=v10GiftListHTML(state);
 state.root.querySelector('[data-gift-new]').onclick=()=>openV10GiftEditor();
 state.root.querySelector('[data-gift-retry]')?.addEventListener('click',()=>loadV10Gifts(state));
 state.root.querySelectorAll('[data-gift-open]').forEach(button=>button.onclick=()=>openV10GiftEditor(button.dataset.giftOpen));
 state.root.querySelector('[data-gift-filter]').onchange=event=>{state.filter=event.target.value;drawV10GiftList(state);state.root.querySelector('[data-gift-filter]')?.focus({preventScroll:true});};
 const retained=focusedId?[...state.root.querySelectorAll('[data-gift-open]')].find(button=>button.dataset.giftOpen===focusedId):focusedNew?state.root.querySelector('[data-gift-new]'):focusedRetry?state.root.querySelector('[data-gift-retry]'):null;
 if(retained)retained.focus({preventScroll:true});
 if(state.status!=='loading'&&state.focusIntent?.ticket===state.sequence){const intent=state.focusIntent;state.focusIntent=null;if(idleFocus&&!retained){const target=[...state.root.querySelectorAll('[data-gift-open]')].find(button=>button.dataset.giftOpen===intent.id)||state.root.querySelector('[data-gift-new]');target?.focus({preventScroll:true});}}
}
async function loadV10Gifts(state=v10GiftState()){
 if(!v10GiftValid(state)||state.status==='loading')return;
 const ticket=++state.sequence;state.status='loading';state.error='';drawV10GiftList(state);
 try{const result=await api('/api/gifts');if(!v10GiftValid(state)||ticket!==state.sequence)return;v10GiftEnvelope(state,result);if(!Array.isArray(result.items))throw Error('赠送列表返回异常');const ids=new Set();const items=result.items.map(v10GiftItem);for(const item of items){if(ids.has(item.id))throw Error('赠送列表返回异常');ids.add(item.id);}state.items=items;state.status='ready';}
 catch(error){if(!v10GiftValid(state)||ticket!==state.sequence)return;state.error=error.message||'赠送草稿读取失败';state.status='error';}
 drawV10GiftList(state);
}
function mountV10Gifts(region){
 const state=v10GiftState();if(state.root?.isConnected&&state.root.parentElement===region)return;
 const root=document.createElement('div');root.className='v10-gifts';region.replaceChildren(root);state.root=root;state.editor=null;state.focusIntent=null;
 if(state.status==='loading')state.status='idle';drawV10GiftList(state);loadV10Gifts(state);
}
function v10GiftField(id,label,body){return `<div class="field"><label for="${id}">${label}</label>${body}</div>`;}
function v10GiftFormHTML(context){
 const item=context.item,data=item?v10GiftData(item):{kolId:0,cooperationId:'',recipient:'',reason:'',productId:'',packageId:'',repeatReason:''},editable=v10GiftEditable(context),ready=context.state.catalog.status==='ready';
 const cooperation=`<select id="giftcooperation"${data.kolId?'':' disabled'}><option value="">不关联合作</option>${data.cooperationId?'<option value="'+esc(data.cooperationId)+'" selected>'+esc(item.cooperationTitle||'原关联合作')+'</option>':''}</select><div class="v10-gift-cooperation-feedback"><small id="giftcooperationhint">${!editable?(data.cooperationId?'本轮关联合作已记录':'本轮未关联合作'):data.kolId?'正在读取同 KOL 合作…':'选择 KOL 后可关联合作'}</small><button type="button" class="textbtn" data-gift-cooperation-retry hidden>重试</button></div>`;
 const select=(id,label)=>v10GiftField(id,label,`<select id="${id}"${ready?'':' disabled'} aria-describedby="giftcataloghint"><option value="">${ready?'请选择':'目录待配置'}</option></select>`);
 return `<form class="panel v10-business-section v10-gift-form" id="v10giftform" aria-labelledby="v10giftformtitle"><header class="v10-gift-formhead"><div><h2 id="v10giftformtitle">${item?'赠送申请':'新建赠送草稿'}</h2><span class="v10-gift-status ${item?.status||'draft'}">${V10_GIFT_STATUS[item?.status||'draft']}</span></div><button type="button" class="iconbtn" data-gift-cancel aria-label="返回赠送列表">${I('close')}</button></header>${!editable?'<p class="v10-gift-catalog-note">'+(item.status==='approved'?'审批通过，等待后续发放；当前未登记完成。':'当前申请内容只读，处理记录保留在下方。')+'</p>':''}${item?.catalogChanged?'<p class="v10-gift-warning">目录已变化，请核对原申请；补充后重新选择有效套餐。</p>':''}<section class="v10-gift-formsection"><h3>赠送对象</h3><div class="v10-gift-fields">${v10FeeKolField(data.kolId||null,item,'<span aria-hidden="true">*</span>')}${v10GiftField('giftcooperation','关联合作（选填）',cooperation)}</div></section><section class="v10-gift-formsection"><h3>赠送内容</h3><div class="v10-gift-fields">${select('giftproduct','赠送产品')}${select('giftpackage','套餐 / 时长')}</div><p class="v10-gift-catalog-note" id="giftcataloghint">${!ready?(context.state.catalog.status==='invalid'?esc(context.state.catalog.error):'目录待配置，可先保存草稿，后续再补充赠送内容。'):!context.state.canSubmit?esc(context.state.submissionBlockedReason):'提交时须选择有效产品及套餐，逐笔审批。'}</p>${v10GiftField('giftrecipient','接收邮箱（提交时必填）','<input type="text" id="giftrecipient" maxlength="254" autocomplete="email" value="'+esc(data.recipient)+'" placeholder="填写用于接收赠送的邮箱">')}</section><section class="v10-gift-formsection"><h3>申请说明</h3>${v10GiftField('giftreason','赠送原因（提交时必填）','<textarea id="giftreason" maxlength="2000" rows="3" placeholder="记录合作用途与赠送原因">'+esc(data.reason)+'</textarea>')}<div class="v10-gift-duplicates" id="giftduplicates" aria-live="polite"></div>${v10GiftField('giftrepeatreason','重复申请补充原因','<textarea id="giftrepeatreason" maxlength="2000" rows="2" placeholder="同 KOL 同产品已有申请时，说明本次需要再次申请的原因">'+esc(data.repeatReason)+'</textarea>')}</section>${item?v10GiftHistoryHTML(item):''}<div class="v10-gift-save-feedback"><p id="gifterror" role="alert"></p><button type="button" class="textbtn" data-gift-reload hidden>重新读取草稿</button><p id="giftsavestatus" role="status">${!editable?'':item?.status==='returned'?'补充内容已保存，重新提交后进入审批':item?'草稿已保存；关联 KOL 已锁定':'选择本人负责的 KOL 后即可保存草稿'}</p></div><footer class="v10-gift-formactions"><button type="button" class="btn" data-gift-cancel>${editable?'取消':'返回列表'}</button>${editable?'<button type="submit" class="btn" id="savegift">保存草稿</button>':''}${editable&&ready&&context.state.canSubmit&&item?.actions?.submit!==false?'<button type="button" class="btn primary" id="submitgift">提交申请</button>':''}</footer></form>`;
}
function v10GiftProductOptions(context,data){
 const form=context.form,product=form.querySelector('#giftproduct'),pack=form.querySelector('#giftpackage'),catalog=context.state.catalog,ready=catalog.status==='ready';
 product.innerHTML='<option value="">'+(ready?'请选择产品':catalog.status==='invalid'?'目录异常':'目录待配置')+'</option>'+catalog.products.map(value=>`<option value="${esc(value.id)}">${esc(value.name)}</option>`).join('');
 if(data.productId&&!catalog.products.some(value=>value.id===data.productId))product.insertAdjacentHTML('beforeend',`<option value="${esc(data.productId)}">${esc(context.item?.productName||'原产品')}（需核对）</option>`);product.value=data.productId;
 const selected=catalog.products.find(value=>value.id===data.productId);pack.innerHTML='<option value="">'+(ready?'请选择套餐 / 时长':catalog.status==='invalid'?'目录异常':'目录待配置')+'</option>'+(selected?.packages||[]).map(value=>`<option value="${esc(value.id)}">${esc(value.name)}${value.duration?' · '+esc(value.duration):''}</option>`).join('');
 if(data.packageId&&!selected?.packages.some(value=>value.id===data.packageId))pack.insertAdjacentHTML('beforeend',`<option value="${esc(data.packageId)}">${esc([context.item?.packageName,context.item?.duration].filter(Boolean).join(' · ')||'原套餐')}（需核对）</option>`);pack.value=data.packageId;
}
function drawV10GiftDuplicates(context){
 if(!v10GiftEditorValid(context))return;const box=context.form.querySelector('#giftduplicates');
 const retry=box.querySelector('[data-gift-duplicate-retry]');
 if(retry&&context.form.ownerDocument.activeElement===retry){
  const target=context.form.querySelector('#giftrepeatreason:not(:disabled)')||context.form.querySelector('[data-gift-cancel]:not(:disabled)');
  target?.focus({preventScroll:true});
 }
 box.innerHTML=context.duplicateLoading?'<p>正在核对同 KOL 同产品申请…</p>':context.duplicateError?'<p role="alert">'+esc(context.duplicateError)+'</p><button type="button" class="textbtn" data-gift-duplicate-retry>重新核对</button>':context.duplicates?.length?'<strong>已有同 KOL 同产品申请，请补充本次原因</strong>'+context.duplicates.map(item=>'<p>'+esc(item.productName||'原产品')+' · '+esc(item.packageName||'套餐未记录')+' · '+esc(V10_GIFT_STATUS[item.status]||'状态待核对')+'</p>').join(''):'<p>暂无其他已提交的同产品申请。</p>';
 box.hidden=!v10GiftRead(context).productId;box.querySelector('[data-gift-duplicate-retry]')?.addEventListener('click',()=>loadV10GiftDuplicates(context));
}
async function loadV10GiftDuplicates(context){
 if(!v10GiftEditorValid(context)||!context.form||context.busy)return;const data=v10GiftRead(context),ticket=++context.duplicateSequence;
 context.duplicateError='';context.duplicates=[];context.requiresRepeatReason=false;
 if(!data.kolId||!data.productId){context.duplicateLoading=false;drawV10GiftDuplicates(context);return;}
 context.duplicateLoading=true;drawV10GiftDuplicates(context);
 try{const result=await api('/api/gift-history?kolId='+data.kolId+'&productId='+encodeURIComponent(data.productId)+(context.item?'&excludeId='+encodeURIComponent(context.item.id):''));if(!v10GiftEditorValid(context)||ticket!==context.duplicateSequence)return;const current=v10GiftRead(context);if(current.kolId!==data.kolId||current.productId!==data.productId)return;if(!Array.isArray(result.items)||typeof result.requiresRepeatReason!=='boolean')throw Error('重复申请核对返回异常');context.duplicates=result.items;context.requiresRepeatReason=result.requiresRepeatReason;}
 catch(error){if(!v10GiftEditorValid(context)||ticket!==context.duplicateSequence)return;context.duplicateError=error.message||'重复申请核对失败';}
 finally{if(v10GiftEditorValid(context)&&ticket===context.duplicateSequence){context.duplicateLoading=false;drawV10GiftDuplicates(context);}}
}
async function openV10GiftEditor(id=''){
 const state=v10GiftState();if(!v10GiftValid(state))return;
 state.focusIntent=null;
 if(state.editor){guardProfileLeave(()=>openV10GiftEditor(id));return;}
 const context={state,user:state.user,item:null,id,form:null,finished:false,busy:false,conflicted:false,unavailable:false,pending:null,composing:false,cooperationSequence:0,cooperationLoading:false,duplicateSequence:0,duplicateLoading:false,duplicates:[],requiresRepeatReason:false};state.editor=context;
 if(!id){drawV10GiftEditor(context);return;}
 state.root.innerHTML='<section class="panel v10-business-section"><div class="v10-gift-message" role="status">正在读取赠送草稿…</div><button type="button" class="btn" data-gift-load-back>返回列表</button></section>';
 state.root.querySelector('[data-gift-load-back]').onclick=()=>closeV10GiftEditor(context);
 try{const result=await api('/api/gifts?id='+encodeURIComponent(id));if(!v10GiftEditorValid(context))return;v10GiftEnvelope(state,result);const item=v10GiftItem(result.item);if(item.id!==id)throw Error('草稿返回身份不一致');context.item=item;drawV10GiftEditor(context);}
 catch(error){if(!v10GiftEditorValid(context))return;state.root.innerHTML=`<section class="panel v10-business-section"><div class="v10-gift-message error" role="alert"><p>${esc(error.message||'草稿读取失败')}</p><button type="button" class="btn" data-gift-detail-retry>重试</button><button type="button" class="btn" data-gift-load-back>返回列表</button></div></section>`;state.root.querySelector('[data-gift-detail-retry]').onclick=()=>{disposeV10GiftEditor(context);openV10GiftEditor(id);};state.root.querySelector('[data-gift-load-back]').onclick=()=>closeV10GiftEditor(context);}
}
function drawV10GiftEditor(context){
 if(!v10GiftEditorValid(context))return;
 context.state.root.innerHTML=v10GiftFormHTML(context);context.form=context.state.root.querySelector('#v10giftform');context.savedData=context.item?v10GiftData(context.item):v10GiftRead(context);
 const form=context.form;bindV10FeeKol(form,{busy:()=>context.busy||!!context.pending?.uncertain,valid:()=>v10GiftEditorValid(context)});
 form.querySelector('#feekolquery').required=true;
 form.querySelector('#feekol').addEventListener('change',()=>{if(!v10GiftEditorValid(context)||context.busy||context.item||context.pending?.uncertain)return;form.querySelector('#giftcooperation').value='';loadV10GiftCooperations(context);loadV10GiftDuplicates(context);});
 form.querySelector('[data-gift-cooperation-retry]').onclick=()=>loadV10GiftCooperations(context);
 form.querySelectorAll('[data-gift-cancel]').forEach(button=>button.onclick=()=>attemptV10GiftExit(context));
 form.querySelector('[data-gift-reload]').onclick=()=>promptV10GiftLeave(context,()=>{const id=context.item?.id||context.recoveredId;if(id){disposeV10GiftEditor(context);openV10GiftEditor(id);}else closeV10GiftEditor(context);},true);
 form.onsubmit=event=>{event.preventDefault();saveV10Gift(context);};
 form.querySelector('#submitgift')?.addEventListener('click',()=>submitV10Gift(context));
 v10GiftProductOptions(context,context.savedData);
 form.querySelector('#giftproduct').onchange=()=>{if(context.busy||!v10GiftEditable(context))return;v10GiftProductOptions(context,{...v10GiftRead(context),packageId:''});syncV10GiftForm(context);loadV10GiftDuplicates(context);};
 form.addEventListener('compositionstart',()=>{context.composing=true;});form.addEventListener('compositionend',()=>{context.composing=false;});form.addEventListener('keydown',event=>{if(context.composing||event.isComposing||event.keyCode===229){if(['Enter','Escape'].includes(event.key))event.stopPropagation();return;}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();attemptV10GiftExit(context);}});
 if(context.item)lockV10GiftKol(context);if(v10GiftRead(context).kolId&&v10GiftEditable(context))loadV10GiftCooperations(context);
 if(v10GiftEditable(context))loadV10GiftDuplicates(context);else{context.duplicates=context.item.duplicateHistory;drawV10GiftDuplicates(context);}syncV10GiftForm(context);
 (v10GiftEditable(context)?form.querySelector('#feekolquery'):form.querySelector('[data-gift-cancel]')).focus({preventScroll:true});
}
function lockV10GiftKol(context){
 if(!v10GiftEditorValid(context)||!context.form)return;
 const form=context.form,locked=!!context.item,uncertain=!!context.pending?.uncertain;
 if(locked){lockV10FeeKol(form);const hint=form.querySelector('#feekolhint');hint.textContent=(context.item.status==='draft'?'草稿':'申请')+'已保存，关联 KOL 已锁定';hint.title=hint.textContent;}
 form.querySelector('#feekolquery').disabled=context.busy||uncertain||!v10GiftEditable(context);
 const clear=form.querySelector('.v10-fee-kol-clear');if(clear)clear.disabled=context.busy||uncertain||!v10GiftEditable(context);
 if(uncertain&&!locked){const hint=form.querySelector('#feekolhint');hint.textContent='保存结果待确认，暂不可更换 KOL';hint.title=hint.textContent;}
}
async function loadV10GiftCooperations(context){
 if(!v10GiftEditorValid(context)||!context.form||context.busy)return;
 const form=context.form,kid=Number(form.querySelector('#feekol').value),select=form.querySelector('#giftcooperation'),hint=form.querySelector('#giftcooperationhint'),retry=form.querySelector('[data-gift-cooperation-retry]'),ticket=++context.cooperationSequence;
 if(!kid){select.innerHTML='<option value="">不关联合作</option>';select.disabled=true;hint.textContent='选择 KOL 后可关联合作';retry.hidden=true;return;}
 context.cooperationLoading=true;hint.textContent='正在读取同 KOL 合作…';retry.hidden=true;select.disabled=true;
 try{const result=await api('/api/gift-cooperations?kolId='+encodeURIComponent(kid));if(!v10GiftEditorValid(context)||ticket!==context.cooperationSequence||Number(form.querySelector('#feekol').value)!==kid)return;if(!Array.isArray(result.items)||result.items.some(item=>typeof item.id!=='string'||typeof item.title!=='string'||typeof item.number!=='string'))throw Error('合作候选返回异常');const selected=select.value,oldLabel=select.selectedOptions[0]?.textContent||context.item?.cooperationTitle||'原关联合作';select.innerHTML='<option value="">不关联合作</option>'+result.items.map(item=>`<option value="${esc(item.id)}">${esc(item.title||item.number)}${item.number?' · '+esc(item.number):''}</option>`).join('');if(selected&&!result.items.some(item=>item.id===selected))select.insertAdjacentHTML('beforeend',`<option value="${esc(selected)}">${esc(oldLabel)}（原关联，需核对）</option>`);select.value=selected;hint.textContent=result.items.length?'仅可选择同 KOL 的本人合作':'暂无同 KOL 合作，可不关联';}
 catch(error){if(!v10GiftEditorValid(context)||ticket!==context.cooperationSequence)return;hint.textContent='合作读取失败，原选择已保留';retry.hidden=false;}
 finally{if(v10GiftEditorValid(context)&&ticket===context.cooperationSequence){context.cooperationLoading=false;syncV10GiftForm(context);}}
}
function v10GiftSetError(context,error){
 if(!v10GiftEditorValid(context)||!context.form)return;
 context.form.querySelector('#gifterror').textContent=error.message||String(error)||'保存未完成，输入已保留';
 if(error.status===409){context.conflicted=true;context.form.querySelector('#gifterror').textContent+='；当前输入已保留，请重新读取后核对。';context.form.querySelector('[data-gift-reload]').hidden=false;}
 if([403,404].includes(error.status)){context.unavailable=true;context.form.querySelector('[data-gift-reload]').hidden=false;}
 syncV10GiftForm(context);
}
function syncV10GiftForm(context){
 if(!v10GiftEditorValid(context)||!context.form)return;
 const form=context.form,editable=v10GiftEditable(context),unknownSubmit=context.pending?.uncertain&&context.pending.payload.action==='submit',blocked=context.busy||context.conflicted||context.unavailable;
 const save=form.querySelector('#savegift'),submit=form.querySelector('#submitgift');if(save){save.disabled=blocked||!editable;save.textContent=unknownSubmit?'确认提交结果':context.pending?.uncertain?'确认保存结果':'保存草稿';}if(submit)submit.disabled=blocked||!editable||!!context.pending?.uncertain;
 form.querySelector('#giftcooperation').disabled=context.busy||context.cooperationLoading||!Number(form.querySelector('#feekol').value)||!editable||unknownSubmit;
 for(const id of ['giftrecipient','giftreason','giftrepeatreason'])form.querySelector('#'+id).disabled=context.busy||!editable||unknownSubmit;
 form.querySelector('#giftproduct').disabled=context.busy||!editable||unknownSubmit||context.state.catalog.status!=='ready';
 form.querySelector('#giftpackage').disabled=context.busy||!editable||unknownSubmit||context.state.catalog.status!=='ready'||!form.querySelector('#giftproduct').value;
 lockV10GiftKol(context);
}
function v10GiftAcknowledgement(context,response,pending){
 const item=v10GiftItem(response?.item),payload=pending.payload,expected=payload.data,version=payload.id?payload.version+1:1;
 const status=payload.action==='submit'?'submitted':pending.originalStatus||'draft',round=payload.action==='submit'?(pending.originalRound||0)+1:pending.originalRound||0,transition=response.transition;
 if(typeof response.idempotent!=='boolean'||payload.id&&item.id!==payload.id)throw Error('保存回执不完整，请保留输入重试核对');
 if(!transition||transition.action!==payload.action||transition.appliedVersion!==version||transition.status!==status||transition.round!==round)throw Error('操作回执身份不完整，请用原请求重试核对');
 if(item.version!==version||item.status!==status||item.round!==round||JSON.stringify(v10GiftData(item))!==JSON.stringify(expected)){
  context.recoveredId=item.id;pending.uncertain=false;
  throw Object.assign(Error('保存结果已找到，但申请随后已更新；请重新读取核对，避免覆盖其他修改'),{status:409});
 }
 return item;
}
function v10GiftValidate(context,data,action){
 if(!data.kolId)throw Error('请搜索并选择本人负责的 KOL');
 if(context.item&&data.kolId!==context.item.kolId)throw Object.assign(Error('首次保存已锁定原 KOL，请重新读取草稿后核对；当前输入已保留'),{status:409});
 const catalog=context.state.catalog,product=catalog.products.find(value=>value.id===data.productId),pack=product?.packages.find(value=>value.id===data.packageId);
 if((data.productId&&!product)||(data.packageId&&!pack))throw Error(catalog.status==='invalid'?catalog.error:catalog.status==='pending'?'产品与套餐目录待配置，请保留空值':'所选产品或套餐已停用，请重新选择');
 if(action!=='submit')return;
 if(!context.state.canSubmit||catalog.status!=='ready')throw Error(context.state.submissionBlockedReason||'赠送目录或审批配置尚未就绪，仍可保存草稿');
 if(context.item?.actions?.submit===false)throw Error('当前申请不可提交，请重新读取核对');
 if(!product||!pack)throw Error('请选择赠送产品及匹配的套餐 / 时长');
 if(!v10GiftEmail(data.recipient))throw Error('提交前请填写有效的接收邮箱');
 if(!data.reason.trim())throw Error('提交前请填写赠送原因');
 if(context.requiresRepeatReason&&!data.repeatReason.trim())throw Error('已有同 KOL 同产品申请，请填写重复申请补充原因');
}
function v10GiftEmail(value){if(!/^[^\s@<>()\[\],;:\\"\x00-\x1f\x7f-\x9f]+@[^\s@<>()\[\],;:\\"\x00-\x1f\x7f-\x9f]+\.[^\s@<>()\[\],;:\\"\x00-\x1f\x7f-\x9f]+$/.test(value))return false;return value.split('@').every(part=>!part.startsWith('.')&&!part.endsWith('.')&&!part.includes('..'));}
function v10GiftAccept(context,item){
 context.item=item;context.id=item.id;context.savedData=v10GiftData(item);context.pending=null;
 // Every verified mutation invalidates prior list snapshots, including recovery.
 context.state.sequence++;context.state.status='idle';context.state.error='';
 context.state.items=[item,...context.state.items.filter(value=>value.id!==item.id)];lockV10GiftKol(context);
}
async function saveV10Gift(context,after=null){return performV10GiftSave(context,'save-draft',after);}
async function submitV10Gift(context){return performV10GiftSave(context,'submit');}
async function performV10GiftSave(context,requestedAction,after=null){
 if(!v10GiftEditorValid(context)||!context.form||context.busy||context.conflicted||context.unavailable||context.composing||!v10GiftEditable(context))return false;
 const form=context.form,desired=v10GiftRead(context),recovering=!!context.pending;
 // An unknown result belongs to its original action and immutable request body.
 // In particular a recovered draft save never implicitly becomes a submission.
 try{if(!recovering)v10GiftValidate(context,desired,requestedAction);if(!form.reportValidity())return false;}catch(error){v10GiftSetError(context,error);return false;}
 const controls=[...form.querySelectorAll('input,select,textarea,button'),...(context.prompt?.isConnected?[...context.prompt.querySelectorAll('button')]:[])],disabled=controls.map(control=>control.disabled);context.busy=true;controls.forEach(control=>control.disabled=true);form.querySelector('#giftsavestatus').textContent=requestedAction==='submit'?'正在提交申请…':'正在保存草稿…';form.querySelector('#gifterror').textContent='';
 try{
  let current=desired,action=context.pending?.payload.action||(requestedAction==='submit'&&!context.item?'save-draft':requestedAction);
  for(let step=0;step<3;step++){
   let pending=context.pending;
   if(!pending){v10GiftValidate(context,current,action);pending={payload:{action,requestId:crypto.randomUUID(),id:context.item?.id||'',...(context.item?{version:context.item.version}:{}),data:structuredClone(current),...(action==='submit'?{catalogVersion:context.state.catalog.version}:{})},originalStatus:context.item?.status||'draft',originalRound:context.item?.round||0,uncertain:false};context.pending=pending;}
   let response;try{response=await api('/api/gifts',pending.payload);}catch(error){if(!error.status||error.status>=500)pending.uncertain=true;else if(error.status===400||!pending.uncertain)context.pending=null;throw error;}
   if(!v10GiftEditorValid(context))return false;
   pending.uncertain=true;const item=v10GiftAcknowledgement(context,response,pending);
   if(desired.kolId!==item.kolId){context.recoveredId=item.id;pending.uncertain=false;throw Object.assign(Error('已保存草稿属于原 KOL，当前输入已保留，请重新读取后核对'),{status:409});}
   if(pending.payload.action==='submit'&&JSON.stringify(desired)!==JSON.stringify(v10GiftData(item))){context.recoveredId=item.id;pending.uncertain=false;throw Object.assign(Error('原申请已提交，当前不同输入尚未提交；请重新读取核对'),{status:409});}
   v10GiftAccept(context,item);
   if(action==='submit'){closeV10GiftEditor(context);if(after)after();return true;}
   if(JSON.stringify(current)!==JSON.stringify(context.savedData)){current=desired;action='save-draft';continue;}
   if(requestedAction==='submit'&&!recovering){action='submit';current=desired;continue;}
   if(requestedAction==='submit'&&recovering){form.querySelector('#giftsavestatus').textContent='原保存结果已确认；核对后请再次明确提交申请。';syncV10GiftForm(context);return true;}
   closeV10GiftEditor(context);if(after)after();return true;
  }
  throw Error('保存结果需重新核对，输入已保留');
 }catch(error){if(error.status===400&&requestedAction==='submit')context.refreshDuplicates=true;v10GiftSetError(context,error);return false;}
 finally{context.busy=false;controls.forEach((control,index)=>{if(control.isConnected)control.disabled=disabled[index];});if(v10GiftEditorValid(context)){if(!context.form.querySelector('#giftsavestatus').textContent.includes('原保存结果已确认'))form.querySelector('#giftsavestatus').textContent=context.pending?.payload.action==='submit'?'提交结果尚待确认，请用原请求确认；正文暂时锁定。':context.item?'申请已保存，当前修改尚未完成':'保存未完成，输入已保留';syncV10GiftForm(context);if(context.refreshDuplicates){context.refreshDuplicates=false;loadV10GiftDuplicates(context);}}}
}
function disposeV10GiftEditor(context){
 if(!context||context.finished)return;context.finished=true;context.form?.querySelector('[data-fee-kol]')?.v10FeeKol?.destroy();context.prompt?.remove();if(context.state.editor===context)context.state.editor=null;
}
function closeV10GiftEditor(context,showList=true){
 if(!context||context.finished)return;const valid=v10GiftEditorValid(context),state=context.state,id=context.item?.id||context.id;disposeV10GiftEditor(context);
 if(valid&&showList){state.sequence++;state.status='idle';state.error='';drawV10GiftList(state);state.focusIntent={id,ticket:state.sequence+1};loadV10Gifts(state);}
}
function promptV10GiftLeave(context,after=null,reload=false){
 if(!v10GiftEditorValid(context)||context.busy||context.prompt?.isConnected||document.querySelector('#leaveprompt'))return;
 const prompt=document.createElement('div');prompt.id='leaveprompt';prompt.className='leaveprompt v10-gift-leave';context.prompt=prompt;
 const uncertainty=context.pending?.uncertain?'保存结果尚待确认，草稿可能已经保存；放弃本地输入不会撤销已保存的记录。':'';
 prompt.innerHTML=`<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="赠送草稿尚未保存"><h2>${reload?'重新读取草稿':'修改尚未保存'}</h2><p>${reload?'重新读取会放弃当前输入，请先核对。':'请选择保存后离开，或继续编辑。'}${esc(uncertainty)}</p><p class="inlinecheck error" data-gift-leave-error role="alert"></p><div class="actions"><button type="button" class="btn" id="keepediting">继续编辑</button><button type="button" class="btn" id="discardprofile">${reload?'放弃并重新读取':'放弃修改'}</button>${!reload&&!context.conflicted&&!context.unavailable?'<button type="button" class="btn primary" id="saveandleave">保存并离开</button>':''}</div></section></div>`;
 document.querySelector('#overlay').append(prompt);prompt.querySelector('#keepediting').onclick=()=>{if(context.busy)return;prompt.remove();(context.form?.querySelector('#giftrecipient:not(:disabled)')||context.form?.querySelector('#savegift:not(:disabled)')||context.form?.querySelector('[data-gift-cancel]'))?.focus({preventScroll:true});};prompt.querySelector('#discardprofile').onclick=()=>{if(!v10GiftEditorValid(context)||context.busy)return;if(reload){prompt.remove();if(after)after();}else{closeV10GiftEditor(context,!after);if(after)after();}};
 prompt.querySelector('#saveandleave')?.addEventListener('click',async event=>{event.target.disabled=true;if(!await saveV10Gift(context,after)&&prompt.isConnected){prompt.querySelector('[data-gift-leave-error]').textContent=context.form.querySelector('#gifterror').textContent||'保存未完成，输入已保留';event.target.disabled=context.conflicted||context.unavailable;}});prompt.querySelector('#keepediting').focus();
}
function attemptV10GiftExit(context,after=null){if(!v10GiftEditorValid(context))return;if(context.busy){toast('正在保存，请稍候');return;}if(v10GiftDirty(context)){promptV10GiftLeave(context,after);return;}closeV10GiftEditor(context,!after);if(after)after();}
const v10GiftPreviousGuard=guardProfileLeave;
guardProfileLeave=function(action){const context=v10GiftState().editor;if(v10GiftEditorValid(context)){attemptV10GiftExit(context,()=>v10GiftPreviousGuard(action));return;}return v10GiftPreviousGuard(action);};
const v10GiftPreviousNav=nav;
nav=function(destination){const context=v10GiftState().editor;if(v10GiftEditorValid(context)){if(destination==='business'){renderContent();return;}attemptV10GiftExit(context,()=>v10GiftPreviousNav(destination));return;}return v10GiftPreviousNav(destination);};
const v10GiftPreviousClose=closeDrawer;
closeDrawer=function(){const context=v10GiftState().editor;if(v10GiftEditorValid(context)){attemptV10GiftExit(context);return;}return v10GiftPreviousClose();};
const v10GiftPreviousForceClose=forceClose;
forceClose=function(){if(v10GiftView?.editor)disposeV10GiftEditor(v10GiftView.editor);return v10GiftPreviousForceClose();};
window.addEventListener('beforeunload',event=>{const context=v10GiftState().editor;if(v10GiftEditorValid(context)&&(context.busy||v10GiftDirty(context))){event.preventDefault();event.returnValue='';}});
