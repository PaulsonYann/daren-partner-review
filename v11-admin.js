/* V11 batch two: dedicated read-only projections. Never reuse business editors. */
const v11AdminKinds=[['kols','KOL'],['pool','公海'],['cooperations','合作'],['contracts','合约'],['fees','稿费'],['promotions','推广'],['gifts','赠送'],['logs','操作日志']];
let v11AdminContext=null;
function v11AdminAllowed(){return typeof currentUser!=='undefined'&&currentUser?.role==='admin'&&currentUser.adminReadOnly===true&&currentUser.passwordChangeRequired!==true}
function v11AdminReset(){
 const old=v11AdminContext;
 if(old){old.revoked=true;old.options=null;old.detail=null;old.backup=null;old.views.clear();}
 v11AdminContext=null;
 const drawer=document.querySelector('.v11-admin-backdrop');if(drawer){document.body.style.overflow=drawer.v11PreviousOverflow||'';drawer.remove();}
 document.querySelector('.v11-admin')?.remove();
}
function v11AdminFilters(){return {owner:'',from:'',to:'',status:'',q:''}}
function v11AdminState(){
 if(v11AdminContext?.user!==currentUser)v11AdminReset();
 if(!v11AdminContext)v11AdminContext={user:currentUser,active:'kols',views:new Map(),options:null,optionsStatus:'idle',optionsError:'',optionsSerial:0,detail:null,revoked:false,backup:null,backupStatus:'idle',backupError:'',backupSerial:0};
 return v11AdminContext;
}
function v11AdminView(context=v11AdminState(),kind=context.active){
 if(!context.views.has(kind))context.views.set(kind,{filters:v11AdminFilters(),draft:v11AdminFilters(),page:1,pageSize:20,status:'idle',error:'',formError:'',data:null,serial:0});
 return context.views.get(kind);
}
function v11AdminCurrent(context){return v11AdminContext===context&&currentUser===context.user&&v11AdminAllowed()&&page==='admin'&&!context.revoked}
function v11AdminText(value){return value===null||value===undefined||String(value).trim()===''?'未记录':String(value)}
function v11AdminDate(value){
 if(typeof value!=='string'||!value)return '未记录';
 if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const date=new Date(value);return Number.isNaN(date.getTime())?'未记录':new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);
}
function v11AdminKindInfo(context,kind=context.active){return context.options?.kinds.find(item=>item.value===kind)||{value:kind,label:v11AdminKinds.find(item=>item[0]===kind)?.[1]||'',dateLabel:({kols:'建档日期',pool:'建档日期',cooperations:'合作建档日期',contracts:'签约记录日期',fees:'申请创建日期',promotions:'实际发布日期',gifts:'申请创建日期',logs:'操作日期'})[kind],statuses:[]}}
function v11AdminDateLabel(context){return context.active==='logs'?(context.options?.logs?.dateLabel||'操作日期'):v11AdminKindInfo(context).dateLabel}
function v11AdminStatuses(context){return context.active==='logs'?(context.options?.logs?.statuses||[]):v11AdminKindInfo(context).statuses}
function v11AdminDenied(){return '<section class="panel v11-admin-denied" data-admin-denied role="status"><strong>无权限访问管理后台</strong><p>仅当前已完成首次改密的管理员可查看。</p></section>'}
async function v11AdminRevoke(context){
 if(!v11AdminCurrent(context))return;
 const user=context.user;context.revoked=true;context.options=null;context.views.clear();context.backup=null;v11AdminCloseDetail(false);
 const content=document.querySelector('#content');if(content)renderWorkspaceContent(v11AdminDenied());
 try{
  const result=await api('/api/me');
  if(v11AdminContext!==context||currentUser!==user||page!=='admin')return;
  if(!result||!Object.hasOwn(result,'user'))return;
  currentUser=result.user?{...result.user,theme:'blue'}:null;
  v11AdminReset();
  // The service identity wins. Keep a denied view on this visit even if a
  // temporary policy denied this request while the account remains an admin.
  if(currentUser?.role==='admin'&&currentUser.passwordChangeRequired!==true){const denied=v11AdminState();denied.revoked=true;}
  if(currentUser?.passwordChangeRequired===true&&typeof firstPasswordScreen==='function')firstPasswordScreen();
  else if(!currentUser&&typeof loginScreen==='function')loginScreen(false);
  else render();
 }catch{/* api handles expired sessions and the first-password gate itself. */}
}
function v11AdminHandleError(context,error){
 if(!v11AdminCurrent(context))return;
 if(error.status===403){v11AdminRevoke(context);return true}
 return false;
}
async function v11AdminLoadOptions(context){
 const serial=++context.optionsSerial;context.optionsStatus='loading';context.optionsError='';v11AdminPaint(context);
 try{
  const result=await api('/api/admin/options');if(!v11AdminCurrent(context)||context.optionsSerial!==serial)return;
  if(!Array.isArray(result.kinds)||!Array.isArray(result.owners)||!result.logs||!Array.isArray(result.logs.statuses))throw Error('筛选选项返回异常，请重试');
  context.options=result;context.optionsStatus='ready';
 }catch(error){if(!v11AdminCurrent(context)||context.optionsSerial!==serial)return;if(v11AdminHandleError(context,error))return;context.optionsStatus='error';context.optionsError=error.message||'筛选选项读取失败';}
 if(v11AdminCurrent(context))v11AdminPaint(context);
}
function v11AdminQuery(context,view){
 const params=new URLSearchParams();if(context.active!=='logs')params.set('kind',context.active);
 for(const [key,value]of Object.entries(view.filters))if(value&&!(context.active==='pool'&&key==='owner'))params.set(key,value);
 params.set('page',String(view.page));params.set('pageSize',String(view.pageSize));return params.toString();
}
async function v11AdminLoadRecords(context){
 if(!v11AdminCurrent(context))return;
 const kind=context.active,view=v11AdminView(context),serial=++view.serial,url='/api/admin/'+(kind==='logs'?'logs':'records')+'?'+v11AdminQuery(context,view);
 view.status='loading';view.error='';view.data=null;v11AdminPaint(context);
 try{
  const result=await api(url);if(!v11AdminCurrent(context)||context.active!==kind||view.serial!==serial)return;
  if(!Array.isArray(result.items)||!Number.isInteger(result.total)||result.total<0||!Number.isInteger(result.page)||result.page<1||!Number.isInteger(result.pageSize)||result.pageSize<1||result.pageSize>50||kind!=='logs'&&result.kind!==kind)throw Error('列表返回异常，请重新查询');
  view.data=result;view.page=result.page;view.pageSize=result.pageSize;view.status='ready';
 }catch(error){if(!v11AdminCurrent(context)||context.active!==kind||view.serial!==serial)return;if(v11AdminHandleError(context,error))return;view.status='error';view.error=error.message||'列表读取失败';}
 if(v11AdminCurrent(context)&&context.active===kind)v11AdminPaint(context);
}
async function v11AdminLoadBackup(context){
 if(!v11AdminCurrent(context))return;const serial=++context.backupSerial;context.backupStatus='loading';context.backupError='';v11AdminPaint(context);
 try{const result=await api('/api/admin/backup-status');if(!v11AdminCurrent(context)||context.backupSerial!==serial||context.active!=='logs')return;if(!['available','missing','unavailable'].includes(result.status))throw Error('备份状态返回异常');context.backup=result;context.backupStatus='ready';}
 catch(error){if(!v11AdminCurrent(context)||context.backupSerial!==serial||context.active!=='logs')return;if(v11AdminHandleError(context,error))return;context.backup=null;context.backupStatus='error';context.backupError=error.message||'备份状态暂不可用';}
 if(v11AdminCurrent(context))v11AdminPaint(context);
}
function v11AdminFormHTML(context){
 const view=v11AdminView(context),draft=view.draft;
 return `<form id="v11-admin-filters" class="v11-admin-filters" novalidate><label><span data-admin-owner-label>${context.active==='logs'?'操作人（当前名）':'负责人'}</span><select id="v11-admin-owner" ${context.active==='pool'?'disabled':''}><option value="">${context.active==='pool'?'公海无现负责人':'全部人员'}</option></select></label><label><span>开始日期</span><input type="date" id="v11-admin-from" value="${esc(draft.from)}"></label><label><span>结束日期</span><input type="date" id="v11-admin-to" value="${esc(draft.to)}"></label><label><span>${context.active==='logs'?'结果':'主状态'}</span><select id="v11-admin-status"><option value="">全部${context.active==='logs'?'结果':'状态'}</option></select></label><label class="v11-admin-keyword"><span>关键词</span><input type="search" id="v11-admin-query" maxlength="100" autocomplete="off" placeholder="搜索可见字段" value="${esc(draft.q)}"></label><div class="v11-admin-filter-actions"><button type="submit" class="btn primary" id="v11-admin-search">查询</button><button type="button" class="btn" id="v11-admin-clear">清空</button></div><p class="v11-admin-filter-note" data-admin-date-note></p><div class="v11-admin-form-error" data-admin-form-error role="alert"></div></form>`;
}
function v11AdminReadForm(context){
 const form=document.querySelector('#v11-admin-filters');if(!form)return v11AdminView(context).draft;
 const read=id=>form.querySelector('#v11-admin-'+id)?.value||'';
 return {owner:context.active==='pool'?'':read('owner'),from:read('from'),to:read('to'),status:read('status'),q:read('query').trim()};
}
function v11AdminBindForm(context){
 const form=document.querySelector('#v11-admin-filters');if(!form)return;let composing=false;
 form.addEventListener('compositionstart',()=>{composing=true});form.addEventListener('compositionend',()=>{composing=false});
 form.addEventListener('input',()=>{if(v11AdminCurrent(context))v11AdminView(context).draft=v11AdminReadForm(context)});
 form.addEventListener('change',()=>{if(v11AdminCurrent(context))v11AdminView(context).draft=v11AdminReadForm(context)});
 form.onsubmit=event=>{event.preventDefault();if(!v11AdminCurrent(context)||composing||event.isComposing)return;const view=v11AdminView(context),filters=v11AdminReadForm(context);view.draft=filters;view.formError='';if(filters.from&&filters.to&&filters.from>filters.to){view.formError='结束日期不能早于开始日期';v11AdminPaint(context);form.querySelector('#v11-admin-to').focus();return}if(filters.q.length>100){view.formError='关键词最多100字';v11AdminPaint(context);form.querySelector('#v11-admin-query').focus();return}view.filters={...filters};view.page=1;return v11AdminLoadRecords(context)};
 form.querySelector('#v11-admin-clear').onclick=()=>{if(!v11AdminCurrent(context))return;const view=v11AdminView(context);view.filters=v11AdminFilters();view.draft=v11AdminFilters();view.page=1;view.formError='';v11AdminMountForm(context);return v11AdminLoadRecords(context)};
}
function v11AdminMountForm(context){
 const region=document.querySelector('[data-admin-filter-region]');if(!region)return;region.innerHTML=v11AdminFormHTML(context);region.dataset.kind=context.active;v11AdminBindForm(context);
}
function v11AdminSyncSelect(select,items,value,placeholder){
 if(!select)return;const signature=JSON.stringify([placeholder,items]);if(select.v11Signature!==signature){select.innerHTML=`<option value="">${esc(placeholder)}</option>`+items.map(item=>`<option value="${esc(item.value)}">${esc(item.label)}</option>`).join('');select.v11Signature=signature;}select.value=value;
}
function v11AdminSelect(kind,button){
 const context=v11AdminState();if(!v11AdminCurrent(context)||!v11AdminKinds.some(item=>item[0]===kind))return;
 v11AdminView(context).draft=v11AdminReadForm(context);v11AdminView(context).serial++;v11AdminCloseDetail(false);context.active=kind;
 const view=v11AdminView(context);if(view.status==='loading')view.status='idle';
 v11AdminMountForm(context);v11AdminPaint(context);button?.focus({preventScroll:true});
 if(view.status==='idle')v11AdminLoadRecords(context);
 if(kind==='logs'&&context.backupStatus!=='ready')v11AdminLoadBackup(context);
}
function v11AdminCell(value,extra=''){const text=v11AdminText(value);return `<span class="v11-admin-cell ${extra}" title="${esc(text)}">${esc(text)}</span>`}
function v11AdminOwner(owner){return owner?.name||owner?.username||''}
function v11AdminLogActionHTML(action,actionLabel){
 const code=typeof action==='string'&&/^[a-z][a-z0-9_]{0,79}$/.test(action)?action:'';
 const shared=typeof logLabels!=='undefined'&&Object.hasOwn(logLabels,code)?logLabels[code]:'';
 const labels={cooperation_saved:'保存合作档案',first_password_changed:'首次登录改密'};
 const label=typeof actionLabel==='string'&&actionLabel.trim()?actionLabel:shared||(Object.hasOwn(labels,code)?labels[code]:'其他操作');
 return v11AdminCell(label)+(label==='其他操作'&&code?`<small>${v11AdminCell('操作标识：'+code)}</small>`:'');
}
function v11AdminRecordsHTML(context,data){
 const kind=context.active,amount=kind==='fees',platform=['kols','pool','promotions'].includes(kind),owner=kind!=='pool';
 const title=({kols:'KOL 名称',pool:'KOL 名称',cooperations:'合作',contracts:'合约',fees:'稿费申请',promotions:'推广',gifts:'赠送申请'})[kind];
 return `<div class="v11-admin-tablewrap" role="region" aria-label="${esc(v11AdminKindInfo(context).label)}列表，可左右滚动" tabindex="0"><table class="v11-admin-table"><thead><tr><th scope="col" class="v11-admin-titlecol">${title}</th>${owner?'<th scope="col">负责人</th>':''}${platform?'<th scope="col">平台</th>':''}<th scope="col">${kind==='cooperations'?'稿费情况':'主状态'}</th>${amount?'<th scope="col">金额</th>':''}<th scope="col">${esc(data.dateLabel||v11AdminDateLabel(context))}</th><th scope="col" class="v11-admin-actioncol"><span class="sr-only">只读详情</span></th></tr></thead><tbody>${data.items.map(item=>`<tr><td>${v11AdminCell(item.title,'v11-admin-record-title')}${item.kolName&&item.kolName!==item.title?`<small>${v11AdminCell(item.kolName)}</small>`:''}</td>${owner?`<td>${v11AdminCell(v11AdminOwner(item.owner))}</td>`:''}${platform?`<td>${v11AdminCell(item.platform)}</td>`:''}<td>${v11AdminCell(item.statusLabel)}</td>${amount?`<td>${v11AdminCell(item.amount?`${item.currency?item.currency+' ':''}${item.amount}`:'')}</td>`:''}<td>${v11AdminCell(item.date)}</td><td><button type="button" class="textbtn" data-admin-detail-key="${esc(item.key)}" aria-label="查看${esc(v11AdminText(item.title))}只读详情">详情 ${I('arrow')}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function v11AdminLogsHTML(data){
 return `<div class="v11-admin-tablewrap" role="region" aria-label="全员操作日志，可左右滚动" tabindex="0"><table class="v11-admin-table v11-admin-logtable"><thead><tr><th scope="col">操作时间 · 北京时间</th><th scope="col">操作人（当前名）</th><th scope="col">动作</th><th scope="col">结果</th><th scope="col">对象标识</th><th scope="col" class="v11-admin-logsummary">操作摘要</th></tr></thead><tbody>${data.items.map(item=>`<tr><td>${v11AdminCell(v11AdminDate(item.time))}</td><td>${v11AdminCell(v11AdminOwner(item.actor))}${item.actor?.id?`<small>账号 ID ${esc(item.actor.id)}</small>`:''}</td><td>${v11AdminLogActionHTML(item.action,item.actionLabel)}</td><td>${v11AdminCell(item.resultLabel)}</td><td>${Array.isArray(item.objectIds)&&item.objectIds.length?item.objectIds.map(object=>v11AdminCell(`${v11AdminText(object.label)}：${v11AdminText(object.value)}`)).join(''):'未记录'}</td><td>${v11AdminCell(item.summary)}</td></tr>`).join('')}</tbody></table></div>`;
}
function v11AdminResultsHTML(context,view){
 if(view.status==='idle'||view.status==='loading')return '<div class="v11-admin-message" data-admin-loading role="status">正在读取记录…</div>';
 if(view.status==='error')return `<div class="v11-admin-message v11-admin-error" data-admin-error role="alert"><strong>读取失败</strong><p>${esc(view.error)}</p><button type="button" class="btn" id="v11-admin-list-retry">重试</button></div>`;
 const data=view.data;if(!data)return '<div class="v11-admin-message" data-admin-error role="alert">尚未确认列表结果，请重新查询。</div>';
 const pages=Math.max(1,Math.ceil(data.total/data.pageSize));
 return `${data.items.length?(context.active==='logs'?v11AdminLogsHTML(data):v11AdminRecordsHTML(context,data)):'<div class="v11-admin-message" data-admin-empty role="status">暂无符合条件的记录</div>'}<div class="v11-admin-pagination"><span>共 ${data.total} 条 · 第 ${data.page} / ${pages} 页</span><div><button type="button" class="btn" data-admin-page="prev" ${data.page<=1?'disabled':''}>上一页</button><button type="button" class="btn" data-admin-page="next" ${data.page>=pages?'disabled':''}>下一页</button></div></div>`;
}
function v11AdminBackupHTML(context){
 if(context.active!=='logs')return '';
 if(context.backupStatus==='idle'||context.backupStatus==='loading')return '<span role="status">正在读取备份状态…</span>';
 const backup=context.backup;
 if(context.backupStatus==='error'||!backup||backup.status==='unavailable')return `<span>${esc(context.backupError||'备份状态暂不可用')}</span><button type="button" class="textbtn" id="v11-admin-backup-retry">重试</button>`;
 if(backup.status==='missing')return '<span>未找到备份</span><small>仅查看状态</small>';
 const count=Number.isInteger(backup.count)&&backup.count>=0?String(backup.count):'未记录',size=Number.isFinite(backup.sizeBytes)&&backup.sizeBytes>=0?`${(backup.sizeBytes/1024).toFixed(1)} KB`:'未记录';
 return `<span>发现备份</span><small>最近文件保存：${esc(v11AdminDate(backup.createdAt||backup.latestDate))} · ${count} 份 · 最近文件 ${esc(size)}</small><small>文件存在不代表已验证恢复成功</small>`;
}
function v11AdminPaint(context){
 if(!v11AdminCurrent(context))return;const root=document.querySelector('.v11-admin');if(!root||root.v11Context!==context)return;
 const view=v11AdminView(context),draft=view.draft;
 root.querySelector('#v11-admin-record-panel').setAttribute('aria-labelledby','v11-admin-tab-'+context.active);
 root.querySelectorAll('[data-admin-tab]').forEach(button=>{const selected=button.dataset.adminTab===context.active;button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 if(root.querySelector('[data-admin-filter-region]').dataset.kind!==context.active)v11AdminMountForm(context);
 const owner=root.querySelector('#v11-admin-owner');owner.disabled=context.active==='pool'||context.optionsStatus!=='ready';
 v11AdminSyncSelect(owner,(context.options?.owners||[]).map(item=>({value:String(item.id),label:item.name||item.username||`账号 ${item.id}`})),draft.owner,context.active==='pool'?'公海无现负责人':'全部人员');
 const status=root.querySelector('#v11-admin-status');status.disabled=context.optionsStatus!=='ready';v11AdminSyncSelect(status,v11AdminStatuses(context),draft.status,context.active==='logs'?'全部结果':'全部状态');
 root.querySelector('[data-admin-date-note]').textContent=`日期口径：${v11AdminDateLabel(context)}（北京时间）；未知日期默认可见。${context.active==='cooperations'?'主状态仅表示稿费情况。':context.active==='promotions'?'发布登记不代表已核验兑现。':''}`;
 root.querySelector('[data-admin-form-error]').textContent=view.formError;
 const optionError=root.querySelector('[data-admin-options-error]');optionError.innerHTML=context.optionsStatus==='error'?`<span>${esc(context.optionsError)}</span><button type="button" class="textbtn" id="v11-admin-options-retry">重试筛选选项</button>`:'';optionError.hidden=context.optionsStatus!=='error';
 root.querySelector('#v11-admin-options-retry')?.addEventListener('click',()=>v11AdminLoadOptions(context));
 const results=root.querySelector('#v11-admin-results'),signature=[context.active,view.status,view.error,view.data];
 // Options and backup reads must not detach the list while a detail drawer is
 // using its focus target and horizontal scroll position for the return trip.
 if(!results.v11Signature||signature.some((value,index)=>results.v11Signature[index]!==value)){
  results.innerHTML=v11AdminResultsHTML(context,view);results.v11Signature=signature;results.setAttribute('aria-busy',String(view.status==='loading'));
  results.querySelector('#v11-admin-list-retry')?.addEventListener('click',()=>v11AdminLoadRecords(context));
  results.querySelectorAll('[data-admin-page]').forEach(button=>button.onclick=()=>{if(!v11AdminCurrent(context)||button.disabled)return;view.page+=button.dataset.adminPage==='next'?1:-1;v11AdminLoadRecords(context)});
  results.querySelectorAll('[data-admin-detail-key]').forEach(button=>button.onclick=()=>v11AdminOpenDetail(context,button.dataset.adminDetailKey,button));
 }
 const backup=root.querySelector('[data-admin-backup]');backup.hidden=context.active!=='logs';backup.innerHTML=v11AdminBackupHTML(context);backup.querySelector('#v11-admin-backup-retry')?.addEventListener('click',()=>v11AdminLoadBackup(context));
}
function v11AdminDecodeURLPart(value,plus=false){
 try{for(let round=0;round<16;round++){const next=decodeURIComponent(plus?value.replace(/\+/g,' '):value);if(next===value)return value;value=next;}return null}catch{return null}
}
function v11AdminPublicIPv4(host){
 const parts=host.split('.').map(Number),[a,b,c]=parts;
 if(parts.length!==4||parts.some(part=>!Number.isInteger(part)||part<0||part>255))return false;
 return !(a===0||a===10||a===127||a>=224||a===100&&b>=64&&b<=127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0&&(c===0||c===2))||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);
}
function v11AdminPublicHost(host){
 host=host.toLowerCase().replace(/\.$/,'');
 if(!host||host==='localhost'||host.endsWith('.localhost')||host==='local'||host.endsWith('.local'))return false;
 // URL already canonicalizes integer, hexadecimal, octal and short IPv4 forms.
 if(/^\d+(?:\.\d+){3}$/.test(host))return v11AdminPublicIPv4(host);
 if(!host.includes(':'))return true;
 const raw=host.replace(/^\[|\]$/g,''),halves=raw.split('::');if(halves.length>2)return false;
 const left=halves[0]?halves[0].split(':'):[],right=halves[1]?halves[1].split(':'):[];
 const words=[...left,...Array(Math.max(0,8-left.length-right.length)).fill('0'),...right].map(word=>parseInt(word,16));
 if(words.length!==8||words.some(word=>!Number.isInteger(word)||word<0||word>65535))return false;
 const mapped=words.slice(0,5).every(word=>word===0)&&words[5]===65535;
 const nat64=words[0]===0x64&&words[1]===0xff9b&&words.slice(2,6).every(word=>word===0);
 if(mapped||nat64)return v11AdminPublicIPv4([words[6]>>8,words[6]&255,words[7]>>8,words[7]&255].join('.'));
 return (words[0]&0xe000)===0x2000&&!(words[0]===0x2001&&(words[1]<0x200||words[1]===0xdb8))&&words[0]!==0x2002&&!(words[0]===0x3fff&&(words[1]&0xf000)===0);
}
function v11AdminSensitiveURLPart(value){
 const decoded=v11AdminDecodeURLPart(value,true);if(decoded===null)return true;
 return decoded.split(/[?&#;/]/).some(part=>{const key=part.split('=',1)[0];return /password|secret|token|credential|session|signature|auth|api.?key|access.?key|reset.?code|(?:^|[_-])(?:key|code|sig|ticket)(?:$|[_-])/i.test(key)});
}
function v11AdminSafeURL(value){
 if(typeof value!=='string'||!/^https?:\/\//i.test(value))return '';
 const decoded=v11AdminDecodeURLPart(value);if(decoded===null||/[\s\\\p{Cc}\p{Cf}]/u.test(decoded))return '';
 try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password||url.port&&!['80','443'].includes(url.port)||!v11AdminPublicHost(url.hostname)||v11AdminSensitiveURLPart(url.search.slice(1))||v11AdminSensitiveURLPart(url.hash.slice(1)))return '';return value}catch{return ''}
}
function v11AdminFieldsHTML(fields){
 return `<dl class="v11-admin-fields">${fields.map(field=>{const value=v11AdminText(field.value),url=field.format==='url'?v11AdminSafeURL(field.value):'';return `<div><dt>${esc(v11AdminText(field.label))}</dt><dd>${url?`<a class="v11-admin-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(url)}"><span>${esc(url)}</span>${I('external')}</a>`:esc(value)}${field.format==='url'&&field.value&&!url?'<small class="v11-admin-invalid-link">链接不可打开</small>':''}</dd></div>`;}).join('')}</dl>`;
}
function v11AdminDetailCurrent(context,detail){return v11AdminCurrent(context)&&context.detail===detail&&detail.panel.isConnected&&detail.panel.v11Detail===detail}
function v11AdminCloseDetail(restore=true){
 const context=v11AdminContext,detail=context?.detail,backdrop=document.querySelector('.v11-admin-backdrop');if(context)context.detail=null;
 if(backdrop){document.body.style.overflow=backdrop.v11PreviousOverflow||'';backdrop.remove();}
 if(restore&&detail&&v11AdminCurrent(context)){detail.scroll.forEach(([node,top,left])=>{if(node.isConnected){node.scrollTop=top;node.scrollLeft=left}});if(detail.focus?.isConnected)detail.focus.focus({preventScroll:true});}
}
async function v11AdminReadDetail(context,detail){
 if(!v11AdminDetailCurrent(context,detail))return;const serial=++detail.serial;detail.status='loading';detail.error='';detail.data=null;v11AdminPaintDetail(context,detail);
 try{
  const result=await api('/api/admin/detail?kind='+encodeURIComponent(detail.kind)+'&key='+encodeURIComponent(detail.key));if(!v11AdminDetailCurrent(context,detail)||detail.serial!==serial)return;
  if(result.kind!==detail.kind||result.key!==detail.key||!Array.isArray(result.fields)||!Array.isArray(result.sections)||result.sections.some(section=>!Array.isArray(section.fields)))throw Error('详情返回异常，请重试');detail.status='ready';detail.data=result;
 }catch(error){if(!v11AdminDetailCurrent(context,detail)||detail.serial!==serial)return;if(v11AdminHandleError(context,error))return;detail.status='error';detail.error=error.message||'详情读取失败';}
 if(v11AdminDetailCurrent(context,detail))v11AdminPaintDetail(context,detail);
}
function v11AdminPaintDetail(context,detail){
 if(!v11AdminDetailCurrent(context,detail))return;const body=detail.panel.querySelector('[data-admin-detail-body]');
 detail.panel.querySelector('#v11-admin-detail-title').textContent=detail.data?.title||'记录详情';
 body.innerHTML=detail.status==='loading'?'<p class="v11-admin-message" data-admin-loading role="status">正在读取详情…</p>':detail.status==='error'?`<div class="v11-admin-message v11-admin-error" data-admin-error role="alert"><strong>详情读取失败</strong><p>${esc(detail.error)}</p><button type="button" class="btn" id="v11-admin-detail-retry">重试</button></div>`:`<section class="v11-admin-detail-section">${v11AdminFieldsHTML(detail.data.fields)}</section>${detail.data.sections.map(section=>`<section class="v11-admin-detail-section"><h3>${esc(v11AdminText(section.title))}</h3>${v11AdminFieldsHTML(section.fields)}</section>`).join('')}`;
 body.querySelector('#v11-admin-detail-retry')?.addEventListener('click',()=>v11AdminReadDetail(context,detail));
}
function v11AdminOpenDetail(context,key,focus){
 if(!v11AdminCurrent(context)||context.active==='logs'||!v11AdminView(context).data?.items.some(item=>item.key===key))return;
 v11AdminCloseDetail(false);const overlay=document.querySelector('#overlay');if(!overlay)return;
 const scroll=[...document.querySelectorAll('.v11-admin-tablewrap'),document.querySelector('#content'),document.scrollingElement||document.documentElement].filter(Boolean).map(node=>[node,node.scrollTop,node.scrollLeft]);
 overlay.innerHTML=`<div class="v11-admin-backdrop"><aside class="v11-admin-detail" role="dialog" aria-modal="true" aria-labelledby="v11-admin-detail-title"><header><div><span>管理后台 · 只读</span><h2 id="v11-admin-detail-title">记录详情</h2></div><button type="button" class="btn" id="v11-admin-detail-close">返回列表</button></header><div class="v11-admin-detail-body" data-admin-detail-body></div></aside></div>`;
 const backdrop=overlay.firstElementChild;backdrop.v11PreviousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const detail={key,kind:context.active,focus,scroll,serial:0,status:'idle',data:null,error:'',panel:backdrop.querySelector('.v11-admin-detail')};context.detail=detail;detail.panel.v11Detail=detail;
 backdrop.onclick=event=>{if(event.target===backdrop)v11AdminCloseDetail()};detail.panel.querySelector('#v11-admin-detail-close').onclick=()=>v11AdminCloseDetail();detail.panel.querySelector('#v11-admin-detail-close').focus({preventScroll:true});v11AdminReadDetail(context,detail);
}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.v11-admin-backdrop')&&!document.querySelector('.v11-tracking-backdrop')){event.preventDefault();event.stopImmediatePropagation();v11AdminCloseDetail();}},true);
function v11AdminMount(){
 if(typeof currentUser!=='undefined'&&currentUser?.passwordChangeRequired===true){v11AdminReset();if(typeof firstPasswordScreen==='function')firstPasswordScreen();return}
 if(!v11AdminAllowed()){v11AdminReset();renderWorkspaceContent(v11AdminDenied());return}
 const context=v11AdminState();if(context.revoked){renderWorkspaceContent(v11AdminDenied());return}
 let root=document.querySelector('.v11-admin');
 if(!root||root.v11Context!==context){
  renderWorkspaceContent(`<section class="v11-admin" aria-label="管理后台"><div class="v11-admin-scope"><span>${I('shield')} 全员业务 · 只读查看</span><small>审批、修改与发放仍按原授权处理</small></div><div class="v11-admin-tabs" role="tablist" aria-label="管理后台记录类型">${v11AdminKinds.map(([kind,label])=>`<button type="button" class="v11-admin-tab" role="tab" data-admin-tab="${kind}" id="v11-admin-tab-${kind}" aria-controls="v11-admin-record-panel">${label}</button>`).join('')}</div><section class="panel v11-admin-panel" id="v11-admin-record-panel" role="tabpanel"><div data-admin-filter-region></div><div class="v11-admin-options-error" data-admin-options-error role="alert" hidden></div><div id="v11-admin-results"></div></section><div class="v11-admin-backup" data-admin-backup hidden></div></section>`);
  root=document.querySelector('.v11-admin');root.v11Context=context;
  root.querySelectorAll('[data-admin-tab]').forEach(button=>{button.onclick=()=>v11AdminSelect(button.dataset.adminTab,button);button.onkeydown=event=>{const kinds=v11AdminKinds.map(item=>item[0]),index=kinds.indexOf(button.dataset.adminTab);let next;if(event.key==='ArrowRight')next=kinds[(index+1)%kinds.length];else if(event.key==='ArrowLeft')next=kinds[(index+kinds.length-1)%kinds.length];else if(event.key==='Home')next=kinds[0];else if(event.key==='End')next=kinds.at(-1);else return;event.preventDefault();const target=root.querySelector(`[data-admin-tab="${next}"]`);v11AdminSelect(next,target);};});
  v11AdminMountForm(context);
 }
 root.querySelector('#v11-admin-record-panel').setAttribute('aria-labelledby','v11-admin-tab-'+context.active);v11AdminPaint(context);
 if(context.optionsStatus==='idle')v11AdminLoadOptions(context);
 if(v11AdminView(context).status==='idle')v11AdminLoadRecords(context);
 if(context.active==='logs'&&context.backupStatus==='idle')v11AdminLoadBackup(context);
}
const v11AdminPreviousRenderContent=renderContent;
renderContent=function(){if(page==='admin')return v11AdminMount();if(v11AdminContext)v11AdminReset();return v11AdminPreviousRenderContent();};
