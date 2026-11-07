/* Compact case rows read the existing promotions; all fields remain in the editor. */
const v10CasesRendered=new WeakMap();
function v10InheritedPublication(kol,id){return id!=null&&Array.isArray(kol?.inheritedPublicationIds)&&kol.inheritedPublicationIds.some(value=>typeof value==='string'&&value===String(id))}
function v10InheritedPublicationEntry(kid,id){const kol=own().find(item=>String(item.id)===String(kid));return v10InheritedPublication(kol,id)}
function v10CaseDate(record){
 const raw=record.date??'',valid=typeof raw==='string'&&C.validDate(raw),time=typeof record.time==='string'&&/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(record.time)?record.time:'';
 return {known:valid,key:valid?raw+'T'+time:'',text:valid?raw+(time?' '+time:''):raw?'发稿日期未知（原值：'+raw+'）':'发稿日期未知'};
}
function v10CaseLink(raw,label){
 if(raw===''||raw==null)return '<span class="v10-cases-missing">未填写</span>';
 const href=safeLink(raw);return href?`<a href="${href}" title="${esc(raw)}" target="_blank" rel="noopener noreferrer"><span>${esc(label??raw)}</span>${I('external')}</a>`:`<span class="v10-cases-unavailable">${esc(raw)}<small>链接不可打开</small></span>`;
}
function v10CasesRows(kol){
 return (kol.promotions||[]).map((record,index)=>({record,index,date:v10CaseDate(record)})).sort((a,b)=>Number(b.date.known)-Number(a.date.known)||(a.date.known?b.date.key.localeCompare(a.date.key):0)||a.index-b.index);
}
function v10CasesHTML(kol,rows){
 return `<div class="v10-cases-toolbar"><h2><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h4M9 12h6M9 16h6"/></svg>合作案例 <span>${rows.length}条</span></h2><button type="button" class="btn primary v10-cases-add" data-v10-case-add>${I('plus')}添加案例</button></div>${rows.length?`<div class="v10-cases-list">${rows.map(({record,date},index)=>`<article class="v10-cases-card" data-v10-case-id="${esc(record.id)}" data-v10-case-index="${index}"><span class="v10-cases-platform">${brandMarkup('platform',record.platform||'未填写')}</span><div class="v10-cases-main"><div class="v10-cases-link" data-casefield="url">${v10CaseLink(record.url,record.url?String(record.url).replace(/^https?:\/\//i,''):undefined)}</div><p class="v10-cases-meta"><span>${esc(record.platform||'平台未填写')}</span> · <span data-casefield="date">${date.known?'发布于 '+esc(record.date):esc(date.text)}</span></p></div>${v10InheritedPublication(kol,record.id)?'<small class="muted" data-case-inherited-readonly>交接保留 · 只读</small>':`<button type="button" class="v10-cases-edit" data-v10-case-edit aria-label="编辑合作案例 ${index+1}">${I('pen')}编辑</button>`}</article>`).join('')}</div>`:'<p class="v10-cases-empty" role="status">暂无合作案例</p>'}`;
}
function enhanceV10Cases(drawer,kol){
 if(typeof drawerTab!=='undefined'&&drawerTab!=='cases')return;
 const body=drawer?.querySelector('.drawerbody');if(!body||!kol)return;
 const signature=JSON.stringify([kol.id,kol.name,kol.attribute,kol.emails,kol.promotions,kol.inheritedPublicationIds]);
 if(v10CasesRendered.get(body)===signature&&body.querySelector(':scope > .v10-cases'))return;
 const rows=v10CasesRows(kol),section=document.createElement('section');section.className='v10-cases';section.setAttribute('aria-label','合作案例');section.innerHTML=v10CasesHTML(kol,rows);
 section.onclick=event=>{
  const button=event.target.closest('button');if(!button||!section.contains(button))return;
  if(button.hasAttribute('data-v10-case-add')){entryDialog('promotions',kol.id);return}
  const card=button.closest('[data-v10-case-index]'),record=card&&rows[Number(card.dataset.v10CaseIndex)]?.record;
  if(record&&button.hasAttribute('data-v10-case-edit'))entryDialog('promotions',kol.id,record.id);
 };
 body.replaceChildren(section);v10CasesRendered.set(body,signature);
}
