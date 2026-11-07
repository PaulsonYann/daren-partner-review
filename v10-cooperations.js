/* V10 5B-1: explicit own-KOL cooperation records. Original business records stay authoritative. */
let v10CooperationsSession={user:null,items:[],status:'idle',error:'',query:'',sequence:0,context:null,returnFocus:null};
const V10_COOPERATION_MODES={unknown:'待确认',fee:'有稿费',none:'无稿费'};
function v10CooperationsState(){
 const user=typeof currentUser==='undefined'?null:currentUser;
 if(v10CooperationsSession.user!==user)v10CooperationsSession={user,items:[],status:'idle',error:'',query:'',sequence:0,context:null,returnFocus:null};
 return v10CooperationsSession;
}
function v10CooperationValid(context){return !!context&&v10CooperationsState()===context.state&&currentUser===context.user&&page==='contracts'&&context.element?.isConnected;}
function v10CooperationData(context){return {kolId:Number(context.data.kolId)||0,title:String(context.data.title||'').trim(),feeMode:context.data.feeMode,contractIds:[...context.data.contractIds].sort(),feeId:context.data.feeId||'',publicationIds:[...context.data.publicationIds].sort()};}
function v10CooperationDirty(context){return v10CooperationValid(context)&&context.kind==='editor'&&JSON.stringify(v10CooperationData(context))!==context.snapshot;}
function v10CooperationDate(raw){if(!raw)return '时间未记录';const date=new Date(raw);return Number.isNaN(date.getTime())?'时间未记录':date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});}
function v10CooperationLink(url,label){const href=safeLink(url);return href?`<a href="${href}" target="_blank" rel="noopener noreferrer" title="${esc(url)}">${esc(label)} ${I('external')}</a>`:'';}
function v10CooperationFinish(context,returnToList=false){
 if(!context||context.state.context!==context)return;
 const valid=v10CooperationValid(context),state=context.state,uncertain=!!context.pendingCreate&&!context.pendingCreate.recovered;
 state.context=null;context.optionsSequence++;context.finished=true;
 v10CooperationBaseForceClose();
 if(!valid)return;
 if(returnToList){if(typeof v10CooperationReturnFromEditor==='function'&&v10CooperationReturnFromEditor(context))return;v10CooperationShowList(state);if(uncertain)loadV10Cooperations();return;}
 if(state.returnFocus?.isConnected)state.returnFocus.focus({preventScroll:true});
}
function v10CooperationListRows(state){
 const needle=state.query.trim().toLocaleLowerCase(),rows=state.items.filter(item=>[item.number,item.title,item.kolName].some(value=>String(value||'').toLocaleLowerCase().includes(needle)));
 if(state.status==='loading')return '<p class="v10-cooperation-empty" role="status">正在读取合作记录…</p>';
 if(state.status==='error')return `<div class="v10-cooperation-empty" role="alert"><p>${esc(state.error||'合作记录读取失败')}</p><button type="button" class="btn" data-cooperation-retry>重新读取</button></div>`;
 if(!rows.length)return `<div class="v10-cooperation-empty">${state.query?'没有匹配的合作记录，请调整关键词。':'暂无合作记录，点击“新增合作”开始建档。'}</div>`;
 return rows.map(item=>`<article class="v10-cooperation-row" data-cooperation-id="${esc(item.id)}"><div><strong title="${esc(item.title)}">${esc(item.title)}</strong><p title="${esc(item.kolName||'KOL名称未记录')}">${esc(item.kolName||'KOL名称未记录')}</p><small>${esc(item.number||'编号未记录')} · ${esc(V10_COOPERATION_MODES[item.feeMode]||'安排待确认')} · ${item.contractIds?.length||0} 份合约</small><time>${esc(v10CooperationDate(item.updatedAt))}</time></div><button type="button" class="btn small" data-cooperation-edit="${esc(item.id)}" aria-label="查看并编辑合作：${esc(item.title)}">查看 / 编辑</button></article>`).join('');
}
function bindV10CooperationRows(context){
 const box=context.element.querySelector('[data-cooperation-list]');if(!box)return;
 box.querySelectorAll('[data-cooperation-edit]').forEach(button=>button.onclick=()=>openV10CooperationEditor(button.dataset.cooperationEdit));
 box.querySelector('[data-cooperation-retry]')?.addEventListener('click',()=>loadV10Cooperations());
 const count=context.element.querySelector('[data-cooperation-count]');if(count)count.textContent=context.state.status==='ready'?`${context.state.items.length} 条 · 仅本人负责范围`:'仅本人负责范围';
}
function v10CooperationDrawList(state){
 const context=state.context;if(!v10CooperationValid(context)||context.kind!=='list')return;
 context.element.querySelector('[data-cooperation-list]').innerHTML=v10CooperationListRows(state);bindV10CooperationRows(context);
}
async function loadV10Cooperations(){
 const state=v10CooperationsState(),user=currentUser,ticket=++state.sequence;if(!user)return false;
 state.status='loading';state.error='';v10CooperationDrawList(state);
 try{const response=await api('/api/cooperations');if(currentUser!==user||v10CooperationsState()!==state||ticket!==state.sequence)return false;if(!Array.isArray(response.items))throw Error('合作记录返回异常，请重新读取');state.items=response.items;state.status='ready';v10CooperationDrawList(state);return true;}
 catch(error){if(currentUser!==user||v10CooperationsState()!==state||ticket!==state.sequence)return false;state.status='error';state.error=error.message;v10CooperationDrawList(state);return false;}
}
function v10CooperationShowList(state){
 if(currentUser!==state.user||page!=='contracts')return;
 const overlay=document.querySelector('#overlay');document.body.style.overflow='hidden';
 overlay.innerHTML=`<div class="drawerback v10-cooperations-back"><section class="v10-cooperations" role="dialog" aria-modal="true" aria-labelledby="cooperationsheading"><header class="v10-cooperation-heading"><div><h2 id="cooperationsheading">合作记录</h2><span data-cooperation-count>仅本人负责范围</span></div><button type="button" class="iconbtn" id="cooperationclose" aria-label="关闭合作记录">${I('close')}</button></header><div class="v10-cooperation-toolbar"><label class="searchfield">${I('search')}<input type="search" id="cooperationsearch" autocomplete="off" spellcheck="false" maxlength="100" placeholder="搜索合作名称、编号或 KOL" aria-label="搜索合作记录" value="${esc(state.query)}"></label><button type="button" class="btn primary" data-cooperation-add>${I('plus')}新增合作</button></div><div class="v10-cooperation-scroll" data-cooperation-list>${v10CooperationListRows(state)}</div></section></div>`;
 const element=overlay.querySelector('.v10-cooperations'),context={state,user:currentUser,kind:'list',element,optionsSequence:0};state.context=context;
 element.querySelector('#cooperationclose').onclick=closeDrawer;element.querySelector('[data-cooperation-add]').onclick=()=>openV10CooperationEditor();
 const search=element.querySelector('#cooperationsearch');let composing=false;
 const runSearch=()=>{if(!v10CooperationValid(context)||composing)return;state.query=search.value;v10CooperationDrawList(state);};
 search.addEventListener('compositionstart',()=>{composing=true;});search.addEventListener('compositionend',()=>{composing=false;runSearch();});search.addEventListener('input',event=>{if(!event.isComposing)runSearch();});search.addEventListener('keydown',event=>{if(composing||event.isComposing||event.keyCode===229){if(event.key==='Escape'||event.key==='Enter')event.stopPropagation();}else if(event.key==='Enter')event.preventDefault();});
 bindV10CooperationRows(context);element.querySelector('#cooperationclose').focus();
}
function openV10Cooperations(){
 guardProfileLeave(()=>{if(!currentUser||page!=='contracts')return;const state=v10CooperationsState();state.returnFocus=document.activeElement;v10CooperationShowList(state);loadV10Cooperations();});
}
function v10CooperationInvalid(context){
 const invalid={contracts:[],fee:false,publications:[],messages:[]};if(context.status!=='ready')return invalid;
 const options=context.options||{},contracts=options.contracts||[],fees=options.fees||[],publications=options.publications||[];
 invalid.contracts=context.data.contractIds.filter(id=>!contracts.some(item=>String(item.id)===id));
 if(invalid.contracts.length)invalid.messages.push('部分已选合约已不可用');
 if(context.data.feeId){const fee=fees.find(item=>String(item.id)===context.data.feeId);invalid.fee=!fee||!!fee.linkedCooperationId&&fee.linkedCooperationId!==context.id;if(invalid.fee)invalid.messages.push('已选稿费申请不可用或已关联其他合作');}
 invalid.publications=context.data.publicationIds.filter(id=>{const item=publications.find(entry=>String(entry.id)===id);return !item||!!item.feeId||!!item.deliveryId||!!item.linkedCooperationId&&item.linkedCooperationId!==context.id;});
 if(invalid.publications.length)invalid.messages.push('部分已选发布不可用或已关联其他合作／稿费交付');return invalid;
}
function v10CooperationOptionsHTML(context){
 const {data,options,status}=context;
 if(!data.kolId)return '<p class="v10-cooperation-hint">先搜索选择本人 KOL，再选择本次合作关联的资料。</p>';
 if(status==='loading')return '<p class="v10-cooperation-hint" role="status">正在读取该 KOL 的原记录…</p>';
 if(status==='error')return `<p class="v10-cooperation-hint error" role="alert">${esc(context.optionsError||'关联资料读取失败')}，原选择已保留。</p><button class="btn small" type="button" data-cooperation-options-retry>重新读取关联资料</button>`;
 const contracts=Array.isArray(options?.contracts)?options.contracts:[],fees=Array.isArray(options?.fees)?options.fees:[],publications=Array.isArray(options?.publications)?options.publications:[];
 const invalid=v10CooperationInvalid(context),unavailable=invalid.messages.length?`<div class="v10-cooperation-unavailable" role="alert"><p>${esc(invalid.messages.join('；'))}。请改选或移除后再保存。</p><button class="btn small" type="button" data-cooperation-remove-unavailable>移除不可用选择</button></div>`:'';
 const contractBox=`<section class="v10-cooperation-section"><header><h3>关联合约</h3><small>可多选 · 同 KOL 框架合约可复用</small></header><div class="v10-cooperation-choices">${contracts.map(item=>`<label class="v10-cooperation-choice"><input type="checkbox" name="cooperationcontract" value="${esc(item.id)}" ${data.contractIds.includes(String(item.id))?'checked':''}><span><strong title="${esc(item.title||'合约')}">${esc(item.title||'未命名合约')}</strong><small>${esc(item.status||'状态未记录')}${item.date?' · '+esc(item.date):''}</small></span>${v10CooperationLink(item.url,'查看')}</label>`).join('')||'<p class="v10-cooperation-hint">该 KOL 尚无合约，可先建档。</p>'}</div></section>`;
 let business='';
 if(data.feeMode==='fee'){
  business=`<section class="v10-cooperation-section"><header><h3>关联稿费申请</h3><small>最多一份 · 可暂不关联</small></header><label class="field"><span class="v10-cooperation-sr">稿费申请</span><select id="cooperationfee"><option value="">暂不关联申请</option>${data.feeId&&!fees.some(item=>String(item.id)===data.feeId)?`<option value="${esc(data.feeId)}" selected disabled>原关联申请已不可用</option>`:''}${fees.map(item=>{const occupied=item.linkedCooperationId&&item.linkedCooperationId!==context.id;return `<option value="${esc(item.id)}" ${data.feeId===String(item.id)?'selected':''} ${occupied?'disabled':''}>${esc([item.number,item.title||'未命名申请',typeof feeStatus!=='undefined'?feeStatus[item.status]||item.status:item.status,item.amount!==''&&item.amount!=null?(item.currency||'币种未知')+' '+item.amount:''].filter(Boolean).join(' · '))}${occupied?' · 已归属其他合作':''}</option>`;}).join('')}</select></label><p class="v10-cooperation-hint">发布内容沿所选申请的原交付关联读取。</p>${data.feeId?`<div class="v10-cooperation-readonly-publications">${publications.filter(item=>String(item.feeId||'')===data.feeId).map(item=>`<div>${v10CooperationLink(item.url,item.title||item.platform||'发布内容')||esc(item.title||'发布内容')}<small>${esc([item.platform,item.date].filter(Boolean).join(' · '))}</small></div>`).join('')||'<p class="v10-cooperation-hint">该申请尚未关联实际发布内容。</p>'}</div>`:''}</section>`;
 }else if(data.feeMode==='none'){
  business=`<section class="v10-cooperation-section"><header><h3>关联实际发布</h3><small>可多选 · 不创建稿费申请</small></header><div class="v10-cooperation-choices">${publications.map(item=>{const occupied=!!item.feeId||!!item.deliveryId||!!item.linkedCooperationId&&item.linkedCooperationId!==context.id;return `<label class="v10-cooperation-choice ${occupied?'is-unavailable':''}"><input type="checkbox" name="cooperationpublication" value="${esc(item.id)}" ${data.publicationIds.includes(String(item.id))?'checked':''} ${occupied?'disabled':''}><span><strong title="${esc(item.title||item.url||'发布内容')}">${esc(item.title||item.url||'发布内容')}</strong><small>${esc([item.platform,item.date,occupied?'已关联其他合作或稿费交付':''].filter(Boolean).join(' · '))}</small></span>${v10CooperationLink(item.url,'查看')}</label>`;}).join('')||'<p class="v10-cooperation-hint">该 KOL 尚无实际发布内容，可先建档。</p>'}</div><p class="v10-cooperation-hint">可关联已有发布内容；佣金结算及无稿费核验暂未开放。</p></section>`;
 }else business='<p class="v10-cooperation-hint">稿费安排待确认时，先关联合约；确定安排后再关联申请或发布。</p>';
 return unavailable+contractBox+business;
}
function v10CooperationSync(context){
 if(!v10CooperationValid(context)||context.kind!=='editor')return;
 const submit=context.element.querySelector('#cooperationsave');submit.disabled=context.busy||context.conflicted||!context.data.kolId||context.status!=='ready'||!context.pendingCreate&&v10CooperationInvalid(context).messages.length>0;submit.textContent=context.busy?'保存中…':'保存合作';
 const summary=context.element.querySelector('[data-cooperation-selection]');summary.textContent=`已选 ${context.data.contractIds.length} 份合约${context.data.feeMode==='fee'?' · '+(context.data.feeId?'1 份稿费申请':'申请未关联'):context.data.feeMode==='none'?' · '+context.data.publicationIds.length+' 条实际发布':' · 稿费安排待确认'}`;
 const status=context.element.querySelector('[data-cooperation-save-status]');status.textContent=context.conflicted?'版本冲突，输入已保留':v10CooperationDirty(context)?'修改尚未保存':context.pendingCreate?.recovered?'首次保存已确认，请核对修改':context.id?'已保存的合作记录':'填写后保存';
}
function v10CooperationDrawOptions(context){
 if(!v10CooperationValid(context))return;
 const box=context.element.querySelector('[data-cooperation-options]');box.innerHTML=v10CooperationOptionsHTML(context);
 box.querySelector('[data-cooperation-remove-unavailable]')?.addEventListener('click',()=>{const invalid=v10CooperationInvalid(context);context.data.contractIds=context.data.contractIds.filter(id=>!invalid.contracts.includes(id));if(invalid.fee)context.data.feeId='';context.data.publicationIds=context.data.publicationIds.filter(id=>!invalid.publications.includes(id));v10CooperationDrawOptions(context);});
 box.querySelector('[data-cooperation-options-retry]')?.addEventListener('click',()=>loadV10CooperationOptions(context));
 box.querySelectorAll('[name=cooperationcontract]').forEach(input=>input.onchange=()=>{context.data.contractIds=[...box.querySelectorAll('[name=cooperationcontract]:checked')].map(item=>item.value);v10CooperationSync(context);});
 box.querySelectorAll('[name=cooperationpublication]').forEach(input=>input.onchange=()=>{context.data.publicationIds=[...box.querySelectorAll('[name=cooperationpublication]:checked')].map(item=>item.value);v10CooperationSync(context);});
 const fee=box.querySelector('#cooperationfee');if(fee)fee.onchange=()=>{context.data.feeId=fee.value;v10CooperationDrawOptions(context);};if(context.busy)box.querySelectorAll('input,select,button').forEach(input=>input.disabled=true);v10CooperationSync(context);
}
async function loadV10CooperationOptions(context){
 if(!v10CooperationValid(context))return false;
 const kid=Number(context.data.kolId),ticket=++context.optionsSequence;if(!kid){context.options=null;context.status='idle';v10CooperationDrawOptions(context);return false;}
 context.status='loading';context.optionsError='';v10CooperationDrawOptions(context);
 try{const result=await api('/api/cooperation-options?kolId='+encodeURIComponent(kid));if(!v10CooperationValid(context)||ticket!==context.optionsSequence||kid!==Number(context.data.kolId))return false;if(Number(result.kolId)!==kid||!['contracts','fees','publications'].every(key=>Array.isArray(result[key])))throw Error('关联资料返回异常');context.options=result;context.status='ready';v10CooperationDrawOptions(context);return true;}
 catch(error){if(!v10CooperationValid(context)||ticket!==context.optionsSequence)return false;context.status='error';context.optionsError=error.message;v10CooperationDrawOptions(context);return false;}
}
function v10CooperationShowEditor(state,item,returnContext=null){
 if(currentUser!==state.user||page!=='contracts')return;
 const data={kolId:item?.kolId||0,title:item?.title||'',feeMode:item?.feeMode||'unknown',contractIds:(item?.contractIds||[]).map(String),feeId:item?.feeId||'',publicationIds:(item?.publicationIds||[]).map(String)};
 document.body.style.overflow='hidden';document.querySelector('#overlay').innerHTML=`<div class="drawerback v10-cooperations-back"><form id="cooperationform" class="v10-cooperations v10-cooperation-editor" role="dialog" aria-modal="true" aria-labelledby="cooperationsheading"><header class="v10-cooperation-heading"><div><button type="button" class="textbtn v10-cooperation-back" id="cooperationback">${I('arrow')}合作记录</button><h2 id="cooperationsheading">${item?'查看 / 编辑合作':'新增合作'}</h2><span>${item?esc(item.number||'编号未记录'):'保存后自动生成合作编号'}</span></div><button type="button" class="iconbtn" id="cooperationclose" aria-label="关闭合作编辑并返回记录">${I('close')}</button></header><div class="v10-cooperation-scroll fee-form-scroll"><div class="v10-cooperation-basic">${v10FeeKolField(data.kolId,item,'<span aria-label="必填">*</span>')}${inputField('cooperationtitle','合作名称 *',data.title,'text',true)}<div class="field"><label for="cooperationmode">稿费安排</label><select id="cooperationmode">${Object.entries(V10_COOPERATION_MODES).map(([key,label])=>`<option value="${key}" ${key===data.feeMode?'selected':''}>${label}</option>`).join('')}</select></div></div><div data-cooperation-options></div><p class="v10-cooperation-selection" data-cooperation-selection></p><p id="cooperationerror" class="inlinecheck error" role="alert"></p><button class="btn small" type="button" id="cooperationreload" hidden>放弃本次修改并载入最新版</button></div><footer class="v10-cooperation-footer"><span data-cooperation-save-status aria-live="polite"></span><div><button class="btn" type="button" id="cooperationcancel">返回记录</button><button class="btn primary" type="submit" id="cooperationsave">保存合作</button></div></footer></form></div>`;
 const element=document.querySelector('#cooperationform'),context={state,user:currentUser,kind:'editor',element,data,id:item?.id||'',version:item?.version,status:'idle',options:null,optionsSequence:0,busy:false,conflicted:false,detailReturn:returnContext};context.snapshot=JSON.stringify(v10CooperationData(context));state.context=context;
 element.querySelector('#cooperationtitle').maxLength=100;
 if(item){const hint=element.querySelector('#feekolhint');hint.textContent='已建档合作不能更换 KOL';hint.title=hint.textContent;}
 bindV10FeeKol(element);
 element.querySelector('#feekol').addEventListener('change',()=>{if(!v10CooperationValid(context)||context.busy||context.id)return;context.data.kolId=Number(element.querySelector('#feekol').value)||0;context.data.contractIds=[];context.data.feeId='';context.data.publicationIds=[];loadV10CooperationOptions(context);});
 element.querySelector('#cooperationtitle').addEventListener('input',event=>{context.data.title=event.target.value;v10CooperationSync(context);});
 element.querySelector('#cooperationmode').onchange=event=>{context.data.feeMode=event.target.value;context.data.feeId='';context.data.publicationIds=[];v10CooperationDrawOptions(context);};
 ['cooperationclose','cooperationcancel','cooperationback'].forEach(id=>element.querySelector('#'+id).onclick=closeDrawer);
 element.querySelector('#cooperationreload').onclick=()=>v10CooperationPrompt(context,async()=>{if(await loadV10Cooperations()){const latest=state.items.find(entry=>entry.id===context.id);if(latest)v10CooperationShowEditor(state,latest,context.detailReturn);else {v10CooperationShowList(state);toast('该合作已不可用，请重新查看本人记录');}}else v10CooperationShowList(state);},true);
 element.onsubmit=event=>{event.preventDefault();return saveV10Cooperation(context);};
 let composing=false;element.addEventListener('compositionstart',()=>{composing=true;});element.addEventListener('compositionend',()=>{composing=false;});element.addEventListener('keydown',event=>{if((composing||event.isComposing||event.keyCode===229)&&['Enter','Escape'].includes(event.key))event.stopPropagation();});
 v10CooperationDrawOptions(context);if(data.kolId)loadV10CooperationOptions(context);element.querySelector(item?'#cooperationtitle':'#feekolquery').focus();
}
function openV10CooperationEditor(id){
 guardProfileLeave(()=>{if(!currentUser||page!=='contracts')return;const state=v10CooperationsState(),item=id?state.items.find(entry=>String(entry.id)===String(id)):null;if(id&&!item){toast('该合作已不可用，请重新读取');return;}v10CooperationShowEditor(state,item);});
}
function v10CooperationSavedResponse(response){if(!response.item?.id||!Array.isArray(response.items))throw Error('保存返回异常，请重试；输入已保留');return response;}
function v10CooperationAdopt(context,response){context.state.sequence++;context.state.items=response.items;context.state.status='ready';context.state.error='';}
function v10CooperationRecoverIdentity(context,item){
 context.id=item.id;context.version=item.version;context.snapshot=JSON.stringify(v10CooperationData({data:item}));context.pendingCreate=null;
 context.element.querySelector('#cooperationsheading').textContent='查看 / 编辑合作';context.element.querySelector('.v10-cooperation-heading>div>span').textContent=item.number||'编号未记录';
 context.optionsRefreshed=true;v10CooperationDrawOptions(context);lockV10FeeKol(context.element);const hint=context.element.querySelector('#feekolhint');hint.textContent='已建档合作不能更换 KOL';hint.title=hint.textContent;
}
async function saveV10Cooperation(context=v10CooperationsState().context){
 if(!v10CooperationValid(context)||context.kind!=='editor'||context.busy||context.conflicted)return false;
 const error=context.element.querySelector('#cooperationerror');error.textContent='';
 if(!context.element.reportValidity())return false;
 if(!context.data.kolId){error.textContent='请搜索并选择本人 KOL';context.element.querySelector('#feekolquery').focus();return false;}
 if(context.status!=='ready'){error.textContent='请先成功读取关联资料，再保存合作';return false;}
 const data=v10CooperationData(context);if(!data.title||data.title.length>100){error.textContent='合作名称须为 1—100 个字符';return false;}
 if(!context.pendingCreate&&v10CooperationInvalid(context).messages.length){error.textContent='已选关联发生变化，请改选或移除不可用选择后保存';return false;}
 context.busy=true;context.optionsRefreshed=false;const controls=[...context.element.querySelectorAll('input,select,button')],disabled=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);v10CooperationSync(context);
 try{
  let result=null;
  // A lost creation response is ambiguous. Resolve that exact operation before
  // applying any later edits so changed input cannot create a second record.
  if(context.pendingCreate){
   const recovered=v10CooperationSavedResponse(await api('/api/cooperations',context.pendingCreate.payload));if(!v10CooperationValid(context))return false;
   context.pendingCreate.recovered=recovered.item;v10CooperationAdopt(context,recovered);
   if(Number(recovered.item.kolId)!==data.kolId){error.textContent='首次保存已成功建档为 '+(recovered.item.number||'原合作')+'。已建档合作不能更换 KOL，请恢复原 KOL 后保存，或返回记录另建合作。';return false;}
   const originalData=context.pendingCreate.payload.data,unchanged=JSON.stringify(originalData)===JSON.stringify(data),changedRemotely=recovered.item.version!==1||JSON.stringify(v10CooperationData({data:recovered.item}))!==JSON.stringify(originalData);
   v10CooperationRecoverIdentity(context,recovered.item);
   if(unchanged)result=recovered;
   else if(changedRemotely){context.conflicted=true;error.textContent='首次保存已成功，但该合作随后已被更新。当前输入已保留，请重新载入后核对，避免覆盖其他修改。';context.element.querySelector('#cooperationreload').hidden=false;return false;}
  }
  if(!result){
   if(v10CooperationInvalid(context).messages.length){error.textContent='已选关联发生变化，请改选或移除不可用选择后保存';return false;}
   const payload={action:'save',...(context.id?{id:context.id,version:context.version}:{}),data},key=JSON.stringify(payload);
   if(context.lastAttemptKey!==key){context.requestId=crypto.randomUUID();context.lastAttemptKey=key;}payload.requestId=context.requestId;
   if(!context.id)context.pendingCreate={payload:structuredClone(payload),recovered:null};
   result=v10CooperationSavedResponse(await api('/api/cooperations',payload));if(!v10CooperationValid(context))return false;
  }
  v10CooperationAdopt(context,result);context.pendingCreate=null;context.snapshot=JSON.stringify(v10CooperationData(context));v10CooperationFinish(context,true);toast('合作已保存');return true;
 }catch(failure){
  if(!v10CooperationValid(context))return false;error.textContent=failure.message||'保存失败，输入已保留';
  if(failure.status){if(!context.id)context.pendingCreate=null;if(failure.status===409){if(context.id){context.conflicted=true;context.element.querySelector('#cooperationreload').hidden=false;}else{await loadV10CooperationOptions(context);context.optionsRefreshed=true;}}}
  return false;
 }finally{context.busy=false;controls.forEach((control,index)=>{if(control.isConnected)control.disabled=disabled[index];});if(context.optionsRefreshed)v10CooperationDrawOptions(context);else v10CooperationSync(context);}
}

