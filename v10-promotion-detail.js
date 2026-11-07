/* Read-only promotion detail. Records are always resolved again from the own-KOL store. */
function v10PromoOwnedEntry(kid,id){
 if(typeof currentUser!=='undefined'&&!currentUser)return null;
 const uid=typeof currentUser==='undefined'?null:currentUser?.id;
 const k=own().find(item=>String(item.id)===String(kid)&&(item.owner==null||uid==null||String(item.owner)===String(uid)));
 const record=k?.promotions?.find(item=>String(item.id)===String(id));
 return k&&record?{k,record,key:JSON.stringify([String(k.id),String(record.id)])}:null;
}
function v10PromoDetailText(value){
 if(value==null||value==='')return '<span class="v10-promo-detail-missing">未填写</span>';
 return esc(typeof value==='object'?JSON.stringify(value):String(value));
}
function v10PromoDetailLink(value,proof=false){
 if(value==null||value==='')return '<span class="v10-promo-detail-missing">未填写</span>';
 const raw=String(value),href=safeLink(raw);
 return href?`<a class="v10-promo-detail-link" href="${href}" title="${esc(raw)}" target="_blank" rel="noopener noreferrer">${proof?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h4M9 12h6M9 16h6"/></svg>':''}<span>${proof?'查看凭证':esc(raw)}</span>${proof?'':I('external')}</a>`:`<span class="v10-promo-detail-invalid">${esc(raw)}<small>链接不可打开</small></span>`;
}
function v10PromoDetailField(field,label,html){return `<div class="v10-promo-detail-field" data-casefield="${esc(field)}"><dt>${esc(label)}</dt><dd>${html}</dd></div>`}
function v10PromoDetailGroup(id,title,body,open=true){return `<details class="v10-promo-detail-group" ${open?'open':''}><summary aria-controls="v10-promo-group-${id}"><h3>${title}</h3><span aria-hidden="true">${I('arrow')}</span></summary><dl id="v10-promo-group-${id}">${body}</dl></details>`}
function v10PromoDetailHTML(entry){
 const current=entry&&v10PromoOwnedEntry(entry.k?.id,entry.record?.id);if(!current)return '';
 const {k,record:r}=current,date=v10CaseDate(r),title=r.title||String(r.url||'').replace(/^https?:\/\//i,'')||'合作案例';
 const field=(name,label,html)=>v10PromoDetailField(name,label,html===undefined?v10PromoDetailText(r[name]):html);
 const basic=field('customer','关联KOL',`<div class="v10-promo-detail-kol"><span class="avatar" aria-hidden="true">${esc(String(k.name||'K').slice(0,1))}</span><strong>${esc(k.name||'未命名KOL')}</strong></div>`)+field('platform','平台',r.platform?`<span class="v10-promo-detail-platform">${brandMarkup('platform',r.platform)}<span>${esc(r.platform)}</span></span>`:undefined)+field('date','发稿日期',esc(date.text))+field('url','内容链接',v10PromoDetailLink(r.url));
 return `<aside class="v10-promo-detail" aria-labelledby="v10-promo-detail-title" data-promo-detail-kid="${esc(k.id)}" data-promo-detail-id="${esc(r.id)}"><header class="v10-promo-detail-heading"><h2 id="v10-promo-detail-title" title="${esc(title)}">${esc(title)}</h2><button type="button" class="iconbtn" data-promo-detail-close aria-label="关闭案例详情">${I('close')}</button></header><div class="v10-promo-detail-body" tabindex="0" aria-label="案例基本信息">${v10PromoDetailGroup('basic','基础信息',basic)}</div><footer class="v10-promo-detail-footer">${v10InheritedPublication(k,r.id)?'<small class="muted" data-promo-inherited-readonly>交接保留的发布记录，只读</small>':`<button type="button" class="btn primary" data-promo-detail-edit data-promo-edit data-promo-kid="${esc(k.id)}" data-promo-id="${esc(r.id)}">${I('pen')}编辑案例</button>`}</footer></aside>`;
}
let v10PromoDetailEscape=null;
function bindV10PromotionDetail(root){
 if(v10PromoDetailEscape){document.removeEventListener('keydown',v10PromoDetailEscape,true);v10PromoDetailEscape=null}
 const aside=root?.querySelector('.v10-promo-detail');if(!aside)return;
 const uid=typeof currentUser==='undefined'?null:currentUser?.id,kid=aside.dataset.promoDetailKid,id=aside.dataset.promoDetailId;
 const valid=()=>aside.isConnected&&page==='promotions'&&(typeof currentUser==='undefined'?null:currentUser?.id)===uid&&v10PromoOwnedEntry(kid,id);
 const close=()=>{
  if(!valid())return;
  const scroll=[...root.querySelectorAll('[data-promo-table-scroll]')].map(node=>[node.scrollTop,node.scrollLeft]);
  const x=window.scrollX||0,y=window.scrollY||0;
  v10PromoState().selected=null;renderContent();
  const replacement=document.querySelector('.v10-promotions-layout');
  const focus=[...(replacement?.querySelectorAll('[data-promo-view]')||[])].find(node=>String(node.dataset.kid)===kid&&String(node.dataset.id)===id);
  focus?.focus({preventScroll:true});
  replacement?.querySelectorAll('[data-promo-table-scroll]').forEach((node,index)=>{if(scroll[index]){node.scrollTop=scroll[index][0];node.scrollLeft=scroll[index][1]}});
  if(window.scrollX!==x||window.scrollY!==y)window.scrollTo(x,y);
 };
 aside.querySelector('[data-promo-detail-close]').onclick=close;
 const edit=aside.querySelector('[data-promo-detail-edit]');if(edit)edit.onclick=()=>{const entry=valid();if(entry)entryDialog('promotions',entry.k.id,entry.record.id)};
 v10PromoDetailEscape=event=>{
  const inputState=typeof searchInputBindings==='undefined'?null:searchInputBindings.get(document.activeElement);
  if(inputState?.composing||inputState?.ending)return;
  if(event.key!=='Escape'||event.isComposing||event.keyCode===229||!valid()||document.querySelector('#overlay')?.childElementCount)return;
  event.preventDefault();event.stopPropagation();close();
 };
 document.addEventListener('keydown',v10PromoDetailEscape,true);
}
