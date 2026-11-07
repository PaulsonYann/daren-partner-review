/* Two explicit email purposes; legacy data stay intact without a migration panel. */
const v10ContactForms=new WeakMap();
const v10EmailPurposes=[['registrationEmail','网站注册','网站注册邮箱'],['affiliateEmail','联盟营销','联盟营销邮箱']];
function v10EmailParts(k){
 const emails=k.emails||[],explicit=v10EmailPurposes.map(([,purpose])=>emails.find(e=>e.purpose===purpose)?.address||'');
 return {emails:structuredClone(emails),explicit,legacy:emails.filter(e=>!v10EmailPurposes.some(([,purpose])=>e.purpose===purpose))};
}
function v10ContactField(key,label,raw,type='text'){
 const field=document.createElement('div');field.className='field v8field';field.dataset.profilefield=key;
 field.innerHTML=`<div class="v8fieldhead"><label for="ip-${key}">${label}</label><button type="button" class="iconbtn v8pen" data-editfield="${key}" aria-label="编辑${label}">${I('pen')}</button></div><div class="v8display" role="group"></div><div class="v8editor" hidden><input id="ip-${key}" type="${type}" maxlength="${type==='email'?254:80}" autocomplete="off" aria-label="${label}"></div>`;
 const input=field.querySelector('input');input.value=raw;
 const edit=()=>{field.querySelector('.v8display').hidden=true;field.querySelector('.v8editor').hidden=false;input.focus();const button=field.closest('form')?.querySelector('#saveprofile');if(button){button.disabled=false;button.textContent=profileDirty()?'保存修改':'完成编辑'}};
 field.querySelector('[data-editfield]').onclick=edit;
 field.querySelector('.v8display').addEventListener('click',event=>{if(!event.target.closest('button,a'))edit()});
 return field;
}
function v10PaintContacts(form,k){
 const state=v10ContactForms.get(form);if(!state)return;
 const parts=v10EmailParts(k);state.parts=parts;
 v10EmailPurposes.forEach(([key,,label],index)=>{
  const field=state.fields[index],display=field.querySelector('.v8display'),effective=parts.explicit[index]||parts.explicit[1-index];
  display.innerHTML=effective?`<span class="v10-email-address">${esc(effective)}</span>${!parts.explicit[index]?'<small class="v10-email-shared">共用</small>':''}<button type="button" class="iconbtn" data-v9copy="${esc(effective)}" aria-label="复制${label}">${I('copy')}</button>`:'<span class="muted">未填写</span>';
 });
 const phone=state.phone.querySelector('.v8display');phone.innerHTML=`<span class="v10-contact-value">${esc(k.phone||'未填写')}</span>${k.phone?`<button type="button" class="iconbtn v10-copy-contact" data-v9copy="${esc(k.phone)}" aria-label="复制电话">${I('copy')}</button>`:''}`;
 bindV9Copies(form);
}
function enhanceV10Contacts(form,k){
 if(!form||v10ContactForms.has(form))return;
 const old=form.querySelector('[data-profilefield="emails"]');if(!old)return;
 const section=old.closest('.v9profile-section'),parts=v10EmailParts(k),group=document.createElement('div');group.className='v10-email-fields';
 const fields=v10EmailPurposes.map(([key,,label],i)=>v10ContactField(key,label,parts.explicit[i],'email'));group.append(...fields);
 old.before(group);old.hidden=true;old.removeAttribute('data-profilefield');old.classList.add('v10-email-backing');
 const phone=v10ContactField('phone','电话',k.phone||'','tel');phone.classList.add('v10-contact');const icon=document.createElement('span');icon.className='v10-contact-icon v10-phone-icon';icon.innerHTML='<svg viewBox="0 0 32 32" role="img" aria-label="电话"><rect width="32" height="32" rx="7" fill="#21c657"/><path transform="translate(1.5 1)" d="M10.4 6.9c-.4-.6-1.1-.8-1.7-.4L6.5 8c-.5.3-.8.9-.7 1.5.6 7.6 6.6 13.6 14.2 14.2.6.1 1.2-.2 1.5-.7l1.5-2.2c.4-.6.2-1.3-.4-1.7l-3.2-2c-.5-.3-1.1-.3-1.5.1l-1.4 1.4a12.5 12.5 0 0 1-5.8-5.8l1.4-1.4c.4-.4.4-1 .1-1.5l-1.8-3Z" fill="#fff"/></svg>';phone.prepend(icon);
 const contacts=section.querySelector('.fieldgrid');contacts.append(phone);contacts.classList.add('v10-four-contacts');
 const state={parts,fields,phone,composing:new Set()};v10ContactForms.set(form,state);
 for(const input of [...group.querySelectorAll('input'),phone.querySelector('input')]){
  input.addEventListener('compositionstart',()=>state.composing.add(input));input.addEventListener('compositionend',()=>{state.composing.delete(input);input.dispatchEvent(new Event('input',{bubbles:true}))});
 }
 v10PaintContacts(form,k);
}
function v10ProfileContactsComposing(form){return !!v10ContactForms.get(form)?.composing.size}
const v10ContactsReadProfile=readInlineProfile;
readInlineProfile=function(){
 const data=v10ContactsReadProfile(),form=document.querySelector('#inlineprofile'),state=v10ContactForms.get(form);if(!state)return data;
 const explicit=state.fields.map(field=>field.querySelector('input').value.trim());
 data.emails=explicit.every((address,index)=>address===state.parts.explicit[index])?structuredClone(state.parts.emails):[...v10EmailPurposes.flatMap(([,purpose],index)=>explicit[index]?[{address:explicit[index],purpose}]:[]),...structuredClone(state.parts.legacy)];
 const phone=state.phone.querySelector('input').value.trim();if(phone||Object.hasOwn(data,'phone'))data.phone=phone;return data;
};
const v10ContactsDecorate=decorateV9Profile;
decorateV9Profile=function(k){v10ContactsDecorate(k);const form=document.querySelector('#inlineprofile');if(form)v10PaintContacts(form,k)};
