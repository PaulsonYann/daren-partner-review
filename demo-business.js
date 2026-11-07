/* GitHub Pages demonstration: synthetic, browser-local business records only. */
(function (root) {
'use strict';
const P = root.PublicDemo;
if (!P) throw new Error('The public demo bootstrap must load first.');
const clone = value => structuredClone(value);
const day = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai'}).format(new Date());
const plus = (value, amount) => new Date(Date.parse(value+'T12:00:00Z')+amount*86400000).toISOString().slice(0,10);
const stamp = value => value+'T04:00:00.000Z';
const id = prefix => prefix+'-'+(root.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const actor = user => ({id:user.id, username:user.username, name:user.display || user.username});
const available = (row, user) => String(row.owner) === String(user.id);
const ownKol = (d, user, value) => d.kols.find(row => Number(row.id)===Number(value) && available(row,user));
const readKol = (d, user, value) => d.kols.find(row => Number(row.id)===Number(value) && (user.role==='admin'||available(row,user)));
const scope = (rows, user) => rows.filter(row => user.role==='admin' || available(row,user));
const need = (condition, message, error, status=400) => { if (!condition) throw error(message,status); };
const monetary = raw => raw === '' || raw == null ? '' : Number(raw).toFixed(2);
const listQuery = (rows, params) => {
 const page=Math.max(1,Number(params.get('page'))||1),pageSize=Math.min(100,Math.max(1,Number(params.get('pageSize'))||50));
 return {items:rows.slice((page-1)*pageSize,page*pageSize),total:rows.length,page,pageSize};
};
const denied = error => { throw error('公开演示不办理真实审批、付款、核验或发放。请在正式系统中处理；本次未执行。',403); };
function poolSummary(row) {
 return Object.fromEntries(['id','name','platforms','products','accounts','type','fans','market','lang','desc','createdAt','provenance'].filter(key=>key in row).map(key=>[key,clone(row[key])]));
}
function publicRecord(index, owner, today) {
 const names=['海岛数码实验室','晴天生活手记','漫游工具箱','北岸游戏频道','松果学习站','远山影像社','城市效率笔记','星光旅行册'];
 const types=['科技数码','生活日常','AI工具','游戏电竞','教育','旅行','AI工具','旅行'];
 const platform=index%3===1?'Instagram':'YouTube',suffix=String(index+1).padStart(2,'0');
 const rows=[{platform,url:platform==='YouTube'?'https://www.youtube.com/@fictional_demo_'+suffix:'https://www.instagram.com/fictional_demo_'+suffix+'/',fans:String([1280000,420000,85000,218000,56000,169000,97500,312000][index]||32000)}];
 if(index%3===0)rows.push({platform:'Instagram',url:'https://www.instagram.com/fictional_demo_'+suffix+'/',fans:'69000'});
 return {
  id:index+1,owner,name:'虚构·'+names[index],platforms:rows.map(row=>row.platform),products:index%2?['Canva Pro']:['ChatGPT','Spotify'],accounts:rows,
  type:types[index],market:['台湾','香港','日本','美国'][index%4],lang:index%4<2?'繁体中文':index%4===2?'日语':'英语',grade:['S','A','B','C'][index%4],stage:index%6,
  fans:rows[0].fans,attribute:'自主开发',privateDomain:index%2?'否':'是',competitors:index%2?'':'GoingBus',blocker:index%3===0?'稿费高':'',
  next:plus(today,index%3-1),time:'',nextAction:'确认本次演示合作方向',note:'【虚构演示】已经沟通合作意向，等待反馈。',
  quote:String([120,180,80,150][index%4]),currency:'USD',fixedFee:'100',firstCommission:'20',repeatCommission:'10',
  emails:[{address:'creator'+suffix+'@example.invalid',purpose:'网站注册'},{address:'affiliate'+suffix+'@example.invalid',purpose:'联盟营销'}],
  whatsapp:'+1 202-555-01'+suffix,line:'demo_line_'+suffix,wechat:'demo_wechat_'+suffix,phone:'+1 202-555-01'+suffix,
  overview:'【纯虚构演示】用于展示达人资料、跟进与合作流程；不是任何真实人士或业务。',desc:'纯虚构的公开演示资料。',
  logs:[{date:plus(today,-7),text:'【虚构演示】了解内容方向与受众画像。'},{date:plus(today,-2),text:'【虚构演示】沟通产品体验与发布意向。'}],
  contracts:[],promotions:[],createdAt:stamp(plus(today,-50)),
  bdHistory:[{name:'示例商务乙（虚构）',from:plus(today,-60),to:plus(today,-51),summary:'【虚构演示】前期资源登记，随后交由示例商务甲跟进。'}],
  provenance:{type:'manual',name:'公开虚构演示',at:stamp(plus(today,-50)),channel:'合成种子'}
 };
}
P.businessSeed = function () {
 const today=day(),now=new Date().toISOString(),kols=Array.from({length:6},(_,i)=>publicRecord(i,i===5?'103':'102',today));
 const pool=Array.from({length:2},(_,i)=>publicRecord(i+6,null,today));
 const contract={id:'demo-contract-1',title:'【演示】数码体验合作合约',url:'https://example.invalid/demo/contracts/one',date:plus(today,-45),status:'已签约'};
 const publication={id:'demo-publication-1',title:'【演示】效率工具体验分享',url:'https://example.invalid/demo/content/one',date:plus(today,-40),time:'',platform:'YouTube',feeId:'demo-fee-1',deliveryId:'demo-delivery-1',views:'12600',likes:'340',comments:'28',shares:'51',clicks:'420',orders:'8',revenue:'120',revenueCurrency:'USD',createdAt:stamp(plus(today,-40)),remarks:'纯虚构演示链接，不对应真实内容。'};
 kols[0].contracts.push(contract);kols[0].promotions.push(publication);
 kols[1].contracts.push({id:'demo-contract-2',title:'【演示】生活内容合作意向',url:'',date:plus(today,-3),status:'待签约'});
 const fee={id:'demo-fee-1',number:'DEMO-GF-001',owner:102,kolId:1,kolName:kols[0].name,version:1,status:'approved',title:'【虚构样例】效率工具推广',reason:'【虚构样例】内容匹配；已有工具体验案例；预计触达科技受众，配合资料核对。',amount:'120.00',currency:'USD',approvedAmount:'120.00',payments:[],events:[],createdAt:stamp(plus(today,-46)),updatedAt:stamp(plus(today,-40)),deliveries:[{id:'demo-delivery-1',description:'【演示】YouTube 体验分享一条',date:plus(today,-40),time:'',platform:'YouTube',publicationIds:[publication.id]}]};
 const second={...clone(fee),id:'demo-fee-2',number:'DEMO-GF-002',kolId:2,kolName:kols[1].name,title:'【虚构草稿】生活工具体验',status:'draft',amount:'180.00',approvedAmount:'',createdAt:now,updatedAt:now,deliveries:[{id:'demo-delivery-2',description:'【演示】Instagram 体验内容',date:plus(today,10),time:'',platform:'Instagram',publicationIds:[]}]};
 const cooperation={id:'demo-cooperation-1',number:'DEMO-HZ-001',owner:102,kolId:1,kolName:kols[0].name,title:'【演示】效率工具体验合作',feeMode:'fee',contractIds:[contract.id],feeId:fee.id,publicationIds:[],version:1,createdAt:fee.createdAt,updatedAt:fee.updatedAt,createdBy:{id:102,name:'示例商务甲'},updatedBy:{id:102,name:'示例商务甲'},events:[]};
 const track={key:'demo-tracking-1',kolId:1,publicationId:publication.id,kolName:kols[0].name,title:publication.title,url:publication.url,platform:publication.platform,actualPublishedDate:publication.date,feeId:fee.id,deliveryId:'demo-delivery-1',cooperationId:cooperation.id,owner:{id:102,name:'示例商务甲'},sourceStatus:'active',sourceMessage:'',planVersion:1,canWrite:true,sourceHistory:[],nodes:[15,30,60,90].map(n=>({key:'tracking:demo-tracking-1:'+n,day:n,dueDate:plus(publication.date,n),version:1,status:n<=40?'overdue':'upcoming',canWrite:n<=40,latest:null,history:[]}))};
 return {
  kols,pool,fees:[fee,second],cooperations:[cooperation],tracking:[track],gifts:[],businessRevision:1,
  tasksByUser:{'102':[{id:'demo-task-1',title:'【演示】确认合作方案与分佣比例',due:today,time:'',kolId:1,quadrant:'urgent-important',done:false,evidence:[]},{id:'demo-task-2',title:'【演示】整理下周内容参考',due:plus(today,3),time:'',kolId:2,quadrant:'important',done:false,evidence:[]}],'103':[{id:'demo-task-peer',title:'【演示】准备资源交接说明',due:today,time:'',kolId:6,quadrant:'important',done:false,evidence:[]}]},
  businessOptions:{type:['科技数码','AI工具','生活日常','旅行','游戏电竞','教育'],market:['台湾','香港','日本','美国','英国','新加坡','德国'],lang:['繁体中文','英语','日语','韩语','德语','法语'],attribute:['自主开发','资源引荐','主动联系'],competitors:['GoingBus','Flixseek','其他'],blocker:['稿费高','无档期','竞对独家','分佣高','其他']},
  businessOptionsVersion:0,disabledOptions:{type:[],competitors:[],blocker:[]},businessLogs:[],businessReceipts:{}
 };
};
function feeView(row,d,user,today) {
 const kol=d.kols.find(k=>Number(k.id)===Number(row.kolId)),publications=kol?.promotions||[];
 const deliveries=(row.deliveries||[]).map(delivery=>{
  const pubs=publications.filter(pub=>pub.feeId===row.id&&pub.deliveryId===delivery.id || (delivery.publicationIds||[]).includes(pub.id));
  return {...clone(delivery),publicationIds:pubs.map(pub=>pub.id),publications:clone(pubs),published:pubs.length>0,effectiveDate:delivery.date,effectiveTime:delivery.time||'',overdue:!pubs.length&&!!delivery.date&&delivery.date<today,latePublished:pubs.some(pub=>pub.date>delivery.date)};
 });
 const paid=(row.payments||[]).reduce((sum,payment)=>sum+Number(payment.amount||0),0),approved=Number(row.approvedAmount||0),published=deliveries.filter(value=>value.published).length;
 return {...clone(row),payments:clone(row.payments||[]),events:clone(row.events||[]),deliveries,needsReview:false,paid:paid.toFixed(2),remaining:Math.max(0,approved-paid).toFixed(2),paymentStatus:paid?'部分付款':'未付款',publicationStatus:published===deliveries.length&&deliveries.length?'已发布':published?'部分发布':'待发布',overdue:deliveries.some(value=>value.overdue),reviewStatus:'演示 · 未核验',availablePublications:available(row,user)?clone(publications):[],kolAvailable:!!kol,supervisorConfigured:false,canApprove:false,canReview:false,isOwner:available(row,user)};
}
function cooperationView(row,d) {
 const kol=d.kols.find(k=>Number(k.id)===Number(row.kolId)),fee=d.fees.find(f=>f.id===row.feeId);
 return {...clone(row),contracts:clone((kol?.contracts||[]).filter(c=>(row.contractIds||[]).includes(c.id))),fee:fee?clone(fee):null,publications:clone((kol?.promotions||[]).filter(p=>row.feeMode==='fee'?p.feeId===row.feeId:(row.publicationIds||[]).includes(p.id)))};
}
function workspace(d,user,today) {
 const training=(d.learning?.courses||[]).filter(row=>row.module==='training'&&row.published!==false).map(row=>({id:row.id,title:row.title,category:row.group,summary:'公开虚构课程，用于演示学习界面。',url:'',updatedAt:row.publishedAt||''}));
 return {revision:d.businessRevision||0,kols:clone(d.kols.filter(k=>available(k,user))),pool:d.pool.map(poolSummary),tasks:clone(d.tasksByUser?.[String(user.id)]||[]),training,feeApplications:scope(d.fees,user).map(f=>feeView(f,d,user,today)),options:clone(d.businessOptions),optionsVersion:d.businessOptionsVersion||0,disabledOptions:clone(d.disabledOptions||{type:[],competitors:[],blocker:[]}),marketPinyin:{台湾:'taiwan tw',香港:'xianggang xg',日本:'riben rb',美国:'meiguo mg',英国:'yingguo yg',新加坡:'xinjiapo xjp',德国:'deguo dg'}};
}
function appendLog(ctx,action,details) {
 ctx.d.businessLogs ||= [];
 ctx.d.businessLogs.unshift({id:id('demo-log'),time:ctx.now,actor:actor(ctx.user),action,details:clone(details),source:'公开演示 · 本浏览器'});
}
async function persist(ctx,before) {
 try { await ctx.save(); } catch(error) { for(const key of Object.keys(ctx.d))delete ctx.d[key];Object.assign(ctx.d,before);throw error; }
}
function canonicalURL(value) { try { const u=new URL(value);return u.hostname.toLowerCase()+u.pathname.replace(/\/+$/,'').toLowerCase(); } catch { return String(value||'').trim().toLowerCase(); } }
function duplicate(record,rows,exclude) {
 const accounts=(record.accounts||[]).map(row=>canonicalURL(row.url)).filter(Boolean);
 return rows.some(row=>String(row.id)!==String(exclude??'')&&(row.accounts||[]).some(account=>accounts.includes(canonicalURL(account.url))));
}
function receipt(ctx,area) {
 if(!ctx.body?.requestId)return null;
 return ctx.d.businessReceipts?.[area+':'+ctx.user.id+':'+ctx.body.requestId]||null;
}
function setReceipt(ctx,area,value) {
 if(!ctx.body?.requestId)return;
 ctx.d.businessReceipts ||= {};
 ctx.d.businessReceipts[area+':'+ctx.user.id+':'+ctx.body.requestId]=clone(value);
}
function trackingView(track,user,today,all=false) {
 const row=clone(track);row.canWrite=!all&&Number(track.owner?.id)===Number(user.id);
 for(const node of row.nodes){node.canWrite=row.canWrite&&node.dueDate<=today;node.status=node.latest?(node.latest.registered.known&&node.latest.orders.known?'completed':'unknown'):node.dueDate<today?'overdue':node.dueDate===today?'due':'upcoming';}
 return row;
}
function refreshTracks(ctx) {
 const {d,user,today}=ctx;d.tracking ||= [];
 for(const kol of d.kols)for(const pub of kol.promotions||[]){
  if(!pub.feeId||!pub.deliveryId||!/^\d{4}-\d{2}-\d{2}$/.test(pub.date||''))continue;
  let existing=d.tracking.find(row=>row.kolId===kol.id&&row.publicationId===pub.id);
  const owner=P.users.find(value=>String(value.id)===String(kol.owner));
  if(!existing){const key=id('demo-tracking');existing={key,kolId:kol.id,publicationId:pub.id,kolName:kol.name,title:pub.title,url:pub.url,platform:pub.platform,actualPublishedDate:pub.date,feeId:pub.feeId,deliveryId:pub.deliveryId,cooperationId:'',owner:{id:Number(kol.owner),name:owner?.display||'演示负责人'},sourceStatus:'active',sourceMessage:'',planVersion:1,canWrite:true,sourceHistory:[],nodes:[15,30,60,90].map(n=>({key:'tracking:'+key+':'+n,day:n,dueDate:plus(pub.date,n),version:1,status:plus(pub.date,n)<=today?'overdue':'upcoming',canWrite:plus(pub.date,n)<=today,latest:null,history:[]}))};d.tracking.push(existing);}
  existing.kolName=kol.name;existing.owner={id:Number(kol.owner),name:owner?.display||'演示负责人'};
 }
}
function detail(row,ctx) {
 const item=cooperationView(row,ctx.d),kol=readKol(ctx.d,ctx.user,row.kolId),fee=ctx.d.fees.find(value=>value.id===row.feeId),view=fee?feeView(fee,ctx.d,ctx.user,ctx.today):null;
 return {item,kol:clone(kol||{}),cards:[{key:'contract',label:'合约',value:item.contracts.length?'已关联合约':'未关联合约',detail:'纯虚构记录',tone:'info'},{key:'fee',label:'稿费',value:view?({draft:'草稿',submitted:'演示待审批',approved:'虚构获批样例',returned:'待补充',withdrawn:'已撤回'}[view.status]):'无稿费',detail:'不办理真实审批',tone:'neutral'},{key:'payment',label:'付款',value:'未付款',detail:'公开演示不办理支付',tone:'neutral'},{key:'publication',label:'发布',value:item.publications.length?'已登记样例':'待发布',detail:'链接为虚构示例',tone:'info'},{key:'review',label:'核验',value:'未核验',detail:'公开演示不办理真实核验',tone:'neutral'}],contracts:item.contracts,fee:view,payments:[],payment:{status:'未付款',approvedAmount:view?.approvedAmount||'',paid:'0.00',remaining:view?.remaining||'0.00',currency:'USD'},deliveries:view?.deliveries||[],publications:item.publications,review:null,timeline:[{id:'demo-created-'+row.id,source:'cooperation',actorName:'演示身份',title:'建立虚构合作档案',detail:'仅为公开演示，不代表真实合同、审批或支付。',time:row.createdAt,precision:'instant'}],nextSteps:[{title:'演示边界',detail:'可维护本地合作关联；审批、付款、核验及发放请在正式系统执行。',target:'fee'}],warnings:['公开虚构演示：本页不是可作为业务凭据的真实记录。'],information:{ownerName:P.users.find(u=>Number(u.id)===Number(row.owner))?.display||'演示负责人',createdByName:row.createdBy?.name||'演示身份',createdAt:row.createdAt,updatedAt:row.updatedAt},actions:{}};
}
P.adapters.push(async function business(ctx) {
 const {path,params,body,d,user,error,now,today}=ctx;
 if(path==='/api/state'){
  if(!body)return workspace(d,user,today);
  need(body.revision===d.businessRevision,'演示资料已变化，请重新读取后核对；输入未覆盖。',error,409);
  need(Array.isArray(body.kols)&&Array.isArray(body.tasks),'工作区资料格式不正确。',error);
  const prior=clone(d),myOld=d.kols.filter(row=>available(row,user)),other=d.kols.filter(row=>!available(row,user));
  const ids=new Set(),claims=Array.isArray(body.claimedIds)?body.claimedIds:[],rows=clone(body.kols);
  for(const row of rows){need(Number.isSafeInteger(row.id)&&row.id>0&&!ids.has(row.id),'达人编号无效或重复。',error);ids.add(row.id);need(!other.some(item=>item.id===row.id),'KOL 重复',error,409);need(typeof row.name==='string'&&row.name.trim(),'请填写达人名称。',error);need(Array.isArray(row.accounts)&&Array.isArray(row.emails),'达人账号格式不正确。',error);row.owner=String(user.id);row.currency='USD';}
  for(const cid of claims)need(d.pool.some(row=>row.id===Number(cid)),'该公海样例已被领取，请刷新核对。',error,409);
  for(const row of rows){const isClaim=claims.some(cid=>Number(cid)===row.id);need(!d.pool.some(pool=>pool.id===row.id)||isClaim,'请通过公海领取入口添加资料。',error);need(!duplicate(row,[...other,...rows],row.id),'KOL 重复',error,409);}
  d.kols=[...other,...rows];d.pool=d.pool.filter(row=>!claims.some(cid=>Number(cid)===row.id));d.tasksByUser ||= {};d.tasksByUser[String(user.id)]=clone(body.tasks);d.businessRevision++;
  appendLog(ctx,body.source||'workspace',{summary:'保存本浏览器虚构演示资料',beforeCount:myOld.length,afterCount:rows.length});refreshTracks(ctx);await persist(ctx,prior);return workspace(d,user,today);
 }
 if(path==='/api/check'){
  need(Array.isArray(body?.records),'查重资料格式不正确。',error);
  return {results:body.records.map(row=>({duplicate:duplicate(row,[...d.kols,...d.pool],body.exclude)}))};
 }
 if(path==='/api/export')return {ok:true};
 if(path==='/api/xlsx')throw error('公开演示暂不解析 Excel；可使用 UTF-8 CSV 演示本地导入。');
 if(path==='/api/task-uploads')throw error('公开演示不接收截图或附件，请勿上传真实资料。可体验待办创建、编辑及日期筛选。');
 if(path==='/api/logs'){
  const rows=(d.businessLogs||[]).filter(row=>Number(row.actor?.id)===Number(user.id)),offset=Math.max(0,Number(params.get('offset'))||0);return {rows:clone(rows.slice(offset,offset+50)),total:rows.length};
 }
 if(path==='/api/fee-kols'){
  const q=(params.get('q')||'').toLowerCase(),rows=d.kols.filter(row=>available(row,user)&&[row.name,...(row.emails||[]).map(e=>e.address)].join(' ').toLowerCase().includes(q));
  return {items:rows.slice(0,50).map(row=>({id:row.id,name:row.name,email:row.emails?.[0]?.address||''})),hasMore:rows.length>50};
 }
 if(path==='/api/fees'){
  const envelope=()=>({items:scope(d.fees,user).map(row=>feeView(row,d,user,today))});
  if(!body)return envelope();
  need(['save','submit','withdraw','link'].includes(body.action),'公开演示不办理真实审批、付款或交付核验；本次未执行。',error,403);
  const found=receipt(ctx,'fees');if(found)return {...clone(found),idempotent:true,...envelope()};
  const prior=clone(d),row=body.id?d.fees.find(value=>value.id===body.id):null;
  if(body.id){need(row&&available(row,user),'当前演示身份不能修改该申请。',error,403);need(row.version===body.version,'申请版本已变化，请重新读取。',error,409);}
  let target=row;
  if(body.action==='save'){
   const data=body.data||body,kol=ownKol(d,user,data.kolId||row?.kolId);
   need(kol,'请选择当前演示身份负责的 KOL。',error);need(!row||['draft','returned','withdrawn','approved'].includes(row.status),'请先撤回演示申请再修改。',error);
   need(!row||row.kolId===kol.id,'已有演示申请不能更换 KOL。',error);
   if(row?.status==='approved')need(body.changeReason?.trim(),'修改虚构获批样例前，请填写条款变更原因。',error);
   need(!data.amount||/^\d{1,10}(\.\d{1,2})?$/.test(String(data.amount))&&Number(data.amount)>0,'金额须大于 0，最多两位小数。',error);
   need(!data.currency||data.currency==='USD','演示金额统一使用 USD。',error);need(Array.isArray(data.deliveries)&&data.deliveries.length>0,'至少填写一条预期交付。',error);
   target=row||{id:id('demo-fee'),number:'DEMO-GF-'+String(d.fees.length+1).padStart(3,'0'),owner:user.id,kolId:kol.id,kolName:kol.name,version:0,status:'draft',approvedAmount:'',payments:[],events:[],createdAt:now};
   const deliveries=data.deliveries.map(value=>({...clone(value),id:value.id||id('demo-delivery'),publicationIds:clone(target.deliveries?.find(old=>old.id===value.id)?.publicationIds||[])}));
   need((target.deliveries||[]).every(value=>!value.publicationIds?.length||deliveries.some(item=>item.id===value.id)),'已关联发布的交付项不能删除。',error);
   if(row?.status==='approved'){target.status='submitted';target.approvedAmount='';target.changeReason=body.changeReason;}
   Object.assign(target,{title:String(data.title||''),reason:String(data.reason||''),amount:monetary(data.amount),currency:'USD',deliveries,updatedAt:now,version:target.version+1});
   if(!row)d.fees.unshift(target);
  }else{
   need(target,'申请不存在。',error,404);
   if(body.action==='submit'){need(['draft','returned','withdrawn'].includes(target.status),'当前申请不能提交。',error);need(target.title.trim()&&target.reason.trim()&&Number(target.amount)>0&&target.deliveries.every(value=>value.description?.trim()&&value.date&&value.platform),'请填写标题、理由、金额及完整交付平台、日期、内容。',error);target.status='submitted';}
   else if(body.action==='withdraw'){need(target.status==='submitted','只有待审批申请可撤回。',error);target.status='withdrawn';}
   else {
    const kol=ownKol(d,user,target.kolId),delivery=target.deliveries.find(value=>value.id===body.deliveryId),ids=body.publicationIds;
    need(kol&&delivery&&Array.isArray(ids),'请选择本次交付及发布记录。',error);
    need(ids.every(value=>(kol.promotions||[]).some(pub=>pub.id===value&&(!pub.feeId||pub.feeId===target.id&&pub.deliveryId===delivery.id))),'所选发布已关联其他申请或交付项。',error);
    for(const pub of kol.promotions||[]){if(ids.includes(pub.id)){pub.feeId=target.id;pub.deliveryId=delivery.id;}else if(pub.feeId===target.id&&pub.deliveryId===delivery.id){pub.feeId='';pub.deliveryId='';}}
    delivery.publicationIds=clone(ids);refreshTracks(ctx);
   }
   target.version++;target.updatedAt=now;
  }
  target.events.push({action:body.action,time:now,actor:actor(user),details:{demo:true}});appendLog(ctx,'fee_'+body.action,{id:target.id,demo:true});
  const result={id:target.id,createdVersion:row?undefined:1,idempotent:false,...envelope()};setReceipt(ctx,'fees',result);await persist(ctx,prior);return result;
 }
 if(path==='/api/cooperations'){
  const envelope=()=>({items:scope(d.cooperations,user).map(row=>cooperationView(row,d))});
  if(!body)return envelope();
  need(body.action==='save','公开演示仅维护本地合作关联，其他操作需要正式后台。',error);
  const found=receipt(ctx,'cooperations');if(found)return {...clone(found),items:envelope().items,idempotent:true};
  const prior=clone(d),data=body.data||{},row=body.id?d.cooperations.find(value=>value.id===body.id):null,kol=ownKol(d,user,data.kolId);
  need(kol,'请选择本人负责的演示达人。',error);need(data.title?.trim(),'请填写合作名称。',error);need(['unknown','none','fee'].includes(data.feeMode),'稿费安排无效。',error);
  if(body.id){need(row&&available(row,user),'当前演示身份不能修改此合作。',error,403);need(row.version===body.version,'合作资料已变化，请重新读取。',error,409);need(row.kolId===kol.id,'合作关联的达人不能更换。',error);}
  const contractIds=Array.isArray(data.contractIds)?data.contractIds:[],publicationIds=Array.isArray(data.publicationIds)?data.publicationIds:[];
  need(contractIds.every(cid=>(kol.contracts||[]).some(value=>value.id===cid))&&publicationIds.every(pid=>(kol.promotions||[]).some(value=>value.id===pid)),'关联记录不存在于当前达人。',error);
  need(!data.feeId||d.fees.some(fee=>fee.id===data.feeId&&fee.kolId===kol.id&&available(fee,user)),'稿费申请不属于当前达人。',error);
  const target=row||{id:id('demo-cooperation'),number:'DEMO-HZ-'+String(d.cooperations.length+1).padStart(3,'0'),owner:user.id,kolId:kol.id,kolName:kol.name,version:0,createdAt:now,createdBy:actor(user),events:[]};
  Object.assign(target,{title:data.title,feeMode:data.feeMode,contractIds:clone(contractIds),feeId:data.feeId||'',publicationIds:clone(publicationIds),version:target.version+1,updatedAt:now,updatedBy:actor(user)});target.events.push({action:'save',time:now,actor:actor(user)});if(!row)d.cooperations.unshift(target);
  appendLog(ctx,'cooperation_save',{id:target.id,demo:true});const result={item:cooperationView(target,d),...envelope()};setReceipt(ctx,'cooperations',result);await persist(ctx,prior);return result;
 }
 if(path==='/api/cooperation-options'){
  const kol=ownKol(d,user,params.get('kolId'));need(kol,'请先选择当前身份的演示达人。',error,404);
  const linked=(kind,value)=>d.cooperations.find(row=>row.kolId===kol.id&&(kind==='fee'?row.feeId===value:(row[kind]||[]).includes(value)))?.id||'';
  return {kolId:kol.id,kolName:kol.name,contracts:clone(kol.contracts||[]),fees:d.fees.filter(row=>row.kolId===kol.id&&available(row,user)).map(row=>({...feeView(row,d,user,today),linkedCooperationId:linked('fee',row.id)})),publications:(kol.promotions||[]).map(row=>({...clone(row),linkedCooperationId:linked('publicationIds',row.id)}))};
 }
 if(path==='/api/cooperation-detail'){
  const row=d.cooperations.find(value=>value.id===params.get('id'));need(row&&(user.role==='admin'||available(row,user)),'合作样例不存在于当前身份范围。',error,404);return detail(row,ctx);
 }
 if(path.startsWith('/api/cooperation-'))throw error('公开演示请通过 KOL 详情维护合约、稿费和案例，再在合作记录中关联；该快捷操作需正式后台。');
 if(path.startsWith('/api/promotion-tracking')){
  const all=params.get('scope')==='all';need(!all||user.role==='admin','全局演示需切换管理员身份。',error,403);
  const rows=(d.tracking||[]).filter(row=>all||Number(row.owner?.id)===Number(user.id)).filter(row=>!params.get('kolId')||row.kolId===Number(params.get('kolId'))).filter(row=>!params.get('publicationId')||row.publicationId===params.get('publicationId'));
  if(path==='/api/promotion-tracking/tasks'){
   const items=rows.flatMap(row=>trackingView(row,user,today,all).nodes.filter(node=>!node.latest&&node.dueDate<=today).map(node=>({...node,trackingKey:row.key,kolId:row.kolId,publicationId:row.publicationId,kolName:row.kolName,title:row.title,platform:row.platform,owner:clone(row.owner)})));
   return {...listQuery(items,params),businessDate:today,scope:all?'all':'mine'};
  }
  if(path==='/api/promotion-tracking/detail'){const row=rows.find(value=>value.key===params.get('key'));need(row,'回填样例不存在。',error,404);return {item:trackingView(row,user,today,all),businessDate:today};}
  if(path==='/api/promotion-tracking/save'){
   const found=receipt(ctx,'tracking');if(found)return {...clone(found),idempotent:true};
   const prior=clone(d),row=d.tracking.find(value=>value.key===body?.key);need(row&&Number(row.owner?.id)===Number(user.id),'只能回填当前商务演示身份的记录。',error,403);
   const node=row.nodes.find(value=>value.day===body.node);need(node&&node.dueDate<=today,'该回填节点尚未到期。',error);need(node.version===body.version,'回填记录已变化，请重新读取核对。',error,409);
   for(const metric of [body.registered,body.orders])need(metric&&typeof metric.known==='boolean'&&(metric.known?Number.isSafeInteger(metric.value)&&metric.value>=0:metric.value===null&&typeof metric.reason==='string'&&metric.reason.trim()),'请填写非负整数，或选择未知并说明原因。',error);
   need(typeof body.cutoffDate==='string'&&body.cutoffDate>=node.dueDate&&body.cutoffDate<=today,'统计截止日必须在节点日至今天之间。',error);need(!node.latest||body.correctionReason?.trim(),'更正已有数据时需说明原因。',error);
   const record={revision:(node.latest?.revision||0)+1,node:node.day,registered:clone(body.registered),orders:clone(body.orders),cutoffDate:body.cutoffDate,filledAt:now,filledBy:{id:user.id,name:user.display},correctionReason:body.correctionReason||'',dueDate:node.dueDate,requestId:body.requestId};
   node.latest=record;node.history.push(record);node.version++;node.status=record.registered.known&&record.orders.known?'completed':'unknown';appendLog(ctx,'promotion_tracking_save',{key:row.key,day:node.day,demo:true});const result={ok:true,idempotent:false,item:trackingView(row,user,today),record,warnings:[]};setReceipt(ctx,'tracking',result);await persist(ctx,prior);return result;
  }
  if(path==='/api/promotion-tracking')return {...listQuery(rows.map(row=>trackingView(row,user,today,all)),params),businessDate:today,scope:all?'all':'mine'};
 }
 if(['/api/gifts','/api/gift-approvals','/api/gift-fulfillments'].includes(path)){
  const envelope={items:clone((d.gifts||[]).filter(row=>available(row,user))),catalog:{status:'pending',version:0,products:[]},canSubmit:false,submissionBlockedReason:'公开演示的赠送目录待配置，仅可保存本浏览器的虚构草稿。',hasApprovalRole:false,hasIssuerRole:false,businessDate:today};
  if(!body){if(params.get('id')){const item=envelope.items.find(row=>row.id===params.get('id'));need(item,'赠送草稿不存在。',error,404);return {...envelope,item};}return envelope;}
  if(body.action!=='save-draft')denied(error);
  const found=receipt(ctx,'gifts');if(found)return {...clone(found),idempotent:true};
  const prior=clone(d),data=body.data||{},kol=ownKol(d,user,data.kolId),row=body.id?d.gifts.find(value=>value.id===body.id):null;need(kol,'请选择本人负责的演示达人。',error);need(!data.productId&&!data.packageId,'目录待配置，请将产品与套餐留空。',error);
  if(body.id){need(row&&available(row,user),'不能修改其他身份的草稿。',error,403);need(row.version===body.version,'赠送草稿已变化，请重新读取。',error,409);need(row.kolId===kol.id,'首次保存后不能更换达人。',error);}
  const target=row||{id:id('demo-gift'),owner:user.id,kolId:kol.id,kolName:kol.name,version:0,status:'draft',round:0,history:[],duplicateHistory:[],attempts:[],productName:'',packageName:'',duration:'',createdAt:now,submittedAt:'',approvedAt:'',completedAt:'',catalogChanged:false,actions:{saveDraft:true,submit:false,approve:false,return:false,reject:false,recordFulfillment:false},dateBounds:{min:'',max:today}};
  for(const key of ['cooperationId','recipient','reason','productId','packageId','repeatReason'])target[key]=String(data[key]||'');target.cooperationTitle=d.cooperations.find(value=>value.id===target.cooperationId)?.title||'';target.version++;target.updatedAt=now;if(!row)d.gifts.unshift(target);
  const result={item:clone(target),idempotent:false,transition:{action:'save-draft',appliedVersion:target.version,status:'draft',round:0}};setReceipt(ctx,'gifts',result);appendLog(ctx,'gift_draft_saved',{id:target.id,demo:true});await persist(ctx,prior);return result;
 }
 if(path==='/api/gift-history')return {items:[],requiresRepeatReason:false};
 if(path==='/api/gift-cooperations'){const kol=ownKol(d,user,params.get('kolId'));need(kol,'演示达人不存在。',error,404);return {items:d.cooperations.filter(row=>row.kolId===kol.id&&available(row,user)).map(row=>({id:row.id,title:row.title,number:row.number}))};}
 return P.UNHANDLED;
});
})(window);
