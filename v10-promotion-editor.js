/* Keep standalone promotion editors scoped to their original list and account. */
let v10PromoEditor = null, v10PromoRestore = null;
function v10PromoEditorValid(context) {
  return context && v10PromoEditor === context && currentUser?.id === context.uid && page === 'promotions' && context.form?.isConnected;
}
function v10PromoEditorDirty(context) {
  return v10PromoEditorValid(context) && v7Snapshot(context.form) !== context.snapshot;
}
function v10PromoCaptureScroll() {
  return ['html','#content','.v10-promotions-main','[data-promo-table-scroll]','.v10-promo-detail-body'].map(selector => {
    const node=document.querySelector(selector);
    return node ? {selector,top:node.scrollTop,left:node.scrollLeft} : null;
  }).filter(Boolean);
}
function v10PromoRestoreView(context) {
  if (currentUser?.id !== context.uid || page !== 'promotions') return;
  context.scroll.forEach(({selector,top,left}) => { const node=document.querySelector(selector); if(node){node.scrollTop=top;node.scrollLeft=left;} });
  let focus=context.focus?.isConnected ? context.focus : null;
  if(!focus&&context.rid)focus=[...document.querySelectorAll('[data-promo-edit]')].find(button=>button.dataset.promoKid===String(context.kid)&&button.dataset.promoId===context.rid);
  if(!focus)focus=document.querySelector(context.rid ? '.v10-promo-detail [data-promo-edit]' : '[data-promo-add]');
  focus?.focus({preventScroll:true});
}
const v10PromoBaseForceClose=forceClose;
function v10PromoEditorFinish(context,restore=true) {
  if(v10PromoEditor !== context || context.finished)return;
  const valid=v10PromoEditorValid(context);
  context.finished=true;v10PromoEditor=null;
  v10PromoBaseForceClose();
  if(valid&&restore){
    v10PromoRestoreView(context);
    if(context.ack)v10PromoRestore=context;
  }
}
function v10PromoEditorPrompt(context,action=null) {
  if(document.querySelector('#leaveprompt'))return;
  const prompt=document.createElement('div');prompt.id='leaveprompt';prompt.className='leaveprompt';
  prompt.innerHTML='<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="未保存的案例"><h2>修改尚未保存</h2><p>请选择保存后返回，或继续编辑。</p><p class="inlinecheck error" role="alert" data-promo-return-error></p><div class="actions"><button class="btn" id="keepediting">继续编辑</button><button class="btn" id="discardprofile">放弃修改</button><button class="btn primary" id="saveandleave">保存并返回</button></div></section></div>';
  document.querySelector('#overlay').append(prompt);
  prompt.querySelector('#keepediting').onclick=()=>{prompt.remove();context.form.querySelector('input:not([type=hidden]),textarea,select')?.focus();};
  prompt.querySelector('#discardprofile').onclick=()=>{
    if(context.busy||!v10PromoEditorValid(context))return;
    prompt.remove();v10PromoEditorFinish(context,!action);if(action)v10PromoBaseGuard(action);
  };
  prompt.querySelector('#saveandleave').onclick=async event=>{
    if(context.busy||!v10PromoEditorValid(context))return;
    event.target.disabled=true;
    const saved=await context.submit();
    if(saved&&action&&currentUser?.id===context.uid&&page==='promotions')v10PromoBaseGuard(action);
    else if(!saved&&prompt.isConnected){prompt.querySelector('[data-promo-return-error]').textContent=context.form.querySelector('#v4error')?.textContent||'保存未完成，输入已保留';event.target.disabled=false;}
  };
  prompt.querySelector('#keepediting').focus();
}
const v10PromoBaseEntry=entryDialog;
entryDialog=function(kind,kid,rid,...args){
  if(kind==='promotions'&&v10InheritedPublicationEntry(kid,rid)){toast('交接保留的发布记录为只读，可查看内容链接；请新增自己的发布记录。');return;}
  if(kind!=='promotions'||page!=='promotions'||document.querySelector('.v10-kol-drawer')||v10DrawerChild)return v10PromoBaseEntry(kind,kid,rid,...args);
  guardProfileLeave(()=>{
    if(page!=='promotions'||!currentUser)return;
    const context={uid:currentUser.id,kid,rid,focus:document.activeElement,scroll:v10PromoCaptureScroll(),busy:false,ack:false,finished:false};
    v10PromoBaseEntry(kind,kid,rid,...args);
    const form=document.querySelector('#v4form');if(!form)return;
    context.form=form;context.snapshot=v7Snapshot(form);v10PromoEditor=context;
    const originalSubmit=form.onsubmit;
    context.submit=async(event={target:form,preventDefault(){}})=>{
      event.preventDefault();
      if(!v10PromoEditorValid(context)||context.busy||!form.reportValidity())return false;
      context.busy=true;context.ack=false;
      const buttons=[...form.querySelectorAll('button')],disabled=buttons.map(button=>button.disabled);buttons.forEach(button=>button.disabled=true);
      try{
        await originalSubmit(event);
        if(!context.finished&&form.isConnected&&!form.querySelector('#v4error').textContent)form.querySelector('#v4error').textContent='保存未完成，输入已保留，请检查后重试';
        return context.finished&&context.ack;
      }catch(error){if(v10PromoEditorValid(context))form.querySelector('#v4error').textContent=error.message;return false;}
      finally{context.busy=false;buttons.forEach((button,index)=>{if(button.isConnected)button.disabled=disabled[index];});}
    };
    form.onsubmit=context.submit;
    let composing=false;
    form.addEventListener('compositionstart',()=>{composing=true;});form.addEventListener('compositionend',()=>{composing=false;});
    form.addEventListener('keydown',event=>{if((composing||event.isComposing||event.keyCode===229)&&['Enter','Escape'].includes(event.key))event.stopPropagation();});
  });
};
const v10PromoBaseCommit=commit;
commit=async function(next){
  const context=v10PromoEditor,owned=v10PromoEditorValid(context)&&context.busy;
  const result=await v10PromoBaseCommit(next);
  if(owned){if(!v10PromoEditorValid(context))return false;if(result)context.ack=true;}
  return result;
};
const v10PromoBaseClose=closeDrawer;
closeDrawer=function(){
  const context=v10PromoEditor;
  if(!v10PromoEditorValid(context)){if(context)v10PromoEditor=null;return v10PromoBaseClose();}
  if(context.ack){v10PromoEditorFinish(context);return;}
  if(context.busy){toast('正在保存，请稍候');return;}
  if(document.querySelector('#leaveprompt')){document.querySelector('#keepediting')?.click();return;}
  if(v10PromoEditorDirty(context)){v10PromoEditorPrompt(context);return;}
  v10PromoEditorFinish(context);
};
const v10PromoBaseGuard=guardProfileLeave;
guardProfileLeave=function(action){
  const context=v10PromoEditor;
  if(!v10PromoEditorValid(context))return v10PromoBaseGuard(action);
  if(context.busy){toast('正在保存，请稍候');return;}
  if(v10PromoEditorDirty(context)){v10PromoEditorPrompt(context,action);return;}
  v10PromoEditorFinish(context,false);v10PromoBaseGuard(action);
};
forceClose=function(){v10PromoEditor=null;v10PromoRestore=null;if(!currentUser&&typeof v10PromoReset==='function')v10PromoReset();return v10PromoBaseForceClose();};
const v10PromoBaseRender=renderContent;
renderContent=function(){
  v10PromoBaseRender();
  const context=v10PromoRestore;v10PromoRestore=null;if(context)v10PromoRestoreView(context);
};
window.addEventListener('beforeunload',event=>{if(v10PromoEditorDirty(v10PromoEditor)){event.preventDefault();event.returnValue='';}});
