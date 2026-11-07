/* Explicit follow-up saves: preserve drafts and keep pending requests scoped. */
let v10FollowPending=null;
const v10FollowSavedText=new WeakMap();
const v10PreviousSaveFollow=saveFollow;
function v10FollowFeedback(form,message,state='pending',error=''){
 const status=form.querySelector('#v10-follow-status'),alert=form.querySelector('#v10-follow-error');
 if(status){status.textContent=message;status.dataset.state=state}
 if(alert)alert.textContent=error;
}
saveFollow=function(){
 const form=document.querySelector('#followform');
 if(!form?.classList.contains('v10-follow-form'))return v10PreviousSaveFollow();
 if(v10FollowPending)return v10FollowPending.promise;
 const session=followSession,button=form.querySelector('[type="submit"]');
 if(!session||session.id!==drawerId||!own().some(k=>k.id===session.id))return Promise.resolve(false);
 if(session.blocked){v10FollowFeedback(form,'版本冲突，输入已保留','error','数据已更新。请先复制当前内容，再刷新页面载入最新资料。');return Promise.resolve(false)}
 if(!form.reportValidity())return Promise.resolve(false);
 const text=form.querySelector('#followtext').value.trim(),previousText=v10FollowSavedText.get(form);
 if(!text&&previousText===undefined){v10FollowFeedback(form,'保存未完成','error','请填写沟通内容');form.querySelector('#followtext').focus();return Promise.resolve(false)}
 const next=structuredClone(store),kol=next.kols.find(k=>k.id===session.id),snapshot=formSnapshot(form),uid=currentUser?.id;
 const controls=[...form.querySelectorAll('input,textarea,select')],submittedValues=controls.map(input=>input.value);
 // A previous response may have saved this text while the user edited only
 // the next arrangement. Saving the remaining draft must not repeat that log.
 if(text&&text!==previousText){kol.note=text;kol.logs.push({date:dateCN()+' '+new Date().toLocaleTimeString('zh-CN'),text})}
 kol.next=form.querySelector('#nextdate').value.trim();kol.time=v10FollowPlanTime(form);kol.nextAction=form.querySelector('#nextaction').value.trim();
 const pending={form,session,promise:null};v10FollowPending=pending;
 const leaveButtons=[...document.querySelectorAll('#leaveprompt button')].filter(b=>b.id!=='keepediting').map(button=>({button,disabled:button.disabled}));
 leaveButtons.forEach(({button})=>button.disabled=true);
 if(button)button.disabled=true;
 v10FollowFeedback(form,'保存中…','saving');
 pending.promise=(async()=>{
  try{
   const result=await api('/api/state',{revision:store.revision,kols:next.kols,tasks:next.tasks,claimedIds:[],source:'follow'});
   if(currentUser?.id!==uid)return false;
   if(Number(result.revision)>=Number(store.revision))store=prepare(result);
   if(!form.isConnected||followSession!==session||drawerId!==session.id)return false;
   const confirmed=result.kols?.find(k=>k.id===session.id),baseline=JSON.parse(snapshot);
   // Clearing a date can move the action to an unscheduled task on the server.
   // Adopt that acknowledgement only while the matching control is unchanged;
   // a newer user value must remain an unacknowledged draft.
   for(const [id,key] of [['nextdate','next'],['nextaction','nextAction']]){
    const input=form.querySelector('#'+id),index=controls.indexOf(input);
    if(index<0||typeof confirmed?.[key]!=='string')continue;
    baseline[index]=confirmed[key];
    if(input.value===submittedValues[index])input.value=confirmed[key];
   }
   v10FollowArrangements.set(form,{date:confirmed?.next??kol.next,action:confirmed?.nextAction??kol.nextAction,time:confirmed?.time??kol.time});v10FollowPlanHint(form);
   v10FollowSavedText.set(form,text||previousText);session.snapshot=JSON.stringify(baseline);
   if(followDirty()){
    v10FollowFeedback(form,'本次已保存，仍有新草稿待保存','pending');
    renderContent();return false;
   }
   followSession=null;forceClose();renderContent();toast('跟进与计划已保存');return true;
  }catch(error){
   if(form.isConnected&&followSession===session){
    if(error.status===409)session.blocked=true;
    v10FollowFeedback(form,error.status===409?'版本冲突，输入已保留':'保存失败，输入已保留','error',error.message||'保存失败，请重试');
   }
   toast(error.message||'保存失败，请重试');return false;
  }finally{
   if(v10FollowPending===pending)v10FollowPending=null;
   if(button?.isConnected)button.disabled=!!session.blocked;
   leaveButtons.forEach(({button,disabled})=>{if(button.isConnected)button.disabled=disabled});
  }
 })();
 return pending.promise;
};
const v10FollowPreviousGuard=guardProfileLeave;
guardProfileLeave=function(action){
 if(v10FollowPending){toast('跟进正在保存，请稍候');return}
 const form=document.querySelector('#followform.v10-follow-form');
 const result=v10FollowPreviousGuard(action),prompt=document.querySelector('#leaveprompt');
 if(form&&prompt&&followDirty()&&!prompt.dataset.v10FollowGuard){
  prompt.dataset.v10FollowGuard='true';
  const error=document.createElement('p');error.id='v10-follow-leave-error';error.className='inlinecheck error';error.setAttribute('role','alert');prompt.querySelector('.actions').before(error);
  const discard=prompt.querySelector('#discardprofile'),previousDiscard=discard.onclick;
  discard.onclick=event=>{if(v10FollowPending){toast('跟进正在保存，请稍候');return}previousDiscard(event)};
  const save=prompt.querySelector('#saveandleave');
  save.onclick=async()=>{
   if(v10FollowPending)return;
   save.disabled=true;error.textContent='';
   if(await saveFollow()){prompt.remove();action()}
   else if(prompt.isConnected){error.textContent=form.querySelector('#v10-follow-error')?.textContent||form.querySelector('#v10-follow-status')?.textContent||'保存未完成，当前输入已保留';save.disabled=false}
  };
 }
 return result;
};
window.addEventListener('beforeunload',event=>{
 // Restoring all controls to their original values can make followDirty false
 // while the earlier request is still running. The pending request still
 // needs the same browser leave warning as an unsaved draft.
 if(v10FollowPending){event.preventDefault();event.returnValue=''}
});
