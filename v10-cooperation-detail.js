/* V10 5B-2: server-derived, read-only facts for one explicitly identified cooperation. */
const V10_COOPERATION_DETAIL_KEYS=['contract','fee','payment','publication','review'];
const V10_COOPERATION_DETAIL_TARGETS=['contracts','fee','payments','publications','review'];
function v10CooperationDetailText(value,missing='未记录'){return value===null||value===undefined||value===''?`<span class="v10-detail-missing">${esc(missing)}</span>`:esc(value);}
function v10CooperationDetailMoney(amount,currency){return amount===null||amount===undefined||amount===''?v10CooperationDetailText(null):`${esc(currency||'币种未记录')} ${esc(amount)}`;}
function v10CooperationDetailTime(time,precision='instant'){
 if(!time||precision==='unknown')return '时间未记录';
 if(precision==='day'){const day=String(time).slice(0,10),parsed=/^\d{4}-\d{2}-\d{2}$/.test(day)?new Date(day+'T00:00:00Z'):null;return parsed&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===day?day:'时间未记录';}
 const parsed=new Date(time);return Number.isNaN(parsed.getTime())?'时间未记录':parsed.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
}
function v10CooperationDetailIcon(key){
 const shapes={contract:'<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5M9 12h7M9 16h5"/>',fee:'<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9ZM9 12h6M9 16h6"/>',payment:'<path d="M3 7h17v13H3ZM3 7V4h14v3M16 12h5v5h-5Z"/>',publication:'<path d="m3 10 18-7-6 18-4-7-8-4ZM11 14 21 3"/>'};
 return shapes[key]?`<svg viewBox="0 0 24 24" aria-hidden="true">${shapes[key]}</svg>`:I(key==='review'?'shield':key);
}
function v10CooperationDetailLink(url,label){
 const href=safeLink(url);if(!url)return v10CooperationDetailText(null,'未填写链接');
 return href?`<a class="v10-detail-link" href="${href}" target="_blank" rel="noopener noreferrer" title="${esc(url)}"><span>${esc(label||url)}</span>${I('external')}</a>`:`<span class="v10-detail-invalid-link" title="${esc(url)}">${esc(label||url)}<small>链接不可打开</small></span>`;
}
function v10CooperationDetailField(label,html){return `<div class="v10-detail-field"><dt>${esc(label)}</dt><dd>${html}</dd></div>`;}
function v10CooperationDetailCard(card){
 const tone=['neutral','info','success','warning','danger'].includes(card.tone)?card.tone:'neutral';
 return `<article class="v10-detail-card" data-cooperation-card="${esc(card.key)}"><span class="v10-detail-card-icon ${esc(card.key)}">${v10CooperationDetailIcon(card.key)}</span><div><h3>${esc(card.label)}</h3><strong class="v10-detail-status ${tone}">${esc(card.value||'未记录')}</strong><p>${esc(card.detail||'')}</p></div></article>`;
}
function v10CooperationDetailSection(key,title,icon,body){return `<section class="v10-detail-record-section" id="cooperationdetail-${key}" data-cooperation-records="${key}" tabindex="-1"><header><span class="v10-detail-section-icon">${v10CooperationDetailIcon(icon)}</span><h3>${esc(title)}</h3></header><div class="v10-detail-record-content">${body}</div></section>`;}
function v10CooperationDetailEmpty(data,key){const card=data.cards.find(item=>item.key===key);return `<p class="v10-detail-empty">${esc(card?.value||'未记录')}${card?.detail?' · '+esc(card.detail):''}</p>`;}
function v10CooperationDetailContracts(data){
 const body=data.contracts.map(contract=>`<article class="v10-detail-contract"><div><strong title="${esc(contract.title||'关联合约')}">${esc(contract.title||'未命名合约')}</strong><span>${v10CooperationDetailText(contract.status,'状态未记录')}</span></div><dl>${v10CooperationDetailField('签约日期',v10CooperationDetailText(contract.date))}${v10CooperationDetailField('合约链接',v10CooperationDetailLink(contract.url,'查看合约'))}</dl></article>`).join('');
 return v10CooperationDetailSection('contracts','合约','contract',body||v10CooperationDetailEmpty(data,'contract'));
}
function v10CooperationDetailFee(data){
 const fee=data.fee;if(!fee)return v10CooperationDetailSection('fee','稿费申请','fee',v10CooperationDetailEmpty(data,'fee'));
 let fields=v10CooperationDetailField('申请单号',v10CooperationDetailText(fee.number))+v10CooperationDetailField('申请状态',v10CooperationDetailText(data.cards.find(card=>card.key==='fee')?.value))+v10CooperationDetailField('申请金额',v10CooperationDetailMoney(fee.amount,fee.currency))+v10CooperationDetailField('当前批准金额',v10CooperationDetailMoney(data.payment?.approvedAmount,data.payment?.currency||fee.currency));
 if(fee.approvedAmount!==null&&fee.approvedAmount!==undefined&&fee.approvedAmount!==''&&(data.payment?.approvedAmount===null||data.payment?.approvedAmount===undefined))fields+=v10CooperationDetailField('历史批准金额',v10CooperationDetailMoney(fee.approvedAmount,fee.currency));
 const approval=fee.approval;
 const extra=`<details class="v10-detail-original"><summary>查看原申请信息 ${I('arrow')}</summary><dl>${v10CooperationDetailField('申请标题',v10CooperationDetailText(fee.title))}${v10CooperationDetailField('申请理由',v10CooperationDetailText(fee.reason))}${approval?v10CooperationDetailField('原审批意见',v10CooperationDetailText(approval.opinion))+v10CooperationDetailField('原审批人',v10CooperationDetailText(approval.actor?.name))+v10CooperationDetailField('原批准时间',esc(v10CooperationDetailTime(approval.time))):''}</dl></details>`;
 return v10CooperationDetailSection('fee','稿费申请','fee',`<dl>${fields}</dl>${extra}`);
}
function v10CooperationDetailPayments(data){
 if(!data.fee)return v10CooperationDetailSection('payments','付款事实','payment',v10CooperationDetailEmpty(data,'payment'));
 const summary=data.payment?`<dl class="v10-detail-payment-summary">${v10CooperationDetailField('付款进度',v10CooperationDetailText(data.payment.status))}${v10CooperationDetailField('已登记累计',data.payment.paid===null||data.payment.paid===undefined||data.payment.paid===''?v10CooperationDetailText(null,'暂不能合计'):v10CooperationDetailMoney(data.payment.paid,data.payment.currency))}${v10CooperationDetailField('当前批准余额',v10CooperationDetailMoney(data.payment.remaining,data.payment.currency))}</dl>`:'';
 const rows=data.payments.map(payment=>`<details class="v10-detail-payment"><summary><span>${esc(v10CooperationDetailTime(payment.date,'day'))}</span><strong>${v10CooperationDetailMoney(payment.amount,payment.currency)}</strong><span>查看记录 ${I('arrow')}</span></summary><dl>${v10CooperationDetailField('实际付款日期',esc(v10CooperationDetailTime(payment.date,'day')))}${v10CooperationDetailField('登记时间',esc(v10CooperationDetailTime(payment.recordedAt)))}${v10CooperationDetailField('登记人',v10CooperationDetailText(payment.actorName))}${v10CooperationDetailField('付款凭证',v10CooperationDetailLink(payment.proof,'查看凭证'))}${v10CooperationDetailField('付款说明',v10CooperationDetailText(payment.note))}</dl></details>`).join('');
 return v10CooperationDetailSection('payments','付款事实','payment',`<p class="v10-detail-note">这里只展示向 KOL 付款后的线下登记记录。</p>${summary}${rows||'<p class="v10-detail-empty">暂无实际付款登记。</p>'}`);
}
function v10CooperationDetailPublications(data){
 const deliveries=data.deliveries.map(delivery=>{const date=Object.hasOwn(delivery,'effectiveDate')?delivery.effectiveDate:delivery.date,time=Object.hasOwn(delivery,'effectiveTime')?delivery.effectiveTime:delivery.time;return `<article class="v10-detail-delivery"><div><strong>${v10CooperationDetailText(delivery.description,'交付内容未记录')}</strong><span class="v10-detail-delivery-status ${delivery.overdue?'warning':delivery.published?'success':'neutral'}">${delivery.overdue?'已逾期':delivery.published?'已登记有效发布':'尚未关联有效发布'}</span></div><p>${v10CooperationDetailText(delivery.platform,'平台未记录')} · 约定：${date?esc(date+(time?' '+time:'')):'未记录'}</p></article>`;}).join('');
 const pubs=data.publications.map(publication=>`<article class="v10-detail-publication">${typeof brandMarkup==='function'&&publication.platform?`<span class="v10-detail-brand">${brandMarkup('platform',publication.platform)}</span>`:'<span class="v10-detail-brand">'+v10CooperationDetailIcon('publication')+'</span>'}<div>${v10CooperationDetailLink(publication.url,publication.title||publication.url)}<small>${v10CooperationDetailText(publication.platform,'平台未记录')} · ${esc(v10CooperationDetailTime(publication.date,'day'))}</small></div></article>`).join('');
 return v10CooperationDetailSection('publications','交付与发布','publication',`${deliveries?`<div class="v10-detail-deliveries">${deliveries}</div>`:''}${pubs||v10CooperationDetailEmpty(data,'publication')}`);
}
function v10CooperationDetailReview(data){
 const review=data.review;if(!review)return v10CooperationDetailSection('review','交付核验','review',v10CooperationDetailEmpty(data,'review'));
 return v10CooperationDetailSection('review','交付核验','review',`<dl>${v10CooperationDetailField('当前核验进度',v10CooperationDetailText(data.cards.find(card=>card.key==='review')?.value))}${v10CooperationDetailField('原核验结论',v10CooperationDetailText(review.result))}${v10CooperationDetailField('核验意见',v10CooperationDetailText(review.opinion))}${v10CooperationDetailField('核验时间',esc(v10CooperationDetailTime(review.time)))}${v10CooperationDetailField('核验人',v10CooperationDetailText(review.actorName))}</dl>`);
}
function v10CooperationDetailSource(source){const labels={cooperation:'合作档案',fee:'稿费申请',payment:'付款记录',publication:'发布记录',contract:'合约记录',review:'核验记录'};return labels[source]||(/[^\x00-\x7F]/.test(String(source||''))?String(source):'原记录');}
function v10CooperationDetailPrecision(event){if(!event.time)return 'unknown';if(event.precision==='day')return v10CooperationDetailTime(event.time,'day')!=='时间未记录'?'day':'unknown';return event.precision==='instant'&&Number.isFinite(new Date(event.time).getTime())?'instant':'unknown';}
function v10CooperationDetailTimelineRow(event){
 const precision=v10CooperationDetailPrecision(event);
 return `<li data-timeline-precision="${precision}" data-timeline-id="${esc(event.id)}"><span class="v10-detail-timeline-dot" aria-hidden="true"></span><time>${esc(v10CooperationDetailTime(event.time,precision))}</time><div><strong>${esc(event.title||'原记录')}</strong><p>${esc(event.detail||'')}</p><small>${esc(v10CooperationDetailSource(event.source))} · 操作人：${v10CooperationDetailText(event.actorName)}</small></div></li>`;
}
function v10CooperationDetailTimeline(data){
 const known=data.timeline.filter(event=>v10CooperationDetailPrecision(event)!=='unknown'),unknown=data.timeline.filter(event=>v10CooperationDetailPrecision(event)==='unknown');
 return `<section class="v10-detail-panel v10-detail-timeline" data-cooperation-timeline><header class="v10-detail-panel-heading"><h2>${I('clock')}真实记录时间线</h2><span>${data.timeline.length} 条</span></header>${known.length?'<ol>'+known.map(v10CooperationDetailTimelineRow).join('')+'</ol>':''}${unknown.length?'<div class="v10-detail-timeline-unknown"><h3>时间未记录</h3><ol>'+unknown.map(v10CooperationDetailTimelineRow).join('')+'</ol></div>':''}${!data.timeline.length?'<p class="v10-detail-empty">暂无可追溯的记录。</p>':''}</section>`;
}
function v10CooperationDetailInformation(data){
 const info=data.information||{},kol=data.kol||{},fields=[['关联 KOL',kol.name],['合作名称',data.item.title],['负责人',info.ownerName],['内容类型',kol.type],['市场 / 地区',kol.market],['语言',kol.lang],['所在平台',Array.isArray(kol.platforms)?kol.platforms.join(' · '):''],['等级',typeof V10_GRADES!=='undefined'&&V10_GRADES[kol.level]?V10_GRADES[kol.level].label||kol.level:kol.level],['建档人',info.createdByName]];
 return `<section class="v10-detail-panel v10-detail-information"><header class="v10-detail-panel-heading"><h2>合作信息</h2></header><dl>${fields.map(([label,value])=>v10CooperationDetailField(label,v10CooperationDetailText(value))).join('')}${v10CooperationDetailField('建档时间',esc(v10CooperationDetailTime(info.createdAt)))}${v10CooperationDetailField('最近更新',esc(v10CooperationDetailTime(info.updatedAt)))}</dl></section>`;
}
function v10CooperationDetailHTML(data){
 const steps=data.nextSteps.map(step=>`<article class="v10-detail-next"><span>${v10CooperationDetailIcon({contracts:'contract',payments:'payment',publications:'publication'}[step.target]||step.target)}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.detail||'')}</p>${V10_COOPERATION_DETAIL_TARGETS.includes(step.target)?`<button type="button" class="btn small" data-cooperation-anchor="${esc(step.target)}">查看本页记录 ${I('arrow')}</button>`:''}</div></article>`).join('');
 return `<div class="v10-detail-cards">${data.cards.map(v10CooperationDetailCard).join('')}</div>${data.warnings.length?`<div class="v10-detail-warnings" role="alert">${data.warnings.map(warning=>'<p>'+esc(typeof warning==='string'?warning:warning.message||warning.title||'关联资料需要核对')+'</p>').join('')}</div>`:''}<div class="v10-detail-grid"><section class="v10-detail-panel v10-detail-records"><header class="v10-detail-panel-heading"><h2>合作记录</h2><span>仅本次明确关联</span></header>${v10CooperationDetailContracts(data)}${v10CooperationDetailFee(data)}${v10CooperationDetailPayments(data)}${v10CooperationDetailPublications(data)}${v10CooperationDetailReview(data)}</section><aside class="v10-detail-aside"><section class="v10-detail-panel"><header class="v10-detail-panel-heading"><h2>待处理</h2></header><div class="v10-detail-next-list">${steps||'<p class="v10-detail-empty">当前关联范围暂无待处理提示。</p>'}</div></section>${v10CooperationDetailInformation(data)}</aside></div>${v10CooperationDetailTimeline(data)}`;
}
function v10CooperationDetailBind(context){
 const element=context.element;element.querySelector('#cooperationdetailclose').onclick=closeDrawer;element.querySelector('#cooperationdetailback').onclick=closeDrawer;
 element.querySelector('[data-cooperation-detail-retry]')?.addEventListener('click',()=>loadV10CooperationDetail(context));
 const edit=element.querySelector('[data-cooperation-detail-edit]');if(edit)edit.onclick=()=>{if(!v10CooperationValid(context)||!context.data)return;const returnContext={id:context.id,user:context.user,state:context.state,listPosition:context.listPosition,detailScroll:element.querySelector('.v10-detail-scroll').scrollTop};guardProfileLeave(()=>{if(currentUser===context.user&&page==='contracts')v10CooperationShowEditor(context.state,context.data.item,returnContext);});};
 element.querySelectorAll('[data-cooperation-anchor]').forEach(button=>button.onclick=()=>{if(!v10CooperationValid(context))return;const target=element.querySelector('#cooperationdetail-'+button.dataset.cooperationAnchor);target?.scrollIntoView({block:'start'});target?.focus({preventScroll:true});});
}
function v10CooperationDetailDraw(context){
 if(!v10CooperationValid(context))return;
 const data=context.data,heading=context.element.querySelector('[data-cooperation-detail-heading]'),body=context.element.querySelector('[data-cooperation-detail-body]');
 const item=data?.item||context.state.items.find(item=>String(item.id)===context.id),kol=data?.kol;
 heading.innerHTML=`<div class="v10-detail-title"><h2 id="cooperationdetailtitle" title="${esc(item?.title||'合作详情')}">${esc(item?.title||'合作详情')}</h2><p>${esc(kol?.name||item?.kolName||'关联 KOL')}<span>${esc(item?.number||'编号未记录')}</span></p></div><div class="v10-detail-top-actions">${data&&!item?.historical?'<button type="button" class="btn" data-cooperation-detail-edit>'+I('pen')+'编辑合作</button>':''}<button type="button" class="iconbtn" id="cooperationdetailclose" aria-label="返回合作记录">${I('close')}</button></div>`;
 body.innerHTML=context.status==='loading'?'<div class="v10-detail-loading" role="status">正在读取本次合作详情…</div>':context.status==='error'?`<div class="v10-detail-loading error" role="alert"><p>${esc(context.error||'合作详情读取失败')}；请重试后查看。</p><button type="button" class="btn" data-cooperation-detail-retry>重新读取详情</button></div>`:v10CooperationDetailHTML(data);
 v10CooperationDetailBind(context);if(context.status==='ready'&&context.restoreDetailScroll!==undefined){context.element.querySelector('.v10-detail-scroll').scrollTop=context.restoreDetailScroll;context.restoreDetailScroll=undefined;}
}
async function loadV10CooperationDetail(context=v10CooperationsState().context){
 if(!v10CooperationValid(context)||context.kind!=='detail')return false;
 const ticket=++context.detailSequence;context.status='loading';context.error='';context.data=null;v10CooperationDetailDraw(context);
 try{const data=await api('/api/cooperation-detail?id='+encodeURIComponent(context.id));if(!v10CooperationValid(context)||ticket!==context.detailSequence)return false;
  if(String(data.item?.id)!==context.id||!Array.isArray(data.cards)||data.cards.length!==5||V10_COOPERATION_DETAIL_KEYS.some((key,index)=>data.cards[index]?.key!==key))throw Error('合作详情返回异常');
  for(const key of ['contracts','payments','deliveries','publications','timeline','nextSteps','warnings'])if(!Array.isArray(data[key]))throw Error('合作详情资料返回异常');
  context.data=data;context.status='ready';const index=context.state.items.findIndex(item=>String(item.id)===context.id);if(index>=0)context.state.items=context.state.items.map((item,i)=>i===index?data.item:item);else context.state.items=[data.item,...context.state.items];v10CooperationDetailDraw(context);return true;
 }catch(error){if(!v10CooperationValid(context)||ticket!==context.detailSequence)return false;context.status='error';context.error=error.message;v10CooperationDetailDraw(context);return false;}
}
function openV10CooperationDetail(id,returnContext=null){
 const state=v10CooperationsState(),user=currentUser,previous=state.context,list=previous?.kind==='list'?previous.element.querySelector('[data-cooperation-list]'):null;
 const listPosition=returnContext?.listPosition||previous?.listPosition||{top:list?.scrollTop||0,left:list?.scrollLeft||0,id:String(id)};
 guardProfileLeave(()=>{if(currentUser!==user||!user||page!=='contracts'||v10CooperationsState()!==state)return;
  state.sequence++;document.body.style.overflow='hidden';document.querySelector('#overlay').innerHTML=`<div class="drawerback v10-cooperations-back"><section class="v10-cooperation-detail" data-cooperation-detail-id="${esc(id)}" role="dialog" aria-modal="true" aria-labelledby="cooperationdetailtitle"><nav class="v10-detail-backbar"><button type="button" class="textbtn" id="cooperationdetailback">${I('arrow')}合作记录</button><span>合作详情</span></nav><header class="v10-detail-heading" data-cooperation-detail-heading></header><div class="v10-detail-scroll" data-cooperation-detail-body></div></section></div>`;
  const context={state,user,kind:'detail',element:document.querySelector('.v10-cooperation-detail'),id:String(id),listPosition,detailSequence:0,optionsSequence:0,status:'loading',data:null,restoreDetailScroll:returnContext?.detailScroll};state.context=context;loadV10CooperationDetail(context);context.element.querySelector('#cooperationdetailclose')?.focus();
 });
}
function v10CooperationReturnFromEditor(context){
 const returned=context.detailReturn;if(!returned||returned.user!==currentUser||returned.state!==v10CooperationsState()||page!=='contracts')return false;
 openV10CooperationDetail(returned.id,returned);return true;
}
const v10DetailBaseBindRows=bindV10CooperationRows;
bindV10CooperationRows=function(context){v10DetailBaseBindRows(context);context.element.querySelectorAll('[data-cooperation-edit]').forEach(button=>{button.textContent='查看详情';button.setAttribute('aria-label','查看合作详情');button.onclick=()=>openV10CooperationDetail(button.dataset.cooperationEdit);});};
const v10DetailBaseClose=closeDrawer;
closeDrawer=function(){
 const context=v10CooperationsState().context;if(!v10CooperationValid(context)||context.kind!=='detail')return v10DetailBaseClose();
 const {state,listPosition}=context;v10CooperationFinish(context,false);if(currentUser!==context.user||page!=='contracts')return;v10CooperationShowList(state);const scroller=state.context.element.querySelector('[data-cooperation-list]');scroller.scrollTop=listPosition.top;scroller.scrollLeft=listPosition.left;
 const button=[...state.context.element.querySelectorAll('[data-cooperation-edit]')].find(node=>String(node.dataset.cooperationEdit)===context.id);button?.focus({preventScroll:true});
};