function v10CooperationPrompt(context,action=null,reload=false){
 if(!v10CooperationValid(context)||document.querySelector('#leaveprompt'))return;
 const prompt=document.createElement('div');prompt.id='leaveprompt';prompt.className='leaveprompt v10-cooperation-leave';
 prompt.innerHTML=`<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="合作修改尚未保存"><h2>${reload?'载入最新版合作？':'修改尚未保存'}</h2><p>${reload?'本次未保存的修改将被放弃，重新读取已保存的版本。':context.conflicted?'当前版本冲突，输入已保留；可继续编辑，或放弃修改后离开。':'请选择保存后返回、放弃修改，或继续编辑。'}</p><p class="inlinecheck error" data-cooperation-leave-error role="alert"></p><div class="actions"><button class="btn" id="keepediting">继续编辑</button><button class="btn" id="discardprofile">${reload?'放弃修改并载入':'放弃修改'}</button>${!context.conflicted&&!reload?'<button class="btn primary" id="saveandleave">保存并返回</button>':''}</div></section></div>`;
 document.querySelector('#overlay').append(prompt);
 prompt.querySelector('#keepediting').onclick=()=>{prompt.remove();context.element.querySelector('#cooperationtitle').focus();};
 prompt.querySelector('#discardprofile').onclick=()=>{if(!v10CooperationValid(context)||context.busy)return;prompt.remove();v10CooperationFinish(context,!action);if(action)v10CooperationBaseGuard(action);};
 const save=prompt.querySelector('#saveandleave');if(save)save.onclick=async()=>{if(context.busy)return;save.disabled=true;const succeeded=await saveV10Cooperation(context);if(succeeded&&action&&currentUser===context.user){v10CooperationFinish(context.state.context,false);v10CooperationBaseGuard(action);}else if(!succeeded&&prompt.isConnected){prompt.querySelector('[data-cooperation-leave-error]').textContent=context.element.querySelector('#cooperationerror').textContent||'保存未完成，输入已保留';save.disabled=false;if(context.conflicted)save.hidden=true;}};
 prompt.querySelector('#keepediting').focus();
}
const v10CooperationBaseCenter=center;
center=function(kind){const html=v10CooperationBaseCenter(kind);if(kind!=='contracts')return html;return html.replace('<div class="toolbar">','<div class="toolbar"><button class="btn v10-cooperation-entry" type="button" data-cooperations-open>'+I('grid')+'合作记录</button>');};
const v10CooperationBaseBind=bindContent;
bindContent=function(){v10CooperationBaseBind();if(page==='contracts')document.querySelectorAll('[data-cooperations-open]').forEach(button=>button.onclick=openV10Cooperations);};
const v10CooperationBaseGuard=guardProfileLeave;
guardProfileLeave=function(action){
 const context=v10CooperationsState().context;if(!v10CooperationValid(context))return v10CooperationBaseGuard(action);
 if(context.busy){toast('正在保存，请稍候');return;}
 if(v10CooperationDirty(context)){v10CooperationPrompt(context,action);return;}
 v10CooperationFinish(context,false);return v10CooperationBaseGuard(action);
};
const v10CooperationBaseClose=closeDrawer;
closeDrawer=function(){
 const context=v10CooperationsState().context;if(!v10CooperationValid(context))return v10CooperationBaseClose();
 if(context.busy){toast('正在保存，请稍候');return;}
 if(document.querySelector('#leaveprompt')){document.querySelector('#keepediting')?.click();return;}
 if(v10CooperationDirty(context)){v10CooperationPrompt(context);return;}
 return v10CooperationFinish(context,context.kind==='editor');
};
const v10CooperationBaseForceClose=forceClose;
forceClose=function(){const state=v10CooperationsState(),context=state.context;if(context){context.optionsSequence++;context.finished=true;state.context=null;}return v10CooperationBaseForceClose();};
window.addEventListener('beforeunload',event=>{const context=v10CooperationsState().context;if(v10CooperationValid(context)&&(context.busy||v10CooperationDirty(context))){event.preventDefault();event.returnValue='';}});
