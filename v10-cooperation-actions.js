/* Existing source-record operations, scoped to one explicitly identified cooperation. */
let v10CooperationBusinessChild=null,v10CooperationActionOpening=null;
const v10CooperationActionForms=new WeakMap();
const V10_COOPERATION_DIRECT_ACTIONS={'submit-fee':'submit','withdraw-fee':'withdraw','request-review':'request_review'};
function v10CooperationActionContext(){return v10CooperationBusinessChild;}
function v10CooperationActionValid(context){return !!context&&!context.finished&&currentUser===context.user&&page==='contracts'&&v10CooperationsState()===context.state&&context.state.context===context&&context.element?.isConnected;}
function v10CooperationActionReturn(context){return {id:context.id,user:context.user,state:context.state,listPosition:context.listPosition,detailScroll:context.element.querySelector('.v10-detail-scroll')?.scrollTop||0};}
function v10CooperationActionCents(raw){if(typeof raw!=='string'||!/^\d{1,12}(?:\.\d{1,2})?$/.test(raw))return null;const [whole,fraction='']=raw.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));}
function v10CooperationActionCanPay(data){const payment=data.payment;return !!data.actions?.recordPayment&&data.fee?.status==='approved'&&data.fee.currency==='USD'&&payment?.currency==='USD'&&v10CooperationActionCents(payment.paid)!==null&&v10CooperationActionCents(payment.approvedAmount)>0n&&v10CooperationActionCents(payment.remaining)>0n;}
function v10CooperationActionAllowed(data,action,id){
 const rights=data.actions||{},delivery=rights.deliveries?.find(d=>String(d.id)===String(id));
 if(action==='create-fee')return !!rights.createFee&&data.item.feeMode==='fee'&&!data.item.feeId&&!data.fee;
 if(action==='create-contract')return rights.createContract===true;
 if(action==='create-publication')return rights.createPublication===true&&data.item.feeMode==='none'&&!data.item.feeId&&!data.fee;
 if(action==='edit-contract')return rights.editContractIds?.some(value=>String(value)===String(id))&&data.contracts.some(record=>String(record.id)===String(id));
 if(action==='edit-publication')return rights.editPublicationIds?.some(value=>String(value)===String(id))&&data.publications.some(record=>String(record.id)===String(id));
 if(action==='payment')return v10CooperationActionCanPay(data);
 if(action==='register-publication'||action==='link-publication')return data.item.feeMode==='fee'&&!!data.fee&&!!delivery?.[action==='register-publication'?'registerPublication':'linkPublication']&&data.deliveries.some(record=>String(record.id)===String(id));
 return !!data.fee&&!!rights[{'edit-fee':'editFee','submit-fee':'submitFee','withdraw-fee':'withdrawFee','request-review':'requestReview'}[action]];
}
function v10CooperationActionButton(action,label,id='',primary=false){return `<button type="button" class="btn small${primary?' primary':''}" data-cooperation-action="${esc(action)}"${id?` data-record-id="${esc(id)}" data-delivery-id="${esc(id)}"`:''}>${esc(label)}</button>`;}
function v10CooperationActionDecorate(context){
 if(!v10CooperationValid(context)||context.kind!=='detail'||context.status!=='ready')return;
 const data=context.data;if(!data.actions)return;
 const add=(node,buttons)=>{if(!node||!buttons)return;const box=document.createElement('div');box.className='v10-cooperation-record-actions';box.innerHTML=buttons;node.append(box);};
 if(v10CooperationActionAllowed(data,'create-contract'))add(context.element.querySelector('#cooperationdetail-contracts .v10-detail-record-content'),v10CooperationActionButton('create-contract','新建并关联合约','',true));
 if(v10CooperationActionAllowed(data,'create-publication'))add(context.element.querySelector('#cooperationdetail-publications .v10-detail-record-content'),v10CooperationActionButton('create-publication','新增发布并关联','',true));
 context.element.querySelectorAll('.v10-detail-contract').forEach((node,index)=>{const record=data.contracts[index];if(v10CooperationActionAllowed(data,'edit-contract',record.id))add(node,v10CooperationActionButton('edit-contract','编辑合约',record.id));});
 const feeButtons=[['create-fee','新建稿费申请'],['edit-fee','编辑申请'],['submit-fee','提交审批'],['withdraw-fee','撤回申请']].filter(([action])=>v10CooperationActionAllowed(data,action)).map(([action,label])=>v10CooperationActionButton(action,label,'',action==='submit-fee'||action==='create-fee')).join('');add(context.element.querySelector('#cooperationdetail-fee .v10-detail-record-content'),feeButtons);
 if(v10CooperationActionAllowed(data,'payment'))add(context.element.querySelector('#cooperationdetail-payments .v10-detail-record-content'),v10CooperationActionButton('payment','登记线下付款'));
 context.element.querySelectorAll('.v10-detail-delivery').forEach((node,index)=>{const delivery=data.deliveries[index];add(node,[['register-publication','登记发布'],['link-publication','关联已有发布']].filter(([action])=>v10CooperationActionAllowed(data,action,delivery.id)).map(([action,label])=>v10CooperationActionButton(action,label,delivery.id)).join(''));});
 context.element.querySelectorAll('.v10-detail-publication').forEach((node,index)=>{const publication=data.publications[index];if(v10CooperationActionAllowed(data,'edit-publication',publication.id))add(node,v10CooperationActionButton('edit-publication','编辑发布',publication.id));});
 if(v10CooperationActionAllowed(data,'request-review'))add(context.element.querySelector('#cooperationdetail-review .v10-detail-record-content'),v10CooperationActionButton('request-review','提交上级核验'));
 const error=document.createElement('p');error.className='v10-cooperation-operation-error';error.setAttribute('data-cooperation-operation-error','');error.setAttribute('role','alert');error.hidden=true;context.element.querySelector('[data-cooperation-detail-body]').prepend(error);
 context.element.querySelectorAll('[data-cooperation-action]').forEach(button=>button.onclick=()=>openV10CooperationAction(button.dataset.cooperationAction,button.dataset.recordId||button.dataset.deliveryId));
}
const v10ActionBaseDetailDraw=v10CooperationDetailDraw;
v10CooperationDetailDraw=function(context){v10ActionBaseDetailDraw(context);v10CooperationActionDecorate(context);};
function v10CooperationActionDetailError(context,error){if(!v10CooperationValid(context))return;const box=context.element.querySelector('[data-cooperation-operation-error]');if(box){box.hidden=false;box.textContent=error.message||String(error);box.scrollIntoView?.({block:'nearest'});}}
function v10CooperationActionClearError(context){if(v10CooperationActionValid(context)&&!context.conflicted)context.form.querySelector('#cooperationactionerror').textContent='';}
function v10CooperationActionSyncForm(context){if(!v10CooperationActionValid(context)||!context.conflicted)return;context.form.classList.add('v10-cooperation-action-conflicted');context.form.querySelectorAll('[type=submit],[data-cooperation-child-submit]').forEach(button=>button.disabled=true);}
function v10CooperationActionSetError(context,error){if(!v10CooperationActionValid(context))return;const box=context.form.querySelector('#cooperationactionerror');box.textContent=error.message||String(error)||'保存未完成，输入已保留';if(error.status===409){context.conflicted=true;context.form.querySelector('[data-cooperation-action-reload]').hidden=false;box.textContent+='；资料已更新，当前输入已保留，请重新读取后核对。';}v10CooperationActionSyncForm(context);}
function v10CooperationCreatedFeeData(context){
 const form=context.form,get=id=>form.querySelector('#'+id).value.trim();
 return {kolId:Number(get('feekol')),title:get('feetitle'),reason:get('feereason'),amount:get('feeamount'),currency:get('feecurrency').toUpperCase(),deliveries:[...form.querySelectorAll('[data-delivery]')].map(element=>({id:element.dataset.delivery,...Object.fromEntries([...element.querySelectorAll('[data-deliveryfield]')].map(input=>[input.dataset.deliveryfield,input.value.trim()]))}))};
}
function v10CooperationActionDirty(context){if(!v10CooperationActionValid(context))return false;const dirty=context.action==='create-publication'&&context.savedPublication?JSON.stringify(v10CooperationPublicationForm(context))!==JSON.stringify(context.savedPublication):context.action==='create-contract'&&context.savedContract?JSON.stringify(v10CooperationContractForm(context))!==JSON.stringify(context.savedContract):context.action==='create-fee'&&context.savedData?JSON.stringify(v10CooperationCreatedFeeData(context))!==JSON.stringify(context.savedData):v7Snapshot(context.form)!==context.snapshot;return dirty||!!context.pendingCreate?.uncertain;}
function v10CooperationActionFinish(context,returnToDetail=true){
 if(!context||context.finished)return;const valid=v10CooperationActionValid(context);context.finished=true;context.busy=false;if(v10CooperationBusinessChild===context)v10CooperationBusinessChild=null;if(context.state.context===context)context.state.context=null;
 if(!valid)return;v10ActionBaseForceClose();if(returnToDetail&&currentUser===context.user&&page==='contracts')openV10CooperationDetail(context.returned.id,context.returned);
}
function v10CooperationActionPrompt(context,after=null,reload=false){
 if(!v10CooperationActionValid(context)||document.querySelector('#leaveprompt'))return;
 const uncertain=context.pendingCreate?.uncertain?'首次保存结果尚待确认，'+(context.action==='create-contract'?'合约':context.action==='create-publication'?'发布记录':'申请')+'可能已经保存并关联；放弃输入不会撤销已保存的记录。':'';
 const prompt=document.createElement('div');prompt.id='leaveprompt';prompt.className='leaveprompt v10-cooperation-leave v10-cooperation-action-leave';
 prompt.innerHTML=`<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="修改尚未保存"><h2>${reload?'重新读取资料':'修改尚未保存'}</h2><p>${reload?'当前输入将被放弃。重新读取本次合作后，再继续操作。':'请选择保存后返回，或继续编辑。'}${esc(uncertain)}</p><p class="inlinecheck error" data-cooperation-leave-error role="alert"></p><div class="actions"><button class="btn" type="button" id="keepediting">继续编辑</button><button class="btn" type="button" id="discardprofile">${reload?'放弃并重新读取':'放弃修改'}</button>${reload?'':'<button class="btn primary" type="button" id="saveandleave">保存并返回</button>'}</div></section></div>`;
 document.querySelector('#overlay').append(prompt);prompt.querySelector('#keepediting').onclick=()=>{prompt.remove();context.form.querySelector('input:not([type=hidden]),textarea,select')?.focus();};
 prompt.querySelector('#discardprofile').onclick=()=>{if(context.busy||v7Draft?.busy)return;v10CooperationActionFinish(context,!after);if(after)after();};
 prompt.querySelector('#saveandleave')?.addEventListener('click',async event=>{if(context.busy||v7Draft?.busy)return;event.target.disabled=true;context.afterSave=after;try{if(!await context.save()&&prompt.isConnected)prompt.querySelector('[data-cooperation-leave-error]').textContent=context.form.querySelector('#cooperationactionerror')?.textContent||context.form.querySelector('#v4error,#v7error')?.textContent||'保存未完成，输入已保留';}catch(error){if(prompt.isConnected)prompt.querySelector('[data-cooperation-leave-error]').textContent=error.message;}finally{if(event.target.isConnected)event.target.disabled=false;if(!context.finished)context.afterSave=null;}});prompt.querySelector('#keepediting').focus();
}
function v10CooperationActionComplete(context){const after=context.afterSave;v10CooperationActionFinish(context,!after);if(after&&currentUser===context.user&&page==='contracts')after();}
function v10CooperationActionAttach(context,form){
 if(!context||!form)return;context.form=form;context.element=form;context.kind='business-child';context.optionsSequence=0;context.state.context=context;v10CooperationBusinessChild=context;v10CooperationActionForms.set(form,context);form.classList.add('v10-cooperation-business-form');form.dataset.cooperationAction=context.action;
 let composing=false;form.addEventListener('compositionstart',()=>{composing=true;});form.addEventListener('compositionend',()=>{composing=false;});form.addEventListener('keydown',event=>{if((composing||event.isComposing||event.keyCode===229)&&(event.key==='Escape'||event.key==='Enter'))event.stopPropagation();});
 const info=document.createElement('p');info.className='v10-cooperation-child-context';info.textContent=context.data.item.title+' · '+(context.data.item.number||'本次合作');form.querySelector('.modalheading').after(info);
 const feedback=document.createElement('div');feedback.className='v10-cooperation-child-feedback';feedback.innerHTML='<p id="cooperationactionerror" class="inlinecheck error" role="alert"></p><button type="button" class="textbtn" data-cooperation-action-reload hidden>重新读取本次合作</button>';form.querySelector('.actions').before(feedback);feedback.querySelector('button').onclick=()=>v10CooperationActionPrompt(context,null,true);
}
const v10ActionBaseModal=modalUI;
modalUI=function(...args){const context=v10CooperationActionOpening;v10ActionBaseModal(...args);if(context)v10CooperationActionAttach(context,document.querySelector('#v4form'));};
const v10ActionBaseDraftModal=draftModal;
draftModal=function(...args){const context=v10CooperationActionOpening;v10ActionBaseDraftModal(...args);if(context)v10CooperationActionAttach(context,document.querySelector('#v7form'));};
function v10CooperationActionLockPublication(context){
 const form=context.form,kol=form.querySelector('#entrykol'),pair=form.querySelector('#publicationfee');kol.disabled=true;
 const expected=context.action==='register-publication'?context.data.fee.id+'|'+context.recordId:context.original?.feeId?context.original.feeId+'|'+context.original.deliveryId:'';context.expectedPair=expected;
 const reverse=context.action==='edit-publication'&&context.data.fee?context.data.deliveries.find(delivery=>(delivery.publications||[]).some(publication=>String(publication.id)===context.recordId)||(delivery.publicationIds||[]).some(id=>String(id)===context.recordId)):null;
 const label=expected||reverse?(context.data.fee?.title||'原稿费申请')+' · '+(context.delivery?.description||reverse?.description||'原交付项'):'不关联稿费申请';
 const lock=()=>{pair.innerHTML=`<option value="${esc(expected)}">${esc(label)}</option>`;pair.value=expected;pair.disabled=true;};lock();form.querySelector('#entryplatform').addEventListener('change',lock);kol.addEventListener('change',lock);pair.closest('.field').querySelector('small').textContent=context.action==='create-publication'?'本条发布仅关联当前无稿费合作，不关联稿费申请。':context.action==='register-publication'?'本条发布仅登记到当前选定的交付项。':'编辑保留这条发布的原关联。';
}
function v10CooperationActionValidate(context){
 if(!v10CooperationActionValid(context))throw Error('窗口已关闭或账号已切换，请重新打开当前合作');if(context.conflicted)throw Error('资料已更新，请先重新读取本次合作，输入已保留');
 const form=context.form;
 if(['create-publication','create-contract','edit-contract','edit-publication','register-publication'].includes(context.action)&&Number(form.querySelector('#entrykol')?.value)!==Number(context.data.item.kolId))throw Error('只能修改本次合作所属的 KOL');
 if(['create-publication','edit-publication','register-publication'].includes(context.action)&&form.querySelector('#publicationfee')?.value!==context.expectedPair)throw Error('请保留本条发布的明确合作和交付关联');
 if(['edit-fee','create-fee'].includes(context.action)&&Number(form.querySelector('#feekol')?.value)!==Number(context.data.item.kolId))throw Error('不能将当前申请改到其他 KOL');
}
async function openV10CooperationAction(action,recordId=''){
 const parent=v10CooperationsState().context;if(!v10CooperationValid(parent)||parent.kind!=='detail'||parent.status!=='ready'||parent.operationBusy||parent.operationConflict||!v10CooperationActionAllowed(parent.data,action,recordId))return false;
 if(V10_COOPERATION_DIRECT_ACTIONS[action])return v10CooperationRunDirect(parent,action);
 const data=parent.data,returned=v10CooperationActionReturn(parent),context={state:parent.state,user:parent.user,id:parent.id,cooperationVersion:data.item.version,data,returned,action,recordId:String(recordId),busy:false,finished:false,conflicted:false};
 if(['create-publication','create-contract','edit-contract','edit-publication','register-publication'].includes(action)){
  parent.operationBusy=true;try{const result=await api('/api/state');if(!v10CooperationValid(parent)||parent.state.context!==parent)return false;store=prepare(result);}catch(error){v10CooperationActionDetailError(parent,error);return false;}finally{parent.operationBusy=false;}
 }
 if(!v10CooperationValid(parent)||parent.state.context!==parent)return false;
 const kol=own().find(k=>Number(k.id)===Number(data.item.kolId));if(!kol){v10CooperationActionDetailError(parent,Error('当前 KOL 已不可用，请重新读取合作'));return false;}
 if(action==='edit-contract'){context.original=kol.contracts.find(r=>String(r.id)===context.recordId);if(!context.original){v10CooperationActionDetailError(parent,Error('原合约已不可用，请重新读取合作'));return false;}}
 if(action==='edit-publication'){context.original=kol.promotions.find(r=>String(r.id)===context.recordId);if(!context.original){v10CooperationActionDetailError(parent,Error('原发布记录已不可用，请重新读取合作'));return false;}}
 context.delivery=data.deliveries.find(d=>String(d.id)===context.recordId);context.originalIds=kol.promotions.map(p=>String(p.id));
 v10CooperationFinish(parent,false);v10CooperationActionOpening=context;
 try{
  const fee=data.fee?structuredClone(data.fee):null;
  if(action==='edit-contract')entryDialog('contracts',Number(data.item.kolId),context.recordId);
  if(action==='create-contract')entryDialog('contracts',Number(data.item.kolId));
  if(action==='edit-publication')entryDialog('promotions',Number(data.item.kolId),context.recordId);
  if(action==='create-publication')entryDialog('promotions',Number(data.item.kolId));
  if(action==='register-publication')entryDialog('promotions',Number(data.item.kolId),null,{feeId:fee.id,deliveryId:context.recordId});
  if(action==='edit-fee')feeEditor(fee);
  if(action==='create-fee')feeEditor(null,Number(data.item.kolId));
  if(action==='payment')paymentEditor({...fee,currency:data.payment.currency,approvedAmount:data.payment.approvedAmount,remaining:data.payment.remaining});
  if(action==='link-publication'){fee.availablePublications=structuredClone(data.publicationCandidates?.find(group=>String(group.deliveryId)===context.recordId)?.items||[]);publicationLink(fee,context.recordId);}
  if(!context.form){openV10CooperationDetail(returned.id,returned);return false;}
  if(action==='create-fee'){context.form.querySelector('#feetitle').value=data.item.title||'';lockV10FeeKol(context.form);context.form.querySelector('#feekol').disabled=true;const hint=context.form.querySelector('#feekolhint');hint.textContent='本次合作的 KOL 已锁定';hint.title=hint.textContent;}
  if(['create-publication','create-contract','edit-contract','edit-publication','register-publication'].includes(action))context.form.querySelector('#entrykol').disabled=true;
  if(action==='create-contract'){
   context.form.setAttribute('aria-label','新建并关联合约');context.form.querySelector('.modalheading h2').textContent='新建并关联合约';context.form.querySelector('[type=submit]').textContent='保存并关联';
   context.form.querySelector('.v10-cooperation-child-context').textContent+=' · KOL 已锁定，保存后关联到本次合作';
  }
  if(action==='create-publication'){
   context.form.setAttribute('aria-label','新增发布并关联');context.form.querySelector('.modalheading h2').textContent='新增发布并关联';context.form.querySelector('[type=submit]').textContent='保存并关联';
   context.form.querySelector('.v10-cooperation-child-context').textContent+=' · KOL 已锁定，保存后关联到本次无稿费合作';
  }
  if(['create-publication','edit-publication','register-publication'].includes(action))v10CooperationActionLockPublication(context);
  const originalSubmit=context.form.onsubmit;context.save=async()=>{if(!v10CooperationActionValid(context)||context.busy)return false;v10CooperationActionClearError(context);try{v10CooperationActionValidate(context);}catch(error){v10CooperationActionSetError(context,error);return false;}if(['create-publication','create-contract'].includes(action)&&!context.form.reportValidity())return false;context.saving=true;context.acknowledged=false;try{if(action==='create-publication'){if(await v10CooperationCreatePublicationCommit(context)&&v10CooperationActionValid(context)){v10CooperationActionComplete(context);renderContent();toast('发布已保存并关联');}}else await originalSubmit({target:context.form,preventDefault(){}});return context.finished;}finally{context.saving=false;v10CooperationActionSyncForm(context);}};context.form.onsubmit=async event=>{event.preventDefault();return context.save();};
  context.form.querySelectorAll('.actions button[type=button]:not(#cancelv7):not(#cancelv4)').forEach(button=>{const original=button.onclick;if(!original)return;button.setAttribute('data-cooperation-child-submit','');button.onclick=async event=>{if(context.busy||!v10CooperationActionValid(context))return false;v10CooperationActionClearError(context);try{v10CooperationActionValidate(context);context.acknowledged=false;return await original.call(button,event);}catch(error){v10CooperationActionSetError(context,error);return false;}finally{v10CooperationActionSyncForm(context);}};});
  context.snapshot=v7Snapshot(context.form);if(v7Draft?.form===context.form)v7Draft.snapshot=context.snapshot;
  return true;
 }catch(error){if(context.form)v10CooperationActionSetError(context,error);else {v10CooperationBusinessChild=null;openV10CooperationDetail(returned.id,returned);toast(error.message);}return false;}finally{v10CooperationActionOpening=null;}
}
const v10ActionBaseChildSaved=v10DrawerChildSaved;
v10DrawerChildSaved=function(form){const context=v10CooperationActionForms.get(form);if(!context)return v10ActionBaseChildSaved(form);if(v10CooperationActionValid(context))v10CooperationActionComplete(context);return true;};
function v10CooperationCreatedFeeResponse(context,response,pending){
 const cooperation=response?.cooperation,fee=Array.isArray(response?.items)?response.items.find(item=>String(item.id)===String(response.id)):null;
 if(!fee||String(cooperation?.id)!==context.id||String(cooperation?.feeId)!==String(fee.id)||Number(fee.kolId)!==Number(context.data.item.kolId)||response.createdVersion!==1||!Number.isInteger(cooperation.version))throw Error('申请保存回执不完整，请保留输入重试核对');
 // Creation replays return the current original record. Only the unchanged
 // creation baseline may continue into an update or submit automatically.
 if(cooperation.version!==pending.payload.cooperationVersion+1||fee.version!==response.createdVersion||fee.status!=='draft'){
  pending.uncertain=false;context.createdFee=fee;
  throw Object.assign(Error('首次保存已确认，但申请或合作随后已更新；请重新读取后核对，避免覆盖后续修改'),{status:409});
 }
 return fee;
}
function v10CooperationAdoptCreatedFee(context,response,fee){
 applyFees(response);
 context.savedData=structuredClone(context.pendingCreate.payload.data);
 context.createdFee=fee;context.cooperationVersion=response.cooperation.version;context.createdVersion=response.createdVersion;
 context.data={...context.data,fee,item:{...context.data.item,version:response.cooperation.version,feeId:fee.id}};
 context.state.items=context.state.items.map(item=>String(item.id)===context.id?{...item,version:response.cooperation.version,feeId:fee.id}:item);
 context.pendingCreate=null;
}
async function v10CooperationCreateFeeCall(context,f,action,extra){
 if(!['save','submit'].includes(action))throw Error('当前合作不支持此操作');
 if(extra.data&&Number(extra.data.kolId)!==Number(context.data.item.kolId))throw Error('不能将当前申请改到其他 KOL');
 if(context.createdFee){
  const original=f||context.createdFee;if(String(original.id)!==String(context.createdFee.id))throw Error('只能操作本次合作已保存的申请');
  return api('/api/fees',{id:original.id,version:original.version,action,...extra,cooperationId:context.id,cooperationVersion:context.cooperationVersion});
 }
 if(action!=='save'||f)throw Error('请先保存本次合作的稿费申请');
 let pending=context.pendingCreate;
 if(!pending){
  if(!extra.requestId)throw Error('保存请求缺少标识，请重新打开合作');
  pending={payload:structuredClone({action:'save',...extra,cooperationCreate:true,cooperationId:context.id,cooperationVersion:context.cooperationVersion}),uncertain:false};context.pendingCreate=pending;
 }
 let response;
 try{response=await api('/api/fees',pending.payload);}catch(error){
  if(!error.status||error.status>=500)pending.uncertain=true;
  else if(!pending.uncertain)context.pendingCreate=null;
  throw error;
 }
 if(!v10CooperationActionValid(context))throw Error('窗口已关闭或账号已切换，本次结果未载入');
 // Until a complete acknowledgement is checked, the first request remains
 // recoverable, including a response lost after the transaction committed.
 pending.uncertain=true;const created=v10CooperationCreatedFeeResponse(context,response,pending),changed=JSON.stringify(pending.payload.data)!==JSON.stringify(extra.data);
 v10CooperationAdoptCreatedFee(context,response,created);
 if(!changed)return response;
 // Input changed only after the uncertain attempt: update that same identity,
 // using both acknowledged versions instead of making a second application.
 response=await api('/api/fees',{id:created.id,version:created.version,action:'save',...extra,cooperationId:context.id,cooperationVersion:context.cooperationVersion});
 return response;
}
const v10ActionBaseFeeCall=feeCall;
feeCall=async function(f,action,extra={}){
 const context=v10CooperationBusinessChild,scoped=context&&v10CooperationActionForms.get(v7Draft?.form)===context;if(!scoped)return v10ActionBaseFeeCall(f,action,extra);
 v10CooperationActionValidate(context);
 if(context.action!=='create-fee'&&String(f?.id)!==String(context.data.fee?.id))throw Error('只能操作本次合作明确关联的申请');
 const allowed={'create-fee':['save','submit'],'edit-fee':['save','submit'],payment:['payment'],'link-publication':['link']}[context.action]||[];if(!allowed.includes(action))throw Error('当前合作不支持此操作');
 if(action==='link'){const candidates=context.data.publicationCandidates?.find(group=>String(group.deliveryId)===context.recordId)?.items||[];if(String(extra.deliveryId)!==context.recordId||extra.publicationIds.some(id=>!candidates.some(p=>String(p.id)===String(id))))throw Error('请选择当前交付项可以关联的发布记录');}
 if(action==='payment'&&!v10CooperationActionCanPay(context.data))throw Error('当前批准余额不可用于付款登记，请重新读取合作');
 const draft=v7Draft,wasBusy=draft?.busy,controls=context.action==='create-fee'?[...context.form.querySelectorAll('input,select,textarea')]:[],disabled=controls.map(control=>control.disabled);context.busy=true;if(draft)draft.busy=true;controls.forEach(control=>control.disabled=true);
 try{
  const response=context.action==='create-fee'?await v10CooperationCreateFeeCall(context,f,action,extra):await api('/api/fees',{id:f.id,version:f.version,action,...extra,cooperationId:context.id,cooperationVersion:context.cooperationVersion});
  if(!v10CooperationActionValid(context))throw Error('窗口已关闭或账号已切换，本次结果未载入');if(context.action==='create-fee'&&(String(response?.id)!==String(context.createdFee?.id)||!Array.isArray(response?.items)||!response.items.some(item=>String(item.id)===String(response.id)&&Number.isInteger(item.version)&&item.version>0)))throw Error('申请保存回执不完整，请保留输入重新核对');const latest=applyFees(response);if(context.action==='create-fee'){context.createdFee=latest;context.data.fee=latest;if(action==='save'){context.savedData=structuredClone(extra.data);context.snapshot=v7Snapshot(context.form);if(v7Draft?.form===context.form)v7Draft.snapshot=context.snapshot;}}context.acknowledged=true;return latest;
 }catch(error){const feedback=context.action==='create-fee'&&context.createdFee&&action==='submit'?Object.assign(Error('草稿已保存并关联；提交未完成：'+error.message),{status:error.status}):error;v10CooperationActionSetError(context,feedback);throw feedback;}
 finally{context.busy=false;if(v7Draft===draft&&draft)draft.busy=wasBusy;controls.forEach((control,index)=>{if(control.isConnected)control.disabled=disabled[index];});}
};
function v10CooperationContractFields(record){return Object.fromEntries(['id','title','url','date','status'].map(key=>[key,record?.[key]??'']));}
function v10CooperationContractForm(context){
 const form=context.form,get=id=>form.querySelector('#'+id).value.trim();
 return {id:context.createdContractId||'',title:get('entrytitle'),url:get('entryurl'),date:get('entrydate'),status:get('entrystatus')};
}
function v10CooperationContractStateRecord(state,context,id){
 if(!state||!Number.isInteger(state.revision)||state.revision<0||!Array.isArray(state.kols)||!Array.isArray(state.pool)||!Array.isArray(state.tasks))throw Error('合约保存回执不完整，请保留输入重试核对');
 const kols=state.kols.filter(kol=>Number(kol.id)===Number(context.data.item.kolId));
 const records=kols.length===1&&Array.isArray(kols[0].contracts)?kols[0].contracts.filter(record=>record.id===id):[];
 if(records.length!==1)throw Error('合约保存回执不完整，请保留输入重试核对');
 return v10CooperationContractFields(records[0]);
}
function v10CooperationCreatedContractResponse(context,response,pending){
 const parent=response?.cooperation,expected=pending.payload.data.contract;
 const fields=['id','title','url','date','status'],created=response?.createdContract;
 if(!created||Object.keys(created).length!==fields.length||fields.some(key=>typeof created[key]!=='string')||response?.contractId!==expected.id||String(parent?.id)!==context.id||parent?.kolId!==pending.payload.data.kolId||!Number.isInteger(parent.version)||!Array.isArray(parent.contractIds)||parent.contractIds.filter(id=>id===expected.id).length!==1||response.createdCooperationVersion!==pending.payload.cooperationVersion+1||JSON.stringify(v10CooperationContractFields(created))!==JSON.stringify(expected))throw Error('合约创建回执不一致，请保留输入重试核对');
 const current=v10CooperationContractStateRecord(response.state,context,expected.id);
 if(parent.version!==response.createdCooperationVersion||JSON.stringify(current)!==JSON.stringify(expected)){
  pending.uncertain=false;
  throw Object.assign(Error('首次保存已确认，但合约或合作随后已更新；请重新读取后核对，避免覆盖后续修改'),{status:409});
 }
 if(JSON.stringify(parent.contractIds)!==JSON.stringify([...context.data.item.contractIds,expected.id]))throw Error('合约创建关联回执不一致，请保留输入重试核对');
 return current;
}
async function v10CooperationCreateContractCommit(context,next){
 if(context.busy)return false;
 const controls=[...context.form.querySelectorAll('input,select,textarea')],disabled=controls.map(control=>control.disabled);
 try{
  v10CooperationActionValidate(context);
  const kid=Number(context.data.item.kolId),current=store.kols.find(kol=>Number(kol.id)===kid),edited=next.kols.find(kol=>Number(kol.id)===kid);
  if(!current||!edited)throw Error('当前 KOL 已不可用');
  const added=edited.contracts.filter(record=>!current.contracts.some(original=>original.id===record.id));
  if(added.length!==1)throw Error('请仅新建本次合作的一份合约');
  if(!context.createdContractId)context.createdContractId=added[0].id;
  const desired=v10CooperationContractFields({...added[0],id:context.createdContractId});
  context.busy=true;controls.forEach(control=>control.disabled=true);
  if(!context.savedContract){
   let pending=context.pendingCreate;
   if(!pending){pending={payload:structuredClone({action:'create-contract',cooperationId:context.id,cooperationVersion:context.cooperationVersion,requestId:crypto.randomUUID(),data:{kolId:kid,contract:desired}}),uncertain:false};context.pendingCreate=pending;}
   let response;
   try{response=await api('/api/cooperations',pending.payload);}catch(error){if(!error.status||error.status>=500)pending.uncertain=true;else if(error.status===400||!pending.uncertain)context.pendingCreate=null;throw error;}
   if(!v10CooperationActionValid(context))return false;
   pending.uncertain=true;const created=v10CooperationCreatedContractResponse(context,response,pending);
   store=prepare(response.state);context.savedContract=created;context.cooperationVersion=response.cooperation.version;context.pendingCreate=null;
   context.data={...context.data,item:{...context.data.item,...response.cooperation}};
   context.state.items=context.state.items.map(item=>String(item.id)===context.id?{...item,...response.cooperation}:item);
  }
  // Recover the first identity before applying text changed after an uncertain
  // save. Build this update from the fresh acknowledgement, never old `next`.
  if(JSON.stringify(desired)!==JSON.stringify(context.savedContract)){
   const updated=structuredClone(store),kol=updated.kols.find(kol=>Number(kol.id)===kid),record=kol?.contracts.find(record=>record.id===context.createdContractId);
   if(!record)throw Error('原合约已不可用，请重新读取合作');Object.assign(record,desired);
   const revision=store.revision,result=await api('/api/state',{revision,kols:updated.kols,tasks:updated.tasks||[],claimedIds:[],source:'workspace',cooperationId:context.id,cooperationVersion:context.cooperationVersion,cooperationTarget:{kind:'contracts',id:context.createdContractId}});
   if(!v10CooperationActionValid(context))return false;
   const acknowledged=v10CooperationContractStateRecord(result,context,context.createdContractId);
   if(result.revision<=revision||JSON.stringify(acknowledged)!==JSON.stringify(desired))throw Error('合约更新回执不一致，请保留输入重新核对');
   store=prepare(result);context.savedContract=acknowledged;
  }
  context.snapshot=v7Snapshot(context.form);context.acknowledged=true;return true;
 }catch(error){v10CooperationActionSetError(context,error);return false;}
 finally{context.busy=false;controls.forEach((control,index)=>{if(control.isConnected)control.disabled=disabled[index];});}
}
const V10_COOPERATION_PUBLICATION_FIELDS=['id','title','url','date','time','platform','feeId','deliveryId','linkChoice','format','proof','promotionInfo','remarks','method','views','likes','comments','clicks','revenue','shares','orders','revenueCurrency'];
function v10CooperationPublicationFields(record){return Object.fromEntries(V10_COOPERATION_PUBLICATION_FIELDS.map(key=>[key,record?.[key]??'']));}
function v10CooperationPublicationForm(context){
 const basic={title:'entrytitle',url:'entryurl',date:'entrydate',time:'entrytime',platform:'entryplatform'},result={};
 for(const key of V10_COOPERATION_PUBLICATION_FIELDS){
  if(key==='id')result[key]=context.createdPublicationId||'';
  else if(key==='linkChoice')result[key]='none';
  else if(['feeId','deliveryId'].includes(key))result[key]='';
  else{const value=context.form.querySelector('#'+(basic[key]||'case-'+key)).value;result[key]=['remarks','promotionInfo'].includes(key)?value:value.trim();}
 }
 return result;
}
function v10CooperationPublicationStateRecord(state,context,id){
 if(!state||!Number.isInteger(state.revision)||state.revision<0||!Array.isArray(state.kols)||!Array.isArray(state.pool)||!Array.isArray(state.tasks))throw Error('发布保存回执不完整，请保留输入重试核对');
 const kols=state.kols.filter(kol=>Number(kol.id)===Number(context.data.item.kolId));
 const records=kols.length===1&&Array.isArray(kols[0].promotions)?kols[0].promotions.filter(record=>record.id===id):[];
 if(records.length!==1)throw Error('发布保存回执不完整，请保留输入重试核对');
 return v10CooperationPublicationFields(records[0]);
}
function v10CooperationCreatedPublicationResponse(context,response,pending){
 const parent=response?.cooperation,expected=pending.payload.data.publication,created=response?.createdPublication,fields=V10_COOPERATION_PUBLICATION_FIELDS;
 if(!created||Object.keys(created).length!==fields.length||fields.some(key=>typeof created[key]!=='string')||response.publicationId!==expected.id||String(parent?.id)!==context.id||parent?.kolId!==pending.payload.data.kolId||!Number.isInteger(parent.version)||!Array.isArray(parent.publicationIds)||parent.publicationIds.filter(id=>id===expected.id).length!==1||typeof parent.feeMode!=='string'||typeof parent.feeId!=='string'||response.createdCooperationVersion!==pending.payload.cooperationVersion+1||JSON.stringify(v10CooperationPublicationFields(created))!==JSON.stringify(expected))throw Error('发布创建回执不一致，请保留输入重试核对');
 const current=v10CooperationPublicationStateRecord(response.state,context,expected.id);
 if(parent.feeMode!=='none'||parent.feeId!==''||parent.version!==response.createdCooperationVersion||JSON.stringify(current)!==JSON.stringify(expected)){
  pending.uncertain=false;
  throw Object.assign(Error('首次保存已确认，但发布或合作随后已更新；请重新读取后核对，避免覆盖后续修改'),{status:409});
 }
 if(JSON.stringify(parent.publicationIds)!==JSON.stringify([...context.data.item.publicationIds,expected.id]))throw Error('发布创建关联回执不一致，请保留输入重试核对');
 return current;
}
async function v10CooperationCreatePublicationCommit(context){
 if(context.busy)return false;
 const controls=[...context.form.querySelectorAll('input,select,textarea,button')],disabled=controls.map(control=>control.disabled);
 try{
  v10CooperationActionValidate(context);
  const kid=Number(context.data.item.kolId),current=store.kols.find(kol=>Number(kol.id)===kid);
  if(!current)throw Error('当前 KOL 已不可用');
  if(!context.createdPublicationId)context.createdPublicationId=crypto.randomUUID();
  // Read the original full form directly. Its older submit wrappers replace a
  // global commit function across awaits and must not leak an old session's
  // fields into a newly opened cooperation.
  const desired=v10CooperationPublicationForm(context);
  if(desired.feeId!==''||desired.deliveryId!==''||desired.linkChoice!=='none')throw Error('无稿费发布不能关联稿费申请或交付项');
  context.busy=true;controls.forEach(control=>control.disabled=true);
  if(!context.savedPublication){
   let pending=context.pendingCreate;
   if(!pending){pending={payload:structuredClone({action:'create-publication',cooperationId:context.id,cooperationVersion:context.cooperationVersion,requestId:crypto.randomUUID(),data:{kolId:kid,publication:desired}}),uncertain:false};context.pendingCreate=pending;}
   let response;
   try{response=await api('/api/cooperations',pending.payload);}catch(error){if(!error.status||error.status>=500)pending.uncertain=true;else if(error.status===400||!pending.uncertain)context.pendingCreate=null;throw error;}
   if(!v10CooperationActionValid(context))return false;
   pending.uncertain=true;const created=v10CooperationCreatedPublicationResponse(context,response,pending);
   store=prepare(response.state);context.savedPublication=created;context.cooperationVersion=response.cooperation.version;context.pendingCreate=null;
   context.data={...context.data,item:{...context.data.item,...response.cooperation}};
   context.state.items=context.state.items.map(item=>String(item.id)===context.id?{...item,...response.cooperation}:item);
  }
  if(JSON.stringify(desired)!==JSON.stringify(context.savedPublication)){
   const updated=structuredClone(store),kol=updated.kols.find(kol=>Number(kol.id)===kid),record=kol?.promotions.find(record=>record.id===context.createdPublicationId);
   if(!record)throw Error('原发布已不可用，请重新读取合作');Object.assign(record,desired);
   const revision=store.revision,result=await api('/api/state',{revision,kols:updated.kols,tasks:updated.tasks||[],claimedIds:[],source:'workspace',cooperationId:context.id,cooperationVersion:context.cooperationVersion,cooperationTarget:{kind:'promotions',id:context.createdPublicationId}});
   if(!v10CooperationActionValid(context))return false;
   const acknowledged=v10CooperationPublicationStateRecord(result,context,context.createdPublicationId);
   if(result.revision<=revision||JSON.stringify(acknowledged)!==JSON.stringify(desired))throw Error('发布更新回执不一致，请保留输入重新核对');
   store=prepare(result);context.savedPublication=acknowledged;
  }
  context.snapshot=v7Snapshot(context.form);context.acknowledged=true;return true;
 }catch(error){v10CooperationActionSetError(context,error);return false;}
 finally{context.busy=false;controls.forEach((control,index)=>{if(control.isConnected)control.disabled=disabled[index];});}
}
const v10ActionBaseCommit=commit;
commit=async function(next){
 const creation=v10CooperationBusinessChild;if(creation?.action==='create-contract'&&creation.saving)return v10CooperationCreateContractCommit(creation,next);
 const context=v10CooperationBusinessChild;if(!context||!['edit-contract','edit-publication','register-publication'].includes(context.action)||!context.saving)return v10ActionBaseCommit(next);
 try{
  v10CooperationActionValidate(context);if(context.busy)return false;const kid=Number(context.data.item.kolId),kol=next.kols.find(k=>Number(k.id)===kid),kind=context.action==='edit-contract'?'contracts':'promotions';if(!kol)throw Error('当前 KOL 已不可用');
  let id=context.recordId;if(context.action==='register-publication'){const created=kol.promotions.filter(p=>!context.originalIds.includes(String(p.id)));if(created.length!==1)throw Error('请仅登记当前交付项的一条发布记录');id=String(created[0].id);if(context.createdPublicationId&&context.createdPublicationId!==id)created[0].id=id=context.createdPublicationId;else context.createdPublicationId=id;Object.assign(created[0],{feeId:context.data.fee.id,deliveryId:context.recordId,linkChoice:'selected'});}
  const record=kol[kind].find(r=>String(r.id)===id);if(!record)throw Error('原记录已不可用，请重新读取合作');
  if(context.action==='edit-publication')for(const field of ['feeId','deliveryId','linkChoice']){if(Object.hasOwn(context.original,field))record[field]=context.original[field];else delete record[field];}
  const target={kind,id,...(context.action==='register-publication'?{feeId:context.data.fee.id,deliveryId:context.recordId}:{})};
  context.busy=true;const result=await api('/api/state',{revision:store.revision,kols:next.kols,tasks:next.tasks||[],claimedIds:[],source:'workspace',cooperationId:context.id,cooperationVersion:context.cooperationVersion,cooperationTarget:target});
  if(!v10CooperationActionValid(context))return false;store=prepare(result);context.acknowledged=true;return true;
 }catch(error){v10CooperationActionSetError(context,error);return false;}finally{context.busy=false;}
};
async function v10CooperationRunDirect(context,action){
 if(!v10CooperationValid(context)||context.operationBusy||!v10CooperationActionAllowed(context.data,action))return false;
 const returned=v10CooperationActionReturn(context),fee=context.data.fee,buttons=[...context.element.querySelectorAll('button')],disabled=buttons.map(button=>button.disabled);context.operationBusy=true;buttons.forEach(button=>button.disabled=true);
 try{const result=await api('/api/fees',{id:fee.id,version:fee.version,action:V10_COOPERATION_DIRECT_ACTIONS[action],cooperationId:context.id,cooperationVersion:context.data.item.version});if(!v10CooperationValid(context)||context.state.context!==context)return false;applyFees(result);context.restoreDetailScroll=returned.detailScroll;await loadV10CooperationDetail(context);if(!v10CooperationValid(context)||context.state.context!==context)return false;renderContent();return true;}
 catch(error){if(v10CooperationValid(context)){v10CooperationActionDetailError(context,error);if(error.status===409){context.operationConflict=true;const box=context.element.querySelector('[data-cooperation-operation-error]');const reload=document.createElement('button');reload.className='btn small';reload.textContent='重新读取本次合作';reload.onclick=()=>{context.operationConflict=false;context.restoreDetailScroll=returned.detailScroll;loadV10CooperationDetail(context);};box?.append(' ',reload);}}return false;}
 finally{context.operationBusy=false;buttons.forEach((button,index)=>{if(button.isConnected)button.disabled=!!(context.operationConflict&&button.hasAttribute('data-cooperation-action'))||disabled[index];});}
}
const v10ActionBaseGuard=guardProfileLeave;
guardProfileLeave=function(action){
 if(v10CooperationActionOpening){if(currentUser===v10CooperationActionOpening.user&&page==='contracts')action();return;}
 const context=v10CooperationBusinessChild;
 if(context){if(!v10CooperationActionValid(context)){v10CooperationBusinessChild=null;return v10ActionBaseGuard(action);}if(context.busy||v7Draft?.busy){toast('正在保存，请稍候');return;}if(v10CooperationActionDirty(context)){v10CooperationActionPrompt(context,action);return;}v10CooperationActionFinish(context,false);return v10ActionBaseGuard(action);}
 const parent=v10CooperationsState().context;if(v10CooperationValid(parent)&&parent.operationBusy){toast('正在读取或保存，请稍候');return;}return v10ActionBaseGuard(action);
};
const v10ActionBaseClose=closeDrawer;
closeDrawer=function(){const context=v10CooperationBusinessChild;if(context&&v10CooperationActionValid(context)){if(context.busy||v7Draft?.busy){toast('正在保存，请稍候');return;}if(context.acknowledged&&context.saving){v10CooperationActionComplete(context);return;}if(document.querySelector('#leaveprompt')){document.querySelector('#keepediting')?.click();return;}if(v10CooperationActionDirty(context)){v10CooperationActionPrompt(context);return;}v10CooperationActionFinish(context);return;}const parent=v10CooperationsState().context;if(v10CooperationValid(parent)&&parent.operationBusy){toast('正在读取或保存，请稍候');return;}return v10ActionBaseClose();};
const v10ActionBaseForceClose=forceClose;
forceClose=function(){const context=v10CooperationBusinessChild;if(context){context.finished=true;context.busy=false;if(context.state.context===context)context.state.context=null;v10CooperationBusinessChild=null;}return v10ActionBaseForceClose();};
window.addEventListener('beforeunload',event=>{const context=v10CooperationBusinessChild,parent=v10CooperationsState().context;if(v10CooperationActionValid(context)&&(context.busy||v10CooperationActionDirty(context))||v10CooperationValid(parent)&&parent.operationBusy){event.preventDefault();event.returnValue='';}});
