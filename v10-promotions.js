/* V10 4B: the promotion center reads the original own-KOL promotions only. */
let v10PromoOwner=null,v10PromoSession=null;
function v10PromoReset(){v10PromoOwner=null;v10PromoSession=null}
function v10PromoState(){
 const uid=typeof currentUser==='undefined'?null:currentUser?.id??null;
 if(v10PromoOwner!==uid||!v10PromoSession){v10PromoOwner=uid;v10PromoSession={platform:'',date:'',page:1,columns:{platform:true,date:true,proof:true},selected:null}}
 return v10PromoSession;
}
function v10PromoKey(kid,id){return JSON.stringify([String(kid),String(id)])}
function v10PromoRows(){
 v10PromoState();if(typeof currentUser!=='undefined'&&!currentUser)return [];
 const uid=typeof currentUser==='undefined'?null:currentUser?.id;
 return own().filter(k=>k.owner==null||uid==null||String(k.owner)===String(uid)).flatMap(k=>(k.promotions||[]).map(record=>({k,record,key:v10PromoKey(k.id,record.id)}))).sort((a,b)=>{
  const ad=v10CaseDate(a.record),bd=v10CaseDate(b.record);
  return Number(bd.known)-Number(ad.known)||(ad.known?bd.key.localeCompare(ad.key):0)||a.key.localeCompare(b.key);
 });
}
function v10PromoFilteredRows(){
 const state=v10PromoState(),q=String(query||'').trim().toLocaleLowerCase(),today=dateCN(),start=new Date(today+'T00:00:00+08:00');
 const days=state.date==='7'?6:state.date==='30'?29:0;
 const first=days?new Date(start.getTime()-days*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}):today;
 return v10PromoRows().filter(({k,record:r})=>{
  if(q&&![k.name,r.title,r.platform,r.remarks,r.url].join(' ').toLocaleLowerCase().includes(q))return false;
  if(state.platform&&r.platform!==state.platform)return false;
  const date=v10CaseDate(r);if(!state.date)return true;
  if(state.date==='unknown')return !date.known;
  if(!date.known)return false;
  if(state.date==='month')return r.date.slice(0,7)===today.slice(0,7)&&r.date<=today;
  return r.date>=first&&r.date<=today;
 });
}
function v10PromoLabel(record){return String(record.title||record.url||'未填写案例链接')}
function v10PromoRender(focusSelector){
 const scroll=document.querySelector('[data-promo-table-scroll]'),left=scroll?.scrollLeft||0,top=scroll?.scrollTop||0;
 renderContent();const next=document.querySelector('[data-promo-table-scroll]');if(next){next.scrollLeft=left;next.scrollTop=top}
 if(focusSelector){const target=document.querySelector(focusSelector),focus=target?.disabled?target.closest('nav')?.querySelector('button:not(:disabled)')||document.querySelector('[data-promo-table-scroll]'):target;focus?.focus({preventScroll:true})}
}
function v10PromoSelect(kid,id){
 if(page!=='promotions')return;
 const row=v10PromoFilteredRows().find(e=>String(e.k.id)===String(kid)&&String(e.record.id)===String(id));if(!row)return;
 v10PromoState().selected={kid:row.k.id,id:row.record.id};v10PromoRender();
 const detail=document.querySelector('.v10-promo-detail');detail?.querySelector('[data-promo-detail-close]')?.focus({preventScroll:true});
}
function v10PromoTable(rows,state){
 const col=state.columns,selected=state.selected&&v10PromoKey(state.selected.kid,state.selected.id);
 const heads=[['case','案例标题'],['kol','KOL'],...(col.platform?[['platform','平台']]:[]),...(col.date?[['date','发布日期']]:[]),...(col.proof?[['proof','发布凭证']]:[]),['actions','操作']];
 return `<div class="v10-promo-table-scroll" data-promo-table-scroll role="region" aria-label="推广案例列表" tabindex="0"><table class="v10-promo-table"><colgroup>${heads.map(([key])=>`<col class="promo-col-${key}">`).join('')}</colgroup><thead><tr>${heads.map(([key,label])=>`<th scope="col" data-promo-column="${key}">${label}</th>`).join('')}</tr></thead><tbody>${rows.map(({k,record:r,key})=>{
  const date=v10CaseDate(r),proof=safeLink(r.proof),label=v10PromoLabel(r),attrs=`data-kid="${esc(k.id)}" data-id="${esc(r.id)}" data-promo-kid="${esc(k.id)}" data-promo-id="${esc(r.id)}"`;
  return `<tr data-promo-row="${esc(key)}" class="${key===selected?'is-selected':''}"${key===selected?' aria-selected="true"':''}><td data-promo-cell="case"><button type="button" class="v10-promo-title" data-promo-view ${attrs} title="${esc(label)}">${esc(label)}</button></td><td data-promo-cell="kol"><button type="button" class="textbtn v10-promo-kol" data-open="${esc(k.id)}" title="${esc(k.name)}">${esc(k.name)}</button></td>${col.platform?`<td data-promo-cell="platform"><span class="v10-promo-platform">${brandMarkup('platform',r.platform||'平台未填写')}<span>${esc(r.platform||'未填写')}</span></span></td>`:''}${col.date?`<td data-promo-cell="date"><time class="v10-promo-date"${date.known?` datetime="${esc(r.date)}"`:''}>${date.known?esc(r.date)+(r.time&&date.key.endsWith(r.time)?`<small>${esc(r.time)}</small>`:''):'日期未知'}</time></td>`:''}${col.proof?`<td data-promo-cell="proof">${proof?`<a class="v10-promo-proof" href="${proof}" title="${esc(r.proof)}" target="_blank" rel="noopener noreferrer">${I('external')}<span>查看凭证</span></a>`:`<span class="v10-promo-missing">${r.proof?'链接不可打开':'未填写'}</span>`}</td>`:''}<td data-promo-cell="actions"><div class="v10-promo-actions"><button type="button" class="textbtn" data-promo-view ${attrs}>查看</button>${v10InheritedPublication(k,r.id)?'<small class="muted" data-promo-inherited-readonly>只读</small>':`<button type="button" class="iconbtn" data-promo-edit ${attrs} aria-label="编辑案例：${esc(label)}" title="编辑案例">${I('pen')}</button>`}</div></td></tr>`;
 }).join('')}</tbody></table>${rows.length?'':'<div class="v10-promo-empty" role="status">暂无符合条件的合作案例</div>'}</div>`;
}
function v10PromoCenter(){
 const state=v10PromoState(),all=v10PromoRows(),filtered=v10PromoFilteredRows(),pages=Math.max(1,Math.ceil(filtered.length/20));state.page=Math.max(1,Math.min(pages,Number(state.page)||1));
 const rows=filtered.slice((state.page-1)*20,state.page*20),selected=state.selected&&rows.find(e=>e.key===v10PromoKey(state.selected.kid,state.selected.id));
 if(state.selected&&!selected)state.selected=null;
 const platforms=[...new Set([...all.map(e=>e.record.platform),state.platform].filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'zh-CN'));
 const detail=selected&&typeof v10PromoDetailHTML==='function'?v10PromoDetailHTML(selected):'';
 return `<div class="v10-promotions-layout${detail?' has-detail':''}"><section class="panel v10-promotions-main" aria-label="推广案例"><h1 class="sr-only">推广案例</h1><div class="toolbar v10-promo-toolbar"><label class="searchfield">${I('search')}<input id="search" value="${esc(query)}" aria-label="搜索推广案例" placeholder="搜索案例、KOL或链接"></label><select data-promo-platform aria-label="筛选发布平台"><option value="">全部平台</option>${platforms.map(p=>`<option value="${esc(p)}"${state.platform===p?' selected':''}>${esc(p)}</option>`).join('')}</select><select data-promo-date aria-label="筛选发布日期">${[['','全部时间'],['7','最近7天'],['30','最近30天'],['month','本月'],['unknown','日期未知']].map(([value,label])=>`<option value="${value}"${state.date===value?' selected':''}>${label}</option>`).join('')}</select><div class="v10-promo-toolbar-actions"><span class="v10-promo-count" data-promo-count>${filtered.length} 条</span><details class="v10-promo-fields"><summary>${I('grid')}字段设置</summary><div><strong>列表显示字段</strong>${[['platform','平台'],['date','发布日期'],['proof','发布凭证']].map(([key,label])=>`<label><input type="checkbox" data-promo-column-toggle="${key}"${state.columns[key]?' checked':''}>${label}</label>`).join('')}<small>案例标题、KOL和操作始终显示</small></div></details><button type="button" class="btn primary" data-promo-add>${I('plus')}添加案例</button></div></div>${v10PromoTable(rows,state)}<div class="v10-promo-footer"><span>共 ${filtered.length} 条 · 仅本人范围</span><nav aria-label="推广案例分页"><button type="button" class="iconbtn" data-promo-page="-1" aria-label="上一页"${state.page===1?' disabled':''}>${I('arrow')}</button><span aria-live="polite">${state.page} / ${pages}</span><button type="button" class="iconbtn" data-promo-page="1" aria-label="下一页"${state.page===pages?' disabled':''}>${I('arrow')}</button><span>每页20条</span></nav></div></section>${detail}</div>`;
}
const v10PromoBaseCenter=center;center=function(kind){return kind==='promotions'?v10PromoCenter():v10PromoBaseCenter(kind)};
const v10PromoBaseBind=bindContent;bindContent=function(){
 v10PromoBaseBind();if(page!=='promotions')return;
 const layout=document.querySelector('.v10-promotions-layout');if(!layout)return;
 const search=layout.querySelector('#search');if(search)bindSearchInput(search,()=>{v10PromoState().page=1},'v10-promotions');
 for(const [selector,key] of [['[data-promo-platform]','platform'],['[data-promo-date]','date']])layout.querySelector(selector)?.addEventListener('change',event=>{const s=v10PromoState();s[key]=event.target.value;s.page=1;v10PromoRender(selector)});
 layout.querySelectorAll('[data-promo-column-toggle]').forEach(input=>input.onchange=()=>{v10PromoState().columns[input.dataset.promoColumnToggle]=input.checked;v10PromoRender();const details=document.querySelector('.v10-promo-fields');if(details)details.open=true;document.querySelector(`[data-promo-column-toggle="${input.dataset.promoColumnToggle}"]`)?.focus({preventScroll:true})});
 layout.querySelectorAll('[data-promo-page]').forEach(button=>button.onclick=()=>{v10PromoState().page+=Number(button.dataset.promoPage);v10PromoRender(`[data-promo-page="${button.dataset.promoPage}"]`)});
 layout.querySelectorAll('[data-promo-view]').forEach(button=>button.onclick=()=>v10PromoSelect(button.dataset.kid,button.dataset.id));
 layout.querySelectorAll('[data-promo-edit]').forEach(button=>button.onclick=()=>{const kid=Number(button.dataset.kid),id=button.dataset.id;v10PromoSelect(kid,id);entryDialog('promotions',kid,id)});
 layout.querySelector('[data-promo-add]')?.addEventListener('click',()=>entryDialog('promotions'));
 if(typeof bindV10PromotionDetail==='function')bindV10PromotionDetail(layout);
};
